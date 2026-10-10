// @ts-nocheck
/* Boot signal. Loaded last. Marks the app as started once its core entry points
   exist; the head watchdog (index.html #rw-watchdog) uses this to tell "slow"
   from "broken". Polls because some entry points are defined a little later. */
(function(){
  'use strict';
  var NEEDED = ['tabGo','shareApp','rwApi'], tries = 0;
  function ready(){
    for (var i = 0; i < NEEDED.length; i++) if (typeof window[NEEDED[i]] !== 'function') return false;
    return true;
  }
  function check(){
    if (ready()) {
      window.__RW_BOOTED = true;
      try { window.dispatchEvent(new Event('rw:booted')); } catch (e) {}
      return;
    }
    if (++tries < 120) setTimeout(check, 500);
  }
  check();
})();
