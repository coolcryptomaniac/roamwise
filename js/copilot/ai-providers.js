// @ts-nocheck
// AI PROVIDER REQUEST LAYER — extracted verbatim from app.js (modularization
// round 4). Provider-agnostic HTTP request builder (aiRequest), the two
// caller-facing dispatchers used throughout the app (aiCall = active
// provider only, aiCallAny = fall through every armed provider), the
// Settings "Test" button handler (testKey/testKeyFallbackChain), and the
// tolerant JSON extractor (extractJSON) shared by callers that ask the model
// for structured output. Depends on `activeProv`, `AI_MODELS`, and
// `lastAiSource` (still declared in app.js) plus `lsGet`/`lsSet` (core) and
// `showToast`/`el` (app.js) — all resolved at call time, not parse time, so
// load order relative to app.js does not matter (see ARCHITECTURE.md).
function extractJSON(txt){
  if(!txt) return null;
  try{ return JSON.parse(txt); }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  var a=txt.indexOf('{'), b=txt.lastIndexOf('}');
  if(a>-1 && b>a){ try{ return JSON.parse(txt.slice(a,b+1)); }catch(e){ /* parse best-effort, ignore malformed/missing data */ } }
  a=txt.indexOf('['); b=txt.lastIndexOf(']');
  if(a>-1 && b>a){ try{ var arr=JSON.parse(txt.slice(a,b+1)); return {days:arr}; }catch(e){ /* parse best-effort, ignore malformed/missing data */ } }
  return null;
}

