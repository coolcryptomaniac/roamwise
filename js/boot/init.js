// @ts-nocheck
/* ==================== BOOT SEQUENCE ====================
   Extracted verbatim from app.js (Phase 6b modularization) — the final
   piece of the app.js -> js/ migration. Loaded LAST, immediately after
   app.js's own <script> tag (which still carries the bulk of the app's
   remaining logic) and before the optional roamwise-premium-itinerary.js /
   itinerary-library add-ons, exactly where these registrations used to sit
   inside app.js's own execution stream. This preserves their relative
   registration order against every other DOMContentLoaded/readystatechange
   listener in the app (all of which fire in registration order):
     1. PUSH + LOCAL NOTIFICATIONS (rwInitPush/rwSaveDeviceToken/
        rwLocalNotifySchedule) — called by the central boot handler below.
     2. Deep-link-on-first-load DOMContentLoaded handler.
     3. Main page-render DOMContentLoaded handler (device/lang/theme init,
        home page declutter/reveal wiring).
     4. #tmode select change-listener DOMContentLoaded handler.
     5. Central boot DOMContentLoaded handler — applies the UI mode/scale,
        renders the tab bar, triggers the cinematic opening or onboarding,
        initializes the status bar/back button, and lazily kicks off native
        + web push registration and TTS voice warm-up.
     6. WEB PUSH (rwInitWebPush) — browser notification registration,
        called by #5 above.
     7. PWA — service worker registration + install-prompt UI (Android/
        Chrome real prompt, iOS Safari manual instructions).
     8. REMOTE CONFIG — fetches owner-only config (affiliate IDs, WhatsApp
        numbers, promo/media URLs, crypto wallets) from Firestore, applying
        a cached copy immediately and a fresh one once it lands — plus the
        two small bridge assignments (window.rwIsPro/rwDeriveStops/
        rwGeocodeStopsNear) the optional Cinematic Itinerary add-on reads.
   NOTE: the GLOBAL ERROR GUARD (window 'error'/'unhandledrejection'
   listeners) that used to sit at the very top of app.js is deliberately
   NOT here — see js/core/error-guard.js for why it needs to load FIRST
   instead. Also NOT here (as of the final modularization pass): the
   Firebase/Firestore app init, the onAuthStateChanged callback (which also
   nudges the encrypted-key-sync auto-restore), and the PLAY_MODE-gated
   billing UI swap — those moved verbatim to js/boot/auth-init.js, loaded
   deferred immediately before app.js so `user`/`db`/`AUTH_READY` exist as
   globals before app.js (and this file, which loads after it) run. */

/* ================= PUSH + LOCAL NOTIFICATIONS (rw-v42) =================
   PUSH: registers the device with Firebase Cloud Messaging (via Capacitor's
   push-notifications plugin) and stores the token against the signed-in user.
   This means notifications can be sent to all users FREE, straight from the
   Firebase Console's Notification composer \u2014 no custom backend needed.
   LOCAL: upgrades Tusk's "Remind me" from a setTimeout (dies if the app
   closes) to a real OS-scheduled notification that fires even when closed.
   ========================================================================== */
function rwInitPush(){
  if(!(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications)) return;
  var PN=Capacitor.Plugins.PushNotifications;
  try{
    PN.checkPermissions().then(function(p){
      if(p.receive==='granted') return true;
      return PN.requestPermissions().then(function(r){ return r.receive==='granted'; });
    }).then(function(ok){
      if(!ok) return;
      PN.register();
      PN.addListener('registration', function(tok){
        try{ rwSaveDeviceToken(tok.value); }catch(e){}
      });
      PN.addListener('registrationError', function(){ /* silent \u2014 push is a bonus, never blocks the app */ });
      PN.addListener('pushNotificationReceived', function(n){
        try{ showToast('\ud83d\udce3 '+(n.title||'RoamWise')+(n.body?': '+n.body:'')); }catch(e){}
      });
      PN.addListener('pushNotificationActionPerformed', function(){ try{ tabGo('home'); }catch(e){} });
    }).catch(function(){});
  }catch(e){}
}
function rwSaveDeviceToken(token){
  if(!token || !user || typeof db==='undefined' || !db) return;
  db.collection('users').doc(user.uid).set({ pushToken: token, pushTokenAt: firebase.firestore.FieldValue.serverTimestamp() }, {merge:true}).catch(function(){});
}
/* Local notification, upgraded from the old setTimeout-only version. Falls
   back to the JS timer + chime when running outside the app (web/PWA). */
