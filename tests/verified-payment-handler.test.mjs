import test from 'node:test';
import assert from 'node:assert/strict';
import { handleVerifiedBookingPayment } from '../js/booking/verified-payment-handler.mjs';
const payload={bookingId:'booking_1234',amountMinor:150000,event:{orderId:'order_12345',status:'SUCCESS',currency:'INR',paymentId:'pay_123456'}};
const booking={state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'};
test('verified payment requires signature and payable persisted booking',async()=>{
 let writes=0;
 const deps={verifySignature:async()=>true,loadBooking:async()=>booking,applyConfirmedPayment:async()=>{writes++;return {confirmed:true}}};
 assert.equal((await handleVerifiedBookingPayment(payload,deps)).confirmed,true);
 assert.equal(writes,1);
 assert.equal((await handleVerifiedBookingPayment(payload,{...deps,verifySignature:async()=>false})).reason,'invalid_signature');
 assert.equal((await handleVerifiedBookingPayment(payload,{...deps,loadBooking:async()=>({...booking,state:'draft'})})).reason,'booking_not_payable');
 assert.equal((await handleVerifiedBookingPayment({...payload,amountMinor:100},deps)).reason,'amount_mismatch');
 assert.equal(writes,1);
});
