const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/payments/providers/manual-upi-adapter.js'), 'utf8');

function harness(signedIn) {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', textContent: '', innerHTML: '', style: {}, disabled: false,
      replaceChildren() { this.textContent = ''; this.innerHTML = ''; }, focus() {}
    });
    return nodes.get(id);
  }
  const calls = { login: 0, qr: 0, claims: [], grants: [] };
  const adapterRegistry = {};
  const context = {
    user: signedIn ? { uid: 'user1', email: 'buyer@example.test', emailVerified: true } : null,
    AUTH_READY: true, IS_TOUCH_MOBILE: true, IS_APP: false,
    RWPaymentGateway: { register(id, adapter) { adapterRegistry[id] = adapter; } },
    el: node,
    showToast() {}, requireLogin() { calls.login++; return signedIn; },
    lsSet(key) { calls.grants.push(key); },
    refreshProUI() { calls.grants.push('refresh'); },
    track() {}, closePay() {}, OWNER_NOTIFY_EMAIL: '',
    _selectedPlan: { id: 'founder', label: 'Founder Pro' },
    firebase: { firestore: { FieldValue: { serverTimestamp() { return 'server-time'; } } } },
    rwRefStamp() { return {}; },
    window: null, navigator: {}, document: { hidden: false },
    setTimeout() {}, fetch() { throw new Error('No email should be sent in test'); },
    QRCode: function() { calls.qr++; },
    console
  };
  context.QRCode.CorrectLevel = { M: 1 };
  context.window = context;
  context.window.location = { href: '' };
  context.db = { collection(name) {
    assert.equal(name, 'claims');
    return {
      where() { return { get: async () => ({ docs: [] }) }; },
      doc(id) { return { set: async data => { calls.claims.push({ id, data }); } }; }
    };
  } };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'manual-upi-adapter.js' });
  return { context, calls, node, adapter: adapterRegistry.manual_upi };
}

test('guest cannot see a payable QR or start UPI checkout', () => {
  const { adapter, calls, node, context } = harness(false);
  const order = adapter.createOrder(100, { planId: 'founder', label: 'Founder Pro' });
  adapter.buildQR(order);
  adapter.openCheckout(order, 'gpay');
  context.copyUpiPaymentDetails();
  assert.equal(calls.qr, 0);
  assert.equal(calls.login, 2);
  assert.equal(context.window.location.href, '');
  assert.match(node('qrcode').textContent, /Sign in/);
  assert.doesNotMatch(node('upiPrefillNote').textContent, /roamwise@ybl/);
});

test('verified account UTR stays pending and never grants provisional Pro', async () => {
  const { adapter, calls, node, context } = harness(true);
  adapter.createOrder(100, { planId: 'founder', label: 'Founder Pro' });
  node('utrInput').value = '123456789012';
  adapter.verifyPayment();
  for (let i = 0; i < 12 && !calls.claims.length; i++) await new Promise(setImmediate);
  assert.equal(calls.claims.length, 1);
  assert.equal(calls.claims[0].data.status, 'pending');
  assert.equal(calls.claims[0].data.uid, 'user1');
  assert.equal(calls.grants.length, 0);
  assert.match(node('utrMsg').textContent, /only after RoamWise verifies/);
  assert.notEqual(context.isPro, true);
});
