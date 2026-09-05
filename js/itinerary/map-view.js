// @ts-nocheck
/* map-view.js — Live World Map (tap-anywhere Leaflet explorer) and the Map-First
   Itinerary View (numbered day-coloured pins, base-map switcher, flyTo). Moved
   verbatim from app.js as part of Phase 5a modularization; zero logic changes. */

/* ==================== LIVE WORLD MAP (tap anywhere) ====================
   Google Maps JS and MapMyIndia both require an API key tied to a billing
   account — a recurring cost with a traffic cliff. Leaflet + OpenStreetMap
   tiles are free, keyless and unlimited for normal app use, so the map ships
   today instead of waiting on funding. Tap any point on Earth and the panel
   fills with place, country, elevation, live weather and one-tap planning. */
var _rwMap=null, _rwMarker=null;
function openMapExplorer(){
  /* Inline, not a popup: the map lives in the page so scrolling, back-button
     and the rest of the app keep working around it. */
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('mapSection');
  if(!sec){
    sec=document.createElement('section');
    sec.id='mapSection'; sec.className='xsec v v-home';
    sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\uddfa\ufe0f Live <em>map</em></h2></div>'
      +'<p class="xsec-sub">Tap anywhere on Earth \u2014 place, elevation, live weather and a plan link.</p>'
      +'<div id="rwMap" style="height:52vh;min-height:280px;border-radius:16px;overflow:hidden;background:#0E1018;border:1px solid var(--b2,#2A2A36)"></div>'
      +'<div id="rwMapInfo" style="padding:12px 2px 4px;font-size:12.5px;color:var(--t2);line-height:1.6">Tap a spot on the map to inspect it.</div>';
    var host=el('copilotHero');
    if(host && host.parentNode) host.parentNode.insertBefore(sec, host.nextSibling);
    else document.body.appendChild(sec);
  }
  sec.scrollIntoView({behavior:'smooth', block:'start'});
  rwEnsureLeaflet(function(ok){
    if(!ok){ el('rwMapInfo').innerHTML='Map needs an internet connection \u2014 your saved trips still work offline.'; return; }
    if(!_rwMap){
      _rwMap = L.map('rwMap', {zoomControl:true, attributionControl:true}).setView([22.9,79.5], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:18, attribution:'\u00a9 OpenStreetMap'}).addTo(_rwMap);
      _rwMap.on('click', function(e){ rwMapPoint(e.latlng.lat, e.latlng.lng); });
    }
    setTimeout(function(){ try{ _rwMap.invalidateSize(); }catch(e){ /* best-effort, ignore */ } }, 250);
  });
}
function closeMapExplorer(){ /* inline section — nothing to close */ }

/* ==================== MAP-FIRST ITINERARY VIEW ====================
   The Wanderlog/Mindtrip experience: an itinerary's stops as numbered, day-
   coloured pins on an interactive map, connected in day order, tappable to see
   the stop. Reuses gcode() + rwEnsureLeaflet(). Stops are cached so the map is
   instant on re-open and viewable offline once loaded. */
