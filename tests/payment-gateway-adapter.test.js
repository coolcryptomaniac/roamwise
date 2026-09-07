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
//      payVia() call the manual-UPI adapter DIRECTLY, via
//      RWPaymentGateway.provider('manual_upi') — proven by registering a
//      mock adapter under that exact id. NOTE (subscription-vs-one-off
//      Cashfree gating pass): this is a deliberate change from the
//      original "everything routes through RWPaymentGateway.current()"
//      design this file's tests used to assert — manual UPI must now be a
//      PERMANENT baseline no RW_PAYMENT_PROVIDER flip can silently replace
//      (Cashfree isn't approved for subscriptions yet, and manual UPI must
//      stay a genuine choice even where Cashfree is offered), so
//      plan-picker.js's checkout buttons no longer move to a different
//      provider just because RW_PAYMENT_PROVIDER changes — see
//      js/payments/gateway-adapter.js's header and the "manual UPI stays
//      wired" test below. The register()/current() facade itself (section
//      1 above) is untouched and still available for any future n-th
//      provider that wants the original swap semantics.
//   3. That app.js's submitUtr() (the real production wrapper, not a
//      stand-in) is a pure one-line delegation to
//      RWPaymentGateway.provider('manual_upi').verifyPayment() — checked by
//      isolating that exact function's source out of the real app.js file,
//      since loading the full ~600-line app.js monolith (which assumes a
//      live Firebase/DOM page) is out of scope for a unit test.
//   4. That the NEW Cashfree-specific checkout path (payViaCashfree()) is
//      gated to one-off-category plans only, and only once an admin has
//      turned Cashfree on — a subscription-category plan must never expose
//      it, regardless of the RW_PAYMENT_PROVIDER flag.

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
  // Every el() lookup misses EXCEPT '#cashfreeOption' (a fake element with a
  // .style tests can inspect, matching index.html's real
  // <div id="cashfreeOption" style="display:none">) — every other
  // DOM-touching branch in pickPlan()/payVia() short-circuits safely,
  // isolating the adapter call.
  context._cashfreeOptionEl = { style: { display: 'none' } };
  context.el = function (id) { return id === 'cashfreeOption' ? context._cashfreeOptionEl : undefined; };
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

test('manual UPI stays wired for every purchase regardless of RW_PAYMENT_PROVIDER — Cashfree isn\'t approved for subscriptions yet, and manual UPI must stay a genuine choice', () => {
  const ctx = loadPlanPicker();
  const manual = ctx.RWMockPaymentAdapter();
  const futureGateway = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', manual);
  ctx.RWPaymentGateway.register('future_gateway', futureGateway);

  ctx.pickPlan('pro_m', 299, 'Pro Monthly', 'pro', 'subscription');
  ctx.payVia('gpay');
  assert.equal(manual.calls.createOrder.length, 1);
  assert.equal(manual.calls.openCheckout.length, 1);

  // Unlike the old single-active-provider design, flipping RW_PAYMENT_PROVIDER
  // must NOT redirect plan-picker.js's baseline checkout buttons anymore —
  // see js/payments/gateway-adapter.js's header for why.
  ctx.RW_PAYMENT_PROVIDER = 'future_gateway';

  ctx.pickPlan('elite_m', 999, 'Elite Monthly', 'elite', 'subscription');
  ctx.payVia('gpay');
  assert.equal(manual.calls.createOrder.length, 2, 'manual UPI must still receive every call, even after the flag flips');
  assert.equal(manual.calls.openCheckout.length, 2);
  assert.equal(futureGateway.calls.createOrder.length, 0, 'plan-picker.js\'s baseline flow must never reach a provider other than manual_upi');
  assert.equal(futureGateway.calls.openCheckout.length, 0);
});

// ---------------------------------------------------------------------------
// 4. Subscription-vs-one-off Cashfree gating (js/payments/plan-picker.js's
//    pickPlan() -> _renderCashfreeOption()/payViaCashfree())
// ---------------------------------------------------------------------------
test('_renderCashfreeOption: a subscription-category plan never shows the Cashfree option, even with Cashfree turned on', () => {
  const ctx = loadPlanPicker();
  ctx.RWPaymentGateway.register('manual_upi', ctx.RWMockPaymentAdapter());
  const cashfree = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('cashfree', cashfree);
  ctx.RW_PAYMENT_PROVIDER = 'cashfree'; // admin has turned Cashfree on generally

  ctx.pickPlan('pro_m', 299, 'Pro Monthly', 'pro', 'subscription');

  assert.equal(ctx._cashfreeOptionEl.style.display, 'none', 'a subscription plan must never show the Cashfree option');
  assert.equal(cashfree.calls.createOrder.length, 0, 'Cashfree must not even create an order for a subscription plan');
});

