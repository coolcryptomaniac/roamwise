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
    const res = await handleCashfreeOrder(jsonRequest({ amount: 100, customer: { phone: '9999999999' }, meta: { planId: 'founder' } }), env);
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
    const res = await handleCashfreeOrder(jsonRequest({ amount: 299, customer: { phone: '9999999999' }, meta: { planId: 'pro_m' } }), env);
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
    const res = await handleCashfreeOrder(jsonRequest({ amount: 299, customer: { phone: '9999999999' }, meta: { planId: 'pro_m' } }), env);
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error, 'network_error');
  } finally { global.fetch = realFetch; }
});

// ---------------------------------------------------------------------------
// PRICE-TAMPERING FIX (worker/lib/pricing.js) — a client that has been
// tampered with (dev tools / direct fetch to this endpoint, bypassing the
// UI entirely) must never be able to buy an expensive plan for a fraction
// of its real price by sending a mismatched `amount`.
// ---------------------------------------------------------------------------
test('handleCashfreeOrder: rejects an amount that does not match the claimed plan\'s real price (price tampering)', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  let fetchCalled = false;
  const realFetch = global.fetch;
  global.fetch = async () => { fetchCalled = true; };
  try{
    // real price of elite_y10 (Elite 10-year pass) is ₹24,999 — try to pay ₹1
    const res = await handleCashfreeOrder(jsonRequest({
      amount: 1, customer: { phone: '9999999999' }, meta: { planId: 'elite_y10' }
    }), env);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'amount_mismatch');
    assert.equal(fetchCalled, false, 'must never reach Cashfree with a tampered amount');
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrder: rejects an unrecognized/missing planId even if the amount looks plausible', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  let fetchCalled = false;
  const realFetch = global.fetch;
  global.fetch = async () => { fetchCalled = true; };
  try{
    const res = await handleCashfreeOrder(jsonRequest({ amount: 299, customer: { phone: '9999999999' } }), env);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'unknown_plan');
    assert.equal(fetchCalled, false);
  } finally { global.fetch = realFetch; }
});

test('handleCashfreeOrder: accepts every real plan id at its exact configured price', async () => {
  const { handleCashfreeOrder } = await loadHandler();
  const { PLAN_PRICES } = await import(path.join(root, 'worker/lib/pricing.js'));
  const env = { CASHFREE_APP_ID: 'id', CASHFREE_SECRET_KEY: 'secret' };
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => REAL_ORDER_RESPONSE });
  try{
    for(const [planId, price] of Object.entries(PLAN_PRICES)){
      const res = await handleCashfreeOrder(jsonRequest({
        amount: price, customer: { phone: '9999999999' }, meta: { planId }
      }), env);
      assert.equal(res.status, 200, `${planId} at its real price ${price} should be accepted`);
    }
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

// FOUNDER SEAT COUNTING BUG FIX (2026-09-07): a Founder-offer purchase
// confirmed PAID through Cashfree must move pricing/founder.count by +1 —
// same shared-pool counter the admin-manual-payment and NMIMS-partner-
// redemption paths already move (js/pricing/founder-seats.js) — since
// nothing else in the Cashfree flow ever touched it before this fix, and
// Cashfree is offered for exactly this purchase (Founder is a 'oneoff'-
// category plan — see plan-picker.js's renderPlanGrid()). Left uncounted,
// every Founder seat sold this way made the PUBLIC seats-left counter
// overstate how many seats remained (the reported "999 left" bug).
function fakeFounderDb(opts){
  opts = opts || {};
  var calls = [];
  return {
    _calls: calls,
    collection: function(name){
      return { doc: function(id){
        return { update: function(data){
          calls.push({ collection: name, doc: id, data: data });
          return opts.rejects ? Promise.reject(new Error('permission-denied')) : Promise.resolve();
        } };
      } };
    }
  };
}
var FAKE_FIREBASE = { firestore: { FieldValue: { increment: function(n){ return { __increment: n }; } } } };

test('openCheckout(): a confirmed-PAID Founder-offer purchase increments pricing/founder.count by exactly +1', async () => {
  var db = fakeFounderDb();
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'PAID' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) }),
    db: db,
    firebase: FAKE_FIREBASE
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(100, { planId: 'founder', label: 'Founder Pro — Lifetime', tierId: 'elite', category: 'oneoff' });
  ctx.RWPaymentGateway.openCheckout({}, 'any');
  for(let i = 0; i < 6; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.grantPurchaseCalls.length, 1, 'Pro must still be granted');
  assert.equal(ctx.grantPurchaseCalls[0].planId, 'founder');
  assert.equal(db._calls.length, 1, 'exactly one pricing/founder write, not zero and not a double-count');
  assert.equal(db._calls[0].collection, 'pricing');
  assert.equal(db._calls[0].doc, 'founder');
  // Compare fields directly rather than assert.deepEqual(): the increment
  // sentinel object is constructed inside the vm context's own Object
  // realm, so it is structurally (but not reference-)equal to one built in
  // this file's realm — deepStrictEqual's prototype check would false-fail.
  assert.equal(Object.keys(db._calls[0].data).join(','), 'count');
  assert.equal(db._calls[0].data.count.__increment, 1);
});

