/* @ts-nocheck
   All-in stay price guard.
   This module does not scrape OTAs. It evaluates normalized live offers supplied
   by a server/admin connector so RoamWise can stay competitive without price wars. */
(function(){
'use strict';
function n(v){v=Number(v);return Number.isFinite(v)?v:0;}
function pct(a,b){return b>0?(a/b*100):0;}
window.rwAssessAllInStayPrice=function(input){
  input=input||{};
  var policy=window.RW_TAX_AND_PRICE_POLICY||{};
  var rw=input.roamwise||{};
  var competitors=(input.competitors||[]).filter(function(x){return x&&x.likeForLike!==false&&n(x.total)>0;});
  var finalTotal=n(rw.base)+n(rw.propertyMandatoryFees)+n(rw.statTaxes)+n(rw.platformFee)+n(rw.paymentFee);
  var best=competitors.sort(function(a,b){return n(a.total)-n(b.total);})[0]||null;
  var bestTotal=best?n(best.total):0;
  var saving=bestTotal>0?bestTotal-finalTotal:0;
  var savingPct=bestTotal>0?pct(saving,bestTotal):0;
  var revenue=n(rw.platformRevenue);
  var variableCost=n(rw.paymentCost)+n(rw.supportReserve)+n(rw.refundReserve);
  var contribution=revenue-variableCost;
  var cbv=Math.max(0,n(rw.commissionableBookingValue));
  var minMargin=Math.max(n(policy.minimumContributionMarginInr||150),cbv*n(policy.minimumContributionMarginPct||3)/100);
  var competitive=!best||finalTotal<=bestTotal;
  var targetMet=!best||savingPct>=n(policy.allInSavingTargetPct||2);
  var marginOk=contribution>=minMargin;
  var action='approve';
  if(!marginOk) action='improve-supplier-economics';
  else if(best&&!competitive) action='review-price-or-value-add';
  else if(best&&!targetMet) action='competitive-but-not-target';
  return {
    currency:input.currency||'INR',
    finalTotal:+finalTotal.toFixed(2),
    bestComparator:best?{name:best.name||'Comparator',total:+bestTotal.toFixed(2)}:null,
    saving:+saving.toFixed(2),
    savingPct:+savingPct.toFixed(2),
    contribution:+contribution.toFixed(2),
    minimumContribution:+minMargin.toFixed(2),
    marginOk:marginOk,
    competitive:competitive,
    targetMet:targetMet,
    action:action,
    warning:(!marginOk?'Do not price-war below the contribution floor. ': '')+(best&&!competitive?'RoamWise is currently above the best like-for-like final payable offer.':'')
  };
};
})();