function aiRequest(prov, key, model, prompt, maxTok, jsonMode){
  var url, headers, body;
  if(prov==='anthropic'){
    url='https://api.anthropic.com/v1/messages';
    headers={'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    body=JSON.stringify({model:model, max_tokens:maxTok, messages:[{role:'user',content:prompt}]});
  } else if(prov==='gemini'){
    url='https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+key;
    headers={'Content-Type':'application/json'};
    var gc={maxOutputTokens:maxTok, temperature:0.7}; if(jsonMode) gc.responseMimeType='application/json';
    body=JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:gc});
  } else {
    var bases={groq:'https://api.groq.com/openai/v1', cerebras:'https://api.cerebras.ai/v1',
      github:'https://models.inference.ai.azure.com', openrouter:'https://openrouter.ai/api/v1',
      mistral:'https://api.mistral.ai/v1'};
    url=(bases[prov]||bases.groq)+'/chat/completions';
    headers={'Content-Type':'application/json','Authorization':'Bearer '+key};
    if(prov==='openrouter'){ headers['HTTP-Referer']='https://www.roamwise.co.in'; headers['X-Title']='RoamWise Pro'; }
    var ob={model:model, max_tokens:maxTok, messages:[{role:'user',content:prompt}]};
    if(jsonMode && prov!=='openrouter') ob.response_format={type:'json_object'};
    body=JSON.stringify(ob);
  }
  var ctrl = ('AbortController' in window)? new AbortController() : null;
  var tmr = ctrl? setTimeout(function(){ ctrl.abort(); }, 15000) : null;
  return fetch(url,{method:'POST',headers:headers,body:body,signal:ctrl?ctrl.signal:undefined})
    .then(function(r){ return r.json().then(function(d){ return {status:r.status, data:d}; }); })
    .then(function(res){
      clearTimeout(tmr);
      var data=res.data;
      if(res.status>=400){
        var em=(data&&data.error&&(data.error.message||data.error))
              || (data&&data.message)  /* Cerebras & friends: flat {message,type,code} */
              || ('HTTP '+res.status);
        if(typeof em!=='string') em=JSON.stringify(em).slice(0,120);
        var e=new Error(em); e.httpStatus=res.status; throw e;
      }
      var txt;
      if(prov==='anthropic') txt=(data.content||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('');
      else if(prov==='gemini') txt=((((data.candidates||[])[0]||{}).content||{}).parts||[]).map(function(p){return p.text||'';}).join('');
      else txt=(((data.choices||[])[0]||{}).message||{}).content||'';
      txt = txt.replace(/^```json\s*/m,'').replace(/^```\s*/m,'').replace(/\s*```\s*$/m,'').trim();
      if(!txt) throw new Error('Empty response from '+prov);
      return txt;
    })
    .catch(function(e){
      clearTimeout(tmr);
      if(e.name==='AbortError') throw new Error('Timed out after 15s — check your connection');
      throw e;
    });
}

/* Tries each model for the active provider; cb(errorString|null, text|null) */
function aiCall(prompt, maxTok, cb, jsonMode){
  var prov=activeProv, key=lsGet('rwKey_'+prov);
  if(prov==='smart' || !key){ lastAiSource=null; cb(null,null); return; }
  var models = AI_MODELS[prov]||[];
  /* Groq: put whatever testKey() last discovered as a REAL working model for
     THIS key (via Groq's live /models endpoint) first in line, ahead of the
     static guesses — it's always at least as current as this hardcoded list. */
  if(prov==='groq'){
    var discovered = lsGet('rwKey_groq_model');
    if(discovered && models.indexOf(discovered)===-1) models=[discovered].concat(models);
  }
  var i=0;
  function attempt(lastErr){
    if(i>=models.length){ lastAiSource=null; cb(lastErr||'All models failed', null); return; }
    var m=models[i++];
    aiRequest(prov,key,m,prompt,maxTok,jsonMode)
      .then(function(txt){ lastAiSource={prov:prov, model:m}; cb(null, txt); })
      .catch(function(e){
        /* model-not-found → try next model; auth/quota → stop and surface */
        var msg=String(e.message||e);
        if(e.httpStatus===401||e.httpStatus===403||/api key|permission|quota|billing/i.test(msg)){ lastAiSource=null; cb(msg, null); }
        else attempt(msg);
      });
  }
  attempt(null);
}

/* PROVIDER INDEPENDENCE: one provider failing (or hitting its daily cap) must
   never take the answer down. Tries the ACTIVE provider's models first, then
   EVERY other armed provider in turn; only if all fail does the caller fall
   back to Ailon Tusk's own engine. Auth/quota errors skip to the NEXT PROVIDER. */
function aiCallAny(prompt, maxTok, cb, jsonMode){
  var all=['groq','cerebras','github','gemini','openrouter','mistral','anthropic'];
  var order=[activeProv].concat(all.filter(function(p){ return p!==activeProv; }))
    .filter(function(p){ return p && p!=='smart' && lsGet('rwKey_'+p); });
  if(!order.length){ lastAiSource=null; cb(null,null); return; }
  var oi=0;
  (function nextProv(lastErr){
    if(oi>=order.length){ lastAiSource=null; cb(lastErr||'All providers failed', null); return; }
    var prov=order[oi++], key=lsGet('rwKey_'+prov), models=AI_MODELS[prov]||[], mi=0;
    (function tryM(err){
      if(mi>=models.length){ nextProv(err); return; }
      var m=models[mi++];
      aiRequest(prov,key,m,prompt,maxTok,jsonMode)
        .then(function(txt){ lastAiSource={prov:prov, model:m}; cb(null, txt); })
        .catch(function(e){
          var msg=String(e.message||e);
          if(e.httpStatus===401||e.httpStatus===403||/api key|permission|quota|billing|rate.?limit/i.test(msg)) nextProv(msg);
          else tryM(msg);
        });
    })(null);
  })(null);
}

/* Key tester
 — used by the Test buttons in Settings */
function testKeyFallbackChain(prov, key, st){
  var models=AI_MODELS[prov]||[], i=0;
  (function tryM(lastErr){
    if(i>=models.length){ st.textContent='✗ '+String(lastErr).slice(0,60); st.className='key-status ks-bad'; showToast('Key failed: '+String(lastErr).slice(0,80)); return; }
    var m=models[i++];
    aiRequest(prov,key,m,'Reply with exactly: OK',10)
      .then(function(){ st.textContent='✓ working ('+m+')'; st.className='key-status ks-ok'; showToast(prov+' key verified ✓'); if(prov==='groq') lsSet('rwKey_groq_model', m); })
      .catch(function(e){
        if(e.httpStatus===401||e.httpStatus===403){ st.textContent='✗ invalid key'; st.className='key-status ks-bad'; showToast('Key rejected — regenerate it and paste again'); }
        else tryM(e.message||e);
      });
  })(null);
}
function testKey(prov){
  var key=(el(prov+'Key').value||'').trim() || lsGet('rwKey_'+prov);
  var st=el(prov+'Status');
  if(!key){ st.textContent='no key'; st.className='key-status ks-empty'; return; }
  st.textContent='testing…'; st.className='key-status ks-empty';

  /* GROQ: ask Groq itself which models this key can actually use right now,
     via its OpenAI-compatible /models endpoint, instead of betting everything
     on one hardcoded model string. This is what actually fixes "the model
     `llama-3.1-8b-instant` does not exist" — that model (and
     llama-3.3-70b-versatile) were both deprecated by Groq on 2026-08-16, so a
     fixed test model can go stale again the same way; a live lookup can't. */
  if(prov==='groq'){
    fetch('https://api.groq.com/openai/v1/models', {headers:{'Authorization':'Bearer '+key}})
      .then(function(r){ return r.json().then(function(d){ return {status:r.status, data:d}; }); })
      .then(function(res){
        if(res.status===401 || res.status===403){
          st.textContent='✗ invalid key'; st.className='key-status ks-bad';
          showToast('Key rejected — regenerate it and paste again');
          return;
        }
        var ids=((res.data && res.data.data)||[]).map(function(m){ return m.id; }).filter(Boolean);
        if(!ids.length){ testKeyFallbackChain(prov, key, st); return; }
        /* Prefer a current flagship "versatile"/70B-class model if this key
           can use one, else just take the first non-audio/non-guard model —
           the user only cares that SOMETHING works, not the exact name. */
        var pick = ids.filter(function(id){ return /gpt-oss-120b/i.test(id); })[0]
                || ids.filter(function(id){ return /70b/i.test(id) && !/whisper|guard|tts/i.test(id); })[0]
                || ids.filter(function(id){ return !/whisper|guard|tts|distil/i.test(id); })[0]
                || ids[0];
        lsSet('rwKey_groq_model', pick);
        st.textContent='✓ working ('+pick+')'; st.className='key-status ks-ok';
        showToast('groq key verified ✓');
      })
      .catch(function(){
        /* Live list unreachable (network hiccup, CORS, etc.) — fall back to
           the static chain rather than blocking the user. */
        testKeyFallbackChain(prov, key, st);
      });
    return;
  }
  testKeyFallbackChain(prov, key, st);
}
