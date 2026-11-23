'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html'),enhance=read('js/ui/roamwise-world-enhancements.js');
const filmstrip=read('js/ui/destination-filmstrip.js');
const merch=read('js/misc/misc-features-2.js');

function dom(){
 const markup='<!doctype html><html><body>'
   +'<section id="copilotHero"><div class="tusk-title"><button class="rw-tusk-ai-settings">AI settings</button></div><textarea id="heroInput"></textarea></section>'
   +'<section id="rwDestinationsRail"><div id="rwDestinationTrack"></div><button id="rwDestinationPrev"></button><button id="rwDestinationNext"></button><span id="rwDestinationCount"></span></section>'
   +'<section id="rwSalesCarousels"><div id="rwSalesStays"><a class="rw-sales-card"><img src="/assets/property-photos/milan-heights-front.jpg"></a></div>'
   +'<div id="rwSalesWeddings"><a class="rw-sales-card"><img src="/assets/property-photos/milan-heights-front.jpg"></a></div>'
   +'<div id="rwSalesPackages"><a class="rw-sales-card"><img src="/assets/property-photos/milan-heights-front.jpg"></a></div>'
   +'<div id="rwSalesShop"><a class="rw-sales-card"><img src="/assets/property-photos/milan-heights-front.jpg"></a></div></section>'
   +'<nav id="rwDiscoverFilters"><button data-category="stays">Stays</button><button data-category="weddings">Weddings</button><button data-category="shop">Shop</button></nav>'
   +'</body></html>';
 const d=new JSDOM(markup,{url:'https://roamwise-web.pages.dev/',runScripts:'outside-only'});
 d.window.DB=[{id:'almora',name:'Almora',country:'India'},{id:'tokyo',name:'Tokyo',country:'Japan'}];
 d.window.eval(filmstrip);
 d.window.eval(enhance);
 d.window.document.dispatchEvent(new d.window.Event('DOMContentLoaded'));
 return d;
}
test('one destination carousel and one Ailon settings button on homepage',()=>{
 assert.equal((html.match(/id="rwDestinationsRail"/g)||[]).length,1);
 assert.equal((html.match(/class="rw-tusk-ai-settings"/g)||[]).length,1);
 assert.equal((html.match(/js\/ui\/destination-filmstrip\.js/g)||[]).length,1);
 assert.equal((html.match(/js\/ui\/roamwise-world-enhancements\.js/g)||[]).length,1);
 assert.equal((html.match(/id="rwWorldRail"/g)||[]).length,0);
 assert.doesNotMatch(enhance,/function mountWorldRail\(|function mountAiSettings\(/);
});
test('single rail gains on-demand world-search and four useful category doors',()=>{
 const d=dom(),doc=d.window.document;
 assert.equal(doc.querySelectorAll('#rwDestinationsRail').length,1);
 assert.ok(doc.querySelector('#rwDestinationsRail #rwWorldSearch'));
 assert.equal(doc.querySelectorAll('#rwWorldRail').length,0);
 assert.equal(doc.querySelectorAll('.rw-category-item').length,4);
 assert.ok(doc.querySelector('[data-rw-destination-id="tokyo"]'));
 assert.equal(doc.querySelectorAll('.rw-tusk-ai-settings').length,1);
 let clickCount=0;
 doc.querySelector('#rwDiscoverFilters button[data-category="weddings"]').addEventListener('click',()=>clickCount++);
 const weddings=[...doc.querySelectorAll('.rw-category-item')].find(b=>/Destination weddings/.test(b.textContent));
 assert.ok(weddings); weddings.click(); assert.equal(clickCount,1);
 d.window.close();
});
test('atlas disambiguates namesakes with region/country but never claims bookable stock',async()=>{
 const d=dom(),world=d.window.RWAilonWorld;
 const atlas={_state:{ready:true},find:()=>({ready:true,ambiguous:true,best:{name:'Springfield'},matches:[
   {name:'Springfield',where:'Illinois',country:'United States'},
   {name:'Springfield',where:'Missouri',country:'United States'}]})};
 const found=await world.searchAtlas('Springfield',atlas);
 assert.equal(found.status,'ambiguous');assert.equal(found.matches.length,2);
 assert.deepEqual(found.matches.map(x=>x.region),['Illinois','Missouri']);
 assert.ok(found.matches.every(x=>x.fromAtlas===true));
 d.window.close();
});
test('merch preview does not call Pollinations before visitor picks a style',()=>{
 const htmlBody=merch.slice(merch.indexOf('function rwMerchHTML('),merch.indexOf('function rwMerchPick('));
 assert.ok(htmlBody.includes('Choose an artwork style'));
 assert.doesNotMatch(htmlBody,/rwArtURL\(/);
 const order=merch.slice(merch.indexOf('function rwMerchOrder('),merch.indexOf('function rwMerchOrder(')+400);
 assert.match(order,/naturalWidth<100/);
});
test('four cached itinerary modes are loaded by the shared runtime only',()=>{
 const rt=read('itinerary-library/assets/preset-runtime.js');
 assert.match(rt,/preset-view-modes\.js/);
 assert.match(rt,/preset-view-modes\.css/);
 assert.ok(!enhance.includes('function itinerarySkin('));
});
