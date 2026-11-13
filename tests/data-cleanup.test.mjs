import test from 'node:test';
import assert from 'node:assert/strict';
import { runDataCleanup, cleanupPlan, MAX_DELETES } from '../worker/handlers/data-cleanup.js';

const SUNDAY = Date.parse('2026-11-15T05:30:00Z');
function fakeDeps(perQuery = 3){
  const deleted = [], queries = [];
  return { deleted, queries,
    async listIds(){ return ['roomA', 'roomB']; },
    async oldDocNames(parent, step, limit){ queries.push(parent + '|' + step.collection); return Array.from({ length: Math.min(perQuery, limit) }, (_, i) => `${parent}/${step.collection}/${i}`); },
    async deleteNames(n){ deleted.push(...n); } };
}

test('only runs on Sundays unless forced', async () => {
  const r = await runDataCleanup({}, { deps: fakeDeps(), now: Date.parse('2026-11-16T05:30:00Z') });
  assert.equal(r.skipped, 'not sunday');
});

test('dry run counts but deletes nothing', async () => {
  const d = fakeDeps();
  const r = await runDataCleanup({}, { deps: d, now: SUNDAY });
  assert.equal(r.live, false);
  assert.equal(d.deleted.length, 0);
  assert.equal(r.steps['chat messages'], 6);
});

test('live run deletes only the planned short-lived collections', async () => {
  const d = fakeDeps();
  const r = await runDataCleanup({ DATA_CLEANUP_ENABLED: 'true' }, { deps: d, now: SUNDAY });
  assert.equal(r.live, true);
  assert.equal(d.deleted.length, 3 + 6 + 6 + 3);
  const cols = new Set(d.queries.map(q => q.split('|')[1]));
  assert.deepEqual([...cols].sort(), ['beacons', 'msgs', 'presence', 'tuskMisses']);
  for(const bad of ['wallet', 'orders', 'ledger', 'invoices', 'bookings', 'staff']) assert.ok(!cols.has(bad));
});

test('delete budget is capped', async () => {
  const d = fakeDeps(5000);
  await runDataCleanup({ DATA_CLEANUP_ENABLED: 'true' }, { deps: d, now: SUNDAY });
  assert.ok(d.deleted.length <= MAX_DELETES);
});

test('chat retention is clamped to at least 30 days', () => {
  const p = cleanupPlan({ CHAT_RETENTION_DAYS: '1' }, SUNDAY).find(s => s.collection === 'msgs');
  assert.equal(Math.round((SUNDAY - p.before) / 86400000), 30);
});
