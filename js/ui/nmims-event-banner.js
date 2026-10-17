// @ts-nocheck
/* ============================================================================
   js/ui/nmims-event-banner.js - RoamWise x E-Cell NMIMS event card on the home page
   ============================================================================
   Public, read-only. Shown ONLY when the existing go-live switch is on:
     partnerships/nmims2026.officialConfirmed === true      (public read, admin write)
   Optional fields on that same doc, edited from the Firebase Console, no redeploy:
     eventName   text   default "Startup Garage"
     eventDate   text   YYYY-MM-DD, India date, default 2026-10-15
     venue       text   optional line, shown only if set
     timeText    text   optional line (e.g. "10:00 AM onwards"), shown only if set
     bannerOn    bool   set false to hide the card without un-confirming the MOU
   Nothing is invented: venue and time appear only if the founder filled them in.
     highlightsUrl   https URL, optional; after the event the card shows a "See event highlights" button
     highlightsText  optional button text (default "See event highlights")
   The card stays until the coupons' redeem deadline (partnerships/nmims2026.couponExpiresAt, set when the 500 coupons
   were generated; fallback: 26 days after the event starts), not just until the event ends. Day-of: LIVE TODAY; the
   day after: thanks for coming; then "redeem your pass" with the valid-until date. No tracking, no data collected.
   ========================================================================= */
