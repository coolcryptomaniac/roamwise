'use strict';
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const block = html.match(/var EVENTS=\[([\s\S]*?)\n  \];/)[1];
const events = new Function('return [' + block + ']')();
test('every music event has dates, https links and an end date', () => {
  assert.ok(events.length >= 10);
  events.forEach(e => {
    assert.ok(e.name && e.when && e.place && e.blurb, e.name);
    assert.match(e.end, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(e.link, /^https:\/\//);
    if (e.tickets) assert.match(e.tickets, /^https:\/\//);
  });
  assert.ok(html.includes('EVENTS.sort('), 'events are sorted by end date at runtime');
});
test('gallery photos exist, are small and carry no EXIF/GPS', () => {
  const js = fs.readFileSync(path.join(root, 'js/ui/music-gallery.js'), 'utf8');
  const files = [...js.matchAll(/'(\/assets\/img\/music\/[^']+\.jpg)'/g)].map(m => m[1]);
  assert.ok(files.length >= 4);
  files.forEach(f => {
    const b = fs.readFileSync(path.join(root, f));
    assert.ok(b.length < 90 * 1024, f + ' too big');
    assert.ok(!b.includes(Buffer.from('Exif')), f + ' has EXIF');
  });
  assert.ok(html.includes('js/ui/music-gallery.js'));
});
test('rave card has all four song links and the WhatsApp number has a country code', () => {
  const r = fs.readFileSync(path.join(root, 'js/ui/rave-card.js'), 'utf8');
  ['music.youtube.com/watch?v=L-U-A-o1G6Q', 'open.spotify.com/track/1yS4k1NPpxxKsX6DxFOCsm', 'music.apple.com/in/song/rave-to-hell/6772573897', 'B0H2QZ1FNL'].forEach(s => assert.ok(r.includes(s), s));
  assert.ok(fs.readFileSync(path.join(root, 'js/copilot/nmims-answers.js'), 'utf8').includes('wa.me/919987379730'));
});
