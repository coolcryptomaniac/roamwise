import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../worker/lib/wallet-core.js';
import { priceCreditPack, publicPacks, MAX_BONUS_PCT, CREDIT_PACKS } from '../worker/lib/credit-packs.js';
import { onCreditPaid, runCreditExpiry, createCreditOrder, creditOrderStatus } from '../worker/handlers/credit-packs.js';
import { runWalletReleases, loadWallet } from '../worker/handlers/wallet.js';
import { refundStayToWallet } from '../worker/handlers/stay-lifecycle.js';

const T0 = Date.parse('2026-11-14T06:00:00Z');
const DAY = 24 * 3600 * 1000;
function kvStore() {
  const m = new Map();
  return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    put: async (k, v) => { m.set(k, String(v)); }, delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) };
}
const mkEnv = () => ({ RW_KV: kvStore(), WALLET_LINK_SECRET: 'test-secret', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 's', CASHFREE_ENV: 'live' });
const mails = []; const deps = { sendMail: async (env, m) => { mails.push(m); return { ok: true }; } };

test('bonus never exceeds 10%, so pack credit never buys below cost on our thinnest product', () => {
  for (const id of Object.keys(CREDIT_PACKS)) for (const members of [0, 500]) for (const rejoin of [false, true]) {
    const q = priceCreditPack(id, { members, sold: {} }, { rejoin });
    assert.ok(q.bonusPct <= MAX_BONUS_PCT, id);
    assert.ok(q.bonus / q.credit < 0.0915, 'bonus share of what credit buys stays under ~9.1%');
  }
  assert.equal(priceCreditPack('voyager', { members: 0 }).bonusPct, 8, 'founding +2%');
  assert.equal(priceCreditPack('voyager', { members: 100 }).bonusPct, 6);
  assert.throws(() => priceCreditPack('patron', { members: 0, sold: { patron: 100 } }), /sold out/);
  assert.throws(() => priceCreditPack('nope'), /Choose a pack/);
  const pub = publicPacks({ members: 3, sold: { trailblazer: 200 } });
  assert.equal(pub.foundingLeft, 97); assert.equal(pub.packs.find((p) => p.id === 'trailblazer').soldOut, true);
});

test('own money is spent before bonus; asking for money back gives up the matching bonus; bonus is never paid out', () => {
  let w = W.emptyWallet('m@x.in');
  w = W.creditPrepaid(w, { refId: 'rwcred_a', orderId: 'rwcred_a', paid: 10000, bonus: 800 }, T0).wallet;
  assert.equal(W.balance(w), 10800);
  const s = W.spend(w, 6000, 'rwstay_1', T0 + DAY);
  assert.deepEqual(s.used.map((u) => [u.source, u.amount]), [['prepaid', 6000]]);
  w = s.wallet;
  const paid = w.lots.find((l) => l.source === 'prepaid'), bonus = w.lots.find((l) => l.source === 'bonus');
  assert.equal(W.bankSoon(w, bonus.lotId, T0), w, 'bonus cannot go to the bank');
  w = W.bankSoon(w, paid.lotId, T0 + 2 * DAY);
  assert.equal(w.lots.find((l) => l.lotId === paid.lotId).state, 'credit');
  assert.equal(w.lots.find((l) => l.lotId === bonus.lotId).remaining, 800 - 320, 'gives up 4000/10000 of the bonus');
});

test('a booking paid with pack credit that is refunded returns as pack credit with the same expiry, not cash', async () => {
  const env = mkEnv();
  const key = await W.walletKey('m@x.in');
  let w = W.creditPrepaid(W.emptyWallet('m@x.in'), { refId: 'rwcred_b', orderId: 'rwcred_b', paid: 5000, bonus: 300 }, T0).wallet;
  const s = W.spend(w, 5300, 'rwstay_2', T0);
  await env.RW_KV.put('wallet:' + key, JSON.stringify(s.wallet));
  const record = { id: 'rwstay_2', email: 'm@x.in', phone: '9876543210', amount: 5300, property: 'Padma Villa', checkin: '2026-12-01', paidFromLots: s.used, status: 'awaiting_host' };
  await refundStayToWallet(env, record, 'test', T0 + DAY, deps);
  const after = await loadWallet(env, key);
  const back = after.lots.filter((l) => l.refId === 'rwstay_2');
  assert.deepEqual(back.map((l) => [l.source, l.state, l.amount]).sort(), [['bonus', 'kept', 300], ['prepaid', 'kept', 5000]]);
  assert.ok(back.every((l) => l.expiresAt === s.used[0].expiresAt));
  assert.equal(W.dueLots(after, T0 + 3 * DAY).length, 0, 'nothing is sent to the bank by itself');
});

