// @ts-nocheck
/* trip-footprint.js — Journey Trace V1.
   Opt-in, device-local planned-vs-actual journey recording for a RoamWise itinerary:
   - Start / pause / resume / finish lifecycle
   - foreground GPS trace with accuracy filtering
   - nearby planned-stop suggestions that always require traveller confirmation
   - manual restaurant / stay / discovery check-ins
   - planned-vs-actual map overlay
   - optional Mapbox Outdoors raster basemap when a restricted public token is configured
   - route poster, actual-trip certificate and photo collage
   No tracking starts automatically. Raw location is not uploaded by this module. */
(function(){
'use strict';

var KEY='rw_trip_footprints_v2';
var LEGACY_KEY='rw_trip_footprints_v1';
var activeWatch=null, activeDest='', layers=[], nearbyHits={}, lastPaintAt=0;
var TYPES={stay:'🏨 Stay',food:'🍽️ Food',cafe:'☕ Café',activity:'🎯 Activity',viewpoint:'🌄 Viewpoint',culture:'🏛️ Culture',other:'📍 Place'};

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function safeDest(s){ return String(s||'Trip').trim().slice(0,120) || 'Trip'; }
function readJson(k,fallback){ try{return JSON.parse(localStorage.getItem(k)||'')||fallback;}catch(e){return fallback;} }
function getAll(){
  var all=readJson(KEY,null);
  if(all) return all;
  var legacy=readJson(LEGACY_KEY,{});
  try{ if(Object.keys(legacy).length) localStorage.setItem(KEY,JSON.stringify(legacy)); }catch(e){}
  return legacy;
}
function putAll(v){ try{localStorage.setItem(KEY,JSON.stringify(v));}catch(e){} }
function idFor(dest){ return safeDest(dest).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'trip'; }
function getTrip(dest){
  var all=getAll(), id=idFor(dest), t=all[id];
  if(!t) t={id:id,destination:safeDest(dest),createdAt:Date.now(),updatedAt:Date.now(),startedAt:null,endedAt:null,status:'idle',visits:[],track:[],planned:[],dismissedNearby:{}};
  if(!Array.isArray(t.visits)) t.visits=[];
  if(!Array.isArray(t.track)) t.track=[];
  if(!Array.isArray(t.planned)) t.planned=[];
  if(!t.dismissedNearby) t.dismissedNearby={};
  if(!t.status) t.status=t.endedAt?'finished':(t.track.length?'paused':'idle');
  return t;
}
function saveTrip(t){ var all=getAll(); t.updatedAt=Date.now(); all[t.id]=t; putAll(all); }
function toast(s){ try{showToast(s);}catch(e){} }
function dist(a,b){
  if(!a||!b||typeof a.lat!=='number'||typeof a.lon!=='number'||typeof b.lat!=='number'||typeof b.lon!=='number')return 0;
  if(typeof rwHaversine==='function') return rwHaversine(a.lat,a.lon,b.lat,b.lon);
  var R=6371, p1=a.lat*Math.PI/180, p2=b.lat*Math.PI/180, dp=(b.lat-a.lat)*Math.PI/180, dl=(b.lon-a.lon)*Math.PI/180;
  var h=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
  return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
function tripDistance(t){
  var pts=(t.track&&t.track.length>1)?t.track:t.visits.filter(function(v){return typeof v.lat==='number'&&typeof v.lon==='number';});
  var km=0; for(var i=1;i<pts.length;i++) km+=dist(pts[i-1],pts[i]);
  return km;
}
function visitForPlanned(t,i){ for(var n=t.visits.length-1;n>=0;n--) if(t.visits[n].plannedIndex===i) return t.visits[n]; return null; }
function dateText(ms){ try{return new Date(ms).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});}catch(e){return'';} }
function guessType(name){
  var s=String(name||'').toLowerCase();
  if(/hotel|hostel|homestay|resort|cottage|inn|stay|lodge/.test(s))return'stay';
  if(/cafe|coffee|bakery|tea room/.test(s))return'cafe';
  if(/restaurant|dhaba|kitchen|food|bistro|eatery/.test(s))return'food';
  if(/temple|fort|museum|ashram|monastery|church|palace|heritage/.test(s))return'culture';
  if(/view|peak|top|ridge|sunset|point|lake|waterfall/.test(s))return'viewpoint';
  return'activity';
}
function plannedFor(t,pins){
  var p=(pins&&pins.length)?pins:t.planned;
  return Array.isArray(p)?p:[];
}
function completion(t,pins){
  var p=plannedFor(t,pins); if(!p.length)return 0;
  var done=0; p.forEach(function(_,i){if(visitForPlanned(t,i))done++;});
  return Math.min(100,Math.round(done/p.length*100));
}
function setPlanned(t,pins){
  if(!pins||!pins.length)return;
  t.planned=pins.map(function(p){return{day:p.day||1,name:String(p.name||'').slice(0,140),note:String(p.note||'').slice(0,200),lat:+p.lat,lon:+p.lon};});
}

function ensurePanel(dest,pins){
  var host=document.getElementById('tripMapSection'); if(!host)return;
  activeDest=safeDest(dest);
  var t=getTrip(activeDest); setPlanned(t,pins||[]); saveTrip(t);
  var panel=document.getElementById('rwFootprintPanel');
  if(!panel){ panel=document.createElement('div'); panel.id='rwFootprintPanel'; panel.style.cssText='margin-top:14px;background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.08));border-radius:18px;padding:14px'; host.appendChild(panel); }
  renderPanel(activeDest,pins||window._tripPins||[]);
}

function renderPanel(dest,pins){
  var panel=document.getElementById('rwFootprintPanel'); if(!panel)return;
  var t=getTrip(dest), plan=plannedFor(t,pins), km=tripDistance(t), tracking=activeWatch!=null&&activeDest===dest, pct=completion(t,plan);
  var visited=t.visits.length, pending=t.pendingVisit&&plan[t.pendingVisit.plannedIndex], state=t.status||'idle';
  var primary='';
  if(state==='idle'||state==='finished') primary='<button class="tact" style="font-weight:900;background:linear-gradient(135deg,#F04455,#8B1E2D);color:#fff;border:none" onclick="rwJourneyStart(\''+esc(dest).replace(/&#39;/g,"\\'")+'\')">🔥 '+(state==='finished'?'Start another segment':'Start Journey')+'</button>';
  else if(tracking) primary='<button class="tact" style="font-weight:800" onclick="rwJourneyPause()">⏸ Pause</button><button class="tact" style="font-weight:900;background:#F04455;color:#fff;border:none" onclick="rwJourneyFinish()">✓ Finish Journey</button>';
  else primary='<button class="tact" style="font-weight:900;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwJourneyResume()">▶ Resume</button><button class="tact" onclick="rwJourneyFinish()">✓ Finish</button>';

  var plannedHtml=plan.map(function(p,i){
    var v=visitForPlanned(t,i);
    return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--b1,rgba(255,255,255,.06))"><span style="width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:'+(v?'#F04455':'var(--bg3,#171A24)')+';color:'+(v?'#fff':'var(--t2)')+';font-size:11px;font-weight:800">'+(i+1)+'</span><div style="flex:1;min-width:0"><b style="font-size:12.5px">'+esc(p.name)+'</b><div style="font-size:10.5px;color:var(--t3)">'+(v?'Visited '+esc(dateText(v.at)):'Day '+esc(p.day||1))+'</div></div><button class="tact" style="font-size:10.5px;padding:6px 8px" onclick="rwFootprintVisitPlanned('+i+')">'+(v?'✓ Update':'Check in')+'</button></div>';
  }).join('');
  var recent=t.visits.slice(-6).reverse().map(function(v){return '<div style="font-size:11px;color:var(--t2);padding:4px 0">'+esc(TYPES[v.type]||TYPES.other)+' · <b style="color:var(--t1)">'+esc(v.name)+'</b> · '+esc(dateText(v.at))+'</div>';}).join('');
  var pendingHtml=pending?'<div style="margin:10px 0;padding:12px;border-radius:14px;border:1px solid rgba(240,68,85,.55);background:rgba(240,68,85,.09)"><div style="font-size:10px;font-weight:900;color:#FF697A;letter-spacing:.06em">NEARBY STOP</div><div style="font-size:14px;font-weight:800;margin:3px 0">Looks like you are at '+esc(pending.name)+'</div><div style="font-size:11px;color:var(--t3)">RoamWise never checks you in automatically. Confirm only if you actually visited.</div><div style="display:flex;gap:7px;margin-top:8px"><button class="tact" style="background:#F04455;color:white;border:none;font-weight:800" onclick="rwFootprintConfirmNearby()">✓ Add visit</button><button class="tact" onclick="rwFootprintDismissNearby()">Not here</button></div></div>':'';

  panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><div style="font-size:10px;color:#FF697A;font-weight:900;letter-spacing:.09em">ROAMWISE · JOURNEY TRACE</div><h3 style="margin:3px 0;font-size:20px">Your plan fades. Your real trail lights up.</h3><div style="font-size:11px;color:var(--t3)">Opt-in foreground GPS only · raw trail stays on this device by default.</div><div style="display:flex;gap:12px;margin-top:7px;font-size:10.5px;color:var(--t2)"><span><b style="color:#E8BA6C">┈┈</b> planned</span><span><b style="color:#F04455">━━</b> actual</span><span>● confirmed visit</span></div></div><div style="display:flex;gap:7px;flex-wrap:wrap">'+primary+'</div></div>'
    +'<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0"><div class="note" style="padding:9px;text-align:center"><b>'+visited+'</b><br><span style="font-size:10px">check-ins</span></div><div class="note" style="padding:9px;text-align:center"><b>'+km.toFixed(km<10?1:0)+' km</b><br><span style="font-size:10px">actual trail</span></div><div class="note" style="padding:9px;text-align:center"><b>'+pct+'%</b><br><span style="font-size:10px">plan done</span></div><div class="note" style="padding:9px;text-align:center"><b>'+t.track.length+'</b><br><span style="font-size:10px">GPS points</span></div></div>'
    +'<div style="height:6px;background:var(--bg3,#171A24);border-radius:999px;overflow:hidden;margin-bottom:10px"><span style="display:block;width:'+pct+'%;height:100%;background:linear-gradient(90deg,#E8BA6C,#F04455,#A78BFA)"></span></div>'
    +pendingHtml
    +(plannedHtml?'<details open><summary style="cursor:pointer;font-size:12px;font-weight:800">Planned stops</summary><div>'+plannedHtml+'</div></details>':'')
    +'<details style="margin-top:10px"><summary style="cursor:pointer;font-size:12px;font-weight:800">Add a restaurant, stay or unexpected discovery</summary><div style="display:grid;grid-template-columns:1.2fr .8fr;gap:8px;margin-top:9px"><input id="rwFpName" placeholder="Place name" style="min-width:0;background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:9px;padding:9px;color:var(--t1)"><select id="rwFpType" style="background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:9px;padding:9px;color:var(--t1)">'+Object.keys(TYPES).map(function(k){return '<option value="'+k+'">'+TYPES[k]+'</option>';}).join('')+'</select></div><input id="rwFpNote" placeholder="Optional memory — food, host, music, event, feeling…" style="width:100%;margin-top:8px;background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:9px;padding:9px;color:var(--t1)"><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px"><button class="tact" onclick="rwFootprintManual(false)">Add without GPS</button><button class="tact" onclick="rwFootprintManual(true)">📍 Add with current GPS</button></div></details>'
    +(recent?'<div style="margin-top:10px"><div style="font-size:10px;color:var(--t3);font-weight:800">RECENT CONFIRMED VISITS</div>'+recent+'</div>':'')
    +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px"><button class="tact" onclick="rwFootprintPoster()">🖼️ Journey picture</button><button class="tact" onclick="rwFootprintCertificate()">🏅 Completion certificate</button><label class="tact" style="cursor:pointer">📸 Photo + route collage<input type="file" accept="image/*" multiple style="display:none" onchange="rwFootprintCollage(this.files)"></label><button class="tact" onclick="rwFootprintClear()">Reset footprint</button></div>';
  paintRoute(t);
}

function currentPosition(cb){
  if(!navigator.geolocation){toast('Location is not available on this device');return;}
  navigator.geolocation.getCurrentPosition(function(p){cb({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,at:Date.now()});},function(e){toast(e&&e.code===1?'Location permission was not granted':'Could not get current location');},{enableHighAccuracy:true,timeout:15000,maximumAge:7000});
}
function addVisit(v){
  var t=getTrip(activeDest);
  if(v.plannedIndex!=null){
    for(var i=t.visits.length-1;i>=0;i--) if(t.visits[i].plannedIndex===v.plannedIndex){t.visits.splice(i,1);break;}
  }
  t.visits.push(v); t.pendingVisit=null; saveTrip(t); renderPanel(activeDest,window._tripPins||t.planned||[]);
}
window.rwFootprintVisitPlanned=function(i){
  var t=getTrip(activeDest), p=(window._tripPins||t.planned||[])[i]; if(!p)return;
  currentPosition(function(g){ addVisit({plannedIndex:i,name:p.name,type:guessType(p.name),note:p.note||'',lat:g.lat,lon:g.lon,accuracy:g.accuracy,at:Date.now()}); toast('Confirmed: '+p.name+' ✓'); });
};
window.rwFootprintManual=function(withGps){
  var n=document.getElementById('rwFpName'), ty=document.getElementById('rwFpType'), no=document.getElementById('rwFpNote'); var name=n&&n.value.trim(); if(!name){toast('Add a place name first');return;}
  var base={name:name.slice(0,120),type:(ty&&ty.value)||'other',note:(no&&no.value||'').trim().slice(0,300),at:Date.now()};
  function done(g){if(g)Object.assign(base,g);addVisit(base);if(n)n.value='';if(no)no.value='';toast('Added to your Journey Trace');}
  if(withGps)currentPosition(done);else done(null);
};

function nearbySuggestion(t,pt){
  var plan=plannedFor(t,window._tripPins||[]);
  if(!plan.length||pt.accuracy>120||t.pendingVisit)return;
  var now=Date.now();
  for(var i=0;i<plan.length;i++){
    if(visitForPlanned(t,i))continue;
    if(t.dismissedNearby[i]&&now-t.dismissedNearby[i]<30*60*1000)continue;
    var d=dist(pt,plan[i]);
    if(d<=0.12) nearbyHits[i]=(nearbyHits[i]||0)+1; else nearbyHits[i]=0;
    if(nearbyHits[i]>=2){
      t.pendingVisit={plannedIndex:i,lat:pt.lat,lon:pt.lon,accuracy:pt.accuracy,at:now};
      saveTrip(t); toast('Near '+plan[i].name+' — confirm it if you visited'); break;
    }
  }
}
window.rwFootprintConfirmNearby=function(){
  var t=getTrip(activeDest), q=t.pendingVisit, plan=plannedFor(t,window._tripPins||[]);
  if(!q||!plan[q.plannedIndex])return;
  var p=plan[q.plannedIndex];
  addVisit({plannedIndex:q.plannedIndex,name:p.name,type:guessType(p.name),note:p.note||'',lat:q.lat,lon:q.lon,accuracy:q.accuracy,at:Date.now()});
  toast('Added '+p.name+' to your journey');
};
window.rwFootprintDismissNearby=function(){
  var t=getTrip(activeDest), q=t.pendingVisit;if(!q)return;
  t.dismissedNearby[q.plannedIndex]=Date.now();t.pendingVisit=null;saveTrip(t);renderPanel(activeDest,window._tripPins||t.planned||[]);
};

function recordPosition(p){
  if(!activeDest)return;
  var t=getTrip(activeDest), pt={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,altitude:p.coords.altitude,speed:p.coords.speed,at:Date.now()};
  if(!isFinite(pt.lat)||!isFinite(pt.lon)||(pt.accuracy!=null&&pt.accuracy>120))return;
  var last=t.track[t.track.length-1];
  if(last){
    var dt=pt.at-last.at, d=dist(last,pt);
    if(dt<12000&&d<0.03)return;
    if(dt<30000&&d>1.5)return;
  }
  t.track.push(pt); if(t.track.length>1800)t.track=t.track.slice(-1800);
  t.status='active'; saveTrip(t); nearbySuggestion(t,pt);
  if(Date.now()-lastPaintAt>2500){lastPaintAt=Date.now();renderPanel(activeDest,window._tripPins||t.planned||[]);}
}
function startWatch(dest){
  activeDest=safeDest(dest);
  if(activeWatch!=null)return;
  var t=getTrip(activeDest); if(!t.startedAt)t.startedAt=Date.now(); t.endedAt=null;t.status='active';saveTrip(t);
  if(!navigator.geolocation){t.status='paused';saveTrip(t);toast('Location is unavailable — you can still check in manually');renderPanel(activeDest,window._tripPins||t.planned||[]);return;}
  activeWatch=navigator.geolocation.watchPosition(recordPosition,function(e){
    if(e&&e.code===1){try{navigator.geolocation.clearWatch(activeWatch);}catch(_){}activeWatch=null;var tt=getTrip(activeDest);tt.status='paused';saveTrip(tt);toast('Location permission was not granted — manual check-ins still work');renderPanel(activeDest,window._tripPins||tt.planned||[]);}
  },{enableHighAccuracy:true,maximumAge:8000,timeout:20000});
  renderPanel(activeDest,window._tripPins||t.planned||[]); toast('Journey Trace started — your real route will light up');
}
function stopWatch(finish){
  if(activeWatch!=null){try{navigator.geolocation.clearWatch(activeWatch);}catch(e){}activeWatch=null;}
  var t=getTrip(activeDest);t.status=finish?'finished':'paused';if(finish)t.endedAt=Date.now();saveTrip(t);renderPanel(activeDest,window._tripPins||t.planned||[]);
}
window.rwJourneyStart=function(dest){
  dest=safeDest(dest||(window._lastItin&&_lastItin.name)||'Trip');activeDest=dest;
  var t=getTrip(dest);if(t.status==='finished'){t.endedAt=null;t.startedAt=Date.now();}setPlanned(t,window._tripPins||[]);saveTrip(t);
  if(typeof openTripMap==='function')openTripMap(dest,null);
  startWatch(dest);
};
window.rwStartJourney=window.rwJourneyStart;
window.rwJourneyPause=function(){if(!activeDest)return;stopWatch(false);toast('Journey paused — your saved footprint is safe');};
window.rwJourneyResume=function(){if(!activeDest)return;startWatch(activeDest);};
window.rwJourneyFinish=function(){if(!activeDest)return;stopWatch(true);toast('Journey complete — make your picture, certificate or collage below ✨');};
window.rwFootprintToggleWalk=function(){if(activeWatch!=null)window.rwJourneyPause();else startWatch(activeDest||(window._lastItin&&_lastItin.name)||'Trip');};

function clearLayers(){ if(typeof _tripMap==='undefined'||!_tripMap)return;layers.forEach(function(l){try{_tripMap.removeLayer(l);}catch(e){}});layers=[]; }
function paintRoute(t){
  if(typeof L==='undefined'||typeof _tripMap==='undefined'||!_tripMap)return;clearLayers();
  var pts=t.track&&t.track.length?t.track:t.visits.filter(function(v){return typeof v.lat==='number'&&typeof v.lon==='number';});
  if(pts.length>1){
    var ll=pts.map(function(p){return[p.lat,p.lon];});
    layers.push(L.polyline(ll,{color:'#F04455',weight:10,opacity:.16,lineCap:'round'}).addTo(_tripMap));
    layers.push(L.polyline(ll,{color:'#FF4D67',weight:4.5,opacity:.95,lineCap:'round'}).addTo(_tripMap));
  }
  t.visits.forEach(function(v){
    if(typeof v.lat!=='number'||typeof v.lon!=='number')return;
    var ic=L.divIcon({className:'',html:'<div style="width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#F04455;border:2px solid white;color:white;font-size:11px;font-weight:900;box-shadow:0 0 0 5px rgba(240,68,85,.16)">✓</div>',iconSize:[23,23],iconAnchor:[11,11]});
    layers.push(L.marker([v.lat,v.lon],{icon:ic}).addTo(_tripMap).bindPopup('<b>'+esc(v.name)+'</b><br><span>'+esc(TYPES[v.type]||TYPES.other)+'</span>'));
  });
}
function mapboxConfig(){
  var m=(window.RW_CONFIG&&window.RW_CONFIG.maps)||{};
  return{token:String(m.mapboxPublicToken||''),style:String(m.mapboxStyle||'mapbox/outdoors-v12').replace(/^mapbox:\/\/styles\//,'')};
}
function maybeInstallMapboxBase(){
  var c=mapboxConfig();
  if(!c.token||typeof L==='undefined'||typeof _tripMap==='undefined'||!_tripMap||typeof _tripMapLayers==='undefined'||!_tripMapLayers||_tripMapLayers.__rwMapbox)return;
  try{
    var u='https://api.mapbox.com/styles/v1/'+c.style+'/tiles/512/{z}/{x}/{y}@2x?access_token='+encodeURIComponent(c.token);
    var mb=L.tileLayer(u,{tileSize:512,zoomOffset:-1,maxZoom:20,attribution:'© Mapbox © OpenStreetMap'});
    if(typeof _tripMapMode!=='undefined'&&_tripMapMode==='streets'){try{_tripMap.removeLayer(_tripMapLayers.streets);}catch(e){}mb.addTo(_tripMap);}
    _tripMapLayers.streets=mb;_tripMapLayers.__rwMapbox=true;
  }catch(e){}
}

window.rwFootprintClear=function(){
  if(!activeDest)return;if(!confirm('Reset this journey footprint on this device?'))return;
  if(activeWatch!=null){try{navigator.geolocation.clearWatch(activeWatch);}catch(e){}activeWatch=null;}
  var all=getAll();delete all[idFor(activeDest)];putAll(all);clearLayers();nearbyHits={};renderPanel(activeDest,window._tripPins||[]);
};
window.rwFootprintStops=function(dest){
  var t=getTrip(dest);return t.visits.filter(function(v){return v.name;}).map(function(v,i){return{day:i+1,name:v.name,note:(TYPES[v.type]||'Visited')+(v.note?' · '+v.note:'')}});
};

function canvasBase(title,sub){
  var c=document.createElement('canvas');c.width=1600;c.height=2000;var x=c.getContext('2d'),g=x.createLinearGradient(0,0,1600,2000);
  g.addColorStop(0,'#07090f');g.addColorStop(.55,'#12151f');g.addColorStop(1,'#240d12');x.fillStyle=g;x.fillRect(0,0,1600,2000);
  x.strokeStyle='#E8BA6C';x.lineWidth=4;x.strokeRect(44,44,1512,1912);x.fillStyle='#FF697A';x.font='700 34px Arial';x.fillText('ROAMWISE · JOURNEY TRACE',86,118);
  x.fillStyle='#fff';x.font='700 72px Georgia';wrap(x,title,86,220,1420,82,2);x.fillStyle='#A9A59C';x.font='28px Arial';wrap(x,sub,86,390,1420,40,2);return[c,x];
}
function wrap(x,s,left,top,max,line,maxLines){var words=String(s||'').split(/\s+/),row='',n=0;for(var i=0;i<words.length&&n<maxLines;i++){var test=row?row+' '+words[i]:words[i];if(x.measureText(test).width>max&&row){x.fillText(row,left,top+n*line);row=words[i];n++;}else row=test;}if(row&&n<maxLines)x.fillText(row,left,top+n*line);}
function saveCanvas(c,name){var data=c.toDataURL('image/png');try{if(typeof saveOrDownload==='function')return saveOrDownload(data,name);}catch(e){}var a=document.createElement('a');a.href=data;a.download=name;document.body.appendChild(a);a.click();a.remove();}
function summary(t){var counts={};t.visits.forEach(function(v){counts[v.type]=(counts[v.type]||0)+1;});return Object.keys(counts).map(function(k){return(TYPES[k]||k)+' '+counts[k];}).join('   ·   ');}
function routePoints(t){return(t.track&&t.track.length>1)?t.track:t.visits.filter(function(v){return typeof v.lat==='number'&&typeof v.lon==='number';});}
function drawRouteArt(x,t,bx,by,bw,bh){
  var actual=routePoints(t),planned=(t.planned||[]).filter(function(p){return isFinite(p.lat)&&isFinite(p.lon);}),all=actual.concat(planned);
  x.save();x.fillStyle='#090c14';x.fillRect(bx,by,bw,bh);x.strokeStyle='rgba(255,255,255,.06)';x.lineWidth=1;
  for(var gx=bx;gx<=bx+bw;gx+=Math.max(60,bw/8)){x.beginPath();x.moveTo(gx,by);x.lineTo(gx,by+bh);x.stroke();}
  for(var gy=by;gy<=by+bh;gy+=Math.max(60,bh/6)){x.beginPath();x.moveTo(bx,gy);x.lineTo(bx+bw,gy);x.stroke();}
  if(all.length<2){x.fillStyle='#777';x.font='22px Arial';x.textAlign='center';x.fillText('Record GPS points to draw your real footprint',bx+bw/2,by+bh/2);x.restore();return;}
  var minLat=Math.min.apply(null,all.map(function(p){return p.lat;})),maxLat=Math.max.apply(null,all.map(function(p){return p.lat;})),minLon=Math.min.apply(null,all.map(function(p){return p.lon;})),maxLon=Math.max.apply(null,all.map(function(p){return p.lon;}));
  if(maxLat-minLat<.001){maxLat+=.001;minLat-=.001;}if(maxLon-minLon<.001){maxLon+=.001;minLon-=.001;}
  function xy(p){return[bx+35+(p.lon-minLon)/(maxLon-minLon)*(bw-70),by+35+(maxLat-p.lat)/(maxLat-minLat)*(bh-70)];}
  if(planned.length>1){x.setLineDash([12,14]);x.strokeStyle='#E8BA6C';x.globalAlpha=.65;x.lineWidth=4;x.beginPath();planned.forEach(function(p,i){var q=xy(p);if(i)x.lineTo(q[0],q[1]);else x.moveTo(q[0],q[1]);});x.stroke();x.setLineDash([]);x.globalAlpha=1;}
  if(actual.length>1){x.strokeStyle='rgba(240,68,85,.22)';x.lineWidth=16;x.lineCap='round';x.beginPath();actual.forEach(function(p,i){var q=xy(p);if(i)x.lineTo(q[0],q[1]);else x.moveTo(q[0],q[1]);});x.stroke();x.strokeStyle='#FF4D67';x.lineWidth=6;x.beginPath();actual.forEach(function(p,i){var q=xy(p);if(i)x.lineTo(q[0],q[1]);else x.moveTo(q[0],q[1]);});x.stroke();}
  t.visits.forEach(function(v){if(!isFinite(v.lat)||!isFinite(v.lon))return;var q=xy(v);x.fillStyle='#fff';x.beginPath();x.arc(q[0],q[1],8,0,Math.PI*2);x.fill();x.fillStyle='#F04455';x.beginPath();x.arc(q[0],q[1],5,0,Math.PI*2);x.fill();});
  x.restore();
}
window.rwFootprintPoster=function(){
  var t=getTrip(activeDest);if(!t.visits.length&&!t.track.length){toast('Record at least one check-in or journey segment first');return;}
  var z=canvasBase(t.destination,t.visits.length+' confirmed places · '+tripDistance(t).toFixed(1)+' km · '+completion(t,t.planned)+'% of plan completed'),c=z[0],x=z[1];
  drawRouteArt(x,t,86,500,1428,650);
  x.fillStyle='rgba(232,186,108,.08)';x.fillRect(86,1180,1428,170);x.fillStyle='#E8BA6C';x.font='700 40px Arial';x.fillText(tripDistance(t).toFixed(1)+' km',120,1255);x.fillText(String(t.visits.length),600,1255);x.fillText(completion(t,t.planned)+'%',1040,1255);x.fillStyle='#A9A59C';x.font='22px Arial';x.fillText('ACTUAL TRAIL',120,1298);x.fillText('CONFIRMED STOPS',600,1298);x.fillText('PLAN COMPLETED',1040,1298);
  x.fillStyle='#fff';x.font='700 28px Arial';x.fillText('PLACES YOU ACTUALLY ADDED',86,1430);var y=1485;t.visits.slice(0,8).forEach(function(v,i){x.fillStyle='#FF697A';x.font='700 24px Arial';x.fillText((i+1)+'. '+v.name,100,y);x.fillStyle='#A9A59C';x.font='18px Arial';x.fillText((TYPES[v.type]||TYPES.other)+' · '+dateText(v.at),120,y+28);y+=62;});x.fillStyle='#E8BA6C';x.font='21px Arial';wrap(x,summary(t),86,1900,1420,30,2);saveCanvas(c,'roamwise-'+idFor(t.destination)+'-journey-trace.png');
};
window.rwFootprintCertificate=function(){
  var t=getTrip(activeDest);if(!t.visits.length){toast('Confirm at least one place first');return;}
  var name=(localStorage.getItem('rw_name')||((window.user&&user.displayName)||'A Traveler')).slice(0,50),z=canvasBase('Journey Completion Certificate',name+' · '+t.destination),c=z[0],x=z[1];
  x.textAlign='center';x.fillStyle='#E8BA6C';x.font='700 38px Georgia';x.fillText('TRAVELLER-RECORDED JOURNEY',800,520);drawRouteArt(x,t,180,590,1240,570);
  x.fillStyle='#fff';x.font='700 62px Georgia';x.fillText(t.destination,800,1250);x.fillStyle='#A9A59C';x.font='27px Arial';x.fillText(t.visits.length+' confirmed stops · '+tripDistance(t).toFixed(1)+' km recorded · '+completion(t,t.planned)+'% itinerary completed',800,1305);
  x.textAlign='left';var y=1400;t.visits.slice(0,6).forEach(function(v){x.fillStyle='#FF697A';x.font='700 24px Arial';x.fillText('✓ '+v.name,240,y);x.fillStyle='#A9A59C';x.font='18px Arial';x.fillText((TYPES[v.type]||TYPES.other)+' · '+dateText(v.at),270,y+28);y+=68;});
  x.textAlign='center';x.fillStyle='#E8BA6C';x.font='700 27px Georgia';x.fillText('ROAMWISE JOURNEY TRACE',800,1860);x.fillStyle='#89867e';x.font='17px Arial';x.fillText('Generated from traveller-confirmed check-ins and optional device GPS; not independent proof of presence.',800,1904);saveCanvas(c,'roamwise-'+idFor(t.destination)+'-certificate.png');
};
window.rwFootprintCollage=function(files){
  files=Array.prototype.slice.call(files||[]).slice(0,5);if(!files.length)return;var t=getTrip(activeDest);
  Promise.all(files.map(function(f){return new Promise(function(resolve){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){resolve(im);};im.onerror=function(){resolve(null);};im.src=r.result;};r.onerror=function(){resolve(null);};r.readAsDataURL(f);});})).then(function(imgs){
    imgs=imgs.filter(Boolean);if(!imgs.length){toast('Could not read those photos');return;}var c=document.createElement('canvas');c.width=1800;c.height=2200;var x=c.getContext('2d');x.fillStyle='#07090f';x.fillRect(0,0,c.width,c.height);x.fillStyle='#FF697A';x.font='700 32px Arial';x.fillText('ROAMWISE · '+t.destination.toUpperCase(),70,82);
    var cells=[[70,130,1080,740],[1180,130,550,355],[1180,515,550,355],[70,900,780,520],[880,900,850,520]];
    imgs.forEach(function(im,i){var b=cells[i],ir=im.width/im.height,tr=b[2]/b[3],sx=0,sy=0,sw=im.width,sh=im.height;if(ir>tr){sw=im.height*tr;sx=(im.width-sw)/2;}else{sh=im.width/tr;sy=(im.height-sh)/2;}x.drawImage(im,sx,sy,sw,sh,b[0],b[1],b[2],b[3]);x.strokeStyle='#161a24';x.lineWidth=8;x.strokeRect(b[0],b[1],b[2],b[3]);});
    drawRouteArt(x,t,70,1470,1660,500);x.fillStyle='rgba(7,9,15,.84)';x.fillRect(70,2000,1660,130);x.fillStyle='#fff';x.font='700 30px Arial';x.fillText(t.visits.length+' places · '+tripDistance(t).toFixed(1)+' km · '+completion(t,t.planned)+'% completed',100,2060);x.fillStyle='#A9A59C';x.font='20px Arial';x.fillText('My actual journey, not just my itinerary · roamwise.co.in',100,2103);saveCanvas(c,'roamwise-'+idFor(t.destination)+'-photo-route-collage.png');
  });
};

if(typeof window.rwPaintTripMap==='function'){
  var basePaint=window.rwPaintTripMap;
  window.rwPaintTripMap=function(dest,data){var out=basePaint.apply(this,arguments);try{maybeInstallMapboxBase();ensurePanel(dest,(data&&data.pins)||window._tripPins||[]);}catch(e){}return out;};
}
window.openTripFootprint=function(dest){
  dest=safeDest(dest||(window._lastItin&&_lastItin.name)||'Trip');activeDest=dest;
  if(!document.getElementById('tripMapSection')&&typeof openTripMap==='function'){openTripMap(dest,null);return;}
  ensurePanel(dest,window._tripPins||getTrip(dest).planned||[]);try{document.getElementById('rwFootprintPanel').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
};
window.addEventListener('pagehide',function(){if(activeWatch!=null){try{navigator.geolocation.clearWatch(activeWatch);}catch(e){}activeWatch=null;}});
})();