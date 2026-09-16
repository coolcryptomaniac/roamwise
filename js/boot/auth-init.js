// @ts-nocheck
/* Extracted verbatim from app.js (final modularization pass) — Firebase SDK
   init, firebase.auth().onAuthStateChanged UI wiring (sign-in button state,
   avatar, device-cap enforcement, first-1000-users trial grant, referral
   signup stamping, account-bound Pro onSnapshot listener), and the account
   drawer's own onAuthStateChanged registration (previously a standalone line
   in app.js, now co-located here since both listen for the same event).
   Loaded via a deferred <script> tag placed immediately before app.js so
   `user`/`db`/`AUTH_READY` and every auth function below are defined as
   globals before app.js runs, matching their original load-time position.
   Zero logic changes from the original app.js code. Everything referenced
   only inside async callbacks below (rwCheckBan, refreshProUI, xpAdd,
   rwRefActive, rwRefLookup, cpModelChips, renderKeyBoxes, openSettings,
   drawerAccount, etc.) resolves fine regardless of exact script order,
   since those callbacks only fire after every deferred script has loaded. */

/* ===================================================================
   CONFIG — the ONLY things you edit. No secrets here: the apiKey below
   is a public Firebase identifier; real security lives in Firestore
   rules and the backend Worker.
=================================================================== */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU",
  authDomain: "roamwisepro.firebaseapp.com",
  projectId: "roamwisepro",
  appId: "1:299014744987:web:d5c316743e6d7a10904f3e"
};
var OWNER_NOTIFY_EMAIL = ""; /* your email — get instant alerts when someone submits a payment */
/* =================================================================== */

var PLAY_MODE = false; /* set true for the Play Store build — Pro features free (Play billing policy) */
var AUTH_READY = FIREBASE_CONFIG.apiKey !== "PASTE_ME" && typeof firebase !== 'undefined';
if(PLAY_MODE){ document.addEventListener('DOMContentLoaded', function(){
  try{
    if(window.RWBilling){
      /* Billing edition: replace UPI/Gumroad UI with the Play purchase */
      var mb=document.querySelector('#payOverlay .modal-body');
      if(mb){ mb.innerHTML = '<div class="price-hero"><div class="big-price">\u20b9100</div><div class="price-sub">One-time \u00b7 Lifetime \u00b7 via Google Play</div></div>'
        +'<button class="rzp-main-btn" onclick="RWBilling.buy()">\ud83d\uded2 Unlock Pro \u2014 Google Play</button>'
        +'<div class="intl-note" style="margin-top:10px">Billed securely by Google \u00b7 Restores automatically on reinstall</div>'; }
    } else {
      /* Listing edition: Pro free for early adopters (Play billing policy) */
      isPro=true; lsSet('rwPro','1'); refreshProUI(); var pb=el('promoBar'); if(pb) pb.style.display='none';
    }
  }catch(e){ /* storage best-effort, ignore */ }
});}
/* Called by the native Play Billing bridge after a verified purchase */
function playProGranted(){ activatePro('google-play','Google Play'); showToast('Pro unlocked via Google Play \u2713'); }
var user = null, db = null, authMode = 'in';

/* Firebase loads from a CDN. If that CDN is slow, blocked, or the device is
   simply offline, `firebase` is undefined and this whole block used to throw at
   the top level — which halted the rest of app.js. Everything defined AFTER
   this point (including the bottom navigation config) never executed, so the
   app opened with no tab bar and no way to move. For an offline-first travel
   app that is the worst possible failure. Guarded: sign-in degrades, the app
   keeps working. */
