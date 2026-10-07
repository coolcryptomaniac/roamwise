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

test('whatsapp needs a valid number and whatsapp mode', () => {
  const c = load([]);
  assert.equal(c.rwBookingRoute({ ...base, bookingMode: 'whatsapp', bookingWhatsapp: '9876543210' }).href, 'https://wa.me/919876543210');
  assert.equal(c.rwBookingRoute({ ...base, bookingMode: 'whatsapp', bookingWhatsapp: '123' }).type, 'none');
  assert.equal(c.rwBookingRoute({ ...base, bookingMode: 'ota', bookingWhatsapp: '9876543210' }).type, 'none');
});

test('ota and website routes require https and name the site honestly', () => {
  const c = load([]);
  const ota = c.rwBookingRoute({ ...base, bookingMode: 'ota', bookingUrl: 'https://www.makemytrip.com/hotels/x' });
  assert.equal(ota.type, 'ota');
  assert.match(ota.label, /MakeMyTrip/);
  assert.equal(c.rwBookingRoute({ ...base, bookingMode: 'ota', bookingUrl: 'http://insecure.example/x' }).type, 'none');
  assert.equal(c.rwBookingRoute({ ...base, bookingMode: 'ota', bookingUrl: 'javascript:alert(1)' }).type, 'none');
  assert.equal(c.rwBookingRoute({ ...base, bookingMode: 'website', bookingUrl: 'https://hotel.example/book' }).type, 'website');
  assert.match(c.rwBookingActionHTML({ ...base, bookingMode: 'ota', bookingUrl: 'https://www.agoda.com/x' }), /book and pay on Agoda/);
});

test('phone route builds a tel link; secondary channels are offered', () => {
  const c = load([]);
  assert.equal(c.rwBookingRoute({ ...base, bookingMode: 'phone', bookingPhone: '9876543210' }).href, 'tel:+919876543210');
  const both = { ...base, bookingMode: 'website', bookingUrl: 'https://hotel.example/b', bookingPhone: '9876543210' };
  assert.equal(c.rwBookingRoutes(both).length, 2);
  assert.match(c.rwBookingActionHTML(both), /Or call the hotel/);
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
