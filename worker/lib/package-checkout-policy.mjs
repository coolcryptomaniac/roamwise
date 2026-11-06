// Travel checkout policy adapter. Server-only: resolves accepted policy snapshot
// and quote before any Cashfree payment order is created. Does not mark a booking
// paid or reserve supplier inventory.
import {policyFor,POLICY_VERSION,WEDDING_SERVICES} from '../../packages/cancellation-and-weddings.mjs';
import {validatePublishedOffer} from '../../packages/pay-first-request-offers.mjs';
export function prepareBookingCheckout({offer,customerUid,paymentMode,now=Date.now()}){
 if(!validatePublishedOffer(offer))return {allowed:false,reason:'offer_unapproved'};
 if(offer.customerUid!==customerUid||offer.policyAcceptedVersion!==POLICY_VERSION)return {allowed:false,reason:'terms_not_accepted'};
 if(!['advance','full'].includes(paymentMode))return {allowed:false,reason:'invalid_mode'};
 const amountMinor=paymentMode==='full'?offer.totalMinor:offer.dueNowMinor;
 if(!Number.isSafeInteger(amountMinor)||amountMinor<100)return {allowed:false,reason:'invalid_amount'};
 return {allowed:true,bookingStatus:'awaiting_payment',amountMinor,currency:'INR',policyVersion:POLICY_VERSION,
  termsSnapshot:offer.policySnapshot,merchantOrderNeeded:true,paymentCanConfirmStay:false,
  deadlineAt:new Date(Math.min(Date.parse(offer.expiresAt),now+30*60*1000)).toISOString()};
}
export function prepareWeddingPlanningOrder({offerId,customerUid,choice,termsAccepted,availabilityConfirmed=false}){
 const service=WEDDING_SERVICES[choice];
 if(!service||!termsAccepted||!customerUid||!/^[a-zA-Z0-9_-]{8,80}$/.test(offerId||''))return {allowed:false};
 return {allowed:true,amountMinor:service.priceMinor,serviceChoice:choice,
  status:'wedding_planning_requested',venueReserved:availabilityConfirmed&&false,
  deliverables:service.deliverables,refundPolicy:'Full refund if RoamWise cannot deliver the defined planning service; cancellation before substantive work begins is refundable.'};
}
export {policyFor};
