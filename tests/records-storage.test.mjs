import test from 'node:test';
import assert from 'node:assert/strict';
import { archive, recordSale, salesFromD1, runKvBackup } from '../worker/lib/records.js';

function kv(seed = {}) {
  const m = new Map(Object.entries(seed));
  return { m, async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    async list({ prefix, cursor, limit = 1000 }) { const all = [...m.keys()].filter((k) => k.startsWith(prefix)).sort(); const s = Number(cursor || 0), keys = all.slice(s, s + limit).map((name) => ({ name })); return { keys, list_complete: s + limit >= all.length, cursor: String(s + limit) }; } };
}
function r2() { const m = new Map(); return { m, async put(k, v) { m.set(k, v); } }; }
function d1() {
  const rows = new Map(), log = [];
  return { rows, log, prepare(sql) { return { bind(...a) { return { async run() { if (/INTO sales/.test(sql)) rows.set(a[0], { month: a[1], paid_at: a[2], json: a[4] }); else log.push(a); },
    async all() { return { results: [...rows.values()].filter((r) => r.month === a[0]).map((r) => ({ json: r.json })) }; } }; } }; } };
}

test('archiving is a safe no-op without bindings', async () => {
  assert.equal(await archive({}, 'x', {}), false);
  await recordSale({}, '2026-11', { id: 'a' });
  assert.equal(await salesFromD1({}, '2026-11'), null);
  assert.equal(await runKvBackup({ RW_KV: kv() }), null);
});

test('a sale goes to D1 (searchable) and R2 (permanent copy)', async () => {
  const env = { DB: d1(), RECORDS: r2() };
  await recordSale(env, '2026-11', { id: 'stay_1_first', paidAt: '2026-11-20T10:00:00Z', total: 5000 });
  assert.ok(env.RECORDS.m.has('books/2026-11/sales/stay_1_first.json'));
  const back = await salesFromD1(env, '2026-11');
  assert.equal(back[0].id, 'stay_1_first');
});

test('KV backup walks the long-lived prefixes page by page and resumes', async () => {
  const seed = {}; for (let i = 0; i < 450; i++) seed['stayorder:' + i] = '{"i":' + i + '}';
  seed['wallet:u1'] = '{"bal":1}'; seed['ratelimit:x'] = '1';
  const env = { RW_KV: kv(seed), RECORDS: r2() }, now = Date.parse('2026-11-27T00:00:00Z');
  let r; for (let n = 0; n < 40; n++) { r = await runKvBackup(env, now); if (r.done) break; }
  assert.equal(r.done, true);
  const files = [...env.RECORDS.m.keys()];
  assert.ok(files.some((k) => k.startsWith('backups/kv/2026-11-27/stayorder-1')), 'second page of stayorder');
  assert.ok(files.some((k) => k.startsWith('backups/kv/2026-11-27/wallet-')));
  assert.ok(!files.some((k) => k.includes('ratelimit')), 'caches are not backed up');
  assert.equal(r.keys, 451);
});
