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
  var CSS='#rwBoard{margin:8px 14px 16px;max-width:760px;box-sizing:border-box;--g:#E8BA6C}@media (min-width:800px){#rwBoard{margin-left:auto;margin-right:auto}}'
   +'#rwBoard .bd-h{display:flex;align-items:baseline;justify-content:space-between;margin:0 2px 10px}'
   +'#rwBoard .bd-h b{font:800 19px/1.1 Georgia,serif;color:#FFE0AE;letter-spacing:.01em}#rwBoard .bd-h span{font-size:11.5px;color:var(--t3,#9a958a)}'
   +'#rwBoard .bd-g{display:grid;grid-template-columns:1fr;gap:12px}@media (min-width:640px){#rwBoard .bd-g{grid-template-columns:1.15fr 1fr}}'
   +'#rwBoard .bd-c{min-width:0;padding:12px;border-radius:20px;border:1px solid rgba(232,186,108,.35);background:radial-gradient(120% 90% at 0% 0%,rgba(232,186,108,.12),transparent 55%),linear-gradient(160deg,#1b1226,#0d0b14);box-shadow:0 10px 30px rgba(0,0,0,.35);animation:bdRise .55s cubic-bezier(.2,.8,.2,1) both}'
   +'#rwBoard .bd-c:nth-child(2){animation-delay:.12s}'
   +'#rwBoard .bd-k{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#E8BA6C;margin:2px 2px 10px}'
   +'#rwBoard .bd-k i{flex:1;height:1px;background:linear-gradient(90deg,rgba(232,186,108,.5),transparent)}'
   +'#rwBoard .bd-r{display:block;position:relative;width:100%;box-sizing:border-box;text-align:left;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.045);color:#F2EFE6;border-radius:16px;padding:11px;margin:0 0 9px;font:inherit;text-decoration:none;cursor:pointer;overflow:hidden;transition:transform .18s,background .18s,border-color .18s,box-shadow .18s;animation:bdRise .5s ease both}'
   +'#rwBoard .bd-r::before{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,224,174,.14) 50%,transparent 65%);transform:translateX(-120%);pointer-events:none}'
   +'#rwBoard .bd-r:hover{background:rgba(232,186,108,.1);border-color:rgba(232,186,108,.5);transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.35)}'
   +'#rwBoard .bd-r:hover::before{transform:translateX(120%);transition:transform .8s ease}'
   +'#rwBoard .bd-top{display:flex;align-items:center;gap:11px}'
   +'#rwBoard .bd-av{flex:none;position:relative;width:46px;height:46px;border-radius:50%;padding:2.5px;background:conic-gradient(var(--tc,#E8BA6C),rgba(255,255,255,.12),var(--tc,#E8BA6C));animation:bdSpin 9s linear infinite}'
   +'#rwBoard .bd-av>span{display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;background:#171020;color:var(--tc,#E8BA6C);font:800 18px Georgia,serif;animation:bdSpin 9s linear infinite reverse}'
   +'#rwBoard .bd-av.ph>span{background-size:cover;background-position:center}'
   +'#rwBoard .bd-w{min-width:0;flex:1}'
   +'#rwBoard .bd-n{display:flex;align-items:center;gap:6px;font:700 14px/1.25 system-ui,sans-serif}#rwBoard .bd-n em{font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}'
   +'#rwBoard .bd-s{display:block;margin-top:2px;font-size:11.5px;line-height:1.35;color:#cfc8bb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
   +'#rwBoard .bd-t{flex:none;display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;font:800 9.5px system-ui;letter-spacing:.05em;text-transform:uppercase;color:var(--tc,#E8BA6C);border:1px solid var(--tc,#E8BA6C);background:rgba(0,0,0,.25)}'
   +'#rwBoard .bd-ig{color:#ff9aa8;font-weight:700}'
   +'#rwBoard .bd-ch{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 0}'
   +'#rwBoard .bd-ch span{text-transform:capitalize;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:700;color:#e9dcc2;background:rgba(232,186,108,.13);border:1px solid rgba(232,186,108,.25)}'
   +'#rwBoard .bd-lk{display:flex;align-items:center;gap:10px;margin-top:10px;padding-top:9px;border-top:1px dashed rgba(232,186,108,.3)}'
   +'#rwBoard .bd-ln{flex:1;min-width:0;font-size:11.5px;line-height:1.35;color:#cfc8bb}#rwBoard .bd-ln b{display:block;color:#FFE0AE;font:800 12.5px system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
   +'#rwBoard .bd-ln small{display:block;font:800 9px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#E8BA6C;margin-bottom:2px}#rwBoard .bd-ln.mute{color:#9a958a;font-style:italic}'
   +'#rwBoard .bd-ring{flex:none;position:relative;width:44px;height:44px}#rwBoard .bd-ring svg{width:44px;height:44px;transform:rotate(-90deg)}'
   +'#rwBoard .bd-ring circle{fill:none;stroke-width:4.5;stroke-linecap:round}#rwBoard .bd-ring .a{stroke:rgba(255,255,255,.12)}'
   +'#rwBoard .bd-ring .b{stroke:var(--rc,#6ee7c4);stroke-dasharray:var(--len) 125.7;animation:bdFill 1.1s cubic-bezier(.2,.8,.2,1) both}'
   +'#rwBoard .bd-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 12.5px system-ui;color:#F2EFE6}'
   +'#rwBoard .bd-m{display:inline-block;margin-top:7px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:800;color:#07090f;background:linear-gradient(95deg,#E8BA6C,#ffd98e)}'
   +'#rwBoard .bd-m.g{background:linear-gradient(95deg,#16bf96,#6ee7c4)}'
   +'#rwBoard .bd-want{display:block;margin-top:7px;font-size:11.5px;line-height:1.4;color:#ffd98e}'
   +'#rwBoard .bd-ex{border-style:dashed;border-color:rgba(232,186,108,.45)}#rwBoard .bd-exl{display:inline-block;margin:0 0 8px 2px;padding:2px 8px;border-radius:999px;font:800 9.5px system-ui;letter-spacing:.12em;text-transform:uppercase;color:#0B1020;background:#E8BA6C}'
   +'#rwBoard .bd-lad{display:flex;gap:4px;margin:2px 0 10px}#rwBoard .bd-lad span{flex:1;text-align:center;padding:5px 0 4px;border-radius:9px;background:rgba(255,255,255,.05);font:800 9px system-ui;letter-spacing:.04em;color:var(--tc);border-bottom:2px solid var(--tc)}#rwBoard .bd-lad span i{display:block;font-style:normal;font-size:14px;line-height:1.2}'
   +'#rwBoard .bd-cta{display:block;text-align:center;margin-top:4px;padding:10px;border-radius:13px;font:800 12.5px system-ui,sans-serif;text-decoration:none;color:#0B1020;background:linear-gradient(95deg,#C8913E,#E8BA6C,#ffd98e);background-size:200% 100%;transition:background-position .4s,transform .15s}#rwBoard .bd-cta:hover{background-position:100% 0;transform:translateY(-1px)}'
   +'#rwBoard .bd-e{font-size:12px;line-height:1.45;color:#d8d5ce;margin:2px 2px 8px}'
   +'#rwBoard .bd-note{margin:9px 4px 0;font-size:11.5px;line-height:1.5;color:#cfc8bb}'
   +'@keyframes bdRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes bdSpin{to{transform:rotate(360deg)}}@keyframes bdDash{to{background-position:7px 0}}@keyframes bdFill{from{stroke-dasharray:0 125.7}}'
   +'@media (prefers-reduced-motion:reduce){#rwBoard *{animation:none!important;transition:none!important}}';
  var TIERS={mirage:{n:'Mirage',i:'🌫️',c:'#9aa0ab'},basecamp:{n:'Base Camp',i:'⛺',c:'#c9a06a'},trail:{n:'Trail',i:'🥾',c:'#6ee7c4'},ridge:{n:'Ridge',i:'🏔️',c:'#9ad0ff'},summit:{n:'Summit',i:'🚩',c:'#ffd98e'}};
  var NEEDS={p_milan_heights:['Food']};
  var IG=/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._\/-]{1,80}\/?(\?[^\s<>"']{0,60})?$/i;
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function handleOf(u){ var m=/instagram\.com\/([A-Za-z0-9._-]+)/i.exec(u||''); return m?'@'+m[1]:'Instagram'; }
  function ring(score,good){
    var len=(score/100*125.7).toFixed(1);
    return '<span class="bd-ring" style="--len:'+len+';--rc:'+(good?'#6ee7c4':'#E8BA6C')+'"><svg viewBox="0 0 48 48"><circle class="a" cx="24" cy="24" r="20"/><circle class="b" cx="24" cy="24" r="20"/></svg><b>'+score+'</b></span>';
  }
  function chips(c){
    var t=String(c.niche||'').split(/[,\/&]| and /i).map(function(x){return x.trim();}).filter(function(x){ return x&&!/^(all|any|everything|other)$/i.test(x); }).slice(0,3);
    return t.length?'<div class="bd-ch">'+t.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>':'';
  }
  function creatorRow(c,i){
    if(!c||!c.name) return '';
    var m=c.match||{}, ok=IG.test(String(c.handle||'')), score=Math.max(0,Math.min(100,Math.round(Number(m.score)||0))), T=TIERS[c.tier];
    var photo=/^https:\/\/[^\s"'<>()]{4,300}$/.test(String(c.photoUrl||''))?c.photoUrl:'';
    var av='<span class="bd-av'+(photo?' ph':'')+'"><span'+(photo?' style="background-image:url(&quot;'+esc(photo)+'&quot;)"':'')+'>'+(photo?'':esc(String(c.name).trim().charAt(0).toUpperCase()))+'</span></span>';
    var inner='<span class="bd-top">'+av+'<span class="bd-w"><span class="bd-n"><em>'+esc(c.name)+'</em>'+(T?'<span class="bd-t">'+T.i+' '+T.n+'</span>':'')+'</span>'
      +'<span class="bd-s">'+(ok?'<span class="bd-ig">'+esc(handleOf(c.handle))+'</span>':'')+(c.town?(ok?' · ':'')+esc(c.town):'')+'</span></span></span>'+chips(c)
      +(m.name&&score>=40?'<span class="bd-lk"><span class="bd-ln"><small>Best match</small><b>'+esc(m.name)+'</b>'+(m.verdict==='send'||score>=75?'Strong fit for this stay':'Good fit for this stay')+'</span>'+ring(score,score>=75)+'</span>':'<span class="bd-lk"><span class="bd-ln mute">Finding the right stay for this creator</span></span>');
    var st='style="'+(T?'--tc:'+T.c+';':'')+'animation-delay:'+((i||0)*.08)+'s"';
    return ok?'<a class="bd-r" '+st+' href="'+esc(c.handle)+'" target="_blank" rel="noopener noreferrer">'+inner+'</a>':'<div class="bd-r" '+st+' style="cursor:default;'+(T?'--tc:'+T.c+';':'')+'">'+inner+'</div>';
  }
  function example(){
    return '<div class="bd-r bd-ex" style="cursor:default;--tc:#6ee7c4"><span class="bd-exl">Example match</span><span class="bd-top"><span class="bd-av"><span>A</span></span><span class="bd-w"><span class="bd-n"><em>Food vlogger, Delhi</em><span class="bd-t">🥾 Trail</span></span><span class="bd-s">Verified reach · 6% engagement</span></span></span>'
      +'<div class="bd-ch"><span>Food</span><span>Travel</span></div><span class="bd-lk"><span class="bd-ln"><small>Best match</small><b>Milan Heights</b>Wants food vloggers</span>'+ring(92,true)+'</span></div>'
      +'<div class="bd-lad">'+['mirage','basecamp','trail','ridge','summit'].map(function(k){ var t=TIERS[k]; return '<span style="--tc:'+t.c+'"><i>'+t.i+'</i>'+t.n+'</span>'; }).join('')+'</div>'
      +'<div class="bd-e">Every creator gets a RoamWise rating from real numbers, not follower counts alone.</div>';
  }
  /* Only stays that have agreed to host creators. Defaults mirror the founder's current list (creators/property-terms-core.mjs
     SEED_POLICIES); config/creatorPolicies, when present, overrides by propertyId (public read, admin write). */
  var OPEN={p_milan_heights:true,p_big_bro_hotel:true};
  function stays(){
    var list=[]; try{ list=rwListingAll(); }catch(e){}
    list=list.filter(function(x){ return OPEN[x.id]===true; }).slice().sort(function(a,b){ return (((b.nomad&&b.nomad.enabled)?2:0)+((b.photos||[]).length?1:0))-(((a.nomad&&a.nomad.enabled)?2:0)+((a.photos||[]).length?1:0)); }).slice(0,4);
    return list.map(function(x,i){
      var nd=NEEDS[x.id]; try{ var pl=OPEN.__needs&&OPEN.__needs[x.id]; if(pl&&pl.length) nd=pl; }catch(e){}
      var img=(x.photos&&x.photos[0]&&/^https:\/\//.test(x.photos[0]))?x.photos[0]:'';
      return '<button type="button" class="bd-r" style="animation-delay:'+(i*.08)+'s" onclick="try{rwListOpen(\''+esc(String(x.id).replace(/'/g,''))+'\')}catch(e){}"><span class="bd-top">'
        +'<span class="bd-av'+(img?' ph':'')+'"><span'+(img?' style="background-image:url(&quot;'+esc(img)+'&quot;)"':'')+'>'+(img?'':'&#127968;')+'</span></span>'
        +'<span class="bd-w"><span class="bd-n"><em>'+esc(x.name)+'</em></span><span class="bd-s">'+esc((x.area||'')+(x.area&&x.zone?' · ':'')+(x.zone||''))+'</span></span></span>'
        +(nd?'<span class="bd-want">Looking for: '+nd.map(esc).join(', ')+' creators</span>':'')
        +'<span class="bd-m g">'+((x.nomad&&x.nomad.enabled)?'Checked · work stay':'RoamWise Checked')+'</span></button>';
    }).join('');
  }
  function render(host,creators){
    var left=creators.map(creatorRow).join('');
    if(!left) left=example();
    left+='<a class="bd-cta" href="creators/match.html?role=creator&invite=founding">Register as creator</a>';
    var right=(stays()||'<div class="bd-e">Stays that welcome creators will appear here.</div>')+'<a class="bd-cta" href="creators/match.html?role=property">Hosts: find creators</a>';
    host.innerHTML='<div class="bd-h"><b>Creators &times; Stays</b><span>Matched by RoamWise</span></div><div class="bd-g">'
      +'<div class="bd-c"><div class="bd-k">Top creators<i></i></div>'+left+'</div><div class="bd-c"><div class="bd-k">Top stays<i></i></div>'+right+'</div></div>'
      +'<div class="bd-note">Property owners have the final say on every stay. Creator stays are mostly on weekdays and in the off-season, unless the creator brings paying guests.</div>';
  }
  function mount(){
    if(document.getElementById('rwBoard')) return true;
    var anchor=document.getElementById('quickGrid'); if(!anchor||!anchor.parentNode||typeof rwListingAll!=='function'||!window.RW_PARTNERS) return false;
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    var host=document.createElement('section'); host.id='rwBoard'; host.className='v v-home'; host.setAttribute('aria-label','Top creators and stays');
    anchor.parentNode.insertBefore(host,anchor); render(host,[]);
    try{ if(typeof db!=='undefined'&&db) db.collection('config').doc('creatorPolicies').get().then(function(s){ var l=s.exists&&s.data()&&Array.isArray(s.data().list)?s.data().list:[]; l.forEach(function(p){ if(p&&p.propertyId){ OPEN[p.propertyId]=(p.status==='open'); if(p.needs&&Array.isArray(p.needs.niches)){ OPEN.__needs=OPEN.__needs||{}; OPEN.__needs[p.propertyId]=p.needs.niches.slice(0,3).map(function(n){ return String(n).charAt(0).toUpperCase()+String(n).slice(1); }); } } }); render(host,host.__c||[]); }).catch(function(){}); }catch(e){}
    try{ if(typeof db!=='undefined'&&db) db.collection('config').doc('creatorSpotlight').get().then(function(s){ var l=s.exists&&s.data()&&Array.isArray(s.data().list)?s.data().list.slice(0,12):[]; host.__c=l; render(host,l); }).catch(function(){}); }catch(e){}
    return true;
  }
  window.rwCreatorBoard={creatorRow:creatorRow,show:function(l){ var h=document.getElementById('rwBoard'); if(h){ h.__c=l; render(h,l); } }};
  var tries=0; (function wait(){ if(mount()||++tries>40) return; setTimeout(wait,400); })();
})();
