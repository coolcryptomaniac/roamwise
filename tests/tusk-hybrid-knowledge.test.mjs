import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parsePublicQuery,isDynamicQuery,curatedMatches,recordValid,validSource,
 approvedVectorMatch,getExactCache,putExactCache,useVectorize,status,lexicalMatch
} from '../worker/lib/tusk-hybrid-knowledge.js';
import { handleTuskWebSearch } from '../worker/handlers/tusk-web-search.js';

const today = new Date('2026-11-16T00:00:00Z');
test('refuses personal identifiers and tokens in a public retrieval request',()=>{
 assert.equal(parsePublicQuery('mail me at person@example.com'),null);
 assert.equal(parsePublicQuery('lookup +91 9876543210'),null);
 assert.equal(parsePublicQuery('my api key is sk-bad'),null);
 assert.equal(parsePublicQuery('hello'), 'hello');
 assert.equal(parsePublicQuery('hello\nmalicious'),null);
});
test('live prices and schedules cannot use semantic or exact answer cache',()=>{
 for(const query of ['What is the price today for a train to Mumbai?',
 'Is Rohtang open now?', 'flight availability tomorrow','latest news'])assert.equal(isDynamicQuery(query),true);
 assert.equal(isDynamicQuery('What is the history of Gir National Park?'),false);
});
test('existing reviewed public source facts work with no API key',()=>{
 const result=curatedMatches('Gir National Park safari permits',today);
 assert.equal(result.route,'curated');
 assert.equal(result.available,true);
 assert.match(result.hits[0].url,/^https:/);
 assert.equal(result.hits[0].source,'RoamWise fact pack');
 const dynamic=curatedMatches('Is Gir safari open now?',today);
 assert.equal(dynamic.requiresLiveVerification,true);
});
test('approved R2 knowledge requires sources, expiry, human approval and freshness',()=>{
 const doc={id:'kasar-quiet',approved:true,title:'Kasar Devi quiet retreat',summary:'A quiet travel overview',checkedAt:'2026-11-14',validUntil:'2026-12-31',sources:['https://uttarakhandtourism.gov.in/']};
 assert.equal(recordValid(doc,today),true);
 assert.equal(recordValid({...doc,approved:false},today),false);
 assert.equal(recordValid({...doc,validUntil:null},today),false);
 assert.equal(recordValid({...doc,validUntil:'2026-11-10'},today),false);
 assert.equal(recordValid({...doc,sources:['javascript:alert(1)']},today),false);
 assert.equal(validSource('http://example.com'),false);
 assert.equal(validSource('https://example.com'),true);
});
test('semantic routing is off without all three bindings and explicit enablement',async()=>{
 assert.equal(useVectorize({TUSK_VECTOR_SEARCH_ENABLED:'true'}),false);
 assert.equal(await approvedVectorMatch({},'Calm places in Kasar Devi',{now:today}),null);
});
test('semantic match requires R2 human approval, high score and relevant topic terms',async()=>{
 let reads=0;
 const env={TUSK_VECTOR_SEARCH_ENABLED:'true',AI:{run:async(model)=>{assert.equal(model,'@cf/baai/bge-m3');return {data:[new Array(1024).fill(0.01)]};}},
  TUSK_VECTOR_INDEX:{query:async(v,opts)=>{assert.equal(v.length,1024);assert.equal(opts.topK,3);return {matches:[{id:'kasar-quiet',score:0.93,metadata:{title:'Kasar Devi quiet retreat',keywords:'Kasar Devi Almora',approved:true}}]};}},
  TUSK_KB_BUCKET:{get:async(k)=>{reads++;assert.equal(k,'tusk-approved/v1/kasar-quiet.json');return {json:async()=>({id:'kasar-quiet',approved:true,title:'Kasar Devi quiet retreat',keywords:'Kasar Devi Almora',summary:'Quiet places around Kasar Devi.',sources:['https://uttarakhandtourism.gov.in/'],checkedAt:'2026-11-14',validUntil:'2026-12-31'})};}}
 };
 const result=await approvedVectorMatch(env,'Calm places in Kasar Devi',{now:today});
 assert.equal(result.route,'approved-vector');
 assert.equal(result.hits.length,1);
 assert.equal(reads,1);
 assert.ok(lexicalMatch('Calm places in Kasar Devi','Kasar Devi quiet retreat'));
 assert.equal(await approvedVectorMatch(env,'How much is a flight today?',{now:today}),null);
 const guarded={...env,TUSK_VECTOR_INDEX:{query:async()=>({matches:[{id:'kasar-quiet',score:0.2,metadata:{approved:true}}]})}};
 assert.equal(await approvedVectorMatch(guarded,'Calm places in Kasar Devi',{now:today}),null);
});
test('exact public cache is opt-in; only approved and non-live material can be written',async()=>{
 let writes=0;
 const kv={get:async()=>null,put:async(_k,_v,opts)=>{writes++;assert.equal(opts.expirationTtl,3600)}};
 const env={RW_KV:kv};
 assert.equal(await getExactCache(env,'Gir National Park safari','en-IN',today),null);
 assert.equal(await putExactCache(env,'Gir National Park safari','en-IN',curatedMatches('Gir National Park safari',today),today),false);
 const enabled={...env,TUSK_EXACT_KV_ENABLED:'true'};
 assert.equal(await putExactCache(enabled,'Gir National Park safari','en-IN',curatedMatches('Gir National Park safari',today),today),true);
 assert.equal(await putExactCache(enabled,'Is Gir safari open now?','en-IN',curatedMatches('Gir safari open now',today),today),false);
 assert.equal(writes,1);
});
test('public Worker route returns curated source cards with no paid providers',async()=>{
 const resp=await handleTuskWebSearch(new Request('https://api.example.test/tusk/search?q=Gir%20National%20Park%20safari'),{});
 assert.equal(resp.status,200);
 const body=await resp.json();
 assert.equal(body.route,'curated');
 assert.equal(body.available,true);
 assert.equal(body.hits.length>0,true);
 const missing=await handleTuskWebSearch(new Request('https://api.example.test/tusk/search?q=unknown%20unindexed%20public%20question'),{});
 assert.equal(missing.status,503);
 const blocked=await handleTuskWebSearch(new Request('https://api.example.test/tusk/search?q='+encodeURIComponent('my email is person@example.com')),{});
 assert.equal(blocked.status,400);
});
test('status makes optional paid providers transparent',()=>{
 assert.deepEqual(status({}),{curated:true,exactCache:false,semantic:false,liveBrave:false,automaticWebIngestion:false,publicQueryOnly:true,automaticPaidGrounding:false});
});
