const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/booking/stay-quote.js', 'utf8'), ctx);
const policy = { advancePct: 30, freeCancelHours: 48, lateRefundPct: 50 };

test('advance, balance and totals are whole rupees and the guest never pays RoamWise', () => {
  const q = ctx.rwStayQuote({ rate: 2499, nights: 3, rooms: 2, policy });
  assert.equal(q.total, 14994);
  assert.equal(q.advance, 4498);
  assert.equal(q.balance, q.total - q.advance);
  assert.equal(q.guestPaysRoamwise, 0);
  assert.equal(q.propertyFee, Math.round(14994 * 0.07));
  assert.equal(q.propertyReceives, q.total - q.propertyFee);
});

test('refund is full inside the free window, partial after, and never negative or above what was paid', () => {
  const full = ctx.rwStayRefund(policy, 4498, 72);
  assert.deepEqual([full.refund, full.retained, full.full], [4498, 0, true]);
  const late = ctx.rwStayRefund(policy, 4498, 10);
  assert.equal(late.refund, 2249);
  assert.equal(late.refund + late.retained, 4498);
  assert.equal(ctx.rwStayRefund({}, 1000, 100).refund, 0, 'no policy means no promised refund');
  assert.equal(ctx.rwStayRefund(policy, -5, 100).refund, 0);
  assert.equal(ctx.rwStayRefund({ advancePct: 10, freeCancelHours: 24, lateRefundPct: 999 }, 1000, 1).refund, 1000, 'percent is clamped to 100');
});

test('bad input is clamped, not trusted', () => {
  const q = ctx.rwStayQuote({ rate: 'abc', nights: -4, policy: { advancePct: 500, freeCancelHours: 'x' } });
  assert.equal(q.ok, false);
  assert.equal(q.nights, 1);
  assert.equal(q.policy.advancePct, 100);
  assert.equal(q.policy.freeCancelHours, 0);
  assert.equal(ctx.rwStayQuote({ rate: 1000, nights: 1, feePct: 99 }).feePct, 30);
});

test('policy text is empty without a policy and plain when set', () => {
  assert.equal(ctx.rwStayPolicyText({}), '');
  assert.match(ctx.rwStayPolicyText(policy), /30% advance paid directly to the hotel/);
  assert.match(ctx.rwStayPolicyText(policy), /free cancellation up to 2 days before check-in, then 50% refunded/);
  assert.match(ctx.rwStayPolicyText({ freeCancelHours: 36 }), /up to 36 hours before check-in, no refund after that/);
  assert.equal(ctx.rwHasStayPolicy({ advancePct: 0, freeCancelHours: 0 }), false);
});
