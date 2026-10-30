import test from 'node:test';
import assert from 'node:assert/strict';
import { createAtomicBookingPaymentCommit } from '../js/booking/atomic-payment-commit.mjs';
function mockDb(initial){let data={...initial};const db={collection:()=>({doc:id=>({id})}),runTransaction:async fn=>fn({get:async()=>({exists:true,data:()=>({...data})}),update:(_,change)=>{data={...data,...change}}})};return {db,read:()=>data};}
test('atomic commit confirms once and permits exact replay',async()=>{
 const {db,read}=mockDb({state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'});
 const commit=createAtomicBookingPaymentCommit(db);
 const args={bookingId:'booking_1234',eventId:'payment_123456',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 assert.equal((await commit(args)).reason,'applied');assert.equal(read().state,'confirmed');
 assert.equal((await commit(args)).reason,'already_applied');
 assert.equal((await commit({...args,eventId:'payment_999999'})).confirmed,false);
});
test('atomic commit rejects mismatched order',async()=>{
 const {db}=mockDb({state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR'});
 assert.equal((await createAtomicBookingPaymentCommit(db)({bookingId:'booking_1234',eventId:'payment_123456',orderId:'wrong',amountMinor:150000,currency:'INR'})).reason,'state_or_order_changed');
});

test('atomic commit rejects amount changes between verification and transaction',async()=>{
 const {db,read}=mockDb({state:'ready_for_payment',orderId:'order_12345',amountMinor:160000,currency:'INR'});
 const commit=createAtomicBookingPaymentCommit(db);
 const result=await commit({bookingId:'booking_1234',eventId:'payment_123456',orderId:'order_12345',amountMinor:150000,currency:'INR'});
 assert.equal(result.confirmed,false);assert.equal(read().state,'ready_for_payment');
});

test('replayed payment cannot claim a different amount or order',async()=>{
 const {db}=mockDb({state:'confirmed',orderId:'order_12345',amountMinor:150000,currency:'INR',paymentEventId:'payment_123456'});
 const commit=createAtomicBookingPaymentCommit(db);
 const base={bookingId:'booking_1234',eventId:'payment_123456',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 assert.equal((await commit(base)).reason,'already_applied');
 assert.equal((await commit({...base,amountMinor:100})).confirmed,false);
 assert.equal((await commit({...base,orderId:'order_changed'})).confirmed,false);
});
