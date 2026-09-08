// @ts-nocheck
/* Real-data KPI rollup for RoamWise Admin. Derived values are deliberately
   limited to fields already measured elsewhere in the admin. */
var RWKpiDashboard = (function(){
  function pct(n,d){ return d > 0 ? Math.round((Number(n)||0) / d * 1000) / 10 : null; }
  function buildKpis(input){
    var x=input||{}, users=Number(x.totalUsers)||0, pro=Number(x.proUsers)||0;
    var a=x.activityStats||{}, b=x.businessSummary||{}, e=x.ebitda||{};
    return {
      totalUsers:users, proUsers:pro, conversionPct:pct(pro,users),
      dau:Number(a.dau)||0, wau:Number(a.wau)||0, mau:Number(a.mau)||0,
      stickinessPct:pct(a.dau,a.mau), totalRevenueINR:Number(x.totalRevenueINR)||0,
      mrrINR:Number(b.mrrINR)||0, arrINR:Number(b.arrINR)||0,
      monthlyEbitdaINR:Number(e.monthlyEbitdaINR)||0,
      unresolvedCount:Number(x.unresolvedCount)||0,
      investorTargets:Number(x.investorTargets)||0,
      investorDrafts:Number(x.investorDrafts)||0
    };
  }
  function renderHtml(k,helpers){
    var money=(helpers&&helpers.money)||function(n){return '₹'+Math.round(Number(n)||0).toLocaleString('en-IN');};
    var showPct=function(v){return v==null?'—':v+'%';};
    return '<div class="grid kpis">'+
      '<div class="card kpi"><b>'+k.totalUsers+'</b><span>Total users</span></div>'+
      '<div class="card kpi"><b>'+k.proUsers+'</b><span>Pro users · '+showPct(k.conversionPct)+' conversion</span></div>'+
      '<div class="card kpi"><b>'+k.dau+' / '+k.mau+'</b><span>DAU / MAU · '+showPct(k.stickinessPct)+' stickiness</span></div>'+
      '<div class="card kpi"><b>'+money(k.totalRevenueINR)+'</b><span>Recorded all-time revenue</span></div>'+
      '<div class="card kpi"><b>'+money(k.mrrINR)+'</b><span>MRR from matched recurring plans</span></div>'+
      '<div class="card kpi"><b>'+money(k.arrINR)+'</b><span>ARR (MRR × 12)</span></div>'+
      '<div class="card kpi '+(k.monthlyEbitdaINR<0?'warn':'')+'"><b>'+money(k.monthlyEbitdaINR)+'</b><span>Monthly EBITDA-style result</span></div>'+
      '<div class="card kpi '+(k.unresolvedCount?'warn':'')+'"><b>'+k.unresolvedCount+'</b><span>Revenue records needing attention</span></div>'+
    '</div><div class="grid two" style="margin-top:14px">'+
      '<div class="card"><h2>Engagement</h2><p><b>'+k.dau+'</b> daily · <b>'+k.wau+'</b> weekly · <b>'+k.mau+'</b> monthly active users.</p></div>'+
      '<div class="card"><h2>Investor pipeline</h2><p><b>'+k.investorTargets+'</b> saved targets · <b>'+k.investorDrafts+'</b> drafted or contacted.</p></div>'+
    '</div><div class="alert"><b>Measurement boundary:</b> churn, retention cohorts, CAC and LTV are not shown until RoamWise has the event and acquisition-cost data required to calculate them honestly.</div>';
  }
  return {buildKpis:buildKpis,renderHtml:renderHtml};
})();
