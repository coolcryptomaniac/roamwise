'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
async function fixture(options = {}) {
  const { createCashfreeHandlers } = await import(path.join(root, 'worker/handlers/cashfree.js'));
  const writes = [], docs = new Map(), requests = [];
  docs.set('config/app', { PAYMENT_PROVIDER: 'cashfree', CASHFREE_ENVIRONMENT: 'live', BHAKTI_CHECKOUT_ENABLED: true, ...options.config });
  if (options.user) docs.set('users/u1', options.user);
  const receipt = { uid: 'u1', email: 'test@example.com', planId: 'bhakti_yajna', amountINR: 200, currency: 'INR', status: 'ACTIVE', fulfilled: false, environment: 'live', ...options.receipt };
  docs.set('cashfreeOrders/rw_test', receipt);
  const handlers = createCashfreeHandlers({
    context: async () => options.authError ? { error: new Response('{}', { status: 401 }) } : { claims: { uid: 'u1', email: 'test@example.com', ...(options.anonymous ? { firebase: { sign_in_provider: 'anonymous' } } : {}) }, accessToken: 'mock', projectId: 'roamwisepro' },
    getDoc: async (_, __, ___, key) => { if (options.readError) throw Error('private backend failure'); return docs.get(key) || null; },
    updateDoc: async (_, __, ___, key, data) => { if (options.writeError && key.startsWith('bhaktiGrants/')) throw Error('failed'); writes.push({ key, data }); docs.set(key, { ...docs.get(key), ...data }); },
    request: async (url, init) => {
      requests.push({ url, init });
      if (init.method === 'POST') { const body = JSON.parse(init.body); return Response.json({ ...body, payment_session_id: 'test-session', order_amount: body.order_amount, order_currency: 'INR' }); }
      return Response.json({ order_id: 'rw_test', order_amount: receipt.amountINR, order_currency: 'INR', order_status: options.status || 'PAID', ...options.provider });
    }
  });
  return { handlers, writes, docs, requests, env: { CASHFREE_ENV: 'live' } };
}
function order(amount = 200, planId = 'bhakti_yajna', origin = 'https://roamwise.co.in') {
  return new Request('https://service/bhakti/order', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, customer: { phone: '9999999999' }, meta: { planId, label: 'Dedication must not be stored' } }) });
}
test('bhakti server and browser share exact six product prices and levels', async () => {
  const { BHAKTI_PRODUCTS } = await import(path.join(root, 'worker/lib/bhakti-products.js'));
  const context = {}; vm.runInNewContext(fs.readFileSync(path.join(root, 'features/digital-bhakti/catalog.js'), 'utf8'), context);
  for (const p of context.RWBhakti.products) assert.deepEqual(BHAKTI_PRODUCTS[p.id], { price: p.price, level: p.level });
  assert.equal(Object.keys(BHAKTI_PRODUCTS).length, 6);
});
test('checkout rejects authentication, closed rollout, underpayment and using the membership endpoint before provider contact', async () => {
  const unauthorized = await fixture({ authError: true }); assert.equal((await unauthorized.handlers.handleCashfreeOrder(order(), unauthorized.env, true)).status, 401);
  const anonymous = await fixture({ anonymous: true }); assert.equal((await anonymous.handlers.handleCashfreeOrder(order(), anonymous.env, true)).status, 403); assert.equal(anonymous.requests.length, 0);
  const closed = await fixture({ config: { BHAKTI_CHECKOUT_ENABLED: false } }); assert.equal((await closed.handlers.handleCashfreeOrder(order(), closed.env, true)).status, 503); assert.equal(closed.requests.length, 0);
  const f = await fixture(); assert.equal((await f.handlers.handleCashfreeOrder(order(10), f.env, true)).status, 400);
  assert.equal((await f.handlers.handleCashfreeOrder(order(), f.env)).status, 400);
  assert.equal((await f.handlers.handleCashfreeOrder(order(100, 'founder'), f.env, true)).status, 400);
  assert.equal(f.requests.length, 0);
});
test('Pro can buy a new premium programme without losing Pro; duplicate included purchases are rejected', async () => {
  const f = await fixture({ user: { pro: true, proTier: 'elite', proUntil: 0 } });
  const r = await f.handlers.handleCashfreeOrder(order(), f.env, true); assert.equal(r.status, 200);
  assert.equal(f.writes.some(w => w.key.startsWith('users/')), false);
  assert.equal((await f.handlers.handleCashfreeOrder(order(30, 'bhakti_aarti'), f.env, true)).status, 409);
  assert.match(JSON.parse(f.requests[0].init.body).order_meta.return_url, /^https:\/\/roamwise\.co\.in\/bhakti\/checkout.html\?order_id=/);
});
test('paid fulfillment is idempotent and isolated from membership and founder counters', async () => {
  const f = await fixture(), req = new Request('https://service/status');
  const r = await f.handlers.handleCashfreeOrderStatus(req, f.env, 'rw_test', true); const data = await r.json();
  assert.equal(data.fulfilled, true); assert.equal(data.level, 5); assert.equal(data.entitlement, undefined);
  assert.equal(f.writes.filter(w => w.key.startsWith('bhaktiGrants/')).length, 1);
  assert.equal(f.writes.some(w => w.key.startsWith('users/') || w.key.startsWith('pricing/')), false);
  assert.equal(f.docs.get('payments/rw_test').kind, 'digital_bhakti');
  const count = f.writes.length; await f.handlers.handleCashfreeOrderStatus(req, f.env, 'rw_test', true); assert.equal(f.writes.length, count);
  assert.equal((await f.handlers.handleCashfreeOrderStatus(req, f.env, 'rw_test')).status, 409, 'main checkout cannot treat a bhakti receipt as membership');
  const access = await (await f.handlers.handleBhaktiAccess(req, f.env)).json(); assert.equal(access.level, 5); assert.equal(access.uid, 'u1');
});
test('failed, foreign, mismatched and unpersisted orders never unlock a programme', async () => {
  for (const options of [{ status: 'ACTIVE' }, { status: 'EXPIRED' }, { receipt: { uid: 'other' } }, { provider: { order_amount: 10 } }, { writeError: true }]) {
    const f = await fixture(options); const res = await f.handlers.handleCashfreeOrderStatus(new Request('https://service/status'), f.env, 'rw_test', true);
    const data = await res.json(); assert.notEqual(data.fulfilled, true);
    const access = await (await f.handlers.handleBhaktiAccess(new Request('https://service/access'), f.env)).json(); assert.equal(access.level, 0);
  }
});
test('restored access is bounded, no-store and rejects revoked or cross-environment grants; a lower purchase cannot downgrade', async () => {
  const f = await fixture(), req = new Request('https://service/access');
  await f.handlers.handleCashfreeOrderStatus(req, f.env, 'rw_test', true);
  f.docs.set('bhaktiGrants/u1/products/bhakti_mantra', { uid: 'u1', orderId: 'rw_low', status: 'active', environment: 'live' });
  f.docs.set('cashfreeOrders/rw_low', { uid: 'u1', planId: 'bhakti_mantra', amountINR: 10, currency: 'INR', environment: 'live', status: 'PAID', fulfilled: true });
  const r = await f.handlers.handleBhaktiAccess(req, f.env); assert.equal(r.headers.get('cache-control'), 'no-store'); assert.equal((await r.json()).level, 5);
  f.docs.get('cashfreeOrders/rw_test').status = 'REFUNDED'; assert.equal((await (await f.handlers.handleBhaktiAccess(req, f.env)).json()).level, 1);
  f.docs.get('bhaktiGrants/u1/products/bhakti_mantra').environment = 'sandbox'; assert.equal((await (await f.handlers.handleBhaktiAccess(req, f.env)).json()).level, 0);
});
