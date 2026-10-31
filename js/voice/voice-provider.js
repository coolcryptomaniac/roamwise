// @ts-nocheck
/* User-funded voice: default browser voices cost RoamWise no model inference.
   Sarvam BYOK remains explicit opt-in and requires configured HTTPS Worker.
   The BYOK key is held only in this page's JS memory; never persisted/logged. */
(function(root){
  var provider='device',model='bulbul:v4-flash',key='',audio=null,nonce=0;
  try{if(root.localStorage&&localStorage.getItem('rw_tusk_voice_provider')==='sarvam')provider='sarvam';}catch(e){}
  function endpoint(){
    var config=root.RW_CONFIG||{},base=String(config.workerUrl||'');
    if(!/^https:\/\//.test(base))return '';
    return base.replace(/\/+$/,'')+'/voice/sarvam/byok';
  }
  function selected(){return provider;}
  function setProvider(value){
    provider=value==='sarvam'?'sarvam':'device';
    try{localStorage.setItem('rw_tusk_voice_provider',provider);}catch(e){}
    return provider;
  }
  function setModel(value){model=value==='bulbul:v3'?'bulbul:v3':'bulbul:v4-flash';return model;}
  function setKey(value){key=String(value||'').trim().slice(0,512);return !!key;}
  function clearKey(){key='';stop();}
  function hasKey(){return !!key;}
  function stop(){
    nonce++;
    if(audio){try{audio.pause();audio.src='';}catch(e){}audio=null;}
  }
  function speak(text,language){
    if(provider!=='sarvam')return Promise.resolve(false);
    if(!key||!endpoint()){
      if(typeof root.showToast==='function')root.showToast(key?
        'Sarvam BYOK needs the configured HTTPS Cloudflare voice gateway. Using device voice.':
        'Add your Sarvam API key in Voice Provider Settings. Using device voice.');
      return Promise.resolve(false);
    }
    var say=String(text||'').slice(0,650),tag=++nonce;
    var voiceLang=language==='hi-IN'?'hi-IN':'en-IN';
    return root.fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},
      cache:'no-store',body:JSON.stringify({key:key,text:say,language_code:voiceLang,model:model})})
      .then(function(response){if(!response.ok)throw Error('Sarvam '+response.status);return response.json();})
      .then(function(result){
        if(tag!==nonce)return true;
        var data=String(result&&result.audio||'');
        if(!data||data.length>3500000||!/^[A-Za-z0-9+/=]+$/.test(data))throw Error('Invalid audio');
        audio=new Audio('data:audio/mpeg;base64,'+data);
        audio.onended=function(){if(tag!==nonce)return;audio=null;
          if(root.RWTuskVoiceStudio)root.RWTuskVoiceStudio.speechEnd();};
        return audio.play().then(function(){return true;});
      }).catch(function(){
        if(tag!==nonce)return true;
        if(typeof root.showToast==='function')root.showToast('Sarvam voice unavailable — using device voice');
        return false;
      });
  }
  function mount(){
    if(typeof document==='undefined')return;
    var host=document.querySelector('#settingsOverlay .modal-body');
    if(!host||document.getElementById('rwVoiceProviderSettings'))return;
    var block=document.createElement('section');block.id='rwVoiceProviderSettings';
    block.className='rw-voice-provider-panel';
    var title=document.createElement('h3');title.textContent='🎙️ Ailon Tusk · Voice provider';block.appendChild(title);
    var note=document.createElement('p');note.textContent='Free default: your device voice. Optional Sarvam BYOK is charged by Sarvam to your own account. No unlimited cloud voice is promised.';block.appendChild(note);
    var label=document.createElement('label');label.textContent='Voice mode ';
    var select=document.createElement('select');select.id='rwVoiceProviderPick';
    [['device','Free device voice'],['sarvam','Sarvam Bulbul · BYOK']].forEach(function(x){
      var option=document.createElement('option');option.value=x[0];option.textContent=x[1];select.appendChild(option);});
    select.value=provider;select.onchange=function(){setProvider(select.value);};
    label.appendChild(select);block.appendChild(label);
    var modelLabel=document.createElement('label');modelLabel.textContent=' Sarvam model ';
    var modelSelect=document.createElement('select');modelSelect.id='rwVoiceModelPick';
    [['bulbul:v4-flash','Bulbul v4 Flash · latest, lower cost'],['bulbul:v3','Bulbul v3 · stable']].forEach(function(x){
      var opt=document.createElement('option');opt.value=x[0];opt.textContent=x[1];modelSelect.appendChild(opt);});
    modelSelect.value=model;modelSelect.onchange=function(){setModel(modelSelect.value);};modelLabel.appendChild(modelSelect);block.appendChild(modelLabel);
    var keyLabel=document.createElement('label');keyLabel.textContent=' API key (this tab only) ';
    var keyInput=document.createElement('input');keyInput.type='password';keyInput.autocomplete='off';keyInput.placeholder='Paste Sarvam API key';keyInput.id='rwVoiceKeyInput';keyLabel.appendChild(keyInput);block.appendChild(keyLabel);
    var save=document.createElement('button');save.type='button';save.textContent='Use key for this tab';
    save.onclick=function(){setKey(keyInput.value);keyInput.value='';status.textContent=hasKey()?'Key in memory until tab closes':'Enter a key';};
    block.appendChild(save);
    var clear=document.createElement('button');clear.type='button';clear.textContent='Clear voice key';
    clear.onclick=function(){clearKey();status.textContent='Key cleared';};block.appendChild(clear);
    var status=document.createElement('p');status.setAttribute('role','status');status.textContent=hasKey()?'Key in memory until tab closes':'No Sarvam voice key entered';block.appendChild(status);
    var steps=document.createElement('p');steps.textContent='Setup: 1. Open the Sarvam dashboard and sign in. 2. Create an API key and review credits/rates. 3. Select Sarvam above. 4. Paste key and tap Use key. 5. Start Voice Mode. A RoamWise HTTPS Cloudflare voice gateway must also be configured; otherwise device voice remains active.';block.appendChild(steps);
    var link=document.createElement('a');link.href='https://dashboard.sarvam.ai';link.rel='noopener noreferrer';link.target='_blank';link.textContent='Open Sarvam dashboard ↗';block.appendChild(link);
    var warn=document.createElement('p');warn.textContent='Security: BYOK requests pass through the configured RoamWise Worker to Sarvam. Key stays out of localStorage and is not saved by the gateway. Never share your key in a public chat.';block.appendChild(warn);
    host.insertBefore(block,host.firstChild);
  }
  root.RWTuskVoiceProvider={selected:selected,setProvider:setProvider,setModel:setModel,
    setKey:setKey,clearKey:clearKey,hasKey:hasKey,speak:speak,stop:stop,mount:mount,endpoint:endpoint};
})(typeof window!=='undefined'?window:null);
