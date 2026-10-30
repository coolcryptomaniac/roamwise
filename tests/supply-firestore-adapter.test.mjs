import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupplyFirestoreAdapter } from '../creators/supply-firestore-adapter.mjs';
function fakeDb() {
 const writes=[], jobs=[];
 const db={collection(name){return {doc(id){return {set:async (data)=>jobs.push({name,id,data}),ref:name+'/'+id}}}},batch(){const pending=[];return {set(doc,data){pending.push({doc,data})},async commit(){writes.push(...pending)}}}};
 return {db,writes,jobs};
}
test('adapter writes private records and checkpoints separately',async()=>{
 const {db,writes,jobs}=fakeDb();const a=createSupplyFirestoreAdapter(db,{importId:'import_0001'});
 const record={name:'Place',dedupeKey:'https://example.org|place|stay',status:'discovered',publicApproved:false,consent:false};
 await a.persist([record]);assert.equal(writes.length,1);assert.equal(writes[0].data.publicApproved,false);
 await a.persist([record]);assert.equal(writes[0].doc.ref,writes[1].doc.ref);
 await a.checkpoint(1);assert.equal(jobs[0].data.nextCursor,1);
 await assert.rejects(a.persist([{...record,publicApproved:true}]));
});
