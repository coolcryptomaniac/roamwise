(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.RWPricingIntegrity=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  function n(v){v=Number(v);return isFinite(v)?v:0}
  function clamp(v,a,b){return Math.max(a,Math.min(b,n(v)))}
  function commissionForPlan(plan){return String(plan||'free')==='free'?7:5}
  function sameNetRate(comparatorRate,comparatorCommissionPct,roamwiseCommissionPct){
    var gross=Math.max(0,n(comparatorRate)),c=clamp(comparatorCommissionPct,0,50)/100,r=clamp(roamwiseCommissionPct,0,30)/100;
    if(!gross||r>=1)return 0;
    return Math.round((gross*(1-c)/(1-r))*100)/100
  }
  function passThroughTarget(comparatorRate,comparatorCommissionPct,roamwiseCommissionPct,share){
    var gross=Math.max(0,n(comparatorRate)),same=sameNetRate(gross,comparatorCommissionPct,roamwiseCommissionPct),s=clamp(share==null?1:share,0,1);
    if(!gross||n(comparatorCommissionPct)<=n(roamwiseCommissionPct))return gross;
    return Math.round((gross-(gross-same)*s)*100)/100
  }
  function validHttp(s){try{var u=new URL(String(s||''));return u.protocol==='https:'||u.protocol==='http:'}catch(e){return false}}
  function audit(input){
    input=input||{};var rw=Math.max(0,n(input.roamwiseRate)),rwPct=clamp(input.roamwiseCommissionPct,0,30),rows=(input.comparators||[]).filter(function(x){return x&&validHttp(x.url)&&n(x.rate)>0}),flags=[];
    if(rows.length<2)flags.push('NEED_TWO_COMPARATORS');
    rows.forEach(function(x){
      var cp=n(x.commissionPct),rate=n(x.rate);
      if(cp>rwPct&&rw>=rate)flags.push('NO_VISIBLE_PASS_THROUGH:'+String(x.source||'comparator'));
    });
    var min=rows.length?Math.min.apply(null,rows.map(function(x){return n(x.rate)})):0;
    if(min&&rw>min)flags.push('ABOVE_PUBLIC_COMPARABLE');
    return {status:flags.length?'review':'pass',flags:flags,comparators:rows.length,lowestComparable:min,roamwiseRate:rw,roamwiseCommissionPct:rwPct}
  }
  function premiumReady(x){x=x||{};return !!(x.mouAccepted&&x.priceAuditPassed&&x.photoVerified&&x.locationVerified&&x.chargesTransparent&&x.qualityApproved)}
  return {commissionForPlan:commissionForPlan,sameNetRate:sameNetRate,passThroughTarget:passThroughTarget,audit:audit,premiumReady:premiumReady}
});