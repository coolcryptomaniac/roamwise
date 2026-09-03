/* RoamWise persistent audio engine.
 *
 * The previous implementation depended on a media file that was not actually
 * decodable audio. This engine generates a restrained cinematic ambience
 * with the Web Audio API, so startup audio works online, offline and inside the
 * Capacitor app without a media download. Browsers that require a user gesture
 * are unlocked by the opening screen before its animation begins.
 */
(function(){
  'use strict';

  var ENABLED_KEY = 'rw_audio_enabled';
  var VOLUME_KEY = 'rw_audio_volume';
  var DEFAULT_VOLUME = 0.22;
  var MIN_VOLUME = 0;
  var MAX_VOLUME = 0.55;
  var ctx = null;
  var master = null;
  var pulseTimer = null;

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

  function setParam(param, value, seconds){
    if (!param || !ctx) return;
    var now = ctx.currentTime || 0;
    try {
      param.cancelScheduledValues(now);
      param.setValueAtTime(Number(param.value) || 0, now);
      param.linearRampToValueAtTime(value, now + (seconds || 0.01));
    } catch (_) { param.value = value; }
  }

  function connect(source, destination){
    if (source && source.connect) source.connect(destination);
    return source;
  }

  function makeOscillator(type, frequency, level, detune){
    var oscillator = ctx.createOscillator();
    var gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    if (oscillator.detune) oscillator.detune.value = detune || 0;
    gain.gain.value = level;
    connect(oscillator, gain);
    connect(gain, master);
    oscillator.start();
    return oscillator;
  }

  function makeAir(){
    if (!ctx.createBuffer || !ctx.createBufferSource || !ctx.createBiquadFilter) return;
    var frames = Math.max(1, Math.floor(ctx.sampleRate * 2));
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * 0.24;
    var source = ctx.createBufferSource();
    var filter = ctx.createBiquadFilter();
    var gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    gain.gain.value = 0.025;
    connect(source, filter);
    connect(filter, gain);
    connect(gain, master);
    source.start();
  }

  function chime(){
    if (!ctx || ctx.state !== 'running' || !state.enabled || !master) return;
    var now = ctx.currentTime;
    var oscillator = ctx.createOscillator();
    var gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(329.63, now + 1.8);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    connect(oscillator, gain);
    connect(gain, master);
    oscillator.start(now);
    oscillator.stop(now + 2.9);
  }

  function buildGraph(){
    if (ctx && master) return true;
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      state.supported = false;
      state.blocked = false;
      syncUI();
      emit();
      return false;
    }

    try {
      ctx = new AudioContextClass();
      master = ctx.createGain();
      master.gain.value = 0;

      var destination = ctx.destination;
      if (ctx.createDynamicsCompressor) {
        var compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.08;
        compressor.release.value = 0.42;
        connect(master, compressor);
        connect(compressor, destination);
      } else {
        connect(master, destination);
      }

      makeOscillator('sine', 55, 0.23, -5);
      makeOscillator('sine', 82.41, 0.075, 4);
      makeOscillator('triangle', 110, 0.025, -8);
      makeAir();
      pulseTimer = setInterval(chime, 7200);
      return true;
    } catch (_) {
      state.supported = false;
      state.blocked = false;
      syncUI();
      emit();
      return false;
    }
  }

  function play(){
    if (!state.enabled) {
      state.playing = false;
      syncUI();
      return Promise.resolve(false);
    }
    if (!buildGraph()) return Promise.resolve(false);
    if (!pulseTimer) pulseTimer = setInterval(chime, 7200);

    var resume;
    try { resume = ctx.resume ? ctx.resume() : Promise.resolve(); }
    catch (error) { resume = Promise.reject(error); }

    return Promise.resolve(resume).then(function(){
      if (ctx.state && ctx.state !== 'running') throw new Error('audio-blocked');
      setParam(master.gain, state.volume, 0.7);
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
    if (master) setParam(master.gain, 0, 0.22);
    if (ctx && ctx.suspend) {
      setTimeout(function(){
        if (!state.playing) {
          try { ctx.suspend(); } catch (_) {}
        }
      }, 250);
    }
    if (reset && pulseTimer) {
      clearInterval(pulseTimer);
      pulseTimer = null;
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
    if (master && state.playing) setParam(master.gain, state.volume, 0.12);
    syncUI();
    emit();
    return state.volume;
  }

  function isEnabled(){ return state.enabled; }
  function isPlaying(){ return state.playing && !!ctx && (!ctx.state || ctx.state === 'running'); }
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
