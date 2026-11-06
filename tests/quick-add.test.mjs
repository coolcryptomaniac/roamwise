import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecord, normalizePhone, splitPlaces, parseReplyText, instagramLink, prefillFromQuery } from '../creators/quick-add-core.mjs';
import { creatorOf, flagsOf } from '../creators/roster-core.mjs';
import { resolveLocation } from '../creators/local-barter-core.mjs';

const ctx = { today: '2026-11-06', nowIso: '2026-11-06T05:00:00.000Z', adminUid: 'adm1' };
const harry = {
  via: 'email-reply', name: 'Harry Rawat (Bheem Pahadi)', email: 'Harryrawathr10@gmail.com', town: 'Uttarkashi',
  places: 'Uttarkashi, Harsil Valley, Gangotri, Dayara Bugyal and Tehri', youtube: 'https://youtube.com/@bheempahadivlogs', instagram: '@bheempahadi10',
  niche: 'Travel, Trekking, Camping', viewsMin: 5000, viewsMax: 10000, radiusKm: 100, region: 'Garhwal', dealTypes: 'paid, hybrid, selective barter', said: 'Open to paid and hybrid.',
};

test('phone numbers normalise to +91 or are rejected', () => {
  assert.equal(normalizePhone('98765 43210'), '+919876543210');
  assert.equal(normalizePhone('+91-98765-43210'), '+919876543210');
  assert.equal(normalizePhone('09876543210'), '+919876543210');
  assert.equal(normalizePhone('12345'), '');
});

test('places split on commas and "and", without duplicates', () => {
  assert.deepEqual(splitPlaces('Uttarkashi, Harsil Valley and Gangotri, uttarkashi'), ['Uttarkashi', 'Harsil Valley', 'Gangotri']);
});

test('creator record keeps everything he said and the founder match rules', () => {
  const r = buildRecord('creator', harry, ctx);
  assert.equal(r.ok, true, r.errors.join());
  const x = r.record;
  assert.equal(x.seg, 'creator');
  assert.equal(x.email, 'harryrawathr10@gmail.com');
  assert.equal(x.stage, 'contacted');
  assert.equal(x.handle, 'https://youtube.com/@bheempahadivlogs');
  assert.equal(x.barter.instagram, 'https://www.instagram.com/bheempahadi10/');
  assert.deepEqual(x.barter.coverage.places, ['Uttarkashi', 'Harsil Valley', 'Gangotri', 'Dayara Bugyal', 'Tehri']);
  assert.equal(x.barter.coverage.radiusKm, 100);
  assert.equal(x.barter.metrics.avgViews, 7500);
  assert.equal(x.barter.metrics.estimatedByFounder, true);
  assert.equal(x.verbalConfirmation.via, 'email-reply');
  assert.equal(x.formSubmitted, false);
});

test('a founder entry can never award tier, code, Pro or sales', () => {
  const x = buildRecord('creator', { ...harry, tier: 'featured', code: 'RW-C-X', proGranted: true, refSales: 9 }, ctx).record;
  assert.equal(x.tier, 'applied'); assert.equal(x.code, ''); assert.equal(x.refSales, 0); assert.equal(x.refRevenue, 0);
  assert.ok(!('proGranted' in x));
});

test('the saved creator works with the existing roster and location matcher', () => {
  const x = { id: 'a1', ...buildRecord('creator', { ...harry, phone: '9876543210' }, ctx).record };
  const c = creatorOf(x);
  assert.equal(c.name, 'Harry Rawat (Bheem Pahadi)');
  assert.equal(c.phone, '+919876543210');
  assert.equal(resolveLocation(c.location).known, true);
  assert.deepEqual(flagsOf(c, [c]).filter((f) => /profile link|location/.test(f)), []);
});

test('missing pieces are reported, nothing half-saved', () => {
  assert.equal(buildRecord('creator', { name: 'A' }, ctx).ok, false);
  assert.equal(buildRecord('creator', { ...harry, email: 'not-an-email' }, ctx).ok, false);
  assert.equal(buildRecord('creator', { ...harry, via: '' }, ctx).ok, false);
  assert.equal(buildRecord('creator', { ...harry, youtube: 'http://insecure', instagram: '' }, ctx).ok, false);
  assert.equal(buildRecord('nope', harry, ctx).ok, false);
});

test('artist, property and transport records are marked verbal-confirmed and unpublished', () => {
  const a = buildRecord('artist', { via: 'phone-call', name: 'Asha', phone: '9812345678', town: 'Almora', themes: 'aipan' }, ctx).record;
  assert.equal(a.seg, 'artist'); assert.equal(a.status, 'verbal-confirmed'); assert.equal(a.photosReceived, false);
  const p = buildRecord('property', { via: 'in-person', name: 'Hill Homestay', phone: '9812345678', town: 'Binsar', rooms: 4 }, ctx).record;
  assert.equal(p.seg, 'property'); assert.equal(p.mouAccepted, false); assert.equal(p.roomsApprox, 4);
  const t = buildRecord('transport', { via: 'whatsapp', name: 'Bhupi Taxi', phone: '9812345678', town: 'Haldwani', places: 'Kathgodam, Almora', vehicles: 'Innova' }, ctx).record;
  assert.equal(t.seg, 'transport'); assert.equal(t.licenceChecked, false); assert.deepEqual(t.routes, ['Kathgodam', 'Almora']);
});

test('reply parsing picks contact details, ignores the quoted founder mail and roamwise addresses', () => {
  const mail = 'Hi Mohit,\nYes I am interested. Call me on +91 98765 43210.\nhttps://youtube.com/@bheempahadivlogs\n\nBest regards,\nBheem Pahadi\n\nOn Fri, 6 Nov, 2026, 9:15 am Mohit Pandey <founder@roamwise.co.in> wrote:\n> reach me at someone@else.com';
  const p = parseReplyText(mail);
  assert.equal(p.phone, '+919876543210'); assert.equal(p.name, 'Bheem Pahadi'); assert.equal(p.email, '');
  assert.deepEqual(p.urls, ['https://youtube.com/@bheempahadivlogs']);
});

test('instagram handles and query prefill are safe', () => {
  assert.equal(instagramLink('bad handle!'), '');
  assert.equal(prefillFromQuery('?name=A%3Cb%3E&evil=1').evil, undefined);
  assert.equal(prefillFromQuery('?name=A%3Cb%3E').name, 'A b');
});
