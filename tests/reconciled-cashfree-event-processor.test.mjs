import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createReconciledCashfreeEventProcessor} from '../js/booking/reconciled-cashfree-event-processor.mjs';
const timestamp='1793440000',secret='test_webhook_signing_secret';
function setup(fetchImpl){
 let booking={id:'booking_1234',state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 const claims=new Map();
 const db={collection:name=>({doc:id=>({name,id})}),runTransaction:async fn=>fn({get:async ref=>ref.name==='bookingPaymentClaims'?{exists:claims.has(ref.id),data:()=>claims.get(ref.id)}:{exists:true,data:()=>booking},create:(ref,value)=>claims.set(ref.id,value),update:(_,patch)=>{booking={...booking,...patch}}})};
 const handler=createReconciledCashfreeEventProcessor({db,signingSecret:secret,appId:'test_app',secretKey:'test_key',fetchImpl,now:()=>Number(timestamp)*1000,resolveBookingByOrderId:async id=>id===booking.orderId?{...booking}:null});
 const body=Buffer.from(JSON.stringify({type:'PAYMENT_SUCCESS_WEBHOOK',data:{order:{order_id:'order_12345',order_amount:1500,order_currency:'INR'},payment:{cf_payment_id:123456,payment_status:'SUCCESS'}}}));
 const request={rawBody:body,headers:{'x-webhook-timestamp':timestamp,'x-webhook-signature':createHmac('sha256',secret).update(timestamp).update(body).digest('base64')}};
 return {handler,request,read:()=>booking};
}
test('reconciled webhook confirms only after matching Cashfree API payment',async()=>{
 const {handler,request,read}=setup(async()=>({ok:true,json:async()=>({order_id:'order_12345',cf_payment_id:123456,payment_status:'SUCCESS',payment_amount:1500,payment_currency:'INR'})}));
 assert.equal((await handler(request)).status,200);assert.equal(read().state,'confirmed');
 assert.equal((await handler(request)).body.reason,'already_applied');
});
test('reconciled webhook refuses API mismatches and outages',async()=>{
 const mismatch=setup(async()=>({ok:true,json:async()=>({order_id:'order_12345',cf_payment_id:123456,payment_status:'PENDING',payment_amount:1500,payment_currency:'INR'})}));
 assert.equal((await mismatch.handler(mismatch.request)).status,409);assert.equal(mismatch.read().state,'ready_for_payment');
 const outage=setup(async()=>{throw Error('network down')});
 assert.equal((await outage.handler(outage.request)).status,503);assert.equal(outage.read().state,'ready_for_payment');
});
