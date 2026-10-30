import {bookingSandboxContext,bookingFields as fields,bookingUnpack as unpack} from '../lib/booking-sandbox-context.js';
import {verifyFirebaseIdToken} from '../lib/firebase-verify.js';

// Isolated sandbox only. Client supplies an ID, never price, owner or payment state.
export async function handleBookingCashfreeCheckout(request,env,{fetchImpl=fetch,
  tokenProvider,verifyToken=verifyFirebaseIdToken,now=()=>Date.now()}={}) {
  if(request.method!=='POST')return Response.json({error:'method_not_allowed'},{status:405});
  try {
    const ctx=await bookingSandboxContext(env,tokenProvider);
    if(!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY)throw new Error('missing_sandbox_keys');
    const bearer=/^Bearer (.+)$/.exec(request.headers.get('authorization')||'');
    if(!bearer)return Response.json({error:'unauthorized'},{status:401});
    let claims;
    try {claims=await verifyToken(bearer[1],ctx.project);}catch{return Response.json({error:'unauthorized'},{status:401});}
    const body=await request.text();
    if(body.length>1024)return Response.json({error:'invalid_body'},{status:400});
    let input;
    try {input=JSON.parse(body);}catch{return Response.json({error:'invalid_json'},{status:400});}
    const id=input?.bookingId;
    if(!/^[A-Za-z0-9_-]{8,40}$/.test(id||''))return Response.json({error:'invalid_booking'},{status:400});
    const call=async(path,options={})=>{
      const r=await fetchImpl(ctx.base+path,{...options,headers:ctx.headers,redirect:'error'});
      if(r.status===404)return null;
      if(!r.ok)throw new Error('firestore_unavailable');
      return r.json();
    };
    const admin=await call('/admins/'+encodeURIComponent(claims.uid));
    if(!admin)return Response.json({error:'sandbox_admin_only'},{status:403});
    const started=await call(':beginTransaction',{method:'POST',body:JSON.stringify({options:{readWrite:{}}})});
    if(!started?.transaction)throw new Error('transaction_unavailable');
    const transaction=started.transaction,query='?transaction='+encodeURIComponent(transaction);
    const orderId='rws_'+id;
    let amountMinor,phone,expiry;
    try {
      const roomDoc=await call('/roomBookings/'+id+query),room=unpack(roomDoc);
      const sessionDoc=await call('/bookingSessions/'+id+query),session=unpack(sessionDoc);
      const mappingDoc=await call('/bookingOrderMappings/'+orderId+query),mapping=unpack(mappingDoc);
      amountMinor=Math.round(Number(room.amount)*100);
      phone=String(room.guestPhone||'').replace(/[^+\d]/g,'');
      if(!roomDoc||room.guestUid!==claims.uid)return Response.json({error:'forbidden'},{status:403});
      if(room.status!=='confirmed'||room.paymentMethod!=='roamwise_cashfree_after_confirmation'||
        !Number.isSafeInteger(amountMinor)||amountMinor<=0||amountMinor>100000||
        !/^\+?\d{10,15}$/.test(phone)||
        (room.cashfreeOrderId&&room.cashfreeOrderId!==orderId)||
        (room.paymentStatus&&!['pending_payment','unpaid'].includes(room.paymentStatus)))
        return Response.json({error:'booking_not_payable'},{status:409});
      if(sessionDoc||mappingDoc) {
        if(!sessionDoc||!mappingDoc||session.state!=='ready_for_payment'||session.orderId!==orderId||
          session.amountMinor!==amountMinor||session.currency!=='INR'||mapping.bookingId!==id||
          mapping.orderId!==orderId||mapping.amountMinor!==amountMinor||mapping.currency!=='INR'||
          room.cashfreeOrderId!==orderId||room.paymentStatus!=='pending_payment'||
          !(Date.parse(session.paymentExpiresAt)>now()))return Response.json({error:'checkout_state_changed'},{status:409});
        expiry=session.paymentExpiresAt;
      } else {
        expiry=new Date(now()+30*60*1000).toISOString();
        const writes=[
          {update:{name:ctx.name+'/bookingSessions/'+id,fields:fields({state:'ready_for_payment',orderId,amountMinor,currency:'INR',paymentExpiresAt:expiry})},currentDocument:{exists:false}},
          {update:{name:ctx.name+'/bookingOrderMappings/'+orderId,fields:fields({bookingId:id,orderId,amountMinor,currency:'INR'})},currentDocument:{exists:false}},
          {update:{name:ctx.name+'/roomBookings/'+id,fields:fields({cashfreeOrderId:orderId,paymentStatus:'pending_payment'})},updateMask:{fieldPaths:['cashfreeOrderId','paymentStatus']},currentDocument:{updateTime:roomDoc.updateTime}}
        ];
        await call(':commit',{method:'POST',body:JSON.stringify({transaction,writes})});
      }
    } finally {
      await call(':rollback',{method:'POST',body:JSON.stringify({transaction})}).catch(()=>{});
    }
    // Deterministic UUID: retries use the same provider key and immutable order terms.
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ctx.project+':'+orderId)));
    digest[6]=(digest[6]&15)|80;digest[8]=(digest[8]&63)|128;
    const hex=Array.from(digest.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
    const key=[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
    const origin=new URL(request.url).origin;
    const response=await fetchImpl('https://sandbox.cashfree.com/pg/orders',{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(5000),headers:{'content-type':'application/json',
        'x-client-id':env.CASHFREE_APP_ID,'x-client-secret':env.CASHFREE_SECRET_KEY,
        'x-api-version':'2025-01-01','x-idempotency-key':key},
      body:JSON.stringify({order_id:orderId,order_amount:amountMinor/100,order_currency:'INR',
        order_expiry_time:expiry,customer_details:{customer_id:claims.uid,customer_phone:phone},
        order_meta:{notify_url:origin+'/booking/cashfree/webhook'}})
    });
    const order=await response.json();
    if(!response.ok||order.order_id!==orderId||Number(order.order_amount)!==amountMinor/100||
      order.order_currency!=='INR'||order.order_status!=='ACTIVE'||typeof order.payment_session_id!=='string')
      throw new Error('sandbox_order_unavailable');
    return Response.json({order_id:orderId,payment_session_id:order.payment_session_id,environment:'sandbox'});
  } catch {return Response.json({error:'sandbox_checkout_unavailable'},{status:503});}
}
