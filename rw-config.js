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
    performanceV5: true,
    audioTheme: true
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
   app.css now suppresses the old splash at FIRST PAINT. This block also removes
   the dead #intro node synchronously before app.js gets a chance to run its old
   timer, then places the cinematic violet/pink preboot veil until V6 mounts. */
(function(){
  var seen = false;
  try { seen = sessionStorage.getItem('rw_intro') === '1'; } catch (_) {}
  window.__RW_INTRO_SHOULD_SHOW = !seen;

  if (!seen) {
    try { sessionStorage.setItem('rw_intro','1'); } catch (_) {}
  }

  if (seen) document.documentElement.classList.add('rw-opening-skip');

  var legacy = document.getElementById('intro');
  if (legacy) legacy.remove();

  var boot = document.createElement('style');
  boot.id = 'rw-opening-boot-style';
  boot.textContent = '#intro,.intro{display:none!important;visibility:hidden!important;opacity:0!important}'+
    'html:not(.rw-opening-skip):not(.rw-opening-mounted) body:before{content:"";position:fixed;inset:0;z-index:2147482999;background:linear-gradient(180deg,transparent 0 67%,rgba(8,2,14,.76) 83%,#08020e 100%),#16051e url("assets/roamwise-opening-first.webp") center/cover no-repeat;pointer-events:none}';
  document.head.appendChild(boot);
})();

/* Platform modules stay individually switchable. The opening runtime is loaded
   FIRST, high-priority and ordered, so the approved cinematic screen mounts as
   soon as its tiny JS arrives instead of waiting behind unrelated modules. */
(function(){
  var f=(window.RW_CONFIG&&window.RW_CONFIG.features)||{};
  var build='rw-v121-hollywood-smooth-read';

  function load(src, opening){
    if(document.querySelector('script[data-rw-v5="'+src+'"]')) return;
    var s=document.createElement('script');
    s.src=src+(src.indexOf('?')===-1?'?':'&')+'v='+build;
    s.dataset.rwV5=src;
    if(opening){
      s.async=false;
      if('fetchPriority' in s) s.fetchPriority='high';
    } else {
      s.async=true;
    }
    document.head.appendChild(s);
  }

  /* Audio must register before the opener. Dynamic scripts marked async=false
     execute in insertion order, giving the intro one authoritative sound gate. */
  if(f.audioTheme) load('js/audio/focus.js', true);
  if(f.audioTheme) load('platform-v5/audio-only.js', true);
  if(f.audioTheme) load('js/audio/cues.js', true);
  if(f.atlasIntroV5) load('platform-v5/atlas-shinobi.js', true);
  if(f.performanceV5) load('platform-v5/performance.js', false);
  if(f.privateLearningConsent) load('platform-v5/learning-consent.js', false);
  if(f.cinematicMapV51) load('platform-v5/cinematic-map-v51.js', false);
})();
