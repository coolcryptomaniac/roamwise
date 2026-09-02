/* ============================================================================
   RoamWise runtime config — THE SWITCH.
   Loaded BEFORE app.js. Change one value here to move between backends.
   ========================================================================= */
window.RW_CONFIG = {
  backend: 'firebase',
  workerUrl: '',
  features: {
    beacon: true,
    realms: true,
    passport: true,
    contest: true,
    webPush: false,
    atlasIntroV5: true,
    audioTheme: true,
    openingEnhance: true,
    deviceCompat: true,
    cinematicMapV51: true,
    privateLearningConsent: true,
    performanceV5: true
  },
  intro: {
    cinematicDurationMs: 6800,
    storageKey: 'rw_opening_seen_v61'
  },
  maps: {
    renderer: 'maplibre',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    maplibreJs: 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js',
    maplibreCss: 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css',
    pmtilesUrl: ''
  },
  vapidKey: ''
};
window.rwApi=function(path){var c=window.RW_CONFIG||{};if((c.backend==='worker'||c.backend==='auto')&&c.workerUrl)return c.workerUrl.replace(/\/+$/,'')+'/'+String(path||'').replace(/^\/+/,'');return null};

/* One startup owner, one persistent decision.
   The cinematic opener runs once per browser/app installation instead of once
   per session. The old #intro markup is force-removed before it can participate.
   Replay is explicit from More -> Replay the opening. */
(function(){
  var key=((((window.RW_CONFIG||{}).intro||{}).storageKey)||'rw_opening_seen_v61');
  var seen=false;
  try{seen=localStorage.getItem(key)==='1'}catch(_){}
  window.__RW_INTRO_SHOULD_SHOW=!seen;
  if(!seen){try{localStorage.setItem(key,'1')}catch(_){}}
  if(seen)document.documentElement.classList.add('rw-opening-skip');

  var legacy=document.getElementById('intro');
  if(legacy)legacy.remove();

  var boot=document.createElement('style');
  boot.id='rw-opening-boot-style';
  boot.textContent='#intro,.intro{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}'+
    'html:not(.rw-opening-skip):not(.rw-opening-mounted) body:before{content:"";position:fixed;inset:0;z-index:2147482999;background:#07090f;pointer-events:none}';
  document.head.appendChild(boot);

  window.rwOpeningReplay=function(){
    try{localStorage.removeItem(key)}catch(_){}
    try{sessionStorage.removeItem('rw_intro')}catch(_){}
    location.reload();
  };
})();

(function(){
  var f=(window.RW_CONFIG&&window.RW_CONFIG.features)||{};
  function load(src,ordered){
    if(document.querySelector('script[data-rw-v5="'+src+'"]'))return;
    var s=document.createElement('script');
    s.src=src;
    s.dataset.rwV5=src;
    if(ordered){s.async=false;if('fetchPriority'in s)s.fetchPriority='high'}else s.async=true;
    document.head.appendChild(s);
  }
  if(f.audioTheme)load('platform-v5/audio-theme.js', true);
  if(f.atlasIntroV5)load('platform-v5/atlas-shinobi.js', true);
  /* openingEnhance augments the canonical #rwOpening root only; it never creates
     a second loader. Keeping it here preserves the approved motion + sound cues. */
  if(f.openingEnhance)load('platform-v5/opening-enhance.js', true);
  if(f.deviceCompat)load('platform-v5/device-compat.js', true);
  if(f.performanceV5)load('platform-v5/performance.js', false);
  if(f.privateLearningConsent)load('platform-v5/learning-consent.js', false);
  if(f.cinematicMapV51)load('platform-v5/cinematic-map-v51.js', false);
})();