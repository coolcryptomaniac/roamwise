/* Ailon-first interaction layer. Uses the existing copilot and booking engines;
   this file does not pretend to confirm payments or supplier inventory. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var PROMPTS = {
    itinerary: 'Help me plan a complete trip. Ask me for my destination, dates, number of travellers, interests and total budget. Build a day-by-day itinerary and show any missing arrangements before I book.',
    stay: 'Help me find a trustworthy stay. Ask for destination, dates, group size and budget. Compare suitable options, clarify availability and total price, and guide me to a booking enquiry.',
    transport: 'Help me arrange transport for my trip. Ask my origin, destination, travel dates and passengers. Compare available train, bus, flight and taxi options, giving electric transport priority where practical.',
    booking: 'Help me review my trip and booking requests. Ask for the trip or reference first, distinguish confirmed reservations from pending enquiries, and tell me what remains to book. Do not assume a payment or booking is confirmed.'
  };
  var ACTIONS = {
    stays: function () { return W.openListing && W.openListing(); },
    itineraries: function () { return W.openVault && W.openVault(); },
    bookings: function () { return W.openBooking && W.openBooking(); },
    transport: function () { return W.rwOpenTripDesk && W.rwOpenTripDesk(); },
    experiences: function () { return W.openExperiences && W.openExperiences(); },
    groups: function () { return W.openGroupPlanner && W.openGroupPlanner(); },
    mesh: function () { return W.rwOpenTrailMesh && W.rwOpenTrailMesh('connect'); },
    events: function () { return W.openEvents && W.openEvents(); },
    settings: function () { return W.openSettings && W.openSettings(); },
    saved: function () { return W.showSaved && W.showSaved(); },
    journey: function () { return W.openJourneyLog && W.openJourneyLog(); }
  };
  var lastPromptAt=0;
  function startPrompt(key){
    var inp=/** @type {HTMLTextAreaElement|null} */ (document.getElementById('heroInput')), prompt=PROMPTS[key];
    if(!inp || !prompt) return false;
    var now=Date.now(); if(now-lastPromptAt<900) return true; lastPromptAt=now;
    if(inp.value.trim()){
      /* Never replace or submit a visitor's unsent request without asking. */
      inp.focus(); inp.scrollIntoView({behavior:'smooth',block:'center'});
      try { if(typeof W.showToast==='function') W.showToast('Your draft is ready. Press Send to continue.'); }catch(e){}
      return true;
    }
    try{ if(typeof W.tabGo==='function') W.tabGo('home'); }catch(e){}
    // Collect useful details locally instead of sending an instruction-shaped prompt.
    if(key==='booking'&&typeof W.openBooking==='function'){W.openBooking();return true;}
    var panel=document.getElementById('rwGuidedPrompt');
    if(!panel){
      panel=document.createElement('form');panel.id='rwGuidedPrompt';panel.className='rw-guided-prompt';
      inp.closest('.copilot-compose')?.insertAdjacentElement('beforebegin',panel);
    }
    panel.hidden=false;panel.replaceChildren();
    var title=document.createElement('h3');title.textContent=key==='transport'?'Where are you travelling from and to?':key==='stay'?'Find a stay that suits you':'Build your trip';panel.appendChild(title);
    var fields=key==='transport'?[['origin','Starting city'],['dest','Destination'],['date','Departure date'],['guests','Passengers']]:[['dest','Destination(s), e.g. Almora, Nainital'],['days','Days'],['date','Travel date (optional)'],['guests','Travellers'],['budget','Budget in ₹ (optional)']];
    var inputs={};
    fields.forEach(function(field){
      var label=document.createElement('label');label.textContent=field[1];var fieldInput=document.createElement('input');fieldInput.name=field[0];fieldInput.maxLength=120;fieldInput.type=field[0]==='date'?'date':['days','guests','budget'].includes(field[0])?'number':'text';
      if(fieldInput.type==='number')fieldInput.min='1';if(field[0]==='days')fieldInput.max='30';fieldInput.required=field[0]==='dest'||field[0]==='origin';label.appendChild(fieldInput);panel.appendChild(label);inputs[field[0]]=fieldInput;
    });
    var styles=document.createElement('div');styles.className='rw-guided-vibes';var picked=new Set();
    ['Relaxed','Culture','Adventure','Food','Family'].forEach(function(v){var b=document.createElement('button');b.type='button';b.textContent=v;b.setAttribute('aria-pressed','false');b.onclick=function(){if(picked.has(v))picked.delete(v);else picked.add(v);b.setAttribute('aria-pressed',String(picked.has(v)));};styles.appendChild(b);});if(key!=='transport')panel.appendChild(styles);
    var go=document.createElement('button');go.type='submit';go.textContent='Ask Ailon';panel.appendChild(go);
    var cancel=document.createElement('button');cancel.type='button';cancel.textContent='Close';cancel.onclick=function(){panel.hidden=true;};panel.appendChild(cancel);
    panel.onsubmit=function(event){event.preventDefault();if(inp.value.trim()){inp.focus();return;}
      var val=k=>inputs[k]?inputs[k].value.trim():'';
      var query=key==='transport'?'Compare transport from '+val('origin')+' to '+val('dest')+'; prefer verified electric options.':key==='stay'?'Find stays in '+val('dest'):'Plan a '+(val('days')?val('days')+' day ':'')+'trip to '+val('dest');
      if(val('date'))query+='; departing '+val('date');if(val('guests'))query+='; '+val('guests')+' travellers';if(val('budget'))query+='; budget ₹'+val('budget');if(picked.size)query+='; interests: '+Array.from(picked).join(', ');
      inp.value=query;inp.dispatchEvent(new Event('input',{bubbles:true}));panel.hidden=true;if(typeof W.copilotSend==='function')W.copilotSend(true);
    };
    if(key!=='booking'){inputs[fields[0][0]].focus();panel.scrollIntoView({block:'nearest'});return true;}
    panel.hidden=true;
    inp.value=prompt;
    try{inp.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
    inp.scrollIntoView({behavior:'smooth',block:'center'});
    if(typeof W.copilotSend==='function'){
      try{W.copilotSend(true);return true;}catch(e){}
    }
    inp.focus();
    return true;
  }
  function openAction(key){
    if(!Object.prototype.hasOwnProperty.call(ACTIONS,key)) return false;
    var fn=ACTIONS[key];
    try {
      /* Avoid invoking a missing global while the app boot is incomplete. */
      var symbol={stays:'openListing',itineraries:'openVault',bookings:'openBooking',transport:'rwOpenTripDesk',experiences:'openExperiences',groups:'openGroupPlanner',mesh:'rwOpenTrailMesh',events:'openEvents',settings:'openSettings',saved:'showSaved',journey:'openJourneyLog'}[key];
      if(typeof W[symbol]!=='function') return false;
      fn(); return true;
    }catch(e){return false;}
  }
  W.rwAilonStart=startPrompt;
  W.rwMoreOpenAction=openAction;
  document.addEventListener('click',function(e){
    if (!(e.target instanceof Element)) return;
    var btn=e.target.closest('[data-rw-tusk],[data-rw-open]');
    if(!btn) return;
    if(btn.hasAttribute('data-rw-tusk')) {e.preventDefault();startPrompt(btn.getAttribute('data-rw-tusk'));return;}
    if(btn.hasAttribute('data-rw-open')){e.preventDefault();var key=btn.getAttribute('data-rw-open');if(!openAction(key)) W.location.href='/?rw_open='+encodeURIComponent(key);}
  });
  function bootDeepLink(){
    var value;
    try{value=new URLSearchParams(location.search).get('rw_open');}catch(e){return;}
    if(!value || !Object.prototype.hasOwnProperty.call(ACTIONS,value))return;
    var completed=false, attempts=0;
    function tryOpen(){
      if(completed)return;
      if(openAction(value)){
        completed=true;
        try{var u=new URL(location.href);u.searchParams.delete('rw_open');history.replaceState(history.state,'',u.pathname+u.search+u.hash);}catch(e){}
      } else if(++attempts>=4) {
        completed=true;
        var notice=document.createElement('div');
        notice.setAttribute('role','status');
        notice.style.cssText='position:fixed;bottom:90px;left:12px;right:12px;z-index:200;padding:13px;background:#2c2038;color:white;border:1px solid #ad85d5;border-radius:12px;text-align:center;font:14px system-ui';
        notice.innerHTML='That tool is not available right now. <a href="/more/index.html" style="color:#ffe0aa">Browse More</a>';
        document.body.appendChild(notice);
      } else setTimeout(tryOpen,1200);
    }
    window.addEventListener('rw:booted',tryOpen,{once:true});
    if(document.readyState==='complete')setTimeout(tryOpen,800);
    else window.addEventListener('load',function(){setTimeout(tryOpen,800);},{once:true});
  }
  bootDeepLink();
})();
