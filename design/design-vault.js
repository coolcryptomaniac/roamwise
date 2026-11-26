/* RoamWise Design Vault — versioned, opt-in visual skins, independent of data and checkout.
   Every edition retains the same routes, inventory and payment logic. */
(function(){
  'use strict';
  var KEY='rw_design_edition';
  var editions=[
    {id:'himalayan-saanjh',name:'Himalayan Saanjh',desc:'Latest · calm AI-first layout with all bookable collections'},
    {id:'kasar-cloud',name:'Kasar Cloud',desc:'Legacy 2 · compact Ailon-first edition'},
    {id:'buransh-bazaar',name:'Buransh Bazaar',desc:'Legacy 1 · classic commerce-forward edition'}
  ];
  if(window.RWDesignEngine)editions=window.RWDesignEngine.get().editions;
  function valid(id){return editions.some(function(x){return x.id===id;});}
  function current(){
    try{var stored=localStorage.getItem(KEY);if(valid(stored))return stored;}catch(e){}
    return 'himalayan-saanjh';
  }
  function apply(id){
    if(!valid(id))return false;
    document.documentElement.setAttribute('data-rw-design',id);
    if(document.body){document.body.setAttribute('data-rw-design',id);}
    // Only reorder existing DOM nodes. Never copy, destroy, or reinitialize checkout cards.
    var sales=document.getElementById('rwSalesCarousels');
    var desk=document.getElementById('rwTuskDesk');
    var quick=document.getElementById('rwQuick');
    if(sales&&desk&&quick&&sales.parentNode){
      if(id==='himalayan-saanjh')sales.parentNode.insertBefore(sales,desk);
      else quick.parentNode.insertBefore(sales,quick.nextSibling);
    }
    var credit=document.getElementById('rwCreditCard'),hero=document.getElementById('copilotHero');
    if(hero&&hero.parentNode){
      if(quick)hero.parentNode.insertBefore(quick,hero.nextSibling);
      var anchor=quick||hero;if(credit)anchor.parentNode.insertBefore(credit,anchor.nextSibling);
    }
    return true;
  }
  function choose(id){
    if(!valid(id))return;
    try{localStorage.setItem(KEY,id);}catch(e){}
    apply(id);mountSettings();
    try{if(typeof showToast==='function')showToast('Design: '+editions.filter(function(x){return x.id===id;})[0].name);}catch(e){}
    document.dispatchEvent(new CustomEvent('rw:design-changed',{detail:{edition:id}}));
  }
  function mountSettings(){
    var host=document.querySelector('#settingsOverlay .modal-body');
    if(!host)return;
    var area=document.getElementById('rw-design-vault');
    if(!area){
      area=document.createElement('section');area.id='rw-design-vault';
      area.setAttribute('aria-label','Design editions');
      host.insertBefore(area,host.firstChild);
    }
    while(area.firstChild)area.removeChild(area.firstChild);
    var title=document.createElement('h3');title.textContent='🏔 Design editions';area.appendChild(title);
    var note=document.createElement('p');note.textContent='Switch freely. Your trips, wallet, bookings and shop stay unchanged.';area.appendChild(note);
    var choices=document.createElement('div');choices.className='rw-vault-choices';area.appendChild(choices);
    var moods=[['default','Original'],['rave','Raveverse · KAAL & AGNI'],['odyssey','Ailon Odyssey'],['aipan','Kumaoni Aipan']];
    var moodTitle=document.createElement('h3');moodTitle.textContent='Visual atmosphere';area.appendChild(moodTitle);
    var mood=document.createElement('select');mood.setAttribute('aria-label','Visual atmosphere');moods.forEach(function(m){var o=document.createElement('option');o.value=m[0];o.textContent=m[1];mood.appendChild(o);});mood.value=document.documentElement.getAttribute('data-rw-mood')||'default';mood.addEventListener('change',function(){applyMood(mood.value);try{localStorage.setItem('rw_visual_mood',mood.value);}catch(e){}});area.appendChild(mood);
    editions.forEach(function(e){
      var button=document.createElement('button');button.type='button';
      button.setAttribute('aria-pressed',String(current()===e.id));
      button.dataset.edition=e.id;
      var label=document.createElement('span');label.className='rw-vault-label';
      var strong=document.createElement('strong');strong.textContent=e.name;
      var small=document.createElement('small');small.textContent=e.desc;
      label.appendChild(strong);label.appendChild(small);button.appendChild(label);
      if(current()===e.id){var tick=document.createElement('span');tick.textContent='✓';tick.setAttribute('aria-hidden','true');button.appendChild(tick);}
      button.addEventListener('click',function(){choose(e.id);});
      choices.appendChild(button);
    });
    if(window.RWDesignEngine)window.RWDesignEngine.mountSettings();
  }
  function initCarousels(){
    if(typeof window.rwCarousel!=='function')return;
    ['rwSalesArtists','rwSalesStays','rwSalesPackages','rwSalesWeddings','rwSalesShop'].forEach(function(id){
      var track=document.getElementById(id);
      if(track&&track.querySelectorAll('.rw-sales-card').length>1)window.rwCarousel(track,{auto:5700,design:true});
    });
  }
  window.RWDesignVault={current:current,select:choose,mountSettings:mountSettings,editions:editions.map(function(e){return {id:e.id,name:e.name};})};
  function applyMood(v){document.documentElement.setAttribute('data-rw-mood',['rave','odyssey','aipan'].indexOf(v)>=0?v:'default');}
  function ready(){apply(current());try{applyMood(localStorage.getItem('rw_visual_mood'));}catch(e){applyMood('default');}initCarousels();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
