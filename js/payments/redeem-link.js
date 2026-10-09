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
  var showTest=window.rwShowRedeemTest=function(){
      try{ var u=new URL(location.href); u.searchParams.delete('redeem'); history.replaceState(null,'',u.pathname+u.search+u.hash); }catch(e){}
      var ov=document.createElement('div');
      ov.style.cssText='position:fixed;inset:0;z-index:5000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:20px';
      ov.innerHTML='<div role="dialog" aria-modal="true" style="max-width:360px;width:100%;background:#14141a;color:#F2EFE6;border:1px solid #E8BA6C;border-radius:18px;padding:24px;text-align:center;font-family:inherit"><div style="font-size:46px">\u2705</div><div style="font-size:19px;font-weight:800;margin:8px 0">It worked!</div><div style="font-size:13px;line-height:1.5;opacity:.85;margin-bottom:16px">Your QR scan reached RoamWise. This was a test pass, so no Founder Pro was added and nothing was saved or changed on your account.</div><button type="button" style="width:100%;border:0;border-radius:12px;padding:12px;font:800 14px inherit;color:#0B1020;background:linear-gradient(95deg,#C8913E,#E8BA6C);cursor:pointer">Close</button></div>';
      ov.querySelector('button').onclick=function(){ ov.remove(); };
      document.body.appendChild(ov);
    };
  var code='';
  try { code=String(new URLSearchParams(location.search).get('redeem')||'').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32); } catch(e){ code=''; }
  if(!code) return;
  /* ?redeem=open (or 1) is the generic poster QR: open the empty redeem form, no code pre-filled. */
  if(code==='OPEN'||code==='1') code='';
  /* Public TEST code: proves a QR/link scan reaches RoamWise. It is not in the database, grants nothing,
     needs no sign-in, and touches no Firebase code at all. */
  if(code==='NMIMS-TEST-0000-DEMO'){
    if(document.readyState==='complete') setTimeout(showTest,300); else window.addEventListener('load',function(){ setTimeout(showTest,300); });
    return;
  }
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
      if(signedIn){ window.__rwPendingRedeem=code||''; try{ openPartnerRedeem(); }catch(e){} }
      else { try{ showToast('Sign in to RoamWise first, then open this link again to redeem your code.'); }catch(e){} }
      return;
    }
    if(tries<40) setTimeout(attempt,500); else clean();
  }
  window.addEventListener('load',function(){ setTimeout(attempt,600); });
})();
