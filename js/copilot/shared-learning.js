// @ts-nocheck
/* ==================== COPILOT: SHARED LEARNED ANSWERS ====================
   Ailon Tusk gets smarter for everyone without a bigger AI bill. When Tusk
   answers a GENERIC travel question (no "my", no names, no numbers that could
   identify anyone) and the answer passes the same relevance check as the local
   cache, a plain-text copy is stored in RoamWise's free Cloudflare storage under
   a hash of the question. The next traveller who asks the same thing gets it
   instantly, with no AI call.

   Privacy and safety rules (see worker/handlers/tusk-learned.js):
   - Only a hash of the normalised question is sent, never the question.
   - Only plain text is stored or shown (escaped); no HTML, links, emails or phone numbers.
   - Nothing that mentions the user's own remembered home city is shared.
   - Off switch: say "stop sharing learnings" to Tusk (or "share learnings" to resume).
   - A 👎 on a shared answer deletes it for everyone; it is relearned fresh.
   Everything is best-effort: any failure falls back to the normal AI path. */

var RW_SH_FLAG = 'rw_sh_learn';
var RW_SH_SENT = 'rw_sh_sent_v1';
var RW_SH_FIRST_PERSON = /\b(my|me|mine|myself|i|i'm|im|ive|i've|we|our|ours|us)\b/i;

function rwShOn(){ try{ return localStorage.getItem(RW_SH_FLAG) !== 'off'; }catch(e){ return true; } }
function rwShSet(on){ try{ localStorage.setItem(RW_SH_FLAG, on ? 'on' : 'off'); }catch(e){ /* storage blocked */ } }
function rwShUrl(p){ try{ return (typeof rwApi === 'function') ? rwApi(p) : null; }catch(e){ return null; } }

function rwShPlain(html){
  return String(html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
function rwShEligible(query, plain){
  var q = String(query || '');
  if(!rwShOn() || q.length > 220) return false;
  if(RW_SH_FIRST_PERSON.test(q)) return false;
  if(/[\w.+-]+@[\w-]+\.[\w.-]+|\d[\d\s-]{8,}\d/.test(q + ' ' + plain)) return false;
  if(plain.length < 40 || plain.length > 3000) return false;
  try{
    var g = (typeof rwUmGet === 'function') ? rwUmGet() : null;
    if(g && g.home && plain.toLowerCase().indexOf(String(g.home).toLowerCase()) >= 0) return false;   /* personalised answer */
  }catch(e){ /* memory optional */ }
  return true;
}

function rwSharedContribute(key, query, answerHtml){
  try{
    var url = rwShUrl('tusk/learned'), plain = rwShPlain(answerHtml);
    if(!url || !key || !rwShEligible(query, plain)) return;
    var sent = {}; try{ sent = JSON.parse(localStorage.getItem(RW_SH_SENT) || '{}'); }catch(e){ sent = {}; }
    if(sent[key]) return;
    sent[key] = 1;
    var ks = Object.keys(sent); while(ks.length > 200) delete sent[ks.shift()];
    try{ localStorage.setItem(RW_SH_SENT, JSON.stringify(sent)); }catch(e){ /* best-effort */ }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ k: key, text: plain }), keepalive: true }).catch(function(){ /* offline: fine */ });
  }catch(e){ /* sharing is optional */ }
}

function rwSharedDrop(key){
  try{
    var url = rwShUrl('tusk/learned/drop');
    if(!url || !key) return;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ k: key }), keepalive: true }).catch(function(){ /* best-effort */ });
  }catch(e){ /* optional */ }
}

/* Runs before the AI call. Resolves {_shared:true} when it answered, else runs next()
   (which returns the normal promise). Never waits more than 1.2s. */
function rwSharedFirst(key, bubble, intents, t, next){
  var url = rwShOn() && key && navigator.onLine !== false ? rwShUrl('tusk/learned') : null;
  if(!url || typeof fetch !== 'function' || RW_SH_FIRST_PERSON.test(String(t || ''))) return next();
  return new Promise(function(resolve){
    var done = false, timer = setTimeout(function(){ if(!done){ done = true; resolve(next()); } }, 1200);
    fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'k=' + encodeURIComponent(key)).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if(done) return; done = true; clearTimeout(timer);
      if(j && j.hit && j.text && rwAnsRelevant(t, j.text)){
        var e = (typeof escHtml === 'function') ? escHtml(j.text) : j.text.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
        var html = e + '<br><span class="rw-note">🌐 Learned from other travellers — instant, no AI used. Tap 👎 if it is wrong and it will be removed for everyone.</span>';
        try{ rwAnsPut(key, e, t); }catch(x){ /* local copy optional */ }
        cpFinish(bubble, html, intents, t);
        resolve({ _shared: true });
      }else resolve(next());
    }).catch(function(){ if(!done){ done = true; clearTimeout(timer); resolve(next()); } });
  });
}

/* Chat command: returns an HTML reply or null. */
function rwShCommand(t){
  var s = String(t || '').toLowerCase();
  if(/\b(stop|pause|disable|turn off|no)\b.{0,20}\b(sharing|share)\b.{0,20}\b(learn|learning|learnings|answers)\b/.test(s)){
    rwShSet(false);
    return 'Okay — I will stop sharing what I learn from your questions, and I will stop using other travellers’ saved answers. Say “share learnings” to turn it back on.';
  }
  if(/\b(start|resume|enable|turn on)\b.{0,20}\b(sharing|share)\b.{0,20}\b(learn|learning|learnings|answers)\b|^share learnings$/.test(s)){
    rwShSet(true);
    return 'Sharing is back on. Only generic questions and plain-text answers are shared, never your name, messages or memory.';
  }
  return null;
}

/* Server-verified destination knowledge before costly model inference.
   Restrict to general destination questions; dates, live conditions and
   personal itineraries continue through the normal planner/AI pipeline. */
function rwCuratedFirst(query,intents,bubble,next){
  var dest=String(intents&&intents.dest||'').trim().toLowerCase();
  var raw=String(query||'');
  var slug=dest.normalize('NFKD').replace(/[^a-z0-9 -]/g,'').trim().replace(/\s+/g,'-');
  var url=rwShUrl('tusk/curated');
  if(!url || !/^[a-z0-9][a-z0-9_-]{1,79}$/.test(slug) ||
     /\b(today|tomorrow|now|live|current|weather|traffic|price|availability|book|reserve|my|our|we|i|budget|from|to)\b/i.test(raw) ||
     /\d/.test(raw) || /[?&]/.test(dest))return next();
  return fetch(url+'?type=destination&id='+encodeURIComponent(slug))
    .then(function(r){return r.ok?r.json():null;})
    .then(function(j){
      if(!j||!j.hit||!j.data||!j.data.name)return next();
      var d=j.data,escape=(typeof escHtml==='function')?escHtml:function(v){return String(v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
      var pieces=['<b>'+escape(d.name)+'</b>'];
      ['summary','bestSeason','culture','transportTips','safetyTips'].forEach(function(k){if(typeof d[k]==='string')pieces.push(escape(d[k]));});
      if(Array.isArray(d.highlights))pieces.push('Highlights: '+escape(d.highlights.join(', ')));
      pieces.push('<span class="rw-note">Verified RoamWise destination guide · general information, not live conditions or availability.</span>');
      cpFinish(bubble,pieces.join('<br>'),intents,raw);
      return {_shared:true};
    }).catch(function(){return next();});
}
