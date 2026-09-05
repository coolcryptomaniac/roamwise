// @ts-nocheck
// Moved verbatim from app.js — Real Attractions (OpenStreetMap / Overpass):
// queries OSM directly for keyless, worldwide POIs a plain search misses.
// Called from js/misc/live-location.js, js/itinerary/map-view.js and
// js/copilot/rich-reply.js.
/* ==================== REAL ATTRACTIONS (OpenStreetMap / Overpass) ==========
   Ailon Tusk could describe a place but never list what's actually AT it.
   Overpass queries OpenStreetMap directly: free, keyless, worldwide, and it
   holds the small stuff Google buries — viewpoints, waterfalls, ruins, springs,
   the "hidden" things travellers hunt for. Results cache for 30 days per place,
   so a destination you've opened once works offline afterwards. */
/* Trimmed from 14 filters to 6: each filter is a separate spatial scan, and the
   public Overpass server was taking 9+ seconds (or timing out) on the long list.
   These six cover what travellers actually search for. */
var OSM_KINDS = [
  ['tourism','attraction','\ud83c\udfaf'], ['tourism','viewpoint','\ud83d\udc41\ufe0f'],
  ['tourism','museum','\ud83c\udfdb\ufe0f'], ['historic','fort','\ud83c\udff0'],
  ['natural','waterfall','\ud83d\udca7'], ['natural','peak','\u26f0\ufe0f']
];
function osmCacheKey(lat,lon){ return 'rw_osm_'+lat.toFixed(2)+'_'+lon.toFixed(2); }
async function osmAttractions(lat, lon, radiusM){
  radiusM = radiusM || 12000;
  var key = osmCacheKey(lat,lon);
  try{
    var c=JSON.parse(lsGet(key)||'null');
    if(c && (Date.now()-c.at) < 30*864e5) return c.items;
  }catch(e){}
  if(!navigator.onLine) return [];
  var filters = OSM_KINDS.map(function(k){
    return 'node["'+k[0]+'"="'+k[1]+'"](around:'+radiusM+','+lat+','+lon+');';
  }).join('');
  var q = '[out:json][timeout:10];('+filters+');out body 40;';
  try{
    var r = await fetch('https://overpass-api.de/api/interpreter', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:'data='+encodeURIComponent(q)
    }).then(function(x){ return x.json(); });
    var items = (r.elements||[]).filter(function(e){ return e.tags && e.tags.name; }).map(function(e){
      var icon='\ud83d\udccd';
      OSM_KINDS.forEach(function(k){ if(e.tags[k[0]]===k[1]) icon=k[2]; });
      return {name:e.tags.name, icon:icon, lat:e.lat, lon:e.lon,
              kind:(e.tags.tourism||e.tags.historic||e.tags.natural||e.tags.leisure||e.tags.amenity||'')};
    });
    /* de-dupe by name, cap the list */
    var seen={}, out=[];
    items.forEach(function(i){ var n=i.name.toLowerCase(); if(!seen[n]){ seen[n]=1; out.push(i); } });
    out = out.slice(0,30);
    lsSet(key, JSON.stringify({at:Date.now(), items:out}));
    return out;
  }catch(e){ return []; }
}
function osmAttractionsHTML(items, placeName){
  if(!items || !items.length) return '';
  var top = items.slice(0,12);
  return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px;margin-bottom:2px">\ud83d\udccd What\u2019s actually there</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:8px">'+items.length+' mapped spots around '+esc2(placeName)+' \u2014 including the ones big apps skip</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px">'
    + top.map(function(i){
        return '<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+i.lat+','+i.lon+'" '
          +'style="font-size:11.5px;padding:5px 10px;border-radius:999px;border:1px solid var(--b2,#2A2A36);color:var(--t2);text-decoration:none">'
          +i.icon+' '+esc2(i.name)+'</a>';
      }).join('')
    +'</div>'
    +'<div style="font-size:9.5px;color:var(--t3);margin-top:8px">Data \u00a9 OpenStreetMap contributors \u00b7 cached offline</div></div>';
}
