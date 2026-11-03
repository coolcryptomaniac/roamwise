import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createShopHandlers, paymentMethods } from '../worker/handlers/shop-order.js';
import { priceCart, validPin, normalisePhone, upiIntent, newOrderId, ORDER_ID_RE, shippingFeePaise } from '../worker/lib/shop-core.js';
import { SHOP_CATALOGUE, publicCatalogue } from '../worker/lib/shop-catalogue.js';

const cat = (overrides = {}) => ({ ...SHOP_CATALOGUE, shipping: { rules: [], defaultFeePaise: 9900, freeAbovePaise: null, ...overrides } });
const item = { id: 'almora-after-dark-hoodie', variant: 'black-s', qty: 1 };

test('pricing is server-side, in paise, and refuses unknown or invalid input', () => {
  assert.equal(priceCart([item], '263601', cat()).totalPaise, 199900 + 9900);
  assert.equal(priceCart([{ ...item, qty: 2 }], '263601', cat()).subtotalPaise, 399800);
  for (const bad of [[], null, [{ ...item, id: 'x' }], [{ ...item, variant: 'x' }], [{ ...item, qty: 0 }], [{ ...item, qty: 6 }], [{ ...item, qty: 1.5 }], [item, item]]) {
    assert.ok(priceCart(bad, '263601', cat()).error, JSON.stringify(bad));
  }
  assert.equal(priceCart([item], '963601', cat()).error, 'invalid_pin');
});

test('shipping is never guessed: unconfigured PINs are refused, rules and free threshold apply', () => {
  assert.equal(priceCart([item], '263601').error, 'shipping_not_available'); // shipped catalogue has no fee yet
  assert.equal(shippingFeePaise('263601', 1000, cat({ rules: [{ pinPrefixes: ['26'], feePaise: 6900 }] })), 6900);
  assert.equal(shippingFeePaise('110001', 1000, cat({ rules: [{ pinPrefixes: ['26'], feePaise: 6900 }] })), 9900);
  assert.equal(shippingFeePaise('110001', 500000, cat({ freeAbovePaise: 100000 })), 0);
});

test('validators, order ids and UPI intent', () => {
  assert.ok(validPin('263601') && !validPin('026360') && !validPin('26360') && !validPin('9a3601'));
  assert.equal(normalisePhone('+91 99873 79730'), '9987379730');
  assert.equal(normalisePhone('12345'), null);
  const id = newOrderId(new Uint8Array(10).map((_, i) => i * 7));
  assert.match(id, ORDER_ID_RE);
  const u = upiIntent('RWS-ABCDEFGHJK', 209800);
  assert.equal(u.amount, '2098.00');
  const q = new URL(u.uri.replace('upi://', 'https://x/')).searchParams;
  assert.deepEqual([q.get('pa'), q.get('am'), q.get('cu'), q.get('tr')], ['roamwisepay@ybl', '2098.00', 'INR', 'RWS-ABCDEFGHJK']);
});

test('public catalogue exposes no supplier SKU', () => {
  assert.doesNotMatch(JSON.stringify(publicCatalogue()), /qikinkSku|fulfilment/);
});

