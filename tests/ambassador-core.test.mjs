import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCode, isCode, evaluateReferral, POLICY } from '../packages/ambassador-core.mjs';

const ph = (i) => '98765432' + String(10 + i);
const grp = (over = {}) => ({ leaderPhone: ph(1), pricePPBeforeGst: 12400, departMonth: '2026-12',
  members: Array.from({ length: 8 }, (_, i) => ({ phone: ph(i + 1), paidInFull: true, travelled: true })), ...over });

test('ambassador: codes are stable, well formed and avoid look-alike characters', () => {
  const a = makeCode('NMIMS', '9876543210');
  assert.equal(a, makeCode('nmims', '+91 98765 43210'));
  assert.ok(isCode(a)); assert.match(a, /^NMI-/);
  assert.notEqual(a, makeCode('NMIMS', '9876543211'));
  assert.equal(makeCode('X', '9876543210'), ''); assert.equal(makeCode('NMIMS', '123'), '');
  assert.equal(isCode('NMI-0O1I'), false);
});

test('ambassador: a fully paid, travelled group of 8 earns a capped per-head reward', () => {
  const r = evaluateReferral({ ambassadorPhone: '9000000001', group: grp() });
  assert.equal(r.eligible, true); assert.equal(r.perHead, 496); assert.equal(r.reward, 496 * 8);
  const big = evaluateReferral({ ambassadorPhone: '9000000001', group: grp({ pricePPBeforeGst: 100000 }) });
  assert.equal(big.perHead, POLICY.rewardCapPerHead);
});

test('ambassador: self-referral and shared phones earn nothing', () => {
  const self = evaluateReferral({ ambassadorPhone: ph(3), group: grp() });
  assert.equal(self.eligible, false); assert.match(self.reasons.join(' '), /own referred group/);
  const dup = grp(); dup.members[1].phone = dup.members[0].phone;
  assert.match(evaluateReferral({ ambassadorPhone: '9000000001', group: dup }).reasons.join(' '), /share a phone/);
});

test('ambassador: unpaid, refunded, too small or over the monthly limit earns nothing', () => {
  const g = grp(); g.members[0].paidInFull = false;
  assert.equal(evaluateReferral({ ambassadorPhone: '9000000001', group: g }).eligible, false);
  assert.equal(evaluateReferral({ ambassadorPhone: '9000000001', group: grp({ refunded: true }) }).eligible, false);
  const small = grp(); small.members = small.members.slice(0, 5);
  assert.match(evaluateReferral({ ambassadorPhone: '9000000001', group: small }).reasons.join(' '), /at least 6/);
  assert.match(evaluateReferral({ ambassadorPhone: '9000000001', group: grp(), priorPaid: 5 }).reasons.join(' '), /Monthly limit/);
  assert.equal(evaluateReferral({ ambassadorPhone: 'x', group: null }).eligible, false);
});

test('ambassador: members who did not travel reduce the reward, not the eligibility, while 6 or more travelled', () => {
  const g = grp(); g.members[0].travelled = false; g.members[1].travelled = false;
  const r = evaluateReferral({ ambassadorPhone: '9000000001', group: g });
  assert.equal(r.eligible, true); assert.equal(r.travellers, 6); assert.equal(r.reward, 496 * 6);
});
