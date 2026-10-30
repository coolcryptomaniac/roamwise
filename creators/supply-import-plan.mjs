import { ingestDiscoveryBatch } from './supply-ingest-core.mjs';

// Pure import planner: checkpoint only after a storage adapter has durably committed a batch.
// Caller must provide authorized persistence and source-licensing checks.
export function planSupplyImport(records, { cursor = 0, batchSize = 400, maxRecords = 200000 } = {}) {
  if (!Array.isArray(records) || records.length > maxRecords) throw new RangeError('Import exceeds limit');
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > records.length) throw new RangeError('Invalid cursor');
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 450) throw new RangeError('Invalid batch size');
  const end = Math.min(cursor + batchSize, records.length);
  const result = ingestDiscoveryBatch(records.slice(cursor, end), { maxBatch: batchSize });
  return { ...result, cursor, nextCursor: end, done: end === records.length };
}

export async function runSupplyImportBatch(records, options, { persist, checkpoint }) {
  if (typeof persist !== 'function' || typeof checkpoint !== 'function') throw new TypeError('Persistence and checkpoint adapters required');
  const batch = planSupplyImport(records, options);
  await persist(batch.accepted); // Must be idempotent and durable in the actual storage adapter.
  await checkpoint(batch.nextCursor); // Never advance cursor before persistence succeeds.
  return batch;
}
