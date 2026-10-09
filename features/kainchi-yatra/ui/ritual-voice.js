/* Device voice catalogue. Provider voices require a fresh, per-player opt-in. */
(function (root) {
  'use strict';
  root.RWKainchiUI.ritualVoices = function (lang, provider) {
    if (!root.speechSynthesis || !root.SpeechSynthesisUtterance) return [];
    try {
      return root.speechSynthesis.getVoices().filter(function (v) {
        return (provider || v.localService === true) && String(v.lang).toLowerCase().split(/[-_]/)[0] === lang.split('-')[0];
      }).sort(function (a, b) {
        return Number(b.localService === true) - Number(a.localService === true) || Number(b.lang === lang) - Number(a.lang === lang);
      });
    } catch (e) { return []; }
  };
  root.RWKainchiUI.voiceId = function (v) { return v.voiceURI || v.name || v.lang; };
})(window);
