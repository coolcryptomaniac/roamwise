import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rewardFor, nextStep, canonEmail, isDisposable, checkClaim, decideClaim, addBonusCoins } from '../worker/lib/referral-core.js';
import { handleReferral, runReferralRewards } from '../worker/handlers/referrals.js';
import { walletKey } from '../worker/lib/wallet-core.js';

const NOW = Date.parse('2026-12-20T06:00:00Z');
const order = (o) => ({ id: 'rwstay_1', status: 'confirmed', amount: 5000, checkout: '2026-12-10', createdAt: '2026-12-01T00:00:00Z', phone: '9876543210', email: 'friend@gmail.com', ...o });
const claim = { at: '2026-11-20T00:00:00Z', device: 'device-friend-1', referrer: 'ref@gmail.com', friend: 'friend@gmail.com', status: 'pending' };

test('rewards start high and step down as referrals grow', () => {
  assert.deepEqual([0, 99, 100, 499, 500, 1999, 2000, 99999].map(rewardFor), [300, 300, 200, 200, 100, 100, 50, 50]);
  assert.deepEqual(nextStep(90), { left: 10, then: 200 });
  assert.equal(nextStep(5000), null);
});

test('one person cannot become two with dots, plus tags or throwaway mail', () => {
  assert.equal(canonEmail('Mo.Hit+promo@GoogleMail.com'), 'mohit@gmail.com');
  assert.equal(canonEmail('a.b+x@outlook.com'), 'a.b@outlook.com');
  assert.equal(canonEmail('nope'), '');
  assert.equal(isDisposable('x@mailinator.com'), true);
});

test('claims are refused for self-referral, unverified, repeat and same-device accounts', () => {
  const base = { friendEmail: 'friend@gmail.com', referrerEmail: 'ref@gmail.com', emailVerified: true, device: 'd-12345678', referrerDevices: ['d-other-000'] };
  assert.equal(checkClaim(base).ok, true);
  assert.equal(checkClaim({ ...base, friendEmail: 'r.e.f+2@gmail.com' }).reason, 'self_referral');
  assert.equal(checkClaim({ ...base, emailVerified: false }).reason, 'verify_email');
  assert.equal(checkClaim({ ...base, existingClaim: {} }).reason, 'already_claimed');
  assert.equal(checkClaim({ ...base, referrerDevices: ['d-12345678'] }).reason, 'same_device');
  assert.equal(checkClaim({ ...base, friendEmail: 'x@yopmail.com' }).reason, 'disposable_email');
});

test('coins are granted only after a first paid stay is finished, with every duplicate check', () => {
  const d = (x) => decideClaim({ claim, orders: [order()], nowMs: NOW, granted: 0, ...x });
  assert.deepEqual(d(), { action: 'grant', coins: 300, orderId: 'rwstay_1', phone: '9876543210' });
  assert.equal(d({ orders: [] }).reason, 'no_paid_stay');
  assert.equal(d({ orders: [order({ checkout: '2026-12-19' })] }).reason, 'stay_not_finished');
  assert.equal(d({ orders: [order({ status: 'refunded_to_wallet' })] }).reason, 'no_paid_stay');
  assert.equal(d({ orders: [order({ amount: 500 })] }).reason, 'below_minimum');
  assert.equal(d({ orders: [order({ createdAt: '2026-10-01T00:00:00Z' })] }).reason, 'existing_customer');
  assert.equal(d({ referrerPhones: ['+91 98765 43210'] }).reason, 'same_phone_as_referrer');
  assert.equal(d({ usedPhones: ['9876543210'] }).reason, 'phone_already_rewarded');
  assert.equal(d({ usedDevices: ['device-friend-1'] }).reason, 'device_already_rewarded');
  assert.equal(d({ referrerMonthCount: 10 }).reason, 'referrer_monthly_limit');
  assert.equal(d({ promoLeft: 500 }).reason, 'promo_budget_used');
  assert.equal(d({ orders: [], nowMs: NOW + 200 * 86400000 }).reason, 'expired');
});

test('bonus coins are spend-only lots and are added once', () => {
  const a = addBonusCoins({ lots: [] }, { refId: 'ref:abc:friend', coins: 300 }, NOW);
  assert.equal(a.wallet.lots[0].source, 'bonus');
  assert.equal(a.wallet.lots[0].state, 'kept');
  assert.equal(addBonusCoins(a.wallet, { refId: 'ref:abc:friend', coins: 300 }, NOW).duplicate, true);
});

function fakeEnv(extra = {}) {
  const m = new Map();
  return { m, REFERRALS_ENABLED: 'true', ...extra, RW_KV: {
    get: async (k, type) => (m.has(k) ? (type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null),
    put: async (k, v) => { m.set(k, String(v)); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
  } };
}
const as = (email, verified = true) => ({ verifyIdToken: async () => ({ email, email_verified: verified }), verifyTurnstile: async () => ({ ok: true }) });
const req = (path, method, body) => new Request('https://x/' + path, { method, headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

test('end to end: link, claim, finished stay, both wallets get coins exactly once', async () => {
  const env = fakeEnv(), T0 = Date.parse('2026-11-20T00:00:00Z');
  const me = await (await handleReferral(req('referral/me', 'GET'), env, 'referral/me', T0, as('Ref@gmail.com'))).json();
  assert.match(me.code, /^RW[A-Z2-7]{8}$/); assert.equal(me.coinsEach, 300);
  assert.equal((await handleReferral(req('referral/claim', 'POST', { code: me.code }), env, 'referral/claim', T0, as('r.ef+1@gmail.com'))).status, 409);
  assert.equal((await handleReferral(req('referral/claim', 'POST', { code: me.code }), env, 'referral/claim', T0, as('friend@gmail.com', false))).status, 403);
  assert.equal((await handleReferral(req('referral/claim', 'POST', { code: me.code, device: 'device-friend-1' }), env, 'referral/claim', T0, as('friend@gmail.com'))).status, 200);
  assert.equal((await handleReferral(req('referral/claim', 'POST', { code: me.code }), env, 'referral/claim', T0, as('friend@gmail.com'))).status, 409);
  assert.equal((await runReferralRewards(env, { nowMs: NOW })).waiting, 1);
  env.m.set('stayorder:rwstay_1', JSON.stringify(order()));
  const run = await runReferralRewards(env, { nowMs: NOW });
  assert.deepEqual([run.granted, run.coins], [1, 600]);
  for (const e of ['ref@gmail.com', 'friend@gmail.com']) {
    const w = JSON.parse(env.m.get('wallet:' + await walletKey(e)));
    assert.deepEqual(w.lots.map((l) => [l.source, l.amount]), [['bonus', 300]]);
  }
  assert.equal((await runReferralRewards(env, { nowMs: NOW })).checked, 0);
  assert.equal(JSON.parse(env.m.get('stayorder:rwstay_1')).status, 'confirmed');
});

test('nothing is paid while referrals are switched off, and anonymous calls are refused', async () => {
  const env = fakeEnv({ REFERRALS_ENABLED: 'false' });
  assert.equal((await runReferralRewards(env, { nowMs: NOW })).skipped, true);
  assert.equal((await handleReferral(new Request('https://x/referral/me'), env, 'referral/me', NOW)).status, 401);
});
