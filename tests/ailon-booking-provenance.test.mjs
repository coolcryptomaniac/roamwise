import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (name) => JSON.parse(readFileSync(new URL('../data/ailon/' + name, import.meta.url), 'utf8'));
test('Ailon booking schema requires server quote and provenance fields', () => {
 const schema = load('booking-card-v1.schema.json');
 for (const x of ['bookingMode','verificationState','source','totalAmountMinor','quoteCheckedAt','quoteExpiresAt','quoteId'])
   assert.ok(schema.properties[x], 'missing ' + x);
 assert.equal(schema.additionalProperties, false);
 assert.ok(schema.allOf.length > 0, 'direct booking must be gated');
});
test('reviewed partner seeds cannot be silently presented as live inventory', () => {
 const seed = load('partner-review-seeds-v1.json');
 assert.equal(seed.public, false);
 assert.ok(seed.records.length > 0);
 for (const p of seed.records) {
   assert.equal(p.public, false, p.id);
   assert.equal(p.verificationState, 'review_required', p.id);
   assert.equal(p.bookingMode, 'assisted_enquiry', p.id);
   assert.equal(p.priceAmountMinor, null, p.id);
   assert.equal(p.availability, null, p.id);
   assert.deepEqual(p.photoUrls, [], p.id);
 }
});
