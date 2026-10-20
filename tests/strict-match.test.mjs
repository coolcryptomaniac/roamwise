import test from 'node:test';
import assert from 'node:assert/strict';
import { nichesOf, nicheFit, normalizeNeeds, travelBand, photoOf, tripOf, travelAlerts, alertMessage } from '../creators/strict-match-core.mjs';
import { buildRoster } from '../creators/roster-core.mjs';
import { SEED_POLICIES, mergePolicies } from '../creators/property-terms-core.mjs';

test('free-text niches become canonical content types', () => {
  assert.deepEqual(nichesOf('hospitality and product commercials, travel filmmaker'), ['travel', 'photography', 'tech']);
  assert.ok(nichesOf('Foodie | street food reviews').includes('food'));
  assert.ok(nichesOf('standup comedy and skits').includes('comedy'));
  assert.deepEqual(nichesOf('all'), []);
  assert.deepEqual(nichesOf(''), []);
});

test('strict needs reject creators who do not make that content; no need accepts everyone', () => {
  const needs = normalizeNeeds({ niches: ['food', 'bogus'], strict: true });
  assert.deepEqual(needs.niches, ['food']);
  assert.equal(nicheFit(['travel'], needs).ok, false);
  assert.equal(nicheFit([], needs).ok, false);
  assert.equal(nicheFit(['food', 'travel'], needs).ok, true);
  assert.equal(nicheFit(['travel'], {}).ok, true);
  assert.equal(normalizeNeeds({ niches: [], strict: true }).strict, false);
});

test('distance bands: local to 150 km, far to 500, very far beyond', () => {
  assert.equal(travelBand(10), 'local'); assert.equal(travelBand(150), 'local');
  assert.equal(travelBand(151), 'far'); assert.equal(travelBand(500), 'far');
  assert.equal(travelBand(501), 'very_far'); assert.equal(travelBand(null), 'unknown');
});

const base = { barter: { location: { town: 'almora' }, ask: { guests: 2, nights: 1, food: 'breakfast' } }, handle: 'https://www.instagram.com/x/', phone: '919900000001' };
test('Milan Heights only matches food creators; the same creator still matches a property with no need', () => {
  const rows = buildRoster([
    { ...base, id: 'f', name: 'Foodie', niche: 'food, street food' },
    { ...base, id: 't', name: 'Traveller', niche: 'travel, vlog' },
    { ...base, id: 'c', name: 'Comic', niche: 'comedy' },
  ], SEED_POLICIES);
  const milan = (id) => rows.find((r) => r.id === id).matches.find((m) => m.propertyId === 'p_milan_heights');
  assert.notEqual(milan('f').verdict, 'no_fit');
  assert.equal(milan('t').verdict, 'no_fit'); assert.match(milan('t').why.join(' '), /needs food/);
  assert.equal(milan('c').verdict, 'no_fit');
  assert.notEqual(rows.find((r) => r.id === 't').matches.find((m) => m.propertyId === 'p_big_bro_hotel').verdict, 'no_fit');
});

test('bands and travel notes appear on matches; very far is never sent straight away', () => {
  const rows = buildRoster([{ ...base, id: 'b', name: 'Bengaluru Foodie', niche: 'food', barter: { ...base.barter, location: { town: 'bengaluru' } } },
    { ...base, id: 'd', name: 'Delhi Foodie', niche: 'food', barter: { ...base.barter, location: { town: 'delhi' } } }], SEED_POLICIES);
  const m = (id) => rows.find((r) => r.id === id).matches.find((x) => x.propertyId === 'p_milan_heights');
  assert.equal(m('b').band, 'very_far'); assert.notEqual(m('b').verdict, 'send'); assert.ok(m('b').bandNote.length > 10);
  assert.equal(m('d').band, 'far');
});

test('photo links must be https and trips need a town and an end date', () => {
  assert.equal(photoOf({ barter: { photoUrl: 'https://example.com/a.jpg' } }), 'https://example.com/a.jpg');
  assert.equal(photoOf({ barter: { photoUrl: 'javascript:alert(1)' } }), '');
  assert.equal(photoOf({ photoUrl: 'http://example.com/a.jpg' }), '');
  assert.equal(tripOf({ barter: { trip: { town: 'Nainital', to: '2026-11-05' } } }).from, '2026-11-05');
  assert.equal(tripOf({ barter: { trip: { town: 'Nainital' } } }), null);
});

test('travel alert fires for a matching creator whose trip passes within 100 km of an open property', () => {
  const policies = mergePolicies(SEED_POLICIES, []);
  const rows = buildRoster([
    { ...base, id: 'f', name: 'Foodie', niche: 'food', barter: { ...base.barter, location: { town: 'delhi' }, trip: { town: 'nainital', from: '2026-11-02', to: '2026-11-05' } } },
    { ...base, id: 't', name: 'Traveller', niche: 'travel', barter: { ...base.barter, location: { town: 'delhi' }, trip: { town: 'nainital', from: '2026-11-02', to: '2026-11-05' } } },
    { ...base, id: 'x', name: 'Mumbai trip', niche: 'food', barter: { ...base.barter, trip: { town: 'mumbai', from: '2026-11-02', to: '2026-11-05' } } },
    { ...base, id: 'p', name: 'Past trip', niche: 'food', barter: { ...base.barter, trip: { town: 'nainital', from: '2026-09-01', to: '2026-09-03' } } },
  ], policies);
  const a = travelAlerts(rows, policies, '2026-10-30');
  assert.ok(a.some((x) => x.creatorId === 'f' && x.propertyId === 'p_milan_heights' && x.km <= 100));
  assert.ok(!a.some((x) => x.creatorId === 't' && x.propertyId === 'p_milan_heights'), 'strict niche still applies');
  assert.ok(!a.some((x) => x.creatorId === 'x'), 'Mumbai is not near anything');
  assert.ok(!a.some((x) => x.creatorId === 'p'), 'past trips never alert');
  assert.match(alertMessage(a[0], 'Asha'), /Hi Asha/);
});
