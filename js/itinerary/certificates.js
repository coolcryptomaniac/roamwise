/* certificates.js — Atlas Certificate (self-contained downloadable HTML), Journey
   Movie (cinematic canvas + audio render), the Journey Certificate render/share/
   download flow, and the Eco Certificate + certificate-verification (SHA-256 tamper
   check) tools. Moved verbatim from app.js as part of Phase 5a modularization; zero
   logic changes. */

function openJourneyCert(){
  try{ tabGo('home'); }catch(e){}
  var it = window._lastItin;
  var destName = (it && it.name) || '';
  var stops = rwDeriveStops(destName);
  if(!destName){ try{ showToast('Plan a trip first \u2014 then mint its certificate \ud83c\udfc5'); }catch(e){}; return; }

  var name = lsGet('rw_name') || (window.user && user.displayName) || 'A Traveler';
  var rank = (typeof rankOf==='function') ? rankOf(xpGet())[1] : 'Explorer';
  var lvl = (typeof xpGet==='function') ? Math.max(1, Math.floor(xpGet()/100)+1) : 1;
  var certId = 'RW-ATLAS-2026-'+String(1000+Math.floor(Math.random()*8999));
  var today = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  var dayCount = (it && it.days) ? it.days.length : stops.length;

  var sec=el('certSection');
  if(!sec){
    sec=document.createElement('section'); sec.id='certSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec);
  }
  var DAYC=['#E8BA6C','#60A5FA','#4ADE80','#F87171','#A78BFA','#38BDF8','#FB923C','#F472B6'];
  var stopRows = stops.map(function(s,i){
    var c=DAYC[i%DAYC.length];
    return '<div class="cert-stop"><span class="cert-stopnum" style="background:'+c+'">'+(i+1)+'</span>'
      +'<span class="cert-stopname">'+esc2(s.name)+'</span>'
      +'<span class="cert-stopnote">'+esc2(s.note||'Highlight')+'</span></div>';
  }).join('');

  var earned = (typeof badgeEarnedIds==='function') ? badgeEarnedIds() : [];
  var badgeChips = (typeof RW_BADGES!=='undefined'? RW_BADGES:[]).filter(function(b){ return earned.indexOf(b.id)>=0; }).slice(0,6)
    .map(function(b){ return '<span class="cert-badge" style="border-color:'+b.accent+'">'+b.emoji+' '+b.name+'</span>'; }).join('') || '<span class="cert-badge" style="opacity:.6">Plan trips to earn badges</span>';

  sec.innerHTML =
    '<div class="xsec-head"><h2 class="xsec-title">\ud83c\udfc5 Journey <em>Certificate</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'certSection\')">\u2715</button></div>'
    +'<div id="certCard" class="cert-card">'
      +'<div class="cert-topbar"><span class="cert-brand">ROAM<b>WISE</b></span><span class="cert-edition">ATLAS EDITION \u65c5</span></div>'
      +'<div class="cert-title">JOURNEY CERTIFICATE</div>'
      +'<div class="cert-sub">'+esc2(destName)+' \u00b7 '+dayCount+'-day expedition</div>'
      +'<div id="certMap" class="cert-map"></div>'
      +'<div class="cert-stats">'
        +'<div class="cert-stat"><b>'+stops.length+'</b><span>Stops</span></div>'
        +'<div class="cert-stat"><b>'+dayCount+'</b><span>Days</span></div>'
        +'<div class="cert-stat"><b>'+rank+'</b><span>Rank</span></div>'
        +'<div class="cert-stat"><b>L'+lvl+'</b><span>Level</span></div>'
      +'</div>'
      +'<div class="cert-sectitle">Itinerary</div>'
      +'<div class="cert-stops">'+stopRows+'</div>'
      +'<div class="cert-sectitle">Badges earned</div>'
      +'<div class="cert-badges">'+badgeChips+'</div>'
      +'<div class="cert-foot">'
        +'<div><div class="cert-name">'+esc2(name)+'</div><div class="cert-role">'+rank+' \u00b7 Level '+lvl+' \u00b7 RoamWise Explorer</div></div>'
        +'<div class="cert-meta"><div>Certificate ID</div><b>'+certId+'</b><div style="margin-top:4px">Issued '+today+'</div></div>'
      +'</div>'
      +'<div class="cert-motif">"Collect moments, not things." \u2014 RoamWise</div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-top:12px">'
      +'<button class="tact" style="flex:1;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="certShare()">\ud83d\udce4 Share certificate</button>'
      +'<button class="tact" style="flex:1;font-weight:800" onclick="certDownload()">\u2b07\ufe0f Save image</button>'
    +'</div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});

  /* draw the route mini-map */
  rwEnsureLeaflet(function(ok){
    if(!ok){ el('certMap').innerHTML='<div style="padding:30px;text-align:center;color:#888;font-size:12px">Map needs internet the first time</div>'; return; }
    var cacheKey='rw_tripmap_v2_'+destName.toLowerCase().replace(/[^a-z0-9]/g,'');
    var cached=null; try{ cached=JSON.parse(lsGet(cacheKey)||'null'); }catch(e){}
    var geoP = (cached&&cached.pins&&cached.pins.length) ? Promise.resolve(cached)
      : gcode(destName).then(function(center){
          return Promise.all(stops.map(function(s){ return gcode(s.name+', '+destName).then(function(g){ return g?{name:s.name,lat:g.lat,lon:g.lon}:null; }); }))
            .then(function(pins){ return {center:center, pins:pins.filter(Boolean)}; });
        });
    geoP.then(function(data){
      var m=L.map('certMap',{zoomControl:false,attributionControl:false,dragging:true}).setView(data.center?[data.center.lat,data.center.lon]:[22,79],11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',{maxZoom:18}).addTo(m);
      var pts=[], bounds=[];
      (data.pins||[]).forEach(function(p,i){
        var c=DAYC[i%DAYC.length];
        var ic=L.divIcon({className:'',html:'<div style="background:'+c+';width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#0A0A0C;font-weight:800;font-size:11px">'+(i+1)+'</span></div>',iconSize:[22,22],iconAnchor:[11,22]});
        L.marker([p.lat,p.lon],{icon:ic}).addTo(m); pts.push([p.lat,p.lon]); bounds.push([p.lat,p.lon]);
      });
      if(pts.length>1) L.polyline(pts,{color:'#E8BA6C',weight:2.5,opacity:.7,dashArray:'5,7'}).addTo(m);
      if(bounds.length) try{ m.fitBounds(bounds,{padding:[30,30],maxZoom:12}); }catch(e){}
      setTimeout(function(){ try{ m.invalidateSize(); }catch(e){} },300);
    });
  });
}
function certShare(){
  var url='https://roamwise.co.in';
  var txt='I just mapped my '+((window._lastItin&&_lastItin.name)||'next')+' journey on RoamWise \ud83c\udfc5\u2708\ufe0f Plan yours:';
  rwShareSheet(txt, url, 'journey certificate');
}

function certDownload(){
  /* Uses html2canvas if available; else guides the user to screenshot. */
  var node=el('certCard'); if(!node) return;
  if(window.html2canvas){
    showToast('Rendering your certificate\u2026');
    html2canvas(node,{backgroundColor:null,scale:2,useCORS:true}).then(function(cv){
      try{ saveOrDownload(cv.toDataURL('image/png'),'roamwise-certificate.png'); }catch(e){ showToast('Long-press the card to save it'); }
    }).catch(function(){ showToast('Tip: screenshot the certificate to save it'); });
  } else {
    var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload=function(){ certDownload(); }; s.onerror=function(){ showToast('Tip: screenshot the certificate to save it'); };
    document.head.appendChild(s);
  }
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

/* ===== JOURNEY MOVIE — cinematic canvas render with music ===== */
function openMovie(){
  if(!window._rwCard || !window._rwCine){ showToast('Forge your Journey Card first \u2014 then the movie'); return; }
  if((_rwCine.pts||[]).length<2){ showToast('Log at least 2 located places for a movie'); return; }
  try{ track('video_opens'); }catch(e){}
  if(isPro || lsGet('rw_movie_ok')) return cineRender();
  if(perksUnlocked().indexOf('documented')>-1 && !lsGet('rw_movie_perk_used')){
    lsSet('rw_movie_perk_used','1');
    showToast('\ud83c\udfc6 Perk redeemed \u2014 free Journey Movie for a Documented traveler!');
    return cineRender();
  }
  var ov=el('movOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='movOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:400px"><button class="modal-close" onclick="el(\'movOverlay\').classList.remove(\'open\')">\u00d7</button>'
    +'<div class="modal-head"><div class="modal-title">\ud83c\udfac Journey Film</div><div class="modal-sub">5-second chapters \u00b7 a plane flies your route \u00b7 music</div></div>'
    +'<div class="modal-body"><div class="mode-box" style="margin-bottom:10px">\ud83d\udcb0 <b>\u20b950 one-off</b> \u2014 or free with Pro. Pay via any UPI app to <b>coolmohit@ybl</b>, then render.</div>'
    +'<button class="tact" style="width:100%;margin-bottom:8px" onclick="payVia(\'generic50\')">\ud83d\udcb3 Pay \u20b950 via UPI</button>'
    +'<button class="rzp-main-btn" onclick="lsSet(\'rw_movie_ok\',\'1\');el(\'movOverlay\').classList.remove(\'open\');cineRender()">\u2705 I\u2019ve paid \u20b950 \u2014 Render my movie</button>'
    +'<div style="font-size:10px;color:var(--t3);text-align:center;margin-top:6px">Honor system \u2014 you\u2019re funding a solo Himalayan builder \ud83c\udfd4\ufe0f</div></div></div>';
    document.body.appendChild(ov); }
  ov.classList.add('open');
}
function cineMusic(ctx, dest, dur){
  /* dark shinobi phonk: 88bpm kick + 808 + hat + minor cowbell motif */
  var bpm=88, beat=60/bpm, t0=ctx.currentTime+0.05;
  function kick(t){ var o=ctx.createOscillator(), g=ctx.createGain();
    o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.11);
    g.gain.setValueAtTime(.9,t); g.gain.exponentialRampToValueAtTime(.001,t+0.24);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t+0.26); }
  function bass(t,f,d){ var o=ctx.createOscillator(), g=ctx.createGain(); o.type='triangle';
    o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(.4,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t+d); }
  function hat(t){ var b=ctx.createBuffer(1,2000,ctx.sampleRate), dd=b.getChannelData(0);
    for(var i=0;i<2000;i++) dd[i]=(Math.random()*2-1)*Math.pow(1-i/2000,2);
    var s=ctx.createBufferSource(), g=ctx.createGain(), f=ctx.createBiquadFilter();
    f.type='highpass'; f.frequency.value=8000; g.gain.value=.16;
    s.buffer=b; s.connect(f); f.connect(g); g.connect(dest); s.start(t); }
  function bell(t,f){ var o=ctx.createOscillator(), g=ctx.createGain(); o.type='square';
    o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(.14,t); g.gain.exponentialRampToValueAtTime(.001,t+beat*0.9);
    var fl=ctx.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f*2;
    o.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o.stop(t+beat); }
  var mel=[220,262,196,220, 175,220,262,330, 220,196,175,196, 220,262,220,175]; /* Am minor motif */
  var bars=Math.ceil(dur/(beat*4));
  for(var b2=0;b2<bars;b2++){
    var bt=t0+b2*beat*4;
    [0,1,2,3].forEach(function(q){ kick(bt+q*beat); hat(bt+q*beat+beat/2); if(q===1||q===3) hat(bt+q*beat+beat*0.75); });
    bass(bt,55,beat*1.8); bass(bt+beat*2,49,beat*1.8);
    [0,1,2,3].forEach(function(q){ bell(bt+q*beat, mel[(b2*4+q)%mel.length]); });
  }
}
function cineRender(opts){
  opts=opts||{};
  var ST=CARD_STYLES[(_rwCine&&_rwCine.style)||'neon']||CARD_STYLES.neon;
  showToast('\ud83c\udfac Rolling\u2026 rendering your journey film');
  try{ track('video_made'); }catch(e){}
  var C=_rwCine, S=2;
  var VW=1080, VH=1920, cv=document.createElement('canvas'); cv.width=VW; cv.height=VH;
  var x=cv.getContext('2d');
  /* clean, de-duplicated leg list */
  var legs=C.pts.filter(function(p){return p && isFinite(p.x) && isFinite(p.y);});
  legs=legs.filter(function(p,i){ return i===0 || Math.abs(p.x-legs[i-1].x)+Math.abs(p.y-legs[i-1].y) > 4; });
  if(legs.length<2){ showToast('Log 2+ located places for a film'); return; }
  var names=C.names||[];
  var test=!!window._cineTest;
  /* fixed 5-second segments: INTRO(5) + one 5s hop per leg-transition + OUTRO(5) */
  var SEG=test?0.5:5.0, hops=legs.length-1;
  var INTRO=SEG, OUTRO=SEG, DUR=INTRO + hops*SEG + OUTRO;

  /* geo bounds of the trip for a framed map view */
  var minX=Math.min.apply(0,legs.map(function(p){return p.x;})), maxX=Math.max.apply(0,legs.map(function(p){return p.x;}));
  var minY=Math.min.apply(0,legs.map(function(p){return p.y;})), maxY=Math.max.apply(0,legs.map(function(p){return p.y;}));

  /* audio */
  var AC=window.AudioContext||window.webkitAudioContext, ctx=null, dest=null;
  if(!opts.mute){ try{ ctx=new AC(); try{ctx.resume();}catch(e2){} dest=ctx.createMediaStreamDestination(); cineMusic(ctx,dest,DUR);}catch(e){} }
  var stream=cv.captureStream(30);
  if(dest && dest.stream.getAudioTracks().length) stream.addTrack(dest.stream.getAudioTracks()[0]);
  var mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(function(m){return window.MediaRecorder && MediaRecorder.isTypeSupported(m);});
  if(!mime){ showToast('Video needs Chrome \u2014 try there'); return; }
  var rec=new MediaRecorder(stream,{mimeType:mime, videoBitsPerSecond:6e6}), chunks=[];
  rec.ondataavailable=function(e){ if(e.data.size) chunks.push(e.data); };
  rec.onstop=function(){
    if(ctx) try{ctx.close();}catch(e){}
    var blob=new Blob(chunks,{type:'video/webm'});
    if(blob.size<2000 && !opts.mute){ showToast('Retrying without music\u2026'); return cineRender({mute:true}); }
    if(blob.size<2000){ showToast('\u26a0 Recording failed \u2014 try Chrome'); return; }
    if(window.RW && RW.saveCard){ var fr=new FileReader(); fr.onload=function(){ RW.saveCard(fr.result); showToast('\ud83c\udfac Film saved to Downloads/RoamWise!'); }; fr.readAsDataURL(blob); }
    else { var u=URL.createObjectURL(blob), a=document.createElement('a'); a.href=u; a.download='roamwise-journey-film.webm'; a.click(); showToast('\ud83c\udfac Film downloaded \u2014 post it as a Reel!'); }
    xpAdd(30,'Journey Film premiered');
  };
  rec.start(200);

  var t0=performance.now();
  function ease(t){ return t<0.5? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  /* map viewport helpers: world logical coords -> screen, with padding */
  function view(cx,cy,span){
    var pad=VW*0.16, availW=VW-2*pad, availH=VH-2*pad;
    var sc=Math.min(availW/span, availH/span);
    return {cx:cx,cy:cy,sc:sc};
  }
  function toS(v,px,py){ return [ VW/2+(px-v.cx)*v.sc, VH/2+(py-v.cy)*v.sc ]; }

  function bg(){ /* deep gradient backdrop in the card's style */
    var g=x.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,ST.bg[0]); g.addColorStop(.5,ST.bg[1]); g.addColorStop(1,ST.bg[2]);
    x.fillStyle=g; x.fillRect(0,0,VW,VH);
    /* faint graticule */
    x.strokeStyle='rgba(255,255,255,.05)'; x.lineWidth=1;
    for(var gy=0;gy<VH;gy+=120){ x.beginPath(); x.moveTo(0,gy); x.lineTo(VW,gy); x.stroke(); }
    for(var gx=0;gx<VW;gx+=120){ x.beginPath(); x.moveTo(gx,0); x.lineTo(gx,VH); x.stroke(); }
  }
  function drawTrail(v, upto, partial){
    /* solid trail through visited pins, dashed remainder */
    x.lineWidth=6; x.lineCap='round';
    for(var i=0;i<legs.length-1;i++){
      var a=toS(v,legs[i].x,legs[i].y), b=toS(v,legs[i+1].x,legs[i+1].y);
      var visible = i<upto;
      x.setLineDash(visible? [] : [10,12]);
      x.strokeStyle = visible? ST.trail||ST.accent : 'rgba(255,255,255,.22)';
      x.shadowColor=ST.trail||ST.accent; x.shadowBlur=visible?14:0;
      x.beginPath();
      if(i===upto && partial!=null){ var mx=lerp(legs[i].x,legs[i+1].x,partial), my=lerp(legs[i].y,legs[i+1].y,partial); var bb=toS(v,mx,my);
        x.moveTo(a[0],a[1]); x.lineTo(bb[0],bb[1]); }
      else { x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); }
      x.stroke();
    }
    x.setLineDash([]); x.shadowBlur=0;
  }
  function drawPins(v, upto){
    legs.forEach(function(p,i){
      var s=toS(v,p.x,p.y), active=i<=upto;
      x.save(); x.shadowColor=ST.trail||ST.pin; x.shadowBlur=active?20:6;
      x.fillStyle=active?ST.pin:'rgba(180,180,190,.5)'; x.beginPath(); x.arc(s[0],s[1],active?15:10,0,7); x.fill(); x.restore();
      x.fillStyle=ST.pinCore; x.beginPath(); x.arc(s[0],s[1],active?10:6,0,7); x.fill();
      x.fillStyle=ST.pinTxt; x.font='700 13px Outfit,Arial'; x.textAlign='center'; x.fillText(String(i+1),s[0],s[1]+5);
    });
  }
  function plane(v, fromP, toP, tt){
    var px=lerp(fromP.x,toP.x,tt), py=lerp(fromP.y,toP.y,tt), s=toS(v,px,py);
    var ang=Math.atan2(toP.y-fromP.y, toP.x-fromP.x);
    x.save(); x.translate(s[0],s[1]); x.rotate(ang);
    x.fillStyle='#fff'; x.shadowColor=ST.accent; x.shadowBlur=18;
    /* simple plane glyph */
    x.beginPath(); x.moveTo(24,0); x.lineTo(-14,-11); x.lineTo(-6,0); x.lineTo(-14,11); x.closePath(); x.fill();
    x.fillRect(-16,-3,10,6);
    x.restore(); x.shadowBlur=0;
  }
  function caption(top,big,small,alpha){
    x.save(); x.globalAlpha=alpha; x.textAlign='center';
    var gy=x.createLinearGradient(0,VH-360,0,VH); gy.addColorStop(0,'rgba(7,9,15,0)'); gy.addColorStop(1,'rgba(7,9,15,.92)');
    x.fillStyle=gy; x.fillRect(0,VH-360,VW,360);
    if(top){ x.fillStyle=ST.accent; x.font='700 32px '+ST.capFont; x.fillText(top,VW/2,VH-250); }
    if(big){ x.fillStyle='#fff'; x.font='700 66px '+ST.capFont;
      var t2=big.length>16? big.slice(0,16):big; x.fillText(t2,VW/2,VH-176); }
    if(small){ x.fillStyle='#C9C5BB'; x.font='italic 27px '+ST.capFont; x.fillText(small,VW/2,VH-128); }
    x.restore(); x.textAlign='left';
  }
  function watermark(){
    x.save(); x.globalAlpha=.5; x.textAlign='center';
    x.fillStyle=ST.accent; x.font='700 26px Outfit,Arial';
    x.fillText('\ud83e\udd77 ROAMWISE', VW/2, 60);
    x.restore(); x.textAlign='left';
  }

  function frame(now){
   try{
    var t=(now-t0)/1000;
    bg(); watermark();

    if(t<INTRO){
      /* SEGMENT 1 — INTRO: whole map framed, gentle zoom-in, title */
      var p=ease(t/INTRO);
      var spanAll=Math.max(60, Math.max(maxX-minX,maxY-minY)*1.5);
      var v=view((minX+maxX)/2,(minY+maxY)/2, spanAll*(1.25-0.25*p));
      drawTrail(v,-1,null); drawPins(v,-1);
      caption('THE JOURNEY OF', (C.name||'A TRAVELER').toUpperCase(), legs.length+' destinations \u00b7 a RoamWise film', Math.min(1,t/0.8));
    } else if(t < INTRO + hops*SEG){
      /* SEGMENTS 2..n — one 5s plane hop per leg, camera follows */
      var k=Math.floor((t-INTRO)/SEG), lt=((t-INTRO)%SEG)/SEG;
      if(k>hops-1){ k=hops-1; lt=1; }
      var A=legs[k], B=legs[k+1], e=ease(lt);
      /* camera frames the current hop, tightening as the plane flies */
      var midX=(A.x+B.x)/2, midY=(A.y+B.y)/2;
      var hopSpan=Math.max(30, (Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y)))*2.2);
      var v=view(midX,midY, hopSpan);
      drawTrail(v,k,e);
      drawPins(v,k + (e>0.98?1:0));
      plane(v,A,B,e);
      var toName=(names[k+1]||'Next stop').slice(0,18), fromName=(names[k]||'').slice(0,18);
      caption('CHAPTER '+(k+1)+' \u2192 '+(k+2), toName, k===0? 'the journey begins \u00b7 from '+fromName : 'flying in from '+fromName, 1);
    } else {
      /* FINAL SEGMENT — OUTRO: zoom back out over the full trail, thanks note */
      var ot=(t-INTRO-hops*SEG)/OUTRO, e3=ease(Math.min(1,ot));
      var spanAll2=Math.max(60, Math.max(maxX-minX,maxY-minY)*1.5);
      var v=view((minX+maxX)/2,(minY+maxY)/2, spanAll2*(0.9+0.35*e3));
      drawTrail(v,legs.length-1,null); drawPins(v,legs.length-1);
      caption('THANK YOU FOR TRAVELING', (C.name||'').toUpperCase(), 'make your own film \u00b7 roamwise.co.in', Math.min(1,ot*1.4));
    }

    if(t<DUR) requestAnimationFrame(frame); else rec.stop();
   }catch(err){ try{rec.stop();}catch(e2){} showToast('Film wrapped early \u2014 saved what rendered'); }
  }
  requestAnimationFrame(frame);
}

