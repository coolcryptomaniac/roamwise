/* ===== EVENT AUDIO CUES (assets/audio/roamwise-audio-manifest.json) =====
   platform-v5/audio-only.js is a deliberately file-free, purely synthesized
   Web Audio engine (see its own header comment + tests/opening-audio.integration
   .test.js, which pins it to have zero .mp3/.ogg/media dependency for offline
   reliability). The actual produced "Rave to Hell" stings/themes uploaded to
   assets/audio/ therefore need a separate, small player — this one — that
   still respects the SAME master mute (rw_audio_enabled) and volume
   (rw_audio_volume) the Settings "Sound" toggle already controls, so there is
   exactly one mute switch for the user regardless of which engine is playing. */
var RW_CUE_FILES = {
  site_opening: 'opening-theme-30s',
  hero_cta_or_big_action: 'cta-action-10s',
  card_transition_or_modal_open: 'transition-10s',
  tap_feedback: 'tap-sting-5s',
  success_feedback: 'success-sting-5s'
};
var _rwCueCache = {};
var _rwCueFormat = null;
/* Guard against overlapping/simultaneous one-shot cues. A single user action
   can end up calling rwPlayCue() more than once in quick succession (e.g. a
   tap that both bumps a badge/haptic AND triggers a screen transition, each
   wired to a different cue). This is a small decorative audio system, not a
   full audio mixer, so rather than building real ducking/crossfade logic we
   simply refuse to start a NEW cue while the debounce window from the last
   one is still open — the user hears one clean sting instead of two or three
   layered on top of each other. */
var _rwCueLastStart = 0;
var RW_CUE_DEBOUNCE_MS = 260;
function rwAudioThemeEnabled(){
  try{ var v=localStorage.getItem('rw_audio_enabled'); return v===null ? true : v!=='0'; }catch(e){ return true; }
}
function rwAudioThemeVolume(){
  /* Fallback (0.11 on the engine's 0..0.55 ambient scale) must match
     platform-v5/audio-only.js's DEFAULT_VOLUME so an unset preference sounds
     the same quiet ~20% starting level everywhere. */
  try{ var v=Number(localStorage.getItem('rw_audio_volume')); return isFinite(v)&&v>0 ? v : 0.11; }catch(e){ return 0.11; }
}
function rwPlayCue(name){
  if(!rwAudioThemeEnabled()) return false;
  var base = RW_CUE_FILES[name];
  if(!base || typeof window.Audio!=='function') return false;
  var _now = Date.now();
  if(_now - _rwCueLastStart < RW_CUE_DEBOUNCE_MS) return false;
  _rwCueLastStart = _now;
  try{
    var node = _rwCueCache[name];
    if(!node){
      node = new Audio();
      if(_rwCueFormat===null){
        try{ _rwCueFormat = (node.canPlayType && node.canPlayType('audio/ogg; codecs="vorbis"')) ? '.ogg' : '.mp3'; }
        catch(e){ _rwCueFormat = '.mp3'; }
      }
      node.src = 'assets/audio/'+base+_rwCueFormat;
      node.preload = 'auto';
      _rwCueCache[name] = node;
    }
    /* rw_audio_volume is stored on the engine's 0..0.55 ambient scale — map it
       onto an audible 0..1 range for these short one-shot stings, with a
       floor so they're not inaudible when the ambient bed is set low. */
    node.volume = Math.max(0.18, Math.min(1, rwAudioThemeVolume()/0.55));
    try{ node.currentTime = 0; }catch(e){}
    var played = node.play();
    if(played && played.catch) played.catch(function(){});
    return true;
  }catch(e){ return false; }
}