/* ---- handler harness: in-memory Firestore, scripted Cashfree ---- */
function harness({ cfg, cashfree = {}, catalogue } = {}) {
  const docs = new Map(); const calls = [];
  if (cfg !== null) docs.set('config/shop', cfg || { enabled: true, environment: 'sandbox', cashfreeEnabled: true, upiEnabled: true });
  const env = { CASHFREE_APP_ID: 'app', CASHFREE_SECRET_KEY: 'x'.repeat(32), CASHFREE_ENV: 'sandbox', FIREBASE_SERVICE_ACCOUNT_JSON: '{}' };
  let n = 0;
  const h = createShopHandlers({
    ...(catalogue ? { catalogue } : {}),
    context: async () => ({ accessToken: 't', projectId: 'roamwisepro' }),
    getDoc: async (_e, _t, _p, path) => docs.get(path) ?? null,
    createDocIfAbsent: async (_e, _t, _p, col, id, v) => { const k = `${col}/${id}`; if (docs.has(k)) return false; docs.set(k, v); return true; },
    updateDoc: async (_e, _t, _p, path, v) => { docs.set(path, { ...docs.get(path), ...v }); },
    fetchImpl: async (url, opts = {}) => {
      calls.push({ url, method: opts.method || 'GET', body: opts.body ? JSON.parse(opts.body) : null });
      if (opts.method === 'POST') return { ok: cashfree.createOk !== false, status: 200, json: async () => ({ payment_session_id: 'sess_1', order_id: JSON.parse(opts.body).order_id }) };
      const id = decodeURIComponent(url.split('/pg/orders/')[1]); const order = [...docs.values()].find((d) => d.orderId === id);
      return { ok: cashfree.getOk !== false, status: 200, json: async () => ({ order_id: id, order_amount: cashfree.amount ?? order.totalPaise / 100, order_currency: cashfree.currency || 'INR', order_status: cashfree.status || 'PAID' }) };
    },
    now: () => new Date('2026-11-03T10:00:00Z'),
    randomBytes: (len) => new Uint8Array(len).map((_, i) => (i + 1 + (n++ % 3)) * 5),
  });
  return { h, docs, calls, env };
}
const req = (body, headers = {}, method = 'POST') => new Request('https://w.test/x', { method, headers: { 'content-type': 'application/json', ...headers }, body: body == null ? undefined : JSON.stringify(body) });
const goodOrder = (method) => ({ items: [item], method, customer: { name: 'Asha Rawat', phone: '9876543210', email: 'a@example.com' }, ship: { line1: '12 Mall Road', city: 'Almora', state: 'Uttarakhand', pin: '263601' } });

test('shipped catalogue refuses to quote until a delivery fee is configured', async () => {
  const { h, env } = harness();
  const res = await h.handleShopQuote(req({ items: [item], pin: '263601' }), env);
  assert.equal(res.status, 422);
  assert.equal((await res.json()).error, 'shipping_not_available');
});

test('checkout is closed unless config/shop.enabled is true', async () => {
  for (const cfg of [null, { enabled: false }, { enabled: 'true' }]) {
    const { h, env } = harness({ cfg });
    assert.equal((await h.handleShopQuote(req({ items: [item], pin: '263601' }), env)).status, 503);
    assert.equal((await h.handleShopOrder(req(goodOrder('upi')), env)).status, 503);
  }
  assert.deepEqual(paymentMethods({ enabled: true, environment: 'live', cashfreeEnabled: true, upiEnabled: true }, { CASHFREE_ENV: 'sandbox', CASHFREE_APP_ID: 'a', CASHFREE_SECRET_KEY: 'b' }), { enabled: true, cashfree: false, upi: true });
});


const priced = () => harness({ catalogue: cat() });
const NOW = Math.floor(new Date('2026-11-03T10:00:00Z').getTime() / 1000); // matches the harness clock
const sign = (env, bodyObj, ts = String(NOW)) => {
  const raw = JSON.stringify(bodyObj);
  const sig = createHmac('sha256', env.CASHFREE_SECRET_KEY).update(ts + raw).digest('base64');
  return new Request('https://w.test/shop/cashfree/webhook', { method: 'POST', headers: { 'x-webhook-timestamp': ts, 'x-webhook-signature': sig }, body: raw });
};

test('quote returns server totals and which methods are open', async () => {
  const { h, env } = priced();
  const body = await (await h.handleShopQuote(req({ items: [{ ...item, qty: 2 }], pin: '263601' }), env)).json();
  assert.deepEqual([body.ok, body.subtotalPaise, body.shippingPaise, body.totalPaise, body.methods], [true, 399800, 9900, 409700, { cashfree: true, upi: true }]);
});

