/* Deterministic RoamWise Trails quote policy. No browser-controlled fees. */
export const TREK_FEE_RATE=0.01;
export const TREK_FEE_CAP_INR=99;
export const TREK_OPERATOR_COMMISSION_PCT=0;

export function calculateTrekQuote({unitPrice,pricingUnit,travellers,capacity}){
  const rate=Number(unitPrice),count=Number(travellers),limit=Number(capacity);
  if(!Number.isSafeInteger(rate)||rate<100||rate>200000)throw new Error('invalid_rate');
  if(!Number.isSafeInteger(count)||count<1||count>12||
     !Number.isSafeInteger(limit)||limit<1||count>limit)throw new Error('invalid_seats');
  if(!['person','vehicle','group'].includes(pricingUnit))throw new Error('invalid_pricing_unit');
  const operatorTotal=rate*(pricingUnit==='person'?count:1);
  if(operatorTotal>500000)throw new Error('amount_too_large');
  const roamwiseServiceFee=Math.min(TREK_FEE_CAP_INR,Math.ceil(operatorTotal*TREK_FEE_RATE));
  return Object.freeze({unitPrice:rate,pricingUnit,travellers:count,operatorTotal,
    roamwiseServiceFee,total:operatorTotal+roamwiseServiceFee,currency:'INR',
    partnerCommission:TREK_OPERATOR_COMMISSION_PCT});
}
