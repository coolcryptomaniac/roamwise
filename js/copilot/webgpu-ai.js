// @ts-nocheck
/* ON-DEVICE AI via WebGPU (WebLLM). A small open model is downloaded once,
   cached by the browser, and runs on the phone/PC graphics chip, so it costs
   RoamWise nothing and the prompt never leaves the device. Needs a browser
   with WebGPU (Chrome/Edge on Android or desktop). The engine (vendor/webllm)
   and the model weights are fetched only after the user taps "Download &
   enable"; nothing is preloaded. Depends on lsGet/lsSet/showToast/el/setProv
   (resolved at call time). */
var RW_WEBGPU_MODELS = {
  light:    {label:'Light (about 0.7 GB download, 1 GB graphics memory)',   f16:'Llama-3.2-1B-Instruct-q4f16_1-MLC', f32:'Llama-3.2-1B-Instruct-q4f32_1-MLC'},
  balanced: {label:'Balanced (about 0.9 GB download, 1.7 GB graphics memory)', f16:'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', f32:'Qwen2.5-1.5B-Instruct-q4f32_1-MLC'},
  strong:   {label:'Strong (about 1.8 GB download, 2.5 GB graphics memory)',   f16:'Qwen2.5-3B-Instruct-q4f16_1-MLC',   f32:'Qwen2.5-3B-Instruct-q4f32_1-MLC'}
};
var RW_WEBGPU_SYSTEM = 'You are Ailon Tusk, RoamWise travel copilot. Answer briefly and practically. If you are not sure of a price, timing or opening status, say so.';
var _rwWebGPU = {engine:null, loading:null, modelId:'', mod:null};

/* Resolves {ok, f16, reason}. Never throws. */
function rwWebGPUStatus(){
  try{
    if(typeof navigator==='undefined' || !navigator.gpu) return Promise.resolve({ok:false, reason:'This browser has no WebGPU. Use a recent Chrome or Edge.'});
    return navigator.gpu.requestAdapter().then(function(ad){
      if(!ad) return {ok:false, reason:'No usable graphics chip was found for WebGPU.'};
      return {ok:true, f16: !!(ad.features && ad.features.has && ad.features.has('shader-f16'))};
    },function(){ return {ok:false, reason:'WebGPU could not start on this device.'}; });
  }catch(e){ return Promise.resolve({ok:false, reason:'WebGPU could not start on this device.'}); }
}
function rwWebGPUModelId(size, f16){
  var m=RW_WEBGPU_MODELS[size]||RW_WEBGPU_MODELS.light;
  return f16 ? m.f16 : m.f32;
}
function rwWebGPUSetStatus(txt, cls){
  var s=el('webgpuStatus'); if(s){ s.textContent=txt; if(cls) s.className='key-status '+cls; }
}
/* Loads (and on first use downloads) the model. Progress is shown in Settings. */
function rwWebGPULoad(modelId, onProgress){
  if(_rwWebGPU.engine && _rwWebGPU.modelId===modelId) return Promise.resolve(_rwWebGPU.engine);
  if(_rwWebGPU.loading && _rwWebGPU.loadingId===modelId) return _rwWebGPU.loading;
  var base=new URL('vendor/webllm/', document.baseURI).href;
  _rwWebGPU.loadingId=modelId;
  _rwWebGPU.loading=import(base+'index.js').then(function(mod){
    _rwWebGPU.mod=mod;
    var worker=new Worker(base+'worker.js',{type:'module'});
    return mod.CreateWebWorkerMLCEngine(worker, modelId, {initProgressCallback:function(p){ try{ onProgress&&onProgress(p); }catch(e){ /* progress is cosmetic */ } }});
  }).then(function(engine){
    _rwWebGPU.engine=engine; _rwWebGPU.modelId=modelId; _rwWebGPU.loading=null;
    return engine;
  },function(e){ _rwWebGPU.loading=null; throw e; });
  return _rwWebGPU.loading;
}
/* aiRequest() entry point for provider 'webgpu'. */
function rwWebGPUAsk(prompt, maxTok){
  var id=lsGet('rwWebGPUModel');
  if(!id) return Promise.reject(new Error('On-device AI is not set up. Open Settings > On this device (WebGPU).'));
  var first=!(_rwWebGPU.engine && _rwWebGPU.modelId===id);
  if(first) showToast('Loading the on-device model…');
  return rwWebGPULoad(id).then(function(engine){
    return engine.chat.completions.create({
      messages:[{role:'system',content:RW_WEBGPU_SYSTEM},{role:'user',content:String(prompt||'').slice(0,6000)}],
      max_tokens:Math.min(Number(maxTok)||512, 1024), temperature:0.6, stream:false
    });
  }).then(function(r){
    var txt=String(((((r||{}).choices||[])[0]||{}).message||{}).content||'').trim();
    if(!txt) throw new Error('Empty response from on-device AI');
    return txt;
  });
}
/* Settings button: check the device, ask for durable storage (so the browser
   does not delete a multi-GB model), download, then switch AI mode. */
function rwEnableWebGPU(){
  var sel=el('webgpuSize'), size=(sel&&sel.value)||'light';
  rwWebGPUStatus().then(function(st){
    if(!st.ok){ showToast(st.reason); return; }
    var id=rwWebGPUModelId(size, st.f16);
    try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){ /* best-effort */ }
    showToast('Downloading the on-device model once. Keep this screen open and stay on Wi-Fi.');
    rwWebGPUSetStatus('0%','ks-empty');
    return rwWebGPULoad(id, function(p){
      var pct=Math.round(((p&&p.progress)||0)*100);
      rwWebGPUSetStatus(pct+'%','ks-empty');
    }).then(function(){
      lsSet('rwWebGPUModel', id); lsSet('rwKey_webgpu','1');
      rwWebGPUSetStatus('ready','ks-set');
      setProv('webgpu');
    });
  }).catch(function(e){
    rwWebGPUSetStatus('failed','ks-empty');
    showToast(rwWebGPUFriendlyError(e));
  });
}
function rwWebGPUFriendlyError(e){
  var m=String((e&&e.message)||e||'');
  if(/quota/i.test(m)) return 'Not enough free storage for this model. Free some space or pick a smaller size.';
  if(/fetch|network|load failed|failed to load/i.test(m)) return 'The download was interrupted. Check your connection and try again.';
  if(/device|adapter|webgpu|out of memory|OOM/i.test(m)) return 'This device ran out of graphics memory. Try the Light size.';
  return 'Could not set up on-device AI: '+m.slice(0,100);
}
/* Settings button: remove the downloaded model and free the storage. */
function rwRemoveWebGPU(){
  var id=lsGet('rwWebGPUModel');
  var p=_rwWebGPU.mod ? Promise.resolve(_rwWebGPU.mod) : import(new URL('vendor/webllm/index.js', document.baseURI).href);
  p.then(function(mod){ return id ? mod.deleteModelAllInfoInCache(id) : null; }).catch(function(){ /* nothing cached */ }).then(function(){
    try{ if(_rwWebGPU.engine && _rwWebGPU.engine.unload) _rwWebGPU.engine.unload(); }catch(e){ /* best-effort */ }
    _rwWebGPU.engine=null; _rwWebGPU.modelId='';
    lsSet('rwWebGPUModel',''); lsSet('rwKey_webgpu','');
    rwWebGPUSetStatus('not set','ks-empty');
    if(activeProv==='webgpu') setProv('smart');
    showToast('On-device model removed.');
  });
}
