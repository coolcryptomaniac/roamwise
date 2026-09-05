// @ts-nocheck
/* ==================== COPILOT: TUSK RICH REPLY SYSTEM ====================
   Extracted verbatim from app.js (Phase 4b modularization).

   Three things every answer gets, per the original header comment:
     1) ACTION RAIL — every answer ends with tappable actions.
     2) CLARIFY-DON'T-GUESS — vague queries get tappable options, not a
        confident wrong answer.
     3) cpFinish/cpActionsHTML assemble the final answer card.

   cpActionsHTML in particular fans out into dozens of feature areas that
   remain in app.js (green hub, trekking, medical, fitness, merch, near-me,
   monkeys, off-grid, sound-of-place, food, vibe, ecosystem, overtourism,
   shadow budget, OSM attractions, etc.) — that is normal, expected coupling
   for an "assemble the final answer" module, not a load-order hazard: every
   one of those calls is a function-body reference resolved when the user
   actually sends a message, long after every script on the page (including
   app.js) has finished loading. tkFold/tkToggle are deliberately NOT moved
   here even though cpActionsHTML uses them — they live in
   js/ui/card-painter.js (final modularization pass; previously
   js/social/group-chat.js, before that app.js) since js/copilot/tusk-persona.js
   and js/copilot/answer-cards.js call them too, so they stay a shared
   global rather than being duplicated or arbitrarily reassigned to one
   consumer. ==== */

/* ================= TUSK RICH REPLY SYSTEM (rw-v38) =================
   Three things competitors do well, built here:
   1) ACTION RAIL  — every answer ends with tappable actions (map, PDF, budget,
      save, remind, read aloud) so an answer is never a dead end.
   2) CLARIFY-DON'T-GUESS — vague or unparseable queries get tappable options
      instead of a confident wrong answer. This is the anti-hallucination guard.
   3) REMINDERS — local reminder with optional audio chime.
   ================================================================= */

