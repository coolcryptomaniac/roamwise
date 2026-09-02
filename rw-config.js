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
    cinematicDurationMs: 6800
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
(function(){var seen=false;try{seen=sessionStorage.getItem('rw_intro')==='1'}catch(_){}window.__RW_INTRO_SHOULD_SHOW=!seen;if(!seen){try{sessionStorage.setItem('rw_intro','1')}catch(_){}}if(seen)document.documentElement.classList.add('rw-opening-skip');var legacy=document.getElementById('intro');if(legacy)legacy.remove();var boot=document.createElement('style');boot.id='rw-opening-boot-style';boot.textContent='#intro,.intro{display:none!important;visibility:hidden!important;opacity:0!important}'+'html:not(.rw-opening-skip):not(.rw-opening-mounted) body:before{content:"";position:fixed;inset:0;z-index:2147482999;background:radial-gradient(circle at 50% 18%,rgba(118,45,255,.42),transparent 38%),radial-gradient(circle at 66% 74%,rgba(255,49,164,.28),transparent 38%),linear-gradient(145deg,#130621,#260824 50%,#10051b);pointer-events:none}';document.head.appendChild(boot)})();
(function(){var f=(window.RW_CONFIG&&window.RW_CONFIG.features)||{};function load(src,ordered){if(document.querySelector('script[data-rw-v5="'+src+'"]'))return;var s=document.createElement('script');s.src=src;s.dataset.rwV5=src;if(ordered){s.async=false;if('fetchPriority'in s)s.fetchPriority='high'}else s.async=true;document.head.appendChild(s)}if(f.audioTheme)load('platform-v5/audio-theme.js', true);if(f.atlasIntroV5)load('platform-v5/atlas-shinobi.js', true);if(f.openingEnhance)load('platform-v5/opening-enhance.js', true);if(f.deviceCompat)load('platform-v5/device-compat.js', false);if(f.performanceV5)load('platform-v5/performance.js', false);if(f.privateLearningConsent)load('platform-v5/learning-consent.js', false);if(f.cinematicMapV51)load('platform-v5/cinematic-map-v51.js', false)})();
