// @ts-nocheck
/* Ailon Tusk voice studio: opt-in turn-taking, not a claim of full-duplex audio.
   No microphone is opened on page load. Stop always cancels the loop. */
(function(root){
  var state={active:false,turns:0,limit:8,phase:'idle',answerPending:false};
  var panel=null,stage=null,body=null,subtitle=null,reply=null,cards=null;
  function escape(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function ensure(){
    if(typeof document==='undefined') return false;
    if(panel && panel.isConnected) return true;
    panel=document.createElement('section');
    panel.className='rw-orb-shell';panel.id='rwTuskStudio';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Ailon Tusk voice conversation');
    panel.innerHTML='<div class="rw-orb-layout"><header class="rw-orb-head"><strong>✦ Ailon Tusk</strong><span>Voice conversation · beta</span><button type="button" class="rw-orb-close" aria-label="Close voice conversation">✕</button></header><div class="rw-orb-stage" data-phase="idle"><div class="rw-orb-glow"><div class="rw-orb-core" aria-hidden="true"></div><div class="rw-orb-ring" aria-hidden="true"></div></div><p class="rw-orb-phase" role="status" aria-live="polite">Ready to listen</p></div><p class="rw-orb-transcript"></p><div class="rw-orb-reply" aria-label="Tusk answer"></div><section class="rw-orb-cards" aria-label="Travel results"></section><div class="rw-orb-controls"><button type="button" data-action="listen">🎙️ Speak</button><button type="button" data-action="interrupt">⏹ Stop</button><button type="button" data-action="read">🔊 Read again</button><button type="button" data-action="language">🌐 Voice language</button></div><p class="rw-orb-hint">Talk in Hindi, English or Hinglish. Responses depend on available device voices. Stop at any time. No always-on microphone.</p></div>';
    document.body.appendChild(panel);
    stage=panel.querySelector('.rw-orb-stage');body=panel.querySelector('.rw-orb-transcript');subtitle=panel.querySelector('.rw-orb-phase');reply=panel.querySelector('.rw-orb-reply');cards=panel.querySelector('.rw-orb-cards');
    panel.querySelector('.rw-orb-close').onclick=stop;
    panel.addEventListener('keydown',function(e){if(e.key==='Escape')stop();});
    panel.querySelector('[data-action="interrupt"]').onclick=stop;
    panel.querySelector('[data-action="listen"]').onclick=function(){listen(true);};
    panel.querySelector('[data-action="read"]').onclick=function(){if(root.rwTuskReplaySpeech)root.rwTuskReplaySpeech();};
    panel.querySelector('[data-action="language"]').onclick=function(){if(root.rwTuskCycleVoicePreference)root.rwTuskCycleVoicePreference();};
    return true;
  }
  function setPhase(phase,message){
    state.phase=phase;
    if(!ensure())return;
    stage.dataset.phase=phase;subtitle.textContent=message||phase;
  }
  function listen(manual){
    if(!state.active && !manual)return;
    if(typeof _rwVoiceActive!=='undefined' && _rwVoiceActive)return;
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
    body.textContent='';reply.textContent='';if(cards)cards.replaceChildren();
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
  /* Safe, responsive, structured results; every value is textContent.
     Cards are navigation prompts, not live prices/road-open claims. */
  function resultModel(raw,intents){
    var query=String(raw||'').toLowerCase();
    var name=String(intents&&intents.dest||'').trim().slice(0,90);
    if(!name)return null;
    var type=/\b(landslide|road|blocked|traffic|safety|route|rasta|raasta)\b|सड़क|रास्ता/.test(query)?'road':
      /\b(hotel|homestay|stay|room|booking|book)\b|होटल|कमरा/.test(query)?'stay':
      /\b(weather|rain|snow|mausam|barish)\b|मौसम|बारिश/.test(query)?'weather':
      /\b(food|cafe|eat|khana|khaana)\b|खाना|भोजन/.test(query)?'food':'trip';
    var labels={road:['Route & road safety','Review dated official advisories'],
      stay:['Explore verified stays','Check availability before booking'],
      weather:['Weather & conditions','Check the forecast for your dates'],
      food:['Local food','Discover authentic regional dishes'],
      trip:['Discover '+name,'Create a day-wise travel plan']};
    return {name:name,type:type,title:labels[type][0],hint:labels[type][1]};
  }
  function renderResults(raw,intents){
    if(!cards)return null;
    cards.replaceChildren();
    var data=resultModel(raw,intents);
    if(!data)return null;
    var card=document.createElement('article');card.className='rw-orb-card';
    var badge=document.createElement('div');badge.className='rw-orb-badge';badge.textContent='✦ Travel guide · '+data.type;
    var heading=document.createElement('h3');heading.textContent=data.name;
    var summary=document.createElement('p');summary.textContent=data.hint;
    var buttons=document.createElement('div');buttons.className='rw-orb-card-actions';
    function action(label,fn){
      var b=document.createElement('button');b.type='button';b.textContent=label;
      b.addEventListener('click',fn);buttons.appendChild(b);
    }
    action('🗺️ Plan trip',function(){
      stop();if(typeof cpGoPlan==='function')cpGoPlan(data.name,0);
    });
    action(data.type==='road'?'⚠️ Check road alerts':data.type==='stay'?'🏡 Find stays':'💬 Ask follow-up',function(){
      stop();
      if(typeof cpFollow==='function'){
        var prompts={road:'Check dated official road and safety advisories for ',
          stay:'Find verified stays and confirm live availability in ',
          weather:'Show the dated weather forecast for ',
          food:'Recommend local food in ',trip:'Tell me more about visiting '};
        cpFollow(prompts[data.type]+data.name);
      }
    });
    card.appendChild(badge);card.appendChild(heading);card.appendChild(summary);card.appendChild(buttons);
    cards.appendChild(card);return data;
  }
  function answer(html,raw,intents){
    if(!state.active || !state.answerPending)return false;
    state.answerPending=false;
    if(!ensure())return false;
    var div=document.createElement('div');div.innerHTML=String(html||'');
    div.querySelectorAll('script,style,button,nav').forEach(function(n){n.remove();});
    var speech=String(div.textContent||'').replace(/\s+/g,' ').trim().slice(0,650);
    if(!speech){setPhase('ready','Answer is on screen · tap Speak to continue');return false;}
    reply.textContent=speech;
    renderResults(raw,intents);
    try{if(root.RWConnectedDiscovery&&cards)root.RWConnectedDiscovery.renderInto(cards,raw,intents);}catch(e){}
    if(/\b(pay|payment|refund|checkout|otp|password|emergency|sos)\b/i.test(String(raw||''))){
      setPhase('ready','Important details are on screen. Tap Speak for another question.');
      return false;
    }
    setPhase('speaking','Tusk is speaking · interrupt any time');
    if(root.rwVoiceEnabled && !root.rwVoiceEnabled()){
      setPhase('ready','Voice is muted in Settings. The answer is above.');
      return false;
    }
    if(typeof tuskSpeak==='function'){
      tuskSpeak(speech);
      // Native TTS completion semantics differ; users can continue via Speak.
      if(root.Capacitor || (root.RW && root.RW.speak))setPhase('ready','Listen to the reply, then tap Speak for the next turn.');
    }else setPhase('ready','Read your answer above, then tap Speak.');
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
    },180);
  }
  function speechFailure(){if(state.active)setPhase('ready','Voice unavailable. Read above, then tap Speak.');}
  var api={start:start,stop:stop,listen:listen,transcript:transcript,answer:answer,resultModel:resultModel,speechEnd:speechEnd,speechFailure:speechFailure,state:state};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RWTuskVoiceStudio=api;
})(typeof window!=='undefined'?window:null);
