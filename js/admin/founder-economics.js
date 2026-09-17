// @ts-check
/* Ten-year founder-independence model. Measured MRR and owner-entered costs
   are passed in by the admin page; every growth/churn/margin value remains an
   explicitly editable planning assumption. No forecast is reported as fact. */
var RWFounderEconomics=(function(){
  var DEFAULTS={
    grossMrrGrowthPct:8,
    monthlyChurnPct:3,
    otherMonthlyRevenueINR:0,
    otherRevenueGrowthPct:2,
    variableCostPct:15,
    targetAnnualCrore:1
  };
  var ENGINES=[
    {name:'Consumer subscriptions',economics:'₹299/month or ₹2,499/year',mode:'Self-serve recurring',guard:'Hosted AI is metered; Smart Planner and BYOK carry no RoamWise model bill.'},
    {name:'Direct property network',economics:'7% Free · 5% paid desk',mode:'Completed bookings only',guard:'Country, property and month concentration is monitored.'},
    {name:'Partner desk',economics:'₹249/month · ₹2,499/year · ₹5,999/3 years',mode:'Recurring / prepaid',guard:'No lifetime cloud-service promise.'},
    {name:'Travel-planning widget',economics:'₹14,999/year · 6,000 plans',mode:'Prepaid self-serve add-on',guard:'Hard annual allowance; no bespoke implementation included.'},
    {name:'White-label planner',economics:'₹49,999/year · 30,000 plans',mode:'Prepaid self-serve add-on',guard:'Branding/configuration only; overage requires a new pack.'},
    {name:'Premium itinerary',economics:'₹10 each · included in Pro',mode:'Automated digital delivery',guard:'No founder consultation or manual itinerary writing.'}
  ];
  function finite(v,fallback){var n=Number(v);return isFinite(n)?n:fallback;}
  function clamp(v,min,max,fallback){return Math.max(min,Math.min(max,finite(v,fallback)));}
  function normalise(v){v=v||{};return{
    grossMrrGrowthPct:clamp(v.grossMrrGrowthPct,0,100,DEFAULTS.grossMrrGrowthPct),
    monthlyChurnPct:clamp(v.monthlyChurnPct,0,100,DEFAULTS.monthlyChurnPct),
    otherMonthlyRevenueINR:clamp(v.otherMonthlyRevenueINR,0,1e9,DEFAULTS.otherMonthlyRevenueINR),
    otherRevenueGrowthPct:clamp(v.otherRevenueGrowthPct,0,100,DEFAULTS.otherRevenueGrowthPct),
    variableCostPct:clamp(v.variableCostPct,0,95,DEFAULTS.variableCostPct),
    targetAnnualCrore:clamp(v.targetAnnualCrore,.01,1000,DEFAULTS.targetAnnualCrore)
  };}
  function project(measuredMrr,fixedMonthly,raw,months){
    var a=normalise(raw),mrr=Math.max(0,finite(measuredMrr,0)),other=a.otherMonthlyRevenueINR,
      fixed=Math.max(0,finite(fixedMonthly,0)),totalRevenue=0,totalProfit=0,target=a.targetAnnualCrore*10000000,
      targetMonth=null,years=[],yearRevenue=0,yearProfit=0,span=Math.max(12,Math.min(240,Number(months)||120));
    for(var month=1;month<=span;month++){
      var revenue=mrr+other,variable=revenue*a.variableCostPct/100,profit=revenue-variable-fixed;
      yearRevenue+=revenue;yearProfit+=profit;totalRevenue+=revenue;totalProfit+=profit;
      if(targetMonth===null&&revenue*12>=target)targetMonth=month;
      if(month%12===0){years.push({year:month/12,revenue:yearRevenue,profit:yearProfit,endingMrr:mrr,endingOther:other});yearRevenue=0;yearProfit=0;}
      mrr=mrr*(1+a.grossMrrGrowthPct/100)*(1-a.monthlyChurnPct/100);
      other=other*(1+a.otherRevenueGrowthPct/100);
    }
    var contributionMargin=1-a.variableCostPct/100;
    return {assumptions:a,years:years,targetINR:target,targetMonth:targetMonth,totalRevenue:totalRevenue,
      totalProfit:totalProfit,fixedMonthly:fixed,breakEvenRevenue:contributionMargin?fixed/contributionMargin:Infinity,
      startingRevenue:Math.max(0,finite(measuredMrr,0))+a.otherMonthlyRevenueINR};
  }
  function fmt(n){return '₹'+Math.round(Number(n)||0).toLocaleString('en-IN');}
  function input(id,label,value,step){return '<div class="field"><label>'+label+'</label><input id="'+id+'" class="input" type="number" min="0" step="'+(step||1)+'" value="'+value+'"></div>';}
  function render(model,esc){esc=esc||String;var a=model.assumptions,hit=model.targetMonth===null?'Not reached in 10 years':'Month '+model.targetMonth+' · Year '+Math.ceil(model.targetMonth/12);return ''+
    '<div class="alert"><b>Forecast, not booked revenue.</b> Measured recurring MRR and saved monthly costs come from the admin data above. Growth, churn, other revenue and variable cost are editable assumptions.</div>'+
    '<div class="grid kpis"><div class="card kpi"><b>'+fmt(model.startingRevenue)+'</b><span>starting monthly revenue</span></div><div class="card kpi"><b>'+fmt(model.breakEvenRevenue)+'</b><span>monthly break-even revenue</span></div><div class="card kpi"><b>'+esc(hit)+'</b><span>'+a.targetAnnualCrore+' Cr annual run-rate target</span></div><div class="card kpi '+(model.totalProfit<0?'warn':'')+'"><b>'+fmt(model.totalProfit)+'</b><span>10-year modelled operating profit</span></div></div>'+
    '<div class="fields" style="margin-top:14px">'+
      input('feGrowth','Gross MRR added / month (%)',a.grossMrrGrowthPct,.1)+
      input('feChurn','Recurring revenue churn / month (%)',a.monthlyChurnPct,.1)+
      input('feOther','Other monthly revenue now (₹)',a.otherMonthlyRevenueINR,100)+
      input('feOtherGrowth','Other revenue growth / month (%)',a.otherRevenueGrowthPct,.1)+
      input('feVariable','Variable costs (% of revenue)',a.variableCostPct,.1)+
      input('feTarget','Annual revenue target (crore ₹)',a.targetAnnualCrore,.1)+
    '</div><div class="actions" style="margin-top:12px"><button class="btn primary" onclick="saveFounderEconomics()">Save assumptions</button><button class="btn" onclick="renderFounderEconomics()">Recalculate</button></div>'+
    '<table style="margin-top:14px"><thead><tr><th>Year</th><th>Revenue</th><th>Operating profit</th><th>Ending recurring MRR</th><th>Other monthly revenue</th></tr></thead><tbody>'+model.years.map(function(y){return '<tr><td>'+y.year+'</td><td>'+fmt(y.revenue)+'</td><td>'+fmt(y.profit)+'</td><td>'+fmt(y.endingMrr)+'</td><td>'+fmt(y.endingOther)+'</td></tr>';}).join('')+'</tbody></table>';
  }
  function renderEngines(esc){esc=esc||String;return '<div class="grid two">'+ENGINES.map(function(e){return '<div class="card"><h3>'+esc(e.name)+'</h3><div class="meta"><b>'+esc(e.economics)+'</b> · '+esc(e.mode)+'</div><p>'+esc(e.guard)+'</p></div>';}).join('')+'</div>';}
  function read(get){return normalise({grossMrrGrowthPct:get('feGrowth').value,monthlyChurnPct:get('feChurn').value,otherMonthlyRevenueINR:get('feOther').value,otherRevenueGrowthPct:get('feOtherGrowth').value,variableCostPct:get('feVariable').value,targetAnnualCrore:get('feTarget').value});}
  return {DEFAULTS:DEFAULTS,ENGINES:ENGINES,normalise:normalise,project:project,render:render,renderEngines:renderEngines,read:read};
})();
