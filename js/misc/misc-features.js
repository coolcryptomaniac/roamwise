// @ts-nocheck
/* Misc travel features — moved verbatim from app.js (Phase 6a).
   Covers Fitness-First Stays, Near Me (opt-in POI search), Hub & Spoke
   India, Basecamp (trek/expedition operators + packing list), the Strava
   profile link + feature-request utility, Legendary Circuits, and the EV
   Vault. */

/* ===================== FITNESS-FIRST STAYS =====================
   For travellers who won't skip their workout: find gyms / yoga / dance /
   sports studios at a destination, then suggest staying nearby. Budget→premium.
   Uses Overpass (OSM) for the fitness venues; stay tiers are guidance, not live
   bookings (honest — we link out to booking sites for actual availability). */
var RW_FITNESS_TAGS=[
  ['leisure','fitness_centre','\ud83c\udfcb\ufe0f','Gyms'],
  ['leisure','sports_centre','\ud83c\udfc3','Sports centres'],
  ['sport','yoga','\ud83e\uddd8','Yoga studios'],
  ['leisure','dance','\ud83d\udc83','Dance studios'],
  ['sport','swimming','\ud83c\udfca','Swimming'],
  ['sport','climbing','\ud83e\uddd7','Climbing']
];
function openFitnessStays(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('fitStaySection');
  if(!sec){ sec=document.createElement('section'); sec.id='fitStaySection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  var dest=(window._lastItin&&_lastItin.name)||'';
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83c\udfcb\ufe0f Fitness-first <em>stays</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'fitStaySection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Don\u2019t break your streak on holiday. Find gyms, yoga & dance studios at your destination \u2014 then stay nearby.</p>'
    +'<div style="display:flex;gap:8px;margin-bottom:12px"><input id="fitDest" placeholder="Which city? e.g. Rishikesh" value="'+esc2(dest)+'" style="flex:1;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:11px;color:var(--t1);font-size:14px">'
    +'<button class="tact" style="font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwFitnessFind()">Find</button></div>'
    +'<div id="fitStayOut"></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}
async function rwFitnessFind(){
  var out=el('fitStayOut'); var dest=(el('fitDest').value||'').trim();
  if(!dest){ out.innerHTML='<div class="note">Type a city first.</div>'; return; }
  out.innerHTML='<div class="note">\ud83c\udfcb\ufe0f Finding fitness spots in '+esc2(dest)+'\u2026</div>';
  var geo=null; try{ geo=await gcode(dest); }catch(e){}
  if(!geo){ out.innerHTML='<div class="note">Couldn\u2019t locate '+esc2(dest)+'. Try a nearby bigger town.</div>'; return; }
  var radius=6000;
  var q='[out:json][timeout:15];(';
  RW_FITNESS_TAGS.forEach(function(t){ q+='node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+geo.lat+','+geo.lon+');'; });
  q+=');out body 60;';
  var venues=[];
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)}).then(function(x){return x.json();});
    venues=(r.elements||[]).map(function(e){
      var t=e.tags||{}; if(!t.name) return null;
      var hit=RW_FITNESS_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0]; if(!hit) return null;
      return {name:t.name, icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon};
    }).filter(Boolean);
  }catch(e){}
  rwFitnessRender(dest, geo, venues);
}
function rwFitnessRender(dest, geo, venues){
  var out=el('fitStayOut');
  var tiers=[
    {t:'Budget', ic:'\ud83d\udcb0', note:'Hostels & guesthouses near a gym', q:'budget hostels'},
    {t:'Mid', ic:'\ud83c\udfe8', note:'3-star hotels with or near fitness', q:'3 star hotels gym'},
    {t:'Premium', ic:'\u2728', note:'Resorts & hotels with full gyms/spas', q:'5 star hotel gym spa'}
  ];
  var vHtml='';
  if(venues.length){
    var groups={}; venues.forEach(function(v){ (groups[v.group]=groups[v.group]||[]).push(v); });
    vHtml='<div class="fit-venues"><div class="fit-h">\ud83c\udfcb\ufe0f Fitness spots in '+esc2(dest)+'</div>'
      + Object.keys(groups).map(function(g){
          return '<div class="fit-grp"><div class="fit-glabel">'+groups[g][0].icon+' '+g+' ('+groups[g].length+')</div>'
            + groups[g].slice(0,6).map(function(v){ return '<a class="fit-item" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(v.name+' '+dest)+'">'+esc2(v.name)+'</a>'; }).join('')
            +'</div>';
        }).join('') + '</div>';
  } else {
    vHtml='<div class="note">OSM has few fitness venues mapped for '+esc2(dest)+' \u2014 bigger cities show more. The stay tiers below still help you pick a fitness-friendly base.</div>';
  }
  var stayHtml='<div class="fit-h" style="margin-top:16px">\ud83c\udfe8 Where to stay (fitness-friendly)</div>'
    + tiers.map(function(ti){
        var url=stayUrl(ti.q+' '+dest);
        return '<a class="fit-tier" target="_blank" rel="noopener" href="'+url+'">'
          +'<span class="fit-tier-ic">'+ti.ic+'</span>'
          +'<span class="fit-tier-body"><b>'+ti.t+'</b><span>'+ti.note+'</span></span>'
          +'<span class="fit-tier-go">Search \u2192</span></a>';
      }).join('');
  out.innerHTML=vHtml+stayHtml+'<div style="font-size:10.5px;color:var(--t3);margin-top:10px;line-height:1.5">Venue data from OpenStreetMap. Stay links open live availability on booking sites \u2014 filter by "fitness centre" there for exact matches.</div>';
}
/* ===================== NEAR ME (opt-in, privacy-safe) =====================
   Finds food, things-to-do and points of interest within ~3km of where the
   user is RIGHT NOW. Location is requested on-demand only (never background,
   never stored, never sent anywhere but the public OpenStreetMap/Overpass POI
   query). Honest limit vs Google: OSM data has no live "open now/trending" or
   ratings for every place. */
var RW_NEARME_TAGS = [
  ['amenity','restaurant','\ud83c\udf7d\ufe0f','Eat'],
  ['amenity','cafe','\u2615','Cafes'],
  ['amenity','fast_food','\ud83c\udf54','Quick bites'],
  ['tourism','attraction','\ud83d\udcf8','See'],
  ['tourism','viewpoint','\ud83c\udf04','Viewpoints'],
  ['tourism','museum','\ud83c\udfdb\ufe0f','Culture'],
  ['historic','*','\ud83c\udff0','Heritage'],
  ['leisure','park','\ud83c\udf33','Parks'],
  ['amenity','marketplace','\ud83d\uded2','Markets'],
  ['shop','mall','\ud83d\udecd\ufe0f','Shopping']
];
function openNearMe(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('nearmeSection');
  if(!sec){ sec=document.createElement('section'); sec.id='nearmeSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udccd Near <em>me</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'nearmeSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Find food, sights & things to do within ~3km of where you are right now.</p>'
    +'<div class="nearme-privacy">\ud83d\udd12 Your location is used only for this search \u2014 it\u2019s never tracked in the background or saved anywhere.</div>'
    +'<button class="tact" id="nearmeBtn" style="width:100%;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwNearMeLocate()">\ud83d\udccd Find what\u2019s around me</button>'
    +'<div id="nearmeOut" style="margin-top:14px"></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}
function rwNearMeLocate(){
  var out=el('nearmeOut'), btn=el('nearmeBtn');
  /* In the Capacitor-wrapped app, use the NATIVE GPS plugin (real permission
     prompt + accurate location). Falls through to the browser API on the web. */
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Geolocation){
    if(btn){ btn.disabled=true; btn.textContent='\ud83d\udccd Getting your location\u2026'; }
    Capacitor.Plugins.Geolocation.getCurrentPosition({enableHighAccuracy:true, timeout:12000})
      .then(function(pos){
        if(btn){ btn.textContent='\ud83d\udd0d Searching within 3km\u2026'; }
        rwNearMeSearch(pos.coords.latitude, pos.coords.longitude);
      })
      .catch(function(){
        if(btn){ btn.disabled=false; btn.textContent='\ud83d\udccd Find what\u2019s around me'; }
        rwNearMeManual('Location permission is off for RoamWise.');
      });
    return;
  }
  if(!navigator.geolocation){ rwNearMeManual('Your device can\u2019t share GPS location.'); return; }
  if(btn){ btn.disabled=true; btn.textContent='\ud83d\udccd Getting your location\u2026'; }
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude, lon=pos.coords.longitude;
    if(btn){ btn.textContent='\ud83d\udd0d Searching within 3km\u2026'; }
    rwNearMeSearch(lat, lon);
  }, function(err){
    if(btn){ btn.disabled=false; btn.textContent='\ud83d\udccd Find what\u2019s around me'; }
    var why = err.code===1 ? 'Location permission is off for this app.'
            : 'Couldn\u2019t get GPS right now.';
    rwNearMeManual(why);
  }, {enableHighAccuracy:true, timeout:12000, maximumAge:60000});
}
/* Fallback so Near Me ALWAYS works — even when GPS is blocked (common in the
   in-app WebView, or when a browser has a stored "denied"). User types a place
   and we geocode it, then run the same nearby search. */
function rwNearMeManual(why){
  var out=el('nearmeOut'); if(!out) return;
  out.innerHTML='<div class="note" style="margin-bottom:10px">'+esc2(why||'')+' No problem \u2014 type where you are and I\u2019ll find what\u2019s nearby.</div>'
    +'<div style="display:flex;gap:8px">'
    +'<input id="nearManualInp" placeholder="Your area or city \u2014 e.g. Rishikesh, Laxman Jhula" style="flex:1;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:11px;color:var(--t1);font-size:14px">'
    +'<button class="tact" style="font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwNearMeManualGo()">Find</button></div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px;line-height:1.5">Tip: to use precise GPS instead, enable Location for RoamWise in your phone Settings \u2192 Apps \u2192 RoamWise \u2192 Permissions, then tap \u201cFind what\u2019s around me\u201d again.</div>';
}
async function rwNearMeManualGo(){
  var inp=el('nearManualInp'), out=el('nearmeOut');
  var place=(inp&&inp.value||'').trim();
  if(!place){ if(inp) inp.focus(); return; }
  out.innerHTML='<div class="note">\ud83d\udd0d Locating '+esc2(place)+'\u2026</div>';
  var geo=null; try{ geo=await gcode(place); }catch(e){}
  if(!geo){ out.innerHTML='<div class="note">Couldn\u2019t find \u201c'+esc2(place)+'\u201d. Try a nearby bigger town or a well-known landmark.</div>'; return; }
  rwNearMeSearch(geo.lat, geo.lon);
}
async function rwNearMeSearch(lat, lon){
  var out=el('nearmeOut'), btn=el('nearmeBtn');
  if(!navigator.onLine){ out.innerHTML='<div class="note">You\u2019re offline \u2014 Near Me needs a connection to look up places.</div>'; if(btn){btn.disabled=false;btn.textContent='\ud83d\udccd Find what\u2019s around me';} return; }
  /* Small towns (Almora, hill stations) have sparse OSM data at 3km. Widen the
     search progressively until we find a useful number of places. */
  var radii=[3000, 8000, 15000], items=[], usedRadius=3000;
  for(var ri=0; ri<radii.length; ri++){
    usedRadius=radii[ri];
    if(out) out.innerHTML='<div class="note">\ud83d\udd0d Searching within '+(usedRadius/1000)+'km\u2026</div>';
    var q='[out:json][timeout:20];(';
    RW_NEARME_TAGS.forEach(function(t){
      q += t[1]==='*' ? 'node["'+t[0]+'"](around:'+usedRadius+','+lat+','+lon+');'
                      : 'node["'+t[0]+'"="'+t[1]+'"](around:'+usedRadius+','+lat+','+lon+');';
    });
    q += ');out body 150;';
    try{
      var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
        .then(function(x){return x.json();});
      items=(r.elements||[]).map(function(e){
        var t=e.tags||{}; if(!t.name) return null;
        var hit=RW_NEARME_TAGS.filter(function(x){ return t[x[0]] && (x[1]==='*'||t[x[0]]===x[1]); })[0];
        if(!hit) return null;
        var d=rwHaversine(lat,lon,e.lat,e.lon);
        return {name:t.name, icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon, dist:d,
                open:t.opening_hours||'', cuisine:t.cuisine||''};
      }).filter(Boolean);
      items.sort(function(a,b){ return a.dist-b.dist; });
      if(items.length>=6) break; /* enough — stop widening */
    }catch(e){
      if(ri===radii.length-1){ out.innerHTML='<div class="note">The places service is busy right now \u2014 try again in a moment.</div>'; if(btn){btn.disabled=false;btn.textContent='\ud83d\udd04 Search again';} return; }
    }
  }
  rwNearMeRender(items, usedRadius);
  if(btn){ btn.disabled=false; btn.textContent='\ud83d\udd04 Search again'; }
}
function rwHaversine(la1,lo1,la2,lo2){
  var R=6371, dLa=(la2-la1)*Math.PI/180, dLo=(lo2-lo1)*Math.PI/180;
  var a=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function rwNearMeRender(items, radius){
  var out=el('nearmeOut');
  var km=radius?(radius/1000):3;
  if(!items.length){ out.innerHTML='<div class="note">Nothing mapped within '+km+'km in OpenStreetMap here \u2014 you might be in a quiet spot. Small hill towns often have little mapped. Try asking Tusk for ideas instead.</div>'; return; }
  var groups={}; items.forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var order=['Eat','Cafes','Quick bites','See','Viewpoints','Culture','Heritage','Parks','Markets','Shopping'];
  var html=order.filter(function(g){return groups[g];}).map(function(g){
    var list=groups[g].slice(0,8).map(function(i){
      var km=i.dist<1 ? Math.round(i.dist*1000)+'m' : i.dist.toFixed(1)+'km';
      return '<a class="nearme-item" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'
        +'<span class="nm-ic">'+i.icon+'</span>'
        +'<span class="nm-name">'+esc2(i.name)+(i.cuisine?' \u00b7 '+esc2(i.cuisine.split(';')[0]):'')+'</span>'
        +'<span class="nm-dist">'+km+'</span></a>';
    }).join('');
    return '<div class="nearme-group"><div class="nearme-glabel">'+groups[g][0].icon+' '+g+'</div>'+list+'</div>';
  }).join('');
  out.innerHTML=html+'<div style="font-size:10.5px;color:var(--t3);margin-top:10px;line-height:1.5">Sorted by distance. Data from OpenStreetMap \u2014 tap any place for directions. Live hours/ratings aren\u2019t always available.</div>';
}


/* ===== HUB & SPOKE INDIA ===== */
var HS=[
['\u2708\ufe0f The strategy in one line',[
 ['Fly \u2192 Hub','Cover 1,000+ km in 2 hours instead of 2 days of driving','Home \u2192 regional hub city'],
 ['Drive \u2192 Region','Pick up a self-drive SUV at the airport for flexible road-tripping','Hub \u2192 the whole region'],
 ['Train/Bus \u2192 Cities','Premium coaches for crowd-free city-to-city hops','Between major stops'],
 ['Cycle \u2192 Streets','Folding cycle in the car boot beats every traffic jam','The last mile']]],
['\ud83d\ude82 Trains \u2014 premium & crowd-free only',[
 ['Vande Bharat (CC/EC)','India\u2019s fastest day trains \u2014 aircraft comfort, big windows, rarely crowded. Book 1\u20132 weeks out.','Best for 2\u20136 hr day hops'],
 ['Shatabdi Executive / Anubhuti','2\u00d72 seating, huge legroom, quiet crowd','Day journeys in style'],
 ['1st AC (1A) Rajdhani/Duronto','Lockable private 2/4-berth coupe \u2014 the quietest overnight on rails','Overnight long hauls'],
 ['\u26a1 Tatkal hack','IRCTC app at exactly 10:00 AM the day before travel (AC quota) for guaranteed last-minute seats','Emergency bookings']]],
['\ud83d\ude8c Buses \u2014 skip state transport entirely',[
 ['What to book','Multi-axle Volvo B11R / Scania / Mercedes AC sleepers only','4\u20138 hr intercity hops'],
 ['Operators','NueGo (electric), National Travels, SRS \u2014 filter \u201cPrime / Max Safety / Volvo\u201d on redBus or AbhiBus','Premium private fleets'],
 ['Comfort hack','Single sleeper LOWER berth, RIGHT side \u2014 dramatically less sway than upper berths','Sleep like a log']]],
['\ud83d\ude97 Self-drive \u2014 the pan-India illusion',[
 ['Rent locally, not one car forever','Driving one car across all India kills speed and burns fuel/tolls \u2014 rent at each hub instead','Revv \u00b7 Zoomcar \u00b7 MyChoize'],
 ['Airport pickup','Pre-book an SUV straight from the terminal \u2014 land and drive','Zero waiting'],
 ['Subscription trick','Revv-style 1\u20133 month subscriptions give you a \u201cdedicated\u201d car with permits, insurance & maintenance handled','Long regional stays']]],
['\ud83d\udeb2 The boot cycle',[
 ['Folding only','Full-size cycles need roof racks rental companies refuse \u2014 folders fit any hatchback boot','Decathlon Tilt \u00b7 Tern \u00b7 Brompton'],
 ['The workflow','Park at the old-city edge \u2192 unfold in 30 seconds \u2192 glide past every jam and into the tiny lanes','Cities & fort towns'],
 ['Bonus','Cycle mode in RoamWise cuts your budget estimate ~40% automatically','Try it in Plan']]],
['\ud83d\udeeb Major airports - your 26 launchpads',[
 ['North','DEL Delhi - IXC Chandigarh - ATQ Amritsar - SXR Srinagar - IXL Leh - DED Dehradun - JAI Jaipur - LKO Lucknow - VNS Varanasi','Himalaya + heartland'],
 ['West','BOM Mumbai - PNQ Pune - AMD Ahmedabad - GOI/GOX Goa - IDR Indore','Coast + business'],
 ['South','BLR Bengaluru - MAA Chennai - HYD Hyderabad - COK Kochi - TRV Trivandrum - IXM Madurai','Tech + temples + beaches'],
 ['East & NE','CCU Kolkata - BBI Bhubaneswar - PAT Patna - IXR Ranchi - GAU Guwahati - IXB Bagdogra','Gateways to the wild east'],
 ['Islands','IXZ Port Blair (Andamans)','Book 60+ days out']]],
['\ud83d\ude84 Vande Bharat - the premium web (key routes)',[
 ['Himalaya feeders','Delhi-Dehradun - Delhi-Katra (Vaishno Devi) - Delhi-Amb Andaura (Kangra) - NJP-Guwahati','Mountains by breakfast'],
 ['Golden routes','Delhi-Varanasi - Delhi-Bhopal - Mumbai-Gandhinagar - Mumbai-Shirdi - Mumbai-Solapur','Business + pilgrimage'],
 ['South web','Chennai-Mysuru - Chennai-Coimbatore - Bengaluru-Dharwad - Kasaragod-Trivandrum - Secunderabad-Vizag','Day-hop the peninsula'],
 ['East & more','Howrah-NJP (Darjeeling gateway) - Howrah-Puri - Patna-Ranchi - Bilaspur-Nagpur - Jodhpur-Sabarmati','Check IRCTC for the newest of 100+ pairs']]],
['\ud83c\udfe0 Best base city for all-India travel',[
 ['\ud83c\udfc6 The verdict: DELHI','Max flight web (India\u2019s busiest hub, cheapest average domestic fares), the densest Vande Bharat + Rajdhani spokes, AND the only metro 4-8h from the entire Himalaya - Uttarakhand, Himachal, Kashmir, Ladakh flights.','Save 20-35% on travel spend vs coastal bases'],
 ['Runner-up: BENGALURU','Best base if your map is South-heavy - Kerala, Tamil Nadu, Goa, Hampi all within cheap hops; weather bonus year-round.','South specialist'],
 ['Why not Mumbai?','Great international + west coast, but Himalaya trips always cost one extra flight and 2+ extra hours.','Premium priced too'],
 ['The hybrid hack','Base Delhi Oct-Mar (mountain + desert season), migrate to Bengaluru Apr-Sep (monsoon south is magic). Two sublets beat one lease.','Nomad optimum']]],
['\ud83d\uddfa\ufe0f Example: Rajasthan loop',[
 ['1. Fly','Delhi/Mumbai \u2192 Jaipur (fastest entry)','2 hrs'],
 ['2. Drive','Airport SUV pickup, folded cycle in boot \u2192 Jodhpur \u2192 Udaipur','Flexible days'],
 ['3. Cycle','Park below Mehrangarh / Udaipur old city \u2192 pedal the alleys past every crowd','Golden hours'],
 ['4. Train back','Drop the car in Udaipur \u2192 Vande Bharat to Jaipur/Delhi in silence','Zero drive fatigue']]]
];
function renderHS(){
  var box=el('hsAcc'); if(!box) return;
  box.innerHTML = HS.map(function(sec,i){
    return '<div class="trek'+(i===0?' open':'')+'" style="margin-bottom:10px"><div class="trek-top" style="cursor:pointer" onclick="this.parentNode.classList.toggle(\'open\')"><div class="trek-name">'+sec[0]+'</div><span class="tbadge pop">'+sec[1].length+'</span></div>'
    +'<div class="trek-itin">'+sec[1].map(function(r){return '<div class="ti-day"><b style="min-width:0">\u25aa</b><span><strong style="color:var(--t1)">'+r[0]+'</strong> \u2014 '+r[1]+'<br><span style="color:var(--gold2);font-size:10px">'+r[2]+'</span></span></div>';}).join('')+'</div></div>';
  }).join('');
}
renderHS();

/* ===== BASECAMP ===== */
var BC = [
 ['\u26f0\ufe0f Trek companies \u2014 India', [
  ['Indiahikes','Largest trek organiser; strong safety systems','indiahikes.com'],
  ['Trek The Himalayas','Wide Himalayan catalogue, good batches','trekthehimalayas.com'],
  ['Bikat Adventures','Skill-progression treks, technical training','bikatadventures.com'],
  ['YHAI','Legendary budget national programs','yhaindia.org'],
  ['Spiti Ecosphere','Community-led Spiti treks & homestays','spitiecosphere.com'],
  ['Rimo Expeditions','Ladakh/Karakoram veterans since 1993','rimoexpeditions.com']]],
 ['\ud83c\udfd4\ufe0f Expedition companies \u2014 world', [
  ['Seven Summit Treks','Biggest 8000m operator (Nepal)','sevensummittreks.com'],
  ['Furtenbach Adventures','High-end, high-success Everest programs','furtenbachadventures.com'],
  ['Alpine Ascents','US institution \u2014 Rainier to Everest','alpineascents.com'],
  ['Jagged Globe','UK classic for guided expeditions','jagged-globe.co.uk'],
  ['World Expeditions','Global trekking + responsible travel','worldexpeditions.com'],
  ['Madison Mountaineering','Boutique 8000m + Seven Summits','madisonmountaineering.com']]],
 ['\ud83c\udfa5 Creators worth following', [
  ['Nimsdai Purja','14 peaks in 6 months \u2014 expedition content','@nimsdai'],
  ['Kraig Adams','Silent solo hiking films \u2014 pure trail therapy','YouTube: Kraig Adams'],
  ['Eva zu Beck','Offbeat countries, overlanding','@evazubeck'],
  ['Tanya Khanijow','India\u2019s solo-travel voice, practical guides','@tanyakhanijow'],
  ['Drew Binsky','Every country on Earth \u2014 culture snapshots','@drewbinsky'],
  ['Lost LeBlanc','Travel filmmaking + SE Asia mastery','@lostleblanc']]],
 ['\ud83c\udd98 Emergency contacts', [
  ['India \u2014 all emergencies','112 (works without signal on any network)','also: Ambulance 108 \u00b7 Tourist helpline 1363'],
  ['Europe','112','universal across the EU'],
  ['USA / Canada','911','mountain rescue via 911'],
  ['UK','999','mountain rescue: ask for Police \u2192 Mountain Rescue'],
  ['Australia','000','New Zealand: 111'],
  ['Golden rules','Save your embassy number offline before flying','Travel insurance with helicopter evac is non-negotiable above 3,500m']]]
];
function renderBC(){
  var box=el('bcAcc'); if(!box) return;
  box.innerHTML = BC.map(function(sec,si){
    return '<div class="trek" style="margin-bottom:10px"><div class="trek-top" style="cursor:pointer" onclick="this.parentNode.classList.toggle(\'open\')"><div class="trek-name">'+sec[0]+'</div><span class="tbadge hid">'+sec[1].length+'</span></div>'
    +'<div class="trek-itin">'+sec[1].map(function(r){return '<div class="ti-day"><b style="min-width:0">\u25aa</b><span><strong style="color:var(--t1)">'+r[0]+'</strong> \u2014 '+r[1]+'<br><span style="color:var(--crim2);font-size:10px">'+r[2]+'</span></span></div>';}).join('')+'</div></div>';
  }).join('')
  /* packing checklist */
  + '<div class="trek open"><div class="trek-top"><div class="trek-name">\ud83c\udf92 Essentials packing list</div><span class="tbadge pop" id="packCount"></span></div><div class="trek-itin" id="packList"></div></div>';
  renderPack();
}
var PACK=['Passport/ID + photocopies','Travel insurance (heli-evac if trekking)','Offline maps downloaded','Power bank 10,000mAh+','Universal adapter','First-aid: ORS, Diamox, painkillers, bandaids','Sunscreen SPF50 + lip balm','Rain shell / poncho','Warm layer (down/fleece)','Trekking shoes broken-in','2 pairs wool socks','Headlamp + spare batteries','Water bottle + purification tabs','Quick-dry towel','Dry bags / ziplocks','Cash in small notes','Emergency contacts written on paper','Sunglasses (cat-3 for snow)','Whistle','Duct tape (wrapped on bottle)'];
function renderPack(){
  var done=JSON.parse(lsGet('rw_pack')||'{}');
  el('packList').innerHTML = PACK.map(function(p,i){
    return '<label class="ti-day" style="cursor:pointer"><input type="checkbox" '+(done[i]?'checked':'')+' onchange="packTog('+i+',this.checked)" style="accent-color:#C4302B"><span style="'+(done[i]?'text-decoration:line-through;opacity:.5':'')+'">'+p+'</span></label>';
  }).join('');
  var n=Object.values(done).filter(Boolean).length;
  el('packCount').textContent = n+'/'+PACK.length;
}
function packTog(i,v){ var d=JSON.parse(lsGet('rw_pack')||'{}'); d[i]=v; lsSet('rw_pack',JSON.stringify(d)); renderPack(); if(v&&Object.values(d).filter(Boolean).length===PACK.length) xpAdd(20,'Fully packed \u2014 mission ready'); }
renderBC();

/* ===== STRAVA (lite link — full OAuth needs your Strava API app later) ===== */
function requestFeature(){
  if(!AUTH_READY || !user){ openAuth(); return showToast('Sign in to send ideas'); }
  var t = prompt('What should RoamWise do next? (one idea, max 200 chars)');
  if(!t || !t.trim()) return;
  db.collection('requests').add({uid:user.uid, email:user.email||'', text:t.trim().slice(0,200), created:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){ xpAdd(10,'Idea submitted \u2014 shaping the app'); })
    .catch(function(){ showToast('Could not send \u2014 try again'); });
}
function stravaConnect(){
  var u=prompt('Paste your Strava profile link (strava.com/athletes/...)', lsGet('rw_strava')||'');
  if(u===null) return;
  lsSet('rw_strava', u.trim()); showToast(u.trim()? 'Strava linked to your Journey \u2713' : 'Strava unlinked');
}

/* ===== LEGENDARY CIRCUITS ===== */
var CIRCUITS=[
{n:'Golden Triangle+',w:'North India \u00b7 drive/rail',st:['Delhi','Agra','Jaipur','Pushkar','Delhi'],km:'1,050 km',d:'6\u20138 days'},
{n:'Manali\u2013Leh\u2013Srinagar',w:'Indian Himalaya \u00b7 ride/drive',st:['Manali','Sarchu','Leh','Nubra','Pangong','Kargil','Srinagar'],km:'1,300 km',d:'10\u201314 days'},
{n:'Kumaon Loop',w:'Uttarakhand \u00b7 drive',st:['Kathgodam','Almora','Kasar Devi','Munsiyari','Chaukori','Binsar','Nainital'],km:'620 km',d:'6\u20137 days'},
{n:'Ring Road',w:'Iceland \u00b7 drive/EV',st:['Reykjav\u00edk','Vik','J\u00f6kuls\u00e1rl\u00f3n','Egilssta\u00f0ir','Akureyri','Sn\u00e6fellsnes'],km:'1,332 km',d:'7\u201310 days'},
{n:'North Coast 500',w:'Scotland \u00b7 drive',st:['Inverness','Applecross','Ullapool','Durness','John o\u2019Groats','Inverness'],km:'830 km',d:'5\u20137 days'},
{n:'Garden Route',w:'South Africa \u00b7 drive',st:['Cape Town','Hermanus','Knysna','Plettenberg','Tsitsikamma','Gqeberha'],km:'750 km',d:'6\u20138 days'},
{n:'Shikoku 88 Temples',w:'Japan \u00b7 walk/cycle',st:['Tokushima','K\u014dchi','Ehime','Kagawa (88 temples full loop)'],km:'1,150 km',d:'40\u201350 days walk'},
{n:'Pamir Highway',w:'Tajikistan/Kyrgyzstan \u00b7 4x4/cycle',st:['Dushanbe','Khorog','Wakhan Valley','Murghab','Osh'],km:'1,250 km',d:'8\u201312 days'}
];
function renderCircs(){
  var g=el('circGrid'); if(!g) return;
  g.innerHTML = CIRCUITS.map(function(c){
    return '<div class="circ"><div class="circ-name">'+c.n+'</div><div class="circ-where">'+c.w+'</div>'
      +'<div class="circ-path">'+c.st.map(function(s,i){return '<span class="cp-stop">'+s+'</span>'+(i<c.st.length-1?'<span class="cp-arr">\u279c</span>':'');}).join('')+'</div>'
      +'<div class="circ-meta">'+c.km+' \u00b7 '+c.d+'</div></div>';
  }).join('');
}

/* ===== EV VAULT (indicative, early-2026 knowledge \u2014 verify latest) ===== */
var EVS=[
{cat:'E-Bike (motorcycle)',n:'Ultraviolette F77 Mach 2',sp:[['Range (IDC)','~323 km'],['0\u2013100 charge','~5 hr (fast: ~50% in 30m)'],['Why','Longest-range made-in-India e-motorcycle']],note:'Best savings: Revolt RV400 \u00b7 touring: pair with fast-charge corridors'},
{cat:'E-Scooter',n:'Simple One',sp:[['Claimed range','~248 km'],['Removable battery','Yes'],['Why','Highest claimed scooter range in India']],note:'City value pick: Ather Rizta \u00b7 ecosystem king: Ola S1 Pro'},
{cat:'E-Cycle',n:'Riese & M\u00fcller dual-battery tourers',sp:[['Range','150\u2013200 km/charge'],['Why','Gold standard for cycle world-touring']],note:'India budget: EMotorad \u00b7 charge from any wall socket \u2014 the true world-travel EV'},
{cat:'Car \u2014 range king',n:'Lucid Air Grand Touring',sp:[['Range (EPA)','~830 km'],['Why','Longest-range production EV']],note:'India range king: Mercedes EQS (~800+ km ARAI)'},
{cat:'Car \u2014 fastest charging',n:'Hyundai Ioniq 5 / Kia EV6 (800V)',sp:[['10\u201380%','~18 min'],['Why','800V architecture \u2014 coffee-break charging']],note:'Best savings India: Tata Tiago.ev / MG Comet \u00b7 world travel: widest network wins \u2014 Tesla Model Y'},
{cat:'Most popular \u2014 world',n:'Tesla Model Y',sp:[['Claim to fame','World\u2019s best-selling car (any fuel)'],['Range','~530 km'],['Why','Charging network + resale = the default global EV']],note:'The safe pick everywhere from Norway to New Zealand'},
{cat:'Most popular \u2014 India (car)',n:'MG Windsor EV / Tata Nexon.ev',sp:[['Claim to fame','India\u2019s top-selling e-cars'],['Range','~330\u2013465 km'],['Why','Price-range sweet spot + battery-as-a-service options']],note:'Tata + MG = ~70% of India\u2019s EV car market (indicative)'},
{cat:'Most popular \u2014 India (2-wheeler)',n:'Bajaj Chetak / TVS iQube / Ola S1',sp:[['Claim to fame','The monthly sales podium'],['Range','~120\u2013195 km'],['Why','Service networks finally match the hype']],note:'Legacy makers overtook startups on trust \u2014 check latest monthly VAHAN data'},
{cat:'Bus',n:'BYD / Olectra electric coaches',sp:[['Range','250\u2013400 km'],['Why','Quiet mountain-road champions']],note:'India intercity e-buses now run Delhi\u2013Dehradun-type routes \u2014 cheapest clean long-haul'},
{cat:'Truck',n:'Tesla Semi',sp:[['Range (loaded)','~800 km'],['Why','Long-haul electric freight benchmark']],note:'Overlanding future: e-pickups (Rivian R1T) already circle continents'},
{cat:'Drone / eVTOL',n:'EHang EH216-S',sp:[['Type','Certified pilotless air taxi'],['Why','First type-certified passenger eVTOL']],note:'Delivery workhorse: DJI FlyCart 30 (~30 kg payload)'},
{cat:'Electric \u201chelicopter\u201d (eVTOL)',n:'Joby S4',sp:[['Range','~160 km'],['Speed','~320 km/h'],['Why','Leading electric air-taxi \u2014 city hops, zero jet fuel']],note:'Air travel\u2019s EV moment is arriving \u2014 watch this space'}
];
function renderEvs(){
  var g=el('evGrid'); if(!g) return;
  g.innerHTML=EVS.map(function(e){
    return '<div class="ev"><div class="ev-cat">'+e.cat+'</div><div class="ev-name">'+e.n+'</div>'
      +e.sp.map(function(s){return '<div class="ev-spec"><span>'+s[0]+'</span><b>'+s[1]+'</b></div>';}).join('')
      +'<div class="ev-note">'+e.note+'</div></div>';
  }).join('');
}
renderCircs(); renderEvs();