/* --- 1. ACTION RAIL --- */
function rwTuskRail(dest, raw){
  var d = (dest||'').replace(/'/g, "\\'");
  var q = (raw||'').replace(/'/g, "\\'").slice(0,120);
  function btn(icon,label,fn){
    return '<button onclick="'+fn+'" style="display:inline-flex;align-items:center;gap:5px;background:var(--bg3,#171A24);border:1px solid var(--b2,#2A2A36);border-radius:20px;padding:7px 12px;color:var(--t1,#EDEAE2);font-size:11.5px;font-weight:600;cursor:pointer;margin:3px 4px 0 0">'
      +'<span>'+icon+'</span>'+label+'</button>';
  }
  var h='<div style="margin-top:10px;padding-top:9px;border-top:1px solid var(--b2,#2A2A36)">'
    +'<div style="font-size:9.5px;color:var(--t3,#7A7870);letter-spacing:.08em;font-weight:700;margin-bottom:5px">DO SOMETHING WITH THIS</div>';
  if(d) h+=btn('\ud83d\uddfa\ufe0f','Map',"openTripMap('"+d+"',null)");
  if(d) h+=btn('\ud83d\uddd3\ufe0f','Plan it',"cpGoPlan('"+d+"',0)");
  h+=btn('\ud83d\udcb0','Budget',"openMoneyLayer()");
  h+=btn('\u23f0','Remind me',"rwRemindAsk('"+q+"')");
  h+=btn('\ud83d\udd0a','Read aloud',"rwTuskReadLast()");
  h+=btn('\ud83d\udcd6','Log feeling',"openJourneyLog()");
  return h+'</div>';
}
function rwTuskReadLast(){
  try{
    var log=el(_cpTargetLog)||el('cpLog'); if(!log) return;
    var bubbles=log.querySelectorAll('div');
    for(var i=bubbles.length-1;i>=0;i--){
      var txt=(bubbles[i].textContent||'').trim();
      if(txt.length>40){ tuskSpeak(txt.slice(0,600)); return; }
    }
    showToast('Nothing to read yet');
  }catch(e){ showToast('Read-aloud unavailable here'); }
}

/* --- 2. CLARIFY, DON'T GUESS (anti-hallucination) --- */
// escHtml() moved to js/core/text-utils.js (already reused by js/copilot/core.js).
/* Attribute-safe escape for text that is interpolated into a single-quoted
   JS string literal INSIDE a double-quoted HTML attribute, e.g.
   onclick="fn('VALUE')". Two escaping problems stack here and the order is
   load-bearing:
     1) Make the raw text safe as the JS string literal's contents: escape
        backslashes FIRST (\ -> \\), then escape the literal's own quote
        char (' -> \'). Escaping backslashes first matters because a
        trailing backslash right before a quote would otherwise combine
        with the quote-escape's inserted backslash and neutralise it
        (e.g. a trailing \ followed by our escaped \' would read as an
        escaped backslash followed by a REAL quote, closing the string).
     2) HTML-attribute-escape the result for the surrounding double quotes:
        & first, then ".  (No need to escape < / > here — this text isn't
        HTML content, it's an attribute value.) */
function escHtmlAttr(s){
  var jsSafe = String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return jsSafe.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}
function rwTuskAsk(question, options){
  var chips=options.map(function(o){
    var send=escHtmlAttr(o);
    return '<button onclick="rwTuskChip(\''+send+'\')" style="background:rgba(232,186,108,.10);border:1px solid var(--gold,#E8BA6C);border-radius:20px;padding:8px 13px;color:var(--gold,#E8BA6C);font-size:12px;font-weight:700;cursor:pointer;margin:4px 5px 0 0">'+escHtml(o)+'</button>';
  }).join('');
  return '<div>'+escHtml(question)+'<div style="margin-top:8px">'+chips+'</div></div>';
}
function rwTuskChip(text){
  var inp=el('heroInput')||el('cpInput');
  if(inp){ inp.value=text; try{ copilotSend(!!el('heroInput')); }catch(e){} }
}
/* Decide whether a query is too thin to answer honestly. Returns a clarifying
   bubble HTML, or null if the query is answerable. */
function rwTuskNeedsClarity(t){
  var q=(t||'').trim();
  if(!q) return null;
  var words=q.split(/\s+/).filter(Boolean);
  var lower=q.toLowerCase();
  /* greetings / smalltalk are fine — not a clarity problem */
  if(/^(hi|hey|hello|yo|namaste|hola|sup|thanks|thank you|ok|okay|cool|nice)\b/i.test(lower)) return null;
  /* single vague word with no place and no travel noun */
  var vague=/^(trip|travel|plan|holiday|vacation|ghumna|jaana|help|suggest|idea|ideas|where|somewhere|anywhere)$/i;
  if(words.length<=2 && vague.test(words[0])){
    return rwTuskAsk('Arre, happy to help \u2014 give me one hint and I\u2019ll do the rest. What kind of trip?',
      ['Mountains, 3-4 days','Beach & chill','Somewhere cheap near me','A big group trip']);
  }
  /* "somewhere nice" style with no place at all */
  if(words.length<=4 && /\b(somewhere|anywhere|any place|kahin)\b/i.test(lower)){
    return rwTuskAsk('Ekdum \u2014 but narrow it a touch so I don\u2019t send you somewhere random. Pick a vibe:',
      ['Hills & quiet','Beach & nightlife','Heritage & food','Adventure & treks']);
  }
  return null;
}


/* --- START ANYWHERE (competitor-inspired: Mindtrip's best pattern) ---
   Paste a blog link, a long chunk of text, or a friend's recommendation, and
   Tusk pulls the trip out of it instead of you re-typing everything. */
function rwStartAnywhere(t){
  var isUrl=/^https?:\/\/\S+$/i.test((t||'').trim());
  var isLongPaste=(t||'').length>220;
  if(!isUrl && !isLongPaste) return null;
  return 'The user pasted '+(isUrl?'a LINK':'a long block of text')+'. Extract the travel intent from it: '
    +'the destination(s), any dates/duration, budget, and the kind of trip. Then reply with a short, '
    +'concrete plan for it. If the source is unclear about a detail, say so plainly instead of inventing it.\n\n'
    +'Pasted content:\n'+(t||'').slice(0,1500);
}
// rwRemindAsk, rwRemindSet, rwRemindFire moved to js/audio/reminders.js

async function cpFinish(bubble, answerHTML, intents, raw){
  intents._raw = raw;
  try{ rwRemember('user', raw, {dest:intents.dest, topic:intents.topic, days:intents.days}); }catch(e){}
  var actions = await cpActionsHTML(intents);
  var parts=[]; if(answerHTML) parts.push(answerHTML);
  if(actions.length) parts.push(actions.join('<br><br>'));
  if(!parts.length) parts.push('I can handle destinations, dates, budgets, weather, cafes, buses/trains and sharing \u2014 try: \u201cPlan 4 days in Udaipur under \u20b912,000.\u201d');
  try{ rwRemember('tusk', (answerHTML||'').replace(/<[^>]*>/g,' ').slice(0,200), {}); }catch(e){}
  var isCard = actions.length && String(actions[0]).indexOf('tk-card')>-1;
  var _html = parts.join(isCard? '<div style="height:10px"></div>' : '<hr style="border:none;border-top:1px dashed var(--b2,#2A2A36);margin:10px 0">');
  /* Every answer ends with tappable actions — an answer is never a dead end. */
  try{ if(!intents.smalltalk) _html += rwTuskRail(intents.dest||'', raw||''); }catch(e){}
  /* Lightweight per-response feedback — bot replies only (cpFinish only ever
     finishes a 'bot' bubble). Anonymous daily counter, same pattern as track()
     elsewhere; no per-message record, no user identity. */
  _html += '<div class="tk-fb" style="margin-top:8px;display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--t3)">Helpful?'
    +'<button type="button" onclick="rwTuskFeedback(this,true)" style="background:none;border:none;cursor:pointer;font-size:14px;line-height:1;padding:2px;opacity:.65" aria-label="Helpful">👍</button>'
    +'<button type="button" onclick="rwTuskFeedback(this,false)" style="background:none;border:none;cursor:pointer;font-size:14px;line-height:1;padding:2px;opacity:.65" aria-label="Not helpful">👎</button></div>';
  bubble.innerHTML = _html;
  var log=el(_cpTargetLog)||el('cpLog');
  if(log){
    /* land the reader at the TOP of the new answer — bottom-scrolling a tall
       card forced people to scroll back up to read it */
    var topPos = bubble.offsetTop - 8;
    log.scrollTop = topPos>0 ? topPos : 0;
  }
  _cpHist.push({q:raw, a:bubble.textContent.slice(0,300)}); if(_cpHist.length>8) _cpHist.shift();
  try{ track('copilot_uses'); }catch(e){}
}
function cpGoPlan(dest, days){
  closeCopilot();
  var di=el('destInput'); if(di) di.value=dest;
  if(days){ var ds=el('days'); if(ds){ var opt=[].slice.call(ds.options||[]).filter(function(o){ return parseInt(o.value,10)===parseInt(days,10); })[0]; if(opt) ds.value=opt.value; } }
  tabGo('plan');
  try{ runSearch(); }catch(e){}
}
async function cpActionsHTML(it){
  var H=[];
  /* smalltalk never reaches the heavy path */
  if(it.smalltalk) return [];
  /* state-scope request: routes through the state, not a random village */
  if(it._state){
    try{ return [rwStateHTML(it._state, it.days)]; }catch(e){}
  }
  /* country-scope request: answer with circuits, not a single city */
  if(it._country){
    try{ return [rwCountryRouteHTML(it._country, it.days)]; }catch(e){}
  }
  /* conversation recall */
  if(/\b(what did i ask|what have we|remind me what|earlier i (said|asked)|our conversation|chat history)\b/i.test(String(it._raw||''))){
    var turns = rwRecall(10).filter(function(t){ return t.role==='user'; });
    return ['<div class="tk-card tk-mini"><div class="tk-sec">'
      +'<div style="font-weight:800;font-size:13.5px">\ud83e\udde0 What we\u2019ve covered</div>'
      + (turns.length
          ? turns.map(function(t,i){ return '<div class="tk-bul">'+esc2(t.text)+(t.meta&&t.meta.dest? ' <span style="color:var(--t3)">\u00b7 '+esc2(t.meta.dest)+'</span>':'')+'</div>'; }).join('')
          : '<div class="tk-bul">Nothing yet this session.</div>')
      +'<div style="font-size:10.5px;color:var(--t3);margin-top:7px">Kept on your device only \u2014 last 10 messages.</div>'
      +'</div></div>'];
  }
  /* off-grid safety */
  if(/\b(satellite|sos|off.?grid|no signal|no network|emergency|rescue|inreach|garmin)\b/i.test(String(it._raw||''))){
    return [rwOffgridHTML(it.dest || (_cpCtx && _cpCtx.dest) || '')];
  }
  /* rules health check */
  if(/\b(rules|permission|permissions|insufficient|blocked|firestore)\b/i.test(String(it._raw||''))){
    setTimeout(function(){ try{ rwRulesCheck(); }catch(e){} }, 60);
    return ['<div class="tk-card tk-mini"><div class="tk-sec"><div style="font-size:12.5px">Checking which Firestore rules are live\u2026</div></div></div>'];
  }
  /* certificate verification */
  if(/\b(verify|verification|authentic|is this real|check certificate|tamper)\b/i.test(String(it._raw||''))){
    return [rwVerifyPanelHTML()];
  }
  /* music of a place */
  if(/\b(music|song|songs|sound|playlist|folk|artist|listen)\b/i.test(String(it._raw||''))){
    var _sp = it.dest || (_cpCtx && _cpCtx.dest) || '';
    var _sh = _sp ? rwSoundHTML(_sp) : '';
    if(_sh) return ['<div class="tk-card tk-mini"><div class="tk-sec">'+_sh+'</div></div>'];
  }
  /* responsible travel */
  if(/\b(responsible|ethical|sustainable travel|overtourism|over.?tourism|what not to do|do.?s and don|damage|harm the place|travel well)\b/i.test(String(it._raw||''))){
    var _rk = /nomad|remote work|digital/i.test(String(it._raw||'')) ? 'nomad'
            : /solo|alone|by myself/i.test(String(it._raw||'')) ? 'solo' : 'all';
    return [rwResponsibleHTML(_rk)];
  }
  /* green hub */
  /* BUG FIX (the "stuck on EV" one): the old pattern was (ev|...)\w* which made
     \bev\w* match EVery, EVening, EVent, EVerest — hijacking unrelated messages
     into this card again and again. Each keyword now has its own boundary, and
     bare "charge" only counts with vehicle context (not "charge a fee"). */
  if((/\b(evs?|electric|e-?vehicles?|charging|chargers?|green (travel|options|hub)|solar|organic farm|eco.?(stay|village|farm)|sustainab\w*)\b/i.test(String(it._raw||''))
      || (/\bcharge\b/i.test(String(it._raw||'')) && /\b(car|bike|scooter|vehicle|ev|battery|station|point|where)\b/i.test(String(it._raw||''))))
     && !/\bcarbon (ledger|score|footprint)\b/i.test(String(it._raw||''))
     && !/\b(charge (a|me|extra|more|fee|fees|for)|service charge|convenience charge|extra charge)\b/i.test(String(it._raw||''))){
    var _gc = '';
    var _gd = it.dest || (_cpCtx && _cpCtx.dest) || '';
    if(_gd){ var _gg = cpDbFind(String(_gd)) || await rwResolvePlace(_gd); if(_gg) _gc = _gg.cc || (_gg.country==='India'?'IN':''); }
    return [rwGreenHubHTML(_gc)];
  }
  /* monkeys */
  if(/\b(monkey|monkeys|macaque|langur|bandar)\b/i.test(String(it._raw||''))){
    var _mk = it.dest || (_cpCtx && _cpCtx.dest) || '';
    var _mh = rwMonkeyHTML(_mk);
    if(_mh) return [_mh];
    return ['<div class="tk-card tk-mini"><div class="tk-sec"><div style="font-size:13px;line-height:1.6">\ud83d\udc12 I track monkey hotspots for Almora, Shimla, Rishikesh, Haridwar, Nainital, Mussoorie, Vrindavan, Varanasi, Jaipur and Dharamshala. Name one of those and I\u2019ll give you the specifics.</div>'
      +'<div class="tk-lab" style="margin-top:9px">Universal rules</div>'
      +'<div class="tk-bul">No eye contact, no visible food, no bared teeth, never feed them.</div>'
      +'<div class="tk-bul">If bitten or scratched: wash 15 minutes with soap, then a doctor the same day \u2014 rabies risk is real.</div></div></div>'];
  }
  /* progression */
  if(/\b(my (progress|level|xp|badges)|challenges?|gamif|how many treks|my travel record)\b/i.test(String(it._raw||''))){
    return [rwProgressHTML()];
  }
  /* trekking */
  if(/\b(trek|trekking|trail|summit|base camp|hike|hiking)\b/i.test(String(it._raw||''))){
    var _tg = null;
    var _rw = String(it._raw||'').toLowerCase();
    ['easy','moderate','difficult','hard','extreme'].forEach(function(g){ if(_rw.indexOf(g)>-1) _tg=g; });
    if(/very hard/.test(_rw)) _tg='extreme';
    return [rwTrekListHTML(_tg)];
  }
  /* medical / pharmacy */
  if(/\b(pharmac|chemist|medicine|medical|doctor|clinic|hospital|dentist|first aid|sick|fever|injur)\w*\b/i.test(String(it._raw||''))){
    var _mdp = it.dest || (_cpCtx && _cpCtx.dest) || '';
    var _mdg = _mdp ? (cpDbFind(String(_mdp)) || await rwResolvePlace(_mdp)) : null;
    var _mdi = [];
    if(_mdg){ try{ _mdi = await rwMedNear(_mdg.lat, _mdg.lon); }catch(e){} }
    return [rwMedHTML(_mdp, _mdi)];
  }
  /* athlete / fitness mode */
  if(/\b(gym|workout|training|train (hard|for)|run(ning)?|jog|fitness|protein|athlete|sport|marathon|lifting|weights)\b/i.test(String(it._raw||''))){
    var _fp = it.dest || (_cpCtx && _cpCtx.dest) || '';
    var _fg = _fp ? (cpDbFind(String(_fp)) || await rwResolvePlace(_fp)) : null;
    var _fi = [];
    if(_fg) { try{ _fi = await rwFitNear(_fg.lat, _fg.lon); }catch(e){} }
    return [rwAthleteHTML(_fp, _fi)];
  }
  /* trip merch */
  if(/\b(t.?shirt|tshirt|tee|merch|hoodie|custom (shirt|tee|print)|print my|slogan)\b/i.test(String(it._raw||''))){
    var _mp = it.dest || (_cpCtx && _cpCtx.dest) || '';
    return [rwMerchHTML(_mp)];
  }
  /* live location */
  if(rwIsNearMe(it._raw||'')){
    try{ return [await rwNearMeHTML(it._raw||'')]; }catch(e){}
  }
  /* booking platform comparison */
  if(/\b(where (to |should i )?book|which (site|platform|app)|compare (booking|platforms?|sites?)|makemytrip|make my trip|ixigo|skyscanner|thomas cook|best booking)\b/i.test(String(it._raw||''))){
    return [rwPlatformsHTML()];
  }
  /* eco intents */
  var _rawq = String(it._raw||'');
  if(/\b(my )?(green|eco|carbon)\s*(ledger|score|footprint|badge|badges|certificate)\b|\bhow much carbon\b|\bmy impact\b/i.test(_rawq)){
    return [rwEcoPanelHTML()];
  }
  if(/\b(eco|green|low.?carbon|sustainable|carbon)\b/i.test(_rawq) && it.dest){
    var _km = 300;
    H.push(rwGreenSwapHTML(_km));
  }
  /* on-trip action ("order food", "need shorts", "book a cab") */
  var _act = rwActionIntent(it._raw||'');
  if(_act){
    var _dest = it.dest || (_cpCtx && _cpCtx.dest) || '';
    var _lat=null,_lon=null;
    if(_dest){ var _g = cpDbFind(String(_dest)) || await rwResolvePlace(_dest); if(_g){ _lat=_g.lat; _lon=_g.lon; } }
    return [rwActionHubHTML(_act, rwActionQuery(it._raw, _act, _dest), _dest, _lat, _lon, (_g&&_g.cc)||(_g&&_g.country==='India'?'IN':''))];
  }
  /* a bare common word is more likely a parse slip than a destination — ask */
  if(rwNeedsClarify(it.dest, it)){
    return [rwClarifyWordHTML(it.dest, it)];
  }
  /* multi-city route card */
  if(it.multi && it.stops && it.stops.length>=2){
    try{ return [await tkRouteCard(it)]; }catch(e){}
  }
  /* compact answer for topic follow-ups on a remembered destination */
  if(it._inherited && it.topic && it.dest){
    try{ return [await tkMiniCard(it)]; }catch(e){}
  }
  var dbHit = it.dest ? cpDbFind(String(it.dest)) : null;
  var lat = dbHit? dbHit.lat : null, lon = dbHit? dbHit.lon : null, geo=null;
  if(it.dest && lat==null){
    /* ---- ASK BEFORE GUESSING ----
       Skip only when the traveller already disambiguated ("Manali, Himachal"),
       when we hold a curated override, or when they're continuing a topic about
       a place already established in this conversation. */
    var _alreadySpecific = /,/.test(String(it._raw||'')) || it._inherited;
    var _curated = !!(RW_PLACE_OVERRIDES && RW_PLACE_OVERRIDES[String(it.dest).toLowerCase().replace(/[^a-z]/g,'')]);
    if(!_alreadySpecific && !_curated){
      try{
        var _cands = await rwCandidates(it.dest);
        if(rwIsAmbiguous(_cands, (typeof RW_HOME_CC!=='undefined'? RW_HOME_CC : 'IN'))){
          return [rwDisambigHTML(it.dest, _cands)];
        }
      }catch(e){}
    }
    geo = await rwResolvePlace(it.dest);
    /* legacy low-confidence path, kept as a backstop */
    if(geo && geo.lowConf){
      try{
        var _c2 = await rwCandidates(it.dest);
        if(_c2.length>1) return [rwDisambigHTML(it.dest, _c2)];
      }catch(e){}
      return [tkClarifyHTML(it.dest, geo)];
    }
    if(geo){ lat=geo.lat; lon=geo.lon; it.dest=geo.name; }
    else {
      /* Not in our library, not resolvable anywhere: SAY SO and PROBE. Never
         build a confident card around a word we only half-recognised (the
         "grabbed india from 'Kanyakumari south india'" bug). If the user gave
         a multi-word phrase, echo it back and ask them to confirm the place. */
      var picks=['Goa','Manali','Jaipur','Udaipur','Rishikesh','Kanyakumari'];
      var typed = esc2(it.dest||'');
      var raw = esc2((it._raw||'').trim());
      var askLine = (raw && raw.toLowerCase()!==String(it.dest||'').toLowerCase())
        ? '\ud83e\udded I want to get this right rather than guess. You said \u201c'+raw+'\u201d \u2014 which place do you mean? Type it as <b>City, Country</b> (e.g. \u201cKanyakumari, India\u201d), or pick one:'
        : '\ud83e\udded I couldn\u2019t place \u201c'+typed+'\u201d for sure \u2014 and I\u2019d rather ask than send you the wrong spot. Try <b>City, Country</b> (e.g. \u201cKasol, India\u201d), or pick one:';
      return ['<div class="tk-card"><div class="tk-sec">'
        +'<div style="font-size:13px;line-height:1.6">'+askLine+'</div>'
        +'<div class="tk-chips" style="margin-top:9px">'
        + picks.map(function(pn){ return '<button class="tk-chip" onclick="cpFollow(\''+pn+'\')">'+pn+'</button>'; }).join('')
        +'</div></div></div>'];
    }
  }
  var used={}, headHTML='';
  if(it.dest){
    try{ await rwLoadPhotoMap(); }catch(e){}
    var nm=String(it.dest).replace(/[<>]/g,'');
    var meta=[];
    if(dbHit) meta.push(dbHit.country);
    else if(geo) meta.push([geo.admin,geo.country].filter(Boolean).join(', '));
    if(geo && geo.pop) meta.push(geo.pop.toLocaleString('en-IN')+' people');
    if(geo && geo.elev) meta.push(Math.round(geo.elev)+'m');
    if(typeof RW_PHOTOS!=='undefined' && RW_PHOTOS && RW_PHOTOS[it.dest]) used.photo=true;
    headHTML = '<div class="tk-head" style="'+tkHeadStyle(it.dest)+'">'
      +'<div class="tk-place">'+nm+'</div>'
      +(meta.length? '<div class="tk-meta">'+meta.join(' \u00b7 ')+'</div>':'')
      +'</div>';
    try{
      var wvS = await wvStructured(it.dest, it._raw||'');
      if(wvS){
        used.wv = wvS.title;
        if(wvS.intro) H.push('<div class="tk-lab">About</div><div style="font-size:12.5px;line-height:1.6;color:var(--t2)">'+esc2(wvS.intro)+'\u2026</div>');
        var gsecs='', allBul=[];
        wvS.secs.slice(0,2).forEach(function(sec){
          var bl = tkBullets(sec.text, 4);
          allBul = allBul.concat(bl);
          if(bl.length) gsecs += '<div class="tk-lab">'+esc2(sec.line)+'</div>'+bl.map(function(b){ return '<div class="tk-bul">'+esc2(b)+'</div>'; }).join('');
        });
        if(gsecs) H.push(tkFold('\u2726 Highlights \u2014 see & do', gsecs));
        /* mini itinerary: a TASTE of the days from real guide material — the
           full visual plan (photos, packing, PDF) stays one tap away in Plan */
        if(allBul.length>=2 && it.days){
          var sample = Math.min(it.days, 4), per = Math.max(1, Math.floor(allBul.length/sample));
          var ITIC=['\ud83c\udfdb\ufe0f','\ud83c\udf5c','\u26f0\ufe0f','\ud83c\udfa8','\ud83d\uddfa\ufe0f','\ud83c\udf05'];
          var itin='';
          for(var di=0; di<sample; di++){
            var picks2 = allBul.slice(di*per, di*per+Math.min(2,per));
            if(!picks2.length) break;
            itin += '<div style="display:flex;gap:9px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
              +'<b style="flex:0 0 auto;font-size:10.5px;color:var(--gold2,#C8913E);padding-top:2px">DAY '+(di+1)+'</b>'
              +'<div style="font-size:12px;line-height:1.55;color:var(--t2)">'+picks2.map(function(b,bi){ return ITIC[(di+bi)%ITIC.length]+' '+esc2(b); }).join('<br>')+'</div></div>';
          }
          if(it.days>sample) itin += '<div style="font-size:11px;color:var(--t3);padding:6px 0">\u2026 +'+(it.days-sample)+' more days \u2014 tap a Plan chip above for the full day-by-day with packing list & PDF.</div>';
          if(itin) H.push(tkFold('\ud83d\uddd3\ufe0f Mini itinerary \u2014 taste of the days', itin));
        }
      }
    }catch(e){}
    H.push('<div class="tk-lab">Plan it</div>'+tkItinChips(it.dest));
  }
  /* weather */
  if(it.wants.indexOf('weather')>-1){
    if(lat!=null && navigator.onLine){
      try{
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto').then(function(r){return r.json();});
        if(w&&w.daily){
          var rows=w.daily.time.map(function(d,i){
            var rain=w.daily.precipitation_probability_max[i];
            return new Date(d).toLocaleDateString('en-IN',{weekday:'short'})+' '+Math.round(w.daily.temperature_2m_min[i])+'\u2013'+Math.round(w.daily.temperature_2m_max[i])+'\u00b0'+(rain>=40? ' \ud83c\udf27'+rain+'%':'');
          }).join(' \u00b7 ');
          used.wx=true; H.push('\u26c5 '+rows+(w.daily.precipitation_probability_max[0]>=40? '<br><span style="color:#5CC8FF">Rain likely \u2014 front-load indoor stops (cafes, museums, markets) early in the day.</span>':''));
        }
      }catch(e){ H.push('\u26c5 Forecast unavailable right now.'); }
    } else H.push('\u26c5 Forecast needs internet'+(it.dest?'':' and a destination'));
  }
  /* cafes */
  if(it.wants.indexOf('cafes')>-1 && it.dest){
    H.push('\u2615 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('cafes with wifi in '+it.dest)+'">Work-friendly cafes in '+it.dest+' \u2192</a>');
  }
  /* transport */
  if(it.wants.indexOf('transport')>-1 && it.dest){
    var dst = it.to || 'Delhi';
    H.push('\ud83d\ude8c <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.rome2rio.com/s/'+encodeURIComponent(it.dest)+'/'+encodeURIComponent(dst)+'">All routes '+it.dest+' \u2192 '+dst+'</a> \u00b7 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.redbus.in/">redBus (Volvo/sleeper) \u2192</a>');
  }
  /* stays */
  if(it.wants.indexOf('stay')>-1 && it.dest){
    H.push('\ud83c\udfe8 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="'+stayUrl(it.dest)+'">Compare stays on Booking</a> \u00b7 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="'+stayUrlAgoda(it.dest)+'">Agoda</a>');
  }
  /* shadow budget — the differentiator: costs no competitor quotes */
  var costEntry = dbHit || costEntryForPlace(geo);
  if(costEntry && (it.days || it.wants.indexOf('budget')>-1)){
    if(it.budget){ H.push(rwBudgetFitHTML(costEntry, it)); }
    else if(it.style){ H.push(rwStyledSheet(costEntry, it.days||5, it.style)); }
    else H.push(tkFold('\ud83d\udc7b Shadow budget \u2014 full breakdown', shadowBudgetHTML(costEntry, it.days||5, 'mid')));
  }
  /* monkey-heavy places get a warning without being asked */
  if(it.dest){
    var _mm = rwMonkeyFor(it.dest);
    if(_mm && (_mm.level==='severe' || _mm.level==='high')){
      H.push('<div style="background:rgba(232,186,108,.08);border:1px solid rgba(232,186,108,.3);border-radius:12px;padding:10px 12px">'
        +'<div style="font-weight:800;font-size:12.5px">\ud83d\udc12 Monkeys are active here</div>'
        +'<div style="font-size:11.5px;color:var(--t2);line-height:1.6;margin-top:3px">No visible food, no eye contact, bag on your front. '
        +'<button class="tk-chip" style="font-size:10.5px;padding:3px 8px;margin-left:4px" onclick="cpFollow(\'monkeys in '+String(it.dest).replace(/'/g,'')+'\')">Full guidance</button></div></div>');
    }
  }
  /* going somewhere with no signal? say so before they leave */
  if(it.dest && RW_OFFGRID.hi(it.dest)){
    H.push('<div style="background:rgba(99,102,241,.09);border:1px solid rgba(99,102,241,.32);border-radius:12px;padding:10px 12px">'
      +'<div style="font-weight:800;font-size:12.5px">\ud83d\udef0\ufe0f You will lose signal here</div>'
      +'<div style="font-size:11.5px;color:var(--t2);line-height:1.6;margin-top:3px">Leave your route with two people and check your satellite SOS options before you go. '
      +'<button class="tk-chip" style="font-size:10.5px;padding:3px 8px;margin-left:4px" onclick="cpFollow(\'off grid safety '+String(it.dest).replace(/'/g,'')+'\')">Off-grid guide</button></div></div>');
  }
  /* what this place sounds like */
  if(it.dest){
    var _sd = rwSoundHTML(it.dest);
    if(_sd) H.unshift(_sd);
  }
  /* the dish this place is known for */
  if(it.dest){
    var _fd = rwFoodHTML(it.dest);
    if(_fd) H.unshift(_fd);
  }
  /* what this place feels like */
  if(it.dest){
    var _vb = rwVibeHTML(it.dest);
    if(_vb) H.unshift(_vb);
  }
  /* the local ecosystem — artists, homestays, musicians, researchers */
  if(it.dest){
    var _eco = rwEcosystemHTML(it.dest);
    if(_eco) H.push(_eco);
  }
  /* has this place changed? */
  if(it.dest){
    var _pr = rwPressureHTML(it.dest);
    if(_pr) H.push(_pr);
  }
  /* international destinations: visa + flights + insurance on top */
  if(geo && geo.cc){
    var intl = rwIntlHTML(geo);
    if(intl) H.push(intl);
  }
  /* personalise from what we've learned about this user */
  var prof = rwUserProfile();
  if(prof.count>=3 && prof.topVibe && it.dest && (!it.vibe || !it.vibe.length)){
    H.push('<div style="font-size:11px;color:var(--t3)">\ud83d\udca1 You usually lean <b>'+prof.topVibe+'</b>'
      +(prof.typicalDays? ' \u00b7 ~'+prof.typicalDays+'-day trips':'')
      +(prof.avgBudget? ' \u00b7 around \u20b9'+prof.avgBudget.toLocaleString('en-IN'):'')
      +' \u2014 tuning suggestions that way.</div>');
  }
  /* What's actually at this place. Deliberately NOT awaited: the public
     Overpass server can take 10s or stall entirely, and blocking the whole
     answer on it made the Copilot feel broken. Render a placeholder now, fill
     it in when the data lands, remove it quietly if nothing comes back. */
  if(lat!=null && lon!=null){
    used.osm=true;
    var slot='osm_'+Math.random().toString(36).slice(2,8);
    H.push('<div id="'+slot+'"></div>');
    var dest=it.dest;
    setTimeout(function(){
      osmAttractions(lat, lon).then(function(spots){
        var host=el(slot); if(!host) return;
        if(spots && spots.length) host.innerHTML=osmAttractionsHTML(spots, dest);
        else host.remove();
      }).catch(function(){ var h=el(slot); if(h) h.remove(); });
    }, 30);
  }
  /* what things should cost + how not to get fleeced */
  if(geo || dbHit){
    var gGeo = geo || {cc: (dbHit && dbHit.country==='India') ? 'IN' : ''};
    var gh = groundHTML(gGeo, it.dest||'this trip');
    if(gh) H.push(tkFold('\ud83d\ude95 Costs & scam guide', gh));
  }
  /* the fun bit: a witty, destination-aware voice note */
  if(it.dest && (dbHit||geo)){
    H.push(tuskVoiceNoteHTML(it.dest, dbHit||costEntry));
  }
  /* budget */
  if(it.budget!=null){
    var line='\ud83d\udcb0 \u20b9'+it.budget.toLocaleString('en-IN');
    if(it.days) line+=' over '+it.days+' days = <b>\u20b9'+Math.round(it.budget/it.days).toLocaleString('en-IN')+'/day</b>';
    if(dbHit&&dbHit.cost) line+=' <span style="color:var(--t3)">(typical mid-range there \u2248 $'+dbHit.cost.mid+'/week)</span>';
    H.push(line);
  }
  /* plan */
  if(it.wants.indexOf('plan')>-1 && it.dest){
    /* Hand off WITH the data: destination goes straight into the Plan tab's
       search — works for DB destinations and unknown ones alike. */
    H.push('\ud83d\uddfa Build the day-by-day plan '+(it.days? '('+it.days+' days) ':'')+'with budget breakdown, packing list and <b>PDF download</b>:'
      +'<br><button class="tact" style="font-size:12px;padding:7px 12px;margin-top:6px;font-weight:800" onclick="cpGoPlan(\''+String(it.dest).replace(/[<>']/g,'')+'\','+(it.days||0)+')">\ud83d\udcc5 Plan '+String(it.dest).replace(/[<>]/g,'')+' \u2192</button>');
  }
  /* share */
  if(it.wants.indexOf('share')>-1){
    var summary='RoamWise plan: '+(it.dest||'trip')+(it.days? ' \u00b7 '+it.days+' days':'')+(it.budget? ' \u00b7 under \u20b9'+it.budget.toLocaleString('en-IN'):'')+' \u2014 roamwise.co.in';
    H.push('\ud83d\udc65 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(summary)+'">Send this plan to companions on WhatsApp \u2192</a>');
  }
  if(it.dest){
    H.push('<div class="tk-lab">Ask me next</div>'+tkFollowChips(it.dest));
    var card = '<div class="tk-card">'+headHTML
      + H.map(function(x){ return '<div class="tk-sec">'+x+'</div>'; }).join('')
      + tkCredits(used) + '</div>';
    return [card];
  }
  return H;
}
