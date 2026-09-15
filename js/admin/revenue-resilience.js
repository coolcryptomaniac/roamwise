// @ts-nocheck
/* Deterministic portfolio health calculations for completed direct bookings.
   Commercial terms are snapshotted per booking; this module never changes a
   partner's fee because demand or risk changed after confirmation. */
var RWRevenueResilience=(function(){
  var PLANS=[
    {id:'free',name:'Partner Free',fixed:'₹0',commission:'7%',note:'Best for easy onboarding; fee only on completed stays.'},
    {id:'desk',name:'Partner Desk',fixed:'₹249/month',commission:'5%',note:'Lower transaction fee plus host workspace.'},
    {id:'annual',name:'Annual Desk',fixed:'₹2,499/year',commission:'5%',note:'Recurring base revenue across low season.'},
    {id:'three_year',name:'Three-year Desk',fixed:'₹5,999/3 years',commission:'5%',note:'Long retention; no automatic renewal by default.'}
  ];
  function key(v,fallback){return String(v||fallback||'Unknown').trim()||'Unknown';}
  function month(v){if(!v)return 'Unknown';var d=new Date(v&&v.toDate?v.toDate():v);return isNaN(d)?'Unknown':d.toISOString().slice(0,7);}
  function completed(b){return ['completed','checked_out'].indexOf(String(b&&b.status||''))>-1;}
  function add(map,k,n){map[k]=(map[k]||0)+n;}
  function topShare(map,total){var rows=Object.keys(map).map(function(k){return {key:k,value:map[k]};}).sort(function(a,b){return b.value-a.value;});return {key:rows[0]&&rows[0].key||'—',share:total&&rows[0]?rows[0].value/total:0,count:rows.length};}
  function analyse(bookings,partners){
    var byCountry={},byProperty={},byMonth={},revenue=0,gross=0,count=0,pmap={};(partners||[]).forEach(function(p){pmap[p.id||p.uid]=p;});
    (bookings||[]).filter(completed).forEach(function(b){var amount=Math.max(0,Number(b.amount||b.gross||0)),pct=Math.max(0,Math.min(30,Number(b.commissionPctSnapshot||b.commissionPct||7))),fee=amount*pct/100,p=pmap[b.partnerUid]||{};gross+=amount;revenue+=fee;count++;add(byCountry,key(b.country||p.country||p.zone,'Unknown'),fee);add(byProperty,key(b.propertyId||b.partnerUid||b.property,'Unknown'),fee);add(byMonth,month(b.completedAt||b.checkOut||b.createdAt||b.at),fee);});
    var country=topShare(byCountry,revenue),property=topShare(byProperty,revenue),time=topShare(byMonth,revenue),score=count?Math.max(0,Math.round(100-(country.share*35+property.share*40+time.share*25)*100)):0,flags=[];
    if(!count)flags.push('No completed direct-booking revenue yet; concentration cannot be measured.');
    if(country.share>.35)flags.push('Over 35% of booking commission comes from one country/region.');
    if(property.share>.15)flags.push('Over 15% of booking commission comes from one property.');
    if(time.share>.20&&time.count>1)flags.push('Over 20% of booking commission comes from one calendar month.');
    if(country.count<3&&count)flags.push('Add verified supply in at least three independent regions.');
    return {completedBookings:count,grossBookingValue:gross,commissionRevenue:revenue,score:score,country:country,property:property,time:time,flags:flags,activePartners:(partners||[]).filter(function(p){return p.status==='active';}).length};
  }
  function pct(v){return Math.round((Number(v)||0)*100)+'%';}
  function renderPlans(esc){esc=esc||String;return '<div class="grid two">'+PLANS.map(function(p){return '<div class="card"><h3>'+esc(p.name)+'</h3><div class="meta">'+esc(p.fixed)+' + <b>'+esc(p.commission)+'</b> completed-booking fee</div><p>'+esc(p.note)+'</p></div>';}).join('')+'</div>';}
  function render(a,helpers){var money=helpers&&helpers.money||function(n){return '₹'+Math.round(n||0);},esc=helpers&&helpers.esc||String;return '<div class="grid kpis"><div class="card kpi"><b>'+a.score+'/100</b><span>portfolio resilience</span></div><div class="card kpi"><b>'+a.completedBookings+'</b><span>completed direct bookings</span></div><div class="card kpi"><b>'+money(a.commissionRevenue)+'</b><span>booking commission earned</span></div><div class="card kpi"><b>'+a.activePartners+'</b><span>active properties</span></div></div><div class="grid two" style="margin-top:14px"><div class="card"><h3>Largest exposures</h3><p>Country/region: <b>'+esc(a.country.key)+'</b> · '+pct(a.country.share)+'<br>Property: <b>'+esc(a.property.key)+'</b> · '+pct(a.property.share)+'<br>Calendar month: <b>'+esc(a.time.key)+'</b> · '+pct(a.time.share)+'</p></div><div class="card"><h3>Action flags</h3>'+(a.flags.length?'<div class="list">'+a.flags.map(function(x){return '<div class="alert">'+esc(x)+'</div>';}).join('')+'</div>':'<div class="alert good">No material booking-revenue concentration flag in the current data.</div>')+'</div></div>';}
  return {PLANS:PLANS,analyse:analyse,render:render,renderPlans:renderPlans};
})();
