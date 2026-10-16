// @ts-nocheck
/* ============================================================================
   js/ui/dussehra-card.js - "Dussehra in Almora" event card on the home page
   ============================================================================
   Same night-ritual look as the E-Cell / Startup Garage card (js/ui/nmims-event-banner.js): a live countdown to
   Dussehra (Tuesday 20 October 2026, India time), then LIVE TODAY, then it removes itself the next day.
   It makes no claim about burning or procession times (not confirmed for Almora) and no price or availability
   claim: stays confirm both on WhatsApp. Buttons open Stay & do and Ailon Tusk. No tracking, no data collected.
   ============================================================================ */
(function(){
  var DATE='2026-10-20', IST=5.5*3600000;
  function startMs(){ var p=DATE.split('-'); return Date.UTC(+p[0],+p[1]-1,+p[2])-IST; }
  function state(now){
    var s=startMs(), e=s+86400000;
    if(now<s){ var d=s-now; return {k:'before',d:Math.floor(d/86400000),h:Math.floor(d%86400000/3600000),m:Math.floor(d%3600000/60000),s:Math.floor(d%60000/1000)}; }
    return now<e?{k:'today'}:{k:'over'};
  }
  var CSS='#rwDusCard{position:relative;overflow:hidden;margin:6px auto 14px;max-width:760px;width:calc(100% - 28px);box-sizing:border-box;padding:20px 16px 18px;border-radius:22px;border:1px solid rgba(232,186,108,.6);text-align:center;background:radial-gradient(120% 90% at 50% 0%,#3a1020 0,#0b0a12 62%),#0b0a12;box-shadow:0 14px 40px rgba(0,0,0,.5)}'
   +'#rwDusCard .dc-mist{position:absolute;inset:-30%;pointer-events:none;background:radial-gradient(38% 30% at 20% 30%,rgba(255,120,40,.3),transparent 70%),radial-gradient(34% 28% at 80% 70%,rgba(232,186,108,.2),transparent 70%);animation:dcDrift 9s ease-in-out infinite alternate}'
   +'@keyframes dcDrift{from{transform:translate3d(-3%,-2%,0) scale(1)}to{transform:translate3d(3%,2%,0) scale(1.08)}}'
   +'#rwDusCard .dc-in{position:relative}#rwDusCard .dc-k{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#E8BA6C}'
   +'#rwDusCard .dc-t{font:900 clamp(28px,8.4vw,46px)/1.05 Georgia,serif;margin:8px 0 2px;color:#FFE0AE;text-shadow:0 0 26px rgba(232,186,108,.45)}'
   +'#rwDusCard .dc-h{margin:10px auto 2px;max-width:520px;font-size:14.5px;line-height:1.45;color:#f2efe6}'
   +'#rwDusCard .dc-clock{display:flex;justify-content:center;gap:8px;margin:14px 0 6px}'
   +'#rwDusCard .dc-c{width:min(21vw,74px);padding:9px 0 6px;border-radius:12px;background:#120a17;border:1px solid rgba(232,186,108,.5)}'
   +'#rwDusCard .dc-n{display:block;font:900 clamp(24px,7.6vw,36px)/1 ui-monospace,Menlo,monospace;color:#FFE0AE;font-variant-numeric:tabular-nums}'
   +'#rwDusCard .dc-l{display:block;margin-top:4px;font-size:9.5px;font-weight:800;letter-spacing:.18em;color:#ff9a63}'
   +'#rwDusCard .dc-live{display:inline-block;margin:12px 0 4px;padding:9px 18px;border-radius:999px;font:900 18px/1 system-ui,sans-serif;letter-spacing:.14em;color:#07090f;background:linear-gradient(95deg,#ff9a63,#E8BA6C);animation:dcGlow 1.4s ease-in-out infinite alternate}'
   +'@keyframes dcGlow{from{box-shadow:0 0 8px rgba(255,140,80,.5)}to{box-shadow:0 0 26px rgba(255,190,110,.9)}}'
   +'#rwDusCard .dc-note{font-size:11.5px;color:#c9c6cf;margin:6px 0 0}'
   +'#rwDusCard .dc-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:12px}'
   +'#rwDusCard .dc-b{border:0;border-radius:12px;padding:12px 16px;font:800 14px/1 inherit;cursor:pointer;color:#0B1020;background:linear-gradient(95deg,#C8913E,#E8BA6C)}'
   +'#rwDusCard .dc-b.g{color:#F2EFE6;background:rgba(255,255,255,.07);border:1px solid rgba(232,186,108,.5)}'
   +'@media (prefers-reduced-motion:reduce){#rwDusCard .dc-mist,#rwDusCard .dc-live{animation:none}}';
  function node(t,c,x){ var e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; }
  function two(n){ return n<10?'0'+n:''+n; }
  function build(){
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    var box=document.createElement('section'); box.id='rwDusCard'; box.className='v v-home'; box.setAttribute('aria-label','Dussehra in Almora');
    box.appendChild(node('div','dc-mist'));
    var in_=node('div','dc-in');
    in_.appendChild(node('div','dc-k','Almora · Kumaon · Tuesday 20 October'));
    in_.appendChild(node('div','dc-t','Dussehra in Almora'));
    in_.appendChild(node('div','dc-h','Every neighbourhood raises its own giant effigy, and the whole Ravan family burns, not just Ravan. Stay with RoamWise partners in town.'));
    var clock=node('div','dc-clock'); clock.setAttribute('role','timer'); var N={};
    [['d','DAYS'],['h','HRS'],['m','MIN'],['s','SEC']].forEach(function(p){ var c=node('div','dc-c'); N[p[0]]=node('span','dc-n','00'); c.appendChild(N[p[0]]); c.appendChild(node('span','dc-l',p[1])); clock.appendChild(c); });
    in_.appendChild(clock);
    in_.appendChild(node('div','dc-note','Rooms and the final price are confirmed by each stay on WhatsApp. Check burning and procession times with local organisers.'));
    var b=node('div','dc-btns'), st1=node('button','dc-b','See Almora stays'); st1.type='button'; st1.onclick=function(){ try{ openListing(); }catch(e){} };
    var ask=node('button','dc-b g','Ask Ailon Tusk'); ask.type='button';
    ask.onclick=function(){ try{ var i=document.getElementById('heroInput'); if(i) i.value='Plan Dussehra in Almora: where to stay and what to see'; if(typeof copilotSend==='function') copilotSend(true); else if(i) i.focus(); }catch(e){} };
    b.appendChild(st1); b.appendChild(ask); in_.appendChild(b); box.appendChild(in_); box.__n=N; box.__clock=clock;
    return box;
  }
  function tick(el){
    var s=state(Date.now());
    if(s.k==='over'){ el.remove(); return false; }
    if(s.k==='today'){ el.__clock.style.display='none'; if(!el.querySelector('.dc-live')) el.__clock.parentNode.insertBefore(node('div','dc-live','DUSSEHRA IS TODAY'),el.__clock); return true; }
    el.__n.d.textContent=two(s.d); el.__n.h.textContent=two(s.h); el.__n.m.textContent=two(s.m); el.__n.s.textContent=two(s.s); return true;
  }
  function mount(){
    if(document.getElementById('rwDusCard')) return true;
    if(state(Date.now()).k==='over') return true;
    var anchor=document.getElementById('bigSix'); if(!anchor||!anchor.parentNode) return false;
    var el=build(); tick(el); anchor.parentNode.insertBefore(el,anchor.nextSibling);
    var t=setInterval(function(){ if(!el.isConnected||!tick(el)) clearInterval(t); },1000);
    return true;
  }
  window.rwDussehraCard={state:state};
  var tries=0; (function wait(){ if(mount()||++tries>30) return; setTimeout(wait,300); })();
})();
