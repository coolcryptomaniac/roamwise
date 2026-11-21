/* Self-listing: automatic checks, the public-safe entry, and the Worker handler with fake Firestore. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as core from '../worker/lib/partner-self-list-core.js';
import { handlePartnerSelfList } from '../worker/handlers/partner-self-list.js';

const GOOD_GSTIN = '05ABCDE1234F1Z' + (() => {
  const C = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', g = '05ABCDE1234F1Z'; let s = 0;
  for (let i = 0; i < 14; i++) { const p = C.indexOf(g[i]) * (i % 2 ? 2 : 1); s += Math.floor(p / 36) + (p % 36); }
  return C[(36 - (s % 36)) % 36];
})();

function app(over) {
  return {
    name: 'Pine Ridge Homestay', zone: 'Almora', area: 'Kasar Devi', type: 'Family homestay',
    ownerName: 'Ravi Bisht', phone: '+91 98765 43210', website: 'https://maps.app.goo.gl/abc123',
    photoUrl: 'https://example.com/p.jpg', startPrice: 2200, hook: 'Quiet rooms with a Himalayan view',
    segments: ['homestay', 'workation', 'nonsense'], guestCapacity: 12, roomCount: 5, status: 'pending',
    packages: [{ name: '1-month workation', nights: 30, segment: 'workation', includes: ['Wi-Fi', 'Two meals'], price: 24000 },
      { name: 'x', nights: 2 }, { name: 'Visit https://spam.example', nights: 2 }],
    onboarding: { mouVersion: core.MOU_VERSION, mouAcceptedAt: '2026-11-19T10:00:00Z', mouSignedName: 'Ravi Singh Bisht', role: 'owner' },
    ...over,
  };
}

test('a complete application passes every automatic check', () => {
  const r = core.assess(app(), 'u1', { emailVerified: true, existing: [], phoneOwners: ['u1'] });
  assert.equal(r.pass, true, JSON.stringify(r.checks.filter((c) => !c.ok)));
  assert.equal(r.hold, false);
});

test('each missing piece blocks go-live with a fix the host can act on', () => {
  const cases = [
    [{ onboarding: { ...app().onboarding, mouVersion: 'OLD' } }, 'mou'],
    [{ onboarding: { ...app().onboarding, mouSignedName: 'Someone Else' } }, 'signature'],
    [{ phone: '12345' }, 'phone'],
    [{ website: '', photoUrl: 'https://example.com/p.jpg' }, 'location'],
    [{ photoUrl: 'http://insecure.example/p.jpg' }, 'photo'],
    [{ segments: [] }, 'segments'],
    [{ startPrice: 50 }, 'price'],
    [{ gstin: '05ABCDE1234F1Z0' === GOOD_GSTIN ? '05ABCDE1234F1Z1' : '05ABCDE1234F1Z0' }, 'gstin'],
    [{ name: 'Visit www.cheap.example' }, 'basics'],
  ];
  for (const [over, id] of cases) {
    const r = core.assess(app(over), 'u1', { emailVerified: true });
    assert.equal(r.pass, false, id);
    const c = r.checks.find((x) => x.id === id);
    assert.equal(c.ok, false, id);
    assert.ok(c.fix.length > 10, id);
  }
  assert.equal(core.assess(app(), 'u1', { emailVerified: false }).checks.find((c) => c.id === 'email').ok, false);
  assert.equal(core.validGstin(GOOD_GSTIN), true);
});

test('duplicates and reused phones are held for a human, not rejected', () => {
  const dup = core.assess(app(), 'u1', { emailVerified: true, existing: [{ id: 'p_x', name: 'Pine Ridge Homestay', zone: 'Almora', partnerUid: 'u2' }] });
  assert.equal(dup.pass, false); assert.equal(dup.hold, true);
  const ph = core.assess(app(), 'u1', { emailVerified: true, phoneOwners: ['u9'] });
  assert.equal(ph.hold, true);
});

test('the public entry is enquiry-only and never carries prices, phone or GSTIN', () => {
  const e = core.publicEntry(app({ gstin: GOOD_GSTIN, payoutUpi: 'x@upi' }), 'u1', '2026-11-19T10:00:00Z');
  assert.equal(e.verified, 'self-listed'); assert.equal(e.enquiryOnly, true); assert.equal(e.bookingMode, 'enquiry');
  assert.deepEqual(e.segments, ['homestay', 'workation']);
  assert.equal(e.packages.length, 1, 'too-short and link names are dropped');
  assert.equal(e.packages[0].price, undefined);
  const s = JSON.stringify(e);
  for (const leak of ['24000', '2200', '98765', 'x@upi', GOOD_GSTIN]) assert.ok(!s.includes(leak), leak);
});

test('merge never overwrites a founder-signed or another host\'s entry, and replaces a renamed one', () => {
  const mine = core.publicEntry(app(), 'u1', 'now');
  const signed = { ...mine, verified: 'signed', partnerUid: 'u1' };
  assert.equal(core.mergeEntry([signed], mine).changed, false);
  const old = { ...mine, id: 'p_old_name' };
  const r = core.mergeEntry([old, { id: 'p_other', verified: 'signed' }], mine);
  assert.equal(r.changed, true);
  assert.deepEqual(r.list.map((x) => x.id).sort(), ['p_other', mine.id].sort());
});

function fakeCache() {
  const m = new Map();
  return { match: async (r) => (m.has(r.url) ? new Response(m.get(r.url)) : undefined), put: async (r, res) => { m.set(r.url, await res.text()); } };
}
function deps(appDoc, claims) {
  const store = new Map([['config/partners', { list: [] }]]);
  if (appDoc) store.set('partners/u1', appDoc);
  return {
    store, configured: () => true,
    verify: async (t) => { if (t !== 'good') throw Error('bad'); return claims || { uid: 'u1', email: 'r@x.in', email_verified: true }; },
    get: async (p) => store.get(p) || null,
    patch: async (p, v) => store.set(p, { ...(store.get(p) || {}), ...v }),
    byPhone: async () => [{ id: 'u1' }],
  };
}
const req = (tok) => new Request('https://w.test/partner/self-list', { method: 'POST', headers: tok ? { authorization: 'Bearer ' + tok, 'cf-connecting-ip': '1.2.3.4', 'user-agent': 'test' } : {}, body: '{}' });

test('handler lists a passing property and records MOU evidence', async () => {
  const d = deps(app());
  const res = await handlePartnerSelfList(req('good'), {}, d, fakeCache());
  const j = await res.json();
  assert.equal(res.status, 200); assert.equal(j.listed, true);
  assert.equal(d.store.get('config/partners').list.length, 1);
  const ev = d.store.get('mouEvidence/u1');
  assert.equal(ev.ip, '1.2.3.4'); assert.equal(ev.signedName, 'Ravi Singh Bisht'); assert.match(ev.contentHash, /^[a-f0-9]{64}$/);
  assert.equal(d.store.get('selfListing/u1').listed, true);
});

test('handler refuses bad tokens, missing applications and paused properties, and publishes nothing on a failed check', async () => {
  const c = fakeCache();
  assert.equal((await handlePartnerSelfList(req(), {}, deps(app()), c)).status, 401);
  assert.equal((await handlePartnerSelfList(req('bad'), {}, deps(app()), c)).status, 401);
  assert.equal((await handlePartnerSelfList(req('good'), {}, deps(null), fakeCache())).status, 404);
  const paused = deps(app({ status: 'suspended' }));
  assert.equal((await (await handlePartnerSelfList(req('good'), {}, paused, fakeCache())).json()).held, true);
  const unverified = deps(app(), { uid: 'u1', email_verified: false });
  const j = await (await handlePartnerSelfList(req('good'), {}, unverified, fakeCache())).json();
  assert.equal(j.listed, false);
  assert.equal(unverified.store.get('config/partners').list.length, 0);
  assert.equal((await handlePartnerSelfList(req('good'), {}, { ...deps(app()), configured: () => false }, fakeCache())).status, 501);
});

test('the app shows self-listed entries only with the current MOU marker', () => {
  const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(new URL('../partners-data.js', import.meta.url), 'utf8'), ctx);
  const ok = ctx.window.rwStayPublicEligible;
  const e = core.publicEntry(app(), 'u1', 'now');
  assert.equal(ok(e), true);
  assert.equal(ok({ ...e, selfListed: { mouVersion: 'OLD' } }), false);
  assert.equal(ok({ ...e, enquiryOnly: false }), false, 'a self-listed entry can never become bookable on its own');
  assert.equal(ok({ ...e, verified: 'self-listed', selfListed: undefined }), false);
});
