import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createCashfreeBookingWebhook } from '../js/booking/cashfree-booking-webhook.mjs';
const signingSecret='server_only_test_secret_123456';
const timestamp='1793440000';
const payload={bookingId:'booking_1234',amountMinor:150000,event:{orderId:'order_12345',status:'SUCCESS',currency:'INR',paymentId:'pay_123456'}};
function fixture(){let record={state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 const db={collection:()=>({doc:id=>({id})}),runTransaction:async fn=>fn({get:async()=>({exists:true,data:()=>({...record})}),update:(_,patch)=>{record={...record,...patch}}})};
 const handler=createCashfreeBookingWebhook({db,signingSecret,now:()=>Number(timestamp)*1000,loadBooking:async()=>record});
 const rawBody=Buffer.from(JSON.stringify(payload));
 const signature=createHmac('sha256',signingSecret).update(timestamp).update(rawBody).digest('base64');
 return {handler,rawBody,headers:{'x-webhook-timestamp':timestamp,'x-webhook-signature':signature},read:()=>record};
}
test('signed raw request confirms and identical retry is idempotent',async()=>{
 const {handler,rawBody,headers,read}=fixture();
 assert.equal((await handler({rawBody,headers})).status,200);
 assert.equal(read().state,'confirmed');
 assert.equal((await handler({rawBody,headers})).body.reason,'already_applied');
});
test('tampering signature never confirms booking',async()=>{
 const {handler,rawBody,headers,read}=fixture();
 assert.equal((await handler({rawBody:Buffer.from(rawBody.toString()+' '),headers})).status,401);
 assert.equal(read().state,'ready_for_payment');
});