var _tripMap=null, _tripLayers=[];
var _tripMapLayers=null, _tripMapMode='streets';
/* Google-Earth-style base-map switcher: Map / Satellite / Terrain. */
function rwTripMapTypeChips(){
  var host=el('tripMapTypes');
  if(!host){
    var mapEl=el('tripMap'); if(!mapEl) return;
    host=document.createElement('div'); host.id='tripMapTypes';
    host.style.cssText='display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap';
    mapEl.parentNode.insertBefore(host, mapEl);
  }
  var types=[['streets','\ud83d\uddfa\ufe0f Map'],['satellite','\ud83d\udef0\ufe0f Satellite'],['terrain','\u26f0\ufe0f Terrain']];
  host.innerHTML=types.map(function(t){
    var on=_tripMapMode===t[0];
    return '<button onclick="rwTripSetMapType(\''+t[0]+'\')" style="font-size:11.5px;font-weight:700;padding:6px 12px;border-radius:20px;border:1px solid '+(on?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';background:'+(on?'var(--gold,#E8BA6C)':'var(--bg3,#1A1A20)')+';color:'+(on?'#0A0A0C':'var(--t1)')+';cursor:pointer">'+t[1]+'</button>';
  }).join('');
}
function rwTripSetMapType(mode){
  if(!_tripMap || !_tripMapLayers) return;
  ['streets','satellite','terrain'].forEach(function(k){ try{ _tripMap.removeLayer(_tripMapLayers[k]); }catch(e){ /* best-effort, ignore */ } });
  try{ _tripMap.removeLayer(_tripMapLayers.labels); }catch(e){ /* best-effort, ignore */ }
  _tripMapLayers[mode].addTo(_tripMap);
  /* satellite imagery has no place labels — overlay a labels layer so pins make sense */
  if(mode==='satellite'){ _tripMapLayers.labels.addTo(_tripMap); }
  _tripMapMode=mode; rwTripMapTypeChips();
}
var RW_DAY_COLORS=['#E8BA6C','#60A5FA','#4ADE80','#F87171','#A78BFA','#38BDF8','#FB923C','#F472B6'];
function openTripMap(destName, stops){
  try{ badgeBump('map'); }catch(e){ /* badge/progression update is a nice-to-have, ignore */ }
  /* stops: optional [{day, name, note}]. If not given, we derive from the last
     rendered itinerary (window._lastItin) or just pin the destination. */
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('tripMapSection');
  if(!sec){
    sec=document.createElement('section');
    sec.id='tripMapSection'; sec.className='xsec v v-home';
    sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\uddfa\ufe0f Trip <em>map</em></h2>'
      +'<button class="tact" onclick="rwCloseSection(\'tripMapSection\')">\u2715 Close</button></div>'
      +'<p class="xsec-sub" id="tripMapSub">Your itinerary, mapped \u2014 tap a numbered pin or a day to jump.</p>'
      +'<div style="display:flex;gap:12px;flex-wrap:wrap">'
      +'<div id="tripMap" style="flex:1 1 340px;height:56vh;min-height:300px;border-radius:16px;overflow:hidden;background:#0E1018;border:1px solid var(--b2,#2A2A36)"></div>'
      +'<div id="tripMapList" style="flex:1 1 240px;max-height:56vh;overflow-y:auto"></div>'
      +'</div>';
    var host=el('copilotHero');
    if(host && host.parentNode) host.parentNode.insertBefore(sec, host.nextSibling);
    else document.body.appendChild(sec);
  }
  rwOpenSection(sec.id);
  sec.scrollIntoView({behavior:'smooth', block:'start'});
  el('tripMapSub').textContent='Mapping '+destName+'\u2026';
  el('tripMapList').innerHTML='<div class="note" style="padding:10px">\u23f3 Finding your stops\u2026</div>';

  /* gather stops: passed in, or from the last itinerary, or fallback to dest */
  var raw = stops && stops.length ? stops : rwDeriveStops(destName);
  rwEnsureLeaflet(function(ok){
    if(!ok){ el('tripMapList').innerHTML='<div class="note" style="padding:10px">Map needs internet the first time. Your saved trips still work offline.</div>'; return; }
    /* geocode destination + each stop (cached) */
    var cacheKey='rw_tripmap_v2_'+destName.toLowerCase().replace(/[^a-z0-9]/g,'');
    var cached=null; try{ cached=JSON.parse(lsGet(cacheKey)||'null'); }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
    var geoP;
    if(cached && cached.pins && cached.pins.length){ geoP=Promise.resolve(cached); }
    else {
      geoP = rwGeocodeStopsNear(destName, raw).then(function(out){
        try{ lsSet(cacheKey, JSON.stringify(out)); }catch(e){ /* storage best-effort, ignore */ }
        return out;
      });
    }
    geoP.then(function(data){ rwPaintTripMap(destName, data); });
  });
}
/* Geocode a destination centroid + a list of {day,name,note} stops, discarding any
   stop that resolves absurdly far (>=2 degrees lat/lon) from the destination's own
   centroid. Extracted out of openTripMap()'s inline logic so it's the ONE sanity-
   bounded, cached-friendly geocoding path — reused as-is (not duplicated) by the
   Cinematic Itinerary add-on (roamwise-premium-itinerary.js) via window.rwGeocodeStopsNear.
   Returns a Promise<{center:{lat,lon}|null, pins:[{day,name,note,lat,lon}]}>. */
function rwGeocodeStopsNear(destName, rawStops){
  var jobs = (rawStops||[]).map(function(s){
    var q=(s.name?s.name+', ':'')+destName;
    return gcode(q).then(function(g){ return g?{day:s.day,name:s.name||destName,note:s.note||'',lat:g.lat,lon:g.lon}:null; });
  });
  return Promise.all([gcode(destName), Promise.all(jobs)]).then(function(res){
    var center=res[0], pins=(res[1]||[]).filter(Boolean);
    if(!center) return {center:null, pins:[]}; /* no valid centroid to sanity-check against — reject all pins rather than trust them unvalidated */
    /* drop pins absurdly far from the destination centroid — true radial distance (haversine),
       not a lat/lon box, so a diagonal point isn't wrongly let through (a box check would allow
       up to ~2.8deg diagonally even though it caps each axis at 2deg). Cap ~222km (111km/deg * 2deg). */
    pins=pins.filter(function(p){ return rwHaversine(center.lat, center.lon, p.lat, p.lon) < 222; });
    return {center:center, pins:pins};
  });
}
/* Pull stops from the most recent itinerary the app rendered, if any. */
function rwDeriveStops(destName){
  var it = window._lastItin;
  var curatedFor = function(nm){
    var target=(nm||'').toLowerCase().trim();
    var cur=RW_CURATED_STOPS[target];
    if(!cur){ for(var k in RW_CURATED_STOPS){ if(target.indexOf(k)>=0 || k.indexOf(target)>=0){ cur=RW_CURATED_STOPS[k]; break; } } }
    return cur||null;
  };
  if(it && it.days && it.days.length){
    /* For destinations we have curated attractions for, those real place names
       geocode far better than day-theme titles ("Arrival", "Adventure Day").
       Use curated stops spread across the days; fall back to mining the text
       only when we have no curated data for this place. */
    var curated = curatedFor(destName || (it&&it.name));
    if(curated && curated.length){
      var nd = it.days.length;
      return curated.map(function(nm,i){ return {day: Math.min(nd, Math.floor(i*nd/curated.length)+1), name:nm, note:'Highlight'}; });
    }
    /* No curated data — mine each day for the most place-like token. */
    var THEME=/^(arrival|departure|adventure|relax|explore|rest|travel|free|leisure|settling|check|day\s*\d)/i;
    var stops = it.days.map(function(d,i){
      var text = d.place || d.morning || d.afternoon || d.title || '';
      var m = String(text).match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/);
      var nm = (d.place) ? d.place : (m ? m[1] : String(text).split(/[,.\u2014-]/)[0].trim());
      if(THEME.test(nm)) nm=''; /* drop pure day-themes that won't geocode */
      return {day:i+1, name:nm, note:(d.title||'')};
    }).filter(function(s){ return s.name && s.name.length>2; });
    if(stops.length) return stops;
  }
  /* No itinerary — curated highlights, then DB gems. */
  var cur2 = curatedFor(destName || (it&&it.name));
  if(cur2 && cur2.length){ return cur2.map(function(nm,i){ return {day:i+1, name:nm, note:'Highlight'}; }); }
  try{
    var target=(destName||(it&&it.name)||'').toLowerCase().trim();
    var dd = (typeof DB!=='undefined') ? DB.find(function(x){ return x.name && x.name.toLowerCase()===target; }) : null;
    if(!dd && typeof DB!=='undefined' && target){ dd = DB.find(function(x){ return x.name && (target.indexOf(x.name.toLowerCase())>=0 || x.name.toLowerCase().indexOf(target)>=0); }); }
    if(dd && dd.gems && dd.gems.length){ return dd.gems.slice(0,6).map(function(g,i){ return {day:i+1, name:g, note:'Highlight'}; }); }
  }catch(e){ /* best-effort, ignore */ }
  return [];
}
/* Open a map location reliably in BOTH the browser and the Android WebView.
   The app's WebView can choke on google.com/maps deep links; a plain
   maps.google.com/?q= URL opened via window.open works in both. */
