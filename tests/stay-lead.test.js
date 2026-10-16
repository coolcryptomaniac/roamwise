'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const core = () => import(path.join(root, 'worker/lib/stay-lead-core.js'));
const handler = () => import(path.join(root, 'worker/handlers/stay-lead.js'));

const GOOD = { consent: true, source: 'room', name: 'Asha Rawat', phone: '+91 98765 43210', checkIn: '2026-11-12', checkOut: '2026-11-15', guests: 2,
  note: 'late arrival', items: [{ partnerId: 'p_1', itemId: 'r1', name: 'Pine Nest', room: 'Cottage', where: 'Almora', price: 2800 }] };
function fakeCache(){
  const m = new Map();
  return { match: async r => (m.has(r.url) ? new Response(m.get(r.url)) : undefined), put: async (r, res) => { m.set(r.url, await res.text()); } };
}
function deps(){
  const store = new Map();
  return { store, configured: () => true, create: async (id, v) => { if(store.has(id)) return false; store.set(id, v); return true; },
    list: async () => [...store].map(([id, v]) => ({ id, ...v })), remove: async id => { store.delete(id); } };
}
const post = (b, ip) => new Request('https://w.test/stay/lead', { method: 'POST', headers: { 'CF-Connecting-IP': ip || '5.5.5.5' }, body: typeof b === 'string' ? b : JSON.stringify(b) });

test('a lead needs explicit consent, a real name, an Indian mobile and at least one item', async () => {
  const c = await core();
  assert.equal(c.parseLead({ ...GOOD, consent: undefined }).error, 'consent_required');
  assert.equal(c.parseLead({ ...GOOD, consent: 'yes' }).error, 'consent_required', 'only boolean true counts');
  assert.equal(c.parseLead({ ...GOOD, name: 'A' }).error, 'bad_name');
  assert.equal(c.parseLead({ ...GOOD, phone: '12345' }).error, 'bad_phone');
  assert.equal(c.parseLead({ ...GOOD, phone: '5876543210' }).error, 'bad_phone', 'Indian mobiles start 6-9');
  assert.equal(c.parseLead({ ...GOOD, items: [] }).error, 'no_items');
  const ok = c.parseLead(GOOD).value;
  assert.equal(ok.phone, '9876543210');
  assert.equal(ok.items[0].price, 2800);
});

test('phone formats normalise to 10 digits; text is cleaned and capped', async () => {
  const c = await core();
  for(const p of ['9876543210', '+91 9876543210', '919876543210', '09876543210', '98765-43210']) assert.equal(c.normalizePhone(p), '9876543210', p);
  const v = c.parseLead({ ...GOOD, name: '<b>Asha</b>', note: 'x'.repeat(900), checkIn: 'tomorrow', items: new Array(20).fill(GOOD.items[0]) }).value;
  assert.ok(!/[<>]/.test(v.name));
  assert.equal(v.note.length, 300);
  assert.equal(v.checkIn, '');
  assert.equal(v.items.length, 8);
});

test('worker route stores a consented request, flags it new, and records the consent version', async () => {
  const h = await handler(), d = deps();
  const res = await h.handleStayLead(post(GOOD), {}, d, fakeCache());
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.ok, true);
  const rec = d.store.get(j.id);
  assert.equal(rec.status, 'new');
  assert.equal(rec.waConsent, true);
  assert.match(rec.consentVersion, /^wa-/);
  assert.equal(rec.phone, '9876543210');
});

test('worker route refuses no-consent, bad JSON, oversize, wrong method, unconfigured, and floods', async () => {
  const h = await handler(), d = deps(), c = fakeCache();
  assert.equal((await h.handleStayLead(post({ ...GOOD, consent: false }), {}, d, c)).status, 400);
  assert.equal((await h.handleStayLead(post('not json'), {}, d, c)).status, 400);
  assert.equal((await h.handleStayLead(post('x'.repeat(7000)), {}, d, c)).status, 413);
  assert.equal((await h.handleStayLead(new Request('https://w.test/stay/lead', { method: 'GET' }), {}, d, c)).status, 404);
  assert.equal((await h.handleStayLead(post(GOOD), {}, { ...d, configured: () => false }, c)).status, 501);
  assert.equal(d.store.size, 0);
  const d2 = deps(), c2 = fakeCache();
  let last;
  for(let i = 0; i < 7; i++) last = await h.handleStayLead(post(GOOD, '8.8.8.8'), {}, d2, c2);
  assert.equal(last.status, 429);
  assert.ok(d2.store.size <= 5);
});

