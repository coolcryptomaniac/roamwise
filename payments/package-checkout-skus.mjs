// Server-authorized package purchase SKUs for the existing RoamWise payment router.
// Do not use dynamic client totals or a generic catch-all product; each SKU
// must correspond to a published, priced and founder-approved fulfilment scope.
// Add these to PRODUCT_CATALOG_JSON only after validating seller-of-record,
// refunds, tax treatment and monthly merchant processing limits.
export const PROPOSED_CHECKOUT_SKUS=Object.freeze({
 wedding_discovery:{type:'service',currency:'INR',amountMinor:300000,description:'Venue shortlist and availability outreach, not a confirmed venue booking',refundableBeforeWork:true},
 wedding_priority:{type:'service',currency:'INR',amountMinor:500000,description:'Priority venue discovery and negotiation planning, not a confirmed wedding venue',refundableBeforeWork:true}
});
export function validatePaidOrderForFulfilment({productId,amountMinor,providerPaymentStatus,providerOrderAmountMinor,customerPhone,orderId}){
 const p=PROPOSED_CHECKOUT_SKUS[productId];
 return Boolean(p&&Number.isSafeInteger(amountMinor)&&amountMinor===p.amountMinor&&
   amountMinor===providerOrderAmountMinor&&providerPaymentStatus==='SUCCESS'&&
   /^\+?\d{10,15}$/.test(String(customerPhone||''))&&
   /^[a-zA-Z0-9_-]{8,100}$/.test(String(orderId||'')));
}
