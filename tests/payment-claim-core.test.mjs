import test from 'node:test';
import assert from 'node:assert/strict';
import { claimPaymentInTransaction } from '../js/booking/payment-claim-core.mjs';
const base={eventId:'payment_123456',bookingId:'booking_1234',orderId:'order_12345',amountMinor:150000,currency:'INR'};
function fixture(){const docs=new Map();const db={collection:name=>({doc:id=>({key:name+'/'+id})})};const tx={get:async ref=>({exists:docs.has(ref.key),data:()=>docs.get(ref.key)}),create:(ref,data)=>{if(docs.has(ref.key))throw Error('duplicate');docs.set(ref.key,data)}};return {db,tx};}
test('payment claim is unique across different bookings',async()=>{
 const {db,tx}=fixture();
 assert.equal((await claimPaymentInTransaction(tx,db,base)).reason,'new_claim');
 assert.equal((await claimPaymentInTransaction(tx,db,base)).reason,'existing_claim');
 assert.equal((await claimPaymentInTransaction(tx,db,{...base,bookingId:'booking_9999'})).reason,'payment_already_claimed');
 assert.equal((await claimPaymentInTransaction(tx,db,{...base,amountMinor:100})).accepted,false);
});
