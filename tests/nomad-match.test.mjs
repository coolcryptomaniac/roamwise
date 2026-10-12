import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanBrief, nomadTier, scoreSpace, scoreDestination, rank, ratePerMonth, stayTotal, seekerMessage, hostMessage, waLink, liveSpaces, DESTINATIONS } from '../nomads/nomad-core.mjs';

const strong = { nomad: { mbps: 120, backup: 'full', desk: 'ergonomic', callRoom: true, kitchen: true, laundry: true, coworking: true, community: true, verified: true, rate15: 26000, rate30: 24000, rate90: 21000, minNights: 15 } };
const weak = { nomad: { mbps: 8, backup: 'none', desk: 'none', rate30: 0 } };

test('cleanBrief clamps and defaults hostile input', () => {
  const b = cleanBrief({ persona: 'x', stay: 7, wifi: 3, budget: 1e12, people: 99, must: ['backup', '<b>', 'backup'], vibes: ['beach', 'beach', 'mountain', 'city', 'nature'], start: 'tomorrow' });
  assert.equal(b.persona, 'professional'); assert.equal(b.stay, 30); assert.equal(b.wifi, 25);
  assert.equal(b.budget, 250000); assert.equal(b.people, 6); assert.deepEqual(b.must, ['backup']); assert.equal(b.vibes.length, 3); assert.equal(b.start, '');
});

test('nomad tiers follow the evidence and flag self-declared spaces', () => {
  const t = nomadTier(strong);
  assert.equal(t.tier.id, 'studio'); assert.equal(t.score, 100); assert.equal(t.verified, true);
  const w = nomadTier(weak);
  assert.equal(w.tier.id, 'none'); assert.ok(w.missing.length >= 4);
  const unverified = nomadTier({ nomad: { ...strong.nomad, verified: false } });
  assert.equal(unverified.needsProof, true);
});

test('long stays are never priced above shorter ones and totals are whole hundreds', () => {
  assert.equal(ratePerMonth(strong, 90), 21000); assert.equal(ratePerMonth(strong, 30), 24000); assert.equal(ratePerMonth(strong, 15), 52000);
  assert.equal(stayTotal(strong, 15) % 100, 0);
  assert.equal(ratePerMonth({ nomad: {} }, 30), 0);
});

test('a strong verified space outranks a weak one for a founder who needs video calls', () => {
  const brief = { persona: 'founder', stay: 30, wifi: 25, budget: 40000, must: ['backup', 'community'], vibes: ['mountain'] };
  const a = scoreSpace({ ...strong, vibes: ['mountain'] }, brief), b = scoreSpace({ ...weak, vibes: ['mountain'] }, brief);
  assert.ok(a.score > 80 && b.score < 50, a.score + ' vs ' + b.score);
  assert.ok(b.gaps.some(g => /Wi-Fi/.test(g)));
});

test('over-budget and too-long minimum stays are called out', () => {
  const r = scoreSpace({ nomad: { ...strong.nomad, minNights: 60 } }, { stay: 15, budget: 8000 });
  assert.ok(r.gaps.some(g => /budget/i.test(g))); assert.ok(r.gaps.some(g => /Minimum stay/.test(g)));
});

test('destinations rank by budget, connectivity and mood', () => {
  const top = rank(DESTINATIONS, scoreDestination, { wifi: 100, budget: 70000, vibes: ['nature'], must: [] }, 3);
  assert.equal(top.length, 3); assert.ok(top[0].score >= top[2].score);
  assert.ok(DESTINATIONS.every(d => /^https:\/\//.test(d.src)));
  const poorNet = scoreDestination(DESTINATIONS.find(d => d.id === 'jibhi'), { wifi: 100 });
  assert.ok(poorNet.gaps.some(g => /Connectivity/.test(g)));
});

test('only signed, ready partners with a nomad profile become live spaces', () => {
  const list = liveSpaces([
    { id: 1, cat: 'stay', verified: 'signed', listingReady: true, nomad: { mbps: 50 } },
    { id: 2, cat: 'stay', verified: 'listed', listingReady: true, nomad: { mbps: 50 } },
    { id: 3, cat: 'stay', verified: 'signed', listingReady: false, nomad: { mbps: 50 } },
    { id: 4, cat: 'stay', verified: 'signed', listingReady: true }
  ]);
  assert.deepEqual(list.map(p => p.id), [1]);
});

test('messages are bounded plain text with no markup and WhatsApp links need an Indian number', () => {
  const m = seekerMessage({ persona: 'team', stay: 90, budget: 60000, wifi: 50, must: ['backup'], people: 4 }, { name: 'Pine <b>Ridge</b>' });
  assert.ok(m.length <= 900 && m.includes('3 months') && m.includes('4 people'));
  const h = hostMessage({ name: '<script>', place: 'Almora', owner: 'Asha', phone: '+91 98765 43210', mbps: 60, rate30: 25000, rooms: 3, backup: 'full', desk: 'basic' });
  assert.ok(!/[<>]/.test(h) && h.includes('Tier') === false && h.includes('/100'));
  assert.equal(waLink('9876543210', 'x'), '');
  assert.match(waLink('919876543210', 'hi there'), /^https:\/\/wa\.me\/919876543210\?text=hi%20there$/);
});
