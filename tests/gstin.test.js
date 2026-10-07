'use strict';
const test = require('node:test');
const assert = require('node:assert');
const G = require('../features/finance-tax/gstin.js');

test('accepts a GSTIN with a correct check character', () => {
  const r = G.validateGstin('27aapfu0939f1zv');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.gstin, '27AAPFU0939F1ZV');
  assert.strictEqual(r.state, 'Maharashtra');
  assert.strictEqual(r.pan, 'AAPFU0939F');
});
test('rejects wrong length, bad format and bad check character', () => {
  assert.strictEqual(G.validateGstin('').ok, false);
  assert.strictEqual(G.validateGstin('27AAPFU0939F1Z').ok, false);
  assert.strictEqual(G.validateGstin('00AAPFU0939F1ZV').ok, false);
  assert.strictEqual(G.validateGstin('27AAPFU0939F1ZX').ok, false);
  assert.match(G.validateGstin('27AAPFU0939F1ZX').error, /last character/);
});
test('spaces and dashes are ignored', () => {
  assert.strictEqual(G.validateGstin('27 AAPFU 0939 F1Z-V').ok, true);
});
test('UPI, IFSC and last-4 validators', () => {
  assert.ok(G.validUpi('homestay@okhdfcbank'));
  assert.ok(G.validUpi('98765.43210@ybl'));
  assert.ok(!G.validUpi('not a upi'));
  assert.ok(G.validIfsc('hdfc0001234'));
  assert.ok(!G.validIfsc('HDFC1001234'));
  assert.ok(G.validLast4('0123'));
  assert.ok(!G.validLast4('12345'));
});
test('payoutSummary never reports a full account number', () => {
  const s = G.payoutSummary({ payoutUpi: 'a.b@ybl', payoutHolder: 'Ravi Kumar', payoutIfsc: 'sbin0001234', payoutAcctLast4: '4321' });
  assert.deepStrictEqual([s.hasUpi, s.hasBank, s.ready], [true, true, true]);
  assert.strictEqual(s.ifsc, 'SBIN0001234');
  assert.strictEqual(G.payoutSummary({}).ready, false);
  assert.strictEqual(G.payoutSummary({ payoutUpi: 'a.b@ybl' }).ready, false); // needs holder name
});
test('upiPayLink pays the property directly and refuses bad input', () => {
  const l = G.upiPayLink({ upi: 'a.b@ybl', name: 'Hotel Milan', amount: 2500.4, note: 'RW-ABC234' });
  assert.match(l, /^upi:\/\/pay\?pa=a\.b%40ybl&pn=Hotel%20Milan&am=2500&cu=INR&tn=RW-ABC234$/);
  assert.strictEqual(G.upiPayLink({ upi: 'bad', name: 'X Y', amount: 100 }), '');
  assert.strictEqual(G.upiPayLink({ upi: 'a.b@ybl', name: 'Hotel', amount: 0 }), '');
});
