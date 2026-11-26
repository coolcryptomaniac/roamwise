import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../worker/lib/wallet-core.js';
import { createTripOrder, onTripPaid, redeemVoucher, runVoucherExpiry, newVoucherCode, normCode, tripMoney } from '../worker/handlers/trip-wallet.js';
import { createCreditOrder, creditOrderStatus, onCreditPaid } from '../worker/handlers/credit-packs.js';
import { loadWallet, saveWallet } from '../worker/handlers/wallet.js';
import { createStayOrder } from '../worker/handlers/stay-cashfree.js';

const T0 = Date.parse('2026-11-26T06:00:00Z');
const DAY = 864e5;
function kvStore() {
  const m = new Map();
  return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    put: async (k, v) => { m.set(k, String(v)); }, delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) };
}
const mkEnv = () => ({ RW_KV: kvStore(), WALLET_LINK_SECRET: 'test-secret', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 's', CASHFREE_ENV: 'live' });
const mails = []; const deps = { sendMail: async (env, m) => { mails.push(m); return { ok: true }; } };
const cf = () => { const seen = []; return { seen, fetch: async (u, o) => { const b = JSON.parse(o.body); seen.push(b); return new Response(JSON.stringify({ payment_session_id: 'ps', order_id: b.order_id, order_amount: b.order_amount }), { status: 200 }); } }; };
const post = (b, h = {}) => new Request('https://x/', { method: 'POST', headers: h, body: JSON.stringify(b) });

test('closed loop: loaded money buys only what RoamWise sells itself; coins capped at 10% everywhere', () => {
  let w = W.emptyWallet('a@b.in');
  w = W.creditPrepaid(w, { refId: 'rwcred_t1', orderId: 'rwcred_t1', paid: 3000, bonus: 0, scope: 'roamwise', kind: 'topup' }, T0).wallet;
  w = W.creditCoins(w, { refId: 'rwcred_c1', coins: 2000, days: 365 }, T0).wallet;
  assert.equal(W.PRINCIPAL_PRODUCTS.stay, false, 'partner stays are sold on commission, so not principal');
  assert.equal(W.spendableFor(w, 1000, 'stay', T0), 100, 'a stay can only take capped coins');
  assert.throws(() => W.spend(w, 1000, 's1', T0, 'stay'), /not enough/);
  assert.equal(W.spendableFor(w, 3300, 'shop', T0), 3330, 'shop: loaded money + coins up to 10% of the order');
  const s = W.spend(w, 3300, 'shop1', T0, 'shop');
  assert.deepEqual(s.used.map((u) => [u.source, u.amount]), [['prepaid', 3000], ['bonus', 300]]);
  assert.throws(() => W.spend(w, 3400, 'shop2', T0, 'shop'), /not enough/, 'coins never pass 10%');
  assert.equal(W.spendableFor(w, 10000, 'shop', T0 + 400 * DAY), 3000, 'expired coins are not spendable');
});

test('top-up: amount limits and the Rs 50,000 cap; paid top-up lands as RoamWise-only money that expires to a refund', async () => {
  const env = mkEnv(), c = cf();
  const ask = (amount) => createTripOrder(post({ amount, email: 't@x.in', phone: '9876543210', acceptTerms: true }), env, 'topup', T0, { fetch: c.fetch });
  assert.equal((await ask(100)).status, 422);
  assert.equal((await ask(50001)).status, 422);
  assert.equal((await createTripOrder(post({ amount: 1000, email: 't@x.in', phone: '9876543210' }), env, 'topup', T0, { fetch: c.fetch })).status, 422, 'terms required');
  const r = await ask(40000); assert.equal(r.status, 200);
  const id = (await r.json()).orderId;
  assert.equal(c.seen.at(-1).order_amount, 40000); assert.match(c.seen.at(-1).order_meta.return_url, /\/gift\/\?order_id=/);
  const rec = await env.RW_KV.get('creditorder:' + id, 'json');
  mails.length = 0;
  await onCreditPaid(env, rec, T0, deps); await onCreditPaid(env, { ...rec }, T0, deps);
  const key = await W.walletKey('t@x.in');
  let w = await loadWallet(env, key);
  assert.equal(w.lots.length, 1); assert.equal(w.lots[0].scope, 'roamwise'); assert.equal(tripMoney(w), 40000);
  assert.equal(await env.RW_KV.get('creditexp:' + key), '1');
  assert.match(mails[0].text, /cannot be withdrawn as cash/);
  assert.equal((await ask(10001)).status, 422, 'over the 50,000 cap'); assert.equal((await ask(10000)).status, 200);
  const e = W.expireCredit(w, T0 + 361 * DAY);
  assert.equal(e.refunding, 40000); assert.ok(e.wallet.lots[0].noKeep, 'expired money goes back to source, not spendable');
});

