/* RoamWise persistent audio engine.
 *
 * HISTORY / WHY THIS FILE LOOKS THE WAY IT DOES:
 * An earlier version depended on a media file that was not actually decodable
 * audio, so a later revision replaced it with a purely synthesized (Web Audio
 * oscillator + filtered noise) ambience with zero file dependency, guaranteed
 * offline-safe by tests/opening-audio.integration.test.js's "no media
 * dependency" assertion. That synthesized drone included a periodic
 * `chime()` sine sweep (originally every 7.2s) meant to read as a subtle
 * cinematic accent.
 *
 * In production this was reported as an unwanted harsh chime that played on
 * a loop for as long as the Sound setting was on, with no way to stop it
 * short of muting in Settings. Per an explicit product decision, the
 * synthesized generator (oscillators, filtered-noise "air" bed, and the
 * periodic chime) has been removed entirely and replaced with real,
 * licensed/uploaded audio playback of assets/audio/ambient-theme-30s
 * (.mp3/.ogg), looped, from the same RoamWise "Rave to Hell / Kumaon Shadow
 * Rite" theme already used for the other manifest-driven cues in app.js's
 * rwPlayCue(). This is a deliberate reversal of the previous no-file-
 * dependency guarantee, not an accidental regression of it — do not revert
 * this back to a synthesized generator. The existing rw_audio_enabled /
 * rw_audio_volume Settings toggle and slider still gate this real-file
 * playback exactly as before, so there is still exactly one mute switch for
 * every sound in the app. If the ambient file ever fails to load or play
 * (missing asset, decode error, autoplay block), this fails silently and
 * leaves the rest of the app - and the existing live planner - unaffected.
 */
