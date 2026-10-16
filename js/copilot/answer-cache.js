// @ts-nocheck
/* ==================== COPILOT: ON-DEVICE ANSWER CACHE ====================
   Every answer the AI gives and that passes a relevance check is kept on this
   device, so asking the same thing again is instant and spends no AI
   allowance. When every AI engine is unavailable, a saved answer to the same
   question beats a generic fallback.

   Safety rules (this is what makes the cache self-correcting):
   - Only answers that mention the question's own place names are saved
     (rwAnsRelevant), so an off-topic reply is never kept and re-served.
   - A thumbs-down on an answer evicts it (rwAnsDrop) and the question is
     reported anonymously for review (see rwTuskFeedback).
   - Questions about live things (weather, prices, "today", "now") expire in
     3 hours; everything else in 7 days. Stale entries are used only as an
     offline fallback, for up to 60 days.
   - Follow-ups that depend on the previous turn ("what about food there?")
     are never cached, because the same words mean different things.
   Storage: one localStorage key, newest 80 entries, ~250 KB cap, all
   access wrapped so a blocked or full store never breaks chat. */

var RW_ANS_KEY = 'rw_ans_v1';
var RW_ANS_MAX = 80;
var RW_ANS_BYTES = 250000;
var RW_ANS_FRESH_MS = 7*24*3600*1000;
var RW_ANS_LIVE_MS = 3*3600*1000;
var RW_ANS_STALE_MS = 60*24*3600*1000;
var RW_ANS_LIVE = /\b(today|tonight|now|right now|current(ly)?|latest|live|open now|weather|forecast|rain|price|prices|fare|fares|cost|costs|ticket|tickets|availability|available|traffic|status|delay|delayed)\b/i;
var RW_ANS_FOLLOWUP = /\b(there|here|that place|that one|it|its|same|also|again|more|what about|how about|and then|instead)\b/i;
var RW_ANS_FILLER = /\b(please|pls|hey|hi|hello|tusk|ailon|bhai|bro|can you|could you|would you|tell me|show me|i want|i need|kindly)\b/g;

function rwAnsNorm(q){
  return String(q||'').toLowerCase().replace(RW_ANS_FILLER,' ').replace(/[^a-z0-9ऀ-ॿ₹ ]+/g,' ').replace(/\s+/g,' ').trim();
}
/* 32-bit FNV-1a over the normalised question (order matters: "Delhi to Goa" is not "Goa to Delhi"). */
function rwAnsKey(q, intents){
  var n = rwAnsNorm(q);
  if(n.split(' ').length < 4) return null;                 /* too thin to key safely */
  if(RW_ANS_FOLLOWUP.test(String(q||'').toLowerCase())) return null;
  if(intents && (intents._inherited || intents._recommendCount)) return null;
  /* No direction words: word order is irrelevant ("4 days Udaipur 12000" = "Udaipur 12000 4 days"). */
  if(!/\b(from|to|via|towards|se|tak|vs|versus)\b/.test(n)) n = n.split(' ').sort().join(' ');
  var h = 0x811c9dc5;
  for(var i=0;i<n.length;i++){ h ^= n.charCodeAt(i); h = (h + ((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24))) >>> 0; }
  return 'a' + h.toString(36) + n.length.toString(36);
}
function rwAnsLoad(){
  try{ var o = JSON.parse(localStorage.getItem(RW_ANS_KEY)||'{}'); return (o && typeof o==='object') ? o : {}; }
  catch(e){ return {}; }
}
function rwAnsSave(o){
  try{
    var keys = Object.keys(o).sort(function(a,b){ return (o[b].t||0)-(o[a].t||0); });
    while(keys.length > RW_ANS_MAX) delete o[keys.pop()];
    var s = JSON.stringify(o);
    while(s.length > RW_ANS_BYTES && keys.length){ delete o[keys.pop()]; s = JSON.stringify(o); }
    localStorage.setItem(RW_ANS_KEY, s);
  }catch(e){ /* quota or blocked storage: cache is best-effort */ }
}
/* opts.stale=true also accepts entries up to 60 days old (offline fallback). */
function rwAnsGet(key, opts, now){
  if(!key) return null;
  var o = rwAnsLoad(), e = o[key]; if(!e || e.bad) return null;
  var age = (now||Date.now()) - (e.t||0);
  var ttl = e.live ? RW_ANS_LIVE_MS : RW_ANS_FRESH_MS;
  if(age <= ttl || (opts && opts.stale && age <= RW_ANS_STALE_MS)){
    e.n = (e.n||0)+1; o[key]=e; rwAnsSave(o);
    return { html:e.h, age:age, stale: age > ttl };
  }
  return null;
}
function rwAnsPut(key, html, query, now){
  if(!key || !html) return false;
  var o = rwAnsLoad();
  o[key] = { h:String(html).slice(0,6000), t:(now||Date.now()), n:0, live:RW_ANS_LIVE.test(String(query||'')) };
  rwAnsSave(o); return true;
}
function rwAnsDrop(key){
  if(!key) return;
  var o = rwAnsLoad(); if(o[key]){ delete o[key]; rwAnsSave(o); }
  if(typeof rwSharedDrop==='function') rwSharedDrop(key);   /* wrong answer: forget it for everyone */
}

