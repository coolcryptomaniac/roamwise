import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TUSK_ATLAS,TUSK_ATLAS_STATS,searchTravelAtlas} from '../worker/data/tusk-travel-atlas.js';
import {atlasAnswer} from '../worker/lib/tusk-atlas-answer.js';
import {handleTuskWebSearch} from '../worker/handlers/tusk-web-search.js';

const unique=a=>new Set(a).size===a.length;
test('124 India destinations are indexed with unique stable IDs and provenance',()=>{
 assert.equal(TUSK_ATLAS_STATS.total,124);
 assert.equal(TUSK_ATLAS_STATS.sourceBacked,18);
 assert.equal(TUSK_ATLAS_STATS.leads,106);
 assert.equal(TUSK_ATLAS_STATS.photoCleared,0);
 assert.equal(unique(TUSK_ATLAS.map(p=>p.id)),true);
 for(const p of TUSK_ATLAS){
   assert.equal(p.country,'India');
   assert.match(p.sourcePage,/^https:\/\//);
   assert.ok(p.name&&p.region);
   assert.ok(p.highlights.length>=2);
   assert.equal(p.suggestedItinerary.length,3);
   assert.ok(p.foodSuggestions.length>=2);
   assert.equal(p.photo.displayAllowed,false);
   assert.equal(p.photo.rights,'not-cleared');
   assert.ok(!Object.hasOwn(p.photo,'imageUrl'),'no undocumented photo embedding');
   if(p.status==='editorial-lead') assert.equal(p.checkedAt,null);
   if(p.status==='source-backed-overview')assert.ok(p.facts.length>=1);
 }
});
test('contextual matching distinguishes similar locations and public Hindi names',()=>{
 assert.equal(searchTravelAtlas('Plan three days in Almora')[0].id,'almora');
 assert.equal(searchTravelAtlas('Kasar Devi Temple retreat')[0].id,'kasar-devi');
 assert.equal(searchTravelAtlas('A calm itinerary in Bhimtal')[0].id,'bhimtal');
 assert.equal(searchTravelAtlas('कसार देवी यात्रा')[0].id,'kasar-devi');
 assert.equal(searchTravelAtlas('unrelated invented place').length,0);
});
test('regional foods, sourced people and three day itinerary can be retrieved without AI',()=>{
 const a=atlasAnswer('Kausani food and famous people itinerary');
 assert.equal(a.route,'atlas');
 assert.equal(a.knowledgeClass,'source-backed-overview');
 assert.equal(a.atlas.itinerary.length,3);
 assert.ok(a.atlas.food.includes('Bal mithai'));
 assert.ok(a.atlas.people.some(x=>x.name==='Sumitranandan Pant'));
 assert.match(a.summary,/regional food/i);
 assert.match(a.summary,/Notable people/i);
 assert.equal(a.atlas.photo.displayAllowed,false);
 assert.equal(a.requiresLiveVerification,true);
});
test('editorial leads are unmistakably not independently verified',()=>{
 const a=atlasAnswer('Cherrapunji local food itinerary');
 assert.equal(a.knowledgeClass,'editorial-lead');
 assert.equal(a.checkedAt,null);
 assert.equal(a.atlas.itinerary.length,3);
 assert.equal(a.atlas.photo.rights,'not-cleared');
 assert.match(a.source,/editorial/i);
});
test('live-price questions never become an apparent live quote',()=>{
 const a=atlasAnswer('Almora price today hotel booking availability');
 assert.equal(a.requiresLiveVerification,true);
 assert.match(a.summary,/cannot confirm live prices/i);
});
test('Worker answers atlas questions before paid external providers, but retains approved permits facts',async()=>{
 const a=await handleTuskWebSearch(new Request('https://example.test/tusk/search?q=Kasar%20Devi%203%20day%20itinerary'),{});
 assert.equal(a.status,200);
 const body=await a.json();
 assert.equal(body.route,'atlas');
 assert.equal(body.atlas.name,'Kasar Devi');
 assert.equal(body.atlas.photo.displayAllowed,false);
 const permit=await handleTuskWebSearch(new Request('https://example.test/tusk/search?q=Gir%20National%20Park%20safari%20permits'),{});
 assert.equal(permit.status,200);
 assert.equal((await permit.json()).route,'curated');
 const blocked=await handleTuskWebSearch(new Request('https://example.test/tusk/search?q='+encodeURIComponent('my booking is AB123')),{});
 assert.equal(blocked.status,400);
});
test('mobile card uses escaped text and links only to a reviewed reference page',()=>{
 const file=fs.readFileSync(new URL('../js/copilot/core.js',import.meta.url),'utf8');
 const cards=fs.readFileSync(new URL('../js/copilot/atlas-cards.js',import.meta.url),'utf8');
 const start=file.indexOf('function rwWebAnswerHTML(q,res){');
 const end=file.indexOf('/* One canonical known-place map',start);
 assert.ok(start>=0&&end>start);
 assert.match(cards,/function rwAtlasAnswerHTML/);
 const ctx={
  URL,esc2:(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
 };
 vm.createContext(ctx);vm.runInContext(cards+'\n'+file.slice(start,end),ctx);
 const data=atlasAnswer('Almora itinerary local food famous people photo');
 const input={
   abs:data.summary,hits:data.hits.map(x=>({u:x.url,t:x.title,s:x.source})),
   atlas:{...data.atlas,name:'<img src=x onerror=alert(1)>'}
 };
 const html=ctx.rwWebAnswerHTML('Almora trip',input);
 assert.match(html,/Suggested 3-day itinerary/);
 assert.match(html,/Regional food to try/);
 assert.match(html,/People & culture/);
 assert.match(html,/Source-backed quick facts/);
 assert.match(html,/Photo/);
 assert.match(html,/not embedded/);
 assert.doesNotMatch(html,/<img src=x/);
 assert.doesNotMatch(html,/<img\s/i);
 assert.match(html,/href="https:\/\/uttarakhandtourism\.gov\.in\/destination\/almora"/);
});

test('hosted Ailon retrieves destination-only public grounding before model generation',()=>{
 const core=fs.readFileSync(new URL('../js/copilot/core.js',import.meta.url),'utf8');
 const grounding=fs.readFileSync(new URL('../js/copilot/atlas-grounding.js',import.meta.url),'utf8');
 assert.ok(grounding.includes("var question='Travel guide to '+String(dest)"));
 assert.match(grounding,/rwTuskWorkerSearch\(question,source\)/);
 assert.match(core,/rwAtlasGroundGuide\(intents\.dest,base\)/);
 assert.match(grounding,/_rwAtlasContext/);
 assert.match(core,/do not present editorial suggestions as verified facts/);
});

test('three additional official cultural profiles are discoverable',()=>{
 for(const [destination,person] of [['Jaipur','Maharaja Sawai Jai Singh II'],['Hampi','Krishnadevaraya'],['Rameswaram','A. P. J. Abdul Kalam']]){
  const a=atlasAnswer('Learn the history of '+destination+' famous people');
  assert.equal(a.knowledgeClass,'source-backed-overview');
  assert.ok(a.atlas.people.some(p=>p.name===person));
  assert.ok(a.atlas.facts.length>=1);
 }
 assert.ok(atlasAnswer('Kasar Devi famous people').atlas.people.some(p=>p.name==='Swami Vivekananda'));
});
