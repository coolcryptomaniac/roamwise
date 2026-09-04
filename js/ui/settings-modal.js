// @ts-nocheck
/* Moved verbatim from app.js (Phase 5b modularization). See js/itinerary/CLAUDE-CODE-MERGE-NOTES.md-style
   convention: this file is loaded via a classic <script> tag before app.js in index.html,
   so its functions/vars are plain globals other files (including app.js) already call. */

/* ---- from app.js lines 2192-2227: text + icon size accessibility controls (rwApplyUIScale, rwSetTextScale/IconScale, openSizeSettings) ---- */
/* ===== TEXT + ICON SIZE (accessibility) =====
   Scales the whole UI via a root font-size multiplier + an icon multiplier.
   Persists across sessions. Applied on boot. */
function rwApplyUIScale(){
  var ts=parseFloat(lsGet('rw_textscale')||'1')||1;
  var is=parseFloat(lsGet('rw_iconscale')||'1')||1;
  try{
    document.documentElement.style.setProperty('--rw-text-scale', ts);
    document.documentElement.style.setProperty('--rw-icon-scale', is);
    document.documentElement.style.fontSize = (100*ts)+'%';
  }catch(e){}
}
function rwSetTextScale(v){ lsSet('rw_textscale', String(v)); rwApplyUIScale(); }
function rwSetIconScale(v){ lsSet('rw_iconscale', String(v)); rwApplyUIScale(); try{ renderTabbar(); }catch(e){} }
function openSizeSettings(){
  var ts=parseFloat(lsGet('rw_textscale')||'1')||1;
  var is=parseFloat(lsGet('rw_iconscale')||'1')||1;
  var textOpts=[['0.9','Small'],['1','Default'],['1.15','Large'],['1.3','Extra large']];
  var iconOpts=[['0.9','Small'],['1','Default'],['1.2','Large'],['1.4','Extra large']];
  function row(label, cur, opts, fn){
    return '<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:var(--gold2,#C8913E);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">'+label+'</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + opts.map(function(o){ var on=Math.abs(cur-parseFloat(o[0]))<0.02;
          return '<button onclick="'+fn+'('+o[0]+');openSizeSettings()" style="flex:1;min-width:70px;font-size:12.5px;font-weight:700;padding:9px;border-radius:10px;border:1px solid '+(on?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';background:'+(on?'var(--gold,#E8BA6C)':'var(--bg3,#1A1A20)')+';color:'+(on?'#0A0A0C':'var(--t1)')+';cursor:pointer">'+o[1]+'</button>'; }).join('')
      +'</div></div>';
  }
  var ov=el('sizeSettingsOv');
  if(!ov){ ov=document.createElement('div'); ov.id='sizeSettingsOv'; ov.className='overlay'; ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('sizeSettingsOv'); }; document.body.appendChild(ov); }
  ov.style.zIndex='1200';
  ov.innerHTML='<div class="sheet" style="max-width:380px"><div class="sheet-h"><b>\ud83d\udd24 Text &amp; icon size</b><button onclick="rwOverlayClose(\'sizeSettingsOv\')" class="tact">\u2715</button></div>'
    +'<p style="font-size:12px;color:var(--t2);margin:2px 0 14px">Make everything easier to read.</p>'
    + row('Text size', ts, textOpts, 'rwSetTextScale')
    + row('Icon size', is, iconOpts, 'rwSetIconScale')
    +'<button class="tact" style="width:100%;margin-top:4px" onclick="rwSetTextScale(1);rwSetIconScale(1);openSizeSettings()">Reset to default</button></div>';
  ov.classList.add('open');
}

/* ---- from app.js lines 2230-2318: i18n language system (RW_LANGS, RW_I18N, rwLang/t/rwSetLang/rwApplyLang/rwToggleLangMenu/rwInitLang) ---- */
/* ==================== i18n — LANGUAGE SYSTEM ====================
   Extensible localization. To add a language: add a dictionary to RW_I18N with
   the same keys as 'hi', add it to RW_LANGS, done. Elements with data-i18n="key"
   get their text swapped; data-i18n-ph="key" swaps placeholders. Missing keys
   fall back to the existing English text, so partial translations are safe. */
