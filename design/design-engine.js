/* RoamWise Design Engine. Validated catalogue → bounded CSS tokens + shared behaviour.
   Code/templates stay versioned in Git; the catalogue is backed up in RW_KV. */
(function(){
  'use strict';
  var schema=window.RWDesignSchema,seed=window.RWDesignSeed;
  if(!schema||!schema.validate(seed))return;
  var data=seed,source='bundled',KEY='rw_design_catalogue_v1',MOTION='rw_design_motion';
  var media=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  var motion='auto';try{motion=localStorage.getItem(MOTION)==='off'?'off':'auto';}catch(e){}
  function enabled(){return motion!=='off'&&!(media&&media.matches)&&!document.hidden;}
  function motionState(){document.documentElement.setAttribute('data-rw-motion',enabled()?'on':'off');}
  function apply(next,from){
    if(!schema.validate(next))return false;
    data=JSON.parse(JSON.stringify(next));source=from||'bundled';
    var style=document.documentElement.style;
    Object.keys(data.cards).forEach(function(id){
      var card=data.cards[id],border=data.borders[card.border],prefix='--rwde-'+id+'-';
      style.setProperty(prefix+'colors',border.colors.map(function(k){return data.colors[k];}).join(','));
      style.setProperty(prefix+'surface',data.colors[card.surface]);
      style.setProperty(prefix+'width',border.width+'px');style.setProperty(prefix+'radius',card.radius+'px');style.setProperty(prefix+'duration',border.duration+'s');
    });
    style.setProperty('--rwde-gap',data.carousel.gap+'px');style.setProperty('--rwde-card-width',data.carousel.cardWidth+'px');
    style.setProperty('--rwde-snap',data.carousel.snap);style.setProperty('--rwde-lift',-data.animations.hover.distance+'px');
    style.setProperty('--rwde-hover-duration',data.animations.hover.duration+'ms');
    style.setProperty('--rwde-sheen-duration',data.animations.credit.duration+'s');
    document.documentElement.setAttribute('data-rw-engine',data.version);
    document.documentElement.setAttribute('data-rw-border-animation',String(data.animations.border.enabled));
    motionState();document.dispatchEvent(new CustomEvent('rw:design-catalogue',{detail:{version:data.version,source:source}}));return true;
  }
  function setMotion(value){motion=value==='off'?'off':'auto';try{localStorage.setItem(MOTION,motion);}catch(e){}motionState();}
  function moveCredit(){
    var credit=document.getElementById('rwCreditCard'),hero=document.getElementById('copilotHero'),quick=document.getElementById('rwQuick');
    if(!hero||!hero.parentNode)return;
    if(quick&&hero.nextElementSibling!==quick)hero.parentNode.insertBefore(quick,hero.nextSibling);
    var anchor=quick||hero;
    if(credit&&anchor.nextElementSibling!==credit)anchor.parentNode.insertBefore(credit,anchor.nextSibling);
  }
  function observe(){
    if(!window.IntersectionObserver)return;
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(e){e.target.setAttribute('data-rw-visible',e.isIntersecting?'true':'false');});},{rootMargin:'60px'});
    function scan(root){root.querySelectorAll('.copilot-compose,.rw-sales-card,.rw-world-card,.rw-credit-feature,.rw-credit-plastic,.pack,.tile.cash,.tile.coin,.rw-design-composer,.rw-design-travel').forEach(function(el){if(el.hasAttribute('data-rw-visible'))return;el.setAttribute('data-rw-visible','false');observer.observe(el);});}
    scan(document);
    var queued=false;new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;scan(document);});}).observe(document.body,{childList:true,subtree:true});
  }
  function settings(){
    var host=document.getElementById('rw-design-vault');if(!host||host.querySelector('.rw-design-motion'))return;
    var label=document.createElement('label');label.className='rw-design-motion';
    var box=document.createElement('input');box.type='checkbox';box.checked=motion!=='off';
    box.addEventListener('change',function(){setMotion(box.checked?'auto':'off');});
    label.appendChild(box);label.appendChild(document.createTextNode(' Animate borders and carousels'));host.appendChild(label);
    var note=document.createElement('p');note.textContent='Always respects your device’s reduced-motion setting.';host.appendChild(note);
    var link=document.createElement('a');link.href='/design/';link.textContent='Explore RoamWise design collection';host.appendChild(link);
  }
  async function refresh(){
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},3500);
    try{
      var response=await fetch('https://roamwise-api.founder-f53.workers.dev/design/catalogue',{signal:controller.signal,credentials:'omit',cache:'no-cache'});
      if(!response.ok)return;
      var result=await response.json();
      if(result.catalogue&&result.catalogue.version===seed.version&&apply(result.catalogue,result.storage==='kv'?'database':'bundled')){
        try{localStorage.setItem(KEY,JSON.stringify({savedAt:Date.now(),catalogue:data}));}catch(e){}
      }
    }catch(e){/* The reviewed offline design remains active. */}finally{clearTimeout(timer);}
  }
  window.RWDesignEngine={get:function(){return JSON.parse(JSON.stringify(data));},source:function(){return source;},motionEnabled:enabled,setMotion:setMotion,mountSettings:settings};
  apply(seed,'bundled');
  try{var cached=JSON.parse(localStorage.getItem(KEY)||'null');if(cached&&cached.catalogue.version===seed.version&&Date.now()-cached.savedAt<21600000)apply(cached.catalogue,'cached');}catch(e){}
  document.addEventListener('visibilitychange',motionState);
  if(media&&media.addEventListener)media.addEventListener('change',motionState);
  document.addEventListener('rw:design-changed',moveCredit);
  function ready(){moveCredit();observe();refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
