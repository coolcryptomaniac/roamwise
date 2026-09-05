// @ts-nocheck
// Moved verbatim from app.js — State/country circuit route rendering built
// on top of the RW_STATES/RW_STATE_ALIAS/RW_COUNTRY_ROUTES data tables in
// js/data/regions.js. Called from js/copilot/core.js and
// js/copilot/rich-reply.js.
function rwDetectState(t){
  var lower=' '+String(t).toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ')+' ';
  var keys=Object.keys(RW_STATE_ALIAS).sort(function(a,b){ return b.length-a.length; });
  for(var i=0;i<keys.length;i++){ if(lower.indexOf(' '+keys[i]+' ')>-1) return RW_STATE_ALIAS[keys[i]]; }
  return null;
}
function rwStateHTML(key, days){
  var S=RW_STATES[key]; if(!S) return '';
  days = days || 7;
  var fits = S.circuits.filter(function(c){ return c.minDays <= days; });
  var tooBig = S.circuits.filter(function(c){ return c.minDays > days; });
  if(!fits.length) fits = S.circuits.slice().sort(function(a,b){ return a.minDays-b.minDays; }).slice(0,2);
  var rows = fits.slice(0,4).map(function(c){
    var per = Math.max(1, Math.floor(days/c.stops.length));
    return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<b style="font-size:13.5px">'+esc2(c.name)+'</b>'
      +'<span style="font-size:10.5px;color:var(--t3)">from '+c.minDays+' days</span></div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin:3px 0 6px;line-height:1.5">'+esc2(c.why)+'</div>'
      +'<div class="tk-chips">'
      + c.stops.map(function(st){ return '<button class="tk-chip" style="font-size:11px;padding:5px 10px" onclick="cpFollow(\''+st.replace(/'/g,'')+' '+per+' days\')">'+esc2(st)+' \u00b7 '+per+'d</button>'; }).join('')
      +'</div></div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:'+tkThemeGrad(S.label)+'">'
    +'<div class="tk-place">'+esc2(S.label)+' \u00b7 '+days+' days</div>'
    +'<div class="tk-meta">A state, not a city \u2014 here are routes through it</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Routes that fit '+days+' days</div>'+rows+'</div>'
    + (tooBig.length? '<div class="tk-sec"><div class="tk-lab">Needs more time</div>'
        + tooBig.map(function(c){ return '<div class="tk-bul">'+esc2(c.name)+' \u2014 needs '+c.minDays+'+ days</div>'; }).join('')
        +'</div>' : '')
    +'<div class="tk-sec"><div class="tk-lab">Ask me next</div><div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'best time to visit '+S.label.replace(/'/g,'')+'\')">\u26c5 Best season</button>'
    +'<button class="tk-chip" onclick="cpFollow(\''+S.label.replace(/'/g,'')+' budget for '+days+' days\')">\ud83d\udcb0 Budget</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'food in '+S.label.replace(/'/g,'')+'\')">\ud83c\udf5c Food</button>'
    +'</div></div></div>';
}

// RW_COUNTRY_ROUTES (country/region trip circuits) moved to js/data/regions.js
/* Merge the extended database (tusk-data.js) into the built-in tables. Done once,
   lazily, so load order can't bite us — if tusk-data.js is missing the app still
   runs on its six built-in countries. */
function rwMergeExtData(){
  if(window._rwDataMerged) return;
  try{ if(typeof RW_COUNTRY_ROUTES_EXT!=='undefined'){ for(var k in RW_COUNTRY_ROUTES_EXT){ if(!RW_COUNTRY_ROUTES[k]) RW_COUNTRY_ROUTES[k]=RW_COUNTRY_ROUTES_EXT[k]; } } }catch(e){ /* best-effort, ignore */ }
  try{ if(typeof RW_FOOD_EXT!=='undefined'){ for(var f in RW_FOOD_EXT){ if(!RW_FOOD[f]) RW_FOOD[f]=RW_FOOD_EXT[f]; } } }catch(e){ /* best-effort, ignore */ }
  window._rwDataMerged = true;
}
function rwDetectCountry(t){
  rwMergeExtData();
  var lower=' '+String(t).toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s{2,}/g,' ')+' ';
  /* 1) alias table first — handles "nz", "new zealand", "aussie", "the states" */
  try{
    if(typeof RW_COUNTRY_ALIAS!=='undefined'){
      /* check multi-word aliases before single words so "new zealand" wins over "new" */
      var aliases=Object.keys(RW_COUNTRY_ALIAS).sort(function(a,b){ return b.length-a.length; });
      for(var a=0;a<aliases.length;a++){ if(lower.indexOf(' '+aliases[a]+' ')>-1) return RW_COUNTRY_ALIAS[aliases[a]]; }
    }
  }catch(e){ /* best-effort, ignore */ }
  /* 2) direct key match (india, japan, etc.) */
  var keys=Object.keys(RW_COUNTRY_ROUTES);
  for(var i=0;i<keys.length;i++){ if(lower.indexOf(' '+keys[i]+' ')>-1) return keys[i]; }
  if(/\bbharat\b/.test(lower)) return 'india';
  return null;
}
function rwCountryRouteHTML(key, days){
  var C = RW_COUNTRY_ROUTES[key]; if(!C) return '';
  days = days || 10;
  var fits = C.circuits.filter(function(c){ return c.minDays <= days; });
  var tooBig = C.circuits.filter(function(c){ return c.minDays > days; });
  if(!fits.length) fits = C.circuits.slice().sort(function(a,b){ return a.minDays-b.minDays; }).slice(0,2);
  var rows = fits.slice(0,4).map(function(c){
    var per = Math.max(1, Math.floor(days/c.stops.length));
    return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<b style="font-size:13.5px">'+esc2(c.name)+'</b>'
      +'<span style="font-size:10.5px;color:var(--t3)">from '+c.minDays+' days</span></div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin:3px 0 6px;line-height:1.5">'+esc2(c.why)+'</div>'
      +'<div class="tk-chips">'
      + c.stops.map(function(st){ return '<button class="tk-chip" style="font-size:11px;padding:5px 10px" onclick="cpFollow(\''+st.replace(/'/g,'')+' '+per+' days\')">'+esc2(st)+' \u00b7 '+per+'d</button>'; }).join('')
      +'</div></div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:'+tkThemeGrad(C.label)+'">'
    +'<div class="tk-place">'+esc2(C.label)+' \u00b7 '+days+' days</div>'
    +'<div class="tk-meta">Country-wide trip \u2014 pick a circuit, not a checklist</div></div>'
    +'<div class="tk-sec"><div style="font-size:12.5px;line-height:1.6;color:var(--t2)">'
    +'You can\u2019t see all of '+esc2(C.label)+' in '+days+' days \u2014 nobody can, and trying is how a holiday turns into a commute. '
    +'Here are the circuits that genuinely fit that window. Tap any stop to plan it properly.</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Routes that fit '+days+' days</div>'+rows+'</div>'
    + (tooBig.length? '<div class="tk-sec"><div class="tk-lab">Needs more time</div>'
        + tooBig.slice(0,3).map(function(c){ return '<div class="tk-bul">'+esc2(c.name)+' \u2014 needs '+c.minDays+'+ days</div>'; }).join('')
        +'</div>' : '')
    +'<div class="tk-sec"><div class="tk-lab">Ask me next</div>'
    +'<div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'best time to visit '+C.label+'\')">\u26c5 Best season</button>'
    +'<button class="tk-chip" onclick="cpFollow(\''+C.label+' budget for '+days+' days\')">\ud83d\udcb0 Budget</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'is '+C.label+' safe? any scams?\')">\ud83d\udee1\ufe0f Safety</button>'
    +'</div></div></div>';
}
