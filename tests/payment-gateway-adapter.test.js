// Tests for the pluggable payment gateway adapter (js/payments/gateway-adapter.js)
// and the config-driven provider-switching logic it implements.
//
// These load the real browser-global-style source files into a Node vm
// context (same pattern tests/founder-seats.test.js already uses for this
// codebase's no-bundler, no-ES-modules files) rather than requiring a real
// DOM/Firebase/QRCode environment, so js/payments/providers/manual-upi-adapter.js
// itself (which needs el/document/db/QRCode/etc.) is intentionally NOT
// loaded here — its own DOM/Firestore-shaped logic isn't the thing under
// test in this file. What IS under test:
//   1. RWPaymentGateway's registry/dispatch (register/current/create-
//      Order/openCheckout/buildQR/verifyPayment) in isolation, using the
//      test-only js/payments/providers/mock-adapter.js.
//   2. That js/payments/plan-picker.js's real, production pickPlan()/
//      payVia() call through RWPaymentGateway rather than any one
//      provider directly — proven by registering TWO mock adapters and
//      showing that flipping RW_PAYMENT_PROVIDER (the same field
//      config/app.PAYMENT_PROVIDER writes, per js/boot/init.js) is
//      enough to redirect every call from one to the other with zero
//      changes to plan-picker.js itself.
//   3. That app.js's submitUtr() (the real production wrapper, not a
//      stand-in) is a pure one-line delegation to
//      RWPaymentGateway.verifyPayment() — checked by isolating that exact
//      function's source out of the real app.js file, since loading the
//      full ~600-line app.js monolith (which assumes a live Firebase/DOM
//      page) is out of scope for a unit test.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// ---------------------------------------------------------------------------
// 1. RWPaymentGateway registry/dispatch, in isolation
// ---------------------------------------------------------------------------
function loadGatewayOnly() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read('js/payments/gateway-adapter.js'), context);
  vm.runInContext(read('js/payments/providers/mock-adapter.js'), context);
  return context;
}

test('RW_PAYMENT_PROVIDER defaults to manual_upi (today\'s real behavior, unset config = unchanged)', () => {
  const ctx = loadGatewayOnly();
  assert.equal(ctx.RW_PAYMENT_PROVIDER, 'manual_upi');
});

test('current() returns null (never throws) when the configured provider never registered', () => {
  const ctx = loadGatewayOnly();
  assert.equal(ctx.RWPaymentGateway.current(), null);
  // every facade method must no-op gracefully too, not throw
  assert.doesNotThrow(() => ctx.RWPaymentGateway.createOrder(100, {}));
  assert.doesNotThrow(() => ctx.RWPaymentGateway.openCheckout({}, 'gpay'));
  assert.doesNotThrow(() => ctx.RWPaymentGateway.buildQR({}));
  assert.doesNotThrow(() => ctx.RWPaymentGateway.verifyPayment());
});

test('register() + current() resolves the adapter matching RW_PAYMENT_PROVIDER', () => {
  const ctx = loadGatewayOnly();
  const mock = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', mock);
  assert.equal(ctx.RWPaymentGateway.current(), mock);
});

test('createOrder/openCheckout/buildQR/verifyPayment all forward to the current adapter with the right arguments', () => {
  const ctx = loadGatewayOnly();
  const mock = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', mock);

  const order = ctx.RWPaymentGateway.createOrder(299, {planId: 'pro_m', label: 'Pro Monthly', tierId: 'pro'});
  assert.equal(mock.calls.createOrder.length, 1);
  assert.equal(mock.calls.createOrder[0].amount, 299);
  assert.equal(mock.calls.createOrder[0].meta.planId, 'pro_m');
  assert.equal(mock.calls.createOrder[0].meta.label, 'Pro Monthly');
  assert.equal(mock.calls.createOrder[0].meta.tierId, 'pro');
  assert.equal(order.amountINR, 299);

  ctx.RWPaymentGateway.openCheckout(order, 'gpay');
  assert.equal(mock.calls.openCheckout.length, 1);
  assert.equal(mock.calls.openCheckout[0].method, 'gpay');
  assert.equal(mock.calls.openCheckout[0].order, order);

  ctx.RWPaymentGateway.buildQR(order);
  assert.equal(mock.calls.buildQR.length, 1);

  ctx.RWPaymentGateway.verifyPayment();
  assert.equal(mock.calls.verifyPayment.length, 1);
});

