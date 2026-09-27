'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('party costing gives transparent bounded group savings and vehicle guidance',()=>{
  const state={window:{},document:{getElementById:()=>null},localStorage:{getItem:()=>null,setItem:()=>{}},console};
  state.window=state;
  vm.runInNewContext(read('js/itinerary/party-costs.js'),state);
  const couple=state.rwPartyEstimate(100,2);
  assert.equal(couple.groupTotal,180);
  assert.equal(couple.perPerson,90);
  assert.match(couple.label,/couple/);
  const group=state.rwPartyEstimate(100,20);
  assert.equal(group.groupTotal,1460);
  assert.equal(group.perPerson,73);
  assert.match(group.vehicle,/Mini coach|Tempo/);
  assert.ok(group.groupTotal>1000,'large groups still scale personal expenses');
});

test('Chennai to Vietnam is parsed as an outbound route, never as a Chennai destination',()=>{
  const storage=new Map();
  const state={
    console,window:null,localStorage:{removeItem:k=>storage.delete(k)},
    lsGet:k=>storage.get(k)||'',lsSet:(k,v)=>storage.set(k,String(v)),
    DB:[{name:'Chennai'}],RW_PLACE_OVERRIDES:{},RW_COMMON_WORDS:/^(plan|trip|from|to)$/i,
    rwDetectState:()=>null,rwDetectCountry:t=>/vietnam/i.test(String(t))?'vietnam':null,
    navigator:{onLine:false}
  };
  state.window=state;
  vm.runInNewContext(read('js/copilot/core.js'),state);
  const intent=state.cpParseRegex('Plan a 7 day trip from Chennai to Vietnam');
  assert.equal(intent.origin,'Chennai');
  assert.equal(intent._country,'vietnam');
  assert.equal(intent.dest,null);
  assert.equal(intent._route,true);
  assert.equal(intent.stops,null);
});

test('spoken Ranikhet duration and qualified town context never collapse to India or Uttarakhand scope',()=>{
  const storage=new Map();
  const state={
    console,window:null,localStorage:{removeItem:k=>storage.delete(k)},
    lsGet:k=>storage.get(k)||'',lsSet:(k,v)=>storage.set(k,String(v)),
    DB:[],RW_COMMON_WORDS:/^(plan|trip|from|to|day|days)$/i,
    navigator:{onLine:false},esc2:s=>String(s)
  };
  state.window=state;
  vm.runInNewContext(read('js/data/regions.js'),state);
  vm.runInNewContext(read('js/data/place-overrides.js'),state);
  vm.runInNewContext(read('js/copilot/region-routes.js'),state);
  vm.runInNewContext(read('js/copilot/core.js'),state);
  const spoken=state.cpParseRegex('three day plan to Ranikhet');
  assert.equal(spoken.dest,'Ranikhet');
  assert.equal(spoken.days,3);
  assert.equal(spoken._country,undefined);
  assert.equal(spoken._state,undefined);
  const qualified=state.cpParseRegex('three day plan to Ranikhet, Uttarakhand, India');
  assert.equal(qualified.dest,'Ranikhet');
  assert.equal(qualified.days,3);
  assert.equal(qualified.multi,undefined);
  assert.equal(qualified._state,undefined);
  assert.equal(qualified._country,undefined);
});

test('place disambiguation preserves the original duration and canonical state',()=>{
  const state={navigator:{onLine:false},esc2:s=>String(s),Number,String};
  vm.runInNewContext(read('js/itinerary/place-disambiguation.js'),state);
  const q=state.rwDisambigFollowQuery('Ranikhet',{
    name:'Ranikhet',admin:'Uttarakhand',country:'India'
  },{_raw:'three day plan to Ranikhet',days:3});
  assert.equal(q,'three day plan to Ranikhet, Uttarakhand, India');
});

test('Sarvam India-first provider uses the official OpenAI-compatible chat endpoint',async()=>{
  let request=null;
  const state={
    window:{},setTimeout,clearTimeout,
    fetch:async(url,options)=>{
      request={url,options};
      return {status:200,json:async()=>({choices:[{message:{content:'namaste'}}]})};
    }
  };
  vm.runInNewContext(read('js/copilot/ai-providers.js'),state);
  const answer=await state.aiRequest('sarvam','sk_test','sarvam-105b-conversations','hello',50,false);
  assert.equal(answer,'namaste');
  assert.equal(request.url,'https://api.sarvam.ai/v1/chat/completions');
  assert.equal(request.options.headers.Authorization,'Bearer sk_test');
  assert.equal(JSON.parse(request.options.body).model,'sarvam-105b-conversations');
});

test('sending a Copilot prompt stops any cue and never starts search music',()=>{
  const source=read('js/copilot/core.js');
  const send=source.slice(source.indexOf('function copilotSend('),source.indexOf('\n}',source.indexOf('function copilotSend('))+2);
  assert.match(send,/rwStopCue\('?/);
  assert.doesNotMatch(send,/rwPlayCue\(/);
});

test('personalisation remembers planning controls and can clear them without touching account data',()=>{
  const dom=new JSDOM('<!doctype html><body><input id="origin" value="Chennai"><select id="style"><option selected>Family with kids</option></select><select id="crowd"><option value="avoid" selected>Avoid</option></select><select id="tmode"><option value="std" selected>Standard</option></select><select id="partySize"><option value="4" selected>4</option></select><div id="tagsContainer"><span class="tag on" data-v="Food"></span></div><textarea id="heroInput"></textarea></body>',{url:'https://roamwise.co.in'});
  const state={window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,showToast:()=>{}};
  vm.runInNewContext(read('js/core/user-preferences.js'),state);
  state.rwRememberPlanningPreferences();
  const saved=JSON.parse(dom.window.localStorage.getItem('rw_planning_preferences_v1'));
  assert.deepEqual(JSON.parse(JSON.stringify(saved.interests)),['Food']);
  assert.equal(saved.partySize,4);
  dom.window.localStorage.setItem('account_session','keep-me');
  state.rwClearLearnedPreferences(false);
  assert.equal(dom.window.localStorage.getItem('rw_planning_preferences_v1'),null);
  assert.equal(dom.window.localStorage.getItem('account_session'),'keep-me');
});

test('composer reserves a separate footer row so model chips cannot cover Send',()=>{
  const css=read('mobile-stability.css');
  const html=read('index.html');
  assert.match(css,/grid-template-areas:\s*"input input" "models actions"/);
  assert.match(css,/\.copilot-actions\s*\{[\s\S]*?position:\s*static\s*!important/);
  assert.match(html,/id="heroSend"[^>]+aria-label="Send travel request"/);
});

test('continuous navigation is delegated without adding hidden background-location behavior',()=>{
  const source=read('js/copilot/rich-reply.js');
  assert.match(source,/function rwTuskNavigate/);
  assert.match(source,/google\.com\/maps\/dir\/\?api=1&destination=/);
  assert.match(source,/without RoamWise[\s\S]*background-location foreground service/);
});
