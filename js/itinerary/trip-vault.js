// @ts-nocheck
/* trip-vault.js — offline Trip Vault (saved trips in localStorage, viewable with
   zero signal) and trip extras: weather, currency and safety essentials shown
   alongside a saved trip. Moved verbatim from app.js as part of Phase 5a
   modularization; zero logic changes. The generic overlay history-stack helpers
   (rwOverlayOpen/rwOverlayClose/_rwOvStack) that originally sat between these two
   blocks are shared app-wide infrastructure used by dozens of unrelated overlays,
   so they were deliberately left in app.js rather than moved here. */

/* ==================== TRIP VAULT — offline itinerary access ====================
   Saved trips live in localStorage (not the SW cache): they're user data, not
   network responses, so they survive offline, airplane mode and dead zones with
   no network dependency at all. The service worker already keeps the app shell
   available offline, so vault + shell = a fully usable trip planner on a plane. */
function vaultGet(){ try{ return JSON.parse(lsGet('rw_trips')||'[]'); }catch(e){ return []; } }
function vaultSave(list){ lsSet('rw_trips', JSON.stringify(list.slice(0,50))); }
function saveTripOffline(){
  try{ badgeBump('save'); }catch(e){ /* badge/progression update is a nice-to-have, ignore */ }
  var it = window._lastItin;
  if(!it || !it.days || !it.days.length){ showToast('Generate an itinerary first'); return; }
  var list = vaultGet();
  var id = 'trip_'+Date.now();
  var startVal = (el('tripStart')||{}).value || '';
  list.unshift({
    id:id, name:it.name, days:it.days, ai:!!it.ai,
    month:(el('month')||{}).value||'', start:startVal,
    savedAt:Date.now()
  });
  vaultSave(list);
  showToast('\u2708\ufe0f Saved offline \u2014 works with no signal');
  try{ track('trip_saved'); }catch(e){ /* analytics best-effort, ignore */ }
  try{ xpAdd(10,'Trip saved for offline'); }catch(e){ /* best-effort, ignore */ }
}

