import assert from 'node:assert/strict';
import test from 'node:test';
import { listingGate, scoreMatch, rankSuppliers, quoteIntroduction, normalizeProfile } from '../creators/marketplace-match-core.mjs';
import { PLATFORM_FEE_GST_BPS } from '../creators/match-core.mjs';

const driverDocs = ['driving_licence', 'vehicle_registration', 'commercial_permit', 'insurance'];
const driver = { kind: 'driver', name: 'Pankaj Cabs', destinations: ['almora'], categories: ['mountains'], budgetMin: 2500, budgetMax: 6000, verifiedDocuments: driverDocs, profileUrl: 'https://example.com/p' };
const traveller = { kind: 'traveller', destinations: ['kumaon'], categories: ['hills'], budgetMax: 4000, dateFrom: '2026-11-02', dateTo: '2026-11-05' };

test('nothing is listed until its documents are verified', () => {
  assert.equal(listingGate({ ...driver, verifiedDocuments: ['driving_licence'] }).allowed, false);
  assert.deepEqual(listingGate({ ...driver, verifiedDocuments: ['driving_licence'] }).missing, ['vehicle_registration', 'commercial_permit', 'insurance']);
  assert.equal(listingGate(driver).allowed, true);
  assert.equal(listingGate({ kind: 'agency', verifiedDocuments: ['business_name'] }).allowed, false);
  assert.equal(listingGate(traveller).allowed, false); // demand side is never "listed"
});

test('a driver on a fare-share or dispatch model is blocked', () => {
  for (const m of ['fare_share', 'dispatch', 'surge_pricing']) {
    const g = listingGate({ ...driver, models: [m] });
    assert.equal(g.allowed, false); assert.ok(g.blockers.includes('model_needs_review:' + m));
    assert.equal(scoreMatch(traveller, { ...driver, models: [m] }).eligible, false);
  }
});

test('a verified nearby driver within budget matches; hard gates block the rest', () => {
  const ok = scoreMatch(traveller, { ...driver, budgetMin: 3000 });
  assert.equal(ok.eligible, true); assert.ok(ok.score >= 45); assert.ok(ok.reasons.includes('budget fits'));
  assert.ok(scoreMatch(traveller, { ...driver, destinations: ['goa'] }).blockers.includes('no_shared_place'));
  assert.ok(scoreMatch(traveller, { ...driver, budgetMin: 9000 }).blockers.includes('budget_gap'));
  assert.ok(scoreMatch(traveller, { ...driver, verifiedDocuments: [] }).blockers.includes('documents_not_verified'));
  assert.ok(scoreMatch({ ...traveller, kind: 'venue' }, driver).blockers.includes('kind_not_served'));
  const ev = { kind: 'event', destinations: ['almora'], categories: ['music'], dateFrom: '2026-12-01', dateTo: '2026-12-03', verifiedDocuments: ['organiser_identity', 'venue_permission', 'event_dates'] };
  assert.ok(scoreMatch(traveller, ev).blockers.includes('dates_do_not_overlap'));
});

test('unknown details are weak, not neutral, and are asked for', () => {
  const thin = scoreMatch({ kind: 'traveller', destinations: ['almora'] }, driver);
  assert.equal(thin.eligible, true);
  assert.deepEqual(thin.askForDetails, ['interests', 'budget', 'dates']);
  assert.ok(thin.score < scoreMatch(traveller, { ...driver, budgetMin: 3000 }).score);
});

test('ranking returns eligible suppliers best first', () => {
  const far = { ...driver, name: 'Far', destinations: ['goa'] };
  const near = { ...driver, name: 'Near', budgetMin: 3000 };
  const blocked = { ...driver, name: 'Blocked', verifiedDocuments: [] };
  const r = rankSuppliers(traveller, [far, blocked, near]);
  assert.deepEqual(r.map((x) => x.supply.name), ['Near']);
});

test('fees are charged to the supplier, never to the traveller and never a share of fares', () => {
  assert.equal(quoteIntroduction(driver).fee, 99);
  assert.equal(quoteIntroduction(driver).travellerPays, 0);
  assert.match(quoteIntroduction(driver).dueWhen, /Never a share of the fare/);
  assert.equal(quoteIntroduction({ kind: 'agency' }).fee, 149);
  assert.equal(quoteIntroduction({ kind: 'event' }).fee, 499);
  const a = quoteIntroduction({ kind: 'artist' }, { confirmedAmount: 50000 });
  assert.equal(a.fee, 2500); assert.equal(a.feeGst, Math.round(2500 * PLATFORM_FEE_GST_BPS / 10000)); assert.equal(a.holdsMoney, false);
  assert.equal(quoteIntroduction({ kind: 'artist' }, { confirmedAmount: 500 }).fee, 99); // minimum
  assert.throws(() => quoteIntroduction({ kind: 'traveller' }));
});

test('input is normalised safely', () => {
  assert.throws(() => normalizeProfile({ kind: 'wizard' }));
  const p = normalizeProfile({ kind: 'event', dateFrom: '2026-12-05', dateTo: '2026-12-01', budgetMin: '9000', budgetMax: '100', profileUrl: 'http://x' });
  assert.equal(p.dateFrom, '2026-12-01'); assert.equal(p.budgetMin, 100); assert.equal(p.profileUrl, '');
});