function rwLocalNotifySchedule(what, mins){
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications){
    var LN=Capacitor.Plugins.LocalNotifications;
    try{
      LN.requestPermissions().then(function(){
        return LN.schedule({ notifications:[{
          id: Math.floor(Date.now()%1e8),
          title:'RoamWise reminder', body: what,
          schedule:{ at: new Date(Date.now()+mins*60000) }
        }]});
      });
      return true;
    }catch(e){ return false; }
  }
  return false;
}


/* open a deep link on first load */
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    var h=String(location.hash||'');
    if(h.indexOf('#/')===0) rwRouteTo(h.slice(2));
  }, 900);
});


document.addEventListener('DOMContentLoaded', function(){
  try{ rwInitDevice(); }catch(e){}
  try{ rwInitLang(); }catch(e){}
  try{ rwInitTheme(); }catch(e){}
  try{ renderEventBanner(); }catch(e){}
  try{ renderEvents(); }catch(e){}
  try{ renderSpotlight(); }catch(e){}
  try{ renderTicker(); }catch(e){}
  try{ renderForYou(); }catch(e){}
  try{ tripReminderCheck(); }catch(e){}
  /* one cheap call keeps every INR figure honest instead of hardcoding 88 */
  try{
    if(navigator.onLine) fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR')
      .then(function(r){return r.json();})
      .then(function(d){ if(d && d.rates && d.rates.INR) window._rwFxINR = d.rates.INR; })
      .catch(function(){});
  }catch(e){}
  /* Home declutter: heavy sections collapse behind slim headers — the scroll
     keeps only the essentials (video, copilot, quick start). One tap expands. */
  try{
    /* The Film has its own tab now, so it is NO LONGER folded inside the creator
       section — that nesting left the player stranded above an unrelated fold
       with a dead gap between them. Film section first, creator info after. */
    try{
      var pf=el('promofilm'), cr=el('creator');
      if(pf && cr && cr.parentNode) cr.parentNode.insertBefore(pf, cr);
    }catch(e){}
    [['ratings','\u2b50 Ratings & traveler wall'],['store','\ud83d\udecd Store'],['creator','\ud83c\udfd4\ufe0f About the creator'],].forEach(function(f){
      var sec=el(f[0]); if(!sec || sec.dataset.folded) return;
      sec.dataset.folded='1';
      var body=document.createElement('div'); body.className='fold-body';
      while(sec.firstChild) body.appendChild(sec.firstChild);
      var head=document.createElement('button'); head.className='fold-head';
      head.innerHTML=f[1]+'<span class="chev">\u203a</span>';
      head.onclick=function(){ head.classList.toggle('open'); body.classList.toggle('open'); };
      sec.appendChild(head); sec.appendChild(body);
    });
  }catch(e){}
  try{
    cpModelChips('heroModels');
    var hi=el('heroInput');
    if(hi) hi.addEventListener('keydown',function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); copilotSend(true); } });
  }catch(e){}  /* fire any due trip countdown reminders */
  try{ renderPromo(); }catch(e){}
  try{ renderNewsPulse(); }catch(e){}
  try{ renderRatings(); }catch(e){}
  /* Apple-style scroll reveal */
  try{
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('inview'); io.unobserve(e.target); } }); },{threshold:0.08});
      document.querySelectorAll('.xsec,.exp,.trek,.promo,.mode-box').forEach(function(n2,i2){ if(i2<160){ n2.classList.add('rv'); io.observe(n2); } });
      /* safety nets: nothing may ever stay hidden */
      function revealVisible(){ document.querySelectorAll('.rv:not(.inview)').forEach(function(n3){
        var r3=n3.getBoundingClientRect(); if(r3.top < innerHeight && r3.bottom > 0 && r3.width) n3.classList.add('inview'); }); }
      setTimeout(revealVisible, 600);
      window._rvAll=function(){ setTimeout(revealVisible, 60); };
      setTimeout(function(){ document.querySelectorAll('.rv:not(.inview)').forEach(function(n3){ n3.classList.add('inview'); }); }, 5000);
    }
  }catch(e){}
});


