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
    Number,
    document: { createElement() { return overlay; }, body: { appendChild() {} } },
    el(id) { return id === 'lstOv' ? overlay : null; },
    esc2(value) { return String(value ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); },
    lsGet() { return null; },
    rwOverlayClose() {},
    openStays() {}
  };
  vm.createContext(context);
  for (const file of ['partners-data.js', 'badges-data.js', 'js/misc/partners.js', 'js/misc/listings.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return { context, window, overlay };
}

test('Stay & do only shows signed, ready partner inventory', () => {
  const { context, window } = appContext();
  window.RW_PARTNERS.push(
    { id: 'unsigned', name: 'Unsigned Lodge', zone: 'Manali', verified: 'listed', listingReady: true },
    { id: 'not-ready', name: 'Signed but not ready', zone: 'Manali', verified: 'signed', listingReady: false }
  );
  window.RW_ROOMS = [{ id: 'demo', property: 'Demo Room', zone: 'Almora', price: 1000 }];
  const signed = ['p_milan_heights', 'p_soulmate_homestay'];
  assert.deepEqual(Array.from(context.rwListingAll(), p => p.id).sort(), signed);
  assert.deepEqual(Array.from(context.rwPartnersFor('', 'stay'), p => p.id).sort(), signed);
});

test('Soulmate Homestay detail routes through RoamWise stays, not a missing WhatsApp number', () => {
  const { context, overlay } = appContext();
  context.rwListOpen('p_soulmate_homestay');
  assert.match(overlay.innerHTML, /Soulmate Homestay/);
  assert.match(overlay.innerHTML, /Kotyura/);
  assert.doesNotMatch(overlay.innerHTML, /wa\.me/);
  assert.match(overlay.innerHTML, /See rooms &amp; book/);
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
