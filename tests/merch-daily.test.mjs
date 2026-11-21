import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyConcept,renderArt,applyDaily} from '../tools/merch-daily.mjs';
test('generates exactly one deterministic review-only garment for a calendar day',()=>{
 const a=buildDailyConcept('2026-11-22');
 assert.equal(a.id,'daily-2026-11-22');
 assert.equal(a.live,false);assert.equal(a.price,null);assert.equal(a.qikinkSku,null);assert.equal(a.inventory,null);
 assert.equal(a.fulfilment,'unapproved');
 assert.deepEqual(a,buildDailyConcept('2026-11-22'));
 const art=renderArt(a);
 assert.match(art,/<svg /);assert.match(art,/ROAMWISE/);
 assert.doesNotMatch(art,/naruto|akatsuki|sharingan/i);
});
test('daily append is idempotent and does not mark a review as buyable',()=>{
 const seed={products:[],policy:'review only'};
 const x=applyDaily(seed,'2026-11-22');
 assert.equal(x.changed,true);assert.equal(x.manifest.products.length,1);
 const y=applyDaily(x.manifest,'2026-11-22');
 assert.equal(y.changed,false);assert.equal(y.manifest.products.length,1);
 const z=applyDaily(y.manifest,'2026-11-23');
 assert.equal(z.manifest.products.length,2);
 assert.ok(z.manifest.products.every(p=>p.live===false&&p.qikinkSku===null));
});
test('invalid dates and malicious date strings cannot write arbitrary files',()=>{
 assert.throws(()=>buildDailyConcept('../../etc/passwd'));
 assert.throws(()=>buildDailyConcept('2026-02-30'));
});
