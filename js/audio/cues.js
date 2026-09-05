// @ts-check
/* Manifest-driven one-shot cues, serialized through the site audio focus. */
var RW_CUE_FILES = {
  site_opening: 'opening-theme-30s',
  hero_cta_or_big_action: 'cta-action-10s',
  card_transition_or_modal_open: 'transition-10s',
  tap_feedback: 'tap-sting-5s',
  success_feedback: 'success-sting-5s'
};
var _rwCueNode = null;
var _rwCueFormat = null;
var _rwCueCurrentName = '';
var _rwCueResumeAmbient = false;
var _rwCuePlayToken = 0;
var _rwCueLastStart = 0;
var RW_CUE_DEBOUNCE_MS = 260;

/**
 * Whether the user has audio cues/theme enabled (defaults to true when the
 * preference has never been set, or storage throws e.g. in private mode).
 * @returns {boolean}
 */
function rwAudioThemeEnabled(){
  try{ var v=localStorage.getItem('rw_audio_enabled'); return v===null ? true : v!=='0'; }catch(e){ return true; }
}

/**
 * The user's saved audio volume preference, falling back to 0.11 when unset,
 * invalid, or storage throws.
 * @returns {number}
 */
function rwAudioThemeVolume(){
  try{ var v=Number(localStorage.getItem('rw_audio_volume')); return isFinite(v)&&v>0 ? v : 0.11; }catch(e){ return 0.11; }
}

/**
 * Resume the ambient RWAudio loop if a cue interrupted it and the user still
 * has the ambient loop enabled. No-op otherwise.
 * @returns {void}
 */
function rwResumeAmbient(){
  if(!_rwCueResumeAmbient) return;
  _rwCueResumeAmbient = false;
  try{
    if(window.RWAudio && RWAudio.isEnabled && RWAudio.isEnabled() &&
       RWAudio.isLoopEnabled && RWAudio.isLoopEnabled()) RWAudio.play();
  }catch(e){ /* best-effort, ignore */ }
}

/**
 * Stop any currently-playing cue, optionally resuming the ambient RWAudio
 * loop afterward if a cue had paused it.
 * @param {boolean} [resumeAmbient]
 * @returns {void}
 */
function rwStopCue(resumeAmbient){
  var shouldResume = !!resumeAmbient && _rwCueResumeAmbient;
  _rwCueResumeAmbient = false;
  _rwCueCurrentName = '';
  _rwCuePlayToken += 1;
  if(_rwCueNode){
    try{ _rwCueNode.pause(); }catch(e){ /* best-effort, ignore */ }
    try{ _rwCueNode.currentTime = 0; }catch(e){ /* best-effort, ignore */ }
  }
  var focus = window.RWAudioFocus;
  if(focus && focus.release) focus.release('cue');
  if(shouldResume){
    _rwCueResumeAmbient = true;
    rwResumeAmbient();
  }
}

/**
 * Called when a cue's <audio> element fires 'ended'/'error'. Only clears
 * playback state and resumes ambient audio if `token` still matches the
 * most recent play request (stale callbacks from a superseded cue are
 * ignored).
 * @param {number} token
 * @returns {void}
 */
function rwFinishCue(token){
  if(token !== _rwCuePlayToken) return;
  _rwCueCurrentName = '';
  var focus = window.RWAudioFocus;
  if(focus && focus.release) focus.release('cue');
  rwResumeAmbient();
}

/**
 * Get (creating and caching on first use) the single shared <audio> element
 * used for all one-shot cues, or null if the `Audio` constructor isn't
 * available in this environment.
 * @returns {HTMLAudioElement|null}
 */
function rwEnsureCueNode(){
  if(_rwCueNode) return _rwCueNode;
  var AudioCtor = window.Audio;
  if(typeof AudioCtor !== 'function') return null;
  var node = new AudioCtor();
  node.preload = 'auto';
  node._rwAudioOwner = 'cue';
  if(_rwCueFormat===null){
    try{ _rwCueFormat = (node.canPlayType && node.canPlayType('audio/ogg; codecs="vorbis"')) ? '.ogg' : '.mp3'; }
    catch(e){ _rwCueFormat = '.mp3'; }
  }
  if(node.addEventListener){
    node.addEventListener('ended', function(){ rwFinishCue(_rwCuePlayToken); });
    node.addEventListener('error', function(){ rwFinishCue(_rwCuePlayToken); });
  }
  _rwCueNode = node;
  return node;
}

/**
 * @typedef {Object} RWPlayCueOptions
 * @property {boolean} [resumeAmbient] Resume the ambient loop after this cue finishes, even if it wasn't already playing.
 */
/**
 * Play a named one-shot cue from RW_CUE_FILES, debounced and serialized
 * through window.RWAudioFocus so cues never layer on top of each other or
 * the ambient loop.
 * @param {string} name Key into RW_CUE_FILES.
 * @param {RWPlayCueOptions} [options]
 * @returns {boolean} Whether playback was (at least optimistically) started.
 */
function rwPlayCue(name, options){
  if(!rwAudioThemeEnabled()) return false;
  var base = RW_CUE_FILES[name];
  if(!base) return false;
  var now = Date.now();
  if(now - _rwCueLastStart < RW_CUE_DEBOUNCE_MS) return false;
  _rwCueLastStart = now;

  var node = rwEnsureCueNode();
  if(!node) return false;
  var ambientPlaying = false;
  try{ ambientPlaying = !!(window.RWAudio && RWAudio.isPlaying && RWAudio.isPlaying()); }catch(e){ /* best-effort, ignore */ }
  _rwCueResumeAmbient = _rwCueResumeAmbient || ambientPlaying || !!(options && options.resumeAmbient);

  /* Reuse one element and stop it before every source change. Different cue
     names can therefore never layer, even when fired outside the debounce. */
  try{ node.pause(); }catch(e){ /* best-effort, ignore */ }
  try{ node.currentTime = 0; }catch(e){ /* best-effort, ignore */ }
  var source = 'assets/audio/'+base+_rwCueFormat;
  if(node.getAttribute ? node.getAttribute('src') !== source : node.src !== source){
    node.src = source;
    try{ if(node.load) node.load(); }catch(e){ /* best-effort, ignore */ }
  }
  node.volume = Math.max(0.18, Math.min(1, rwAudioThemeVolume()/0.55));
  _rwCueCurrentName = name;
  var token = ++_rwCuePlayToken;
  var focus = window.RWAudioFocus;
  if(focus && focus.claim) focus.claim('cue', function(){ rwStopCue(false); });

  try{
    var played = node.play();
    if(played && played.catch) played.catch(function(){ rwFinishCue(token); });
    return true;
  }catch(e){
    rwFinishCue(token);
    return false;
  }
}

/**
 * @returns {boolean} Whether a cue is currently mid-playback.
 */
function rwCueIsPlaying(){
  return !!(_rwCueCurrentName && _rwCueNode && !_rwCueNode.paused);
}

window.rwPlayCue = rwPlayCue;
window.rwStopCue = rwStopCue;
window.rwCueIsPlaying = rwCueIsPlaying;
