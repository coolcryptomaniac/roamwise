import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoster, rosterCounts, creatorOf, flagsOf, toCsv, creatorIntro, canSpotlight, spotlightEntry, withSpotlight, withoutSpotlight, shareBlocked, isInstagramUrl } from '../creators/roster-core.mjs';
import { SEED_POLICIES } from '../creators/property-terms-core.mjs';

const apps = [
  { id: 'a1', name: 'Asha Rawat', email: 'asha@example.com', handle: 'https://instagram.com/asha', phone: '919900000001', niche: 'mountains, food', stage: 'new', barter: { location: { town: 'almora' }, ask: { guests: 2, nights: 1, food: 'breakfast' } } },
  { id: 'a2', name: 'No Phone', email: 'asha@example.com', handle: 'instagram.com/nophone', niche: 'travel', barter: { location: { town: 'delhi' }, ask: { guests: 2, nights: 2, food: 'all', travel: true } } },
  { id: 'a3', name: 'Bare Minimum' }
];

test('Big Bro is an open creator property with its agreed terms', () => {
  const p = SEED_POLICIES.find((x) => x.propertyId === 'p_big_bro_hotel');
  assert.equal(p.status, 'open');
  assert.equal(p.freeStay.nights, 1); assert.equal(p.freeStay.guests, 2); assert.equal(p.freeStay.food, 'breakfast');
  assert.equal(p.cashBudget, 3000); assert.ok(p.unconfirmed.length >= 2);
});

test('every application appears, none is dropped, and bare records do not throw', () => {
  const rows = buildRoster(apps, SEED_POLICIES);
  assert.equal(rows.length, 3);
  assert.ok(rows.every((r) => Array.isArray(r.matches) && Array.isArray(r.flags)));
});

test('a nearby creator whose ask fits is ready to send; a far one needs a chat', () => {
  const rows = buildRoster(apps, SEED_POLICIES);
  const a1 = rows.find((r) => r.id === 'a1'), a2 = rows.find((r) => r.id === 'a2');
  assert.equal(a1.best.verdict, 'send');
  assert.notEqual(a2.best.verdict, 'send');
});

test('flags catch missing phone, bad link and duplicate email', () => {
  const rows = buildRoster(apps, SEED_POLICIES), a2 = rows.find((r) => r.id === 'a2');
  assert.ok(a2.flags.includes('no phone / WhatsApp'));
  assert.ok(a2.flags.some((f) => f.includes('https')));
  assert.ok(a2.flags.some((f) => f.includes('same email')));
});

test('closed and pending properties never get matches', () => {
  const rows = buildRoster(apps, SEED_POLICIES);
  const names = new Set(rows.flatMap((r) => r.matches.map((m) => m.name)));
  assert.ok(!names.has('Soulmate Homestay')); assert.ok(!names.has('New Himank'));
});

test('counts, CSV and intro message', () => {
  const rows = buildRoster(apps, SEED_POLICIES), c = rosterCounts(rows);
  assert.equal(c.total, 3); assert.equal(c.send + c.negotiate + c.no_match, 3);
  assert.ok(toCsv(rows).startsWith('name,handle,email'));
  const a1 = rows.find((r) => r.id === 'a1');
  assert.match(creatorIntro(a1, a1.best), /^https:\/\/wa\.me\/919900000001\?text=/);
  assert.equal(creatorIntro(rows.find((r) => r.id === 'a3'), rows[0].best), '');
});

test('home spotlight: only public Instagram + match result, never phone or email', () => {
  const rows = buildRoster([{ ...apps[0], note: 'WhatsApp: +91 99000 00001' }], SEED_POLICIES);
  assert.ok(canSpotlight(rows[0]).ok);
  const e = spotlightEntry(rows[0]);
  assert.deepEqual(Object.keys(e).sort(), ['handle', 'id', 'match', 'name', 'niche', 'town']);
  assert.ok(!JSON.stringify(e).includes('99000') && !JSON.stringify(e).includes('example.com'));
  assert.ok(e.match.name && e.match.score >= 0 && e.match.score <= 100);
});

test('creators who ask not to be shared, or lack a public Instagram link, are never spotlighted', () => {
  assert.ok(shareBlocked({ note: "Please don't share my photos publicly" }));
  assert.ok(!shareBlocked({ note: 'WhatsApp: +91 99000 00001' }));
  const blocked = buildRoster([{ ...apps[0], note: 'no photos please' }], SEED_POLICIES)[0];
  assert.equal(canSpotlight(blocked).ok, false);
  assert.ok(blocked.flags.some((f) => /not to be shared/.test(f)));
  assert.equal(canSpotlight(buildRoster([apps[1]], SEED_POLICIES)[0]).ok, false);
  assert.ok(isInstagramUrl('https://www.instagram.com/asha/') && !isInstagramUrl('https://evil.com/instagram.com/x') && !isInstagramUrl('javascript:alert(1)'));
});

test('spotlight list is capped, de-duplicated and removable', () => {
  let l = []; for (let i = 0; i < 15; i++) l = withSpotlight(l, { id: 'c' + i });
  assert.equal(l.length, 12); assert.equal(withSpotlight(l, { id: 'c14' }).length, 12);
  assert.ok(!withoutSpotlight(l, 'c14').some((x) => x.id === 'c14'));
});
