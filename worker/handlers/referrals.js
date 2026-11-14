/* Referral rewards: endpoints and the daily reward job. Rules are in lib/referral-core.js.
 *   GET  /referral/me      your code, link, current reward and counts (sign-in or wallet link)
 *   POST /referral/claim   {code, device} a signed-in friend with a verified email claims a code
 * Daily job: pays bonus coins to both people once the friend's first paid stay is finished.
 * Off unless REFERRALS_ENABLED = "true". New coins stop at PROMO_MONTHLY_CAP for the month.
 *
 * KV: refcode:<CODE> = {email}        refuser:<hash> = {code, devices[]}
 *     refclaim:<friend hash> = {code, referrer, friend, device, at, status, reason}
 *     refstats = {granted, months:{YYYY-MM: coins}}   refmonth:<hash>:<YYYY-MM> = count
 *     refphone:<10 digits>, refdev:<device> = '1' once rewarded
 * Hashes are of the canonical email; no raw device or IP data is kept beyond the device id the app already uses. */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { verifyTurnstile } from '../lib/turnstile.js';
import { sha256Hex, walletKey, emptyWallet, readWalletLinkToken } from '../lib/wallet-core.js';
import { istMonth, PROMO_CAP_DEFAULT } from '../lib/company-ledger.js';
import { canonEmail, checkClaim, decideClaim, addBonusCoins, rewardFor, nextStep, validCode, validDevice, MIN_ORDER, REFERRER_MONTHLY_MAX } from '../lib/referral-core.js';

const SITE = 'https://roamwise.co.in';
const FIREBASE_PROJECT = 'roamwisepro';
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const MAX_CLAIMS = 500, MAX_ORDERS = 1000;
const hashOf = async (email) => (await sha256Hex('rw-ref:' + canonEmail(email))).slice(0, 40);
const getJ = (env, k) => env.RW_KV.get(k, 'json');
const putJ = (env, k, v, opt) => env.RW_KV.put(k, JSON.stringify(v), opt);
const enabled = (env) => env.REFERRALS_ENABLED === 'true';
const cap = (env) => (Number(env.PROMO_MONTHLY_CAP) > 0 ? Number(env.PROMO_MONTHLY_CAP) : PROMO_CAP_DEFAULT);

async function codeFor(email) {
  const hex = await sha256Hex('rw-refcode:' + canonEmail(email));
  let out = 'RW';
  for (let i = 0; i < 8; i++) out += B32[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % 32];
  return out;
}

/* Who is asking: a Firebase sign-in (verified email) or a wallet link (the email already received a private link). */
async function identify(request, env, token, nowMs, deps) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (m) {
    try {
      const c = await (deps.verifyIdToken || verifyFirebaseIdToken)(m[1], FIREBASE_PROJECT);
      return c.email ? { email: c.email, verified: c.email_verified === true } : null;
    } catch (_) { return null; }
  }
  if (token && env.WALLET_LINK_SECRET) {
    const key = await readWalletLinkToken(env.WALLET_LINK_SECRET, token, nowMs);
    const w = key && await getJ(env, 'wallet:' + key);
    return w && w.email ? { email: w.email, verified: true } : null;
  }
  return null;
}

async function ensureUser(env, email, device) {
  const h = await hashOf(email), code = await codeFor(email);
  const u = (await getJ(env, 'refuser:' + h)) || { code, devices: [] };
  let changed = !u.saved;
  if (device && !u.devices.includes(device)) { u.devices = [...u.devices, device].slice(-5); changed = true; }
  if (changed) { u.saved = true; await putJ(env, 'refuser:' + h, u); await putJ(env, 'refcode:' + code, { email: String(email).trim().toLowerCase() }); }
  return { h, code, user: u };
}

export async function handleReferral(request, env, path, nowMs = Date.now(), deps = {}) {
  if (!env.RW_KV) return json({ error: 'referrals_unavailable' }, 503);
  let b = {};
  if (request.method === 'POST') { try { b = await request.json(); } catch (_) { b = {}; } }
  const t = b.t || new URL(request.url).searchParams.get('t') || '';
  const who = await identify(request, env, t, nowMs, deps);
  if (!who) return json({ error: 'not_signed_in', message: 'Sign in to use referrals.' }, 401);
  const device = validDevice(b.device) ? b.device : '';

  if (path === 'referral/me' && request.method === 'GET') {
    if (!who.verified) return json({ error: 'verify_email', message: 'Verify your email to get a referral link.' }, 403);
    const { h, code } = await ensureUser(env, who.email, '');
    const stats = (await getJ(env, 'refstats')) || { granted: 0 };
    const month = istMonth(nowMs);
    return json({ ok: true, enabled: enabled(env), code, link: SITE + '/?ref=' + code, coinsEach: rewardFor(stats.granted), next: nextStep(stats.granted),
      minOrder: MIN_ORDER, monthlyMax: REFERRER_MONTHLY_MAX, rewardedThisMonth: Number(await env.RW_KV.get('refmonth:' + h + ':' + month)) || 0 });
  }

  if (path === 'referral/claim' && request.method === 'POST') {
    const human = await (deps.verifyTurnstile || verifyTurnstile)(request, env);
    if (!human.ok) return json({ error: human.reason, message: 'Please complete the check and try again.' }, 403);
    const code = String(b.code || '').toUpperCase();
    if (!validCode(code)) return json({ error: 'unknown_code', message: 'That referral code is not valid.' }, 422);
    const ref = await getJ(env, 'refcode:' + code);
    const fh = await hashOf(who.email);
    const referrer = ref ? await getJ(env, 'refuser:' + await hashOf(ref.email)) : null;
    const verdict = checkClaim({ friendEmail: who.email, referrerEmail: ref && ref.email, emailVerified: who.verified,
      existingClaim: await getJ(env, 'refclaim:' + fh), device, referrerDevices: (referrer && referrer.devices) || [] });
    if (!verdict.ok) return json({ error: verdict.reason, message: 'This referral cannot be applied to your account.' }, verdict.reason === 'verify_email' ? 403 : 409);
    await putJ(env, 'refclaim:' + fh, { code, referrer: ref.email, friend: canonEmail(who.email), friendEmail: String(who.email).trim().toLowerCase(), device, at: new Date(nowMs).toISOString(), status: 'pending' });
    const stats = (await getJ(env, 'refstats')) || { granted: 0 };
    return json({ ok: true, coinsEach: rewardFor(stats.granted), minOrder: MIN_ORDER, message: 'Referral saved. You both get coins after your first stay is completed.' });
  }
  return json({ error: 'not_found' }, 404);
}

