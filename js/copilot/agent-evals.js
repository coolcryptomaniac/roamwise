// @ts-nocheck
/* ============================================================================
   AGENT EVAL HARNESS (rw-v53)
   ============================================================================
   The point of this is HONEST measurement. It runs a fixed suite of objectives
   through the real agent loop and scores four things that actually matter:

     tool_precision   did it call the tool the task genuinely required?
     termination      did it finish cleanly instead of hitting the ceiling?
     efficiency       steps used vs. the minimum the task needs
     recovery         when a tool errored, did it change approach and continue?

   Deliberately reports FAILURES as loudly as successes. A suite that always
   scores 100% is a suite that isn't testing anything.
   ========================================================================== */
var RW_EVALS = [
  { id:'e1', objective:'Plan 3 days in Spiti under 20000 rupees',
    must:['set_destination','calculate_budget'], minSteps:3 },
  { id:'e2', objective:'How long does it actually take to drive 200km in Spiti?',
    must:['estimate_travel_time'], minSteps:2 },
  { id:'e3', objective:'Is cycling safe in Varanasi in July?',
    must:['check_cycle_safety'], minSteps:2 },
  { id:'e4', objective:'Read this ticket: PNR 4512367890, 12017 SHATABDI EXP, NDLS-DDN, 14-Sep-2026, 06:10, CNF',
    must:['parse_ticket'], minSteps:2 },
  { id:'e5', objective:'Show me the trip map for Goa',
    must:['show_map'], minSteps:2 },
  { id:'e6', objective:'Find food and things to do near Rishikesh',
    must:['find_nearby'], minSteps:2 },
  { id:'e7', objective:'Who owes whom in our group right now?',
    must:['settle_group_money'], minSteps:2 },
  { id:'e8', objective:'Plan a day trip from Manali to Spiti and back',
    must:['estimate_travel_time'], minSteps:2,
    /* the honest-answer test: the round trip is ~18h of road, so a good agent
       should check the time and then TELL THE USER IT DOESN'T WORK. */
    expectRefusal:true },
  { id:'e9', objective:'Budget 50000 for 5 days in Goa, comfort style, and show the map',
    must:['calculate_budget','show_map'], minSteps:3 },
  { id:'e10', objective:'What is the capital of France?',
    must:[], minSteps:1, offTopic:true }
];
function rwEvalRun(onProgress, onDone){
  var results=[], i=0;
  function next(){
    if(i>=RW_EVALS.length){ onDone(rwEvalScore(results)); return; }
    var ev=RW_EVALS[i++];
    onProgress({phase:'running', id:ev.id, objective:ev.objective, done:i-1, total:RW_EVALS.length});
    var t0=Date.now();
    rwAgentRun(ev.objective, null, function(res){
      var tools=[], errs=0;
      (res.trace||[]).forEach(function(t){
        if(t.kind==='action') tools.push(t.data.tool);
        if(t.kind==='observation' && t.data && t.data.ok===false) errs++;
      });
      var called=tools.filter(function(x){ return x!=='finish'; });
      var hit=(ev.must||[]).filter(function(m){ return tools.indexOf(m)>=0; });
      var steps=(res.trace||[]).filter(function(t){ return t.kind==='action'; }).length;
      var recovered = errs>0 && res.ok;
      results.push({
        id:ev.id, objective:ev.objective,
        pass: (ev.must||[]).length ? hit.length===(ev.must||[]).length && res.ok
                                   : res.ok,
        required:(ev.must||[]), hit:hit, called:called,
        terminated:!!res.ok, reason:res.reason||'', steps:steps, minSteps:ev.minSteps||1,
        errors:errs, recovered:recovered, ms:Date.now()-t0,
        answer:(res.answer||'').slice(0,180), offTopic:!!ev.offTopic, expectRefusal:!!ev.expectRefusal
      });
      onProgress({phase:'done-one', last:results[results.length-1], done:i, total:RW_EVALS.length});
      next();
    });
  }
  next();
}
function rwEvalScore(rs){
  var n=rs.length||1;
  var scored=rs.filter(function(r){ return r.required.length; });
  var toolHits=scored.reduce(function(a,r){ return a+r.hit.length; },0);
  var toolNeed=scored.reduce(function(a,r){ return a+r.required.length; },0)||1;
  var term=rs.filter(function(r){ return r.terminated; }).length;
  var eff=rs.filter(function(r){ return r.steps<=r.minSteps+1; }).length;
  var errRuns=rs.filter(function(r){ return r.errors>0; });
  var rec=errRuns.filter(function(r){ return r.recovered; }).length;
  return {
    results:rs,
    tool_precision: Math.round(toolHits/toolNeed*100),
    termination:    Math.round(term/n*100),
    efficiency:     Math.round(eff/n*100),
    recovery:       errRuns.length? Math.round(rec/errRuns.length*100) : null,
    recovery_n:     errRuns.length,
    passed:         rs.filter(function(r){ return r.pass; }).length,
    total:          n,
    avg_ms:         Math.round(rs.reduce(function(a,r){ return a+r.ms; },0)/n),
    avg_steps:      (rs.reduce(function(a,r){ return a+r.steps; },0)/n).toFixed(1)
  };
}
function openEval(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('evalSection');
  if(!sec){ sec=document.createElement('section'); sec.id='evalSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udcca Agent <em>evals</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'evalSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Runs '+RW_EVALS.length+' objectives through the real agent loop and measures what actually matters. Failures are reported as loudly as passes \u2014 a suite that always scores 100% isn\u2019t testing anything.</p>'
    +'<button class="tact rw-cine-btn" style="width:100%;font-weight:800;padding:13px" onclick="rwEvalGo()">Run the suite</button>'
    +'<div id="evalOut" style="margin-top:14px"></div>';
}
function rwEvalGo(){
  var out=el('evalOut');
  out.innerHTML='<div class="rw-cine-load"><div class="rw-cine-orb"></div><div style="font-size:13px;color:var(--t2);margin-top:12px">Running the suite\u2026</div></div>';
  rwEvalRun(function(p){
    if(p.phase==='running'){
      var o=el('evalOut'); if(o) o.querySelector('div:last-child').textContent='Running '+(p.done+1)+'/'+p.total+' \u2014 '+p.objective.slice(0,52)+'\u2026';
    }
  }, function(sc){ rwEvalRender(sc); });
}
function rwEvalRender(sc){
  var out=el('evalOut'); if(!out) return;
  function metric(label, val, suffix, note){
    var v=(val==null)?'\u2014':val+(suffix||'');
    var col = val==null? 'var(--t3)' : (val>=80?'#4ADE80':(val>=50?'#F0A63B':'#E05B5B'));
    return '<div class="rw-cine-metric"><div class="rw-cine-num" style="color:'+col+'">'+v+'</div>'
      +'<div class="rw-cine-lbl">'+label+'</div>'+(note?'<div class="rw-cine-note">'+note+'</div>':'')+'</div>';
  }
  out.innerHTML='<div class="rw-cine-panel">'
    +'<div class="rw-cine-grid">'
    + metric('Tool precision', sc.tool_precision, '%', 'right tool chosen')
    + metric('Termination', sc.termination, '%', 'finished cleanly')
    + metric('Efficiency', sc.efficiency, '%', 'within +1 of minimum')
    + metric('Recovery', sc.recovery, '%', sc.recovery_n? 'of '+sc.recovery_n+' error runs' : 'no errors hit')
    +'</div>'
    +'<div class="rw-cine-sum">'+sc.passed+' / '+sc.total+' objectives passed \u00b7 avg '+sc.avg_steps+' steps \u00b7 avg '+sc.avg_ms+'ms</div>'
    +'</div>'
    + sc.results.map(function(r,i){
        var ok=r.pass;
        return '<div class="rw-cine-row" style="animation-delay:'+(i*0.055)+'s">'
          +'<span class="rw-cine-dot" style="background:'+(ok?'#4ADE80':'#E05B5B')+'"></span>'
          +'<span style="flex:1;min-width:0">'
          +'<b style="font-size:12.5px">'+esc2(r.objective.slice(0,58))+(r.objective.length>58?'\u2026':'')+'</b>'
          +'<div style="font-size:11px;color:var(--t3);margin-top:3px;font-family:ui-monospace,monospace">'
          + (r.called.length? esc2(r.called.join(' \u2192 ')) : 'no tools called')
          + ' \u00b7 '+r.steps+' steps'
          + (r.errors? ' \u00b7 '+r.errors+' err'+(r.recovered?' (recovered)':'') : '')
          + (r.terminated?'':' \u00b7 '+esc2(r.reason))
          +'</div></span></div>';
      }).join('')
    +'<div style="font-size:11px;color:var(--t3);margin-top:12px;line-height:1.6">These are real runs against live providers, so numbers move between runs. Quote them with the sample size (n='+sc.total+') and never round up.</div>';
}
