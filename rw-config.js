/* ============================================================================
   RoamWise runtime config — THE SWITCH.
   Loaded BEFORE app.js. Change one value here to move between backends.
   Nothing else in the app needs to change, and you can flip back instantly.
   ========================================================================= */
window.RW_CONFIG = {
  /* firebase = current production; worker = API/AI/payment worker; auto = worker
     when configured, otherwise the existing Firebase/device path. */
  backend: 'firebase',
  workerUrl: '',
  features: {
    beacon: true,
    realms: true,
    passport: true,
    contest: true,
    webPush: false,
    atlasIntroV5: true,
    cinematicMapV51: true,
    privateLearningConsent: true,
    performanceV5: true
  },
  intro: {
    /* Canonical opening film. Tap/escape remains available to skip. */
    cinematicDurationMs: 6800
  },
  maps: {
    renderer: 'maplibre',
    /* OpenFreeMap is the zero-key default renderer. It is a public service, not
       an SLA. Set styleUrl to your own PMTiles/MapLibre style later for full
       infrastructure independence without changing itinerary code. */
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    maplibreJs: 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js',
    maplibreCss: 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css',
    pmtilesUrl: ''
  },
  vapidKey: ''
};

window.rwApi = function(path){
  var c = window.RW_CONFIG || {};
  if ((c.backend === 'worker' || c.backend === 'auto') && c.workerUrl) {
    return c.workerUrl.replace(/\/+$/,'') + '/' + String(path||'').replace(/^\/+/,'');
  }
  return null;
};

/* Canonical startup hand-off.
   rw-config executes before app.js, so it captures whether THIS browser session
   has already seen the intro, then reserves the existing rw_intro key before the
   legacy app can schedule its old loader. The old #intro is hidden at parse time,
   which prevents the old and new loaders from ever cross-fading on screen. */
(function(){
  var seen = false;
  try { seen = sessionStorage.getItem('rw_intro') === '1'; } catch (_) {}
  window.__RW_INTRO_SHOULD_SHOW = !seen;

  if (!seen) {
    try { sessionStorage.setItem('rw_intro','1'); } catch (_) {}
  }

  if (seen) document.documentElement.classList.add('rw-opening-skip');

  var boot = document.createElement('style');
  boot.id = 'rw-opening-boot-style';
  boot.textContent = '#intro{display:none!important}'+
    'html:not(.rw-opening-skip):not(.rw-opening-mounted) body:before{content:"";position:fixed;inset:0;z-index:2147482999;background:radial-gradient(circle at 50% 18%,rgba(118,45,255,.36),transparent 38%),radial-gradient(circle at 66% 74%,rgba(255,49,164,.23),transparent 38%),linear-gradient(145deg,#130621,#260824 50%,#10051b);pointer-events:none}';
  document.head.appendChild(boot);
})();

/* Platform modules stay individually switchable. The atlas-shinobi path is now
   the ONE canonical opening runtime; it no longer draws a second vector atlas. */
(function(){
  var f=(window.RW_CONFIG&&window.RW_CONFIG.features)||{};
  var list=[];
  if(f.performanceV5) list.push('platform-v5/performance.js');
  if(f.atlasIntroV5) list.push('platform-v5/atlas-shinobi.js');
  if(f.privateLearningConsent) list.push('platform-v5/learning-consent.js');
  if(f.cinematicMapV51) list.push('platform-v5/cinematic-map-v51.js');
  list.forEach(function(src){
    if(document.querySelector('script[data-rw-v5="'+src+'"]')) return;
    var s=document.createElement('script');
    s.src=src;
    s.async=true;
    s.dataset.rwV5=src;
    if(src.indexOf('atlas-shinobi')!==-1 && 'fetchPriority' in s) s.fetchPriority='high';
    document.head.appendChild(s);
  });
})();
