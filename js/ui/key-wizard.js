// @ts-nocheck
// 60-SECOND AI KEY WIZARD + MODEL COMPARISON ARENA — extracted verbatim from
// app.js (modularization round 4). Onboarding flow that walks a user through
// getting a free AI provider key (WIZ steps, keyProvider prefix-sniffing,
// openProvider popup, wizPaint/wizNext/wizTest/wizSave/wizSmartPaste), plus
// the "AI Arena" side-by-side model comparison (compareModels) reachable
// from the itinerary result CTA. Depends on runtime globals from app.js
// (el, showToast, track, activeProv, CURR/AC, DAY_TEMPLATES) and
// js/copilot/ai-providers.js (aiRequest, AI_MODELS) — all resolved at call
// time, so load order relative to those files doesn't matter.
/* ===== 60-SECOND AI KEY WIZARD ===== */
var WIZ=[
 {p:'groq',n:'Groq (auto-picks best model)',url:'https://console.groq.com/keys',why:'\u2705 No card ever \u00b7 fastest replies \u00b7 ~1,000 calls/day',ph:'gsk_\u2026',
  steps:['Sign up free (Google login works \u2014 no card asked)','Tap \u201cCreate API Key\u201d, give it any name','Copy it NOW \u2014 Groq shows it only once'],
  trouble:'Lost it? Just create another key \u2014 unlimited keys, still no card.'},
 {p:'cerebras',n:'Cerebras',url:'https://cloud.cerebras.ai',why:'\u2705 No card \u00b7 biggest daily volume (~1M tokens/day)',ph:'csk-\u2026',
  steps:['Sign up with Google or email \u2014 no payment step','Open API Keys in the sidebar','Create a key and copy it'],
  trouble:'Runs Llama 3.3 70B very fast; if a call times out, the app falls back automatically.'},
 {p:'github',n:'GitHub Models',url:'https://github.com/settings/tokens',why:'\u2705 No card \u00b7 GPT-4o & Llama on a GitHub account',ph:'ghp_\u2026',
  steps:['Sign in to GitHub \u2192 Settings \u2192 Developer settings','Personal access tokens \u2192 Generate new token (classic)','No scopes needed \u2014 generate, then copy the ghp_\u2026 token'],
  trouble:'Limits are tied to your GitHub plan; the free plan is enough for planning trips.'},
 {p:'gemini',n:'Google Gemini 2.5 Flash',url:'https://aistudio.google.com/apikey',why:'Frontier quality free \u2014 but pick the right model',ph:'AIza\u2026',
  steps:['Sign in with any Google account','Tap \u201cCreate API key\u201d \u2192 \u201cCreate in new project\u201d','Copy the AIza\u2026 key'],
  trouble:'Billing prompt? That means the chosen model is paid-only. RoamWise now calls gemini-2.5-flash, which is on the free tier \u2014 Pro and Flash-Lite are not.'},
 {p:'openrouter',n:'OpenRouter',url:'https://openrouter.ai/keys',why:'One key \u2192 many free models (lower daily cap)',ph:'sk-or-\u2026',
  steps:['Sign in (Google/GitHub)','Tap \u201cCreate Key\u201d','Copy the sk-or-\u2026 key'],
  trouble:'Free slots are ~50 calls/day and queue at peak; a one-time $10 top-up raises it to ~1,000/day. Groq or Cerebras avoid that entirely.'}
];
var wizI=0;
function keyProvider(k){
  k=(k||'').trim();
  if(/^AIza/.test(k)) return 'gemini';
  if(/^gsk_/.test(k)) return 'groq';
  if(/^csk-/.test(k)) return 'cerebras';
  if(/^ghp_|^github_pat_/.test(k)) return 'github';
  if(/^sk-or-/.test(k)) return 'openrouter';
  if(/^sk-ant-/.test(k)) return 'anthropic';
  /* Deliberately NOT guessing here: an unprefixed key used to be assumed
     Mistral, which hijacked Cerebras keys and tested them against the wrong
     API — the reported "save & test fails". Unknown format => no guess, and
     the caller keeps whichever provider the user actually selected. */
  return null;
}
function openProvider(url){
  if(window.RW || /RoamWiseApp/i.test(navigator.userAgent)){
    /* APK: opens in the browser ON TOP of the app \u2014 press Back to land right here */
    showToast('Copy the key there, press Back \u2014 the wizard is waiting \ud83e\udd77');
    window.open(url,'_blank');
  } else {
    /* Web: popup window \u2014 RoamWise never navigates away */
    var w=Math.min(560,screen.width-40), h=Math.min(760,screen.height-80);
    var win=window.open(url,'rwKeyWin','width='+w+',height='+h+',left='+((screen.width-w)/2)+',top='+((screen.height-h)/2)+',noopener');
    if(!win) window.open(url,'_blank');
    showToast('Copy the key in the popup, then paste it back here');
  }
}
function openWizard(){ wizI=0; wizPaint(); el('wizOverlay').classList.add('open'); try{track('wiz_opens');}catch(e){} }
function wizPaint(){
  var w=WIZ[wizI], has=!!lsGet('rwKey_'+w.p);
  var armed=['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].filter(function(p){return lsGet('rwKey_'+p);});
  el('wizBody').innerHTML=
   '<div class="mode-box" style="margin-bottom:12px">\u26a1 <b>Smart paste:</b> already have ANY key? Paste it \u2014 I\u2019ll detect the provider, save & test it automatically.'
  +'<div class="key-row" style="margin-top:8px"><input class="k-inp" id="wizAny" placeholder="AIza\u2026 / gsk_\u2026 / sk-or-\u2026 / sk-ant-\u2026"><button class="k-save" onclick="wizSmartPaste()">Detect & Save</button></div>'
  +'<div id="wizAnyStatus" style="font-size:11px;margin-top:6px;min-height:14px"></div></div>'
  +'<div style="font-size:11px;color:var(--t3);margin-bottom:6px">STEP '+(wizI+1)+' OF '+WIZ.length+(armed.length?' \u00b7 <span style="color:#16BF96">'+armed.length+' engine'+(armed.length>1?'s':'')+' armed \u2713</span>':'')+'</div>'
  +'<div style="font-size:16px;font-weight:700;margin-bottom:3px">'+w.n+(has?' <span style="color:#16BF96;font-size:11px">\u2713 saved</span>':'')+'</div>'
  +'<div style="font-size:11.5px;color:var(--t2);margin-bottom:10px">'+w.why+'</div>'
  +'<button class="rzp-main-btn" style="margin-bottom:10px" onclick="openProvider(\''+w.url+'\')">1\ufe0f\u20e3 Open '+w.n+' (stays on top)</button>'
  +'<div style="border:1px dashed var(--b2);border-radius:11px;padding:10px 12px;margin-bottom:10px">'
  + w.steps.map(function(s,i){return '<div class="ti-day"><b style="min-width:16px">'+(i+1)+'.</b><span>'+s+'</span></div>';}).join('')
  +'<div style="font-size:10px;color:var(--gold2);margin-top:5px">\ud83d\udca1 '+w.trouble+'</div></div>'
  +'<div class="key-row"><input class="k-inp" id="wizKey" placeholder="2\ufe0f\u20e3 Paste the key \u2014 '+w.ph+'"><button class="k-save" onclick="wizSave()">Save & Test</button></div>'
  +'<div id="wizStatus" style="font-size:11px;margin-top:8px;min-height:16px"></div>'
  +'<div style="display:flex;gap:8px;margin-top:12px">'
  +(wizI>0?'<button class="tact" style="flex:1" onclick="wizI--;wizPaint()">\u2190 Back</button>':'')
  +'<button class="tact" style="flex:1" onclick="wizNext()">'+(wizI<WIZ.length-1?'Skip \u2192':'Done')+'</button></div>';
}
function wizNext(){ if(wizI<WIZ.length-1){ wizI++; wizPaint(); } else { el('wizOverlay').classList.remove('open'); showToast('\ud83e\udd16 AI armed \u2014 itineraries are now personalised'); } }
function wizTest(prov,key,stEl,onOk){
  stEl.textContent='Testing '+prov+'\u2026'; stEl.style.color='var(--t3)';
  aiRequest(prov, key, AI_MODELS[prov][0], 'Reply with exactly: OK', 10)
    .then(function(){ lsSet('rwKey_'+prov,key); activeProv=prov; lsSet('rwProv',prov);
      try{ rwAutoBackup(); rwOfferBackup(); }catch(e){}
      stEl.textContent='\u2705 '+prov.charAt(0).toUpperCase()+prov.slice(1)+' is working \u2014 saved & set as your engine.'; stEl.style.color='#16BF96';
      if(onOk) setTimeout(onOk,1200); })
    .catch(function(e){ stEl.textContent='\u274c '+String(e.message||e).slice(0,70); stEl.style.color='#E05B5B'; });
}
function wizSave(){
  var w=WIZ[wizI], k=(el('wizKey').value||'').trim(); if(!k) return;
  var det=keyProvider(k);
  if(det && det!==w.p){ el('wizStatus').textContent='\ud83d\udd0d That looks like a '+det+' key \u2014 saving it there instead\u2026'; el('wizStatus').style.color='var(--gold2)';
    return wizTest(det,k,el('wizStatus'),wizPaint); }
  /* No recognised prefix => trust the provider the user is standing on. */
  wizTest(w.p,k,el('wizStatus'),wizNext);
}
function wizSmartPaste(){
  var k=(el('wizAny').value||'').trim(), st=el('wizAnyStatus'); if(!k) return;
  var det=keyProvider(k);
  if(!det){ st.textContent='\u2753 I can\u2019t tell which service that key is from \u2014 open Settings \u2192 Advanced and paste it next to the right provider.'; st.style.color='#E05B5B'; return; }
  wizTest(det,k,st,wizPaint);
}
/* ===== MODEL COMPARISON ARENA ===== */
function compareModels(name, days){
  var provs = ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].filter(function(p){return lsGet('rwKey_'+p);});
  var ov = el('cmpOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='cmpOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:520px;max-height:86vh;overflow:auto"><button class="modal-close" onclick="el(\'cmpOverlay\').classList.remove(\'open\')">\u00d7</button>'
    +'<div class="modal-head"><div class="modal-title">\u2694\ufe0f AI Arena</div><div class="modal-sub">Same brief \u00b7 every engine \u00b7 side by side</div></div>'
    +'<div class="modal-body" id="cmpBody"></div></div>';
    document.body.appendChild(ov);
  }
  ov.classList.add('open');
  var body=el('cmpBody');
  if(!provs.length){ body.innerHTML='<div class="mode-box">No AI keys yet \u2014 run the 60-second wizard first.</div><button class="rzp-main-btn" onclick="el(\'cmpOverlay\').classList.remove(\'open\');openWizard()">\ud83e\ude84 Open the wizard</button>'; return; }
  var _curSym=(CURR.find(function(x){return x.c===AC;})||{s:'\u20b9'}).s;
  var prompt='Create a compact '+Math.min(days,5)+'-day itinerary for '+name+'. For each day give: a title and one line each for morning, afternoon, evening. Be specific with real place names. If you mention any cost, use the '+_curSym+' symbol only \u2014 never $ unless '+_curSym+' actually is $. Max 140 words total.';
  body.innerHTML = '<div class="mode-box">Racing '+provs.length+' AI engine'+(provs.length>1?'s':'')+' + the built-in Smart engine on: <b>'+name+'</b>\u2026</div>'
    + provs.map(function(p){ return '<div class="trek" style="margin-bottom:10px"><div class="trek-top"><div class="trek-name">'+p.toUpperCase()+'</div><span class="tbadge hid" id="cmpT_'+p+'">\u23f3</span></div><div style="font-size:11.5px;color:var(--t2);line-height:1.6" id="cmpB_'+p+'">running\u2026</div></div>'; }).join('')
    + '<div class="trek" style="margin-bottom:10px"><div class="trek-top"><div class="trek-name">\u26a1 SMART ENGINE (built-in)</div><span class="tbadge pop">0.0s</span></div><div style="font-size:11.5px;color:var(--t2);line-height:1.6">'+(typeof DAY_TEMPLATES!=='undefined'? DAY_TEMPLATES.slice(0,2).map(function(t,i){return '<b>Day '+(i+1)+' \u2014 '+t.title+':</b> '+t.morning;}).join('<br>')+'<br><i>\u2026instant, offline, zero cost</i>':'')+'</div></div>'
    + '<div id="cmpVerdict"></div>';
  var results=[];
  provs.forEach(function(p){
    var t0=Date.now();
    aiRequest(p, lsGet('rwKey_'+p), AI_MODELS[p][0], prompt, 700)
      .then(function(txt){ var dt=((Date.now()-t0)/1000).toFixed(1);
        el('cmpT_'+p).textContent=dt+'s'; el('cmpT_'+p).className='tbadge pop';
        el('cmpB_'+p).textContent=txt.slice(0,460)+(txt.length>460?'\u2026':'');
        results.push({p:p,dt:parseFloat(dt),w:txt.split(/\s+/).length}); verdict(); })
      .catch(function(e){ el('cmpT_'+p).textContent='\u2717'; el('cmpT_'+p).className='tbadge dan';
        el('cmpB_'+p).textContent=String(e.message||e).slice(0,90); verdict(); });
  });
  function verdict(){
    if(results.length<1) return;
    var fast=results.slice().sort(function(a,b){return a.dt-b.dt;})[0];
    var rich=results.slice().sort(function(a,b){return b.w-a.w;})[0];
    el('cmpVerdict').innerHTML='<div class="mode-box">\ud83c\udfc6 <b>Insights:</b> fastest \u2014 <b>'+fast.p+'</b> ('+fast.dt+'s) \u00b7 most detailed \u2014 <b>'+rich.p+'</b> ('+rich.w+' words) \u00b7 the Smart engine wins on speed & offline; AI wins on personal detail. Set your favourite in Settings.</div>';
  }
  try{ track('arena_runs'); }catch(e){}
}

