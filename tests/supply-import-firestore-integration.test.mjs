import test from 'node:test';
import assert from 'node:assert/strict';
import { runSupplyImportBatch } from '../creators/supply-import-plan.mjs';
import { createSupplyFirestoreAdapter } from '../creators/supply-firestore-adapter.mjs';

function memoryFirestore({ failCommit = false } = {}) {
 const documents = new Map();
 const db = {
   collection(collection) { return { doc(id) { return { key: collection + '/' + id, async set(data) { documents.set(this.key, data); } }; } }; },
   batch() { const writes = []; return {
     set(ref, data) { writes.push([ref.key, data]); },
     async commit() { if (failCommit) throw new Error('storage failed'); for (const [key, data] of writes) documents.set(key, data); },
   }; },
 };
 return { db, documents };
}
const rows = Array.from({ length: 5 }, (_, i) => ({
 name: 'Stay ' + i, category: 'stay', sourceUrl: 'https://example.org/stay/' + i,
 sourceLicense: 'permission-granted',
}));

test('end-to-end import stays private and resumes at persisted checkpoint', async () => {
 const { db, documents } = memoryFirestore();
 const adapter = createSupplyFirestoreAdapter(db, { importId: 'import_test01' });
 const first = await runSupplyImportBatch(rows, { batchSize: 3 }, adapter);
 assert.equal(first.nextCursor, 3);
 assert.equal(documents.get('supplyImportJobs/import_test01').nextCursor, 3);
 assert.equal([...documents.keys()].filter(k => k.startsWith('supplyDiscovery/')).length, 3);
 const second = await runSupplyImportBatch(rows, { batchSize: 3, cursor: first.nextCursor }, adapter);
 assert.equal(second.done, true);
 assert.equal([...documents.keys()].filter(k => k.startsWith('supplyDiscovery/')).length, 5);
 for (const [key, value] of documents) if (key.startsWith('supplyDiscovery/')) {
   assert.equal(value.publicApproved, false); assert.equal(value.consent, false);
 }
 await runSupplyImportBatch(rows, { batchSize: 3, cursor: 0 }, adapter);
 assert.equal([...documents.keys()].filter(k => k.startsWith('supplyDiscovery/')).length, 5);
});

test('failed storage commit never saves checkpoint', async () => {
 const { db, documents } = memoryFirestore({ failCommit: true });
 const adapter = createSupplyFirestoreAdapter(db, { importId: 'import_test02' });
 await assert.rejects(runSupplyImportBatch(rows, { batchSize: 3 }, adapter), /storage failed/);
 assert.equal(documents.has('supplyImportJobs/import_test02'), false);
});
