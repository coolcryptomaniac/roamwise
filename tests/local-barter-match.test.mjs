import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLocation, distanceKm, proximity, termsFit, creatorQuality, rankForOffer, buildDeal,
  waNumber, waLink, mapsLink, directionsLink, offerText, confirmationMessage, normalizeCreatorAsk,
} from '../creators/local-barter-core.mjs';
import { SEED_POLICIES, barterOfferFromPolicy, normalizePolicy, termsText } from '../creators/property-terms-core.mjs';

/* "Milan Heights proposes stay and food for content, no cash" */
const MILAN = {
  propertyId: 'p_milan_heights', name: 'Milan Heights', whatsapp: '917302315845',
  location: { town: 'Almora', lat: 29.5966, lng: 79.6593 },
  offer: { guests: 2, nights: 2, food: 'all', travel: 'none', cashMax: 0 },
};
const good = { followers: 18000, engagementPct: 5.2, avgViews: 14000, postsLast30d: 9, audienceLocalPct: 45, metricsVerified: true };
const ask = { guests: 2, nights: 2, food: 'all', travel: false, cashMin: 0 };

test('towns resolve; Kumaon belt is local or nearby for an Almora stay, other states and countries are far', () => {
  assert.equal(resolveLocation('Almora').state, 'UK');
  assert.equal(resolveLocation({ town: 'Naini Tal' }).town, 'naini tal');
  assert.ok(resolveLocation({ town: 'Naini Tal' }).known);
  assert.equal(resolveLocation({ lat: 29.6, lng: 79.66 }).source, 'coordinates');
  assert.equal(resolveLocation('Atlantis').known, false);
  assert.equal(proximity('kasar devi', MILAN.location).tier, 'local');
  for (const t of ['haldwani', 'bhimtal', 'nainital', 'bageshwar', 'ranikhet', 'kausani']) assert.equal(proximity(t, MILAN.location).tier, 'nearby', t);
  assert.equal(proximity('dehradun', MILAN.location).tier, 'regional');
  assert.equal(proximity('delhi', MILAN.location).tier, 'far');
  assert.equal(proximity('bareilly', MILAN.location).label, 'Other state');       // close, but another state: negotiate
  assert.equal(proximity('kathmandu', MILAN.location).label, 'Other country');
  const km = distanceKm('almora', 'haldwani');
  assert.ok(km > 35 && km < 55, String(km));
  assert.equal(proximity('atlantis', MILAN.location).tier, 'unknown');
});

test('terms: stay for two + food + no cash is ready for a local creator who asks for exactly that', () => {
  const r = termsFit(ask, MILAN.offer, 'local');
  assert.equal(r.fit, 'ready');
  assert.ok(r.lines.every((l) => l.status === 'ok'));
});

test('terms: travel, cash and food gaps become negotiation points, not silent rejections', () => {
  const travel = termsFit({ ...ask, travel: true }, MILAN.offer, 'nearby');
  assert.equal(travel.fit, 'negotiate');
  assert.equal(travel.lines.find((l) => l.item === 'travel').status, 'gap');
  assert.equal(termsFit({ ...ask, travel: true }, MILAN.offer, 'local').fit, 'ready');  // local travel is negligible
  const cash = termsFit({ ...ask, cashMin: 5000 }, MILAN.offer, 'local');
  assert.equal(cash.fit, 'negotiate');
  assert.match(cash.lines.find((l) => l.item === 'cash').text, /5,000/);
  assert.equal(termsFit({ ...ask, cashMin: 5000, negotiable: false }, MILAN.offer, 'local').fit, 'no_fit');
  assert.equal(termsFit({ ...ask, food: 'all' }, { ...MILAN.offer, food: 'breakfast' }, 'local').fit, 'negotiate');
  assert.equal(termsFit(ask, MILAN.offer, 'far').fit, 'negotiate');                    // far always negotiates in writing
  assert.equal(normalizeCreatorAsk({}).guests, 2);
});

test('quality: engagement and conversions beat raw followers; bought audiences are capped', () => {
  const real = creatorQuality(good);
  const inflated = creatorQuality({ followers: 220000, engagementPct: 0.3, avgViews: 4000, postsLast30d: 10, metricsVerified: true });
  assert.ok(real.score > inflated.score, `${real.score} vs ${inflated.score}`);
  assert.ok(inflated.flags.includes('likely_inflated'));
  assert.ok(inflated.score <= 35);
  const converter = creatorQuality({ ...good, verifiedBookings: 6 });
  assert.ok(converter.score > real.score);
  assert.ok(converter.why.some((w) => /verified booking/.test(w)));
  const selfReported = creatorQuality({ ...good, metricsVerified: false });
  assert.ok(selfReported.score < real.score && selfReported.flags.includes('self_reported'));
  assert.ok(creatorQuality({ followers: 9000, engagementPct: 40, metricsVerified: true }).flags.includes('engagement_suspicious'));
  assert.ok(creatorQuality({ followers: 9000, avgLikes: 400, avgComments: 50 }).engagementPct === 5);
  assert.equal(creatorQuality(good).grade, 'A');
});

