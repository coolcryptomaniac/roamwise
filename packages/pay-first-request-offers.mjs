// Fixed-price, pay-first travel REQUEST offers. Prices are published only if a
// founder-approved offer supplies explicit taxes, supplier buffer and refund funds.
// Payment buys an assisted reservation request, NOT confirmed inventory.
export const REQUEST_STATES=Object.freeze(['awaiting_payment','paid_request_pending_fulfillment','supplier_confirmed','unable_to_fulfill','refund_pending','refunded']);
export function priceTravelRequest({baseMinor,operationsMinor,convenienceMinor,taxMinor=0,refundableReserveMinor=0,depositPercent=100}){
 const v=[baseMinor,operationsMinor,convenienceMinor,taxMinor,refundableReserveMinor];
 if(v.some(x=>!Number.isSafeInteger(x)||x<0)||baseMinor===0||!Number.isSafeInteger(depositPercent)||depositPercent<1||depositPercent>100)throw Error('invalid pricing');
 const totalMinor=v.reduce((a,b)=>a+b,0);
 if(!Number.isSafeInteger(totalMinor))throw Error('overflow');
 const dueNowMinor=Math.ceil(totalMinor*depositPercent/100);
 return {totalMinor,dueNowMinor,balanceMinor:totalMinor-dueNowMinor,refundLiabilityMinor:dueNowMinor,bookingStatus:'request_pending_confirmation',amountSource:'server_authorized_offer'};
}
export function validatePublishedOffer(offer){
 return Boolean(offer && offer.founderApproved===true && offer.refundFundingApproved===true &&
 offer.merchantTravelCategoryApproved===true && offer.offerActive===true &&
 /^[a-zA-Z0-9_-]{8,80}$/.test(offer.id||'') &&
 /^[A-Z]{3}$/.test(offer.currency||'') && offer.currency==='INR' &&
 Number.isSafeInteger(offer.totalMinor)&&offer.totalMinor>=100 &&
 Number.isSafeInteger(offer.dueNowMinor)&&offer.dueNowMinor>=100&&
 offer.dueNowMinor<=offer.totalMinor&&Date.parse(offer.expiresAt)>Date.now()&&
 typeof offer.fulfillmentScope==='string'&&offer.fulfillmentScope.length>=20);
}
export function unresolvedPaidRequest({paymentVerified,orderCommitted}){
 if(paymentVerified!==true||orderCommitted!==true)return {paid:false,notify:false};
 return {paid:true,notify:true,bookingStatus:'paid_request_pending_fulfillment',supplierConfirmed:false,refundDeadlineBasis:'7 days after confirmed non-fulfillment'};
}
