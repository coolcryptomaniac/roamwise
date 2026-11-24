import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TUSK_ATLAS} from '../worker/data/tusk-travel-atlas.js';
import {WORLD_ATLAS} from '../worker/data/tusk-world-atlas.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const snapshot=read('data/ailon-atlas-snapshot.js');
const atlas=read('js/copilot/atlas-cards.js'),sourced=read('js/copilot/sourced-search.js'),commerce=read('js/copilot/tusk-commerce.js'),offers=read('js/booking/tusk-direct-offers.js');
function browser(){
 const calls=[],replies=[];
 const rates={packages:[{id:'manali-test',open:true,name:'Manali test package',from:{total:12000},properties:[{name:'Test villa',place:'Manali'}]}],stays:{manali:{name:'Manali test stay',place:'Manali',kind:'amor'},almora:{name:'Almora test stay',place:'Almora',kind:'advance'}}};
 const ctx={window:{},URL,encodeURIComponent,AbortController,setTimeout,clearTimeout,Date,Promise,console,
  document:{addEventListener(){},getElementById(){return null;}},
  localStorage:{getItem(){return null;}},
  esc2:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  fetch:async url=>{calls.push(url);return {ok:true,json:async()=>rates};},
  cpFinish:(bubble,html,intents,raw)=>replies.push({html,intents,raw})};
 vm.createContext(ctx);
 for(const code of [snapshot,sourced,atlas,commerce,offers])vm.runInContext(code,ctx);
 return {ctx,calls,replies,api:ctx.window.RWTuskCommerce};
}
test('generated browser data exactly matches canonical India and international profiles',()=>{
 const {ctx}=browser();
 const expected=[...TUSK_ATLAS,...WORLD_ATLAS].map(d=>({id:d.id,name:d.name,country:d.country,region:d.region,aliases:d.aliases,highlights:d.highlights,food:d.foodSuggestions,facts:d.facts,people:d.people,itinerary:d.suggestedItinerary,summary:d.summary,status:d.status,source:d.sourcePage}));
 assert.equal(expected.length,354);
 assert.equal(JSON.stringify(ctx.window.RW_LOCAL_ATLAS),JSON.stringify(expected));
});
test('Goa and Coorg show rich itinerary, food and actions without AI or outbound calls',()=>{
 const {ctx,calls,replies}=browser();
 for(const [raw,dest,food] of [['Goa','Goa','Bebinca'],['Plan a trip to goa , india','Goa','Bebinca'],['Plan a trip to Coorg, India','Coorg (Kodagu)','Kadambuttu'],['Plan a trip to Helsinki','Helsinki','Salmon soup']]){
  const intents={dest:'Manali',_state:raw.toLowerCase().includes('goa')?'goa':undefined};
  assert.equal(ctx.rwLocalAtlasReply({},intents,raw,false),true);
  const result=replies.at(-1);
  assert.equal(result.intents.dest,dest);
  assert.match(result.html,/Suggested 3-day itinerary/);
  assert.match(result.html,/Find or request stays/);
  assert.match(result.html,new RegExp(food));
  assert.match(result.html,/RoamWise local guide/);
  assert.equal(result.intents._rwAllowDestinationCommerce,true);
  assert.doesNotMatch(result.html,/Manali test/);
 }
 assert.equal(calls.length,0);
});
test('AI outage retains rich guide for detailed planning and blocks private or dynamic questions',()=>{
 const {ctx,replies,calls}=browser();
 ctx.rwTuskSearchFailure({},'Plan a 5 day trip to Goa for two',{dest:'Goa'},null);
 assert.match(replies[0].html,/Suggested 3-day itinerary/);
 assert.equal(ctx.rwLocalAtlasReply({},{} ,'my booking in Goa',true),false);
 assert.equal(ctx.rwLocalAtlasReply({},{} ,'Goa weather today',true),false);
 assert.equal(ctx.rwLocalAtlasReply({},{} ,'Goa and Manali trip',true),false);
 assert.equal(ctx.rwLocalAtlasReply({},{} ,'Plan a trip to an unknown destination',true),false);
 assert.equal(calls.length,0);
});
test('destination checkout rail uses only exact place matches; no inventory yields enquiry, not payment',async()=>{
 const {ctx,api}=browser();
 for(const place of ['Goa','Coorg','Tokyo']){
  const i={_noGenericActions:true,_rwAllowDestinationCommerce:true,dest:place};
  const html=await api.cardsHTML('Plan a trip to '+place,i);
  assert.match(html,/Request a quote/);
  assert.doesNotMatch(html,/data-tusk-open|Manali test|Almora test/);
 }
 const html=await api.cardsHTML('Plan a trip to Manali',{_noGenericActions:true,_rwAllowDestinationCommerce:true,dest:'Manali'});
 assert.match(html,/data-tusk-open="package"/);
 assert.match(html,/data-tusk-open="stay"/);
 assert.match(html,/No booking is confirmed just by paying/);
 assert.doesNotMatch(html,/Almora test/);
 assert.equal(ctx.rwTuskOffersReply({}, {dest:'Goa'},'Destination wedding in Goa'),false);
});
test('local catalogue is loaded before renderer and both simple and failure paths call local reply',()=>{
 const html=read('index.html'),core=read('js/copilot/core.js');
 assert.ok(html.indexOf('data/ailon-atlas-snapshot.js')<html.indexOf('js/copilot/atlas-cards.js'));
 assert.match(core,/rwLocalAtlasReply\(thinking,intents,t,false\)/);
 assert.match(sourced,/rwLocalAtlasReply\(thinking,intents,t,true\)/);
});
