import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessTrust, autopilotDecision, normalizeMatchProfile, quoteCollaboration, rankMatches, recommendTier, scoreMatch, PLATFORM_FEES } from '../creators/match-core.mjs';

const creator = {
  role: 'creator', dealModes: ['barter', 'hybrid'], niches: ['wellness', 'mountains'],
  platforms: ['instagram'], destinations: ['uttarakhand'], services: ['reel', 'stories'],
  profileUrl: 'https://instagram.com/example', accountAgeDays: 800, minimumCash: 0
};
const property = {
  role: 'property', dealModes: ['barter', 'hybrid'], niches: ['wellness', 'mountains'],
  platforms: ['instagram'], destinations: ['uttarakhand'], profileUrl: 'https://example.com/stay',
  hostedNights: 2, mealsIncluded: true, maximumCash: 5000, accountAgeDays: 900
};

test('barter is the safe default when no deal mode is selected', () => {
  assert.deepEqual(normalizeMatchProfile({ role: 'creator' }).dealModes, ['barter']);
});

test('aligned profiles are shortlisted by autopilot', () => {
  const result = scoreMatch(creator, property);
  assert.ok(result.score >= 80);
  assert.equal(result.shortlist, true);
  assert.equal(autopilotDecision(creator, property).action, 'invite_both');
});

test('ordinary hosted collaborations stay barter-first', () => {
  assert.equal(recommendTier(property, creator).id, 'hybrid');
  assert.equal(recommendTier({ ...property, maximumCash: 0 }, creator).id, 'barter');
});

test('high-cash or weak profiles require manual review', () => {
  const check = assessTrust({ ...creator, profileUrl: '', maximumCash: 25000 });
  assert.equal(check.requiresManualReview, true);
  assert.ok(check.flags.includes('public_profile_missing'));
  assert.equal(autopilotDecision(creator, { ...property, maximumCash: 25000, newOpening: true }).action, 'manual_review');
});

test('self-onboarding exposes share paths and role-specific first tasks', async () => {
  const [page, client] = await Promise.all([
    readFile(new URL('../creators/match.html', import.meta.url), 'utf8'),
    readFile(new URL('../creators/matchmaking.js', import.meta.url), 'utf8')
  ]);
  assert.match(page, /shareWhatsApp/);
  assert.match(page, /Instagram bio\/DM, YouTube description or email/);
  assert.match(client, /YOUR FIRST 4 TASKS/);
  assert.match(client, /Creator launch checklist/);
  assert.match(client, /Property launch checklist/);
});

test('match page opts out of the global opening overlay that caused a blank purple screen', async () => {
  const page = await readFile(new URL('../creators/match.html', import.meta.url), 'utf8');
  assert.match(page, /<html[^>]+class="rw-opening-skip"/);
  assert.match(page, /src="\.\.\/rw-config\.js"/);
  assert.match(page, /<noscript>/);
});

test('the worker only introduces trust-reviewed verified profiles', async () => {
  const worker = await readFile(new URL('../creators/protection/worker.mjs', import.meta.url), 'utf8');
  assert.match(worker, /\/v1\/creator-protection\/match-profile/);
  assert.match(worker, /\/v1\/creator-protection\/matches/);
  assert.match(worker, /\/v1\/creator-protection\/match-reviews/);
  assert.ok(worker.includes("match-profiles\\/([^/]+)\\/review"));
  assert.match(worker, /Trust review must finish before introductions/);
  assert.match(worker, /p\.verified_state='verified'/);
});

test('plan markup has no escaped newline and budget control includes animated mood stages', async () => {
  const [home, budget] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../js/ui/currency-budget.js', import.meta.url), 'utf8')
  ]);
  assert.doesNotMatch(home, /<\/script>\\n<script/);
  for (const label of ['Jugaad Ninja', 'Paisa Vasool', 'Picture Abhi Baaki', 'Nawaabi Scene', 'Main Character Energy']) {
    assert.match(budget, new RegExp(label));
  }
  assert.match(budget, /rw-akatsuki-cloud/);
});

test('home recommendations are consolidated instead of stacking specialty rails', async () => {
  const painter = await readFile(new URL('../js/ui/card-painter.js', import.meta.url), 'utf8');
  assert.match(painter, /One smart mix for/);
  assert.match(painter, /rw-discovery-feed/);
  assert.doesNotMatch(painter, /addRail\('In season locally'/);
});

test('regional and synonym themes still match', () => {
  const r = scoreMatch({ ...creator, niches: ['yoga'], destinations: ['uttarakhand'] }, { ...property, niches: ['wellness'], destinations: ['almora'] });
  assert.ok(r.breakdown.theme > 0);
  assert.ok(r.breakdown.geography > 0);
});

test('no shared deal style is never a match', () => {
  const r = scoreMatch({ ...creator, dealModes: ['paid'], minimumCash: 8000 }, { ...property, dealModes: ['barter'], maximumCash: 0 });
  assert.equal(r.compatible, false);
  assert.equal(r.shortlist, false);
  assert.ok(r.score <= 40);
  assert.equal(autopilotDecision({ ...creator, dealModes: ['paid'], minimumCash: 8000 }, { ...property, dealModes: ['barter'], maximumCash: 0 }).action, 'hold');
});

test('thin profiles are asked for details instead of introduced', () => {
  const thin = { role: 'creator', dealModes: ['barter'], profileUrl: 'https://instagram.com/thin', accountAgeDays: 800 };
  const d = autopilotDecision(thin, { role: 'property', dealModes: ['barter'], profileUrl: 'https://example.com/thin', accountAgeDays: 900 });
  assert.equal(d.action, 'ask_for_details');
  assert.ok(d.match.confidence < 0.6);
});

test('rankMatches filters role, dedupes, and sorts best first', () => {
  const weak = { ...property, id: 'weak', niches: ['nightlife'], destinations: ['goa'] };
  const list = rankMatches({ ...creator, id: 'c1' }, [
    { ...property, id: 'p1' }, { ...property, id: 'p1' }, weak,
    { ...creator, id: 'c2' }, { ...creator, id: 'c1' }
  ], { minScore: 0 });
  assert.deepEqual(list.map(x => x.id), ['p1', 'weak']);
  assert.ok(list[0].score >= list[1].score);
  assert.ok(list[0].quote);
  assert.throws(() => rankMatches({ role: 'x' }, []));
});

test('fee quote: creator keeps 100%, property pays the fee', () => {
  const cash = quoteCollaboration({ ...property, maximumCash: 5000 }, creator);
  assert.equal(cash.tier, 'hybrid');
  assert.equal(cash.platformFee, Math.max(PLATFORM_FEES.minCashFee, Math.round(cash.creatorReceives * PLATFORM_FEES.cashBps / 10000)));
  assert.equal(cash.propertyPays, cash.creatorReceives + cash.platformFee);
  const barter = quoteCollaboration({ ...property, maximumCash: 0 }, creator);
  assert.equal(barter.creatorReceives, 0);
  assert.equal(barter.platformFee, PLATFORM_FEES.barterSuccessFee);
  assert.match(barter.dueWhen, /after the hosted stay/);
  const tiny = quoteCollaboration({ ...property, maximumCash: 3000 }, creator, { cashBps: 100, minCashFee: 99, barterSuccessFee: 0 });
  assert.equal(tiny.platformFee, 99);
});
