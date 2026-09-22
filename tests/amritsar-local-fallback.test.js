'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname,'../js/itinerary/build.js'),'utf8');

function runAmritsar(days){
  const ph={innerHTML:'',style:{}};
  const cnt={innerHTML:'',style:{}};
  const state={
    isPro:true, itinBuilt:{}, activeProv:'smart', user:null, window:{},
    swTab:()=>{}, lsGet:()=>'',
    el:id=>id==='amritsar-iph'?ph:id==='amritsar-ict'?cnt:null,
    esc2:s=>String(s), rwGreenNudge:()=>'', travelLinksHTML:()=>'', badgeBump:()=>{}
  };
  vm.runInNewContext(code,state);
  state.buildItin('amritsar','Amritsar',4000,days);
  return {state,cnt};
}

test('Amritsar Smart itinerary starts with actual named sites and clear offline disclosure',()=>{
  const {state,cnt}=runAmritsar(3);
  assert.equal(state.itinBuilt.amritsar,true);
  assert.match(cnt.innerHTML,/Harmandir Sahib|Golden Temple/);
  assert.match(cnt.innerHTML,/Jallianwala Bagh/);
  assert.match(cnt.innerHTML,/Partition Museum/);
  assert.doesNotMatch(cnt.innerHTML,/Main historical site or museum/);
  assert.match(cnt.innerHTML,/not live availability, prices, events or crowd counts/);
  assert.equal(state.window._lastItin.days.length,3);
});

test('Seven-day Amritsar plan stays specific, including heritage and border day trips',()=>{
  const {state,cnt}=runAmritsar(7);
  assert.equal(state.window._lastItin.days.length,7);
  assert.match(cnt.innerHTML,/Ram Tirath/);
  assert.match(cnt.innerHTML,/Tarn Taran/);
  assert.match(cnt.innerHTML,/Attari/);
});
