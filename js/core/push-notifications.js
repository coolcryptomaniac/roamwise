// @ts-nocheck
/* ============================================================================
   js/core/push-notifications.js — unified push-notification opt-in +
   registration, for both web (PWA/browser, via Firebase Cloud Messaging) and
   Android (via Capacitor's push-notifications plugin, also FCM under the
   hood — one backend, two client surfaces).
   ============================================================================
   Relocated + rewritten from js/boot/init.js's rwInitPush()/rwSaveDeviceToken()/
   rwInitWebPush() (see the marker comments left there and in app.js). Two
   real behavior changes on top of the straight relocation, both asked for
   explicitly (see PUSH-NOTIFICATIONS-SETUP.md):

   1. PER-USER OPT-IN, not just the existing deployment-wide
      RW_CONFIG.features.webPush kill switch. The old code called
      Notification permission / FCM getToken() unconditionally on every boot
      once an admin turned the feature on for the whole site — every visitor
      got the browser's native permission prompt with no in-app choice and no
      way to say "not now" without it asking again next session. This module
      gates ALL registration behind an explicit, per-browser localStorage
      opt-in (rw_push_optin) that a Settings toggle controls — the same
      "off by default, one checkbox, respects a no" pattern already
      established by platform-v5/learning-consent.js for AI-learning consent.
      Once the browser itself reports permission as 'denied', this module
      flips the toggle off and stops trying — it never re-prompts a user who
      already said no, on this device or the next visit.

   2. ONE unified `pushTokens` map field on the user's own Firestore doc
      (users/{uid}.pushTokens.{deviceId} = {token, platform, updatedAt}),
      tagged by platform ('web' | 'android'), replacing the old code's two
      separate top-level fields (`pushToken` for native, `webPushToken` for
      web) — so an admin/backend sending a push doesn't need two different
      code paths to reach the same account on different devices, and a user
      signed in on both web and Android keeps both registrations
      simultaneously instead of one clobbering the other. No firestore.rules
      change is needed for this: `pushTokens` isn't in users/{uid}'s
      pro-field write blocklist, so it rides the existing generic
      isSelf(uid) self-write rule (see firestore.rules). The admin-only send
      endpoint (worker/handlers/push.js) reads this same map with a
      service-account-authenticated Firestore REST call, which bypasses
      firestore.rules entirely (same trust model as the Admin SDK), so no
      client-facing read rule is needed either.

   Loaded deferred, after js/boot/auth-init.js (needs `user`/`db`/`firebase`)
   and before js/boot/init.js (whose central boot handler calls rwPushInit()
   — see index.html for the exact script order). */

var RW_PUSH_OPTIN_KEY = 'rw_push_optin';   /* '1' | '0' | '' (never asked) */
var RW_PUSH_DEVICE_KEY = 'rw_push_device_id';

/* Stable per-browser-install id, generated once and reused across sessions/
   token refreshes, so re-registering (e.g. after an FCM token rotates)
   updates the SAME map key instead of piling up stale entries. */
function rwPushDeviceId(){
  var id = lsGet(RW_PUSH_DEVICE_KEY);
  if(!id){
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    lsSet(RW_PUSH_DEVICE_KEY, id);
  }
  return id;
}

function rwPushOptedIn(){ return lsGet(RW_PUSH_OPTIN_KEY) === '1'; }

/** True once this browser/platform combination could realistically register. */
function rwPushSupported(){
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications) return true;
  var C = window.RW_CONFIG || {};
  return !!(C.features && C.features.webPush && C.vapidKey
    && 'serviceWorker' in navigator && typeof Notification !== 'undefined');
}

/* Persisted against the user's OWN Firestore doc — see the header comment
   above for the unified-schema rationale. Best-effort: a failed write here
   must never block or error the rest of the app. */
function rwPushSaveToken(token, platform){
  if(!token || !user || typeof db === 'undefined' || !db) return;
  var key = rwPushDeviceId();
  var patch = { pushTokens: {} };
  patch.pushTokens[key] = {
    token: token,
    platform: platform,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  db.collection('users').doc(user.uid).set(patch, {merge:true}).catch(function(){ /* best-effort, ignore */ });
}

function rwPushClearToken(){
  if(!user || typeof db === 'undefined' || !db) return;
  var key = rwPushDeviceId();
  var patch = { pushTokens: {} };
  patch.pushTokens[key] = firebase.firestore.FieldValue.delete();
  db.collection('users').doc(user.uid).set(patch, {merge:true}).catch(function(){ /* best-effort, ignore */ });
}

/* -------------------------- ANDROID (Capacitor) -------------------------- */
function rwPushRegisterNative(){
  if(!(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications)) return;
  if(!rwPushOptedIn()) return;
  var PN = Capacitor.Plugins.PushNotifications;
  try{
    PN.checkPermissions().then(function(p){
      if(p.receive === 'granted') return true;
      return PN.requestPermissions().then(function(r){ return r.receive === 'granted'; });
    }).then(function(ok){
      if(!ok){
        /* respect a no — flip the toggle back off so we never nag again */
        lsSet(RW_PUSH_OPTIN_KEY, '0');
        rwPushSyncToggleUi();
        return;
      }
      PN.register();
      PN.addListener('registration', function(tok){
        try{ rwPushSaveToken(tok.value, 'android'); }catch(e){ /* best-effort, ignore */ }
      });
      PN.addListener('registrationError', function(){ /* silent — push is a bonus, never blocks the app */ });
      PN.addListener('pushNotificationReceived', function(n){
        try{ showToast('📣 '+(n.title||'RoamWise')+(n.body?': '+n.body:'')); }catch(e){ /* toast is a nice-to-have, ignore */ }
      });
      PN.addListener('pushNotificationActionPerformed', function(){ try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ } });
    }).catch(function(){});
  }catch(e){ /* best-effort, ignore */ }
}