test('Milan Heights barter reaches nearby good creators first; far creators go to negotiation; weak ones are skipped', () => {
  const creators = [
    { id: 'a1', name: 'Asha Almora', town: 'Almora', phone: '9876500001', ask, metrics: good, niches: ['food', 'mountains'] },
    { id: 'h1', name: 'Harsh Haldwani', town: 'Haldwani', phone: '9876500002', ask, metrics: { ...good, engagementPct: 4 } },
    { id: 'b1', name: 'Bina Bageshwar', town: 'Bageshwar', phone: '9876500003', ask: { ...ask, travel: true }, metrics: good },
    { id: 'd1', name: 'Dev Delhi', town: 'Delhi', phone: '9876500004', ask, metrics: { ...good, followers: 90000, engagementPct: 3 } },
    { id: 'm1', name: 'Big Mumbai', town: 'Mumbai', phone: '9876500005', ask: { ...ask, cashMin: 25000 }, metrics: { followers: 400000, engagementPct: 0.4, metricsVerified: true } },
    { id: 'n1', name: 'Nainital Weak', town: 'Nainital', phone: '9876500006', ask, metrics: { followers: 1200, postsLast30d: 0 } },
    { id: 'r1', name: 'Recent Ranikhet', town: 'Ranikhet', phone: '9876500007', ask, metrics: good, lastOfferAt: '2026-10-10T00:00:00Z' },
    { id: 'a1', name: 'Duplicate', town: 'Almora', ask, metrics: good },
  ];
  const r = rankForOffer({ ...MILAN, niches: ['food'] }, creators, { today: '2026-10-14T00:00:00Z' });
  assert.ok(r.barterOnly);
  assert.deepEqual(r.notify.map((x) => x.id), ['a1', 'h1']);
  assert.deepEqual(r.negotiate.map((x) => x.id).sort(), ['b1', 'd1']);                // travel ask, other state
  const skipped = Object.fromEntries(r.skipped.map((x) => [x.id, x.why]));
  assert.equal(skipped.m1, 'quality below bar');
  assert.equal(skipped.n1, 'quality below bar');
  assert.equal(skipped.r1, 'offered recently');
  assert.equal(r.notify.length + r.negotiate.length + r.skipped.length, 7);           // duplicate dropped
});

test('a regional creator gets the offer automatically only when the property pays travel or they are strong and self-funded', () => {
  const doon = { id: 'dn', name: 'Doon', town: 'Dehradun', phone: '9876500010', ask, metrics: { ...good, verifiedBookings: 3 } };
  assert.equal(rankForOffer(MILAN, [doon]).notify.length, 1);
  assert.equal(rankForOffer(MILAN, [{ ...doon, metrics: { ...good, engagementPct: 2, avgViews: 2000 } }]).negotiate.length, 1);
  assert.equal(rankForOffer({ ...MILAN, offer: { ...MILAN.offer, travel: 'full' } }, [{ ...doon, metrics: { ...good, engagementPct: 2, avgViews: 2000 } }]).notify.length, 1);
});

