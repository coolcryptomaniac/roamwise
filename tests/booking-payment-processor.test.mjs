import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingPaymentProcessor } from '../js/booking/booking-payment-processor.mjs';
const payload={bookingId:'booking_1234',amountMinor:150000,event:{orderId:'order_12345',status:'SUCCESS',currency:'INR',paymentId:'pay_123456'}};
function fixture(){
 let data={state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 const claims=new Map();const db={collection:name=>({doc:id=>({id,collection:name})}),runTransaction:async fn=>fn({get:async ref=>ref.collection==='bookingPaymentClaims'?{exists:claims.has(ref.id),data:()=>claims.get(ref.id)}:{exists:true,data:()=>({...data})},create:(ref,claim)=>{claims.set(ref.id,claim)},update:(_,patch)=>{data={...data,...patch}}})};
 return {db,read:()=>data};
}
test('verified event confirms booking transactionally, with safe replay',async()=>{
 const {db,read}=fixture();
 const processor=createBookingPaymentProcessor({db,verifySignature:async()=>true,loadBooking:async()=>read()});
 assert.equal((await processor(payload)).confirmed,true);
 assert.equal(read().state,'confirmed');
 // Subsequent webhook is rejected before transactional replay because booking is no longer payable.
 assert.equal((await processor(payload)).reason,'already_applied');
});
test('invalid signature cannot mutate booking',async()=>{
 const {db,read}=fixture();
 const processor=createBookingPaymentProcessor({db,verifySignature:async()=>false,loadBooking:async()=>read()});
 assert.equal((await processor(payload)).reason,'invalid_signature');
 assert.equal(read().state,'ready_for_payment');
});

test('verified replay cannot change confirmed payment identity',async()=>{
 const {db,read}=fixture();
 const processor=createBookingPaymentProcessor({db,verifySignature:async()=>true,loadBooking:async()=>read()});
 assert.equal((await processor(payload)).confirmed,true);
 const changed={...payload,event:{...payload.event,paymentId:'pay_different'}};
 assert.equal((await processor(changed)).confirmed,false);
 assert.equal(read().paymentEventId,'payment_pay_123456');
});