test('gift vouchers: fixed values, single use, redeem into the wallet with the voucher end date, brute force limited', async () => {
  const env = mkEnv(), c = cf();
  assert.equal((await createTripOrder(post({ value: 750, email: 'g@x.in', phone: '9876543210', acceptTerms: true }), env, 'voucher', T0, { fetch: c.fetch })).status, 422);
  assert.equal((await createTripOrder(post({ value: 1000, qty: 2, giftTo: 'f@x.in', email: 'g@x.in', phone: '9876543210', acceptTerms: true }), env, 'voucher', T0, { fetch: c.fetch })).status, 422);
  const r = await createTripOrder(post({ value: 2000, qty: 1, giftTo: 'friend@x.in', message: 'Happy trails', email: 'g@x.in', phone: '9876543210', acceptTerms: true }), env, 'voucher', T0, { fetch: c.fetch });
  assert.equal(r.status, 200); assert.equal(c.seen.at(-1).order_amount, 2000);
  const rec = await env.RW_KV.get('creditorder:' + (await r.json()).orderId, 'json');
  mails.length = 0;
  await onCreditPaid(env, rec, T0, deps);
  const code = rec.codes ? rec.codes[0] : (await env.RW_KV.get('creditorder:' + rec.id, 'json')).codes[0];
  assert.match(code, /^RWG-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.ok(mails.some((m) => m.to === 'friend@x.in' && m.text.includes(code) && /Happy trails/.test(m.text)));
  const st = await (await creditOrderStatus(new Request('https://x/'), env, rec.id, T0)).json();
  assert.equal(st.status, 'paid'); assert.ok(!JSON.stringify(st).includes(code), 'status never shows the code');
  const red = await redeemVoucher(post({ code: code.toLowerCase().replace(/-/g, ' '), email: 'friend@x.in' }, { 'cf-connecting-ip': '1.1.1.1' }), env, T0 + DAY, deps);
  assert.equal(red.status, 200);
  const w = await loadWallet(env, await W.walletKey('friend@x.in'));
  assert.equal(tripMoney(w), 2000); assert.equal(w.lots[0].orderId, rec.id, 'refund route is the buyer payment');
  assert.equal(w.lots[0].expiresAt, (await env.RW_KV.get('voucher:' + code, 'json')).expiresAt);
  assert.equal((await redeemVoucher(post({ code, email: 'other@x.in' }, { 'cf-connecting-ip': '1.1.1.1' }), env, T0 + DAY, deps)).status, 404, 'single use');
  for (let i = 0; i < 10; i++) await redeemVoucher(post({ code: 'RWG-AAAA-AAAA-AAAA', email: 'z@x.in' }, { 'cf-connecting-ip': '2.2.2.2' }), env, T0, deps);
  assert.equal((await redeemVoucher(post({ code, email: 'z@x.in' }, { 'cf-connecting-ip': '2.2.2.2' }), env, T0, deps)).status, 429);
  assert.equal(normCode('rwg aaaa bbbb cccc'), 'RWG-AAAA-BBBB-CCCC'); assert.equal(normCode('nope'), '');
  assert.notEqual(newVoucherCode(), newVoucherCode());
});

test('unredeemed voucher: reminder 30 days before, refund to the buyer payment when it ends', async () => {
  const env = mkEnv(), c = cf();
  const r = await createTripOrder(post({ value: 500, qty: 3, email: 'b@x.in', phone: '9876543210', acceptTerms: true }), env, 'voucher', T0, { fetch: c.fetch });
  const rec = await env.RW_KV.get('creditorder:' + (await r.json()).orderId, 'json');
  await onTripPaid(env, rec, T0, deps);
  mails.length = 0;
  assert.equal((await runVoucherExpiry(env, T0 + 335 * DAY, deps)).reminded, 3);
  assert.equal((await runVoucherExpiry(env, T0 + 336 * DAY, deps)).reminded, 0, 'reminded once');
  const done = await runVoucherExpiry(env, T0 + 361 * DAY, deps);
  assert.equal(done.refunded, 3);
  const bw = await loadWallet(env, await W.walletKey('b@x.in'));
  const back = bw.lots.filter((l) => l.orderId === rec.id);
  assert.equal(back.reduce((t, l) => t + l.amount, 0), 1500); assert.ok(back.every((l) => l.noKeep), 'goes back to the payment, not spendable');
});

test('Trip Wallet pays for a membership (RoamWise service) but never for a partner stay', async () => {
  const env = mkEnv();
  const key = await W.walletKey('m@x.in');
  await saveWallet(env, key, W.creditPrepaid(W.emptyWallet('m@x.in'), { refId: 'rwcred_tw', orderId: 'rwcred_tw', paid: 6000, bonus: 0, scope: 'roamwise' }, Date.now()).wallet);
  const token = await W.walletLinkToken('test-secret', key, Date.now());
  const realFetch = globalThis.fetch; globalThis.fetch = async () => { throw new Error('no Cashfree call expected'); };
  try {
    const stay = await createStayOrder(post({ stay: 'soulmate', checkin: '2027-01-10', checkout: '2027-01-12', email: 'm@x.in', phone: '9876543210', paymentType: 'full', payWith: 'wallet', wallet: token }), env);
    assert.equal(stay.status, 409, 'partner stay cannot use RoamWise-only money');
    const r = await createCreditOrder(post({ pack: 'explorer', email: 'm@x.in', phone: '9876543210', acceptTerms: true, payWith: 'wallet', wallet: token }), env, Date.now(), deps);
    const d = await r.json();
    assert.equal(d.paid, true, JSON.stringify(d));
    const w = await loadWallet(env, key);
    assert.equal(tripMoney(w), 1000); assert.ok(W.coinBalance(w, Date.now()) > 0, 'membership coins arrived');
  } finally { globalThis.fetch = realFetch; }
});

test('pages: gift page and wallet tile explain the closed loop; terms 4B', async () => {
  const { readFileSync } = await import('node:fs');
  const g = readFileSync(new URL('../gift/index.html', import.meta.url), 'utf8');
  assert.match(g, /wallet\/topup/); assert.match(g, /vouchers\/buy/); assert.match(g, /vouchers\/redeem/); assert.match(g, /cannot be withdrawn as cash/);
  const w = readFileSync(new URL('../wallet/index.html', import.meta.url), 'utf8');
  assert.match(w, /id="tripBal"/); assert.match(w, /href="\/gift\/#topup"/);
  const t = readFileSync(new URL('../terms.html', import.meta.url), 'utf8');
  assert.match(t, /single use, fixed value/); assert.match(t, /holds at most ₹50,000/);
});
