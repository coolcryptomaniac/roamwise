// @ts-nocheck
/* athlete-mode.js — Athlete Mode: practical training-on-the-road lookups — medical
   POIs (RW_MED_TAGS, rwMedNear, rwMedHTML) and fitness/hydration/EV-charging POIs
   (RW_FIT_TAGS, rwFitNear, rwAthleteHTML) via OpenStreetMap/Overpass, plus
   protein-food and training guidance baked into rwAthleteHTML. Split out of
   js/misc/misc-features-3.js (an 8-feature grab-bag left over from Phase 6a
   modularization) as an SRP cleanup; verbatim move, zero logic changes. */

/* ==================== ATHLETE MODE ====================
   Travel wrecks training. This finds the practical things — a gym, a place to
   run, protein-heavy food, drinking water, EV charging — using OSM tags that
   genuinely exist rather than inventing a database we cannot maintain. */
var RW_MED_TAGS = [
  ['amenity','pharmacy','\ud83d\udc8a','Pharmacies'],
  ['amenity','doctors','\ud83e\ude7a','Clinics'],
  ['amenity','hospital','\ud83c\udfe5','Hospitals'],
  ['amenity','clinic','\ud83e\ude7a','Clinics'],
  ['amenity','veterinary','\ud83d\udc36','Vets']
];
async function rwMedNear(lat, lon, radius){
  radius = radius || 5000;
  var key='rw_med_'+lat.toFixed(2)+'_'+lon.toFixed(2);
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c && Date.now()-c.at < 30*864e5) return c.items; }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  if(!navigator.onLine) return [];
  var q='[out:json][timeout:12];('
    + RW_MED_TAGS.map(function(t){ return 'node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+lat+','+lon+');'; }).join('')
    + ');out body 40;';
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
      .then(function(x){return x.json();});
    var items=(r.elements||[]).map(function(e){
      var t=e.tags||{}, hit=RW_MED_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0];
      if(!hit) return null;
      return {name:t.name||hit[3].replace(/s$/,''), icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon,
              open:t.opening_hours||'', phone:t['phone']||t['contact:phone']||''};
    }).filter(Boolean);
    lsSet(key, JSON.stringify({at:Date.now(), items:items}));
    return items;
  }catch(e){ return []; }
}
function rwMedHTML(place, items){
  var groups={};
  (items||[]).forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var body=Object.keys(groups).map(function(g){
    return '<div class="tk-lab">'+esc2(g)+'</div><div class="tk-chips">'
      + groups[g].slice(0,8).map(function(i){
          return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'+i.icon+' '+esc2(i.name)+(i.open?' \u00b7 '+esc2(i.open.slice(0,18)):'')+'</a>';
        }).join('') + '</div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#0F766E,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udc8a Medical near '+esc2(place||'you')+'</div>'
    +'<div class="tk-meta">Pharmacies, clinics and hospitals mapped nearby</div></div>'
    + (body? '<div class="tk-sec">'+body+'</div>'
           : '<div class="tk-sec"><div class="tk-bul">Nothing mapped nearby. Ask your hotel \u2014 they always know the closest chemist.</div></div>')
    +'<div class="tk-sec"><div class="tk-lab">Worth knowing in India</div>'
    +'<div class="tk-bul">\ud83d\udcde Ambulance: <b>108</b> \u00b7 national emergency: <b>112</b></div>'
    +'<div class="tk-bul">Most pharmacies dispense without a prescription for common medicines, but carry your own prescription for anything ongoing.</div>'
    +'<div class="tk-bul">Generic equivalents are far cheaper and equally regulated \u2014 ask for the generic by name.</div>'
    +'<div class="tk-bul">Jan Aushadhi stores sell government generics at a fraction of branded prices.</div>'
    +'<div class="tk-bul">For anything serious, a private hospital in a bigger town beats a small-town clinic \u2014 the extra hour of travel is usually worth it.</div>'
    +'</div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors \u00b7 Not medical advice</div></div>';
}
var RW_FIT_TAGS = [
  ['leisure','fitness_centre','\ud83c\udfcb\ufe0f','Gyms'],
  ['leisure','sports_centre','\ud83c\udfdf\ufe0f','Sports centres'],
  ['leisure','pitch','\u26bd','Grounds & courts'],
  ['leisure','track','\ud83c\udfc3','Running tracks'],
  ['leisure','swimming_pool','\ud83c\udfca','Pools'],
  ['amenity','drinking_water','\ud83d\udeb0','Drinking water'],
  ['amenity','charging_station','\ud83d\udd0c','EV charging']
];
async function rwFitNear(lat, lon, radius){
  radius = radius || 6000;
  var key='rw_fit_'+lat.toFixed(2)+'_'+lon.toFixed(2);
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c && Date.now()-c.at < 30*864e5) return c.items; }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  if(!navigator.onLine) return [];
  var q='[out:json][timeout:12];('
    + RW_FIT_TAGS.map(function(t){ return 'node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+lat+','+lon+');'; }).join('')
    + ');out body 50;';
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
      .then(function(x){return x.json();});
    var items=(r.elements||[]).map(function(e){
      var t=e.tags||{}, hit=RW_FIT_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0];
      if(!hit) return null;
      return {name:t.name||hit[3].replace(/s$/,''), icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon};
    }).filter(Boolean);
    lsSet(key, JSON.stringify({at:Date.now(), items:items}));
    return items;
  }catch(e){ return []; }
}
function rwAthleteHTML(place, items){
  var groups={};
  (items||[]).forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var body = Object.keys(groups).map(function(g){
    return '<div class="tk-lab">'+esc2(g)+'</div><div class="tk-chips">'
      + groups[g].slice(0,8).map(function(i){
          return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'+i.icon+' '+esc2(i.name)+'</a>';
        }).join('') + '</div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#7F1D1D,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udcaa Training in '+esc2(place||'this place')+'</div>'
    +'<div class="tk-meta">Gyms, grounds, water and charging \u2014 mapped nearby</div></div>'
    + (body? '<div class="tk-sec">'+body+'</div>'
           : '<div class="tk-sec"><div class="tk-bul">Nothing mapped nearby in OpenStreetMap. Hotel gyms often sell day passes for \u20b9200\u2013500 \u2014 worth asking at reception.</div></div>')
    +'<div class="tk-sec"><div class="tk-lab">Eating for training on the road</div>'
    +'<div class="tk-bul">\ud83e\udd5a Anda bhurji / boiled eggs \u2014 the cheapest reliable protein in India, on almost every street corner</div>'
    +'<div class="tk-bul">\ud83e\uded8 Rajma, chana, dal \u2014 15\u201320g protein a bowl, in every dhaba</div>'
    +'<div class="tk-bul">\ud83e\uddc0 Paneer over potato when a thali offers the choice</div>'
    +'<div class="tk-bul">\ud83e\udd5b Curd or lassi with every meal \u2014 protein plus the gut adjustment travellers need</div>'
    +'<div class="tk-bul">\ud83c\udf57 Tandoori chicken beats curry: grilled, portioned, no oil-heavy gravy</div>'
    +'<div class="tk-bul">\ud83e\udd5c Roasted chana in your bag \u2014 the best travel snack nobody packs</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Training that survives a trip</div>'
    +'<div class="tk-bul">A hotel-room circuit needs no kit: push-ups, squats, lunges, plank. Twenty minutes holds your base for weeks.</div>'
    +'<div class="tk-bul">Run at sunrise \u2014 cooler, emptier, and you see the town waking up, which is the best sightseeing there is.</div>'
    +'<div class="tk-bul">At altitude drop intensity for the first 48 hours. Your usual pace at 3,000m is a different effort entirely.</div>'
    +'<div class="tk-bul">Carry a bottle and refill. Most Indian towns have public taps; buying 4 bottles a day is \u20b980 and a lot of plastic.</div>'
    +'</div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors</div></div>';
}
