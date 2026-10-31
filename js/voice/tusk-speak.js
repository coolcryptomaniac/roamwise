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
  try{if(window.RWTuskVoiceProvider)RWTuskVoiceProvider.stop();}catch(e){}
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
function tuskSpeak(text,skipByok){
  var say = tuskSpeakable(text);
  if(!say) return;
  if(!rwVoiceEnabled()){ showToast('🔇 Voice narration is muted — turn it back on in Settings'); return; }
  _rwTuskLastSpeech = say.slice(0, 2000);
  var spoken=rwTuskSpeechPronunciation(say);
  tuskClaimSpeechFocus();
  /* Explicit BYOK voice only. The user pays the provider; on network/credit
     errors we gracefully return to the free installed device voice. */
  var optional=window.RWTuskVoiceProvider;
  if(!skipByok && optional && optional.selected()==='sarvam'){
    optional.speak(spoken,rwSpeechOutputLang(say)).then(function(success){
      if(!success) tuskSpeak(say,true);
    });
    return;
  }
  if(window.RW && typeof RW.speak==='function'){ try{ RW.speak(spoken); return; }catch(e){ /* best-effort, ignore */ } }
  /* Native app output: treat promise rejection as failure, not as audible success.
     Avoid overlapping fallback voices when the plugin speaks successfully. */
  var tts=window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.TextToSpeech;
  if(tts && typeof tts.speak==='function'){
    try{
      var result=tts.speak({text:spoken,lang:rwSpeechOutputLang(say),rate:_rwTuskSpeechRate});
      if(result && typeof result.then==='function'){
        result.then(tuskReleaseSpeechFocus,function(){ tuskReleaseSpeechFocus(); showToast('🔊 Voice unavailable on this device — your answer is still on screen'); });
      }else tuskReleaseSpeechFocus();
      return;
    }catch(e){ /* Fall through to web speech when native invocation throws. */ }
  }
  text = spoken;
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
/* Spoken language is user-selectable; only installed system voices are used.
   This is not a claim of native Kumaoni or Garhwali synthesis. */
var RW_TUSK_VOICE_LANG_KEY='rw_tusk_voice_lang';
function rwTuskVoicePreference(){
  try{var x=localStorage.getItem(RW_TUSK_VOICE_LANG_KEY);return x==='hi-IN'||x==='en-IN'?x:'auto';}catch(e){return 'auto';}
}
function rwTuskCycleVoicePreference(){
  var choices=['auto','hi-IN','en-IN'],i=choices.indexOf(rwTuskVoicePreference()),next=choices[(i+1)%choices.length];
  try{localStorage.setItem(RW_TUSK_VOICE_LANG_KEY,next);}catch(e){}
  if(typeof showToast==='function')showToast('Voice language: '+(next==='auto'?'Automatic':next==='hi-IN'?'Hindi (India)':'Indian English')+' · available installed voice used');
  return next;
}
function rwSpeechOutputLang(text){
  var preference=rwTuskVoicePreference();
  if(preference!=='auto')return preference;
  if(/[\u0900-\u097f]/.test(String(text||'')))return 'hi-IN';
  return rwSpeechLang();
}
/* Only real OS-installed voices can be selected. This is not a cloud actor.
   Web Speech voices are loaded asynchronously on some Android browsers. */
var RW_TUSK_ACTOR_KEY='rw_tusk_voice_actor';
function rwTuskInstalledVoices(){
  try{
    if(!window.speechSynthesis || !speechSynthesis.getVoices)return [];
    return speechSynthesis.getVoices().filter(function(v){return /^(hi|en)-IN$/i.test(v.lang||'');});
  }catch(e){return [];}
}
function rwTuskSelectedVoice(){
  try{return localStorage.getItem(RW_TUSK_ACTOR_KEY)||'';}catch(e){return '';}
}
function rwTuskCycleActorVoice(){
  var list=rwTuskInstalledVoices();
  if(!list.length){showToast('No Indian Hindi/English device voices found. Using system voice.');return '';}
  var stored=rwTuskSelectedVoice(),at=list.findIndex(function(v){return v.voiceURI===stored;});
  var next=list[(at+1)%list.length];
  try{localStorage.setItem(RW_TUSK_ACTOR_KEY,next.voiceURI||'');}catch(e){}
  showToast('Voice actor: '+String(next.name||next.lang)+' · '+next.lang+' (device voice)');
  return next.voiceURI||'';
}
function rwSpeechPickVoice(voices,lang){
  var list=voices||[],preferred=rwTuskSelectedVoice();
  if(preferred){
    var chosen=list.filter(function(v){return v.voiceURI===preferred && String(v.lang||'').toLowerCase()===String(lang).toLowerCase();})[0];
    if(chosen)return chosen;
  }
  var exact=list.filter(function(v){return String(v.lang||'').toLowerCase()===String(lang).toLowerCase();});
  if(exact.length)return exact[0];
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

/* Curated spoken-only local toponyms, when Hindi voice is selected.
   Visible answers remain unchanged. Do not mistake this for a Kumaoni accent
   model: the sound still depends on the installed Hindi TTS voice. */
function rwTuskSpeechPronunciation(text){
  var source=String(text||'');
  if(rwSpeechOutputLang(source)!=='hi-IN')return source;
  var names={
    'Kumaon':'कुमाऊँ','Almora':'अल्मोड़ा','Nainital':'नैनीताल',
    'Chakrata':'चकराता','Kanatal':'कनाताल','Kausani':'कौसानी',
    'Mukteshwar':'मुक्तेश्वर','Binsar':'बिनसर','Ranikhet':'रानीखेत',
    'Pithoragarh':'पिथौरागढ़','Harsil':'हर्षिल','Jibhi':'जीभी'
  };
  return source.replace(/\b(Kumaon|Almora|Nainital|Chakrata|Kanatal|Kausani|Mukteshwar|Binsar|Ranikhet|Pithoragarh|Harsil|Jibhi)\b/gi,
    function(match){return names[Object.keys(names).filter(function(k){return k.toLowerCase()===match.toLowerCase();})[0]]||match;});
}