test('_renderCashfreeOption: a one-off-category plan shows Cashfree ONLY once an admin has turned it on', () => {
  const ctx = loadPlanPicker();
  ctx.RWPaymentGateway.register('manual_upi', ctx.RWMockPaymentAdapter());
  const cashfree = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('cashfree', cashfree);

  // Cashfree registered but NOT turned on (RW_PAYMENT_PROVIDER still 'manual_upi')
  ctx.pickPlan('founder', 100, 'Founder Pro — Lifetime', 'elite', 'oneoff');
  assert.equal(ctx._cashfreeOptionEl.style.display, 'none', 'Cashfree must stay hidden until an admin turns it on, even for a one-off plan');
  assert.equal(cashfree.calls.createOrder.length, 0);

  ctx.RW_PAYMENT_PROVIDER = 'cashfree';
  ctx.pickPlan('pro_life', 14999, 'Pro Lifetime', 'pro', 'oneoff');
  assert.equal(ctx._cashfreeOptionEl.style.display, 'block', 'a one-off plan must show Cashfree once it is turned on');
  assert.equal(cashfree.calls.createOrder.length, 1, 'Cashfree order creation must fire for the shown option');
  assert.equal(cashfree.calls.createOrder[0].meta.planId, 'pro_life');
});

test('_renderCashfreeOption: manual UPI stays available (never hidden) alongside a shown Cashfree option', () => {
  const ctx = loadPlanPicker();
  const manual = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', manual);
  ctx.RWPaymentGateway.register('cashfree', ctx.RWMockPaymentAdapter());
  ctx.RW_PAYMENT_PROVIDER = 'cashfree';

  ctx.pickPlan('pro_y3', 7499, 'Pro 3-Year Pass', 'pro', 'oneoff');
  ctx.payVia('gpay'); // the always-present manual-UPI button

  assert.equal(ctx._cashfreeOptionEl.style.display, 'block');
  assert.equal(manual.calls.openCheckout.length, 1, 'manual UPI must remain a real, working choice even when Cashfree is also offered');
});

test('payViaCashfree(): routes to the Cashfree adapter with the one-off order pickPlan() created, never to manual UPI', () => {
  const ctx = loadPlanPicker();
  const manual = ctx.RWMockPaymentAdapter();
  const cashfree = ctx.RWMockPaymentAdapter();
  ctx.RWPaymentGateway.register('manual_upi', manual);
  ctx.RWPaymentGateway.register('cashfree', cashfree);
  ctx.RW_PAYMENT_PROVIDER = 'cashfree';

  ctx.pickPlan('day', 19, 'Day Pass', 'pro', 'oneoff');
  ctx.payViaCashfree();

  assert.equal(cashfree.calls.openCheckout.length, 1);
  assert.equal(cashfree.calls.openCheckout[0].method, 'cashfree');
  assert.equal(cashfree.calls.openCheckout[0].order.planId, 'day');
  assert.equal(manual.calls.openCheckout.length, 0, 'payViaCashfree() must never reach the manual-UPI adapter');
});

test('payViaCashfree(): a no-op (never throws) when Cashfree isn\'t available for the current plan', () => {
  const ctx = loadPlanPicker();
  ctx.RWPaymentGateway.register('manual_upi', ctx.RWMockPaymentAdapter());
  // Cashfree never registered at all in this test.
  ctx.pickPlan('week', 99, 'Week Pass', 'pro', 'oneoff');
  assert.doesNotThrow(() => ctx.payViaCashfree());
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
test('app.js submitUtr() delegates to RWPaymentGateway.provider(\'manual_upi\').verifyPayment() (source-level check — app.js assumes a live Firebase/DOM page and isn\'t loadable standalone)', () => {
  const appJs = read('app.js');
  const match = appJs.match(/function submitUtr\(\)\{([\s\S]*?)\n\}/);
  assert.ok(match, 'submitUtr() must still exist as a global function (index.html calls it via onclick="submitUtr()")');
  const body = match[1].trim();
  // Calls the manual-UPI adapter directly (not RWPaymentGateway.current())
  // so the UTR box keeps working even once an admin turns Cashfree on for
  // one-off plans (Cashfree has no verifyPayment() at all) — see
  // js/payments/gateway-adapter.js's header.
  assert.equal(body, "RWPaymentGateway.provider('manual_upi').verifyPayment();");
});
