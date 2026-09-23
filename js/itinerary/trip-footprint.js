// @ts-nocheck
/* trip-footprint.js — opt-in, device-local journey footprint for a planned trip.
   Adds visited-stop check-ins, optional GPS walking trace, actual-route overlay,
   a shareable journey poster, an actual-journey certificate and a photo collage.
   No background tracking starts automatically and no location is sent to RoamWise. */
(function(){
'use strict';

var KEY='rw_trip_footprints_v1';
var activeWatch=null, activeDest='', layers=[];
var TYPES={stay:'🏨 Stay',food:'🍽️ Food',cafe:'☕ Café',activity:'🎯 Activity',viewpoint:'🌄 Viewpoint',culture:'🏛️ Culture',other:'📍 Place'};

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function safeDest(s){ return String(s||'Trip').trim().slice(0,120) || 'Trip'; }
function getAll(){ try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return{};} }
function putAll(v){ try{localStorage.setItem(KEY,JSON.stringify(v));}catch(e){} }
function idFor(dest){ return safeDest(dest).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'trip'; }
function getTrip(dest){
  var all=getAll(), id=idFor(dest), t=all[id];
  if(!t) t={id:id,destination:safeDest(dest),createdAt:Date.now(),updatedAt:Date.now(),visits:[],track:[]};
  if(!Array.isArray(t.visits)) t.visits=[]; if(!Array.isArray(t.track)) t.track=[];
  return t;
}
function saveTrip(t){ var all=getAll(); t.updatedAt=Date.now(); all[t.id]=t; putAll(all); }
function toast(s){ try{showToast(s);}catch(e){} }
function dist(a,b){
  if(!a||!b||typeof a.lat!=='number'||typeof a.lon!=='number'||typeof b.lat!=='number'||typeof b.lon!=='number')return 0;
  if(typeof rwHaversine==='function') return rwHaversine(a.lat,a.lon,b.lat,b.lon);
  var R=6371, p1=a.lat*Math.PI/180, p2=b.lat*Math.PI/180, dp=(b.lat-a.lat)*Math.PI/180, dl=(b.lon-a.lon)*Math.PI/180;
  var x=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function tripDistance(t){ var pts=(t.track&&t.track.length>1)?t.track:t.visits.filter(function(v){return typeof v.lat==='number'&&typeof v.lon==='number';}); var km=0; for(var i=1;i<pts.length;i++)km+=dist(pts[i-1],pts[i]); return km; }
function visitForPlanned(t,i){ for(var n=t.visits.length-1;n>=0;n--) if(t.visits[n].plannedIndex===i) return t.visits[n]; return null; }
function dateText(ms){ try{return new Date(ms).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});}catch(e){return'';} }

function ensurePanel(dest,pins){
  var host=document.getElementById('tripMapSection'); if(!host)return;
  activeDest=safeDest(dest);
  var panel=document.getElementById('rwFootprintPanel');
  if(!panel){ panel=document.createElement('div'); panel.id='rwFootprintPanel'; panel.style.cssText='margin-top:14px;background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.08));border-radius:18px;padding:14px'; host.appendChild(panel); }
  renderPanel(activeDest,pins||window._tripPins||[]);
}

