import {bookingSandboxContext,bookingFields as fields,bookingUnpack as unpack} from './booking-sandbox-context.js';
export async function commitVerifiedBookingPayment({env,orderId,paymentId,amountMinor,currency,fetchImpl=fetch,now=()=>Date.now(),tokenProvider}){
 if(!/^[A-Za-z0-9_-]{1,100}$/.test(orderId)||!/^[0-9]{1,30}$/.test(String(paymentId))||
    !Number.isSafeInteger(amountMinor)||amountMinor<=0||currency!=='INR')return {confirmed:false,reason:'invalid_event'};
 const {base,name,headers}=await bookingSandboxContext(env,tokenProvider);
 const call=async(url,options={})=>{const r=await fetchImpl(url,{...options,headers});if(!r.ok){if(r.status===404)return null;throw new Error('firestore_request_failed_'+r.status);}return r.json();};
 const started=await call(base+':beginTransaction',{method:'POST',body:JSON.stringify({options:{readWrite:{}}})});
 if(!started?.transaction)throw new Error('firestore_transaction_unavailable');
 const transaction=started.transaction;
 try {
 const read=async path=>call(base+'/'+path+'?transaction='+encodeURIComponent(transaction));
 // Mapping must be written by trusted order creation, not by webhook/customer.
 const mapping=await read('bookingOrderMappings/'+orderId);
 const trustedMapping=unpack(mapping);
 const bookingId=trustedMapping.bookingId;
 if(trustedMapping.orderId!==orderId || trustedMapping.amountMinor!==amountMinor || trustedMapping.currency!==currency)
  return {confirmed:false,reason:'order_mapping_mismatch'};
 if(!/^[A-Za-z0-9_-]{8,100}$/.test(String(bookingId||'')))return {confirmed:false,reason:'unknown_order'};
 const bookingDoc=await read('bookingSessions/'+bookingId);
 if(!bookingDoc)return {confirmed:false,reason:'missing_booking'};
 const roomDoc=await read('roomBookings/'+bookingId);
 const room=unpack(roomDoc);
 if(!roomDoc||room.cashfreeOrderId!==orderId||room.status!=='confirmed'||
    Math.round(Number(room.amount)*100)!==amountMinor) return {confirmed:false,reason:'source_booking_changed'};
 const booking=unpack(bookingDoc),eventId='payment_'+paymentId;
 const claimDoc=await read('bookingPaymentClaims/'+eventId);
 const claim=unpack(claimDoc);
 if(claimDoc){
  if(claim.bookingId!==bookingId||claim.orderId!==orderId||claim.amountMinor!==amountMinor||claim.currency!==currency)
   return {confirmed:false,reason:'payment_already_claimed'};
  if(booking.state==='confirmed'&&booking.paymentEventId===eventId&&booking.orderId===orderId&&
     booking.amountMinor===amountMinor&&booking.currency===currency&&room.paymentStatus==='paid')return {confirmed:true,reason:'already_applied'};
  return {confirmed:false,reason:'payment_already_claimed'};
 }
 if(booking.state!=='ready_for_payment'||booking.orderId!==orderId||
    booking.amountMinor!==amountMinor||booking.currency!==currency)
  return {confirmed:false,reason:'state_or_order_changed'};
 if(booking.paymentExpiresAt!=null){
  const expiry=Date.parse(booking.paymentExpiresAt);
  if(!Number.isFinite(expiry)||expiry<=now())return {confirmed:false,reason:'payment_window_expired'};
 }
 const at=new Date(now()).toISOString();
 if(room.paymentStatus!=='pending_payment')return {confirmed:false,reason:'source_payment_state_changed'};
 const writes=[
  {update:{name:name+'/roomBookings/'+bookingId,fields:fields({paymentStatus:'paid',paymentEventId:eventId,paidAt:at})},updateMask:{fieldPaths:['paymentStatus','paymentEventId','paidAt']},currentDocument:{updateTime:roomDoc.updateTime}},
  {update:{name:name+'/bookingPaymentClaims/'+eventId,fields:fields({bookingId,orderId,amountMinor,currency,claimedAt:at})},currentDocument:{exists:false}},
  {update:{name:name+'/bookingSessions/'+bookingId,fields:fields({state:'confirmed',paymentEventId:eventId,confirmedAt:at})},updateMask:{fieldPaths:['state','paymentEventId','confirmedAt']},currentDocument:{updateTime:bookingDoc.updateTime}}
 ];
 await call(base+':commit',{method:'POST',body:JSON.stringify({transaction,writes})});
 return {confirmed:true,reason:'applied'};
 } finally {
  await call(base+':rollback',{method:'POST',body:JSON.stringify({transaction})}).catch(()=>{});
 }
}
