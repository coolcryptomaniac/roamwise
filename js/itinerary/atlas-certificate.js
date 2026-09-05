// @ts-nocheck
/* atlas-certificate.js — Atlas Certificate: the self-contained, downloadable HTML
   journey certificate (downloadAtlasCertificate) plus the Journey Card's generic
   image/PDF/share export actions (cardPNG/cardJPG/cardPDF/cardShare), which export
   the same _rwCard/_rwCine canvas (from js/itinerary/journey-log.js) and sit in the
   same UI action row as the Atlas Certificate button. Split out of
   js/itinerary/certificates.js (which bundled 5 unrelated certificate/movie
   features) as an SRP cleanup; verbatim move, zero logic changes.
   CONTINENT_BY_CC/continentForCC/continentForLatLon/continentFor below were
   later moved here verbatim from app.js (modularization round 4) — this is
   their only caller (the "N/7 continents" stat just below). */

/* Country-code (ISO 3166-1 alpha-2) → continent, covering common countries.
   Used to compute a real "N/7 continents" stat instead of just counting
   distinct country strings (which never distinguished USA=North America
   from, say, France=Europe in any meaningful aggregate way). */
var CONTINENT_BY_CC = {
  US:'North America',CA:'North America',MX:'North America',CU:'North America',JM:'North America',
  PA:'North America',CR:'North America',GT:'North America',HN:'North America',NI:'North America',
  BZ:'North America',BS:'North America',DO:'North America',HT:'North America',
  BR:'South America',AR:'South America',CL:'South America',CO:'South America',PE:'South America',
  VE:'South America',EC:'South America',BO:'South America',PY:'South America',UY:'South America',
  GY:'South America',SR:'South America',
  GB:'Europe',FR:'Europe',DE:'Europe',IT:'Europe',ES:'Europe',PT:'Europe',NL:'Europe',BE:'Europe',
  CH:'Europe',AT:'Europe',SE:'Europe',NO:'Europe',DK:'Europe',FI:'Europe',IE:'Europe',PL:'Europe',
  CZ:'Europe',GR:'Europe',HU:'Europe',RO:'Europe',BG:'Europe',HR:'Europe',RS:'Europe',UA:'Europe',
  RU:'Europe',IS:'Europe',SK:'Europe',SI:'Europe',EE:'Europe',LV:'Europe',LT:'Europe',LU:'Europe',
  MT:'Europe',CY:'Europe',
  IN:'Asia',CN:'Asia',JP:'Asia',KR:'Asia',TH:'Asia',VN:'Asia',ID:'Asia',MY:'Asia',SG:'Asia',
  PH:'Asia',NP:'Asia',LK:'Asia',BD:'Asia',PK:'Asia',KH:'Asia',LA:'Asia',MM:'Asia',MN:'Asia',
  TW:'Asia',HK:'Asia',KZ:'Asia',UZ:'Asia',GE:'Asia',AM:'Asia',AZ:'Asia',
  AE:'Middle East',SA:'Middle East',QA:'Middle East',KW:'Middle East',BH:'Middle East',OM:'Middle East',
  IL:'Middle East',JO:'Middle East',LB:'Middle East',TR:'Middle East',IR:'Middle East',IQ:'Middle East',
  EG:'Africa',ZA:'Africa',MA:'Africa',KE:'Africa',TZ:'Africa',NG:'Africa',ET:'Africa',GH:'Africa',
  TN:'Africa',DZ:'Africa',UG:'Africa',RW:'Africa',NA:'Africa',BW:'Africa',ZW:'Africa',MU:'Africa',
  SC:'Africa',SN:'Africa',CI:'Africa',CM:'Africa',
  AU:'Oceania',NZ:'Oceania',FJ:'Oceania',PG:'Oceania',WS:'Oceania',VU:'Oceania',
  PF:'Oceania',NC:'Oceania'
};
function continentForCC(cc){ return CONTINENT_BY_CC[(cc||'').toUpperCase()] || null; }
/* Fallback for entries with no countryCode at all — including everything
   logged before this fix existed. Rough lat/lon bounding boxes; not survey-
   grade, but good enough to retroactively fix "Continents 0/7" for existing
   journey logs instead of requiring people to re-log every past entry. */
