/* ============================================================================
   worker/handlers/reminders.js — inactivity email reminders.
   ============================================================================
   · runInactivityReminders(env, opts)  — called from the daily cron (worker.js)
   · POST /admin/reminders/run          — founder-only manual run / dry-run
                                          (Firebase admin ID token, ?dry=1)
   · GET|POST /email/unsubscribe        — signed one-click unsubscribe

   Safe by default: it sends NOTHING unless RESEND_API_KEY and EMAIL_UNSUB_SECRET
   are both set; without them a run only reports who WOULD be emailed.
   Secrets (wrangler secret put): RESEND_API_KEY, EMAIL_UNSUB_SECRET.
   Optional vars: REMINDER_FROM (default "RoamWise <hello@roamwise.co.in>"),
   PUBLIC_API_BASE, REMINDERS_ENABLED ("false" turns the cron off).
   Policy and wording live in worker/lib/reminder-core.js. Offers/updates are
   edited by the founder in Firestore doc config/reminderContent. */
import { json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getDoc, updateDoc, queryBeforeTimestamp } from '../lib/firestore-rest.js';
import { DEFAULTS, selectRecipients, buildEmail, signUnsub, verifyUnsub } from '../lib/reminder-core.js';

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
  const o = { ...DEFAULTS };
  const dry = opts.dry === true || !canSend(env);
  const sa = parseServiceAccount(env);
  const projectId = sa.project_id;
  const token = await getServiceAccountAccessToken(env);
  const cutoff = new Date(now - o.inactiveDays * 86400000).toISOString();
  const users = await queryBeforeTimestamp(env, token, projectId, 'users', 'lastActive', cutoff, 400);
  const { picked, skipped, eligible } = selectRecipients(users, now, o);
  const report = { dry, scanned: users.length, eligible, willSend: picked.length, skipped, sent: 0, failed: 0, reasonDry: dry && !canSend(env) ? 'email_not_configured' : undefined };
  if (dry) return report;

  const contentDoc = await getDoc(env, token, projectId, 'config/reminderContent').catch(() => null);
  const content = contentDoc;
  for (const { user, count } of picked) {
    try {
      const unsubUrl = `${apiBase(env)}/email/unsubscribe?u=${encodeURIComponent(user.id)}&t=${await signUnsub(env.EMAIL_UNSUB_SECRET, user.id)}`;
      await sendViaResend(env, String(user.email).trim(), buildEmail(user, content, unsubUrl), unsubUrl);
      await updateDoc(env, token, projectId, `users/${user.id}`, { reminderLastSentAt: new Date(now).toISOString(), reminderCount: count + 1 });
      report.sent++;
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
