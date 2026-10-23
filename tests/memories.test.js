'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..'), J = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

test('memories data is built, newest first, and every local file exists', () => {
  const { events } = J('memories/data.json'); assert.ok(events.length >= 3);
  const dates = events.map(e => e.date); assert.deepEqual(dates, [...dates].sort().reverse());
  const local = p => p && p.startsWith('/') && assert.ok(fs.existsSync(path.join(root, p)), 'missing ' + p);
  events.forEach(e => { assert.ok(e.id && e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.date)); local(e.cover); (e.photos || []).forEach(p => local(p.src)); (e.videos || []).forEach(v => { local(v.src); local(v.poster); }); });
  assert.equal(require('node:child_process').spawnSync('node', ['tools/build-memories.js', '--check'], { cwd: root }).status, 0);
});

test('homepage promo points at real, listing-ready stays and real paintings', () => {
  const cfg = J('data/home-promo.json'), w = {}; vm.createContext({ window: w }); vm.runInContext(fs.readFileSync(path.join(root, 'partners-data.js'), 'utf8'), { window: w }.constructor === Object ? vm.createContext({ window: w }) : undefined);
  const byId = Object.fromEntries((w.RW_PARTNER_SEED || []).map(p => [p.id, p]));
  cfg.stays.forEach(s => { const p = byId[s.partnerId]; assert.ok(p && p.photos.length && (p.bookingWhatsapp || p.supportEmail), s.partnerId); assert.ok(p.listingReady && (p.verified === 'signed' || p.verified === 'founder-approved'), s.partnerId); assert.ok(s.from == null || s.from > 0); });
  const a = J('creators/artists-data.json').artists.find(x => x.id === cfg.art.artistId);
  cfg.art.artworkIds.forEach(id => { const k = a.artworks.find(x => x.id === id); assert.ok(k && k.image && /^₹/.test(k.price || ''), id); });
});

test('homepage links Memories from the menu and footer', () => {
  const h = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(h, /class="dr-link" href="\/memories\/"/); assert.match(h, /foot-link" href="memories\/"/); assert.match(h, /id="rwMemories"/); assert.match(h, /id="rwPromo"/);
});
