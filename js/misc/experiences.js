// @ts-nocheck
/* ============================================================================
   ROAMWISE EXPERIENCES (rw-v86) — certified, curated, tested
   ============================================================================
   The badge only means something if it is hard to earn. Nothing appears here
   until someone from RoamWise has actually done the trip, and every card names
   its own weak link. That honesty IS the premium.
   ========================================================================= */
function openExperiences(tier){
  window._xTier = (tier!==undefined? tier : window._xTier) || '';
  rwPageOpen('experiences', function(body){
    var L=(window.RW_EXPERIENCES||[]);
    var tiers={}; L.forEach(function(x){ tiers[x.tier]=1; });
    body.innerHTML=
       '<div class="xp-hero">'
      +'<div class="xp-seal"><span>\u2713</span></div>'
      +'<h2 class="xp-h">Experiences we have<br>actually been on.</h2>'
      +'<p class="xp-sub">Not a list scraped from the internet. Every trip here has been walked, ridden and slept through by someone from RoamWise \u2014 and every one tells you where it falls short.</p>'
      +'</div>'
      +'<div class="xp-promise">'+(window.RW_EXP_PROMISE||[]).map(function(p){
          return '<div class="xp-p"><span>\u25c6</span>'+esc2(p)+'</div>'; }).join('')+'</div>'
      +'<div class="pt-chips" style="margin:18px 0 4px">'
      +'<button class="ev-chip'+(!window._xTier?' on':'')+'" onclick="openExperiences(\'\')">All</button>'
      + Object.keys(tiers).map(function(t){
          var lbl = t==='green'? '\u26a1 Green' : t==='culture'? '\ud83c\udfad Culture' : t;
          return '<button class="ev-chip'+(window._xTier===t?' on':'')+'" onclick="openExperiences(\''+t+'\')">'+lbl+'</button>';
        }).join('')
      +'</div><div id="xpOut"></div>';
    rwExpRender();
  });
}
function rwExpRender(){
  var host=el('xpOut'); if(!host) return;
  var L=(window.RW_EXPERIENCES||[]).filter(function(x){
    return !window._xTier || x.tier===window._xTier; });
  if(!L.length){ host.innerHTML='<div class="note" style="text-align:center;padding:22px;color:var(--t3)">Nothing here yet.</div>'; return; }
  host.innerHTML=L.map(function(x,i){
    var cert = x.status==='certified';
    return '<div class="xp-card" style="animation-delay:'+(i*0.07)+'s">'
      +'<div class="xp-glow"></div>'
      +'<div class="xp-tag">'+esc2(x.tag||'')+'</div>'
      +'<h3 class="xp-t">'+esc2(x.title)+'</h3>'
      +'<div class="xp-meta">'+x.days+' days \u00b7 from \u20b9'+Number(x.from).toLocaleString('en-IN')+' \u00b7 '+esc2(x.zone)+'</div>'
      +'<div class="xp-hook">'+esc2(x.hook)+'</div>'
      +'<div class="xp-bundle">'+(x.bundle||[]).map(function(b){
          return '<div class="xp-b"><span class="xp-bk">'+esc2(b.k)+'</span><span>'+esc2(b.v)+'</span></div>';
        }).join('')+'</div>'
      +'<div class="xp-honest"><b>Where it falls short:</b> '+esc2(x.honest||'')+'</div>'
      +'<div class="xp-best">\ud83d\udcc5 '+esc2(x.best||'')+'</div>'
      +'<div class="xp-foot">'
      +'<span class="xp-status '+(cert?'ok':'')+'">'+(cert?'\u2713 Certified \u2014 we have done this':'\u25cb Scouting \u2014 not yet tested by us')+'</span>'
      +'</div>'
      +'<button class="xp-go" onclick="rwExpPlan(\''+x.id+'\')">\u2728 Plan this trip</button>'
      +'</div>';
  }).join('')
  +'<div class="gr-foot">A trip stays marked <b>Scouting</b> until one of us has been. We would rather show you an honest shortlist than a certified-looking list we cannot stand behind.</div>';
}
function rwExpPlan(id){
  var x=(window.RW_EXPERIENCES||[]).filter(function(e){ return e.id===id; })[0]; if(!x) return;
  rwPageClose();
  var inp=el('heroInput')||el('cpInput');
  if(inp){
    inp.value='Plan the RoamWise experience "'+x.title+'" \u2014 '+x.days+' days in '+x.zone+'. '
      + (x.bundle||[]).map(function(b){ return b.k+': '+b.v; }).join('. ')
      + '. Give honest travel times, a realistic budget from \u20b9'+x.from+', and tell me what could go wrong.';
    try{ copilotSend(!!el('heroInput')); }catch(err){ /* best-effort, ignore */ }
  }
}
