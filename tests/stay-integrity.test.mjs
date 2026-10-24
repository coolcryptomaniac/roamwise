import test from 'node:test';
import assert from 'node:assert/strict';
import { appendEvent, verifyChain, termsFingerprint, diffTerms, cleanTerms, analyseRecord, propertyReview, canonical } from '../worker/lib/stay-integrity-core.js';

const build = async () => {
  let c = [];
  c = await appendEvent(c, { actor: 'guest', type: 'enquiry', at: '2026-11-01T08:00:00Z', data: { partnerId: 'p_big_bro_hotel' } });
  c = await appendEvent(c, { actor: 'property', type: 'property_report', at: '2026-11-20T09:00:00Z', data: { status: 'completed', amount: 50000, checkIn: '2026-11-05' } });
  c = await appendEvent(c, { actor: 'guest', type: 'guest_confirm', at: '2026-11-21T09:00:00Z', data: { stayed: 'yes' } });
  return c;
};

test('chain: verifies, is deterministic and never mutates its input', async () => {
  const c = await build(), v = await verifyChain(c);
  assert.equal(v.ok, true); assert.equal(v.length, 3); assert.match(v.head, /^[a-f0-9]{64}$/);
  const before = JSON.stringify(c); await appendEvent(c, { actor: 'admin', type: 'admin_settle', data: {} }); assert.equal(JSON.stringify(c), before);
  assert.equal((await verifyChain(await build())).head, v.head);
});

test('chain: changing an amount, deleting an event or reordering is detected at the right place', async () => {
  const c = await build();
  const edited = JSON.parse(JSON.stringify(c)); edited[1].data.amount = 20000; assert.deepEqual(await verifyChain(edited), { ok: false, brokenAt: 1 });
  const cut = c.filter((_, i) => i !== 1); assert.equal((await verifyChain(cut)).ok, false);
  const swapped = [c[0], c[2], c[1]]; assert.equal((await verifyChain(swapped)).ok, false);
  const rehashed = JSON.parse(JSON.stringify(c)); rehashed[1].data.amount = 20000; assert.equal((await verifyChain(rehashed)).brokenAt, 1);
});

test('chain: unknown actors and event types are refused', async () => {
  await assert.rejects(() => appendEvent([], { actor: 'hacker', type: 'enquiry' })); await assert.rejects(() => appendEvent([], { actor: 'guest', type: 'delete_everything' }));
});

test('terms: same data hashes the same whatever the key order; differences are listed', async () => {
  const a = { checkIn: '2026-11-05', nights: 30, guests: 2, total: 50000 }, b = { total: 50000, guests: 2, nights: 30, checkIn: '2026-11-05' };
  assert.equal(await termsFingerprint(a), await termsFingerprint(b)); assert.equal(canonical({ b: 1, a: 2 }), canonical({ a: 2, b: 1 }));
  assert.deepEqual(diffTerms(a, { ...b, total: 35000, checkIn: '2026-11-09' }), ['checkIn', 'total']);
  assert.deepEqual(diffTerms(a, { total: 50000 }), []); // a side that did not state a field never conflicts
  assert.deepEqual(cleanTerms({ checkIn: 'tomorrow', nights: -3, guests: 'x', total: 1e12 }), { checkIn: '', nights: 0, guests: 0, total: 0 });
});

test('record: tampered history, changed amount, mismatched terms and denied stays are flagged high', async () => {
  const c = await build(); const bad = JSON.parse(JSON.stringify(c)); bad[1].data.amount = 1000;
  const f = (await analyseRecord({ code: 'RW-7KQ2MX', partnerId: 'p', events: bad }, {})).map((x) => x.kind);
  assert.ok(f.includes('history_tampered'));
  let c2 = await appendEvent(c, { actor: 'property', type: 'property_report', data: { status: 'completed', amount: 25000, checkIn: '2026-11-05' } });
  const f2 = await analyseRecord({ code: 'RW-7KQ2MX', partnerId: 'p', events: c2 }, {});
  assert.ok(f2.some((x) => x.kind === 'amount_changed_after_report' && x.severity === 'high' && /50000 -> 25000/.test(x.detail)));
  const f3 = await analyseRecord({ code: 'RW-7KQ2MX', partnerId: 'p', termsGuest: { total: 50000, nights: 30 }, termsProperty: { total: 35000, nights: 30 }, status: 'completed', guestStayed: 'no' }, {});
  ['terms_mismatch', 'guest_denies_stay'].forEach((k) => assert.ok(f3.some((x) => x.kind === k && x.severity === 'high'), k));
});

test('record: under-reported value, stay before enquiry and silent stays are flagged; a clean record has no flags', async () => {
  const low = await analyseRecord({ code: 'RW-7KQ2MX', partnerId: 'p', status: 'completed', amount: 10000, checkIn: '2026-11-05', createdAt: '2026-11-01T00:00:00Z' }, { listedPerNight: 2000, nights: 15 });
  assert.ok(low.some((x) => x.kind === 'amount_far_below_listed'));
  assert.ok((await analyseRecord({ code: 'RW-7KQ2MX', partnerId: 'p', checkIn: '2026-10-01', createdAt: '2026-11-01T00:00:00Z' }, {})).some((x) => x.kind === 'checkin_before_enquiry'));
  assert.ok((await analyseRecord({ code: 'RW-7KQ2MX', partnerId: 'p', status: 'enquired', guestStayed: 'yes' }, {})).some((x) => x.kind === 'guest_stayed_not_reported'));
  const ok = await analyseRecord({ code: 'RW-7KQ2MX', partnerId: 'p', status: 'completed', amount: 30000, checkIn: '2026-11-05', createdAt: '2026-11-01T00:00:00Z', guestStayed: 'yes', events: await build() }, { listedPerNight: 2000, nights: 15 });
  assert.deepEqual(ok, []);
});

test('property review: guests say they stayed but the property reports nothing -> review; honest property -> ok', () => {
  const row = (partnerId, status, guestStayed, i) => ({ partnerId, status, guestStayed, code: 'RW-' + partnerId + i, createdAt: '2026-11-0' + (1 + (i % 8)) + 'T00:00:00Z' });
  const leaky = Array.from({ length: 8 }, (_, i) => row('leaky', 'enquired', i < 5 ? 'yes' : '', i));
  const honest = Array.from({ length: 8 }, (_, i) => row('honest', i < 5 ? 'completed' : 'enquired', i < 5 ? 'yes' : '', i));
  const out = propertyReview([...leaky, ...honest]);
  assert.equal(out[0].partnerId, 'leaky'); assert.equal(out[0].level, 'review'); assert.match(out[0].reasons[0], /5 of 5 guest-confirmed stays were never reported/);
  assert.equal(out.find((x) => x.partnerId === 'honest').level, 'ok');
  assert.equal(propertyReview([row('quiet', 'enquired', '', 0)])[0].level, 'ok');
});
