/* Staged commerce readiness and revenue accounting. Pure functions; no payment, booking or supplier side effects.
 * A listing is NOT purchasable unless verified inputs, approvals and fulfillment checks all pass.
 * Money is integer INR paise. Commissions are contractual, never invented defaults. */
export const CHANNELS = Object.freeze(['qikink_pod','travel_package','subscription','property_booking','artwork','creator_referral']);
export const REQUIRED = Object.freeze({
  qikink_pod:['supplierSku','variant','approvedDesign','sampleApproved','landedCostPaise','retailPricePaise','shippingPolicy','returnPolicy','supplierLiveVerified'],
  travel_package:['partnerId','itinerary','departurePolicy','availabilityConfirmed','partnerRatePaise','customerPricePaise','cancellationPolicy','bookingMode'],
  subscription:['planId','term','entitlements','approvedPricePaise','refundPolicy','paymentRouteVerified'],
  property_booking:['partnerId','inventoryConfirmed','commissionAgreement','cancellationPolicy','settlementTerms','bookingMode'],
  artwork:['artistId','ownershipPermission','originalityConfirmed','inventoryConfirmed','commissionAgreement','shippingPolicy','returnPolicy'],
  creator_referral:['creatorId','consentRecorded','attributionRule','commissionAgreement','refundClawbackRule','settlementTerms']
});
const filled=v=>v!==null&&v!==undefined&&v!==''&&v!==false;
const integer=v=>Number.isSafeInteger(v)&&v>=0;
export function reviewListing(listing){
  if(!listing||!CHANNELS.includes(listing.channel))return {eligible:false,missing:['valid_channel'],state:'draft'};
  const missing=REQUIRED[listing.channel].filter(k=>!filled(listing[k]));
  if(!listing.ownerApproved)missing.push('ownerApproved');
  if(!listing.policyReviewed)missing.push('policyReviewed');
  if(!listing.customerSupportRoute)missing.push('customerSupportRoute');
  if(!listing.checkoutTestPassed)missing.push('checkoutTestPassed');
  if(listing.channel==='qikink_pod'){
    if(!integer(listing.landedCostPaise)||!integer(listing.retailPricePaise)||listing.retailPricePaise<=listing.landedCostPaise)missing.push('positive_margin');
  }
  if(listing.channel==='travel_package'){
    if(!integer(listing.partnerRatePaise)||!integer(listing.customerPricePaise)||listing.customerPricePaise<=listing.partnerRatePaise)missing.push('positive_margin');
  }
  return {eligible:missing.length===0,missing:[...new Set(missing)],state:missing.length?'pending_review':'ready_for_controlled_pilot'};
}
export function readinessReport(listings){
  const byChannel=Object.fromEntries(CHANNELS.map(c=>[c,{total:0,eligible:0,pending:0}]));
  const seen=new Set();const exceptions=[];
  for(const item of listings||[]){
    if(!item||!item.id||seen.has(item.id)){exceptions.push({id:item?.id||null,reason:'duplicate_or_missing_id'});continue;}
    seen.add(item.id);
    const r=reviewListing(item);
    if(!byChannel[item.channel]){exceptions.push({id:item.id,reason:'invalid_channel'});continue;}
    const bucket=byChannel[item.channel];bucket.total++;
    if(r.eligible)bucket.eligible++;else{bucket.pending++;exceptions.push({id:item.id,reason:r.missing.join(',')});}
  }
  return {byChannel,exceptions};
}
/* A settlement is only earned after verified completed/paid status, not from inquiries, screenshots or pending payment.
 * Contract: {type:'percent'|'fixed',basis:'net_ex_tax'|'gross',bps?,fixedPaise?,capPaise?}
 * Negative refunds are handled separately as explicit reversals, not silently as new earnings. */
export function earnedCommission({contract,order}){
  if(!contract||!order||order.verified!==true||order.refunded===true||order.status!=='completed')return {earned:false,amountPaise:0,reason:'not_verified_completed'};
  if(!['net_ex_tax','gross'].includes(contract.basis))return {earned:false,amountPaise:0,reason:'unapproved_basis'};
  const base=contract.basis==='net_ex_tax'?order.netExTaxPaise:order.grossPaise;
  if(!integer(base))return {earned:false,amountPaise:0,reason:'invalid_base'};
  let amount;
  if(contract.type==='percent'&&Number.isInteger(contract.bps)&&contract.bps>=0&&contract.bps<=10000)amount=Math.floor(base*contract.bps/10000);
  else if(contract.type==='fixed'&&integer(contract.fixedPaise))amount=contract.fixedPaise;
  else return {earned:false,amountPaise:0,reason:'unapproved_terms'};
  if(integer(contract.capPaise))amount=Math.min(amount,contract.capPaise);
  return {earned:true,amountPaise:amount,reason:'verified_completed'};
}
export function fulfillmentDecision({payment,order,listing}){
  if(!payment||payment.verified!==true||payment.status!=='paid')return {action:'hold',reason:'unverified_payment'};
  if(!order||payment.orderId!==order.id||payment.currency!=='INR'||payment.amountPaise!==order.totalPaise)return {action:'hold',reason:'payment_mismatch'};
  if(order.fulfillmentState==='submitted'||order.fulfillmentState==='submitting'||order.fulfillmentState==='needs_attention')return {action:'hold',reason:'already_submitted_or_uncertain'};
  const ready=reviewListing(listing);
  if(!ready.eligible)return {action:'hold',reason:'listing_not_ready',missing:ready.missing};
  if(order.refunded||order.cancelled)return {action:'hold',reason:'cancelled_or_refunded'};
  if(order.fulfillmentState!=='queued')return {action:'hold',reason:'not_queued'};
  return {action:'queue_for_idempotent_fulfillment',reason:'validated'};
}
