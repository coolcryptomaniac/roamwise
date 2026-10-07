const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function appContext() {
  const window = {};
  const overlay = { classList: { add() {} } };
  const context = {
    window,
    console,
    encodeURIComponent,
    Number, isFinite, URL,
    document: { createElement() { return overlay; }, body: { appendChild() {} } },
    el(id) { return id === 'lstOv' ? overlay : null; },
    esc2(value) { return String(value ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); },
    lsGet() { return null; },
    rwOverlayClose() {},
    openStays() {}
  };
  vm.createContext(context);
  for (const file of ['partners-data.js', 'badges-data.js', 'js/misc/partners.js', 'js/booking/routes.js', 'js/misc/listings.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return { context, window, overlay };
}

test('Stay & do only shows signed, ready partners that have a working booking route', () => {
  const { context, window } = appContext();
  window.RW_PARTNERS.push(
    { id: 'unsigned', name: 'Unsigned Lodge', zone: 'Manali', verified: 'listed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919800000000' },
    { id: 'not-ready', name: 'Signed but not ready', zone: 'Manali', verified: 'signed', listingReady: false, bookingMode: 'whatsapp', bookingWhatsapp: '919800000000' }
  );
  assert.deepEqual(Array.from(context.rwListingAll(), p => p.id), ['p_milan_heights']);
});

test('signed partners with no booking route stay hidden until a route is saved', () => {
  const { context, window } = appContext();
  const ids = () => Array.from(context.rwListingAll(), p => p.id).sort();
  assert.ok(!ids().includes('p_soulmate_homestay'));
  assert.ok(!ids().includes('p_new_himank'));
  const soulmate = window.RW_PARTNERS.find(p => p.id === 'p_soulmate_homestay');
  soulmate.bookingMode = 'whatsapp'; soulmate.bookingWhatsapp = '9876543210';
  assert.ok(ids().includes('p_soulmate_homestay'));
  const himank = window.RW_PARTNERS.find(p => p.id === 'p_new_himank');
  himank.bookingMode = 'ota'; himank.bookingUrl = 'https://www.booking.com/hotel/in/new-himank.html';
  assert.ok(ids().includes('p_new_himank'));
});

test('a route without a photo renders a compact card with no empty placeholder art', () => {
  const { context, window } = appContext();
  const s = window.RW_PARTNERS.find(p => p.id === 'p_soulmate_homestay');
  s.bookingMode = 'whatsapp'; s.bookingWhatsapp = '9876543210';
  assert.doesNotMatch(context.rwListCard(s, false), /lst-art|lst-emoji/);
});

test('detail page never links to unrelated zone rooms and uses the route that is configured', () => {
  const { context, window, overlay } = appContext();
  const himank = window.RW_PARTNERS.find(p => p.id === 'p_new_himank');
  himank.bookingMode = 'ota'; himank.bookingUrl = 'https://www.booking.com/hotel/in/new-himank.html'; himank.bookingOtaName = '';
  context.rwListOpen('p_new_himank');
  assert.match(overlay.innerHTML, /Book on Booking\.com/);
  assert.match(overlay.innerHTML, /book and pay on Booking\.com/);
  assert.doesNotMatch(overlay.innerHTML, /openStays|See rooms/);
  assert.match(overlay.innerHTML, /google\.com\/maps\/search/);
  assert.doesNotMatch(overlay.innerHTML, /\u2605|From<\/span>/);
  const soulmate = window.RW_PARTNERS.find(p => p.id === 'p_soulmate_homestay');
  soulmate.bookingMode = 'whatsapp'; soulmate.bookingWhatsapp = '9876543210';
  context.rwListOpen('p_soulmate_homestay');
  assert.match(overlay.innerHTML, /wa\.me\/919876543210/);
  assert.match(overlay.innerHTML, /Kotyura/);
  assert.match(overlay.innerHTML, /google\.com\/maps\/search/);
});

test('Milan detail opens a WhatsApp enquiry and shows RoamWise support', () => {
  const { context, overlay } = appContext();
  context.rwListOpen('p_milan_heights');
  assert.match(overlay.innerHTML, /wa\.me\/917302315845/);
  assert.match(overlay.innerHTML, /Ask the hotel on WhatsApp/);
  assert.match(overlay.innerHTML, /milan-heights-front\.jpg/);
  assert.match(overlay.innerHTML, /milan-heights-gaming\.jpg/);
  assert.match(overlay.innerHTML, /More photos &amp; videos on Milan Heights’ Instagram/);
  assert.match(overlay.innerHTML, /mailto:founder@roamwise\.co\.in/);
  assert.match(overlay.innerHTML, /final total including taxes/);
});

test('stale cache cannot overwrite the trusted Milan pilot record', () => {
  const window = {};
  const context = { window, lsGet() { return JSON.stringify([{ id: 'p_milan_heights', name: 'Changed', verified: 'listed', listingReady: false }]); } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('partners-data.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('js/misc/partners.js', 'utf8'), context);
  assert.equal(window.RW_PARTNERS[0].name, 'Milan Heights');
  assert.equal(window.RW_PARTNERS[0].verified, 'signed');
  assert.equal(window.RW_PARTNERS[0].listingReady, true);
});
