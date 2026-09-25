'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/itinerary/focus-modes.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

function load(active){
  const store=new Map([['rw_travel_focus_v1',JSON.stringify(active||[])]]);
  const state={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:undefined};
  vm.runInNewContext(code,state);
  return state;
}

test('focus wording activates only explicit peace and yoga travel asks',()=>{
  const s=load([]);
  assert.deepEqual(Array.from(s.rwModesFromText('Plan a quiet yoga trip with no shopping stops')),['peace','yoga']);
  assert.deepEqual(Array.from(s.rwModesFromText('Build a quiet yoga-first journey in Rishikesh')),['peace','yoga']);
  assert.deepEqual(Array.from(s.rwModesFromText('Show me the World Peace Pagoda')),[]);
});

test('Yoga Mode favours yoga and wellness destinations',()=>{
  const s=load(['yoga']);
  const yoga={interests:['yoga','spiritual','wellness'],tags:['wellness']};
  const city={interests:['shopping','nightlife'],tags:['metro']};
  assert.ok(s.rwFocusScore(yoga,45)>s.rwFocusScore(city,45)+50);
  assert.match(s.rwFocusPrompt(),/verify teacher credentials/i);
  assert.match(s.rwFocusPrompt(),/never invent certification/i);
});

test('Peace Mode rewards lower crowds and avoids accusatory claims',()=>{
  const s=load(['peace']);
  const d={interests:['nature','slow'],tags:['offbeat']};
  assert.ok(s.rwFocusScore(d,20)>s.rwFocusScore(d,80));
  assert.match(s.rwFocusPrompt(),/leave out markets and shopping stops/i);
  assert.match(s.rwFocusPrompt(),/never accuse/i);
});

test('planner and public home expose both modes without backend wording',()=>{
  assert.match(html,/data-focus="peace"/);
  assert.match(html,/data-focus="yoga"/);
  assert.match(html,/Peace Mode<\/b> quieter journeys/);
  assert.match(html,/Yoga Mode<\/b> practice-first India/);
  assert.match(html,/js\/itinerary\/focus-modes\.js/);
  assert.doesNotMatch(html.match(/<div class="focus-modes"[\s\S]*?<\/div>\s*<div class="focus-mode-note"/)[0],/Firestore|UID|database|backend/i);
});
