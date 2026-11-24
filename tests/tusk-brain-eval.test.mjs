import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBrain} from '../evals/tusk-brain-eval.mjs';
import {geographicPlaceQuery,geographicAnswer} from '../worker/lib/tusk-geographic-brain.js';
test('all bundled guides and the knowledge policy suite pass deterministic brain evaluations',async()=>{
 const result=await evaluateBrain();
 assert.ok(result.total>=458);
 assert.equal(result.groups['destination-identity'].total,354);
 assert.equal(result.liveLlmEvaluated,false);
 assert.deepEqual(result.failures,[]);
});
test('geographic fallback never sends private or mixed itinerary data',async()=>{
 for(const s of ['my booking in Goa','Goa and Tokyo','where is my hotel','weather in Goa','flight to Goa'])assert.equal(geographicPlaceQuery(s),null);
 let calls=0;
 const env={PUBLIC_KNOWLEDGE_READER:{async fetch(){calls++;return Response.json({items:[]});}}};
 assert.equal(await geographicAnswer(env,'my booking in Goa'),null);
 assert.equal(calls,0);
});
test('multiple geographic matches require clarification; no invented bookable inventory',async()=>{
 const result=await geographicAnswer({PUBLIC_KNOWLEDGE_READER:{async fetch(){return Response.json({items:[{name:'Springfield',country_iso:'US',source_url:'https://www.geonames.org/123/'},{name:'Springfield',country_iso:'GB',source_url:'https://www.geonames.org/456/'}]});}}},'Springfield');
 assert.match(result.summary,/Several places match/);
 assert.equal(result.requiresLiveVerification,true);
 assert.equal(result.hits.length,2);
});
