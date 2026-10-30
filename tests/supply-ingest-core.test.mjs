import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestDiscoveryBatch } from '../creators/supply-ingest-core.mjs';
test('batch rejects missing permissions, duplicates and malformed sources', () => {
 const a={name:'A',category:'stay',sourceUrl:'https://example.org/a',sourceLicense:'CC-BY-4.0'};
 const r=ingestDiscoveryBatch([a,{...a},{...a,name:'B',sourceLicense:''},{...a,name:'C',sourceUrl:'http://example.org/c'}]);
 assert.deepEqual(r.counts,{received:4,accepted:1,rejected:3});
 assert.equal(r.accepted[0].publicApproved,false);
 assert.equal(r.accepted[0].consent,false);
});
test('batch caps work and keeps empty batch valid', () => {
 assert.equal(ingestDiscoveryBatch([]).counts.accepted,0);
 assert.throws(()=>ingestDiscoveryBatch([{},{}],{maxBatch:1}),RangeError);
});
