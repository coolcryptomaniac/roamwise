// @ts-nocheck
/* ============================================================================
   B2B PARTNERS (rw-v81)
   ============================================================================
   "where do I actually stay / who runs the rafting" -> partner directory.

   RANKING is honest and explainable: signed partners first (we've verified
   them), then by a confidence-weighted rating — a 5.0 from 12 people should
   not outrank a 4.8 from 900. We show the reasoning, never a black-box score.
   ========================================================================= */

/* Bayesian-ish weighting so review COUNT matters, not just the average. */

/* Partners come from Firestore (config/partners), seeded by partners-data.js.
   Same pattern as referrers: the file is a fallback so the directory works
   offline, Firestore keeps it fresh, and no code file is ever edited. */

function rwPartnersSync(){
  try{
    if(typeof db==='undefined' || !db) return;
    db.collection('config').doc('partners').get().then(function(d){
      if(!d.exists) return;
      var list=(d.data()||{}).list;
      if(Array.isArray(list) && list.length){
        var seed=(window.RW_PARTNERS||[]);
        var have={}; list.forEach(function(p){ have[String(p.name||'').toLowerCase()+'|'+p.zone]=1; });
        window.RW_PARTNERS = list.concat(seed.filter(function(p){
          return !have[String(p.name||'').toLowerCase()+'|'+p.zone];
        }));
        try{ lsSet('rw_partners_cache', JSON.stringify(window.RW_PARTNERS)); }catch(e){}
        if(el('partnersOut')) rwPartnersRender();
      }
    }).catch(function(){});
  }catch(e){}
}
(function(){ try{ var c=lsGet('rw_partners_cache');
  if(c){ var l=JSON.parse(c); if(Array.isArray(l)&&l.length) window.RW_PARTNERS=l; } }catch(e){} })();

