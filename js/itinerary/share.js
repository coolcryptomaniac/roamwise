// @ts-nocheck
/* share.js — Share / virality: the generic multi-platform share sheet (rwShareSheet,
   rwCloseShare, rwShareGo), rwShareTrip() for sharing the current itinerary, and the
   app-referral share helpers (doShare, shareApp, shareTrek). Moved verbatim from
   app.js as part of Phase 5a modularization; zero logic changes. */

function rwShareSheet(text, url, whatLabel){
  var enc=encodeURIComponent, T=enc(text);
  /* Each channel gets its own utm_source so shares can be counted by channel (rwShareLink in js/pricing/referral.js). */
  function tag(ch){ return (typeof rwShareLink==='function') ? rwShareLink(url, ch) : url; }
  var links=[
    {id:'whatsapp', label:'WhatsApp', emoji:'\ud83d\udcac', href:'https://wa.me/?text='+enc(text+' '+tag('whatsapp'))},
    {id:'telegram', label:'Telegram', emoji:'\u2708\ufe0f', href:'https://t.me/share/url?url='+enc(tag('telegram'))+'&text='+T},
    {id:'x', label:'X', emoji:'\u2715', href:'https://twitter.com/intent/tweet?text='+T+'&url='+enc(tag('x'))},
    {id:'facebook', label:'Facebook', emoji:'\ud83d\udcd8', href:'https://www.facebook.com/sharer/sharer.php?u='+enc(tag('facebook'))+'&quote='+T},
    {id:'reddit', label:'Reddit', emoji:'\ud83d\udc7d', href:'https://www.reddit.com/submit?url='+enc(tag('reddit'))+'&title='+T},
    {id:'copy', label:'Copy link', emoji:'\ud83d\udd17', href:'#copy'},
    {id:'insta', label:'Instagram', emoji:'\ud83d\udcf7', href:'#insta'},
    {id:'more', label:'More apps', emoji:'\u2026', href:'#native'}
  ];
  var grid=links.map(function(l){
    return '<button class="share-cell" onclick="rwShareGo(\''+l.id+'\',\''+l.href.replace(/'/g,"%27")+'\')">'
      +'<span class="share-emoji">'+l.emoji+'</span><span>'+l.label+'</span></button>';
  }).join('');
  window._rwShareCtx={text:text,url:url};
  var html='<div class="share-modal-inner"><div class="share-head">Share your '+(whatLabel||'trip')+'</div>'
    +'<div class="share-grid">'+grid+'</div>'
    +'<button class="tact" style="width:100%;margin-top:6px" onclick="rwCloseShare()">Close</button></div>';
  var ov=el('rwShareOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='rwShareOverlay'; ov.className='share-overlay'; ov.onclick=function(e){ if(e.target===ov) rwCloseShare(); }; document.body.appendChild(ov); }
  ov.innerHTML=html; ov.style.display='flex';
}
function rwCloseShare(){ var ov=el('rwShareOverlay'); if(ov) ov.style.display='none'; }
function rwShareTrip(){
  var nm=(window._lastItin&&_lastItin.name)||'trip';
  /* If the itinerary on screen came from the ready-made preset library,
     share the actual cached page (named for the sharer) instead of the
     generic homepage link \u2014 RW_PRESETS.shareUrl() adds share=1 and shows
     "Made by RoamWise for <name>" on the shared page. */
  if(window._lastItin && _lastItin.preset && _lastItin.hit && typeof RW_PRESETS!=='undefined' && RW_PRESETS.shareUrl){
    var who = (typeof user!=='undefined' && user && (user.displayName || (user.email||'').split('@')[0])) || lsGet('rw_name') || '';
    var theme = (_lastItin.hit && _lastItin.hit.theme) || undefined;
    var url = RW_PRESETS.shareUrl(_lastItin.hit, who, theme);
    rwShareSheet('Check out my '+nm+' plan on RoamWise \u2708\ufe0f', url, 'trip plan');
    return;
  }
  rwShareSheet('Check out my '+nm+' plan on RoamWise \u2708\ufe0f','https://roamwise.co.in','trip plan');
}
function rwShareGo(id, href){
  var ctx=window._rwShareCtx||{text:'',url:''};
  var tagged=function(ch){ return (typeof rwShareLink==='function') ? rwShareLink(ctx.url, ch) : ctx.url; };
  if(id==='copy'){ try{ navigator.clipboard.writeText(ctx.text+' '+tagged('copy')); showToast('Link copied \u2713'); }catch(e){ /* clipboard best-effort, ignore */ }; return; }
  if(id==='insta'){
    try{ navigator.clipboard.writeText(ctx.text+' '+tagged('instagram')); }catch(e){ /* clipboard best-effort, ignore */ }
    showToast('Caption copied \u2014 opening Instagram to paste \ud83d\udcf7');
    try{ window.open('https://www.instagram.com/','_blank','noopener'); }catch(e){ /* best-effort, ignore */ }
    return;
  }
  if(id==='more'){
    if(navigator.share){ navigator.share({text:ctx.text, url:tagged('native')}).then(function(){ try{xpAdd(15,'Shared a trip');}catch(e){ /* best-effort, ignore */ } }).catch(function(){}); }
    else { try{ navigator.clipboard.writeText(ctx.text+' '+tagged('native')); showToast('Copied \u2014 paste anywhere'); }catch(e){ /* clipboard best-effort, ignore */ } }
    return;
  }
  try{ window.open(decodeURIComponent(href.replace(/%27/g,"'")),'_blank','noopener'); try{xpAdd(10,'Shared a trip');}catch(e){ /* best-effort, ignore */ } }catch(e){ /* best-effort, ignore */ }
  rwCloseShare();
}

/* ===== SHARE / VIRALITY ===== */
var APP_URL_SHARE='https://www.roamwise.co.in';
function doShare(txt){
  var tag=function(ch){ return (typeof rwShareLink==='function') ? rwShareLink(APP_URL_SHARE, ch) : APP_URL_SHARE; };
  if(navigator.share){ navigator.share({title:'RoamWise Pro',text:txt,url:tag('native')}).then(function(){xpAdd(15,'Shared \u2014 spreading the word');}).catch(function(){}); }
  else{ window.open('https://wa.me/?text='+encodeURIComponent(txt+' '+tag('whatsapp')),'_blank','noopener'); xpAdd(15,'Shared \u2014 spreading the word'); }
}
function shareApp(what){
  var m={app:'\ud83e\udd77 Found a travel app that shows the LEAST crowded month for any place on Earth + ninja hacks. Free to start, with a founder Pro offer while it lasts.',
    treks:'\u26f0\ufe0f This app has a Trek Vault \u2014 popular, hidden, dangerous & newly-opened treks with itineraries. Check it:',
    exps:'\u2728 Offbeat experiences list on this travel app is insane \u2014 bioluminescent kayaking, snow-leopard tracking...'};
  doShare(m[what]||m.app);
}
function shareTrek(i){ var t=TREKS[i]; doShare('\u26f0\ufe0f '+t.n+' ('+t.w+') \u2014 '+t.d+' days, '+t.alt+'m. Full itinerary on RoamWise:'); }

