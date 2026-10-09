// @ts-nocheck
/* ============================================================================
   js/ui/nmims-event-banner.js - RoamWise x E-Cell NMIMS event card on the home page
   ============================================================================
   Public, read-only. Shown ONLY when the existing go-live switch is on:
     partnerships/nmims2026.officialConfirmed === true      (public read, admin write)
   Optional fields on that same doc, edited from the Firebase Console, no redeploy:
     eventName   text   default "E-Cell NMIMS event"
     eventDate   text   YYYY-MM-DD, India date, default 2026-10-15
     venue       text   optional line, shown only if set
     timeText    text   optional line (e.g. "10:00 AM onwards"), shown only if set
     bannerOn    bool   set false to hide the card without un-confirming the MOU
   Nothing is invented: venue and time appear only if the founder filled them in.
   The card disappears the day after the event. No tracking, no data collected.
   ========================================================================= */
(function(){
  var DEFAULT_DATE='2026-10-15', IST_MS=5.5*3600000;
  function clean(s,n){ return String(s==null?'':s).replace(/[<>\r\n]/g,' ').trim().slice(0,n); }
  function parse(doc){
    var d=doc&&typeof doc==='object'?doc:{};
    var date=/^\d{4}-\d{2}-\d{2}$/.test(String(d.eventDate||''))?String(d.eventDate):DEFAULT_DATE;
    return {
      show: d.officialConfirmed===true && d.bannerOn!==false,
      name: clean(d.eventName,80)||'E-Cell NMIMS event',
      date: date, venue: clean(d.venue,100), timeText: clean(d.timeText,60)
    };
  }
  /* Event day starts at 00:00 India time; the card is gone 24h after that. */
  function startMs(date){ var p=date.split('-'); return Date.UTC(+p[0],+p[1]-1,+p[2])-IST_MS; }
  function countdown(now,date){
    var start=startMs(date), left=start-now;
    if(now>=start+86400000) return {state:'over'};
    if(left<=0) return {state:'today'};
    var s=Math.floor(left/1000);
    return {state:'before',d:Math.floor(s/86400),h:Math.floor(s%86400/3600),m:Math.floor(s%3600/60),s:s%60};
  }
  function two(n){ return (n<10?'0':'')+n; }
  function build(cfg){
    var box=document.createElement('section');
    box.id='rwNmimsBanner';
    box.setAttribute('aria-label','RoamWise and E-Cell NMIMS event');
    box.style.cssText='margin:12px auto;max-width:760px;padding:16px 18px;border:1px solid rgba(232,186,108,.55);border-radius:16px;background:linear-gradient(135deg,rgba(11,16,32,.96),rgba(60,24,40,.94));color:#F2EFE6;font-family:inherit;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.35)';
    var head=document.createElement('div');
    head.style.cssText='font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#E8BA6C';
    head.textContent='RoamWise × E-Cell NMIMS';
    var title=document.createElement('div');
    title.style.cssText='font-size:19px;font-weight:800;margin:6px 0 4px';
    title.textContent=cfg.name;
    var sub=document.createElement('div');
    sub.style.cssText='font-size:13px;color:#d8d5ce;line-height:1.5';
    sub.textContent='NMIMS students: free lifetime Founder Pro for the first 500 pass-holders. 15 October 2026.'.replace('15 October 2026',fmtDate(cfg.date));
    var count=document.createElement('div');
    count.id='rwNmimsCount';
    count.style.cssText='font-size:26px;font-weight:900;margin:10px 0;letter-spacing:.04em;color:#FFE0AE;font-variant-numeric:tabular-nums';
    count.setAttribute('role','timer');
    box.appendChild(head); box.appendChild(title); box.appendChild(sub); box.appendChild(count);
    [cfg.timeText,cfg.venue].forEach(function(t){ if(!t) return; var l=document.createElement('div'); l.style.cssText='font-size:12.5px;color:#c1c3cb'; l.textContent=t; box.appendChild(l); });
    var btn=document.createElement('button');
    btn.type='button'; btn.textContent='I have a pass → Redeem';
    btn.style.cssText='margin-top:12px;border:0;border-radius:10px;padding:10px 16px;font:800 13px inherit;cursor:pointer;color:#0B1020;background:linear-gradient(95deg,#C8913E,#E8BA6C)';
    btn.onclick=function(){ try{ if(typeof openPartnerRedeem==='function') openPartnerRedeem(); }catch(e){} };
    box.appendChild(btn);
    return box;
  }
  function fmtDate(date){
    var m=['January','February','March','April','May','June','July','August','September','October','November','December'], p=date.split('-');
    return (+p[2])+' '+m[+p[1]-1]+' '+p[0];
  }
  function tick(cfg,el){
    var c=countdown(Date.now(),cfg.date), n=el.querySelector('#rwNmimsCount');
    if(c.state==='over'){ el.remove(); return false; }
    n.textContent=c.state==='today'?'Today is the day':(c.d+'d '+two(c.h)+'h '+two(c.m)+'m '+two(c.s)+'s');
    return true;
  }
  function mount(cfg){
    if(!cfg.show||document.getElementById('rwNmimsBanner')) return;
    var anchor=document.querySelector('.hero-sky'); if(!anchor||!anchor.parentNode) return;
    var el=build(cfg);
    if(!tick(cfg,el)) return;
    anchor.parentNode.insertBefore(el,anchor);
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
