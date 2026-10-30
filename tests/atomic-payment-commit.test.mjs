import test from 'node:test';
import assert from 'node:assert/strict';
import { createAtomicBookingPaymentCommit } from '../js/booking/atomic-payment-commit.mjs';
function mockDb(initial){let data={...initial};const claims=new Map();if(initial.state==='confirmed' && initial.paymentEventId) claims.set(initial.paymentEventId,{bookingId:'booking_1234',orderId:initial.orderId,amountMinor:initial.amountMinor,currency:initial.currency});const db={collection:name=>({doc:id=>({id,collection:name})}),runTransaction:async fn=>fn({get:async ref=>ref.collection==='bookingPaymentClaims'?{exists:claims.has(ref.id),data:()=>claims.get(ref.id)}:{exists:true,data:()=>({...data})},create:(ref,claim)=>{claims.set(ref.id,claim)},update:(_,change)=>{data={...data,...change}}})};return {db,read:()=>data};}
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

// Simulates Firestore optimistic concurrency: both contenders read the same
// unclaimed payment, but only one transaction may commit the claim document.
test('competing bookings cannot both claim the same payment ID',async()=>{
 const bookings=new Map([
  ['booking_A123',{state:'ready_for_payment',orderId:'order_A123',amountMinor:150000,currency:'INR'}],
  ['booking_B123',{state:'ready_for_payment',orderId:'order_B123',amountMinor:150000,currency:'INR'}],
 ]);
 const claims=new Map();
 let firstRead;const firstReadReached=new Promise(resolve=>{firstRead=resolve});
 let releaseFirst;const firstCanFinish=new Promise(resolve=>{releaseFirst=resolve});
 let transactions=0;
 const db={collection:name=>({doc:id=>({collection:name,id})}),runTransaction:async fn=>{
  const index=++transactions;
  const reads=[];const writes=[];
  const tx={get:async ref=>{
   const key=ref.collection+'/'+ref.id;
   const value=ref.collection==='bookingPaymentClaims'?claims.get(ref.id):bookings.get(ref.id);
   reads.push({key,exists:value!==undefined});
   if(index===1 && ref.collection==='bookingPaymentClaims'){firstRead();await firstCanFinish;}
   return {exists:value!==undefined,data:()=>value};
  },create:(ref,value)=>writes.push({type:'create',ref,value}),update:(ref,value)=>writes.push({type:'update',ref,value})};
  const result=await fn(tx);
  // Simulated optimistic conflict: a competing transaction already created a read doc.
  if(reads.some(r=>r.key.startsWith('bookingPaymentClaims/') && !r.exists && claims.has(r.key.split('/')[1])))
   return {confirmed:false,reason:'transaction_conflict'};
  for(const w of writes){if(w.type==='create')claims.set(w.ref.id,w.value);else bookings.set(w.ref.id,{...bookings.get(w.ref.id),...w.value});}
  return result;
 }};
 const commit=createAtomicBookingPaymentCommit(db);
 const args={eventId:'payment_shared123',amountMinor:150000,currency:'INR'};
 const first=commit({...args,bookingId:'booking_A123',orderId:'order_A123'});
 await firstReadReached;
 const second=await commit({...args,bookingId:'booking_B123',orderId:'order_B123'});
 releaseFirst();const firstResult=await first;
 assert.equal(second.confirmed,true);
 assert.equal(firstResult.confirmed,false);
 assert.equal(claims.size,1);
 assert.equal(bookings.get('booking_A123').state,'ready_for_payment');
 assert.equal(bookings.get('booking_B123').state,'confirmed');
});

test('payment claim cannot be reused by another booking even after first confirmation',async()=>{
 const bookings=new Map([
  ['booking_A123',{state:'ready_for_payment',orderId:'order_A123',amountMinor:150000,currency:'INR'}],
  ['booking_B123',{state:'ready_for_payment',orderId:'order_B123',amountMinor:150000,currency:'INR'}],
 ]);
 const claims=new Map();
 const db={collection:name=>({doc:id=>({name,id})}),runTransaction:async fn=>{
  const writes=[];
  const tx={get:async ref=>{const value=ref.name==='bookingPaymentClaims'?claims.get(ref.id):bookings.get(ref.id);return {exists:value!==undefined,data:()=>value}},
   create:(ref,data)=>writes.push(()=>{if(claims.has(ref.id))throw Error('duplicate claim');claims.set(ref.id,data)}),
   update:(ref,data)=>writes.push(()=>bookings.set(ref.id,{...bookings.get(ref.id),...data}))};
  const result=await fn(tx);for(const write of writes)write();return result;
 }};
 const commit=createAtomicBookingPaymentCommit(db);
 const payment={eventId:'payment_shared123',amountMinor:150000,currency:'INR'};
 assert.equal((await commit({...payment,bookingId:'booking_A123',orderId:'order_A123'})).reason,'applied');
 const rejected=await commit({...payment,bookingId:'booking_B123',orderId:'order_B123'});
 assert.equal(rejected.reason,'payment_already_claimed');
 assert.equal(bookings.get('booking_B123').state,'ready_for_payment');
 assert.equal(claims.size,1);
});

test('expired or invalid payment windows never create confirmed bookings',async()=>{
 const args={bookingId:'booking_1234',eventId:'payment_123456',orderId:'order_12345',amountMinor:150000,currency:'INR'};
 for(const paymentExpiresAt of ['2020-01-01T00:00:00.000Z','not-a-date']){
  const {db,read}=mockDb({state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR',paymentExpiresAt});
  assert.equal((await createAtomicBookingPaymentCommit(db)(args)).reason,'payment_window_expired');
  assert.equal(read().state,'ready_for_payment');
 }
 const {db,read}=mockDb({state:'ready_for_payment',orderId:'order_12345',amountMinor:150000,currency:'INR',paymentExpiresAt:'2099-01-01T00:00:00.000Z'});
 assert.equal((await createAtomicBookingPaymentCommit(db)(args)).reason,'applied');
 assert.equal(read().state,'confirmed');
});