document.addEventListener('DOMContentLoaded', function(){
  var tm = el('tmode');
  if(tm) tm.addEventListener('change', function(){
    var r = el('results');
    if(r && r.innerHTML.length > 100) showToast('Mode changed — hit Search again to recalculate budgets');
  });
});


document.addEventListener('DOMContentLoaded', function(){ try{ rwApplyMode(); }catch(e){} try{ rwApplyUIScale(); }catch(e){} try{ renderTabbar(); }catch(e){ console.warn('tabbar', e); } try{ setTimeout(function(){ if(!rwOpeningSeen()) rwOpeningShow(); else rwMaybeOnboard(); }, 700); }catch(e){} try{ rwInitStatusBar(); }catch(e){} try{ rwInitBackButton(); }catch(e){} try{ setTimeout(rwInitPush, 1500); }catch(e){} try{ setTimeout(rwInitWebPush, 2200); }catch(e){} /* warm up the voice list early so it's ready by the time tuskSpeak() needs it */ try{ if(window.speechSynthesis){ speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', function(){ try{ speechSynthesis.getVoices(); }catch(e){} }, {once:true}); } }catch(e){} });


/* ===== WEB PUSH (rw-v48) — browser notifications, opt-in and guarded.
   Off unless RW_CONFIG.features.webPush is true AND a VAPID key is set, so it
   can never break production by accident. The Android app already gets push
   via the native Capacitor plugin; this covers desktop + mobile web. */
function rwInitWebPush(){
  try{
    var C=window.RW_CONFIG||{};
    if(!C.features || !C.features.webPush || !C.vapidKey) return;   /* opt-in only */
    if(window.Capacitor) return;                                    /* native app handles its own */
    if(!('serviceWorker' in navigator) || !window.firebase || !firebase.messaging) return;
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function(reg){
      var m=firebase.messaging();
      return m.requestPermission ? m.requestPermission().then(function(){ return m.getToken({vapidKey:C.vapidKey, serviceWorkerRegistration:reg}); })
                                 : m.getToken({vapidKey:C.vapidKey, serviceWorkerRegistration:reg});
    }).then(function(tok){
      if(tok && user && typeof db!=='undefined' && db){
        db.collection('users').doc(user.uid).set({webPushToken:tok}, {merge:true}).catch(function(){});
      }
    }).catch(function(){});
  }catch(e){}
}



/* ============================ PWA ============================
   Installable web app for Android + iPhone. Two deliberate guards:
   1) Registration only on https: — inside the Android APK the page is
      served from file://, where registering a service worker throws.
   2) The APK already IS the app, so no install prompt is shown there. */
(function(){
  var inApp = !!window.RW || (typeof PLAY_MODE!=='undefined' && PLAY_MODE);
  /* isSecureContext is true for https AND localhost, false for file:// (the
     APK), which is exactly the condition a service worker needs. */
  if(window.isSecureContext && 'serviceWorker' in navigator && !inApp){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){ /* offline mode simply unavailable */ });
    });
  }
  if(inApp) return;

  function dismissed(){ return lsGet('rw_pwa_dismissed')==='1'; }
  function standalone(){
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  }
  function showBar(html){
    if(dismissed() || standalone() || document.getElementById('pwaBar')) return;
    var b=document.createElement('div');
    b.id='pwaBar';
    b.style.cssText='position:fixed;left:12px;right:12px;bottom:78px;z-index:9998;background:#12121C;border:1px solid #2A2A36;'
      +'border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.5);'
      +'font-size:12.5px;color:#EDEAE2;animation:none';
    b.innerHTML=html;
    document.body.appendChild(b);
  }
  function closeBar(){
    lsSet('rw_pwa_dismissed','1');
    var b=document.getElementById('pwaBar'); if(b) b.remove();
  }
  window.rwPwaClose = closeBar;

  /* --- Android / Chrome / Edge: real install prompt --- */
  var deferred=null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault(); deferred=e;
    showBar('<span style="font-size:20px">\uD83D\uDCF2</span>'
      +'<span style="flex:1;line-height:1.4">Install RoamWise \u2014 works offline, opens like an app</span>'
      +'<button onclick="rwPwaInstall()" style="background:linear-gradient(135deg,#E8BA6C,#C8913E);color:#12121C;border:none;'
      +'border-radius:9px;padding:8px 12px;font-weight:800;font-size:12px;cursor:pointer">Install</button>'
      +'<button onclick="rwPwaClose()" style="background:none;border:none;color:#8A8880;font-size:16px;cursor:pointer;padding:4px">\u2715</button>');
  });
  window.rwPwaInstall = function(){
    if(!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function(c){
      try{ track(c && c.outcome==='accepted' ? 'pwa_installed' : 'pwa_dismissed'); }catch(e){}
      deferred=null; closeBar();
    });
  };
  window.addEventListener('appinstalled', function(){ closeBar(); try{ track('pwa_installed'); }catch(e){} });

  /* --- iPhone/iPad: Safari has no install prompt API, so show the manual
         Share -> Add to Home Screen steps instead (only on real iOS Safari). --- */
  var ua=navigator.userAgent||'';
  var isIOS=/iPad|iPhone|iPod/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  var isSafari=/Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if(isIOS && isSafari && !standalone()){
    setTimeout(function(){
      showBar('<span style="font-size:20px">\uD83D\uDCF2</span>'
        +'<span style="flex:1;line-height:1.45">Add RoamWise to your Home Screen: tap <b>Share</b> \u2191 then <b>Add to Home Screen</b></span>'
        +'<button onclick="rwPwaClose()" style="background:none;border:none;color:#8A8880;font-size:16px;cursor:pointer;padding:4px">\u2715</button>');
    }, 4000);
  }
})();


