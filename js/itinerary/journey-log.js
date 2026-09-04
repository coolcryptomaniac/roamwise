// @ts-nocheck
/* journey-log.js — Emotional Journey Log (mood-tagged journal entries) and the
   Journey Log + Digital Card feature: the visited-places log, the shareable
   Shinobi-style digital journey card (drawCard, card styles), and the Travel &
   Earn viral share (cardShareWa). Moved verbatim from app.js as part of Phase 5a
   modularization; zero logic changes. */

/* ===================== EMOTIONAL JOURNEY LOG =====================
   Capture how a MOMENT felt, not just what you did. Builds a personal emotional
   timeline across all your travels — the thing you actually reread years later.
   Device-only (private). Approved feature, finally built. */
var RW_MOODS=[
  {e:'\ud83e\udd29',k:'awestruck',c:'#F0A63B'},
  {e:'\ud83d\ude0c',k:'at peace',c:'#4ADE80'},
  {e:'\ud83e\udd17',k:'grateful',c:'#A78BFA'},
  {e:'\ud83d\ude02',k:'joyful',c:'#38BDF8'},
  {e:'\ud83d\ude2e',k:'surprised',c:'#FB7185'},
  {e:'\ud83d\ude25',k:'overwhelmed',c:'#94A3B8'},
  {e:'\ud83e\udd79',k:'moved',c:'#F472B6'},
  {e:'\ud83d\ude34',k:'exhausted',c:'#64748B'}
];
function journalGet(){ try{ return JSON.parse(lsGet('rw_journal')||'[]'); }catch(e){ return []; } }
function journalSet(a){ try{ lsSet('rw_journal', JSON.stringify(a.slice(0,300))); }catch(e){} }
function openJourneyLog(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('journeySection');
  if(!sec){ sec=document.createElement('section'); sec.id='journeySection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  var place=(window._lastItin&&window._lastItin.name)||'';
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udcd6 Journey <em>journal</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'journeySection\')">\u2715</button></div>'
    +'<p class="xsec-sub">How did this moment feel? Capture the feeling \u2014 your emotional map of every place you\u2019ve been.</p>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px;margin-bottom:14px">'
    +'<div style="font-size:12px;color:var(--t3);margin-bottom:8px">HOW ARE YOU FEELING RIGHT NOW?</div>'
    +'<div id="moodPick" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">'
    + RW_MOODS.map(function(m,i){ return '<button class="mood-btn" data-mood="'+i+'" onclick="rwMoodPick('+i+')" style="font-size:24px;background:var(--bg3,#171A24);border:2px solid transparent;border-radius:12px;padding:8px 10px;cursor:pointer" title="'+m.k+'">'+m.e+'</button>'; }).join('')
    +'</div>'
    +'<input id="journalPlace" class="rwi-input" placeholder="Where? (e.g. '+esc2(place||'Rishikesh, sunset at the ghat')+')" style="width:100%;background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:11px;color:var(--t1);margin-bottom:10px;font:inherit">'
    +'<textarea id="journalNote" placeholder="What made it special? One honest line\u2026" style="width:100%;min-height:70px;background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:11px;color:var(--t1);font:inherit;resize:vertical"></textarea>'
    +'<button class="tact" style="width:100%;margin-top:10px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwJournalSave()">Save this moment</button>'
    +'</div>'
    +'<div id="journalTimeline"></div>';
  window._journalMood=null;
  rwJournalRender();
}
function rwMoodPick(i){
  window._journalMood=i;
  var btns=document.querySelectorAll('#moodPick .mood-btn');
  btns.forEach(function(b){ var on=+b.getAttribute('data-mood')===i; b.style.borderColor=on?RW_MOODS[i].c:'transparent'; b.style.background=on?'rgba(232,186,108,.12)':'var(--bg3,#171A24)'; });
}
function rwJournalSave(){
  var mood=window._journalMood;
  if(mood==null){ showToast('Pick how it felt first \ud83d\ude0a'); return; }
  var place=(el('journalPlace')&&el('journalPlace').value.trim())||'';
  var note=(el('journalNote')&&el('journalNote').value.trim())||'';
  if(!place && !note){ showToast('Add a place or a line to remember it by'); return; }
  var log=journalGet();
  log.unshift({mood:mood, place:place, note:note, at:Date.now()});
  journalSet(log);
  try{ badgeBump('journal'); }catch(e){}
  try{ rwHaptic(); }catch(e){}
  showToast('Moment saved \ud83d\udcd6');
  if(el('journalPlace')) el('journalPlace').value='';
  if(el('journalNote')) el('journalNote').value='';
  window._journalMood=null; rwMoodPick(-1);
  rwJournalRender();
}
function rwJournalRender(){
  var host=el('journalTimeline'); if(!host) return;
  var log=journalGet();
  if(!log.length){ host.innerHTML='<div class="note" style="text-align:center;padding:20px;color:var(--t3)">Your emotional map starts with the first moment you save. \u2728</div>'; return; }
  // group by mood for a quick "how your travels feel" summary
  var counts={}; log.forEach(function(x){ counts[x.mood]=(counts[x.mood]||0)+1; });
  var top=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];})[0];
  var summary = top!=null ? '<div style="text-align:center;font-size:13px;color:var(--t2);margin-bottom:14px">Your travels mostly feel <b style="color:'+RW_MOODS[top].c+'">'+RW_MOODS[top].e+' '+RW_MOODS[top].k+'</b> \u00b7 '+log.length+' moment'+(log.length>1?'s':'')+' logged</div>' : '';
  host.innerHTML=summary + log.map(function(x){
    var m=RW_MOODS[x.mood]||RW_MOODS[0];
    var d=new Date(x.at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
    return '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--b1,rgba(255,255,255,.06))">'
      +'<div style="font-size:28px;flex:0 0 auto">'+m.e+'</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:11px;color:'+m.c+';font-weight:700;text-transform:uppercase;letter-spacing:.04em">'+m.k+(x.place?' \u00b7 '+esc2(x.place):'')+'</div>'
      +(x.note?'<div style="font-size:14px;color:var(--t1);margin:2px 0">'+esc2(x.note)+'</div>':'')
      +'<div style="font-size:11px;color:var(--t3)">'+d+'</div>'
      +'</div></div>';
  }).join('');
}
function rwRenderLog(){
  var log=[]; try{ log=JSON.parse(lsGet('rw_memlog')||'[]'); }catch(e){}
  var out=el('memLogOut'); if(!out) return;
  if(!log.length){ out.innerHTML='<div class="note">Your travel memories will collect here \u2014 each blog and collage you make gets logged as a keepsake.</div>'; return; }
  var ic={blog:'\ud83d\udcdd',collage:'\ud83d\uddbc\ufe0f'};
  out.innerHTML=log.map(function(m){
    var d=new Date(m.at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    return '<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--b1)"><span style="font-size:22px">'+(ic[m.kind]||'\u2728')+'</span>'
      +'<div style="flex:1"><b style="font-size:13px">'+esc2(m.dest)+'</b> <span style="font-size:11px;color:var(--t3)">'+esc2(m.detail||'')+'</span><div style="font-size:10.5px;color:var(--t3)">'+d+'</div></div></div>';
  }).join('');
}

/* ===== JOURNEY LOG + DIGITAL CARD ===== */
function logGet(){ return JSON.parse(lsGet('rw_log')||'[]'); }
function logPaint(){
  var box=el('logChips'); if(!box) return;
  var L=logGet();
  box.innerHTML = L.length? L.map(function(p,i){return '<span class="log-chip">\ud83d\udccd '+logName(p)+'<button onclick="logDel('+i+')">\u00d7</button></span>';}).join('')
    : '<span style="font-size:11px;color:var(--t3)">No journeys logged yet \u2014 add your first above.</span>';
}
/* Common compound city names people type without a space — the geocoding
   API does exact-ish string matching, so "Newyork" literally matched a
   tiny real village in Scotland instead of New York City. This normalizes
   the handful of most common cases before searching. */
var CITY_NAME_FIXUPS = {
  'newyork':'New York', 'losangeles':'Los Angeles', 'sanfrancisco':'San Francisco',
  'saopaulo':'Sao Paulo', 'hongkong':'Hong Kong', 'newdelhi':'New Delhi',
  'capetown':'Cape Town', 'buenosaires':'Buenos Aires', 'kualalumpur':'Kuala Lumpur',
  'lasvegas':'Las Vegas', 'saltlakecity':'Salt Lake City'
};
function logAdd(){
  var v=(el('logInput').value||'').trim(); if(!v) return;
  if(v.length>40) v=v.slice(0,40);
  v=v.replace(/[<>]/g,'');
  var fixup = CITY_NAME_FIXUPS[v.toLowerCase().replace(/[^a-z]/g,'')];
  if(fixup) v = fixup;
  var L=logGet(); var entry={n:v}; L.push(entry); lsSet('rw_log',JSON.stringify(L));
  el('logInput').value=''; logPaint();
  /* free geocoding — Open-Meteo, no key */
  var q=v.replace(/\b(19|20)\d\d\b/g,'').trim();
  fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(q))
    .then(function(r){return r.json();}).then(function(j){
      var g=(j.results||[])[0]; if(!g) return;
      var L2=logGet();
      for(var i=L2.length-1;i>=0;i--){ var e=L2[i]; if((e.n||e)===v && e.lat===undefined){
        L2[i]={n:v,lat:g.latitude,lon:g.longitude,country:g.country||'',countryCode:g.country_code||''};
        showToast('\ud83d\udccd Logged '+v+' \u2014 '+(g.country||'located')); break; } }
      lsSet('rw_log',JSON.stringify(L2));
    }).catch(function(){});
}
function logName(e){ return typeof e==='string'? e : e.n; }
function logDel(i){ var L=logGet(); L.splice(i,1); lsSet('rw_log',JSON.stringify(L)); logPaint(); }
// initial logPaint() call left in app.js (see "JOURNEY LOG + DIGITAL CARD moved..."
// marker) — el() isn't defined yet at this point in the script load order, since
// el() lives later in app.js itself; this file loads before app.js.
function askName(cb){
  var n = lsGet('rw_name') || (window.user && user.displayName) || '';
  if(!n){
    n = prompt('Your name for the Journey Card (appears as the title):','') || 'A Wanderer';
    n = n.trim().slice(0,24) || 'A Wanderer';
  }
  lsSet('rw_name', n); cb(n);
}
function makeCard(){
  var L=logGet(); if(!L.length) return showToast('Log at least one place first');
  askName(function(name){
    /* Painting-grade dark world map — CARTO tiles, zoom 3 (8x8 grid) */
    var Z=3, N=8, need=N*N, fail=false, tiles=[]; tiles.N=N;
    showToast('Painting your world\u2026 \ud83c\udfa8 (fetching your cover photo too)');
    for(var ty=0;ty<N;ty++) for(var tx=0;tx<N;tx++) (function(tx,ty){
      var im=new Image(); im.crossOrigin='anonymous';
      im.onload=function(){ tiles[ty*N+tx]=im; if(--need===0) after(); };
      im.onerror=function(){ fail=true; if(--need===0) after(); };
      im.src='https://'+(['a','b','c'][ (tx+ty)%3 ])+'.basemaps.cartocdn.com/rastertiles/voyager/'+Z+'/'+tx+'/'+ty+'.png';
    })(tx,ty);
    /* real destination photo for the cinematic cover backdrop — the flagship/most-recent place.
       Uses fetchImg64 (fetch -> blob -> dataURL), the SAME proven path the PDF pipeline uses —
       this keeps the resulting <img> same-origin so the canvas never gets tainted (toDataURL
       must keep working for save/share). Hard timeout: never let a slow fetch block the card. */
    var heroName = logName(L[L.length-1]) || logName(L[0]);
    var heroImg = null, heroDone = false, heroTimer=setTimeout(function(){ if(!heroDone){ heroDone=true; maybeGo(); } }, 8000);
    imgTry([
      function(){ return wikiThumb(heroName); },
      function(){ return wikiAction(heroName); },
      function(){ return wikiAction(heroName.split(',')[0]); }
    ]).then(function(u){ if(heroDone) return null; if(!u) return null; return fetchImg64(u); })
    .then(function(dataUrl){ if(heroDone) return; if(!dataUrl){ heroDone=true; clearTimeout(heroTimer); maybeGo(); return; }
      var im2=new Image();
      im2.onload=function(){ if(heroDone) return; heroImg=im2; heroDone=true; clearTimeout(heroTimer); maybeGo(); };
      im2.onerror=function(){ if(heroDone) return; heroDone=true; clearTimeout(heroTimer); maybeGo(); };
      im2.src=dataUrl;
    }).catch(function(){ if(heroDone) return; heroDone=true; clearTimeout(heroTimer); maybeGo(); });
    var tilesReady=false;
    function after(){ tilesReady=true; maybeGo(); }
    function maybeGo(){ if(tilesReady && heroDone) drawCard(L,name,fail?null:tiles,heroImg); }
  });
}
function mercY(lat,H){ var r=lat*Math.PI/180; return (1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*H; }
var PRAISE={Genin:'Every legend begins with a single step \u2014 yours already covers the map.',
 Chunin:'The roads are starting to learn this name.',
 Jonin:'A seasoned wanderer \u2014 borders bend around such travelers.',
 ANBU:'Moving through the world the way wind moves through pines.',
 Kage:'Master of the wandering arts. The map keeps this one\u2019s secrets.'};
var CARD_STYLES={
 atlas:{label:'Classic Atlas',bg:['#0B0D18','#10101F','#160D13'],pin:'#C4302B',pinCore:'#E8BA6C',pinTxt:'#0A0A12',trail:null,accent:'#E8BA6C',capFont:'Georgia,serif',tint:null},
 noir:{label:'Minimal Noir',bg:['#0A0A0E','#0E0E13','#0A0A0E'],pin:'#F2EFE8',pinCore:'#0A0A0E',pinTxt:'#F2EFE8',trail:'#B8B4A8',accent:'#EDEAE2',capFont:'Outfit,Arial',tint:['rgba(0,0,0,.28)','rgba(255,255,255,.05)']},
 neon:{label:'Neon Voyage',bg:['#070113','#0E0330','#12042E'],pin:'#FF2E9A',pinCore:'#070113',pinTxt:'#FF2E9A',trail:'#00E5FF',accent:'#00E5FF',capFont:'Outfit,Arial',tint:['rgba(0,229,255,.07)','rgba(255,46,154,.06)']},
 shadow:{label:'\ud83e\udd77 Shadow Clone',bg:['#050505','#0B0808','#050505'],pin:'#E8BA6C',pinCore:'#050505',pinTxt:'#E8BA6C',trail:'#C4302B',accent:'#E8BA6C',capFont:'Georgia,serif',tint:['rgba(196,48,43,.10)','rgba(0,0,0,.35)'],secret:true}};
function cardStyleGet(){ return CARD_STYLES[lsGet('rw_cardstyle')||'neon']||CARD_STYLES.neon; }
function setCardStyle(k){ lsSet('rw_cardstyle',k);
  document.querySelectorAll('.cstyle').forEach(function(b){ b.classList.toggle('red', b.dataset.k===k); });
  showToast(CARD_STYLES[k].label+' style armed'); makeCard(); }
function drawCard(L, name, tiles, heroPhoto){
  var ST=cardStyleGet();
  var W=1200,H=1600,c=document.createElement('canvas');
  c.width=W*2; c.height=H*2;                    /* 2400x3200 \u2014 print-grade */
  var x=c.getContext('2d'); x.scale(2,2);
  window._rwCard=c;
  /* canvas backdrop */
  var bg=x.createLinearGradient(0,0,W,H); bg.addColorStop(0,ST.bg[0]); bg.addColorStop(.55,ST.bg[1]); bg.addColorStop(1,ST.bg[2]);
  x.fillStyle=bg; x.fillRect(0,0,W,H);
  /* watermark weave */
  x.save(); x.globalAlpha=0.04; x.fillStyle='#E8BA6C'; x.font='700 40px Outfit,Arial';
  x.translate(W/2,H/2); x.rotate(-Math.PI/8);
  for(var wy=-H;wy<H;wy+=120) for(var wx=-W;wx<W;wx+=330) x.fillText('ROAMWISE',wx,wy);
  x.restore();
  /* vignette */
  var vg=x.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.5)');
  x.fillStyle=vg; x.fillRect(0,0,W,H);
  /* double gold frame + corner ticks */
  x.strokeStyle='rgba(232,186,108,.85)'; x.lineWidth=3; x.strokeRect(26,26,W-52,H-52);
  x.strokeStyle='rgba(232,186,108,.3)';  x.lineWidth=1; x.strokeRect(40,40,W-80,H-80);
  x.strokeStyle='#E8BA6C'; x.lineWidth=3;
  [[26,26],[W-26,26],[26,H-26],[W-26,H-26]].forEach(function(p){
    x.beginPath(); x.moveTo(p[0]-(p[0]>W/2?26:-26),p[1]); x.lineTo(p[0],p[1]); x.lineTo(p[0],p[1]-(p[1]>H/2?26:-26)); x.stroke();
  });
  /* ===== CINEMATIC PHOTO HERO (poster-style, like a real destination cover) ===== */
  var HY=48, HH=272, HX=48, HW=W-96;
  x.save(); x.beginPath(); x.rect(HX,HY,HW,HH); x.clip();
  if(heroPhoto){
    var ir=heroPhoto.width/heroPhoto.height, tr=HW/HH, sx2,sy2,sw2,sh2;
    if(ir>tr){ sh2=heroPhoto.height; sw2=sh2*tr; sx2=(heroPhoto.width-sw2)/2; sy2=0; }
    else { sw2=heroPhoto.width; sh2=sw2/tr; sx2=0; sy2=(heroPhoto.height-sh2)/2; }
    x.drawImage(heroPhoto, sx2,sy2,sw2,sh2, HX,HY,HW,HH);
    /* film grade: subtle style-accent tint on the photo */
    x.globalCompositeOperation='soft-light'; x.fillStyle=ST.accent+'22'; x.fillRect(HX,HY,HW,HH);
    x.globalCompositeOperation='source-over';
  } else {
    var hg=x.createLinearGradient(HX,HY,HX,HY+HH); hg.addColorStop(0,ST.bg[1]); hg.addColorStop(1,ST.bg[2]);
    x.fillStyle=hg; x.fillRect(HX,HY,HW,HH);
  }
  /* bottom gradient so title text always reads */
  var tg=x.createLinearGradient(HX,HY,HX,HY+HH); tg.addColorStop(0,'rgba(6,7,12,.15)'); tg.addColorStop(0.55,'rgba(6,7,12,.35)'); tg.addColorStop(1,'rgba(6,7,12,.92)');
  x.fillStyle=tg; x.fillRect(HX,HY,HW,HH);
  /* light rays (subtle, cinematic) */
  x.save(); x.globalAlpha=.10; x.fillStyle='#fff';
  for(var lr=0; lr<5; lr++){ x.save(); x.translate(HX+HW*(0.15+lr*0.18), HY); x.rotate(-0.12+lr*0.05);
    x.beginPath(); x.moveTo(0,0); x.lineTo(40,0); x.lineTo(-30,HH); x.lineTo(-70,HH); x.closePath(); x.fill(); x.restore(); }
  x.restore();
  x.restore(); /* end hero clip */
  x.strokeStyle=ST.accent; x.lineWidth=2; x.strokeRect(HX,HY,HW,HH);
  /* title over the photo, poster-style */
  x.textAlign='center';
  x.fillStyle='rgba(255,255,255,.72)'; x.font='600 13px Outfit,Arial';
  x.fillText('T H E   J O U R N E Y   M A P   O F', W/2, HY+HH-84);
  x.fillStyle='#fff'; x.font='700 52px Georgia,serif';
  x.save(); x.shadowColor='rgba(0,0,0,.6)'; x.shadowBlur=14;
  x.fillText(name, W/2, HY+HH-38); x.restore();
  var xp=xpGet(), r=rankOf(xp), streak=parseInt(lsGet('rw_streak')||'0',10)||0;
  var dnaArr=JSON.parse(lsGet('rw_dna')||'null');
  var vibe=dnaArr? ['Adventure','Culture','Chill','Party'][dnaArr[1]]||'' : '';
  x.fillStyle=ST.accent; x.font='italic 400 16px Georgia,serif';
  x.fillText('\u201c'+(PRAISE[r[1]]||PRAISE.Genin)+'\u201d', W/2, HY+HH+30);
  /* ===== MAP PLATE ===== */
  var MX=70, MY=HY+HH+56, MW=W-140, MH=Math.round(MW*0.62);
  x.save();
  x.shadowColor='rgba(0,0,0,.6)'; x.shadowBlur=26; x.shadowOffsetY=8;
  x.fillStyle='#0A0A12'; x.fillRect(MX-6,MY-6,MW+12,MH+12);
  x.restore();
  if(tiles){
    var TN=tiles.N||4, tw=MW/TN, th=MH/TN;
    for(var ty=0;ty<TN;ty++) for(var tx=0;tx<TN;tx++){
      var im=tiles[ty*TN+tx]; if(im) x.drawImage(im, MX+tx*tw, MY+ty*th, tw, th);
    }
    /* deepen the light basemap into a moody premium tone (multiply darkens, soft-light adds mood, style accent tints it) */
    x.save();
    x.globalCompositeOperation='multiply'; x.fillStyle='rgba(150,148,168,1)'; x.fillRect(MX,MY,MW,MH);
    x.globalCompositeOperation='soft-light'; x.fillStyle=ST.bg[0]; x.globalAlpha=.55; x.fillRect(MX,MY,MW,MH); x.globalAlpha=1;
    x.globalCompositeOperation='overlay'; x.fillStyle=ST.accent; x.globalAlpha=.06; x.fillRect(MX,MY,MW,MH); x.globalAlpha=1;
    x.restore();
    x.save(); x.shadowColor='rgba(0,0,0,.5)'; x.shadowBlur=30; x.strokeStyle=ST.accent; x.lineWidth=0; x.restore();
    /* lat/long graticule with labels */
    x.save(); x.beginPath(); x.rect(MX,MY,MW,MH); x.clip();
    x.strokeStyle='rgba(255,255,255,.18)'; x.fillStyle='rgba(255,255,255,.5)'; x.lineWidth=1; x.font='600 11px Outfit,Arial';
    for(var lo=-180; lo<=180; lo+=30){ var gx=MX+(lo+180)/360*MW;
      x.beginPath(); x.moveTo(gx,MY); x.lineTo(gx,MY+MH); x.stroke();
      x.textAlign='center'; x.fillText((lo>0?lo+'\u00b0E':lo<0?(-lo)+'\u00b0W':'0\u00b0'), gx, MY+MH-6); }
    for(var la=-60; la<=75; la+=30){ var gy=MY+mercY(la,MH);
      if(gy<MY||gy>MY+MH) continue;
      x.beginPath(); x.moveTo(MX,gy); x.lineTo(MX+MW,gy); x.stroke();
      x.textAlign='left'; x.fillText((la>0?la+'\u00b0N':la<0?(-la)+'\u00b0S':'0\u00b0'), MX+4, gy-4); }
    x.restore(); x.textAlign='left';
  } else {
    /* offline fallback \u2014 stylized continents */
    x.fillStyle='#141225'; x.fillRect(MX,MY,MW,MH);
    var CONT=['M28 38l30-12 26 6 8 18-16 22-20 26-10-2-6-24-14-14z','M84 96l14 4 6 16-8 26-12 6-8-20z','M150 30l30-10 22 8 6 14-10 10-16 26-14 6-12-18-10-16z','M158 92l16-4 14 10 4 20-14 20-14-6-8-22z','M214 26l52-8 34 10 14 20-16 18-28 12-24 20-18-8-12-26-8-22z','M282 108l22 2 12 14-8 14-22 2-10-16z'];
    x.save(); x.translate(MX,MY); x.scale(MW/360, MH/160);
    x.fillStyle='#2E2745'; CONT.forEach(function(pd){ x.fill(new Path2D(pd)); }); x.restore();
  }
  x.strokeStyle='#E8BA6C'; x.lineWidth=2.5; x.strokeRect(MX,MY,MW,MH);
  /* pins + arcs */
  function proj(e){
    if(typeof e.lat!=='number' || typeof e.lon!=='number' || !isFinite(e.lat) || !isFinite(e.lon)) return null;
    return [MX+(e.lon+180)/360*MW, MY+mercY(Math.max(-84,Math.min(84,e.lat)),MH)]; }
  var pts=[], legend=[];
  L.forEach(function(e,i){ var p=proj(e); legend.push({n:logName(e),p:p}); if(p) pts.push({p:p,num:legend.length}); });
  if(ST.tint){ x.save(); x.globalCompositeOperation='soft-light'; x.fillStyle=ST.tint[0]; x.fillRect(0,0,W,H);
    x.globalCompositeOperation='overlay'; x.fillStyle=ST.tint[1]; x.fillRect(0,0,W,H); x.restore(); }
  window._rwCine={pts:pts.map(function(o){return {x:o.p[0],y:o.p[1],num:o.num};}), names:legend.map(function(g){return g.n;}), name:name, W:W, H:H, style:lsGet('rw_cardstyle')||'neon'};
  /* golden arcs between consecutive located pins */
  x.save(); x.setLineDash([7,6]); x.lineWidth=2.6;
  x.beginPath(); x.rect(MX,MY,MW,MH); x.clip();   /* arcs stay inside the map plate */
  for(var i=0;i<pts.length-1;i++){
    var a=pts[i].p, b=pts[i+1].p;
    if(!a||!b) continue;
    if(ST.trail){ x.strokeStyle=ST.trail; }
    else { var grad=x.createLinearGradient(a[0],a[1],b[0],b[1]);
      grad.addColorStop(0,'rgba(232,186,108,.9)'); grad.addColorStop(1,'rgba(196,48,43,.9)');
      x.strokeStyle=grad; }
    x.beginPath();
    if(Math.abs(a[0]-b[0]) > MW*0.55){ x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); }   /* huge hops: straight, no wild arc */
    else { var my2=Math.max(MY+8, Math.min(a[1],b[1]) - Math.min(70, Math.abs(a[0]-b[0])*0.25) - 12);
      x.moveTo(a[0],a[1]); x.quadraticCurveTo((a[0]+b[0])/2, my2, b[0], b[1]); }
    x.stroke();
  }
  x.restore();
  /* numbered glowing pins */
  x.save(); x.beginPath(); x.rect(MX,MY,MW,MH); x.clip();
  pts.forEach(function(o,idx){
    var p=o.p, nm=(legend[o.num-1]&&legend[o.num-1].n||'').slice(0,18);
    /* label chip */
    x.font='700 15px Outfit,Arial'; var tw2=x.measureText(nm).width;
    var lx=Math.min(MX+MW-tw2-16, Math.max(MX+4, p[0]+16)), lyy=Math.max(MY+16,p[1]-10);
    x.fillStyle='rgba(7,9,15,.72)'; x.fillRect(lx-6, lyy-15, tw2+12, 22);
    x.fillStyle=ST.accent; x.textAlign='left'; x.fillText(nm, lx, lyy);
    /* pin */
    x.save(); x.shadowColor=ST.trail||ST.pin; x.shadowBlur=20;
    x.fillStyle=ST.pin; x.beginPath(); x.arc(p[0],p[1],16,0,7); x.fill(); x.restore();
    x.fillStyle=ST.pinCore; x.beginPath(); x.arc(p[0],p[1],11,0,7); x.fill();
    x.fillStyle=ST.pinTxt; x.font='700 14px Outfit,Arial'; x.textAlign='center';
    x.fillText(String(o.num), p[0], p[1]+5);
  });
  x.restore(); x.textAlign='left';
  x.fillStyle='#54524C'; x.font='400 10px Outfit,Arial'; x.textAlign='right';
  x.fillText('Map \u00a9 OpenStreetMap contributors \u00a9 CARTO', MX+MW-6, MY+MH-8);
  /* ===== LEGEND \u2014 two columns, numbered ===== */
  x.textAlign='left';
  x.fillStyle='#E8BA6C'; x.font='700 16px Outfit,Arial';
  x.fillText('T H E   J O U R N E Y S', MX, MY+MH+56);
  x.strokeStyle='rgba(232,186,108,.3)'; x.lineWidth=1;
  x.beginPath(); x.moveTo(MX+190,MY+MH+51); x.lineTo(MX+MW,MY+MH+51); x.stroke();
  var colW=MW/2, ly0=MY+MH+92, show=legend.slice(0,14);
  show.forEach(function(g,i){
    var cx2=MX+(i%2)*colW, cy2=ly0+Math.floor(i/2)*42;
    x.fillStyle='#C4302B'; x.beginPath(); x.arc(cx2+9,cy2-5,9,0,7); x.fill();
    x.fillStyle='#E8BA6C'; x.font='700 10px Outfit,Arial'; x.textAlign='center'; x.fillText(String(i+1),cx2+9,cy2-1);
    x.textAlign='left'; x.fillStyle='#EDE8DF'; x.font='500 17px Georgia,serif';
    x.fillText(g.n.slice(0,30), cx2+28, cy2);
  });
  if(legend.length>14){ x.fillStyle='#8A8880'; x.font='italic 14px Georgia,serif';
    x.fillText('\u2026 and '+(legend.length-14)+' more roads', MX, ly0+7*42+8); }
  /* ===== DECOR BAND — Himalayan silhouette + compass ===== */
  var artY=H-330;
  x.save(); x.globalAlpha=.5;
  var rg=x.createLinearGradient(0,artY-60,0,artY+40);
  rg.addColorStop(0,'rgba(232,186,108,0)'); rg.addColorStop(1,'rgba(232,186,108,.28)');
  x.fillStyle=rg;
  x.beginPath(); x.moveTo(60,artY+40);
  var ridge=[[60,10],[150,-38],[230,-8],[320,-62],[400,-20],[470,-70],[560,-14],[650,-52],[730,-6],[820,-44],[900,-12],[1000,-58],[1080,-4],[1140,-30]];
  ridge.forEach(function(pt){ x.lineTo(pt[0],artY+pt[1]); });
  x.lineTo(W-60,artY+40); x.closePath(); x.fill();
  x.restore();
  /* snow caps */
  x.fillStyle='rgba(250,240,225,.5)';
  [[320,-62],[470,-70],[1000,-58]].forEach(function(pt){
    x.beginPath(); x.moveTo(pt[0]-14,artY+pt[1]+16); x.lineTo(pt[0],artY+pt[1]); x.lineTo(pt[0]+14,artY+pt[1]+16); x.closePath(); x.fill();
  });
  /* faint compass rose */
  x.save(); x.globalAlpha=.35; x.strokeStyle='#E8BA6C'; x.lineWidth=1.5;
  var ccx=W-150, ccy=artY-70;
  x.beginPath(); x.arc(ccx,ccy,42,0,7); x.stroke();
  x.beginPath(); x.arc(ccx,ccy,30,0,7); x.stroke();
  for(var ca=0;ca<8;ca++){ var rr2=ca%2?34:46, an=ca*Math.PI/4;
    x.beginPath(); x.moveTo(ccx,ccy); x.lineTo(ccx+Math.cos(an)*rr2, ccy+Math.sin(an)*rr2); x.stroke(); }
  x.fillStyle='#E8BA6C'; x.font='700 12px Georgia,serif'; x.textAlign='center'; x.fillText('N', ccx, ccy-50);
  x.restore(); x.textAlign='left';
  /* ===== STATS STRIP ===== */
  var sy=H-262, boxes=[['\ud83e\udd77 '+r[1].toUpperCase(),'traveler rank'],[xp+' XP','experience'],[String(L.length),'journeys'],[streak+' days','streak'+(vibe?'':'')]];
  if(vibe) boxes[3]=[vibe,'soul \u00b7 '+streak+'-day streak'];
  var bw=(W-172)/4;
  boxes.forEach(function(b2,i){
    var bx=86+i*bw;
    x.strokeStyle='rgba(232,186,108,.3)'; x.lineWidth=1; x.strokeRect(bx+6,sy,bw-12,74);
    x.fillStyle='#E8BA6C'; x.font='700 20px Outfit,Arial'; x.textAlign='center';
    x.fillText(b2[0], bx+bw/2, sy+32);
    x.fillStyle='#8A8880'; x.font='400 11px Outfit,Arial';
    x.fillText(b2[1].toUpperCase(), bx+bw/2, sy+54);
  });
  if(isPro){ var _cst=rwStatusLabel(); x.fillStyle='#E8BA6C'; x.font='700 15px Outfit,Arial'; x.textAlign='center';
    /* Honest cert label: never claim "LIFETIME" for a trial or a free
       partner-code grant \u2014 see rwStatusLabel(). */
    var certTxt = _cst.code==='trial' ? ('\u23f3 '+_cst.text) : ('\ud83d\udc51 '+_cst.text+' MEMBER');
    x.fillText(certTxt, W/2, sy-16); }
  /* ===== CERTIFICATE OF ACHIEVEMENT: seal + signature + date ===== */
  var dateStr=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  var certY=H-152;
  x.textAlign='center';
  x.fillStyle=ST.accent; x.font='700 15px Georgia,serif';
  x.fillText('C E R T I F I C A T E   O F   A C H I E V E M E N T', W/2, certY);
  x.strokeStyle=(ST.trail||ST.accent); x.globalAlpha=.5; x.lineWidth=1;
  x.beginPath(); x.moveTo(W/2-210,certY+10); x.lineTo(W/2+210,certY+10); x.stroke(); x.globalAlpha=1;
  x.fillStyle='#B8B4A8'; x.font='400 12px Georgia,serif';
  x.fillText('This certifies that '+name+' has journeyed '+L.length+' destination'+(L.length===1?'':'s')+' \u00b7 rank of '+r[1], W/2, certY+30);
  /* wax-style circular seal (left) */
  var sx2=150, syl=certY+36;
  x.save(); x.translate(sx2,syl);
  x.fillStyle=(ST.pin); x.globalAlpha=.9;
  x.beginPath(); for(var pa=0;pa<16;pa++){ var an=pa*Math.PI/8, rr=pa%2?30:36; x[pa?'lineTo':'moveTo'](Math.cos(an)*rr,Math.sin(an)*rr); } x.closePath(); x.fill();
  x.globalAlpha=1; x.strokeStyle='rgba(255,255,255,.6)'; x.lineWidth=1.5; x.beginPath(); x.arc(0,0,24,0,7); x.stroke();
  x.fillStyle='#fff'; x.font='700 13px Georgia,serif'; x.textAlign='center'; x.fillText('RW',0,-2);
  x.font='600 7px Outfit,Arial'; x.fillText('VERIFIED',0,10);
  x.restore();
  /* signature (right) */
  x.textAlign='center';
  x.strokeStyle=ST.accent; x.lineWidth=2; x.globalAlpha=.9;
  x.beginPath();
  var gx0=W-260, gy0=certY+40;
  x.moveTo(gx0,gy0);
  x.bezierCurveTo(gx0+30,gy0-22, gx0+50,gy0+20, gx0+80,gy0-6);
  x.bezierCurveTo(gx0+100,gy0-20, gx0+120,gy0+14, gx0+170,gy0-10);
  x.stroke(); x.globalAlpha=1;
  x.fillStyle='#B8B4A8'; x.font='italic 400 12px Georgia,serif';
  x.fillText('Mohit Pandey \u00b7 Founder, RoamWise', W-175, certY+58);
  /* footer brand + date */
  x.fillStyle='#8A8880'; x.font='600 12px Outfit,Arial';
  x.fillText('\ud83e\udd77  R O A M W I S E   \u00b7   www.roamwise.co.in', W/2, H-40);
  x.fillStyle=ST.accent; x.font='700 12px Outfit,Arial';
  x.fillText('Issued '+dateStr, W/2, H-22);
  x.textAlign='left';
  /* output */
  var url=c.toDataURL('image/png');
  el('cardImg').src=url; el('cardImg').style.display='block';
  el('cardBtns').style.display='flex';
  var mb=el('movieBtn'); if(mb) mb.style.display='block';
  var shc=el('shadowChip'); if(shc) shc.style.display = hasShadowStyle()? 'block':'none';
  var un=L.filter(function(e){return e.lat===undefined;}).length;
  if(un) showToast(un+' place(s) still locating \u2014 regenerate in a minute for full pins');
  else showToast('Souvenir-grade \u2014 2400\u00d73200px, ready to print & frame \ud83d\uddbc\ufe0f');
  if(!lsGet('rw_card_xp')){ lsSet('rw_card_xp','1'); xpAdd(25,'Journey Card forged'); }
  try{ var eb=el('cardEarnBox'); if(eb) eb.style.display='block'; }catch(e){}
}
/* ---- Travel & Earn: Journey Card viral share ---- */
function cardShareWa(){
  var caption='Just mapped all my trips on RoamWise \u2728\u2708\ufe0f The Journey Card feature is unreal.\n\n'
    +'AI itineraries + crowd calendars + real local prices, built solo from the Himalayas.\n\n'
    +'One-time \u20b9100 \u2014 no subscription: roamwise.co.in\n\n'
    +'#RoamWise #TravelIndia #AITravel #ShinobiMode #IndieApp';
  try{ navigator.clipboard.writeText(caption).then(function(){ showToast('\ud83d\udcf8 Caption copied! Post on Reels/Shorts, tag @mohucool \u2014 100+ views = free Pro pass for a friend'); }).catch(function(){ if(navigator.share) navigator.share({text:caption}); }); }catch(e){}
}