function openVault(){
  var list = vaultGet();
  var ov = el('vaultOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id='vaultOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\u2708\ufe0f My Trips \u2014 offline</b>'
      +'<button class="x" onclick="closeVault()">\u2715</button></div>'
      +'<div id="vaultBody" style="padding:8px 2px 16px;overflow-y:auto;flex:1 1 auto;min-height:0"></div></div>';
    document.body.appendChild(ov);
  }
  var b = el('vaultBody');
  if(!list.length){
    b.innerHTML='<div style="text-align:center;padding:28px 16px;color:var(--t3);font-size:13px;line-height:1.6">'
      +'<div style="font-size:34px;margin-bottom:8px">\ud83c\udf0f</div>'
      +'No saved trips yet.<br>Generate an itinerary, then tap <b>Save offline</b> \u2014 it\u2019ll work with zero signal.</div>';
  } else {
    b.innerHTML = list.map(function(t){
      var when = new Date(t.savedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
      return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
        +'<div><div style="font-weight:800;font-size:14px">'+String(t.name).replace(/[<>]/g,'')+'</div>'
        +'<div style="font-size:11px;color:var(--t3)">'+t.days.length+' days \u00b7 saved '+when+(t.ai?' \u00b7 \ud83e\udd16 AI':'')+'</div></div>'
        +'<div style="display:flex;gap:6px">'
        +'<button class="tact" style="font-size:11px;padding:6px 10px" onclick="openVaultTrip(\''+t.id+'\')">Open</button>'
        +'<button class="tact" style="font-size:11px;padding:6px 8px" onclick="deleteVaultTrip(\''+t.id+'\')">\ud83d\uddd1</button>'
        +'</div></div></div>';
    }).join('');
  }
  rwOverlayOpen('vaultOverlay');
}
function closeVault(){ rwOverlayClose('vaultOverlay'); }
function deleteVaultTrip(id){
  vaultSave(vaultGet().filter(function(t){ return t.id!==id; }));
  openVault(); showToast('Removed');
}
function openVaultTrip(id){
  var t = vaultGet().filter(function(x){ return x.id===id; })[0];
  if(!t) return;
  if(!el('vaultBody')) openVault(); /* self-sufficient: create the overlay if entered directly */
  var H = t.days.map(function(day){
    var segs='';
    ['morning','afternoon','evening','food'].forEach(function(k){
      if(day[k]) segs += '<div style="margin:6px 0"><div style="font-size:10px;letter-spacing:.08em;color:var(--gold2,#C8913E);text-transform:uppercase">'+(k==='food'?'\ud83c\udf5b Eat':k)+'</div>'
        +'<div style="font-size:12.5px;line-height:1.55">'+String(day[k]).replace(/[<>]/g,'')+'</div></div>';
    });
    return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
      +'<div style="font-weight:800;font-size:13px;color:var(--gold2,#C8913E)">Day '+day.day+' \u00b7 '+String(day.title||'').replace(/[<>]/g,'')+'</div>'
      +segs+(day.tip?'<div style="margin-top:8px;font-size:11.5px;color:var(--t2);border-top:1px dashed var(--b2,#2A2A36);padding-top:7px">\ud83d\udca1 '+String(day.tip).replace(/[<>]/g,'')+'</div>':'')
      +'</div>';
  }).join('');
  el('vaultBody').innerHTML =
    '<button class="tact" style="font-size:11px;padding:6px 10px;margin-bottom:10px" onclick="openVault()">\u2190 All trips</button>'
    +'<div style="font-weight:800;font-size:16px;margin-bottom:2px">'+String(t.name).replace(/[<>]/g,'')+'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-bottom:12px">Available offline \u00b7 '+t.days.length+' days</div>'
    + '<button class="tact" style="width:100%;margin-top:10px;font-weight:800" onclick="tripChatById(\''+t.id+'\')">\ud83d\udcac Open group chat</button>'
    + H + travelLinksHTML(t.name)
    + '<div id="tripExtras"></div>';
  loadTripExtras(t);
}

/* ---- Trip extras: weather, money, safety — all free, no-key APIs ----
   Open-Meteo (already our geocoder) for a 7-day forecast; Frankfurter
   (ECB rates, keyless, current domain api.frankfurter.dev) for currency.
   Coordinates are geocoded once and cached back onto the saved trip, so
   repeat opens cost zero lookups. Fully graceful offline: the trip itself
   always renders; extras simply say they need internet. */
async function loadTripExtras(t){
  var host = el('tripExtras'); if(!host) return;
  var out = [];

  /* Safety essentials — deliberately generic and honest: emergency numbers
     and search links, never invented "areas to avoid". */
  out.push('<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px;margin-bottom:6px">\ud83d\udee1 Safety essentials</div>'
    +'<div style="font-size:11.5px;color:var(--t2);line-height:1.7">'
    +'\ud83c\uddee\ud83c\uddf3 India all-in-one emergency: <b>112</b> \u00b7 Tourist helpline: <b>1363</b><br>'
    +'\ud83c\udfe5 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('hospitals near '+t.name)+'">Hospitals near '+String(t.name).replace(/[<>]/g,'')+'</a>'
    +' \u00b7 \ud83d\udc6e <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('police station near '+t.name)+'">Police</a><br>'
    +'\ud83d\udca1 Keep digital + paper copies of ID \u00b7 agree taxi fares before boarding \u00b7 \u201cfree\u201d guides and closed-hotel claims are the two classic scams</div></div>');

  host.innerHTML = out.join('') + '<div id="tripLive" style="margin-top:10px;font-size:11px;color:var(--t3)">\u26c5 Loading forecast\u2026</div>';

  if(!navigator.onLine){ el('tripLive').textContent='\u26c5 Forecast & rates need internet \u2014 everything above works offline.'; return; }
  try{
    /* geocode once, cache into the saved trip */
    if(typeof t.lat!=='number'){
      var g = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(t.name)).then(function(r){return r.json();});
      var hit = (g.results||[])[0];
      if(hit){ t.lat=hit.latitude; t.lon=hit.longitude;
        var L=vaultGet(); L.forEach(function(x){ if(x.id===t.id){ x.lat=t.lat; x.lon=t.lon; } }); vaultSave(L); }
    }
    var live=[];
    if(typeof t.lat==='number'){
      var w = await fetch('https://api.open-meteo.com/v1/forecast?latitude='+t.lat+'&longitude='+t.lon
        +'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto')
        .then(function(r){return r.json();});
      if(w && w.daily && w.daily.time){
        var days = w.daily.time.map(function(d,i){
          var dt=new Date(d), rain=w.daily.precipitation_probability_max[i];
          return '<div style="text-align:center;min-width:44px"><div style="font-size:9.5px;color:var(--t3)">'+dt.toLocaleDateString('en-IN',{weekday:'short'})+'</div>'
            +'<div style="font-size:12px;font-weight:700">'+Math.round(w.daily.temperature_2m_max[i])+'\u00b0</div>'
            +'<div style="font-size:9.5px;color:var(--t3)">'+Math.round(w.daily.temperature_2m_min[i])+'\u00b0</div>'
            +'<div style="font-size:9px;color:'+(rain>=50?'#5CC8FF':'var(--t3)')+'">'+(rain!=null? rain+'%\ud83c\udf27':'')+'</div></div>';
        }).join('');
        live.push('<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
          +'<div style="font-weight:800;font-size:12.5px;margin-bottom:8px">\u26c5 Next 7 days in '+String(t.name).replace(/[<>]/g,'')+'</div>'
          +'<div style="display:flex;gap:4px;overflow-x:auto">'+days+'</div></div>');
        /* act on the forecast instead of just displaying it */
        try{ var rs = rainSwapHTML(t, w.daily); if(rs) live.push(rs); }catch(e){ /* best-effort, ignore */ }
        /* and the shadow budget for this trip, if we know the destination */
        try{
          var dbe = cpDbFind(t.name) || costEntryForPlace(await rwResolvePlace(t.name));
          if(dbe) live.push(shadowBudgetHTML(dbe, t.days.length, 'mid'));
        }catch(e){ /* best-effort, ignore */ }
      }
    }
    /* currency mini-panel: INR vs the majors */
    try{
      var fx = await fetch('https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP,THB,IDR,AED,JPY')
        .then(function(r){return r.json();});
      if(fx && fx.rates){
        var rows = Object.keys(fx.rates).map(function(c){
          return '<div style="display:flex;justify-content:space-between;font-size:11.5px;padding:2px 0"><span style="color:var(--t3)">\u20b91,000 \u2192</span><b>'+(fx.rates[c]*1000).toFixed(2)+' '+c+'</b></div>';
        }).join('');
        live.push('<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
          +'<div style="font-weight:800;font-size:12.5px;margin-bottom:6px">\ud83d\udcb1 Your \u20b91,000 abroad <span style="font-weight:400;font-size:9.5px;color:var(--t3)">ECB rates \u00b7 '+fx.date+'</span></div>'+rows+'</div>');
      }
    }catch(e){ /* best-effort, ignore */ }
    el('tripLive').outerHTML = live.join('') || '';
  }catch(e){ var tl=el('tripLive'); if(tl) tl.textContent='\u26c5 Forecast unavailable right now.'; }
}