/* ==================== REMOTE CONFIG (owner values, zero user input) =========
   Every owner-only value — affiliate IDs, WhatsApp numbers, Gumroad link/ID,
   promo video URL, music embeds, crypto wallets, Play Store URL — now lives in
   ONE Firestore doc (config/app) that only the admin console can write (rules:
   public read, isAdmin write). The user app just reads it. Two-phase apply:
   1) cached copy from localStorage immediately (works offline / first paint),
   2) fresh Firestore fetch, re-cache, re-apply.
   CRITICAL ORDERING NOTE: this must run at DOMContentLoaded, not at parse
   time — several of these vars are declared AFTER db-init in file order, so
   applying config too early would be overwritten by their own `var x=''`
   initializers a few thousand lines later. DOMContentLoaded fires after every
   synchronous script has executed, which is exactly the safe moment. */
var RW_CFG = {};
function applyRemoteConfig(cfg){
  if(!cfg || typeof cfg!=='object') return;
  RW_CFG = cfg;
  function set(k, fn){ if(cfg[k]!=null && cfg[k]!=='') try{ fn(cfg[k]); }catch(e){} }
  set('AFF_BOOKING',      function(v){ AFF_BOOKING=v; });
  set('AFF_SKYSCANNER',   function(v){ AFF_SKYSCANNER=v; });
  set('AFF_AGODA',        function(v){ AFF_AGODA=v; });
  set('AFF_GYG',          function(v){ AFF_GYG=v; });
  set('AFF_TRAVELPAYOUTS',function(v){ AFF_TRAVELPAYOUTS=v; });
  set('AFF_VIATOR',       function(v){ AFF_VIATOR=v; });
  set('AFF_SAFETYWING',   function(v){ AFF_SAFETYWING=v; });
  set('AFF_KLOOK',        function(v){ AFF_KLOOK=v; });
  set('AFF_12GO',         function(v){ AFF_12GO=v; });
  set('AFF_TRIPCOM',      function(v){ AFF_TRIPCOM=v; });
  set('AFF_HOSTELWORLD',  function(v){ AFF_HOSTELWORLD=v; });
  set('AFF_AMAZON',       function(v){ AFF_AMAZON=v; });
  set('AFF_FLIPKART',     function(v){ AFF_FLIPKART=v; });
  set('AFF_YATRA',        function(v){ AFF_YATRA=v; });
  set('AFF_CLEARTRIP',    function(v){ AFF_CLEARTRIP=v; });
  set('AFF_CUELINKS',     function(v){ AFF_CUELINKS=v; });
  set('AFF_EARNKARO',     function(v){ AFF_EARNKARO=v; });
  set('AFF_ADMITAD',      function(v){ AFF_ADMITAD=v; });
  set('WA_NUMBER',        function(v){ WA_NUMBER=v; ensureWaButton(); });
  set('WA_CHANNEL',       function(v){ WA_CHANNEL=v; });
  set('WA_GROUP',         function(v){ WA_GROUP=v; });
  set('PLAYSTORE_URL',    function(v){ PLAYSTORE_URL=v; });
  set('ADSENSE_SLOT',     function(v){ ADSENSE_SLOT=v; });
  set('PROMO_MP4_URL',    function(v){
    /* A <video> can only play a DIRECT media file. The config field was set to
       a YouTube share link (https://youtu.be/...), which silently replaced the
       working self-hosted mp4 and made inline playback fail on every device.
       Accept only real media URLs; anything else is kept as the "watch on"
       link instead of breaking the player. */
    if(/\.(mp4|webm|mov|m4v)(\?|$)/i.test(v)) PROMO_MP4_URL = v;
    else { PROMO_EXT_URL = v; try{ console.warn('PROMO_MP4_URL must be a direct .mp4 link; got:', v); }catch(e){} }
  });
  set('SPOTIFY_ARTIST_ID',function(v){ SPOTIFY_ARTIST_ID=v; });
  set('SPOTIFY_PLAYLIST_ID',function(v){ SPOTIFY_PLAYLIST_ID=v; });
  set('JIOSAAVN_URL',     function(v){ JIOSAAVN_URL=v; });
  set('CRYPTO_WALLETS',   function(v){ if(typeof v==='object') CRYPTO_WALLETS=v; });
  /* Gumroad values feed the existing localStorage readers untouched. */
  set('GUM_URL',          function(v){ lsSet('rw_gum_url', v); });
  set('GUM_PID',          function(v){ lsSet('rw_gum_pid', v); });

  /* ---- Admin-controlled custom head-script slot (rw-v95) ----
     Lets an admin drop in a verified third-party script (e.g. a Travelpayouts
     Drive snippet, once confirmed via their own dashboard) purely through
     Firestore config — no code deploy needed. Both fields must be explicitly
     set AND customHeadScriptVerified must be the literal boolean true; any
     other value (missing, false, a string "true", etc.) leaves this fully
     inert, exactly like every other slot in this file that starts empty. Same
     createElement+async+appendChild bootstrap pattern already used for
     AdSense above — the concern with an unverified URL was trusting the URL,
     not this mechanism. Guarded so a second Firestore fetch never injects the
     same tag twice. */
  try{
    if(cfg.customHeadScriptUrl && cfg.customHeadScriptVerified===true && /^https:\/\//.test(cfg.customHeadScriptUrl)){
      if(!document.querySelector('script[data-rw-custom-head="1"]')){
        var chs=document.createElement('script');
        chs.async=true;
        chs.src=cfg.customHeadScriptUrl;
        chs.setAttribute('data-rw-custom-head','1');
        document.head.appendChild(chs);
      }
    }
  }catch(e){}
}
(function(){
  function boot(){
    try{ var cached=JSON.parse(lsGet('rw_cfg')||'null'); if(cached) applyRemoteConfig(cached); }catch(e){}
    try{
      if(window.db){
        db.collection('config').doc('app').get().then(function(snap){
          if(snap.exists){ var c=snap.data(); lsSet('rw_cfg', JSON.stringify(c)); applyRemoteConfig(c); }
        }).catch(function(){ /* offline or rules not yet published — cached copy already applied */ });
      }
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* Bridge for the optional Cinematic Itinerary add-on (roamwise-premium-itinerary.js):
   it checks window.rwIsPro() first, before falling back to unreliable localStorage
   heuristics. Route it through the real RWPricing tier so the Pro gate reflects
   actual subscription status instead of a guess. */
window.rwIsPro = function(){
  try{ return RWPricing.currentTier().id !== 'free'; }catch(e){ return false; }
};
/* More bridges for the Cinematic Itinerary add-on: rwDeriveStops() already knows how
   to turn a destination (+ the last built itinerary, curated real POIs, or DB gems)
   into real named stops, and rwGeocodeStopsNear() geocodes + sanity-bounds them the
   same way openTripMap() does. These are plain top-level function declarations so
   they're already on window in a browser, but we assign explicitly here so the
   dependency is obvious and doesn't silently break if app.js is ever wrapped/bundled. */
window.rwDeriveStops = rwDeriveStops;
window.rwGeocodeStopsNear = rwGeocodeStopsNear;
