import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cleanOffers, rank, verdict, normaliseWeights, filterOffers, median, perNight, comparable, DEFAULT_WEIGHTS } from '../compare/compare-core.mjs';

const offers = cleanOffers(JSON.parse(readFileSync(new URL('../compare/offers.json', import.meta.url), 'utf8')));
const base = { id: 'a', type: 'local', seller: 'A', title: 't', nights: 2, pricePP: 10000, currency: 'INR' };

test('compare: shipped data is clean, unique and every offer has a check date', () => {
  assert.ok(offers.length >= 5);
  assert.equal(new Set(offers.map((o) => o.id)).size, offers.length);
  offers.forEach((o) => { assert.match(o.checked, /^\d{4}-\d{2}-\d{2}$/); assert.ok(!o.url || o.url.startsWith('https://')); });
});

test('compare: junk is dropped, markup stripped, bad urls removed', () => {
  const out = cleanOffers([null, 5, { id: '' }, { ...base, id: 'X Y!', seller: '<b>Bad</b>', url: 'javascript:alert(1)', type: 'weird' }, { ...base, id: 'xy' }]);
  assert.deepEqual(out.map((o) => o.id), ['xy']);
  assert.equal(out[0].url, ''); assert.doesNotMatch(out[0].seller, /[<>]/); assert.equal(out[0].type, 'local');
});

test('compare: a suspect or USD price is not price-compared and cannot win on price', () => {
  const [s, u] = cleanOffers([{ ...base, id: 's', suspect: true, pricePP: 54 }, { ...base, id: 'u', currency: 'USD' }]);
  assert.equal(comparable(s), false); assert.equal(comparable(u), false);
  const r = rank([s, u]); r.forEach((x) => assert.equal(x.parts.price, 0));
});

test('compare: cheaper per night scores higher on price, all else equal', () => {
  const [cheap, dear, mid] = cleanOffers([{ ...base, id: 'c', pricePP: 5000 }, { ...base, id: 'd', pricePP: 30000 }, { ...base, id: 'm', pricePP: 12000 }]);
  const r = Object.fromEntries(rank([cheap, dear, mid]).map((x) => [x.offer.id, x.parts.price]));
  assert.ok(r.c > r.m && r.m > r.d);
});

test('compare: weights normalise, junk weights fall back, and moving weight can change the winner', () => {
  const sum = Object.values(normaliseWeights({ price: 1, inclusions: 1, clarity: 1, safety: 1, flex: 1 })).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 100) < 1e-9);
  assert.deepEqual(normaliseWeights({ price: 'x' }), { ...DEFAULT_WEIGHTS });
  const [cheap, safe] = cleanOffers([{ ...base, id: 'cheap', pricePP: 4000 }, { ...base, id: 'safe', pricePP: 20000, safety: { namedOperator: true, safetyPlan: true, reviewed: true } }]);
  assert.equal(rank([cheap, safe], { price: 100, safety: 0 })[0].offer.id, 'cheap');
  assert.equal(rank([cheap, safe], { price: 0, safety: 100 })[0].offer.id, 'safe');
});

test('compare: verdict names gaps honestly, filters work, helpers are sane', () => {
  const v = verdict(rank(offers)); assert.match(v, /scores highest/);
  assert.equal(verdict([]), 'No offers match these filters.');
  assert.ok(filterOffers(offers, { type: 'roamwise' }).every((o) => o.type === 'roamwise'));
  assert.equal(filterOffers(offers, { q: 'zzzz' }).length, 0);
  assert.equal(median([1, 3, 2]), 2); assert.equal(median([]), 0); assert.equal(perNight({ nights: 0, pricePP: 5 }), 0);
});
