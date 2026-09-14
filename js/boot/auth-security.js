// @ts-nocheck
/* Small, testable authentication policy helpers. This file intentionally does
   not query whether an email exists: revealing that before authentication is
   account enumeration. Provider hints are stored only after a successful
   sign-in on this device. */
var RWAuthSecurity = (function(){
  var LAST_PROVIDER_KEY = 'rw_auth_last_provider';
  var RETURN_URL = 'https://www.roamwise.co.in/?auth=verified';

  function normaliseEmail(value){ return String(value || '').trim().toLowerCase(); }

  function passwordStatus(value){
    var password = String(value || '');
    if(password.length < 10) return {ok:false, message:'Use at least 10 characters.'};
    if(!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)){
      return {ok:false, message:'Include at least one letter and one number.'};
    }
    return {ok:true, message:'Strong enough for a RoamWise account.'};
  }

  function providerLabel(providerId){
    if(providerId === 'google.com' || providerId === 'google') return 'Google';
    if(providerId === 'password' || providerId === 'email') return 'Email and password';
    if(providerId === 'phone') return 'Phone';
    return '';
  }

  function rememberProvider(providerId, storage){
    var label = providerLabel(providerId);
    if(!label) return '';
    try{ (storage || window.localStorage).setItem(LAST_PROVIDER_KEY, providerId); }catch(e){ /* private storage */ }
    return label;
  }

  function lastProvider(storage){
    try{ return providerLabel((storage || window.localStorage).getItem(LAST_PROVIDER_KEY)); }
    catch(e){ return ''; }
  }

  function rememberUserProvider(user, storage){
    var providers = user && user.providerData || [];
    if(providers.some(function(p){ return p && p.providerId === 'google.com'; })) return rememberProvider('google.com', storage);
    if(providers.some(function(p){ return p && p.providerId === 'password'; })) return rememberProvider('password', storage);
    return '';
  }

  function friendlyMessage(error, context){
    var code = String(error && error.code || '');
    var creating = context === 'signup';
    if(code.indexOf('email-already-in-use') > -1){
      return 'This email already belongs to a RoamWise account. Try Google if you joined with Google; otherwise choose Sign in or reset your password.';
    }
    if(code.indexOf('account-exists-with-different-credential') > -1){
      return 'This email already uses another sign-in method. Sign in with the method you used first; you can link methods only after proving access.';
    }
    if(code.indexOf('wrong-password') > -1 || code.indexOf('invalid-credential') > -1 || code.indexOf('user-not-found') > -1){
      return 'We could not sign you in. Try Google if that is how you joined, or reset your password. For privacy, RoamWise does not reveal registered emails.';
    }
    if(code.indexOf('weak-password') > -1) return 'Choose a stronger password: at least 10 characters with a letter and a number.';
    if(code.indexOf('invalid-email') > -1) return 'That email address does not look valid.';
    if(code.indexOf('too-many-requests') > -1) return 'Too many attempts. Wait a few minutes, then try again.';
    if(code.indexOf('network') > -1) return 'No connection. Check your internet and try again.';
    if(code.indexOf('popup-closed') > -1 || code.indexOf('cancelled-popup') > -1) return 'Google sign-in was cancelled.';
    return creating ? 'We could not create the account. Please try again.' : 'Something went wrong. Please try again.';
  }

  function actionCodeSettings(){ return {url:RETURN_URL, handleCodeInApp:false}; }

  function safeContinueUrl(value){
    try{
      var url = new URL(value || RETURN_URL, 'https://www.roamwise.co.in');
      if(url.protocol !== 'https:' || (url.hostname !== 'www.roamwise.co.in' && url.hostname !== 'roamwise.co.in')) return RETURN_URL;
      return url.href;
    }catch(e){ return RETURN_URL; }
  }

  return {
    LAST_PROVIDER_KEY: LAST_PROVIDER_KEY,
    RETURN_URL: RETURN_URL,
    normaliseEmail: normaliseEmail,
    passwordStatus: passwordStatus,
    providerLabel: providerLabel,
    rememberProvider: rememberProvider,
    lastProvider: lastProvider,
    rememberUserProvider: rememberUserProvider,
    friendlyMessage: friendlyMessage,
    actionCodeSettings: actionCodeSettings,
    safeContinueUrl: safeContinueUrl
  };
})();
