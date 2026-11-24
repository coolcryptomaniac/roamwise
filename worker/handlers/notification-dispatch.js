/* Admin-reviewed notification outbox. No browser-side FCM tokens or fan-out.
   Existing queued items are NEVER sent: only explicit approval moves them to
   status=approved. Account alerts use real server-owned Pro expiry data. */
import { json } from '../lib/http.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, updateDoc, listDocs, queryEqualsString, deleteFields } from '../lib/firestore-rest.js';
import { requireAdmin, sendOne, isDeadToken } from './push.js';
import { pushTokensOf } from '../lib/reminder-core.js';
import { preferenceAllows, throttleSeconds } from '../lib/notification-policy.js';
import { campaignValidation, marketingWindow, proExpiryEvent } from '../lib/notification-campaign-core.js';

const MAX_SENDS = 35;
const MAX_CAMPAIGNS = 5;
const MAX_USERS = 1000;
const DAY = 86400000;
const SITE = 'https://www.roamwise.co.in';

function depsOf(env, extras = {}) {
  return {
    context: async () => {
      const projectId = parseServiceAccount(env).project_id;
      return { projectId, token: await getServiceAccountAccessToken(env) };
    },
    getDoc: (auth, path) => getDoc(env, auth.token, auth.projectId, path),
    listUsers: (auth) => listDocs(env, auth.token, auth.projectId, 'users', MAX_USERS),
    approved: (auth) => queryEqualsString(env, auth.token, auth.projectId, 'notificationQueue', 'status', 'approved', MAX_CAMPAIGNS),
    update: (auth, path, values) => updateDoc(env, auth.token, auth.projectId, path, values),
    prune: (auth, uid, paths) => deleteFields(env, auth.token, auth.projectId, 'users/' + uid, paths),
    send: (auth, token, msg, data) => sendOne(auth.token, auth.projectId, token,
      { title: msg.title, body: msg.body }, data, msg.url),
    kv: env.RW_KV,
    ...extras
  };
}
function safeKey(v) { return String(v || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 130); }
function markerFor(campaignId, uid) { return 'rw:notify:v2:' + safeKey(campaignId) + ':' + safeKey(uid); }

/* Return {sent, skipped, failed}. If a device receives the message, the
   recipient's campaign marker is persisted. No push on opt-out. */
async function sendRecipient(d, auth, uid, user, campaignId, msg, dry, nowMs) {
  if (!uid || !user || !preferenceAllows(msg.category, user.notificationPrefs))
    return { sent: 0, skipped: 'no_consent', failed: 0 };
  const tokens = pushTokensOf(user);
  if (!tokens.length) return { sent: 0, skipped: 'no_registered_device', failed: 0 };
  const marker = markerFor(campaignId, uid);
  if (await d.kv.get(marker)) return { sent: 0, skipped: 'already_delivered', failed: 0 };
  const cooldown = throttleSeconds(msg.category);
  const cooldownKey = 'push:category:v1:' + msg.category + ':' + uid;
  if (cooldown && await d.kv.get(cooldownKey))
    return { sent: 0, skipped: 'frequency_cap', failed: 0 };
  if (dry) return { sent: 1, skipped: null, failed: 0 };
  let delivered = false;
  let failed = 0;
  const dead = [];
  for (const t of tokens.slice(0, 4)) {
    let result;
    try {
      result = await d.send(auth, t.token, msg, {
        rw_category: msg.category,
        rw_url: msg.url,
        rw_campaign: safeKey(campaignId)
      });
    } catch (_) { result = { ok:false, status:503, body:{} }; }
    if (result.ok) delivered = true;
    else {
      failed++;
      if (isDeadToken(result)) dead.push('pushTokens.' + t.deviceId);
    }
  }
  if (dead.length) await d.prune(auth, uid, dead).catch(() => {});
  if (delivered) {
    await d.kv.put(marker, 'sent', { expirationTtl: 30 * 86400 });
    if (cooldown) await d.kv.put(cooldownKey, String(nowMs), { expirationTtl: cooldown });
    return { sent: 1, skipped: null, failed };
  }
  return { sent: 0, skipped: null, failed };
}

/* Dry-run is the default for manual admin calls. Real cron or manually
   triggered live calls must be explicitly enabled and approved. */
