import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {commitVerifiedBookingPayment} from '../worker/lib/booking-firestore-transaction.js';
// Requires a service-account OAuth integration to exercise live REST. This
// contract test verifies fail-closed input validation without network access.
test('Workers Firestore commit rejects malformed verified payments before OAuth',async()=>{
 const env={};
 const invalid=await commitVerifiedBookingPayment({env,orderId:'bad/order',paymentId:'123',amountMinor:100,currency:'INR'});
 assert.deepEqual(invalid,{confirmed:false,reason:'invalid_event'});
 const invalidAmount=await commitVerifiedBookingPayment({env,orderId:'order_123',paymentId:'123',amountMinor:0,currency:'INR'});
 assert.equal(invalidAmount.reason,'invalid_event');
 const invalidCurrency=await commitVerifiedBookingPayment({env,orderId:'order_123',paymentId:'123',amountMinor:100,currency:'USD'});
 assert.equal(invalidCurrency.reason,'invalid_event');
});