test('openCheckout(): a confirmed-PAID purchase of a NON-Founder plan never touches pricing/founder.count', async () => {
  var db = fakeFounderDb();
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'PAID' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) }),
    db: db,
    firebase: FAKE_FIREBASE
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(299, { planId: 'pro_y', label: 'Pro Yearly', tierId: 'pro', category: 'subscription' });
  ctx.RWPaymentGateway.openCheckout({}, 'any');
  for(let i = 0; i < 6; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.grantPurchaseCalls.length, 1, 'Pro must still be granted');
  assert.equal(db._calls.length, 0, 'a non-Founder purchase must never move the Founder seat counter');
});

test('openCheckout(): a Founder purchase still grants Pro even if the founder.count write fails (best-effort, non-blocking)', async () => {
  var db = fakeFounderDb({ rejects: true });
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'PAID' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) }),
    db: db,
    firebase: FAKE_FIREBASE
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(100, { planId: 'founder', label: 'Founder Pro — Lifetime', tierId: 'elite', category: 'oneoff' });
  assert.doesNotThrow(() => ctx.RWPaymentGateway.openCheckout({}, 'any'));
  for(let i = 0; i < 6; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.grantPurchaseCalls.length, 1, 'Pro grant must not be undone by a counter-write failure');
});

test('openCheckout(): a Founder purchase with no Firestore available (offline) grants Pro without throwing', async () => {
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'PAID' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_1', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) })
    // deliberately no db/firebase in context — matches offline/not-yet-loaded reality
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(100, { planId: 'founder', label: 'Founder Pro — Lifetime', tierId: 'elite', category: 'oneoff' });
  assert.doesNotThrow(() => ctx.RWPaymentGateway.openCheckout({}, 'any'));
  for(let i = 0; i < 6; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.grantPurchaseCalls.length, 1, 'Pro must still be granted with no Firestore connection');
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

// ---------------------------------------------------------------------------
// 3. ENTITLEMENT-PERSISTENCE FIX — confirmed-PAID Cashfree purchases used to
//    write NOTHING server-side (grantPurchase() only ever set localStorage),
//    so a paying customer lost Pro on a storage clear/reinstall/device swap.
//    Two pieces now close that gap:
//      a) cashfree-adapter.js's _cfRecordOrder() — best-effort, non-blocking
//         write of a PENDING cashfreeOrders/{orderId} receipt (see
//         firestore.rules for why this can never self-grant pro:true).
//      b) plan-picker.js's grantPurchase() — a 24h rw_pro_temp/
//         rw_pro_temp_uid grace window (the exact mechanism manual-upi-
//         adapter.js's verifyPayment() already uses) so the local grant
//         survives js/boot/auth-init.js's account-bound onSnapshot re-check
//         on the very next reload, while the receipt awaits admin approval.
// ---------------------------------------------------------------------------
function fakeDb(){
  const writes = [];
  return {
    writes,
    collection(name){
      return {
        doc(id){
          return {
            set(data){ writes.push({ collection: name, id, data }); return Promise.resolve(); },
            // A confirmed-PAID Founder purchase also runs the (separately
            // tested — see fakeFounderDb()/FAKE_FIREBASE below)
            // pricing/founder.count increment through this same success
            // handler now (merged fix, PR #153). No-op it here so `writes`
            // stays scoped to the cashfreeOrders receipt this helper exists
            // to verify.
            update(){ return Promise.resolve(); }
          };
        }
      };
    }
  };
}

test('_cfRecordOrder (via openCheckout, confirmed PAID): writes a PENDING cashfreeOrders/{orderId} receipt with the exact expected shape', async () => {
  const db = fakeDb();
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    db,
    firebase: FAKE_FIREBASE,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'PAID' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_order_9', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) })
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(499, { planId: 'founder', label: 'Founder Pro — Lifetime', tierId: 'elite' });
  ctx.RWPaymentGateway.openCheckout({}, 'any');
  for(let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(ctx.grantPurchaseCalls.length, 1, 'the local grant must still happen — this receipt is additive, not a replacement');
  assert.equal(db.writes.length, 1, 'exactly one cashfreeOrders receipt must be written per confirmed-PAID purchase');
  const w = db.writes[0];
  assert.equal(w.collection, 'cashfreeOrders');
  assert.equal(w.id, 'rw_order_9', 'the doc id must be the real Cashfree order id (firestore.rules keys the collection by it)');
  assert.equal(w.data.uid, 'u1');
  assert.equal(w.data.cfOrderId, 'rw_order_9');
  assert.equal(w.data.planId, 'founder');
  assert.equal(w.data.amountINR, 499);
  assert.equal(w.data.status, 'pending', 'must never write status other than pending — only an admin can move it to approved');
  assert.ok(!('pro' in w.data), 'must never itself write a pro field — nothing here can grant Pro directly, see firestore.rules');
});

test('_cfRecordOrder: a receipt-write failure is best-effort and never blocks/undoes the Pro grant already given', async () => {
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    // set() (the cashfreeOrders receipt) rejects; update() (the separately
    // tested pricing/founder.count increment, now sharing this same success
    // handler per the PR #153 merge) still needs to resolve so this test
    // stays focused on the receipt-write failure it's named for.
    db: { collection: () => ({ doc: () => ({ set: () => Promise.reject(new Error('offline')), update: () => Promise.resolve() }) }) },
    firebase: FAKE_FIREBASE,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'PAID' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_order_9', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) })
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(499, { planId: 'founder' });
  assert.doesNotThrow(() => ctx.RWPaymentGateway.openCheckout({}, 'any'));
  for(let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(ctx.grantPurchaseCalls.length, 1, 'grantPurchase() must still fire even though the receipt write rejected');
});

test('_cfRecordOrder: no db / no signed-in user — no-ops silently, never throws', async () => {
  const ctx = loadCashfreeAdapter({
    rwApi: (p) => 'https://worker.example/' + p,
    user: null,
    fetch: async (url) => {
      if(String(url).indexOf('/status') !== -1) return { json: async () => ({ order_status: 'PAID' }) };
      return { ok: true, json: async () => ({ payment_session_id: 'session_abc', order_id: 'rw_order_9', environment: 'sandbox' }) };
    },
    Cashfree: () => ({ checkout: () => Promise.resolve({}) })
  });
  selectCashfree(ctx);
  ctx.RWPaymentGateway.createOrder(499, { planId: 'founder' });
  assert.doesNotThrow(() => ctx.RWPaymentGateway.openCheckout({}, 'any'));
  for(let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0));
});

// ---------------------------------------------------------------------------
// 4. plan-picker.js's grantPurchase() — the rw_pro_temp grace window
// ---------------------------------------------------------------------------
function loadGrantPurchase(overrides){
  const ls = {};
  const context = Object.assign({
    console,
    window: {},
    setTimeout: () => {},
    Math,
    el: () => ({ classList: { add(){}, remove(){} } }),
    document: {
      body: { style: {}, appendChild(){} },
      createElement: () => ({ style: {}, remove(){} })
    },
    lsGet: (k) => (k in ls ? ls[k] : null),
    lsSet: (k, v) => { ls[k] = v; },
    badgeAwardFounder: () => {},
    rwHaptic: () => {},
    confetti: () => {},
    refreshProUI: () => {},
    isPro: false,
    user: { uid: 'u1' }
  }, overrides || {});
  context._ls = ls;
  vm.createContext(context);
  vm.runInContext(read('js/payments/plan-picker.js'), context);
  return context;
}

test('grantPurchase(): sets a 24h rw_pro_temp/rw_pro_temp_uid grace window bound to the signed-in account — the exact protection manual-upi-adapter.js\'s verifyPayment() already gives the UTR-claim flow, so the local grant survives auth-init.js\'s account-bound onSnapshot re-check on the very next reload while the cashfreeOrders receipt awaits admin approval', () => {
  const ctx = loadGrantPurchase();
  const before = Date.now();
  ctx.grantPurchase('rw_order_9', 'cashfree', 'pro_m');
  assert.equal(ctx.isPro, true);
  assert.equal(ctx._ls.rw_pro_temp_uid, 'u1');
  const temp = parseInt(ctx._ls.rw_pro_temp, 10);
  assert.ok(temp >= before + 24 * 3600 * 1000 - 2000 && temp <= before + 24 * 3600 * 1000 + 5000, 'grace window must be ~24h out, matching manual-upi-adapter.js exactly (864e5 ms)');
});

test('grantPurchase(): no signed-in user (guest/device-only) — grants locally without throwing and without setting an orphaned grace window', () => {
  const ctx = loadGrantPurchase({ user: null });
  assert.doesNotThrow(() => ctx.grantPurchase('rw_order_9', 'cashfree', 'pro_m'));
  assert.equal(ctx.isPro, true);
  assert.equal(ctx._ls.rw_pro_temp_uid, undefined);
});
