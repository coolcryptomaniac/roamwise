import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createCashfreeEventProcessor } from '../js/booking/cashfree-event-processor.mjs';
const secret='server_secret_for_testing_only';const timestamp='1793440000';
function fixture(){let record={id:'booking_1234',state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 const claims=new Map();const db={collection:name=>({doc:id=>({id,collection:name})}),runTransaction:async fn=>fn({get:async ref=>ref.collection==='bookingPaymentClaims'?{exists:claims.has(ref.id),data:()=>claims.get(ref.id)}:{exists:true,data:()=>({...record})},create:(ref,claim)=>{claims.set(ref.id,claim)},update:(_,patch)=>{record={...record,...patch}}})};
 const handler=createCashfreeEventProcessor({db,signingSecret:secret,now:()=>Number(timestamp)*1000,resolveBookingByOrderId:async id=>id===record.orderId?{...record}:null});
 const event={type:'PAYMENT_SUCCESS_WEBHOOK',data:{order:{order_id:'order_12345',order_amount:1500,order_currency:'INR'},payment:{cf_payment_id:123456,payment_status:'SUCCESS'}}};
 const request=(value=event)=>{const rawBody=Buffer.from(JSON.stringify(value));return {rawBody,headers:{'x-webhook-timestamp':timestamp,'x-webhook-signature':createHmac('sha256',secret).update(timestamp).update(rawBody).digest('base64')}}};
 return {handler,request,read:()=>record};
}
test('signed real Cashfree envelope maps and confirms booking',async()=>{
 const {handler,request,read}=fixture();
 assert.equal((await handler(request())).status,200);assert.equal(read().state,'confirmed');
 assert.equal((await handler(request())).body.reason,'already_applied');
});
test('signed unknown order cannot confirm booking',async()=>{
 const {handler,request,read}=fixture();
 const altered={type:'PAYMENT_SUCCESS_WEBHOOK',data:{order:{order_id:'other_order',order_amount:1500,order_currency:'INR'},payment:{cf_payment_id:123456,payment_status:'SUCCESS'}}};
 assert.equal((await handler(request(altered))).status,409);assert.equal(read().state,'ready_for_payment');
});

test('Cashfree signed payload tampering and unsigned callbacks cannot confirm',async()=>{
 const {handler,request,read}=fixture();
 const signed=request();
 const tampered={...signed,rawBody:Buffer.from(signed.rawBody.toString().replace('1500','1000'))};
 assert.equal((await handler(tampered)).status,401);
 assert.equal((await handler({rawBody:signed.rawBody,headers:{}})).status,401);
 assert.equal(read().state,'ready_for_payment');
});
test('Cashfree signed event rejects wrong amount, currency and failed status',async()=>{
 const {handler,request,read}=fixture();
 const original={type:'PAYMENT_SUCCESS_WEBHOOK',data:{order:{order_id:'order_12345',order_amount:1500,order_currency:'INR'},payment:{cf_payment_id:123456,payment_status:'SUCCESS'}}};
 const amount=structuredClone(original);amount.data.order.order_amount=1499;
 const currency=structuredClone(original);currency.data.order.order_currency='USD';
 const failed=structuredClone(original);failed.data.payment.payment_status='FAILED';
 for(const event of [amount,currency,failed]) assert.notEqual((await handler(request(event))).status,200);
 assert.equal(read().state,'ready_for_payment');
});
test('identical Cashfree webhook replay acknowledges success without changing payment',async()=>{
 const {handler,request,read}=fixture();
 const first=await handler(request());const second=await handler(request());
 assert.equal(first.status,200);assert.equal(second.status,200);
 assert.equal(second.body.reason,'already_applied');
 assert.equal(read().paymentEventId,'payment_123456');
});
