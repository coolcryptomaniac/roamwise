import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePaymentWebhook } from '../js/booking/payment-webhook-gate.mjs';
const base={signatureVerified:true,bookingId:'booking_1234',expectedOrderId:'order_12345',amountMinor:150000,expectedAmountMinor:150000,event:{orderId:'order_12345',status:'SUCCESS',currency:'INR',paymentId:'pay_123456'}};
test('webhook gate rejects unverified, mismatched and unpaid events',()=>{
 assert.equal(evaluatePaymentWebhook(base).accepted,true);
 assert.equal(evaluatePaymentWebhook({...base,signatureVerified:false}).accepted,false);
 assert.equal(evaluatePaymentWebhook({...base,amountMinor:120000}).reason,'amount_mismatch');
 assert.equal(evaluatePaymentWebhook({...base,event:{...base.event,status:'FAILED'}}).reason,'not_paid');
 assert.equal(evaluatePaymentWebhook({...base,event:{...base.event,orderId:'other'}}).reason,'order_mismatch');
});
