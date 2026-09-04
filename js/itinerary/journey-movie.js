// @ts-nocheck
/* journey-movie.js — Journey Movie: the cinematic canvas + Web Audio render of a
   trip (openMovie, cineMusic, cineRender) — a different rendering technology from
   the DOM/canvas-image certificates in this directory. Split out of
   js/itinerary/certificates.js (which bundled 5 unrelated certificate/movie
   features) as an SRP cleanup; verbatim move, zero logic changes. */

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
