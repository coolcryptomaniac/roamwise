import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShopHandlers } from '../worker/handlers/shop-order.js';
import * as W from '../worker/lib/wallet-core.js';
import { creditWallet, runWalletReleases } from '../worker/handlers/wallet.js';

const NOW = new Date('2026-11-08T10:00:00Z');
function kvStore() {
  const m = new Map();
  return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    put: async (k, v) => { m.set(k, String(v)); }, delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }) };
}
function harness(nowRef = { t: NOW }) {
  const docs = new Map([['config/shop', { enabled: true, environment: 'live', cashfreeEnabled: true, upiEnabled: true }]]);
  const mails = [];
  const env = { CASHFREE_APP_ID: 'app', CASHFREE_SECRET_KEY: 'x'.repeat(32), CASHFREE_ENV: 'live', FIREBASE_SERVICE_ACCOUNT_JSON: '{}', RW_KV: kvStore(), WALLET_LINK_SECRET: 'sec' };
  let n = 0;
  const h = createShopHandlers({
    context: async () => ({ accessToken: 't', projectId: 'roamwisepro' }),
    getDoc: async (_e, _t, _p, path) => docs.get(path) ?? null,
    createDocIfAbsent: async (_e, _t, _p, col, id, v) => { docs.set(`${col}/${id}`, v); return true; },
    updateDoc: async (_e, _t, _p, path, v) => { docs.set(path, { ...docs.get(path), ...v }); },
    queryEqualsString: async (_e, _t, _p, col, field, value) => [...docs.entries()].filter(([k, d]) => k.startsWith(col + '/') && d[field] === value).map(([k, d]) => ({ id: k.split('/')[1], ...d })),
    fetchImpl: async (url, opts = {}) => {
      if (opts.method === 'POST') return { ok: true, status: 200, json: async () => ({ payment_session_id: 's', order_id: JSON.parse(opts.body).order_id }) };
      const id = decodeURIComponent(url.split('/pg/orders/')[1]); const o = [...docs.values()].find((d) => d.orderId === id);
      return { ok: true, status: 200, json: async () => ({ order_id: id, order_amount: o.totalPaise / 100, order_currency: 'INR', order_status: 'PAID' }) };
    },
    qikinkFetch: async () => { throw new Error('qikink not used'); },
    sendMail: async (_env, m) => { mails.push(m); return { ok: true }; },
    now: () => nowRef.t,
    randomBytes: (len) => new Uint8Array(len).map((_, i) => (i + 7 + (n++ % 5)) * 3),
  });
  return { h, env, docs, mails, nowRef };
}
const body = (extra) => ({ items: [{ id: 'roamwise-mandala-headband', variant: 'standard', qty: 1 }],
  customer: { name: 'Asha Rawat', phone: '9876543210', email: 'asha@example.com' },
  ship: { line1: '12 Mall Road', city: 'Almora', state: 'Uttarakhand', pin: '263601' }, ...extra });
const req = (path, b, headers) => new Request('https://w/' + path, { method: b ? 'POST' : 'GET', headers: headers || {}, body: b ? JSON.stringify(b) : undefined });

test('a paid shop order emails the founder a refund link; the link refunds the buyer to the wallet', async () => {
  const { h, env, docs, mails } = harness();
  const o = await (await h.handleShopOrder(req('shop/order', body({ method: 'cashfree' })), env)).json();
  await h.handleShopStatus(req('shop/order/' + o.orderId + '/status', null, { authorization: 'Bearer ' + o.token }), env, o.orderId);
  assert.equal(docs.get('shopOrders/' + o.orderId).status, 'paid');
  const founder = mails.find((m) => m.to === 'founder@roamwise.co.in');
  assert.match(founder.subject, /Shop order paid/);
  assert.ok(mails.some((m) => m.to === 'asha@example.com' && /Order received/.test(m.subject)));
  const link = founder.text.split('\n').find((l) => l.includes('/shop/decide?')).split(': ').pop();
  const page = await (await h.handleShopDecide(new Request(link), env)).text();
  assert.match(page, /Refunded/);
  const d = docs.get('shopOrders/' + o.orderId);
  assert.equal(d.status, 'refunded_to_wallet'); assert.equal(d.fulfilmentState, 'cancelled');
  const w = await env.RW_KV.get('wallet:' + await W.walletKey('asha@example.com'), 'json');
  assert.equal(W.balance(w), 298); assert.equal(w.lots[0].orderId, o.orderId);
  assert.match(await (await h.handleShopDecide(new Request(link), env)).text(), /Refunded|Not refunded/, 'second tap is harmless');
  assert.equal(W.balance(await env.RW_KV.get('wallet:' + await W.walletKey('asha@example.com'), 'json')), 298);
});

