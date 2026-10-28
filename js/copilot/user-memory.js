// @ts-nocheck
/* ==================== COPILOT: PER-USER TRAVEL MEMORY ====================
   Ailon Tusk learns each traveller's stable preferences from how they use it
   (home city, usual budget and trip length, travel style, favourite topics and
   places, when they usually plan) so answers are faster and more personal.

   Design rules, because this is personal data:
   - Structured travel facts only. Raw message text, names, phones and emails
     are never stored here.
   - Lives on THIS device (localStorage rw_um_v1). Nothing leaves the device
     unless the user switches on "Sync to my account", which is off by default
     and can be turned off at any time (turning it off deletes the copy).
   - The user can ask "what do you remember about me" to see everything, pause
     learning, forget one item, or forget everything.
   - It is a PROFILE, not chat history. The session-only chat policy in
     js/copilot/core.js is unchanged. Memory only supplies soft defaults for
     the AI prompt and for a missing starting city; whatever the user says
     now always wins.
   Classic-script globals (no modules). */

var RW_UM_KEY = 'rw_um_v1';
var RW_UM_OFF = 'rw_um_off';
var RW_UM_SYNC = 'rw_um_sync';
var RW_UM_NOTICE = 'rw_um_notice';
var RW_UM_CMD = /\b(what (?:do|did) you (?:remember|know)|what (?:all )?(?:do|did) you know about me|my (?:tusk )?(?:memory|profile)|forget (?:everything|all|me)|delete my (?:data|memory|profile)|clear my memory|(?:stop|pause|resume|start) (?:remembering|learning))\b/i;

