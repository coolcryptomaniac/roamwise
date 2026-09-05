// @ts-nocheck
/* ==================== ADSENSE (gated) + WHATSAPP FAB (gated) ====================
   Moved verbatim from app.js (modularization round 5). Unlike the true
   boot IIFEs handled with a deferred-init pattern in
   js/ui/currency-budget.js and js/ui/dest-autocomplete.js, this IIFE
   doesn't unconditionally assume the DOM is fully parsed — it already
   defensively checks `document.readyState` itself and defers to
   `DOMContentLoaded` when needed (see the comment inline below), and
   ensureWaButton() only ever touches elements it creates itself or
   checks for by id first. So it's safe to run this file as a plain
   top-level script anywhere in the load order: if loaded early (this
   file loads as a plain synchronous script, before app.js, which is
   deferred), it simply takes the "wait for DOMContentLoaded" branch
   instead of the "already loaded, run now" branch — same code, same
   outcome, verified with a Playwright pass. */
/* ===== ADSENSE (gated) + WHATSAPP (gated) ===== */
var ADSENSE_ID='ca-pub-4943859484482348'; /* live */
var ADSENSE_SLOT=''; /* set in admin Config once you create an ad unit */
// AFF_BOOKING and stayUrl moved to js/booking/affiliate-links.js
var WA_NUMBER='', WA_CHANNEL='', WA_GROUP='';
(function(){
  /* AdSense loads on the WEBSITE ONLY — never inside the app WebView.
     AdSense-for-Content is websites-only by policy (AdMob is the in-app
     product); serving it inside a wrapper app risks the entire AdSense
     account, which also carries the website's revenue. Detection: the
     native app injects the window.RW bridge before the page loads, and
     Play builds set PLAY_MODE=true — either signal disables ads. Deferred
     to DOMContentLoaded because PLAY_MODE is declared later in this file
     (var hoisting would make an immediate check read undefined). */
  function loadAds(){
    var inApp = !!window.RW || (typeof PLAY_MODE!=='undefined' && PLAY_MODE);
    if(ADSENSE_ID && !inApp){
      var s=document.createElement('script'); s.async=true;
      s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ADSENSE_ID;
      s.crossOrigin='anonymous'; document.head.appendChild(s);
      /* A display unit needs BOTH data-ad-client and data-ad-slot. Without a
         slot id the <ins> can never fill, which looks identical to "not
         approved yet" and wastes days of debugging. Set ADSENSE_SLOT in the
         admin Config tab once the ad unit exists in your AdSense account. */
      var slot = (typeof ADSENSE_SLOT!=='undefined' && ADSENSE_SLOT) ? ADSENSE_SLOT : '';
      document.querySelectorAll('.rw-ad').forEach(function(a){
        if(slot) a.setAttribute('data-ad-slot', slot);
        if(!a.getAttribute('data-ad-slot')){ return; }  /* skip: would never fill */
        a.style.display='block';
        try{ (adsbygoogle=window.adsbygoogle||[]).push({}); }catch(e){ /* best-effort, ignore */ }
      });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', loadAds); else loadAds();
  ensureWaButton();
})();
/* Global + idempotent so remote config can create it after the fact. */
function ensureWaButton(){
  try{ rwRefCapture(); rwRefStickUrl(); }catch(e){ /* best-effort, ignore */ }
  try{ setTimeout(rwBasketBadge, 600); }catch(e){ /* best-effort, ignore */ }
  try{ setTimeout(rwConfigSyncAll, 1200); }catch(e){ /* best-effort, ignore */ }
  if(!WA_NUMBER || document.getElementById('waFab')) return;
  var w=document.createElement('a');
  w.id='waFab';
  w.href='https://wa.me/'+WA_NUMBER.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent('Hi RoamWise!');
  w.target='_blank';
  w.style.cssText='position:fixed;right:14px;bottom:86px;z-index:200;width:48px;height:48px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 6px 20px rgba(0,0,0,.4);text-decoration:none';
  w.textContent='\ud83d\udcac';
  document.body.appendChild(w);
}
