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
   +'#rwDusCard .dc-t{background:linear-gradient(100deg,#FFE0AE 0,#FFE0AE 38%,#fff6dd 50%,#FFE0AE 62%,#FFE0AE 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;text-shadow:none;filter:drop-shadow(0 0 16px rgba(255,140,60,.5)) drop-shadow(0 2px 0 rgba(120,20,30,.8));animation:dcShine 6s ease-in-out infinite}'
   +'@keyframes dcShine{0%,55%{background-position:120% 0}100%{background-position:-120% 0}}'
   +'#rwDusCard .dc-sun{display:block;margin:0 auto 4px;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#fff1c2 0,#ffb347 45%,#e8742a 100%);box-shadow:0 0 0 4px rgba(255,140,60,.2),0 0 30px rgba(255,170,70,.6);animation:dcHalo 3.2s ease-in-out infinite alternate}'
   +'@keyframes dcHalo{from{box-shadow:0 0 0 4px rgba(255,140,60,.16),0 0 14px rgba(255,170,70,.3)}to{box-shadow:0 0 0 8px rgba(255,140,60,.26),0 0 38px rgba(255,190,90,.75)}}'
   +'#rwDusCard .dc-em{position:absolute;bottom:-8px;width:4px;height:4px;border-radius:50%;background:#ffb36b;box-shadow:0 0 8px 2px rgba(255,150,90,.7);opacity:0;pointer-events:none;animation:dcRise 7s linear infinite}'
   +'@keyframes dcRise{0%{transform:translate3d(0,0,0);opacity:0}12%{opacity:.9}100%{transform:translate3d(var(--dx,12px),-320px,0);opacity:0}}'
   +'#rwDusCard .dc-eff{display:block;width:100%;max-width:520px;height:auto;margin:14px auto 0}'
   +'#rwDusCard .dc-eff .eye{fill:#ffb347;animation:dcEye 2.6s ease-in-out infinite alternate}'
   +'#rwDusCard .dc-eff .e2 .eye{animation-delay:-.9s}#rwDusCard .dc-eff .e3 .eye{animation-delay:-1.7s}'
   +'@keyframes dcEye{from{opacity:.35}to{opacity:1}}'
   +'#rwDusCard .dc-eff .fig{transform-origin:50% 100%;animation:dcSway 5s ease-in-out infinite alternate}'
   +'#rwDusCard .dc-eff .e2 .fig{animation-delay:-2s}#rwDusCard .dc-eff .e3 .fig{animation-delay:-3.5s}'
   +'@keyframes dcSway{from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}}'
   +'#rwDusCard .dc-b:not(.g){position:relative;overflow:hidden}'
   +'#rwDusCard .dc-b:not(.g)::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:dcSweep 4.5s ease-in-out infinite}'
   +'@keyframes dcSweep{0%,60%{left:-60%}100%{left:130%}}'
   +'@media (prefers-reduced-motion:reduce){#rwDusCard .dc-mist,#rwDusCard .dc-live,#rwDusCard .dc-t,#rwDusCard .dc-sun,#rwDusCard .dc-eff .eye,#rwDusCard .dc-eff .fig,#rwDusCard .dc-b::after{animation:none}#rwDusCard .dc-em{display:none}}';
  /* Original generic effigy silhouettes (a tall crowned figure with ten heads, and two taller-than-wall figures), drawn here as SVG; not a copy of any artwork. */
  var EFF='<svg class="dc-eff" viewBox="0 0 520 190" role="img" aria-label="Tall effigies of the Ravan family standing in a lantern-lit bazaar lane">'
   +'<defs><linearGradient id="dcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1630"/><stop offset="1" stop-color="#0b0a12"/></linearGradient></defs>'
   +'<path d="M0 150 L70 118 L150 140 L240 100 L330 138 L420 112 L520 142 L520 190 L0 190Z" fill="#1d1236"/>'
   +'<g class="e2"><g class="fig"><path d="M92 176 L100 92 L84 70 L92 40 L110 40 L118 70 L102 92 L112 176Z" fill="url(#dcg)" stroke="#E8BA6C" stroke-opacity=".5"/><path d="M84 70 L66 82 L74 90 L90 80Z M118 70 L136 82 L128 90 L112 80Z" fill="#241034" stroke="#E8BA6C" stroke-opacity=".4"/><circle cx="101" cy="30" r="13" fill="#2a1038" stroke="#E8BA6C" stroke-opacity=".6"/><path d="M89 22 L94 8 L101 18 L108 8 L113 22Z" fill="#E8BA6C"/><circle class="eye" cx="96" cy="31" r="2"/><circle class="eye" cx="106" cy="31" r="2"/></g></g>'
   +'<g class="e1"><g class="fig"><path d="M236 180 L246 100 L224 74 L236 50 L284 50 L296 74 L274 100 L284 180Z" fill="url(#dcg)" stroke="#E8BA6C" stroke-opacity=".6"/><path d="M224 74 L196 92 L206 102 L228 88Z M296 74 L324 92 L314 102 L292 88Z" fill="#241034" stroke="#E8BA6C" stroke-opacity=".45"/>'
   +'<g fill="#2a1038" stroke="#E8BA6C" stroke-opacity=".6"><circle cx="228" cy="36" r="10"/><circle cx="244" cy="26" r="11"/><circle cx="260" cy="20" r="13"/><circle cx="276" cy="26" r="11"/><circle cx="292" cy="36" r="10"/></g>'
   +'<path d="M250 12 L256 -2 L260 8 L264 -2 L270 12Z" fill="#E8BA6C"/><circle class="eye" cx="255" cy="21" r="2"/><circle class="eye" cx="265" cy="21" r="2"/><circle class="eye" cx="240" cy="27" r="1.6"/><circle class="eye" cx="280" cy="27" r="1.6"/></g></g>'
   +'<g class="e3"><g class="fig"><path d="M404 176 L412 96 L396 74 L404 46 L424 46 L432 74 L416 96 L424 176Z" fill="url(#dcg)" stroke="#E8BA6C" stroke-opacity=".5"/><path d="M396 74 L376 90 L384 98 L400 86Z M432 74 L452 90 L444 98 L428 86Z" fill="#241034" stroke="#E8BA6C" stroke-opacity=".4"/><circle cx="414" cy="34" r="13" fill="#2a1038" stroke="#E8BA6C" stroke-opacity=".6"/><path d="M402 26 L407 10 L414 20 L421 10 L426 26Z" fill="#E8BA6C"/><circle class="eye" cx="409" cy="35" r="2"/><circle class="eye" cx="419" cy="35" r="2"/></g></g>'
   +'<g fill="#ffb347"><circle cx="30" cy="172" r="2.5"/><circle cx="170" cy="176" r="2.5"/><circle cx="350" cy="174" r="2.5"/><circle cx="480" cy="172" r="2.5"/></g></svg>';
  function node(t,c,x){ var e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; }
  function two(n){ return n<10?'0'+n:''+n; }
  function build(){
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    var box=document.createElement('section'); box.id='rwDusCard'; box.className='v v-home'; box.setAttribute('aria-label','Dussehra in Almora');
    box.appendChild(node('div','dc-mist'));
    var in_=node('div','dc-in');
    for(var e=0;e<9;e++){ var em=node('i','dc-em'); em.style.left=(6+e*11)+'%'; em.style.animationDelay=(e*0.8)+'s'; em.style.animationDuration=(5.5+(e%4)*1.2)+'s'; em.style.setProperty('--dx',((e%2?1:-1)*(8+e*3))+'px'); box.appendChild(em); }
    in_.appendChild(node('i','dc-sun'));
    in_.appendChild(node('div','dc-k','Almora · Kumaon · Tuesday 20 October'));
    in_.appendChild(node('div','dc-t','Dussehra in Almora'));
    in_.appendChild(node('div','dc-h','Every neighbourhood raises its own giant effigy, and the whole Ravan family burns, not just Ravan. Stay with RoamWise partners in town.'));
    var clock=node('div','dc-clock'); clock.setAttribute('role','timer'); var N={};
    [['d','DAYS'],['h','HRS'],['m','MIN'],['s','SEC']].forEach(function(p){ var c=node('div','dc-c'); N[p[0]]=node('span','dc-n','00'); c.appendChild(N[p[0]]); c.appendChild(node('span','dc-l',p[1])); clock.appendChild(c); });
    in_.appendChild(clock);
    var eff=document.createElement('div'); eff.innerHTML=EFF; in_.appendChild(eff.firstChild);
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
