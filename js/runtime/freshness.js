// @ts-nocheck
/* Keep an installed PWA on the newest deployed code while retaining offline fallback. */
(function () {
  'use strict';

  var BUILD = 'rw-v118-mobile-audio-fresh';
  var inApp = !!window.RW || (typeof window.PLAY_MODE !== 'undefined' && window.PLAY_MODE);
  if (inApp || !window.isSecureContext || !('serviceWorker' in navigator)) return;

  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) return;
    refreshing = true;
    try {
      if (sessionStorage.getItem('rw_sw_reload') === BUILD) return;
      sessionStorage.setItem('rw_sw_reload', BUILD);
    } catch (_) {}
    window.location.reload();
  });

  function update(registration) {
    if (!registration || typeof registration.update !== 'function') return;
    registration.update().catch(function () {});
  }

  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then(function (registration) {
      update(registration);
      window.addEventListener('pageshow', function () { update(registration); });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) update(registration);
      });
    })
    .catch(function () { /* Offline support is optional. */ });
})();
