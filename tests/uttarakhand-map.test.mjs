import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { cleanPlaces, isPublicPartner, partnersForPlace, partnerCard, tierOf, searchPlaces } from '../map/map-core.mjs';

const places = cleanPlaces(JSON.parse(readFileSync(new URL('../map/places.json', import.meta.url), 'utf8')));
const win = {}; vm.runInNewContext(readFileSync(new URL('../partners-data.js', import.meta.url), 'utf8'), { window: win });
const seed = [...win.RW_PARTNER_SEED];

test('map: every shipped place is valid, unique and inside Uttarakhand', () => {
  assert.ok(places.length >= 12);
  assert.equal(new Set(places.map((p) => p.id)).size, places.length);
  places.forEach((p) => { assert.ok(p.name && p.blurb); assert.ok(p.food.length && p.culture.length); assert.ok(p.travel.reach); });
});

test('map: bad rows, coordinates outside the state and unsafe links are dropped', () => {
  const out = cleanPlaces([null, { id: 'a', name: 'A', region: 'Kumaon', lat: 10, lng: 10 }, { id: 'b', name: 'B', region: 'Nowhere', lat: 29.5, lng: 79 },
    { id: 'c', name: '<b>C</b>', region: 'Garhwal', lat: 30, lng: 78, page: 'https://evil.example/', zone: 'C' }]);
  assert.deepEqual(out.map((p) => p.id), ['c']);
  assert.equal(out[0].page, ''); assert.doesNotMatch(out[0].name, /[<>]/);
});

test('map: the eligibility rule matches the one the Stays pages use', () => {
  for (const p of seed) assert.equal(isPublicPartner(p), !!win.rwStayPublicEligible(p), p.id);
  assert.equal(isPublicPartner({ listingReady: true, verified: 'listed' }), false);
  assert.equal(isPublicPartner(null), false);
});

test('map: Almora shows its signed stays, Lansdowne shows the founder-introduced homestay as enquiry only', () => {
  const by = (id) => partnersForPlace(seed, places.find((p) => p.id === id));
  const almora = by('almora').map((p) => p.name);
  assert.ok(almora.includes('Milan Heights') && almora.includes('Big Bro Hotel'));
  const lans = by('lansdowne');
  assert.deepEqual([...lans.map((p) => p.name)], ['Corbett Jungle View Homestay']);
  assert.equal(tierOf(lans[0]).enquiryOnly, true);
  assert.equal(by('nainital').length, 0);
});

test('map: partner cards never carry phone numbers, emails or WhatsApp links', () => {
  seed.forEach((p) => { const s = JSON.stringify(partnerCard(p)); assert.doesNotMatch(s, /\d{10}|@|wa\.me|whatsapp/i); });
});

test('map: search matches name, region or blurb', () => {
  assert.ok(searchPlaces(places, 'garhwal').length >= 3);
  assert.equal(searchPlaces(places, 'zzzz').length, 0);
  assert.equal(searchPlaces(places, '').length, places.length);
});
