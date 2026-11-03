import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShopHandlers } from '../worker/handlers/shop-order.js';
import { SHOP_CATALOGUE } from '../worker/lib/shop-catalogue.js';
import { canonicalState, qikinkOrderNumber, splitAddress, splitName, buildQikinkOrder } from '../worker/lib/qikink-core.js';
import { validateCustomer, validateShipTo } from '../worker/lib/shop-core.js';

const product = SHOP_CATALOGUE.products[0];
const withSku = (sku) => ({ ...SHOP_CATALOGUE, shipping: { rules: [], defaultFeePaise: 9900, freeAbovePaise: null }, products: [{ ...product, variants: [{ ...product.variants[0], qikinkSku: sku }] }] });
const T0 = new Date('2026-11-03T10:00:00Z').getTime();

/* A fake Qikink: issues a new token per call (invalidating the old one), enforces unique order numbers. */
function fakeQikink(opts = {}) {
  const s = { tokenCalls: 0, current: null, orders: new Map(), creates: [], failNext: null, tokenFail: false };
  s.fetch = async (url, o = {}) => {
    const path = new URL(url).pathname; const host = new URL(url).host;
    s.host = host;
    const res = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (path === '/api/token') {
      if (s.tokenFail) return res(401, { error: 'bad' });
      const p = new URLSearchParams(o.body);
      if (p.get('ClientId') !== 'cid' || p.get('client_secret') !== 'sec') return res(401, {});
      s.tokenCalls += 1; s.current = 'tok' + s.tokenCalls; return res(200, { ClientId: 'cid', Accesstoken: s.current, expires_in: 3600 });
    }
    if (path === '/api/order/create') {
      s.creates.push({ headers: o.headers, body: JSON.parse(o.body) });
      if (s.failNext) { const f = s.failNext; s.failNext = null; if (f === 'throw') throw new Error('network down'); return res(f, { error: 'x' }); }
      if (o.headers.Accesstoken !== s.current) return res(401, { error: 'Unauthorized' });
      const b = JSON.parse(o.body);
      if (s.orders.has(b.order_number)) return res(400, { error: 'Order number already exists', status_code: '400' });
      s.orders.set(b.order_number, b); return res(200, { message: 'Order created successfully', order_id: 9000 + s.orders.size, status_code: '200' });
    }
    return res(404, {});
  };
  return s;
}

function setup({ cfg, env: envX, sku = 'SKU-HOODIE-BLK-S', q = fakeQikink(), orderEnv = 'sandbox' } = {}) {
  const docs = new Map();
  docs.set('config/shop', cfg === undefined ? { enabled: true, environment: 'sandbox', cashfreeEnabled: true, upiEnabled: true, qikinkEnabled: true, qikinkEnvironment: 'sandbox' } : cfg);
  let t = T0; let seq = 0;
  const env = { CASHFREE_APP_ID: 'app', CASHFREE_SECRET_KEY: 'x'.repeat(32), CASHFREE_ENV: orderEnv, QIKINK_CLIENT_ID: 'cid', QIKINK_CLIENT_SECRET: 'sec', FIREBASE_SERVICE_ACCOUNT_JSON: '{}', ...envX };
  const h = createShopHandlers({
    catalogue: withSku(sku),
    context: async () => ({ accessToken: 't', projectId: 'roamwisepro' }),
    getDoc: async (_e, _t, _p, path) => docs.get(path) ?? null,
    createDocIfAbsent: async (_e, _t, _p, col, id, v) => { docs.set(`${col}/${id}`, v); return true; },
    updateDoc: async (_e, _t, _p, path, v) => { docs.set(path, { ...docs.get(path), ...v }); },
    queryEqualsString: async (_e, _t, _p, col, field, value, limit) => [...docs.entries()].filter(([k, d]) => k.startsWith(col + '/') && d[field] === value).slice(0, limit).map(([k, d]) => ({ id: k.split('/')[1], ...d })),
    fetchImpl: async (url, o = {}) => {
      if (o.method === 'POST') return { ok: true, status: 200, json: async () => ({ payment_session_id: 's', order_id: JSON.parse(o.body).order_id }) };
      const id = decodeURIComponent(url.split('/pg/orders/')[1]); const ord = [...docs.values()].find((d) => d.orderId === id);
      return { ok: true, status: 200, json: async () => ({ order_id: id, order_amount: ord.totalPaise / 100, order_currency: 'INR', order_status: 'PAID' }) };
    },
    qikinkFetch: q.fetch,
    now: () => new Date(t),
    randomBytes: (n) => { seq += 1; return new Uint8Array(n).map((_, i) => (i * 11 + seq * 17 + 3) % 251); },
  });
  return { h, docs, env, q, advance: (ms) => { t += ms; } };
}
const req = (body, headers = {}, method = 'POST') => new Request('https://w.test/x', { method, headers: { 'content-type': 'application/json', ...headers }, body: body == null ? undefined : JSON.stringify(body) });
const order = { items: [{ id: product.id, variant: 'black-s', qty: 2 }], method: 'cashfree', customer: { name: 'Asha Rawat', phone: '9876543210', email: 'a@example.com' }, ship: { line1: '12 Mall Road', city: 'Almora', state: 'uttarakhand', pin: '263601' } };

