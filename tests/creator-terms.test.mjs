import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SEED_POLICIES, normalizePolicy, mergePolicies, checkStayWindow, suggestWindows, termsText, performanceBonus,
  evaluateCollab, suggestAdjustments, applyAdjustment, buildAiPrompt, parseAiSuggestions,
} from '../creators/property-terms-core.mjs';

const byId = Object.fromEntries(SEED_POLICIES.map((p) => [p.propertyId, p]));
const milan = byId.p_milan_heights;
const creator = { role: 'creator', dealModes: ['barter', 'hybrid'], niches: ['mountains', 'food'], platforms: ['instagram'], destinations: ['almora'], services: ['reel', 'stories'], profileUrl: 'https://instagram.com/x', accountAgeDays: 600, minimumCash: 0 };
const base = { niches: ['mountains', 'food', 'family'], platforms: ['instagram'], destinations: ['almora'], profileUrl: 'https://roamwise.co.in/p/milan', accountAgeDays: 900 };

test('seed statuses match what the owners said', () => {
  assert.equal(milan.status, 'open');
  assert.equal(milan.performanceCash.max, 5000);
  assert.equal(milan.upfrontCash, 0);
  assert.equal(byId.p_soulmate_homestay.status, 'closed');
  assert.equal(byId.p_new_himank.status, 'pending');
  assert.ok(milan.unconfirmed.includes('performanceCash.ratePct'));
});

test('closed and pending properties never introduce anyone', () => {
  assert.equal(evaluateCollab(creator, byId.p_soulmate_homestay, base).action, 'closed');
  assert.equal(evaluateCollab(creator, byId.p_new_himank, base).action, 'waiting_on_owner');
});

test('Milan: weekday off-season stays pass, weekend and peak-season stays are refused with windows offered', () => {
  assert.equal(checkStayWindow(milan, '2026-08-10', 2).ok, true);        // Mon-Tue nights in August
  const wk = checkStayWindow(milan, '2026-08-14', 2);                    // Fri night
  assert.equal(wk.ok, false); assert.match(wk.problems.join(' '), /weekend/);
  assert.match(checkStayWindow(milan, '2026-11-02', 2).problems.join(' '), /peak season/);
  const r = evaluateCollab(creator, milan, base, { checkIn: '2026-11-06', nights: 2, today: '2026-10-07' });
  assert.equal(r.action, 'dates_not_offered');
  assert.ok(r.windows.length > 0);
  r.windows.forEach((w) => assert.equal(checkStayWindow(milan, w.checkIn, w.nights).ok, true));
});

test('a fitting creator is invited, with cash contingent and nothing upfront', () => {
  const r = evaluateCollab(creator, milan, base, { checkIn: '2026-08-10', nights: 2, today: '2026-07-01' });
  assert.ok(['invite_both', 'shortlist'].includes(r.action), r.action);
  assert.equal(r.quote.creatorReceives, 0);
  assert.equal(r.quote.contingentCashUpTo, 5000);
  assert.match(r.terms, /nothing upfront/);
});

test('a creator who needs money upfront and refuses barter is held', () => {
  const r = evaluateCollab({ ...creator, dealModes: ['paid'], minimumCash: 10000 }, milan, base);
  assert.equal(r.action, 'hold'); assert.match(r.reason, /upfront/);
});

test('monthly cap stops new invitations and offers later windows', () => {
  const r = evaluateCollab(creator, milan, base, { acceptedThisMonth: 2, today: '2026-08-01' });
  assert.equal(r.action, 'full_this_month');
});

test('performance bonus counts only completed stays and never passes the cap', () => {
  const b = performanceBonus(milan, [
    { code: 'RW-AAAAAA', status: 'completed', bookingValue: 20000 },   // 2000
    { code: 'RW-BBBBBB', status: 'cancelled', bookingValue: 90000 },   // ignored
    { code: 'RW-CCCCCC', status: 'completed', bookingValue: 40000 },   // 4000, capped to 3000
  ]);
  assert.equal(b.earned, 5000); assert.equal(b.remaining, 0);
  assert.equal(b.lines[1].capped, true);
  assert.equal(performanceBonus(byId.p_soulmate_homestay, [{ status: 'completed', bookingValue: 9999 }]).earned, 0);
});

