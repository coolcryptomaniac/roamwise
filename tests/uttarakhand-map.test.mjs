import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { cleanPlaces, cleanDistricts, partnersForDistrict, partnerPins, mapsLink, searchDistricts, isPublicPartner, partnersForPlace, partnerCard, tierOf, searchPlaces } from '../map/map-core.mjs';

const places = cleanPlaces(JSON.parse(readFileSync(new URL('../map/places.json', import.meta.url), 'utf8')));
const districts = cleanDistricts(JSON.parse(readFileSync(new URL('../map/districts.json', import.meta.url), 'utf8')), places);
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

test('districts: all 13 are present, valid and every place belongs to exactly one', () => {
  assert.equal(districts.length, 13);
  assert.deepEqual([...new Set(districts.map((d) => d.region))].sort(), ['Garhwal', 'Kumaon']);
  districts.forEach((d) => { assert.ok(d.tagline && d.traits.length >= 3, d.id); });
  places.forEach((p) => {
    const d = districts.find((x) => x.id === p.district); assert.ok(d, p.id + ' has no district');
    assert.ok(d.places.includes(p.id), p.id + ' not listed in ' + p.district);
    assert.equal(districts.filter((x) => x.places.includes(p.id)).length, 1, p.id);
  });
});

test('districts: Kedarnath and Badrinath are separate pins in different districts', () => {
  const k = places.find((p) => p.id === 'kedarnath'), b = places.find((p) => p.id === 'badrinath');
  assert.equal(k.district, 'rudraprayag'); assert.equal(b.district, 'chamoli');
  assert.ok(b.lng - k.lng > 0.3, 'Badrinath is east of Kedarnath');
  assert.ok(!places.some((p) => p.id === 'chardham'));
});

test('districts: partners land in the right district; Himachal partners never appear', () => {
  const d = (id) => districts.find((x) => x.id === id);
  assert.deepEqual([...partnersForDistrict(seed, d('almora')).map((p) => p.name)].sort(), ['Big Bro Hotel', 'Milan Heights', 'Soulmate Homestay']);
  assert.deepEqual([...partnersForDistrict(seed, d('pauri-garhwal')).map((p) => p.name)], ['Corbett Jungle View Homestay']);
  const all = districts.flatMap((x) => partnersForDistrict(seed, x).map((p) => p.name));
  assert.ok(!all.some((n) => /Himank|Woodbook/.test(n)));
  assert.equal(partnersForDistrict([{ listingReady: true, verified: 'listed', zone: 'Almora' }], d('almora')).length, 0);
});

test('pins: town-level, flagged approximate, with a Google Maps search link and no contact details', () => {
  const almora = districts.find((x) => x.id === 'almora'), pins = partnerPins(seed, almora, places), town = places.find((p) => p.id === 'almora');
  assert.equal(pins.length, 3);
  pins.forEach((pin, i) => { assert.equal(pin.approx, true); assert.equal(pin.lat, town.lat); assert.equal(pin.lng, town.lng); assert.equal(pin.slot, i); assert.equal(pin.of, 3);
    assert.match(pin.maps, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/); assert.doesNotMatch(JSON.stringify(pin), /wa\.me|@|\d{10}/); });
  assert.equal(mapsLink({ name: 'A & B', area: 'x<y' }).includes('<'), false);
});

test('districts: bad rows dropped, search covers traits and place names', () => {
  assert.deepEqual(cleanDistricts([null, { id: 'x', name: 'X', region: 'Nowhere', lat: 30, lng: 78 }, { id: 'y', name: 'Y', region: 'Kumaon', lat: 5, lng: 5 }], places), []);
  const one = cleanDistricts([{ id: 'z', name: 'Z', region: 'Kumaon', lat: 29.5, lng: 79, zoom: 99, traits: ['<b>a</b>'], places: ['almora', 'nope'], zones: ['Almora'] }], places)[0];
  assert.equal(one.zoom, 10); assert.deepEqual([...one.places], ['almora']); assert.doesNotMatch(one.traits[0], /[<>]/);
  assert.deepEqual(searchDistricts(districts, places, 'kedarnath').map((d) => d.id), ['rudraprayag']);
  assert.equal(searchDistricts(districts, places, '').length, 13);
});

test('partner card photo is a safe relative asset path or null', () => {
  const c = partnerCard({ id: 'x', name: 'X', verified: 'signed', photos: [{ src: 'https://evil.example/a.jpg' }, { src: 'assets/property-photos/a.webp', alt: 'A' }] });
  assert.deepStrictEqual(c.photo, { src: 'assets/property-photos/a.webp', alt: 'A' });
  assert.strictEqual(partnerCard({ id: 'y', name: 'Y', verified: 'signed', photos: [{ src: '../../etc/passwd.jpg' }] }).photo, null);
  assert.strictEqual(partnerCard({ id: 'z', name: 'Z', verified: 'signed' }).photo, null);
});
