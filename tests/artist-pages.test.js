'use strict';
const test = require('node:test'), assert = require('node:assert');
const R = require('../creators/artist-render.js');

const d = { plans: { free: { maxPaintings: 6 } }, artists: [] };
const base = { id: 'asha-rawat', name: 'Asha Rawat', studio: 'Pahadi Rang', state: 'Uttarakhand', plan: 'founding', page: '/creators/asha-rawat/', themes: ['Landscapes'], whatsapp: '919876543210' };

test('artist page is indexable only with a bio and a painting photo', () => {
  assert.equal(R.indexable(d, base), false);
  assert.equal(R.indexable(d, Object.assign({}, base, { bio: 'Paints the Kumaon hills.' })), false);
  const full = Object.assign({}, base, { bio: 'Paints the Kumaon hills.', artworks: [{ title: 'Nanda Devi at dawn', image: '/assets/img/asha-rawat/nanda.jpg' }] });
  assert.equal(R.indexable(d, full), true);
  full.artworks[0].status = 'Sold';
  assert.equal(R.indexable(d, full), false, 'sold work does not count');
});

test('rendered markup escapes artist text and links WhatsApp enquiries', () => {
  const html = R.html(d, Object.assign({}, base, { bio: '<script>x</script>' }));
  assert.doesNotMatch(html, /<script>x/);
  assert.match(html, /&lt;script&gt;x/);
  assert.match(html, /https:\/\/wa\.me\/919876543210/);
  assert.match(html, /<h1>Asha Rawat<span>Pahadi Rang · Uttarakhand<\/span><\/h1>/);
});

test('every /creators/<id>/ page in the data has its static file', () => {
  const { staticArtists, load } = require('../tools/build-artist-pages.js');
  const fs = require('fs'), path = require('path');
  for (const a of staticArtists(load())) {
    const f = path.join(__dirname, '..', 'creators', a.id, 'index.html');
    assert.ok(fs.existsSync(f), f);
    assert.match(fs.readFileSync(f, 'utf8'), new RegExp('<link rel="canonical" href="https://www.roamwise.co.in/creators/' + a.id + '/">'));
  }
});