function continentForLatLon(lat, lon){
  if(typeof lat!=='number' || typeof lon!=='number') return null;
  if(lat < -60) return null; /* Antarctica — vanishingly rare to log, excluded from the 7-way split */
  if(lat < -10 && lon > 110 && lon <= 180) return 'Oceania';
  if(lat < 0 && lon >= -180 && lon < -140) return 'Oceania'; /* Pacific islands */
  if(lon >= -170 && lon < -35 && lat >= 8) return 'North America';
  if(lon >= -85 && lon < -33 && lat < 8 && lat >= -60) return 'South America';
  if(lon >= 25 && lon < 63 && lat >= 12 && lat < 42) return 'Middle East';
  if(lon >= -25 && lon < 45 && lat >= 35 && lat <= 72) return 'Europe';
  if(lon >= -20 && lon < 52 && lat >= -35 && lat < 35) return 'Africa';
  if(lon >= 45 && lon <= 180 && lat >= -10 && lat < 80) return 'Asia';
  if(lon >= -180 && lon < -25 && lat >= 5) return 'North America'; /* far western wrap */
  return null;
}
/* Single entry point used everywhere: try the reliable country-code path
   first, fall back to coordinates for older/incomplete log entries. */
function continentFor(entry){
  return continentForCC(entry.countryCode) || continentForLatLon(entry.lat, entry.lon);
}

/* ===== ATLAS CERTIFICATE — self-contained downloadable HTML journey certificate =====
 * Design tokens (palette, ornate-double border, filter-based layer tabs, percentage-
 * positioned pins) reverse-engineered honestly from a Tailwind-compiled reference the
 * user shared — NOT copied code, just the same proven recipe, rebuilt from scratch
 * using our own real journey data and existing card canvas as the map image. */
