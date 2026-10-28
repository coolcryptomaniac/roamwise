/* Direct (one-to-one) booking, mountain conditions, the Tusk tools on top of them,
   and the Quiet Himalaya data. Runs the real sources in a vm sandbox. */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

function iso(offsetDays) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function load(extra) {
  const opened = [];
  const store = {};
  const sandbox = {
    console, URL, Date, Math, JSON, encodeURIComponent, Uint8Array, TextEncoder, setTimeout,
    crypto: require('node:crypto').webcrypto,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    navigator: {}, document: { getElementById: () => null }, fetch: async () => ({ ok: true }),
    lsGet: () => null, lsSet: () => {}, esc2: (x) => x,
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.open = (u) => opened.push(u);
  vm.createContext(sandbox);
  const files = ['features/finance-tax/gst-rules.js', 'js/booking/routes.js', 'js/booking/stay-quote.js', 'js/booking/stay-code.js',
    'js/booking/mountain-conditions.js', 'js/booking/direct-booking.js', 'js/ui/nomad-plans.js', 'js/copilot/agent.js', 'js/copilot/tusk-quiet-tools.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });
  sandbox.RW_CONDITIONS = [
    { id: 'temple', kind: 'closure', official: true, match: ['kedarnath'], title: 'Temple closes', detail: 'd', until: iso(10), source: 'S', sourceUrl: 'https://example.org/a' },
    { id: 'snow', kind: 'snow', official: false, match: ['lahaul', 'kaza'], title: 'Snow', detail: 'd', until: iso(5), source: 'S', sourceUrl: 'https://example.org/b' },
    { id: 'old', kind: 'snow', official: true, match: ['almora'], title: 'Old', detail: 'd', until: iso(-1), source: 'S', sourceUrl: 'https://example.org/c' },
  ];
  sandbox.RW_PARTNERS = [
    { id: 'p_wa', name: 'Quiet Lodge', zone: 'Almora', area: 'Kotyura', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919876543210',
      nomad: { enabled: true, minNights: 15, mbps: 100, backup: 'full', callRoom: true, meals: true, rate15: 30000, rate30: 50000, rate90: 50000, verified: false } },
    { id: 'p_lahaul', name: 'Snow House', zone: 'Lahaul', verified: 'signed', listingReady: true, bookingMode: 'whatsapp', bookingWhatsapp: '919876543211' },
    { id: 'p_listed', name: 'Listed Only', zone: 'Manali', verified: 'listed' },
  ];
  if (extra) extra(sandbox);
  return { sandbox, opened, store };
}

test('conditions: match by place, respect "until", flag a trip after a winter closure', () => {
  const { sandbox } = load();
  const C = sandbox.RWConditions;
  assert.equal(C.forPlace('Kedarnath', iso(3)).length, 1);
  assert.equal(C.forPlace('Kedarnath', iso(3))[0].closedOnTripDate, false);
  const after = C.forPlace('Kedarnath', iso(20));
  assert.equal(after.length, 1);
  assert.equal(after[0].closedOnTripDate, true);
  assert.match(after[0].label, /^Closed on your dates/);
  assert.equal(C.forPlace('Manali to Kaza', iso(1))[0].label, 'Confirm: Snow');   // unofficial -> "Confirm:"
  assert.equal(C.forPlace('Manali to Kaza', iso(9)).length, 0);                    // snow advisory over
  assert.equal(C.forPlace('Almora', iso(0)).length, 0);                            // expired
  assert.equal(C.forPlace('Goa', iso(0)).length, 0);
  assert.doesNotMatch(C.html([{ label: '<b>x', detail: '"y"', sourceUrl: 'https://e.org', source: 'S' }]), /<b>x/);
});

test('direct booking: request, forward-only status, then a reminder at check-in', () => {
  const { sandbox } = load();
  const p = sandbox.RW_PARTNERS[1];
  assert.equal(sandbox.rwDirectRequest(p, { checkIn: iso(-1), guests: 2 }).ok, false);
  assert.equal(sandbox.rwDirectRequest(p, { checkIn: iso(2), guests: 0 }).ok, false);
  const r = sandbox.rwDirectRequest(p, { checkIn: iso(2), nights: 3, guests: 2 });
  assert.equal(r.ok, true);
  assert.match(r.code, /^RW-[A-Z2-9]{6}$/);
  assert.match(decodeURIComponent(r.url), /check-in/);
  assert.equal(r.conditions.length, 1);                                            // Lahaul snow advisory
  const list = () => sandbox.rwDirectList();
  assert.equal(list()[0].status, 'requested');
  assert.equal(list()[0].nights, 3);
  assert.equal(sandbox.rwDirectSetStatus(r.code, 'stayed').ok, false);
  assert.equal(sandbox.rwDirectSetStatus('RW-NOPE00', 'confirmed').ok, false);
  assert.equal(sandbox.rwDirectSetStatus(r.code, 'confirmed').ok, true);
  assert.equal(sandbox.rwDirectSetStatus(r.code, 'declined').ok, false);          // no going back to declined
  assert.equal(list()[0].status, 'confirmed');
  assert.equal(list()[0].secret, undefined);
  const due = sandbox.rwDirectDue();
  assert.equal(due.kind, 'checkin');
  assert.equal(due.entry.code, r.code);
});

test('direct booking: ask "did the host confirm?" only after 6 hours, at most daily', () => {
  const { sandbox } = load();
  const r = sandbox.rwDirectRequest(sandbox.RW_PARTNERS[0], { checkIn: iso(20), guests: 1 });
  assert.equal(sandbox.rwDirectDue(Date.now() + 3600000), null);
  const due = sandbox.rwDirectDue(Date.now() + 7 * 3600000);
  assert.equal(due.kind, 'ask');
  assert.equal(due.entry.code, r.code);
});

test('"did you stay?" nudge skips a direct booking whose check-in is still ahead', () => {
  const { sandbox, store } = load((s) => {
    const shown = [];
    s.document = { getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, querySelector: () => ({}), firstChild: {} }), body: { appendChild: (n) => shown.push(n) } };
    s.__shown = shown;
  });
  const old = Date.now() - 5 * 86400000;
  store.rw_stay_codes_v1 = JSON.stringify([{ code: 'RW-AAAAAA', secret: 'x', partnerId: 'p_wa', name: 'Q', at: old, answered: false, direct: true, status: 'confirmed', checkIn: iso(4) }]);
  sandbox.rwStayNudge();
  assert.equal(sandbox.__shown.length, 0);
  store.rw_stay_codes_v1 = JSON.stringify([{ code: 'RW-BBBBBB', secret: 'x', partnerId: 'p_wa', name: 'Q', at: old, answered: false }]);
  sandbox.rwStayNudge();
  assert.equal(sandbox.__shown.length, 1);                                        // ordinary enquiry still nudged
});

