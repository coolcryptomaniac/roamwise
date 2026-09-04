// @ts-nocheck
/* ==================== CORE: GLOBAL ERROR GUARD ====================
   Extracted verbatim from the very top of app.js (Phase 6b modularization).
   Loaded FIRST — before every other js/* module and before app.js — rather
   than folded into the js/boot/init.js "runs last" bundle with the rest of
   the boot sequence. This is a deliberate exception to "consolidate boot
   glue into one last-loaded file": the whole point of a global error guard
   (billion-download resilience — a single unexpected JS error should never
   freeze or white-screen the app) is to be installed before ANYTHING else
   can throw, so it can catch stray errors + unhandled promise rejections
   from every module's own load, not just from app.js's tail end onward.
   Registering it last (alongside remote config / PWA / push init) would
   leave every js/core, js/data, js/pricing, js/audio, js/voice, js/booking,
   js/social, js/copilot, js/itinerary, js/ui, js/game and js/misc module's
   load completely unprotected — a strictly worse outcome than today, where
   app.js (and this guard with it) already loads dead last among the real
   module chain. Silent by design — we don't spam the user with technical
   errors. */
window.addEventListener('error', function(ev){
  try{ /* swallow benign resource/load errors; log nothing user-facing */ }catch(e){}
}, true);
window.addEventListener('unhandledrejection', function(ev){
  try{ if(ev && ev.preventDefault) ev.preventDefault(); }catch(e){}
});