export async function runNotificationDispatch(env, opts = {}, extras = {}) {
  const dry = opts.dry !== false;
  const nowMs = opts.nowMs || Date.now();
  const report = { dry, campaigns: 0, eligible: 0, sent: 0, suppressed: 0,
    failed: 0, reviewedOut: 0, completed: 0, account: 0, quietHours: false };
  const d = depsOf(env, extras);
  if (!d.kv || !env.FIREBASE_SERVICE_ACCOUNT_JSON)
    return { ...report, skipped: 'not_configured' };
  const auth = await d.context();
  const marketingAllowed = marketingWindow(nowMs);
  const approved = (await d.approved(auth)).slice(0, MAX_CAMPAIGNS);
  const users = await d.listUsers(auth);
  const userMap = new Map(users.map(u => [u.id, u]));
  const verified = await d.getDoc(auth, 'config/notificationOffers').catch(() => null);
  const offers = (verified && Array.isArray(verified.list)) ? verified.list : [];
  let budget = Math.min(MAX_SENDS, Math.max(1, Number(opts.maxSends) || MAX_SENDS));

  for (const listed of approved) {
    const id = safeKey(listed.id);
    if (!id) continue;
    // Read a fresh copy: an admin may have revoked approval since the query.
    const c = await d.getDoc(auth, 'notificationQueue/' + id);
    const invalid = campaignValidation(c, nowMs, offers);
    if (invalid) { report.reviewedOut++; continue; }
    if (['travel','offers'].includes(c.category) && !marketingAllowed) {
      report.quietHours = true;
      continue;
    }
    report.campaigns++;
    // Do not falsely mark an all-users campaign complete if a bounded scan
    // could have omitted users. Expand via pagination before scaling past 1000.
    if (c.target.type === 'all' && users.length >= MAX_USERS) {
      report.reviewedOut++;
      continue;
    }
    const audience = c.target.type === 'uid'
      ? [{ id: c.target.uid, ...(userMap.get(c.target.uid) ||
        await d.getDoc(auth, 'users/' + c.target.uid) || {}) }]
      : users;
    const campaign = {
      title: c.title, body: c.body, category: c.category, url: c.url
    };
    let pending = false, delivered = 0, suppressed = 0;
    for (const u of audience) {
      if (budget <= 0) { pending = true; break; }
      const result = await sendRecipient(d, auth, u.id, u, id, campaign, dry, nowMs);
      if (result.skipped && result.skipped !== 'already_delivered') { suppressed++; report.suppressed++; }
      if (!result.skipped && (result.sent || result.failed)) {
        budget--;
        if (dry) report.eligible++;
      }
      if (result.failed) { report.failed += result.failed; if (!result.sent) pending = true; }
      if (result.sent) { report.sent++; delivered++; }
    }
    if (!dry) {
      const update = {
        deliveredCount: Number(c.deliveredCount || 0) + delivered,
        suppressedCount: Number(c.suppressedCount || 0) + suppressed
      };
      if (!pending) {
        update.status = 'completed';
        update.completedAt = new Date(nowMs).toISOString();
        report.completed++;
      }
      await d.update(auth, 'notificationQueue/' + id, update);
    }
  }

  // Account reminders are generated from authenticated Firestore entitlements,
  // not from promotional copy or a guessed purchase/expiry date.
  if (opts.account !== false) {
    for (const user of users) {
      if (budget <= 0) break;
      const event = proExpiryEvent(user, nowMs);
      if (!event) continue;
      const r = await sendRecipient(d, auth, user.id, user,
        'account-' + event.marker, event, dry, nowMs);
      if (r.skipped && r.skipped !== 'already_delivered') report.suppressed++;
      if (r.failed) report.failed += r.failed;
      if (r.sent) { report.sent++; report.account++; if (dry) report.eligible++; }
      if (!r.skipped && (r.sent || r.failed)) budget--;
    }
  }
  return report;
}
/* A payment-confirmation hook calls this only AFTER the verified receipt and
   entitlement are persisted. Failure to notify never reverses payment. */
export async function notifyVerifiedProActivation(env, uid, orderId, extras = {}) {
  if (!env.RW_KV || !env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(String(uid || '')) ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(String(orderId || '')))
    return { skipped:'not_configured' };
  const d = depsOf(env, extras);
  const auth = await d.context();
  const user = await d.getDoc(auth, 'users/' + uid);
  // Re-read the SERVER entitlement: no notification on a pending payment.
  if (!user || user.pro !== true || String(user.proPayId || '') !== String(orderId))
    return { skipped:'not_verified' };
  return sendRecipient(d, auth, uid, user, 'paid-pro-' + orderId, {
    title:'Your RoamWise Pro is active',
    body:'Your verified payment is complete and your Pro access is ready. View membership details.',
    url:SITE + '/my-payments/',category:'account'
  }, false, Date.now());
}
export async function handleNotificationDispatch(request, env) {
  if (request.method !== 'POST') return json({ error: 'not_found' }, 404);
  let projectId;
  try { projectId = parseServiceAccount(env).project_id; }
  catch (_) { return json({ error: 'not_configured' }, 503); }
  const auth = await requireAdmin(request, env, projectId);
  if (auth.error) return auth.error;
  const q = new URL(request.url).searchParams;
  const dry = q.get('dry') !== '0';
  try {
    return json(await runNotificationDispatch(env, { dry, account: q.get('account') !== '0' }));
  } catch (_) {
    return json({ error: 'dispatch_unavailable', message: 'No notifications were confirmed as sent. Retry or inspect Worker logs.' }, 503);
  }
}
