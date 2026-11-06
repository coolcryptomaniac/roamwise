// Server-only SKU definitions. Customer supplied amounts are not prices.
// Fixed SKUs are charged at server-authoritative INR paise; custom amounts
// require a signed, unexpired quote stored server side and linked to customer.
export const CHECKOUT_SKUS=Object.freeze({
 wedding_discovery:{kind:'service',amountMinor:300000,title:'Wedding venue discovery'},
 wedding_priority:{kind:'service',amountMinor:500000,title:'Wedding priority planning'},
 aipan_scarf:{kind:'physical',amountMinor:34900,title:'Aipan scarf',requiresShippingQuote:true},
 almora_hoodie:{kind:'physical',amountMinor:199900,title:'Almora After Dark hoodie',requiresShippingQuote:true},
 mandala_headband:{kind:'physical',amountMinor:19900,title:'Mandala headband',requiresShippingQuote:true}
});
export function resolveCheckout({sku,mode='full',quote=null,customerUid,now=Date.now()}){
 const p=CHECKOUT_SKUS[sku];
 if(p){
  if(mode!=='full')return {allowed:false,reason:'fixed_product_full_payment_only'};
  if(p.requiresShippingQuote)return {allowed:false,reason:'delivery_tax_and_stock_must_be_finalized'};
  return {allowed:true,amountMinor:p.amountMinor,sku,title:p.title,mode,source:'server_catalog'};
 }
 if(!quote||quote.id!==sku||quote.customerUid!==customerUid||
    quote.status!=='approved'||quote.customerAccepted!==true||
    Date.parse(quote.expiresAt)<=now||quote.currency!=='INR'||
    !Number.isSafeInteger(quote.totalMinor)||quote.totalMinor<100||
    !Number.isSafeInteger(quote.advanceMinor)||quote.advanceMinor<100||
    quote.advanceMinor>quote.totalMinor)return {allowed:false,reason:'approved_quote_required'};
 if(!['full','advance'].includes(mode))return {allowed:false,reason:'invalid_mode'};
 return {allowed:true,amountMinor:mode==='full'?quote.totalMinor:quote.advanceMinor,
  sku:quote.id,title:quote.title,mode,source:'approved_quote'};
}
