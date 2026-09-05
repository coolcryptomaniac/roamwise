// @ts-nocheck
/* Moved verbatim from app.js (Phase 5b modularization). See js/itinerary/CLAUDE-CODE-MERGE-NOTES.md-style
   convention: this file is loaded via a classic <script> tag before app.js in index.html,
   so its functions/vars are plain globals other files (including app.js) already call. */

/* ---- from app.js lines 2041-2070: menu search (drFilter) ---- */
/* ===== MENU SEARCH (rw-v55) — 64 items is too many to scan, so let people
   type. Filters links live, auto-opens any group with a match, and shows a
   clear empty state rather than a blank drawer. */
function drFilter(q){
  q=String(q||'').trim().toLowerCase();
  var groups=document.querySelectorAll('.drawer .dr-grp');
  var total=0;
  groups.forEach(function(g){
    var links=g.querySelectorAll('.dr-link'), shown=0;
    links.forEach(function(a){
      var txt=(a.textContent||'').toLowerCase();
      var hit=!q || txt.indexOf(q)>-1;
      a.style.display=hit?'':'none';
      if(hit) shown++;
    });
    total+=shown;
    g.style.display=(q && !shown)?'none':'';
    if(q && shown) g.classList.add('open');
    else if(!q) g.classList.remove('open');
  });
  /* keep the first group open when the search is cleared */
  if(!q){ var f=document.querySelector('.drawer .dr-grp'); if(f) f.classList.add('open'); }
  var empty=el('drEmpty');
  if(!empty){
    empty=document.createElement('div'); empty.id='drEmpty'; empty.className='dr-empty';
    var host=document.querySelector('.drawer'); if(host) host.appendChild(empty);
  }
  empty.style.display=(q && !total)?'block':'none';
  empty.textContent=q? 'Nothing matches \u201c'+q+'\u201d' : '';
}