(function(){
  'use strict';

  var ENABLED_KEY = 'rw_audio_enabled';
  var VOLUME_KEY = 'rw_audio_volume';
  /* Manifest (assets/audio/roamwise-audio-manifest.json) marks the ambient
     bed as the one intentionally-looping asset ("loop": true, meant to read
     as continuous background music) — every other cue is a short one-shot.
     So looping is kept, but the starting volume for anyone who hasn't yet
     touched the Settings slider is deliberately quiet: DEFAULT_VOLUME here
     is on the engine's 0..MAX_VOLUME storage scale, and normalizedVolume()
     divides by MAX_VOLUME to get the real <audio>.volume — 0.11/0.55 = 0.2,
     i.e. a quiet background presence (~20%) rather than the previous ~40%
     default, which is what actually made a forever-looping bed feel
     "annoying". Never touches a volume a user has explicitly set. */
  var DEFAULT_VOLUME = 0.11;
  var MIN_VOLUME = 0;
  var MAX_VOLUME = 0.55;
  var AMBIENT_BASE = 'assets/audio/ambient-theme-30s';
  var audioEl = null;
  var audioFormat = null;

  function readEnabled(){
    try {
      var value = localStorage.getItem(ENABLED_KEY);
      return value === null ? true : value !== '0';
    } catch (_) { return true; }
  }

  function clampVolume(value){
    var number = Number(value);
    if (!isFinite(number)) number = DEFAULT_VOLUME;
    return Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, number));
  }

  function readVolume(){
    try {
      var value = localStorage.getItem(VOLUME_KEY);
      return value === null ? DEFAULT_VOLUME : clampVolume(value);
    } catch (_) { return DEFAULT_VOLUME; }
  }

  var state = {
    enabled: readEnabled(),
    volume: readVolume(),
    playing: false,
    blocked: false,
    supported: true
  };

  function remember(){
    try {
      localStorage.setItem(ENABLED_KEY, state.enabled ? '1' : '0');
      localStorage.setItem(VOLUME_KEY, String(state.volume));
    } catch (_) {}
  }

  function snapshot(){
    return {
      enabled: state.enabled,
      volume: state.volume,
      playing: state.playing,
      blocked: state.blocked,
      supported: state.supported
    };
  }

  function emit(){
    try {
      window.dispatchEvent(new CustomEvent('rw:audio-state', { detail: snapshot() }));
    } catch (_) {}
  }

  function normalizedVolume(){
    return Math.max(0, Math.min(1, state.volume / MAX_VOLUME));
  }

  function pickFormat(el){
    if (audioFormat !== null) return audioFormat;
    try {
      audioFormat = (el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"')) ? '.ogg' : '.mp3';
    } catch (_) { audioFormat = '.mp3'; }
    return audioFormat;
  }

  function ensureElement(){
    if (audioEl) return audioEl;
    var AudioCtor = window.Audio;
    if (typeof AudioCtor !== 'function') {
      state.supported = false;
      return null;
    }
    try {
      var el = new AudioCtor();
      el.loop = true;
      el.preload = 'auto';
      el.src = AMBIENT_BASE + pickFormat(el);
      el.volume = normalizedVolume();
      audioEl = el;
      return audioEl;
    } catch (_) {
      state.supported = false;
      audioEl = null;
      return null;
    }
  }

  function play(){
    if (!state.enabled) {
      state.playing = false;
      syncUI();
      return Promise.resolve(false);
    }
    var el = ensureElement();
    if (!el) {
      state.blocked = false;
      syncUI();
      emit();
      return Promise.resolve(false);
    }
    el.volume = normalizedVolume();

    var result;
    try { result = el.play(); } catch (error) { result = Promise.reject(error); }

    return Promise.resolve(result).then(function(){
      state.playing = true;
      state.blocked = false;
      syncUI();
      emit();
      return true;
    }).catch(function(){
      state.playing = false;
      state.blocked = true;
      syncUI();
      emit();
      return false;
    });
  }

  function pause(reset){
    state.playing = false;
    state.blocked = false;
    if (audioEl) {
      try { audioEl.pause(); } catch (_) {}
      if (reset) { try { audioEl.currentTime = 0; } catch (_) {} }
    }
    syncUI();
    emit();
  }

  function setEnabled(value){
    state.enabled = !!value;
    remember();
    if (state.enabled) return play();
    pause(false);
    return Promise.resolve(false);
  }

  function setVolume(value){
    state.volume = clampVolume(value);
    remember();
    if (audioEl) audioEl.volume = normalizedVolume();
    syncUI();
    emit();
    return state.volume;
  }

  function isEnabled(){ return state.enabled; }
  function isPlaying(){ return !!(state.playing && audioEl && !audioEl.paused); }
  function getVolume(){ return state.volume; }

  function syncUI(){
    var toggle = document.getElementById('rwAudioToggle');
    var slider = document.getElementById('rwAudioVolume');
    var value = document.getElementById('rwAudioVolumeValue');
    var status = document.getElementById('rwAudioStatus');
    if (toggle) {
      toggle.checked = state.enabled;
      toggle.setAttribute('aria-checked', state.enabled ? 'true' : 'false');
    }
    if (slider) slider.value = String(Math.round((state.volume / MAX_VOLUME) * 100));
    if (value) value.textContent = Math.round((state.volume / MAX_VOLUME) * 100) + '%';
    if (status) {
      if (!state.supported) status.textContent = 'Audio is unavailable in this browser';
      else if (!state.enabled) status.textContent = 'Muted';
      else if (state.blocked) status.textContent = 'Tap the opening once to start audio';
      else if (state.playing) status.textContent = 'Playing across RoamWise';
      else status.textContent = 'Ready';
    }
  }

  function mountSetting(){
    if (document.getElementById('rwAudioSetting')) return;
    var body = document.querySelector('#settingsOverlay .modal-body');
    if (!body) return;
    var section = document.createElement('section');
    section.id = 'rwAudioSetting';
    section.className = 'key-section rw-sound-settings';
    section.innerHTML = ''+
      '<div class="key-sec-title">Sound</div>'+
      '<div class="rw-sound-row">'+
        '<div><strong>Cinematic audio</strong><span id="rwAudioStatus" aria-live="polite">Ready</span></div>'+
        '<label class="rw-sound-switch" aria-label="Mute or unmute RoamWise audio">'+
          '<input id="rwAudioToggle" type="checkbox" role="switch"><i aria-hidden="true"></i>'+
        '</label>'+
      '</div>'+
      '<label class="rw-volume-row" for="rwAudioVolume">'+
        '<span>Volume</span><input id="rwAudioVolume" type="range" min="0" max="100" step="1">'+
        '<output id="rwAudioVolumeValue" for="rwAudioVolume"></output>'+
      '</label>'+
      '<p class="rw-sound-note">On by default for the opening and the rest of the site. Your mute and volume choices stay on this device.</p>';
    body.insertBefore(section, body.firstChild);

    var toggle = document.getElementById('rwAudioToggle');
    var slider = document.getElementById('rwAudioVolume');
    toggle.addEventListener('change', function(){ setEnabled(toggle.checked); });
    slider.addEventListener('input', function(){ setVolume((Number(slider.value) / 100) * MAX_VOLUME); });
    syncUI();
  }

  function unlock(){
    if (state.enabled && !isPlaying()) play();
  }

  window.RWAudio = {
    play: play,
    pause: pause,
    stop: function(){ pause(true); },
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    isPlaying: isPlaying,
    setVolume: setVolume,
    getVolume: getVolume,
    getState: snapshot,
    unlock: unlock
  };

  document.addEventListener('pointerdown', unlock, { capture:true, passive:true });
  document.addEventListener('touchend', unlock, { capture:true, passive:true });
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) pause(false);
    else if (state.enabled) play();
  });

  function init(){
    mountSetting();
    if (state.enabled) play();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
