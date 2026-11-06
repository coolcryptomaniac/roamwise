// Indicative RoamWise package costing, all values integer INR (not paise).
// Published estimates are NOT signed room inventory or guaranteed dates.
// Reserve covers uncertain transport/tax/season differences, not hidden charges.
const PLANS=Object.freeze({
 nanau_duo:{name:'Corbett Nanau Duo · 2 nights',supplierRooms:1,roomNights:2,roomRate:5500,mealExtra:1800,localTransfer:3500,activity:900,contingency:1800,serviceFee:700,taxReservePct:18,groupSize:2,rateValidTo:'2027-03-31',paymentStatus:'quote_required'},
 padma_duo:{name:'Manali Padma Duo · 2 nights',supplierRooms:1,roomNights:2,roomRate:5500,mealExtra:1800,localTransfer:4500,activity:500,contingency:1900,serviceFee:750,taxReservePct:18,groupSize:2,rateValidTo:'2027-03-31',paymentStatus:'quote_required'},
 woodbook_family:{name:'Tirthan Woodbook Cottage · 2 nights',supplierRooms:1,roomNights:2,roomRate:5000,mealExtra:2200,localTransfer:5500,activity:1000,contingency:2500,serviceFee:1100,taxReservePct:18,groupSize:4,rateValidTo:null,paymentStatus:'quote_required'},
 gir_luxury:{name:'Aramness Gir Private Pool · 2 nights',supplierRooms:1,roomNights:2,roomRate:72216,roomRateTaxIncluded:true,mealExtra:0,localTransfer:12000,activity:5000,contingency:11500,serviceFee:6500,taxReservePct:18,groupSize:2,rateValidTo:'2027-02-28',paymentStatus:'quote_required'}
});
export function indicativePrice(id){
 const p=PLANS[id];if(!p)throw Error('unknown_offer');
 const accommodation=p.supplierRooms*p.roomNights*p.roomRate;
 const extras=p.mealExtra+p.localTransfer+p.activity;
 const taxReserve=Math.ceil((p.roomRateTaxIncluded?extras:accommodation+extras)*p.taxReservePct/100);
 const cost=accommodation+extras+taxReserve+p.contingency+p.serviceFee;
 const markup=Math.ceil(cost*0.20);
 const total=Math.ceil((cost+markup)/100)*100;
 return {id,name:p.name,travellers:p.groupSize,totalIndicativeINR:total,indicativePerPersonINR:Math.ceil(total/p.groupSize),roomBasisINR:p.roomRate,taxReserveINR:taxReserve,contingencyINR:p.contingency,convenienceFeeINR:p.serviceFee,
  quotationOnly:true,finalPriceCannotBeRaisedWithoutExplicitCustomerConsent:true,availability:'unconfirmed',supplierTariffExpires:p.rateValidTo};
}
export function refundableRequestAdvance(estimatedTotalINR){
 if(!Number.isSafeInteger(estimatedTotalINR)||estimatedTotalINR<1000)throw Error('invalid_estimate');
 return Math.min(10000,Math.max(3000,Math.ceil(estimatedTotalINR*.10/500)*500));
}
export const indicativePackageIds=Object.keys(PLANS);
