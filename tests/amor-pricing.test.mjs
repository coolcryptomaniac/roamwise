import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setAmorRates, advanceShare } from '../worker/lib/amor-rates.js';
import { nightCost, priceStay, pricePackage, MARKUP } from '../worker/lib/amor-pricing.js';
import { marginOf, sellFor, POLICY } from '../worker/lib/amor-policy.js';
import { PACKAGES } from '../worker/lib/amor-packages.js';
import { publicRates, publicPackageList, price, amorBookingLines } from '../worker/handlers/stay-cashfree.js';

// Made-up numbers with the real structure: Amor's net rates are sealed and never in this repository.
const BOOK = JSON.parse(fs.readFileSync(new URL('./fixtures/amor-rates.sample.json', import.meta.url), 'utf8'));
setAmorRates(BOOK);
const P = BOOK.properties, NOW = Date.parse('2026-11-13T06:00:00Z');
const ceil10 = (n) => Math.ceil(n / 10) * 10;

test('no supplier net rate is committed in worker code', () => {
  for (const f of ['worker/lib/amor-rates.js', 'worker/lib/amor-pricing.js', 'worker/lib/amor-packages.js', 'worker/handlers/stay-cashfree.js']) {
    const src = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /\brates: *\{|\bnet: *\d|\brack: *\d/, f + ' holds a rate');
  }
  const sealed = JSON.parse(fs.readFileSync('worker/data/amor-rates.sealed.json', 'utf8'));
  assert.ok(!JSON.stringify(sealed).includes('"rooms"'), 'sealed rate book must be ciphertext');
});

test('policy: 7% floor (commission + GST), 20% base margin, 200% markup cap (same rule as PR #695)', () => {
  assert.equal(Math.round(MARKUP * 10000), 10826);
  assert.equal(POLICY.baseMargin, 0.20); assert.equal(POLICY.maxMarkup, 2);
});

test('tax-exclusive sheets get hotel GST: 5% up to Rs 7,500 a night, 18% above', () => {
  const tf = P.tattwaa.rooms.forest.rates.CP, pk = P.padma.rooms.king.rates.EP;
  assert.equal(nightCost('tattwaa', 'forest', 'CP', '2027-02-08').cost, tf * 1.05);
  assert.equal(nightCost('padma', 'king', 'EP', '2027-02-08').cost, pk * 1.18);
  assert.equal(nightCost('nanau', 'studio', 'CP', '2027-02-08').cost, P.nanau.rooms.studio.rates.CP); // tax inclusive
});

test('season tables and supplements follow each sheet', () => {
  const r = P.padma.rooms.royal.peak.MAP;
  assert.equal(nightCost('padma', 'royal', 'MAP', '2026-12-20').cost, r * (r > 7500 ? 1.18 : 1.05));
  assert.equal(nightCost('nanau', 'pebble', 'MAP', '2027-01-24').cost, P.nanau.rooms.pebble.rates.MAP + P.nanau.peakSupplement);
  assert.equal(nightCost('aramness', 'family', 'AP', '2026-12-31').cost, P.aramness.rooms.family.peak.AP);
  assert.throws(() => nightCost('tattwaa', 'forest', 'CP', '2026-12-25'), /festive packages/);
  assert.throws(() => nightCost('aramness', 'kothi', 'AP', '2027-03-02'), /bookable online/);
});

test('every stay and package earns at least 20% unless a public price caps it; never below the floor or above 3x', () => {
  for (const id of Object.keys(PACKAGES)) {
    const k = PACKAGES[id];
    for (const d of [(k.window && k.window.from) || '2027-02-08', (k.window && k.window.from) || '2027-02-12']) {
      const r = pricePackage({ package: id, checkin: d, paymentType: 'full' }, NOW, false);
      assert.ok(r.quote.total >= r.cost * MARKUP - 1, id + ' below floor');
      assert.ok(r.quote.total <= r.cost * 3, id + ' above 200% markup');
      if (!r.quote.saving) assert.ok(marginOf(r.quote.total, r.cost).margin >= 0.199, id);
    }
  }
  const n = priceStay({ stay: 'nanau', room: 'studio', plan: 'CP', checkin: '2027-02-08', checkout: '2027-02-10', paymentType: 'full' }, NOW).quote;
  assert.equal(n.total, ceil10(2 * sellFor(P.nanau.rooms.studio.rates.CP, 0.20)));
});

test('Aramness is never dearer than the lodge\'s published rate; fee passes through at cost', () => {
  const k = P.aramness.rooms.kothi, fee = P.aramness.perStayFee.amount;
  assert.ok(publicRates().aramness.rooms.kothi.perNight.AP < k.rack);
  const q = price({ stay: 'aramness', room: 'kothi', plan: 'AP', checkin: '2027-02-08', checkout: '2027-02-10', paymentType: 'full' }, NOW);
  assert.equal(q.total, Math.floor((k.rack * 2 + fee) * 0.99 / 10) * 10);
  assert.ok(q.saving > 0);
  assert.ok(pricePackage({ package: 'gir-lion-honeymoon', checkin: '2027-02-08', paymentType: 'full' }, NOW).quote.saving > 0);
});

