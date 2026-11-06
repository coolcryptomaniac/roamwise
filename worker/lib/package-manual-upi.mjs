// Manual UPI is an alternative payment *instruction*, never evidence of payment.
// The configured VPA must be independently confirmed in the merchant bank app.
// No booking may be marked paid based on UTR, screenshot or a browser callback.
const VPA_PATTERN=/^[a-zA-Z0-9._-]{2,100}@[a-zA-Z][a-zA-Z0-9]{1,30}$/;
export function createManualUpiInstruction({env,booking,installment,now=Date.now()}){
 const fail=reason=>({available:false,reason});
 if(env.PACKAGE_DIRECT_UPI_ENABLED!=='true')return fail('manual_upi_disabled');
 const vpa=String(env.DIRECT_UPI_VPA||'').trim();
 if(!VPA_PATTERN.test(vpa)||vpa!=='roamwisepay@ybl')return fail('unverified_or_wrong_vpa');
 if(env.PACKAGE_UPI_MERCHANT_VERIFIED!=='true')return fail('bank_account_verification_required');
 if(!booking||booking.status!=='supplier_confirmed'||booking.supplierApproved!==true||
    booking.customerTermsAccepted!==true)return fail('not_confirmed');
 if(!installment||installment.status!=='unpaid'||installment.bookingId!==booking.id||
    !Number.isSafeInteger(installment.amountMinor)||installment.amountMinor<100)return fail('not_payable');
 if(!(Date.parse(booking.quoteExpiresAt)>now))return fail('quote_expired');
 if(!/^[a-zA-Z0-9_-]{8,45}$/.test(booking.id)||!Number.isSafeInteger(installment.ordinal))return fail('invalid_reference');
 const reference='RW'+booking.id.slice(0,12)+String(installment.ordinal).padStart(2,'0');
 const amount=(installment.amountMinor/100).toFixed(2);
 const params=new URLSearchParams({pa:vpa,pn:'RoamWise',am:amount,cu:'INR',tn:reference});
 return {available:true,uri:'upi://pay?'+params.toString(),reference,amountMinor:installment.amountMinor,
  instructions:'Payment pending. Keep bank receipt. RoamWise must verify the credit against its bank statement before confirming your payment.',paid:false,bookingConfirmed:false};
}
export function manualUpiClaimStatus(){return {status:'pending_bank_reconciliation',paid:false,bookingConfirmed:false};}
