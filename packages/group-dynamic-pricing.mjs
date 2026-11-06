// Dynamic indicative package budgeting in INR; does not represent confirmed inventory.
// Conservative ceilings must be explicitly accepted by RoamWise before becoming fixed offers.
const PRODUCTS=Object.freeze({
 almora_students:{name:'Almora Campus Explorer',segment:'student',min:6,max:40,baseNights:2,roomRate:1900,sharing:2,mealPerPersonDay:500,activitiesPerPersonDay:180,transportVehicleDay:4200,vehicleSeats:10,staffDay:2200,firstLastTransfer:3000,area:'Almora'},
 corbett_students:{name:'Corbett Campus Explorer',segment:'student',min:6,max:40,baseNights:2,roomRate:5500,sharing:2,mealPerPersonDay:650,activitiesPerPersonDay:180,transportVehicleDay:6500,vehicleSeats:10,staffDay:2800,firstLastTransfer:4500,area:'Corbett',expiredSupplierRate:true},
 tirthan_friends:{name:'Tirthan Forest Stay',segment:'family',min:2,max:12,baseNights:3,roomRate:5000,sharing:4,mealPerPersonDay:500,activitiesPerPersonDay:200,transportVehicleDay:4500,vehicleSeats:6,staffDay:1800,firstLastTransfer:4500,area:'Tirthan'},
 manali_villa:{name:'Manali Private Villa',segment:'premium',min:2,max:12,baseNights:3,roomRate:5500,sharing:2,mealPerPersonDay:750,activitiesPerPersonDay:300,transportVehicleDay:6000,vehicleSeats:6,staffDay:2000,firstLastTransfer:5500,area:'Manali'},
 gir_honeymoon:{name:'Gir Private Pool Honeymoon',segment:'luxury',min:2,max:4,baseNights:2,roomRate:72216,roomTaxIncluded:true,sharing:2,mealPerPersonDay:0,activitiesPerPersonDay:1000,transportVehicleDay:8500,vehicleSeats:4,staffDay:3000,firstLastTransfer:8000,area:'Gir'}
});
function rup(n){return Math.ceil(n/100)*100}
export function modelGroupPrice({id,people,nights=undefined,contingencyBps=1800,marginBps=2000}={}){
 const p=PRODUCTS[id];if(!p)throw Error('unknown_package');
 if(!Number.isInteger(people)||people<p.min||people>p.max)throw Error('group_out_of_range');
 const n=nights===undefined?p.baseNights:nights;
 if(!Number.isInteger(n)||n<2||n>7)throw Error('nights_out_of_range');
 if(!Number.isInteger(contingencyBps)||contingencyBps<1500||contingencyBps>5000)throw Error('reserve_too_small');
 if(!Number.isInteger(marginBps)||marginBps<1500||marginBps>4000)throw Error('margin_too_small');
 const rooms=Math.ceil(people/p.sharing),vehicles=Math.ceil(people/p.vehicleSeats),days=n+1;
 const roomsCost=rooms*n*p.roomRate;
 const meals=people*days*p.mealPerPersonDay;
 const activities=people*days*p.activitiesPerPersonDay;
 const transport=vehicles*days*p.transportVehicleDay+p.firstLastTransfer;
 const support=days*p.staffDay;
 const taxReserve=Math.ceil((p.roomTaxIncluded?meals+activities+transport+support:roomsCost+meals+activities+transport+support)*0.18);
 const subtotal=roomsCost+meals+activities+transport+support+taxReserve;
 const contingency=Math.ceil(subtotal*contingencyBps/10000);
 const cost=subtotal+contingency;
 const total=rup(Math.ceil(cost/(1-marginBps/10000)));
 const perPerson=Math.ceil(total/people);
 return {id,name:p.name,segment:p.segment,people,nights:n,days,rooms,vehicles,totalINR:total,perPersonINR:perPerson,
  taxReserveINR:taxReserve,contingencyINR:contingency,minimumTargetMarginBps:marginBps,
  minAdvanceINR:Math.min(10000,Math.max(3000,rup(total*.1))),indicative:true,
  supplierPriceConfirmed:false,transportConfirmed:false,expiresAt:null,
  disclaimer:'Illustrative only; availability, applicable taxes, inclusions and final payable total require acceptance before charging.'};
}
export function groupSavings({id,people,nights}){
 const quote=modelGroupPrice({id,people,nights});
 const baselinePeople=Math.max(2,Math.min(people,PRODUCTS[id].min));
 const baseline=modelGroupPrice({id,people:baselinePeople,nights});
 return {...quote,referenceGroupSize:baselinePeople,referencePerPersonINR:baseline.perPersonINR,
  savingsVsReferencePerPersonINR:Math.max(0,baseline.perPersonINR-quote.perPersonINR)};
}
export const dynamicPackageDefinitions=Object.fromEntries(Object.entries(PRODUCTS).map(([id,p])=>[id,{name:p.name,segment:p.segment,min:p.min,max:p.max,baseNights:p.baseNights,area:p.area}]));
