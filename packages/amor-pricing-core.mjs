/** Amor pricing core, server-only: never commit confidential net rate tables. All amounts are paise. */
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const sum=x=>x.reduce((s,v)=>s+v,0);
const ceilBps=(n,b)=>Math.ceil(n*b/10000);
export function buildAmorQuote({roomCostsMinor=[],serviceCostsMinor=[],roomMarkupBps=700,packageTargetBps=2200,serviceMaxBps=6000,approvedSupplierConcessionMinor=0,passThroughDiscountMinor=0,eligibilityConfirmed=false,datedSupplierConfirmed=false,taxesValidated=false,invoiceAndRefundTermsAccepted=false,supplierDepositBps=2500}={}){
 if(![roomCostsMinor,serviceCostsMinor].every(a=>Array.isArray(a)&&a.every(integer)))throw Error('Costs must be integer paise');
 if(!roomCostsMinor.length)throw Error('A room component is required');
 if(!Number.isInteger(roomMarkupBps)||roomMarkupBps<0||roomMarkupBps>700)throw Error('Room markup must be at most 7%');
 if(!Number.isInteger(packageTargetBps)||packageTargetBps<2000||packageTargetBps>2500)throw Error('Package markup target must be 20–25%');
 if(!Number.isInteger(serviceMaxBps)||serviceMaxBps<0||serviceMaxBps>6000)throw Error('Service markup maximum exceeded');
 if(!integer(approvedSupplierConcessionMinor)||approvedSupplierConcessionMinor>50000||!integer(passThroughDiscountMinor)||passThroughDiscountMinor>approvedSupplierConcessionMinor)throw Error('Unverified concession or greater than Rs 500');
 if(!eligibilityConfirmed&&(approvedSupplierConcessionMinor||passThroughDiscountMinor))throw Error('Supplier concession not confirmed for dates');
 if(!Number.isInteger(supplierDepositBps)||supplierDepositBps<0||supplierDepositBps>10000)throw Error('Invalid supplier payment schedule');
 const fullRoomCostMinor=sum(roomCostsMinor);
 if(approvedSupplierConcessionMinor>fullRoomCostMinor)throw Error('Concession exceeds room cost');
 const roomCostMinor=fullRoomCostMinor-approvedSupplierConcessionMinor;
 const serviceCostMinor=sum(serviceCostsMinor);
 const supplierCostMinor=roomCostMinor+serviceCostMinor;
 const roomRetailMinor=roomCostMinor+ceilBps(roomCostMinor,roomMarkupBps);
 const packageTargetMinor=supplierCostMinor+ceilBps(supplierCostMinor,packageTargetBps);
 const serviceRetailMinor=Math.min(serviceCostMinor+ceilBps(serviceCostMinor,serviceMaxBps),Math.max(serviceCostMinor,packageTargetMinor-roomRetailMinor));
 const customerTotalMinor=Math.max(0,roomRetailMinor+serviceRetailMinor-passThroughDiscountMinor);
 const realisedMarkupBps=supplierCostMinor?Math.round((customerTotalMinor-supplierCostMinor)*10000/supplierCostMinor):0;
 const readyForPayment=datedSupplierConfirmed===true&&taxesValidated===true&&invoiceAndRefundTermsAccepted===true;
 const checkoutOptions=readyForPayment?(supplierDepositBps<=2500?['advance25','full']:['full']):[];
 return {supplierCostMinor,roomRetailMinor,serviceRetailMinor,customerTotalMinor,passedCustomerDiscountMinor:passThroughDiscountMinor,realisedMarkupBps,packageTargetAchieved:realisedMarkupBps>=packageTargetBps,checkoutOptions,readyForPayment,reviewReason:!readyForPayment?'supplier dates, taxes, invoice and refund signoff missing':realisedMarkupBps<packageTargetBps?'margin target not viable with costed services':'ready for locked quote approval'};
}
export function comparableOtaSaving({customerTotalMinor,otaTotalMinor,roomAndMealPlanSame=false,stayDatesSame=false,conditionsSame=false,taxesSame=true}={}){
 if(![customerTotalMinor,otaTotalMinor].every(integer)||!roomAndMealPlanSame||!stayDatesSame||!conditionsSame||!taxesSame)return null;
 return Math.max(0,otaTotalMinor-customerTotalMinor);
}
