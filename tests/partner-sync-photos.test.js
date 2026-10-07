/* Regression: Firestore partner entries (no photos) must not wipe the seed photos. */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

function load() {
  const store = {};
  const w = { console, JSON, Object, Array, String, Number, Date, Math };
  w.window = w;
  w.lsGet = (k) => (k in store ? store[k] : null);
  w.lsSet = (k, v) => { store[k] = v; };
  w.el = () => null;
  vm.createContext(w);
  for (const f of ['partners-data.js', 'js/booking/routes.js', 'js/data-sync/config-sync.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), w, { filename: f });
  vm.runInContext(fs.readFileSync('js/misc/partners.js', 'utf8').replace(/\(function\(\)\{ try\{ var c=lsGet[\s\S]*?\}\)\(\);/, ''), w);
  return { w, store };
}
const FS = [
  { id: 'p_soulmate_homestay', cat: 'stay', zone: 'Almora', name: 'Soulmate Homestay', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919105334889', badges: ['local', 'quiet'] },
  { id: 'p_new_himank', cat: 'stay', zone: 'Manali', name: 'New Himank', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919625072542' },
];

test('config-sync keeps seed photos and all three properties are operational', () => {
  const { w } = load();
  const cfg = w.RW_SYNCED.find((c) => c.key === 'partners');
  w.rwConfigApply(cfg, FS);
  const live = w.RW_PARTNERS.filter((p) => p.verified === 'signed' && p.listingReady === true && w.rwIsOperational(p));
  const byId = Object.fromEntries(live.map((p) => [p.id, p]));
  for (const id of ['p_milan_heights', 'p_soulmate_homestay', 'p_new_himank']) assert.ok(byId[id], id + ' must be listed');
  assert.equal(byId.p_soulmate_homestay.photos.length, 4);
  assert.equal(byId.p_new_himank.photos.length, 3);
  assert.equal(byId.p_new_himank.bookingWhatsapp, '919625072542');   // admin-set route survives
});

test('the localStorage cache path also merges the seed', () => {
  const { w, store } = load();
  store.rw_cfg_partners = JSON.stringify(FS);
  w.db = undefined;
  w.rwConfigSyncAll();
  assert.equal(w.RW_PARTNERS.find((p) => p.id === 'p_soulmate_homestay').photos.length, 4);
});
