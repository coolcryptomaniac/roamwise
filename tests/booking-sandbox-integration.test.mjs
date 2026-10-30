import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,webcrypto} from 'node:crypto';
import {handleBookingCashfreeWebhook} from '../worker/handlers/booking-cashfree-webhook.js';
import {reconcileCashfreeWorkerPayment} from '../worker/lib/cashfree-booking-reconcile.js';
import {handleBookingCashfreeCheckout} from '../worker/handlers/booking-cashfree-checkout.js';
import {commitVerifiedBookingPayment} from '../worker/lib/booking-firestore-transaction.js';
import {bookingSandboxContext,bookingFields as fields} from '../worker/lib/booking-sandbox-context.js';
import {verifyCashfreeWorkerWebhook} from '../worker/lib/cashfree-booking-webhook-verify.js';
Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
const env={CASHFREE_ENV:'sandbox',BOOKING_WEBHOOK_ENABLED:'true',BOOKING_FIRESTORE_PROJECT:'roamwise-sandbox-test',
 CASHFREE_APP_ID:'test_app',CASHFREE_SECRET_KEY:'test_secret_not_a_real_credential',
 FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify({project_id:'roamwise-sandbox-test',client_email:'test@test.iam.gserviceaccount.com',private_key:'-----BEGIN PRIVATE KEY-----dummy'})};
