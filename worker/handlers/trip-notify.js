/* ============================================================================
   worker/handlers/trip-notify.js — booking acknowledgement emails + trip reminders
   ============================================================================
   · runTripNotifications(env, { dry, mode })  — cron (hourly: acks; daily: acks + reminders)
   · POST /admin/trip-notify/run               — founder-only; dry-run unless ?dry=0

   Reads roomBookings through the service account (no client rule or entitlement
   code is touched). Both switches live in Firestore config/tripNotifySettings and
   default OFF: { ackEmail:true, reminders:true, maxEmailsPerRun:40 }.
   Email goes through worker/lib/mailer.js (Gmail relay, Resend fallback). When the
   mail provider says the daily limit is reached we stop and retry next run.
   Rules and wording: worker/lib/trip-notify-core.js. */
import { json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getDoc, updateDoc, deleteFields, queryEqualsString } from '../lib/firestore-rest.js';
import { sendOne, isDeadToken } from './push.js';
import { sendMail, mailerKind } from '../lib/mailer.js';
import { pushTokensOf } from '../lib/reminder-core.js';
import { parseTripSettings, needsAck, reminderDue, buildAckEmail, buildReminder, validEmail } from '../lib/trip-notify-core.js';

export async function runTripNotifications(env, opts = {}) {
  const now = opts.now || Date.now();
  const mode = opts.mode === 'ack' ? 'ack' : 'all';
  const projectId = parseServiceAccount(env).project_id;
  const token = await getServiceAccountAccessToken(env);
  const settings = parseTripSettings(await getDoc(env, token, projectId, 'config/tripNotifySettings').catch(() => null));
  const mail = mailerKind(env);
  const report = { dry: opts.dry === true, mode, settings, mailer: mail, acks: 0, pushes: 0, reminderEmails: 0, failed: 0, deferred: 0 };
  if (!settings.ackEmail && !settings.reminders) return { ...report, off: true };
  const dry = report.dry;
  let emailBudget = settings.maxEmailsPerRun;
  let capHit = false;
  const tryMail = async (to, m) => {
    if (capHit || emailBudget <= 0) { report.deferred++; return false; }
    if (dry) { emailBudget--; return true; }
    const r = await sendMail(env, { to: String(to).trim(), subject: m.subject, html: m.html, text: m.text });
    if (r.ok) { emailBudget--; return true; }
    if (r.reason === 'cap') { capHit = true; report.deferred++; } else report.failed++;
    return false;
  };

  if (settings.ackEmail && mail) {
    const rows = await queryEqualsString(env, token, projectId, 'roomBookings', 'status', 'requested', 200);
    for (const b of rows) {
      if (!needsAck(b, now)) continue;
      if (await tryMail(b.guestEmail, buildAckEmail(b))) {
        report.acks++;
        if (!dry) await updateDoc(env, token, projectId, `roomBookings/${b.id}`, { ackEmailAt: new Date(now).toISOString() }).catch(() => { report.failed++; });
      }
    }
  }

  if (settings.reminders && mode === 'all') {
    const rows = await queryEqualsString(env, token, projectId, 'roomBookings', 'status', 'confirmed', 500);
    for (const b of rows) {
      const kind = reminderDue(b, now);
      if (!kind) continue;
      const msg = buildReminder(b, kind);
      let delivered = false;
      const user = await getDoc(env, token, projectId, `users/${b.guestUid}`).catch(() => null);
      const tokens = user ? pushTokensOf(user) : [];
      if (tokens.length && !dry) {
        const dead = [];
        for (const t of tokens) {
          const r = await sendOne(token, projectId, t.token, { title: msg.push.title, body: msg.push.body }, null, msg.push.url);
          if (r.ok) delivered = true; else if (isDeadToken(r)) dead.push(`pushTokens.${t.deviceId}`);
        }
        if (dead.length) await deleteFields(env, token, projectId, `users/${b.guestUid}`, dead).catch(() => {});
        if (delivered) report.pushes++;
      } else if (tokens.length) { delivered = true; report.pushes++; }
      if (!delivered && mail && validEmail(b.guestEmail) && await tryMail(b.guestEmail, msg.email)) { delivered = true; report.reminderEmails++; }
      if (delivered && !dry) await updateDoc(env, token, projectId, `roomBookings/${b.id}`, { [kind === 'r1' ? 'remind1At' : 'remind3At']: new Date(now).toISOString() }).catch(() => { report.failed++; });
    }
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
  return (await getDoc(env, token, projectId, `admins/${claims.uid}`)) ? null : json({ error: 'forbidden' }, 403);
}

export async function handleTripNotify(request, env) {
  if (request.method !== 'POST') return json({ error: 'not found' }, 404);
  const denied = await requireFounder(request, env);
  if (denied) return denied;
  const dry = new URL(request.url).searchParams.get('dry') !== '0';
  try { return json(await runTripNotifications(env, { dry })); } catch (e) { return json({ error: 'run_failed', message: String(e && e.message || e).slice(0, 200) }, 500); }
}
