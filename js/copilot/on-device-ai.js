// @ts-nocheck
/* ON-DEVICE AI — runs the model inside the browser, so it costs RoamWise
   nothing and the prompt never leaves the device. Uses Chrome's built-in
   Prompt API (Gemini Nano) where the browser offers it: desktop Chrome with a
   capable GPU or enough RAM. Android/iOS browsers do not offer it yet, so on
   phones this reports "unsupported" and the app keeps using hosted AI.
   For a PC with a graphics card there is also the "Local server" provider
   (Ollama / LM Studio) in Settings.
   Depends on lsSet/showToast/setProv/el (resolved at call time). */
function rwOnDeviceOpts(){
  return {expectedInputs:[{type:'text',languages:['en']}], expectedOutputs:[{type:'text',languages:['en']}]};
}
function rwOnDeviceAPI(){
  try{ return (typeof self!=='undefined' && self.LanguageModel) || null; }catch(e){ return null; }
}
/* Resolves to 'unsupported' | 'unavailable' | 'downloadable' | 'downloading' | 'available'. */
function rwOnDeviceStatus(){
  var LM=rwOnDeviceAPI();
  if(!LM || typeof LM.availability!=='function') return Promise.resolve('unsupported');
  try{ return Promise.resolve(LM.availability(rwOnDeviceOpts())).then(function(s){ return String(s||'unavailable'); },function(){ return 'unavailable'; }); }
  catch(e){ return Promise.resolve('unavailable'); }
}
/* One fresh session per prompt so one trip's context never leaks into another. */
function rwOnDeviceAsk(prompt){
  return rwOnDeviceStatus().then(function(st){
    if(st!=='available') throw new Error('On-device AI is not ready ('+st+'). Open Settings > On this device to set it up.');
    var LM=rwOnDeviceAPI(), session;
    return Promise.resolve(LM.create(rwOnDeviceOpts())).then(function(s){
      session=s;
      return session.prompt(String(prompt||''));
    }).then(function(txt){
      try{ session.destroy(); }catch(e){ /* best-effort */ }
      txt=String(txt||'').trim();
      if(!txt) throw new Error('Empty response from on-device AI');
      return txt;
    },function(e){
      try{ session&&session.destroy(); }catch(x){ /* best-effort */ }
      throw e;
    });
  });
}
/* Settings button: checks the device, downloads the model if needed (needs the
   tap as a user gesture), then switches AI mode to on-device. */
function rwEnableOnDevice(){
  rwOnDeviceStatus().then(function(st){
    if(st==='unsupported'){ showToast('This browser has no built-in AI. Use desktop Chrome 148+ or the Local server option.'); return; }
    if(st==='unavailable'){ showToast('This device cannot run Chrome built-in AI (needs a GPU with 4 GB+ VRAM, or 16 GB RAM, and 22 GB free disk).'); return; }
    var done=function(){ lsSet('rwKey_ondevice','1'); var s=el('ondeviceStatus'); if(s){ s.textContent='set'; s.className='key-status ks-set'; } setProv('ondevice'); };
    if(st==='available'){ done(); return; }
    showToast('Downloading the on-device model (large, once only)…');
    var LM=rwOnDeviceAPI();
    Promise.resolve(LM.create(Object.assign(rwOnDeviceOpts(),{monitor:function(m){
      m.addEventListener('downloadprogress',function(e){ var s=el('ondeviceStatus'); if(s) s.textContent=Math.round((e.loaded||0)*100)+'%'; });
    }}))).then(function(sess){ try{ sess.destroy(); }catch(e){ /* best-effort */ } done(); },function(){ showToast('Could not download the on-device model.'); });
  });
}