test('paid pack: wallet credit, member number, wall, counts and emails; idempotent', async () => {
  const env = mkEnv(); mails.length = 0;
  const q = priceCreditPack('trailblazer', { members: 0, sold: {} });
  const record = { id: 'rwcred_' + 'a'.repeat(32), kind: 'credit_pack', ...q, amount: q.pay, email: 'buyer@x.in', phone: '9876543210', giftTo: 'friend@x.in',
    holder: 'friend@x.in', wallName: 'Asha, Pune', status: 'payment_pending' };
  await onCreditPaid(env, record, T0, deps);
  const w = await loadWallet(env, await W.walletKey('friend@x.in'));
  assert.equal(W.balance(w), q.credit);
  assert.equal(record.memberNo, 1);
  assert.deepEqual(JSON.parse(env.RW_KV.m.get('credit:counts')), { members: 1, sold: { trailblazer: 1 } });
  assert.deepEqual(JSON.parse(env.RW_KV.m.get('credit:wall')), [{ n: 1, name: 'Asha, Pune', pack: 'Trailblazer' }]);
  assert.deepEqual(mails.map((m) => m.to), ['friend@x.in', 'buyer@x.in', 'founder@roamwise.co.in']);
  assert.match(mails[0].text, /not an investment/);
  await onCreditPaid(env, record, T0, deps);
  assert.equal(mails.length, 3, 'second call does nothing');
});

test('expiry: reminders at 30 and 7 days, then a REAL bank refund of unused paid credit and the bonus lapses', async () => {
  const env = mkEnv(); mails.length = 0;
  const key = await W.walletKey('m@x.in');
  const w = W.creditPrepaid(W.emptyWallet('m@x.in'), { refId: 'rwcred_c', orderId: 'rwcred_c', paid: 5000, bonus: 300 }, T0).wallet;
  await env.RW_KV.put('wallet:' + key, JSON.stringify(w)); await env.RW_KV.put('creditexp:' + key, '1');
  await runCreditExpiry(env, T0 + 331 * DAY, deps);
  await runCreditExpiry(env, T0 + 332 * DAY, deps);
  assert.equal(mails.filter((m) => /ends on/.test(m.subject)).length, 1, '30-day reminder once');
  await runCreditExpiry(env, T0 + 354 * DAY, deps);
  assert.equal(mails.filter((m) => /ends on/.test(m.subject)).length, 2, '7-day reminder');
  await runCreditExpiry(env, T0 + 360 * DAY + 1000, deps);
  let after = await loadWallet(env, key);
  assert.equal(after.lots.find((l) => l.source === 'bonus').state, 'lapsed');
  const refunds = [];
  await runWalletReleases(env, T0 + 360 * DAY + 2000, { ...deps, cfRefund: async (env, r) => { refunds.push(r); return { ok: true, refundId: 'x', status: 'SUCCESS' }; } });
  assert.deepEqual(refunds.map((r) => [r.orderId, r.amount]), [['rwcred_c', 5000]], 'refunded to the original Cashfree order, inside 365 days');
  after = await loadWallet(env, key);
  assert.equal(W.refundedAtExpiryWithin(after, T0 + 380 * DAY, 30), true, 'welcome-back bonus applies');
});

test('checkout rejects missing terms and never trusts a browser amount; status verifies with Cashfree', async () => {
  const env = mkEnv();
  const req = (b) => new Request('https://x/credit/checkout', { method: 'POST', body: JSON.stringify(b) });
  let r = await createCreditOrder(req({ pack: 'explorer', email: 'a@b.in', phone: '9876543210' }), env, T0);
  assert.equal(r.status, 422);
  let sent;
  const fetch = async (url, init) => { if (init && init.method === 'POST') { sent = JSON.parse(init.body); return new Response(JSON.stringify({ order_id: sent.order_id, order_amount: sent.order_amount, payment_session_id: 'ps' })); }
    return new Response(JSON.stringify({ order_id: sent.order_id, order_amount: sent.order_amount, order_currency: 'INR', order_status: 'PAID' })); };
  r = await createCreditOrder(req({ pack: 'explorer', email: 'a@b.in', phone: '9876543210', acceptTerms: true, amount: 1 }), env, T0, { fetch });
  assert.equal(r.status, 200); assert.equal(sent.order_amount, 5000);
  mails.length = 0;
  const st = await (await creditOrderStatus(new Request('https://x'), env, sent.order_id, T0, { ...deps, fetch })).json();
  assert.equal(st.status, 'paid'); assert.equal(st.credit, 5300, 'Explorer 4% + founding 2%');
});
