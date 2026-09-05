// @ts-nocheck
// Moved verbatim from app.js (Phase 7a) — Premium PDF Itinerary export:
// openPdfFlow/pdfPreviewHtml/pdfPick/genPdf. Called from
// onclick="openPdfFlow(...)" in js/itinerary/build.js's rendered markup,
// and from window.openPdfFlow/window.genPdf in roamwise-premium-itinerary.js.
// The shared image/geo/theme helper toolkit these call (loadJsPdf,
// blobToJpeg, fetchImg64, fetchBmp, wikiAction/openverseThumb/imgTry/
// wikiAny/wikiThumb, EMG_NUM/emgFor, gcode, PDF_THEMES/hueRGB/themeFor/
// detectTheme/drawMotif) moved out to js/itinerary/pdf-assets.js in the
// continued modularization pass, since those helpers turned out to be used
// well beyond PDF export (journey-log, journey-certificate, map-view,
// card-painter, realms, misc-features, answer-cards, roamwise-premium-
// itinerary.js). genPdf() itself remains one large (~470-line) function
// here rather than being split further: it is a single sequential jsPDF
// drawing routine (measure/draw/paginate in one pass) — pulling pieces of
// its body into separate functions would be an internal logic refactor,
// not a verbatim move, and risks the exact pixel-perfect layout this
// generates. Left as-is by design; a future behavior-preserving refactor
// of genPdf's internals would need its own dedicated, reviewed pass.
/* ===== PREMIUM PDF ITINERARY \u2014 \u20b910 one-off (free for Pro) ===== */
var PDF_CTX=null; /* {d, days, month} set when user opens the flow */
function openPdfFlow(T, name, days, month){
  var d = DB.find(function(x){return x.name===name;}) || {name:name, country:'', cost:{mid:0}, food:[], gems:[]};
  PDF_CTX = {d:d, days:days, month:month, T:T};
  var ov = el('pdfOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='pdfOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:420px"><button class="modal-close" onclick="el(\'pdfOverlay\').classList.remove(\'open\')">\u00d7</button>'
    +'<div class="modal-head"><div class="modal-title">\ud83d\udcd5 Premium PDF Itinerary</div><div class="modal-sub">Multi-page \u00b7 designed \u00b7 yours forever</div></div>'
    +'<div class="modal-body" id="pdfBody"></div></div>';
    document.body.appendChild(ov);
  }
  var payBlock = isPro ? '<button class="rzp-main-btn" onclick="genPdf()">\u2728 Generate my PDF (free with Pro)</button>'
    : '<div class="mode-box" style="margin-bottom:10px">\ud83d\udcb0 <b>\u20b910 one-off</b> \u2014 or free with Pro. Pay via any UPI app to <b>coolmohit@ybl</b>, then tap generate.</div>'
      +'<div style="display:flex;gap:7px;margin-bottom:10px"><button class="tact" style="flex:1" onclick="payVia(\'generic10\')">\ud83d\udcb3 Pay \u20b910 via UPI</button></div>'
      +'<button class="rzp-main-btn" onclick="track(\'pdf_paid\');genPdf()">\u2705 I\u2019ve paid \u20b910 \u2014 Generate full PDF</button>'
      +'<div style="text-align:center;margin:10px 0 4px;font-size:11px;color:var(--t3)">\u2014 or try it first \u2014</div>'
      +'<button class="tact" style="width:100%" onclick="genPdf(true)">\ud83d\udcc4 Download a free 2-page sample</button>'
      +'<div style="font-size:10px;color:var(--t3);text-align:center;margin-top:6px">Honor system \u2014 you\u2019re supporting a solo builder \ud83c\udfd4\ufe0f</div>';
  el('pdfBody').innerHTML =
    '<div class="dna-q"><div class="qt">Traveler name on the cover</div><input class="txn-inp" id="pdfName" style="width:100%" value="'+(lsGet('rw_name')||'')+'" placeholder="Your name"></div>'
   +'<div class="dna-q"><div class="qt">Start date</div><input class="txn-inp" type="date" id="pdfDate" style="width:100%"></div>'
   +'<div class="dna-q"><div class="qt">Party</div><div class="dna-opts">'+['Solo','Couple','Family','Friends'].map(function(o,i){return '<button class="dna-opt'+(i===0?' on':'')+'" onclick="pdfPick(this,\'party\',\''+o+'\')">'+o+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Pace</div><div class="dna-opts">'+['Relaxed','Balanced','Packed'].map(function(o,i){return '<button class="dna-opt'+(i===1?' on':'')+'" onclick="pdfPick(this,\'pace\',\''+o+'\')">'+o+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Special notes (optional)</div><input class="txn-inp" id="pdfNotes" style="width:100%" placeholder="anniversary trip, vegetarian, photography focus\u2026"></div>'
   +'<button class="tact" style="width:100%;margin-bottom:10px" onclick="pdfPreviewHtml()">\ud83d\udc41 Live preview \u2014 see it before you pay</button>'
   +'<div id="pdfPrev" style="display:none;margin-bottom:12px"></div>'
   + payBlock;
  window._pdfOpts={party:'Solo',pace:'Balanced'};
  ov.classList.add('open');
  try{ track('pdf_opens'); }catch(e){}
}
function pdfPreviewHtml(){
  var C=PDF_CTX; if(!C) return;
  var d=C.d, o=window._pdfOpts||{party:'Solo',pace:'Balanced'};
  var nm=(el('pdfName').value||'A Traveler').slice(0,26);
  var t=(typeof DAY_TEMPLATES!=='undefined'&&DAY_TEMPLATES[0])||{title:'Arrival',morning:'Check in & wander',afternoon:'The icon sight',evening:'Local dinner',tip:'Get cash from a bank ATM'};
  var box=el('pdfPrev');
  box.style.display='';
  /* This live preview is the one part of the download flow the user actually
     SEES on-screen — the downloaded PDF itself can only be static colour, but
     this box can carry the app's real animated gold gradient (same recipe as
     .hero h1 em / .intro .it in app.css) so the flow still feels alive. */
  box.innerHTML=
   '<div style="background:#0C1020;border:2px solid #C8913E;border-radius:10px;padding:18px;text-align:center;margin-bottom:8px">'
   +'<div style="font-size:9px;letter-spacing:.2em;color:#8A8880">A ROAMWISE PREMIUM ITINERARY</div>'
   +'<div style="font-family:Georgia,serif;font-weight:700;font-size:22px;margin:6px 0 2px;background:linear-gradient(120deg,var(--gold2),var(--crim2),var(--pm2),#2AE8B8,var(--gold2));background-size:280% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gradShift 8s ease infinite">'+d.name.toUpperCase()+'</div>'
   +'<div style="font-size:11px;color:#EDEAE2">'+(d.country||'')+' \u00b7 '+Math.min(C.days||5,10)+' days \u00b7 '+(C.month||'')+'</div>'
   +'<div style="font-size:10px;color:#B8B4A8;margin-top:8px">crafted for</div>'
   +'<div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:16px;color:#E8BA6C">'+nm+'</div>'
   +'<div style="font-size:9px;color:#8A8880;margin-top:4px">'+o.party+' \u00b7 '+o.pace+' pace</div></div>'
   +'<div style="position:relative;overflow:hidden;background:#F7F3EA;border:2px solid #C8913E;border-radius:10px;padding:14px;color:#1A1A22">'
   +'<div style="position:absolute;inset:0;display:flex;flex-wrap:wrap;gap:26px;align-items:center;justify-content:center;transform:rotate(-24deg);opacity:.06;font-weight:800;color:#C8913E;font-size:20px;pointer-events:none">ROAMWISE ROAMWISE ROAMWISE ROAMWISE ROAMWISE ROAMWISE</div>'
   +'<div style="font-family:Georgia,serif;font-weight:700;color:#C4302B;font-size:16px">Day 1</div>'
   +'<div style="font-size:11px;font-weight:700;margin:2px 0 8px">'+t.title+'</div>'
   +[['09:00 MORNING',t.morning],['13:00 AFTERNOON',t.afternoon],['18:00 EVENING',t.evening]].map(function(sg){
      return '<div style="background:#EFE7D6;border-radius:6px;padding:7px 9px;margin-bottom:6px"><div style="font-size:8.5px;font-weight:700;color:#C8913E">'+sg[0]+'</div><div style="font-size:10.5px;line-height:1.5">'+sg[1]+'</div></div>';
    }).join('')
   +'<div style="background:#F3E2C0;border-radius:6px;padding:6px 9px;font-size:9.5px;color:#7A5A16">\ud83e\udd77 Ninja tip: '+(t.tip||'')+'</div>'
   +'<div style="font-size:8.5px;color:#6B675C;text-align:center;margin-top:8px">\u2026 + '+(Math.min(C.days||5,10)-1)+' more day pages + Essentials page \u00b7 every page carries the RoamWise watermark</div></div>';
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function pdfPick(btn,k,v){ window._pdfOpts[k]=v; btn.parentNode.querySelectorAll('.dna-opt').forEach(function(b){b.classList.remove('on');}); btn.classList.add('on'); }
// Image/geo/theme helper toolkit (loadJsPdf, blobToJpeg, fetchImg64, fetchBmp, wikiAction/openverseThumb/imgTry/wikiAny/wikiThumb, EMG_NUM/emgFor, gcode, PDF_THEMES/hueRGB/themeFor/detectTheme/drawMotif) moved to js/itinerary/pdf-assets.js
function genPdf(sample){
  el('pdfOverlay').classList.remove('open');
  window._pdfSample = !!sample;
  showToast(sample? 'Building your free sample\u2026 \ud83d\udcc4' : 'Designing your itinerary\u2026 \ud83c\udfa8 (10\u201320s)');
  loadJsPdf(function(){
    var C=PDF_CTX, d=C.d, days=window._pdfSample? 1 : Math.min(C.days||5,10);
    var name=(el('pdfName').value||'A Traveler').slice(0,26); lsSet('rw_name',name);
    var start = el('pdfDate').value ? new Date(el('pdfDate').value) : null;
    var o=window._pdfOpts, notes=(el('pdfNotes').value||'').slice(0,120);
    /* Real AI plan if the user just built one for this destination */
    var AIP=(window._lastItin && _lastItin.name===d.name && _lastItin.days)? _lastItin.days : null;
    var pdf=new window.jspdf.jsPDF({unit:'px',format:[600,800]});
    var _rawText=pdf.text.bind(pdf), _rawSplit=pdf.splitTextToSize.bind(pdf);
    function clean(s){ if(Array.isArray(s)) return s.map(clean);
      return String(s==null?'':s)
        .replace(/[\u2018\u2019\u02bc]/g,"'").replace(/[\u201c\u201d]/g,'"')
        .replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...').replace(/\u20b9/g,'Rs ')
        .replace(/[\u00b7\u2022]/g,'-')
        // eslint-disable-next-line no-misleading-character-class -- intentional: \uFE0F (variation selector) and \u200D (ZWJ) are deliberately included so emoji modifiers get stripped along with the base glyphs jsPDF's default font can't render; not a stray literal combining character
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u2190-\u21FF\uFE0F\u200D\u2726\u2713\u2B06-\u2B07]/gu,'')
        .replace(/  +/g,' ').trim(); }
    pdf.text=function(s,x2,y2,o){ return _rawText(clean(s),x2,y2,o); };
    pdf.splitTextToSize=function(s,w){ return _rawSplit(clean(s),w); };
    function lc(t){ t=String(t||'').trim(); if(!t) return t; return t.charAt(0).toLowerCase()+t.slice(1); }
    var RW_QUOTES=['Some journeys take you to places. The best ones leave you with stories.',
      'The best souvenirs are the stories you never planned to collect.',
      'Years from now, you will not remember every mile. You will remember how it felt.',
      'Adventure begins where the ordinary ends.',
      'Every journey ends. The stories never do.'];
    /* Theme KEY still comes from the shared per-destination detector (used by
       the homepage carousels too), but the PDF's actual colours are pinned to
       PDF_THEMES — fixed, on-brand RGB rather than themeFor()'s per-destination
       hash hue — so every downloaded itinerary carries real RoamWise colours. */
    var THT=themeFor(d), THK=THT.key, THC=PDF_THEMES[THK], TH={deep:THC.deep, acc:THC.acc, line:THC.line};
    /* GOLD/GOLD2/CRIM already match app.css --gold/--gold2/--crim exactly; DARK
       now matches --bg2 too. PAP stays a light cream (not an app dark bg) —
       the page is deliberately printable, with brand colour carried in the
       gold frame, footer band and per-theme accents rather than an all-dark
       fill that would be expensive/impractical to print. */
    var GOLD='#C8913E', GOLD2='#E8BA6C', CRIM='#C4302B', INK='#1A1A22', PAP='#F7F3EA', MUT='#6B675C', DARK='#0C1020';
    function wm(){
      pdf.setTextColor(229,212,178); pdf.setFont('helvetica','bold'); pdf.setFontSize(23);
      for(var wy=100;wy<790;wy+=128) for(var wx=-50;wx<640;wx+=185) pdf.text('ROAMWISE',wx,wy,{angle:31});
      if(window._pdfSample){ pdf.setTextColor(232,120,90); pdf.setFontSize(60);
        for(var sy=180;sy<760;sy+=200) pdf.text('SAMPLE',300,sy,{align:'center',angle:32}); }
    }
    function page(bg){ pdf.setFillColor(bg||PAP); pdf.rect(0,0,600,800,'F'); }
    /* Full-bleed scenic background (Kafila-style): the destination photo fills
       the whole page, darkened with a gradient band so text stays readable
       wherever it sits. Falls back to the flat theme colour if no photo. */
    function scenicPage(photo, darkTop, darkBottom){
      if(!photo){ page(); return; }
      try{
        pdf.addImage(photo,'JPEG',0,0,600,800);
        /* layered translucent bands: darker where text will sit (top+bottom),
           lighter in the middle so the photo still reads as a photo */
        var steps=[[0,140,0.72],[110,260,0.38],[540,800,0.72]];
        if(darkTop===false) steps[0][2]=0.15;
        if(darkBottom===false) steps[2][2]=0.15;
        steps.forEach(function(b){
          pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]);
          if(pdf.setGState && pdf.GState){ pdf.setGState(new pdf.GState({opacity:b[2]})); }
          pdf.rect(0,b[0],600,b[1]-b[0],'F');
        });
        if(pdf.setGState && pdf.GState){ pdf.setGState(new pdf.GState({opacity:1})); }
      }catch(e){ page(); }
    }
    function frame(){ pdf.setDrawColor(GOLD); pdf.setLineWidth(2); pdf.rect(18,18,564,764); pdf.setLineWidth(.6); pdf.rect(26,26,548,748); }
    function foot(pn){
      /* Emotional punctuation on every page — the Kafila move. Deterministic
         per page number so it's stable if the PDF regenerates. */
      var q=RW_QUOTES[pn%RW_QUOTES.length];
      pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','italic'); pdf.setFontSize(9.5);
      pdf.text('\u201c'+q+'\u201d',300,748,{align:'center'});
      pdf.setFillColor(DARK); pdf.rect(18,760,564,22,'F');
      pdf.setFont('helvetica','normal'); pdf.setTextColor(GOLD2); pdf.setFontSize(8);
      pdf.text('\u{1F977} ROAMWISE \u00b7 www.roamwise.co.in \u00b7 crafted for '+name,300,774,{align:'center'});
      pdf.setTextColor('#8A8880'); pdf.text(String(pn),566,774); }
    var pn=1;
    /* ---------- gather photos first (hero + up to 3 gems) ---------- */
    function firstPlace(s){ return String(s||'').split(/,| at | - |\(/)[0].split(' ').slice(0,4).join(' ').trim(); }
    var wants=[(d.photos&&d.photos[0])||null];
    (d.gems||[]).slice(0,3).forEach(function(g){ wants.push({wiki:g+' '+(d.country||'')}); });
    for(var di=0; di<days; di++){
      var pl = AIP&&AIP[di]? firstPlace(AIP[di].morning) : ((d.gems||[])[di%Math.max(1,(d.gems||[]).length)]||'');
      wants.push(pl? {wiki:pl, alt:pl+' '+(d.name||'')} : null);
    }
    function job(q,alt){
      var s3=String(q).split(' ').slice(0,3).join(' ');
      return imgTry([
        function(){ return wikiThumb(q); },
        function(){ return wikiAction(q); },
        function(){ return s3!==q? wikiAction(s3):null; },
        function(){ return alt? wikiAction(alt):null; },
        function(){ return openverseThumb(q); }
      ]);
    }
    var photoJobs = wants.map(function(w,wi){
      if(!w) return job(d.name, d.name+' '+(d.country||''));
      if(typeof w==='string'){
        if(/^https?:/i.test(w)) return fetchImg64(w).catch(function(){ return job(d.name, d.name+' '+(d.country||'')); });
        return job(w, d.name);   /* DB photos are search phrases */
      }
      return job(w.wiki, w.alt || (String(w.wiki).split(' ').slice(0,3).join(' ')));
    });
    /* --- traveler profile for the cover --- */
    var PR={}; try{ PR=JSON.parse(lsGet('rw_profile')||'{}'); }catch(e){}
    var avP = PR.av? (PR.av.indexOf('data:')===0? Promise.resolve(PR.av) : fetchImg64(PR.av).catch(function(){return null;})) : Promise.resolve(null);
    /* --- events overlapping the trip window --- */
    var t0=start||new Date(), t1=new Date(t0.getTime()+days*864e5);
    var evHit=(typeof EVENTS!=='undefined'? EVENTS:[]).filter(function(e){
      if(new Date(e.to)<t0 || new Date(e.from)>t1) return false;
      return e.city===d.name || (String(e.places||'').toLowerCase().indexOf(String(d.country||'').toLowerCase())>-1 && d.country);
    }).slice(0,2);
    /* --- Local Intel: AI (any key) with graceful fallback --- */
    function ARCHX(k){ var M={
      beach:{hacks:['Beach shacks 200m from the main entry are half price','Rent gear for the week, not the day','Sunrise swims beat sunset crowds'],save:['Eat where the boat crews eat','Book stays 1 lane inland','Happy-hour = dinner-hour'],nature:'Sun is the real boss - hydrate, reef-safe sunscreen, respect currents.',caution:'Watch tides and red flags; keep valuables off the sand.'},
      metro:{hacks:['Transit day-pass beats 3 taxi rides','Museums have one free evening weekly','Rooftop views: hotel bars beat paid decks'],save:['Lunch menus at dinner restaurants','Stay near a metro line, not the center','Street food courts over cafes'],nature:'Concrete heat is real - hydrate and plan shade for afternoons.',caution:'Pickpockets love crowds; front pockets, split cash.'},
      sacred:{hacks:['Dawn prayers beat every tour bus','Caretakers unlock stories tips can\u2019t buy','Festival eves outshine festival days'],save:['Pilgrim canteens: honest food, honest prices','Guesthouses near temples','Free shoe stands outside barefoot zones'],nature:'Rivers and hills here are living heritage - keep them clean.',caution:'Dress codes are respect codes; follow queue culture at shrines.'},
      tech:{hacks:['Airport trains beat taxis on price AND time','eSIM before landing skips counter queues','Office-tower food courts = chef food, canteen price'],save:['Business-hotel weekends are discounted','Supermarket dinners are a cultural tour','City cards bundle transit + sights'],nature:'Air-conditioned everything - carry a layer.',caution:'Jaywalking fines are real; follow the signals.'},
      peak:{hacks:['Acclimatize a day before you climb','Shared jeeps leave when full - arrive early','Homestays beat hotels on warmth and price'],save:['Thali/dal-bhat: refills included','Off-season permits cost less','Rent heavy gear locally'],nature:'Altitude and weather change fast - respect both, tell someone your route.',caution:'AMS is real above 3000m: ascend slow, hydrate, descend if ill.'},
      classic:{hacks:['First hour after opening = private viewing','Ask "where do YOU eat?" three times','Walk the old town at 7am once'],save:['City cards pay off from visit #3','Bakeries discount at closing time','Tap-water refills where safe'],nature:'Four seasons, four cities - pack layers.',caution:'Tourist-zone prices double: one street back is honest.'}};
      return M[k]||M.classic; }
    function intelFallback(){ var A0=ARCHX(THK);
      return {hacks:A0.hacks, save:A0.save, context:{
        nature:A0.nature, culture:'Greet first, dress a notch modest at holy places, ask before photographing people.',
        politics:'Stable for tourists; avoid demonstrations and political debates as a guest.',
        economy:(d.cost? 'Mid-range week ~$'+d.cost.mid+'; cash still wins in small shops.':'Carry some cash; cards fail in the best little places.'),
        social:'People respond to patience and a smile; learn 5 local words and doors open.',
        education:'English works in tourist zones; a translation app closes the rest.',
        caution:A0.caution}};
    }
    var intelP=new Promise(function(res){
      var hasKey=['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].some(function(p2){return lsGet('rwKey_'+p2);});
      if(!hasKey) return res(intelFallback());
      var done=false; setTimeout(function(){ if(!done){done=true; res(intelFallback());} }, 18000);
      try{
        aiCall('Return ONLY JSON for travelers to '+d.name+', '+(d.country||'')+': {"hacks":["3 insider hacks"],"save":["3 cost-saving moves"],"context":{"nature":"..","culture":"..","politics":"neutral, safety-focused, no opinions","economy":"..","social":"..","education":"..","caution":".."}}. Each value under 140 chars, practical, specific to the place.',900,function(err,txt){
          if(done) return; done=true;
          var j=extractJSON(txt); res(j&&j.hacks&&j.context? j : intelFallback());
        }, true);
      }catch(e){ if(!done){done=true; res(intelFallback());} }
    });
    /* --- MAP: dest geocode + up to 4 activity pins + composed tiles --- */
    var mapP=(function(){
      var cP=(typeof d.lat==='number'&&typeof d.lon==='number')? Promise.resolve({lat:d.lat,lon:d.lon}) : gcode(d.name+', '+(d.country||''));
      return cP.then(function(c){ if(!c) return null;
        var pinQ=[]; if(AIP){ for(var pi2=0; pi2<Math.min(4,AIP.length); pi2++){ (function(ii){
          var plc=firstPlace(AIP[ii].morning); if(plc&&plc.length>2) pinQ.push(gcode(plc+', '+d.name).then(function(g){ return g? {n:plc,day:ii+1,lat:g.lat,lon:g.lon}:null; })); })(pi2); } }
        return Promise.all(pinQ).then(function(pins){
          pins=(pins||[]).filter(function(p3){ return p3 && Math.abs(p3.lat-c.lat)<1.3 && Math.abs(p3.lon-c.lon)<1.3; });
          var Z=11, n2=Math.pow(2,Z);
          function txx(lo){ return (lo+180)/360*n2; }
          function tyy(la){ var r=la*Math.PI/180; return (1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n2; }
          var cxp=txx(c.lon), cyp=tyy(c.lat);
          var x0=Math.floor(cxp)-1, y0=Math.floor(cyp)-1;
          var jobs=[]; for(var yy=0; yy<2; yy++) for(var xx=0; xx<3; xx++)(function(xx,yy){
            jobs.push(fetchBmp('https://'+(['a','b','c'][(xx+yy)%3])+'.basemaps.cartocdn.com/rastertiles/voyager/'+Z+'/'+(x0+xx)+'/'+(y0+yy)+'.png').catch(function(){return null;}));
          })(xx,yy);
          return Promise.all(jobs).then(function(tls){
            if(!tls.some(function(t3){return t3;})) return null;
            var cv2=document.createElement('canvas'); cv2.width=768; cv2.height=512;
            var g2=cv2.getContext('2d'); g2.fillStyle='#DDE8E8'; g2.fillRect(0,0,768,512);
            tls.forEach(function(bm,ti){ if(bm) g2.drawImage(bm,(ti%3)*256,Math.floor(ti/3)*256,256,256); });
            function px(lo,la){ return [(txx(lo)-x0)*256,(tyy(la)-y0)*256]; }
            var cc=px(c.lon,c.lat);
            g2.fillStyle='rgb('+TH.acc[0]+','+TH.acc[1]+','+TH.acc[2]+')';
            g2.beginPath(); g2.arc(cc[0],cc[1],11,0,7); g2.fill();
            g2.fillStyle='#fff'; g2.font='700 12px Arial'; g2.textAlign='center'; g2.fillText('\u2605',cc[0],cc[1]+4);
            pins.forEach(function(p3,pi3){ var pp=px(p3.lon,p3.lat);
              g2.fillStyle='#C4302B'; g2.beginPath(); g2.arc(pp[0],pp[1],10,0,7); g2.fill();
              g2.fillStyle='#fff'; g2.fillText(String(pi3+1),pp[0],pp[1]+4); });
            g2.fillStyle='rgba(255,255,255,.85)'; g2.fillRect(0,494,768,18);
            g2.fillStyle='#555'; g2.font='10px Arial'; g2.textAlign='left';
            g2.fillText('\u00a9 OpenStreetMap contributors \u00a9 CARTO', 8, 507);
            return {img:cv2.toDataURL('image/jpeg',0.9), pins:pins, c:c};
          });
        });
      }).catch(function(){ return null; });
    })();
    var photoJobsStaggered = photoJobs.map(function(p,pi){
      return new Promise(function(res){ setTimeout(function(){ Promise.resolve(p).then(res,function(){res(null);}); }, pi*160); });
    });
    Promise.all([Promise.all(photoJobsStaggered), avP, intelP, mapP]).then(function(ALL){
      var imgs=ALL[0], avatar=ALL[1], intel=ALL[2], mapDat=ALL[3];
      var hero=imgs[0], gemPics=imgs.slice(1,4).filter(Boolean), dayPics=imgs.slice(4);
      /* ---------- COVER ---------- */
      scenicPage(hero);   /* full-bleed destination photo, darkened top+bottom for text */
      frame();
      drawMotif(pdf,THK,TH.acc,300,150);
      pdf.setTextColor('#B8B4A8'); pdf.setFontSize(10); pdf.text('A  R O A M W I S E   P R E M I U M   I T I N E R A R Y',300,60,{align:'center'});
      pdf.setTextColor(GOLD2); pdf.setFont('times','bold'); pdf.setFontSize(44);
      pdf.text(d.name.toUpperCase(),300,214,{align:'center'});
      pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(2.5); pdf.line(230,226,370,226);
      pdf.setFont('times','italic'); pdf.setFontSize(13); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
      pdf.text(TH.line,300,244,{align:'center'});
      pdf.setFont('helvetica','normal'); pdf.setFontSize(14); pdf.setTextColor('#EDEAE2');
      pdf.text((d.country||'')+'  -  '+days+' days  -  '+(C.month||''),300,578,{align:'center'});
      pdf.setTextColor('#B8B4A8'); pdf.setFontSize(12); pdf.text('crafted for',300,620,{align:'center'});
      pdf.setTextColor(GOLD2); pdf.setFont('times','bolditalic'); pdf.setFontSize(30); pdf.text(name,300,652,{align:'center'});
      pdf.setFont('helvetica','normal'); pdf.setFontSize(11); pdf.setTextColor('#B8B4A8');
      pdf.text(o.party+' - '+o.pace+' pace'+(start?(' - from '+start.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})):''),300,676,{align:'center'});
      if(notes){ pdf.setFontSize(10); pdf.text('"'+notes+'"',300,698,{align:'center'}); }
      if(AIP){ pdf.setTextColor('#16BF96'); pdf.setFontSize(9.5); pdf.text('* Personalised by AI - real places, real timings *',300,720,{align:'center'}); }
      if(avatar){ try{ pdf.addImage(avatar,'JPEG',40,38,52,52); pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.6); pdf.rect(40,38,52,52); }catch(e){} }
      if(PR&&(PR.name||PR.style)){ pdf.setTextColor('#B8B4A8'); pdf.setFontSize(8.5);
        pdf.text((PR.name||name)+(PR.style? ' - '+PR.style+' soul':'')+(PR.loc? ' - '+PR.loc:''),40,104);
        if(PR.bio){ pdf.setFont('times','italic'); pdf.text('"'+String(PR.bio).slice(0,54)+'"',40,118); pdf.setFont('helvetica','normal'); } }
      if(evHit.length){ pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFontSize(10);
        pdf.text('HAPPENING DURING YOUR TRIP: '+evHit.map(function(e){return e.n;}).join('  +  '),300,132,{align:'center'}); }
      foot(pn);
      /* ---------- WHY THIS JOURNEY + AT-A-GLANCE (Kafila-style overview page) ---------- */
      pdf.addPage(); pn++; scenicPage(gemPics[0]||hero); wm(); frame();
      pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(24);
      pdf.text('Why this journey?', 300, 62, {align:'center'});
      pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.2); pdf.line(260,72,340,72);
      var whyLines = [
        'Not rushed. Not a checklist. '+d.name+', paced the way a good trip should be.',
        'Every day here has room to breathe \\u2014 real mornings, a slow lunch, an evening',
        'that doesn\\u2019t feel timed. This is the plan we\\u2019d hand a close friend.'
      ];
      pdf.setFont('times','italic'); pdf.setFontSize(13.5); pdf.setTextColor('#F5F2E8');
      whyLines.forEach(function(ln,li){ pdf.text(ln,300,100+li*20,{align:'center'}); });
      /* trip snapshot grid */
      var snapY=190;
      pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.roundedRect(44,snapY,512,120,10,10,'F');
      var snaps=[
        ['DURATION', days+' Days'],
        ['STYLE', o.pace+' pace'],
        ['IDEAL FOR', o.party],
        ['DESTINATION', d.name]
      ];
      var sw2=512/snaps.length;
      snaps.forEach(function(sn,si){
        var sx=44+sw2*si+sw2/2;
        pdf.setTextColor(GOLD2); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5);
        pdf.text(sn[0], sx, snapY+42, {align:'center'});
        pdf.setTextColor('#fff'); pdf.setFont('times','bold'); pdf.setFontSize(15);
        pdf.text(sn[1], sx, snapY+66, {align:'center'});
        if(si>0){ pdf.setDrawColor(80,80,90); pdf.setLineWidth(.6); pdf.line(44+sw2*si,snapY+20,44+sw2*si,snapY+100); }
      });
      /* perfect-for persona row */
      var perY=snapY+140;
      pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5);
      pdf.text('PERFECT FOR', 300, perY, {align:'center'});
      var personas=['Solo travellers','Couples','Friend groups','Slow-travel souls'];
      var pw2=512/personas.length;
      personas.forEach(function(pz,pzi){
        var px=44+pw2*pzi+pw2/2;
        /* solid dark fill so the pill reads clearly even on a bright/light
           patch of the photo — an outline alone isn't enough contrast here */
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]);
        pdf.roundedRect(44+pw2*pzi+8, perY+10, pw2-16, 26, 13, 13, 'F');
        pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1);
        pdf.roundedRect(44+pw2*pzi+8, perY+10, pw2-16, 26, 13, 13);
        pdf.setTextColor('#F5F2E8'); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5);
        pdf.text(pz, px, perY+27, {align:'center'});
      });
      foot(pn);
      /* ---------- MAP & PINS PAGE ---------- */
      if(mapDat){
        pdf.addPage(); pn++; page(); wm(); frame();
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(24);
        pdf.text('Your Map & Pins',44,62);
        try{ pdf.addImage(mapDat.img,'JPEG',40,80,520,347);
          pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.6); pdf.rect(40,80,520,347); }catch(e){}
        var ly=452;
        pdf.setFontSize(10.5); pdf.setFont('helvetica','normal');
        pdf.setTextColor(INK); pdf.text('STAR = '+d.name+' center',44,ly); ly+=16;
        (mapDat.pins||[]).forEach(function(p3,pi3){
          pdf.setTextColor('#C4302B'); pdf.setFont('helvetica','bold'); pdf.text(String(pi3+1),48,ly);
          pdf.setTextColor(INK); pdf.setFont('helvetica','normal');
          pdf.text('Day '+p3.day+' - 09:00 - '+p3.n,64,ly); ly+=15; });
        ly+=8; pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(11);
        pdf.text('Open live maps:',44,ly); ly+=16; pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
        var gmU='https://maps.google.com/?q='+mapDat.c.lat+','+mapDat.c.lon;
        var mmU='https://maps.mapmyindia.com/@'+mapDat.c.lat+','+mapDat.c.lon;
        var osU='https://www.openstreetmap.org/#map=12/'+mapDat.c.lat+'/'+mapDat.c.lon;
        try{ pdf.setTextColor(30,90,200);
          pdf.textWithLink('Google Maps  ->  tap to open',44,ly,{url:gmU}); ly+=15;
          pdf.textWithLink('MapmyIndia  ->  tap to open',44,ly,{url:mmU}); ly+=15;
          pdf.textWithLink('OpenStreetMap  ->  tap to open',44,ly,{url:osU}); ly+=15;
        }catch(e){}
        if(evHit.length){ ly+=6; pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
          pdf.text('Event nearby during your dates: '+evHit[0].n,44,ly); }
        foot(pn);
      }
      /* ---------- DAY PAGES: 6-slot cinematic timeline ---------- */
      var perDay=(d.cost&&d.cost.mid? Math.round(d.cost.mid/7):0);
      var paceAdj=o.pace==='Relaxed'?0.85:(o.pace==='Packed'?1.2:1);
      var partyMul=o.party==='Couple'?1.8:(o.party==='Family'?3:1);
      for(var i=0;i<days;i++){
        pdf.addPage(); pn++; page(); wm(); frame();
        var A=AIP? AIP[i%AIP.length] : null;
        var T2=(typeof DAY_TEMPLATES!=='undefined'&&DAY_TEMPLATES[i])||{};
        var dt=start? new Date(start.getTime()+i*864e5):null;
        /* day banner */
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.rect(26,26,548,64,'F');
        pdf.setFillColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.circle(64,58,22,'F');
        pdf.setTextColor('#fff'); pdf.setFont('times','bold'); pdf.setFontSize(22); pdf.text(String(i+1),64,66,{align:'center'});
        pdf.setTextColor(GOLD2); pdf.setFontSize(17);
        pdf.text((A&&A.title)||T2.title||'Exploration',100,52);
        pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5); pdf.setTextColor('#B8B4A8');
        pdf.text((dt? dt.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})+' - ':'')+d.name,100,68);
        try{ drawMotif(pdf,THK,TH.acc,505,58); }catch(e){}
        if(i===0 && notes){ pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFontSize(9);
          pdf.text('Special focus: '+notes, 100, 82); }
        /* ---- NARRATIVE DAY (Kafila-style): story prose, then highlights,
               then what's included today. A schedule tells; a story sells. ---- */
        var mor=(A&&A.morning)||T2.morning||'the headline sight, at opening time';
        var aft=(A&&A.afternoon)||T2.afternoon||'a neighbourhood deep-dive after a local lunch';
        var eve=(A&&A.evening)||T2.evening||'a food street dinner where the queue is longest';
        var dayNarr = (i===0)
          ? 'The journey begins today. After settling in, we ease into '+lc(mor)+'. '
            +'By afternoon, '+lc(aft)+'. As the light softens, '+lc(eve)+' \u2014 a gentle first taste of '+d.name+'.'
          : 'After breakfast, we set out for '+lc(mor)+'. '
            +'The afternoon opens up into '+lc(aft)+'. '
            +'As evening settles over '+d.name+', '+lc(eve)+'.';
        var dp=dayPics[i], TXW=452, ty=112;
        if(dp){ try{ pdf.addImage(dp,'JPEG',384,102,172,132);
          pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.5); pdf.rect(384,102,172,132); TXW=300; }catch(e){ TXW=452; dp=null; } }
        /* the story */
        pdf.setTextColor(INK); pdf.setFont('times','normal'); pdf.setFontSize(12.5);
        var narrLines=pdf.splitTextToSize(dayNarr, TXW);
        pdf.text(narrLines, 58, ty+6); ty += narrLines.length*17 + 16;
        if(dp && ty < 250) ty = 250;
        /* TODAY'S HIGHLIGHTS */
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]);
        pdf.roundedRect(44,ty,512,2,1,1,'F');
        ty += 16;
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5);
        pdf.text('TODAY\u2019S HIGHLIGHTS', 58, ty); ty += 16;
        var hi=[['\u25c6', firstPlace(mor)||'Morning exploration', 'Best light, fewest people'],
                ['\u25c6', firstPlace(aft)||'Afternoon discovery', 'The unhurried middle of the day'],
                ['\u25c6', firstPlace(eve)||'Evening in '+d.name, 'Where the day slows down']];
        hi.forEach(function(h){
          pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text(h[0], 58, ty);
          pdf.setTextColor(INK); pdf.setFontSize(11); pdf.text(h[1], 72, ty);
          pdf.setTextColor(MUT); pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5);
          pdf.text(h[2], 72, ty+12);
          ty += 30;
        });
        /* INCLUDED TODAY strip — concrete reassurance, the Kafila trust move */
        ty += 4;
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.roundedRect(44,ty,512,40,7,7,'F');
        pdf.setTextColor(GOLD2); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5);
        pdf.text('INCLUDED TODAY', 60, ty+15);
        pdf.setTextColor('#D8D4C8'); pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5);
        pdf.text('Day plan & routing  \u00b7  Local food picks  \u00b7  Offline map pins  \u00b7  Budget guidance', 60, ty+29);
        ty += 52;
        /* food + tip + budget band */
        var fd=(A&&A.food)||((d.food||[])[i%Math.max(1,(d.food||[]).length)]||'');
        pdf.setFillColor('#F3E2C0'); pdf.roundedRect(44,ty-8,512,58,7,7,'F');
        pdf.setTextColor('#7A2E1E'); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
        pdf.text('\ud83c\udf5b EAT TODAY',56,ty+8);
        pdf.setFont('helvetica','normal'); pdf.setTextColor(INK); pdf.setFontSize(10);
        pdf.text(pdf.splitTextToSize(fd||'Ask three locals one question: \u201cwhere do YOU eat?\u201d',300),56,ty+22);
        pdf.setTextColor('#7A5A16'); pdf.setFontSize(9);
        pdf.text(pdf.splitTextToSize('\ud83e\udd77 '+((A&&A.tip)||T2.tip||'Carry small notes; big bills slow every purchase.'),190),380,ty+8);
        if(perDay){ pdf.setTextColor(MUT); pdf.setFontSize(9.5);
          pdf.text('\ud83d\udcb0 Day budget ('+o.party.toLowerCase()+', '+o.pace.toLowerCase()+'): ~$'+Math.round(perDay*paceAdj*partyMul),44,ty+66); }
        /* ---- Fill the previously-blank lower half with real, grounded data ----
           Two-column panel: destination fast facts (region/country/tags — all
           already in the database, not invented) + an actual crowd-by-month
           comparison (d.crowd is real per-destination data used elsewhere in
           the app, e.g. the ninja-hacks crowd-dodge callouts). */
        var fy = ty + 84;
        if(fy < 700){
          pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(0.8);
          pdf.line(44, fy, 556, fy);
          var colW=246, gx=44, gx2=44+colW+22;
          /* Left: Fast Facts */
          pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(10.5);
          pdf.text('\ud83c\udf0d Fast Facts', gx, fy+20);
          pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(INK);
          var facts=[
            'Region: '+(d.region||'—')+', '+(d.country||'—'),
            'Vibe: '+((d.tags||[]).slice(0,3).join(' \u00b7 ')||'—'),
            'Typical trip cost: $'+(d.cost&&d.cost.budget||'—')+'\u2013$'+(d.cost&&d.cost.mid||'—')+'/week'
          ];
          var fyy=fy+34; facts.forEach(function(f){ pdf.text(pdf.splitTextToSize(f,colW),gx,fyy); fyy+=15; });
          /* Right: real crowd-by-month comparison */
          if(d.crowd && d.crowd.length===12){
            pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(10.5);
            pdf.text('\ud83d\udc65 Crowd Forecast', gx2, fy+20);
            var curMi = (typeof mi==='number')? mi : (start? start.getMonth() : new Date().getMonth());
            var bestMi=0; for(var cmi=1;cmi<12;cmi++) if(d.crowd[cmi]<d.crowd[bestMi]) bestMi=cmi;
            pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(INK);
            pdf.text('This trip ('+(MO_FULL?MO_FULL[curMi]:curMi)+'): '+d.crowd[curMi]+'% crowds', gx2, fy+34);
            if(bestMi!==curMi && d.crowd[curMi]-d.crowd[bestMi]>=10){
              pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
              pdf.text(pdf.splitTextToSize('\ud83e\udd77 '+(MO_FULL?MO_FULL[bestMi]:bestMi)+' sees just '+d.crowd[bestMi]+'% \u2014 half the queues, same place.',colW),gx2,fy+49);
            } else {
              pdf.setTextColor(MUT);
              pdf.text('You\u2019re already visiting near the quietest window \u2014 good timing.',gx2,fy+49);
            }
            /* tiny 12-month bar strip, real data, not decorative */
            var bw=(colW)/12, by=fy+62;
            for(var bi=0;bi<12;bi++){
              var bh=Math.max(2,(d.crowd[bi]/100)*18);
              pdf.setFillColor(bi===curMi? TH.acc[0]:200, bi===curMi? TH.acc[1]:200, bi===curMi? TH.acc[2]:200);
              pdf.rect(gx2+bi*bw, by+18-bh, bw-1, bh, 'F');
            }
          }
        }
        foot(pn);
      }
      /* ---------- FOOD & CULTURE PAGE ---------- */
      pdf.addPage(); pn++; page(); wm(); frame();
      pdf.setTextColor(CRIM); pdf.setFont('times','bold'); pdf.setFontSize(26); pdf.text('Food, Culture & Specialities',44,64);
      var y3=92; pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text('\ud83c\udf7d The plates that define '+d.name,44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      (d.food&&d.food.length? d.food:['Follow the queues \u2014 locals vote with their feet']).slice(0,6).forEach(function(f){ pdf.text('\u2022 '+f,52,y3); y3+=15; });
      y3+=10; pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text('\ud83d\udc8e Local specialities & hidden gems',44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      (d.gems&&d.gems.length? d.gems:['The best gem is an unplanned afternoon']).slice(0,5).forEach(function(g){ pdf.text(pdf.splitTextToSize('\u2022 '+g,500),52,y3); y3+=15; });
      y3+=10; pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text("Don't-miss & only-here",44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      var dm=[(d.gems&&d.gems[0])||'The first hour after sunrise - the place before the performance',
              (d.food&&d.food[0])? 'The one dish: '+d.food[0] : 'Ask three locals for the one dish',
              ((d.tags||[])[0]? 'Its signature: '+(d.tags||[]).slice(0,3).join(', ') : 'Walk one street behind the famous one')];
      dm.forEach(function(x2){ pdf.text(pdf.splitTextToSize('* '+x2,500),52,y3); y3+=15; });
      y3+=10; pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text('\ud83e\udd1d Culture in 4 lines',44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      ['Greet before you ask \u2014 two seconds of hello changes every interaction.','Dress one notch more modestly at religious sites than the street suggests.','Haggling is a smile game where both sides should win.','Photograph people only after a nod \u2014 the nod is the picture\u2019s soul.'].forEach(function(c2){ pdf.text(pdf.splitTextToSize('\u2022 '+c2,500),52,y3); y3+=15; });
      /* gem photo strip */
      if(gemPics.length){ var gx=44;
        gemPics.slice(0,3).forEach(function(im){ try{ pdf.addImage(im,'JPEG',gx,y3+8,164,110); pdf.setDrawColor(GOLD); pdf.rect(gx,y3+8,164,110); gx+=172; }catch(e){} });
        y3+=126; }
      foot(pn);
      /* ---------- LOCAL INTEL & STREET WISDOM ---------- */
      if(intel){
        pdf.addPage(); pn++; page(); wm(); frame();
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(24);
        pdf.text('Local Intel & Street Wisdom',44,62);
        var yi=92;
        pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
        pdf.text('Secret hacks',44,yi);
        pdf.text('Save money like a local',310,yi); yi+=16;
        pdf.setFont('helvetica','normal'); pdf.setFontSize(10); pdf.setTextColor(INK);
        for(var ri=0; ri<3; ri++){
          if(intel.hacks&&intel.hacks[ri]) pdf.text(pdf.splitTextToSize('* '+intel.hacks[ri],240),44,yi);
          if(intel.save&&intel.save[ri]) pdf.text(pdf.splitTextToSize('* '+intel.save[ri],240),310,yi);
          yi+=34; }
        yi+=6; pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(.8); pdf.line(44,yi,556,yi); yi+=18;
        pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
        pdf.text('Know the ground: local conditions',44,yi); yi+=16;
        var ctx2=intel.context||{};
        [['Nature',ctx2.nature],['Culture',ctx2.culture],['Politics',ctx2.politics],['Economy',ctx2.economy],['Social',ctx2.social],['Education',ctx2.education]].forEach(function(rw){
          if(!rw[1]) return;
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
          pdf.text(rw[0].toUpperCase(),44,yi);
          pdf.setFont('helvetica','normal'); pdf.setTextColor(INK);
          var lines2=pdf.splitTextToSize(String(rw[1]),430);
          pdf.text(lines2,120,yi); yi+=Math.max(15,lines2.length*13+4); });
        if(ctx2.caution){ yi+=4; pdf.setFillColor(250,236,214); pdf.roundedRect(40,yi-10,520,46,7,7,'F');
          pdf.setTextColor('#7A2E1E'); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('APPROACH WITH CARE',52,yi+4);
          pdf.setFont('helvetica','normal'); pdf.setTextColor(INK);
          pdf.text(pdf.splitTextToSize(ctx2.caution,480),52,yi+18); }
        foot(pn);
      }
      /* ---------- ESSENTIALS ---------- */
      pdf.addPage(); pn++; page(); wm(); frame();
      pdf.setTextColor(CRIM); pdf.setFont('times','bold'); pdf.setFontSize(26); pdf.text('Essentials',44,64);
      var y2=94;
      function h(t3){ pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text(t3,44,y2); y2+=16; pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5); }
      if(d.cost){ h('Budget bands (per person / week)');
        var mx3=d.cost.luxury||1;
        [['Backpacker',d.cost.budget],['Mid-range',d.cost.mid],['Luxury',d.cost.luxury]].forEach(function(r2){
          pdf.setTextColor(INK); pdf.text(r2[0],52,y2);
          pdf.setFillColor(238,231,214); pdf.rect(150,y2-8,300,10,'F');
          pdf.setFillColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.rect(150,y2-8,Math.max(8,300*(r2[1]/mx3)),10,'F');
          pdf.setTextColor(MUT); pdf.text('$'+r2[1],458,y2);
          y2+=17; }); y2+=8;
        if(d.crowd){ pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Crowd by month (J F M A M J J A S O N D)',52,y2); y2+=8;
          for(var ci=0; ci<12; ci++){ var cv=d.crowd[ci];
            pdf.setFillColor(cv<35?60:(cv<60?224:214), cv<35?176:(cv<60?150:82), cv<35?120:(cv<60?54:74));
            pdf.rect(52+ci*33, y2, 26, 12*(cv/100)+3, 'F'); }
          y2+=26; } }
      if(d.visa){ h('\ud83d\udec2 Visa (Indian passport)');
        pdf.text(pdf.splitTextToSize((d.visa.type||'')+' \u00b7 '+(d.visa.cost||'')+' \u00b7 up to '+(d.visa.days||'')+' days. '+(d.visa.note||''),500),52,y2); y2+=44; }
      h('Emergency - '+(d.country||'local')); pdf.text(emgFor(d.country)+'  -  save your embassy number offline',52,y2); y2+=26;
      h('Pack checklist');
      ['Passport + copies','Travel insurance','Offline maps','Power bank + cables','Meds / ORS','Rain shell','Broken-in shoes','Cash in small notes'].forEach(function(pk,pi){
        var px=52+(pi%2)*250, py=y2+Math.floor(pi/2)*16;
        pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.rect(px,py-8,9,9,'S');
        pdf.setTextColor(INK); pdf.text(pk,px+16,py); });
      y2+=Math.ceil(8/2)*16+10;
      h('\ud83d\udcf1 Your pocket guide'); pdf.text('Live crowd calendars, budgets and this itinerary\u2019s AI twin: www.roamwise.co.in',52,y2);
      pdf.setTextColor(MUT); pdf.setFontSize(9); pdf.text('Generated '+new Date().toLocaleDateString('en-IN')+' \u00b7 figures indicative \u2014 verify before booking',44,742);
      foot(pn);
      /* ---------- OUTPUT ---------- */
      /* SAMPLE MODE: after the first day page, add an upsell page and stop */
      if(window._pdfSample){
        pdf.addPage(); pn++; page(TH.deep[0]!==undefined? undefined:undefined);
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.rect(0,0,600,800,'F'); frame();
        drawMotif(pdf,THK,TH.acc,300,150);
        pdf.setTextColor(GOLD2); pdf.setFont('times','bold'); pdf.setFontSize(30); pdf.text('This is just a taste',300,300,{align:'center'});
        pdf.setTextColor('#EDEAE2'); pdf.setFont('helvetica','normal'); pdf.setFontSize(13);
        [' You have Day 1 of a '+(C.days||5)+'-day plan.','','The full itinerary unlocks:',
         '- Every day, hour-by-hour with photos','- Map & pins page with live links','- Food, culture & local-intel pages',
         '- Secret hacks + cost-saving moves','- Emergency numbers + packing checklist'].forEach(function(l,i){
          pdf.text(l,300,340+i*24,{align:'center'}); });
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(18);
        pdf.text('Unlock Pro \u2014 Rs 100 lifetime',300,560,{align:'center'});
        pdf.setTextColor('#B8B4A8'); pdf.setFont('helvetica','normal'); pdf.setFontSize(11);
        pdf.text('roamwise.co.in  \u00b7  or the \u20b910 one-off in the app',300,586,{align:'center'});
        try{ pdf.textWithLink('Open RoamWise \u2192',300,614,{align:'center',url:'https://www.roamwise.co.in'}); }catch(e){}
        foot(pn);
      }
      window._pdfDbg={pages:pn, hero:!!hero, dayPics:dayPics.filter(Boolean).length, gems:gemPics.length, map:!!mapDat, intel:!!intel, av:!!avatar, ev:evHit.length, sample:!!window._pdfSample};
      var fname='roamwise-'+d.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+(window._pdfSample?'-SAMPLE':'')+'-itinerary.pdf';
      if(window.RW && RW.saveCard){ RW.saveCard(pdf.output('datauristring')); offerOpen('Your itinerary'); }
      else { try{ var u=URL.createObjectURL(pdf.output('blob')); var w2=window.open(u,'_blank');
          if(w2) showToast('\ud83d\udc41 Preview opened \u2014 hit the viewer\u2019s \u2b07 to save'); else pdf.save(fname);
        }catch(e){ pdf.save(fname); } }
      xpAdd(20,'Premium itinerary forged');
      try{ track('pdf_generated'); lsSet('rw_pdf_count', String((parseInt(lsGet('rw_pdf_count')||'0',10)||0)+1)); }catch(e){}
    }).catch(function(err){ console.error('genPdf failed', err); showToast('Could not build the PDF — please try again'); });
  });
}
