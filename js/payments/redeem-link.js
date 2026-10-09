// @ts-nocheck
/* ============================================================================
   js/payments/redeem-link.js - open "Redeem a partner code" from a link/QR
   ============================================================================
   Coupon cards and QR codes carry  https://www.roamwise.co.in/?redeem=NMIMS-STU-0123-XXXXXXXXXXXXX
   The code is only pre-filled in the existing redeem form. Nothing is redeemed until the person is
   signed in and presses the button, and every check (one-time, expiry, verified email, already-Pro)
   is still made by the existing flow and Firestore rules. The param is removed from the address bar.
   ========================================================================= */
(function(){
  var code='';
  try { code=String(new URLSearchParams(location.search).get('redeem')||'').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32); } catch(e){ code=''; }
  if(!code) return;
  function clean(){
    try { var u=new URL(location.href); u.searchParams.delete('redeem'); history.replaceState(null,'',u.pathname+u.search+u.hash); } catch(e){}
  }
  var tries=0;
  function attempt(){
    tries++;
    var ready=(typeof AUTH_READY!=='undefined')&&AUTH_READY;
    if(ready&&typeof openPartnerRedeem==='function'){
      clean();
      var signedIn=false; try{ signedIn=!!(firebase.auth().currentUser&&firebase.auth().currentUser.uid); }catch(e){}
      if(signedIn){ window.__rwPendingRedeem=code; try{ openPartnerRedeem(); }catch(e){} }
      else { try{ showToast('Sign in to RoamWise first, then open this link again to redeem your code.'); }catch(e){} }
      return;
    }
    if(tries<40) setTimeout(attempt,500); else clean();
  }
  window.addEventListener('load',function(){ setTimeout(attempt,600); });
})();