/* ---- from app.js lines 2744-2809: site search (ssIndex/ssOpen/ssClose/ssRun/_ssGo) ---- */
/* ===== SITE SEARCH ===== */
function ssIndex(){
  var ix=[
   {t:'Plan a trip (crowd calendar + budget)',k:'plan search itinerary budget crowd month',go:function(){tabGo('plan');}},
   {t:'Trek Vault',k:'trek hike hidden dangerous new',go:function(){tabGo('explore');scrollToId('treks');}},
   {t:'Event Radar (FIFA, Olympics...)',k:'event fifa olympics cricket concert f1 iphone',go:function(){tabGo('explore');scrollToId('events');}},
   {t:'Hub & Spoke India + airports + Vande Bharat + best base',k:'airport vande bharat train bus base delhi flights india',go:function(){tabGo('explore');scrollToId('hubspoke');}},
   {t:'EV Vault + breakthroughs',k:'ev electric battery tesla charging breakthrough',go:function(){tabGo('explore');scrollToId('ev');}},
   {t:'AI Pulse (agents, robots, startups)',k:'ai claude anthropic chatgpt gemini robot startup agent',go:function(){tabGo('explore');scrollToId('aipulse');}},
   {t:'Travel Pulse News (daily crunched headlines)',k:'news visa flight advisory pulse today',go:function(){tabGo('explore');scrollToId('newspulse');}},
   {t:'Ratings & Testimonials',k:'rating review stars testimonial feedback',go:function(){tabGo('home');scrollToId('ratings');}},
   {t:'Journey Card (poster) & Movie',k:'journey card map poster movie video souvenir',go:function(){tabGo('explore');scrollToId('jlog');}},
   {t:'Store (books, PDFs, membership)',k:'store shop buy book tshirt membership consult',go:function(){tabGo('home');scrollToId('store');}},
   {t:'My Profile & lifetime destinations',k:'profile avatar bio age style lifetime',go:function(){openProfile();}},
   {t:'AI setup wizard (free keys)',k:'api key gemini groq wizard setup',go:function(){openWizard();}},
   {t:'AI Arena (compare models)',k:'compare arena models benchmark',go:function(){showToast('Build any itinerary, then tap Compare AI engines');tabGo('plan');}},
   {t:'Premium PDF itinerary',k:'pdf premium download print',go:function(){tabGo('plan');showToast('Search a place, open its itinerary, tap Premium PDF');}},
   {t:'Saved for later',k:'saved wishlist heart',go:function(){showSaved();}},
   {t:'Unlock Pro / Supporter',k:'pro pay upgrade supporter price',go:function(){openPay();}},
   {t:'Basecamp (companies, emergency, packing)',k:'basecamp emergency packing operators',go:function(){tabGo('explore');scrollToId('basecamp');}},
   {t:'The Creator & books',k:'creator mohit books author about',go:function(){tabGo('home');scrollToId('creator');}},
   {t:'My Music',k:'music songs phonk spotify saavn',go:function(){openMusic();}},
   {t:'The RoamWise Film (promo video)',k:'promo film video anthem watch',go:function(){tabGo('home');scrollToId('promofilm');}}
  ];
  /* DESTINATIONS (rw-v81 — Febin's "Kerala shows No match" bug).
     The index had every FEATURE but not a single PLACE, so searching a real
     destination looked like we didn't cover it. Now every known place, region
     and curated override is searchable and goes straight to planning. */
  try{
    var _seen={};
    var addDest=function(name, label){
      var k=String(name||'').toLowerCase(); if(!k||_seen[k]) return; _seen[k]=1;
      ix.push({ t:(label||'\ud83d\udccd Plan a trip to '+name), k:k,
        go:(function(n){ return function(){ ssClose(); var d=el('destInput'); if(d) d.value=n; tabGo('plan');
          try{ if(typeof goPlan==='function') goPlan(); }catch(e){ /* best-effort, ignore */ } }; })(name) });
    };
    Object.keys(rwKnownMap()||{}).forEach(function(k){ addDest(rwKnownMap()[k]); });
    (window.RW_REGIONS||[]).forEach(function(r){
      addDest(r.name, '\ud83d\uddfa\ufe0f '+r.name+' \u2014 '+r.blurb);
      (r.alias||[]).forEach(function(a){ addDest(a, '\ud83d\uddfa\ufe0f '+r.name+' \u2014 '+r.blurb); });
    });
  }catch(e){ /* best-effort nav helper, ignore */ }
  (typeof TREKS!=='undefined'?TREKS:[]).forEach(function(t){ ix.push({t:'Trek: '+t.n,k:t.n.toLowerCase(),go:function(){tabGo('explore');scrollToId('treks');}}); });
  (typeof EVENTS!=='undefined'?EVENTS:[]).forEach(function(e){ ix.push({t:e.ic+' '+e.n,k:e.n.toLowerCase(),go:function(){eventPlan(e.id);}}); });
  (typeof EXPS!=='undefined'?EXPS:[]).forEach(function(e){ ix.push({t:'Experience: '+e.n,k:e.n.toLowerCase(),go:function(){tabGo('explore');scrollToId('exps');}}); });
  return ix;
}
var _ssIx=null;
function ssOpen(){ el('siteSearch').style.display='block'; el('ssInput').focus(); useBump('search'); }
function ssClose(){ el('siteSearch').style.display='none'; el('ssOut').innerHTML=''; el('ssInput').value=''; }
function ssRun(q){
  q=(q||'').toLowerCase().trim();
  if(!_ssIx) _ssIx=ssIndex();
  var out=el('ssOut');
  if(q.length<2){ out.innerHTML=''; return; }
  var hits=_ssIx.filter(function(x){ return (x.t+' '+x.k).toLowerCase().indexOf(q)>-1; }).slice(0,9);
  out.innerHTML = hits.length? hits.map(function(x,i){ return '<div class="ti-day" style="cursor:pointer;padding:11px 12px;border:1px solid var(--b);border-radius:11px;margin-bottom:7px;background:#0E1018" onclick="_ssGo('+i+')"><b>&#128269;</b><span>'+x.t+'</span></div>'; }).join('')
    : '<div class="mode-box" style="text-align:left;line-height:1.7">'
      +'<b>\ud83c\udf0d We can plan a trip to \u201c'+esc2(q)+'\u201d</b><br>'
      +'<span style="font-size:12px;color:var(--t2)">RoamWise plans anywhere on Earth \u2014 if it is a real place, we will build you a day-by-day itinerary with honest travel times and local costs.</span><br>'
      +'<button class="tact" style="margin-top:9px;font-weight:800;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#0A0A0C;border:none" onclick="ssClose();el(\'destInput\').value=\''+q.replace(/'/g,'')+'\';tabGo(\'plan\')">\u2728 Plan '+esc2(q)+' \u2192</button>'
      +'</div>';
  window._ssHits=hits;
}
function _ssGo(i){ var x=window._ssHits[i]; ssClose(); x.go(); }


