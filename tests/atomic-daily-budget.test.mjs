import test from 'node:test';import assert from 'node:assert/strict';import {budgetPaths,reserveDailyExpense} from '../worker/lib/atomic-daily-budget.js';
test('IST budget partitions are stable',()=>{const a=budgetPaths('project1','2026-11-10T18:29:00Z','expense1');const b=budgetPaths('project1','2026-11-10T18:31:00Z','expense1');assert.notEqual(a.day,b.day);});
test('invalid identifiers fail closed',()=>assert.throws(()=>budgetPaths('project1','2026-11-10T00:00:00Z','../bad')));
test('missing authorization fails before network',async()=>await assert.rejects(reserveDailyExpense({projectId:'project1',accessToken:'',expenseId:'a',type:'ai_inference',amountPaise:100,approved:true})));

test('Firestore reservation accepts realistic OAuth tokens and enforces cap',async()=>{
 const old=globalThis.fetch;
 let calls=0;
 globalThis.fetch=async(url,opts)=>{
  calls++;
  if(url.endsWith(':beginTransaction'))return {ok:true,json:async()=>({transaction:'tx'})};
  if(url.endsWith(':batchGet')){
   const docs=JSON.parse(opts.body).documents;
   return {ok:true,json:async()=>docs.map(name=>({missing:name}))};
  }
  if(url.endsWith(':commit'))return {ok:true,json:async()=>({commitTime:'2026-11-10T00:00:00Z'})};
  throw new Error('unexpected');
 };
 try{
  const result=await reserveDailyExpense({projectId:'project1',accessToken:'ya29.a-long.token/with-punctuation',expenseId:'x',type:'ai_inference',amountPaise:50000,approved:true});
  assert.equal(result.reserved,true);
  assert.equal(calls,3);
 }finally{globalThis.fetch=old;}
});
test('incomplete Firestore reads fail closed',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async(url)=>({ok:true,json:async()=>url.endsWith(':beginTransaction')?{transaction:'tx'}:[]});
 try{await assert.rejects(reserveDailyExpense({projectId:'project1',accessToken:'token',expenseId:'x',type:'ai_inference',amountPaise:100,approved:true}),/incomplete_transaction_read/);}
 finally{globalThis.fetch=old;}
});
