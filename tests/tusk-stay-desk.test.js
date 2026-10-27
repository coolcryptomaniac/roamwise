'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

const ROOMS = [
  { id: 'r1', property: 'Pine <Nest>', room: 'Cottage', area: 'Kasar Devi', zone: 'Almora', price: 2800, cancel: 'Free cancellation up to 48h before check-in', bookable: true, paymentEnabled: true, maxGuests: 4 },
  { id: 'r2', property: 'No Rate Villa', room: 'Suite', zone: 'Almora', price: 0, bookable: true, paymentEnabled: true }
];
function load(rooms){
  const calls = [];
  const s = { console, window: null, RW_BOOK_TERMS: { commissionPct: 7 }, track: () => {}, cpFinish: (b, h) => calls.push(h),
    rwTuskStayMatches: () => rooms.slice() };
  s.window = s;
  for(const f of ['js/booking/stay-quote.js', 'js/booking/tusk-stay-desk.js']) vm.runInNewContext(read(f), s, { filename: f });
  s.calls = calls; return s;
}
const NOW = new Date('2026-10-16T09:30:00+05:30');

test('reads date ranges, nights and guests from natural messages, never guessing an end date', () => {
  const s = load(ROOMS);
  assert.deepEqual({ ...s.rwSdParseDates('book a room 12 to 15 Nov', NOW) }, { checkIn: '2026-11-12', checkOut: '2026-11-15', nights: 3 });
  assert.equal(s.rwSdParseDates('stay 20-22 december', NOW).nights, 2);
  assert.equal(s.rwSdParseDates('book a room 20 Nov for 3 nights', NOW).checkOut, '2026-11-23');
  assert.equal(s.rwSdParseDates('book a room tomorrow for 2 nights', NOW).checkIn, '2026-10-17');
  assert.equal(s.rwSdParseDates('book a room 5 Jan to 7 Jan', NOW).checkIn, '2027-01-05', 'past month rolls to next year');
  assert.equal(s.rwSdParseDates('book a room on 20 Nov', NOW), null, 'start only: ask, do not guess');
  assert.equal(s.rwSdGuests('room for 2 guests'), 2);
  assert.equal(s.rwSdGuests('room for 4 people'), 4);
  assert.equal(s.rwSdGuests('room under 3000'), 0);
});

test('only clear booking asks trigger the desk', () => {
  const s = load(ROOMS);
  assert.equal(s.rwSdIsStayAsk('book a room in Manali'), true);
  assert.equal(s.rwSdIsStayAsk('best hotels in Manali'), false);
  assert.equal(s.rwSdIsStayAsk('book a train to Delhi'), false);
});

test('receipt shows the property rate, Rs 0 from RoamWise, the property terms, and a prefilled link', () => {
  const s = load(ROOMS);
  const a = s.rwStayDeskAnswer('book a room 12 to 15 Nov for 2 guests', 'Almora', NOW);
  const text = a.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.match(text, /₹2,800 × 3 nights = ₹8,400/);
  assert.match(text, /RoamWise charges you ₹0/);
  assert.match(text, /The property keeps ₹7,812 of ₹8,400/);
  assert.match(text, /Free cancellation up to 48h/);
  assert.match(text, /Nothing is taken until the property confirms/);
  assert.match(text, /not a confirmed quote or reservation/);
  assert.match(text, /Choose your payment method in the booking desk/);
  assert.doesNotMatch(text, /You pay the property/);
  assert.match(text, /Changes &amp; refunds/);
  assert.match(a.html, /checkin=2026-11-12&amp;checkout=2026-11-15&amp;guests=2/);
  assert.ok(!a.html.includes('<Nest>'), 'property names are escaped');
  assert.doesNotMatch(text, /GST added|cheaper than|save \d/i, 'no invented taxes or price comparisons');
});

test('missing rate says so, missing dates ask, no inventory refuses to guess', () => {
  const s = load([ROOMS[1]]);
  assert.match(s.rwStayDeskAnswer('book a room 12 to 15 Nov', 'Almora', NOW).html, /Rate on request/);
  assert.match(s.rwStayDeskAnswer('book a room in Almora', 'Almora', NOW).html, /Tell me the dates/);
  const none = load([]);
  assert.match(none.rwStayDeskAnswer('book a room 12 to 15 Nov', 'Almora', NOW).html, /will not guess availability/);
  assert.equal(none.rwStayDeskAnswer('what is the weather', 'Almora', NOW), null);
});

test('this change leaves payment, auth and rules files untouched', () => {
  const src = read('js/booking/tusk-stay-desk.js').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(src, /firebase|firestore|cashfree|razorpay|upi:|fetch\(/i);
});