function haversine(a,b){
  var R=6371, toRad=function(d){return d*Math.PI/180;};
  var dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon);
  var s=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return R*2*Math.asin(Math.sqrt(s));
}
async function downloadAtlasCertificate(){
  if(!window._rwCard || !window._rwCine){ showToast('Forge your Journey Card first — then the certificate'); return; }
  showToast('📜 Engraving your Atlas Certificate…');
  var C=_rwCine, L=logGet();
  var PR={}; try{ PR=JSON.parse(lsGet('rw_profile')||'{}'); }catch(e){}
  var name=PR.name||lsGet('rw_name')||'A Traveler';
  var xp=xpGet(), r=rankOf(xp);
  var withCoords=L.filter(function(e){ return typeof e.lat==='number' && typeof e.lon==='number'; });
  var countries={}, dist=0;
  var continents={};
  withCoords.forEach(function(e,i){ if(e.country) countries[e.country]=1; var c=continentFor(e); if(c) continents[c]=1; if(i>0) dist+=haversine(withCoords[i-1],e); });
  var countryCount=Object.keys(countries).length || Math.max(1,Math.round(withCoords.length*0.6));
  var continentCount=Object.keys(continents).length;
  var lats=withCoords.map(function(e){return e.lat;});
  var latRange = lats.length? Math.round(Math.max.apply(0,lats))+'°N to '+Math.abs(Math.round(Math.min.apply(0,lats)))+'°'+(Math.min.apply(0,lats)<0?'S':'N') : '—';
  var mapImg = _rwCard.toDataURL('image/jpeg',0.9);
  var W=C.W, H=C.H;
  var pinsHtml = C.pts.map(function(p,i){
    var lx=(p.x/W*100).toFixed(2), ty=(p.y/H*100).toFixed(2);
    var nm=(C.names[p.num-1]||'Stop '+p.num).replace(/[<>"]/g,'');
    return '<div class="ac-pin" data-x="'+lx+'" data-y="'+ty+'" style="left:'+lx+'%;top:'+ty+'%" onclick="this.classList.toggle(\'ac-open\')">'
      +'<div class="ac-dot">'+p.num+'</div>'
      +'<div class="ac-tip">'+nm+'</div></div>';
  }).join('');
  var flightPath = C.pts.map(function(p){ return (p.x/W*100).toFixed(2)+'% '+(p.y/H*100).toFixed(2)+'%'; });
  var logRows = withCoords.length? withCoords.map(function(e,i){
    return '<div class="ac-row"><span class="ac-num">'+String(i+1).padStart(2,'0')+'</span>'
      +'<span class="ac-place">'+(e.n||'').replace(/[<>]/g,'')+'</span>'
      +'<span class="ac-coord">'+e.lat.toFixed(2)+'°, '+e.lon.toFixed(2)+'°</span></div>';
  }).join('') : C.names.map(function(n,i){ return '<div class="ac-row"><span class="ac-num">'+String(i+1).padStart(2,'0')+'</span><span class="ac-place">'+n.replace(/[<>]/g,'')+'</span></div>'; }).join('');
  var stamp='RW-ATLAS-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
  /* Verifiable fingerprint of the exact journey contents (see proofStamp). */
  var proof = await proofStamp(name+'|'+withCoords.map(function(e){return e.n+','+e.lat+','+e.lon;}).join(';')) || '';
  var now=new Date();

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  +'<title>'+name+' — RoamWise Atlas Certificate</title>'
  +'</head><body><div class="wrap">'
  +'<div class="corner c-tl">✦</div><div class="corner c-tr">✦</div>'
  +'<div class="hd"><h1>ROAMWISE · ATLAS EDITION · JOURNEY CERTIFICATE</h1><div class="sub">Shinobi Edition — Escape the crowds · Discover your world</div></div>'
  +'<div class="bar"><button class="btn on" id="acPlayBtn" onclick="acToggleFlight()">▶ Play Flight</button>'
  +'<button class="tab on" data-f="geo" onclick="acTab(this)">Geographical</button>'
  +'<button class="tab" data-f="pol" onclick="acTab(this)">Political</button>'
  +'<button class="tab" data-f="temp" onclick="acTab(this)">Temperature</button></div>'
  +'<div class="mapbox" id="acMapbox"><img src="'+mapImg+'">'+pinsHtml+'<div class="plane" id="acPlane" style="opacity:0">✈️</div></div>'
  +'<div class="profile"><div class="av">'+(name[0]||'R').toUpperCase()+'</div><div><div class="pname">'+name.replace(/[<>]/g,'')+'</div><div class="prank">'+r[1].toUpperCase()+' · LEVEL '+Math.max(1,Math.floor(xp/50))+'</div></div></div>'
  +'<div class="stats">'
  +'<div class="stat"><label>Countries</label><b>'+countryCount+'</b></div>'
  +'<div class="stat"><label>Continents</label><b>'+continentCount+'/7</b></div>'
  +'<div class="stat"><label>Stops</label><b>'+C.names.length+'</b></div>'
  +'<div class="stat"><label>Total Distance</label><b>'+Math.round(dist).toLocaleString()+' km</b></div>'
  +'<div class="stat"><label>Latitude Range</label><b>'+latRange+'</b></div>'
  +'</div>'
  +'<div class="log"><h3>JOURNEY LOG · '+C.names.length+' STOPS</h3>'+logRows+'</div>'
  +'<div class="cert"><div class="seal">ROAMWISE<br>ATLAS<br>✦<br>VALIDATED</div>'
  +'<div class="certtext"><b>Certified True Journey</b>Date: '+now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})+' · ID: '+stamp+'<br>This certifies that the bearer has logged the above destinations on roamwise.co.in — data stays on device.'+(proof? '<br><span style="font-family:monospace;font-size:10px;word-break:break-all">Proof (SHA-256): '+proof.slice(0,32)+'…</span>':'')+'</div>'
  +'<div class="dotgrid"></div></div>'
  +'<div class="foot">Published by RoamWise.co.in · © '+now.getFullYear()+' RoamWise Atlas Authority</div>'
  +'</div>'
  +'<script>'
  +'function acTab(b){document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("on");});b.classList.add("on");var m=document.getElementById("acMapbox");m.className="mapbox "+({geo:"",pol:"pol",temp:"temp"}[b.dataset.f]);}'
  +'var acPts='+JSON.stringify(C.pts.map(function(p){return [p.x/W*100,p.y/H*100];}))+';'
  +'var acPlaying=true,acT=0,acRAF=null;'
  +'function acStep(){ if(!acPlaying||acPts.length<2){acRAF=requestAnimationFrame(acStep);return;} '
  +'var segT=acT%1, segI=Math.floor(acT)%(acPts.length-1); var a=acPts[segI],b2=acPts[segI+1];'
  +'var x=a[0]+(b2[0]-a[0])*segT, y=a[1]+(b2[1]-a[1])*segT;'
  +'var pl=document.getElementById("acPlane"); pl.style.opacity=1; pl.style.left=x+"%"; pl.style.top=y+"%";'
  +'acT+=0.006; if(acT>=acPts.length-1) acT=0; acRAF=requestAnimationFrame(acStep); }'
  +'function acToggleFlight(){ acPlaying=!acPlaying; var b=document.getElementById("acPlayBtn"); b.textContent=acPlaying?"▶ Play Flight":"⏸ Pause Flight"; b.classList.toggle("on",acPlaying); }'
  +'function acDeclutter(){'
  +'var pins=Array.prototype.slice.call(document.querySelectorAll(".ac-pin"));'
  +'var pos=pins.map(function(p){return {el:p, x:parseFloat(p.dataset.x), y:parseFloat(p.dataset.y)};});'
  +'var THRESH=4.5;'
  +'for(var iter=0;iter<6;iter++){'
  +'for(var i=0;i<pos.length;i++)for(var j=i+1;j<pos.length;j++){'
  +'var dx=pos[j].x-pos[i].x, dy=pos[j].y-pos[i].y, d=Math.sqrt(dx*dx+dy*dy);'
  +'if(d<THRESH){ var push=(THRESH-d)/2; var ang=Math.atan2(dy||0.01,dx||0.01);'
  +'pos[i].x-=Math.cos(ang)*push; pos[i].y-=Math.sin(ang)*push;'
  +'pos[j].x+=Math.cos(ang)*push; pos[j].y+=Math.sin(ang)*push; }'
  +'}}'
  +'pos.forEach(function(p){ p.el.style.left=Math.max(2,Math.min(98,p.x))+"%"; p.el.style.top=Math.max(2,Math.min(98,p.y))+"%"; });'
  +'}'
  +'acDeclutter();'
  +'acStep();'
  +'<'+'/script></body></html>';

  var blob=new Blob([html],{type:'text/html'});
  var fname='roamwise-atlas-certificate-'+(name||'traveler').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.html';
  if(window.RW && RW.saveCard){
    var fr=new FileReader(); fr.onload=function(){ RW.saveCard(fr.result); offerOpen('Your Atlas Certificate'); };
    fr.readAsDataURL(blob);
  } else {
    var u=URL.createObjectURL(blob), a=document.createElement('a'); a.href=u; a.download=fname; a.click();
    showToast('📜 Atlas Certificate downloaded — open it in any browser');
  }
  xpAdd(15,'Atlas Certificate engraved');
  try{ track('atlas_cert_made'); }catch(e){}
}
function cardPNG(){ if(window._rwCard) saveOrDownload(_rwCard.toDataURL('image/png'),'roamwise-journey.png'); }
function cardJPG(){ if(window._rwCard) saveOrDownload(_rwCard.toDataURL('image/jpeg',0.92),'roamwise-journey.jpg'); }
function cardPDF(){
  if(!window._rwCard) return;
  var go=function(){
    var pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'px',format:[1200,1600]});
    pdf.addImage(_rwCard.toDataURL('image/jpeg',0.92),'JPEG',0,0,1200,1600);
    if(window.RW && RW.saveCard){ RW.saveCard(pdf.output('datauristring')); showToast('PDF saved to Downloads/RoamWise \u2713'); }
    else {
      try{ var u=URL.createObjectURL(pdf.output('blob')); var w2=window.open(u,'_blank');
        if(w2) showToast('\ud83d\udc41 Preview opened \u2014 save from the viewer'); else pdf.save('roamwise-journey.pdf');
      }catch(e){ pdf.save('roamwise-journey.pdf'); }
    }
  };
  if(window.jspdf) return go();
  showToast('Preparing PDF engine\u2026');
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload=go; s.onerror=function(){ showToast('PDF needs internet \u2014 try PNG/JPG'); };
  document.head.appendChild(s);
}
function cardShare(){
  if(!window._rwCard) return;
  _rwCard.toBlob(function(blob){
    var f=new File([blob],'roamwise-journey.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[f]})){
      navigator.share({files:[f], title:'My RoamWise Journey', text:'\u{1F977} My travel map \u2014 made on RoamWise. Make yours: https://www.roamwise.co.in'})
        .then(function(){ xpAdd(15,'Card shared \u2014 spreading the legend'); }).catch(function(){});
    } else { cardPNG(); showToast('Saved \u2014 now share it from your gallery to Insta/WhatsApp'); }
  },'image/png');
}