async function placeAndPay(s) {
  const b = await (await s.h.handleShopOrder(req(order), s.env)).json();
  assert.ok(b.orderId, JSON.stringify(b));
  const st = await (await s.h.handleShopStatus(req(null, { authorization: 'Bearer ' + b.token }, 'GET'), s.env, b.orderId)).json();
  return { id: b.orderId, status: st.status, doc: () => s.docs.get('shopOrders/' + b.orderId) };
}

test('pure rules: states, order number, name/address splitting, email now required', () => {
  assert.equal(canonicalState(' uttarakhand '), 'Uttarakhand');
  assert.equal(canonicalState('Jammu & Kashmir'), 'Jammu and Kashmir');
  assert.equal(canonicalState('Uttaranchal'), 'Uttarakhand');
  assert.equal(canonicalState('Narnia'), null);
  assert.equal(qikinkOrderNumber('RWS-ABCDEFGHJK'), 'rws_abcdefghjk');
  assert.ok(qikinkOrderNumber('RWS-ABCDEFGHJK').length <= 15);
  assert.deepEqual(splitName('Asha'), { first_name: 'Asha', last_name: '' });
  assert.deepEqual(splitName('Asha  Devi Rawat'), { first_name: 'Asha', last_name: 'Devi Rawat' });
  const long = 'Flat 12, Deodar Heights Apartments, Near Government Inter College, Mall Road Extension, Almora';
  const a = splitAddress(long, 'Opp. park');
  assert.ok(a.address1.length <= 90 && a.address2.endsWith('Opp. park'));
  assert.equal(a.address1 + ' ' + a.address2.replace(/, Opp\. park$/, ''), long);
  assert.equal(validateCustomer({ name: 'Asha Rawat', phone: '9876543210', email: '' }).error, 'invalid_email');
  assert.equal(validateShipTo({ line1: '12 Mall Road', city: 'Almora', state: 'Narnia', pin: '263601' }).error, 'invalid_state');
  assert.equal(validateShipTo({ line1: '12 Mall Road', city: 'Almora', state: 'uttarakhand', pin: '263601' }).value.state, 'Uttarakhand');
});

test('payload is exactly what Qikink documents: My Products SKU, Prepaid, Qikink shipping, no unexpected fields', () => {
  const ord = { orderId: 'RWS-ABCDEFGHJK', totalPaise: 409700, lines: [{ id: product.id, variant: 'black-s', qty: 2, unitPaise: 199900 }], customer: { name: 'Asha Rawat', phone: '9876543210', email: 'a@example.com' }, ship: { line1: '12 Mall Road', line2: '', city: 'Almora', state: 'Uttarakhand', pin: '263601' } };
  const { body } = buildQikinkOrder(ord, () => 'SKU1');
  assert.deepEqual(Object.keys(body).sort(), ['gateway', 'line_items', 'order_number', 'qikink_shipping', 'shipping_address', 'total_order_value']);
  assert.deepEqual(body.line_items, [{ search_from_my_products: 1, quantity: 2, sku: 'SKU1', price: 1999 }]);
  assert.deepEqual([body.gateway, body.qikink_shipping, body.total_order_value, body.order_number], ['Prepaid', 1, 4097, 'rws_abcdefghjk']);
  assert.deepEqual(Object.keys(body.shipping_address).sort(), ['address1', 'city', 'country_code', 'email', 'first_name', 'last_name', 'phone', 'province', 'zip']);
  assert.equal(buildQikinkOrder(ord, () => null).error, 'missing_sku');
});

test('paid order is submitted once to sandbox Qikink and marked submitted', async () => {
  const s = setup(); const o = await placeAndPay(s);
  assert.equal(o.status, 'paid');
  assert.equal(o.doc().fulfilmentState, 'submitted');
  assert.equal(o.doc().qikinkOrderNumber, qikinkOrderNumber(o.id));
  assert.ok(o.doc().qikinkOrderId);
  assert.equal(s.q.creates.length, 1);
  assert.equal(s.q.host, 'sandbox.qikink.com');
  assert.equal(s.q.creates[0].body.total_order_value, 4097); // 2 x 1999 + 99 delivery, from the server-side order
  assert.equal(s.q.creates[0].body.shipping_address.province, 'Uttarakhand');
  assert.equal(s.q.tokenCalls, 1);
  const cached = s.docs.get('shopSecrets/qikinkToken_sandbox');
  assert.ok(cached.token && !JSON.stringify(s.docs.get('shopOrders/' + o.id)).includes('sec')); // token cached; secret never stored on the order
});

