import test from 'node:test';
import assert from 'node:assert/strict';
import { createRawBookingWebhookHandler } from '../js/booking/raw-booking-webhook.mjs';
const data={bookingId:'booking_1234',amountMinor:150000,event:{orderId:'order_12345',status:'SUCCESS',currency:'INR',paymentId:'pay_123456'}};
function setup(){let record={state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'};let checked=0;
 const db={collection:()=>({doc:id=>({id})}),runTransaction:async fn=>fn({get:async()=>({exists:true,data:()=>record}),update:(_,patch)=>{record={...record,...patch}}})};
 const handler=createRawBookingWebhookHandler({db,verifyRawSignature:async ({rawBody})=>{checked++;return Buffer.isBuffer(rawBody);},loadBooking:async()=>record});
 return {handler,read:()=>record,checks:()=>checked};}
test('raw signed webhook confirms only after verifying original bytes',async()=>{
 const {handler,read,checks}=setup();
 const result=await handler({rawBody:Buffer.from(JSON.stringify(data))});
 assert.equal(result.status,200);assert.equal(read().state,'confirmed');assert.equal(checks(),1);
});
test('malformed JSON is checked for signature first',async()=>{
 const {handler,checks}=setup();
 assert.equal((await handler({rawBody:Buffer.from('{broken')})).status,400);
 assert.equal(checks(),1);
});
test('invalid raw body is rejected before verification',async()=>{
 const {handler,checks}=setup();
 assert.equal((await handler({rawBody:'{}'})).status,400);
 assert.equal(checks(),0);
});
