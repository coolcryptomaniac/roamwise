// @ts-nocheck
/* ============================================================================
   js/ui/creator-property-board.js - "Top creators | Top stays" side by side on the home page
   ============================================================================
   Left: creators the founder has chosen to feature (config/creatorSpotlight, public read, admin write). Each shows
   only a public Instagram link, niche, town and the match engine's best property with its fit score. The admin
   page never offers the button for anyone who asked not to be shared. No phone, email or private notes exist in
   that record. Right: signed, ready RoamWise stays from the same list guests already see (rwListingAll).
   No tracking, nothing is collected here.
   ============================================================================ */
(function(){
  var CSS='#rwBoard{margin:8px 14px 14px;max-width:760px;box-sizing:border-box}@media (min-width:800px){#rwBoard{margin-left:auto;margin-right:auto}}'
   +'#rwBoard .bd-h{display:flex;align-items:baseline;justify-content:space-between;margin:0 2px 8px}'
   +'#rwBoard .bd-h b{font:800 18px/1.1 Georgia,serif;color:#FFE0AE}#rwBoard .bd-h span{font-size:11.5px;color:var(--t3,#9a958a)}'
   +'#rwBoard .bd-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
   +'#rwBoard .bd-c{min-width:0;padding:10px;border-radius:18px;border:1px solid rgba(232,186,108,.4);background:linear-gradient(160deg,#1b1226,#0d0b14);animation:bdRise .5s ease both}'
   +'#rwBoard .bd-c:nth-child(2){animation-delay:.1s}'
   +'#rwBoard .bd-k{font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#E8BA6C;margin:2px 2px 8px}'
   +'#rwBoard .bd-r{display:block;width:100%;box-sizing:border-box;text-align:left;border:0;background:rgba(255,255,255,.05);color:#F2EFE6;border-radius:12px;padding:9px 10px;margin:0 0 7px;font:inherit;text-decoration:none;cursor:pointer;transition:transform .15s,background .15s}'
   +'#rwBoard .bd-r:hover{background:rgba(232,186,108,.12);transform:translateY(-1px)}'
   +'#rwBoard .bd-n{display:block;font:700 13.5px/1.25 system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
   +'#rwBoard .bd-s{display:block;margin-top:2px;font-size:11px;line-height:1.35;color:#cfc8bb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
   +'#rwBoard .bd-m{display:inline-block;margin-top:5px;padding:3px 8px;border-radius:999px;font-size:10.5px;font-weight:800;color:#07090f;background:linear-gradient(95deg,#16bf96,#6ee7c4)}'
   +'#rwBoard .bd-m.n{background:linear-gradient(95deg,#E8BA6C,#ffd98e)}'
   +'#rwBoard .bd-t{font:800 10px system-ui;letter-spacing:.04em;color:#E8BA6C;white-space:nowrap}'
   +'#rwBoard .bd-ig{color:#ff9aa8;font-weight:700}'
   +'#rwBoard .bd-cta{display:block;text-align:center;margin-top:4px;padding:9px;border-radius:12px;font:800 12.5px system-ui,sans-serif;text-decoration:none;color:#0B1020;background:linear-gradient(95deg,#C8913E,#E8BA6C)}'
   +'#rwBoard .bd-e{font-size:12px;line-height:1.45;color:#d8d5ce;margin:2px 2px 8px}'
   +'#rwBoard .bd-note{margin:9px 4px 0;font-size:11.5px;line-height:1.5;color:#cfc8bb}'
   +'@keyframes bdRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}'
   +'@media (prefers-reduced-motion:reduce){#rwBoard .bd-c{animation:none}}';
  var TIER={summit:'🚩 Summit',ridge:'🏔️ Ridge',trail:'🥾 Trail',basecamp:'⛺ Base Camp'};
  var IG=/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._\/-]{1,80}\/?(\?[^\s<>"']{0,60})?$/i;
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function handleOf(u){ var m=/instagram\.com\/([A-Za-z0-9._-]+)/i.exec(u||''); return m?'@'+m[1]:'Instagram'; }
  function creatorRow(c){
    if(!c||!c.name) return '';
    var m=c.match||{}, ok=IG.test(String(c.handle||'')), score=Math.max(0,Math.min(100,Number(m.score)||0));
    var inner='<span class="bd-n">'+esc(c.name)+(TIER[c.tier]?' <span class="bd-t">'+TIER[c.tier]+'</span>':'')+'</span><span class="bd-s">'+(ok?'<span class="bd-ig">'+esc(handleOf(c.handle))+'</span>':'')+(c.niche?' · '+esc(c.niche):'')+(c.town?' · '+esc(c.town):'')+'</span>'
      +(m.name?'<span class="bd-m'+(m.verdict==='send'?'':' n')+'">Best for '+esc(m.name)+' · '+score+'/100</span>':'');
    return ok?'<a class="bd-r" href="'+esc(c.handle)+'" target="_blank" rel="noopener noreferrer">'+inner+'</a>':'<div class="bd-r" style="cursor:default">'+inner+'</div>';
  }
  /* Only stays that have agreed to host creators. Defaults mirror the founder's current list (creators/property-terms-core.mjs
     SEED_POLICIES); config/creatorPolicies, when present, overrides by propertyId (public read, admin write). */
  var OPEN={p_milan_heights:true,p_big_bro_hotel:true};
  function stays(){
    var list=[]; try{ list=rwListingAll(); }catch(e){}
    list=list.filter(function(x){ return OPEN[x.id]===true; }).slice().sort(function(a,b){ return (((b.nomad&&b.nomad.enabled)?2:0)+((b.photos||[]).length?1:0))-(((a.nomad&&a.nomad.enabled)?2:0)+((a.photos||[]).length?1:0)); }).slice(0,4);
    return list.map(function(x){
      return '<button type="button" class="bd-r" onclick="try{rwListOpen(\''+esc(String(x.id).replace(/'/g,''))+'\')}catch(e){}"><span class="bd-n">'+esc(x.name)+'</span>'
        +'<span class="bd-s">'+esc((x.area||'')+(x.area&&x.zone?' · ':'')+(x.zone||''))+'</span>'
        +'<span class="bd-m n">'+((x.nomad&&x.nomad.enabled)?'Checked · work stay':'RoamWise Checked')+'</span></button>';
    }).join('');
  }
  function render(host,creators){
    var left=creators.map(creatorRow).join('');
    if(!left) left='<div class="bd-e">No creator is featured yet. Register free and get matched with a stay.</div>';
    left+='<a class="bd-cta" href="creators/match.html?role=creator&invite=founding">Register as creator</a>';
    var right=(stays()||'<div class="bd-e">Stays that welcome creators will appear here.</div>')+'<a class="bd-cta" href="creators/match.html?role=property">Hosts: find creators</a>';
    host.innerHTML='<div class="bd-h"><b>Creators &times; Stays</b><span>Matched by RoamWise</span></div><div class="bd-g">'
      +'<div class="bd-c"><div class="bd-k">Top creators</div>'+left+'</div><div class="bd-c"><div class="bd-k">Top stays</div>'+right+'</div></div>';
  }
  function mount(){
    if(document.getElementById('rwBoard')) return true;
    var anchor=document.getElementById('quickGrid'); if(!anchor||!anchor.parentNode||typeof rwListingAll!=='function'||!window.RW_PARTNERS) return false;
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    var host=document.createElement('section'); host.id='rwBoard'; host.className='v v-home'; host.setAttribute('aria-label','Top creators and stays');
    anchor.parentNode.insertBefore(host,anchor); render(host,[]);
    try{ if(typeof db!=='undefined'&&db) db.collection('config').doc('creatorPolicies').get().then(function(s){ var l=s.exists&&s.data()&&Array.isArray(s.data().list)?s.data().list:[]; l.forEach(function(p){ if(p&&p.propertyId) OPEN[p.propertyId]=(p.status==='open'); }); render(host,host.__c||[]); }).catch(function(){}); }catch(e){}
    try{ if(typeof db!=='undefined'&&db) db.collection('config').doc('creatorSpotlight').get().then(function(s){ var l=s.exists&&s.data()&&Array.isArray(s.data().list)?s.data().list.slice(0,12):[]; host.__c=l; render(host,l); }).catch(function(){}); }catch(e){}
    return true;
  }
  window.rwCreatorBoard={creatorRow:creatorRow};
  var tries=0; (function wait(){ if(mount()||++tries>40) return; setTimeout(wait,400); })();
})();
