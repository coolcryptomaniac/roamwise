import test from 'node:test';
import assert from 'node:assert/strict';
import { createAtomicBookingPaymentCommit } from '../js/booking/atomic-payment-commit.mjs';

// Firestore emulator integration: opt-in, requires a running emulator and
// firebase-admin installed in the backend environment. Never connects to prod.
const host=process.env.FIRESTORE_EMULATOR_HOST;
test('Firestore emulator serializes competing payment claims', {skip:!host}, async()=>{
 const {default:admin}=await import('./emulator/node_modules/firebase-admin/lib/index.js');
 const app=admin.initializeApp({projectId:'roamwise-booking-emulator-test'},'booking-claim-test-'+process.pid);
 try {
  const db=app.firestore();
  const suffix=Date.now().toString(36)+'_'+process.pid;
  const bookingA='booking_A_'+suffix, bookingB='booking_B_'+suffix;
  const eventId='payment_'+suffix;
  const orderA='order_A_'+suffix,orderB='order_B_'+suffix;
  const base={state:'ready_for_payment',amountMinor:150000,currency:'INR'};
  await Promise.all([db.collection('bookingSessions').doc(bookingA).set({...base,orderId:orderA}),db.collection('bookingSessions').doc(bookingB).set({...base,orderId:orderB})]);
  const commit=createAtomicBookingPaymentCommit(db);
  const [a,b]=await Promise.all([
   commit({bookingId:bookingA,eventId,orderId:orderA,amountMinor:150000,currency:'INR'}),
   commit({bookingId:bookingB,eventId,orderId:orderB,amountMinor:150000,currency:'INR'}),
  ]);
  assert.equal([a,b].filter(x=>x.confirmed).length,1);
  const [snapA,snapB,claim]=await Promise.all([db.collection('bookingSessions').doc(bookingA).get(),db.collection('bookingSessions').doc(bookingB).get(),db.collection('bookingPaymentClaims').doc(eventId).get()]);
  assert.equal(claim.exists,true);
  const winner=claim.data().bookingId;
  assert.equal([bookingA,bookingB].includes(winner),true);
  assert.equal(snapA.data().state,winner===bookingA?'confirmed':'ready_for_payment');
  assert.equal(snapB.data().state,winner===bookingB?'confirmed':'ready_for_payment');
 } finally {await app.delete();}
});
