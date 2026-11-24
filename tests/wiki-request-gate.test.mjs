// The homepage cards once fired ~32 parallel Wikipedia calls (each title twice) and most
// were answered 429. pdf-assets.js now gates them: <=3 in flight, cached per title,
// (q,q) callers deduped, and a back-off after a 429.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../js/itinerary/pdf-assets.js', import.meta.url), 'utf8');

function load(respond) {
  const calls = []; let inflight = 0, peak = 0;
  const store = new Map();
  const ctx = {
    console, Promise, Date, encodeURIComponent, String, Object, setTimeout,
    sessionStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    fetch(url) {
      calls.push(url); inflight++; peak = Math.max(peak, inflight);
      return new Promise((res) => setTimeout(() => { inflight--; res(respond(url)); }, 5));
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(code, ctx);
  return { ctx, calls, peak: () => peak };
}
const ok = (body) => ({ ok: true, status: 200, json: async () => body });

test('at most 3 Wikipedia requests in flight and each title asked once', async () => {
  const { ctx, calls, peak } = load(() => ok({ thumbnail: { source: 'https://upload.wikimedia.org/x.jpg' } }));
  const titles = Array.from({ length: 16 }, (_, i) => 'Place' + i);
  const out = await Promise.all(titles.map((t) => ctx.wikiAny(t, t)));
  assert.ok(out.every((u) => u === 'https://upload.wikimedia.org/x.jpg'));
  assert.equal(calls.length, 16, 'one summary call per title, no duplicate (q,q) call');
  assert.ok(peak() <= 3, 'peak in-flight was ' + peak());
  await ctx.wikiThumb('Place3');
  assert.equal(calls.length, 16, 'second ask is served from cache');
});

test('a 429 stops further Wikipedia calls instead of hammering', async () => {
  const { ctx, calls } = load((url) => (/wikipedia/.test(url) ? { ok: false, status: 429, json: async () => ({}) } : ok({ results: [] })));
  await Promise.all(Array.from({ length: 12 }, (_, i) => ctx.wikiThumb('T' + i)));
  const wiki = calls.filter((u) => /wikipedia/.test(u)).length;
  assert.ok(wiki <= 3, 'only the first in-flight batch reached Wikipedia, got ' + wiki);
});
