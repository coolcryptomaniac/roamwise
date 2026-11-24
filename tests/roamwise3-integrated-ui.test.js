'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('index.html'),world=read('js/ui/ailon-world-experience.js');
const filmstrip=read('js/ui/destination-filmstrip.js');
const styles=read('design/ailon-world-experience.css');

test('one discovery rail and one AI settings shortcut, no second injection',()=>{
 assert.equal((page.match(/id="rwDestinationsRail"/g)||[]).length,1);
 assert.equal((page.match(/class="rw-tusk-ai-settings"/g)||[]).length,1);
 assert.doesNotMatch(page,/id="rwWorldRail"/);
 assert.doesNotMatch(world,/mountWorldRail|mountAiSettings|createElement\(['"]section['"]\).*rwWorldRail/);
 assert.match(world,/worldSearchControl/);
 assert.match(world,/mountCategoryDeck/);
 assert.match(world,/itinerarySkin/);
 assert.match(page,/ailon-world-experience\.js\?v=20261124-guided/);
 assert.match(page,/destination-filmstrip\.js/);
});
test('world atlas search and category deck augment the existing rail',async()=>{
 const html='<div id="copilotHero"><div class="tusk-title"><button class="rw-tusk-ai-settings">AI settings</button></div><textarea id="heroInput"></textarea><div id="heroLog"><article class="rw-tusk-itinerary" aria-label="3 day itinerary for Almora"><div class="tk-place">3-day Almora itinerary</div></article></div></div>'
 +'<section id="rwDestinationsRail"><div id="rwDestinationTrack"></div><span id="rwDestinationCount"></span><button id="rwDestinationPrev"></button><button id="rwDestinationNext"></button></section>'
 +'<div id="rwSalesCarousels"><div class="rw-sales-track" id="rwSalesStays"><a class="rw-sales-card"><img src="/assets/img/roamwise-logo-176.webp"></a></div><div id="rwSalesWeddings"><a class="rw-sales-card"><img src="/assets/img/roamwise-logo-176.webp"></a></div><div id="rwSalesPackages"><a class="rw-sales-card"></a></div><div id="rwSalesShop"><a class="rw-sales-card"></a></div></div><div id="results"></div>';
 const dom=new JSDOM(html,{url:'https://roamwise-web.pages.dev/',runScripts:'outside-only'});
 dom.window.DB=[{id:'almora',name:'Almora',country:'India'},{id:'tokyo',name:'Tokyo',country:'Japan'}];
 dom.window.eval(filmstrip);
 dom.window.eval(world);
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 const doc=dom.window.document;
 assert.equal(doc.querySelectorAll('#rwDestinationsRail').length,1);
 assert.equal(doc.querySelectorAll('.rw-world-search').length,1);
 assert.equal(doc.querySelectorAll('#rwWorldRail').length,0);
 assert.equal(doc.querySelectorAll('.rw-tusk-ai-settings').length,1);
 assert.equal(doc.querySelectorAll('.rw-ailon-ai-settings').length,0);
 assert.equal(doc.querySelectorAll('#rwCategoryDeck').length,1);
 assert.equal(doc.querySelectorAll('#rwCategoryDeck .rw-category-item').length,4);
 assert.equal(doc.querySelectorAll('.rw-tusk-itinerary .rw-itinerary-view-switch').length,1);
 assert.equal(doc.querySelectorAll('.rw-tusk-itinerary .rw-itinerary-view-switch button').length,4);
 const lookup=dom.window.RWAilonWorld.searchAtlas;
 assert.equal((await lookup('Tokyo',{_state:{ready:true},find:()=>({ready:true,best:{name:'Tokyo',country:'Japan'},ambiguous:false})})).matches[0].name,'Tokyo');
 assert.equal((await lookup('Springfield',{_state:{ready:true},find:()=>({ready:true,ambiguous:true,best:{},matches:[
 {name:'Springfield',country:'United States',where:'Illinois'},
 {name:'Springfield',country:'United States',where:'Massachusetts'}
 ]})})).matches.length,2);
 dom.window.close();
});
test('combined UI retains safe payment and reduced motion boundaries',()=>{
 assert.doesNotMatch(world,/cashfree\/order|paymentSessionId|automaticCharge/);
 assert.doesNotMatch(filmstrip,/pollinations\.ai|cashfree\/order/);
 assert.match(styles,/prefers-reduced-motion/);
 assert.match(world,/No verified RoamWise stay is listed/);
 assert.match(world,/Search|searchAtlas/);
});
