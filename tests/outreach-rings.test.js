'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..');
test('rings: Haldwani near, Delhi regional, Mumbai far, unknown city unknown', async () => {
  const { ringFor } = await import(path.join(root, 'tools/outreach/rings.mjs'));
  assert.equal(ringFor('Haldwani').ring, 'near'); assert.equal(ringFor('Delhi').ring, 'regional');
  assert.equal(ringFor('Mumbai').ring, 'far'); assert.equal(ringFor('Atlantis').ring, 'unknown');
});
test('pickNext only returns confirmed, emailed, pending creators, nearest first, max n', async () => {
  const { pickNext } = await import(path.join(root, 'tools/outreach/rings.mjs'));
  const mk = (id, city, extra = {}) => ({ id, baseCity: city, baseConfirmed: true, email: id + '@x.com', status: 'pending', ...extra });
  const r = pickNext([mk('far', 'mumbai'), mk('mid', 'delhi'), mk('near', 'haldwani'), mk('noemail', 'nainital', { email: '' }), mk('sent', 'nainital', { status: 'sent' }), mk('unconf', 'nainital', { baseConfirmed: false })], 2);
  assert.deepEqual(r.map((x) => x.id), ['near', 'mid']);
});
test('seed creators are never marked pending without a confirmed base and a sourced email', () => {
  const { creators } = JSON.parse(fs.readFileSync(path.join(root, 'outreach/milan-heights/creators.json'), 'utf8'));
  creators.filter((c) => c.status === 'pending').forEach((c) => { assert.ok(c.baseConfirmed && c.email && c.emailSource, c.id); });
});
