import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../worker/lib/wallet-core.js';
import { handleWallet, runWalletReleases, creditWallet } from '../worker/handlers/wallet.js';
import { onStayPaid, handleStayDecide, runStayDeadlines } from '../worker/handlers/stay-lifecycle.js';

const T0 = Date.parse('2026-11-08T06:00:00Z');
const H = 3600 * 1000;
function kvStore() {
  const m = new Map();
  return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    put: async (k, v) => { m.set(k, String(v)); }, delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) };
}
const mkEnv = () => ({ RW_KV: kvStore(), WALLET_LINK_SECRET: 'test-secret', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 's', CASHFREE_ENV: 'live' });
const mails = []; const deps = { sendMail: async (env, m) => { mails.push(m); return { ok: true }; } };

test('refunds go straight back to the original payment: no hold, not spendable, cannot be kept (WALLET_POLICY)', () => {
  assert.equal(W.WALLET_POLICY.refundsToSource, true); assert.equal(W.WALLET_POLICY.newPaidCredit, false);
  let w = W.emptyWallet('Guest@Example.com');
  let r = W.creditRefund(w, { refId: 'rwstay_a', origins: [{ orderId: 'rwstay_a', amount: 1000 }], phone: '9876543210' }, T0);
  assert.equal(Date.parse(r.releaseAt), T0); assert.equal(W.balance(r.wallet), 0, 'a refund on its way is not wallet money');
  assert.equal(r.wallet.lots[0].noKeep, true); assert.deepEqual(r.wallet.phones, ['919876543210']);
  assert.equal(W.dueLots(r.wallet, T0).length, 1, 'due at once for the hourly refund job');
  assert.equal(W.creditRefund(r.wallet, { refId: 'rwstay_a', origins: [{ orderId: 'rwstay_a', amount: 1000 }] }, T0).duplicate, true);
  assert.equal(W.publicWallet(r.wallet, T0).refundsOnTheWay, 1000);
  const big = W.holdFor(r.wallet, 25000, T0); assert.equal(big.review, true, 'the review rule still exists if the policy is ever relaxed');
});

test('spending uses the oldest credit first and remembers which payments it came from', () => {
  /* Older pack credit (sold before the policy) is still honoured: paid money first, bonus coins last. */
  let w = W.emptyWallet('g@x.in');
  w = W.creditPrepaid(w, { refId: 'p1', orderId: 'o1', paid: 600, bonus: 0 }, T0).wallet;
  w = W.creditPrepaid(w, { refId: 'p2', orderId: 'o2', paid: 800, bonus: 0 }, T0 + H).wallet;
  const s = W.spend(w, 1000, 'rwstay_new', T0 + 2 * H);
  assert.deepEqual(s.used.map((u) => [u.orderId, u.amount]), [['o1', 600], ['o2', 400]]);
  assert.equal(W.balance(s.wallet), 400);
  assert.throws(() => W.spend(s.wallet, 1000, 'x', T0), /not enough credit/);
});

test('a refund cannot be kept as credit: it always goes back to the original payment', () => {
  let w = W.creditRefund(W.emptyWallet('g@x.in'), { refId: 'r1', origins: [{ orderId: 'o1', amount: 1000 }] }, T0).wallet;
  const lot = w.lots[0].lotId;
  w = W.keepLot(w, lot);
  assert.equal(w.lots[0].state, 'credit');
  assert.equal(W.dueLots(w, T0).length, 1);
  assert.throws(() => W.spend(w, 500, 'x', T0), /not enough credit/);
});

test('signed links: wallet and decision links verify, expire and cannot be reused for another order', async () => {
  const key = await W.walletKey('g@x.in');
  const t = await W.walletLinkToken('s', key, T0);
  assert.equal(await W.readWalletLinkToken('s', t, T0 + H), key);
  assert.equal(await W.readWalletLinkToken('other', t, T0 + H), null);
  assert.equal(await W.readWalletLinkToken('s', t, T0 + 31 * 24 * H), null);
  const d = await W.signLink('s', 'decide', 'rwstay_a:confirm', T0 + H);
  assert.equal(await W.verifyLink('s', 'decide', 'rwstay_a:confirm', d, T0), true);
  assert.equal(await W.verifyLink('s', 'decide', 'rwstay_b:confirm', d, T0), false);
  assert.equal(await W.verifyLink('s', 'decide', 'rwstay_a:refund', d, T0), false);
});

