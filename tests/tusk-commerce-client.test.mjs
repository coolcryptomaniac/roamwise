import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/copilot/tusk-commerce.js',import.meta.url),'utf8');
function browser(){
 const calls=[],listeners={};
 const catalogue={checkoutOpen:true,products:[
  {id:'almora-after-dark-hoodie',name:'Almora After Dark Oversized Hoodie',type:'Hoodie',pricePaise:199900,maxQty:5,variants:[{id:'black-s',label:'Black S'}]},
  {id:'roamwise-mandala-tote',name:'Red Mandala Tote',type:'Tote',pricePaise:79900,maxQty:5,variants:[{id:'standard',label:'Standard'}]}]};
 const rates={packages:[{id:'manali-snow-honeymoon',open:true,name:'Manali Snow Honeymoon',nightsLabel:'3 nights',from:{total:20000}}],stays:{milan:{name:'Milan Heights, Almora',place:'Almora',kind:'advance'}}};
 const window={};const mem=new Map();
 const ctx={window,document:{addEventListener:(event,fn)=>{listeners[event]=fn;}},
  localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)},
  rwTuskIsPublicQuery:q=>!/(?:my booking|guest@example\.com|password)/i.test(q),
  fetch:async url=>{calls.push(url);return {ok:true,json:async()=>url.includes('/shop/')?catalogue:rates};},
  setTimeout,clearTimeout,AbortController,Promise,Date,URL,encodeURIComponent};
 vm.runInNewContext(source,ctx);
 return {api:window.RWTuskCommerce,calls,listeners};
}
test('relevant merchandise suggestions use real Worker prices, clearly disclose self-promotion',async()=>{
 const {api,calls}=browser();
 assert.equal(api.category('Show me a RoamWise hoodie'),'shop');
 const html=await api.cardsHTML('Show me a RoamWise hoodie',{});
 assert.match(html,/RoamWise offers · our own listings · promotional/);
 assert.match(html,/almora-after-dark-hoodie/);
 assert.match(html,/₹1,999/);
 assert.match(html,/data-tusk-open="shop"/);
 assert.equal(calls.length,1);
 assert.match(calls[0],/\/shop\/catalogue$/);
});
test('stay and package checkout cards never present dates as confirmed',async()=>{
 const {api}=browser();
 const h=await api.cardsHTML('Find a honeymoon package in Manali',{});
 assert.match(h,/data-tusk-open="package"/);
 assert.match(h,/recheck for your dates/);
 assert.match(h,/No booking is confirmed just by paying/);
 const stay=await api.cardsHTML('Find a hotel stay in Almora',{});
 assert.match(stay,/data-tusk-open="stay"/);
});
test('no paid calls or promotional cards for emergencies and private booking questions',async()=>{
 const {api,calls}=browser();
 assert.equal(api.category('Need an emergency ambulance right now'),'');
 assert.equal(await api.cardsHTML('Need an emergency ambulance right now',{}),'');
 assert.equal(await api.cardsHTML('my booking details for a hotel',{}),'');
 assert.equal(await api.cardsHTML('Email me at guest@example.com',{}),'');
 assert.equal(calls.length,0);
});
test('payments require user action, a verified quote, Cashfree and server-side status',()=>{
 assert.match(source,/data-tusk-open/);
 assert.match(source,/if\(!state\|\|busy\|\|!state\.quote\|\|!validForm\(\)\)return/);
 assert.match(source,/sent!==amount/);
 assert.match(source,/redirectTarget:'_modal'/);
 assert.match(source,/\/shop\/quote/);
 assert.match(source,/\/shop\/order/);
 assert.match(source,/\/stays\/quote/);
 assert.match(source,/\/stays\/checkout/);
 assert.match(source,/checkStatus\(cur,id,token\)/);
 assert.doesNotMatch(source,/fetch\('https:\/\/api\.cashfree\.com/);
});
