const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(partners, rooms = []) {
  const window = { RW_PARTNERS: partners, RW_ROOMS: rooms };
  const ctx = { window, isFinite, Number, URL, encodeURIComponent, esc2: v => String(v ?? '') };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('js/booking/routes.js', 'utf8'), ctx);
  return ctx;
}
const base = { id: 'p1', name: 'Stay', zone: 'Manali', verified: 'signed', listingReady: true };

test('no route means not operational', () => {
  const c = load([base]);
  assert.equal(c.rwBookingRoute(base).type, 'none');
  assert.equal(c.rwIsOperational(base), false);
  assert.equal(c.rwBookingActionHTML(base), '');
});

test('guests book through RoamWise only: host WhatsApp, phone and OTA links never reach the page', () => {
  const c = load([]);
  for (const p of [
    { ...base, bookingMode: 'whatsapp', bookingWhatsapp: '9876543210' },
    { ...base, bookingMode: 'phone', bookingPhone: '9876543210' },
    { ...base, bookingMode: 'ota', bookingUrl: 'https://www.makemytrip.com/hotels/x' },
    { ...base, bookingMode: 'website', bookingUrl: 'https://hotel.example/book', bookingPhone: '9876543210' },
    { ...base, bookingMode: 'roamwise' },
  ]) {
    const r = c.rwBookingRoute(p);
    assert.equal(r.type, 'roamwise', p.bookingMode);
    assert.equal(r.href, 'https://wa.me/919987379730');
    const html = c.rwBookingActionHTML(p);
    assert.doesNotMatch(html, /9876543210|tel:|makemytrip|hotel\.example/);
    assert.match(html, /Book through RoamWise/);
    assert.match(html, /Hello%20RoamWise%2C%20I%20would%20like%20to%20book%20Stay/);
  }
});

test('stays with a RoamWise checkout go straight to pick dates and pay, with RoamWise WhatsApp as the fallback', () => {
  const c = load([]);
  const amor = { ...base, id: 'p_amor_nanau', verified: 'founder-approved', enquiryOnly: true, founderApproval: 'Mohit Pandey · 2026-11-06', bookingMode: 'enquiry' };
  const routes = c.rwBookingRoutes(amor);
  assert.deepEqual(Array.from(routes, r => r.type), ['pay', 'roamwise']);
  assert.equal(routes[0].href, '/packages/amor-checkout.html?stay=nanau');
  const html = c.rwBookingActionHTML(amor);
  assert.match(html, /Pick dates &amp; pay|Pick dates & pay/);
  assert.match(html, /Or ask RoamWise on WhatsApp/);
  assert.equal(c.rwBookingRoute({ ...amor, founderApproval: '' }).type, 'none', 'unapproved introductions stay hidden');
});

test('direct needs a live partner, direct mode and a bookable priced room', () => {
  const room = { id: 'r1', partnerId: 'p1', bookable: true, paymentEnabled: true, price: 2500 };
  const direct = { ...base, bookingMode: 'direct' };
  assert.equal(load([direct], [room]).rwBookingRoute(direct).type, 'direct');
  assert.deepEqual(Array.from(load([direct], [room]).rwRoomsLive(), r => r.id), ['r1']);
  assert.equal(load([direct], [{ ...room, paymentEnabled: false }]).rwBookingRoute(direct).type, 'none');
  assert.equal(load([direct], [{ ...room, price: null }]).rwRoomsLive().length, 0);
  assert.equal(load([{ ...direct, verified: 'listed' }], [room]).rwRoomsLive().length, 0, 'unsigned partner rooms never show');
  assert.equal(load([base], [room]).rwRoomsLive().length, 0, 'rooms of a non-direct partner never show');
});

test('shipped room data cannot leak: no unsigned or unmatched room is live', () => {
  const ctx = { window: {}, isFinite, Number, URL };
  vm.createContext(ctx);
  for (const f of ['partners-data.js', 'rooms-data.js', 'js/booking/routes.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
  assert.equal(ctx.rwRoomsLive().length, 0);
});


test('booking responsibilities: RoamWise confirms, collects payment and refunds', () => {
  const c = load([]);
  const text = type => JSON.stringify(c.rwBookingResponsibilities({type}));
  assert.match(text('direct'), /accept the total/);
  assert.match(text('pay'), /full refund/);
  assert.match(text('roamwise'), /secure payment link/);
  assert.match(text('roamwise'), /never pay the property separately/);
  for (const type of ['phone', 'whatsapp', 'website', 'ota']) assert.equal(c.rwBookingResponsibilities({type}).length, 0);
  assert.equal(c.rwBookingResponsibilitiesHTML({type:'none'}), '');
  assert.match(c.rwBookingActionHTML({...base, bookingMode:'roamwise'}), /<summary>Who handles my booking/);
});
