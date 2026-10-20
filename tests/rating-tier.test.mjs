import test from 'node:test';
import assert from 'node:assert/strict';
import { rateTier, TIERS } from '../creators/rating-tier-core.mjs';
import { buildRoster, canSpotlight } from '../creators/roster-core.mjs';
import { SEED_POLICIES } from '../creators/property-terms-core.mjs';

const good = { followers: 8000, engagementPct: 5, avgViews: 4000, postsLast30d: 10 };

test('bought-follower patterns are Mirage', () => {
  assert.equal(rateTier({ followers: 80000, engagementPct: 0.2, avgViews: 30000, postsLast30d: 8 }).tier, 'mirage');           // 80k followers, 0.2% engagement
  assert.equal(rateTier({ followers: 60000, engagementPct: 3, avgViews: 500, postsLast30d: 8 }).tier, 'mirage');              // reels reach <2%
  assert.equal(rateTier({ followers: 90000, engagementPct: 3, avgViews: 40000, postsLast30d: 8, accountAgeDays: 60 }).tier, 'mirage');
  assert.equal(rateTier({ followers: 20000, engagementPct: 45, avgViews: 9000, postsLast30d: 8 }).tier, 'mirage');            // unbelievably high engagement
  assert.ok(rateTier({ followers: 80000, engagementPct: 0.2, avgViews: 30000 }).reasons.length > 0);
});

test('new or data-poor creators are Base Camp, not punished', () => {
  assert.equal(rateTier({}).tier, 'basecamp');
  assert.equal(rateTier({ followers: 600, engagementPct: 8, postsLast30d: 6 }).tier, 'basecamp');
});

test('healthy self-reported creators reach Ridge at most; Summit needs checked numbers and bookings', () => {
  const r = rateTier({ ...good, followers: 120000, engagementPct: 4, avgViews: 60000, verifiedBookings: 6 });
  assert.equal(r.tier, 'ridge'); assert.equal(r.evidence, 'self-reported');
  const s = rateTier({ followers: 120000, engagementPct: 4, avgViews: 60000, postsLast30d: 10, verifiedBookings: 6, metricsVerified: true });
  assert.equal(s.tier, 'summit'); assert.match(s.reasons[0], /6 verified bookings/);
  const noBookings = rateTier({ followers: 120000, engagementPct: 4, avgViews: 60000, postsLast30d: 10, metricsVerified: true });
  assert.notEqual(noBookings.tier, 'summit');
});

test('many clicks and no bookings keeps a creator at Trail', () => {
  const r = rateTier({ ...good, metricsVerified: true, verifiedClicks: 200 });
  assert.ok(TIERS.indexOf(r.tier) <= TIERS.indexOf('trail')); assert.ok(r.reasons.some((x) => /no bookings/.test(x)));
});

test('founder override wins and says so; unknown values are ignored', () => {
  assert.equal(rateTier({}, { override: 'summit' }).tier, 'summit'); assert.ok(rateTier({}, { override: 'summit' }).overridden);
  assert.equal(rateTier({}, { override: 'gold' }).tier, 'basecamp');
});

const base = { handle: 'https://www.instagram.com/x/', phone: '919900000001', barter: { location: { town: 'almora' }, ask: { guests: 2, nights: 1, food: 'breakfast' } } };
test('a Mirage creator is never matched or featured; a Summit travel creator can still be introduced to a food-only stay', () => {
  const rows = buildRoster([
    { ...base, id: 'm', name: 'Fake', niche: 'food', barter: { ...base.barter, metrics: { followers: 80000, engagementPct: 0.2, avgViews: 30000, postsLast30d: 8 } } },
    { ...base, id: 's', name: 'Star Traveller', niche: 'travel', barter: { ...base.barter, metrics: { followers: 150000, engagementPct: 4, avgViews: 70000, postsLast30d: 10, verifiedBookings: 4, metricsVerified: true } } },
    { ...base, id: 'o', name: 'Ordinary Traveller', niche: 'travel', barter: { ...base.barter, metrics: { followers: 9000, engagementPct: 5, avgViews: 4000, postsLast30d: 8 } } },
  ], SEED_POLICIES);
  const milan = (id) => rows.find((r) => r.id === id).matches.find((m) => m.propertyId === 'p_milan_heights');
  assert.equal(milan('m').verdict, 'no_fit'); assert.match(milan('m').why.join(' '), /Mirage/);
  assert.equal(canSpotlight(rows.find((r) => r.id === 'm')).ok, false);
  assert.equal(milan('s').verdict, 'negotiate'); assert.match(milan('s').why.join(' '), /Summit creator/);
  assert.equal(milan('o').verdict, 'no_fit');
  assert.equal(rows.find((r) => r.id === 's').rating.tier, 'summit');
});

test('Instagram API numbers replace typed ones, count as checked, and signals can cap a tier', () => {
  const now = new Date().toISOString();
  const app = { id: 'i', name: 'IG Creator', handle: 'https://www.instagram.com/x/', phone: '919900000001', niche: 'food',
    barter: { location: { town: 'almora' }, ask: {}, metrics: { followers: 99999999, engagementPct: 50 },
      instagram: { ratedAt: now, metrics: { followers: 130000, engagementPct: 4, avgViews: 60000, postsLast30d: 10, metricsVerified: true }, signals: {} } }, refSales: 3 };
  const r = buildRoster([app], SEED_POLICIES)[0];
  assert.equal(r.metrics.followers, 130000, 'Instagram wins over typed numbers');
  assert.equal(r.rating.tier, 'summit'); assert.equal(r.rating.evidence, 'instagram');
  const gamed = buildRoster([{ ...app, id: 'g', barter: { ...app.barter, instagram: { ...app.barter.instagram, signals: { giveaways: 6, viralDependence: 12 } } } }], SEED_POLICIES)[0];
  assert.equal(gamed.rating.tier, 'trail'); assert.ok(gamed.rating.reasons.some((x) => /giveaway/.test(x)));
  const stale = buildRoster([{ ...app, id: 's', barter: { ...app.barter, instagram: { ...app.barter.instagram, ratedAt: '2025-01-01T00:00:00Z' } } }], SEED_POLICIES)[0];
  assert.equal(stale.igRatedAt.slice(0, 4), '2025'); assert.notEqual(stale.metrics.followers, 130000, 'stale Instagram data (over 90 days) is not trusted');
});
