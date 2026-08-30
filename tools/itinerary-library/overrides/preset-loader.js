/* RoamWise Preset Library Loader v1.1.0
   Cached fallback only: return null when the request contains specific planning constraints.
*/
(()=>{
  const ROOT=(document.currentScript?.src||'').replace(/preset-loader\.js(?:\?.*)?$/,'');
  let manifestPromise;
  const norm=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  async function manifest(){return manifestPromise||(manifestPromise=fetch(ROOT+'manifest.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('preset manifest '+r.status);return r.json()}));}
  function specific(o={}){
    const style=norm(o.style), crowd=norm(o.crowd), month=norm(o.month), budget=String(o.budgetExact||o.exactBudget||'').trim();
    const tags=Array.isArray(o.tags)?o.tags.filter(Boolean):[];
    const mobility=norm(o.accessibility||o.mobility), hotel=norm(o.hotel||o.fixedHotel), transport=norm(o.transportRestriction);
    return !!(month||budget||mobility||hotel||transport||tags.length|| (crowd&& !['any','normal','default'].includes(crowd)) || (style&& !['','balanced','classic','default'].includes(style)));
  }
  function score(d,q){const n=norm(q); if(!n)return 0; let s=0; if(norm(d.name)===n)s+=100; if(norm(d.slug)===n)s+=100; if(norm(d.name).includes(n)||n.includes(norm(d.name)))s+=55; for(const a of d.aliases||[]){const x=norm(a);if(x===n)s+=90;else if(x.includes(n)||n.includes(x))s+=45;} if(norm(d.region).includes(n))s+=20; return s;}
  function nearestVariant(d,days){const entries=Object.entries(d.variants); if(!days)return d.variants.signature?['signature',d.variants.signature]:entries[0]; let best=entries[0],gap=Infinity; for(const e of entries){const g=Math.abs(Number(e[1].days)-Number(days));if(g<gap || (g===gap && Number(e[1].days)>=Number(days))){gap=g;best=e}}return best;}
  async function find(o={}){
    if(!o.forcePreset && specific(o))return null;
    const m=await manifest(), ranked=m.destinations.map(d=>[score(d,o.destination||o.query),d]).sort((a,b)=>b[0]-a[0]);
    if(!ranked.length||ranked[0][0]<20)return null;
    const d=ranked[0][1], [variant,v]=nearestVariant(d,o.duration||o.days);
    return {...d,variant,days:v.days,html:ROOT+v.html,pdf:ROOT+v.pdf,matchScore:ranked[0][0]};
  }
  function namedUrl(url,o={}){const u=new URL(url,location.href);const n=String(o.user||o.username||o.traveler||'').trim();if(n)u.searchParams.set('user',n.slice(0,64));if(o.theme)u.searchParams.set('theme',o.theme);if(o.share)u.searchParams.set('share','1');return u.href;} function renderInto(target,hit,o={}){const el=typeof target==='string'?document.querySelector(target):target;if(!el||!hit)return false;el.innerHTML='';const f=document.createElement('iframe');f.src=namedUrl(hit.html,o);f.title=hit.name+' itinerary';f.loading='eager';f.style.cssText='width:100%;min-height:86vh;border:0;border-radius:18px;background:#050507';f.setAttribute('allow','fullscreen');el.appendChild(f);return true;} function shareUrl(hit,user,theme){return namedUrl(hit.html,{user,theme,share:true})}
  async function tryRender(target,o){const h=await find(o);if(!h)return null;renderInto(target,h,o);return h;}
  window.RW_PRESETS={manifest,find,specific,renderInto,tryRender,shareUrl,namedUrl,root:ROOT};
})();