test('UPI order: stored server-priced, awaiting payment, never paid by itself', async () => {
  const { h, docs, env } = priced();
  const body = await (await h.handleShopOrder(req({ ...goodOrder('upi'), price: 1, total: 1 }), env)).json();
  assert.match(body.orderId, ORDER_ID_RE);
  assert.equal(body.totalPaise, 209800);
  assert.equal(body.upi.pa, 'roamwisepay@ybl');
  assert.equal(body.upi.amount, '2098.00');
  const saved = docs.get('shopOrders/' + body.orderId);
  assert.equal(saved.status, 'awaiting_upi_payment');
  assert.notEqual(saved.tokenHash, body.token); // only the hash is stored
  const status = await (await h.handleShopStatus(req(null, { authorization: 'Bearer ' + body.token }, 'GET'), env, body.orderId)).json();
  assert.equal(status.status, 'awaiting_upi_payment');
});

test('Cashfree order: session returned, amount and notify url sent, status verifies then marks paid once', async () => {
  const { h, docs, calls, env } = priced();
  const o = await (await h.handleShopOrder(req(goodOrder('cashfree')), env)).json();
  assert.equal(o.payment_session_id, 'sess_1');
  assert.equal(o.environment, 'sandbox');
  const created = calls.find((c) => c.method === 'POST').body;
  assert.equal(created.order_amount, 2098);
  assert.equal(created.customer_details.customer_phone, '9876543210');
  assert.match(created.order_meta.notify_url, /\/shop\/cashfree\/webhook$/);
  assert.equal(docs.get('shopOrders/' + o.orderId).status, 'awaiting_payment');
  const auth = { authorization: 'Bearer ' + o.token };
  const s = await (await h.handleShopStatus(req(null, auth, 'GET'), env, o.orderId)).json();
  assert.equal(s.status, 'paid');
  const stored = docs.get('shopOrders/' + o.orderId);
  assert.deepEqual([stored.status, stored.fulfilmentState, stored.paymentProvider], ['paid', 'queued', 'cashfree']);
  assert.equal(JSON.stringify(s).includes('Rawat'), false); // status never returns buyer details
});

test('status is token-protected and does not reveal whether an order exists', async () => {
  const { h, env } = priced();
  const o = await (await h.handleShopOrder(req(goodOrder('upi')), env)).json();
  const get = (id, auth) => h.handleShopStatus(req(null, auth ? { authorization: auth } : {}, 'GET'), env, id);
  assert.equal((await get(o.orderId)).status, 401);
  assert.equal((await get(o.orderId, 'Bearer wrong')).status, 404);
  assert.equal((await get('RWS-AAAAAAAAAA', 'Bearer ' + o.token)).status, 404);
  assert.equal((await get('not-an-id', 'Bearer ' + o.token)).status, 404);
});

test('a Cashfree amount or currency mismatch is flagged and never marks paid', async () => {
  for (const cashfree of [{ amount: 1 }, { currency: 'USD' }]) {
    const { h, docs, env } = harness({ catalogue: cat(), cashfree });
    const o = await (await h.handleShopOrder(req(goodOrder('cashfree')), env)).json();
    const res = await h.handleShopStatus(req(null, { authorization: 'Bearer ' + o.token }, 'GET'), env, o.orderId);
    assert.equal(res.status, 409);
    const stored = docs.get('shopOrders/' + o.orderId);
    assert.equal(stored.status, 'awaiting_payment');
    assert.equal(stored.integrityFlag, true);
  }
});

test('unpaid Cashfree orders stay awaiting_payment', async () => {
  const { h, env } = harness({ catalogue: cat(), cashfree: { status: 'ACTIVE' } });
  const o = await (await h.handleShopOrder(req(goodOrder('cashfree')), env)).json();
  const s = await (await h.handleShopStatus(req(null, { authorization: 'Bearer ' + o.token }, 'GET'), env, o.orderId)).json();
  assert.equal(s.status, 'awaiting_payment');
});

