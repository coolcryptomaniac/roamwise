// @ts-nocheck
/* js/ui/stay-deeplink.js - opens a stay's detail sheet from /?stay=<id> (used by the crawlable /stays/almora/ page).
   Only ids shaped like p_xxx are accepted, and only if the stay is in the public list. Retries for up to 10 s while the app starts. */
(function(){
  var id;try{id=new URLSearchParams(location.search).get('stay')||'';}catch(_){return;}
  if(!/^p_[a-z0-9_]{2,60}$/.test(id))return;
  var tries=0,t=setInterval(function(){
    tries++;
    try{
      var list=typeof window.rwListingAll==='function'?window.rwListingAll():null;
      if(typeof window.rwListOpen==='function'&&list&&[].some.call(list,function(p){return p&&p.id===id;})){clearInterval(t);window.rwListOpen(id);}
    }catch(_){}
    if(tries>40)clearInterval(t);
  },250);
})();
