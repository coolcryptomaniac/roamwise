import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../worker/lib/wallet-core.js';
import { priceMembership, publicMemberships, MEMBER_COIN_PCT, CREDIT_PACKS } from '../worker/lib/credit-packs.js';
import { createCreditOrder, onCreditPaid, creditPacks } from '../worker/handlers/credit-packs.js';
import { loadWallet, saveWallet } from '../worker/handlers/wallet.js';
import { onStayPaid, refundStayToWallet } from '../worker/handlers/stay-lifecycle.js';
import { createStayOrder, cashDue } from '../worker/handlers/stay-cashfree.js';

const T0 = Date.parse('2026-11-26T06:00:00Z');
const DAY = 24 * 3600 * 1000;
function kvStore() {
  const m = new Map();
  return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    put: async (k, v) => { m.set(k, String(v)); }, delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) };
}
const mkEnv = () => ({ RW_KV: kvStore(), WALLET_LINK_SECRET: 'test-secret', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 's', CASHFREE_ENV: 'live' });
const mails = []; const deps = { sendMail: async (env, m) => { mails.push(m); return { ok: true }; } };

test('membership pricing: coins are a share of the fee, never all of it; founding seats add 2%', () => {
  for (const id of Object.keys(CREDIT_PACKS)) for (const members of [0, 500]) {
    const q = priceMembership(id, { members, sold: {} });
    assert.equal(q.mode, 'membership'); assert.equal(q.credit, 0, 'no stored credit');
    assert.ok(q.coins < q.pay * 0.35, id + ' coins stay well below the fee');
    assert.equal(q.coinPct, MEMBER_COIN_PCT[id] + (members < 100 ? 2 : 0));
  }
  assert.equal(priceMembership('explorer', { members: 0 }).coins, 1100);
  assert.throws(() => priceMembership('patron', { members: 0, sold: { patron: 100 } }), /sold out/);
  const pub = publicMemberships({ members: 3, sold: {} });
  assert.equal(pub.mode, 'membership'); assert.equal(pub.coinCapPct, W.COIN_CAP_PCT); assert.equal(pub.coolingOffDays, 7);
});

test('coins cover at most 10% of a booking, soonest-expiring first, and expire after a year', () => {
  let w = W.emptyWallet('m@x.in');
  w = W.creditCoins(w, { refId: 'rwcred_m1', coins: 1100, note: 'x', days: 365 }, T0).wallet;
  assert.equal(W.balance(w), 1100, 'coins are a kept bonus lot');
  assert.equal(W.coinsUsable(w, 5000, T0), 500);
  assert.equal(W.coinsUsable(w, 50000, T0), 1100);
  assert.equal(W.coinsUsable(w, 5000, T0 + 366 * DAY), 0, 'expired coins are not usable');
  assert.equal(W.creditCoins(w, { refId: 'rwcred_m1', coins: 1100, days: 365 }, T0).duplicate, true, 'same order never credits twice');
  const s = W.spendCoins(w, 500, 'rwstay_x', T0 + DAY);
  assert.equal(s.total, 500); assert.equal(W.coinBalance(s.wallet, T0 + DAY), 600);
});