const tokenProvider=async()=> 'fake_test_token',now=()=>1793404800000;
function harness(){
 const docs=new Map([['admins/test_uid',{fields:fields({role:'admin'})}],['roomBookings/booking_123',{
  updateTime:'2026-10-30T20:00:00Z',fields:fields({guestUid:'test_uid',guestPhone:'9999999999',status:'confirmed',amount:1,paymentMethod:'roamwise_cashfree_after_confirmation'})}]]);
 const calls=[],commits=[];
 const fetchImpl=async(url,options={})=>{
  calls.push({url,options});const body=options.body?JSON.parse(options.body):null;
  if(url==='https://sandbox.cashfree.com/pg/orders')return Response.json({...body,order_status:'ACTIVE',payment_session_id:'test_session'});
  if(url.endsWith(':beginTransaction'))return Response.json({transaction:'test_tx'});
  if(url.endsWith(':rollback'))return Response.json({});
  if(url.endsWith(':commit')){
   for(const w of body.writes){
    assert.match(w.update.name,/^projects\/roamwise-sandbox-test\/databases\/\(default\)\/documents\//);
    const path=w.update.name.split('/documents/')[1];
    if(w.currentDocument.exists===false&&docs.has(path))return Response.json({}, {status:409});
    if(w.currentDocument.updateTime&&w.currentDocument.updateTime!==docs.get(path)?.updateTime)return Response.json({}, {status:409});
   }
   commits.push(body);
   for(const w of body.writes){const path=w.update.name.split('/documents/')[1];docs.set(path,{updateTime:'version_'+commits.length,fields:{...(docs.get(path)?.fields||{}),...w.update.fields}});}
   return Response.json({});
  }
  const path=url.split('/documents/')[1]?.split('?')[0];
  return docs.has(path)?Response.json(docs.get(path)):Response.json({}, {status:404});
 };
 const request=()=>new Request('https://sandbox.example/booking/cashfree/order',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({bookingId:'booking_123',amount:999})});
 const checkout=()=>handleBookingCashfreeCheckout(request(),env,{fetchImpl,tokenProvider,verifyToken:async()=>({uid:'test_uid'}),now});
 const confirm=(extra={})=>commitVerifiedBookingPayment({env,orderId:'rws_booking_123',paymentId:'123456',amountMinor:100,currency:'INR',fetchImpl,tokenProvider,now,...extra});
 return {docs,calls,commits,checkout,confirm,fetchImpl};
}
test('checkout persists mapping/session/source atomically before provider; retries reuse UUID; confirmation updates original booking once',async()=>{
 const h=harness();assert.equal((await h.checkout()).status,200);
 assert.equal(h.commits.length,1);assert.equal(h.commits[0].writes.length,3);
 assert.equal((await h.checkout()).status,200);assert.equal(h.commits.length,1);
 const orders=h.calls.filter(c=>c.url==='https://sandbox.cashfree.com/pg/orders');
 assert.equal(JSON.parse(orders[0].options.body).order_amount,1);
 assert.equal(orders[0].options.headers['x-idempotency-key'],orders[1].options.headers['x-idempotency-key']);
 assert.match(orders[0].options.headers['x-idempotency-key'],/^[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
 assert.deepEqual(await h.confirm(),{confirmed:true,reason:'applied'});
 assert.equal(h.commits[1].writes.length,3);
 assert.equal(h.docs.get('roomBookings/booking_123').fields.paymentStatus.stringValue,'paid');
 assert.deepEqual(await h.confirm(),{confirmed:true,reason:'already_applied'});
 assert.equal(h.commits.length,2);
 assert.equal((await h.checkout()).status,409);
});
test('rejects production and mismatched projects before token acquisition',async()=>{
 for(const bad of [{CASHFREE_ENV:'live'},{BOOKING_FIRESTORE_PROJECT:'roamwisepro'},{BOOKING_FIRESTORE_PROJECT:'other-sandbox-project'}]){
  let called=false;
  await assert.rejects(bookingSandboxContext({...env,...bad},async()=>{called=true;}));
  assert.equal(called,false);
 }
});
test('cancelled, repriced, expired and mismatched payments cannot confirm',async()=>{
 for(const kind of ['cancel','price','expire','amount','other_payment']){
  const h=harness();await h.checkout();
  if(kind==='cancel')h.docs.get('roomBookings/booking_123').fields.status={stringValue:'cancelled'};
  if(kind==='price')h.docs.get('roomBookings/booking_123').fields.amount={integerValue:'2'};
  if(kind==='expire')h.docs.get('bookingSessions/booking_123').fields.paymentExpiresAt={stringValue:'2020-01-01T00:00:00Z'};
  if(kind==='other_payment'){await h.confirm();assert.equal((await h.confirm({paymentId:'999'})).confirmed,false);continue;}
  assert.equal((await h.confirm(kind==='amount'?{amountMinor:999}:{})).confirmed,false);
  assert.equal(h.commits.length,1);
 }
});
test('provider failure leaves retryable pending booking, never confirms',async()=>{
 const h=harness();
 const request=new Request('https://sandbox.example/booking/cashfree/order',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({bookingId:'booking_123'})});
 const response=await handleBookingCashfreeCheckout(request,env,{tokenProvider,verifyToken:async()=>({uid:'test_uid'}),now,
  fetchImpl:async(url,options)=>{if(url.includes('cashfree.com'))throw new Error('timeout');return h.fetchImpl(url,options);}});
 assert.equal(response.status,503);assert.equal(h.commits.length,1);
 assert.equal(h.docs.get('bookingSessions/booking_123').fields.state.stringValue,'ready_for_payment');
 assert.equal((await h.checkout()).status,200);
 assert.equal(h.commits.length,1);
});
test('raw signature accepts millisecond timestamp and rejects changed bytes / stale delivery',async()=>{
 const timestamp=String(now()),rawBody=new TextEncoder().encode('{"amount":1.00}'),secret=env.CASHFREE_SECRET_KEY;
 const signature=createHmac('sha256',secret).update(timestamp).update(rawBody).digest('base64');
 const headers=new Headers({'x-webhook-timestamp':timestamp,'x-webhook-signature':signature});
 assert.equal(await verifyCashfreeWorkerWebhook({rawBody,headers,secret,now}),true);
 assert.equal(await verifyCashfreeWorkerWebhook({rawBody:new TextEncoder().encode('{"amount":1}'),headers,secret,now}),false);
 assert.equal(await verifyCashfreeWorkerWebhook({rawBody,headers,secret,now:()=>now()+301000}),false);
});

test('signed Worker webhook independently reconciles provider and commits; tampered payload cannot confirm',async()=>{
 const h=harness();await h.checkout();
 const event={type:'PAYMENT_SUCCESS_WEBHOOK',data:{order:{order_id:'rws_booking_123',order_amount:1,order_currency:'INR'},
  payment:{cf_payment_id:'123456',payment_status:'SUCCESS',payment_amount:1,payment_currency:'INR'}}};
 const request=(event,bad=false)=>{
  const body=JSON.stringify(event),timestamp=String(Date.now());
  const signature=createHmac('sha256',env.CASHFREE_SECRET_KEY).update(timestamp).update(body).digest('base64');
  return new Request('https://sandbox.example/booking/cashfree/webhook',{method:'POST',body,
   headers:{'x-webhook-timestamp':timestamp,'x-webhook-signature':bad?'A'.repeat(43)+'=':signature}});
 };
 let lookups=0;
 const deps={reconcile:args=>reconcileCashfreeWorkerPayment({...args,fetchImpl:async url=>{
  assert.equal(url,'https://sandbox.cashfree.com/pg/orders/rws_booking_123/payments/123456');lookups++;
  return Response.json({order_id:'rws_booking_123',cf_payment_id:'123456',payment_status:'SUCCESS',payment_amount:1,payment_currency:'INR'});
 }}),commit:args=>h.confirm(args)};
 assert.equal((await handleBookingCashfreeWebhook(request(event,true),env,deps)).status,401);
 assert.equal(lookups,0);
 const mismatch=structuredClone(event);mismatch.data.payment.payment_amount=2;
 assert.equal((await handleBookingCashfreeWebhook(request(mismatch),env,deps)).status,409);
 assert.equal(h.commits.length,1);
 assert.equal((await handleBookingCashfreeWebhook(request(event),env,deps)).status,200);
 assert.equal((await handleBookingCashfreeWebhook(request(event),env,deps)).status,200);
 assert.equal(h.commits.length,2);
});
test('competing claims never overwrite confirmed payment; retry is idempotent after conflict',async()=>{
 const h=harness();await h.checkout();
 const results=await Promise.allSettled([h.confirm(),h.confirm()]);
 assert.equal(results.filter(r=>r.status==='fulfilled'&&r.value.reason==='applied').length,1);
 assert.equal(h.commits.length,2);
 assert.equal((await h.confirm()).reason,'already_applied');
});
