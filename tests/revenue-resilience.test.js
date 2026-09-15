const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/admin/revenue-resilience.js'), 'utf8'), context);
const Revenue = context.RWRevenueResilience;

test('no completed bookings produces zero revenue and an honest limitation', () => {
  const out = Revenue.analyse([{ status: 'requested', amount: 10000 }], []);
  assert.equal(out.completedBookings, 0);
  assert.equal(out.commissionRevenue, 0);
  assert.equal(out.score, 0);
  assert.match(out.flags[0], /cannot be measured/);
});

test('only completed booking commission is counted using snapshotted terms', () => {
  const out = Revenue.analyse([
    { status: 'completed', amount: 10000, commissionPctSnapshot: 7, partnerUid: 'p1', completedAt: '2026-09-01' },
    { status: 'checked_out', amount: 20000, commissionPctSnapshot: 5, partnerUid: 'p2', completedAt: '2026-10-01' },
    { status: 'confirmed', amount: 90000, commissionPctSnapshot: 30, partnerUid: 'p1' }
  ], [
    { id: 'p1', country: 'India', status: 'active' },
    { id: 'p2', country: 'Indonesia', status: 'active' }
  ]);
  assert.equal(out.completedBookings, 2);
  assert.equal(out.grossBookingValue, 30000);
  assert.equal(out.commissionRevenue, 1700);
  assert.equal(out.activePartners, 2);
});

test('concentrated country and property revenue is flagged', () => {
  const out = Revenue.analyse([
    { status: 'completed', amount: 10000, partnerUid: 'p1', propertyId: 'p1', completedAt: '2026-09-01' },
    { status: 'completed', amount: 10000, partnerUid: 'p1', propertyId: 'p1', completedAt: '2026-10-01' }
  ], [{ id: 'p1', country: 'India', status: 'active' }]);
  assert.ok(out.flags.some(x => /one country/.test(x)));
  assert.ok(out.flags.some(x => /one property/.test(x)));
});

test('published partner ladder remains 7% free and 5% paid', () => {
  const plans = Object.fromEntries(Revenue.PLANS.map(p => [p.id, p]));
  assert.equal(plans.free.commission, '7%');
  assert.equal(plans.desk.commission, '5%');
  assert.equal(plans.annual.commission, '5%');
  assert.equal(plans.three_year.commission, '5%');
});