var RW_LANGS = [
  {code:'en', label:'English', native:'English'},
  {code:'hi', label:'Hindi',   native:'हिन्दी'}
  /* add later: {code:'ta',label:'Tamil',native:'தமிழ்'}, {code:'bn',...}, {code:'mr',...} */
];
var RW_I18N = {
  hi: {
    'nav.plan':'प्लान',
    'nav.signin':'साइन इन',
    'nav.pro':'प्रो ₹100',
    'hero.title1':'भीड़ से दूर।',
    'hero.title2':'अपनी दुनिया खोजें।',
    'hero.sub':'कहाँ जाना है? AI से किसी भी जगह का स्मार्ट प्लान — बजट, भीड़ का हाल और पैकिंग लिस्ट। न साइनअप, न सब्सक्रिप्शन। एक बार भरो, हमेशा के लिए।',
    'hero.startFree':'प्लानिंग शुरू करें — फ्री →',
    'hero.unlockPro':'प्रो अनलॉक करें — ₹100',
    'chip.noSignup':'कोई साइनअप नहीं',
    'chip.oneTime':'एक बार का पेमेंट',
    'chip.countries':'देश',
    'search.destination':'कहाँ जाना है?',
    'search.plan':'मेरा प्लान बनाओ',
    'pay.title':'RoamWise प्रो',
    'pay.sub':'एक बार भरो • हमेशा के लिए अनलॉक',
    'pay.oneTime':'एक बार • लाइफटाइम • कोई सब्सक्रिप्शन नहीं',
    'pay.refund':'🛡️ 7-दिन रिफंड — बिना सवाल',
    'pay.secure':'🔒 सुरक्षित UPI / कार्ड',
    'pay.noAuto':'✅ एक बार का, ऑटो-चार्ज नहीं',
    'pay.unlock':'अभी अनलॉक करें',
    'promo.unlock':'प्रो अनलॉक करें — लाइफटाइम एक्सेस',
    'common.free':'फ्री',
    'common.more':'और देखें',
    'common.close':'बंद करें'
  }
};
var RW_LANG = 'en';
function rwLang(){ return RW_LANG; }
/* translate a key; falls back to the provided default (or the key) */
function t(key, def){
  var d = RW_I18N[RW_LANG];
  if(d && d[key]!=null) return d[key];
  return (def!=null ? def : key);
}
function rwSetLang(code){
  RW_LANG = code;
  try{ lsSet('rw_lang', code); }catch(e){}
  try{ document.documentElement.setAttribute('lang', code); }catch(e){}
  rwApplyLang();
}
/* Swap all tagged elements. English is the source of truth in the HTML, so for
   'en' we restore original text stored on first run. */
function rwApplyLang(){
  var nodes = document.querySelectorAll('[data-i18n]');
  nodes.forEach(function(n){
    var key=n.getAttribute('data-i18n');
    if(n.getAttribute('data-i18n-orig')==null) n.setAttribute('data-i18n-orig', n.innerHTML);
    var orig=n.getAttribute('data-i18n-orig');
    n.innerHTML = (RW_LANG==='en') ? orig : t(key, orig);
  });
  var phs = document.querySelectorAll('[data-i18n-ph]');
  phs.forEach(function(n){
    var key=n.getAttribute('data-i18n-ph');
    if(n.getAttribute('data-i18n-ph-orig')==null) n.setAttribute('data-i18n-ph-orig', n.getAttribute('placeholder')||'');
    var orig=n.getAttribute('data-i18n-ph-orig');
    n.setAttribute('placeholder', (RW_LANG==='en') ? orig : t(key, orig));
  });
  try{ var lbl=el('langLabel'); if(lbl){ var L=RW_LANGS.filter(function(x){return x.code===RW_LANG;})[0]; lbl.textContent=L?L.native:'English'; } }catch(e){}
}
function rwToggleLangMenu(){
  var m=el('langMenu'); if(!m) return;
  m.style.display = m.style.display==='block'?'none':'block';
}
function rwInitLang(){
  var saved=''; try{ saved=lsGet('rw_lang'); }catch(e){}
  RW_LANG = saved || 'en';
  /* build the picker menu */
  var m=el('langMenu');
  if(m){
    m.innerHTML = RW_LANGS.map(function(L){
      return '<button class="lang-opt" onclick="rwSetLang(\''+L.code+'\');rwToggleLangMenu()">'+L.native+'<small>'+L.label+'</small></button>';
    }).join('');
  }
  try{ document.documentElement.setAttribute('lang', RW_LANG); }catch(e){}
  rwApplyLang();
}


