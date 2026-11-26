import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM, VirtualConsole} from 'jsdom';

const read = p => fs.readFileSync(new URL('../'+p, import.meta.url),'utf8');
function mount(){
 const errors=[];
 const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
 const dom=new JSDOM(read('index.html'),{url:'https://roamwise.co.in/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const {window}=dom,{document}=window;
 const css=document.createElement('style');
 css.textContent=read('design/ailon-first.css')+'\n'+read('design/design-vault.css');
 document.head.appendChild(css);
 window.rwCarousel=(track,opts)=>{track.dataset.carouselInitialized=String(opts.auto);};
 window.eval(read('design/design-vault.js'));
 document.dispatchEvent(new window.Event('DOMContentLoaded'));
 return {window,document,errors,dom};
}
test('real homepage DOM preserves every commercial carousel across three visual editions',()=>{
 const {window,document,dom}=mount();
 const panels=['rwSalesStays','rwSalesPackages','rwSalesWeddings','rwSalesShop'];
 const sales=document.getElementById('rwSalesCarousels');
 assert.ok(sales,'commercial collection is in HTML');
 assert.equal(sales.previousElementSibling.id,'rwCreditCard','credit promotion sits between Ailon and the commerce rails');
 for(const id of panels){
  const rail=document.getElementById(id);
  assert.ok(rail,id+' is present');
  assert.ok(rail.querySelectorAll('a[href]').length>=2,id+' contains real direct-sell links');
  assert.equal(rail.dataset.carouselInitialized,'5700',id+' autoplay delegated once');
 }
 const originalCards=panels.map(id=>[id,...document.getElementById(id).querySelectorAll('a[href]')].map(x=>x.href||x.id).join('|'));
 assert.ok(document.querySelector('#brand-ambassador a[href="/creators/artists.html"]'),'artist spotlight preserved');
 assert.ok(document.querySelector('a.rw-vault-wallet-link[href="/wallet/"]'),'wallet is visible in app DOM');
 window.RWDesignVault.select('kasar-cloud');
 assert.equal(window.localStorage.getItem('rw_design_edition'),'kasar-cloud');
 assert.equal(document.documentElement.dataset.rwDesign,'kasar-cloud');
 assert.equal(document.getElementById('copilotHero').nextElementSibling.id,'rwQuick','handy shortcuts stay beside Ailon in every edition');
 window.RWDesignVault.select('buransh-bazaar');
 assert.equal(document.documentElement.dataset.rwDesign,'buransh-bazaar');
 window.RWDesignVault.select('himalayan-saanjh');
 assert.equal(sales.previousElementSibling.id,'rwCreditCard');
 const afterCards=panels.map(id=>[id,...document.getElementById(id).querySelectorAll('a[href]')].map(x=>x.href||x.id).join('|'));
 assert.deepEqual(afterCards,originalCards,'switching themes never loses bookable inventory');
 const settings=document.querySelector('#settingsOverlay .modal-body');
 assert.ok(settings,'existing settings overlay must remain');
 window.RWDesignVault.mountSettings();
 assert.equal(document.querySelectorAll('#rw-design-vault button').length,3);
 dom.window.close();
});
test('Ailon home and core checkout links remain in DOM',()=>{
 const {document,dom}=mount();
 assert.ok(document.querySelector('#heroInput'));
 assert.ok(document.querySelector('#rwTuskDesk'));
 assert.ok(document.querySelector('#rwSalesStays a[href*="amor-checkout"]'));
 assert.ok(document.querySelector('#rwSalesWeddings a[href*="amor-checkout"]'));
 assert.ok(document.querySelector('#rwSalesShop a[href^="/shop/"]'));
 assert.match(read('index.html'),/Autoplay is owned by design\/carousel\.js/);
 const head = document.querySelector('head').innerHTML;
 assert.match(head,/design\/design-vault\.css/);
 assert.match(head,/design\/design-vault\.js/);
 dom.window.close();
});
test('Android build includes design vault and PWA bundle cache bumps together',()=>{
 const build=read('tools/build-android-www.cjs');
 assert.match(build,/'design','memories'/);
 const cache=read('sw.js').match(/var VERSION = '([^']+)'/);
 assert.ok(cache && /^rw-v\d+-/.test(cache[1]),'versioned service worker cache');
 assert.ok(read('js/runtime/freshness.js').includes("var BUILD = '"+cache[1]+"'"),'PWA BUILD and cache VERSION always match');
});
