// @ts-nocheck
/* journey-certificate.js — Journey Certificate: DOM render (openJourneyCert), share
   (certShare) and download (certDownload). Split out of js/itinerary/certificates.js
   (which bundled 5 unrelated certificate/movie features) as an SRP cleanup; verbatim
   move, zero logic changes. */

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