/* ----------------------------- WEB (FCM) ---------------------------------- */
function rwPushRegisterWeb(){
  try{
    var C = window.RW_CONFIG || {};
    if(!C.features || !C.features.webPush || !C.vapidKey) return;   /* deployment-wide kill switch */
    if(window.Capacitor) return;                                    /* native app handles its own */
    if(!rwPushOptedIn()) return;                                     /* per-user opt-in */
    if(typeof Notification !== 'undefined' && Notification.permission === 'denied'){
      lsSet(RW_PUSH_OPTIN_KEY, '0'); rwPushSyncToggleUi();
      return;
    }
    if(!('serviceWorker' in navigator) || !window.firebase || !firebase.messaging) return;
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function(reg){
      var m = firebase.messaging();
      return m.requestPermission ? m.requestPermission().then(function(){ return m.getToken({vapidKey:C.vapidKey, serviceWorkerRegistration:reg}); })
                                 : m.getToken({vapidKey:C.vapidKey, serviceWorkerRegistration:reg});
    }).then(function(tok){
      if(tok) rwPushSaveToken(tok, 'web');
      else if(typeof Notification !== 'undefined' && Notification.permission === 'denied'){
        lsSet(RW_PUSH_OPTIN_KEY, '0'); rwPushSyncToggleUi();
      }
    }).catch(function(){
      if(typeof Notification !== 'undefined' && Notification.permission === 'denied'){
        lsSet(RW_PUSH_OPTIN_KEY, '0'); rwPushSyncToggleUi();
      }
    });
  }catch(e){ /* best-effort Firestore write, ignore */ }
}

function rwPushRegister(){
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications) rwPushRegisterNative();
  else rwPushRegisterWeb();
}

/* ------------------------------ OPT-IN TOGGLE ------------------------------ */
function rwPushSetOptIn(on){
  lsSet(RW_PUSH_OPTIN_KEY, on ? '1' : '0');
  if(on){
    rwPushRegister();
    try{ showToast('🔔 Push notifications on'); }catch(e){ /* toast is a nice-to-have, ignore */ }
  } else {
    rwPushClearToken();
    try{ showToast('Push notifications off'); }catch(e){ /* toast is a nice-to-have, ignore */ }
  }
  rwPushSyncToggleUi();
}

/* Mounted the same way platform-v5/learning-consent.js mounts its
   AI-learning-consent checkbox: a plain .key-section appended into the
   existing Settings modal body. #settingsOverlay is static markup in
   index.html (not built at runtime), and this file loads deferred (after
   the DOM has fully parsed), so — unlike learning-consent.js, which loads
   async and has to poll — a single mount call here is enough. */
function rwPushMountToggle(){
  var modal = document.querySelector('#settingsOverlay .modal-body');
  if(!modal || document.getElementById('rwPushConsent')) return;
  var supported = rwPushSupported();
  var box = document.createElement('div');
  box.id = 'rwPushConsent';
  box.className = 'key-section';
  box.innerHTML = '<div class="key-sec-title">Push notifications <small style="font-size:10px;font-weight:400;color:var(--t3);text-transform:none;letter-spacing:0">— optional</small></div>'
    + '<label style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--b2);border-radius:12px;background:var(--bg3);cursor:pointer">'
    + '<input id="rwPushToggle" type="checkbox" style="margin-top:3px;width:18px;height:18px;accent-color:var(--gold)"' + (supported ? '' : ' disabled') + '>'
    + '<span><b style="display:block;font-size:12.5px">Trip reminders &amp; alerts</b>'
    + '<small style="display:block;color:var(--t2);line-height:1.55;margin-top:3px">Get notified about trip countdowns, price drops, crowd alerts and new guides. Off by default — turn off anytime, no repeated prompts.</small></span></label>'
    + (supported ? '' : '<div style="font-size:10px;color:var(--t3);margin-top:6px">Not supported in this browser/app right now.</div>');
  modal.appendChild(box);
  var toggle = box.querySelector('#rwPushToggle');
  if(toggle) toggle.addEventListener('change', function(e){ rwPushSetOptIn(e.target.checked); });
  rwPushSyncToggleUi();
}
function rwPushSyncToggleUi(){
  var t = document.getElementById('rwPushToggle');
  if(t) t.checked = rwPushOptedIn();
}

/* Boot entry point, called from js/boot/init.js's central boot handler.
   Only re-registers for someone who has ALREADY opted in on this device —
   never triggers a fresh browser permission prompt on its own. The
   permission prompt only ever fires as the direct result of a user tapping
   the Settings toggle (rwPushSetOptIn), which is both better UX and what
   "don't nag" means in practice here. */
function rwPushInit(){
  try{ if(rwPushOptedIn()) rwPushRegister(); }catch(e){ /* best-effort, ignore */ }
  try{ rwPushMountToggle(); }catch(e){ /* best-effort, ignore */ }
}
