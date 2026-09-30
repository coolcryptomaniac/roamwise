'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Kasar festival CTA sends a deterministic tailored plan and keeps city input out of analytics',()=>{
  const timers=[],events=[],finished=[];
  const hero={value:''},origin={value:'Mumbai'},log={style:{}};
  let clarityCalls=0,pasteCalls=0,aiCalls=0;
  const state={
    console,window:null,document:{},localStorage:{removeItem(){}},navigator:{},
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
  for(const event of ['kasar_ailon_tailor','kasar_milan_call_click','kasar_milan_dm_click','kasar_milan_referral_copy','kasar_origin_added']){
    assert.ok(rules.includes("statsBump('"+event+"')"),event+' must be explicitly permitted');
  }
});

test('Milan Heights referral asks for RoamWise attribution and copies a ready-to-send note',()=>{
  const html=read('index.html'),engagement=read('js/misc/engagement.js');
  assert.match(html,/When you reserve, please mention: <b>“I found Milan Heights on RoamWise\.”<\/b>/);
  assert.match(html,/Copy RoamWise booking message/);
  assert.match(engagement,/Hi Milan Heights, I found you on RoamWise/);
  assert.match(engagement,/track\('kasar_milan_referral_copy'\)/);
});