test('Qikink could not take a paid order for 24 hours: the buyer is refunded to the wallet automatically', async () => {
  const { h, env, docs, nowRef } = harness();
  docs.set('shopOrders/RWS-ABCDEFGHJK', { orderId: 'RWS-ABCDEFGHJK', status: 'paid', method: 'cashfree', cashfreeOrderId: 'RWS-ABCDEFGHJK', totalPaise: 29800,
    paidAt: '2026-11-08T10:00:00Z', fulfilmentState: 'needs_attention', customer: { email: 'asha@example.com', phone: '9876543210' }, lines: [] });
  nowRef.t = new Date('2026-11-09T09:00:00Z');
  assert.equal((await h.runShopRefundCron(env)).refunded, 0, 'founder still has time to fix it');
  nowRef.t = new Date('2026-11-09T11:00:00Z');
  assert.equal((await h.runShopRefundCron(env)).refunded, 1);
  assert.equal(docs.get('shopOrders/RWS-ABCDEFGHJK').status, 'refunded_to_wallet');
});

test('a buyer with enough wallet credit pays for a shop order with it; not enough credit spends nothing', async () => {
  const { h, env, docs } = harness();
  await creditWallet(env, { email: 'asha@example.com', refId: 'rwstay_x', origins: [{ orderId: 'rwstay_x', amount: 500 }] }, NOW.getTime());
  const token = await W.walletLinkToken('sec', await W.walletKey('asha@example.com'), NOW.getTime());
  const r = await (await h.handleShopOrder(req('shop/order', body({ method: 'wallet', wallet: token })), env)).json();
  assert.equal(r.status, 'paid');
  const d = docs.get('shopOrders/' + r.orderId);
  assert.equal(d.paymentProvider, 'wallet'); assert.equal(d.fulfilmentState, 'queued');
  assert.deepEqual(d.paidFromLots.map((l) => [l.orderId, l.amount]), [['rwstay_x', 298]]);
  const big = body({ method: 'wallet', wallet: token }); big.items[0].qty = 3;
  const low = await h.handleShopOrder(req('shop/order', big), env);
  assert.equal(low.status, 409);
  assert.equal(W.balance(await env.RW_KV.get('wallet:' + await W.walletKey('asha@example.com'), 'json')), 202);
  assert.equal((await h.handleShopOrder(req('shop/order', body({ method: 'wallet', wallet: 'bad' })), env)).status, 401);
});

test('credit from a direct UPI order is handed to the founder to send back by UPI, never to Cashfree', async () => {
  const env = { RW_KV: kvStore(), WALLET_LINK_SECRET: 's', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 'b' };
  await creditWallet(env, { email: 'asha@example.com', refId: 'RWS-UPI', origins: [{ orderId: 'RWS-UPI', amount: 298, method: 'upi' }] }, NOW.getTime());
  const mails = []; let cf = 0;
  await runWalletReleases(env, NOW.getTime() + 25 * 3600 * 1000, { sendMail: async (_e, m) => { mails.push(m); }, cfRefund: async () => { cf++; return { ok: true }; } });
  assert.equal(cf, 0); assert.match(mails[0].subject, /Send UPI refund: Rs 298/);
});
