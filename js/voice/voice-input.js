// @ts-nocheck
function copilotVoiceHero(){ rwVoiceStart('heroInput'); }
var _rwVoiceTarget='heroInput';
function rwVoiceStart(targetId){
  _rwVoiceTarget = targetId || 'heroInput';
  /* Native bridge (old wrapper) if present */
  if(window.RW && typeof RW.startVoice==='function'){
    try{ RW.startVoice(); showToast('\ud83c\udfa4 Listening\u2026'); return; }catch(e){ /* toast is a nice-to-have, ignore */ }
  }
  /* Capacitor SpeechRecognition plugin (community, installed in the app build) */
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.SpeechRecognition){
    var SRP=Capacitor.Plugins.SpeechRecognition;
    (function(){
      /* v7 community plugin flow: check availability -> ensure permission ->
         start with a result listener (some versions resolve start(), others
         emit 'partialResults'/return matches). We handle both. */
      function begin(){
        showToast('\ud83c\udfa4 Listening\u2026');
        var got=false;
        try{
          SRP.addListener && SRP.addListener('partialResults', function(data){
            var t=data && data.matches && data.matches[0];
            if(t && !got){ got=true; try{ SRP.stop(); }catch(e){ /* best-effort, ignore */ } rwVoiceResult(t); }
          });
        }catch(e){ /* best-effort, ignore */ }
        SRP.start({language:'en-IN', maxResults:2, partialResults:true, popup:true})
          .then(function(r){
            var t=r && r.matches && r.matches[0];
            if(t && !got){ got=true; rwVoiceResult(t); }
            else if(!got){ setTimeout(function(){ if(!got) showToast('Didn\u2019t catch that \u2014 speak clearly, or type'); }, 800); }
          })
          .catch(function(){ if(!got) showToast('Mic couldn\u2019t start \u2014 check mic permission in Settings, or type'); });
      }
      Promise.resolve(SRP.checkPermissions ? SRP.checkPermissions() : {speechRecognition:'granted'})
        .then(function(p){
          var ok = p && (p.speechRecognition==='granted' || p.speechRecognition==='limited');
          if(ok) return true;
          return (SRP.requestPermissions ? SRP.requestPermissions() : Promise.resolve({speechRecognition:'granted'}))
            .then(function(rp){ return rp && rp.speechRecognition==='granted'; });
        })
        .then(function(granted){
          if(granted){ begin(); }
          else { showToast('Mic permission is off \u2014 allow Microphone in Settings, then tap \ud83c\udfa4 again'); }
        })
        .catch(function(){ begin(); }); /* some versions lack checkPermissions — just try */
    })();
    return;
  }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ showToast('\ud83c\udfa4 Voice input needs the app build with the mic add-on \u2014 for now, just type, it works great!'); return; }
  var rec=new SR(); rec.lang='en-IN'; rec.interimResults=false;
  rec.onresult=function(ev){ rwVoiceResult(ev.results[0][0].transcript); };
  rec.onerror=function(e){ showToast((e&&e.error==='not-allowed')?'Mic permission is off \u2014 allow it in Settings, or just type':'Didn\u2019t catch that \u2014 try again or type'); };
  try{ rec.start(); showToast('\ud83c\udfa4 Listening\u2026'); }catch(e){ showToast('Voice didn\u2019t start \u2014 typing works too!'); }
}
/* Called by the native bridge (and by the web path above) */
function rwVoiceResult(text){
  var inp = el(_rwVoiceTarget) || el('heroInput'); if(!inp || !text) return;
  inp.value = text;
  copilotSend(_rwVoiceTarget==='heroInput');
}
function rwVoiceState(state, msg){
  if(state==='error' && msg) showToast(msg);
  if(state==='listening') showToast('\ud83c\udfa4 Listening\u2026');
}
