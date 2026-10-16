import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoster, rosterCounts, creatorOf, flagsOf, toCsv, creatorIntro } from '../creators/roster-core.mjs';
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