const order = (id, extra) => ({ id, stay: 'milan', property: 'Milan Heights, Almora', kind: 'advance', checkin: '2026-12-01', checkout: '2026-12-03', nights: 2, guests: 2, amount: 1000, email: 'guest@example.com', phone: '9876543210', status: 'payment_pending', ...extra });
const ID = 'rwstay_' + 'a'.repeat(32);

test('paid stay: founder and guest are emailed, no answer in 24h refunds straight to the original payment', async () => {
  const env = mkEnv(); mails.length = 0;
  const rec = order(ID); await env.RW_KV.put('stayorder:' + ID, JSON.stringify(rec));
  await onStayPaid(env, rec, T0, deps);
  assert.deepEqual(mails.map((m) => m.to), ['founder@roamwise.co.in', 'guest@example.com']);
  assert.match(mails[0].text, /stays\/decide\?o=rwstay_a+&a=refund&t=/);
  assert.equal((await runStayDeadlines(env, T0 + 23 * H, deps)).refunded, 0);
  assert.equal((await runStayDeadlines(env, T0 + 25 * H, deps)).refunded, 1);
  assert.equal((await env.RW_KV.get('stayorder:' + ID, 'json')).status, 'refunded_to_wallet');
  assert.match(mails.at(-1).subject, /Refund on its way: Rs 1,000/);
  assert.match(mails.at(-1).text, /back to the way you paid/);
  const refunds = [];
  const cf = async (e, r) => { refunds.push(r); return { ok: true, refundId: r.refundId, status: 'PENDING' }; };
  assert.equal((await runWalletReleases(env, T0 + 26 * H, { ...deps, cfRefund: cf })).refunded, 1, 'no wallet hold: the next hourly run refunds it');
  assert.deepEqual([refunds[0].orderId, refunds[0].amount], [ID, 1000]);
  assert.equal((await runWalletReleases(env, T0 + 60 * H, { ...deps, cfRefund: cf })).refunded, 0, 'never refunded twice');
});

test('host links: confirm, decline, extend once (max 72h) and expired links are refused', async () => {
  const env = mkEnv(); mails.length = 0;
  const rec = order(ID); await env.RW_KV.put('stayorder:' + ID, JSON.stringify(rec));
  await onStayPaid(env, rec, T0, deps);
  const linkFor = (a) => mails[0].text.split('\n').find((l) => l.includes('&a=' + a + '&')).split(': ').pop();
  const ext = await handleStayDecide(new Request(linkFor('extend')), env, T0 + H, deps);
  assert.match(await ext.text(), /More time given/);
  assert.match(await (await handleStayDecide(new Request(linkFor('extend')), env, T0 + 2 * H, deps)).text(), /Already extended/);
  assert.equal((await runStayDeadlines(env, T0 + 30 * H, deps)).refunded, 0, 'extended past 24h');
  const ok = await handleStayDecide(new Request(linkFor('confirm')), env, T0 + 31 * H, deps);
  assert.match(await ok.text(), /Confirmed/);
  assert.equal((await env.RW_KV.get('stayorder:' + ID, 'json')).status, 'confirmed');
  assert.equal((await runStayDeadlines(env, T0 + 80 * H, deps)).refunded, 0);
  const bad = await handleStayDecide(new Request(linkFor('confirm').replace(/t=.*/, 't=zz.' + '0'.repeat(32))), env, T0, deps);
  assert.match(await bad.text(), /Link not valid/);
});

