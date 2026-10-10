// @ts-nocheck
/* Keep an installed PWA on the newest deployed code while retaining offline fallback. */
(function () {
  'use strict';

  var BUILD = 'rw-v124-personal-group-planner';
  var inApp = !!window.RW || (typeof window.PLAY_MODE !== 'undefined' && window.PLAY_MODE);
  if (inApp || !window.isSecureContext || !('serviceWorker' in navigator)) return;

  var refreshing = false;
  /* First visit: the new worker claims the page, which fires controllerchange.
     Reloading then would restart the page (and the opening film) a few seconds
     in for no benefit, since the page just loaded the newest code. Only reload
     when an EXISTING worker is replaced by an update. */
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }
    if (refreshing) return;
    refreshing = true;
    try {
      if (sessionStorage.getItem('rw_sw_reload') === BUILD) return;
      sessionStorage.setItem('rw_sw_reload', BUILD);
    } catch (_) { /* best-effort, ignore */ }
    window.location.reload();
  });

  function update(registration) {
    if (!registration || typeof registration.update !== 'function') return;
    registration.update().catch(function () {});
  }

  /* Installing the worker re-reads the whole shell. Do it after the app has started (and a
     little later on slow links) so the first visit's bandwidth goes to getting the app up. */
  function afterBoot(fn) {
    var done = false, run = function () { if (done) return; done = true; fn(); };
    var slow = window.__RW_NET && window.__RW_NET.tier !== 'fast';
    var delay = slow ? 8000 : 1500;
    if (window.__RW_BOOTED) setTimeout(run, delay);
    else { window.addEventListener('rw:booted', function () { setTimeout(run, delay); }); setTimeout(run, 45000); }
  }
  afterBoot(function () {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then(function (registration) {
      update(registration);
      window.addEventListener('pageshow', function () { update(registration); });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) update(registration);
      });
    })
    .catch(function () { /* Offline support is optional. */ });
  });
})();
