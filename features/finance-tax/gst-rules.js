/* RoamWise GST rules — ONE dated table and pure calculators.
 *
 * Every GST number used by RoamWise code should come from here so a single
 * yearly review (see tools/gst-review-check.js and COMPLIANCE-FIRST-BUSINESS-MODEL.md)
 * keeps the whole product current. Browser + Node compatible (UMD).
 *
 * This is NOT tax advice and does not decide anyone's liability. It records the
 * rates RoamWise believes are in force, where each came from, and how sure it
 * is. `confidence` is one of:
 *   primary     — stated in a Government of India / GST Council document
 *   secondary   — agreed by at least two professional tax publications
 *   conflicting — sources disagree; do not rely on it in a calculation
 * Anything not `primary` needs a CA to confirm at the yearly review.
 *
 * All money is whole rupees, rounded half up, so an invoice never drifts.
 */
(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RWGst=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

var PIB_FAQ='https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2163560';

var META={
  rulesVersion:'2026-10-07',
  reviewedOn:'2026-10-07',
  /* Who last checked the table. Set caSignedOn to an ISO date only after a
     qualified CA has confirmed every non-primary rule below. */
  reviewedBy:'Claude research pass (not a CA)',
  caSignedOn:null,
  reviewIntervalDays:365,
  warnBeforeDays:30
};

var RULES=[
  {id:'stay_exempt',label:'Hotel / homestay room under ₹1,000 a night',rateBps:0,itc:'n/a',effectiveFrom:'2017-07-01',confidence:'secondary',
   sources:['https://busy.in/gst-rates/hotel-industry/','https://taxheal.com/gst-accommodation-services.html'],
   note:'Exempt where the per-unit per-day tariff is below ₹1,000.'},
  {id:'stay_standard',label:'Hotel / homestay room ₹1,000 to ₹7,500 a night',rateBps:500,itc:'none',effectiveFrom:'2025-09-22',confidence:'primary',
   sources:[PIB_FAQ],
   note:'5% with no input tax credit for the supplier, up to ₹7,500 per unit per day. Boundary: "up to ₹7,500" is 5%; one secondary source writes "7,500 and above" as 18%. Confirm at the review.'},
  {id:'stay_premium',label:'Hotel / boutique / five-star room above ₹7,500 a night',rateBps:1800,itc:'full',effectiveFrom:'2025-09-22',confidence:'secondary',
   sources:['https://thetaxcorp.in/article/gst-on-hotel-and-guest-house-accommodation-complete-legal-evolution-and-current','https://hnallp.com/assets/articles/d8cae-gst2.0_faqs_hospitlaityindustry_ss_rm_21.09.2025_final-1.pdf'],
   note:'18% with input tax credit. Star rating does not matter, only the per-unit per-day value.'},
  {id:'stay_slab_basis',label:'What the slab is measured on',rateBps:null,itc:'n/a',effectiveFrom:'2025-09-22',confidence:'conflicting',
   sources:['https://busy.in/gst-rates/hotel-industry/','https://hnallp.com/assets/articles/d8cae-gst2.0_faqs_hospitlaityindustry_ss_rm_21.09.2025_final-1.pdf'],
   note:'Older wording is "declared tariff"; the 2025 FAQ language is "value of supply per unit per day". RoamWise uses the nightly price actually charged per room. Confirm at the review.'},
  {id:'registration_threshold',label:'Registration threshold for services',rateBps:null,thresholdINR:2000000,itc:'n/a',effectiveFrom:'2017-07-01',confidence:'secondary',
   sources:['https://busy.in/gst-rates/tours-travels/'],
   note:'₹20 lakh aggregate turnover for services; some special-category states use ₹10 lakh. A small supplier below the threshold normally charges no GST, except where section 9(5) makes an e-commerce operator liable.'},
  {id:'eco_9_5_accommodation',label:'Accommodation sold through an e-commerce operator by an unregistered supplier',rateBps:null,itc:'n/a',effectiveFrom:'2022-01-01',confidence:'secondary',
   sources:['https://www.taxtmi.com/article/detailed?id=15913','https://cleartax.in/s/gst-on-notified-services-ecommerce-operators-95'],
   note:'Under section 9(5) the operator pays the GST as if it were the supplier, and must register whatever its turnover. Whether a platform that only forwards a WhatsApp enquiry counts as "supplying through" it is NOT settled; keep the AI-CA gate and get a CA opinion before enabling instant booking or collecting guest money.'},
  {id:'platform_fee',label:'RoamWise own fee: commission, listing, plan, advertising, creator match fee',rateBps:1800,itc:'full',effectiveFrom:'2017-07-01',confidence:'secondary',
   sources:['https://www.taxaj.com/learn/?p=496','https://cleartax.in/s/gst-on-tours-travels'],
   note:'Intermediary and marketing services are at the standard 18%. Charge it only once RoamWise holds a GST registration.'},
  {id:'agent_commission',label:'Travel agent commission or service fee (air, hotel, rail booking)',rateBps:1800,itc:'full',effectiveFrom:'2017-07-01',confidence:'secondary',
   sources:['https://www.taxaj.com/learn/?p=496','https://cleartax.in/s/gst-on-tours-travels'],
   note:'18% on the agent’s own commission or fee, never on the ticket or room price.'},
  {id:'tour_package_5',label:'Tour operator package, no input credit option',rateBps:500,itc:'none',effectiveFrom:'2017-07-01',confidence:'secondary',
   sources:['https://cleartax.in/s/gst-on-tours-travels','https://www.taxaj.com/learn/?p=496'],
   note:'5% on the gross package; the invoice must say the amount includes accommodation and transport.'},
  {id:'tour_package_18',label:'Tour operator package, input credit option',rateBps:1800,itc:'full',effectiveFrom:'2017-07-01',confidence:'secondary',
   sources:['https://cleartax.in/s/gst-on-tours-travels','https://www.taxaj.com/learn/?p=496'],
   note:'18% with full credit, mainly for corporate and group sales.'},
  {id:'cab_5',label:'Passenger transport by taxi or cab with driver, no input credit option',rateBps:500,itc:'none',effectiveFrom:'2025-09-22',confidence:'primary',
   sources:[PIB_FAQ],
   note:'The Council FAQ gives passenger transport a choice of 5% without credit or 18% with credit, at the provider’s option.'},
  {id:'cab_18',label:'Passenger transport by taxi or cab with driver, input credit option',rateBps:1800,itc:'full',effectiveFrom:'2025-09-22',confidence:'primary',
   sources:[PIB_FAQ],
   note:'Same FAQ. Where a cab is booked through an app operator, section 9(5) can put the tax on the operator.'},
  {id:'air_economy',label:'Air travel, economy class',rateBps:500,itc:'full',effectiveFrom:'2025-09-22',confidence:'primary',
   sources:[PIB_FAQ],note:'Economy 5%, other classes 18% (no option).'},
  {id:'air_other',label:'Air travel, premium classes',rateBps:1800,itc:'full',effectiveFrom:'2025-09-22',confidence:'primary',
   sources:[PIB_FAQ],note:'See air_economy.'},
  {id:'restaurant_standalone',label:'Standalone restaurant',rateBps:500,itc:'none',effectiveFrom:'2017-11-15',confidence:'secondary',
   sources:['https://www.taxtmi.com/article/detailed?id=15059','https://busy.in/gst-rates/hotel-industry/'],
   note:'5% without credit. Not used in any RoamWise calculation; listed for the review only.'},
  {id:'restaurant_in_hotel',label:'Restaurant inside a hotel (specified premises)',rateBps:null,itc:'n/a',effectiveFrom:'2025-09-22',confidence:'conflicting',
   sources:['https://busy.in/gst-rates/hotel-industry/','https://hnallp.com/assets/articles/d8cae-gst2.0_faqs_hospitlaityindustry_ss_rm_21.09.2025_final-1.pdf'],
   note:'One source says 5% without credit; another says 18% with credit in specified premises. Never calculated by RoamWise; the property bills its own food.'},
  {id:'tcs_section_52',label:'GST TCS by an e-commerce operator that collects the payment',rateBps:50,itc:'n/a',effectiveFrom:'2024-07-10',confidence:'secondary',
   sources:['https://www.taxaj.com/learn/gst-on-e-commerce-operators-tcs-under-section-52-step-by-step-guide/'],
   note:'0.5% total (0.25% + 0.25%, or 0.5% IGST). Applies only when the operator itself collects the consideration. Not used while guests pay the property directly.'},
  {id:'tds_194o',label:'Income-tax TDS by an e-commerce operator, section 194-O',rateBps:10,itc:'n/a',effectiveFrom:'2024-10-01',confidence:'secondary',
   sources:['https://cleartax.in/s/section-194o','https://www.incometaxindia.gov.in/w/section-194-o-5'],
   note:'0.1% of gross. Can apply even where the buyer pays the participant directly (the payment is deemed credited), so a CA must confirm whether a lead-only platform is within it. Not netted in any RoamWise calculation.'}
];

function byId(id){for(var i=0;i<RULES.length;i++)if(RULES[i].id===id)return RULES[i];return null;}
function rupees(x){var n=Number(x);return Number.isFinite(n)?Math.round(n):0;}
function money(x){var n=rupees(x);return n>0?n:0;}

/* Tax on an amount. inclusive=true treats `amount` as already containing tax. */
function split(amount,rateBps,inclusive){
  var a=money(amount),r=Number(rateBps);
  if(!Number.isFinite(r)||r<0)r=0;
  var tax=inclusive?Math.round(a*r/(10000+r)):Math.round(a*r/10000);
  var base=inclusive?a-tax:a;
  return {base:base,tax:tax,total:base+tax,rateBps:r};
}

/* Which accommodation rule applies to one room for one night. */
function stayRuleFor(nightlyValue){
  var v=money(nightlyValue);
  if(v<1000)return byId('stay_exempt');
  if(v<=7500)return byId('stay_standard');
  return byId('stay_premium');
}

/* GST on a stay. Slab is per room per night, so a 3-night, 2-room stay at
   ₹6,000 is judged on ₹6,000, never on ₹36,000.
   opts: registered  — the property is GST-registered (or above the threshold)
         viaEco      — sold through an e-commerce operator that section 9(5) covers
   payableBy: 'supplier' | 'eco' | 'none' */
function stay(opts){
  opts=opts||{};
  var nightly=money(opts.nightlyValue),nights=Math.max(1,Math.round(Number(opts.nights)||1)),rooms=Math.max(1,Math.round(Number(opts.rooms)||1));
  var base=nightly*nights*rooms,rule=stayRuleFor(nightly);
  var out={ruleId:rule.id,base:base,rateBps:0,tax:0,total:base,payableBy:'none',itc:rule.itc,confidence:rule.confidence,reason:''};
  if(rule.id==='stay_exempt'){out.reason='Rooms under ₹1,000 a night are exempt.';return out;}
  if(opts.registered===true){out.payableBy='supplier';}
  else if(opts.viaEco===true){out.payableBy='eco';out.reason='Unregistered supplier sold through an e-commerce operator: section 9(5) puts the tax on the operator. Confirm applicability with a CA.';}
  else{out.reason='No GST is charged by a property that is below the registration threshold and not sold through an operator liable under section 9(5).';return out;}
  out.rateBps=rule.rateBps;out.tax=Math.round(base*rule.rateBps/10000);out.total=base+out.tax;
  return out;
}

var SERVICE_RULE={
  platform_fee:'platform_fee',agent_commission:'agent_commission',
  tour_package:{without_itc:'tour_package_5',with_itc:'tour_package_18'},
  cab:{without_itc:'cab_5',with_itc:'cab_18'},
  air_economy:'air_economy',air_other:'air_other'
};

/* GST on a service. category: platform_fee | agent_commission | tour_package | cab | air_economy | air_other
   opts: option ('without_itc' default | 'with_itc') for tour_package and cab; inclusive; registered
   platform_fee, agent_commission and tour_package require registered===true to charge anything. */
function service(category,amount,opts){
  opts=opts||{};
  var spec=SERVICE_RULE[category];
  if(!spec)return {ok:false,error:'unknown category',base:money(amount),tax:0,total:money(amount),rateBps:0};
  var id=typeof spec==='string'?spec:spec[opts.option==='with_itc'?'with_itc':'without_itc'];
  var rule=byId(id);
  var needsReg=category==='platform_fee'||category==='agent_commission'||category==='tour_package';
  if(needsReg&&opts.registered!==true){
    var a=money(amount);
    return {ok:true,ruleId:rule.id,base:a,tax:0,total:a,rateBps:0,itc:rule.itc,confidence:rule.confidence,charged:false,reason:'GST is charged only once the business is GST-registered.'};
  }
  var s=split(amount,rule.rateBps,opts.inclusive===true);
  return {ok:true,ruleId:rule.id,base:s.base,tax:s.tax,total:s.total,rateBps:s.rateBps,itc:rule.itc,confidence:rule.confidence,charged:true,reason:''};
}

/* ---- yearly review ---- */
function toDay(v){var d=new Date(v);return Number.isFinite(d.getTime())?d:null;}
function addDays(d,n){var x=new Date(d.getTime());x.setUTCDate(x.getUTCDate()+n);return x;}
function dueDate(){var d=toDay(META.reviewedOn);return d?addDays(d,META.reviewIntervalDays):null;}

/* state: ok | due_soon | overdue.  caSigned: whether a CA has signed this version. */
function reviewStatus(now){
  var today=toDay(now||new Date()),due=dueDate();
  if(!today||!due)return {state:'overdue',daysLeft:null,dueOn:null,caSigned:false,reviewedOn:META.reviewedOn,rulesVersion:META.rulesVersion,unverified:[]};
  var daysLeft=Math.floor((due.getTime()-today.getTime())/86400000);
  var state=daysLeft<0?'overdue':daysLeft<=META.warnBeforeDays?'due_soon':'ok';
  return {state:state,daysLeft:daysLeft,dueOn:due.toISOString().slice(0,10),caSigned:!!META.caSignedOn,reviewedOn:META.reviewedOn,rulesVersion:META.rulesVersion,
    unverified:RULES.filter(function(r){return r.confidence!=='primary';}).map(function(r){return r.id;})};
}

return {META:META,RULES:RULES,rule:byId,split:split,stayRuleFor:stayRuleFor,stay:stay,service:service,reviewStatus:reviewStatus,rupees:rupees};
});
