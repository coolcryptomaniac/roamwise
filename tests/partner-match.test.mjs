import test from 'node:test';
import assert from 'node:assert/strict';
import { matchStays, matchStay, ROLES, MIN_SCORE } from '../creators/partner-match-core.mjs';

const stays = [
  { id: 'a', name: 'Cafe Garden Stay', zone: 'Almora', area: 'Kotyura', hook: 'Cafe with garden terrace and mountain view', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '9199', photos: [1, 2, 3], nomad: { enabled: true } },
  { id: 'b', name: 'Plain Rooms', zone: 'Manali', area: 'Old Manali', hook: 'Rooms', verified: 'signed', listingReady: true },
  { id: 'c', name: 'Researched Only', zone: 'Almora', hook: 'cafe view', verified: 'listed' },
];
test('every role is accepted and unknown roles throw', () => {
  for (const r of ROLES) assert.ok(matchStay(r, { town: 'Almora' }, stays[0]).score >= 0);
  assert.throws(() => matchStay('bogus', {}, stays[0]));
});
test('painter, music and transport match to properties with reasons', () => {
  for (const r of ['painter', 'music', 'transport']) {
    const m = matchStays(r, { town: 'Almora' }, stays);
    assert.equal(m[0].id, 'a'); assert.ok(m[0].reasons.length >= 2); assert.equal(m[0].needsApproval, true);
  }
});
test('researched-only stays are never matched; weak fits return nothing', () => {
  assert.ok(!matchStays('painter', { town: 'Almora' }, stays).some((m) => m.id === 'c'));
  assert.deepEqual(matchStays('painter', { town: 'Manali' }, [stays[1]]), []);
});
test('different town lowers the score and says so', () => {
  const m = matchStay('creator', { town: 'Goa' }, stays[0]);
  assert.ok(m.unknown.some((u) => /Not in Goa/.test(u)));
  assert.ok(m.score < matchStay('creator', { town: 'Almora' }, stays[0]).score);
  assert.ok(MIN_SCORE > 0);
});

test('yoga teachers are matched to calm places with room to practise, with visible reasons', () => {
  const calm = { id: 'a', name: 'Forest Retreat', zone: 'Almora', area: 'Binsar road', hook: 'Quiet forest stay with a garden terrace and mountain views', badges: [], cat: 'stay', listingReady: true, photos: ['1'], verified: 'signed' };
  const busy = { id: 'b', name: 'City Inn', zone: 'Delhi', area: 'Karol Bagh', hook: 'Business hotel near the metro', badges: [], cat: 'stay', listingReady: true };
  const r = matchStays('yoga', { town: 'Almora' }, [calm, busy]);
  assert.equal(r.length, 1);
  assert.equal(r[0].name, 'Forest Retreat');
  assert.ok(r[0].reasons.some((x) => /retreat/i.test(x)) && r[0].reasons.some((x) => /practice space/i.test(x)));
  assert.equal(r[0].needsApproval, true);
  assert.deepEqual(matchStays('yoga', { town: 'Almora' }, [busy]), []);
});
