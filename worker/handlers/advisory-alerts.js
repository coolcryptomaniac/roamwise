/* ============================================================================
   worker/handlers/advisory-alerts.js — automatic advisory alerts + team digest
   ============================================================================
   · runAdvisoryAlerts(env, { dry, now, digest }) — cron: hourly (people), daily 11:00 IST (+ digest)
   · POST /admin/advisory-alerts/run              — founder-only; dry-run unless ?dry=0; ?digest=1 adds the digest

   Source of truth: data/conditions.json on the live site (built from conditions-data.js by
   tools/build-conditions-json.js). Readers: roomBookings, users (alertRegions, pushTokens, email),
   admins, stayLeads, all through the service account. Writes: only dead push-token pruning on
   users docs (same as trip reminders) and KV "already told" markers. No rule, auth or payment change.

   Switches (Firestore config/tripNotifySettings, all default OFF):
     advisoryAlerts — guests with live stay bookings + users who follow regions
     partnerAlerts  — the property owner of affected bookings
     teamDigest     — daily email to ALERT_TEAM_EMAILS (Worker secret, comma list) + push to admins
   Push first; email only when no push device took it, inside maxEmailsPerRun and the Gmail cap.
   Without KV the run refuses to send (it could not remember who was told). Wording and rules:
   worker/lib/advisory-alerts-core.js. Setup: ADVISORY-ALERTS.md. */
import { json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, deleteFields, queryEqualsString, queryArrayContains, listDocs } from '../lib/firestore-rest.js';
import { sendOne, isDeadToken, requireAdmin } from './push.js';
import { sendMail, mailerKind } from '../lib/mailer.js';
import { pushTokensOf } from '../lib/reminder-core.js';
import * as core from '../lib/advisory-alerts-core.js';

const FEED_URL = 'https://www.roamwise.co.in/data/conditions.json';
const MARK_TTL = 120 * 86400;

async function loadFeed(env) {
  const res = await fetch(env.CONDITIONS_URL || FEED_URL, { cf: { cacheTtl: 300 } });
  if (!res.ok) return null;
  return core.parseFeed(await res.json().catch(() => null));
}

