import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPartners, buildActions, insights, funnel, publicId } from '../admin/command-core.mjs';

const V4 = { mouVersion: 'RW-PMOU-2026-09-27-V4', mouAcceptedAt: '2026-10-01' };
const ok = { identity: 'verified', property: 'verified', experience: 'verified', payout: 'verified', overall: 'verified' };
const media = { photoUrl: 'https://example.com/a.jpg' };
const P = [
  { id: 'a', name: 'Ready House', zone: 'Almora', phone: '9000000001', onboarding: V4, verification: ok, status: 'pending', media },
  { id: 'b', name: 'Live House', zone: 'Almora', phone: '9000000002', onboarding: V4, verification: ok, status: 'active', verified: true, media, roomCount: 2 },
  { id: 'c', name: 'No Rooms', zone: 'Manali', phone: '9000000003', onboarding: V4, verification: ok, status: 'active', verified: true, media, roomCount: 0 },
  { id: 'd', name: 'Fresh Lead', zone: 'Almora', phone: '9000000004', status: 'pending' },
];
const rows = buildPartners(P, [{ id: publicId(P[1]) }, { id: publicId(P[2]) }]);
const by = (id) => rows.find((r) => r.id === id);

test('a property with every owner detail but no approval is "complete" and awaits approval', () => {
  assert.equal(by('a').st.stage, 'verified');
  assert.equal(by('a').st.complete, true);
  assert.ok(by('a').st.missing.includes('Approve to go live'));
});
test('only approved + listed + room-bearing properties are bookable', () => {
  assert.equal(by('b').st.bookable, true);
  assert.equal(by('c').st.bookable, false);
  assert.ok(by('c').st.missing.some((m) => /priced room/.test(m)));
});
test('an application with no MOU stays at applied and lists the gaps', () => {
  assert.equal(by('d').st.stage, 'applied');
  assert.ok(by('d').st.missing[0].includes('MOU'));
});
test('funnel counts are monotonic non-increasing', () => {
  const n = funnel(rows).map((x) => x[1]);
  for (let i = 1; i < n.length; i++) assert.ok(n[i] <= n[i - 1]);
});
test('action queue puts waiting guests first and offers one-tap WhatsApp', () => {
  const now = Date.now();
  const a = buildActions({ partners: rows, leads: [{ id: 'l1', name: 'Asha', phone: '9111111111', status: 'new', createdAt: new Date(now - 5 * 36e5).toISOString(), items: [{ name: 'Live House' }] }], now });
  assert.equal(a[0].id, 'lead:l1');
  assert.match(a[0].href, /^https:\/\/wa\.me\/919111111111/);
  assert.ok(a.some((x) => x.id === 'ap:a'));
  assert.ok(a.some((x) => x.id === 'rm:c'));
});
test('insights flag a city with signed partners but nothing bookable', () => {
  const i = insights({ partners: [by('a'), by('d')] });
  assert.ok(i.notes.some((n) => /Almora/.test(n.text) && /none is bookable/.test(n.text)));
});
test('contacted guests and fresh bookings do not create actions', () => {
  const a = buildActions({ partners: [], leads: [{ id: 'x', status: 'contacted', createdAt: 1 }], bookings: [{ id: 'k', status: 'requested', createdAt: new Date().toISOString() }] });
  assert.equal(a.length, 0);
});