function rwPartnerScore(p){
  var C=50, M=4.3;                       /* prior weight, prior mean */
  var r=p.rating, n=p.reviews||0;
  if(r==null) return { score:M, why:'no public rating yet' };
  var sc=((C*M)+(r*n))/(C+n);
  var why = n>=500 ? 'strongly reviewed ('+n.toLocaleString('en-IN')+')'
          : n>=100 ? 'well reviewed ('+n+')'
          : n>=30  ? 'early reviews ('+n+')'
                   : 'few reviews so far ('+n+')';
  return { score:sc, why:why };
}
function rwPartnersFor(zone, cat){
  var list=(window.RW_PARTNERS||[]).slice();
  if(zone) list=list.filter(function(p){ return String(p.zone||'').toLowerCase()===String(zone).toLowerCase(); });
  if(cat)  list=list.filter(function(p){ return p.cat===cat; });
  list.forEach(function(p){ var s=rwPartnerScore(p); p._score=s.score; p._why=s.why; });
  list.sort(function(a,b){
    var av=a.verified==='signed'?1:0, bv=b.verified==='signed'?1:0;
    if(av!==bv) return bv-av;                 /* signed partners first */
    return b._score-a._score;
  });
  return list;
}
function openPartners(zone, cat){
  /* rw-v82: renders as a full PAGE, not a card wedged into the home feed. */
  rwPageOpen('partners', function(body){
    var sec=document.createElement('section'); sec.id='partnersSection'; sec.className='xsec';
    body.appendChild(sec);
  });
  var sec=el('partnersSection'); if(!sec) return;
  window._pZone=zone||window._pZone||'';
  window._pCat=cat||window._pCat||'';
  var zones={}; (window.RW_PARTNERS||[]).forEach(function(p){ zones[p.zone]=1; });
  sec.innerHTML='<div class="pt-chips">'
    +'<button class="ev-chip'+(!window._pCat?' on':'')+'" onclick="openPartners(window._pZone,\'\')">All</button>'
    +'<button class="ev-chip'+(window._pCat==='stay'?' on':'')+'" onclick="openPartners(window._pZone,\'stay\')">\ud83c\udfe1 Stays</button>'
    +'<button class="ev-chip'+(window._pCat==='adventure'?' on':'')+'" onclick="openPartners(window._pZone,\'adventure\')">\ud83e\udde1 Adventure</button>'
    +'</div>'
    +'<div class="pt-chips" style="margin-bottom:12px">'
    +'<button class="ev-chip'+(!window._pZone?' on':'')+'" onclick="openPartners(\'\',window._pCat)">Everywhere</button>'
    + Object.keys(zones).map(function(z){
        return '<button class="ev-chip'+(window._pZone===z?' on':'')+'" onclick="openPartners(\''+z+'\',window._pCat)">'+esc2(z)+'</button>';
      }).join('')
    +'</div><div id="partnersOut"></div>';
  rwPartnersRender();
}
function rwPartnersRender(){
  var host=el('partnersOut'); if(!host) return;
  var list=rwPartnersFor(window._pZone, window._pCat);
  if(!list.length){ host.innerHTML='<div class="note" style="text-align:center;padding:20px;color:var(--t3)">Nothing here yet \u2014 we\u2019re adding partners city by city.</div>'; return; }
  host.innerHTML=list.map(function(p,i){
    var T=(window.RW_PARTNER_TIERS||[]).filter(function(t){ return t.id===p.verified; })[0]||{icon:'',label:''};
    var stars = p.rating!=null ? '\u2b50 '+p.rating.toFixed(1) : '';
    return '<div class="pt-card'+(p.verified==='signed'?' signed':'')+'">'
      +'<div class="pt-top">'
      +'<span class="pt-rank">'+(i+1)+'</span>'
      +'<span style="flex:1;min-width:0"><b class="pt-name">'+esc2(p.name)+'</b>'
      +'<div class="pt-where">'+esc2(p.area||'')+' \u00b7 '+esc2(p.zone)+'</div></span>'
      +(stars?'<span class="pt-rate">'+stars+'</span>':'')
      +'</div>'
      +'<div class="pt-hook">'+esc2(p.hook||'')+'</div>'
      +'<div class="pt-meta">'
      +'<span class="pt-tag '+(p.verified==='signed'?'ok':'')+'">'+T.icon+' '+esc2(T.label)+'</span>'
      +'<span class="pt-why">'+esc2(p._why)+'</span>'
      +(p.badge?'<span class="pt-tag ok">\ud83c\udfc5 '+esc2(p.badge)+'</span>':'')
      +'</div>'
      +'<div class="pt-acts">'
      +'<button class="tact" onclick="rwPartnerMaps(\''+p.id+'\')">\ud83d\uddfa\ufe0f Find it</button>'
      +'<button class="tact" onclick="rwPartnerBook(\''+p.id+'\')">\u2795 Add to trip</button>'
      +'<button class="tact" onclick="rwPartnerPlan(\''+p.id+'\')">\u2728 Plan around it</button>'
      +'</div></div>';
  }).join('')
  +'<div class="pt-foot">Ranked by rating <em>weighted by how many people reviewed</em> \u2014 a 5.0 from 12 people shouldn\u2019t outrank a 4.8 from 900. '
  +'Entries marked <b>Researched</b> are places we found and rated highly; they are not yet formal partners, and we say so rather than implying otherwise.</div>';
}
function rwPartnerById(id){ return (window.RW_PARTNERS||[]).filter(function(p){ return p.id===id; })[0]; }
function rwPartnerMaps(id){
  var p=rwPartnerById(id); if(!p) return;
  var q=encodeURIComponent(p.name+' '+(p.area||'')+' '+p.zone);
  window.open('https://www.google.com/maps/search/?api=1&query='+q,'_blank','noopener');
}

function rwPartnerBook(id){
  var p=rwPartnerById(id); if(!p) return;
  var cat = p.cat==='adventure' ? 'do' : (p.cat||'stay');
  rwBasketAdd({ id:p.id, name:p.name, cat:cat, where:(p.area||'')+' \u00b7 '+p.zone, price:0, partner:true });
}

function rwPartnerPlan(id){
  var p=rwPartnerById(id); if(!p) return;
  rwCloseSection('partnersSection');
  var inp=el('heroInput')||el('cpInput');
  if(inp){
    inp.value='Plan a trip to '+p.zone+' staying around '+p.area+'. I am looking at '+p.name+'. '
      +'Give honest travel times, what to do nearby, and a realistic daily budget.';
    try{ copilotSend(!!el('heroInput')); }catch(e){}
  }
}
