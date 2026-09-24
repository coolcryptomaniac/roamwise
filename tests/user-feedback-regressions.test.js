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