test('retention: leads older than 12 months are deleted, newer ones stay', async () => {
  const h = await handler(), d = deps();
  const now = Date.parse('2026-10-16T00:00:00Z');
  d.store.set('old', { createdAt: '2025-10-01T00:00:00Z' });
  d.store.set('new', { createdAt: '2026-09-01T00:00:00Z' });
  d.store.set('nodate', {});
  assert.equal(await h.purgeOldStayLeads({}, d, now), 1);
  assert.deepEqual([...d.store.keys()].sort(), ['new', 'nodate']);
});

test('founder chat shows new requests with a tap-to-WhatsApp link', async () => {
  const c = await core();
  const line = c.leadLine({ id: 'L1', name: 'Asha', phone: '9876543210', checkIn: '2026-11-12', checkOut: '2026-11-15', guests: 2, items: [{ name: 'Pine Nest' }] });
  assert.match(line, /Asha wants Pine Nest/);
  assert.match(line, /wa\.me\/919876543210/);
  const admin = await import(path.join(root, 'worker/handlers/bot-admin.js'));
  const txt = await admin.requestsText({ list: async () => [{ id: 'L1', status: 'new', createdAt: '2026-10-16', name: 'Asha', phone: '9876543210', items: [{ name: 'Pine Nest' }] }, { id: 'L2', status: 'contacted', name: 'Old' }] });
  assert.match(txt, /Asha/);
  assert.doesNotMatch(txt, /Old/);
  const digest = await admin.buildDigest({}, { list: async n => (n === 'stayLeads' ? [{ status: 'new' }, { status: 'new' }] : []) });
  assert.match(digest, /New guest stay requests: 2/);
});

test('client: refuses to send without a network route, sends consent:true, and reports failure honestly', async () => {
  const sent = [];
  const s = { console, setTimeout, clearTimeout, window: null,
    fetch: (u, o) => { sent.push({ u, body: JSON.parse(o.body) }); return Promise.resolve({ ok: true, json: async () => ({ ok: true, id: 'L9' }) }); } };
  s.window = s;
  vm.runInNewContext(read('js/booking/stay-lead.js'), s);
  let r; s.rwStayLeadSend({ name: 'A' }, (ok, m) => { r = [ok, m]; });
  assert.deepEqual(r, [false, 'offline'], 'no api route: reports failure, not success');
  s.rwApi = p => 'https://w.test/' + p;
  await new Promise(res => { s.rwStayLeadSend({ name: 'Asha' }, (ok, m) => { r = [ok, m]; res(); }); });
  assert.deepEqual(r, [true, 'L9']);
  assert.equal(sent[0].u, 'https://w.test/stay/lead');
  assert.equal(sent[0].body.consent, true);
  s.fetch = () => Promise.resolve({ ok: false, json: async () => ({ message: 'busy' }) });
  await new Promise(res => { s.rwStayLeadSend({ name: 'Asha' }, (ok, m) => { r = [ok, m]; res(); }); });
  assert.deepEqual(r, [false, 'busy']);
});

test('forms: consent is required, nothing writes to the rule-less collections any more', () => {
  const f = read('js/booking/form.js');
  assert.doesNotMatch(f, /collection\('bookings'\)|collection\('stayEnquiries'\)/);
  assert.equal((f.match(/v\.consent!=='yes'/g) || []).length, 2, 'both forms insist on consent');
  assert.match(f, /rwStayLeadSend/);
  assert.match(read('js/booking/stay-lead.js'), /No marketing messages/);
});
