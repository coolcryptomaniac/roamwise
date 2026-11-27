import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import {runCommercePreview,validateCommerceArgs,COMMERCE_TOOLS} from '../worker/lib/roamwise-commerce-preview.js';
import {handleRoamwiseMcp} from '../worker/handlers/roamwise-discovery.js';
import {ROAMWISE_CARDS_HTML,ROAMWISE_CARDS_URI} from '../worker/lib/roamwise-mcp-ui.js';

const sampleShop=()=>Response.json({checkoutOpen:true,products:[
 {id:'almora-after-dark-hoodie',name:'Almora After Dark Oversized Hoodie',description:'400 GSM cotton mix',type:'Hoodie',
 image:'https://roamwise.co.in/shop/img/hoodie.jpg',pricePaise:199900,maxQty:5,variants:[{id:'black-s',label:'Black S'}]}
]});
const sampleStay=async(req)=>{
 const body=await req.json();
 assert.deepEqual(body,{stay:'milan',checkin:'2026-12-12',checkout:'2026-12-14',paymentType:'advance',rooms:1});
 return Response.json({ok:true,quote:{stay:'milan',property:'Milan Heights',currency:'INR',kind:'advance',amount:1000,total:null}});
};
const sampleShopQuote=async(req)=>{
 const body=await req.json();
 assert.equal(body.pin,'263601');
 assert.deepEqual(body.items,[{id:'almora-after-dark-hoodie',variant:'black-s',qty:1}]);
 return Response.json({ok:true,currency:'INR',totalPaise:199900,subtotalPaise:199900,shippingPaise:0,methods:{cashfree:true,upi:true},lines:[{id:'almora-after-dark-hoodie',qty:1}]});
};
const deps={shopCatalogue:sampleShop,stayQuote:sampleStay,shopQuote:sampleShopQuote};
const args={listingId:'milan-heights',checkin:'2026-12-12',checkout:'2026-12-14'};
const shopArgs={items:[{id:'almora-after-dark-hoodie',variant:'black-s',qty:1}],pin:'263601'};

test('new MCP tools are read-only; neither exposes create-order or wallet spending',()=>{
 assert.equal(COMMERCE_TOOLS.length,3);
 assert.ok(COMMERCE_TOOLS.every(t=>t.annotations.readOnlyHint&&t.annotations.destructiveHint===false));
 assert.equal(COMMERCE_TOOLS.some(t=>/complete_checkout|pay_wallet|create_order/.test(t.name)),false);
});
test('stay quote relies on server rate; an advance is never called a final price or confirmed room',async()=>{
 const res=await runCommercePreview('quote_roamwise_stay',args,{},deps);
 assert.equal(res.ok,true);assert.equal(res.quote.payNowPaise,100000);
 assert.equal(res.quote.totalPaise,null);assert.equal(res.availabilityVerified,false);
 assert.equal(res.bookingConfirmed,false);assert.equal(res.paymentStarted,false);
 assert.match(res.quoteScope,/final total is NOT confirmed/);
 assert.equal(res.pageUrl,'https://roamwise.co.in/stays/almora/');
 assert.equal(res.checkoutUrl,undefined); // reviewer rule: no direct checkout links
});
test('no rates or partner contacts are leaked and unsupported stays are rejected',async()=>{
 const r=await runCommercePreview('quote_roamwise_stay',{...args,listingId:'private-inventory'}, {},deps);
 assert.equal(r.ok,false);assert.equal(r.error,'invalid_arguments');
 assert.equal(validateCommerceArgs('quote_roamwise_stay',{...args,ownerPhone:'1234567890'}),false);
});
test('shop shows public variants and requires a fresh PIN quote',async()=>{
 const list=await runCommercePreview('browse_roamwise_shop',{}, {},deps);
 assert.equal(list.checkoutOpen,true);assert.equal(list.cards[0].category,'product');
 assert.equal(list.cards[0].price_text,'₹1,999');assert.equal(list.cards[0].stock_verified,false);
 assert.equal(JSON.stringify(list).includes('qikinkSku'),false);
 const quote=await runCommercePreview('quote_roamwise_shop',shopArgs,{},deps);
 assert.equal(quote.ok,true);assert.equal(quote.quote.totalPaise,199900);
 assert.equal(quote.orderCreated,false);assert.equal(quote.paymentStarted,false);assert.equal(quote.userApprovalRequired,true);
});
test('rejects malicious pricing inputs, bad PINs and oversized quantities',()=>{
 assert.equal(validateCommerceArgs('quote_roamwise_shop',{...shopArgs,pin:'abc123'}),false);
 assert.equal(validateCommerceArgs('quote_roamwise_shop',{...shopArgs,amount:1}),false);
 assert.equal(validateCommerceArgs('quote_roamwise_shop',{...shopArgs,items:[{...shopArgs.items[0],qty:100}]}),false);
 assert.equal(validateCommerceArgs('quote_roamwise_stay',{...args,checkout:'2026-11-30'}),false);
});
test('a merchant checkout error fails closed without fabricating a quote',async()=>{
 const bad=await runCommercePreview('quote_roamwise_shop',shopArgs,{},{
   shopQuote:async()=>Response.json({error:'checkout_disabled'},{status:503})});
 assert.equal(bad.ok,false);assert.equal(bad.error,'checkout_disabled');
});
test('public MCP returns quote and shop cards but no payment write tools',async()=>{
 const request=(method,params)=>new Request('https://api.roamwise.co.in/mcp',{method:'POST',
 headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 const r=await (await handleRoamwiseMcp(request('tools/call',{name:'quote_roamwise_stay',arguments:args}),{},deps)).json();
 assert.equal(r.result.structuredContent.quote.totalPaise,null);
 const shop=await (await handleRoamwiseMcp(request('tools/call',{name:'browse_roamwise_shop',arguments:{}}),{},deps)).json();
 assert.equal(shop.result.structuredContent.cards.length,1);
});
test('v2 rich cards parse as browser JS, allow only approved RoamWise links and never collect payment',()=>{
 assert.match(ROAMWISE_CARDS_URI,/cards-v2/);
 assert.ok(ROAMWISE_CARDS_HTML.includes('Get server quote'));
 assert.ok(ROAMWISE_CARDS_HTML.includes('tools/call'));
 assert.ok(ROAMWISE_CARDS_HTML.includes('roamwise.co.in'));
 assert.equal(ROAMWISE_CARDS_HTML.includes('complete_checkout'),false);
 assert.equal(ROAMWISE_CARDS_HTML.includes('requestCheckout'),false);
 const code=ROAMWISE_CARDS_HTML.split('<script>')[1].split('</script>')[0];
 assert.doesNotThrow(()=>new Script(code));
});
