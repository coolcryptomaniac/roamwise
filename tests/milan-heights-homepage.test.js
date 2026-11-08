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

test('Stay & do shows approved enquiry introductions and signed ready partners with a working route', () => {
  const { context, window } = appContext();
  window.RW_PARTNERS.push(
    { id: 'unsigned', name: 'Unsigned Lodge', zone: 'Manali', verified: 'listed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919800000000' },
    { id: 'not-ready', name: 'Signed but not ready', zone: 'Manali', verified: 'signed', listingReady: false, bookingMode: 'whatsapp', bookingWhatsapp: '919800000000' }
  );
  assert.deepEqual(Array.from(context.rwListingAll(), p => p.id).sort(), ['p_amor_aramness', 'p_amor_nanau', 'p_amor_padma', 'p_amor_tattwaa', 'p_corbett_jungle_view', 'p_milan_heights', 'p_soulmate_homestay', 'p_woodbook_devine']);
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

test('Soulmate is listed for booking through RoamWise; New Himank stays hidden (no OTA links) until opened', () => {
  const { context, window } = appContext();
  const ids = () => Array.from(context.rwListingAll(), p => p.id).sort();
  assert.deepEqual(ids(), ['p_amor_aramness', 'p_amor_nanau', 'p_amor_padma', 'p_amor_tattwaa', 'p_corbett_jungle_view', 'p_milan_heights', 'p_soulmate_homestay', 'p_woodbook_devine']);
  assert.equal(window.RW_PARTNERS.find(x => x.id === 'p_soulmate_homestay').bookingWhatsapp, undefined, 'host numbers are not shipped to the browser');
  for (const id of ['p_new_himank']) {
    const p = window.RW_PARTNERS.find(x => x.id === id);
    assert.equal(p.bookingUrl, undefined, id + ' must not link to an OTA');
    assert.equal(p.bookingMode, undefined);
  }
});

test('once opened for bookings, Soulmate and New Himank book through RoamWise like Milan Heights, never the host number', () => {
  const { context, window, overlay } = appContext();
  for (const [id, num] of [['p_soulmate_homestay', '9876543210'], ['p_new_himank', '9876543211']]) {
    const p = window.RW_PARTNERS.find(x => x.id === id);
    p.bookingMode = 'whatsapp'; p.bookingWhatsapp = num;
    assert.match(context.rwListCard(p, false), id === 'p_soulmate_homestay' ? /soulmate-front\.jpg/ : /new-himank-room\.webp/);
    context.rwListOpen(id);
    assert.doesNotMatch(overlay.innerHTML, new RegExp(num));
    assert.match(overlay.innerHTML, /wa\.me\/919987379730/);
    assert.match(overlay.innerHTML, /Book through RoamWise/);
    assert.match(overlay.innerHTML, /all-in price/);
    assert.doesNotMatch(overlay.innerHTML, /openStays|See rooms|makemytrip|Hygge/);
    if (id === 'p_new_himank') for (const f of ['room', 'dining', 'signboard']) assert.match(overlay.innerHTML, new RegExp('new-himank-' + f + '\\.webp'));
  }
});

test('Milan detail books through RoamWise and shows RoamWise support', () => {
  const { context, overlay } = appContext();
  context.rwListOpen('p_milan_heights');
  assert.match(overlay.innerHTML, /wa\.me\/919987379730/);
  assert.match(overlay.innerHTML, /Book through RoamWise/);
  assert.match(overlay.innerHTML, /milan-heights-front\.jpg/);
  assert.match(overlay.innerHTML, /milan-heights-gaming\.jpg/);
  assert.match(overlay.innerHTML, /More photos &amp; videos on Milan Heights’ Instagram/);
  assert.match(overlay.innerHTML, /mailto:support@roamwise\.co\.in/);
  assert.match(overlay.innerHTML, /all-in price/);
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
