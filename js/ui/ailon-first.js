/* Ailon-first interaction layer. Uses the existing copilot and booking engines;
   this file does not pretend to confirm payments or supplier inventory. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var PROMPTS = {
    itinerary: 'Plan a day-by-day trip to ',
    stay: 'Find stays in ',
    transport: 'Compare train, bus, flight and electric taxi options from ',
    booking: 'Check the status of my booking reference: '
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
    inp.value=prompt;
    try{inp.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
    inp.scrollIntoView({behavior:'smooth',block:'center'});
    /* A one-tap shortcut starts the right flow; it must not send a generic
       instruction to a public search fallback or consume a search credit.
       The visitor supplies the missing trip details, then presses Send. */
    inp.focus();
    try{inp.setSelectionRange(inp.value.length,inp.value.length);}catch(e){}
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