test('provider-switching: flipping RW_PAYMENT_PROVIDER (the config/app.PAYMENT_PROVIDER field) redirects every call to the newly-selected adapter', () => {
  const ctx = loadGatewayOnly();
  const providerA = ctx.RWMockPaymentAdapter();
  const providerB = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', providerA);
  ctx.RWPaymentGateway.register('provider_b', providerB);

  ctx.RWPaymentGateway.createOrder(100, {planId: 'x'});
  assert.equal(providerA.calls.createOrder.length, 1);
  assert.equal(providerB.calls.createOrder.length, 0);

  // This one flag flip is the ENTIRE mechanism for onboarding gateway #2 —
  // no checkout-code change accompanies it.
  ctx.RW_PAYMENT_PROVIDER = 'provider_b';

  ctx.RWPaymentGateway.createOrder(200, {planId: 'y'});
  assert.equal(providerA.calls.createOrder.length, 1, 'provider A must not receive calls after the switch');
  assert.equal(providerB.calls.createOrder.length, 1, 'provider B must receive calls after the switch');
});

test('current() falls back to manual_upi if RW_PAYMENT_PROVIDER names a provider that never registered (e.g. a config flag pointing at an undeployed gateway) — never a hard failure', () => {
  const ctx = loadGatewayOnly();
  const fallback = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', fallback);
  ctx.RW_PAYMENT_PROVIDER = 'some_future_gateway_not_deployed_yet';
  assert.equal(ctx.RWPaymentGateway.current(), fallback);
});

// ---------------------------------------------------------------------------
// 2. plan-picker.js's real pickPlan()/payVia() calling through the adapter
// ---------------------------------------------------------------------------
function loadPlanPicker() {
  const context = {};
  context.window = context; // plan-picker.js's top-level IIFE reads/writes window.closePay
  context.console = console;
  context.el = function () { return undefined; }; // every el() lookup misses -> every DOM-touching branch in pickPlan()/payVia() short-circuits safely, isolating the adapter call
  context.requireLogin = function () { return true; };
  context.showToast = function () {};
  context.document = {
    querySelector: function () { return null; },
    createElement: function () { return {classList: {add(){}, remove(){}}, style: {}, appendChild(){}}; },
    body: {style: {}}
  };
  vm.createContext(context);
  vm.runInContext(read('js/payments/gateway-adapter.js'), context);
  vm.runInContext(read('js/payments/providers/mock-adapter.js'), context);
  // The real manual-upi-adapter.js is loaded here too (not just the mock):
  // it's what makes UPI_VPA/UPI_NAME real globals for the generic50/generic10
  // test below, and it registers itself as 'manual_upi' by default, exactly
  // like production — individual tests below override that registration
  // with a mock only where they need to observe the call.
  vm.runInContext(read('js/payments/providers/manual-upi-adapter.js'), context);
  vm.runInContext(read('js/payments/plan-picker.js'), context);
  return context;
}

test('pickPlan() calls RWPaymentGateway.createOrder() with the exact plan the user picked, then buildQR()', () => {
  const ctx = loadPlanPicker();
  const manual = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', manual);

  ctx.pickPlan('pro_m', 299, 'Pro Monthly', 'pro');

  assert.equal(manual.calls.createOrder.length, 1);
  assert.equal(manual.calls.createOrder[0].amount, 299);
  assert.equal(manual.calls.createOrder[0].meta.planId, 'pro_m');
  assert.equal(manual.calls.createOrder[0].meta.label, 'Pro Monthly');
  assert.equal(manual.calls.createOrder[0].meta.tierId, 'pro');
  assert.equal(manual.calls.buildQR.length, 1, 'pickPlan() must still trigger a QR (re)build, same as before this refactor');
});

