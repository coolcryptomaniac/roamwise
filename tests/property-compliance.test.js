const assert = require('node:assert/strict');
const test = require('node:test');
const T = require('../features/trust/property-compliance.js');

const base = { verified: 'signed', listingReady: true, routeType: 'whatsapp', area: 'Kotyura', photoCount: 4 };

test('signed + working route + photos earns RoamWise Checked, not Trusted', () => {
  const r = T.assess(base);
  assert.equal(r.tier, 'checked');
  assert.deepEqual(r.badges, ['checked']);
  assert.ok(r.score >= 60 && r.score < T.TRUSTED_AT);
  assert.ok(r.missing.some((m) => m.id === 'gst'));
});
test('no booking route means no badge at all', () => {
  const r = T.assess({ ...base, routeType: 'none' });
  assert.equal(r.tier, 'listed'); assert.deepEqual(r.badges, []);
});
test('unsigned property is never Checked', () => {
  assert.equal(T.assess({ ...base, verified: 'researched' }).tier, 'listed');
});
test('GST, policy and payout lift a checked property to Trusted', () => {
  const r = T.assess({ ...base, gstVerified: true, advancePct: 30, freeCancelHours: 48, payoutReady: true });
  assert.equal(r.score, 100);
  assert.deepEqual(r.badges, ['checked', 'gst', 'trusted']);
});
test('GST badge is independent of the rest', () => {
  assert.deepEqual(T.assess({ ...base, routeType: 'none', gstVerified: true }).badges, ['gst']);
});
test('one photo is partial credit and still allows Checked', () => {
  const r = T.assess({ ...base, photoCount: 1 });
  assert.equal(r.tier, 'checked');
  assert.equal(r.checks.find((c) => c.id === 'photos').points, 8);
});
test('mergeBadges keeps admin-awarded badges and replaces stale compliance ones', () => {
  assert.deepEqual(T.mergeBadges(['local', 'quiet', 'trusted', 'verified'], ['checked']), ['local', 'quiet', 'checked']);
});
