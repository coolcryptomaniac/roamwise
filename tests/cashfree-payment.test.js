// Tests for the Cashfree payment-gateway integration added on top of the
// pluggable adapter system (js/payments/gateway-adapter.js). Two halves,
// tested independently with mocked network calls — no real Cashfree
// credentials are used or required:
//
//   1. worker/handlers/cashfree.js — the server-side order-creation/status
//      endpoints. A real ES module, imported directly via dynamic import()
//      and exercised with hand-built Request-shaped objects + a mocked
//      global fetch (Node 22 provides a global fetch/Response, same as the
//      Workers runtime), asserting against Cashfree's real, documented
//      Order Create/Get Order response shape.
//   2. js/payments/providers/cashfree-adapter.js — the client-side adapter,
//      loaded into a Node vm context the same way
//      tests/payment-gateway-adapter.test.js already loads
//      manual-upi-adapter.js, with fetch/Cashfree()/document/user/etc all
//      mocked so no real network call or DOM is needed.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// ---------------------------------------------------------------------------
// 1. worker/handlers/cashfree.js
// ---------------------------------------------------------------------------
function jsonRequest(body){ return { json: async () => body }; }

const REAL_ORDER_RESPONSE = {
  cf_order_id: 2149460581,
  created_at: '2026-08-11T18:02:46+05:30',
  customer_details: { customer_id: 'u1', customer_phone: '9999999999' },
  entity: 'order',
  order_amount: 299,
  order_currency: 'INR',
  order_id: 'rw_test123',
  order_status: 'ACTIVE',
  payment_session_id: 'session_a1VXIPJo8kh7IBigVXX8LgTMupQW_cu25FS8KwLwQLOmiHqbBxq5UhEilrhbDSKKHA6UAuOj9506aaHNlFAHEqYrHSEl9AVtYQN9LIIc4vkH'
};

async function loadHandler(){ return import(path.join(root, 'worker/handlers/cashfree.js')); }

test('handleCashfreeOrder: 501s cleanly when CASHFREE_APP_ID/SECRET_KEY are not set (never a hard crash)', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const res = await handleCashfreeOrder(jsonRequest({ amount: 299, customer: { phone: '9999999999' } }), {});
  assert.equal(res.status, 501);
  const body = await res.json();
  assert.equal(body.error, 'not_configured');
});

test('handleCashfreeOrder: rejects a non-positive/invalid amount before ever calling Cashfree', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  let fetchCalled = false;
  const realFetch = global.fetch;
  global.fetch = async () => { fetchCalled = true; };
  try{
    const res = await handleCashfreeOrder(jsonRequest({ amount: 0, customer: { phone: '9999999999' } }), env);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'invalid_amount');
    assert.equal(fetchCalled, false, 'must not call Cashfree for an invalid amount');
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrder: rejects a missing/invalid customer phone (Cashfree requires it; this app never invents one)', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  const res = await handleCashfreeOrder(jsonRequest({ amount: 299, customer: { phone: '' } }), env);
  assert.equal(res.status, 422);
  assert.equal((await res.json()).error, 'missing_customer_phone');
});

