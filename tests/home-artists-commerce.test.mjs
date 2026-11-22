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
 assert.match(vault,/window\.rwCarousel\(track,\{auto:5700\}\)/);
 assert.match(home,/src="\/design\/carousel\.js"/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(home,/id="rwSalesWeddings"/);
 assert.match(home,/id="rwSalesShop"/);
 assert.match(home,/packages\/amor-checkout\.html/);
});
test('PWA freshness/build versions match and design editions asset URLs are versioned',()=>{
 const sw=read('sw.js'),fresh=read('js/runtime/freshness.js');
 const pattern=/rw-v168-artist-home-rail/;
 assert.match(sw,pattern);
 assert.match(fresh,pattern);
 assert.match(home,/design\/design-vault\.js\?v=833-1/);
 assert.match(home,/design\/design-vault\.css\?v=833-1/);
});
