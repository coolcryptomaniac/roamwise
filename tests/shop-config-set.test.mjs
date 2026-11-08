import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPatch } from '../tools/shop-config-set.mjs';

test('shop config patch writes only the checkout and Qikink flags, never secrets', () => {
  const p = buildPatch({ enabled: true, cashfree: true, upi: true, environment: 'live' }, '2026-11-08T00:00:00Z', 'mohit');
  assert.deepEqual(Object.keys(p).sort(), ['cashfreeEnabled', 'enabled', 'environment', 'updatedAt', 'updatedBy', 'upiEnabled']);
  assert.equal(p.enabled, true); assert.equal(p.environment, 'live');
  assert.deepEqual(Object.keys(buildPatch({ upi: false }, 't', 'x')).sort(), ['updatedAt', 'updatedBy', 'upiEnabled']);
  assert.throws(() => buildPatch({ environment: 'prod' }, 't', 'x'), /live or sandbox/);
  assert.throws(() => buildPatch({}, 't', 'x'), /nothing to change/);
  const qk = buildPatch({ qikink: true, qikinkEnvironment: 'live' }, 't', 'x');
  assert.equal(qk.qikinkEnabled, true); assert.equal(qk.qikinkEnvironment, 'live');
  assert.throws(() => buildPatch({ qikinkEnvironment: 'prod' }, 't', 'x'), /qikink-environment/);
});
