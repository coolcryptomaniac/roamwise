// Safeguards for Cashfree PG capacity. Founder reports an account-level
// monthly processing ceiling of INR 4 lakh pending GSTIN. This ceiling is
// not independently provider-verified. Apply a conservative local cap until
// confirmed merchant limits and reliably reconciled monthly usage are available.
export function authorizeCollectionCapacity({amountMinor,monthPaidMinor,monthPendingMinor=0,env={}}){
 const deny=reason=>({authorized:false,reason});
 if(!Number.isSafeInteger(amountMinor)||amountMinor<100)return deny('invalid_amount');
 if(!Number.isSafeInteger(monthPaidMinor)||monthPaidMinor<0||
    !Number.isSafeInteger(monthPendingMinor)||monthPendingMinor<0)return deny('unverified_usage');
 const cap=Number(env.CASHFREE_MONTHLY_CAP_MINOR||40000000);
 if(!Number.isSafeInteger(cap)||cap<=0)return deny('invalid_limit');
 if(env.CASHFREE_MONTHLY_USAGE_VERIFIED!=='true')return deny('monthly_usage_not_reconciled');
 if(amountMinor>cap-monthPaidMinor-monthPendingMinor)return deny('monthly_limit_exceeded');
 return {authorized:true,remainingMinor:cap-monthPaidMinor-monthPendingMinor-amountMinor};
}
export function paymentRouteSelection({cashfreeCapacity,upiBankFeedAvailable,quoteConfirmed}){
 if(quoteConfirmed!==true)return {cashfree:false,directUpi:false,reason:'quote_not_confirmed'};
 return {cashfree:cashfreeCapacity?.authorized===true,
  directUpi:upiBankFeedAvailable===true,
  reason:'Direct bank UPI must be independently reconciled and assessed under applicable merchant, tax and regulatory limits; never describe it as unlimited.'};
}
