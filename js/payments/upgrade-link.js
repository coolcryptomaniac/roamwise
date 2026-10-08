// @ts-nocheck
/* ============================================================================
   js/payments/upgrade-link.js — open the Pro paywall from a link
   ============================================================================
   The RoamWise WhatsApp bot answers "PRO" with  https://www.roamwise.co.in/?upgrade=1 .
   This opens the normal paywall (openPay) once the user is signed in. Nothing else
   changes: price, order creation and entitlement are still done by the existing
   Cashfree flow (worker /cashfree/order, validated server-side). The bot never
   handles money.

   Behaviour:
     - ?upgrade=1 present and user signed in  -> openPay()
     - ?upgrade=1 present and signed out      -> toast asking to sign in; no paywall
     - param is removed from the address bar either way (no re-open on refresh)
   ========================================================================= */
(function(){
  var wants = false;
  try { wants = new URLSearchParams(location.search).get('upgrade') === '1'; } catch (e) { wants = false; }
  if (!wants) return;

  function cleanUrl(){
    try {
      var u = new URL(location.href);
      u.searchParams.delete('upgrade');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* cosmetic only */ }
  }
  function uid(){
    try { var u = firebase.auth().currentUser; return u && u.uid ? u.uid : ''; } catch (e) { return ''; }
  }

  var tries = 0;
  function attempt(){
    tries++;
    var authReady = (typeof AUTH_READY !== 'undefined') && AUTH_READY;
    if (authReady && typeof openPay === 'function') {
      cleanUrl();
      if (uid()) { try { openPay(); } catch (e) { /* paywall is best-effort */ } }
      else { try { showToast('Sign in to RoamWise first, then tap Pro to upgrade.'); } catch (e) { /* toast optional */ } }
      return;
    }
    if (tries < 40) setTimeout(attempt, 500);   // wait up to ~20s for the app and auth
    else cleanUrl();
  }
  window.addEventListener('load', function(){ setTimeout(attempt, 600); });
})();