function rwOpenMap(query){
  try{
    var q = decodeURIComponent(query);
    var url = 'https://maps.google.com/?q='+encodeURIComponent(q);
    window.open(url, '_blank', 'noopener');
    return false; /* prevent the <a> default so we control the open */
  }catch(e){ return true; }
}
function rwOpenMapExplorer_noop(){}
/* Curated real attractions (town/landmark level) for popular Indian destinations.
   Used to populate the trip map before a full itinerary exists. Extend freely. */
var RW_CURATED_STOPS = {
  'rishikesh':['Laxman Jhula','Ram Jhula','Triveni Ghat','Beatles Ashram','Neelkanth Mahadev Temple','Parmarth Niketan'],
  'haridwar':['Har Ki Pauri','Mansa Devi Temple','Chandi Devi Temple','Bharat Mata Mandir','Maya Devi Temple'],
  'manali':['Hadimba Temple','Solang Valley','Old Manali','Mall Road','Vashisht Hot Springs','Jogini Falls'],
  'shimla':['The Ridge','Mall Road','Jakhoo Temple','Christ Church','Kufri','Viceregal Lodge'],
  'nainital':['Naini Lake','Naina Devi Temple','Snow View Point','Tiffin Top','Mall Road','The Flats'],
  'almora':['Kasar Devi Temple','Bright End Corner','Nanda Devi Temple','Chitai Golu Devta','Zero Point','Katarmal Sun Temple'],
  'mussoorie':['Kempty Falls','Gun Hill','Camel\u2019s Back Road','Mall Road','Lal Tibba','Company Garden'],
  'jaipur':['Amber Fort','Hawa Mahal','City Palace','Jantar Mantar','Nahargarh Fort','Jal Mahal'],
  'udaipur':['City Palace','Lake Pichola','Jag Mandir','Fateh Sagar Lake','Sajjangarh Palace','Jagdish Temple'],
  'jaisalmer':['Jaisalmer Fort','Patwon Ki Haveli','Sam Sand Dunes','Gadisar Lake','Kuldhara Village'],
  'jodhpur':['Mehrangarh Fort','Umaid Bhawan Palace','Jaswant Thada','Clock Tower Market','Mandore Gardens'],
  'agra':['Taj Mahal','Agra Fort','Mehtab Bagh','Fatehpur Sikri','Itmad-ud-Daulah'],
  'varanasi':['Dashashwamedh Ghat','Kashi Vishwanath Temple','Assi Ghat','Manikarnika Ghat','Sarnath'],
  'goa':['Baga Beach','Calangute Beach','Fort Aguada','Basilica of Bom Jesus','Anjuna Beach','Dudhsagar Falls'],
  'leh':['Leh Palace','Pangong Lake','Shanti Stupa','Nubra Valley','Magnetic Hill','Thiksey Monastery'],
  'darjeeling':['Tiger Hill','Batasia Loop','Darjeeling Himalayan Railway','Peace Pagoda','Happy Valley Tea Estate'],
  'munnar':['Tea Gardens','Eravikulam National Park','Mattupetty Dam','Echo Point','Top Station','Attukad Falls'],
  'kasol':['Kasol Village','Chalal Village','Manikaran Sahib','Tosh Village','Kheerganga Trek'],
  'delhi':['India Gate','Red Fort','Qutub Minar','Humayun\u2019s Tomb','Lotus Temple','Chandni Chowk'],
  'mumbai':['Gateway of India','Marine Drive','Elephanta Caves','Chhatrapati Shivaji Terminus','Juhu Beach'],
  'kochi':['Fort Kochi','Chinese Fishing Nets','Mattancherry Palace','Jew Town','Santa Cruz Basilica']
};
function rwPaintTripMap(destName, data){
  var pins=(data&&data.pins)||[]; var center=data&&data.center;
  /* build the map */
  try{ if(_tripMap){ _tripLayers.forEach(function(l){ try{_tripMap.removeLayer(l);}catch(e){ /* best-effort, ignore */ } }); _tripLayers=[]; } }catch(e){ /* best-effort, ignore */ }
  if(!_tripMap){
    _tripMap = L.map('tripMap', {zoomControl:true}).setView(center?[center.lat,center.lon]:[22.9,79.5], center?11:4);
    /* Base layers incl. a Google-Earth-style satellite view (Esri World Imagery)
       and topographic terrain. Users toggle between them like Wanderlog. */
    var _streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {maxZoom:19, attribution:'\u00a9 OSM \u00a9 CARTO'});
    var _satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:19, attribution:'\u00a9 Esri'});
    var _terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {maxZoom:17, attribution:'\u00a9 OpenTopoMap'});
    var _labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png', {maxZoom:19});
    _tripMapLayers = {streets:_streets, satellite:_satellite, terrain:_terrain, labels:_labels};
    _streets.addTo(_tripMap); _tripMapMode='streets';
  }
  setTimeout(function(){ try{ _tripMap.invalidateSize(); }catch(e){ /* best-effort, ignore */ } }, 250);
  rwTripMapTypeChips();

  if(!pins.length){
    el('tripMapSub').textContent='Mapped '+destName;
    el('tripMapList').innerHTML='<div class="note" style="padding:10px">Showing '+esc2(destName)+'. Plan a full itinerary to map every day\u2019s stops in order.</div>';
    if(center){ var m=L.marker([center.lat,center.lon]).addTo(_tripMap); _tripLayers.push(m); _tripMap.setView([center.lat,center.lon],11); }
    return;
  }
  /* numbered day-coloured pins + connecting route */
  var latlngs=[]; var bounds=[];
  pins.forEach(function(p,i){
    var col=RW_DAY_COLORS[((p.day||1)-1)%RW_DAY_COLORS.length];
    var icon=L.divIcon({className:'', html:'<div style="background:'+col+';width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#0A0A0C;font-weight:800;font-size:13px">'+(i+1)+'</span></div>', iconSize:[28,28], iconAnchor:[14,28]});
    var mk=L.marker([p.lat,p.lon],{icon:icon}).addTo(_tripMap);
    mk.bindPopup('<b>'+esc2(p.name)+'</b><br><span style="color:#888">Day '+(p.day||1)+(p.note?' \u00b7 '+esc2(p.note):'')+'</span>');
    mk.on('click', function(){ rwTripListHighlight(i); });
    _tripLayers.push(mk); latlngs.push([p.lat,p.lon]); bounds.push([p.lat,p.lon]);
  });
  if(latlngs.length>1){ var line=L.polyline(latlngs,{color:'#E8BA6C',weight:3,opacity:.6,dashArray:'6,8'}).addTo(_tripMap); _tripLayers.push(line); }
  try{ _tripMap.fitBounds(bounds,{padding:[40,40],maxZoom:13}); }catch(e){ /* best-effort, ignore */ }

  el('tripMapSub').textContent=pins.length+' stops across '+destName+' \u2014 tap a pin or a stop below.';
  /* side list, grouped by day */
  var byDay={}; pins.forEach(function(p,i){ (byDay[p.day||1]=byDay[p.day||1]||[]).push({p:p,i:i}); });
  var html='';
  Object.keys(byDay).sort(function(a,b){return a-b;}).forEach(function(dy){
    var col=RW_DAY_COLORS[(dy-1)%RW_DAY_COLORS.length];
    html+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:'+col+';margin:10px 2px 5px">Day '+dy+'</div>';
    byDay[dy].forEach(function(o){
      html+='<button class="tact" id="tripStop'+o.i+'" style="width:100%;text-align:left;margin-bottom:6px;display:flex;gap:9px;align-items:flex-start" onclick="rwTripFlyTo('+o.i+')">'
        +'<span style="flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:'+col+';color:#0A0A0C;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center">'+(o.i+1)+'</span>'
        +'<span><b style="font-size:13px">'+esc2(o.p.name)+'</b>'+(o.p.note?'<br><span style="font-size:10.5px;color:var(--t2)">'+esc2(o.p.note)+'</span>':'')+'</span></button>';
    });
  });
  el('tripMapList').innerHTML=html;
  window._tripPins=pins;
}
function rwTripFlyTo(i){
  var p=(window._tripPins||[])[i]; if(!p||!_tripMap) return;
  _tripMap.flyTo([p.lat,p.lon], 14, {duration:.6});
  rwTripListHighlight(i);
  try{ _tripLayers.forEach(function(l){ if(l.getLatLng && Math.abs(l.getLatLng().lat-p.lat)<1e-6){ l.openPopup(); } }); }catch(e){ /* best-effort, ignore */ }
}
function rwTripListHighlight(i){
  try{ document.querySelectorAll('[id^=tripStop]').forEach(function(b){ b.style.background=''; }); var b=el('tripStop'+i); if(b){ b.style.background='rgba(232,186,108,.14)'; b.scrollIntoView({block:'nearest'}); } }catch(e){ /* best-effort, ignore */ }
}
function rwEnsureLeaflet(cb){
  if(window.L && window.L.map) return cb(true);
  if(!navigator.onLine) return cb(false);
  var css=document.createElement('link'); css.rel='stylesheet';
  css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
  var js=document.createElement('script'); js.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  js.onload=function(){ cb(true); }; js.onerror=function(){ cb(false); };
  document.head.appendChild(js);
}
async function rwMapPoint(lat, lon){
  var info=el('rwMapInfo'); if(!info) return;
  info.innerHTML='\u23f3 Reading that spot\u2026';
  try{ if(_rwMarker) _rwMap.removeLayer(_rwMarker); _rwMarker=L.marker([lat,lon]).addTo(_rwMap); }catch(e){ /* best-effort, ignore */ }
  var name=null, country='', admin='', elev;
  try{
    /* Reverse lookup via Open-Meteo's own geocoder (keyless): find the nearest
       named place by searching around the tapped coordinates. */
    var w = await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon
      +'&current=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto').then(function(r){return r.json();});
    elev = w.elevation;
    var rev = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat='+lat+'&lon='+lon, {headers:{'Accept':'application/json'}}).then(function(r){return r.json();}).catch(function(){return null;});
    if(rev && rev.address){
      name = rev.address.city||rev.address.town||rev.address.village||rev.address.county||rev.address.state||rev.name||null;
      admin = rev.address.state||''; country = rev.address.country||'';
    }
    var H='<div style="font-weight:800;font-size:14px;color:var(--t1)">\ud83d\udccd '+(name? String(name).replace(/[<>]/g,'') : lat.toFixed(3)+', '+lon.toFixed(3))+'</div>';
    if(admin||country) H+='<div style="font-size:11.5px;color:var(--t3)">'+[admin,country].filter(Boolean).join(', ')+'</div>';
    var bits=[];
    if(elev!=null) bits.push(Math.round(elev)+'m elevation');
    if(w.timezone) bits.push(w.timezone);
    if(w.current) bits.push('now '+Math.round(w.current.temperature_2m)+'\u00b0C');
    if(bits.length) H+='<div style="font-size:11.5px;color:var(--t3);margin-top:2px">'+bits.join(' \u00b7 ')+'</div>';
    if(w.daily && w.daily.time){
      H+='<div style="display:flex;gap:10px;margin-top:8px">'+w.daily.time.map(function(d,i){
        var rain=w.daily.precipitation_probability_max[i];
        return '<div style="text-align:center"><div style="font-size:9.5px;color:var(--t3)">'+new Date(d).toLocaleDateString('en-IN',{weekday:'short'})+'</div>'
          +'<div style="font-size:12px;font-weight:700">'+Math.round(w.daily.temperature_2m_max[i])+'\u00b0</div>'
          +'<div style="font-size:9px;color:'+(rain>=40?'#5CC8FF':'var(--t3)')+'">'+(rain!=null?rain+'%':'')+'</div></div>';
      }).join('')+'</div>';
    }
    var q = name || (lat.toFixed(3)+','+lon.toFixed(3));
    var mslot='osmmap_'+Math.random().toString(36).slice(2,8);
    H += '<div id="'+mslot+'"></div>';
    setTimeout(function(){
      osmAttractions(lat, lon, 8000).then(function(sp){
        var host=el(mslot); if(!host) return;
        if(sp && sp.length) host.innerHTML=osmAttractionsHTML(sp, q); else host.remove();
      }).catch(function(){ var h=el(mslot); if(h) h.remove(); });
    }, 30);
    H+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">'
      +'<button class="tact" style="font-size:11.5px;padding:7px 11px;font-weight:800" onclick="cpGoPlan(\''+String(q).replace(/'/g,'')+'\')">\ud83d\udcc5 Plan this place</button>'
      +'<a class="tact" style="font-size:11.5px;padding:7px 11px;text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('things to do in '+q)+'">\ud83c\udfaf Things to do</a>'
      +'<a class="tact" style="font-size:11.5px;padding:7px 11px;text-decoration:none" target="_blank" rel="noopener" href="'+stayUrl(q)+'">\ud83c\udfe8 Stays</a>'
      +'</div>';
    info.innerHTML=H;
  }catch(e){ info.innerHTML='Couldn\u2019t read that spot \u2014 try tapping again.'; }
}
