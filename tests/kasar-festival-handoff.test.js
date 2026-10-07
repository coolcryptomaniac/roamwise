'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Kasar festival CTA sends a deterministic tailored plan and keeps city input out of analytics',()=>{
  // Fixed to a moment before the festival's Oct 5, 2026 India-time end so this
  // test keeps covering the pre-festival CTA branch regardless of the real
  // wall-clock date (see rwKasarFestivalEnded). Without this, the test went
  // stale the instant real-world time crossed that threshold.
  class PreFestivalDate extends Date {constructor(...args){super(...(args.length?args:['2026-10-03T12:00:00Z']))}}
  const timers=[],events=[],finished=[];
  const hero={value:''},origin={value:'Mumbai'},log={style:{}};
  let clarityCalls=0,pasteCalls=0,aiCalls=0;
  const state={
    console,Date:PreFestivalDate,window:null,document:{},localStorage:{removeItem(){}},navigator:{},
    setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},
    el:id=>id==='heroInput'?hero:id==='kasarFestOrigin'?origin:id==='heroLog'?log:null,
    lsGet:()=>'',lsSet(){},activeProv:'roamwise',DB:[],RW_PLACE_OVERRIDES:{},
    cpBubble:(html,who)=>({innerHTML:html||'',textContent:'',who}),
    cpFocusHero(){},rwTuskNeedsClarity(){clarityCalls++;throw Error('festival must not be diverted to a generic clarification');},
    rwStartAnywhere(){pasteCalls++;throw Error('festival must not be classified as pasted text');},
    cpParseRegex:()=>({dest:'Kasar Devi',days:4}),rwMasalaWrap:x=>x,
    cpFinish:(...args)=>finished.push(args),track:e=>events.push(e),
    aiCallAny(){aiCalls++;throw Error('festival must not be sent to the configured AI provider');},
    esc2:s=>String(s),
  };
  state.window=state;
  vm.runInNewContext(read('js/copilot/core.js'),state);
  state.cpFocusHero=()=>{};
  state.cpBubble=(html,who)=>({innerHTML:html||'',textContent:'',who});
  state.cpParseRegex=()=>({dest:'Kasar Devi',days:4});
  state.rwAskKasarFest();
  assert.match(hero.value,/My starting city is Mumbai/);
  assert.equal(timers.length,1,'the button schedules its one-tap send');
  state.copilotSend(true);
  assert.equal(clarityCalls,0);
  assert.equal(pasteCalls,0);
  assert.equal(aiCalls,0);
  assert.equal(finished.length,1);
  assert.match(String(finished[0][1]),/Kasar Music Fest 2\.0/);
  assert.match(String(finished[0][1]),/Starting in Mumbai/);
  assert.match(String(finished[0][1]),/₹2,000 pass covers both festival days/);
  assert.ok(events.includes('kasar_origin_added'));
  assert.ok(events.includes('kasar_ailon_tailor'));
  assert.equal(events.some(e=>String(e).includes('Mumbai')),false,'only event names are tracked');
});

test('festival answers suppress unrelated recommendation cards and action rails',async()=>{
  let genericActionsCalled=false;
  const bubble={innerHTML:'',offsetTop:0,textContent:''};
  const state={
    console,window:null,_cpHist:[],_cpTargetLog:'heroLog',
    el:()=>null,rwRemember(){},rwTuskRail:()=>'<div>DO SOMETHING WITH THIS</div>',track(){},
    cpActionsHTML:async()=>{genericActionsCalled=true;return ['<div>5 strong picks for October</div>'];},
  };
  state.window=state;
  vm.runInNewContext(read('js/copilot/rich-reply.js'),state);
  state._cpHist=[];
  await state.cpFinish(bubble,'Curated festival itinerary',{dest:'Kasar Devi'},'Plan Kasar Music Fest 2.0 in Almora');
  assert.equal(genericActionsCalled,false);
  assert.doesNotMatch(bubble.innerHTML,/5 strong picks|DO SOMETHING WITH THIS/);
  assert.match(bubble.innerHTML,/Helpful\?/);
});

test('festival funnel counters are covered by the narrow Firestore stats allowlist',()=>{
  const rules=read('firestore.rules');
  for(const event of ['kasar_ailon_tailor','kasar_milan_booking_open','kasar_milan_whatsapp_open','kasar_origin_added']){
    assert.ok(rules.includes("statsBump('"+event+"')"),event+' must be explicitly permitted');
  }
});

test('Milan Heights event and Ailon Tusk send an attributed WhatsApp enquiry',()=>{
  const html=read('index.html'),tusk=read('js/copilot/core.js'),app=read('partner/app.js'),market=read('partner/marketplace.js');
  assert.doesNotMatch(html,/id="kasarFestWeekend"/,'the finished Kasar fest block is gone from the homepage');
  assert.match(html,/id="musicEventsIndia"/);
  assert.match(html,/Jodhpur RIFF/);
  assert.match(html,/e\.end>=today/,'event cards expire themselves after their last day');
  assert.match(tusk,/WhatsApp Milan Heights · mention RoamWise/);
  assert.match(tusk,/function rwKasarFestivalEnded\(now\)/);
  assert.match(tusk,/next available dates on WhatsApp/);
  assert.doesNotMatch(tusk,/7% commission|Request Milan Heights on RoamWise/);
  assert.match(app,/function milanWhatsAppMessage\(\).*found your stay through RoamWise/);
  assert.match(app,/kasar_milan_whatsapp_open/);
  assert.doesNotMatch(read('partner/stays-hub.js')+app.slice(app.indexOf('function renderSearchResults'),app.indexOf('function milanWhatsAppMessage')),/booking\.com|airbnb|aviasales|viator|discovercars/i,'signed stays and trip tabs never hand off to third-party sites');
  assert.match(market,/if\(role==='customer'\)\{if\(DEMO\)\{searchSupport\(\);validateCards\(\)/);
  const start=app.indexOf('function liveCustomer(){'),end=app.indexOf('function liveOwner()',start),guestFlow=app.slice(start,end);
  assert.match(guestFlow,/renderSearchResults\(\[\],false\)/);
  assert.doesNotMatch(guestFlow,/collectionGroup|roomBookings|temporarily unavailable/);
});

test('festival handoff switches to a general Almora enquiry after Oct 4 in India time',()=>{
  class FestivalEndDate extends Date {constructor(...args){super(...(args.length?args:['2026-10-04T18:30:00Z']))}}
  const state={console,Date:FestivalEndDate,window:null,document:{},localStorage:{removeItem(){}},navigator:{},el:()=>null,lsGet:()=>'',lsSet(){},activeProv:'roamwise',DB:[],RW_PLACE_OVERRIDES:{},cpBubble:()=>({}),cpFocusHero(){},track(){},esc2:s=>String(s)};
  state.window=state;
  vm.runInNewContext(read('js/copilot/core.js'),state);
  assert.equal(state.rwKasarFestivalEnded(new Date('2026-10-04T18:29:59Z')),false);
  assert.equal(state.rwKasarFestivalEnded(new Date('2026-10-04T18:30:00Z')),true);
  const reply=state.cpSmartAnswer('Plan Kasar Music Fest 2.0 in Almora');
  assert.match(reply,/weekend has passed/);
  assert.match(reply,/next available dates/);
  assert.doesNotMatch(reply,/Rahgir and Nupur Pant|₹2,000 pass/);
});
