import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bandFor, fairCash, barterValue, recommendDeal, tdsCheck, PACKAGES, RATE_SOURCES } from '../creators/rate-guide-core.mjs';
import { analyzeDiscovery, rateCreator, conversionHistory, igUsername, summaryPrompt } from '../creators/ig-rating-core.mjs';
import { policyFromPartner, barterOfferFromPolicy, termsText } from '../creators/property-terms-core.mjs';
import { rankForOffer, buildDeal } from '../creators/local-barter-core.mjs';
import { handleCreatorRating } from '../worker/handlers/creator-rating.js';

const NOW = '2026-10-14T12:00:00Z';
const day = (n) => new Date(Date.parse(NOW) - n * 864e5).toISOString();
function feed({ followers = 18000, likes = 800, comments = 40, n = 20, views = 15000, caption = 'Sunrise over Almora #kumaon', every = 2, spike = 0 } = {}) {
  return { username: 'asha.pahadi', followers_count: followers, media_count: 300, media: { data: Array.from({ length: n }, (_, i) => ({
    like_count: i === 3 && spike ? spike : likes, comments_count: comments, timestamp: day(1 + i * every), media_type: 'VIDEO', media_product_type: 'REELS', view_count: views, caption,
  })) } };
}

test('rate bands follow public India benchmarks and narrow by grade', () => {
  assert.equal(bandFor(5000).tier, 'nano');
  assert.equal(bandFor(30000).tier, 'micro');
  assert.equal(bandFor(70000).tier, 'micro+');
  assert.equal(bandFor(300000).tier, 'mid');
  const a = fairCash(30000, 'A'), c = fairCash(30000, 'C');
  assert.ok(a.low > c.high - 1, `${a.low} vs ${c.high}`);
  assert.ok(fairCash(30000, 'B', 'feature').low > fairCash(30000, 'B', 'standard').low);
  assert.ok(RATE_SOURCES.length >= 3);
  assert.match(PACKAGES.standard.deliverables, /1 Reel \+ 3 Stories/);
});

test('one suggested deal: barter when the stay covers fair value, top-up when it is close, lighter brief otherwise', () => {
  const offer = { guests: 2, nights: 2, food: 'all', travel: 'none' };
  assert.equal(barterValue(offer, 2500).total, 2 * 2500 + 2 * 2 * 600);
  assert.equal(recommendDeal({ followers: 8000, grade: 'B', offer, roomRate: 2500 }).verdict, 'barter');
  const hybrid = recommendDeal({ followers: 20000, grade: 'B', offer, roomRate: 2500, cashBudget: 10000 });
  assert.equal(hybrid.verdict, 'hybrid');
  assert.ok(hybrid.topUp > 0 && hybrid.topUp <= 10000 && hybrid.topUp % 500 === 0);
  assert.equal(recommendDeal({ followers: 20000, grade: 'B', offer, roomRate: 2500, cashBudget: 0 }).verdict, 'lighter');
  assert.equal(recommendDeal({ followers: 400000, grade: 'A', offer, roomRate: 2500 }).verdict, 'negotiate');
  assert.equal(recommendDeal({ followers: 8000, grade: 'B', offer }).verdict, 'barter');
  assert.ok(tdsCheck([12000, 9000]).over);
  assert.equal(tdsCheck([5000]).over, false);
});

test('Instagram analysis reads real engagement, views, cadence and regional content', () => {
  const a = analyzeDiscovery(feed(), { now: NOW });
  assert.equal(a.metrics.followers, 18000);
  assert.equal(a.metrics.engagementPct, 4.67);
  assert.equal(a.metrics.avgViews, 15000);
  assert.equal(a.metrics.postsLast30d, 15);
  assert.equal(a.signals.localContentPct, 100);
  assert.equal(a.metrics.metricsVerified, true);
  const r = rateCreator(a, {});
  assert.equal(r.grade, 'A');
  assert.ok(r.why.some((w) => /region/.test(w)));
  assert.match(summaryPrompt(r), /Do not invent numbers/);
});