/* ==================== CERTIFICATE VERIFICATION ====================
   This is the useful property people actually want from "put it on a
   blockchain" — proof a certificate was not edited — delivered without a chain,
   a wallet, gas fees, or India's 30% VDA tax.

   A SHA-256 of the certificate's underlying numbers is printed on the image and
   stored with the record. Anyone can re-hash the stated values and compare. It
   costs nothing, works offline, and needs no third party.

   Honest about its limit: this proves the certificate has not been ALTERED
   since issue. It does not prove the underlying travel happened — that is
   self-reported, and no ledger of any kind would change that. A blockchain
   version would have exactly the same weakness while costing money, which is
   the part crypto-for-certificates pitches always skip. */
async function rwCertHash(payload){
  var text = [payload.name, payload.kg, payload.trips, payload.issued].join('|');
  if(window.crypto && crypto.subtle){
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('').slice(0,16).toUpperCase();
  }
  /* fallback for very old webviews */
  var h=0; for(var i=0;i<text.length;i++){ h=((h<<5)-h+text.charCodeAt(i))|0; }
  return ('00000000'+(h>>>0).toString(16)).slice(-8).toUpperCase();
}
function rwVerifyPanelHTML(){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A8A,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udd0e Verify a certificate</div>'
    +'<div class="tk-meta">Check that a RoamWise certificate has not been edited</div></div>'
    +'<div class="tk-sec">'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.6">Paste the details printed on the certificate. If the code matches, nothing has been altered since it was issued.</div>'
    +'<input id="vfName" class="k-inp" placeholder="Name on the certificate" style="width:100%;margin-top:9px">'
    +'<input id="vfKg" class="k-inp" type="number" placeholder="kg CO\u2082e avoided" style="width:100%;margin-top:7px">'
    +'<input id="vfTrips" class="k-inp" type="number" placeholder="journeys logged" style="width:100%;margin-top:7px">'
    +'<input id="vfDate" class="k-inp" placeholder="Issued date, e.g. 24 July 2026" style="width:100%;margin-top:7px">'
    +'<input id="vfCode" class="k-inp" placeholder="Verification code from the certificate" style="width:100%;margin-top:7px;font-family:monospace">'
    +'<button class="tk-chip gold" style="width:100%;padding:11px;margin-top:10px" onclick="rwVerifyRun()">Check it</button>'
    +'<div id="vfOut" style="margin-top:10px"></div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">What this does and does not prove</div>'
    +'<div class="tk-bul">\u2713 Proves the numbers on the certificate are the ones issued \u2014 nobody edited the image.</div>'
    +'<div class="tk-bul">\u2717 Does not prove the journeys happened. Those are self-logged, and no ledger \u2014 blockchain included \u2014 could verify them either.</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:6px">SHA-256, computed on your device. No blockchain, no wallet, no fee.</div>'
    +'</div></div>';
}
async function rwVerifyRun(){
  var out=el('vfOut'); if(!out) return;
  var payload={ name:(el('vfName')||{}).value||'', kg:(el('vfKg')||{}).value||'',
                trips:(el('vfTrips')||{}).value||'', issued:(el('vfDate')||{}).value||'' };
  var claimed=String((el('vfCode')||{}).value||'').trim().toUpperCase();
  if(!claimed){ out.innerHTML='<div style="font-size:12px;color:var(--t3)">Paste the code from the certificate.</div>'; return; }
  var real = await rwCertHash(payload);
  var ok = real===claimed;
  out.innerHTML='<div style="background:'+(ok?'rgba(74,222,128,.1)':'rgba(224,91,91,.1)')
    +';border:1px solid '+(ok?'rgba(74,222,128,.4)':'rgba(224,91,91,.4)')
    +';border-radius:10px;padding:11px 13px">'
    +'<b style="font-size:13px;color:'+(ok?'#4ADE80':'#E05B5B')+'">'+(ok?'\u2713 Genuine':'\u2717 Does not match')+'</b>'
    +'<div style="font-size:11.5px;color:var(--t2);line-height:1.55;margin-top:4px">'
    +(ok? 'These values produce exactly the code on the certificate.'
        : 'The values you entered produce <code>'+esc2(real)+'</code>, not <code>'+esc2(claimed)+'</code>. Either something was typed differently, or the certificate was altered.')
    +'</div></div>';
}