test('suggestions are explainable and need the owner; auto-apply obeys owner ceilings', () => {
  const s = suggestAdjustments(milan, { completedCreatorStays: 4, referredConversions: 0 });
  assert.equal(s[0].field, 'freeStay.nights'); assert.equal(s[0].to, 1); assert.equal(s[0].needsOwner, true);
  assert.equal(applyAdjustment(milan, s[0]).applied, false);             // auto-adjust off by default
  const on = normalizePolicy({ ...milan, autoAdjust: { enabled: true, ceilings: { maxCash: 6000, maxNights: 2, maxPerMonth: 3 } } });
  const up = applyAdjustment(on, { field: 'performanceCash.max', to: 9000 });
  assert.equal(up.applied, true); assert.equal(up.to, 6000);             // clamped to the owner's ceiling
  assert.equal(applyAdjustment(on, { field: 'status', to: 'closed' }).applied, false);
  assert.equal(applyAdjustment(byId.p_soulmate_homestay, { field: 'freeStay.nights', to: 2 }).applied, false);
});

test('model output is untrusted: only whitelisted fields, hard bounds, max three', () => {
  const text = 'Sure! [{"field":"performanceCash.max","to":9999999,"reason":"x"},{"field":"upfrontCash","to":5000,"reason":"y"},{"field":"status","to":"open","reason":"z"},{"field":"freeStay.maxPerMonth","to":3,"reason":"more nights empty"}]';
  const out = parseAiSuggestions(text, milan);
  assert.deepEqual(out.map((x) => x.field), ['performanceCash.max', 'freeStay.maxPerMonth']);
  assert.equal(out[0].to, 50000);
  assert.ok(out.every((x) => x.needsOwner && x.source === 'ai'));
  assert.deepEqual(parseAiSuggestions('not json', milan), []);
  assert.match(buildAiPrompt(milan, { applications30d: 1 }), /Never suggest upfront cash/);
});

test('admin overrides replace seeds and are re-validated', () => {
  const merged = mergePolicies(SEED_POLICIES, [{ propertyId: 'p_new_himank', name: 'New Himank', status: 'open', freeStay: { nights: 1, offSeasonOnly: false }, performanceCash: { max: 2000, ratePct: 8 } }, { propertyId: 'p_x', status: 'bogus' }]);
  const h = merged.find((p) => p.propertyId === 'p_new_himank');
  assert.equal(h.status, 'open'); assert.equal(h.freeStay.nights, 1);
  assert.equal(merged.find((p) => p.propertyId === 'p_x').status, 'pending');
  assert.match(termsText(milan), /Sunday to Thursday/);
});

import { audienceBand, fitLowAsk, rankCandidates, inviteMessage, searchPlan } from '../creators/sourcing-core.mjs';

test('sourcing: nano/micro local creators rank first; celebrities and upfront-askers are skipped', () => {
  const opts = { zone: 'almora', niches: ['mountains', 'food'] };
  const good = fitLowAsk({ handle: 'a', platform: 'instagram', followers: 18000, engagementPct: 4.1, postsLast30d: 9, location: 'almora', niches: ['mountains', 'food'], openToBarter: true }, opts);
  assert.equal(good.band, 'micro'); assert.equal(good.verdict, 'invite_first'); assert.ok(good.score >= 80);
  const star = fitLowAsk({ handle: 'b', followers: 1200000, engagementPct: 3.4, postsLast30d: 12, location: 'uttarakhand', niches: ['mountains'] }, opts);
  assert.equal(star.verdict, 'skip'); assert.ok(star.flags.includes('celebrity_tier'));
  const fee = fitLowAsk({ handle: 'c', followers: 9000, engagementPct: 5, postsLast30d: 8, location: 'almora', niches: ['food'], askedUpfrontINR: 8000 }, opts);
  assert.equal(fee.verdict, 'skip'); assert.ok(fee.flags.includes('asks_upfront'));
  assert.equal(audienceBand(500), 'tiny');
});

test('sourcing: availability is never assumed, duplicates are dropped, ranking is by score', () => {
  const r = rankCandidates([
    { handle: 'x', platform: 'instagram', followers: 5000, postsLast30d: 6, location: 'almora', niches: ['food'] },
    { handle: 'X', platform: 'instagram', followers: 5000 },
    { handle: 'y', platform: 'instagram', followers: 30000, engagementPct: 3.5, postsLast30d: 10, location: 'almora', niches: ['mountains'], availability: 'confirmed' },
  ], { zone: 'almora', niches: ['mountains'] });
  assert.equal(r.length, 2); assert.equal(r[0].handle, 'y'); assert.equal(r[0].availability, 'confirmed'); assert.equal(r[1].availability, 'unknown');
});

test('sourcing: invitation states the real terms and makes it easy to decline', () => {
  const m = inviteMessage(milan, 'Riya Sharma', { joinUrl: 'https://roamwise.co.in/creators/match.html?role=creator' });
  assert.match(m, /^Hi Riya/); assert.match(m, /Milan Heights/); assert.match(m, /nothing upfront/); assert.match(m, /free to say no/);
  assert.ok(searchPlan('Almora').instagram.includes('#almora'));
});