test('Tusk tools: registered before finish, long-stay quote, direct request, quiet stays', () => {
  const { sandbox, opened } = load((s) => {
    s.RW_QUIET = { tags: [], pledge: [], picks: [{ partnerId: 'p_wa', tags: ['silence', 'focus'], why: 'w' }, { partnerId: 'p_listed', tags: ['silence'], why: 'w' }, { partnerId: 'gone', tags: ['silence'], why: 'w' }],
      nearby: [{ name: 'N', place: 'P', tags: ['mind'], what: 'w', sourceUrl: 'https://e.org' }] };
  });
  const names = sandbox.RW_AGENT_TOOLS.map((t) => t.function.name);
  for (const n of ['mountain_conditions', 'quote_long_stay', 'request_direct_booking', 'my_direct_bookings', 'update_direct_booking', 'quiet_stays']) assert.ok(names.includes(n), n);
  assert.equal(names[names.length - 1], 'finish');
  const I = sandbox.RW_AGENT_IMPL;
  const q = I.quote_long_stay({ partnerId: 'p_wa' });
  assert.equal(q.ok, true);
  assert.equal(q.plans.find((x) => x.label === '1 month').total, 50000);
  assert.equal(q.verified, false);
  assert.match(q.note, /host-stated/);
  assert.equal(I.quote_long_stay({ partnerId: 'p_lahaul' }).ok, false);           // no nomad record
  assert.equal(I.quote_long_stay({ partnerId: 'p_listed' }).ok, false);           // not a live partner
  const d = I.request_direct_booking({ partnerId: 'p_lahaul', checkIn: iso(3), nights: 2, guests: 2 });
  assert.equal(d.ok, true);
  assert.equal(d.advisories.length, 1);
  assert.match(opened[0], /^https:\/\/wa\.me\/919876543211\?text=/);
  assert.equal(I.update_direct_booking({ code: d.code.toLowerCase(), status: 'confirmed' }).ok, true);
  assert.equal(I.my_direct_bookings().bookings[0].status, 'confirmed');
  assert.equal(I.mountain_conditions({ place: 'Kedarnath' }).found, 1);
  const qs = I.quiet_stays({ tag: 'focus' });
  assert.deepEqual(qs.stays.map((x) => x.partnerId), ['p_wa']);
  assert.equal(qs.stays[0].canRequest, true);
  assert.equal(I.quiet_stays({}).stays.find((x) => x.partnerId === 'p_listed').canRequest, false);
  assert.equal(I.quiet_stays({ tag: 'mind' }).nearby.length, 1);
});

test('data: every Quiet Himalaya pick is a real partner, every source is https', () => {
  const sb = { window: {} }; sb.window = sb; vm.createContext(sb);
  for (const f of ['partners-data.js', 'quiet-data.js', 'conditions-data.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f });
  const ids = new Set(sb.RW_PARTNERS.map((p) => p.id));
  const tagIds = new Set(sb.RW_QUIET.tags.map((t) => t.id));
  for (const p of sb.RW_QUIET.picks) {
    assert.ok(ids.has(p.partnerId), p.partnerId);
    assert.ok(p.why && p.why.length > 20, p.partnerId);
    for (const t of p.tags) assert.ok(tagIds.has(t), t);
  }
  for (const n of sb.RW_QUIET.nearby) assert.match(n.sourceUrl, /^https:\/\//);
  for (const c of sb.RW_CONDITIONS) {
    assert.match(c.sourceUrl, /^https:\/\//, c.id);
    assert.match(c.until, /^20\d\d-\d\d-\d\d$/, c.id);
    assert.ok(Array.isArray(c.match) && c.match.length, c.id);
  }
});

test('voice: speech language follows the site language', () => {
  const sb = {}; sb.window = sb; vm.createContext(sb);
  vm.runInContext(fs.readFileSync('js/voice/tusk-speak.js', 'utf8'), sb);
  assert.equal(sb.rwSpeechLang(), 'en-IN');
  sb.rwLang = () => 'hi';
  assert.equal(sb.rwSpeechLang(), 'hi-IN');
  assert.match(fs.readFileSync('js/voice/voice-input.js', 'utf8'), /rwSpeechLang\(\)/);
});
