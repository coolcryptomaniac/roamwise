// @ts-nocheck
/* One audible owner at a time across cues, music, speech, video and Web Audio. */
(function () {
  'use strict';

  var currentOwner = null;
  var currentStop = null;

  function emit(owner) {
    try {
      window.dispatchEvent(new CustomEvent('rw:audio-focus', {
        detail: { active: !!owner, owner: typeof owner === 'string' ? owner : 'media' }
      }));
    } catch (_) {}
  }

  function claim(owner, stop) {
    if (!owner) return false;
    if (currentOwner === owner) {
      if (typeof stop === 'function') currentStop = stop;
      return true;
    }
    var stopPrevious = currentStop;
    currentOwner = null;
    currentStop = null;
    if (typeof stopPrevious === 'function') {
      try { stopPrevious(); } catch (_) {}
    }
    currentOwner = owner;
    currentStop = typeof stop === 'function' ? stop : null;
    emit(owner);
    return true;
  }

  function release(owner) {
    if (currentOwner !== owner) return false;
    currentOwner = null;
    currentStop = null;
    emit(null);
    return true;
  }

  window.RWAudioFocus = {
    claim: claim,
    release: release,
    current: function () { return currentOwner; }
  };

  /* Local audio/video elements outside the two managed players participate
     automatically too (for example the inline promo video). */
  document.addEventListener('play', function (event) {
    var media = event.target;
    if (!media || !/^(AUDIO|VIDEO)$/.test(media.tagName || '')) return;
    if (media.muted || media.volume === 0 || media._rwAudioOwner) return;
    claim(media, function () {
      try { media.pause(); } catch (_) {}
    });
  }, true);

  ['pause', 'ended', 'error'].forEach(function (name) {
    document.addEventListener(name, function (event) {
      var media = event.target;
      if (media && /^(AUDIO|VIDEO)$/.test(media.tagName || '') && !media._rwAudioOwner) {
        release(media);
      }
    }, true);
  });
})();