test('cached token is reused; a stale token is refreshed once and the order still goes through', async () => {
  const s = setup(); await placeAndPay(s);
  s.q.current = 'rotated-elsewhere'; // someone else asked for a token, ours is now invalid
  const o2 = await placeAndPay(s);
  assert.equal(o2.doc().fulfilmentState, 'submitted');
  assert.equal(s.q.tokenCalls, 2);
});

test('off by default: no flag, no secrets, or environment mismatch leaves the paid order queued and sends nothing', async () => {
  for (const [label, opts] of [
    ['flag off', { cfg: { enabled: true, environment: 'sandbox', cashfreeEnabled: true, upiEnabled: true } }],
    ['no secrets', { env: { QIKINK_CLIENT_ID: '', QIKINK_CLIENT_SECRET: '' } }],
    ['env mismatch', { cfg: { enabled: true, environment: 'sandbox', cashfreeEnabled: true, qikinkEnabled: true, qikinkEnvironment: 'live' } }],
    ['sku not set', { sku: null }],
  ]) {
    const s = setup(opts); const o = await placeAndPay(s);
    assert.equal(o.status, 'paid', label);
    assert.equal(o.doc().fulfilmentState, 'queued', label);
    assert.equal(s.q.creates.length, 0, label);
    assert.equal(s.q.tokenCalls, 0, label);
  }
});

test('a sandbox-paid order is never sent to live Qikink', async () => {
  const s = setup({ cfg: { enabled: true, environment: 'sandbox', cashfreeEnabled: true, qikinkEnabled: true, qikinkEnvironment: 'live' }, env: { QIKINK_ENV: 'live' } });
  const o = await placeAndPay(s);
  assert.equal(o.doc().fulfilmentState, 'needs_attention');
  assert.equal(s.q.creates.length, 0);
});

test('Qikink outage keeps the order queued; the hourly cron retries and succeeds, without duplicates', async () => {
  const s = setup(); s.q.failNext = 503;
  const o = await placeAndPay(s);
  assert.equal(o.doc().fulfilmentState, 'queued');
  assert.equal(o.doc().fulfilmentAttempts, 1);
  const r = await s.h.runShopFulfilmentCron(s.env);
  assert.equal(r.submitted, 1);
  assert.equal(o.doc().fulfilmentState, 'submitted');
  assert.equal(s.q.orders.size, 1);
  assert.equal((await s.h.runShopFulfilmentCron(s.env)).submitted, 0); // nothing left to send
  assert.equal(s.q.orders.size, 1);
});

test('a network error is retryable; a validation rejection is parked for a human, not hammered', async () => {
  const s = setup(); s.q.failNext = 'throw';
  assert.equal((await placeAndPay(s)).doc().fulfilmentState, 'queued');
  const s2 = setup(); s2.q.failNext = 400;
  const o2 = await placeAndPay(s2);
  assert.equal(o2.doc().fulfilmentState, 'needs_attention');
  assert.match(o2.doc().fulfilmentNote, /Qikink rejected/);
  assert.equal((await s2.h.runShopFulfilmentCron(s2.env)).submitted, 0);
  assert.equal(s2.q.creates.length, 1);
});

test('an interrupted submission is never blindly resent: it is parked after 15 minutes', async () => {
  const s = setup(); const o = await placeAndPay(s);
  const key = 'shopOrders/' + o.id;
  s.docs.set(key, { ...s.docs.get(key), fulfilmentState: 'submitting', fulfilmentAt: new Date(T0).toISOString() });
  await s.h.runShopFulfilmentCron(s.env);
  assert.equal(s.docs.get(key).fulfilmentState, 'submitting'); // too recent to judge
  s.advance(16 * 60 * 1000);
  await s.h.runShopFulfilmentCron(s.env);
  assert.equal(s.docs.get(key).fulfilmentState, 'needs_attention');
  assert.match(s.docs.get(key).fulfilmentNote, /interrupted/);
});

test('UPI orders are not sent to Qikink until an authorised person marks them paid and queued', async () => {
  const s = setup();
  const b = await (await s.h.handleShopOrder(req({ ...order, method: 'upi' }), s.env)).json();
  await s.h.runShopFulfilmentCron(s.env);
  assert.equal(s.q.creates.length, 0);
  const key = 'shopOrders/' + b.orderId;
  s.docs.set(key, { ...s.docs.get(key), status: 'paid', fulfilmentState: 'queued' }); // manual bank reconciliation
  await s.h.runShopFulfilmentCron(s.env);
  assert.equal(s.docs.get(key).fulfilmentState, 'submitted');
});
