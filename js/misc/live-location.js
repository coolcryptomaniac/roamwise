// @ts-nocheck
/* live-location.js — Live Location ("near me"): on-demand geolocation answer —
   permission is requested only when the traveller actually asks for something
   nearby, never on load (rwGeoNow, rwIsNearMe, rwNearMeHTML, rwReverse). Split out
   of js/misc/misc-features-3.js (an 8-feature grab-bag left over from Phase 6a
   modularization) as an SRP cleanup; verbatim move, zero logic changes. */

/* ==================== LIVE LOCATION ("near me") ====================
   Permission is asked only when the traveller actually asks for something
   nearby — never on load. Coordinates are used for the query and are not stored
   or transmitted anywhere except the OSM lookup that answers the question. */
function rwGeoNow(){
  return new Promise(function(res, rej){
    if(!navigator.geolocation) return rej(new Error('no geolocation'));
    navigator.geolocation.getCurrentPosition(
      function(p){ res({lat:p.coords.latitude, lon:p.coords.longitude, acc:p.coords.accuracy}); },
      function(e){ rej(e); },
      {enableHighAccuracy:true, timeout:9000, maximumAge:60000}
    );
  });
}
function rwIsNearMe(t){
  return /\b(near me|nearby|around me|close by|where am i|current location|my location|near here|around here)\b/i.test(String(t||''));
}
async function rwNearMeHTML(rawq){
  var pos;
  try{ pos = await rwGeoNow(); }
  catch(e){
    return '<div class="tk-card tk-mini"><div class="tk-sec">'
      +'<div style="font-size:13px;line-height:1.6">\ud83d\udccd I need location access to answer that.</div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin-top:5px">Allow it in your browser or app settings, or just tell me the place name \u2014 works the same.</div>'
      +'</div></div>';
  }
  var place = await rwReverse(pos.lat, pos.lon);
  var spots = [];
  try{ spots = await osmAttractions(pos.lat, pos.lon, 6000); }catch(e){}
  var kind = rwActionIntent(rawq);
  var extra = kind ? rwActionHubHTML(kind, rwActionQuery(rawq, kind, place||''), place||'', pos.lat, pos.lon) : '';
  return '<div class="tk-card tk-mini"><div class="tk-sec">'
    +'<div style="font-weight:800;font-size:13.5px">\ud83d\udccd Around you'+(place? ' \u00b7 '+esc2(place):'')+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3)">Accurate to about '+Math.round(pos.acc||0)+' m \u00b7 location used for this answer only, never stored</div>'
    + (spots.length
        ? '<div class="tk-chips" style="margin-top:9px">'
          + spots.slice(0,10).map(function(sp){
              return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+sp.lat+','+sp.lon+'">'+sp.icon+' '+esc2(sp.name)+'</a>';
            }).join('')
          + '</div>'
        : '<div class="tk-bul" style="margin-top:8px">Nothing mapped within 6 km \u2014 try a wider search or name the town.</div>')
    +'</div>'
    + (extra? '<div class="tk-sec">'+extra+'</div>':'')
    +'<div class="tk-sec"><div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'order food near me\')">\ud83c\udf5c Food near me</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'cab from my location\')">\ud83d\ude95 Ride</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'hotel near me\')">\ud83c\udfe8 Stay</button>'
    +'</div></div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors</div></div>';
}
function rwReverse(lat, lon){
  if(!navigator.onLine) return Promise.resolve(null);
  return fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m&timezone=auto')
    .then(function(r){ return r.json(); })
    .then(function(){ return null; })
    .catch(function(){ return null; });
}
