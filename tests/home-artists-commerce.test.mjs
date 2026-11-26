import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('index.html');
test('Natasha is first commercial homepage rail and uses local approved catalog assets',()=>{
 const sales=home.indexOf('id="rwSalesCarousels"'),artists=home.indexOf('id="rwSalesArtists"'),stays=home.indexOf('id="rwSalesStays"');
 assert.ok(sales>=0&&artists>sales&&stays>artists,'artist cards lead the sales rails');
 assert.match(home,/aria-label="Featured artist carousel"/);
 assert.match(home,/href="\/creators\/natasha\.html"/);
 assert.match(home,/href="\/creators\/jagriti\.html"/);
 assert.match(home,/href="\/creators\/gallery\.html"/);
 assert.match(home,/Natasha Guleria · Brand Ambassador/);
 for(const asset of ['assets/img/natasha/natasha-with-painting.jpg','assets/img/natasha/manimanash.jpg']){
   assert.ok(fs.existsSync(new URL('../'+asset,import.meta.url)),asset+' must exist');
   assert.match(home,new RegExp(asset.replace(/\./g,'\\.')));
 }
 const region=home.slice(artists,stays);
 assert.equal((region.match(/class="rw-sales-card"/g)||[]).length,4,'four independently clickable artist items');
});
test('artist carousel is animated by shared helper, with reduced-motion and existing prices untouched',()=>{
 const css=read('design/design-vault.css'),vault=read('design/design-vault.js');
 assert.match(css,/#rwSalesArtists/);
 assert.match(vault,/\['rwSalesArtists','rwSalesStays','rwSalesPackages','rwSalesWeddings','rwSalesShop'\]/);
 assert.match(vault,/window\.rwCarousel\(track,\{auto:5700,design:true\}\)/);
 assert.match(home,/src="\/design\/carousel\.js"/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(home,/id="rwSalesWeddings"/);
 assert.match(home,/id="rwSalesShop"/);
 assert.match(home,/packages\/amor-checkout\.html/);
});
test('PWA freshness/build versions match and design editions asset URLs are versioned',()=>{
 const sw=read('sw.js'),fresh=read('js/runtime/freshness.js');
 const version=sw.match(/var VERSION = '([^']+)'/);
 assert.ok(version,'service worker must publish version');
 assert.match(version[1],/^rw-v\d+-/);
 assert.ok(fresh.includes("var BUILD = '"+version[1]+"'"),'PWA and cache must match');
 const jsVersion=home.match(/design\/design-vault\.js\?v=([\d-]+)"/);
 const cssVersion=home.match(/design\/design-vault\.css\?v=([\d-]+)"/);
 assert.ok(jsVersion&&cssVersion,'both asset URLs must be versioned');
 assert.equal(jsVersion[1],cssVersion[1]);
});

test('new default shrinks legacy 214px mobile composer without disturbing selectable legacy editions',()=>{
 const css=read('design/design-vault.css');
 const block=css.slice(css.indexOf('Mobile Ailon compactness fix:'));
 assert.match(block,/min-height:0!important;height:auto!important/);
 assert.match(block,/grid-template-rows:minmax\(78px,auto\) auto!important/);
 assert.match(block,/copilot-compose:focus-within #heroInput/);
 assert.match(block,/height:142px!important;min-height:142px!important/);
 assert.match(block,/max-width:600px/);
 assert.match(block,/himalayan-saanjh/);
 assert.doesNotMatch(block,/kasar-cloud|buransh-bazaar/);
 assert.match(read('mobile-stability.css'),/min-height: 214px !important/,'legacy rule is preserved');
});
