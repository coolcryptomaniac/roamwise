'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('weddings remain visible in default stays feed and have dedicated Weddings filter',()=>{
 const dom=new JSDOM('<section id="rwSalesCarousels"><nav id="rwDiscoverFilters"></nav><h2 id="rwDiscoverTitle"></h2>'
  +'<div class="rw-trackheading"><button data-rw-next="rwSalesStays"></button></div><div id="rwSalesStays" class="rw-sales-track"><a class="rw-sales-card"></a></div>'
  +'<div class="rw-trackheading"><button data-rw-next="rwSalesPackages"></button></div><div id="rwSalesPackages" class="rw-sales-track"><a class="rw-sales-card"></a></div>'
  +'<div class="rw-trackheading"><button data-rw-next="rwSalesWeddings"></button></div><div id="rwSalesWeddings" class="rw-sales-track"><a class="rw-sales-card"></a></div>'
  +'<div class="rw-trackheading"><button data-rw-next="rwSalesCorporate"></button></div><div id="rwSalesCorporate" class="rw-sales-track"><a class="rw-sales-card"></a></div>'
  +'</section>',{url:'https://roamwise-web.pages.dev/',runScripts:'outside-only'});
 dom.window.eval(read('js/ui/home-curated-discovery.js'));
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 const $=id=>dom.window.document.getElementById(id);
 assert.equal($('rwSalesWeddings').hidden,false,'wedding must appear by default in Stays');
 assert.equal($('rwSalesCorporate').hidden,true);
 const weddingTab=[...$('rwDiscoverFilters').querySelectorAll('button')].find(x=>x.textContent==='Weddings');
 assert.ok(weddingTab,'dedicated weddings tab is available');
 weddingTab.click();
 assert.equal($('rwSalesWeddings').hidden,false);
 assert.equal($('rwSalesStays').hidden,true);
 const staysTab=[...$('rwDiscoverFilters').querySelectorAll('button')].find(x=>x.textContent==='Stays & packages');
 staysTab.click();
 assert.equal($('rwSalesWeddings').hidden,false,'shared wedding rail remains visible after returning');
});

test('destination rail progressively loads unique entries and never invents prices or remote generated photos',()=>{
 const html='<div id="copilotHero"><textarea id="heroInput"></textarea></div>'
 +'<section id="rwDestinationsRail"><div id="rwDestinationTrack"></div><button id="rwDestinationPrev"></button><button id="rwDestinationNext"></button><span id="rwDestinationCount"></span></section>';
 const dom=new JSDOM(html,{url:'https://roamwise-web.pages.dev/',runScripts:'outside-only'});
 let promptCount=0;
 dom.window.DB=Array.from({length:23},(_,i)=>({id:'place'+i,name:'Sample city '+i,country:'India'}));
 dom.window.copilotSend=()=>{promptCount++};
 dom.window.document.getElementById('copilotHero').scrollIntoView=()=>{};
 dom.window.eval(read('js/ui/destination-filmstrip.js'));
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 const track=dom.window.document.getElementById('rwDestinationTrack');
 assert.equal(track.querySelectorAll('.rw-destination-card').length,12);
 track.dispatchEvent(new dom.window.Event('scroll'));
 assert.equal(track.querySelectorAll('.rw-destination-card').length,23,'new destinations append until all are visible');
 assert.equal(track.querySelectorAll('img').length,0,'unknown destinations use branded fallbacks');
 assert.equal(track.querySelectorAll('a.rw-dest-stays').length,23);
 const first=track.querySelector('.rw-dest-plan');
 first.click();
 assert.equal(promptCount,1);
 assert.match(dom.window.document.getElementById('heroInput').value,/Sample city 0/);
 assert.equal(dom.window.document.querySelectorAll('[data-price]').length,0,'no invented payment or stay prices');
});
