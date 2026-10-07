const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(docs) {
  const window = {};
  const overlay = { classList: { add() {}, contains: () => true } };
  const db = { collection: () => ({ doc: id => ({ get: async () => ({ exists: id in docs, data: () => docs[id] }) }) }) };
  const ctx = { window, console, encodeURIComponent, Number, isFinite, URL, Promise, db,
    document: { createElement: () => overlay, body: { appendChild() {} } },
    el: id => (id === 'lstOv' ? overlay : null),
    esc2: v => String(v ?? '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])),
    lsGet: () => null, rwOverlayClose() {}, openStays() {} };
  vm.createContext(ctx);
  for (const f of ['partners-data.js', 'badges-data.js', 'js/misc/partners.js', 'js/booking/routes.js', 'js/booking/stay-quote.js', 'js/misc/listing-photos.js', 'js/misc/listings.js'])
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  return { ctx, window, overlay };
}
const GOOD = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

test('only strict base64 webp/jpeg data URLs are accepted as uploaded photos', () => {
  const { ctx } = setup({});
  assert.equal(ctx.rwUploadedPhotoOk(GOOD), true);
  assert.equal(ctx.rwUploadedPhotoOk('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(ctx.rwUploadedPhotoOk('data:text/html;base64,PGI+'), false);
  assert.equal(ctx.rwUploadedPhotoOk('javascript:alert(1)'), false);
  assert.equal(ctx.rwUploadedPhotoOk('https://example.com/a.jpg'), false);
  assert.equal(ctx.rwUploadedPhotoOk('data:image/webp;base64,' + 'A'.repeat(400001)), false);
});

test('uploaded photos load lazily for a live listing and render in the card and detail', async () => {
  const { ctx, window, overlay } = setup({
    photo_p_demo_stay_0: { src: GOOD, caption: 'Front' },
    photo_p_demo_stay_1: { src: 'data:image/svg+xml;base64,PHN2Zz4=', caption: 'Bad' }
  });
  const p = { id: 'p_demo_stay', name: 'Demo Stay', zone: 'Almora', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '9876543210', photoCount: 2 };
  window.RW_PARTNERS.push(p);
  const got = await new Promise(r => ctx.rwLoadUploadedPhotos(p, r));
  assert.equal(got, true);
  assert.equal(p.photos.length, 1, 'the unsafe photo is dropped');
  assert.match(ctx.rwListCard(p, false), /data:image\/webp/);
  ctx.rwListOpen('p_demo_stay');
  assert.match(overlay.innerHTML, /data:image\/webp/);
});

test('a property policy shows as one plain line on its detail page and nothing when unset', () => {
  const { ctx, window, overlay } = setup({});
  const p = { id: 'p_pol', name: 'Policy Stay', zone: 'Almora', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '9876543210', advancePct: 30, freeCancelHours: 48, lateRefundPct: 50 };
  window.RW_PARTNERS.push(p);
  ctx.rwListOpen('p_pol');
  assert.match(overlay.innerHTML, /30% advance paid directly to the hotel/);
  assert.match(overlay.innerHTML, /Set by the property/);
  ctx.rwListOpen('p_milan_heights');
  assert.doesNotMatch(overlay.innerHTML, /advance paid directly/);
});
