import test from 'node:test';
import assert from 'node:assert/strict';
import {planSupplyImport,runSupplyImportBatch} from '../creators/supply-import-plan.mjs';
const rows=Array.from({length:3},(_,i)=>({name:'Place '+i,category:'stay',sourceUrl:'https://example.org/'+i,sourceLicense:'authorized'}));
test('import planning resumes from checkpoint',()=>{
 const first=planSupplyImport(rows,{batchSize:2});assert.equal(first.nextCursor,2);assert.equal(first.done,false);
 const second=planSupplyImport(rows,{cursor:first.nextCursor,batchSize:2});assert.equal(second.done,true);assert.equal(second.counts.accepted,1);
});
test('checkpoint never advances when storage fails',async()=>{
 let cursor=-1;
 await assert.rejects(runSupplyImportBatch(rows,{batchSize:2},{persist:async()=>{throw Error('offline')},checkpoint:async n=>{cursor=n}}));
 assert.equal(cursor,-1);
 await runSupplyImportBatch(rows,{batchSize:2},{persist:async()=>{},checkpoint:async n=>{cursor=n}});
 assert.equal(cursor,2);
});
