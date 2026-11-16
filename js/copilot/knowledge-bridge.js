// @ts-nocheck
/* Small public reviewed-guide bridge. The atlas still resolves tens of
   thousands of place names; only signed-off editorial URLs enter this index.
   Never send private bookings to this API or turn a draft into a citation. */
(function(root){
 'use strict';
 var records=[];
 var esc=function(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
 var norm=function(s){return String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();};
 function load(){
  try{
   if(typeof fetch!=='function')return;
   fetch('/places/data/assistant-index.json',{credentials:'omit',cache:'default'})
    .then(function(r){return r.ok?r.json():null;})
    .then(function(d){if(d&&d.version===1&&Array.isArray(d.records))records=d.records.filter(function(x){
       return typeof x.name==='string'&&typeof x.url==='string'&&/^\/(?:guides\/[a-z0-9-]+\.html|places\/[a-z0-9-]+\/)$/.test(x.url);
     }).slice(0,250);}).catch(function(){});
  }catch(e){}
 }
 function search(raw,intents){
  var t=String(raw||'');var it=intents||{};
  if(t.length>190||!/(?:\b(?:what to see|things to do|places to visit|travel guide|guide to|attractions in|explore|sightseeing|itinerary ideas)\b|घूमने की जगह|क्या देखें)/i.test(t))return null;
  if(/\b(?:book|payment|refund|price|flight|visa|status|ticket|reservation|my account|password|emergency)\b/i.test(t))return null;
  var place=norm(it.dest||''),text=norm(t);
  var found=records.filter(function(r){
    var names=[r.name].concat(r.aliases||[]).map(norm).filter(function(n){return n.length>=4;});
    return names.some(function(n){return (place&&n===place)||(' '+text+' ').indexOf(' '+n+' ')>=0;});
  }).slice(0,2);
  return found.length?found:null;
 }
 function reply(bubble,intents,raw){
  var found=search(raw,intents);
  if(!found)return false;
  var out='<section class="tk-card"><div class="tk-head"><div class="tk-place">📚 RoamWise reviewed travel knowledge</div></div><div class="tk-sec">'
   +'<p>Here are source-backed destination guides relevant to your question. They help you choose places and routes, but do not confirm current opening times or prices.</p>';
  found.forEach(function(r){
   out+='<p><strong>'+esc(r.name)+' · '+esc(r.region||'')+'</strong> — '+esc(r.summary||'')
      +'<br><a href="'+esc(r.url)+'" target="_blank" rel="noopener">Read original researched guide ↗</a>'
      +(r.checkedAt?' <small>· Last checked '+esc(r.checkedAt)+'</small>':'')+'</p>';
  });
  out+='<a href="/places/" target="_blank" rel="noopener">Browse the destination library ↗</a></div></section>';
  intents._noGenericActions=true;intents._reviewedGuide=true;
  cpFinish(bubble,out,intents,raw);
  return true;
 }
 root.RWKnowledgeBridge={load:load,reply:reply,search:search,records:function(){return records.slice();}};
 if(typeof document!=='undefined'){
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);
   else load();
 }
 // Links from an SEO guide are one click. Only public, short, user-visible
 // prompts are accepted; URL parameters never authorize payments or bookings.
 function inbound(){
  try{
   var u=new URL(root.location.href),q=u.searchParams.get('tusk');
   if(!q||q.length>160||/[\r\n<>]/.test(q)||/\b(password|refund|api key|otp|payment)\b/i.test(q))return;
   var input=document.getElementById('heroInput');
   if(!input||typeof copilotSend!=='function')return;
   u.searchParams.delete('tusk');
   if(root.history&&root.history.replaceState)root.history.replaceState(null,'',u.pathname+u.search+u.hash);
   input.value=q;
   try{if(typeof cpFocusHero==='function')cpFocusHero();}catch(e){}
   copilotSend(true);
  }catch(e){}
 }
 if(typeof root.addEventListener==='function')root.addEventListener('load',function(){setTimeout(inbound,400);});
})(window);
