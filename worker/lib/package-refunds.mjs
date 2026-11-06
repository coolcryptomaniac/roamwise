// Booking fee + refund policy helpers. Use only server-authored quote values.
// Never retain the convenience fee when RoamWise cannot deliver the paid package.
export function quotePaymentBreakdown({supplierMinor,otherCostsMinor=0,convenienceFeeMinor=0,taxMinor=0}){
 const values=[supplierMinor,otherCostsMinor,convenienceFeeMinor,taxMinor];
 if(values.some(n=>!Number.isSafeInteger(n)||n<0)||supplierMinor<=0)throw Error('invalid_amount');
 const totalMinor=values.reduce((a,b)=>a+b,0);
 if(!Number.isSafeInteger(totalMinor))throw Error('overflow');
 return {supplierMinor,otherCostsMinor,convenienceFeeMinor,taxMinor,totalMinor};
}
export function refundForUndeliverable({paidMinor,alreadyRefundedMinor=0,serviceDelivered=false,failureConfirmedAt,now=Date.now()}){
 if(!Number.isSafeInteger(paidMinor)||paidMinor<0||!Number.isSafeInteger(alreadyRefundedMinor)||
 alreadyRefundedMinor<0||alreadyRefundedMinor>paidMinor)throw Error('invalid_receipt');
 if(serviceDelivered||!Number.isFinite(Date.parse(failureConfirmedAt)))return {eligible:false,reason:'delivery_or_failure_unresolved'};
 const deadlineMs=Date.parse(failureConfirmedAt)+7*86400000;
 return {eligible:true,refundDueMinor:paidMinor-alreadyRefundedMinor,initiateBy:new Date(deadlineMs).toISOString(),
 overdue:now>deadlineMs,includesRelatedConvenienceFee:true,bankCreditTimeline:'Payment provider controls final credit timing'};
}
