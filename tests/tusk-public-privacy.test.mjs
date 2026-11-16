import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sourced=fs.readFileSync(new URL('../js/copilot/sourced-search.js',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../js/copilot/core.js',import.meta.url),'utf8');
const start=core.indexOf('async function rwMiniSearch(q){');
const end=core.indexOf('function rwWebAnswerHTML(',start);
assert.ok(start>=0 && end>start,'can isolate live fallback for integration testing');
function instance(){
 const calls=[],finished=[];
 const ctx={
  URL,encodeURIComponent,
  window:{RW_CONFIG:{backend:'firebase',workerUrl:''}},
  rwApi:()=>null,
  document:{getElementById:()=>null},
  fetch:async (...args)=>{calls.push(args);return {ok:true,json:async()=>({available:false,RelatedTopics:[],pages:[]})};},
  cpSmartAnswer:()=>'',rwAiDownNote:()=>'',
  cpFinish:(_thinking,html)=>finished.push(html)
 };
 vm.createContext(ctx);
 vm.runInContext(sourced,ctx);
 vm.runInContext(core.slice(start,end),ctx);
 return {ctx,calls,finished};
}
test('general public travel information still invokes free source providers',async()=>{
 const {ctx,calls}=instance();
 assert.equal(ctx.rwTuskIsPublicQuery('How to visit Gir National Park?'),true);
 await ctx.rwMiniSearch('How to visit Gir National Park?');
 assert.equal(calls.length,3);
 assert.match(calls[0][0],/\/tusk\/search\?/);
 assert.match(calls[1][0],/duckduckgo/);
 assert.match(calls[2][0],/wikipedia/);
});
test('contact details, secret tokens, private bookings and control chars never reach any third-party provider',async()=>{
 const {ctx,calls}=instance();
 const cases=[
  'my email is guest@example.com',
  'call me on +91 9876543210 please',
  'My booking is AB123',
  'Please check our refund status',
  'password is abcdefghijklmnop',
  'use sk-abcdefghijklmnopqrstuvwxyz12345',
  'private booking\nanother line',
  'X'.repeat(181)
 ];
 for(const q of cases){
  assert.equal(ctx.rwTuskIsPublicQuery(q),false,q);
  await ctx.rwMiniSearch(q);
  await ctx.rwTuskWorkerSearch(q,{hits:[]});
 }
 assert.equal(calls.length,0,'no outbound calls, including to DDG/Wikipedia');
});
test('AI outage on private question shows a local warning without public lookup links',()=>{
 const {ctx,calls,finished}=instance();
 ctx.rwTuskSearchFailure({},'My booking is AB123',{},{});
 assert.equal(calls.length,0);
 assert.equal(finished.length,1);
 assert.match(finished[0],/Public web lookup was skipped/);
 assert.doesNotMatch(finished[0],/google\.com\/search/);
});
