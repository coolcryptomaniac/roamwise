// @ts-nocheck
/* Accessible, interruptible voice capture for the existing Tusk composer.
   One active session, one final transcript, no background microphone capture. */
function copilotVoiceHero(){ rwVoiceStart('heroInput'); }
/* Honor explicit Tusk speech language for recognition too. 'auto' retains
   the existing site-language default; code-switching remains best-effort. */
function rwVoiceInputLanguage(){
  try{
    var selected=typeof rwTuskVoicePreference==='function'?rwTuskVoicePreference():'auto';
    if(selected==='hi-IN'||selected==='en-IN')return selected;
  }catch(e){}
  return typeof rwSpeechLang==='function'?rwSpeechLang():'en-IN';
}

var _rwVoiceTarget='heroInput', _rwVoiceSession=0, _rwVoiceActive=false;
var _rwVoiceStop=null, _rwVoiceListener=null;
function rwVoiceNotice(state, message){
  if(typeof document==='undefined') return;
  var input=el(_rwVoiceTarget) || el('heroInput');
  if(!input || !input.parentNode) return;
  var box=el('rwVoiceNotice');
  if(!box){
    box=document.createElement('div');
    box.id='rwVoiceNotice'; box.setAttribute('role','status');
    box.setAttribute('aria-live','polite'); box.className='rw-voice-notice';
    input.parentNode.appendChild(box);
  }
  box.textContent=message || '';
  box.dataset.state=state;
  input.setAttribute('aria-describedby','rwVoiceNotice');
  // Expose live microphone state to CSS without binding to a particular button.
  try{ document.documentElement.classList.toggle('rw-voice-listening',state==='listening'); }catch(e){}
}
function rwVoiceStop(){
  _rwVoiceSession++; _rwVoiceActive=false;
  var stop=_rwVoiceStop; _rwVoiceStop=null;
  if(stop) try{ stop(); }catch(e){}
  if(_rwVoiceListener && _rwVoiceListener.remove) try{ _rwVoiceListener.remove(); }catch(e){}
  _rwVoiceListener=null;
  rwVoiceNotice('idle','Microphone stopped. Tap the mic to speak again.');
}
function rwVoiceStart(targetId){
  if(_rwVoiceActive){ rwVoiceStop(); return; } // tap again = stop, not a second recorder
  _rwVoiceTarget=targetId || 'heroInput';
  if(typeof tuskStopSpeech==='function') tuskStopSpeech(); // natural barge-in
  var token=++_rwVoiceSession; _rwVoiceActive=true;
  rwVoiceNotice('listening','Listening… Tap the mic again to stop.');
  function valid(){ return token===_rwVoiceSession && _rwVoiceActive; }
  function fail(message){
    if(!valid()) return;
    rwVoiceStop(); rwVoiceNotice('error',message);
    if(typeof showToast==='function') showToast(message);
  }
  function finalText(text){
    if(!valid() || !String(text||'').trim()) return;
    rwVoiceStop(); rwVoiceResult(String(text).trim());
  }
  /* Native bridge (legacy Android wrapper). A native callback calls rwVoiceResult. */
  if(window.RW && typeof RW.startVoice==='function'){
    try{
      _rwVoiceStop=function(){ if(typeof RW.stopVoice==='function') RW.stopVoice(); };
      RW.startVoice(); return;
    }catch(e){ _rwVoiceStop=null; }
  }
  /* Capacitor plugin: result can arrive through start() or listener.
     A session token + finalText guard prevents duplicate submissions. */
  var plugin=window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.SpeechRecognition;
  if(plugin){
    _rwVoiceStop=function(){ if(plugin.stop) plugin.stop(); };
    Promise.resolve(plugin.checkPermissions ? plugin.checkPermissions():{speechRecognition:'granted'})
      .then(function(p){
        if(!valid()) return false;
        if(p && (p.speechRecognition==='granted'||p.speechRecognition==='limited')) return true;
        return plugin.requestPermissions ? plugin.requestPermissions().then(function(v){return v && v.speechRecognition==='granted';}):false;
      })
      .then(function(granted){
        if(!valid()) return;
        if(!granted) return fail('Microphone permission is off. Enable it in Settings or type.');
        if(plugin.addListener) Promise.resolve(plugin.addListener('partialResults',function(d){
          // Some plugin builds emit a single finalized match here.
          var match=d && d.matches && d.matches[0];
          if(match) finalText(match);
        })).then(function(listener){
          if(valid()) _rwVoiceListener=listener;
          else if(listener && listener.remove) listener.remove();
        }).catch(function(){});
        Promise.resolve(plugin.start({language:rwVoiceInputLanguage(),maxResults:2,partialResults:false,popup:true}))
          .then(function(v){ if(v && v.matches && v.matches[0]) finalText(v.matches[0]); })
          .catch(function(){fail('Voice input unavailable. Please type or check microphone permissions.');});
      }).catch(function(){fail('Microphone permission or voice recognition failed. Please type instead.');});
    return;
  }
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return fail('Voice input is not supported in this browser. Please type instead.');
  try{
    var rec=new SR();
    rec.lang=rwVoiceInputLanguage();
    rec.interimResults=true; rec.continuous=false;
    rec.onresult=function(e){
      if(!valid())return;
      var partial='',complete='';
      for(var i=e.resultIndex||0;i<(e.results||[]).length;i++){
        var result=e.results[i],choice=result&&result[0];
        if(!choice)continue;
        if(result.isFinal!==false)complete+=String(choice.transcript||'');
        else partial+=String(choice.transcript||'');
      }
      if(complete.trim())finalText(complete);
      else if(partial.trim()&&window.RWTuskVoiceStudio&&
        typeof window.RWTuskVoiceStudio.partialTranscript==='function'){
        window.RWTuskVoiceStudio.partialTranscript(partial);
      }
    };
    rec.onerror=function(e){ fail(e && e.error==='not-allowed'?'Microphone permission denied. Enable it in Settings.':'Voice recognition failed. Please try again or type.'); };
    rec.onend=function(){ if(valid()) fail('Listening ended without a result. Try again or type.'); };
    _rwVoiceStop=function(){rec.stop();}; rec.start();
  }catch(e){fail('Could not start the microphone. Please type instead.');}
}
/* Native bridge callback (also used by the browser and Capacitor paths). */
function rwVoiceResult(text){
  if(_rwVoiceActive) rwVoiceStop();
  var input=el(_rwVoiceTarget)||el('heroInput');
  if(!input || !String(text||'').trim()) return;
  input.value=String(text).trim();
  try{ if(window.RWTuskVoiceStudio) RWTuskVoiceStudio.transcript(input.value); }catch(e){}
  rwVoiceNotice('complete','Voice captured. Preparing your travel answer.');
  copilotSend(_rwVoiceTarget==='heroInput');
}
function rwVoiceState(state,msg){
  if(state==='error'){rwVoiceStop();rwVoiceNotice('error',msg||'Voice error. Please type instead.');}
  else if(state==='listening') rwVoiceNotice('listening','Listening… Tap the mic again to stop.');
}
