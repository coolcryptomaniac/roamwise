import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingPaymentProcessor } from '../js/booking/booking-payment-processor.mjs';
const payload={bookingId:'booking_1234',amountMinor:150000,event:{orderId:'order_12345',status:'SUCCESS',currency:'INR',paymentId:'pay_123456'}};
function fixture(){
 let data={state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 const db={collection:()=>({doc:id=>({id})}),runTransaction:async fn=>fn({get:async()=>({exists:true,data:()=>({...data})}),update:(_,patch)=>{data={...data,...patch}}})};
 return {db,read:()=>data};
}
test('verified event confirms booking transactionally, with safe replay',async()=>{
 const {db,read}=fixture();
 const processor=createBookingPaymentProcessor({db,verifySignature:async()=>true,loadBooking:async()=>read()});
 assert.equal((await processor(payload)).confirmed,true);
 assert.equal(read().state,'confirmed');
 // Subsequent webhook is rejected before transactional replay because booking is no longer payable.
 assert.equal((await processor(payload)).reason,'booking_not_payable');
});
test('invalid signature cannot mutate booking',async()=>{
 const {db,read}=fixture();
 const processor=createBookingPaymentProcessor({db,verifySignature:async()=>false,loadBooking:async()=>read()});
 assert.equal((await processor(payload)).reason,'invalid_signature');
 assert.equal(read().state,'ready_for_payment');
});