test('handleCashfreeOrder: success — posts to the sandbox Order Create endpoint with client-id/client-secret headers, returns payment_session_id', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'test_app_id', CASHFREE_SECRET_KEY: 'test_secret_key', CASHFREE_ENV: 'sandbox' };
  let seenUrl, seenHeaders, seenBody;
  const realFetch = global.fetch;
  global.fetch = async (url, init) => {
    seenUrl = url; seenHeaders = init.headers; seenBody = JSON.parse(init.body);
    return { ok: true, status: 200, json: async () => REAL_ORDER_RESPONSE };
  };
  try{
    const res = await handleCashfreeOrder(jsonRequest({
      amount: 299, customer: { id: 'u1', phone: '9999999999', email: 'a@b.com' }, meta: { planId: 'pro_m', label: 'Pro Monthly' }
    }), env);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.payment_session_id, REAL_ORDER_RESPONSE.payment_session_id);
    assert.equal(body.order_id, 'rw_test123');
    assert.equal(body.environment, 'sandbox');
    assert.equal(seenUrl, 'https://sandbox.cashfree.com/pg/orders');
    assert.equal(seenHeaders['x-client-id'], 'test_app_id');
    assert.equal(seenHeaders['x-client-secret'], 'test_secret_key');
    assert.equal(seenBody.order_amount, 299);
    assert.equal(seenBody.order_currency, 'INR');
    assert.equal(seenBody.customer_details.customer_phone, '9999999999');
    assert.equal(seenBody.customer_details.customer_email, 'a@b.com');
    // the response the browser gets must never carry the secret key back
    assert.equal(JSON.stringify(body).indexOf('test_secret_key'), -1);
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrder: CASHFREE_ENV=live routes to api.cashfree.com and reports environment "production"', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret', CASHFREE_ENV: 'live' };
  let seenUrl;
  const realFetch = global.fetch;
  global.fetch = async (url) => { seenUrl = url; return { ok: true, status: 200, json: async () => REAL_ORDER_RESPONSE }; };
  try{
    const res = await handleCashfreeOrder(jsonRequest({ amount: 100, customer: { phone: '9999999999' } }), env);
    const body = await res.json();
    assert.equal(seenUrl, 'https://api.cashfree.com/pg/orders');
    assert.equal(body.environment, 'production');
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrder: propagates a Cashfree-side order failure without a hard crash', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 422, json: async () => ({ message: 'customer_details.customer_phone is required' }) });
  try{
    const res = await handleCashfreeOrder(jsonRequest({ amount: 299, customer: { phone: '9999999999' } }), env);
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error, 'cashfree_order_failed');
    assert.match(body.message, /customer_phone/);
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrder: a network error talking to Cashfree returns 502, never throws', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  const realFetch = global.fetch;
  global.fetch = async () => { throw new Error('getaddrinfo ENOTFOUND'); };
  try{
    const res = await handleCashfreeOrder(jsonRequest({ amount: 299, customer: { phone: '9999999999' } }), env);
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error, 'network_error');
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrderStatus: returns the real order_status field from Cashfree\'s Get Order API', async () => {
  const { handleCashfreeOrderStatus } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  let seenUrl;
  const realFetch = global.fetch;
  global.fetch = async (url) => { seenUrl = url; return { ok: true, status: 200, json: async () => ({ order_id: 'rw_test123', order_status: 'PAID' }) }; };
  try{
    const res = await handleCashfreeOrderStatus(env, 'rw_test123');
    assert.equal(res.status, 200);
    assert.equal((await res.json()).order_status, 'PAID');
    assert.match(seenUrl, /\/pg\/orders\/rw_test123$/);
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrderStatus: a network error returns 502, never throws', async () => {
  const { handleCashfreeOrderStatus } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  const realFetch = global.fetch;
  global.fetch = async () => { throw new Error('timeout'); };
  try{
    const res = await handleCashfreeOrderStatus(env, 'rw_test123');
    assert.equal(res.status, 502);
  } finally { global.fetch = realFetch; }
});

// ---------------------------------------------------------------------------
// 2. js/payments/providers/cashfree-adapter.js
// ---------------------------------------------------------------------------
function loadCashfreeAdapter(overrides){
  const context = Object.assign({
    console,
    setTimeout: (fn) => fn(), // resolve retry backoff synchronously in tests
    document: { createElement: () => ({}), head: { appendChild(){} } },
    showToast: () => {},
    track: () => {},
    user: { uid: 'u1', email: 'a@b.com', phoneNumber: '+919999999999' },
    activateProCalls: [],
    grantPurchaseCalls: [],
  }, overrides || {});
  context.activatePro = function(payId, method){ context.activateProCalls.push({ payId, method }); };
  // grantPurchase() (js/payments/plan-picker.js) is the real, per-product
  // fulfillment function the confirmed-PAID success path must call instead
  // of a blanket activatePro() — see the fulfillment-gap-fix test below.
  context.grantPurchase = function(payId, method, planId){ context.grantPurchaseCalls.push({ payId, method, planId }); };
  vm.createContext(context);
  vm.runInContext(read('js/payments/gateway-adapter.js'), context);
  vm.runInContext(read('js/payments/providers/cashfree-adapter.js'), context);
  return context;
}

// Most tests below exercise the Cashfree adapter itself through the
// RWPaymentGateway facade (the provider-switch mechanism is already covered
// by tests/payment-gateway-adapter.test.js) — this routes the facade to it,
// same as an admin flipping config/app.PAYMENT_PROVIDER to 'cashfree' in
// Firestore would.
function selectCashfree(ctx){ ctx.RW_PAYMENT_PROVIDER = 'cashfree'; return ctx; }

test('createOrder(): posts amount/customer/meta to rwApi("cashfree/order") and returns a synchronous order shell', async () => {
  let seenUrl, seenBody;
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async (url, init) => {
      seenUrl = url; seenBody = JSON.parse(init.body);
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) };
    }
  });
  selectCashfree(ctx);
  const order = ctx.RWPaymentGateway.createOrder(299, { planId: 'pro_m', label: 'Pro Monthly', tierId: 'pro' });
  assert.equal(order.amountINR, 299);
  assert.equal(order.provider, 'cashfree');
  assert.equal(seenUrl, 'https://worker.example/cashfree/order');
  assert.equal(seenBody.amount, 299);
  assert.equal(seenBody.customer.phone, '+919999999999');
  assert.equal(seenBody.meta.planId, 'pro_m');
  await ctx._cfOrderPromise; // let the in-flight request resolve
  assert.equal(ctx._cfOrderPromise, ctx._cfOrderPromise); // sanity: still the same promise object
});