async function listAll(env, prefix, max) {
  const out = []; let cursor;
  do {
    const page = await env.RW_KV.list({ prefix, cursor });
    for (const k of page.keys) { if (out.length >= max) return out; out.push(k.name); }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

async function credit(env, email, refId, coins, note, nowMs) {
  const key = await walletKey(email);
  const w = (await getJ(env, 'wallet:' + key)) || emptyWallet(email);
  const r = addBonusCoins(w, { refId, coins, note }, nowMs);
  if (!r.duplicate) await putJ(env, 'wallet:' + key, r.wallet);
  return r;
}

/* Daily: pay finished referrals. Never touches cash lots, orders or payouts. */
export async function runReferralRewards(env, { nowMs = Date.now() } = {}) {
  const sum = { checked: 0, granted: 0, rejected: 0, waiting: 0, coins: 0 };
  if (!env.RW_KV || !enabled(env)) return { ...sum, skipped: true };
  const claimKeys = await listAll(env, 'refclaim:', MAX_CLAIMS);
  const pending = [];
  for (const k of claimKeys) { const c = await getJ(env, k); if (c && c.status === 'pending') pending.push([k, c]); }
  if (!pending.length) return sum;
  const byEmail = new Map();
  for (const k of await listAll(env, 'stayorder:', MAX_ORDERS)) {
    const o = await getJ(env, k); const e = o && canonEmail(o.email);
    if (e) byEmail.set(e, [...(byEmail.get(e) || []), o]);
  }
  const month = istMonth(nowMs);
  const stats = (await getJ(env, 'refstats')) || { granted: 0, months: {} };
  stats.months = stats.months || {};
  for (const [k, claim] of pending) {
    sum.checked++;
    const rh = await hashOf(claim.referrer), monthKey = 'refmonth:' + rh + ':' + month;
    const orders = byEmail.get(claim.friend) || [];
    const firstPhone = (orders.find((o) => o.phone) || {}).phone;
    const phone = String(firstPhone || '').replace(/\D/g, '').slice(-10);
    const rw = await getJ(env, 'wallet:' + await walletKey(claim.referrer));
    const d = decideClaim({ claim, orders, nowMs, granted: stats.granted,
      referrerPhones: (rw && rw.phones) || [],
      usedPhones: phone && await env.RW_KV.get('refphone:' + phone) ? [phone] : [],
      usedDevices: claim.device && await env.RW_KV.get('refdev:' + claim.device) ? [claim.device] : [],
      referrerMonthCount: Number(await env.RW_KV.get(monthKey)) || 0,
      promoLeft: cap(env) - (stats.months[month] || 0) });
    if (d.action === 'wait') { sum.waiting++; continue; }
    if (d.action === 'reject') { sum.rejected++; await putJ(env, k, { ...claim, status: 'rejected', reason: d.reason, decidedAt: new Date(nowMs).toISOString() }); continue; }
    const id = k.slice(9, 33);
    await credit(env, claim.friendEmail || claim.friend, 'ref:' + id + ':friend', d.coins, 'Welcome reward: referred by a friend', nowMs);
    await credit(env, claim.referrer, 'ref:' + id + ':referrer', d.coins, 'Referral reward: your friend completed a stay', nowMs);
    stats.granted++; stats.months[month] = (stats.months[month] || 0) + d.coins * 2;
    await putJ(env, 'refstats', stats);
    await env.RW_KV.put(monthKey, String((Number(await env.RW_KV.get(monthKey)) || 0) + 1), { expirationTtl: 70 * 24 * 3600 });
    if (d.phone) await env.RW_KV.put('refphone:' + d.phone, '1');
    if (claim.device) await env.RW_KV.put('refdev:' + claim.device, '1');
    await putJ(env, k, { ...claim, status: 'rewarded', coins: d.coins, orderId: d.orderId, decidedAt: new Date(nowMs).toISOString() });
    sum.granted++; sum.coins += d.coins * 2;
  }
  await putJ(env, 'refsum:last', { ...sum, at: new Date(nowMs).toISOString() });
  return sum;
}