test('bought likes, one viral post, an ad-only feed and a dormant account all pull the rating down', () => {
  const good = rateCreator(analyzeDiscovery(feed(), { now: NOW }));
  const botLikes = rateCreator(analyzeDiscovery(feed({ comments: 1 }), { now: NOW }));
  assert.ok(botLikes.flags.includes('likes_without_comments') && botLikes.score < good.score);
  const viral = rateCreator(analyzeDiscovery(feed({ likes: 150, comments: 10, spike: 9000 }), { now: NOW }));
  assert.ok(viral.flags.includes('one_viral_post'));
  const ads = rateCreator(analyzeDiscovery(feed({ caption: 'Use my code #ad #collab' }), { now: NOW }));
  assert.ok(ads.flags.includes('mostly_ads') && ads.flags.includes('no_regional_content'));
  const dormant = rateCreator(analyzeDiscovery(feed({ every: 1 }), { now: '2026-12-30T00:00:00Z' }));
  assert.ok(dormant.flags.includes('not_posting'));
  const inflated = rateCreator(analyzeDiscovery(feed({ followers: 250000, likes: 500, comments: 5 }), { now: NOW }));
  assert.ok(inflated.score <= 35 && inflated.flags.includes('likely_inflated'));
});

test('conversion history: bookings from past stays lift the rating; collabs that never convert lower it', () => {
  const h = conversionHistory({ a: { status: 'closed', bookings: 4, bookingValue: 30000, stayValue: 7400 }, b: { status: 'offered' } }, { verifiedSales: 1 });
  assert.deepEqual([h.collabs, h.bookings, h.roi], [1, 5, 4.1]);
  const base = analyzeDiscovery(feed({ likes: 500 }), { now: NOW });
  const converting = rateCreator(base, h), none = rateCreator(base, conversionHistory({ a: { status: 'closed' }, b: { status: 'content_live' } }));
  assert.ok(converting.score > none.score);
  assert.ok(none.flags.includes('collabs_no_bookings'));
  assert.ok(converting.why.some((w) => /4\.1× their cost/.test(w)));
});

test('usernames come from links or handles; non-profile links are refused', () => {
  assert.equal(igUsername('https://www.instagram.com/asha.pahadi/'), 'asha.pahadi');
  assert.equal(igUsername('@Asha_Pahadi'), 'asha_pahadi');
  assert.equal(igUsername('https://instagram.com/reel/abc'), '');
  assert.equal(igUsername('https://youtube.com/@x'), '');
});

test('worker route: admin only, off until configured, then rates through Business Discovery and caches', async () => {
  const req = (body) => new Request('https://x/admin/creator/ig-rating', { method: 'POST', body: JSON.stringify(body) });
  const deny = await handleCreatorRating(req({ username: 'a' }), {}, { requireAdmin: async () => ({ error: new Response('no', { status: 403 }) }) });
  assert.equal(deny.status, 403);
  const admin = async () => ({ uid: 'u' });
  const off = await handleCreatorRating(req({ username: 'asha.pahadi' }), {}, { requireAdmin: admin });
  assert.equal(off.status, 503);
  assert.equal((await off.json()).configured, false);
  const env = { IG_BUSINESS_ID: '1784', IG_GRAPH_TOKEN: 'tok' };
  const calls = [], store = new Map();
  const cache = { match: async (k) => store.get(k.url), put: async (k, v) => { store.set(k.url, v); } };
  const fetchStub = async (url) => { calls.push(url); return calls.length === 1
    ? new Response(JSON.stringify({ error: { code: 100, message: 'view_count not allowed' } }), { status: 400 })
    : new Response(JSON.stringify({ business_discovery: feed() }), { status: 200 }); };
  const ok = await handleCreatorRating(req({ username: 'https://instagram.com/asha.pahadi' }), env, { requireAdmin: admin, fetch: fetchStub, cache });
  assert.equal(ok.status, 200);
  const out = await ok.json();
  assert.equal(out.username, 'asha.pahadi');
  assert.ok(out.rating.grade);
  assert.equal(calls.length, 2);                                   // retried without view_count
  assert.match(decodeURIComponent(calls[0]), /business_discovery\.username\(asha\.pahadi\)/);
  assert.doesNotMatch(decodeURIComponent(calls[1]), /view_count/);
  await handleCreatorRating(req({ username: 'asha.pahadi' }), env, { requireAdmin: admin, fetch: fetchStub, cache });
  assert.equal(calls.length, 2);                                   // served from cache
  const bad = await handleCreatorRating(req({ username: 'https://instagram.com/p/xyz' }), env, { requireAdmin: admin, fetch: fetchStub, cache });
  assert.equal(bad.status, 400);
});

