import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const handoffSrc=src('js/copilot/event-handoff.js');
const core=src('js/copilot/core.js');
const sourced=src('js/copilot/sourced-search.js');
const eventHandler=src('js/misc/events.js');
const index=src('index.html');
const fallback=src('js/copilot/rich-reply.js');
const worker=src('worker/worker.js');
const carousel=src('js/ui/carousel-feedback.js');

function runtime(){
  let scrolled=0;
  let bubbles=[];
  const head={appendChild(){}};
  const log={style:{}};
  const hero={style:{},scrollIntoView(){scrolled++;}};
  const doc={
    head,
    createElement(tag){return {tagName:tag,style:{},classList:{add(){},remove(){}},setAttribute(){}};},
    getElementById(id){if(id==='heroLog')return log;if(id==='copilotHero')return hero;return null;}
  };
  const window={
    RW_EVENTS:[{id:'bts-2026',name:'Bengaluru Tech Summit 2026',start:'2026-11-17',end:'2026-11-19',place:'BIEC, Bengaluru'}],
    tabGo(){},rwCloseSection(){},track(){},rwHaptic(){},
    cpBubble(html,who){bubbles.push({html,who});},
    matchMedia(){return {matches:true}}
  };
  const ctx={window,document:doc,matchMedia:window.matchMedia,Date,URL};
  vm.runInNewContext(handoffSrc,ctx);
  return {api:window.RWEventHandoff,window,bubbles,scrollCount:()=>scrolled,log};
}
test('BTS card resolves to summit itinerary rather than generic trekking vault',()=>{
  const {api,window}=runtime();
  const ev=api.find('I want to go to Bengaluru Tech Summit 2026 at BIEC. Plan the trip around it.');
  assert.equal(ev.id,'bts-2026');
  const html=api.plan(ev,'Almora');
  assert.match(html,/Madavara/);
  assert.match(html,/18 Nov/);
  assert.match(html,/Starting from:<\/b> Almora/);
  assert.match(html,/rw-event-plan-grid/);
  assert.match(html,/\/summit\//);
  assert.doesNotMatch(html,/Trek vault|Kedarkantha|Valley of Flowers/i);
});
test('event carousel click makes Ailon answer visible and scrolls upward',()=>{
  const {api,window,bubbles,scrollCount,log}=runtime();
  assert.equal(api.fromCarousel(window.RW_EVENTS[0]),true);
  assert.equal(window._cpTargetLog,'heroLog');
  assert.equal(log.style.display,'block');
  assert.equal(bubbles.length,2);
  assert.equal(bubbles[1].who,'bot');
  assert.ok(scrollCount()>0);
});
test('other event cards use verified events without fabricated pricing',()=>{
  const {api}=runtime();
  const html=api.plan({id:'other',name:'Art fair',start:'2026-11-20',place:'Bengaluru'},'');
  assert.match(html,/official ticket availability/);
  assert.match(html,/Live prices are not available/);
});
test('event handoff intercepts before generic travel parser',()=>{
  assert.ok(eventHandler.includes('RWEventHandoff.fromCarousel(e)'));
  assert.ok(eventHandler.indexOf('RWEventHandoff.fromCarousel(e)')<eventHandler.indexOf("copilotSend(!!el('heroInput'))"));
  assert.ok(core.indexOf('RWEventHandoff.answerInCopilot(t,fromHero)')<core.indexOf('rwTuskNeedsClarity(t)'));
  assert.ok(index.includes('js/copilot/event-handoff.js'));
});
test('AI outages provide sourced search instead of unverified day plans and travel cards',()=>{
  assert.match(core,/rwMiniSearch\(t\)/);
  assert.match(sourced,/_noGenericActions=true/);
  assert.doesNotMatch(core,/var days=Math\.max\(0,Math\.min\(14,Math\.floor\(Number\(intents&&intents\.days/);
  assert.match(fallback,/intents\._noGenericActions/);
  assert.match(worker,/tusk\/search/);
  assert.match(worker,/handleTuskWebSearch\(request,env\)/);
});
test('carousel feedback honors reduced motion and retains scrolling',()=>{
  assert.match(carousel,/prefers-reduced-motion:no-preference/);
  assert.match(carousel,/touch-action:manipulation/);
  assert.doesNotMatch(carousel,/touch-action:pan-y/);
});