function rwUmNew(){ return { v:1, n:0, t0:0, t1:0, home:'', homeSrc:'', origins:{}, dests:{}, budgets:[], days:[], vibes:{}, topics:{}, group:{}, lang:{en:0,hi:0,hing:0}, hours:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], trips:[] }; }
function rwUmLoad(){
  try{
    var o = JSON.parse(localStorage.getItem(RW_UM_KEY)||'null');
    if(o && o.v===1 && typeof o==='object') return o;
  }catch(e){ /* corrupt or blocked storage: start empty */ }
  return rwUmNew();
}
function rwUmSave(m){ try{ localStorage.setItem(RW_UM_KEY, JSON.stringify(m)); }catch(e){ /* storage full or blocked: best-effort */ } }
function rwUmOn(){ try{ return localStorage.getItem(RW_UM_OFF)!=='1'; }catch(e){ return false; } }
function rwUmBump(o, k, by){ if(k){ o[k] = (o[k]||0) + (by||1); } }
function rwUmClean(s, max){ return String(s||'').replace(/[^A-Za-z\u00C0-\u024F .'-]/g,' ').replace(/\s+/g,' ').trim().slice(0, max||40); }
function rwUmMedian(a){
  if(!a.length) return 0;
  var s = a.slice().sort(function(x,y){ return x-y; }), h = Math.floor(s.length/2);
  return s.length%2 ? s[h] : Math.round((s[h-1]+s[h])/2);
}
function rwUmTop(o, n, min){
  return Object.keys(o||{}).filter(function(k){ return (typeof o[k]==='number' ? o[k] : o[k].n) >= (min||1); })
    .sort(function(a,b){ var x=typeof o[a]==='number'?o[a]:o[a].n, y=typeof o[b]==='number'?o[b]:o[b].n; return y-x; }).slice(0, n);
}
function rwUmCap(o, max){
  var ks = Object.keys(o); if(ks.length<=max) return;
  ks.sort(function(a,b){ var x=typeof o[a]==='number'?o[a]:o[a].n, y=typeof o[b]==='number'?o[b]:o[b].n; return y-x; });
  ks.slice(max).forEach(function(k){ delete o[k]; });
}

/* Learn from one parsed question. `intents` is the output of cpParseRegex. */
function rwUmLearn(intents, raw, now){
  try{
    if(!rwUmOn() || !intents || intents.smalltalk) return false;
    var t = String(raw||'');
    if(t.length < 4 || RW_UM_CMD.test(t)) return false;
    var ts = now || Date.now(), m = rwUmLoad();
    m.n++; if(!m.t0) m.t0 = ts; m.t1 = ts;
    var hr = new Date(ts + 19800000).getUTCHours(); m.hours[hr] = (m.hours[hr]||0) + 1;

    /* stated home city: "I live in Pune", "I am based in Almora" */
    var hm = t.match(/\b(?:[Ii] (?:live|stay)(?: in| at)?|[Ii] am (?:based )?(?:in|from)|[Ii]'m (?:based )?(?:in|from)|[Mm]y (?:home )?city is|[Mm]era shehar)\s+([A-Z][A-Za-z\u00C0-\u024F]{2,}(?: [A-Z][A-Za-z\u00C0-\u024F]{2,})?)/);
    if(hm){ var hc = rwUmClean(hm[1], 30); if(hc){ m.home = hc; m.homeSrc = 'stated'; } }

    /* starting city: explicit route origin, or "starting city is X" */
    var og = intents.origin || ((t.match(/starting city is\s+([^.\n]{2,40}?)(?:\.|\n|$)/i)||[])[1]);
    og = rwUmClean(og, 30);
    if(og && og.length >= 3){
      rwUmBump(m.origins, og, 1); rwUmCap(m.origins, 10);
      if(m.homeSrc !== 'stated'){
        var best = rwUmTop(m.origins, 1, 2)[0];
        if(best){ m.home = best; m.homeSrc = 'inferred'; }
      }
    }

    var d = (!intents._weakDest && !intents._inherited && !intents._notAPlace) ? rwUmClean(intents.dest, 40) : '';
    if(d && d.length >= 3){
      var rec = m.dests[d] || { n:0, t:0 }; rec.n++; rec.t = ts; m.dests[d] = rec; rwUmCap(m.dests, 30);
    }
    if(intents.budget >= 500 && intents.budget <= 2000000){ m.budgets.push(Math.round(intents.budget)); if(m.budgets.length>8) m.budgets.shift(); }
    if(intents.days >= 1 && intents.days <= 60){ m.days.push(intents.days); if(m.days.length>8) m.days.shift(); }
    (intents.vibe||[]).forEach(function(v){ rwUmBump(m.vibes, String(v).slice(0,20), 1); });
    if(intents.topic) rwUmBump(m.topics, String(intents.topic).slice(0,20), 1);
    if(/\b(solo|alone|akela|myself)\b/i.test(t)) rwUmBump(m.group, 'solo');
    else if(/\b(family|parents|kids|children|bachche)\b/i.test(t)) rwUmBump(m.group, 'family');
    else if(/\b(couple|wife|husband|girlfriend|boyfriend|partner|honeymoon)\b/i.test(t)) rwUmBump(m.group, 'couple');
    else if(/\b(friends|group|we are|we\u2019re|we're|yaaron|dost)\b/i.test(t)) rwUmBump(m.group, 'friends');
    if(/[\u0900-\u097F]/.test(t)) m.lang.hi++;
    else if(/\b(kya|hai|kaise|chahiye|bhai|karna|jaana|ghumna|mujhe|batao|kitna|kahan)\b/i.test(t)) m.lang.hing++;
    else m.lang.en++;
    if(d && (intents.days || intents.budget)){
      var last = m.trips[m.trips.length-1];
      if(!(last && last.d===d && ts-last.t < 86400000)){ m.trips.push({ d:d, days:intents.days||0, b:intents.budget||0, t:ts }); if(m.trips.length>5) m.trips.shift(); }
    }
    rwUmSave(m); rwUmSyncSoon();
    return true;
  }catch(e){ return false; }
}

/* Derived, human-facing view. Items appear only once there is enough evidence. */
function rwUmGet(){
  var m = rwUmLoad(), out = { n:m.n, home:m.home||'', homeSrc:m.homeSrc||'' };
  if(m.budgets.length >= 2) out.budget = Math.round(rwUmMedian(m.budgets)/500)*500;
  if(m.days.length >= 2) out.days = rwUmMedian(m.days);
  out.styles = rwUmTop(m.vibes, 2, 2);
  out.topics = rwUmTop(m.topics, 2, 2);
  out.places = rwUmTop(m.dests, 3, 1);
  out.group = rwUmTop(m.group, 1, 2)[0] || '';
  var L = m.lang, tot = L.en + L.hi + L.hing;
  if(tot >= 3){ var lt = L.hi >= L.hing ? 'hi' : 'hing'; if((L[lt])/tot >= 0.4) out.lang = (lt==='hi' ? 'Hindi' : 'Hinglish'); }
  if(m.n >= 5){
    var pk = 0; for(var i=1;i<24;i++){ if(m.hours[i] > m.hours[pk]) pk = i; }
    out.peak = pk < 5 ? 'late night' : pk < 12 ? 'morning' : pk < 17 ? 'afternoon' : pk < 22 ? 'evening' : 'night';
  }
  out.last = m.trips[m.trips.length-1] || null;
  return out;
}
function rwUmOrigin(){ return rwUmOn() ? (rwUmLoad().home || '') : ''; }
function rwUmHasData(){ var g = rwUmGet(); return !!(g.home || g.budget || g.days || g.styles.length || g.topics.length || g.places.length || g.group); }

/* One line for the AI prompt. Soft defaults only. */
function rwUmPrompt(){
  try{
    if(!rwUmOn()) return '';
    var g = rwUmGet(), bits = [];
    if(g.home) bits.push('home city ' + g.home);
    if(g.budget) bits.push('usual budget about \u20b9' + g.budget);
    if(g.days) bits.push('usual trip length about ' + g.days + ' days');
    if(g.group) bits.push('usually travels ' + (g.group==='solo' ? 'solo' : 'with ' + g.group));
    if(g.styles.length) bits.push('likes ' + g.styles.join(', '));
    if(g.places.length) bits.push('has asked about ' + g.places.join(', '));
    if(g.lang) bits.push('usually writes in ' + g.lang);
    if(!bits.length) return '';
    return 'Traveller profile learned from their own past questions (' + bits.join('; ') + '). Use it only as a soft default when the question is silent on it; whatever they say now always wins, and never announce that you remember.\n';
  }catch(e){ return ''; }
}

/* One-tap chips built from the profile; each hits the answer cache or the fast local engine. */
function rwUmSuggestions(){
  try{
    if(!rwUmOn()) return [];
    var g = rwUmGet(), out = [], p = g.places[0];
    if(p){
      var l = g.last && g.last.d === p ? g.last : null;
      out.push({ label:'Plan ' + p + ' again', q:((l && l.days) || g.days || 4) + ' days in ' + p + ((l && l.b) || g.budget ? ' under ' + ((l && l.b) || g.budget) : '') });
      if(g.home && g.home.toLowerCase() !== p.toLowerCase()) out.push({ label:'Reach ' + p + ' from ' + g.home, q:'how to reach ' + p + ' from ' + g.home });
      var tp = g.topics[0];
      if(tp === 'weather') out.push({ label:'Weather in ' + p, q:'weather in ' + p });
      else if(tp === 'eat') out.push({ label:'What to eat in ' + p, q:'what to eat in ' + p });
      else if(tp === 'stay') out.push({ label:'Stays in ' + p, q:'where to stay in ' + p });
    }
    return out.slice(0, 3);
  }catch(e){ return []; }
}
function rwUmChipsHTML(){
  var s = rwUmSuggestions(); if(!s.length) return '';
  var e = function(v){ return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };
  return '<div class="tk-chips" style="margin-top:8px">' + s.map(function(c){
    return '<button class="tk-chip gold" onclick="cpFollow(\'' + String(c.q).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;') + '\')">' + e(c.label) + '</button>';
  }).join('') + '</div>';
}

/* One-time disclosure the first time something is remembered. */
function rwUmNotice(){
  try{
    if(!rwUmOn() || localStorage.getItem(RW_UM_NOTICE) === '1' || !rwUmHasData()) return '';
    localStorage.setItem(RW_UM_NOTICE, '1');
    return '<div class="rw-note" style="display:block;margin-top:8px">\ud83e\udde0 Tusk now remembers your travel preferences on this device so answers get faster and more personal. Ask \u201cwhat do you remember about me\u201d to see, pause or delete them.</div>';
  }catch(e){ return ''; }
}

/* ---- controls ---- */
function rwUmForget(what){
  var m = rwUmLoad();
  if(what === 'home'){ m.home = ''; m.homeSrc = ''; m.origins = {}; }
  else if(what === 'places'){ m.dests = {}; m.trips = []; }
  else if(what === 'style'){ m.vibes = {}; m.topics = {}; m.group = {}; }
  else if(what === 'money'){ m.budgets = []; m.days = []; }
  else if(what === 'all'){ m = rwUmNew(); try{ localStorage.removeItem(RW_UM_NOTICE); }catch(e){ /* ignore */ } }
  rwUmSave(m);
  if(what === 'all') rwUmRemoteDelete(); else rwUmSyncSoon();
  rwUmRefreshCard();
}
function rwUmPause(on){ try{ localStorage.setItem(RW_UM_OFF, on ? '1' : '0'); }catch(e){ /* ignore */ } rwUmRefreshCard(); }
function rwUmRefreshCard(){
  try{
    var cards = document.querySelectorAll('.rw-um-card');
    for(var i=0;i<cards.length;i++){ cards[i].outerHTML = rwUmCard(); }
  }catch(e){ /* best-effort */ }
}

function rwUmCard(){
  var g = rwUmGet(), on = rwUmOn(), sync = rwUmSyncOn();
  var e = function(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var rows = [];
  if(g.home) rows.push(['Home city', e(g.home) + (g.homeSrc==='inferred' ? ' <span class="rw-note">(guessed from your trips)</span>' : ''), 'home']);
  if(g.budget) rows.push(['Usual budget', '\u2248 \u20b9' + g.budget.toLocaleString('en-IN'), 'money']);
  if(g.days) rows.push(['Usual trip length', '\u2248 ' + g.days + ' days', 'money']);
  if(g.group) rows.push(['Travels', g.group==='solo' ? 'solo' : 'with ' + e(g.group), 'style']);
  if(g.styles.length) rows.push(['Travel style', e(g.styles.join(', ')), 'style']);
  if(g.topics.length) rows.push(['Often asks about', e(g.topics.join(', ')), 'style']);
  if(g.places.length) rows.push(['Places you asked about', e(g.places.join(', ')), 'places']);
  if(g.peak) rows.push(['You usually plan in the', e(g.peak), '']);
  var body = rows.length
    ? rows.map(function(r){ return '<div class="tk-bul"><span><b>' + r[0] + ':</b> ' + r[1] + (r[2] ? ' <button class="rw-rail-btn" style="min-height:30px;padding:2px 9px" onclick="rwUmForget(\'' + r[2] + '\')">Forget</button>' : '') + '</span></div>'; }).join('')
    : '<div class="tk-bul"><span>Nothing yet. As you plan trips I will pick up your home city, budget and style.</span></div>';
  return '<div class="tk-card tk-mini rw-um-card"><div class="tk-sec">'
    + '<div style="font-weight:800">\ud83e\udde0 What Ailon Tusk remembers about you</div>'
    + body
    + '<div class="rw-note" style="display:block;margin-top:8px">Only travel facts, never your messages, name, phone or email. ' + (sync ? 'A copy is synced to your RoamWise account.' : 'Stored on this device only.') + ' Learning is <b>' + (on ? 'on' : 'paused') + '</b>.</div>'
    + '<div style="margin-top:8px">'
    + '<button class="rw-rail-btn" onclick="rwUmPause(' + (on ? 'true' : 'false') + ')">' + (on ? 'Pause learning' : 'Resume learning') + '</button>'
    + '<button class="rw-rail-btn" onclick="rwUmForget(\'all\')">Forget everything</button>'
    + '<button class="rw-rail-btn" onclick="rwUmSetSync(' + (sync ? 'false' : 'true') + ')">' + (sync ? 'Stop syncing and delete the copy' : 'Sync to my account') + '</button>'
    + '</div>'
    + (sync ? '' : '<div class="rw-note" style="display:block;margin-top:6px">Sync copies this summary (no chat text) to your account so it follows you to a new phone. RoamWise administrators can access account data. You can turn it off any time and the copy is deleted.</div>')
    + '</div></div>';
}

/* Chat commands: show / forget / pause / resume. Returns HTML or null. */
function rwUmAnswer(t){
  var q = String(t||'');
  if(!RW_UM_CMD.test(q)) return null;
  if(/\b(forget (?:everything|all|me)|delete my (?:data|memory|profile)|clear my memory)\b/i.test(q)){
    rwUmForget('all');
    return '<div>Done. I have forgotten everything I had learned about you' + (rwUmSyncOn() ? ', including the synced copy' : '') + '. I will start fresh from your next question.</div>';
  }
  if(/\b(?:stop|pause) (?:remembering|learning)\b/i.test(q)){ try{ localStorage.setItem(RW_UM_OFF,'1'); }catch(e){ /* ignore */ } return '<div>Okay, I have paused learning. What I already know stays until you ask me to forget it.</div>' + rwUmCard(); }
  if(/\b(?:resume|start) (?:remembering|learning)\b/i.test(q)){ try{ localStorage.setItem(RW_UM_OFF,'0'); }catch(e){ /* ignore */ } return '<div>Learning is back on.</div>' + rwUmCard(); }
  return rwUmCard();
}

/* ---- optional account sync (off by default) ---- */
function rwUmSyncOn(){ try{ return localStorage.getItem(RW_UM_SYNC) === '1'; }catch(e){ return false; } }
function rwUmUser(){
  try{
    if(typeof AUTH_READY==='undefined' || !AUTH_READY || typeof firebase==='undefined') return null;
    return firebase.auth().currentUser || null;
  }catch(e){ return null; }
}
var _rwUmTimer = null;
function rwUmSyncSoon(){
  if(!rwUmSyncOn() || _rwUmTimer) return;
  _rwUmTimer = setTimeout(function(){ _rwUmTimer = null; rwUmPush(); }, 20000);
}
/* Payload is the stored profile (counts and facts), never chat text. */
function rwUmPayload(){ return JSON.stringify(rwUmLoad()); }
function rwUmPush(){
  try{
    var u = rwUmUser(); if(!u || !rwUmSyncOn()) return;
    firebase.firestore().collection('users').doc(u.uid).set({
      tuskMemory: rwUmPayload(),
      tuskMemoryAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge:true }).catch(function(){ /* best-effort */ });
  }catch(e){ /* best-effort */ }
}
function rwUmRemoteDelete(){
  try{
    var u = rwUmUser(); if(!u) return;
    firebase.firestore().collection('users').doc(u.uid).set({
      tuskMemory: firebase.firestore.FieldValue.delete(),
      tuskMemoryAt: firebase.firestore.FieldValue.delete()
    }, { merge:true }).catch(function(){ /* best-effort */ });
  }catch(e){ /* best-effort */ }
}
/* New phone: adopt the synced profile only when this device has none. */
function rwUmPull(){
  try{
    var u = rwUmUser(); if(!u || !rwUmSyncOn() || rwUmLoad().n > 0) return;
    firebase.firestore().collection('users').doc(u.uid).get().then(function(s){
      var raw = s && s.exists ? s.data().tuskMemory : '';
      if(!raw) return;
      var o = JSON.parse(raw);
      if(o && o.v === 1 && rwUmLoad().n === 0){ rwUmSave(o); rwUmRefreshCard(); }
    }).catch(function(){ /* best-effort */ });
  }catch(e){ /* best-effort */ }
}
function rwUmSetSync(on){
  if(on && !rwUmUser()){ try{ showToast('Sign in first to sync your memory'); }catch(e){ /* ignore */ } return; }
  try{ localStorage.setItem(RW_UM_SYNC, on ? '1' : '0'); }catch(e){ /* ignore */ }
  if(on){ rwUmPull(); rwUmPush(); } else { rwUmRemoteDelete(); }
  rwUmRefreshCard();
}

/* copilotSend pre-answer hook: memory commands first, then festival trips.
   Kept here so js/copilot/core.js stays under its line cap. */
function rwTuskPreAnswer(bubble, intents, t){
  var um = null;
  try{ um = rwUmAnswer(t); }catch(e){ um = null; }
  if(!um && typeof rwShCommand === 'function') um = rwShCommand(t);
  if(!um && typeof rwFxCommand === 'function') um = rwFxCommand(t);
  if(um){ intents.smalltalk = 'memory'; cpFinish(bubble, um, intents, t); return true; }
  if(typeof rwTuskBookingReply === 'function' && rwTuskBookingReply(bubble, intents, t)) return true;
  if(typeof rwEventTripReply === 'function' && rwEventTripReply(bubble, intents, t)) return true;
  if(typeof rwAtlasReply === 'function' && rwAtlasReply(bubble, intents, t)) return true;
  return (typeof rwStayDeskReply === 'function') ? rwStayDeskReply(bubble, intents, t) : false;
}
