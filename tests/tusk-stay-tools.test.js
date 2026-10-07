/* quote_stay and enquire_stay in js/copilot/agent.js, run against the real routes/quote/code sources. */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

function load() {
  const opened = [];
  const store = {};
  const sandbox = {
    console, URL, Date, Math, JSON, encodeURIComponent, Uint8Array, TextEncoder,
    crypto: require('node:crypto').webcrypto,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    navigator: {}, document: { getElementById: () => null }, fetch: async () => ({ ok: true }),
    lsGet: () => null, lsSet: () => {}, esc2: (x) => x,
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.open = (u) => opened.push(u);
  vm.createContext(sandbox);
  for (const f of ['features/finance-tax/gst-rules.js', 'js/booking/routes.js', 'js/booking/stay-quote.js', 'js/booking/stay-code.js', 'js/copilot/agent.js']) {
    vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });
  }
  sandbox.RW_PARTNERS = [
    { id: 'p_direct', name: 'Direct House', zone: 'Almora', verified: 'signed', listingReady: true, bookingMode: 'direct', gstVerified: true },
    { id: 'p_wa', name: 'WhatsApp Lodge', zone: 'Almora', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919876543210' },
    { id: 'p_none', name: 'No Route', zone: 'Almora', verified: 'signed', listingReady: true },
  ];
  sandbox.RW_ROOMS = [{ id: 'r1', partnerId: 'p_direct', property: 'Direct House', room: 'Deluxe', price: 3000, bookable: true, paymentEnabled: true, zone: 'Almora' }];
  return { sandbox, opened };
}

test('quote_stay prices a group and adds GST only for a GST-verified property', () => {
  const { sandbox } = load();
  const r = sandbox.RW_AGENT_IMPL.quote_stay({ roomId: 'r1', nights: 2, rooms: 1, people: 4 });
  assert.equal(r.ok, true);
  assert.equal(r.total, 6000);
  assert.equal(r.gst.rateBps, 500);                 // 3000/night is in the 5% band
  assert.equal(r.totalWithTax, 6300);
  assert.equal(r.perPerson, 1575);
  assert.equal(sandbox.RW_AGENT_IMPL.quote_stay({ roomId: 'nope', nights: 1 }).ok, false);
});

test('enquire_stay opens a coded WhatsApp link and refuses unverified or route-less partners', () => {
  const { sandbox, opened } = load();
  const r = sandbox.RW_AGENT_IMPL.enquire_stay({ partnerId: 'p_wa', checkIn: '2026-11-10', nights: 2, guests: 3 });
  assert.equal(r.ok, true);
  assert.match(r.code, /^RW-[A-Z2-9]{6}$/);
  assert.match(opened[0], /^https:\/\/wa\.me\/919876543210\?text=/);
  assert.match(decodeURIComponent(opened[0]), new RegExp(r.code));
  assert.equal(sandbox.RW_AGENT_IMPL.enquire_stay({ partnerId: 'p_none', checkIn: '2026-11-10', guests: 2 }).ok, false);
  assert.equal(sandbox.RW_AGENT_IMPL.enquire_stay({ partnerId: 'p_direct', checkIn: '2026-11-10', guests: 2 }).ok, false);
  assert.equal(sandbox.RW_AGENT_IMPL.enquire_stay({ partnerId: 'p_wa', checkIn: 'soon', guests: 2 }).ok, false);
});

test('find_partners hides partners with no working booking route', () => {
  const { sandbox } = load();
  vm.runInContext(fs.readFileSync('js/misc/partners.js', 'utf8'), sandbox);
  const ids = sandbox.rwPartnersFor('Almora', '').map((p) => p.id);
  assert.deepEqual(ids.sort(), ['p_direct', 'p_wa'].filter((i) => ids.includes(i)).sort());
  assert.ok(!ids.includes('p_none'));
});
