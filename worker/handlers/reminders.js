/* ============================================================================
   worker/handlers/reminders.js — inactivity reminders (push first, email second).
   ============================================================================
   · runInactivityReminders(env, opts)  — daily cron (worker.js) and manual runs
   · POST /admin/reminders/run          — founder-only (Firebase admin ID token);
                                          dry-run unless ?dry=0
   · GET|POST /email/unsubscribe        — signed one-click unsubscribe

   Both channels are OFF until the founder switches them on in Admin -> Reminders
   (Firestore config/reminderSettings). Push needs nothing extra (existing FCM
   service account + users/{uid}.pushTokens). Email also needs the Worker secrets
   RESEND_API_KEY and EMAIL_UNSUB_SECRET; without them email is skipped.
   Optional vars: REMINDER_FROM (default "RoamWise <hello@roamwise.co.in>"),
   PUBLIC_API_BASE, REMINDERS_ENABLED ("false" turns the cron off).
   Policy and wording: worker/lib/reminder-core.js. Message content is edited in
   Admin -> Reminders (Firestore config/reminderContent). */
import { json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getDoc, updateDoc, deleteFields, queryBeforeTimestamp } from '../lib/firestore-rest.js';
import { sendOne, isDeadToken } from './push.js';
import { DEFAULTS, parseSettings, selectRecipients, checkUser, pushTokensOf, buildPush, buildEmail, signUnsub, verifyUnsub } from '../lib/reminder-core.js';

const DEFAULT_API_BASE = 'https://roamwise-api.founder-f53.workers.dev';
const DEFAULT_FROM = 'RoamWise <hello@roamwise.co.in>';

function apiBase(env) { return String(env.PUBLIC_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, ''); }
function canSend(env) { return !!(env.RESEND_API_KEY && env.EMAIL_UNSUB_SECRET); }

async function sendViaResend(env, to, mail, unsubUrl) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.REMINDER_FROM || DEFAULT_FROM, to: [to], reply_to: 'support@roamwise.co.in',
      subject: mail.subject, html: mail.html, text: mail.text,
      headers: { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  });
  if (!res.ok) throw new Error(`resend_${res.status}`);
}

export async function runInactivityReminders(env, opts = {}) {
  const now = opts.now || Date.now();
  const sa = parseServiceAccount(env);
  const projectId = sa.project_id;
  const token = await getServiceAccountAccessToken(env);
  /* Founder switches live in Firestore (config/reminderSettings), edited from Admin -> Reminders. */
  const settings = parseSettings(await getDoc(env, token, projectId, 'config/reminderSettings').catch(() => null));
  const o = { ...DEFAULTS, ...settings };
  const emailReady = canSend(env);
  /* Cron and manual runs both honour the founder's switches. */
  if (!settings.emailEnabled && !settings.pushEnabled) return { dry: true, off: true, settings, emailReady, scanned: 0, willSend: 0, pushSent: 0, emailSent: 0, failed: 0 };
  const dry = opts.dry === true;
  const cutoff = new Date(now - o.inactiveDays * 86400000).toISOString();
  const users = await queryBeforeTimestamp(env, token, projectId, 'users', 'lastActive', cutoff, 400);
  /* An email-less run (no Resend key) must not count email-only users as sendable. */
  const sel = selectRecipients(users, now, { ...o, emailEnabled: o.emailEnabled && emailReady, pushEnabled: o.pushEnabled });
  const by = (c) => sel.picked.filter((p) => p.channel === c).length;
  const report = { dry, settings, emailReady, scanned: users.length, eligible: sel.eligible, willSend: sel.picked.length, willPush: by('push'), willEmail: by('email'), skipped: sel.skipped, pushSent: 0, emailSent: 0, failed: 0 };
  if (dry) return report;

  const content = await getDoc(env, token, projectId, 'config/reminderContent').catch(() => null);
  for (const { user, count, channel } of sel.picked) {
    try {
      let ok = false;
      if (channel === 'push') {
        const m = buildPush(user, content);
        const dead = [];
        for (const t of pushTokensOf(user)) {
          const r = await sendOne(token, projectId, t.token, { title: m.title, body: m.body }, null, m.url);
          if (r.ok) ok = true; else if (isDeadToken(r)) dead.push(`pushTokens.${t.deviceId}`);
        }
        if (dead.length) await deleteFields(env, token, projectId, `users/${user.id}`, dead).catch(() => {});
        /* Every device was dead: try email in the same run if it is available. */
        if (!ok && o.emailEnabled && emailReady && checkUser({ ...user, pushTokens: {} }, now, { ...o, pushEnabled: false }).ok) {
          const unsubUrl = `${apiBase(env)}/email/unsubscribe?u=${encodeURIComponent(user.id)}&t=${await signUnsub(env.EMAIL_UNSUB_SECRET, user.id)}`;
          await sendViaResend(env, String(user.email).trim(), buildEmail(user, content, unsubUrl), unsubUrl);
          report.emailSent++; ok = 'email';
        } else if (ok) report.pushSent++;
      } else {
        const unsubUrl = `${apiBase(env)}/email/unsubscribe?u=${encodeURIComponent(user.id)}&t=${await signUnsub(env.EMAIL_UNSUB_SECRET, user.id)}`;
        await sendViaResend(env, String(user.email).trim(), buildEmail(user, content, unsubUrl), unsubUrl);
        report.emailSent++; ok = true;
      }
      if (ok) await updateDoc(env, token, projectId, `users/${user.id}`, { reminderLastSentAt: new Date(now).toISOString(), reminderCount: count + 1, reminderChannel: ok === 'email' ? 'email' : channel });
      else report.failed++;
    } catch (_) { report.failed++; }
  }
  return report;
}

