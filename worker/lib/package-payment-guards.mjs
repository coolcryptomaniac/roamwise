// Production eligibility gate for staged package Cashfree installments.
// This module never creates a provider order by itself. Call only after
// server-side Firestore transaction has locked quote + installment snapshot.
export function authorizePackageInstallment({quote,installment,actorUid,now=Date.now(),env={}}){
 const deny=reason=>({authorized:false,reason});
 if(env.PACKAGE_CASHFREE_LIVE_ENABLED!=='true'||env.CASHFREE_ENV!=='production')return deny('live_checkout_disabled');
 if(!quote||!installment||!actorUid||quote.customerUid!==actorUid)return deny('not_owner');
 if(quote.status!=='supplier_confirmed'||quote.supplierConfirmationId==null||
    quote.supplierPaymentTermsApproved!==true||quote.termsAcceptedBy!==actorUid)return deny('supplier_or_terms_not_confirmed');
 if(!(Date.parse(quote.expiresAt)>now))return deny('quote_expired');
 if(quote.currency!=='INR'||!Number.isSafeInteger(quote.totalMinor)||quote.totalMinor<100)return deny('invalid_quote');
 if(!Number.isSafeInteger(installment.amountMinor)||installment.amountMinor<100||
    installment.status!=='unpaid'||installment.bookingId!==quote.bookingId)return deny('invalid_installment');
 if(!/^\d{1,3}$/.test(String(installment.ordinal))||
   !/^[a-zA-Z0-9_-]{8,80}$/.test(String(quote.bookingId)))return deny('invalid_ids');
 if(installment.amountMinor>quote.totalMinor)return deny('amount_exceeds_quote');
 const orderId='rwp_'+quote.bookingId+'_'+installment.ordinal;
 return {authorized:true,orderId,amountMinor:installment.amountMinor,currency:'INR',
  bookingId:quote.bookingId,installmentOrdinal:installment.ordinal,quoteRevision:quote.revision};
}
export function supplierPayoutEligibility({env={},booking,ledger,supplier}){
 const deny=reason=>({authorized:false,reason});
 if(env.PACKAGE_AUTO_PAYOUT_ENABLED!=='true')return deny('automatic_payout_disabled');
 if(!booking||booking.status!=='confirmed'||booking.disputed===true)return deny('booking_not_clear');
 if(!supplier||supplier.verifiedPayee!==true||supplier.settlementAgreementSigned!==true||
 supplier.accountApproval!==true)return deny('supplier_not_verified');
 if(!ledger||ledger.providerReconciled!==true||ledger.refundHold===true||
 !Number.isSafeInteger(ledger.availableMinor)||!Number.isSafeInteger(ledger.supplierDueMinor)||
 ledger.availableMinor<ledger.supplierDueMinor||ledger.supplierDueMinor<=0)return deny('funds_not_clear');
 return {authorized:true,maxPayoutMinor:ledger.supplierDueMinor,
  requiresProviderPayoutIdempotency:true,requiresServerSideSignedDisbursement:true};
}
