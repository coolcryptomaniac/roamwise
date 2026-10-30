import test from 'node:test';
import assert from 'node:assert/strict';
import {createCashfreePaymentReconciler} from '../js/booking/cashfree-payment-reconciler.mjs';
const options={appId:'test_id',secretKey:'test_secret'};
test('Cashfree sandbox reconciliation uses server credentials and exact payment endpoint',async()=>{
 let called;
 const reconcile=createCashfreePaymentReconciler({...options,fetchImpl:async(url,init)=>{
  called={url,init};return {ok:true,json:async()=>({order_id:'order_12345',cf_payment_id:123456,payment_status:'SUCCESS',payment_amount:1500,payment_currency:'INR'})};
 }});
 const result=await reconcile({orderId:'order_12345',paymentId:'123456'});
 assert.deepEqual(result,{orderId:'order_12345',paymentId:'123456',status:'SUCCESS',amountMinor:150000,currency:'INR'});
 assert.equal(called.url,'https://sandbox.cashfree.com/pg/orders/order_12345/payments/123456');
 assert.equal(called.init.headers['x-client-secret'],'test_secret');
 assert.equal(called.init.redirect,'error');
});
test('Cashfree reconciliation fails closed on HTTP errors and invalid amounts',async()=>{
 const unavailable=createCashfreePaymentReconciler({...options,fetchImpl:async()=>({ok:false})});
 await assert.rejects(()=>unavailable({orderId:'order_12345',paymentId:'123456'}));
 const invalid=createCashfreePaymentReconciler({...options,fetchImpl:async()=>({ok:true,json:async()=>({payment_amount:1.001})})});
 await assert.rejects(()=>invalid({orderId:'order_12345',paymentId:'123456'}));
 await assert.rejects(()=>unavailable({orderId:'../bad',paymentId:'123456'}));
});

test('Cashfree lookup rejects empty or missing amounts and inconsistent identities',async()=>{
 const base={order_id:'order_12345',cf_payment_id:123456,payment_status:'SUCCESS',payment_amount:1500,payment_currency:'INR'};
 for(const change of [{payment_amount:null},{payment_amount:''},{payment_amount:' '},{order_id:'order_other'},{cf_payment_id:999999}]){
  const lookup=createCashfreePaymentReconciler({...options,fetchImpl:async()=>({ok:true,json:async()=>({...base,...change}})});
  await assert.rejects(()=>lookup({orderId:'order_12345',paymentId:'123456'}));
 }
});