test('a failed Cashfree order creation takes no payment and marks the order', async () => {
  const { h, docs, env } = harness({ catalogue: cat(), cashfree: { createOk: false } });
  const res = await h.handleShopOrder(req(goodOrder('cashfree')), env);
  assert.equal(res.status, 502);
  const failed = [...docs.entries()].find(([k]) => k.startsWith('shopOrders/'))[1];
  assert.equal(failed.status, 'payment_setup_failed');
});

test('invalid customer, address, method and quantity are rejected before anything is stored', async () => {
  const { h, docs, env } = priced();
  const cases = [
    { ...goodOrder('upi'), customer: { name: 'A', phone: '9876543210' } },
    { ...goodOrder('upi'), customer: { name: 'Asha', phone: '123' } },
    { ...goodOrder('upi'), ship: { ...goodOrder('upi').ship, pin: '12' } },
    { ...goodOrder('upi'), items: [{ ...item, qty: 99 }] },
    { ...goodOrder('upi'), method: 'cod' },
  ];
  for (const c of cases) assert.ok((await h.handleShopOrder(req(c), env)).status >= 400);
  assert.equal([...docs.keys()].filter((k) => k.startsWith('shopOrders/')).length, 0);
});

test('disabled method is refused even if the client asks for it', async () => {
  const { h, env } = harness({ catalogue: cat(), cfg: { enabled: true, environment: 'sandbox', cashfreeEnabled: false, upiEnabled: true } });
  assert.equal((await h.handleShopOrder(req(goodOrder('cashfree')), env)).status, 409);
  assert.equal((await h.handleShopOrder(req(goodOrder('upi')), env)).status, 200);
});

test('webhook: bad signature rejected; good signature re-verifies with Cashfree before paying', async () => {
  const { h, docs, env } = priced();
  const o = await (await h.handleShopOrder(req(goodOrder('cashfree')), env)).json();
  const event = { type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: o.orderId }, payment: { cf_payment_id: 1 } } };
  const bad = sign({ CASHFREE_SECRET_KEY: 'y'.repeat(32) }, event);
  assert.equal((await h.handleShopWebhook(bad, env)).status, 401);
  assert.equal(docs.get('shopOrders/' + o.orderId).status, 'awaiting_payment');
  const ok = await h.handleShopWebhook(sign(env, event), env);
  assert.equal(ok.status, 200);
  assert.equal(docs.get('shopOrders/' + o.orderId).status, 'paid');
  const dup = await (await h.handleShopWebhook(sign(env, event), env)).json();
  assert.equal(dup.duplicate, true);
});

test('webhook: stale timestamp, unknown order and mismatched amount never pay', async () => {
  const { h, docs, env } = harness({ catalogue: cat(), cashfree: { amount: 5 } });
  const o = await (await h.handleShopOrder(req(goodOrder('cashfree')), env)).json();
  const ev = (id) => ({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: id }, payment: { cf_payment_id: 1 } } });
  assert.equal((await h.handleShopWebhook(sign(env, ev(o.orderId), String(NOW - 4000)), env)).status, 401);
  assert.equal((await (await h.handleShopWebhook(sign(env, ev('RWS-AAAAAAAAAA')), env)).json()).ignored, 'unknown_order');
  assert.equal((await h.handleShopWebhook(sign(env, ev(o.orderId)), env)).status, 409);
  assert.equal(docs.get('shopOrders/' + o.orderId).status, 'awaiting_payment');
});

test('catalogue route reports whether checkout is open, and never leaks supplier SKUs', async () => {
  const open = harness();
  const a = await (await open.h.handleShopCatalogue(req(null, {}, 'GET'), open.env)).json();
  assert.equal(a.checkoutOpen, true);
  assert.doesNotMatch(JSON.stringify(a), /qikinkSku|fulfilment/);
  const closed = harness({ cfg: { enabled: false } });
  assert.equal((await (await closed.h.handleShopCatalogue(req(null, {}, 'GET'), closed.env)).json()).checkoutOpen, false);
  const missing = harness({ cfg: null });
  assert.equal((await (await missing.h.handleShopCatalogue(req(null, {}, 'GET'), missing.env)).json()).checkoutOpen, false);
});
