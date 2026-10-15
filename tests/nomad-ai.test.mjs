import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DESTINATIONS, scoreDestination, rank } from '../nomads/nomad-core.mjs';
import { improveSuggestions, hostNextTier, compactPicks, buildAdvicePrompt, parseAdvice, fallbackAdvice, adviceKey } from '../nomads/nomad-ai-core.mjs';
import { handleNomadAdvise } from '../worker/handlers/nomad-ai.js';

const brief = { persona: 'founder', stay: 30, wifi: 100, must: ['coworking', 'community'], vibes: ['beach'], budget: 20000 };
const picks = compactPicks(rank(DESTINATIONS, scoreDestination, brief, 5));

test('what-ifs are real: each one re-scores higher than the current best', () => {
  const w = improveSuggestions(DESTINATIONS, scoreDestination, brief);
  assert.ok(w.length >= 1);
  for (const x of w) { assert.ok(x.to - x.from >= 3, JSON.stringify(x)); assert.ok(x.text); }
  const easy = improveSuggestions(DESTINATIONS, scoreDestination, { ...brief, budget: 250000, wifi: 10, must: [], vibes: [] });
  assert.ok(easy.every(x => x.lift >= 3));
});

test('hosts get the cheapest path to the next Nomad-Ready tier', () => {
  const nx = hostNextTier({ mbps: 20, backup: 'none', desk: 'basic', callRoom: false, kitchen: true, rate30: 18000 });
  assert.ok(nx.next);
  assert.ok(nx.plan.length >= 1);
  const gained = nx.plan.reduce((s, p) => s + p.gain, 0);
  assert.ok(gained >= nx.pointsToNext, `${gained} >= ${nx.pointsToNext}`);
  assert.ok(nx.plan.every(p => p.gain > 0 && p.effort));
  const top = hostNextTier({ mbps: 200, backup: 'full', desk: 'ergonomic', callRoom: true, kitchen: true, coworking: true, community: true, laundry: true, rate30: 30000, verified: true });
  assert.equal(top.next, ''); assert.deepEqual(top.plan, []);
});

test('the model may only talk about the given picks; bad output falls back', () => {
  const prompt = buildAdvicePrompt(brief, picks, []);
  assert.match(prompt, /only the ids given/);
  assert.ok(prompt.length <= 3800);
  const good = JSON.stringify({ headline: 'Goa suits you', picks: [{ id: picks[0].id, why: 'Fast fibre and a big community', tip: 'Ask about monsoon outages' }, { id: 'atlantis', why: 'made up' }], ask: ['Speed test?', 'Total?', 'Extra?'], tradeoff: 'x' });
  const a = parseAdvice('Sure! ' + good, picks);
  assert.equal(a.picks.length, 1); assert.equal(a.picks[0].id, picks[0].id); assert.equal(a.ask.length, 2);
  assert.equal(parseAdvice('not json', picks), null);
  assert.equal(parseAdvice(JSON.stringify({ headline: 'x', picks: [{ id: 'atlantis' }] }), picks), null);
  const f = fallbackAdvice(brief, picks, []);
  assert.ok(f.headline.includes(picks[0].name)); assert.equal(f.picks.length, Math.min(3, picks.length));
  assert.equal(adviceKey(brief, picks), adviceKey({ ...brief, must: ['community', 'coworking'] }, picks));
});

const req = (body) => new Request('https://x/nomad/advise', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'CF-Connecting-IP': '1.2.3.4' } });
function memCache() { const m = new Map(); return { match: async (k) => { const v = m.get(k.url); return v ? v.clone() : undefined; }, put: async (k, v) => { m.set(k.url, v); }, size: () => m.size }; }

test('worker: AI answer is validated and cached; no AI or a tripped cap returns the matcher wording', async () => {
  const cache = memCache(); let calls = 0;
  const env = { AI: { run: async () => { calls++; return { response: JSON.stringify({ headline: 'Strong fit', picks: [{ id: picks[0].id, why: 'w', tip: 't' }, { id: 'nope', why: 'x' }] }) }; } } };
  const r1 = await (await handleNomadAdvise(req({ brief, picks }), env, { cache })).json();
  assert.equal(r1.source, 'ai'); assert.equal(r1.picks.length, 1);
  const r2 = await (await handleNomadAdvise(req({ brief, picks }), env, { cache })).json();
  assert.equal(r2.source, 'ai'); assert.equal(calls, 1);
  const off = await (await handleNomadAdvise(req({ brief, picks }), {}, { cache: memCache() })).json();
  assert.equal(off.source, 'matcher');
  const bad = await (await handleNomadAdvise(req({ brief, picks }), { AI: { run: async () => ({ response: 'sorry' }) } }, { cache: memCache() })).json();
  assert.equal(bad.source, 'matcher');
  const c = memCache(); const envB = { AI: { run: async () => ({ response: '{}' }) } };
  let last; for (let i = 0; i < 14; i++) last = await (await handleNomadAdvise(req({ brief: { ...brief, budget: 20000 + i * 500 }, picks }), envB, { cache: c })).json();
  assert.equal(last.source, 'matcher');
  assert.equal((await handleNomadAdvise(req('x'.repeat(9000)), env, { cache })).status, 413);
  assert.equal((await handleNomadAdvise(req({ brief, picks: [] }), env, { cache })).status, 400);
});

test('page shows what-ifs, the AI take with a fallback, and the host plan', async () => {
  const js = await readFile(new URL('../nomads/nomads.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../nomads/index.html', import.meta.url), 'utf8');
  assert.match(js, /improvePanel\(b\); aiTake\(b, sp\.length \? sp : ds\)/);
  assert.match(js, /renderAdvice\(\{ \.\.\.fallbackAdvice\(b, picks, whatIfs\), source: 'matcher' \}, picks\)/);
  assert.match(js, /it cannot see live prices or availability/);
  assert.match(html, /<div id="hPlan" class="nm-plan"><\/div>/);
});