/* ---- from app.js lines 7167-7268: settings modal (PROV_META, renderKeyBoxes, openSettings, closeSettings, setProv, saveKey, clearKey) ---- */
var PROV_META = {
  groq:     {label:'Groq \u00b7 auto-picks best model', hint:'console.groq.com/keys \u2014 free, no card. Starts with gsk_', url:'https://console.groq.com/keys', ph:'gsk_...'},
  cerebras: {label:'Cerebras \u00b7 Llama 3.3 70B', hint:'cloud.cerebras.ai \u2014 free, no card, ~1M tokens/day', url:'https://cloud.cerebras.ai', ph:'csk-...'},
  github:   {label:'GitHub Models \u00b7 GPT-4o', hint:'github.com/settings/tokens \u2014 free with a GitHub account', url:'https://github.com/settings/tokens', ph:'ghp_...'},
  gemini:   {label:'Google Gemini 2.5 Flash', hint:'aistudio.google.com \u2014 free tier covers 2.5 Flash (Pro/Flash-Lite are paid)', url:'https://aistudio.google.com/apikey', ph:'AIzaSy...'},
  openrouter:{label:'OpenRouter \u00b7 many models', hint:'openrouter.ai/keys \u2014 free slots ~50/day', url:'https://openrouter.ai/keys', ph:'sk-or-...'},
  mistral:  {label:'Mistral', hint:'console.mistral.ai \u2014 free prototyping tier', url:'https://console.mistral.ai/api-keys', ph:'...'},
  anthropic:{label:'Claude (Anthropic)', hint:'console.anthropic.com \u2014 paid only, no free tier', url:'https://console.anthropic.com/settings/keys', ph:'sk-ant-...'}
};
/* Settings key rows are GENERATED from PROV_META, not hand-written HTML.
   Previously they were hardcoded, so newly added providers silently had no
   input at all and openSettings() looked them up with el(p+'Key') => null. */