// RWData backend portability layer (rwInitDataLayer) moved to js/data-sync/rwdata.js
if (AUTH_READY && typeof firebase !== 'undefined') try {
  firebase.initializeApp(FIREBASE_CONFIG);
  /* App Check stays a no-op until an Enterprise site key is configured.
     Enable enforcement only after the Firebase metrics show legitimate web,
     PWA and Android traffic receiving tokens. */
  try{
    var appCheckKey=window.RW_CONFIG&&RW_CONFIG.appCheck&&RW_CONFIG.appCheck.webRecaptchaEnterpriseSiteKey;
    if(appCheckKey&&firebase.appCheck){
      firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(appCheckKey),true);
    }
  }catch(e){ try{console.warn('App Check did not initialise:',e&&e.message);}catch(_){ /* diagnostic only */ } }
  db = firebase.firestore();
  /* FREE cost win: cache Firestore data on the device. Reads hit local memory
     first (zero server reads, works offline), and only sync deltas when online.
     Wrapped in try because it fails on multi-tab / private mode — non-fatal. */
  try{ db.enablePersistence({synchronizeTabs:true}).catch(function(){}); }catch(e){ /* best-effort Firestore op, ignore */ }
  try{ rwInitDataLayer(); }catch(e){ /* best-effort, ignore */ }
  firebase.auth().onAuthStateChanged(function(u){
    /* Password accounts must verify ownership before any profile, trial or cloud feature is created. */
    if(rwIsUnverifiedPasswordUser(u)){
      pendingVerificationEmail=(u&&u.email)||pendingVerificationEmail;
      if(!rwEmailAuthBusy){
        firebase.auth().signOut().catch(function(){});
        setTimeout(function(){rwShowVerificationPane(pendingVerificationEmail,'Verify your email before using your RoamWise account.');},0);
      }
      u=null;
    }
    user = u;
    setTimeout(function(){try{rwRenderLinkedSignInMethods();}catch(e){}},0);
    try{ if(u&&window.RWAuthSecurity) RWAuthSecurity.rememberUserProvider(u); }catch(e){ /* local hint only */ }
    try{ if(u) rwCheckBan(); }catch(e){ /* best-effort, ignore */ }
    var btn = el('authBtn'), av = el('authAvatar');
    if(u){
      btn.style.display='none';
      av.style.display=''; av.src = u.photoURL || ('https://api.dicebear.com/9.x/initials/svg?seed='+encodeURIComponent(u.email||u.phoneNumber||'RW'));
      /* Keys are wiped locally on sign-out; if the user opted into the
         encrypted backup, bring them straight back on sign-in. */
      if(lsGet('rw_sec_pass')) setTimeout(function(){ try{ rwSyncKeysDown(true); }catch(e){ /* best-effort, ignore */ } }, 600);
      var ref = db.collection('users').doc(u.uid);
      ref.get().then(function(d){
        if(!d.exists) ref.set({email:u.email||'', phone:u.phoneNumber||'', name:u.displayName||'', created:firebase.firestore.FieldValue.serverTimestamp()});
      });
      /* ---- DAU instrumentation (added alongside js/admin/user-activity.js) ----
         REVENUE-GROWTH-STRATEGY.md flagged that this codebase has NO per-user
         activity/login timestamp anywhere admin-readable (the existing
         devices/{deviceId}.last field below is per-device, and its Firestore
         rule is isSelf(uid)-only — admin cannot read it). This is the minimal
         fix: one plain field on the user's own doc, updated every time this
         callback fires (sign-in AND every subsequent app-open while already
         signed in, since onAuthStateChanged re-fires on load). Merge-only, so
         it never touches any other field — in particular never the pro/proAt/
         proMethod/proPayId blocklist, so no firestore.rules change is needed:
         it rides the existing generic self-write rule on users/{uid} exactly
         like pushTokens does. Honest limitation: this can only measure
         activity from the moment this shipped forward — there is no way to
         retroactively know how active any account was before today. */
      try{ ref.set({lastActive: firebase.firestore.FieldValue.serverTimestamp()}, {merge:true}); }catch(e){ /* best-effort, ignore */ }
      /* ---- device fingerprint (stable per browser/app install) ---- */
      var devId=lsGet('rw_devid'); if(!devId){ devId='d_'+Math.random().toString(36).slice(2)+Date.now().toString(36); lsSet('rw_devid',devId); }
      /* ---- register this account+device pair; enforce a 3-device cap ---- */
      try{
        ref.collection('devices').doc(devId).set({
          ua:navigator.userAgent.slice(0,180), last:firebase.firestore.FieldValue.serverTimestamp()
        },{merge:true});
        ref.collection('devices').orderBy('last','desc').get().then(function(qs){
          if(qs.size>3){
            var extras=qs.docs.slice(3); /* keep 3 most-recent, sign out the rest */
            if(extras.some(function(x){return x.id===devId;})){
              showToast('This account is signed in on too many devices \u2014 signing out here. Max 3 devices.');
              setTimeout(function(){ firebase.auth().signOut(); }, 2600);
            }
          }
        }).catch(function(){});
      }catch(e){ /* best-effort Firestore write, ignore */ }
      /* ---- FIRST 1000 USERS: 7-day free Pro trial, granted once on true first sign-in ----
         u.metadata.creationTime === lastSignInTime is Firebase's own signal for "this is a
         brand-new account, not a returning login." The 1000-cap is enforced via an atomic
         Firestore transaction on a shared counter doc, so concurrent signups can't both
         slip in under the wire. Honest caveat: trialUntil is a client-computed timestamp,
         not server-signed — fine for a goodwill promo, not something to rely on for a
         security-critical deadline (consistent with the UTR-claim honor system already
         used for Pro activation elsewhere in this app). */
      if(u.metadata && u.metadata.creationTime===u.metadata.lastSignInTime && !lsGet('rw_trial_checked_'+u.uid)){
        lsSet('rw_trial_checked_'+u.uid,'1');
        db.runTransaction(function(t){
          var counterRef=db.collection('meta').doc('signupCounter');
          return t.get(counterRef).then(function(snap){
            var count=snap.exists? (snap.data().count||0) : 0;
            if(count<1000){
              t.set(counterRef,{count:count+1},{merge:true});
              var trialUntil=Date.now()+7*24*3600*1000;
              /* This grants a CLIENT-SIDE-ONLY trial — pro:true is never written here.
                 Any UI that shows this status MUST render it via rwStatusLabel()
                 (never a bare "Pro"/"PRO ACTIVE" string), so it's never mistaken for
                 a real paid/granted account. */
              t.set(ref,{trialUntil:trialUntil,trialGranted:true},{merge:true});
              return {granted:true, num:count+1};
            } else {
              t.set(ref,{trialGranted:true},{merge:true});
              return {granted:false};
            }
          });
        }).then(function(res){
          if(res.granted){ showToast('\ud83c\udf89 You\'re traveler #'+res.num+' \u2014 7 days of Pro, free, on us!'); xpAdd(20,'Founding traveler bonus'); }
        }).catch(function(){});
      }
      /* ref_signup tracking: log once when a referred new user creates account */
      (function(){
        try{
          var pendingUid=lsGet('rw_ref_pending_signup_uid');
          var isNew=!!(u.metadata && u.metadata.creationTime===u.metadata.lastSignInTime);
          if(isNew || pendingUid===u.uid){
            var _rc=rwRefActive();
            if(_rc && !lsGet('rw_ref_su_'+u.uid)){
              var _rw=rwRefLookup(_rc)||{};
              db.collection('refSignups').doc(_rc+'__'+u.uid).set({
                code:_rc, refName:_rw.name||'', refType:_rw.type||'',
                userUID:u.uid, at:firebase.firestore.FieldValue.serverTimestamp()
              }).then(function(){lsSet('rw_ref_su_'+u.uid,'1');lsSet('rw_ref_pending_signup_uid','');}).catch(function(){});
            }
          }
        }catch(e){ /* best-effort Firestore write, ignore */ }
      })();
      /* ---- ACCOUNT-BOUND PRO (the only source of truth) ---- */
      /* Always kill any previous session's listener first — this is the actual
         bug fix: an old onSnapshot from a prior login was never unsubscribed,
         so a late/cached callback could revive Pro moments after logout. */
      if(window._proUnsub){ try{ window._proUnsub(); }catch(e){ /* best-effort, ignore */ } window._proUnsub=null; }
      window._proUnsub = ref.onSnapshot(function(d){
        var cloudPro = d.exists && d.data().pro === true;
        var provOK = (parseInt(lsGet('rw_pro_temp')||'0',10) > Date.now()) && (lsGet('rw_pro_temp_uid')===u.uid);
        var trialUntil = d.exists ? d.data().trialUntil : null;
        var trialActive = !cloudPro && trialUntil && trialUntil > Date.now();
        var shouldBePro = cloudPro || provOK || trialActive;
        lsSet('rw_trial_until', trialActive? String(trialUntil) : '');
        /* Mirror Firestore's proMethod locally so rwStatusLabel() can tell a
           free partner/campaign-code grant (proMethod:'partner') apart from a
           real cash purchase or legacy founder grant. */
        lsSet('rw_pro_method', (cloudPro && d.data().proMethod) || '');
        if(cloudPro){ lsSet('rw_pro_temp',''); lsSet('rw_pro_temp_uid',''); }
        if(shouldBePro){
          if(!isPro){ isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',u.uid); refreshProUI();
            if(cloudPro){ showToast(rwStatusLabel().sentence+' \u2713'); closePay(); }
            else if(trialActive){ showToast('\u23f3 '+rwStatusLabel().sentence); } }
          isPro=true; lsSet('rw_pro_uid',u.uid); refreshProUI();
        } else {
          /* this account has NO pro \u2192 force-off regardless of any stale local flag */
          if(isPro){ isPro=false; lsSet('rwPro','0'); lsSet('rw_pro_uid',''); refreshProUI();
            if(trialUntil && trialUntil<=Date.now() && !cloudPro){ showToast('Your 7-day free trial has ended \u2014 upgrade anytime for \u20b9100'); } }
        }
      });
    } else {
      btn.style.display=''; av.style.display='none';
      /* AUTHORITATIVE: no signed-in user means no Pro, full stop — this runs on
         every sign-out regardless of how it happened (button, expiry, error). */
      if(window._proUnsub){ try{ window._proUnsub(); }catch(e){ /* best-effort, ignore */ } window._proUnsub=null; }
      if(isPro || lsGet('rwPro')==='1'){ wipeSession(); }
    }
  });
} catch(e){
  /* Sign-in, Pro sync and cloud backup are unavailable this session; saved
     trips, the planner, Ailon Tusk and the map all still work offline. */
  try{ console.warn('Firebase unavailable — running offline:', e && e.message); }catch(_){ /* best-effort diagnostic logging, ignore */ }
  db = null;
} else {
  /* Firebase not configured yet — app still fully works in device-only mode */
  document.addEventListener('DOMContentLoaded', function(){ var b=el('authBtn'); if(b) b.style.display='none'; });
}

