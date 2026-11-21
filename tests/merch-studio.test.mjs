import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('mobile merch studio is attached without replacing existing checkout controls',()=>{
 const html=read('shop/index.html');
 for(const id of ['merch-studio','merch-search','merch-query','merch-cards','merch-action','buy-form','buy-pay'])
   assert.match(html,new RegExp('id="'+id+'"'),'missing '+id);
 assert.match(html,/merch-studio\.js/);
 assert.match(html,/shop\.js/);
 assert.match(html,/checkout\.js/);
});
test('original garment previews have complete front, back and sleeve assets',()=>{
 const cat=read('shop/catalog.js');
 for(const id of ['rave-rise-buransh-tee','rave-rise-buransh-hoodie']) assert.match(cat,new RegExp(id));
 for(const f of ['front','back','sleeve']){
   const svg=read('shop/img/rave-rise-buransh-'+f+'.svg');
   assert.match(svg,/<svg\b/);assert.match(svg,/<\/svg>/);
   assert.doesNotMatch(svg,/naruto|akatsuki|sharingan|one piece|suno logo/i);
 }
});
test('daily merchandise manifest cannot act as a paid SKU inventory',()=>{
 const m=JSON.parse(read('shop/daily-products.json'));
 assert.equal(m.schemaVersion,'1.0.0');
 assert.ok(m.products.length>=1);
 for(const p of m.products){
   assert.equal(p.live,false);
   assert.equal(p.price,null);
   assert.equal(p.qikinkSku,null);
   assert.equal(p.inventory,null);
   assert.equal(p.fulfilment,'unapproved');
   assert.match(p.image,/^\/shop\/img\/daily-\d{4}-\d{2}-\d{2}\.svg$/);
 }
});
test('merch selection never places a payment or sends orders automatically',()=>{
 const s=read('shop/merch-studio.js');
 assert.match(s,/merch-action/);
 assert.match(s,/SpeechRecognition/);
 assert.doesNotMatch(s,/fetch\([^)]*method\s*:\s*['"]POST|\bcashfree\.com|qikink\.com/i);
});