test('createOrder() -> openCheckout(): full success path confirms order_status PAID before calling grantPurchase() (never a blanket activatePro())', async () => {
  const statusCalls = [];
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1){ statusCalls.push(url); return { json: async () => ({ order_status: 'PAID' }) }; }
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) };
    },
    Cashfree: (opts) => {
      assert.equal(opts.mode, 'sandbox');
      return { checkout: (args) => { assert.equal(args.paymentSessionId, 'session_abc'); return Promise.resolve({}); } };
    }
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(299, { planId: 'pro_m', label: 'Pro Monthly', tierId: 'pro' });
  ctx.RWPaymentGateway.openCheckout({}, 'any');
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  // FULFILLMENT FIX: the confirmed-PAID success path must call the real,
  // per-product fulfillment function (grantPurchase(), which branches on
  // exactly what was purchased via rwTierForPlan()) — not a blanket
  // activatePro() that grants the same thing regardless of product.
  assert.equal(ctx.grantPurchaseCalls.length, 1, 'grantPurchase() must be called exactly once after a confirmed PAID status');
  assert.equal(ctx.grantPurchaseCalls[0].method, 'cashfree');
  assert.equal(ctx.grantPurchaseCalls[0].planId, 'pro_m', 'the exact purchased plan id must be passed through so the right tier gets granted');
  assert.equal(ctx.activateProCalls.length, 0, 'the blanket activatePro() must NOT be called for a plan-aware Cashfree purchase');
  assert.equal(statusCalls.length, 1);
});

test('openCheckout(): Cashfree SDK reporting an error (cancel/failure) never calls activatePro()', async () => {
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async () => ({ ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) }),
    Cashfree: () => ({ checkout: () => Promise.resolve({ error: { message: 'User closed the checkout modal' } }) })
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(299, { planId: 'pro_m' });
  ctx.RWPaymentGateway.openCheckout({}, 'any');
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.activateProCalls.length, 0);
  assert.equal(ctx.grantPurchaseCalls.length, 0);
});

test('openCheckout(): SDK resolves without error but order never confirms PAID -> no activatePro(), no crash', async () => {
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'ACTIVE' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) })
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(299, { planId: 'pro_m' });
  ctx.RWPaymentGateway.openCheckout({}, 'any');
  for(let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.activateProCalls.length, 0);
  assert.equal(ctx.grantPurchaseCalls.length, 0);
});

test('createOrder(): a network/order-creation failure surfaces through openCheckout() without throwing', async () => {
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async () => { throw new Error('network down'); }
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(299, { planId: 'pro_m' });
  assert.doesNotThrow(() => ctx.RWPaymentGateway.openCheckout({}, 'any'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.activateProCalls.length, 0);
  assert.equal(ctx.grantPurchaseCalls.length, 0);
});

test('createOrder(): when rwApi() returns null (Worker not configured), openCheckout() fails gracefully instead of hanging', async () => {
  const ctx = selectCashfree(loadCashfreeAdapter({ rwApi: () => null }));
  ctx.RWPaymentGateway.createOrder(299, { planId: 'pro_m' });
  assert.doesNotThrow(() => ctx.RWPaymentGateway.openCheckout({}, 'any'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.activateProCalls.length, 0);
  assert.equal(ctx.grantPurchaseCalls.length, 0);
});

test('cashfree-adapter.js registers itself as "cashfree" without disturbing the default manual_upi provider', () => {
  const ctx = loadCashfreeAdapter({ rwApi: () => null });
  assert.equal(ctx.RW_PAYMENT_PROVIDER, 'manual_upi', 'registering a new adapter must not change the default provider');
  assert.ok(ctx.RWPaymentGateway.current() === null || ctx.RWPaymentGateway.current().id !== 'cashfree');
});
