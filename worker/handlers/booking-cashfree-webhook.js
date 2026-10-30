import {verifyCashfreeWorkerWebhook} from '../lib/cashfree-booking-webhook-verify.js';

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
 // Do not acknowledge as processed: signed event alone is insufficient.
 // Must independently reconcile payment and atomically claim in Firestore.
 return Response.json({confirmed:false,reason:'booking_commit_not_integrated'},{status:503});
}
