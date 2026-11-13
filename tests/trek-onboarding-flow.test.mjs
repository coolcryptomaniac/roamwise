/* Trek operator onboarding, end to end through the real Worker handler with an in-memory Google backend
   (tests/helpers/fake-google.mjs): apply -> departure -> review (changes, approve, publish) -> enquiry -> inbox. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeGoogle } from './helpers/fake-google.mjs';

const g = createFakeGoogle();
g.install();
const { handleTrekMarketplace } = await import('../worker/handlers/treks-marketplace.js');
const env = { ...g.env, CASHFREE_ENV: 'live' };
g.docs.set('admins/founderUid', { ok: true });
const tokens = {
  op: g.idToken({ uid: 'opUid', email: 'gaurav@hikeandseek.in' }),
  founder: g.idToken({ uid: 'founderUid', email: 'founder@roamwise.co.in' }),
  other: g.idToken({ uid: 'otherUid', email: 'someone@else.in' }),
  unverified: g.idToken({ uid: 'u3', email: 'x@y.in', emailVerified: false }),
};
async function call(path, body, who) {
  const headers = { 'content-type': 'application/json' };
  if (who) headers.authorization = 'Bearer ' + tokens[who];
  const res = await handleTrekMarketplace(new Request('https://w/' + path, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) }), env, path);
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const mailTo = (to, re) => g.mails.some((m) => m.to === to && re.test(m.subject + '\n' + m.text));
const future = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const apply = { role: 'company', name: 'Hike & Seek', region: 'Dehradun, Uttarakhand', email: 'gaurav@hikeandseek.in', phone: '+91 92863 22067', consent: true };
const trek = { name: 'Kedarkantha Winter Trek', region: 'Dehradun · Sankri', start: future(20), duration: 6, unitPrice: 8999, pricingUnit: 'person', seats: 12,
  itinerary: 'Day 1: Dehradun to Sankri', includes: 'Trek leader, meals, tents', refundPolicy: 'Full refund 15 days before', safetyNote: 'Certified leader, oximeter' };
let pkgId, enquiryId;

test('applying needs a verified Google login whose email matches the form', async () => {
  assert.equal((await call('treks/apply', apply)).status, 401);
  assert.equal((await call('treks/apply', apply, 'unverified')).status, 401);
  assert.equal((await call('treks/apply', { ...apply, email: 'other@x.in' }, 'op')).data.error, 'email_must_match_login');
});

test('missing fields are named, and a phone typed with spaces is accepted and stored clean', async () => {
  const bad = await call('treks/apply', { ...apply, consent: false, region: '' }, 'op');
  assert.equal(bad.status, 422);
  assert.deepEqual(bad.data.fields.sort(), ['consent', 'region']);
  const ok = await call('treks/apply', apply, 'op');
  assert.equal(ok.status, 200);
  assert.equal(g.docs.get('trekProviders/opUid').phone, '+919286322067');
  assert.equal(g.docs.get('trekProviders/opUid').status, 'pending_review');
  assert.ok(mailTo('founder@roamwise.co.in', /New trek partner application: Hike & Seek/));
  assert.ok(mailTo('gaurav@hikeandseek.in', /what happens next/i));
});

test('a departure names every problem field, saves for review and tells the founder', async () => {
  const bad = await call('treks/package', { ...trek, start: '2025-01-01', unitPrice: 50, safetyNote: '' }, 'op');
  assert.equal(bad.status, 422);
  assert.deepEqual(bad.data.fields.sort(), ['safetyNote', 'start', 'unitPrice']);
  const ok = await call('treks/package', trek, 'op');
  assert.equal(ok.data.status, 'pending_review');
  pkgId = ok.data.id;
  assert.ok(mailTo('founder@roamwise.co.in', /New trek departure: Kedarkantha/));
  assert.equal((await call('treks/package', { ...trek, id: pkgId, name: 'Hijack' }, 'other')).status, 403);
});

test('founder can request changes with a note; the operator is emailed and can resubmit', async () => {
  assert.equal((await call('treks/admin', undefined, 'op')).status, 403);
  assert.equal((await call('treks/admin/action', { kind: 'provider', id: 'opUid', action: 'changes' }, 'founder')).data.error, 'review_note_required');
  await call('treks/admin/action', { kind: 'provider', id: 'opUid', action: 'changes', note: 'Add your trek leader certificate number' }, 'founder');
  assert.equal(g.docs.get('trekProviders/opUid').status, 'changes_requested');
  assert.ok(mailTo('gaurav@hikeandseek.in', /certificate number/));
  assert.equal((await call('treks/package', { ...trek, id: pkgId }, 'op')).status, 200, 'can still edit departures while fixing');
  await call('treks/apply', { ...apply, registration: 'BMC 4471' }, 'op');
  assert.equal(g.docs.get('trekProviders/opUid').status, 'pending_review');
});

test('approve, then publish: the trek appears in the catalog and the operator gets the live link', async () => {
  assert.equal((await call('treks/admin/action', { kind: 'package', id: pkgId, action: 'publish' }, 'founder')).data.error, 'approve_provider_first');
  await call('treks/admin/action', { kind: 'provider', id: 'opUid', action: 'approve' }, 'founder');
  await call('treks/admin/action', { kind: 'package', id: pkgId, action: 'publish' }, 'founder');
  const cat = await call('treks/catalog');
  assert.deepEqual(cat.data.items.map((i) => i.id), [pkgId]);
  assert.ok(mailTo('gaurav@hikeandseek.in', /You are approved/));
  assert.ok(mailTo('gaurav@hikeandseek.in', new RegExp('package=' + pkgId)));
});

test('a traveller enquiry records the trek, reaches the operator by email and in the inbox', async () => {
  const sent = await call('treks/enquiry', { packageId: pkgId, name: 'Asha', email: 'asha@example.com', phone: '98765 43210', message: 'Space for 3?', consent: true });
  assert.equal(sent.status, 201);
  enquiryId = sent.data.reference;
  const saved = g.docs.get('trekEnquiries/' + enquiryId);
  assert.equal(saved.packageId, pkgId, 'enquiry is linked to its trek');
  assert.equal(saved.phone, '+919876543210');
  assert.ok(mailTo('gaurav@hikeandseek.in', /New enquiry: Kedarkantha[\s\S]*asha@example.com/));
  const inbox = await call('treks/enquiries', undefined, 'op');
  assert.equal(inbox.data.items[0].packageId, pkgId);
  await call('treks/enquiries/status', { id: enquiryId, status: 'contacted' }, 'op');
  assert.equal(g.docs.get('trekEnquiries/' + enquiryId).status, 'contacted');
  assert.equal((await call('treks/enquiries/status', { id: enquiryId, status: 'closed' }, 'other')).status, 403);
});

test('an approved operator who edits their profile stays approved and live', async () => {
  const r = await call('treks/apply', { ...apply, description: 'Small-group Garhwal treks' }, 'op');
  assert.equal(r.data.status, 'approved');
  assert.equal((await call('treks/catalog')).data.items.length, 1);
  assert.ok(mailTo('founder@roamwise.co.in', /Trek partner updated profile/));
});

test('editing a live departure sends it back for a check and says so; closing hides it', async () => {
  const r = await call('treks/package', { ...trek, id: pkgId, unitPrice: 9499 }, 'op');
  assert.equal(r.data.wasLive, true);
  assert.equal((await call('treks/catalog')).data.items.length, 0);
  await call('treks/admin/action', { kind: 'package', id: pkgId, action: 'publish' }, 'founder');
  await call('treks/package/close', { packageId: pkgId }, 'op');
  assert.equal(g.docs.get('trekPackages/' + pkgId).status, 'paused');
  assert.equal((await call('treks/catalog')).data.items.length, 0);
});