var pendingVerificationEmail='', rwEmailAuthBusy=false;
function rwIsUnverifiedPasswordUser(u){
  return !!(u && !u.emailVerified && u.providerData && u.providerData.some(function(p){return p.providerId==='password';}));
}
function rwNativeAuthPlugin(){
  try{
    var c=window.Capacitor, nativePlatform=!!(c&&typeof c.isNativePlatform==='function'&&c.isNativePlatform());
    var p=c&&c.Plugins&&c.Plugins.FirebaseAuthentication;
    return nativePlatform&&p&&typeof p.signInWithGoogle==='function'?p:null;
  }catch(e){return null;}
}
function rwIsNativePlatform(){
  try{return !!(window.Capacitor&&typeof Capacitor.isNativePlatform==='function'&&Capacitor.isNativePlatform());}
  catch(e){return /RoamWiseApp/i.test(navigator.userAgent);}
}
function authError(m){var e=el('authErr');if(!m){e.style.display='none';return;}e.textContent=m;e.style.display='block';}
function rwRenderLastAuthProvider(){
  var box=el('authLastMethod'),label='';
  try{if(window.RWAuthSecurity)label=RWAuthSecurity.lastProvider();}catch(e){ /* storage unavailable */ }
  if(box){box.textContent=label?'Last used on this device: '+label:'';box.style.display=label?'':'none';}
}
function rwApplyAuthModeUI(){
  var creating=authMode==='up',a=el('authAction'),r=el('authToggleRow'),ref=el('authRefField'),rules=el('authPasswordRules'),pass=el('authPass'),forgot=el('authForgotRow');
  if(a)a.textContent=creating?'Create account':'Sign in';
  if(r)r.innerHTML=creating?'Already have an account? <a onclick="toggleAuthMode()">Sign in</a>':'New here? <a onclick="toggleAuthMode()">Create an account</a>';
  if(ref)ref.style.display=creating?'':'none';
  if(rules)rules.style.display=creating?'':'none';
  if(forgot)forgot.style.display=creating?'none':'';
  if(pass)pass.autocomplete=creating?'new-password':'current-password';
  rwRenderLastAuthProvider();
}
function rwShowEmailPane(){
  var ep=el('emailPane'),vp=el('emailVerifyPane');if(ep)ep.style.display='';if(vp)vp.style.display='none';
  var pass=el('authPass'),toggle=el('authPassToggle');if(pass)pass.type='password';if(toggle){toggle.textContent='Show';toggle.setAttribute('aria-label','Show password');}
  authMode='in';rwApplyAuthModeUI();
  authError('');
}
function rwShowVerificationPane(email,message){
  pendingVerificationEmail=email||pendingVerificationEmail||'your email';
  var ep=el('emailPane'),vp=el('emailVerifyPane'),out=el('authVerifyEmail'),msg=el('authVerifyMsg');
  if(ep)ep.style.display='none';if(vp)vp.style.display='';if(out)out.textContent=pendingVerificationEmail;
  if(msg)msg.textContent=message||'Open the verification link we sent, then return here and sign in.';
  el('authOverlay').classList.add('open');authError('');
}
function openAuth(){rwShowEmailPane();el('authOverlay').classList.add('open');}
function closeAuth(){el('authOverlay').classList.remove('open');authError('');rwShowEmailPane();}
function friendly(e){
  if(window.RWAuthSecurity)return RWAuthSecurity.friendlyMessage(e,authMode==='up'?'signup':'signin');
  var c=(e&&e.code)||'';
  if(c.indexOf('wrong-password')>-1||c.indexOf('invalid-credential')>-1)return 'Wrong email or password.';
  if(c.indexOf('email-already-in-use')>-1)return 'Account exists — sign in instead.';
  if(c.indexOf('weak-password')>-1)return 'Password needs at least 6 characters.';
  if(c.indexOf('invalid-email')>-1)return 'That email doesn’t look right.';
  if(c.indexOf('too-many-requests')>-1)return 'Too many tries — wait a minute.';
  if(c.indexOf('network')>-1)return 'No connection — check your internet and try again.';
  return (e&&e.message)||'Something went wrong.';
}
function rwGoogleError(e){
  var s=String((e&&e.code)||'')+' '+String((e&&e.message)||'');
  if(/cancel|canceled|cancelled/i.test(s))return 'Google sign-in was cancelled.';
  if(/developer|12500|10:|configuration/i.test(s))return 'Google sign-in is not configured for this app build yet. Update the app after Firebase Android setup is completed.';
  return friendly(e);
}
function loginGoogle(){
  if(!AUTH_READY)return showToast('Accounts not configured yet');
  var p=rwNativeAuthPlugin(),b=el('googleAuthBtn');
  if(p){
    if(b){b.disabled=true;b.setAttribute('aria-busy','true');}
    p.signInWithGoogle({skipNativeAuth:true}).then(function(r){
      var token=r&&r.credential&&r.credential.idToken;if(!token)throw new Error('Google did not return an ID token.');
      return firebase.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(token));
    }).then(function(){if(window.RWAuthSecurity)RWAuthSecurity.rememberProvider('google.com');closeAuth();showToast('Signed in with Google ✓');})
      .catch(function(e){authError(rwGoogleError(e));})
      .then(function(){if(b){b.disabled=false;b.removeAttribute('aria-busy');}});
    return;
  }
  if(rwIsNativePlatform())return authError('Google sign-in needs the latest RoamWise app build. Email sign-in works now.');
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(function(){if(window.RWAuthSecurity)RWAuthSecurity.rememberProvider('google.com');closeAuth();showToast('Signed in with Google ✓');})
    .catch(function(e){authError(rwGoogleError(e));});
}
function rwProviderIds(u){return (u&&u.providerData||[]).map(function(p){return p&&p.providerId;}).filter(Boolean);}
function rwLinkMessage(message,bad){var n=el('rwLinkedSignInMsg');if(n){n.textContent=message||'';n.style.color=bad?'#fb7185':'var(--t3)';}if(message)showToast(message);}
function rwRenderLinkedSignInMethods(){
  var status=el('rwLinkedSignInStatus'),passBox=el('rwLinkPasswordBox'),googleBtn=el('rwLinkGoogleBtn');if(!status)return;
  var u=(typeof firebase!=='undefined'&&firebase.auth&&firebase.auth().currentUser)||user;
  if(!u){status.textContent='Sign in to manage account methods.';if(passBox)passBox.style.display='none';if(googleBtn)googleBtn.style.display='none';return;}
  var ids=rwProviderIds(u),labels=[];if(ids.indexOf('google.com')>-1)labels.push('Google');if(ids.indexOf('password')>-1)labels.push('Email + password');
  status.innerHTML='<b>'+String(u.email||'Your account').replace(/[&<>]/g,'')+'</b><br>Linked now: '+(labels.join(' + ')||'verified Firebase identity')+' · UID '+String(u.uid||'').replace(/[&<>]/g,'');
  if(passBox)passBox.style.display=ids.indexOf('password')>-1?'none':'';
  if(googleBtn)googleBtn.style.display=ids.indexOf('google.com')>-1?'none':'';
}
function rwLinkFriendly(e){
  var c=String(e&&e.code||'');
  if(c.indexOf('requires-recent-login')>-1)return 'For security, sign out and sign in again, then link the method immediately.';
  if(c.indexOf('credential-already-in-use')>-1||c.indexOf('email-already-in-use')>-1)return 'That sign-in method belongs to a different legacy Firebase UID. RoamWise will not merge data silently; contact support for a reviewed account migration.';
  if(c.indexOf('provider-already-linked')>-1)return 'That sign-in method is already linked to this account.';
  if(c.indexOf('popup-closed')>-1||c.indexOf('cancelled-popup')>-1)return 'Google linking was cancelled.';
  return friendly(e);
}
function rwLinkEmailPassword(){
  var u=firebase.auth().currentUser,p=el('rwLinkPassword'),c=el('rwLinkPasswordConfirm');if(!u||!u.email)return rwLinkMessage('Sign in first.',true);
  var password=p&&p.value||'',confirmPassword=c&&c.value||'',strength=window.RWAuthSecurity&&RWAuthSecurity.passwordStatus(password);
  if(strength&&!strength.ok)return rwLinkMessage(strength.message,true);if(password!==confirmPassword)return rwLinkMessage('The two passwords do not match.',true);
  var credential=firebase.auth.EmailAuthProvider.credential(u.email,password);
  u.linkWithCredential(credential).then(function(){if(p)p.value='';if(c)c.value='';if(window.RWAuthSecurity)RWAuthSecurity.rememberProvider('password');rwRenderLinkedSignInMethods();rwLinkMessage('Email + password linked to the same RoamWise account ✓');}).catch(function(e){rwLinkMessage(rwLinkFriendly(e),true);});
}
function rwLinkGoogleProvider(){
  var u=firebase.auth().currentUser;if(!u)return rwLinkMessage('Sign in first.',true);var native=rwNativeAuthPlugin(),job;
  if(native){job=native.signInWithGoogle({skipNativeAuth:true}).then(function(r){var token=r&&r.credential&&r.credential.idToken;if(!token)throw new Error('Google did not return an ID token.');return u.linkWithCredential(firebase.auth.GoogleAuthProvider.credential(token));});}
  else if(rwIsNativePlatform())return rwLinkMessage('Update the RoamWise app before linking Google. Your current sign-in still works.',true);
  else job=u.linkWithPopup(new firebase.auth.GoogleAuthProvider());
  job.then(function(){if(window.RWAuthSecurity)RWAuthSecurity.rememberProvider('google.com');rwRenderLinkedSignInMethods();rwLinkMessage('Google linked to the same RoamWise account ✓');}).catch(function(e){rwLinkMessage(rwLinkFriendly(e),true);});
}
function toggleAuthMode(){
  authMode=authMode==='in'?'up':'in';rwApplyAuthModeUI();
  authError('');
}
function toggleAuthPassword(){
  var pass=el('authPass'),btn=el('authPassToggle');if(!pass||!btn)return;
  var revealing=pass.type==='password';pass.type=revealing?'text':'password';
  btn.textContent=revealing?'Hide':'Show';btn.setAttribute('aria-label',revealing?'Hide password':'Show password');
  pass.focus({preventScroll:true});
}
function rwSetAuthBusy(busy,label){
  var b=el('authEmailBtn'),s=el('authAction');if(b)b.disabled=!!busy;if(s)s.textContent=label||(authMode==='in'?'Sign in':'Create account');
}
// A failed verification send does NOT undo account creation. Preserve the UID.
function rwSendVerificationAndSignOut(u,email,message){
  var settings=window.RWAuthSecurity?RWAuthSecurity.actionCodeSettings():undefined;
  var send=u.sendEmailVerification(settings).catch(function(e){
    var code=String(e&&e.code||'');
    // Retry once with Firebase's default action URL only for an invalid continue URL.
    if(/unauthorized-continue-uri|invalid-continue-uri|missing-continue-uri/.test(code))return u.sendEmailVerification();
    throw e;
  });
  return send.then(function(){return {sent:true};},function(e){return {sent:false,error:e};})
    .then(function(result){return firebase.auth().signOut().catch(function(){}).then(function(){return result;});})
    .then(function(result){
      var display=result.sent
        ? message+' Firebase accepted the request; check inbox and spam. Delivery is not guaranteed.'
        : 'Your account exists, but Firebase could not send the verification link: '+friendly(result.error)
          +' Sign in with the SAME email and password to retry. Do not create another account.';
      rwShowVerificationPane(email,display);
      return {verificationPending:true,verificationSent:result.sent};
    });
}
function loginEmail(){
  if(!AUTH_READY)return showToast('Accounts not configured yet');
  var em=window.RWAuthSecurity?RWAuthSecurity.normaliseEmail(el('authEmail').value):el('authEmail').value.trim(),pw=el('authPass').value,creating=authMode==='up';
  if(!em||!pw)return authError('Enter email and password.');
  if(creating&&window.RWAuthSecurity){var strength=RWAuthSecurity.passwordStatus(pw);if(!strength.ok)return authError(strength.message);}
  if(!creating&&pw.length<6)return authError('Enter your complete password.');
  rwEmailAuthBusy=true;rwSetAuthBusy(true,creating?'Creating account…':'Signing in…');authError('');
  function afterPasswordSignIn(c){
    return c.user.reload().catch(function(){}).then(function(){
      if(rwIsUnverifiedPasswordUser(c.user))return rwSendVerificationAndSignOut(c.user,em,'Verification request accepted. Open the link and return to sign in.');
      if(window.RWAuthSecurity)RWAuthSecurity.rememberProvider('password');return c;
    });
  }
  var p=creating?firebase.auth().createUserWithEmailAndPassword(em,pw).then(function(c){
      try{track('signups');}catch(e){ /* analytics best-effort, ignore */ }
      try{if(rwRefActive())lsSet('rw_ref_pending_signup_uid',c.user.uid);}catch(e){ /* retry after verification */ }
      return rwSendVerificationAndSignOut(c.user,em,'Verification request accepted. Open the link and return to sign in.');
    }).catch(function(e){
      if(String(e&&e.code||'').indexOf('email-already-in-use')===-1)throw e;
      // Only the correct existing password recovers the original UID. Never merge
      // Google accounts, delete users, or award new referral credit on retries.
      return firebase.auth().signInWithEmailAndPassword(em,pw).then(afterPasswordSignIn).catch(function(loginError){
        var code=String(loginError&&loginError.code||'');
        if(/invalid-credential|wrong-password|user-not-found/.test(code))throw e;
        throw loginError;
      });
    }):firebase.auth().signInWithEmailAndPassword(em,pw).then(afterPasswordSignIn);
  p.then(function(r){if(!(r&&r.verificationPending)){closeAuth();showToast('Email verified — signed in ✓');}})
    .catch(function(e){if(String(e&&e.code||'').indexOf('email-already-in-use')>-1){authMode='in';rwApplyAuthModeUI();}authError(friendly(e));})
    .then(function(){rwEmailAuthBusy=false;rwSetAuthBusy(false);});
}
function resendVerification(){
  var em=el('authEmail').value.trim()||pendingVerificationEmail,pw=el('authPass').value;
  if(!em||!pw){rwShowEmailPane();return authError('Enter your email and password, then tap Sign in to resend the link.');}
  authMode='in';loginEmail();
}
function resetPassword(){
  if(!AUTH_READY)return showToast('Accounts not configured yet');
  var em=el('authEmail').value.trim();if(!em)return authError('Enter your email address first.');
  var settings=window.RWAuthSecurity?RWAuthSecurity.actionCodeSettings():undefined;
  firebase.auth().sendPasswordResetEmail(em,settings).then(function(){authError('');showToast('If that email has a password account, a reset link is on its way.');})
    .catch(function(e){authError(friendly(e));});
}
document.addEventListener('DOMContentLoaded',function(){
  ['authEmail','authPass','authRefCode'].forEach(function(id){var input=el(id);if(input)input.addEventListener('keydown',function(event){if(event.key==='Enter'){event.preventDefault();loginEmail();}});});
  try{
    var url=new URL(location.href);
    if(url.searchParams.get('auth')==='verified'){
      url.searchParams.delete('auth');history.replaceState({},'',url.pathname+url.search+url.hash);
      setTimeout(function(){openAuth();showToast('Email verified — sign in to continue.');},250);
    }
  }catch(e){ /* optional verification return route */ }
});
function wipeSession(){
  /* clear everything tied to the logged-in identity */
  ['rwPro','rw_pro_uid','rw_pro_temp','rw_pro_temp_uid'].forEach(function(k){ localStorage.removeItem(k); });
  /* AI provider keys are the USER'S OWN third-party credentials, not an
     entitlement tied to this account — wiping them on every sign-out meant
     re-pasting keys forever. They now survive sign-out by default; people on
     a shared device can opt into the old behaviour with rw_wipe_keys. */
  if(lsGet('rw_wipe_keys')==='1'){
    ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].forEach(function(p){ localStorage.removeItem('rwKey_'+p); });
    activeProv='smart'; lsSet('rwProv','smart');
  }
  isPro=false;
  try{ refreshProUI(); }catch(e){ /* best-effort, ignore */ }
  try{ if(el('settingsOverlay') && el('settingsOverlay').classList.contains('open')) openSettings(); }catch(e){ /* best-effort, ignore */ }
}
function authMenu(){
  if(!user){ openAuth(); return; }
  if(confirm('Sign out of RoamWise?\n\nThis clears Pro and your AI keys from this device. Your account keeps its Pro \u2014 sign back in to restore it.')){
    var uid=user.uid, devId=lsGet('rw_devid');
    /* de-register this device from the account */
    try{ if(uid&&devId&&db) db.collection('users').doc(uid).collection('devices').doc(devId).delete().catch(function(){}); }catch(e){ /* best-effort Firestore write, ignore */ }
    firebase.auth().signOut().then(function(){ wipeSession(); showToast('Signed out \u2014 Pro & keys cleared from this device'); });
  }
}
function deleteAccount(){
  if(!AUTH_READY || !user) return showToast('Not signed in');
  if(!confirm('Permanently delete your RoamWise account?\n\nThis removes your profile and cloud data. A paid Pro unlock CANNOT be restored after deletion.')) return;
  if(!confirm('Really sure? This cannot be undone.')) return;
  var uid = user.uid;
  db.collection('users').doc(uid).delete().catch(function(){}).then(function(){
    return user.delete();
  }).then(function(){
    wipeSession();
    showToast('Account deleted. Safe travels \ud83c\udffd\ufe0f');
  }).catch(function(e){
    if((e&&e.code)==='auth/requires-recent-login'){
      showToast('For security, sign in again first, then delete within a few minutes.');
      firebase.auth().signOut();
    } else showToast('Could not delete: '+((e&&e.message)||'try again'));
  });
}
function requireLogin(){
  if(!AUTH_READY) return true; /* device-only mode */
  if(user) return true;
  openAuth(); showToast('Sign in first \u2014 so Pro unlocks on all your devices');
  return false;
}

/* Account drawer's own auth listener — originally a standalone line further
   down app.js (right after the Phase 5b adaptive-shell move comment); moved
   here verbatim since it registers on the same onAuthStateChanged event as
   the block above and drawerAccount (js/ui/adaptive-shell.js) is already a
   global by the time this fires. */
if (AUTH_READY) try{ firebase.auth().onAuthStateChanged(drawerAccount); }catch(e){ /* auth best-effort, ignore */ }
