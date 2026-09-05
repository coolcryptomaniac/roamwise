// @ts-nocheck
/* ==================== UI: DESTINATION AUTOCOMPLETE ====================
   Extracted from app.js (modularization round 5) using the same
   deferred-init pattern as js/ui/currency-budget.js (see that file's
   header comment for the full reasoning): this was a top-level
   `var DEST_NAMES = [...]` build-up followed by a top-level IIFE in
   app.js; both are now inside a single named function, unchanged except
   for indentation, called from the exact same point in app.js — so
   execution order is unchanged.

   Depends on (by name, resolved when rwInitDestAutocomplete() is
   actually called from app.js): `DB` (js/data/destinations.js) and
   `ALL_COUNTRIES` (js/data/country-info.js) to build the curated
   destination list, plus `el()` (js/core/dom-utils.js). `DEST_NAMES`
   wasn't actually read by any other file (grepped repo-wide), so it's
   now a local var instead of the implicit global a top-level `var`
   creates — `window.getDestVal` is still published on `window` exactly
   as before, since js/itinerary/result-cards.js calls it. */
function rwInitDestAutocomplete(){
  var DEST_NAMES = [];
  DB.forEach(function(d){ DEST_NAMES.push(d.name+', '+d.country); });
  DEST_NAMES.push('Anywhere in the world','Southeast Asia','Europe','South America','Middle East','East Asia','North America','Africa','Oceania','Caucasus','Central Europe','Southern Europe','South Asia','North Africa','Western Asia');
  ALL_COUNTRIES.forEach(function(c){ if(DEST_NAMES.indexOf(c)<0) DEST_NAMES.push(c); });

  (function(){
    var inp = el('destInput'), dd = el('destDD'), sv = '', liveTimer = null, lastQ = '';
    var TYPE_ICON = {city:'\ud83c\udfd9\ufe0f', town:'\ud83c\udfd8\ufe0f', village:'\ud83c\udfe1', hamlet:'\ud83c\udfe1',
      country:'\ud83c\udf0f', state:'\ud83d\uddfa\ufe0f', region:'\ud83d\uddfa\ufe0f', island:'\ud83c\udfdd\ufe0f',
      peak:'\u26f0\ufe0f', mountain:'\u26f0\ufe0f', volcano:'\ud83c\udf0b', beach:'\ud83c\udfd6\ufe0f',
      attraction:'\ud83c\udfaf', monument:'\ud83c\udfdb\ufe0f', castle:'\ud83c\udff0', temple:'\u26e9\ufe0f',
      national_park:'\ud83c\udfde\ufe0f', waterfall:'\ud83d\udca7', lake:'\ud83c\udf0a', museum:'\ud83c\udfdb\ufe0f',
      viewpoint:'\ud83d\udcf8', zoo:'\ud83e\udd81', theme_park:'\ud83c\udfa1'};
    function addOpt(label, value, meta, cls){
      var opt = document.createElement('div');
      opt.className = 'cddo' + (cls?' '+cls:'');
      opt.innerHTML = label + (meta? ' <span style="color:var(--t3);font-size:10px">'+meta+'</span>' : '');
      opt.onmousedown = function(){ inp.value=value; sv=value; dd.classList.remove('open'); };
      dd.appendChild(opt);
    }
    function renderLocal(q){
      dd.innerHTML = '';
      var m = q ? DEST_NAMES.filter(function(n){ return n.toLowerCase().indexOf(q.toLowerCase())>=0; }) : DEST_NAMES;
      m.slice(0, q?4:8).forEach(function(n){ addOpt('\u26a1 '+n, n, 'crowd data ready'); });
      return m.length;
    }
    function renderLive(q, feats){
      if(q !== (inp.value||'').trim()) return; /* stale response */
      var seen = {};
      dd.querySelectorAll('.cddo').forEach(function(o){ seen[o.textContent.replace(/\u26a1 |\ud83c[\udf00-\udfff]|\s+crowd data ready/g,'').trim().toLowerCase()]=1; });
      feats.slice(0,7).forEach(function(f){
        var p = f.properties||{};
        if(!p.name) return;
        var parts = [p.name];
        if(p.city && p.city!==p.name) parts.push(p.city);
        else if(p.state && p.state!==p.name) parts.push(p.state);
        if(p.country) parts.push(p.country);
        var label = parts.join(', ');
        if(seen[label.toLowerCase()]) return; seen[label.toLowerCase()]=1;
        var icon = TYPE_ICON[p.osm_value] || TYPE_ICON[p.type] || '\ud83c\udf0d';
        var kind = (p.osm_value||p.type||'').replace(/_/g,' ');
        addOpt(icon+' '+label, label, kind);
      });
      if(dd.children.length) dd.classList.add('open'); else dd.classList.remove('open');
    }
    function showDD(q){
      q = (q||'').trim();
      var localHits = renderLocal(q);
      if(dd.children.length) dd.classList.add('open'); else if(!q) dd.classList.remove('open');
      clearTimeout(liveTimer);
      if(q.length < 2) return;
      /* live worldwide places — Photon (OpenStreetMap), free, made for autocomplete */
      liveTimer = setTimeout(function(){
        if(q===lastQ) return; lastQ=q;
        fetch('https://photon.komoot.io/api/?limit=8&q='+encodeURIComponent(q))
          .then(function(r){ return r.json(); })
          .then(function(j){ renderLive(q, j.features||[]); })
          .catch(function(){ /* offline / blocked: curated list still works */ });
      }, 280);
    }
    inp.addEventListener('input', function(){ sv=''; lastQ=''; showDD(inp.value); });
    inp.addEventListener('focus', function(){ lastQ=''; showDD(inp.value); });
    inp.addEventListener('blur', function(){ setTimeout(function(){ dd.classList.remove('open'); },150); });
    window.getDestVal = function(){ return sv || inp.value || 'Anywhere'; };
  })();
}
