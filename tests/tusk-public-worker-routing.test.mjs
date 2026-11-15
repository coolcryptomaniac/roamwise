import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../js/copilot/sourced-search.js',import.meta.url),'utf8');
function instance(config={}){
 const calls=[];
 const window={RW_CONFIG:config};
 const context={window,URL,encodeURIComponent,
  rwApi:()=>null,
  document:{getElementById:()=>null},
  fetch:async (...args)=>{calls.push(args);return {ok:true,json:async()=>({available:true,route:'curated',source:'RoamWise reviewed facts',summary:'Reviewed information',checkedAt:'2026-11-15',hits:[{title:'Official site',url:'https://www.uttarakhandtourism.gov.in',description:'Primary source'}]})}}
 };
 vm.runInNewContext(code,context);
 return {context,calls,window};
}
test('public search uses established Worker even while main Firebase backend remains active',async()=>{
 const a=instance({backend:'firebase',workerUrl:''});
 assert.equal(a.context.rwTuskPublicSearchEndpoint(),'https://roamwise-api.founder-f53.workers.dev/tusk/search');
 const result={abs:null,hits:[]};
 await a.context.rwTuskWorkerSearch('Gir National Park permit',result);
 assert.equal(a.calls.length,1);
 assert.match(a.calls[0][0],/^https:\/\/roamwise-api\.founder-f53\.workers\.dev\/tusk\/search\?/);
 assert.equal(a.calls[0][1].credentials,'omit');
 assert.equal(a.calls[0][1].referrerPolicy,'no-referrer');
 assert.equal(result.abs,'Reviewed information');
 assert.equal(result.hits[0].s,'RoamWise reviewed facts');
});
test('uses an explicitly configured secure Worker subdomain for the public route',()=>{
 const a=instance({backend:'firebase',workerUrl:'https://new-roamwise.workers.dev/'});
 assert.equal(a.context.rwTuskPublicSearchEndpoint(),'https://new-roamwise.workers.dev/tusk/search');
});
test('ignores arbitrary or insecure runtime Worker URL for public lookup',()=>{
 for(const value of ['http://127.0.0.1:9999','http://new-roamwise.workers.dev','https://random.example.com']){
  const a=instance({backend:'firebase',workerUrl:value});
  assert.equal(a.context.rwTuskPublicSearchEndpoint(),'https://roamwise-api.founder-f53.workers.dev/tusk/search');
 }
});
test('private user contact details are never sent to public knowledge endpoint',async()=>{
 const a=instance();
 await a.context.rwTuskWorkerSearch('My email is private@example.com',{hits:[]});
 assert.equal(a.calls.length,0);
});