export async function runAdvisoryAlerts(env, opts = {}) {
  const now = opts.now || Date.now();
  const today = core.istToday(now);
  const dry = opts.dry === true;
  const projectId = parseServiceAccount(env).project_id;
  const token = await getServiceAccountAccessToken(env);
  const settings = core.parseAdvisorySettings(await getDoc(env, token, projectId, 'config/tripNotifySettings').catch(() => null));
  const mail = mailerKind(env);
  const report = { dry, today, settings, mailer: mail, guests: 0, followers: 0, partners: 0, pushes: 0, emails: 0, deferred: 0, failed: 0, affectedBookings: 0, digest: null };
  if (!settings.advisoryAlerts && !settings.partnerAlerts && !settings.teamDigest) return { ...report, off: true };
  if (!env.RW_KV && !dry) return { ...report, skipped: 'no_kv' };
  const feed = await loadFeed(env);
  if (!feed) return { ...report, skipped: 'feed_unavailable' };
  const active = core.activeAdvisories(feed, today);
  report.active = active.length;

  let emailBudget = settings.maxEmailsPerRun;
  let capHit = false;
  const marked = async (key) => (env.RW_KV ? !!(await env.RW_KV.get(key)) : false);
  const mark = async (key) => { if (!dry && env.RW_KV) await env.RW_KV.put(key, today, { expirationTtl: MARK_TTL }); };
  const unsent = async (list, who) => {
    const out = [];
    for (const a of list) if (!(await marked(`adv:${a.id}:${who}`))) out.push(a);
    return out;
  };
  /* Push to every device of uid; email fallback. Returns true when someone received it. */
  const deliver = async (uid, email, msg) => {
    let delivered = false;
    const user = uid ? await getDoc(env, token, projectId, `users/${uid}`).catch(() => null) : null;
    const tokens = user ? pushTokensOf(user) : [];
    if (tokens.length) {
      if (dry) delivered = true;
      else {
        const dead = [];
        for (const t of tokens) {
          const r = await sendOne(token, projectId, t.token, { title: msg.push.title, body: msg.push.body }, null, msg.push.url);
          if (r.ok) delivered = true; else if (isDeadToken(r)) dead.push(`pushTokens.${t.deviceId}`);
        }
        if (dead.length) await deleteFields(env, token, projectId, `users/${uid}`, dead).catch(() => {});
      }
      if (delivered) report.pushes++;
    }
    const to = core.validEmail(email) ? email : (user && core.validEmail(user.email) ? user.email : '');
    if (!delivered && mail && to) {
      if (capHit || emailBudget <= 0) report.deferred++;
      else if (dry) { emailBudget--; delivered = true; report.emails++; }
      else {
        const r = await sendMail(env, { to: String(to).trim(), subject: msg.email.subject, html: msg.email.html, text: msg.email.text });
        if (r.ok) { emailBudget--; delivered = true; report.emails++; } else if (r.reason === 'cap') { capHit = true; report.deferred++; } else report.failed++;
      }
    }
    return delivered;
  };

  /* Guests and partners: live bookings in an affected area. */
  const affected = [];
  if ((settings.advisoryAlerts || settings.partnerAlerts || settings.teamDigest) && active.length) {
    const seen = new Set();
    for (const st of core.LIVE_STATUSES) {
      const rows = await queryEqualsString(env, token, projectId, 'roomBookings', 'status', st, 500).catch(() => []);
      for (const b of rows) {
        if (seen.has(b.id) || !core.bookingInWindow(b, today)) continue;
        seen.add(b.id);
        const list = core.advisoriesForBooking(feed, active, b);
        if (list.length) affected.push({ b, list });
      }
    }
  }
  report.affectedBookings = affected.length;

  if (settings.advisoryAlerts) {
    for (const { b, list } of affected) {
      const fresh = await unsent(list, `g:${b.id}`);
      if (!fresh.length) continue;
      if (await deliver(b.guestUid, b.guestEmail, core.buildGuestAlert(b, fresh))) {
        report.guests++;
        for (const a of fresh) await mark(`adv:${a.id}:g:${b.id}`);
      }
    }
    /* Followers: one message per user covering every region they follow. */
    const byUser = new Map();
    const regionIds = [...new Set(active.flatMap((a) => a.regions))];
    for (const r of regionIds) {
      const users = await queryArrayContains(env, token, projectId, 'users', 'alertRegions', r, 500).catch(() => []);
      for (const u of users) if (!byUser.has(u.id)) byUser.set(u.id, u);
    }
    for (const u of byUser.values()) {
      const fresh = await unsent(core.advisoriesForFollower(active, u.alertRegions), `f:${u.id}`);
      if (!fresh.length) continue;
      const names = feed.regions.filter((r) => (u.alertRegions || []).includes(r.id) && fresh.some((a) => a.regions.includes(r.id))).map((r) => r.name);
      if (await deliver(u.id, u.alertEmail === false ? '' : u.email, core.buildFollowerAlert(names, fresh))) {
        report.followers++;
        for (const a of fresh) await mark(`adv:${a.id}:f:${u.id}`);
      }
    }
  }

  if (settings.partnerAlerts) {
    const byPartner = new Map();
    for (const x of affected) {
      if (!x.b.partnerUid) continue;
      const k = x.b.partnerUid;
      if (!byPartner.has(k)) byPartner.set(k, { name: x.b.property || 'your property', guests: [], list: new Map() });
      const p = byPartner.get(k);
      p.guests.push(x.b);
      for (const a of x.list) p.list.set(a.id, a);
    }
    for (const [uid, p] of byPartner) {
      const fresh = await unsent([...p.list.values()], `p:${uid}`);
      if (!fresh.length) continue;
      if (await deliver(uid, '', core.buildPartnerAlert(p.name, p.guests, fresh))) {
        report.partners++;
        for (const a of fresh) await mark(`adv:${a.id}:p:${uid}`);
      }
    }
  }

  if (settings.teamDigest && opts.digest && !(await marked(`digest:${today}`))) {
    const leads = await queryEqualsString(env, token, projectId, 'stayLeads', 'status', 'new', 500).catch(() => null);
    const d = core.buildTeamDigest(feed, today, { ...report, newLeads: leads ? leads.length : null });
    const team = String(env.ALERT_TEAM_EMAILS || '').split(',').map((x) => x.trim()).filter(core.validEmail).slice(0, 10);
    let sent = 0;
    for (const to of team) {
      if (dry) { sent++; continue; }
      const r = await sendMail(env, { to, subject: d.email.subject, html: d.email.html, text: d.email.text });
      if (r.ok) sent++; else report.failed++;
    }
    const admins = await listDocs(env, token, projectId, 'admins', 20).catch(() => []);
    for (const a of admins) {
      const user = await getDoc(env, token, projectId, `users/${a.id}`).catch(() => null);
      for (const t of user ? pushTokensOf(user) : []) {
        if (dry) { sent++; continue; }
        const r = await sendOne(token, projectId, t.token, { title: d.push.title, body: d.push.body }, null, d.push.url);
        if (r.ok) sent++;
      }
    }
    report.digest = { recipients: sent, lines: d.lines };
    if (sent) await mark(`digest:${today}`);
  }
  return report;
}

export async function handleAdvisoryAlerts(request, env) {
  if (request.method !== 'POST') return json({ error: 'not found' }, 404);
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) return json({ error: 'not_configured' }, 503);
  const gate = await requireAdmin(request, env, parseServiceAccount(env).project_id);
  if (gate.error) return gate.error;
  const q = new URL(request.url).searchParams;
  try {
    return json(await runAdvisoryAlerts(env, { dry: q.get('dry') !== '0', digest: q.get('digest') === '1' }));
  } catch (e) {
    return json({ error: 'run_failed', message: String((e && e.message) || e).slice(0, 200) }, 500);
  }
}
