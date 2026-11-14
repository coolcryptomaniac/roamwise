import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportFirestore, exportKv } from '../tools/backup/export.mjs';

test('Firestore export pages through collections and listed subcollections', async () => {
  const out = await mkdtemp(join(tmpdir(), 'rwb-'));
  const calls = [];
  const fetchJson = async (url) => {
    calls.push(url);
    if (url.endsWith(':listCollectionIds')) return { collectionIds: ['tripchats', 'crm'] };
    if (/\/documents\/crm\?/.test(url)) return url.includes('pageToken') ? { documents: [{ name: 'projects/p/databases/(default)/documents/crm/b' }] } : { documents: [{ name: 'projects/p/databases/(default)/documents/crm/a' }], nextPageToken: 't' };
    if (/\/documents\/tripchats\?/.test(url)) return { documents: [{ name: 'projects/p/databases/(default)/documents/tripchats/r1' }] };
    if (/tripchats\/r1\/msgs\?/.test(url)) return { documents: [{ name: 'projects/p/databases/(default)/documents/tripchats/r1/msgs/m1' }] };
    return {};
  };
  const r = await exportFirestore(out, { token: 't', project: 'p', fetchJson, log: () => {} });
  assert.equal(r.counts.crm, 2);
  assert.equal(r.counts.msgs, 1);
  assert.equal((await readFile(join(out, 'firestore-crm.ndjson'), 'utf8')).trim().split('\n').length, 2);
});

test('KV export keeps durable keys and skips expiring ones', async () => {
  const out = await mkdtemp(join(tmpdir(), 'rwb-'));
  const fetchJson = async () => ({ result: [{ name: 'wallet:abc' }, { name: 'aicache:x', expiration: 123 }], result_info: {} });
  const r = await exportKv(out, { accountId: 'a', apiToken: 't', fetchJson, fetchText: async () => '{"lots":[]}' });
  assert.deepEqual(r, { kept: 1, skipped: 1 });
  assert.match(await readFile(join(out, 'kv-durable.ndjson'), 'utf8'), /wallet:abc/);
});
