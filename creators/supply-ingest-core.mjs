import { normalizeSupplyRecord } from './supply-record-core.mjs';

// Admin-side pure batch ingestion. No network scraping or automatic publication.
export function ingestDiscoveryBatch(rows, { maxBatch = 1000 } = {}) {
  if (!Array.isArray(rows) || rows.length > maxBatch || maxBatch < 1 || maxBatch > 10000)
    throw new RangeError('Batch size outside allowed limits');
  const accepted = [], rejected = [], seen = new Set();
  rows.forEach((raw, index) => {
    try {
      const record = normalizeSupplyRecord(raw);
      if (!record.sourceLicense) throw new Error('Source license or permission required');
      const key = [record.sourceUrl.toLowerCase().replace(/\/$/, ''), record.name.toLowerCase(), record.category.toLowerCase()].join('|');
      if (seen.has(key)) { rejected.push({ index, reason: 'duplicate' }); return; }
      seen.add(key); accepted.push({ ...record, dedupeKey: key });
    } catch (err) { rejected.push({ index, reason: err.message }); }
  });
  return { accepted, rejected, counts: { received: rows.length, accepted: accepted.length, rejected: rejected.length } };
}
