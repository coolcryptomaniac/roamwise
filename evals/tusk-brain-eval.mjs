/* Deterministic knowledge coverage and quality gate. Not a live LLM benchmark. */
import {TUSK_ATLAS} from '../worker/data/tusk-travel-atlas.js';
import {WORLD_ATLAS} from '../worker/data/tusk-world-atlas.js';
import {atlasAnswer} from '../worker/lib/tusk-atlas-answer.js';
import {handleTuskWebSearch} from '../worker/handlers/tusk-web-search.js';
import {TUSK_100_QUESTIONS} from './tusk-100-questions.mjs';
import {classifyKnowledgeQuestion} from '../worker/lib/tusk-knowledge-policy.js';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
export async function evaluateBrain(){
 const rows=[];
 for(const d of [...TUSK_ATLAS,...WORLD_ATLAS]){
  const result=atlasAnswer('Plan a trip to '+d.name);
  rows.push({id:'atlas-'+d.id,group:'destination-identity',pass:!!result&&result.atlas.id===d.id&&result.requiresLiveVerification===true&&result.atlas.itinerary.length===3&&result.atlas.photo.displayAllowed===false});
 }
 for(const [i,x] of TUSK_100_QUESTIONS.entries()){
  rows.push({id:'knowledge-'+(i+1),group:'knowledge-policy',pass:classifyKnowledgeQuestion(x.q).bucket===x.bucket});
 }
 const call=async(q,env={})=>handleTuskWebSearch(new Request('https://example.test/tusk/search?localOnly=1&q='+encodeURIComponent(q)),env);
 const privateResponse=await call('my booking in Tokyo');
 rows.push({id:'private-guard',group:'privacy',pass:privateResponse.status===400});
 const live=await call('Goa hotel price today');const liveBody=await live.json();
 rows.push({id:'live-price',group:'live-data-safety',pass:liveBody.requiresLiveVerification===true&&!liveBody.bookingConfirmed});
 const unknown=await call('Plan a trip to Inventedplacez');
 rows.push({id:'unknown-place',group:'uncertainty',pass:unknown.status===503});
 const source={source_id:'geonames-123',name:'Fixtureville',country_iso:'IN',admin_region:'01',source_url:'https://www.geonames.org/123/',attribution:'GeoNames (CC BY 4.0)'};
 let calls=[];
 const env={PUBLIC_KNOWLEDGE_READER:{async fetch(url){calls.push(url);return Response.json({items:[source]});}}};
 const found=await call('Plan a trip to Fixtureville',env),body=await found.json();
 rows.push({id:'geographic-reference',group:'fallback',pass:found.status===200&&body.route==='geographic-reference'&&body.requiresLiveVerification===true&&body.hits.length===1&&calls[0]==='https://knowledge.internal/v1/places?q=Fixtureville'});
 const groups={};
 for(const x of rows){const g=groups[x.group]||={passed:0,total:0};g.total++;if(x.pass)g.passed++;}
 return {mode:'deterministic-offline',total:rows.length,passed:rows.filter(x=>x.pass).length,groups,failures:rows.filter(x=>!x.pass).map(x=>x.id),liveLlmEvaluated:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const r=await evaluateBrain();
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(r,null,2)+'\n');
 console.log(JSON.stringify(r,null,2));process.exitCode=r.failures.length?1:0;
}
