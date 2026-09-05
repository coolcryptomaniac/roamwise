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

function tuskSpeak(text){
  var say = tuskSpeakable(text);
  if(!say) return;
  if(!rwVoiceEnabled()){ showToast('🔇 Voice narration is muted — turn it back on in Settings'); return; }
  tuskClaimSpeechFocus();
  if(window.RW && typeof RW.speak==='function'){ try{ RW.speak(say); return; }catch(e){ /* best-effort, ignore */ } }
  /* Capacitor Text-to-Speech plugin (works in the app where WebView speechSynthesis often doesn't) */
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.TextToSpeech){
    try{ Capacitor.Plugins.TextToSpeech.speak({ text: say, lang:'en-IN', rate:1.0 }); return; }catch(e){ /* best-effort, ignore */ }
  }
  text = say;
  try{
    if(!window.speechSynthesis){ showToast('\ud83d\udd0a Read-aloud isn\u2019t available here \u2014 the text is on screen above'); return; }
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    /* slightly slower and lower than default: reads as a wry aside rather than
       an announcement. Hindi voice handles Hinglish word shapes better. */
    u.lang='hi-IN'; u.rate=0.94; u.pitch=0.92; u.volume=1;
    /* prefer an Indian-English/Hindi voice if the device has one */
    var vs=speechSynthesis.getVoices();
    var pick=vs.filter(function(v){ return /hi-IN|en-IN/i.test(v.lang); })[0];
    if(pick) u.voice=pick;
    /* Android WebView often accepts .speak() but silently produces no audio
       without throwing — surface an error toast so the user isn't left guessing */
    u.onend = tuskReleaseSpeechFocus;
    u.onerror = function(){ tuskReleaseSpeechFocus(); showToast('🔊 Voice unavailable on this device'); };
    speechSynthesis.speak(u);
  }catch(e){ tuskReleaseSpeechFocus(); showToast('🔊 Voice unavailable on this device'); }
}
