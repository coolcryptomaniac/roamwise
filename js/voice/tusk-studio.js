// @ts-nocheck
/* Ailon Tusk voice studio: opt-in turn-taking, not a claim of full-duplex audio.
   No microphone is opened on page load. Stop always cancels the loop. */
(function(root){
  var state={active:false,turns:0,limit:8,phase:'idle',answerPending:false,style:'friendly',session:0,interim:''};
  var panel=null,stage=null,body=null,subtitle=null,reply=null,cards=null,details=null;
  function escape(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function ensure(){
    if(typeof document==='undefined') return false;
    if(panel && panel.isConnected) return true;
    panel=document.createElement('section');
    panel.className='rw-orb-shell';panel.id='rwTuskStudio';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Ailon Tusk voice conversation');
    panel.innerHTML='<div class="rw-orb-layout"><header class="rw-orb-head"><strong>☁️ ✦ Ailon Tusk</strong><span>RoamWise · Shinobi voice</span><button type="button" class="rw-orb-close" aria-label="Close voice conversation">✕</button></header><div class="rw-orb-stage" data-phase="idle"><div class="rw-orb-glow"><div class="rw-orb-core" aria-hidden="true"><span class="rw-orb-brand">RW</span></div><div class="rw-orb-ring" aria-hidden="true"></div></div><p class="rw-orb-phase" role="status" aria-live="polite">Ready to listen</p></div><p class="rw-orb-transcript"></p><div class="rw-orb-reply" aria-label="Tusk answer"></div><details class="rw-orb-full-answer" open><summary>📖 Full travel answer · tap to collapse</summary><div class="rw-orb-full-content"></div></details><section class="rw-orb-cards" aria-label="Travel results"></section><div class="rw-orb-controls"><button type="button" data-action="listen">🎙️ Speak</button><button type="button" data-action="interrupt">⏹ Stop</button><button type="button" data-action="read">🔊 Read again</button><button type="button" data-action="language">🌐 Voice language</button><button type="button" data-action="style">🎭 Friendly voice</button><button type="button" data-action="actor" aria-label="Select installed Indian voice actor">🎧 Voice actor</button></div><p class="rw-orb-hint">Talk in Hindi, English or Hinglish. Responses depend on available device voices. Stop at any time. No always-on microphone.</p></div>';
    document.body.appendChild(panel);
    stage=panel.querySelector('.rw-orb-stage');body=panel.querySelector('.rw-orb-transcript');subtitle=panel.querySelector('.rw-orb-phase');reply=panel.querySelector('.rw-orb-reply');details=panel.querySelector('.rw-orb-full-content');cards=panel.querySelector('.rw-orb-cards');
    panel.querySelector('.rw-orb-close').onclick=stop;
    panel.addEventListener('keydown',function(e){if(e.key==='Escape')stop();});
    panel.querySelector('[data-action="interrupt"]').onclick=stop;
    panel.querySelector('[data-action="listen"]').onclick=function(){listen(true);};
    panel.querySelector('[data-action="read"]').onclick=function(){if(root.rwTuskReplaySpeech)root.rwTuskReplaySpeech();};
    panel.querySelector('[data-action="language"]').onclick=function(){if(root.rwTuskCycleVoicePreference)root.rwTuskCycleVoicePreference();};
    panel.querySelector('[data-action="actor"]').onclick=function(){if(root.rwTuskCycleActorVoice)root.rwTuskCycleActorVoice();};
    panel.querySelector('[data-action="style"]').onclick=function(){
      var modes=['friendly','guide','kumaoni-style'],i=modes.indexOf(state.style);
      state.style=modes[(i+1)%modes.length];
      this.textContent=state.style==='guide'?'📚 Educational voice':state.style==='kumaoni-style'?'🏔️ Kumaoni-style':'🎭 Friendly voice';
      if(typeof root.showToast==='function')root.showToast('Voice style: '+state.style+' · regional style, not a native accent voice');
    };
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
    state.active=true;state.answerPending=false;state.interim='';
    var target=(typeof el==='function' && el('cpInput'))?'cpInput':'heroInput';
    setPhase('listening','Listening · बोलिए');
    if(typeof rwVoiceStart==='function') rwVoiceStart(target);
    else setPhase('error','Voice input unavailable — type instead');
  }
  function start(){
    if(!ensure())return false;
    panel.hidden=false;state.active=true;state.turns=0;state.answerPending=false;state.session++;
    body.textContent='';reply.textContent='';if(details)details.textContent='';if(cards)cards.replaceChildren();
    listen(true);panel.querySelector('[data-action="interrupt"]').focus();
    return true;
  }
  function stop(){
    state.active=false;state.answerPending=false;state.session++;
    if(typeof rwVoiceStop==='function')rwVoiceStop();
    if(typeof tuskStopSpeech==='function')tuskStopSpeech();
    if(panel)panel.hidden=true;
    state.phase='idle';
  }
  function partialTranscript(t){
    if(!state.active || state.phase!=='listening')return false;
    state.interim=String(t||'').slice(0,260);
    if(body)body.textContent='You · listening: '+state.interim;
    return true;
  }
  function transcript(t){
    if(!state.active)return;
    state.interim='';
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
    var badge=document.createElement('div');badge.className='rw-orb-badge';badge.textContent='✦ '+({road:'Route safety',stay:'Places to stay',weather:'Weather',food:'Local flavours',trip:'Destination guide'}[data.type]);
    var pictogram=document.createElement('div');pictogram.className='rw-orb-card-icon';
    pictogram.setAttribute('aria-hidden','true');pictogram.textContent=({road:'🛣️',stay:'🏡',weather:'🌤️',food:'🍲',trip:'🏔️'}[data.type]);
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
    card.appendChild(pictogram);card.appendChild(badge);card.appendChild(heading);card.appendChild(summary);card.appendChild(buttons);
    if(intents && Number(intents.days)>0 && Number(intents.days)<=60){
      var length=document.createElement('div');length.className='rw-orb-card-duration';
      length.textContent='🗓️ '+Math.round(Number(intents.days))+' day trip · dates and prices need confirmation';card.appendChild(length);
    }
    cards.appendChild(card);return data;
  }
  /* Expressive spoken introductions only. The factual answer remains intact.
     Kumaoni-inspired phrases are language style, not cloned regional audio. */
  function spokenStyle(text,query){
    var say=String(text||''),q=String(query||'').toLowerCase();
    var hindi=/[\u0900-\u097f]/.test(say)||
      (typeof root.rwSpeechOutputLang==='function' && root.rwSpeechOutputLang(say)==='hi-IN');
    var route=/\b(road|route|traffic|blocked|landslide|rasta|raasta)\b|सड़क|रास्ता/.test(q);
    var educational=/\b(history|culture|why|how|explain|facts|learn|temple)\b|इतिहास|संस्कृति|मंदिर/.test(q);
    if(state.style==='guide'){
      return say; // Guide mode stays factual without prefixed chatter.
    }
    if(state.style==='kumaoni-style'){
      return (hindi?'भुला, सुनो ज़रा। ':'Bhula, suno zara. ')+say;
    }
    if(route)return (hindi?'रास्ते की बात है, थोड़ा ध्यान से। ':'Road trip? Safety first, adventure second! ')+say;
    if(educational)return (hindi?'चलो, एक नई बात सीखते हैं। ':'A little travel wisdom, coming right up! ')+say;
    return (hindi?'अरे वाह, चलिए जानते हैं। ':'Nice! Here is what I found. ')+say;
  }
  function answer(html,raw,intents){
    if(!state.active || !state.answerPending)return false;
    state.answerPending=false;
    if(!ensure())return false;
    var div=document.createElement('div');div.innerHTML=String(html||'');
    div.querySelectorAll('script,style,button,nav,.rw-connected,.rw-rail').forEach(function(n){n.remove();});
    // Preserve all answer text in the Studio. The voice reads a shorter excerpt,
    // but users must not have to close the Studio to see the full itinerary.
    var complete=String(div.textContent||'').replace(/\s+/g,' ').trim().slice(0,20000);
    var speech=complete.slice(0,650);
    if(!complete){setPhase('ready','Answer is on screen · tap Speak to continue');return false;}
    if(details)details.textContent=complete;
    reply.textContent=complete.length>650?'🔊 Voice preview: '+speech+'…':'🔊 '+speech;
    renderResults(raw,intents);
    try{if(root.RWConnectedDiscovery&&cards)root.RWConnectedDiscovery.renderInto(cards,raw,intents);}catch(e){}
    if(/\b(pay|payment|refund|checkout|otp|password|emergency|sos)\b/i.test(String(raw||''))){
      setPhase('ready','Important details are on screen. Tap Speak for another question.');
      return false;
    }
    // Never narrate a provider failure as though it were a successful itinerary.
    if(/(?:AI engines unreachable|Too many requests|rate limit|service unavailable)/i.test(complete)){
      setPhase('ready','AI provider unavailable · review the message or retry later');
      return false;
    }
    setPhase('speaking','Tusk is speaking · interrupt any time');
    if(root.rwVoiceEnabled && !root.rwVoiceEnabled()){
      setPhase('ready','Voice is muted in Settings. The answer is above.');
      return false;
    }
    if(typeof tuskSpeak==='function'){
      tuskSpeak(spokenStyle(speech,raw));
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
    var session=state.session;
    if(typeof setTimeout==='function')setTimeout(function(){
      if(state.active && session===state.session && state.phase==='ready')listen(false);
    },180);
  }
  function speechFailure(){if(state.active)setPhase('ready','Voice unavailable. Read above, then tap Speak.');}
  var api={start:start,stop:stop,listen:listen,transcript:transcript,partialTranscript:partialTranscript,answer:answer,resultModel:resultModel,spokenStyle:spokenStyle,speechEnd:speechEnd,speechFailure:speechFailure,state:state};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RWTuskVoiceStudio=api;
})(typeof window!=='undefined'?window:null);
