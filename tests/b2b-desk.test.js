'use strict';
/* B2B desk: staff/b2b-core.js rules, the MOU signature handler and the wiring that must not drift. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const B = require(path.join(root, 'staff/b2b-core.js'));
const handler = () => import(path.join(root, 'worker/handlers/b2b-mou.js'));
function fakeCache(){ const m = new Map(); return { match: async r => (m.has(r.url) ? new Response(m.get(r.url)) : undefined), put: async (r, res) => { m.set(r.url, await res.text()); } }; }
const TOKEN = 'a'.repeat(32);
function deps(deal){ const store = new Map([['deal123456', deal]]); return { store, configured: () => true, get: async id => store.get(id) || null, patch: async (id, v) => { store.set(id, { ...store.get(id), ...v }); } }; }
const post = (b, ip) => new Request('https://w.test/b2b/mou-signed', { method: 'POST', headers: { 'CF-Connecting-IP': ip || '7.7.7.7' }, body: typeof b === 'string' ? b : JSON.stringify(b) });
const GOOD = { deal: 'deal123456', k: TOKEN, name: 'Sukhdyal Thakur', desig: 'Owner', phone: '+91 98765 43210', clientAt: '2026-11-10T05:00:00.000Z' };

test('a deal needs a name and a city; phone and email are normalised or refused', () => {
  assert.equal(B.cleanDeal({ name: 'A', city: '' }).ok, false);
  const c = B.cleanDeal({ name: ' Hygge <b>Home</b> ', city: 'Manali', phone: '+91 98765-43210', email: 'Owner@Example.com', kind: 'nope', plan: 'nope', listingFee: '499.4' });
  assert.equal(c.ok, true);
  assert.equal(c.value.name, 'Hygge b Home /b');
  assert.equal(c.value.phone, '9876543210');
  assert.equal(c.value.email, 'owner@example.com');
  assert.equal(c.value.kind, 'stay'); assert.equal(c.value.plan, 'free'); assert.equal(c.value.listingFee, 499);
  assert.equal(B.cleanDeal({ name: 'Ab', city: 'X', phone: '12345' }).ok, false);
  assert.equal(B.cleanDeal({ name: 'Ab', city: 'X', listingFee: 20000 }).ok, false, 'setup fee above the cap needs the founder');
  assert.equal('longStay' in B.cleanDeal({ name: 'Ab', city: 'X', longStay: { incl: 'wifi' } }).value, false, 'no rates means no long-stay block');
});

test('plans match the published MOU table and the MOU page script', () => {
  const html = read('partner/mou/index.html'), js = read('partner/mou/mou.js');
  for (const [id, p] of Object.entries(B.PLANS)) {
    assert.ok(html.includes('<td>' + p.label + '</td>'), p.label + ' is in the MOU table');
    assert.ok(js.includes(id + ": ['" + p.label + "', " + p.pct + ']'), id + ' matches mou.js');
    if (p.fee) assert.ok(html.includes('₹' + p.fee.toLocaleString('en-IN')), p.label + ' fee matches');
  }
});

test('the MOU link carries only parameters the MOU page reads, plus the deal key', () => {
  const link = B.mouLink({ name: 'Pine & Co', contact: 'Asha', city: 'Kasar Devi, Almora', plan: 'desk', bookingModel: 'net', listingFee: 499, longStay: { r15: 12000, r30: 20000, r90: 0, incl: 'Wi-Fi', rooms: '2', min: '15' } }, { dealId: 'deal123456', token: TOKEN });
  const u = new URL(link);
  assert.equal(u.origin + u.pathname, 'https://roamwise.co.in/partner/mou/');
  assert.equal(u.searchParams.get('property'), 'Pine & Co');
  assert.equal(u.searchParams.get('plan'), 'desk'); assert.equal(u.searchParams.get('booking_model'), 'net');
  assert.equal(u.searchParams.get('ls'), '1'); assert.equal(u.searchParams.get('r30'), '20000'); assert.equal(u.searchParams.has('r90'), false);
  assert.equal(u.searchParams.get('deal'), 'deal123456'); assert.equal(u.searchParams.get('k'), TOKEN);
  const js = read('partner/mou/mou.js');
  for (const k of u.searchParams.keys()) assert.ok(js.includes("'" + k + "'"), 'mou.js reads ' + k);
  assert.equal(new URL(B.mouLink({ name: 'X Y', city: 'Z' }, {})).searchParams.has('deal'), false, 'no key without a token');
  assert.match(B.newToken(), /^[a-f0-9]{32}$/);
  assert.notEqual(B.newToken(), B.newToken());
});

test('only a real signed RoamWise MOU link is accepted as a signed copy', () => {
  const ok = B.parseSignedLink('https://roamwise.co.in/partner/mou/?property=Pine&s=Asha%20Rawat&d=Manager&at=2026-11-10T05:00:00.000Z');
  assert.deepEqual([ok.name, ok.desig, ok.at], ['Asha Rawat', 'Manager', '2026-11-10T05:00:00.000Z']);
  assert.equal(B.parseSignedLink('https://roamwise.co.in/partner/mou/?property=Pine'), null, 'unsigned');
  assert.equal(B.parseSignedLink('https://evil.example/partner/mou/?s=Asha%20Rawat&at=2026-11-10'), null, 'wrong site');
  assert.equal(B.parseSignedLink('https://roamwise.co.in.evil.example/partner/mou/?s=Asha%20Rawat&at=2026-11-10'), null);
  assert.equal(B.parseSignedLink('not a link'), null);
});

test('reported money needs an amount, a date and a reference; it is never counted as received', () => {
  assert.equal(B.cleanTxn({ amount: 0, date: '2026-11-10', ref: '123456789012' }).ok, false);
  assert.equal(B.cleanTxn({ amount: 2499, date: '2026-11-10', ref: '' }).ok, false, 'UPI needs a reference');
  assert.equal(B.cleanTxn({ amount: 2499, date: '2026-11-10', method: 'cash' }).ok, true, 'cash has no reference');
  assert.equal(B.cleanTxn({ amount: 600000, date: '2026-11-10', ref: '123456789012' }).ok, false);
  assert.equal(B.cleanTxn({ amount: 2499, date: '2026-11-10', ref: '123456789012', proofUrl: 'http://x.y/z' }).ok, false, 'proof must be https');
  const s = B.summarise([{ stage: 'lead' }, { stage: 'mou_sent' }, { stage: 'live' }, { stage: 'lost' }, { stage: 'weird' }],
    [{ amount: 2499, status: 'verified', kind: 'plan_fee' }, { amount: 5000, status: 'reported', kind: 'package_deposit' }, { amount: 999, status: 'rejected', kind: 'other' }, { amount: 500, status: 'verified', kind: 'refund' }]);
  assert.match(B.nextStep({ kind: 'package', stage: 'pitched' }), /quote/); assert.match(B.nextStep({ kind: 'stay', stage: 'pitched' }), /MOU/);
  assert.equal(s.verified, 1999); assert.equal(s.reported, 5000); assert.equal(s.open, 3); assert.equal(s.byStage.lead, 2);
});

test('staff can only move a deal through their own stages; the desk and the rules agree', () => {
  assert.deepEqual(B.STAFF_STAGES, ['lead', 'pitched', 'mou_sent', 'lost']);
  const rules = read('firestore.rules');
  assert.ok(rules.includes("request.resource.data.stage in ['lead','pitched','mou_sent','lost']"));
  assert.ok(rules.includes("request.resource.data.status == 'reported'"));
  assert.ok(rules.includes('request.resource.data.amount <= ' + B.TXN_MAX));
  for (const k of Object.keys(B.TXN_KINDS)) assert.ok(rules.includes("'" + k + "'"), 'rules allow txn kind ' + k);
  const block = rules.slice(rules.indexOf('match /b2bDeals/{id}'), rules.indexOf('match /b2bTxns/{id}'));
  for (const f of ['mouSignedAt', 'mouSignedBy', 'ownerUid']) assert.ok(!block.split('affectedKeys()')[1].split(']')[0].includes("'" + f + "'"), 'staff cannot update ' + f);
});

test('package quotes use the published price row and never a typed number', async () => {
  const cat = await import(path.join(root, 'packages/catalog.mjs'));
  const price = cat.priceFor('almora', cat.GROUP.default, { vehicle: 'single', kit: true });
  const msg = B.packageMessage(cat.PACKAGES.almora, cat.GROUP.default, '2026-12-12', price, 'https://roamwise.co.in/packages/?destination=almora');
  assert.ok(msg.includes(B.inr(price.totalPP)) && msg.includes(B.inr(price.groupTotal)) && msg.includes('GST included'));
  assert.equal(B.packageMessage(cat.PACKAGES.almora, 99, '', cat.priceFor('almora', 99), 'x'), '', 'no price row, no quote');
});

test('a partner signature is recorded once, with the server clock, only for the right key', async () => {
  const h = await handler(), d = deps({ name: 'Woodbook', stage: 'mou_sent', mouToken: TOKEN }), now = () => new Date('2026-11-10T06:30:00.000Z');
  const res = await h.handleMouSigned(post(GOOD), {}, d, fakeCache(), now);
  assert.equal(res.status, 200);
  const saved = d.store.get('deal123456');
  assert.equal(saved.stage, 'mou_signed'); assert.equal(saved.mouSignedAt, '2026-11-10T06:30:00.000Z', 'server time, not the browser time');
  assert.equal(saved.mouSignedBy, 'Sukhdyal Thakur'); assert.equal(saved.mouSignerPhone, '9876543210');
  const again = await h.handleMouSigned(post({ ...GOOD, name: 'Someone Else' }), {}, d, fakeCache(), () => new Date('2026-12-01T00:00:00Z'));
  assert.equal((await again.json()).already, true);
  assert.equal(d.store.get('deal123456').mouSignedBy, 'Sukhdyal Thakur', 'a second call changes nothing');
});

test('wrong key, unknown deal, closed deal and malformed bodies are refused', async () => {
  const h = await handler();
  const run = async (body, deal) => (await h.handleMouSigned(post(body), {}, deps(deal || { stage: 'mou_sent', mouToken: TOKEN }), fakeCache())).status;
  assert.equal(await run({ ...GOOD, k: 'b'.repeat(32) }), 404);
  assert.equal(await run({ ...GOOD, deal: 'otherdeal99' }), 404, 'unknown deal looks the same as a wrong key');
  assert.equal(await run(GOOD, { stage: 'mou_sent' }), 404, 'a deal with no token cannot be signed');
  assert.equal(await run(GOOD, { stage: 'lost', mouToken: TOKEN }), 409);
  assert.equal(await run({ ...GOOD, name: 'A' }), 400);
  assert.equal(await run({ ...GOOD, k: 'short' }), 400);
  assert.equal(await run('{nope'), 400);
  assert.equal((await h.handleMouSigned(post(GOOD), {}, { configured: () => false }, fakeCache())).status, 501);
  assert.equal((await h.handleMouSigned(new Request('https://w.test/b2b/mou-signed'), {}, deps({}), fakeCache())).status, 404);
  assert.equal(h.sameToken(TOKEN, TOKEN), true); assert.equal(h.sameToken('', ''), false); assert.equal(h.sameToken(TOKEN, TOKEN + 'a'), false);
});

test('the signature endpoint is rate limited per IP', async () => {
  const h = await handler(), cache = fakeCache(), d = deps({ stage: 'mou_sent', mouToken: TOKEN });
  let last = 0;
  for (let i = 0; i < 9; i++) last = (await h.handleMouSigned(post({ ...GOOD, k: 'c'.repeat(32) }, '9.9.9.9'), {}, d, cache)).status;
  assert.equal(last, 429);
});

test('wiring: staff page loads the desk, the Worker routes the endpoint, the MOU page posts and hides the key', () => {
  const staff = read('staff/index.html');
  assert.ok(staff.indexOf('b2b-core.js') < staff.indexOf('b2b-desk.js') && staff.includes('id="b2bBox"') && staff.includes('id="b2bOut"') && staff.includes('b2bDeskInit()'));
  const worker = read('worker/worker.js');
  assert.ok(worker.includes("path === 'b2b/mou-signed'") && worker.includes("from './handlers/b2b-mou.js'"));
  const mou = read('partner/mou/mou.js');
  assert.ok(mou.includes("'/b2b/mou-signed'") && mou.includes("q.delete('k')"));
  const desk = read('staff/b2b-desk.js');
  new vm.Script(desk); new vm.Script(read('staff/b2b-core.js'));
  const handlers = new Set([...desk.matchAll(/onclick="(?:event\.stopPropagation\(\);)?(b2b[A-Za-z]+)\(/g)].map(m => m[1]));
  for (const fn of handlers) assert.ok(desk.includes('window.' + fn + ' = '), 'onclick handler ' + fn + ' is defined');
  for (const m of desk.matchAll(/'(\/[a-z-]+\/[^']*)', '/g)) { const p = m[1].replace(/#.*$/, ''); assert.ok(fs.existsSync(path.join(root, p, p.endsWith('.html') ? '' : 'index.html')) || fs.existsSync(path.join(root, p)), 'sign-up page exists: ' + p); }
});