async function requireFounder(request, env) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return json({ error: 'unauthorized' }, 401);
  const projectId = parseServiceAccount(env).project_id;
  let claims;
  try { claims = await verifyFirebaseIdToken(m[1], projectId); } catch (_) { return json({ error: 'unauthorized' }, 401); }
  const token = await getServiceAccountAccessToken(env);
  const adminDoc = await getDoc(env, token, projectId, `admins/${claims.uid}`);
  return adminDoc ? null : json({ error: 'forbidden' }, 403);
}

const PAGE = (msg) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RoamWise emails</title><body style="font-family:Arial,sans-serif;background:#0d0a0a;color:#f3e9e0;display:grid;place-items:center;min-height:100vh;margin:0"><div style="max-width:420px;padding:24px;text-align:center"><h2>${msg}</h2><p><a style="color:#dfb86f" href="https://roamwise.co.in/">Back to RoamWise</a></p></div>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });

export async function handleReminders(request, env, path) {
  if (path === 'email/unsubscribe') {
    const url = new URL(request.url);
    const uid = url.searchParams.get('u') || '', t = url.searchParams.get('t') || '';
    if (!(await verifyUnsub(env.EMAIL_UNSUB_SECRET, uid, t))) return PAGE('This unsubscribe link is not valid.');
    try {
      const token = await getServiceAccountAccessToken(env);
      await updateDoc(env, token, parseServiceAccount(env).project_id, `users/${uid}`, { emailOptOut: true, emailOptOutAt: new Date().toISOString() });
    } catch (_) { return PAGE('Could not update right now. Email support@roamwise.co.in and we will do it for you.'); }
    if (request.method === 'POST') return json({ ok: true });
    return PAGE('You are unsubscribed. We will not send reminder emails again.');
  }
  if (path === 'admin/reminders/run' && request.method === 'POST') {
    const denied = await requireFounder(request, env);
    if (denied) return denied;
    const dry = new URL(request.url).searchParams.get('dry') !== '0';
    try { return json(await runInactivityReminders(env, { dry })); } catch (e) { return json({ error: 'run_failed', message: String(e && e.message || e).slice(0, 200) }, 500); }
  }
  return json({ error: 'not found' }, 404);
}
