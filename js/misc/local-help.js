// @ts-nocheck
/* ============================================================================
   LOCAL HELP (rw-v126) — "who do I call in this town?"
   ============================================================================
   Idea taken from hyperlocal portals: browse district -> town -> category ->
   provider, and contact with one tap (WhatsApp first, because that is how hill
   providers actually work). Data lives in /local-help-data.js.

   Honest by construction: only providers with a consent date are shown, each
   with its verification level, and an empty town says so instead of faking
   a list. Emergencies are NOT handled here — they link to the SOS page.
   ========================================================================== */
function rwLhAttr(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

function openLocalHelp(town, cat){
  rwPageOpen('localhelp', function(body){
    var sec=document.createElement('section'); sec.id='localHelpSection'; sec.className='xsec';
    body.appendChild(sec);
  });
  var sec=el('localHelpSection'); if(!sec) return;
  if(typeof town==='string') window._lhTown=town;
  if(typeof cat==='string') window._lhCat=cat;
  window._lhTown=window._lhTown||'';
  window._lhCat=window._lhCat||'all';
  var opts='<option value="">Choose a town…</option>'+(window.RW_LOCAL_DISTRICTS||[]).map(function(d){
    return '<optgroup label="'+rwLhAttr(d.name)+'">'+d.towns.map(function(t){
      return '<option value="'+rwLhAttr(t)+'"'+(t===window._lhTown?' selected':'')+'>'+rwLhAttr(t)+'</option>';
    }).join('')+'</optgroup>';
  }).join('');
  sec.innerHTML='<select id="lhTown" onchange="openLocalHelp(this.value)" '
    +'style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:11px;padding:11px;color:var(--t1);font:inherit;margin-bottom:12px">'+opts+'</select>'
    +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px">'
    +'<button class="ev-chip'+(window._lhCat==='all'?' on':'')+'" onclick="openLocalHelp(window._lhTown,\'all\')">All</button>'
    +(window.RW_LOCAL_CATEGORIES||[]).map(function(c){
        var n=window._lhTown?rwLocalFind(c.id,window._lhTown).length:-1;
        return '<button class="ev-chip'+(window._lhCat===c.id?' on':'')+'"'+(n===0?' style="opacity:.5"':'')+' onclick="openLocalHelp(window._lhTown,\''+c.id+'\')">'+c.icon+' '+rwLhAttr(c.label)+(n>0?' <span style="opacity:.7">'+n+'</span>':'')+'</button>';
      }).join('')
    +'</div><div id="lhOut"></div>'
    +'<div class="sos-block"><b>🆘 In an emergency</b>'
    +'<div>Use the <a href="#" onclick="openSOS();return false" style="color:var(--gold)">Stranded? page</a> — it works offline and has the official numbers.</div>'
    +'<div><a href="'+rwLhAttr((window.RW_LOCAL_LINKS||{}).blood&&RW_LOCAL_LINKS.blood.url)+'" target="_blank" rel="noopener" style="color:var(--gold)">'+rwLhAttr((window.RW_LOCAL_LINKS||{}).blood&&RW_LOCAL_LINKS.blood.label)+'</a></div></div>';
  rwLocalHelpLoad();
  rwLocalHelpRender();
}

/* The imported listings are ~35KB, so they are fetched only when this page is first opened. */
function rwLocalHelpLoad(){
  if(window.RW_LOCAL_LISTINGS_LOADED||window._lhLoading||window._lhFailed) return;
  window._lhLoading=true;
  var s=document.createElement('script'); s.src='local-help-listings.js?v=rw-v127';
  s.onload=function(){ window._lhLoading=false; if(el('localHelpSection')) openLocalHelp(window._lhTown,window._lhCat); };
  s.onerror=function(){ window._lhLoading=false; window._lhFailed=true; rwLocalHelpRender(); };
  document.head.appendChild(s);
}

function rwLocalHelpRender(){
  var host=el('lhOut'); if(!host) return;
  var town=window._lhTown, cat=window._lhCat;
  if(!town){
    host.innerHTML='<div class="gr-foot" style="margin:6px 0 16px">Pick a town to see local drivers, homestays, guides and repair help.<br>Gateways into Kumaon: '
      +(window.RW_LOCAL_GATEWAYS||[]).map(rwLhAttr).join(' · ')+'.</div>';
    return;
  }
  if(window._lhLoading){ host.innerHTML='<div class="gr-foot" style="margin:6px 0 16px">Loading local listings\u2026</div>'; return; }
  var list=rwLocalFind(cat,town);
  var catObj=(window.RW_LOCAL_CATEGORIES||[]).filter(function(c){ return c.id===cat; })[0];
  var out=list.map(function(p){
    var c=(RW_LOCAL_CATEGORIES.filter(function(x){ return x.id===p.cat; })[0])||{icon:'',label:''};
    var wa=rwLocalWhatsApp(p,'Hi, I found you on RoamWise. I\u2019m visiting '+town+'.'), tel=rwLocalTel(p);
    var seen=rwLocalMonth(p);
    var vl=Object.prototype.hasOwnProperty.call(RW_LOCAL_VERIFY,p.verified)?RW_LOCAL_VERIFY[p.verified]:RW_LOCAL_VERIFY.self;
    return '<div class="sos-block"><b>'+c.icon+' '+rwLhAttr(p.name)+'</b>'
      +'<div>'+rwLhAttr(p.svc||c.label)+' \u00b7 '+rwLhAttr(p.town)+(p.languages&&p.languages.length?' \u00b7 '+rwLhAttr(p.languages.join(', ')):'')+'</div>'
      +(p.note?'<div>'+rwLhAttr(p.note)+'</div>':'')
      +(vl||seen?'<div style="font-size:11px;color:var(--t3)">'+(vl?'\u2714 '+rwLhAttr(vl)+(seen?' \u00b7 updated '+rwLhAttr(seen):''):'Updated '+rwLhAttr(seen))+'</div>':'')
      +'<div style="display:flex;gap:8px;margin-top:6px;align-items:center;flex-wrap:wrap">'
      +(wa?'<a class="ev-chip" style="text-decoration:none" href="'+rwLhAttr(wa)+'" target="_blank" rel="noopener">WhatsApp</a>':'')
      +(tel?'<a class="ev-chip" style="text-decoration:none" href="'+rwLhAttr(tel)+'">Call</a>':'')
      +'<a href="'+rwLhAttr(rwLocalRemoveMail(p))+'" style="font-size:10.5px;color:var(--t3);margin-left:auto">Remove</a></div></div>';
  }).join('');
  if(!out){
    out='<div class="sos-block"><b>'+(window._lhFailed?'Couldn\u2019t load listings \u2014 check your connection. ':'')+'No verified, recent listings in '+rwLhAttr(town)+(catObj?' for '+rwLhAttr(catObj.label.toLowerCase()):'')+' yet</b>'
      +'<div>We only show verified listings updated in the last year, so some towns are still empty.'
      +(catObj?' '+rwLhAttr(catObj.hint):'')+'</div>'
      +'<div>Local? <a href="'+rwLhAttr(rwLocalListMail(town))+'" style="color:var(--gold)">Get listed</a> — free.</div></div>';
  }
  /* Link out for everything we don't list. Google results are not verified by RoamWise. */
  var mapCats=(cat==='all')?(window.RW_LOCAL_CATEGORIES||[]):(catObj?[catObj]:[]);
  out+='<div class="sos-block"><b>\ud83d\uddfa\ufe0f More in '+rwLhAttr(town)+'</b>'
    +'<div>Not listed above? Search Google Maps \u2014 these results aren\u2019t checked by RoamWise, so call ahead.</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'
    +mapCats.map(function(c){ return '<a class="ev-chip" style="text-decoration:none" href="'+rwLhAttr(rwLocalMapsUrl(c.id,town))+'" target="_blank" rel="noopener">'+c.icon+' '+rwLhAttr(c.label)+'</a>'; }).join('')
    +'</div></div>';
  host.innerHTML=out;
}