test('payVia() calls RWPaymentGateway.openCheckout() with the order pickPlan() just created and the tapped method', () => {
  const ctx = loadPlanPicker();
  const manual = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', manual);

  ctx.pickPlan('elite_y', 4999, 'Elite Yearly', 'elite');
  ctx.payVia('phonepe');

  assert.equal(manual.calls.openCheckout.length, 1);
  assert.equal(manual.calls.openCheckout[0].method, 'phonepe');
  assert.equal(manual.calls.openCheckout[0].order.planId, 'elite_y');
  assert.equal(manual.calls.openCheckout[0].order.amountINR, 4999);
});

test('plan-picker.js requires ZERO code changes to move from one provider to another — only the config flag changes', () => {
  const ctx = loadPlanPicker();
  const manual = ctx.RWMockPaymentAdapter();
  const futureGateway = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', manual);
  ctx.RWPaymentGateway.register('future_gateway', futureGateway);

  ctx.pickPlan('pro_m', 299, 'Pro Monthly', 'pro');
  ctx.payVia('gpay');
  assert.equal(manual.calls.createOrder.length, 1);
  assert.equal(manual.calls.openCheckout.length, 1);
  assert.equal(futureGateway.calls.createOrder.length, 0);
  assert.equal(futureGateway.calls.openCheckout.length, 0);

  // Simulates an admin flipping config/app.PAYMENT_PROVIDER to 'future_gateway'
  // (js/boot/init.js's applyRemoteConfig sets RW_PAYMENT_PROVIDER from that
  // exact field) — no other line in this test touches plan-picker.js code.
  ctx.RW_PAYMENT_PROVIDER = 'future_gateway';

  ctx.pickPlan('elite_m', 999, 'Elite Monthly', 'elite');
  ctx.payVia('gpay');
  assert.equal(manual.calls.createOrder.length, 1, 'the old provider must not see any more calls');
  assert.equal(manual.calls.openCheckout.length, 1);
  assert.equal(futureGateway.calls.createOrder.length, 1, 'the newly-selected provider must now receive checkout calls');
  assert.equal(futureGateway.calls.openCheckout.length, 1);
});

test("payVia('generic50')/payVia('generic10') (the standalone Journey-Movie/PDF-export micro-flows) are unaffected by the adapter, never call RWPaymentGateway, and build the exact same deep link as before this refactor", () => {
  const ctx = loadPlanPicker();
  // Deliberately do NOT touch RWPaymentGateway's registration here — these
  // two branches must never reach it, using only the live UPI_VPA/UPI_NAME
  // globals manual-upi-adapter.js declares (defaults: 'roamwise@ybl' /
  // 'RoamWise Pro'), exactly like the original inline code did.
  const spyAdapter = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', spyAdapter);
  ctx.location = {href: ''};

  ctx.payVia('generic50');
  assert.equal(ctx.location.href, 'upi://pay?pa=roamwise@ybl&pn=' + encodeURIComponent('RoamWise Pro') + '&am=50&cu=INR&tn=RoamWise%20Movie');

  ctx.payVia('generic10');
  assert.equal(ctx.location.href, 'upi://pay?pa=roamwise@ybl&pn=' + encodeURIComponent('RoamWise Pro') + '&am=10&cu=INR&tn=RoamWise%20PDF');

  assert.equal(spyAdapter.calls.openCheckout.length, 0, 'generic50/generic10 must never reach the gateway adapter');
});

// ---------------------------------------------------------------------------
// 3. app.js's submitUtr() is a pure delegation to RWPaymentGateway.verifyPayment()
// ---------------------------------------------------------------------------
test('app.js submitUtr() delegates to RWPaymentGateway.verifyPayment() (source-level check — app.js assumes a live Firebase/DOM page and isn\'t loadable standalone)', () => {
  const appJs = read('app.js');
  const match = appJs.match(/function submitUtr\(\)\{([\s\S]*?)\n\}/);
  assert.ok(match, 'submitUtr() must still exist as a global function (index.html calls it via onclick="submitUtr()")');
  const body = match[1].trim();
  assert.equal(body, 'RWPaymentGateway.verifyPayment();');
});
