'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const pilot = require('../partner/pilot-config.js');
const core = require('../partner/core.js');

test('Milan guest rate grosses the confirmed base price up by 7% of guest total', () => {
  assert.equal(pilot.grossFromBase(1500), 1613);
  assert.equal(pilot.commissionFromGross(1613), 112.91);
  assert.equal(Math.round((1613 - pilot.commissionFromGross(1613)) * 100) / 100, 1500.09);
  assert.equal(pilot.grossFromBase(3000), 3226);
  assert.equal(pilot.commissionFromGross(3226), 225.82);
  assert.equal(Math.round((3226 - pilot.commissionFromGross(3226)) * 100) / 100, 3000.18);
});

test('pilot allowlist recognizes only Milan Heights', () => {
  assert.equal(pilot.isMilan('Milan Heights'), true);
  assert.equal(pilot.isMilan('Moksha Retreat'), false);
  assert.equal(pilot.isMilan('Another Almora stay'), false);
});

test('completed booking commissions use each booking’s stored rate snapshot', () => {
  const totals = core.partnerTotals([
    { status: 'completed', amount: 1613, commissionPctSnapshot: 7 },
    { status: 'completed', amount: 2000, commissionPctSnapshot: 5 },
    { status: 'requested', amount: 5000, commissionPctSnapshot: 7 }
  ], 9, ['completed']);
  assert.deepEqual(totals, { count: 2, gross: 3613, commission: 212.91, partner: 3400.09 });
});