(function(){
  var DEFAULT_DATE='2026-10-15', IST_MS=5.5*3600000, SHOW_DAYS=2, FALLBACK_DAYS=26;
  function clean(s,n){ return String(s==null?'':s).replace(/[<>\r\n]/g,' ').trim().slice(0,n); }
  function parse(doc){
    var d=doc&&typeof doc==='object'?doc:{};
    var date=/^\d{4}-\d{2}-\d{2}$/.test(String(d.eventDate||''))?String(d.eventDate):DEFAULT_DATE;
    var ce=d.couponExpiresAt, endMs=NaN;
    if(ce&&typeof ce.toMillis==='function'){ try{ endMs=ce.toMillis(); }catch(e){} }
    else if(ce&&typeof ce.seconds==='number'){ endMs=ce.seconds*1000; }
    else if(typeof ce==='number'){ endMs=ce; }
    if(!isFinite(endMs)||endMs<=0) endMs=startMs(date)+FALLBACK_DAYS*86400000;
    var hu=String(d.highlightsUrl||'').trim();
    return {
      endMs: endMs, highlightsUrl: /^https:\/\/[^\s<>"']{4,300}$/.test(hu)?hu:'', highlightsText: clean(d.highlightsText,40)||'See event highlights',
      show: d.officialConfirmed===true && d.bannerOn!==false,
      name: clean(d.eventName,80)||'Startup Garage',
      date: date, venue: clean(d.venue,100), timeText: clean(d.timeText,60)
    };
  }
  /* Event day starts at 00:00 India time; the card is gone SHOW_DAYS days after that (event day + next day). */
  function startMs(date){ var p=date.split('-'); return Date.UTC(+p[0],+p[1]-1,+p[2])-IST_MS; }
  function countdown(now,date,endMs){
    var start=startMs(date), left=start-now, end=(typeof endMs==='number'&&isFinite(endMs))?endMs:start+FALLBACK_DAYS*86400000;
    if(now>=end) return {state:'over'};
    if(now>=start+SHOW_DAYS*86400000) return {state:'redeem',daysLeft:Math.max(1,Math.ceil((end-now)/86400000))};
    if(now>=start+86400000) return {state:'after'};
    if(left<=0) return {state:'today'};
    var s=Math.floor(left/1000);
    return {state:'before',d:Math.floor(s/86400),h:Math.floor(s%86400/3600),m:Math.floor(s%3600/60),s:s%60};
  }
  function two(n){ return (n<10?'0':'')+n; }
  function fmtMs(ms){ var x=new Date(ms+IST_MS); return fmtDate(x.getUTCFullYear()+'-'+two(x.getUTCMonth()+1)+'-'+two(x.getUTCDate())); }
  function fmtDate(date){
    var m=['January','February','March','April','May','June','July','August','September','October','November','December'], p=date.split('-');
    return (+p[2])+' '+m[+p[1]-1]+' '+p[0];
  }
  /* Night-ritual look: ink black, crimson mist, gold digits. Original artwork in RoamWise's own
     "Kumaon Shadow Rite" palette; drifting mist is plain CSS gradients (no images, no extra requests). */
  var CSS='#rwNmimsBanner{position:relative;overflow:hidden;margin:12px auto 16px;max-width:760px;width:calc(100% - 28px);box-sizing:border-box;padding:22px 18px 20px;border-radius:22px;border:1px solid rgba(232,186,108,.6);background:radial-gradient(120% 90% at 50% -10%,#4a1230 0,#14081c 48%,#07090f 100%);color:#F2EFE6;text-align:center;font-family:inherit;box-shadow:0 14px 44px rgba(150,20,60,.38),inset 0 0 0 1px rgba(255,255,255,.04)}'
   +'#rwNmimsBanner .sg-mist{position:absolute;inset:-30%;pointer-events:none;background:radial-gradient(38% 30% at 18% 28%,rgba(200,30,70,.34),transparent 70%),radial-gradient(34% 28% at 82% 70%,rgba(232,186,108,.2),transparent 70%),radial-gradient(30% 24% at 60% 12%,rgba(124,58,237,.22),transparent 70%);animation:sgDrift 16s ease-in-out infinite alternate}'
   +'@keyframes sgDrift{from{transform:translate3d(-3%,-2%,0) scale(1)}to{transform:translate3d(3%,2%,0) scale(1.08)}}'
   +'#rwNmimsBanner .sg-in{position:relative}'
   +'#rwNmimsBanner .sg-kick{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#E8BA6C}'
   +'#rwNmimsBanner .sg-title{font:900 clamp(34px,10vw,58px)/1.02 Georgia,"Times New Roman",serif;margin:8px 0 2px;color:#FFE0AE;text-shadow:0 0 28px rgba(232,186,108,.45),0 2px 0 rgba(120,20,50,.8)}'
   +'#rwNmimsBanner .sg-by{font-size:13.5px;color:#e4dfd6;letter-spacing:.04em}'
   +'#rwNmimsBanner .sg-hook{margin:12px auto 4px;max-width:520px;font-size:15px;line-height:1.45;color:#fff}'
   +'#rwNmimsBanner .sg-hook b{color:#16bf96}'
   +'#rwNmimsBanner .sg-clock{display:flex;justify-content:center;gap:8px;margin:16px 0 6px}'
   +'#rwNmimsBanner .sg-t{width:min(21vw,78px);padding:10px 0 7px;border-radius:12px;background:linear-gradient(180deg,#1a0e1f 0,#0b0a12 50%,#150a18 50%,#07090f 100%);border:1px solid rgba(232,186,108,.5);box-shadow:0 6px 18px rgba(0,0,0,.5),0 0 0 1px rgba(160,20,60,.35);position:relative}'
   +'#rwNmimsBanner .sg-t::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.7)}'
   +'#rwNmimsBanner .sg-n{display:block;font:900 clamp(26px,8.2vw,40px)/1 ui-monospace,Menlo,Consolas,monospace;color:#FFE0AE;text-shadow:0 0 14px rgba(255,200,110,.55);font-variant-numeric:tabular-nums}'
   +'#rwNmimsBanner .sg-l{display:block;margin-top:5px;font-size:9.5px;font-weight:800;letter-spacing:.18em;color:#d6637f}'
   +'#rwNmimsBanner .sg-t.sec .sg-n{animation:sgPulse 1s steps(1) infinite}'
   +'@keyframes sgPulse{50%{color:#ff9aa8;text-shadow:0 0 18px rgba(255,80,110,.75)}}'
   +'#rwNmimsBanner .sg-live{display:inline-block;margin:14px 0 6px;padding:10px 20px;border-radius:999px;font:900 20px/1 system-ui,sans-serif;letter-spacing:.14em;color:#07090f;background:linear-gradient(95deg,#ff7b8a,#E8BA6C);animation:sgGlow 1.4s ease-in-out infinite alternate}'
   +'@keyframes sgGlow{from{box-shadow:0 0 8px rgba(255,120,120,.5)}to{box-shadow:0 0 28px rgba(255,190,110,.9)}}'
   +'#rwNmimsBanner .sg-meta{font-size:12.5px;color:#c9c6cf;margin:2px 0}'
   +'#rwNmimsBanner .sg-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:14px}'
   +'#rwNmimsBanner .sg-b{border:0;border-radius:12px;padding:13px 18px;font:800 14px/1 inherit;cursor:pointer;text-decoration:none;display:inline-block;color:#0B1020;background:linear-gradient(95deg,#C8913E,#E8BA6C)}'
   +'#rwNmimsBanner .sg-b.g{color:#F2EFE6;background:rgba(255,255,255,.07);border:1px solid rgba(232,186,108,.5)}'
   +'#rwNmimsBanner .sg-crest{display:block;margin:0 auto 10px;width:68px;height:68px;border-radius:18px;object-fit:cover;border:1.5px solid rgba(232,186,108,.85);box-shadow:0 0 0 4px rgba(214,99,127,.18),0 8px 26px rgba(0,0,0,.55);animation:sgHalo 3.2s ease-in-out infinite alternate}'
   +'@keyframes sgHalo{from{box-shadow:0 0 0 4px rgba(214,99,127,.16),0 0 14px rgba(232,186,108,.25),0 8px 26px rgba(0,0,0,.55)}to{box-shadow:0 0 0 7px rgba(214,99,127,.26),0 0 34px rgba(232,186,108,.6),0 8px 26px rgba(0,0,0,.55)}}'
   +'#rwNmimsBanner .sg-title{background:linear-gradient(100deg,#FFE0AE 0,#FFE0AE 38%,#fff6dd 50%,#FFE0AE 62%,#FFE0AE 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;text-shadow:none;filter:drop-shadow(0 0 16px rgba(232,186,108,.45)) drop-shadow(0 2px 0 rgba(120,20,50,.8));animation:sgShine 6s ease-in-out infinite}'
   +'@keyframes sgShine{0%,55%{background-position:120% 0}100%{background-position:-120% 0}}'
   +'#rwNmimsBanner .sg-em{position:absolute;bottom:-8px;width:4px;height:4px;border-radius:50%;background:#ffb36b;box-shadow:0 0 8px 2px rgba(255,150,90,.7);opacity:0;pointer-events:none;animation:sgRise 7s linear infinite}'
   +'@keyframes sgRise{0%{transform:translate3d(0,0,0);opacity:0}12%{opacity:.9}100%{transform:translate3d(var(--dx,12px),-300px,0);opacity:0}}'
   +'#rwNmimsBanner .sg-b:not(.g){position:relative;overflow:hidden}'
   +'#rwNmimsBanner .sg-b:not(.g)::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:sgSweep 4.5s ease-in-out infinite}'
   +'@keyframes sgSweep{0%,60%{left:-60%}100%{left:130%}}'
   +'#rwNmimsBanner .sg-pill{display:inline-block;margin:8px 0 0;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.08em;color:#FFE0AE;border:1px solid rgba(232,186,108,.45);background:rgba(232,186,108,.08)}'
   +'@media (prefers-reduced-motion:reduce){#rwNmimsBanner .sg-mist,#rwNmimsBanner .sg-t.sec .sg-n,#rwNmimsBanner .sg-live,#rwNmimsBanner .sg-crest,#rwNmimsBanner .sg-title,#rwNmimsBanner .sg-b::after{animation:none}#rwNmimsBanner .sg-em{display:none}}';
  function node(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function tile(label,cls){ var t=node('div','sg-t'+(cls?' '+cls:'')), n=node('span','sg-n','00'); t.appendChild(n); t.appendChild(node('span','sg-l',label)); return {el:t,n:n}; }
  function build(cfg){
    if(!document.getElementById('rwNmimsCss')){ var st=document.createElement('style'); st.id='rwNmimsCss'; st.textContent=CSS; (document.head||document.documentElement).appendChild(st); }
    var box=document.createElement('section');
    box.id='rwNmimsBanner'; box.className='v v-home';
    box.setAttribute('aria-label','RoamWise and E-Cell, SBM NMIMS Mumbai: '+cfg.name);
    box.appendChild(node('div','sg-mist'));
    var in_=node('div','sg-in');
    for(var e=0;e<9;e++){ var em=node('i','sg-em'); em.style.left=(6+e*11)+'%'; em.style.animationDelay=(e*0.8)+'s'; em.style.animationDuration=(5.5+(e%4)*1.2)+'s'; em.style.setProperty('--dx',((e%2?1:-1)*(8+e*3))+'px'); box.appendChild(em); }
    var crest=document.createElement('img'); crest.className='sg-crest'; crest.src='/assets/img/roamwise-logo-176.webp'; crest.alt='RoamWise'; crest.width=68; crest.height=68; crest.decoding='async'; in_.appendChild(crest);
    in_.appendChild(node('div','sg-kick','RoamWise × E-Cell, SBM NMIMS Mumbai'));
    in_.appendChild(node('div','sg-title',cfg.name));
    in_.appendChild(node('div','sg-by',fmtDate(cfg.date)));
    var hook=node('div','sg-hook'); hook.appendChild(document.createTextNode('NMIMS pass-holders: ')); hook.appendChild(node('b',null,'free lifetime Founder Pro')); hook.appendChild(document.createTextNode(' for the first 500. The founders may be late; your countdown is not.')); in_.appendChild(hook); box.__hook=hook;
    var clock=node('div','sg-clock'); clock.id='rwNmimsCount'; clock.setAttribute('role','timer'); clock.setAttribute('aria-live','off');
    var T={d:tile('DAYS'),h:tile('HRS'),m:tile('MIN'),s:tile('SEC','sec')};
    ['d','h','m','s'].forEach(function(k){ clock.appendChild(T[k].el); });
    in_.appendChild(clock); box.__tiles=T; box.__clock=clock;
    [cfg.timeText,cfg.venue].forEach(function(t){ if(t) in_.appendChild(node('div','sg-meta',t)); });
    var btns=node('div','sg-btns');
    var redeem=node('button','sg-b','I have a pass → Redeem'); redeem.type='button';
    redeem.onclick=function(){ try{ if(typeof openPartnerRedeem==='function') openPartnerRedeem(); }catch(e){} };
    var how=node('a','sg-b g','How it works'); how.href='/nmims/redeem/';
    var ask=node('button','sg-b g','Ask Ailon Tusk'); ask.type='button';
    ask.onclick=function(){ try{ var i=document.getElementById('heroInput'); if(i){ i.value='Tell me about the Startup Garage event and the NMIMS pass'; } if(typeof copilotSend==='function') copilotSend(true); else if(typeof cpFocusHero==='function') cpFocusHero(); }catch(e){} };
    btns.appendChild(redeem); btns.appendChild(how); btns.appendChild(ask);
    if(cfg.highlightsUrl){ var hl=node('a','sg-b g',cfg.highlightsText); hl.href=cfg.highlightsUrl; hl.target='_blank'; hl.rel='noopener noreferrer'; hl.style.display='none'; btns.insertBefore(hl,btns.firstChild); box.__hl=hl; }
    in_.appendChild(btns); box.appendChild(in_);
    return box;
  }
  function tick(cfg,el){
    var c=countdown(Date.now(),cfg.date,cfg.endMs), T=el.__tiles, live=el.querySelector('.sg-live');
    if(c.state==='over'){ el.remove(); return false; }
    if(c.state==='today'||c.state==='after'||c.state==='redeem'){
      el.__clock.style.display='none';
      var msg=c.state==='today'?'LIVE TODAY':(c.state==='after'?'THANKS FOR COMING':'YOUR PASS IS WAITING');
      if(el.__hl) el.__hl.style.display=c.state==='today'?'none':'';
      if(c.state!=='today'&&el.__hook){
        var until=fmtMs(cfg.endMs-1000), line=c.state==='redeem'?('Missed the day? Redeem your free lifetime Founder Pro pass before '+until+' ('+c.daysLeft+(c.daysLeft===1?' day':' days')+' left).'):('Thank you for coming. Redeem your pass before '+until+'.');
        if(el.__hook.textContent!==line) el.__hook.textContent=line;
      }
      if(!live){ live=node('div','sg-live',msg); el.__clock.parentNode.insertBefore(live,el.__clock); }
      else if(live.textContent!==msg) live.textContent=msg;
      return true;
    }
    T.d.n.textContent=two(c.d); T.h.n.textContent=two(c.h); T.m.n.textContent=two(c.m); T.s.n.textContent=two(c.s);
    el.__clock.setAttribute('aria-label',c.d+' days '+c.h+' hours '+c.m+' minutes');
    return true;
  }
  function mount(cfg){
    if(!cfg.show||document.getElementById('rwNmimsBanner')) return;
    /* very top of the home page: above the Ailon Tusk box. Fallbacks keep the old spots. */
    var anchor=document.getElementById('copilotHero'), before=null, parent=null;
    if(anchor&&anchor.parentNode){ parent=anchor.parentNode; before=anchor; }
    else{ var cb=document.getElementById('rwCreatorBanner'); if(cb&&cb.parentNode){ parent=cb.parentNode; before=cb.nextSibling; }
      else{ var sky=document.querySelector('.hero-sky'); if(sky&&sky.parentNode){ parent=sky.parentNode; before=sky; } } }
    if(!parent) return;
    var el=build(cfg);
    if(!tick(cfg,el)) return;
    parent.insertBefore(el,before);
    var t=setInterval(function(){ if(!el.isConnected||!tick(cfg,el)) clearInterval(t); },1000);
  }
  window.rwNmimsBanner={parse:parse,countdown:countdown,startMs:startMs};
  function load(){
    try{
      if(typeof db==='undefined'||!db) return false;
      db.collection('partnerships').doc('nmims2026').get().then(function(s){ mount(parse(s.exists?s.data():null)); }).catch(function(){});
      return true;
    }catch(e){ return false; }
  }
  var tries=0;
  (function wait(){ if(load()||++tries>40) return; setTimeout(wait,500); })();
})();
