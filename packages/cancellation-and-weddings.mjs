// Proposed RoamWise refund and cancellation policies; terms must be accepted
// before booking payment, and cannot override consumer law or supplier contract.
export const POLICY_VERSION='2026-11-06-proposal-1';
export const WEDDING_SERVICES=Object.freeze({
 discovery:{priceMinor:300000,deliverables:['Venue shortlist','Availability outreach','Written venue proposal'],venueReserved:false},
 priority:{priceMinor:500000,deliverables:['Venue shortlist','Availability outreach','Venue negotiation assistance','Written planning proposal'],venueReserved:false}
});
export function policyFor({tier,travelStart,paidAt,requestedAt,workStarted=false,supplierNonRefundableMinor=0,paidMinor,totalMinor,roamwiseFailed=false}){
 if(!['student','standard','luxury','wedding'].includes(tier)||
 !Number.isSafeInteger(paidMinor)||paidMinor<0||
 !Number.isSafeInteger(totalMinor)||totalMinor<paidMinor||
 !Number.isSafeInteger(supplierNonRefundableMinor)||supplierNonRefundableMinor<0)throw Error('invalid_booking_policy_input');
 const start=Date.parse(travelStart),paid=Date.parse(paidAt),requested=Date.parse(requestedAt);
 if([start,paid,requested].some(x=>!Number.isFinite(x))||requested<paid)throw Error('invalid_dates');
 if(roamwiseFailed)return {refundMinor:paidMinor,feeMinor:0,reason:'roamwise_unfulfilled_full_refund',initiateWithinCalendarDays:7};
 const hoursFromBooking=(requested-paid)/3600000,daysUntilTravel=(start-requested)/86400000;
 if(tier==='wedding'){
  const retained=workStarted?Math.min(paidMinor,totalMinor):0;
  return {refundMinor:paidMinor-retained,feeMinor:retained,reason:workStarted?'substantive_work_started':'planning_not_started'};
 }
 const supplierHold=Math.min(paidMinor,supplierNonRefundableMinor);
 if(hoursFromBooking<=24&&!workStarted&&supplierHold===0)return {refundMinor:paidMinor,feeMinor:0,reason:'cooling_off'};
 if(tier==='standard'&&daysUntilTravel>=15&&supplierHold===0)return {refundMinor:paidMinor,feeMinor:0,reason:'standard_early_cancel'};
 const penaltyPct=daysUntilTravel>=15?0:daysUntilTravel>=8?10:daysUntilTravel>=3?25:50;
 const internal=Math.ceil(totalMinor*penaltyPct/100);
 const fee=Math.min(paidMinor,Math.max(internal,supplierHold));
 return {refundMinor:paidMinor-fee,feeMinor:fee,reason:'disclosed_cancellation_schedule',supplierCommitmentMinor:supplierHold};
}