test('advance: matches each property (Corbett 30/50%, Padma 50%, Gir 25%), full inside the property\'s final-payment window; safaris 100%', () => {
  assert.equal(advanceShare('corbett', 40), 0.30); assert.equal(advanceShare('corbett', 20), 0.50); assert.equal(advanceShare('corbett', 8), 0.50); assert.equal(advanceShare('corbett', 5), 1);
  assert.equal(advanceShare('padma', 40), 0.5); assert.equal(advanceShare('padma', 6), 1);
  assert.equal(advanceShare('aramness', 40), 0.25); assert.equal(advanceShare('aramness', 20), 1);
  const q = (stay, room, plan, ci, co) => price({ stay, room, plan, checkin: ci, checkout: co, paymentType: 'advance' }, NOW);
  assert.equal(q('nanau', 'studio', 'CP', '2027-02-08', '2027-02-10').portion, 30);
  assert.equal(q('padma', 'royal', 'EP', '2027-02-08', '2027-02-10').portion, 50);
  const soon = q('aramness', 'kothi', 'AP', '2026-11-20', '2026-11-22'); assert.equal(soon.amount, soon.total);
  assert.ok(pricePackage({ package: 'gir-lion-honeymoon', checkin: '2027-02-08', paymentType: 'advance' }, NOW).quote.portion > 25);
});

test('peak dates suggest a cheaper start nearby', () => {
  const q = pricePackage({ package: 'corbett-plunge-honeymoon', checkin: '2026-12-26', paymentType: 'full' }, NOW).quote;
  assert.ok(q.peakNights > 0 && q.cheaperDate && q.cheaperDate.save > 0);
});

test('weddings: whole villa, extra guests add beds, festive dates are non-refundable', () => {
  const base = pricePackage({ package: 'manali-mountain-pheras', checkin: '2027-02-08', paymentType: 'full' }, NOW).quote;
  const more = pricePackage({ package: 'manali-mountain-pheras', checkin: '2027-02-08', paymentType: 'full', extraGuests: 8 }, NOW).quote;
  assert.equal(base.guests, 12); assert.equal(more.guests, 20); assert.ok(more.total > base.total);
  assert.equal(pricePackage({ package: 'manali-white-christmas', checkin: '2026-12-28', paymentType: 'advance' }, NOW).quote.nonRefundable, true);
  assert.throws(() => pricePackage({ package: 'manali-white-christmas', checkin: '2027-02-08', paymentType: 'full' }, NOW), /starts between/);
});

test('quotes and public data never carry supplier costs; Amor email does', () => {
  const pub = JSON.stringify({ r: publicRates(), p: publicPackageList(NOW) });
  assert.ok(!pub.includes('"cost"') && !pub.includes('supplierNet') && !pub.includes('"rates"'));
  for (const id of Object.keys(PACKAGES)) {
    const k = PACKAGES[id], r = pricePackage({ package: id, checkin: (k.window && k.window.from) || '2027-02-08', paymentType: 'full' }, NOW);
    assert.ok(!JSON.stringify(r.quote).includes('"cost"'), id);
    assert.match(amorBookingLines({ property: k.name, supplierNet: r.supplierNet }).join('\n'), /Total net to Amor: Rs /);
  }
});

test('room counts respect the inventory on the sheet', () => {
  assert.throws(() => priceStay({ stay: 'nanau', room: 'suite2', plan: 'CP', rooms: 2, checkin: '2027-02-08', checkout: '2027-02-09', paymentType: 'full' }, NOW), /Only 1/);
});

test('homepage cards carry engine hooks for every package', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  for (const id of Object.keys(PACKAGES)) assert.match(html, new RegExp('data-rw-pkg="' + id + '" data-rw-from="\\d+"'), id);
});

test('inside the final-payment window the full amount is due now, never a balance date in the past', () => {
  const g = pricePackage({ package: 'gir-lion-honeymoon', checkin: '2026-11-13', paymentType: 'advance' }, NOW).quote;
  assert.equal(g.fullOnly, true); assert.equal(g.amount, g.total); assert.equal(g.balance, 0); assert.equal(g.balanceDueBy, null);
  const far = pricePackage({ package: 'gir-lion-honeymoon', checkin: '2027-01-20', paymentType: 'advance' }, NOW).quote;
  assert.ok(!far.fullOnly && far.balance > 0 && far.balanceDueBy > '2026-11-13');
  const pub = publicPackageList(NOW).find((k) => k.id === 'manali-mountain-pheras');
  assert.ok(pub.properties.some((p) => p.id === 'padma'), 'wedding checkout names Padma Villa');
});
