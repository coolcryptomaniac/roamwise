// Adapter for a trusted, server-side Firestore client; never import in public browser code.
// Requires injected Firestore Admin SDK-like db with collection().doc().set() and batch().
export function createSupplyFirestoreAdapter(db, { collection = 'supplyDiscovery', importId } = {}) {
  if (!db || typeof db.collection !== 'function' || typeof db.batch !== 'function') throw new TypeError('Trusted Firestore client required');
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(String(importId || ''))) throw new Error('Invalid import ID');
  if (collection !== 'supplyDiscovery') throw new Error('Only private discovery collection is supported');
  const col = db.collection(collection);
  return {
    async persist(records) {
      if (!Array.isArray(records) || records.length > 450) throw new RangeError('Unsafe write batch size');
      if (!records.length) return;
      const batch = db.batch();
      for (const record of records) {
        if (record.publicApproved !== false || record.consent !== false || record.status !== 'discovered') throw new Error('Unapproved discovery record required');
        const key = String(record.dedupeKey || '');
        if (!key) throw new Error('Missing deduplication key');
        // Deterministic document ID: idempotent replay of a committed batch.
        const id = 's_' + stableHash(key);
        batch.set(col.doc(id), { ...record, importId, publicApproved: false, consent: false, status: 'discovered' }, { merge: false });
      }
      await batch.commit();
    },
    async checkpoint(nextCursor) {
      if (!Number.isSafeInteger(nextCursor) || nextCursor < 0) throw new RangeError('Invalid cursor');
      await db.collection('supplyImportJobs').doc(importId).set({ nextCursor, updatedAt: new Date().toISOString() }, { merge: true });
    },
  };
}
// Deterministic non-cryptographic hash used for dedupe identifiers, not security.
function stableHash(input) {
  let a = 2166136261, b = 2166136261;
  for (let i = 0; i < input.length; i++) {
    a = Math.imul(a ^ input.charCodeAt(i), 16777619);
    b = Math.imul(b ^ input.charCodeAt(i), 2246822519);
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