test('membership checkout: Cashfree order for the full fee, then coins (not money) land in the wallet; idempotent', async () => {
  const env = mkEnv(); let sent;
  const fetch = async (u, o) => { sent = JSON.parse(o.body); return new Response(JSON.stringify({ payment_session_id: 'ps_1', order_id: sent.order_id, order_amount: sent.order_amount }), { status: 200 }); };
  const r = await createCreditOrder(new Request('https://x/credit/checkout', { method: 'POST', body: JSON.stringify({ pack: 'voyager', email: 'm@x.in', phone: '9876543210', acceptTerms: true }) }), env, T0, { fetch });
  assert.equal(r.status, 200, await r.clone().text());
  assert.equal(sent.order_amount, 10000); assert.match(sent.order_note, /membership/);
  const id = (await r.json()).orderId;
  const rec = await env.RW_KV.get('creditorder:' + id, 'json');
  assert.equal(rec.kind, 'membership'); assert.equal(rec.coins, 2400);
  mails.length = 0;
  await onCreditPaid(env, rec, T0, deps);
  await onCreditPaid(env, rec, T0, deps);
  const w = await loadWallet(env, await W.walletKey('m@x.in'));
  assert.equal(w.lots.length, 1); assert.equal(w.lots[0].source, 'bonus'); assert.equal(w.lots[0].amount, 2400);
  assert.ok(!w.lots.some((l) => l.source === 'prepaid'), 'no stored money');
  const welcome = mails.find((m) => /Founding Traveller #1/.test(m.subject));
  assert.match(welcome.text, /incl\. GST/); assert.match(welcome.text, /up to 10%/); assert.match(welcome.text, /7 days/);
  assert.ok(mails.some((m) => m.to === 'founder@roamwise.co.in' && /Cooling-off/.test(m.text)));
  const packs = await (await creditPacks(new Request('https://x/credit/packs'), env)).json();
  assert.equal(packs.mode, 'membership'); assert.equal(packs.members, 1);
});

test('stay with coins: Cashfree charges only the rest, coins settle on payment, a refund splits back to coins and card', async () => {
  const env = mkEnv();
  const key = await W.walletKey('guest@example.com');
  await saveWallet(env, key, W.creditCoins(W.emptyWallet('guest@example.com'), { refId: 'rwcred_g', coins: 5000, days: 365 }, Date.now()).wallet);
  const token = await W.walletLinkToken('test-secret', key, Date.now());
  const full = await createStayOrder(new Request('https://x/', { method: 'POST', body: JSON.stringify({ stay: 'soulmate', checkin: '2027-01-10', checkout: '2027-01-12', email: 'guest@example.com', phone: '9876543210', paymentType: 'full', payWith: 'wallet', wallet: token }) }), env);
  assert.equal(full.status, 409, 'coins alone can never pay a whole stay');
  let sent; const realFetch = globalThis.fetch;
  globalThis.fetch = async (u, o) => { sent = JSON.parse(o.body); return new Response(JSON.stringify({ payment_session_id: 'ps_2', order_id: sent.order_id, order_amount: sent.order_amount }), { status: 200 }); };
  try {
    const res = await createStayOrder(new Request('https://x/', { method: 'POST', body: JSON.stringify({ stay: 'soulmate', checkin: '2027-01-10', checkout: '2027-01-12', email: 'guest@example.com', phone: '9876543210', paymentType: 'full', useCoins: true, wallet: token }) }), env);
    const d = await res.json();
    assert.ok(d.coinsApplied > 0, JSON.stringify(d));
    const rec = await env.RW_KV.get('stayorder:' + d.orderId, 'json');
    assert.equal(d.coinsApplied, Math.floor(rec.amount * W.COIN_CAP_PCT / 100));
    assert.equal(sent.order_amount, rec.amount - d.coinsApplied); assert.equal(cashDue(rec), sent.order_amount);
    let w = await loadWallet(env, key);
    assert.equal(W.coinBalance(w, Date.now()), 5000, 'nothing spent before payment');
    await onStayPaid(env, rec);
    w = await loadWallet(env, key);
    assert.equal(W.coinBalance(w, Date.now()), 5000 - d.coinsApplied);
    const paid = await env.RW_KV.get('stayorder:' + d.orderId, 'json');
    assert.equal(paid.coinsUsed, d.coinsApplied);
    await onStayPaid(env, paid);
    assert.equal(W.coinBalance(await loadWallet(env, key), Date.now()), 5000 - d.coinsApplied, 'settles once');
    const settled = await env.RW_KV.get('stayorder:' + d.orderId, 'json');
    await refundStayToWallet(env, settled, 'test', Date.now(), deps);
    const back = (await loadWallet(env, key)).lots.filter((l) => l.refId === d.orderId);
    assert.equal(back.filter((l) => l.source === 'bonus').reduce((t, l) => t + l.amount, 0), d.coinsApplied, 'coins come back as coins');
    const cashBack = back.filter((l) => l.source !== 'bonus');
    assert.equal(cashBack.reduce((t, l) => t + l.amount, 0), rec.amount - d.coinsApplied, 'only the card part goes back to the card');
    assert.ok(cashBack.every((l) => l.noKeep), 'card part is never spendable credit');
  } finally { globalThis.fetch = realFetch; }
});

test('credit page and terms describe a GST-inclusive membership with a 7-day refund, not stored credit', async () => {
  const { readFileSync } = await import('node:fs');
  const c = readFileSync(new URL('../credit/index.html', import.meta.url), 'utf8');
  const t = readFileSync(new URL('../terms.html', import.meta.url), 'utf8');
  assert.match(c, /Founding Traveller Membership/); assert.match(c, /incl\. GST/); assert.match(c, /7 days/);
  assert.ok(!/Unused money is refunded automatically on day 360/.test(c));
  assert.match(t, /Founding Traveller Membership\.<\/strong>/); assert.match(t, /at most 10% of a booking/);
});