function renderKeyBoxes(){
  var host=el('keyBoxes'); if(!host) return;
  host.innerHTML = secPanelHTML() + Object.keys(PROV_META).map(function(p){
    var m=PROV_META[p], free = (p==='groq'||p==='cerebras'||p==='github'||p==='gemini');
    return '<div class="key-box">'
      +'<div class="key-box-name">'+m.label+(free?' <span style="font-size:9px;color:#4ADE80;border:1px solid rgba(74,222,128,.4);border-radius:999px;padding:1px 6px;margin-left:4px">no card</span>':'')
      +' <span class="key-status ks-empty" id="'+p+'Status">not set</span></div>'
      +'<div class="key-box-hint"><a href="'+m.url+'" target="_blank" rel="noopener">'+m.hint+'</a></div>'
      +'<div class="key-row"><input class="k-inp" type="password" id="'+p+'Key" placeholder="'+m.ph+'">'
      +'<button class="k-save" onclick="saveKey(\''+p+'\')">Save</button>'
      +'<button class="k-clear" onclick="clearKey(\''+p+'\')">Clear</button>'
      +'<button class="k-save" style="background:var(--teal)" onclick="testKey(\''+p+'\')">Test</button></div>'
      +'</div>';
  }).join('');
}
function openSettings(){
  renderKeyBoxes();
  try{ rwVoiceMountSetting(); }catch(e){}
  try{ var tp=el('tabPickWrap'); if(tp) tp.innerHTML=rwTabPickerHTML(); }catch(e){}
  /* ---- UI simplification ----
     Provider choice and API keys are power-user territory: Smart Search works
     with no key at all, so for most people these sections are noise that makes
     Settings look like a developer console. They're collapsed behind an
     "Advanced" toggle, and auto-expanded for anyone who already has a key set
     so existing power users lose nothing. */
  setTimeout(function(){
    var body = document.querySelector('#settingsOverlay .modal-body');
    if(body && !el('advToggle')){
      var secs = body.querySelectorAll('.key-section');
      var adv = [];
      secs.forEach(function(sec){
        var t = (sec.textContent||'');
        if(/AI Mode|API Keys/i.test(t)) adv.push(sec);
      });
      if(adv.length){
        var hasKey = ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].some(function(x){ return lsGet('rwKey_'+x); });
        var btn = document.createElement('button');
        btn.id='advToggle'; btn.className='tact';
        btn.style.cssText='width:100%;margin:4px 0 10px;font-size:12.5px';
        btn.onclick=function(){
          var open = adv[0].style.display!=='none';
          adv.forEach(function(x){ x.style.display = open?'none':''; });
          btn.textContent = (open?'\u2699 Advanced \u2014 AI provider & API keys':'\u2699 Hide advanced');
        };
        adv.forEach(function(x){ x.style.display = hasKey?'':'none'; });
        btn.textContent = hasKey ? '\u2699 Hide advanced' : '\u2699 Advanced \u2014 AI provider & API keys';
        body.insertBefore(btn, body.firstChild);
      }
    }
  }, 0);
  ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].forEach(function(p){
    var inp=el(p+'Key'), stat=el(p+'Status'), val=lsGet('rwKey_'+p);
    if(inp) inp.value=val;
    if(stat){ stat.textContent = val?'set':'not set'; stat.className = 'key-status '+(val?'ks-set':'ks-empty'); }
  });
  document.querySelectorAll('.prov-btn').forEach(function(b){ b.classList.toggle('on', b.dataset.p===activeProv); });
  el('settingsOverlay').classList.add('open'); document.body.style.overflow='hidden';
}
function closeSettings(){ el('settingsOverlay').classList.remove('open'); document.body.style.overflow=''; }

function setProv(p){
  activeProv = p; lsSet('rwProv', p);
  document.querySelectorAll('.prov-btn').forEach(function(b){ b.classList.toggle('on', b.dataset.p===p); });
  var chip = el('modeChip');
  if(chip){
    var labels = {smart:'Smart Mode (free)', gemini:'Gemini AI (free)', groq:'Groq AI (free)', anthropic:'Claude AI'};
    chip.textContent = labels[p]||p;
    chip.className = 'mode-chip '+(p==='anthropic'?'mode-ai':'mode-free');
  }
  showToast(p==='smart' ? 'Smart Search active (no key needed)' : 'AI mode: '+(p.charAt(0).toUpperCase()+p.slice(1)));
}

function saveKey(prov){
  var inp = el(prov+'Key'); if(!inp) return;
  var k = inp.value.trim(); if(!k){ showToast('Enter a key first'); return; }
  lsSet('rwKey_'+prov, k);
  var stat = el(prov+'Status');
  if(stat){ stat.textContent='set'; stat.className='key-status ks-set'; }
  showToast('Key saved for '+prov+'!');
  setProv(prov);
}

function clearKey(prov){
  lsSet('rwKey_'+prov, '');
  var inp = el(prov+'Key'); if(inp) inp.value='';
  var stat = el(prov+'Status');
  if(stat){ stat.textContent='not set'; stat.className='key-status ks-empty'; }
  showToast(prov+' key cleared');
  if(activeProv===prov) setProv('smart');
}