function renderPanel(dest,pins){
  var panel=document.getElementById('rwFootprintPanel'); if(!panel)return;
  var t=getTrip(dest), km=tripDistance(t), walking=activeWatch!=null;
  var visited=t.visits.length, planned=pins.length, completion=planned?Math.min(100,Math.round((pins.filter(function(_,i){return !!visitForPlanned(t,i);}).length/planned)*100)):0;
  var plannedHtml=pins.map(function(p,i){ var v=visitForPlanned(t,i); return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--b1,rgba(255,255,255,.06))"><span style="width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:'+(v?'#4ADE80':'var(--bg3,#171A24)')+';color:'+(v?'#08110b':'var(--t2)')+';font-size:11px;font-weight:800">'+(i+1)+'</span><div style="flex:1;min-width:0"><b style="font-size:12.5px">'+esc(p.name)+'</b><div style="font-size:10.5px;color:var(--t3)">'+(v?'Visited '+esc(dateText(v.at)):'Day '+esc(p.day||1))+'</div></div><button class="tact" style="font-size:10.5px;padding:6px 8px" onclick="rwFootprintVisitPlanned('+i+')">'+(v?'✓ Update':'Mark visited')+'</button></div>'; }).join('');
  var recent=t.visits.slice(-6).reverse().map(function(v){return '<div style="font-size:11px;color:var(--t2);padding:4px 0">'+esc(TYPES[v.type]||TYPES.other)+' · <b style="color:var(--t1)">'+esc(v.name)+'</b> · '+esc(dateText(v.at))+'</div>';}).join('');
  panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><div style="font-size:10px;color:var(--gold,#E8BA6C);font-weight:800;letter-spacing:.08em">LIVE JOURNEY FOOTPRINT</div><h3 style="margin:3px 0 3px;font-size:20px">Walk it. Check in. Keep the story.</h3><div style="font-size:11px;color:var(--t3)">Location is recorded only after you opt in and stays on this device by default.</div></div><button class="tact" style="font-weight:800;background:'+(walking?'#F87171':'linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E))')+';color:'+(walking?'#fff':'#0A0A0C')+';border:none" onclick="rwFootprintToggleWalk()">'+(walking?'■ Stop walking trace':'▶ Start walking trace')+'</button></div>'
    +'<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0"><div class="note" style="padding:9px;text-align:center"><b>'+visited+'</b><br><span style="font-size:10px">check-ins</span></div><div class="note" style="padding:9px;text-align:center"><b>'+km.toFixed(km<10?1:0)+' km</b><br><span style="font-size:10px">recorded</span></div><div class="note" style="padding:9px;text-align:center"><b>'+completion+'%</b><br><span style="font-size:10px">plan done</span></div><div class="note" style="padding:9px;text-align:center"><b>'+t.track.length+'</b><br><span style="font-size:10px">GPS points</span></div></div>'
    +'<div style="height:5px;background:var(--bg3,#171A24);border-radius:999px;overflow:hidden;margin-bottom:12px"><span style="display:block;width:'+completion+'%;height:100%;background:linear-gradient(90deg,#E8BA6C,#4ADE80)"></span></div>'
    +(plannedHtml?'<details open><summary style="cursor:pointer;font-size:12px;font-weight:800">Planned stops</summary><div>'+plannedHtml+'</div></details>':'')
    +'<details style="margin-top:10px"><summary style="cursor:pointer;font-size:12px;font-weight:800">Add a restaurant, stay or discovery</summary><div style="display:grid;grid-template-columns:1.2fr .8fr;gap:8px;margin-top:9px"><input id="rwFpName" placeholder="Place name" style="min-width:0;background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:9px;padding:9px;color:var(--t1)"><select id="rwFpType" style="background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:9px;padding:9px;color:var(--t1)">'+Object.keys(TYPES).map(function(k){return '<option value="'+k+'">'+TYPES[k]+'</option>';}).join('')+'</select></div><input id="rwFpNote" placeholder="Optional note — what made it memorable?" style="width:100%;margin-top:8px;background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:9px;padding:9px;color:var(--t1)"><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px"><button class="tact" onclick="rwFootprintManual(false)">Add without GPS</button><button class="tact" onclick="rwFootprintManual(true)">📍 Add with current GPS</button></div></details>'
    +(recent?'<div style="margin-top:10px"><div style="font-size:10px;color:var(--t3);font-weight:800">RECENT CHECK-INS</div>'+recent+'</div>':'')
    +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px"><button class="tact" onclick="rwFootprintPoster()">🖼️ Journey poster</button><button class="tact" onclick="rwFootprintCertificate()">🏅 Actual-trip certificate</button><label class="tact" style="cursor:pointer">📸 Photo collage<input type="file" accept="image/*" multiple style="display:none" onchange="rwFootprintCollage(this.files)"></label><button class="tact" onclick="rwFootprintClear()">Reset footprint</button></div>';
  paintRoute(t);
}

function addVisit(v){ var t=getTrip(activeDest); t.visits.push(v); saveTrip(t); renderPanel(activeDest,window._tripPins||[]); }
function currentPosition(cb){
  if(!navigator.geolocation){toast('Location is not available on this device');return;}
  navigator.geolocation.getCurrentPosition(function(p){cb({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy});},function(e){toast(e&&e.code===1?'Location permission was not granted':'Could not get current location');},{enableHighAccuracy:true,timeout:15000,maximumAge:10000});
}
window.rwFootprintVisitPlanned=function(i){ var p=(window._tripPins||[])[i]; if(!p)return; currentPosition(function(g){ addVisit({plannedIndex:i,name:p.name,type:guessType(p.name),note:p.note||'',lat:g.lat,lon:g.lon,accuracy:g.accuracy,at:Date.now()}); toast('Visited: '+p.name+' ✓'); }); };
window.rwFootprintManual=function(withGps){
  var n=document.getElementById('rwFpName'), ty=document.getElementById('rwFpType'), no=document.getElementById('rwFpNote'); var name=n&&n.value.trim(); if(!name){toast('Add a place name first');return;}
  var base={name:name.slice(0,120),type:(ty&&ty.value)||'other',note:(no&&no.value||'').trim().slice(0,300),at:Date.now()};
  function done(g){if(g)Object.assign(base,g);addVisit(base); if(n)n.value='';if(no)no.value='';toast('Added to your journey footprint');}
  if(withGps)currentPosition(done);else done(null);
};
function guessType(name){ var s=String(name||'').toLowerCase(); if(/hotel|hostel|homestay|resort|cottage|inn|stay/.test(s))return'stay'; if(/cafe|coffee|bakery/.test(s))return'cafe'; if(/restaurant|dhaba|kitchen|food|bistro/.test(s))return'food'; if(/temple|fort|museum|ashram|monastery|church|palace/.test(s))return'culture'; if(/view|peak|top|ridge|sunset|point/.test(s))return'viewpoint'; return'activity'; }

window.rwFootprintToggleWalk=function(){
  if(activeWatch!=null){ try{navigator.geolocation.clearWatch(activeWatch);}catch(e){} activeWatch=null; renderPanel(activeDest,window._tripPins||[]); toast('Walking trace stopped'); return; }
  if(!navigator.geolocation){toast('Location is not available on this device');return;}
  toast('Walking trace started — stop it when you finish this segment');
  activeWatch=navigator.geolocation.watchPosition(function(p){
    var t=getTrip(activeDest), pt={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,at:Date.now()}, last=t.track[t.track.length-1];
    if(last && pt.at-last.at<12000 && dist(last,pt)<0.03)return;
    t.track.push(pt); if(t.track.length>1200)t.track=t.track.slice(-1200); saveTrip(t); renderPanel(activeDest,window._tripPins||[]);
  },function(e){ if(e&&e.code===1){try{navigator.geolocation.clearWatch(activeWatch);}catch(_){} activeWatch=null;toast('Location permission was not granted');renderPanel(activeDest,window._tripPins||[]);} },{enableHighAccuracy:true,maximumAge:12000,timeout:20000});
};

function clearLayers(){ if(typeof _tripMap==='undefined'||!_tripMap)return; layers.forEach(function(l){try{_tripMap.removeLayer(l);}catch(e){}}); layers=[]; }
function paintRoute(t){
  if(typeof L==='undefined'||typeof _tripMap==='undefined'||!_tripMap)return; clearLayers();
  var pts=t.track&&t.track.length?t.track:t.visits.filter(function(v){return typeof v.lat==='number'&&typeof v.lon==='number';});
  if(pts.length>1){ var ln=L.polyline(pts.map(function(p){return[p.lat,p.lon];}),{color:'#4ADE80',weight:4,opacity:.85}).addTo(_tripMap); layers.push(ln); }
  t.visits.forEach(function(v){if(typeof v.lat!=='number'||typeof v.lon!=='number')return; var ic=L.divIcon({className:'',html:'<div style="width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#4ADE80;border:2px solid white;color:#07120b;font-size:11px;font-weight:900">✓</div>',iconSize:[22,22],iconAnchor:[11,11]}); var m=L.marker([v.lat,v.lon],{icon:ic}).addTo(_tripMap).bindPopup('<b>'+esc(v.name)+'</b><br><span>'+esc(TYPES[v.type]||TYPES.other)+'</span>');layers.push(m);});
}

window.rwFootprintClear=function(){ if(!activeDest)return; if(!confirm('Reset this trip footprint on this device?'))return; var all=getAll(); delete all[idFor(activeDest)]; putAll(all); clearLayers(); renderPanel(activeDest,window._tripPins||[]); };
window.rwFootprintStops=function(dest){ var t=getTrip(dest), a=t.visits.filter(function(v){return v.name;}).map(function(v,i){return{day:i+1,name:v.name,note:(TYPES[v.type]||'Visited')+(v.note?' · '+v.note:'')}}); return a; };

function canvasBase(title,sub){ var c=document.createElement('canvas');c.width=1600;c.height=2000;var x=c.getContext('2d');var g=x.createLinearGradient(0,0,1600,2000);g.addColorStop(0,'#07090f');g.addColorStop(.55,'#12151f');g.addColorStop(1,'#240d12');x.fillStyle=g;x.fillRect(0,0,1600,2000);x.strokeStyle='#E8BA6C';x.lineWidth=4;x.strokeRect(44,44,1512,1912);x.fillStyle='#E8BA6C';x.font='700 34px Arial';x.fillText('ROAMWISE · ACTUAL JOURNEY',86,118);x.fillStyle='#fff';x.font='700 72px Georgia';wrap(x,title,86,220,1420,82,2);x.fillStyle='#A9A59C';x.font='28px Arial';wrap(x,sub,86,390,1420,40,2);return[c,x]; }
function wrap(x,s,left,top,max,line,maxLines){var words=String(s||'').split(/\s+/),row='',n=0;for(var i=0;i<words.length&&n<maxLines;i++){var test=row?row+' '+words[i]:words[i];if(x.measureText(test).width>max&&row){x.fillText(row,left,top+n*line);row=words[i];n++;}else row=test;}if(row&&n<maxLines)x.fillText(row,left,top+n*line);}
function saveCanvas(c,name){ var data=c.toDataURL('image/png'); try{ if(typeof saveOrDownload==='function')return saveOrDownload(data,name); }catch(e){} var a=document.createElement('a');a.href=data;a.download=name;document.body.appendChild(a);a.click();a.remove(); }
function summary(t){ var counts={};t.visits.forEach(function(v){counts[v.type]=(counts[v.type]||0)+1;});return Object.keys(counts).map(function(k){return(TYPES[k]||k)+' '+counts[k];}).join('   ·   '); }

window.rwFootprintPoster=function(){
  var t=getTrip(activeDest); if(!t.visits.length&&!t.track.length){toast('Record at least one check-in or walking segment first');return;}
  var z=canvasBase(t.destination,t.visits.length+' check-ins · '+tripDistance(t).toFixed(1)+' km recorded · '+new Date(t.createdAt).toLocaleDateString('en-IN'));var c=z[0],x=z[1];
  x.fillStyle='rgba(232,186,108,.08)';x.fillRect(86,520,1428,250);x.fillStyle='#E8BA6C';x.font='700 40px Arial';x.fillText(tripDistance(t).toFixed(1)+' km',120,610);x.fillText(String(t.visits.length),600,610);x.fillText(String(t.track.length),1040,610);x.fillStyle='#A9A59C';x.font='22px Arial';x.fillText('RECORDED ROUTE',120,652);x.fillText('CHECK-INS',600,652);x.fillText('GPS POINTS',1040,652);
  x.fillStyle='#fff';x.font='700 31px Arial';x.fillText('THE PLACES YOU ACTUALLY TOUCHED',86,850);var y=915;t.visits.slice(0,14).forEach(function(v,i){x.fillStyle='#4ADE80';x.beginPath();x.arc(108,y-10,11,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.font='700 26px Arial';x.fillText((i+1)+'. '+v.name,140,y);x.fillStyle='#A9A59C';x.font='20px Arial';x.fillText((TYPES[v.type]||TYPES.other)+' · '+dateText(v.at),140,y+31);y+=74;});x.fillStyle='#E8BA6C';x.font='24px Arial';wrap(x,summary(t),86,1840,1420,34,2);x.fillStyle='#7f7d77';x.font='18px Arial';x.fillText('Self-recorded on this device · RoamWise does not claim independent verification of each visit.',86,1930);saveCanvas(c,'roamwise-'+idFor(t.destination)+'-journey.png');
};
window.rwFootprintCertificate=function(){
  var t=getTrip(activeDest); if(!t.visits.length){toast('Check in to at least one place first');return;} var name=(localStorage.getItem('rw_name')||((window.user&&user.displayName)||'A Traveler')).slice(0,50);var z=canvasBase('Certificate of Journey',name+' · '+t.destination);var c=z[0],x=z[1];x.textAlign='center';x.fillStyle='#E8BA6C';x.font='700 46px Georgia';x.fillText('ACTUAL TRIP RECORD',800,600);x.fillStyle='#fff';x.font='700 80px Georgia';x.fillText(t.destination,800,735);x.fillStyle='#A9A59C';x.font='30px Arial';x.fillText(t.visits.length+' check-ins · '+tripDistance(t).toFixed(1)+' km recorded',800,810);x.textAlign='left';var y=980;t.visits.slice(0,10).forEach(function(v){x.fillStyle='#4ADE80';x.font='700 26px Arial';x.fillText('✓ '+v.name,210,y);x.fillStyle='#A9A59C';x.font='20px Arial';x.fillText((TYPES[v.type]||TYPES.other)+' · '+dateText(v.at),240,y+32);y+=82;});x.textAlign='center';x.fillStyle='#E8BA6C';x.font='700 28px Georgia';x.fillText('ROAMWISE JOURNEY FOOTPRINT',800,1770);x.fillStyle='#89867e';x.font='18px Arial';x.fillText('Generated from traveller-recorded check-ins and optional device GPS. Not an independent proof of physical presence.',800,1820);x.fillText('roamwise.co.in',800,1885);saveCanvas(c,'roamwise-'+idFor(t.destination)+'-certificate.png');
};
window.rwFootprintCollage=function(files){
  files=Array.prototype.slice.call(files||[]).slice(0,6);if(!files.length)return;var t=getTrip(activeDest);Promise.all(files.map(function(f){return new Promise(function(resolve){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){resolve(im)};im.onerror=function(){resolve(null)};im.src=r.result};r.onerror=function(){resolve(null)};r.readAsDataURL(f);});})).then(function(imgs){imgs=imgs.filter(Boolean);if(!imgs.length){toast('Could not read those photos');return;}var c=document.createElement('canvas');c.width=1800;c.height=2200;var x=c.getContext('2d');x.fillStyle='#07090f';x.fillRect(0,0,c.width,c.height);x.fillStyle='#E8BA6C';x.font='700 32px Arial';x.fillText('ROAMWISE · '+t.destination.toUpperCase(),70,82);var cells=[[70,130,1080,740],[1180,130,550,355],[1180,515,550,355],[70,900,550,520],[650,900,1080,520],[70,1450,520,520],[620,1450,520,520],[1170,1450,560,520]];imgs.forEach(function(im,i){var b=cells[i],ir=im.width/im.height,tr=b[2]/b[3],sx=0,sy=0,sw=im.width,sh=im.height;if(ir>tr){sw=im.height*tr;sx=(im.width-sw)/2}else{sh=im.width/tr;sy=(im.height-sh)/2}x.drawImage(im,sx,sy,sw,sh,b[0],b[1],b[2],b[3]);x.strokeStyle='#161a24';x.lineWidth=8;x.strokeRect(b[0],b[1],b[2],b[3]);});x.fillStyle='rgba(7,9,15,.78)';x.fillRect(70,2020,1660,120);x.fillStyle='#fff';x.font='700 30px Arial';x.fillText(t.visits.length+' places · '+tripDistance(t).toFixed(1)+' km · '+new Date().toLocaleDateString('en-IN'),100,2080);x.fillStyle='#A9A59C';x.font='20px Arial';x.fillText('My journey, not just my itinerary · roamwise.co.in',100,2116);saveCanvas(c,'roamwise-'+idFor(t.destination)+'-collage.png');});
};

if(typeof window.rwPaintTripMap==='function'){
  var basePaint=window.rwPaintTripMap;
  window.rwPaintTripMap=function(dest,data){ var out=basePaint.apply(this,arguments); try{ensurePanel(dest,(data&&data.pins)||window._tripPins||[]);}catch(e){} return out; };
}
window.openTripFootprint=function(dest){ ensurePanel(dest||(window._lastItin&&_lastItin.name)||'Trip',window._tripPins||[]); try{document.getElementById('rwFootprintPanel').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){} };
window.addEventListener('pagehide',function(){ if(activeWatch!=null){try{navigator.geolocation.clearWatch(activeWatch);}catch(e){} activeWatch=null;} });
})();
