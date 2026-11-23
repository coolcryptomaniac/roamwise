'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('itinerary-library/assets/preset-view-modes.js');
const css=read('itinerary-library/assets/preset-view-modes.css');

function setup(url, saved){
 const dom=new JSDOM('<!doctype html><html><head></head><body class="theme-crimson-moon"><header class="hero"><div class="toolbar"><button data-theme="crimson-moon">Crimson</button></div></header><main><div class="map-panel"></div><div class="timeline"><article class="day">Day 1</article></div></main></body></html>',{
   url:url||'https://roamwise-web.pages.dev/itinerary-library/presets/kumaon/signature.html',
   runScripts:'outside-only'
 });
 if(saved)dom.window.localStorage.setItem('rw_preset_view_v1',saved);
 dom.window.eval(js);
 return dom;
}

test('preset runtime loads a shared view mode script and CSS for all 192 cached pages',()=>{
 const rt=read('itinerary-library/assets/preset-runtime.js');
 assert.match(rt,/preset-view-modes\.js/);
 assert.match(rt,/preset-view-modes\.css/);
 assert.match(js,/cinematic.*editorial.*cards.*map/);
});
test('default is cinematic, current 192 HTML source remains untouched',()=>{
 const d=setup();
 assert.equal(d.window.document.body.dataset.rwView,'cinematic');
 const buttons=[...d.window.document.querySelectorAll('[data-rw-preset-view]')];
 assert.equal(buttons.length,4);
 assert.equal(buttons.filter(b=>b.getAttribute('aria-pressed')==='true').length,1);
 d.window.close();
});
test('user can change to editorial and persist selection without altering itinerary DOM',()=>{
 const d=setup();
 const day=d.window.document.querySelector('.day');
 d.window.document.querySelector('[data-rw-preset-view="editorial"]').click();
 assert.equal(d.window.document.body.dataset.rwView,'editorial');
 assert.equal(d.window.localStorage.getItem('rw_preset_view_v1'),'editorial');
 assert.equal(new URL(d.window.location.href).searchParams.get('view'),'editorial');
 assert.equal(day.textContent,'Day 1');
 assert.equal(d.window.document.querySelector('[data-rw-preset-view="editorial"]').getAttribute('aria-pressed'),'true');
 d.window.close();
});
test('query parameter overrides saved mode and preserves theme in shareable URL',()=>{
 const d=setup('https://roamwise-web.pages.dev/itinerary-library/presets/kumaon/signature.html?theme=eastern-frontier&view=cards','editorial');
 assert.equal(d.window.document.body.dataset.rwView,'cards');
 d.window.document.querySelector('[data-rw-preset-view="map"]').click();
 assert.equal(new URL(d.window.location.href).searchParams.get('theme'),'eastern-frontier');
 assert.equal(d.window.document.body.dataset.rwView,'map');
 assert.match(d.window.document.querySelector('#rwPresetViewNote').textContent,/not navigation/);
 d.window.close();
});
test('unsafe view values do not enter body dataset and presentation never changes payments',()=>{
 const d=setup('https://roamwise-web.pages.dev/itinerary-library/presets/kumaon/signature.html?view=__proto__');
 assert.equal(d.window.document.body.dataset.rwView,'cinematic');
 d.window.RWPresetDisplayModes.set('not-a-real-mode');
 assert.equal(d.window.document.body.dataset.rwView,'cinematic');
 assert.doesNotMatch(js,/Cashfree|cashfree\/order|paymentSessionId/);
 d.window.close();
});
test('mode CSS exposes real black-and-white, cards, map and reduced-motion states',()=>{
 for(const mark of ['data-rw-view="editorial"','data-rw-view="cards"','data-rw-view="map"','prefers-reduced-motion','aria-pressed'])assert.ok(css.includes(mark),mark+' missing');
});