/* ==================== ECO CERTIFICATE ====================
   Rendered to a canvas so it can be saved as a real PNG and shared. Deliberately
   states AVOIDED emissions rather than "carbon removed" or "climate reversed" —
   an honest certificate is worth keeping; an inflated one is worth nothing and
   would be greenwashing on the traveller's behalf. */
function rwEcoCert(){
  var d = rwEcoLoad(), kg = d.kgSaved||0, eq = rwEcoEquiv(kg);
  var badges = rwEcoBadges(kg).filter(function(b){ return b.earned; });
  var top = badges.length ? badges[badges.length-1] : {icon:'\ud83c\udf31', name:'First Step'};
  var name = (user && (user.displayName || (user.email||'').split('@')[0])) || 'Traveller';

  var W=1080, H=1350, c=document.createElement('canvas');
  c.width=W; c.height=H;
  var x=c.getContext('2d');

  var g=x.createLinearGradient(0,0,W,H);
  g.addColorStop(0,'#052E16'); g.addColorStop(.55,'#0A0A0C'); g.addColorStop(1,'#14532D');
  x.fillStyle=g; x.fillRect(0,0,W,H);

  /* subtle contour rings */
  x.strokeStyle='rgba(74,222,128,.10)'; x.lineWidth=2;
  for(var r=120;r<900;r+=64){ x.beginPath(); x.arc(W/2, 470, r, 0, Math.PI*2); x.stroke(); }

  x.strokeStyle='rgba(232,186,108,.55)'; x.lineWidth=3;
  x.strokeRect(44,44,W-88,H-88);

  x.textAlign='center'; x.fillStyle='#E8BA6C';
  x.font='600 26px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('R O A M W I S E', W/2, 132);
  x.font='500 17px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillStyle='rgba(255,255,255,.62)';
  x.fillText('LOW-CARBON TRAVEL', W/2, 168);

  x.font='700 96px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(top.icon, W/2, 320);

  x.fillStyle='#FFFFFF'; x.font='800 62px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(top.name, W/2, 410);

  x.fillStyle='rgba(255,255,255,.75)'; x.font='400 26px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('awarded to', W/2, 478);
  x.fillStyle='#E8BA6C'; x.font='700 52px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(name, W/2, 546);

  x.fillStyle='#4ADE80'; x.font='800 118px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(kg.toLocaleString('en-IN'), W/2, 712);
  x.fillStyle='rgba(255,255,255,.82)'; x.font='500 30px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('kg CO\u2082e avoided', W/2, 758);

  x.fillStyle='rgba(255,255,255,.62)'; x.font='400 24px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('\u2248 what ' + eq.trees + ' mature trees absorb in a year', W/2, 820);
  x.fillText('\u2248 ' + eq.kmNotDriven.toLocaleString('en-IN') + ' km not driven', W/2, 862);
  x.fillText(d.trips.length + ' low-carbon journeys logged', W/2, 904);

  /* earned badges row */
  var bx = W/2 - (badges.length-1)*46;
  x.font='400 54px -apple-system,Segoe UI,Roboto,sans-serif';
  badges.forEach(function(b,i){ x.fillText(b.icon, bx + i*92, 1010); });

  x.fillStyle='rgba(255,255,255,.42)'; x.font='400 20px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}), W/2, 1108);
  x.fillStyle='rgba(255,255,255,.34)'; x.font='400 17px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('Avoided emissions vs the default option \u2014 not carbon removed from the air.', W/2, 1176);
  x.fillText('Calculated with DEFRA/BEIS 2023 and IPCC AR6 average factors.', W/2, 1206);
  x.fillStyle='#E8BA6C'; x.font='600 20px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('roamwise.co.in', W/2, 1262);

  /* tamper-evidence: print a hash of the stated values so anyone can check the
     certificate was not edited — see rwVerifyPanelHTML for why this beats
     minting it on a chain */
  var issued = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  rwCertHash({name:name, kg:kg, trips:d.trips.length, issued:issued}).then(function(code){
    x.fillStyle='rgba(255,255,255,.30)'; x.font='400 15px monospace';
    x.fillText('verify: '+code+'  ·  roamwise.co.in/verify', W/2, 1300);
  });

  c.toBlob(function(blob){
    var url=URL.createObjectURL(blob);
    var f=new File([blob],'roamwise-eco-certificate.png',{type:'image/png'});
    var canShare = navigator.canShare && navigator.canShare({files:[f]});
    var ov=el('certOverlay');
    if(!ov){
      ov=document.createElement('div'); ov.id='certOverlay'; ov.className='overlay';
      ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83c\udfc5 Your certificate</b><button class="x" onclick="rwOverlayClose(\'certOverlay\')">\u2715</button></div>'
        +'<div id="certBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
      document.body.appendChild(ov);
    }
    el('certBody').innerHTML =
      '<img src="'+url+'" style="width:100%;border-radius:14px;border:1px solid var(--b2,#2A2A36)">'
      +'<div style="display:flex;gap:8px;margin-top:12px">'
      +'<a class="g-btn" style="flex:1;text-align:center;text-decoration:none;padding:12px" download="roamwise-eco-certificate.png" href="'+url+'">\u2b07\ufe0f Save</a>'
      + (canShare? '<button class="tact" style="flex:1;padding:12px;font-weight:800" onclick="rwCertShare()">\ud83d\udce4 Share</button>' : '')
      +'</div>'
      +'<p style="font-size:11px;color:var(--t3);line-height:1.6;margin-top:10px">This records emissions you <b>avoided</b> by choosing lower-carbon options \u2014 not carbon removed from the atmosphere. Both matter; only one is honest to claim.</p>';
    window._rwCertFile = f;
    rwOverlayOpen('certOverlay');
  }, 'image/png');
}
function rwCertShare(){
  var f=window._rwCertFile; if(!f) return;
  if(navigator.share){ navigator.share({files:[f], title:'My RoamWise low-carbon travel', text:'Travelling lighter with @roamwise'}).catch(function(){}); }
}
