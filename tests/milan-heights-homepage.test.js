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
  assert.deepEqual(Array.from(context.rwListingAll(), p => p.id).sort(), ['p_milan_heights']);
});

test('signed partners with no booking route stay hidden until a route is saved', () => {
  const { context, window } = appContext();
  const ids = () => Array.from(context.rwListingAll(), p => p.id).sort();
  window.RW_PARTNERS.push({ id: 'p_no_route', name: 'No Route Stay', zone: 'Almora', verified: 'signed', listingReady: true });
  assert.ok(!ids().includes('p_no_route'));
  const p = window.RW_PARTNERS.find(x => x.id === 'p_no_route');
  p.bookingMode = 'whatsapp'; p.bookingWhatsapp = '9876543210';
  assert.ok(ids().includes('p_no_route'));
});

test('Soulmate and New Himank stay hidden (no OTA links) until a WhatsApp number is published', () => {
  const { context, window } = appContext();
  const ids = () => Array.from(context.rwListingAll(), p => p.id).sort();
  assert.deepEqual(ids(), ['p_milan_heights']);
  for (const id of ['p_soulmate_homestay', 'p_new_himank']) {
    const p = window.RW_PARTNERS.find(x => x.id === id);
    assert.equal(p.bookingUrl, undefined, id + ' must not link to an OTA');
    assert.equal(p.bookingMode, undefined);
  }
});

test('once WhatsApp is published, Soulmate and New Himank use the same message and note as Milan Heights', () => {
  const { context, window, overlay } = appContext();
  for (const [id, num] of [['p_soulmate_homestay', '9876543210'], ['p_new_himank', '9876543211']]) {
    const p = window.RW_PARTNERS.find(x => x.id === id);
    p.bookingMode = 'whatsapp'; p.bookingWhatsapp = num;
    assert.doesNotMatch(context.rwListCard(p, false), /lst-art|lst-emoji/, 'no empty photo placeholder');
    context.rwListOpen(id);
    assert.match(overlay.innerHTML, new RegExp('wa\\.me/91' + num));
    assert.match(overlay.innerHTML, /Ask the hotel on WhatsApp/);
    assert.match(overlay.innerHTML, /final total including taxes/);
    assert.match(overlay.innerHTML, /I%20found%20your%20stay%20through%20RoamWise/);
    assert.doesNotMatch(overlay.innerHTML, /openStays|See rooms|makemytrip|Hygge/);
  }
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
