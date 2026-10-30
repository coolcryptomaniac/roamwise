// @ts-nocheck
/* Ailon Tusk voice studio: opt-in turn-taking, not a claim of full-duplex audio.
   No microphone is opened on page load. Stop always cancels the loop. */
(function(root){
  var state={active:false,turns:0,limit:8,phase:'idle',answerPending:false};
  var panel=null,stage=null,body=null,subtitle=null,reply=null;
  function escape(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function ensure(){
    if(typeof document==='undefined') return false;
    if(panel && panel.isConnected) return true;
    panel=document.createElement('section');
    panel.className='rw-orb-shell';panel.id='rwTuskStudio';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Ailon Tusk voice conversation');
    panel.innerHTML='<div class="rw-orb-layout"><header class="rw-orb-head"><strong>✦ Ailon Tusk</strong><span>Voice conversation · beta</span><button type="button" class="rw-orb-close" aria-label="Close voice conversation">✕</button></header><div class="rw-orb-stage" data-phase="idle"><div class="rw-orb-glow"><div class="rw-orb-core" aria-hidden="true"></div><div class="rw-orb-ring" aria-hidden="true"></div></div><p class="rw-orb-phase" role="status" aria-live="polite">Ready to listen</p></div><p class="rw-orb-transcript"></p><div class="rw-orb-reply" aria-label="Tusk answer"></div><div class="rw-orb-controls"><button type="button" data-action="listen">🎙️ Speak</button><button type="button" data-action="interrupt">⏹ Stop</button><button type="button" data-action="read">🔊 Read again</button></div><p class="rw-orb-hint">Talk in Hindi, English or Hinglish. Responses depend on available device voices. Stop at any time. No always-on microphone.</p></div>';
    document.body.appendChild(panel);
    stage=panel.querySelector('.rw-orb-stage');body=panel.querySelector('.rw-orb-transcript');subtitle=panel.querySelector('.rw-orb-phase');reply=panel.querySelector('.rw-orb-reply');
    panel.querySelector('.rw-orb-close').onclick=stop;
    panel.querySelector('[data-action="interrupt"]').onclick=stop;
    panel.querySelector('[data-action="listen"]').onclick=function(){listen(true);};
    panel.querySelector('[data-action="read"]').onclick=function(){if(root.rwTuskReplaySpeech)root.rwTuskReplaySpeech();};
    return true;
  }
  function setPhase(phase,message){
    state.phase=phase;
    if(!ensure())return;
    stage.dataset.phase=phase;subtitle.textContent=message||phase;
  }
  function listen(manual){
    if(!state.active && !manual)return;
    if(!ensure())return;
    state.active=true;state.answerPending=false;
    var target=(typeof el==='function' && el('cpInput'))?'cpInput':'heroInput';
    setPhase('listening','Listening · बोलिए');
    if(typeof rwVoiceStart==='function') rwVoiceStart(target);
    else setPhase('error','Voice input unavailable — type instead');
  }
  function start(){
    if(!ensure())return false;
    panel.hidden=false;state.active=true;state.turns=0;state.answerPending=false;
    body.textContent='';reply.textContent='';
    listen(true);panel.querySelector('[data-action="interrupt"]').focus();
    return true;
  }
  function stop(){
    state.active=false;state.answerPending=false;
    if(typeof rwVoiceStop==='function')rwVoiceStop();
    if(typeof tuskStopSpeech==='function')tuskStopSpeech();
    if(panel)panel.hidden=true;
    state.phase='idle';
  }
  function transcript(t){
    if(!state.active)return;
    state.turns++;state.answerPending=true;
    if(body)body.textContent='You: '+String(t||'').slice(0,240);
    setPhase('thinking','Finding your answer…');
  }
  function answer(html,raw){
    if(!state.active || !state.answerPending)return false;
    state.answerPending=false;
    if(!ensure())return false;
    var div=document.createElement('div');div.innerHTML=String(html||'');
    div.querySelectorAll('script,style,button,nav').forEach(function(n){n.remove();});
    var speech=String(div.textContent||'').replace(/\\s+/g,' ').trim().slice(0,650);
    if(!speech){setPhase('ready','Answer is on screen · tap Speak to continue');return false;}
    reply.textContent=speech;
    if(/\\b(pay|payment|refund|checkout|otp|password|emergency|sos)\\b/i.test(String(raw||''))){
      setPhase('ready','Important details are on screen. Tap Speak for another question.');
      return false;
    }
    setPhase('speaking','Tusk is speaking · interrupt any time');
    if(root.rwVoiceEnabled && !root.rwVoiceEnabled()){
      setPhase('ready','Voice is muted in Settings. The answer is above.');
      return false;
    }
    if(typeof tuskSpeak==='function')tuskSpeak(speech);
    else setPhase('ready','Read your answer above, then tap Speak.');
    return true;
  }
  function speechEnd(){
    if(!state.active || state.phase!=='speaking')return;
    if(state.turns>=state.limit){setPhase('ready','Conversation paused after 8 turns. Tap Speak to continue.');return;}
    // A new capture only follows an explicit opt-in start; permission/browser
    // restrictions can still require another tap.
    setPhase('ready','Your turn · tap Speak or continue talking');
    if(typeof setTimeout==='function')setTimeout(function(){
      if(state.active && state.phase==='ready')listen(false);
    },550);
  }
  function speechFailure(){if(state.active)setPhase('ready','Voice unavailable. Read above, then tap Speak.');}
  var api={start:start,stop:stop,listen:listen,transcript:transcript,answer:answer,speechEnd:speechEnd,speechFailure:speechFailure,state:state};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RWTuskVoiceStudio=api;
})(typeof window!=='undefined'?window:null);
