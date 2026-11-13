// Superseded 13 Nov 2026 by worker/lib/amor-rates.js, amor-pricing.js and amor-packages.js (live checkout).
// Amor Hospitality supplier schedules: internal modelling only, not customer checkout.
// Source: PDF rate sheets forwarded 6 Nov 2026. Tattwaa sheet expired 31 Mar 2026.
// Rates are not prices to publish, and booking must await live partner confirmation.
export const AMOR_SUPPLIER_RULES=Object.freeze({
 tattwaa:{validThrough:'2026-03-31',expired:true,deposit:'25–30% when 30+ days out; 50% by 15 days; 100% by 7 days',paymentAtArrival:false},
 nanau:{validThrough:'2027-03-31',deposit:'25–30% when 30+ days out; 50% by 15 days; 100% by 7 days',paymentAtArrival:false},
 padma:{validThrough:'2027-03-31',deposit:'50% at booking; remaining 50% seven days before arrival',paymentAtArrival:false,blackoutRateDates:'2026-12-18 to 2027-01-10'},
 aramness:{validThrough:'2027-02-28',deposit:'25% within 3 working days of confirmation; 75% due 30 days before arrival',paymentAtArrival:false,safariFullDeposit:true}
});
export const ROUTE_OPTIONS=Object.freeze([
 {id:'gir-manali-corbett',name:'The Great India Escape',nights:8,days:9,legs:[
  'Mumbai → Rajkot/Diu/Keshod via available air or rail service; private transfer to Gir',
  'Aramness Gir — 2 nights (all major meals on contracted AP plan)',
  'Gir → nearest viable airport → Delhi/Chandigarh via air or rail (connections and dates to be checked)',
  'Delhi/Chandigarh → Manali by road (daytime transfer or overnight transport)',
  'Padma Villa, Manali — 3 nights',
  'Manali → Delhi by road; Delhi → Ramnagar by train or road',
  'Tattwaa Corbett Spa & Resort — 2 nights; Nanau optional upgrade or split stay',
  'Ramnagar/Delhi → traveller’s home city'
 ],status:'quote_only',intercityTransportIncluded:false},
 {id:'corbett-two-resorts',name:'Corbett Forest Duo',nights:4,days:5,legs:[
  'Delhi/Kathgodam/Ramnagar → Corbett (quote transfer separately)',
  'Tattwaa — 2 nights, forest and group experiences',
  'Nanau — 2 nights, relaxation and wellness',
  'Ramnagar → return journey'
 ],status:'quote_only',intercityTransportIncluded:false},
 {id:'manali-private-villa',name:'Manali Private Villa Escape',nights:3,days:4,legs:[
  'Delhi/Chandigarh → Manali by confirmed commercial vehicle',
  'Padma Villa — 3 nights',
  'Return to Delhi/Chandigarh'
 ],status:'quote_only',intercityTransportIncluded:false}
]);
export function paymentMilestones({propertyId,guestTotal,partnerConfirmed,depositOverridePct}){
 const policy=AMOR_SUPPLIER_RULES[propertyId];if(!policy)throw Error('Unknown partner');
 if(!partnerConfirmed)return {collectAllowed:false,reason:'Supplier availability, deposit and final quote not confirmed'};
 if(!Number.isSafeInteger(guestTotal)||guestTotal<=0)throw Error('Invalid invoice total in paise');
 const pct=Number(depositOverridePct);
 if(!Number.isFinite(pct)||pct<=0||pct>100)throw Error('Founder-approved deposit percent required');
 const depositMinor=Math.ceil(guestTotal*pct/100);
 return {collectAllowed:false,reason:'This calculator is not a live payment endpoint: server-authorized session, Cashfree webhook, refund rules and supplier settlement must be accepted first',depositMinor,balanceMinor:guestTotal-depositMinor,depositPct:pct,supplierPolicy:policy.deposit};
}
