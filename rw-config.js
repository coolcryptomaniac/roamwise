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
    /* First page load only. The intro remains tap-to-skip at any moment. */
    cinematicDurationMs: 6300
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

/* The legacy monolithic app still owns the intro timer. Keep its existing
   session semantics, but widen only the old 2600ms trailer timeout so the
   cinematic atlas can finish. This bridge self-removes after intercepting that
   one timer, so every other setTimeout in the app remains native. */
(function(){
  var nativeSetTimeout = window.setTimeout;
  try {
    if (sessionStorage.getItem('rw_intro')) {
      var existing = document.getElementById('intro');
      if (existing) existing.remove();
      return;
    }
  } catch (_) {}

  var active = true;
  var duration = Number((((window.RW_CONFIG||{}).intro||{}).cinematicDurationMs)||6300);
  window.setTimeout = function(fn, delay){
    if (active && delay === 2600 && typeof fn === 'function' && fn.name === 'killIntro') {
      active = false;
      window.setTimeout = nativeSetTimeout;
      return nativeSetTimeout(fn, duration);
    }
    return nativeSetTimeout.apply(window, arguments);
  };
  nativeSetTimeout(function(){
    if (active) {
      active = false;
      window.setTimeout = nativeSetTimeout;
    }
  }, 15000);
})();

/* Platform V5 is intentionally modular. These scripts are tiny and can be
   disabled individually above; heavyweight MapLibre itself is NOT downloaded
   until the traveller actually opens a Cinematic map. */
(function(){
  var f=(window.RW_CONFIG&&window.RW_CONFIG.features)||{};
  var list=[];
  if(f.performanceV5) list.push('platform-v5/performance.js');
  if(f.atlasIntroV5) list.push('platform-v5/atlas-shinobi.js');
  if(f.privateLearningConsent) list.push('platform-v5/learning-consent.js');
  if(f.cinematicMapV51) list.push('platform-v5/cinematic-map-v51.js');
  list.forEach(function(src){
    if(document.querySelector('script[data-rw-v5="'+src+'"]')) return;
    var s=document.createElement('script');s.src=src;s.async=true;s.dataset.rwV5=src;
    if(src.indexOf('atlas-shinobi')!==-1 && 'fetchPriority' in s) s.fetchPriority='high';
    document.head.appendChild(s);
  });
})();
