import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const src=fs.readFileSync(new URL('../js/copilot/itinerary-rescue.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const memory=fs.readFileSync(new URL('../js/copilot/user-memory.js',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../js/copilot/core.js',import.meta.url),'utf8');
function app(opts={}){
 const events=[],finished=[],calls=[];
 const s={
  window:null,document:{addEventListener:(type,fn)=>events.push({type,fn})},
  console,Date,Promise,setTimeout,clearTimeout,setInterval,clearInterval,
  cpDbFind:(name)=>['Almora','Bengaluru','Rishikesh'].includes(name)?{name,country:'India',gems:[]}:null,
  rwKnownMap:()=>({almora:'Almora',bengaluru:'Bengaluru',rishikesh:'Rishikesh'}),
  rwResolvePlace:async name=>{calls.push(name);return {name,country:name==='Tbilisi'?'Georgia':'India',lowConf:false}},
  cpFinish:(_bubble,html,intents,raw)=>finished.push({html,intents,raw}),
  RW_PRESETS:{find:async()=>null},
  RW_INDIA_LANG:{aliases:{'बेंगलुरु':'Bengaluru','अल्मोड़ा':'Almora','ऋषिकेश':'Rishikesh'}}
 };
 Object.assign(s,opts);s.window=s;
 vm.createContext(s);vm.runInContext(src,s,{filename:'itinerary-rescue.js'});
 return {s,events,finished,calls};
}
test('itinerary rescue is loaded before the Ailon pre-answer hook and bypasses AI outage search',()=>{
 const i=index.indexOf('js/copilot/itinerary-rescue.js'),m=index.indexOf('js/copilot/user-memory.js');
 assert.ok(i>0&&m>i,'load itinerary module before memory pre-answer script');
 assert.match(memory,/RWTuskItinerary\.reply\(bubble,intents,t\)/);
 assert.match(src,/role="status"/);
 assert.match(src,/6500/,'slow geocoder has a finite timeout');
});
test('real Ailon core parser retains screenshot city and ten-day duration',()=>{
 const {makeTusk}=require('../tools/ai-ops/tusk-harness.cjs');
 const tusk=makeTusk();
 for(const [prompt,city] of [['10 days in Bengaluru','Bengaluru'],['10 days plan almora','Almora'],['10 days in Rishikesh','Rishikesh']]){
   const parsed=tusk.parse(prompt);
   assert.equal(parsed.days,10,prompt);
   assert.equal(String(parsed.dest||'').toLowerCase(),city.toLowerCase(),prompt);
   assert.equal(parsed.smalltalk,undefined,prompt);
 }
 const hindi=tusk.parse('मुझे ऋषिकेश में 10 दिन की यात्रा चाहिए');
 assert.notEqual(hindi.smalltalk,'greet','Hindi-only trip is not a greeting');
});
test('screenshot phrases are parsed as 10-day itineraries for the correct place',()=>{
 const {s}=app();
 for(const [q,name] of [['10 days in Bengaluru','Bengaluru'],['10 days plan almora','Almora'],['10 days in rishikesh','Rishikesh'],['I want a 10 day trip in Bangalore','Bangalore']]){
  const result=s.RWTuskItinerary.intent(q,{dest:name,days:10,wants:['plan']});
  assert.equal(result.days,10,q);assert.equal(result.dest,name,q);
 }
});
test('native Hindi/Kannada destination and spoken durations survive incomplete old parser',()=>{
 const {s}=app();
 const one=s.RWTuskItinerary.intent('मुझे ऋषिकेश में 10 दिन की यात्रा चाहिए',{dest:null,days:null});
 assert.equal(one?.dest,'Rishikesh');assert.equal(one?.days,10);
 const two=s.RWTuskItinerary.intent('दस दिन अल्मोड़ा घूमना है',{dest:null,days:null});
 assert.equal(two?.dest,'Almora');assert.equal(two?.days,10);
 const three=s.RWTuskItinerary.intent('ಬೆಂಗಳೂರು trip for 10 days',{dest:null,days:10});
 assert.equal(three?.dest,'Bengaluru');
});
test('plan intent does not override hotel reservations, prices, refunds or weather',()=>{
 const {s}=app();
 for(const t of ['10 days hotel booking in Almora','check 10 days weather in Almora','How much does a 10 days stay cost in Almora','Book 10 days in Rishikesh','refund for 10 days in Rishikesh']){
  assert.equal(s.RWTuskItinerary.intent(t,{dest:'Almora',days:10}),null,t);
 }
 assert.equal(s.RWTuskItinerary.intent('10 days honeymoon package in Manali',{dest:'Manali',days:10}),null);
});
test('complete 10-day named itineraries render real local activities, no false visa duration',()=>{
 const {s}=app();
 for(const [place,marker] of [['Bengaluru','Lalbagh'],['Almora','Kasar Devi'],['Rishikesh','Triveni Ghat']]){
  const plan={dest:place,days:10,budget:18000};
  const html=s.RWTuskItinerary.render(plan,{name:place,country:'India'},null,null);
  assert.match(html,new RegExp(marker));
  assert.match(html,/Day 10/);assert.match(html,/Day 1/);
  assert.match(html,/day-by-day/i);assert.match(html,/official tourism guide/i);
  assert.doesNotMatch(html,/0 days.*visa|Sources to explore|Wikipedia|cashfree\.checkout/);
  assert.match(html,/data-rw-itinerary-place=/);
 }
 assert.match(core,/no international visa needed for Indian travellers/);
 assert.doesNotMatch(core,/hit\.visa\.days\+' days'/);
});
test('typed or spoken planning bypasses paid AI and builds a result in the same bubble',async()=>{
 const {s,finished,calls}=app();
 const bubble={innerHTML:''},intents={dest:'Bengaluru',days:10,wants:['plan']};
 assert.equal(s.RWTuskItinerary.reply(bubble,intents,'10 days in Bengaluru'),true);
 assert.match(bubble.innerHTML,/Understanding your destination/);
 await new Promise(resolve=>setTimeout(resolve,35));
 assert.equal(finished.length,1);
 assert.match(finished[0].html,/Day 10/);
 assert.match(finished[0].html,/Cubbon Park/);
 assert.equal(intents._noGenericActions,true);
 assert.deepEqual(calls,[]);
});
test('worldwide city with no reviewed seed gets honest draft after geocode, not random Wikipedia results',async()=>{
 const {s,finished,calls}=app();
 assert.equal(s.RWTuskItinerary.reply({innerHTML:''},{dest:'Tbilisi',days:5},'5 days in Tbilisi'),true);
 await new Promise(resolve=>setTimeout(resolve,35));
 assert.equal(finished.length,1);
 assert.match(finished[0].html,/Tbilisi/);
 assert.match(finished[0].html,/no fully reviewed day-wise pack/i);
 assert.match(finished[0].html,/Day 5/);
 assert.doesNotMatch(finished[0].html,/Wikipedia|Sources to explore/);
 assert.deepEqual(calls,['Tbilisi']);
});
