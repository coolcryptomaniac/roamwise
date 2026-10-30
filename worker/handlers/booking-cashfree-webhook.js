import {verifyCashfreeWorkerWebhook} from '../lib/cashfree-booking-webhook-verify.js';
import {reconcileCashfreeWorkerPayment} from '../lib/cashfree-booking-reconcile.js';

// Fail-closed Cloudflare entrypoint. Booking confirmation requires a separate
// atomic Firestore REST transaction adapter, not a non-atomic PATCH.
export async function handleBookingCashfreeWebhook(request,env){
 if(request.method!=='POST')return Response.json({confirmed:false,reason:'method_not_allowed'},{status:405});
 if(env.CASHFREE_ENV!=='sandbox' || env.BOOKING_WEBHOOK_ENABLED!=='true')
  return Response.json({confirmed:false,reason:'sandbox_webhook_disabled'},{status:503});
 const secret=env.CASHFREE_WEBHOOK_SECRET;
 if(typeof secret!=='string'||secret.length<16)
  return Response.json({confirmed:false,reason:'webhook_not_configured'},{status:503});
 const size=Number(request.headers.get('content-length')||0);
 if(size>65536)return Response.json({confirmed:false,reason:'payload_too_large'},{status:413});
 let body;
 try{body=new Uint8Array(await request.arrayBuffer());}catch{return Response.json({confirmed:false,reason:'invalid_body'},{status:400});}
 if(body.length===0||body.length>65536)return Response.json({confirmed:false,reason:'invalid_body'},{status:400});
 try{
  if(!await verifyCashfreeWorkerWebhook({rawBody:body,headers:request.headers,secret}))
   return Response.json({confirmed:false,reason:'invalid_signature'},{status:401});
 }catch{return Response.json({confirmed:false,reason:'verification_unavailable'},{status:503});}
 let event;
 try{event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));}
 catch{return Response.json({confirmed:false,reason:'invalid_json'},{status:400});}
 const orderId=event?.data?.order?.order_id,paymentId=event?.data?.payment?.cf_payment_id;
 if(event?.type!=='PAYMENT_SUCCESS_WEBHOOK'||typeof orderId!=='string'||
   !/^[A-Za-z0-9_-]{1,100}$/.test(orderId)||!/^[0-9]{1,30}$/.test(String(paymentId||'')))
  return Response.json({confirmed:false,reason:'unsupported_event'},{status:400});
 let payment;
 try{payment=await reconcileCashfreeWorkerPayment({orderId,paymentId,env});}
 catch{return Response.json({confirmed:false,reason:'reconciliation_unavailable'},{status:503});}
 if(payment.status!=='SUCCESS'||payment.currency!=='INR')
  return Response.json({confirmed:false,reason:'payment_not_eligible'},{status:409});
 // Independent provider verification is necessary, but not sufficient.
 // Do not acknowledge success until an atomic Firestore claim is committed.
 return Response.json({confirmed:false,reason:'booking_commit_not_integrated'},{status:503});
}