test('wallet endpoints: magic link opens it, keep works, wrong token is refused, link request never reveals accounts', async () => {
  const env = mkEnv(); mails.length = 0;
  await creditWallet(env, { email: 'guest@example.com', phone: '9876543210', refId: ID, origins: [{ orderId: ID, amount: 1000 }], note: 'x' }, T0);
  const { token } = { token: await W.walletLinkToken('test-secret', await W.walletKey('guest@example.com'), T0) };
  const g = await handleWallet(new Request('https://w/wallet?t=' + encodeURIComponent(token)), env, 'wallet', T0, deps);
  const body = await g.json();
  assert.equal(body.wallet.balance, 0); assert.equal(body.wallet.refundsOnTheWay, 1000); assert.equal(body.wallet.email, 'gu***@example.com');
  assert.doesNotMatch(JSON.stringify(body), /rwstay_/, 'order ids stay private');
  const k = await handleWallet(new Request('https://w/wallet/keep', { method: 'POST', body: JSON.stringify({ t: token, lotId: body.wallet.lots[0].lotId }) }), env, 'wallet/keep', T0, deps);
  assert.equal((await k.json()).wallet.lots[0].state, 'credit', 'refunds cannot be kept as credit');
  assert.equal((await handleWallet(new Request('https://w/wallet?t=bad'), env, 'wallet', T0, deps)).status, 401);
  const a = await (await handleWallet(new Request('https://w/wallet/link', { method: 'POST', body: JSON.stringify({ email: 'nobody@example.com' }) }), env, 'wallet/link', T0, deps)).json();
  const b = await (await handleWallet(new Request('https://w/wallet/link', { method: 'POST', body: JSON.stringify({ email: 'guest@example.com' }) }), env, 'wallet/link', T0, deps)).json();
  assert.equal(a.message, b.message); assert.equal(mails.length, 1);
  const viaPhone = await handleWallet(new Request('https://w/wallet', { headers: { authorization: 'Bearer x' } }), env, 'wallet', T0, { ...deps, verifyIdToken: async () => ({ phone_number: '+919876543210' }) });
  assert.equal(viaPhone.status, 200, 'phone sign-in finds the wallet');
});

test('a bank refund Cashfree keeps refusing is handed to the founder after 3 tries', async () => {
  const env = mkEnv(); mails.length = 0;
  await creditWallet(env, { email: 'guest@example.com', refId: ID, origins: [{ orderId: ID, amount: 1000 }] }, T0);
  const cf = async () => ({ ok: false, error: 'refund not allowed' });
  for (let i = 0; i < 3; i++) await runWalletReleases(env, T0 + (25 + 7 * i) * H, { ...deps, cfRefund: cf });
  assert.match(mails.at(-1).subject, /Wallet refund needs you/);
  assert.equal((await runWalletReleases(env, T0 + 80 * H, { ...deps, cfRefund: cf })).failed, 0, 'stops retrying');
});

test('older pack credit still books a stay with no new payment; refund money alone cannot', async () => {
  const { createStayOrder } = await import('../worker/handlers/stay-cashfree.js');
  const { saveWallet } = await import('../worker/handlers/wallet.js');
  const env = mkEnv();
  const key = await W.walletKey('guest@example.com');
  const refundOnly = mkEnv();
  await creditWallet(refundOnly, { email: 'guest@example.com', refId: ID, origins: [{ orderId: ID, amount: 1500 }] }, Date.now());
  await saveWallet(env, key, W.creditPrepaid(W.emptyWallet('guest@example.com'), { refId: 'pk', orderId: ID, paid: 1500, bonus: 0 }, Date.now()).wallet);
  const token = await W.walletLinkToken('test-secret', await W.walletKey('guest@example.com'), Date.now());
  const req = (b) => new Request('https://x/', { method: 'POST', body: JSON.stringify({ stay: 'soulmate', checkin: '2027-01-10', checkout: '2027-01-12', email: 'guest@example.com', phone: '9876543210', paymentType: 'full', ...b }) });
  const realFetch = globalThis.fetch; globalThis.fetch = async () => { throw new Error('no Cashfree call expected'); };
  try {
    assert.equal((await createStayOrder(req({ payWith: 'wallet', wallet: token }), refundOnly)).status, 409, 'a refund on its way is not spendable');
    const res = await createStayOrder(req({ payWith: 'wallet', wallet: token }), env);
    const d = await res.json();
    assert.equal(d.paid, true);
    const rec = await env.RW_KV.get('stayorder:' + d.orderId, 'json');
    assert.equal(rec.status, 'paid_pending_confirmation');
    assert.deepEqual(rec.paidFromLots.map((l) => [l.orderId, l.amount]), [[ID, 1000]]);
    const w = await env.RW_KV.get('wallet:' + await W.walletKey('guest@example.com'), 'json');
    assert.equal(W.balance(w), 500);
    assert.equal((await createStayOrder(req({ payWith: 'wallet', wallet: 'bad' }), env)).status, 401);
    assert.equal((await createStayOrder(req({ payWith: 'wallet', wallet: token }), env)).status, 409, 'not enough credit left');
  } finally { globalThis.fetch = realFetch; }
});
