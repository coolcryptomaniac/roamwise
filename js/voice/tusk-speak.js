// @ts-nocheck
/* speak a line via TTS — native bridge in-app, Web Speech on the web */
/* Strip emoji/pictographs before speaking. Device TTS reads them aloud as
   "fire", "grinning face with sweat" etc., which wrecked the joke every time.
   Also expand a few Hinglish contractions so the delivery lands. */
function tuskSpeakable(text){
  return String(text||'')
    // eslint-disable-next-line no-misleading-character-class -- intentional: \u{FE00}-\u{FE0F} is the Variation Selector block, deliberately included in this class so it gets stripped along with the emoji it modifies; not a stray literal combining character
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/gu, ' ')
    .replace(/\u2014|\u2013/g, ', ')     /* em/en dash -> a real pause */
    .replace(/\.\.\./g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function tuskStopSpeech(){
  try{ if(window.RW && typeof RW.stopSpeaking==='function') RW.stopSpeaking(); }catch(e){ /* best-effort, ignore */ }
  try{ if(window.RW && typeof RW.stopSpeak==='function') RW.stopSpeak(); }catch(e){ /* best-effort, ignore */ }
  try{
    if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.TextToSpeech &&
       typeof Capacitor.Plugins.TextToSpeech.stop==='function') Capacitor.Plugins.TextToSpeech.stop();
  }catch(e){ /* best-effort, ignore */ }
  try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){ /* voice narration best-effort, ignore */ }
}

function tuskClaimSpeechFocus(){
  tuskStopSpeech();
  try{
    if(window.RWAudioFocus && RWAudioFocus.claim) RWAudioFocus.claim('speech', tuskStopSpeech);
  }catch(e){ /* best-effort, ignore */ }
}

function tuskReleaseSpeechFocus(){
  try{ if(window.RWAudioFocus && RWAudioFocus.release) RWAudioFocus.release('speech'); }catch(e){ /* best-effort, ignore */ }
}

var _rwTuskLastSpeech = '', _rwTuskSpeechRate = 1;
function tuskSpeak(text){
  var say = tuskSpeakable(text);
  if(!say) return;
  if(!rwVoiceEnabled()){ showToast('🔇 Voice narration is muted — turn it back on in Settings'); return; }
  _rwTuskLastSpeech = say.slice(0, 2000);
  tuskClaimSpeechFocus();
  if(window.RW && typeof RW.speak==='function'){ try{ RW.speak(say); return; }catch(e){ /* best-effort, ignore */ } }
  /* Native app output: treat promise rejection as failure, not as audible success.
     Avoid overlapping fallback voices when the plugin speaks successfully. */
  var tts=window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.TextToSpeech;
  if(tts && typeof tts.speak==='function'){
    try{
      var result=tts.speak({text:say,lang:rwSpeechOutputLang(say),rate:_rwTuskSpeechRate});
      if(result && typeof result.then==='function'){
        result.then(tuskReleaseSpeechFocus,function(){ tuskReleaseSpeechFocus(); showToast('🔊 Voice unavailable on this device — your answer is still on screen'); });
      }else tuskReleaseSpeechFocus();
      return;
    }catch(e){ /* Fall through to web speech when native invocation throws. */ }
  }
  text = say;
  try{
    if(!window.speechSynthesis){ showToast('\ud83d\udd0a Read-aloud isn\u2019t available here \u2014 the text is on screen above'); return; }
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    /* slightly slower and lower than default: reads as a wry aside rather than
       an announcement. Hindi voice handles Hinglish word shapes better. */
    u.lang=rwSpeechOutputLang(say); u.rate=_rwTuskSpeechRate; u.pitch=0.92; u.volume=1;
    /* prefer an Indian-English/Hindi voice if the device has one */
    var vs=speechSynthesis.getVoices();
    var pick=rwSpeechPickVoice(vs,u.lang);
    if(pick) u.voice=pick;
    /* Android WebView often accepts .speak() but silently produces no audio
       without throwing — surface an error toast so the user isn't left guessing */
    u.onend = function(){ tuskReleaseSpeechFocus(); try{ if(window.RWTuskVoiceStudio) RWTuskVoiceStudio.speechEnd(); }catch(e){} };
    u.onerror = function(){ tuskReleaseSpeechFocus(); if(window.RWTuskVoiceStudio) RWTuskVoiceStudio.speechFailure(); showToast('🔊 Voice unavailable on this device'); };
    speechSynthesis.speak(u);
  }catch(e){ tuskReleaseSpeechFocus(); showToast('🔊 Voice unavailable on this device'); }
}
/* Speech language follows the site language (Settings > language): Hindi -> hi-IN, else en-IN.
   Used by voice input (voice-input.js) and the native read-aloud above. */
function rwSpeechLang(){
  try{ return (typeof rwLang==='function' && rwLang()==='hi') ? 'hi-IN' : 'en-IN'; }catch(e){ return 'en-IN'; }
}

/* Prefer speech matching the visible script, then the user's site language.
   Hinglish in Latin script remains Indian English rather than always Hindi. */
function rwSpeechOutputLang(text){
  if(/[\u0900-\u097f]/.test(String(text||''))) return 'hi-IN';
  return rwSpeechLang();
}
function rwSpeechPickVoice(voices,lang){
  var list=voices||[];
  var exact=list.filter(function(v){return String(v.lang||'').toLowerCase()===String(lang).toLowerCase();});
  if(exact.length) return exact[0];
  var indian=list.filter(function(v){return /^(hi|en)-IN$/i.test(v.lang||'');});
  return indian[0]||null;
}

/* User-initiated controls. Pause/resume is only offered where Web Speech
   exposes reliable state; native TTS can still be stopped and replayed. */
function rwTuskSpeechControls(){
  var web=window.speechSynthesis, nativeBridge=window.RW && typeof RW.speak==='function';
  var nativePlugin=window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.TextToSpeech;
  return { canPause:!!(web && !nativeBridge && !nativePlugin && typeof web.pause==='function' && typeof web.resume==='function'),
           canReplay:!!_rwTuskLastSpeech, rate:_rwTuskSpeechRate };
}
function rwTuskPauseResume(){
  var cfg=rwTuskSpeechControls(), web=window.speechSynthesis;
  if(!cfg.canPause){ showToast('Pause/resume is not supported by this voice engine. Use Replay instead.');return false; }
  try{
    if(web.paused){ web.resume(); return true; }
    if(web.speaking){ web.pause(); return true; }
    showToast('Nothing is speaking yet. Tap Read aloud first.');
  }catch(e){ showToast('Voice pause is unavailable on this device.'); }
  return false;
}
function rwTuskReplaySpeech(){
  if(!_rwTuskLastSpeech){showToast('Nothing to replay yet. Tap Read aloud first.');return false;}
  tuskSpeak(_rwTuskLastSpeech); return true;
}
function rwTuskCycleSpeechRate(){
  var rates=[0.8,1,1.2], i=rates.indexOf(_rwTuskSpeechRate);
  _rwTuskSpeechRate=rates[(i+1)%rates.length];
  showToast('Voice speed: '+_rwTuskSpeechRate+'× (applies to next playback)');
  return _rwTuskSpeechRate;
}
