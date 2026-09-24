// @ts-nocheck
/* Lean operations control plane. It turns existing admin records into an
   exception queue; it never performs payments, refunds, partner approvals,
   legal filings or safety actions. */
var RWLeanOps = (function(){
  var DEFAULT_POLICY={preferredCoreTeam:3,maxCoreTeam:20,maxExceptionsPerPerson:25,staleHours:24};
  function text(v){return String(v==null?'':v)}
  function ms(v){try{return v&&typeof v.toDate==='function'?v.toDate().getTime():new Date(v||0).getTime()||0}catch(e){return 0}}
  function openStatus(v){return !/closed|done|resolved|sent|completed|fulfilled|stayed|cancelled|rejected|offboarded/i.test(text(v))}
  function activeStaff(rows){return (rows||[]).filter(function(x){return x&&x.active!==false&&!/none|offboard|inactive|terminated/i.test(text(x.role||x.status))}).length}
  function add(out,lane,type,title,detail,route,createdAt){
    out.push({lane:lane,type:type,title:title,detail:detail,route:route,createdAt:ms(createdAt)});
  }
  function build(input){
    var x=input||{},p=Object.assign({},DEFAULT_POLICY,x.policy||{}),rows=[],now=Number(x.nowMs)||Date.now();
    p.maxCoreTeam=Math.min(20,Math.max(2,Number(p.maxCoreTeam)||DEFAULT_POLICY.maxCoreTeam));
    p.preferredCoreTeam=Math.min(p.maxCoreTeam,Math.max(2,Number(p.preferredCoreTeam)||DEFAULT_POLICY.preferredCoreTeam));
    p.maxExceptionsPerPerson=Math.min(100,Math.max(5,Number(p.maxExceptionsPerPerson)||DEFAULT_POLICY.maxExceptionsPerPerson));
    p.staleHours=Math.min(168,Math.max(1,Number(p.staleHours)||DEFAULT_POLICY.staleHours));
    (x.revenueMismatches||[]).forEach(function(v){add(rows,'human','payment','Revenue record mismatch',text(v.email||v.id||'Unknown account'),'money',v.updatedAt||v.createdAt)});
    (x.cashfreeOrders||[]).forEach(function(v){add(rows,'human','payment','Cashfree order needs verification',text(v.orderId||v.id||'Order without reference'),'money',v.updatedAt||v.createdAt)});
    (x.bookings||[]).forEach(function(v){
      var s=text(v.status).toLowerCase(),ref=text(v.ref||v.id||'Booking');
      if(/refund|dispute|chargeback|sos|safety|incident/.test(s))add(rows,'human','booking','Human approval required',ref+' · '+s,'operations',v.updatedAt||v.createdAt);
      else if(/requested|pending|awaiting/.test(s))add(rows,'review','booking','Booking waiting for response',ref+' · '+(s||'pending'),'operations',v.updatedAt||v.createdAt);
    });
    (x.partners||[]).forEach(function(v){
      var request=v.lifecycleRequest||{},pending=request.kind&&!/none|resolved|approved|rejected/.test(text(request.status));
      if(pending)add(rows,'human','partner','Partner lifecycle decision',text(v.name||v.id)+' · '+text(request.kind),'operations',request.requestedAt||v.updatedAt);
      else if(!v.verified&&!/rejected|offboarded/.test(text(v.status)))add(rows,'review','partner','Partner verification incomplete',text(v.name||v.id),'operations',v.updatedAt||v.createdAt);
    });
    (x.devRequests||[]).filter(function(v){return openStatus(v.status)}).forEach(function(v){
      add(rows,/high|urgent|critical/.test(text(v.priority))?'human':'ai','development',text(v.title||'Development request'),text(v.priority||'normal')+' priority','devrequests',v.createdAt);
    });
    (x.notifications||[]).filter(function(v){return text(v.status||'queued')==='queued'}).forEach(function(v){add(rows,'review','communication','Outbound message awaiting review',text(v.title||v.id),'notifications',v.createdAt)});
    rows.forEach(function(v){v.ageHours=v.createdAt?Math.max(0,Math.floor((now-v.createdAt)/36e5)):null;v.stale=v.ageHours!=null&&v.ageHours>=p.staleHours});
    var people=Math.max(1,1+activeStaff(x.teamAccess)),manual=rows.filter(function(v){return v.lane!=='ai'}),critical=rows.filter(function(v){return v.lane==='human'}),stale=rows.filter(function(v){return v.stale}),capacity=people*p.maxExceptionsPerPerson;
    var byType={};manual.forEach(function(v){byType[v.type]=(byType[v.type]||0)+1});
    var topType=Object.keys(byType).sort(function(a,b){return byType[b]-byType[a]})[0]||'';
    return {policy:p,rows:rows.sort(function(a,b){return Number(b.stale)-Number(a.stale)||({human:3,review:2,ai:1}[b.lane]-({human:3,review:2,ai:1}[a.lane]))}),people:people,manualCount:manual.length,criticalCount:critical.length,aiCount:rows.length-manual.length,staleCount:stale.length,capacity:capacity,hireNeeded:manual.length>capacity,overCap:people>p.maxCoreTeam,topType:topType};
  }
  function render(a,h){
    var esc=h&&h.esc||function(v){return text(v)},laneLabel={human:'HUMAN APPROVAL',review:'REVIEW',ai:'AI / DEV QUEUE'};
    var queue=a.rows.slice(0,60).map(function(v){return '<div class="row"><div class="grow"><strong>'+esc(v.title)+' <span class="tag '+(v.lane==='human'?'warn':'')+'">'+laneLabel[v.lane]+'</span></strong><div class="meta">'+esc(v.detail)+(v.ageHours==null?'':' · '+v.ageHours+'h old')+(v.stale?' · SLA exceeded':'')+'</div></div><button class="btn small" onclick="goPage(\''+v.route+'\')">Open</button></div>'}).join('');
    var staffing=a.overCap?'The active roster exceeds the configured '+a.policy.maxCoreTeam+'-person ceiling. Review roles and vendors before expanding further.':a.hireNeeded?'Repeated manual load exceeds the configured '+a.capacity+'-exception capacity. Automate the dominant '+esc(a.topType||'operations')+' pattern first; hire only if it remains.':'Current exception load fits the '+a.people+'-person core operating model.';
    var attention=a.overCap||a.hireNeeded;
    return '<div class="grid kpis"><div class="card kpi '+(a.overCap?'warn':'')+'"><b>'+a.people+'</b><span>active core · target '+a.policy.preferredCoreTeam+' · ceiling '+a.policy.maxCoreTeam+'</span></div><div class="card kpi '+(a.criticalCount?'warn':'')+'"><b>'+a.criticalCount+'</b><span>human approvals</span></div><div class="card kpi"><b>'+a.aiCount+'</b><span>AI / development candidates</span></div><div class="card kpi '+(a.staleCount?'warn':'')+'"><b>'+a.staleCount+'</b><span>past '+a.policy.staleHours+'h SLA</span></div></div><div class="alert '+(attention?'bad':'good')+'"><b>'+(a.overCap?'Team ceiling exceeded':a.hireNeeded?'Automation or hiring trigger':'Lean-team capacity is healthy')+'</b><div class="meta">'+staffing+'</div></div><div class="grid two"><div class="card"><h2>Exception-only queue</h2><p>Normal successful activity stays hidden. Highest-risk and oldest exceptions appear first.</p><div class="list">'+(queue||'<div class="empty">No operating exception requires attention.</div>')+'</div></div><div class="card"><h2>AI workload contract</h2><div class="rule-step"><b>AI</b><div><b>Triage, summarize and draft</b><div class="meta">Standard support drafts, reminders, data checks and development tasks.</div></div></div><div class="rule-step"><b>Review</b><div><b>A person checks before release</b><div class="meta">Partner verification, outbound messages and unusual booking requests.</div></div></div><div class="rule-step"><b>Human</b><div><b>Never autonomous</b><div class="meta">Payments, refunds, account access, legal/tax filings, safety incidents and partner activation.</div></div></div></div></div>';
  }
  function brief(a){return ['RoamWise lean-ops brief',a.people+' active core people (target '+a.policy.preferredCoreTeam+', ceiling '+a.policy.maxCoreTeam+')',a.criticalCount+' human approvals',a.manualCount+' total manual/review exceptions',a.aiCount+' AI/development candidates',a.staleCount+' items past '+a.policy.staleHours+'h SLA',a.overCap?'Action: roster is above the team ceiling.':a.hireNeeded?'Action: automate '+(a.topType||'the dominant queue')+' first, then evaluate one hire.':'Action: no hire indicated by current exception load.'].join('\n')}
  return {DEFAULT_POLICY:DEFAULT_POLICY,build:build,render:render,brief:brief};
})();
