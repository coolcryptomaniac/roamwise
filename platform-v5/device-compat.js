/* Cross-device auth/payment compatibility. One auth transaction at a time. */
(function(){'use strict';
function isApp(){
  try{if(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform())return true}catch(_){}
  var h=String(location.hostname||'').toLowerCase();
  return location.protocol==='file:'||location.protocol==='capacitor:'||h==='localhost'||!!window.RW||/RoamWiseApp|; wv\)/i.test(navigator.userAgent);
}
function mobile(){return /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)}
function show(msg){try{if(typeof showToast==='function')showToast(msg);else alert(msg)}catch(e){}}
function helpLink(){return 'https://www.roamwise.co.in/help/payment-login.html'}
function focusEmail(){try{var em=document.getElementById('authEmail');if(em){em.focus({preventScroll:false});em.scrollIntoView({block:'center',behavior:'smooth'})}}catch(e){}}
function setAuthMessage(msg,bad){
  var e=document.getElementById('authErr');
  if(!e){show(msg);return}
  e.textContent=msg;
  e.style.display='block';
  if(!bad){e.style.color='#d7c8ff';e.style.background='rgba(126,82,255,.10)'}
}
function injectLayout(){
  if(document.getElementById('rwDeviceCompatCss'))return;
  var st=document.createElement('style');
  st.id='rwDeviceCompatCss';
  st.textContent='\
html,body{max-width:100%;overflow-x:hidden}\
#siteSearch{padding-top:calc(12px + env(safe-area-inset-top))!important}\
@media(max-width:600px){\
 .nav-inner{gap:5px!important;padding-left:max(8px,env(safe-area-inset-left))!important;padding-right:max(8px,env(safe-area-inset-right))!important}\
 .nav-right{gap:2px!important;min-width:0!important}\
 #modeChip{display:none!important}\
 .sw-tab.inactive{display:none!important}\
 .sw-tabs{margin-right:0!important;padding:3px!important;flex:0 0 auto!important}\
 .sw-tab{padding:6px 10px!important}\
 #authBtn{display:none!important}\
 .nav-ic,.hamb{flex:0 0 auto!important}\
 .modal{max-width:calc(100vw - 22px)!important}\
 #authOverlay .modal-body{padding-bottom:calc(18px + env(safe-area-inset-bottom))!important}\
}\
@media(max-width:410px){\
 #xpChipTxt{display:none!important}\
 .xp-chip{gap:0!important;padding:4px 7px!important}\
 .sw-tab{padding:6px 8px!important}\
}\
@media(max-width:360px){\
 .nav-ic{display:none!important}\
 .btn-pro{padding-left:9px!important;padding-right:9px!important}\
}\
';
  document.head.appendChild(st);
}
function boot(){
  injectLayout();
  if(typeof firebase==='undefined'||!firebase.auth){setTimeout(boot,200);return}
  var auth=firebase.auth();
  var lockUntil=0;
  function lock(){
    var now=Date.now();
    if(window.__RW_AUTH_INFLIGHT||now<lockUntil)return false;
    window.__RW_AUTH_INFLIGHT=true;lockUntil=now+12000;return true;
  }
  function unlock(){window.__RW_AUTH_INFLIGHT=false;lockUntil=0}
  function err(e){
    unlock();
    var c=e&&e.code||'';
    if(c==='auth/cancelled-popup-request')return setAuthMessage('A sign-in request is already open. Tap Google only once and wait for it to return.',true);
    if(c==='auth/unauthorized-domain')return setAuthMessage('Google sign-in needs this app origin added in Firebase Auth authorized domains. Email sign-in works meanwhile.',true);
    try{if(typeof authError==='function')authError((typeof friendly==='function'?friendly(e):(e.message||c)));else setAuthMessage(e.message||c||'Sign-in failed.',true)}catch(x){setAuthMessage('Sign-in failed. You can continue with email.',true)}
  }
  function googleProvider(){var p=new firebase.auth.GoogleAuthProvider();if(p.setCustomParameters)p.setCustomParameters({prompt:'select_account'});return p}
  function done(){unlock();try{if(typeof closeAuth==='function')closeAuth()}catch(e){}show('Signed in ✓')}
  function google(){
    if(!lock())return setAuthMessage('Google sign-in is already opening — please wait.',false);
    var p=googleProvider();
    try{
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function(){
        /* Redirect is deliberately the only mobile/native flow. It prevents the
           competing popup race seen in Android WebView and is Firebase's mobile-safe path. */
        if(isApp()||mobile())return auth.signInWithRedirect(p);
        return auth.signInWithPopup(p).then(done).catch(function(e){
          var c=e&&e.code||'';
          if(c==='auth/popup-blocked'||c==='auth/operation-not-supported-in-this-environment')return auth.signInWithRedirect(p);
          throw e;
        });
      }).catch(err);
    }catch(e){err(e)}
  }
  function unavailable(kind){
    unlock();
    setAuthMessage((kind==='apple'?'Apple':'Facebook')+' sign-in is not enabled yet. Use Google or email for now.',false);
    focusEmail();
  }
  window.loginGoogle=google;
  window.loginSocial=function(k){if(k==='google')return google();return unavailable(k)};

  /* Consume a returning redirect once and clear the global guard. */
  try{auth.getRedirectResult().then(function(r){unlock();if(r&&r.user)done()}).catch(err)}catch(e){unlock()}

  if(typeof window.payVia==='function'){
    var oldPay=window.payVia;
    window.payVia=function(app){
      if(isApp()&&!(typeof PLAY_MODE!=='undefined'&&PLAY_MODE&&window.RWBilling)){
        var amt=encodeURIComponent(String(window.UPI_AMT||'100'));
        var u='https://www.roamwise.co.in/pay/?amount='+amt+'&method='+encodeURIComponent(app||'upi');
        try{if(typeof openExternally==='function')openExternally(u);else if(window.RW&&RW.openExternal)RW.openExternal(u);else window.open(u,'_blank','noopener')}catch(e){window.location.href=u}
        show('Opening secure payment handoff in your device browser…');return;
      }
      return oldPay.apply(this,arguments);
    };
  }
  if(typeof window.openGumroad==='function'){
    var oldG=window.openGumroad;
    window.openGumroad=function(){
      if(isApp()){
        var u='';try{u=localStorage.getItem('rw_gum_url')||''}catch(e){}
        if(!u)return oldG();
        try{if(typeof openExternally==='function')openExternally(u);else window.open(u,'_blank','noopener')}catch(e){window.open(u,'_blank','noopener')}
        return false;
      }
      return oldG.apply(this,arguments);
    };
  }
  inject();
}
function inject(){
  var providers=document.querySelector('#authOverlay .auth-providers');
  if(providers){
    Array.prototype.forEach.call(providers.querySelectorAll('.auth-btn'),function(b){
      var t=(b.textContent||'').toLowerCase();
      if(t.indexOf('facebook')>=0||t.indexOf('apple')>=0)b.style.display='none';
    });
    if(!providers.querySelector('.rw-provider-note')){
      var n=document.createElement('div');n.className='rw-provider-note';n.textContent='Facebook & Apple sign-in are coming soon — use Google or email.';n.style.cssText='text-align:center;color:var(--t3,#888);font-size:11px;line-height:1.45;margin:4px 4px 2px';providers.appendChild(n);
    }
  }
  [['authOverlay','Having trouble signing in?'],['payOverlay','Payment not opening?']].forEach(function(x){
    var b=document.querySelector('#'+x[0]+' .modal-body');if(!b||b.querySelector('.rw-device-help'))return;
    var a=document.createElement('a');a.className='rw-device-help';a.href=helpLink();a.target='_blank';a.rel='noopener';a.textContent=x[1]+' Open self-help guide';a.style.cssText='display:block;text-align:center;margin:14px 0 2px;color:#bf8cff;font-size:12px';b.appendChild(a);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();