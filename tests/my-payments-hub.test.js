const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'my-payments');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'payments.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'payments.css'), 'utf8');

test('account page uses auth state and account-scoped Firestore queries', () => {
  assert.match(js, /onAuthStateChanged/);
  assert.match(js, /collection\('cashfreeOrders'\)\.where\('uid','==',uid\)/);
  assert.match(js, /collection\('claims'\)\.where\('uid','==',uid\)/);
  assert.match(js, /signedIn\(uid,revision\)/);
  assert.match(js, /current\.getIdToken\(\)/);
});

test('history never initiates a charge, grants access, or accepts a UTR as payment proof', () => {
  assert.doesNotMatch(js, /\/cashfree\/order['"`]/); // no POST order creation
  assert.doesNotMatch(js, /grantPurchase\s*\(|activatePro\s*\(|increment\s*\(/);
  // A DOM classList.add() is not a Firestore add(); guard actual data writes.
  assert.doesNotMatch(js, /\.set\s*\(|\.update\s*\(|\.doc\([^)]*\)\.delete\s*\(|\.collection\([^)]*\)\.add\s*\(/);
  assert.doesNotMatch(html, /upi:\/\/pay|payment_session_id|onclick=/i);
  assert.match(html, /Submitting a UTR is a request for review/);
});

test('recovery uses authenticated existing-order GET and requires persisted entitlement', () => {
  assert.match(js, /encodeURIComponent\(order\.id\)\+'\/status'/);
  assert.match(js, /method:'GET'/);
  assert.match(js, /entitlement\.persisted===true/);
  assert.match(js, /Do not pay again/);
  assert.match(js, /response\.ok/);
});

test('payment UI has accessible status, reduced motion and clear test environment', () => {
  assert.match(html, /id="main"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /id="environment"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(html, /payments\.js\?v=1/);
  assert.match(js, /SANDBOX · TEST ORDERS/);
});
