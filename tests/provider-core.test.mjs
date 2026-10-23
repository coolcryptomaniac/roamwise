import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, validateApplication, missingDocs, verificationLevel, publicListing, applicationMessage } from '../providers/provider-core.mjs';

const good = { name: 'Asha Rawat', business: 'Kumaon Treks', category: 'trek', zones: ['Almora', 'Munsiyari'], phone: '+91 98765 43210', about: 'Small-group treks around Almora with certified guides.',
  docs: ['First-aid certificate', 'Guide course certificates', 'Made-up document'], consent: true };

test('provider: a complete application passes and only known documents are kept', () => {
  const r = validateApplication(good);
  assert.equal(r.ok, true); assert.equal(r.record.phone, '9876543210');
  assert.deepEqual(r.record.docs.sort(), ['First-aid certificate', 'Guide course certificates']);
  assert.ok(missingDocs(r.record).includes('Insurance for guests'));
});

test('provider: missing name, category, zones, contact, consent and short text are all reported', () => {
  const r = validateApplication({ name: '', category: 'bogus', zones: ['Atlantis'], phone: '123', about: 'short' });
  assert.equal(r.ok, false); assert.equal(r.errors.length, 6);
});

test('provider: links must be https and markup is stripped', () => {
  const r = validateApplication({ ...good, website: 'http://x.com', name: '<b>Asha</b>' });
  assert.equal(r.ok, false); assert.match(r.errors.join(' '), /https/);
  assert.doesNotMatch(validateApplication({ ...good, name: '<b>Asha</b>' }).record.name, /[<>]/);
});

test('provider: verification goes step by step and a step cannot be skipped', () => {
  assert.equal(verificationLevel({}).level, 'applied');
  assert.equal(verificationLevel({ trial: true, conversation: true }).level, 'applied');
  assert.equal(verificationLevel({ documents: true }).level, 'documents');
  assert.equal(verificationLevel({ documents: true, conversation: true }).public, false);
  assert.deepEqual({ ...verificationLevel({ documents: true, conversation: true, trial: true }) }, { level: 'verified', label: 'Verified: trial completed', public: true });
});

test('provider: nothing is public before verification; contact is shown only if asked', () => {
  const rec = validateApplication(good).record;
  assert.equal(publicListing(rec, { documents: true, conversation: true }), null);
  const all = { documents: true, conversation: true, trial: true };
  assert.equal(publicListing(rec, all).phone, undefined);
  assert.equal(publicListing(rec, all, true).phone, '9876543210');
});

test('provider: the message carries a DATA line, and every category lists documents', () => {
  const m = applicationMessage(validateApplication(good).record);
  assert.match(m, /DATA: \{/); assert.match(m, /Still to collect:/);
  Object.values(CATEGORIES).forEach((c) => assert.ok(c.docs.length >= 4));
});
