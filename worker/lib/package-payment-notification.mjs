// Post-confirmation dispatcher planning. Call ONLY after a verified, idempotent
// server payment claim is committed; this does not send email or move money.
const ALERTS=['founder@roamwise.co.in','support@roamwise.co.in'];
export function planPaymentEscalation({payment,booking,supportRoster=[]}){
 if(payment?.verification!=='provider_reconciled' || payment?.ledgerCommitted!==true)
   return {ready:false,reason:'unverified_or_uncommitted_payment'};
 if(!/^[a-zA-Z0-9_-]{8,80}$/.test(String(booking?.id||'')) ||
    payment.bookingId!==booking.id || !Number.isSafeInteger(payment.amountMinor) ||
    payment.amountMinor<=0 || payment.currency!=='INR')return {ready:false,reason:'invalid_booking_mapping'};
 // No permanent employee assumptions. Only verified, active and opted-in roster
 // members can be assigned; otherwise assign to the support queue.
 const agents=supportRoster.filter(a=>a?.active===true && a?.acceptsPackageBookings===true &&
  /^[a-zA-Z0-9_-]{4,80}$/.test(String(a.id||''))).sort((a,b)=>
    Number(a.openCases||0)-Number(b.openCases||0)||String(a.id).localeCompare(String(b.id)));
 const assignee=agents.length?agents[0].id:'support_queue';
 const key='package_payment_'+booking.id+'_'+String(payment.providerPaymentId||payment.bankTransactionId||'');
 if(!/^[a-zA-Z0-9_-]{14,180}$/.test(key))return {ready:false,reason:'invalid_event_id'};
 return {ready:true,dedupeKey:key,assignee,status:'needs_supplier_confirmation',
   recipients:ALERTS,notifyStaffAgent:assignee!=='support_queue',
   subject:'[RoamWise] Verified package payment — '+booking.id,
   // No payment card/PII, amount is for internal email only.
   body:'Booking '+booking.id+'; received INR '+(payment.amountMinor/100).toFixed(2)+
     '; assigned to '+assignee+'. Reconfirm supplier reservation, payment deadline and voucher status.',
   deliveryStatus:'queued_not_sent'};
}
