'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = () => import(path.join(root, 'worker/lib/spend-governor.js'));

function fakeKV(){
  const m = new Map();
  return { m, get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, v); } };
}
const D = new Date('2026-10-16T06:00:00Z');

test('cost estimates are small, positive and ordered sensibly', async () => {
  const g = await load();
  const cf = g.estimateCostPaise('workers-ai', 1200, 700, {});
  const sv = g.estimateCostPaise('sarvam', 1200, 700, {});
  const cl = g.estimateCostPaise('claude', 1200, 700, {});
  assert.ok(cf >= 1 && cf < 20, 'Workers AI chat costs a few paise: ' + cf);
  assert.ok(sv > cf, 'Sarvam costs more than Gemma');
  assert.ok(cl > cf, 'Claude Haiku costs more than Gemma');
  assert.equal(g.estimateCostPaise('nope', 100, 100, {}), 0);
});

test('revenue is idempotent per order and feeds the budget formula', async () => {
  const g = await load();
  const env = { AI_USAGE: fakeKV(), AI_TARGET_MARGIN: '0.2', FIXED_MONTHLY_COSTS_PAISE: '100000' };
  assert.equal(await g.recordRevenue(env, 'order_1', 500000, D), true);
  assert.equal(await g.recordRevenue(env, 'order_1', 500000, D), false, 'same order twice is ignored');
  assert.equal(await g.recordRevenue(env, 'order_2', 100000, D), true);
  const b = await g.readBudget(env, D);
  assert.equal(b.revenue, 600000);
  assert.equal(b.cap, Math.floor(600000 * 0.8 - 100000)); // 380000 paise
  assert.equal(b.remaining, b.cap);
});

test('with no revenue and no floor, paid routes are blocked but the free tier still works', async () => {
  const g = await load();
  const env = { AI_USAGE: fakeKV() };
  const b = await g.readBudget(env, D);
  assert.equal(b.cap, 0);
  const routes = [
    { name: 'workers-ai', est: 3 }, { name: 'sarvam', est: 10 }, { name: 'groq', est: 4, freeTier: true },
  ];
  const plan = g.planRoutes(routes, b, {});
  assert.deepEqual(plan.map(r => r.name), ['workers-ai', 'groq'], 'Workers AI fits the free daily allowance, Sarvam does not');
  const spent = { ...b, freeLeft: 0 };
  assert.deepEqual(g.planRoutes(routes, spent, {}).map(r => r.name), ['groq']);
  const none = g.planRoutes(routes.filter(r => !r.freeTier), spent, {});
  assert.equal(none.length, 0, 'nothing affordable means the caller serves the on-device planner');
});

test('free daily allowance is consumed before paid spend, then the budget is charged', async () => {
  const g = await load();
  const env = { AI_USAGE: fakeKV(), AI_MIN_PAID_BUDGET_PAISE: '1000', AI_FREE_DAILY_PAISE: '10' };
  let r = await g.chargeSpend(env, 'workers-ai', 8, false, D);
  assert.deepEqual(r, { free: 8, paid: 0 });
  r = await g.chargeSpend(env, 'workers-ai', 8, false, D);
  assert.deepEqual(r, { free: 2, paid: 6 });
  r = await g.chargeSpend(env, 'sarvam', 20, false, D);
  assert.deepEqual(r, { free: 0, paid: 20 });
  r = await g.chargeSpend(env, 'groq', 5, true, D);
  assert.deepEqual(r, { free: 0, paid: 0 }, 'free-tier routes are not counted');
  const b = await g.readBudget(env, D);
  assert.equal(b.spent, 26);
  assert.equal(b.remaining, 1000 - 26);
});

test('spending stops when the budget is used and never exceeds revenue-derived cap', async () => {
  const g = await load();
  const env = { AI_USAGE: fakeKV(), AI_TARGET_MARGIN: '0.2' };
  await g.recordRevenue(env, 'o', 1000, D); // Rs 10 -> cap 800 paise
  let budget = await g.readBudget(env, D);
  assert.equal(budget.cap, 800);
  let served = 0;
  for(let i = 0; i < 1000; i++){
    budget = await g.readBudget({ ...env, AI_FREE_DAILY_PAISE: '0' }, D);
    const plan = g.planRoutes([{ name: 'sarvam', est: 10 }], budget, {});
    if(!plan.length) break;
    await g.chargeSpend({ ...env, AI_FREE_DAILY_PAISE: '0' }, 'sarvam', 10, false, D);
    served++;
  }
  assert.equal(served, 80);
  assert.ok((await g.readBudget(env, D)).spent <= 800);
});

test('premium route needs headroom and a low spend ratio', async () => {
  const g = await load();
  const base = { cap: 100000, spent: 10000, remaining: 90000, freeLeft: 0 };
  const cand = [{ name: 'claude', est: 20, premium: true }, { name: 'workers-ai', est: 3 }];
  assert.deepEqual(g.planRoutes(cand, base, {}).map(r => r.name), ['claude', 'workers-ai']);
  const hot = { ...base, spent: 70000, remaining: 30000 };
  assert.deepEqual(g.planRoutes(cand, hot, {}).map(r => r.name), ['workers-ai'], 'over 60% spent: premium is skipped');
  assert.deepEqual(g.planRoutes(cand, { ...base, cap: 0, remaining: 0 }, {}).map(r => r.name), [], 'no budget, no premium');
});

test('rolling revenue lets last month support early days of a new month', async () => {
  const g = await load();
  const env = { AI_USAGE: fakeKV() };
  await g.recordRevenue(env, 'sep', 300000, new Date('2026-09-20T00:00:00Z'));
  const day1 = await g.readBudget(env, new Date('2026-10-01T06:00:00Z'));
  const day31 = await g.readBudget(env, new Date('2026-10-31T06:00:00Z'));
  assert.ok(day1.revenue > 290000, 'almost all of last month still counts on day 1');
  assert.ok(day31.revenue < 20000, 'and almost none by the end of the month');
});

test('without the KV binding the governor fails closed', async () => {
  const g = await load();
  const b = await g.readBudget({}, D);
  assert.equal(b.ok, false);
  assert.equal(g.planRoutes([{ name: 'workers-ai', est: 3 }, { name: 'sarvam', est: 10 }], b, {}).length, 0);
  assert.equal(await g.recordRevenue({}, 'o', 100, D), false);
});