test('the deal goes to both sides on WhatsApp with a map, the terms and one reference', () => {
  const [row] = rankForOffer(MILAN, [{ id: 'a1', name: 'Asha Rawat', handle: '@asha.pahadi', town: 'Kasar Devi', phone: '098765 00001', ask, metrics: good }]).notify;
  const deal = buildDeal(MILAN, row, { today: '2026-10-14' });
  assert.match(deal.id, /^RWD-[0-9A-Z]{1,6}$/);
  assert.ok(deal.creatorWa.startsWith('https://wa.me/919876500001?text='));
  assert.ok(deal.propertyWa.startsWith('https://wa.me/917302315845?text='));
  assert.match(deal.toCreator, /Hi Asha/);
  assert.match(deal.toCreator, /Stay for 2, 2 nights, all meals, own travel, no cash/);
  assert.match(deal.toCreator, /google\.com\/maps\/search\/\?api=1&query=29\.5966%2C79\.6593/);
  assert.match(deal.toCreator, /Reply YES/);
  assert.match(deal.toProperty, /@asha\.pahadi/);
  assert.match(deal.toProperty, /18,000 followers · 5\.2% engagement/);
  assert.match(deal.toProperty, /grade A/);
  assert.ok(deal.toCreator.includes(deal.id) && deal.toProperty.includes(deal.id));
  assert.match(deal.directions, /maps\/dir\/\?api=1&origin=.*&destination=29\.5966%2C79\.6593/);
  const conf = confirmationMessage(deal, { checkIn: '2026-11-03', nights: 2 });
  assert.match(conf, /Confirmed · RWD-/);
  assert.match(conf, /2026-11-03, 2 nights/);
  assert.match(conf, /#ad/);
});

test('negotiation messages list exactly what is still to agree', () => {
  const [row] = rankForOffer(MILAN, [{ id: 'd1', name: 'Dev', town: 'Delhi', phone: '9876500004', ask: { ...ask, travel: true, cashMin: 3000 }, metrics: good }]).negotiate;
  const deal = buildDeal(MILAN, row);
  assert.match(deal.toCreator, /To agree: .*travel.*₹3,000/s);
  assert.match(deal.toProperty, /Still to agree:/);
  assert.doesNotMatch(deal.toCreator, /Reply YES with/);
});

test('helpers: phone, maps and offer text are safe', () => {
  assert.equal(waNumber('+91 98765-00001'), '919876500001');
  assert.equal(waNumber('12345'), '');
  assert.equal(waNumber('+44 7700 900123'), '447700900123');
  assert.ok(waLink('', 'x').startsWith('https://wa.me/?text='));
  assert.equal(mapsLink('Atlantis Resort'), 'https://www.google.com/maps/search/?api=1&query=Atlantis%20Resort');
  assert.equal(directionsLink('atlantis', 'nowhere'), '');
  assert.match(offerText({ guests: 2, nights: 1, food: 'breakfast', travel: 'full', travelUpTo: 1500 }), /1 night, breakfast, travel up to ₹1,500, no cash/);
});

test('property policies carry location, food and guests; Milan Heights seed turns into a barter offer with no upfront cash', () => {
  const milan = SEED_POLICIES.find((p) => p.propertyId === 'p_milan_heights');
  assert.equal(milan.location.town, 'Almora');
  assert.equal(milan.whatsapp, '917302315845');
  const offer = barterOfferFromPolicy(milan);
  assert.equal(offer.offer.cashMax, 0);
  assert.equal(offer.offer.guests, 2);
  assert.equal(offer.contingentCashUpTo, 5000);
  const withFood = normalizePolicy({ ...milan, freeStay: { ...milan.freeStay, food: 'all' } });
  assert.equal(barterOfferFromPolicy(withFood).offer.food, 'all');
  assert.match(termsText(withFood), /Free stay for 2: .*meals included/);
  assert.equal(normalizePolicy(normalizePolicy({ status: 'open', freeStay: { nights: 1, food: 'breakfast' } })).freeStay.food, 'breakfast');
});

test('admin desk turns a CRM application into a rankable creator, using ledger bookings and the WhatsApp in the note', async () => {
  globalThis.document = undefined;
  const { creatorFromCrm } = await import('../creators/barter-desk.js');
  const c = creatorFromCrm({ id: 'x1', name: 'Asha', email: 'A@x.com', handle: 'https://instagram.com/asha', note: 'Match network application. WhatsApp: +91 98765 00001. Autopilot: yes.', niche: 'food, mountains',
    barter: { location: { town: 'bhimtal' }, ask: { guests: 2, food: 'all' }, metrics: { followers: 18000, engagementPct: 5, postsLast30d: 8 } } }, { 'a@x.com': { verifiedSales: 3, verifiedClicks: 40 } });
  assert.equal(c.phone.replace(/\D/g, ''), '919876500001');
  assert.equal(c.metrics.verifiedBookings, 3);
  assert.deepEqual(c.niches, ['food', 'mountains']);
  const r = rankForOffer(MILAN, [c]);
  assert.equal(r.notify[0].id, 'x1');
  const legacy = creatorFromCrm({ id: 'x2', name: 'Old', matchProfile: { destinations: ['almora'], claimedFollowers: 5000 } });
  assert.equal(legacy.location.town, 'almora');
  assert.equal(legacy.metrics.followers, 5000);
});

test('match page collects location, the stay ask and real numbers, and loads the barter desk for admins', async () => {
  const { readFile } = await import('node:fs/promises');
  const [page, client, admin] = await Promise.all(['../creators/match.html', '../creators/matchmaking.js', '../creators/admin.html'].map((f) => readFile(new URL(f, import.meta.url), 'utf8')));
  for (const id of ['mmTown', 'mmLocate', 'mmGuests', 'mmFood', 'mmTravelNeed', 'mmNegotiable', 'mmViews', 'mmEngagement', 'mmPosts', 'mmOfferFood', 'mmOfferTravel', 'nearYouList']) assert.match(page, new RegExp(`id="${id}"`), id);
  assert.match(client, /local-barter-core\.mjs/);
  assert.match(client, /Lock this on WhatsApp/);
  assert.match(client, /Route on Google Maps/);
  assert.match(admin, /<script type="module" src="barter-desk\.js"><\/script>/);
});

test('a creator with a running deal for this property stays on the desk instead of disappearing into the cooldown', () => {
  const c = { id: 'a1', name: 'Asha', town: 'Almora', phone: '9876500001', ask, metrics: good, lastOfferAt: '2026-10-13T00:00:00Z', deals: { 'RWD-X': { propertyId: 'p_milan_heights', status: 'creator_yes' } } };
  const r = rankForOffer(MILAN, [c], { today: '2026-10-14T00:00:00Z' });
  assert.deepEqual(r.active.map((x) => x.id), ['a1']);
  const closed = rankForOffer(MILAN, [{ ...c, deals: { 'RWD-X': { propertyId: 'p_milan_heights', status: 'closed' } } }], { today: '2026-10-14T00:00:00Z' });
  assert.equal(closed.skipped[0].why, 'offered recently');
});
