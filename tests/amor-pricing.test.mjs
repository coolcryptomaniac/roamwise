import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nightCost, priceStay, pricePackage, MARKUP } from '../worker/lib/amor-pricing.js';
import { PACKAGES } from '../worker/lib/amor-packages.js';
import { publicRates, publicPackageList, price, amorBookingLines } from '../worker/handlers/stay-cashfree.js';

const NOW = Date.parse('2026-11-13T06:00:00Z');
const ceil10 = (n) => Math.ceil(n / 10) * 10;

test('markup is exactly 7% commission plus 18% GST on the commission', () => {
  assert.equal(Math.round(MARKUP * 10000), 10826);
});

test('tax-exclusive sheets get hotel GST: 5% up to Rs 7,500 a night, 18% above', () => {
  assert.equal(nightCost('tattwaa', 'forest', 'CP', '2027-02-08').cost, 5500 * 1.05);
  assert.equal(nightCost('tattwaa', 'junior', 'AP', '2027-02-08').cost, 7750 * 1.18);
  assert.equal(nightCost('padma', 'king', 'EP', '2027-02-08').cost, 9999 * 1.18);
  assert.equal(nightCost('nanau', 'studio', 'CP', '2027-02-08').cost, 5500); // sheet is tax inclusive
  assert.equal(nightCost('aramness', 'kothi', 'AP', '2027-02-08').cost, 72216);
});

test('season tables and supplements follow each sheet', () => {
  assert.equal(nightCost('padma', 'royal', 'MAP', '2026-12-20').cost, 8125 * 1.18); // blackout table, tariff above 7,500
  assert.equal(nightCost('padma', 'royal', 'MAP', '2027-01-23').cost, 8125 * 1.18); // listed long weekend
  assert.equal(nightCost('nanau', 'pebble', 'MAP', '2027-01-24').cost, 7000 + 1500); // peak supplement
  assert.equal(nightCost('aramness', 'family', 'AP', '2026-12-31').cost, 101244); // blackout net
  assert.throws(() => nightCost('tattwaa', 'forest', 'CP', '2026-12-25'), /festive packages/);
  assert.throws(() => nightCost('aramness', 'kothi', 'AP', '2027-03-02'), /bookable online/);
});

test('Aramness is sold as an exclusive deal below its published rate, conservation fee once per stay', () => {
  const r = publicRates().aramness.rooms.kothi;
  assert.ok(r.perNight.AP < r.publishedRate);
  const q = price({ stay: 'aramness', room: 'kothi', plan: 'AP', checkin: '2027-02-08', checkout: '2027-02-10', paymentType: 'full' }, NOW);
  assert.equal(q.total, ceil10((72216 * 2 + 1500) * MARKUP));
});

test('advance never falls below what Amor needs at booking', () => {
  const padma = price({ stay: 'padma', room: 'royal', plan: 'EP', checkin: '2027-02-08', checkout: '2027-02-10', paymentType: 'advance' }, NOW);
  assert.equal(padma.portion, 50);
  const gir = price({ stay: 'aramness', room: 'kothi', plan: 'AP', checkin: '2027-02-08', checkout: '2027-02-10', paymentType: 'advance' }, NOW);
  assert.equal(gir.portion, 25);
  const soon = price({ stay: 'aramness', room: 'kothi', plan: 'AP', checkin: '2026-11-20', checkout: '2026-11-22', paymentType: 'advance' }, NOW);
  assert.equal(soon.amount, soon.total); // balance would be due 30 days before arrival, so pay in full
  const safari = pricePackage({ package: 'gir-lion-honeymoon', checkin: '2027-02-08', paymentType: 'advance' }, NOW).quote;
  assert.ok(safari.portion > 25); // the safari is 100% prepaid
});

test('every package prices at its from-date, and the homepage shows exactly that price', async () => {
  const fs = await import('node:fs');
  const html = fs.readFileSync('index.html', 'utf8');
  for (const k of publicPackageList()) {
    assert.ok(k.from && k.from.total > 0, k.id);
    assert.match(html, new RegExp('data-rw-pkg="' + k.id + '" data-rw-from="' + k.from.total + '"'), k.id + ' homepage price is stale');
  }
  const pub = publicRates();
  for (const [id, room, plan] of [['nanau', 'studio', 'CP'], ['padma', 'royal', 'EP'], ['aramness', 'kothi', 'AP'], ['tattwaa', 'forest', 'CP']]) {
    assert.match(html, new RegExp('data-rw-stay="' + id + '" data-rw-from="' + pub[id].rooms[room].perNight[plan] + '"'), id + ' homepage price is stale');
  }
});

test('peak dates suggest a cheaper start nearby', () => {
  const q = pricePackage({ package: 'corbett-plunge-honeymoon', checkin: '2026-12-26', paymentType: 'full' }, NOW).quote;
  assert.ok(q.peakNights > 0 && q.cheaperDate && q.cheaperDate.save > 0);
});

test('weddings: whole villa, extra guests add extra beds, blackout dates are non-refundable', () => {
  const base = pricePackage({ package: 'manali-mountain-pheras', checkin: '2027-02-08', paymentType: 'full' }, NOW).quote;
  const more = pricePackage({ package: 'manali-mountain-pheras', checkin: '2027-02-08', paymentType: 'full', extraGuests: 8 }, NOW).quote;
  assert.equal(base.guests, 12); assert.equal(more.guests, 20); assert.ok(more.total > base.total);
  const xmas = pricePackage({ package: 'manali-white-christmas', checkin: '2026-12-28', paymentType: 'advance' }, NOW).quote;
  assert.equal(xmas.nonRefundable, true);
  assert.throws(() => pricePackage({ package: 'manali-white-christmas', checkin: '2027-02-08', paymentType: 'full' }, NOW), /starts between/);
});

test('quotes and public data never carry supplier nets; Amor email does', () => {
  const pub = JSON.stringify({ r: publicRates(), p: publicPackageList() });
  for (const net of ['72216', '97793', '"cost"', 'supplierNet']) assert.ok(!pub.includes(net), net);
  for (const id of Object.keys(PACKAGES)) {
    const k = PACKAGES[id], d = (k.window && k.window.from) || '2027-02-08';
    const r = pricePackage({ package: id, checkin: d, paymentType: 'full' }, NOW);
    assert.ok(!JSON.stringify(r.quote).includes('"cost"'), id);
    assert.ok(r.quote.total >= r.cost * 1.08, id + ' margin'); // at least ~8% over cost after rounding
    const lines = amorBookingLines({ property: k.name, supplierNet: r.supplierNet }).join('\n');
    assert.match(lines, /Total net to Amor: Rs /); assert.ok(!lines.includes(String(r.quote.total.toLocaleString('en-IN'))) || r.quote.total === Math.round(r.cost), id);
  }
});

test('room counts respect the inventory on the sheet', () => {
  assert.throws(() => priceStay({ stay: 'nanau', room: 'suite2', plan: 'CP', rooms: 2, checkin: '2027-02-08', checkout: '2027-02-09', paymentType: 'full' }, NOW), /Only 1/);
  assert.throws(() => priceStay({ stay: 'padma', room: 'king', plan: 'CP', rooms: 3, checkin: '2027-02-08', checkout: '2027-02-09', paymentType: 'full' }, NOW), /Only 1/);
});
