import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/copilot/tusk-commerce.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const replies=fs.readFileSync(new URL('../js/copilot/rich-reply.js',import.meta.url),'utf8');
const offers=fs.readFileSync(new URL('../js/booking/tusk-direct-offers.js',import.meta.url),'utf8');
const voice=fs.readFileSync(new URL('../js/voice/tusk-studio.js',import.meta.url),'utf8');
function scenario(){
 const calls=[];
 const document={addEventListener:()=>{}};
 const catalog={
  checkoutOpen:true,products:[
   {id:'almora-after-dark-hoodie',name:'Almora After Dark Hoodie',type:'Hoodie',pricePaise:199900,maxQty:5,variants:[{id:'black-s',label:'Black S'}]},
   {id:'roamwise-mandala-tote',name:'RoamWise Mandala Tote',type:'Tote',pricePaise:79900,maxQty:5,variants:[{id:'standard',label:'Standard'}]}]
 };
 const stays={packages:[{id:'manali-snow-honeymoon',open:true,name:'Manali Snow Honeymoon',nightsLabel:'3 nights',from:{total:22000}}],
  stays:{milan:{name:'Milan Heights Almora',place:'Almora',kind:'advance'}}};
 const root={document,Date,Promise,console,
  setTimeout,clearTimeout,AbortController,encodeURIComponent,
  rwTuskIsPublicQuery:q=>!(/@|\bmy booking\b|मेरी बुकिंग|ನನ್ನ ಬುಕಿಂಗ್/.test(q)),
  fetch:async (url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url.includes('shop/catalogue')?catalog:stays}},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  window:null
 };
 root.window=root;
 vm.createContext(root);vm.runInContext(source,root);
 return {root,calls};
}
test('app loads bridge before answer builders and voice mode also receives cards',()=>{
 assert.match(index,/<script src="js\/copilot\/sourced-search.js[^"]*" defer><\/script>\s*<script src="js\/copilot\/tusk-commerce.js[^"]*" defer><\/script>/);
 assert.match(replies,/RWTuskCommerce\.cardsHTML\(raw,intents\)/);
 assert.match(voice,/RWTuskCommerce\.renderInto\(cards,raw,intents\)/);
 assert.match(offers,/data-tusk-open=/);
 assert.match(voice,/querySelectorAll\('[^']*\.rw-tusk-commerce/);
});
test('shopping words show labeled first-party offers with price from live catalogue; never submit checkout',async()=>{
 const {root,calls}=scenario();
 const html=await root.RWTuskCommerce.cardsHTML('I want to buy an Almora hoodie',{});
 assert.match(html,/RoamWise offers.*promotional/i);
 assert.match(html,/Almora After Dark Hoodie/);
 assert.match(html,/₹1,999/);
 assert.match(html,/data-tusk-id="almora-after-dark-hoodie"/);
 assert.doesNotMatch(html,/qikinkSku|api[_ -]?key|payment_session_id/);
 assert.deepEqual(calls.map(x=>x.url),['https://roamwise-api.founder-f53.workers.dev/shop/catalogue']);
 assert.equal(calls[0].options.credentials,'omit');
});
test('hotel and package suggestions never set invented Cashfree amounts or claim a confirmed stay',async()=>{
 const {root,calls}=scenario();
 const pkg=await root.RWTuskCommerce.cardsHTML('Find a honeymoon package in Manali',{});
 const stay=await root.RWTuskCommerce.cardsHTML('Find a hotel stay in Almora',{});
 assert.match(pkg,/Manali Snow Honeymoon/);
 assert.match(pkg,/data-tusk-open="package"/);
 assert.match(stay,/Milan Heights Almora/);
 assert.match(stay,/Exact quote at checkout/);
 assert.match(pkg,/No booking is confirmed just by paying/);
 assert.equal(calls.filter(x=>x.options.method==='POST').length,0);
});
test('no promotions shown on unsafe, private or unrelated research prompts',async()=>{
 const {root,calls}=scenario();
 for(const prompt of ['My booking is missing','मेरी बुकिंग दिखाओ','ನನ್ನ ಬುಕಿಂಗ್ ತೋರಿಸಿ','I have an emergency','What is the history of Corbett?']){
  assert.equal(await root.RWTuskCommerce.cardsHTML(prompt,{}),'',prompt);
 }
 assert.equal(calls.length,0);
});
test('promo intent never handles secrets or payment automatically',()=>{
 const {root}=scenario();
 assert.equal(root.RWTuskCommerce.category('I want a hoodie'),'shop');
 assert.equal(root.RWTuskCommerce.category('Need a trek guide'),'treks');
 assert.equal(root.RWTuskCommerce.category('Please check my booking'), '');
 assert.equal(root.RWTuskCommerce.category('Help with emergency booking'), '');
 assert.equal(root.RWTuskCommerce.category('Where is the Himalayan range?'), '');
});