test('join-form terms become a creator policy; opted in without terms stays pending', () => {
  const doc = { name: 'Pine Nest', zone: 'Almora', ownerWa: '9876500099', startPrice: 2500, creatorMatching: { enabled: true, maximumCash: 3000, niches: ['food'], terms: {
    guests: 2, nights: 2, food: 'all', travel: 'pickup', package: 'standard', performancePct: 10, performanceMax: 5000, maxPerMonth: 3, reach: 'nearby', months: [1, 2, 7, 8], weekdaysOnly: true, instantAccept: true } } };
  const p = policyFromPartner('uid123', doc);
  assert.equal(p.status, 'open');
  assert.equal(p.propertyId, 'p_uid123');
  assert.deepEqual([p.freeStay.guests, p.freeStay.food, p.freeStay.travel, p.freeStay.maxPerMonth], [2, 'all', 'pickup', 3]);
  assert.deepEqual(p.freeStay.offSeasonMonths, [1, 2, 7, 8]);
  assert.equal(p.performanceCash.max, 5000);
  assert.equal(p.roomRate, 2500);
  assert.match(termsText(p), /Free stay for 2: 2 nights, Sunday to Thursday nights only, off-season \(Jan, Feb, Jul, Aug\), meals included, local pickup/);
  const offer = barterOfferFromPolicy(p);
  assert.equal(offer.instantAccept, true);
  assert.match(offer.offer.deliverables, /1 Reel \+ 3 Stories/);
  assert.equal(policyFromPartner('u2', { name: 'X', creatorMatching: { enabled: true } }).status, 'pending');
  assert.equal(policyFromPartner('u3', { name: 'Y', creatorMatching: { enabled: false } }).status, 'closed');
});

test('pre-agreed terms and a fair-price check make the creator message a one-step yes', () => {
  const p = policyFromPartner('uid123', { name: 'Pine Nest', zone: 'Almora', ownerWa: '9876500099', startPrice: 2500, creatorMatching: { enabled: true, terms: { guests: 2, nights: 2, food: 'all', travel: 'none', package: 'standard', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxPerMonth: 2, instantAccept: true } } });
  const offer = barterOfferFromPolicy(p);
  const c = { id: 'a1', name: 'Asha', town: 'Ranikhet', phone: '9876500001', ask: { guests: 2, food: 'all' }, metrics: { followers: 8000, engagementPct: 6, avgViews: 6000, postsLast30d: 9, metricsVerified: true } };
  const [row] = rankForOffer(offer, [c]).notify;
  const rec = recommendDeal({ followers: 8000, grade: row.quality.grade, pkg: offer.package, offer: offer.offer, roomRate: offer.roomRate });
  const deal = buildDeal(offer, row, { recommendation: rec });
  assert.match(deal.toCreator, /already agreed these exact terms: reply YES with 2-3 dates and it is confirmed/);
  assert.match(deal.toCreator, /Fair-price check: about ₹/);
  assert.match(deal.toCreator, /held for you for 48 hours/);
  assert.match(deal.toProperty, /Fair price for this creator: ₹/);
});

test('reach: a property can keep automatic offers to its own town', () => {
  const offer = { propertyId: 'p', location: { town: 'Almora' }, offer: { guests: 2, nights: 2, food: 'all' }, reach: 'local' };
  const c = { id: 'h', name: 'H', town: 'Haldwani', phone: '9876500002', ask: { guests: 2, food: 'all' }, metrics: { followers: 18000, engagementPct: 5, avgViews: 12000, postsLast30d: 9, metricsVerified: true } };
  assert.equal(rankForOffer(offer, [c]).negotiate.length, 1);
  assert.equal(rankForOffer({ ...offer, reach: 'nearby' }, [c]).notify.length, 1);
});

test('the join form asks for full creator terms and blocks an opt-in without them', async () => {
  const html = await readFile(new URL('../partner/join/index.html', import.meta.url), 'utf8');
  for (const id of ['creatorTerms', 'ctGuests', 'ctNights', 'ctFood', 'ctTravel', 'ctPackage', 'ctPerfPct', 'ctPerfMax', 'ctMaxPerMonth', 'ctReach', 'ctMonths', 'ctWeekdays', 'ctAccept']) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(html, /Creator terms: choose whether food is included/);
  assert.match(html, /Creator terms: please confirm you will honour these terms/);
  assert.match(html, /terms:d\.creatorDeal!=='none'\?creatorTerms\(d\):null/);
  assert.match(html, /reviews are never part of a barter/);
});

test('Milan Heights stay is priced at the off-season low end of its ₹1,500–3,000 room range', async () => {
  const { SEED_POLICIES } = await import('../creators/property-terms-core.mjs');
  const offer = barterOfferFromPolicy(SEED_POLICIES.find((p) => p.propertyId === 'p_milan_heights'));
  assert.deepEqual([offer.roomRate, offer.roomRateMax], [1500, 3000]);
  assert.equal(barterValue(offer.offer, offer.roomRate).stay, 3000);    // 2 nights × ₹1,500
});