/* Proper nouns in the question: capitalised words that are not ordinary
   sentence words. If the question names places, a useful answer mentions
   at least one of them. */
var RW_ANS_COMMON = /^(plan|include|my|the|a|an|how|what|where|when|why|which|who|can|could|should|tell|show|give|best|top|i|we|is|are|do|does|please|also|and|or|for|from|to|in|on|at|near|around|with|without|then|if|it|this|that)$/i;
function rwAnsProperNouns(q){
  var out = [], re = /\b([A-Z][A-Za-zÀ-ɏ]{2,})\b/g, m;
  while((m = re.exec(String(q||''))) !== null){
    if(!RW_ANS_COMMON.test(m[1]) && out.indexOf(m[1].toLowerCase()) < 0) out.push(m[1].toLowerCase());
  }
  return out;
}
function rwAnsRelevant(query, answerText){
  var a = String(answerText||'').toLowerCase().replace(/<[^>]*>/g,' ');
  if(a.replace(/\s+/g,' ').trim().length < 25) return false;
  if(/^\s*ask:/i.test(a)) return false;
  var nouns = rwAnsProperNouns(query);
  if(!nouns.length) return true;
  for(var i=0;i<nouns.length;i++){ if(a.indexOf(nouns[i]) >= 0) return true; }
  return false;
}

/* ---- copilotSend hooks (kept here so core.js stays under its line cap) ---- */
function rwAnsServe(bubble, key, intents, raw){
  var hit = key ? rwAnsGet(key) : null;
  if(!hit) return false;
  cpFinish(bubble, hit.html + '<br><span class="rw-note">⚡ Saved answer — instant, no AI used. Tap 👎 if it is wrong and I will relearn it.</span>', intents, raw);
  return true;
}
function rwAnsStale(key){
  var old = key ? rwAnsGet(key, { stale:true }) : null;
  return old ? old.html : null;
}
function rwAnsRemember(key, query, answerHtml){
  if(!key) return;
  try{
    if(rwAnsRelevant(query, answerHtml)){ rwAnsPut(key, answerHtml, query); if(typeof rwSharedContribute==='function') rwSharedContribute(key, query, answerHtml); }   /* off-topic reply: never saved, shared or re-served */
  }catch(e){ /* cache is best-effort */ }
}
function rwAiDownNote(err, usedSaved){
  return '<span class="rw-note">⚡ AI engines unreachable right now'
    + (err ? ' (' + esc2(String(err).slice(0,60)) + ')' : '')
    + (usedSaved ? ' — showing your saved answer.' : ' — answered by Ailon Tusk’s own engine.') + '</span>';
}
