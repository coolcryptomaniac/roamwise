// @ts-nocheck
/* ==================== COPILOT: CORE (chat + parser + intent memory + world resolver) ====================
   Extracted verbatim from app.js (Phase 4b modularization).

   This is deliberately ONE file, not the five originally proposed
   (chat.js / web-lookup.js / intent-memory.js) — the deterministic-parser
   copilot core is one interleaved ~890-line block (Phase 4a's finding,
   re-verified for Phase 4b): cpParseRegex() calls into the mini-web-lookup
   helpers (rwKnownMap/rwScanKnown/rwFuzzyPlace) dozens of times, the World
   Place Resolver's rwKnownMap() is itself built from cpParseRegex's own
   known-place data, and copilotSend() drives the whole thing end to end.
   Splitting these three "modules" into separate files would not reduce
   coupling, only scatter it — so per the phase-4b brief's explicit
   allowance, it ships as one file, well under the 1000-line hard cap.

   Contains, in source order:
     - AI TRAVEL COPILOT: openCopilot/cpFocusHero/closeCopilot/cpClearChat/
       cpBubble/cpModelChips, cpDbFind/cpSmartAnswer, rolling chat memory
       (rwRemember/rwRecall/rwAskedBefore), the deterministic parser
       (cpParseRegex) and copilotSend() itself.
     - SELF-IMPROVING INTENT MEMORY (rwLearnIntent/rwUserProfile).
     - MINI WEB LOOKUP (rwMiniSearch/rwWebAnswerHTML + the known-place /
       fuzzy-match helpers cpParseRegex depends on).
     - WORLD GEOCODER + WORLD PLACE RESOLVER (rwGeocode/rwVerifyDest,
       RW_PLACE_OVERRIDES/rwResolvePlace).

   LOAD-ORDER NOTE: this file contains app.js's original top-level
   `if(lsGet('rw_keep_chat')==='1'){...} else {...}` init block, which
   executes at PARSE TIME (not from inside a function). That is exactly the
   class of hazard Phase 4a flagged — moving it into a module that loads
   BEFORE app.js used to risk a ReferenceError if lsGet/lsSet weren't yet
   defined. That is now resolved structurally: js/core/storage-utils.js
   (a true leaf utility, zero dependencies) loads first in index.html,
   before this file and before app.js, so lsGet/lsSet are always already
   defined by the time this runs, regardless of relative order. Every other
   cross-reference in this file (cpDbFind, DB, rwDetectState,
   rwDetectCountry, RW_COMMON_WORDS, aiCallAny, cpFinish, cpActionsHTML,
   rwTuskAsk, rwMasalaWrap, tkSmalltalk, rwLearn, wvGuide, CITY_NAME_FIXUPS,
   RW_HOME_CC, etc.) is a normal function-body reference resolved at call
   time, long after every script on the page — including app.js — has
   finished loading, so none of them are order-sensitive. ==== */

/* ==================== AI TRAVEL COPILOT ====================
   One box, natural language, no menus: "Reaching Manali tomorrow, rain
   expected, find a cafe to work from, bus back to Delhi Sunday, keep it
   under Rs18,000." Parsing is two-tier and honest about both tiers:
   1) If the user has any AI key (existing aiCall stack), the model extracts
      a strict-JSON intent object.
   2) Otherwise a deterministic regex parser covers the core intents.
   Execution NEVER fakes what a static app can't do: weather is fetched live
   (Open-Meteo), budgets are real arithmetic, transport/cafe actions open the
   right partner or Maps deep-link, sharing uses WhatsApp. The footer says
   exactly that. */
function openCopilot(){
  var ov = el('cpOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='cpOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet" style="display:flex;flex-direction:column;max-height:92dvh">'
      +'<div class="sheet-head"><b>\ud83e\udded Travel Copilot</b><span style="margin-left:auto;display:flex;gap:6px"><button class="x" title="Clear chat" onclick="cpClearChat()">\ud83e\uddf9</button><button class="x" onclick="closeCopilot()">\u2715</button></span></div>'
      +'<div id="cpLog" style="flex:1;overflow-y:auto;padding:4px 2px;min-height:120px"></div>'
      +'<div id="cpModels" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px"></div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 6px" id="cpChips"></div>'
      +'<div style="display:flex;gap:8px;align-items:flex-end">'
      +'<textarea id="cpInput" rows="1" placeholder="Type or speak your plan\u2026" style="flex:1;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:11px 12px;color:inherit;font:inherit;resize:none;outline:none"></textarea>'
      +'<button class="tact" id="cpMic" style="padding:11px 12px" onclick="rwVoiceStart(\'cpInput\')">\ud83c\udfa4</button>'
      +'<button class="tact" style="padding:11px 14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="copilotSend()">\u27a4</button>'
      +'</div>'
      +'<div style="font-size:9.5px;color:var(--t3);margin-top:6px;line-height:1.5">Copilot plans, calculates and links \u2014 transport &amp; stays open partner sites; nothing is booked or charged inside the app.</div>'
      +'</div>';
    document.body.appendChild(ov);
    el('cpInput').addEventListener('keydown',function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); copilotSend(); } });
    var chips=[['\u26c5 Weather in Goa this week','Weather in Goa this week'],
               ['\ud83d\ude8c Bus Manali \u2192 Delhi Sunday','I need a bus from Manali to Delhi on Sunday'],
               ['\ud83d\udcb0 5 days in Jaipur under \u20b915,000','Plan 5 days in Jaipur under \u20b915,000']];
    el('cpChips').innerHTML = chips.map(function(c){
      return '<button class="tact" style="font-size:10.5px;padding:6px 10px" onclick="el(\'cpInput\').value=\''+c[1].replace(/'/g,"\\'")+'\';copilotSend()">'+c[0]+'</button>';
    }).join('');
    cpBubble('Tell me your plan in one message \u2014 destination, dates, budget, what you need. I\u2019ll sort the pieces.','bot');
  }
  cpModelChips('cpModels');
  rwOverlayOpen('cpOverlay');
  setTimeout(function(){ var i=el('cpInput'); if(i) i.focus(); },150);
}
function cpFocusHero(){
  try{ tabGo('home'); }catch(e){}
  var h=el('copilotHero'); if(!h) { openCopilot(); return; }
  h.scrollIntoView({behavior:'smooth', block:'center'});
  setTimeout(function(){ var i=el('heroInput'); if(i) i.focus(); }, 420);
}
function closeCopilot(){ rwOverlayClose('cpOverlay'); }
/* One tap = truly fresh: visible log, rolling memory, trip context, stored turns. */
function cpClearChat(){
  _cpTurns=[]; _cpHist=[]; _cpCtx=null; window._tkLastAns=null; window._tkCarryShown=null;
  try{ localStorage.removeItem('rw_turns'); }catch(e){}
  var log=el('cpLog'); if(log) log.innerHTML='';
  var hl=el('heroLog'); if(hl) hl.innerHTML='';
  try{ cpBubble('\ud83e\uddf9 Fresh start — history cleared. Tell me your plan.','bot'); }catch(e){}
  try{ showToast('Chat cleared'); }catch(e){}
}
var _cpTargetLog='cpLog';
function cpBubble(html, who){
  var log=el(_cpTargetLog)||el('cpLog'); if(!log) return;
  var b=document.createElement('div');
  b.style.cssText = who==='me'
    ? 'margin:6px 0 6px 40px;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border-radius:14px 14px 4px 14px;padding:10px 12px;font-size:12.5px;white-space:pre-line'
    : 'margin:6px 40px 6px 0;background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px 14px 14px 4px;padding:10px 12px;font-size:12.5px;line-height:1.55;white-space:pre-line';
  b.innerHTML=html;
  /* Hero log sits ABOVE the input, so newest goes at the BOTTOM of that log —
     i.e. directly above the box where the eye and thumb already are. */
  log.appendChild(b);
  if(_cpTargetLog==='heroLog'){ log.scrollTop=log.scrollHeight; } else { log.scrollTop=log.scrollHeight; }
  return b;
}
var _cpRec=null;
// copilotVoiceHero, rwVoiceStart, rwVoiceResult, rwVoiceState moved to js/voice/voice-input.js
/* ---- tier 2: deterministic parser (no key needed) ---- */
var _cpCtx = null;  /* last resolved {dest,days,budget} — conversational memory */
/* Rolling memory of the last 10 exchanges. _cpCtx holds the CURRENT trip state;
   this holds the shape of the conversation, so Tusk can answer "what did I ask
   before" and avoid repeating the same suggestion twice in a row. */
var _cpTurns = [];
function rwRemember(role, text, meta){
  _cpTurns.push({role:role, text:String(text||'').slice(0,300), meta:meta||{}, at:Date.now()});
  if(_cpTurns.length>10) _cpTurns.shift();
  try{ if(lsGet('rw_keep_chat')==='1') lsSet('rw_turns', JSON.stringify(_cpTurns.slice(-10))); }catch(e){}
}
function rwRecall(n){ return _cpTurns.slice(-(n||5)); }
function rwAskedBefore(topic){
  return _cpTurns.some(function(t){ return t.role==='user' && new RegExp(topic,'i').test(t.text); });
}
/* CLEAN-START POLICY: chat memory is session-only by default. Restoring old
   turns made Tusk drag stale context into brand-new chats ("still on X" when
   the user had moved on days ago). Opt back in with rw_keep_chat='1'. */
if(lsGet('rw_keep_chat')==='1'){ try{ _cpTurns = JSON.parse(lsGet('rw_turns')||'[]'); }catch(e){ _cpTurns=[]; } }
else { _cpTurns=[]; try{ localStorage.removeItem('rw_turns'); }catch(e){} }
var _cpHist = []; /* [{q,a}] capped — gives the AI real conversational memory */
function cpModelChips(targetId){
  var host = el(targetId); if(!host) return;
  var provs = ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].filter(function(p){ return lsGet('rwKey_'+p); });
  var cur = (typeof activeProv!=='undefined')? activeProv : 'smart';
  var chips = [['smart','\u26a1 Ailon Tusk']].concat(provs.map(function(p){ return [p, p.charAt(0).toUpperCase()+p.slice(1)]; }));
  host.innerHTML = chips.map(function(c){
    var on = cur===c[0];
    return '<button onclick="cpSetModel(\'' + c[0] + '\')" style="font-size:10px;padding:4px 10px;border-radius:999px;border:1px solid '
      +(on?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';background:'+(on?'rgba(232,186,108,.14)':'transparent')
      +';color:'+(on?'var(--gold,#E8BA6C)':'var(--t3)')+';cursor:pointer">'+c[1]+'</button>';
  }).join('') + (provs.length? '' : '<button onclick="openWizard()" style="font-size:10px;padding:4px 10px;border-radius:999px;border:1px dashed var(--b2,#2A2A36);background:none;color:var(--t3);cursor:pointer">+ free AI key</button>');
}
function cpSetModel(p){
  activeProv=p; lsSet('rwProv',p);
  cpModelChips('cpModels'); cpModelChips('heroModels');
  showToast(p==='smart' ? '\u26a1 Ailon Tusk \u2014 RoamWise\u2019s own engine: live travel guides, weather and prices (not a language model)' : 'Using '+p);
}
function cpDbFind(text){
  var lower=' '+String(text).toLowerCase()+' ';
  var hit=null;
  DB.forEach(function(d){ if(!hit && lower.indexOf(' '+d.name.toLowerCase())>-1) hit=d; });
  if(!hit){ /* fuzzy: any 5+char token that starts a DB name — scales as DB grows */
    var toks=String(text).toLowerCase().match(/[a-z]{5,}/g)||[];
    DB.forEach(function(d){ if(hit) return; var n=d.name.toLowerCase();
      toks.forEach(function(tk){ if(!hit && n.indexOf(tk)===0) hit=d; }); });
  }
  return hit;
}
function cpSmartAnswer(t){
  var MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var vs=t.match(/(.+?)\s+(?:vs\.?|versus)\s+(.+)/i);
  if(vs){
    var a=cpDbFind(vs[1]), b=cpDbFind(vs[2]);
    if(a&&b&&a!==b){
      function one(d){ return '<b>'+d.name+'</b> ('+d.country+') \u2014 $'+d.cost.budget+'\u2013'+d.cost.mid+'/wk \u00b7 best: '+(d.bestM||[]).map(function(m){return MO[m-1];}).join(',')+' \u00b7 '+d.visa.type; }
      return one(a)+'<br><br>'+one(b)+'<br><br>\ud83e\udd77 Lower cost: <b>'+(a.cost.mid<=b.cost.mid?a.name:b.name)+'</b>';
    }
  }
  var hit=cpDbFind(t);
  if(hit){
    var best=(hit.bestM||[]).map(function(m){return MO[m-1]||m;}).join(', ');
    var low=hit.crowd? MO[hit.crowd.indexOf(Math.min.apply(null,hit.crowd))] : null;
    var out='<b>'+hit.name+'</b> \u00b7 '+hit.country+' ('+hit.region+')';
    if(hit.cost) out+='<br>\ud83d\udcb0 Weekly: $'+hit.cost.budget+' budget \u00b7 $'+hit.cost.mid+' mid \u00b7 $'+hit.cost.luxury+' luxury';
    var dm=t.match(/(\d+)\s*[- ]?\s*day/i);
    if(dm && hit.cost){ var nd=parseInt(dm[1],10); out+='<br>\ud83d\udcc6 '+nd+' days \u2248 $'+Math.round(hit.cost.budget/7*nd)+'\u2013'+Math.round(hit.cost.mid/7*nd)+' (\u2248\u20b9'+Math.round(hit.cost.budget/7*nd*88).toLocaleString('en-IN')+'\u2013'+Math.round(hit.cost.mid/7*nd*88).toLocaleString('en-IN')+')'; }
    if(hit.visa) out+='<br>\ud83d\udec2 '+hit.visa.type+' \u00b7 '+hit.visa.cost+' \u00b7 '+hit.visa.days+' days'+(hit.visa.note? ' \u2014 '+hit.visa.note:'');
    if(best) out+='<br>\ud83d\udcc5 Best months: '+best;
    if(low) out+=' \u00b7 quietest: <b>'+low+'</b>';
    return out;
  }
  return null;
}

/* ==================== MINI WEB LOOKUP ====================
   When the curated DB and guide APIs come up empty, search the free open web:
   Wikipedia's search API + DuckDuckGo's Instant Answer API — both keyless and
   CORS-open. NOT Google crawling (blocked + against ToS); the card links out to
   full Google / DuckDuckGo results in one tap, which covers the same need. */
async function rwMiniSearch(q){
  q=String(q||'').slice(0,140);
  var out={abs:null, absSrc:null, absUrl:null, hits:[]};
  var jobs=[];
  jobs.push(fetch('https://api.duckduckgo.com/?q='+encodeURIComponent(q)+'&format=json&no_html=1&skip_disambig=1')
    .then(function(r){return r.json();}).then(function(d){
      var a=d.AbstractText||d.Answer||d.Definition||'';
      if(a){ out.abs=String(a).slice(0,420); out.absSrc=d.AbstractSource||'DuckDuckGo'; out.absUrl=d.AbstractURL||''; }
      (d.RelatedTopics||[]).slice(0,3).forEach(function(x){
        if(x && x.Text && x.FirstURL) out.hits.push({t:String(x.Text).slice(0,110), u:x.FirstURL, s:'DDG'});
      });
    }).catch(function(){}));
  jobs.push(fetch('https://en.wikipedia.org/w/rest.php/v1/search/page?q='+encodeURIComponent(q)+'&limit=3')
    .then(function(r){return r.json();}).then(function(d){
      (d.pages||[]).forEach(function(pg){
        out.hits.push({t:pg.title+(pg.description? ' — '+pg.description : ''), u:'https://en.wikipedia.org/wiki/'+encodeURIComponent(pg.key), s:'Wikipedia'});
      });
      if(!out.abs && d.pages && d.pages[0] && d.pages[0].excerpt){
        out.abs=String(d.pages[0].excerpt).replace(/<[^>]*>/g,'').slice(0,320); out.absSrc='Wikipedia';
        out.absUrl='https://en.wikipedia.org/wiki/'+encodeURIComponent(d.pages[0].key);
      }
    }).catch(function(){}));
  try{ await Promise.all(jobs); }catch(e){}
  return (out.abs || out.hits.length) ? out : null;
}
function rwWebAnswerHTML(q, res){
  var g='https://www.google.com/search?q='+encodeURIComponent(q);
  var dd='https://duckduckgo.com/?q='+encodeURIComponent(q);
  var out='<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A5F,#0A1628)">'
    +'<div class="tk-place">🔎 Web lookup</div>'
    +'<div class="tk-meta">Free open sources · “'+esc2(String(q).slice(0,70))+'”</div></div>'
    +'<div class="tk-sec">';
  if(res.abs){
    out+='<div style="font-size:12.5px;line-height:1.65;color:var(--t2)">'+esc2(res.abs)+'</div>'
      +'<div style="font-size:10.5px;color:var(--t3);margin-top:4px">Source: '+esc2(res.absSrc||'web')
      +(res.absUrl? ' · <a href="'+res.absUrl+'" target="_blank" rel="noopener" style="color:var(--gold,#E8BA6C)">open</a>':'')+'</div>';
  }
  if(res.hits.length){
    out+='<div class="tk-lab" style="margin-top:9px">Top matches</div>'
      + res.hits.slice(0,4).map(function(h){
          return '<div class="tk-bul"><a href="'+h.u+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline dotted">'+esc2(h.t)+'</a> <span style="color:var(--t3);font-size:10px">'+esc2(h.s)+'</span></div>';
        }).join('');
  }
  out+='<div class="tk-chips" style="margin-top:10px">'
    +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="'+g+'">🌐 Full Google results</a>'
    +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="'+dd+'">🦆 DuckDuckGo</a>'
    +'</div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:7px">Wikipedia + DuckDuckGo open APIs — no key, nothing tracked.</div>'
    +'</div></div>';
  return out;
}

/* One canonical known-place map: curated overrides + DB + major cities. Used by
   multi-city detection AND single-destination rescue below. */
function rwKnownMap(){
  if(window._rwKnown) return window._rwKnown;
  var known={};
  try{ (typeof DB!=='undefined'?DB:[]).forEach(function(d){ known[d.name.toLowerCase()]=d.name; }); }catch(e){}
  try{ Object.keys(RW_PLACE_OVERRIDES||{}).forEach(function(k){ var o=RW_PLACE_OVERRIDES[k]; known[o.name.toLowerCase()]=o.name; }); }catch(e){}
  /* places the daily workflow learned from real user questions (tusk-learned.js) */
  try{ Object.keys(window.RW_LEARNED_PLACES||{}).forEach(function(k){
        var o=RW_LEARNED_PLACES[k]; if(o&&o.name) known[String(k).toLowerCase()]=o.name; }); }catch(e){}
  ['kerala','rajasthan','himachal','uttarakhand','karnataka','tamil nadu','gujarat','ladakh','sikkim','meghalaya','punjab','maharashtra','west bengal','odisha','assam','telangana',
   'delhi','new delhi','mumbai','goa','jaipur','agra','kolkata','chennai','bengaluru','bangalore','hyderabad','pune','udaipur','jodhpur','jaisalmer','amritsar','varanasi','lucknow','kochi','mysuru','mysore','ooty','munnar','hampi','pondicherry','rishikesh','haridwar','dehradun','manali','shimla','leh','srinagar','darjeeling','gangtok','shillong','guwahati','bhopal','indore','surat','ahmedabad','almora','nainital','mussoorie','kasol','auli','ziro','gokarna','bangkok','bali','singapore','dubai','kathmandu','pokhara','colombo','hanoi','tokyo','paris','london','rome'].forEach(function(n){ if(!known[n]) known[n]=n.replace(/(^|\s)\w/g,function(m){return m.toUpperCase();}); });
  window._rwKnown = known;
  return known;
}
function rwScanKnown(t){
  var known=rwKnownMap(), lower=' '+String(t).toLowerCase().replace(/[^a-z0-9 ]/g,' ')+' ', hits=[];
  Object.keys(known).forEach(function(k){
    var at=lower.indexOf(' '+k+' ');
    if(at>-1) hits.push({at:at, key:k, name:known[k]});
  });
  hits.sort(function(a,b){ return b.key.length-a.key.length; });
  var kept=[], cov=[];
  hits.forEach(function(h){ if(!cov.some(function(c){return h.at>=c[0]&&h.at<c[1];})){ kept.push(h); cov.push([h.at,h.at+h.key.length]); } });
  kept.sort(function(a,b){ return a.at-b.at; });
  return kept.map(function(h){return h.name;}).filter(function(n,i,a){return a.indexOf(n)===i;});
}

function rwEditDist(a,b){
  a=String(a); b=String(b);
  var la=a.length, lb=b.length;
  if(Math.abs(la-lb)>2) return 99;
  var d=[]; for(var i=0;i<=la;i++){ d[i]=[i]; } for(var j=0;j<=lb;j++){ d[0][j]=j; }
  for(i=1;i<=la;i++){ for(j=1;j<=lb;j++){
    var cost = a.charAt(i-1)===b.charAt(j-1)?0:1;
    d[i][j]=Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+cost);
    if(i>1 && j>1 && a.charAt(i-1)===b.charAt(j-2) && a.charAt(i-2)===b.charAt(j-1))
      d[i][j]=Math.min(d[i][j], d[i-2][j-2]+1);
  }}
  return d[la][lb];
}
function rwFuzzyPlace(tok){
  tok=String(tok||'').toLowerCase();
  if(tok.length<5) return null;
  if(RW_COMMON_WORDS.test(tok)) return null;
  var known=rwKnownMap();
  if(known[tok]) return known[tok];
  var tol = tok.length>=8 ? 2 : 1, best=null, bestD=tol+1;
  for(var k in known){
    if(k.length<5 || Math.abs(k.length-tok.length)>tol) continue;
    var dd=rwEditDist(tok,k);
    if(dd<bestD){ bestD=dd; best=known[k]; if(dd===0) break; }
  }
  return bestD<=tol ? best : null;
}
var RW_SYN = [
  [/\bmausam\b/gi,'weather'], [/\bbarish\b/gi,'rain'], [/\bgarmi\b/gi,'summer heat'], [/\bsardi\b/gi,'winter cold'],
  [/\bkha+na\b/gi,'food'], [/\bnashta\b/gi,'breakfast'], [/\bkhane ?(ka|ki|ke)\b/gi,'food'],
  [/\bkharcha?\b/gi,'cost'], [/\bkitna\b/gi,'how much'], [/\bpaisa\b/gi,'money'], [/\bsasta\b/gi,'cheap'], [/\bmeh?nga\b/gi,'expensive'],
  [/\bru[kh]ne\b/gi,'stay'], [/\brehne\b/gi,'stay'], [/\bhotal\b/gi,'hotel'],
  [/\bpahu?nch(na|e|ne)?\b/gi,'reach'], [/\bkaise ja(ye|na|un)\b/gi,'how to reach'], [/\bja+na\b/gi,'go'],
  [/\bghu+m(na|ne)\b/gi,'explore'], [/\bjagah\b/gi,'place'], [/\bsuraksh(a|it)\b/gi,'safety'],
  [/\bwhats\b/gi,'what is'], [/\bhows\b/gi,'how is'], [/\bwheres\b/gi,'where is'],
  [/\baccomodation\b/gi,'accommodation'], [/\bwether\b/gi,'weather'], [/\bwheather\b/gi,'weather'],
  [/\bbugdet\b/gi,'budget'], [/\bbudge?t?t\b/gi,'budget'], [/\bitin[ea]rary\b/gi,'itinerary'],
  [/\brestraunt|restarant|resturant\b/gi,'restaurant']
];
function rwNormalizeQuery(t){
  t=String(t||'');
  for(var i=0;i<RW_SYN.length;i++){ t=t.replace(RW_SYN[i][0], RW_SYN[i][1]); }
  return t.replace(/\s{2,}/g,' ');
}


/* ============================================================================
   WORLD GEOCODER (rw-v77) — stop guessing whether a word is a place
   ============================================================================
   The real fix for "you" being treated as a destination isn't a longer
   stop-list — it's ASKING A PLACE DATABASE. We use OpenStreetMap Nominatim:
   free, worldwide, down to street level, no API key.

   WORKS WITHOUT THE WORKER. If rwApi('geo') exists we proxy through the
   Cloudflare Worker (better: edge-cached, and it keeps our request rate
   inside OSM's policy). If not, we call Nominatim directly from the browser.
   If BOTH fail, we fall back to the local curated DB — never to a guess.

   Results are cached in localStorage forever-ish, because a place's existence
   does not change.
   ========================================================================= */
var RW_GEO_CACHE='rw_geo_v1';
function rwGeoCacheGet(q){
  try{ var c=JSON.parse(lsGet(RW_GEO_CACHE)||'{}'); return c[q.toLowerCase()]; }catch(e){ return undefined; }
}
function rwGeoCacheSet(q,v){
  try{
    var c=JSON.parse(lsGet(RW_GEO_CACHE)||'{}');
    var keys=Object.keys(c);
    if(keys.length>400) keys.slice(0,150).forEach(function(k){ delete c[k]; }); /* trim */
    c[q.toLowerCase()]=v; lsSet(RW_GEO_CACHE, JSON.stringify(c));
  }catch(e){}
}
/* Returns a Promise of {name, display, lat, lon, type, country} or null. */
function rwGeocode(q){
  q=String(q||'').trim();
  if(!q || q.length<2) return Promise.resolve(null);
  var hit=rwGeoCacheGet(q);
  if(hit!==undefined) return Promise.resolve(hit);

  /* local curated DB first — instant, offline, and always right for our cities */
  try{
    var known=rwKnownMap();
    var k=q.toLowerCase();
    if(known[k]){
      var localv={ name:known[k], display:known[k], lat:null, lon:null, type:'curated', country:'IN' };
      rwGeoCacheSet(q, localv); return Promise.resolve(localv);
    }
  }catch(e){}

  var url;
  try{ url = (window.rwApi && rwApi('geo')) ? rwApi('geo')+'?q='+encodeURIComponent(q) : null; }catch(e){ url=null; }
  if(!url) url='https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q='+encodeURIComponent(q);

  return fetch(url, { headers:{ 'Accept':'application/json' } })
    .then(function(r){ return r.json(); })
    .then(function(d){
      var a = Array.isArray(d)? d[0] : (d && d.results ? d.results[0] : d);
      if(!a || !a.lat){ rwGeoCacheSet(q, null); return null; }
      var v={
        name: (a.name || String(a.display_name||'').split(',')[0] || q),
        display: a.display_name || q,
        lat: parseFloat(a.lat), lon: parseFloat(a.lon),
        type: a.type || a.class || 'place',
        country: (a.address && a.address.country_code ? a.address.country_code.toUpperCase() : '')
      };
      rwGeoCacheSet(q, v); return v;
    })
    .catch(function(){ return null; });   /* offline: never guess, just return null */
}
/* Verify a WEAK destination guess before the app acts on it. */
function rwVerifyDest(parsed){
  if(!parsed || !parsed.dest || !parsed._weakDest) return Promise.resolve(parsed);
  return rwGeocode(parsed.dest).then(function(g){
    if(g){ parsed.dest=g.name; parsed._geo=g; parsed._weakDest=false; }
    else { parsed._notAPlace=parsed.dest; parsed.dest=null; }   /* honest: we don't know */
    return parsed;
  });
}

function cpParseRegex(t){
  t = rwNormalizeQuery(t);
  /* -------- input hygiene: greetings, smalltalk, junk -------- */
  var RAW_T = t;
  t = String(t).replace(/^\s*(hey+|hii+|hi|hello+|helo|yo|namaste|namaskar|hola|sup|wassup|bhai|bro|dear|please|pls)\b[\s,!.]*/i, '');
  var BARE = t.replace(/[^a-z]/gi,'');
  if(!BARE || /^(thanks?|thankyou|thx|ty|ok(ay)?|hmm+|nice|cool|great|good|wow|love(it|you)?|bye|goodbye|gn|goodnight|goodmorning|gm|noneofthese|none)$/i.test(BARE)){
    var out0={dest:null,to:null,days:null,budget:null,wants:[],smalltalk: !BARE ? 'greet' : (/thank|thx|ty/i.test(BARE)?'thanks':(/bye|gn|goodnight/i.test(BARE)?'bye':(/none/i.test(BARE)?'none':'nice')))};
    return out0;
  }
  var out={dest:null,to:null,days:null,budget:null,wants:[]};
  var lower=' '+t.toLowerCase()+' ';
  /* budget: 12000 | 12,000 | Rs12000 | ₹12,000 | 8k | under 15k */
  var m=t.match(/(?:\u20b9|rs\.?\s?|inr\s?)?\s?([\d,]{2,})\s?(k\b|thousand)?/i);
  var mk=t.match(/(?:under|below|within|budget(?: of)?|max)?\s*(?:\u20b9|rs\.?|inr)?\s*(\d{1,3})\s*k\b/i);
  if(mk) out.budget=parseInt(mk[1],10)*1000;
  else { var mb=t.match(/(?:\u20b9|rs\.?\s?|inr\s?)\s?([\d,]{3,})|(?:under|below|within|budget(?: of)?|max)\s*(?:\u20b9|rs\.?|inr)?\s*([\d,]{3,})/i);
         if(mb) out.budget=parseInt((mb[1]||mb[2]).replace(/,/g,''),10); }
  var dm=t.match(/(\d+)\s*[- ]?\s*(?:day|night|din)/i); if(dm) out.days=parseInt(dm[1],10);
  /* destination: DB first (incl. fuzzy), then preposition, then leftover-token */
  var hit=cpDbFind(t); if(hit) out.dest=hit.name;
  if(!out.dest){
    /* Take EVERY preposition match, not just the first: "what to eat in Manali"
       used to capture "eat" from "to eat" and then look up a guide for a verb.
       Skip common verbs/fillers, and prefer a capitalised candidate. */
    var VERBS=/^(you|your|yours|me|my|us|our|them|their|him|her|tusk|ailon|roamwise|it|its|eat|go|do|see|visit|stay|sleep|travel|reach|get|buy|shop|find|book|know|start|plan|the|a|an|my|it|be|drink|walk|chill|relax|relaxing|peaceful|adventure|romantic|honeymoon|solo|family|spiritual|nature|scenic|foodie|luxury|cheap|party|nightlife|somewhere|anywhere|food|eat|hotel|stay|room|transport|taxi|cab|bus|train|flight|safety|scam|cost|price|money|there|here|that|this|tips|guide|advice|option|thing|under|below|within|over|about|around|say|says|said|mean|means|meant|share|send|give|tell|show|make|curated|budget|rs|inr|not|shadow|all|whole|entire|full|complete|across|multi|north|south|east|west)$/i;
    var re=/(?:\bin|\bto|reaching|\bat|visit(?:ing)?|\bfor|around|near)\s+([A-Za-z][a-zA-Z\u00C0-\u024F]{2,}(?:\s[A-Z][a-zA-Z]{2,})?)/g, mm, cands=[];
    while((mm=re.exec(t))!==null){ var w=mm[1].trim(); if(!VERBS.test(w.split(' ')[0])) cands.push(w); }
    var capped = cands.filter(function(w){ return /^[A-Z]/.test(w); });
    if(capped.length) out.dest=capped[0];
    else if(cands.length) out.dest=cands[0];
  }
  if(!out.dest){
    /* strip filler + numbers + MOOD words; whatever real word remains is the
       place. Mood words (romantic, solo, chill...) were being mistaken for
       destinations, so they're excluded here. */
    var STOP=/^(you|your|yours|yourself|youre|u|ur|me|my|mine|myself|we|us|our|ours|ourselves|they|them|their|theirs|he|him|his|she|her|hers|who|whos|whom|tusk|ailon|roamwise|bot|ai|assistant|app|chat|hello|hey|hii|namaste|sir|maam|madam|bhai|bro|dude|yes|yeah|yep|nope|sure|thanks|thank|okay|alright|maybe|really|actually|plan|planning|trip|tour|days?|nights?|budget|under|below|within|max|itinerary|itineraries|for|the|a|an|and|with|my|me|please|need|want|going|go|visit|visiting|show|find|make|create|give|about|cost|costs|price|rs|inr|rupees|k|thousand|weather|rain|cafe|cafes|bus|train|flight|volvo|hotel|stay|stays|from|to|in|at|on|next|week|weekend|tomorrow|today|is|are|it|what|how|much|good|best|place|places|chill|relax|relaxing|peaceful|adventure|adventurous|romantic|honeymoon|solo|family|spiritual|nature|scenic|foodie|luxury|cheap|party|nightlife|workation|somewhere|anywhere|nice|cool|amazing|beautiful|food|foods|eat|eating|meal|meals|drink|drinks|hotel|hotels|stay|stays|room|rooms|transport|taxi|cab|auto|rickshaw|bike|scooter|metro|ferry|ticket|tickets|safety|safe|scam|scams|cost|costs|price|prices|money|cash|card|atm|sim|wifi|there|here|that|this|those|these|them|its|option|options|thing|things|idea|ideas|day|days|time|times|international|abroad|foreign|domestic|overseas|all|whole|entire|complete|full||across|throughout|everywhere|anywhere|nationwide|countrywide|multi|multiple|several|various|many||north|south|east|west|northern|southern|eastern|western|central|say|says|said|mean|means|meant|share|send|give|tell|show|curated|shadow|not|should|would|could|will|shall|might|must|reach|reaching|arrive|arriving|leave|leaving|any|some|anyone|anything|something|every|each|does|did|has|have|had|was|were|been|being|got|lets|let|when|where|which|who|whom|whose|why|whats|hows|季|plan|plans|list|tips|tip|guide|guides|advice)$/i;
    var toks=(t.match(/[A-Za-z\u00C0-\u024F]{3,}/g)||[]).filter(function(w){ return !STOP.test(w); });
    if(toks.length){ out.dest=toks[0]; out._weakDest=true; }
  }
  var mto=t.match(/(?:back to|return to|bus|volvo|train|flight|cab)[^.]*?\bto\s+([A-Za-z][a-zA-Z]{2,})/i);
  if(mto && mto[1] && mto[1].toLowerCase()!==String(out.dest||'').toLowerCase()) out.to=mto[1];
  if(/rain|weather|forecast|temperature|climate/i.test(t)) out.wants.push('weather');
  if(/caf|coffee|work from|wifi/i.test(t)) out.wants.push('cafes');
  if(/bus|volvo|train|flight|transport|cab|taxi/i.test(t)) out.wants.push('transport');
  if(/plan|itinerar|shift|days?|schedule|trip/i.test(t) || out.days) out.wants.push('plan');
  if(/notify|companion|share|tell (?:my|the)/i.test(t)) out.wants.push('share');
  if(/hotel|stay|hostel|resort|room/i.test(t)) out.wants.push('stay');
  if(out.budget!=null) out.wants.push('budget');
  /* ---- VIBE INFERENCE: read the mood/constraints behind the words ----
     This is what turns "somewhere chill near Delhi, not too pricey, long
     weekend" into structured intent instead of a keyword miss. */
  out.vibe = [];
  var VIBES=[
    [/chill|relax|peace|quiet|slow|unwind|laid.?back|shaant|sukoon/i,'relax'],
    [/adventure|thrill|trek|hike|raft|adrenal|extreme|risky/i,'adventure'],
    [/party|nightlife|club|rave|booze|drink|masti/i,'party'],
    [/romantic|honeymoon|couple|partner|wife|husband|girlfriend|boyfriend|bae/i,'romantic'],
    [/family|kids|parents|children|bachche/i,'family'],
    [/spiritual|temple|meditat|yoga|pilgrim|dham|darshan/i,'spiritual'],
    [/nature|scenic|mountain|forest|waterfall|lake|green/i,'nature'],
    [/foodie|food|eat|cuisine|street.?food|khana/i,'food'],
    [/budget|cheap|afford|sasta|kam.?paisa|tight/i,'budget'],
    [/luxury|premium|5.?star|fancy|lavish|shaandaar/i,'luxury'],
    [/solo|alone|myself|akela/i,'solo'],
    [/work|remote|workation|wifi|digital.?nomad/i,'workation']
  ];
  VIBES.forEach(function(v){ if(v[0].test(t)) out.vibe.push(v[1]); });
  /* proximity: "near Delhi", "close to Mumbai", "around Bangalore" */
  var near=t.match(/(?:near|close to|around|from)\s+([A-Z][a-zA-Z]{2,})/);
  if(near) out.near=near[1];
  /* fuzzy duration words when no number given */
  if(out.days==null){
    if(/long weekend|weekend/i.test(t)) out.days=3;
    else if(/week\b/i.test(t)) out.days=7;
    else if(/fortnight|two weeks/i.test(t)) out.days=14;
  }
  /* season/timing hint */
  var MON=/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.exec(t);
  if(MON) out.month=MON[1];
  if(/summer|garmi/i.test(t)) out.season='summer';
  else if(/winter|sardi|snow/i.test(t)) out.season='winter';
  else if(/monsoon|rain|barish/i.test(t)) out.season='monsoon';
  if(!out.wants.length && out.dest) out.wants.push('plan');
  if(out.vibe.length && out.wants.indexOf('plan')===-1) out.wants.push('plan');
  /* ---- CONVERSATIONAL CONTEXT ----
     "15 days bali trip" then "what about food?" used to lose the destination
     entirely, because each message was parsed in isolation. Inherit the last
     destination/days/budget when this turn doesn't state its own and clearly
     refers back ("there", "it", or simply omits the place). */
  /* which TOPIC is this turn about? drives compact follow-up answers */
  var TOPICS=[[/\b(weather|rain|temperature|forecast|climate|season)\b/i,'weather'],
              [/\b(eat|eating|food|cuisine|dish|restaurant|breakfast|lunch|dinner|drink|cafe|cafes)\b/i,'eat'],
              [/\b(reach|reaching|get in|getting there|flight|flights|train|trains|route|routes)\b/i,'reach'],
              [/\b(get around|local transport|taxi|auto|metro|rickshaw|scooter)\b/i,'around'],
              [/\b(stay|staying|hotel|hotels|hostel|hostels|sleep|accommodation|homestay|room|rooms)\b/i,'stay'],
              [/\b(safe|safety|scam|scams|danger|dangerous|theft|crime)\b/i,'safe'],
              [/\b(cost|costs|price|prices|expensive|cheap|money|budget|budgets)\b/i,'cost']];
  var _tScore={}, _tBest=null, _tBestN=0;
  for(var ti=0; ti<TOPICS.length; ti++){
    var _tm = t.match(new RegExp(TOPICS[ti][0].source,'gi'));
    var _tn = _tm? _tm.length : 0;
    if(_tn){ _tScore[TOPICS[ti][1]]=_tn; if(_tn>_tBestN){ _tBestN=_tn; _tBest=TOPICS[ti][1]; } }
  }
  if(_tBest){ out.topic=_tBest; out.topics=Object.keys(_tScore); }
  /* travel STYLE words: "shoestring" is a style, not a rupee figure */
  if(/shoe\s*string|shoestring|bare\s*bones|barebones|backpack(er|ing)?|cheapest|sasta|low\s*budget|tight\s*budget/i.test(t)) out.style='budget';
  else if(/luxur(y|ious)|lavish|5\s*star|premium|shaandaar/i.test(t)) out.style='luxury';
  if(_cpCtx){
    var refersBack = /\b(there|here|that place|it|same|also|and|what about|how about)\b/i.test(t) || !out.dest;
    if(!out.dest && refersBack && _cpCtx.dest){ out.dest = _cpCtx.dest; out._inherited = true; }
    /* days/budget belong to a TRIP, not to the user forever. Carrying \u20b98,500
       from an Almora chat into a brand-new Switzerland request produced a
       nonsense "won't cover" verdict for a budget the user never stated. Only
       inherit when this turn is about the SAME destination. */
    var sameTrip = out._inherited || (out.dest && _cpCtx.dest && String(out.dest).toLowerCase()===String(_cpCtx.dest).toLowerCase());
    if(sameTrip){
      if(out.days==null && _cpCtx.days) out.days = _cpCtx.days;
      if(out.budget==null && _cpCtx.budget) out.budget = _cpCtx.budget;
    }
  }
  /* ---- MULTI-CITY: "delhi covering delhi, jaipur, mumbai, goa" ---- */
  out.stops = (function(){
    var names = rwScanKnown(t);
    return names.length>=2 ? names : null;
  })();
  /* country/region scope beats any single-city guess */
  /* STATE scope beats country scope: "Kerala, India" is a Kerala request, not
     an India request. */
  var _st = rwDetectState(t);
  if(_st) out._state = _st;
  var _ctry = rwDetectCountry(t);
  if(_ctry){
    /* A country name QUALIFYING a place ("Kerala, India", "Goa India") is not a
       country-scope request. Only treat it as country scope when no specific
       state or known city is named alongside it. This is why "kerala, india"
       was answering with an all-India itinerary. */
    var namedPlace = _st || (rwScanKnown(t).length > 0);
    if(!namedPlace){
      out._country = _ctry;
      if(out.dest && RW_COMMON_WORDS.test(String(out.dest))) out.dest = null;
    }
  }
  if(out.stops){ out.dest = out.stops[out.stops.length-1]; out.multi=true; }
  /* RESCUE: if the text contains exactly one KNOWN place, and our extracted
     dest is not itself known, trust the known one. This is what stops
     "i mean to say share budget ... for almora ..." resolving to Say, Niger. */
  if(!out.multi){
    var knowns = rwScanKnown(t);
    var destKnown = out.dest && rwKnownMap()[String(out.dest).toLowerCase()];
    if(knowns.length===1 && !destKnown) out.dest = knowns[0];
    if(!knowns.length && (!out.dest || !rwKnownMap()[String(out.dest).toLowerCase()])){
      var _ft = String(t).toLowerCase().match(/[a-z]{5,}/g)||[];
      for(var _fi=0; _fi<_ft.length; _fi++){
        var _fh = rwFuzzyPlace(_ft[_fi]);
        if(_fh){ out.dest=_fh; out._fuzzy=_ft[_fi]; break; }
      }
    }
  }
  /* a weak leftover token ("busget" typo) that isn't a known place loses to
     the destination we already know from this conversation */
  if(!out._country && out._weakDest && _cpCtx && _cpCtx.dest && out.dest && !rwKnownMap()[String(out.dest).toLowerCase()]){
    /* never inherit a destination that was itself a parse slip */
    if(!RW_COMMON_WORDS.test(String(_cpCtx.dest))){ out.dest = _cpCtx.dest; out._inherited = true; }
  }
  /* and never REMEMBER a common-word destination for future turns */
  if(out.dest && RW_COMMON_WORDS.test(String(out.dest)) && !rwKnownMap()[String(out.dest).toLowerCase()]) out._weakDest = true;
  var _junk = out.dest && RW_COMMON_WORDS.test(String(out.dest)) && !rwKnownMap()[String(out.dest).toLowerCase()];
  if(out.dest && !_junk) _cpCtx = {dest:out.dest, days:out.days, budget:out.budget};
  else if(out._country) _cpCtx = {dest:null, days:out.days, budget:out.budget, country:out._country};
  /* learn what this user tends to ask for — powers personalisation over time */
  try{ rwLearnIntent(out); }catch(e){}
  return out;
}
/* ---- SELF-IMPROVING INTENT MEMORY ----
   Every parse feeds a local profile: which vibes, budgets and trip lengths this
   user gravitates to. Ailon Tusk reads it back to fill gaps ("plan Goa" from a
   budget-conscious beach-lover implies a cheaper beach itinerary) and to rank
   suggestions. Stored on-device; nothing leaves the phone unless the user opts
   into aggregate sharing. This is the honest "learns from user data". */
function rwLearnIntent(parsed){
  var m={}; try{ m=JSON.parse(lsGet('rw_intent_profile')||'{}'); }catch(e){}
  m.vibes=m.vibes||{}; m.budgets=m.budgets||[]; m.days=m.days||[]; m.topics=m.topics||{}; m.count=(m.count||0)+1;
  if(parsed.topic) m.topics[parsed.topic]=(m.topics[parsed.topic]||0)+1;
  (parsed.vibe||[]).forEach(function(v){ m.vibes[v]=(m.vibes[v]||0)+1; });
  if(parsed.budget) { m.budgets.push(parsed.budget); if(m.budgets.length>20) m.budgets.shift(); }
  if(parsed.days)   { m.days.push(parsed.days);     if(m.days.length>20) m.days.shift(); }
  lsSet('rw_intent_profile', JSON.stringify(m));
}
function rwUserProfile(){
  try{
    var m=JSON.parse(lsGet('rw_intent_profile')||'{}');
    var topVibe=null, max=0;
    Object.keys(m.vibes||{}).forEach(function(v){ if(m.vibes[v]>max){ max=m.vibes[v]; topVibe=v; } });
    var avgBudget = (m.budgets&&m.budgets.length)? Math.round(m.budgets.reduce(function(a,b){return a+b;},0)/m.budgets.length) : null;
    var typicalDays = (m.days&&m.days.length)? Math.round(m.days.reduce(function(a,b){return a+b;},0)/m.days.length) : null;
    return {topVibe:topVibe, avgBudget:avgBudget, typicalDays:typicalDays, count:m.count||0};
  }catch(e){ return {topVibe:null,avgBudget:null,typicalDays:null,count:0}; }
}
/* ---- WORLD PLACE RESOLVER ----
   An embedded gazetteer of every country/city/village would be hundreds of MB —
   impossible in a single-file app. Instead we resolve ANY place live through
   Open-Meteo's geocoder (free, keyless, worldwide, includes villages) and cache
   each hit in localStorage, so the app effectively knows the whole map while
   staying a few hundred KB. Curated DB entries still win for depth. */
/* Famous-destination overrides.
   Open-Meteo ranks by population, so India's tourist towns lose to same-named
   suburbs: "Manali" resolved to a Chennai neighbourhood instead of the Himachal
   hill station, "Bir" to Ukraine. For an India-first travel app those are the
   exact queries that must be right, so the best-known travel meaning wins. */
var RW_PLACE_OVERRIDES = {
  /* Famous Indian TOWNS/destinations that geocoders miss or mis-rank to foreign
     namesakes. Curated = never wrong, no network needed. */
  kanyakumari:{name:'Kanyakumari', admin:'Tamil Nadu', lat:8.0883, lon:77.5385},
  kanniyakumari:{name:'Kanyakumari', admin:'Tamil Nadu', lat:8.0883, lon:77.5385},
  capecomorin:{name:'Kanyakumari', admin:'Tamil Nadu', lat:8.0883, lon:77.5385},
  pondicherry:{name:'Pondicherry', admin:'Puducherry', lat:11.9416, lon:79.8083},
  puducherry:{name:'Pondicherry', admin:'Puducherry', lat:11.9416, lon:79.8083},
  hampi:{name:'Hampi', admin:'Karnataka', lat:15.3350, lon:76.4600},
  khajuraho:{name:'Khajuraho', admin:'Madhya Pradesh', lat:24.8318, lon:79.9199},
  gokarna:{name:'Gokarna', admin:'Karnataka', lat:14.5479, lon:74.3188},
  coorg:{name:'Coorg (Kodagu)', admin:'Karnataka', lat:12.4244, lon:75.7382},
  kodagu:{name:'Coorg (Kodagu)', admin:'Karnataka', lat:12.4244, lon:75.7382},
  ooty:{name:'Ooty', admin:'Tamil Nadu', lat:11.4102, lon:76.6950},
  kodaikanal:{name:'Kodaikanal', admin:'Tamil Nadu', lat:10.2381, lon:77.4892},
  alleppey:{name:'Alleppey (Alappuzha)', admin:'Kerala', lat:9.4981, lon:76.3388},
  alappuzha:{name:'Alleppey (Alappuzha)', admin:'Kerala', lat:9.4981, lon:76.3388},
  wayanad:{name:'Wayanad', admin:'Kerala', lat:11.6854, lon:76.1320},
  spiti:{name:'Spiti Valley', admin:'Himachal Pradesh', lat:32.2464, lon:78.0349},
  tawang:{name:'Tawang', admin:'Arunachal Pradesh', lat:27.5861, lon:91.8594},
  ranthambore:{name:'Ranthambore', admin:'Rajasthan', lat:26.0173, lon:76.5026},
  pushkar:{name:'Pushkar', admin:'Rajasthan', lat:26.4899, lon:74.5511},
  mountabu:{name:'Mount Abu', admin:'Rajasthan', lat:24.5926, lon:72.7156},
  mcleodganj:{name:'McLeod Ganj', admin:'Himachal Pradesh', lat:32.2427, lon:76.3234},
  dharamshala:{name:'Dharamshala', admin:'Himachal Pradesh', lat:32.2190, lon:76.3234},
  auli:{name:'Auli', admin:'Uttarakhand', lat:30.5286, lon:79.5670},
  /* Indian STATES: absent from any city geocoder, which is how "Kerala"
     resolved to Kerälä in Finland. Anchored to their principal city so
     weather, costs and nearby lookups still work if used as a destination. */
  kerala:{name:'Kerala', admin:'Kerala (Kochi)', lat:9.9312, lon:76.2673},
  rajasthan:{name:'Rajasthan', admin:'Rajasthan (Jaipur)', lat:26.9124, lon:75.7873},
  himachal:{name:'Himachal Pradesh', admin:'Himachal (Shimla)', lat:31.1048, lon:77.1734},
  himachalpradesh:{name:'Himachal Pradesh', admin:'Himachal (Shimla)', lat:31.1048, lon:77.1734},
  uttarakhand:{name:'Uttarakhand', admin:'Uttarakhand (Dehradun)', lat:30.3165, lon:78.0322},
  karnataka:{name:'Karnataka', admin:'Karnataka (Bengaluru)', lat:12.9716, lon:77.5946},
  tamilnadu:{name:'Tamil Nadu', admin:'Tamil Nadu (Chennai)', lat:13.0827, lon:80.2707},
  gujarat:{name:'Gujarat', admin:'Gujarat (Ahmedabad)', lat:23.0225, lon:72.5714},
  ladakh:{name:'Ladakh', admin:'Ladakh (Leh)', lat:34.1526, lon:77.5771},
  sikkim:{name:'Sikkim', admin:'Sikkim (Gangtok)', lat:27.3389, lon:88.6065},
  meghalaya:{name:'Meghalaya', admin:'Meghalaya (Shillong)', lat:25.5788, lon:91.8933},
  punjab:{name:'Punjab', admin:'Punjab (Amritsar)', lat:31.6340, lon:74.8723},
  maharashtra:{name:'Maharashtra', admin:'Maharashtra (Mumbai)', lat:19.0760, lon:72.8777},
  westbengal:{name:'West Bengal', admin:'West Bengal (Kolkata)', lat:22.5726, lon:88.3639},
  odisha:{name:'Odisha', admin:'Odisha (Bhubaneswar)', lat:20.2961, lon:85.8245},
  assam:{name:'Assam', admin:'Assam (Guwahati)', lat:26.1445, lon:91.7362},
  telangana:{name:'Telangana', admin:'Telangana (Hyderabad)', lat:17.3850, lon:78.4867},
  andhrapradesh:{name:'Andhra Pradesh', admin:'Andhra Pradesh (Visakhapatnam)', lat:17.6868, lon:83.2185},
  madhyapradesh:{name:'Madhya Pradesh', admin:'Madhya Pradesh (Bhopal)', lat:23.2599, lon:77.4126},
  uttarpradesh:{name:'Uttar Pradesh', admin:'Uttar Pradesh (Lucknow)', lat:26.8467, lon:80.9462},
  bihar:{name:'Bihar', admin:'Bihar (Patna)', lat:25.5941, lon:85.1376},

  /* Major Indian anchors: the global geocoder betrays several of these
     ("Goa" the Indian state isn't a city in its dataset, so exact-match went
     to Goa, Philippines). Curated coordinates are checked FIRST, offline. */
  goa:{name:'Goa', admin:'Goa (Panaji)', lat:15.4909, lon:73.8278},
  delhi:{name:'Delhi', admin:'NCT of Delhi', lat:28.6139, lon:77.2090},
  newdelhi:{name:'New Delhi', admin:'NCT of Delhi', lat:28.6139, lon:77.2090},
  mumbai:{name:'Mumbai', admin:'Maharashtra', lat:19.0760, lon:72.8777},
  jaipur:{name:'Jaipur', admin:'Rajasthan', lat:26.9124, lon:75.7873},
  agra:{name:'Agra', admin:'Uttar Pradesh', lat:27.1767, lon:78.0081},
  kolkata:{name:'Kolkata', admin:'West Bengal', lat:22.5726, lon:88.3639},
  chennai:{name:'Chennai', admin:'Tamil Nadu', lat:13.0827, lon:80.2707},
  bengaluru:{name:'Bengaluru', admin:'Karnataka', lat:12.9716, lon:77.5946},
  bangalore:{name:'Bengaluru', admin:'Karnataka', lat:12.9716, lon:77.5946},
  hyderabad:{name:'Hyderabad', admin:'Telangana', lat:17.3850, lon:78.4867},
  pune:{name:'Pune', admin:'Maharashtra', lat:18.5204, lon:73.8567},
  kochi:{name:'Kochi', admin:'Kerala', lat:9.9312, lon:76.2673},
  amritsar:{name:'Amritsar', admin:'Punjab', lat:31.6340, lon:74.8723},
  jodhpur:{name:'Jodhpur', admin:'Rajasthan', lat:26.2389, lon:73.0243},
  lucknow:{name:'Lucknow', admin:'Uttar Pradesh', lat:26.8467, lon:80.9462},
  ahmedabad:{name:'Ahmedabad', admin:'Gujarat', lat:23.0225, lon:72.5714},
  srinagar:{name:'Srinagar', admin:'Jammu & Kashmir', lat:34.0837, lon:74.7973},
  guwahati:{name:'Guwahati', admin:'Assam', lat:26.1445, lon:91.7362},

  manali:{name:'Manali',admin:'Himachal Pradesh',lat:32.2432,lon:77.1892},
  shimla:{name:'Shimla',admin:'Himachal Pradesh',lat:31.1048,lon:77.1734},
  kasol:{name:'Kasol',admin:'Himachal Pradesh',lat:32.0100,lon:77.3152},
  tosh:{name:'Tosh',admin:'Himachal Pradesh',lat:31.9950,lon:77.3600},
  bir:{name:'Bir',admin:'Himachal Pradesh',lat:32.0419,lon:76.7204},
  kufri:{name:'Kufri',admin:'Himachal Pradesh',lat:31.0980,lon:77.2670},
  dharamshala:{name:'Dharamshala',admin:'Himachal Pradesh',lat:32.2190,lon:76.3234},
  mcleodganj:{name:'McLeod Ganj',admin:'Himachal Pradesh',lat:32.2396,lon:76.3200},
  spiti:{name:'Spiti Valley',admin:'Himachal Pradesh',lat:32.2264,lon:78.0716},
  kaza:{name:'Kaza',admin:'Himachal Pradesh',lat:32.2264,lon:78.0716},
  leh:{name:'Leh',admin:'Ladakh',lat:34.1526,lon:77.5771},
  rishikesh:{name:'Rishikesh',admin:'Uttarakhand',lat:30.0869,lon:78.2676},
  haridwar:{name:'Haridwar',admin:'Uttarakhand',lat:29.9457,lon:78.1642},
  nainital:{name:'Nainital',admin:'Uttarakhand',lat:29.3803,lon:79.4636},
  mussoorie:{name:'Mussoorie',admin:'Uttarakhand',lat:30.4598,lon:78.0644},
  almora:{name:'Almora',admin:'Uttarakhand',lat:29.5971,lon:79.6591},
  munsiyari:{name:'Munsiyari',admin:'Uttarakhand',lat:30.0672,lon:80.2386},
  auli:{name:'Auli',admin:'Uttarakhand',lat:30.5290,lon:79.5660},
  jaisalmer:{name:'Jaisalmer',admin:'Rajasthan',lat:26.9157,lon:70.9083},
  udaipur:{name:'Udaipur',admin:'Rajasthan',lat:24.5854,lon:73.7125},
  pushkar:{name:'Pushkar',admin:'Rajasthan',lat:26.4899,lon:74.5511},
  mountabu:{name:'Mount Abu',admin:'Rajasthan',lat:24.5926,lon:72.7156},
  gokarna:{name:'Gokarna',admin:'Karnataka',lat:14.5479,lon:74.3188},
  hampi:{name:'Hampi',admin:'Karnataka',lat:15.3350,lon:76.4600},
  coorg:{name:'Coorg (Madikeri)',admin:'Karnataka',lat:12.4244,lon:75.7382},
  munnar:{name:'Munnar',admin:'Kerala',lat:10.0889,lon:77.0595},
  alleppey:{name:'Alleppey',admin:'Kerala',lat:9.4981,lon:76.3388},
  wayanad:{name:'Wayanad',admin:'Kerala',lat:11.6854,lon:76.1320},
  ooty:{name:'Ooty',admin:'Tamil Nadu',lat:11.4064,lon:76.6932},
  kodaikanal:{name:'Kodaikanal',admin:'Tamil Nadu',lat:10.2381,lon:77.4892},
  pondicherry:{name:'Pondicherry',admin:'Puducherry',lat:11.9416,lon:79.8083},
  darjeeling:{name:'Darjeeling',admin:'West Bengal',lat:27.0360,lon:88.2627},
  gangtok:{name:'Gangtok',admin:'Sikkim',lat:27.3389,lon:88.6065},
  tawang:{name:'Tawang',admin:'Arunachal Pradesh',lat:27.5860,lon:91.8590},
  ziro:{name:'Ziro',admin:'Arunachal Pradesh',lat:27.5448,lon:93.8340},
  shillong:{name:'Shillong',admin:'Meghalaya',lat:25.5788,lon:91.8933},
  cherrapunji:{name:'Cherrapunji',admin:'Meghalaya',lat:25.3000,lon:91.7000},
  varanasi:{name:'Varanasi',admin:'Uttar Pradesh',lat:25.3176,lon:82.9739},
  khajuraho:{name:'Khajuraho',admin:'Madhya Pradesh',lat:24.8318,lon:79.9199},
  portblair:{name:'Port Blair',admin:'Andaman & Nicobar',lat:11.6234,lon:92.7265}
};
var RW_PLACE_CACHE={};
async function rwResolvePlace(name){
  if(!name) return null;
  var key='rw_geo_'+String(name).toLowerCase().replace(/[^a-z0-9]/g,'');
  if(RW_PLACE_CACHE[key]) return RW_PLACE_CACHE[key];
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c){ RW_PLACE_CACHE[key]=c; return c; } }catch(e){}
  /* curated meaning first — no network needed, and never wrong */
  var ovKey = String(name).toLowerCase().replace(/[^a-z]/g,'');
  if(RW_PLACE_OVERRIDES[ovKey]){
    var o = RW_PLACE_OVERRIDES[ovKey];
    var place = {name:o.name, country:'India', cc:'IN', admin:o.admin, lat:o.lat, lon:o.lon,
                 pop:null, elev:null, tz:'Asia/Kolkata'};
    RW_PLACE_CACHE[key]=place; lsSet(key, JSON.stringify(place));
    return place;
  }
  if(!navigator.onLine) return null;
  try{
    var fix = (typeof CITY_NAME_FIXUPS!=='undefined') ? CITY_NAME_FIXUPS[String(name).toLowerCase().replace(/[^a-z]/g,'')] : null;
    var q = fix || name;
    var g = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&name='+encodeURIComponent(q)).then(function(r){return r.json();});
    var list = g.results||[]; if(!list.length) return null;
    /* Rank properly: the geocoder happily returns fuzzy foreign matches first
       ("Kufri" -> a village in Türkiye). Exact name match wins, then bigger
       population — that keeps real destinations ahead of coincidences. */
    var qn = String(q).toLowerCase().trim();
    /* Ranking, in order: exact name match, then home country, then population.
       The home-country tiebreak matters because the dataset carries namesakes
       with NO population data ("Kufri" exists in Pakistan and in Himachal) —
       and for an India-first travel app the Indian one is the right default. */
    var HOME = (typeof RW_HOME_CC!=='undefined' && RW_HOME_CC) ? RW_HOME_CC : 'IN';
    list.sort(function(a,b){
      var ax = (String(a.name).toLowerCase()===qn)?0:1, bx = (String(b.name).toLowerCase()===qn)?0:1;
      if(ax!==bx) return ax-bx;
      var ah = (a.country_code===HOME)?0:1, bh = (b.country_code===HOME)?0:1;
      if(ah!==bh) return ah-bh;
      return (b.population||0)-(a.population||0);
    });
    var h = list[0];
    var place = {name:h.name, country:h.country||'', cc:h.country_code||'', admin:h.admin1||'',
                 lat:h.latitude, lon:h.longitude, pop:h.population||null, elev:h.elevation||null, tz:h.timezone||''};
    /* Confidence + alternatives: "hey" exact-matches a tiny English village and
       used to be answered with full confidence. If the winner is a small place
       outside the home country while other countries hold same-name candidates,
       we ASK instead of guessing — a wrong confident answer is what gets an
       assistant gamed and mocked. */
    var alts = list.slice(0,4).filter(function(x){ return x!==h; }).map(function(x){
      return {name:x.name, country:x.country||'', cc:x.country_code||'', admin:x.admin1||'',
              lat:x.latitude, lon:x.longitude, pop:x.population||null, tz:x.timezone||''};
    });
    place.lowConf = !!( (place.cc!==HOME) && (place.pop==null || place.pop<15000) && alts.length );
    if(place.lowConf) place.alts = alts;
    RW_PLACE_CACHE[key]=place; if(!place.lowConf) lsSet(key, JSON.stringify(place));
    return place;
  }catch(e){ return null; }
}
function copilotSend(fromHero){
  var inp = el(fromHero? 'heroInput' : 'cpInput');
  var t=(inp && inp.value||'').trim(); if(!t) return;
  /* Primary CTA of the app — asking Tusk to plan/answer something. */
  try{ rwPlayCue('hero_cta_or_big_action'); }catch(e){}
  inp.value='';
  if(fromHero){
    /* Conversation flows vertically right on the page — no popup. */
    _cpTargetLog='heroLog';
    var hl=el('heroLog'); if(hl) hl.style.display='block';
  } else { _cpTargetLog='cpLog'; }
  cpBubble(t.replace(/[<>]/g,''),'me');
  /* Ask rather than guess: a too-thin query gets tappable options, not a
     confident wrong answer. This is the anti-hallucination guard. */
  try{
    var _clar = rwTuskNeedsClarity(t);
    if(_clar){ cpBubble(_clar,'bot'); return; }
    var _sa = rwStartAnywhere(t);
    if(_sa){ t = _sa; }   /* pasted link/text -> extract the trip from it */
  }catch(e){}
  /* App navigation intents: "open settings", "go to store", "show my trips"… */
  var NAV=[[/settings|api key/i,'Settings',function(){openSettings();}],
    [/store|merch/i,'the Store',function(){tabGo('home');var st=el('store');if(st){var fh=st.querySelector('.fold-head');if(fh&&!fh.classList.contains('open'))fh.click();st.scrollIntoView({behavior:'smooth'});}}],
    [/music/i,'your Music',function(){openMusic();}],
    [/profile|account/i,'your Profile',function(){openProfile();}],
    [/my trips|vault|offline trip/i,'My Trips',function(){openVault();}],
    [/saved/i,'Saved items',function(){showSaved();}],
    [/\bpro\b|upgrade|subscri/i,'Pro plans',function(){openPay();}],
    [/wizard|free (ai )?key/i,'the AI key wizard',function(){openWizard();}],
    [/trek/i,'Trek Vault',function(){tabGo('explore');scrollToId('treks');}],
    [/explore/i,'Explore',function(){tabGo('explore');}]];
  if(/\b(open|go to|goto|take me|show( me)?|launch)\b/i.test(t)){
    for(var ni=0;ni<NAV.length;ni++){
      if(NAV[ni][0].test(t)){
        cpBubble('\ud83d\udc49 Opening '+NAV[ni][1]+'\u2026','bot');
        try{ NAV[ni][2](); }catch(e){}
        try{ track('copilot_uses'); }catch(e){}
        return;
      }
    }
  }
  var thinking=cpBubble('\u2026','bot');
  var intents;
  try{ intents = cpParseRegex(t); }
  catch(_e){
    /* Parser hiccup must never freeze the chat — degrade to a bare intent. */
    intents = { _raw:t };
    cpFinish(thinking, 'Arre boss, thoda confuse ho gaya \u2014 ek baar phir se, seedhe shabdon mein bolo? \ud83d\ude05', intents, t);
    return;
  }
  var hasKey = (typeof activeProv!=='undefined') && activeProv!=='smart' && lsGet('rwKey_'+activeProv);
  if(hasKey){
    /* Real conversation: persona + history + the new message. Any topic is
       fine — the model answers naturally; travel intents ADDITIONALLY get
       action links appended below the answer. */
    var hist=_cpHist.slice(-6).map(function(h){ return 'User: '+h.q+'\nCopilot: '+h.a; }).join('\n');
    /* Ground the model in the real guide before it answers — this is what stops
       confident-but-wrong replies about small towns. */
    (intents.dest ? wvGuide(intents.dest) : Promise.resolve(null)).then(function(g){
      var facts = g && g.extract ? 'Verified guide text for '+g.title+': '+g.extract.slice(0,600)+'\n' : '';
      try{
        if(typeof RW_PLACE_FACTS!=='undefined'){
          var _pfq=(intents.dest||t||'').toLowerCase(); var _pf=null;
          for(var _pk in RW_PLACE_FACTS){ if(_pfq.indexOf(_pk)>=0){ _pf=RW_PLACE_FACTS[_pk]; break; } }
          if(_pf) facts = 'AUTHORITATIVE curated facts (trust these over everything else): '+_pf+'\n' + facts;
        }
      }catch(e){}
      /* Explicit state beats hoping the model infers it from the transcript. */
      var recent = rwRecall(6).map(function(t){ return (t.role==='user'?'User: ':'Assistant: ')+t.text; }).join('\n');
      if(recent) facts += 'Recent conversation:\n'+recent+'\n';
      if(_cpCtx && _cpCtx.dest){
        facts += 'Current trip context \u2014 destination: '+_cpCtx.dest
          + (_cpCtx.days? ', days: '+_cpCtx.days : '')
          + (_cpCtx.budget? ', budget: \u20b9'+_cpCtx.budget : '')
          + '. If the user does not name a new place, they mean this one.\n';
      }
      var prompt='You are Ailon Tusk \u2014 a witty, warm, razor-sharp travel companion with playful Bollywood-masala energy and light Hinglish sprinkles (arre, chalo, mast, boss, scene, ekdum). You are the friend who has actually BEEN everywhere and gives it to people straight, with a grin. '
        +'MATCH YOUR LENGTH TO THE QUESTION: a quick factual question (a price, a distance, is-X-open) gets ONE punchy sentence \u2014 do not pad it. Only a genuinely open request (plan my trip, what should I do in X) earns a fuller answer, still under 90 words. '
        +'Personality is seasoning, not the meal: one small filmi flourish max, then the real facts \u2014 numbers, routes, prices, names \u2014 100% accurate and clear. '
        +'BE GENUINELY USEFUL: when you suggest a place, add the ONE detail a local would know (best time to go, what to skip, the sneaky cost, the better nearby alternative). That insider nugget is your signature. '
        +'GROUP TRIPS: if the question involves \u201cwe\u201d, friends, or a group, think like a facilitator \u2014 surface the trade-off clearly (budget vs comfort, beach vs hills, party vs quiet) and suggest a fair middle path or a quick way to decide. '
        +'CONFLICT/INDECISION: if people want different things, name the split, give each option its honest best case in one line, then recommend one with a reason \u2014 decisiveness with warmth beats fence-sitting. '
        +'NEVER INVENT: no made-up prices, timings, phone numbers, hotel names or distances. If you do not know or the guide text does not say, say \u201cI\u2019m not certain \u2014 worth checking before you book\u201d and give the safest general guidance instead. A wrong specific is far worse than an honest gap. If the question is ambiguous, ASK ONE short clarifying question with 2-3 concrete options rather than guessing — when you do this, make your ENTIRE reply just one line in this exact shape: ASK: <the question> || <option 1> | <option 2> | <option 3> (no extra words before or after). Never invent facts to sound dramatic; if you are unsure, say so plainly with a grin. Do NOT quote real Bollywood dialogues or put words in real actors\u2019 mouths \u2014 use your own filmi-flavoured lines. '
        +'Read the user intent and mood: if they sound excited, match it; if stressed or on a tight budget, be reassuring and practical, not theatrical. '
        +'INDIAN GROUND TRUTH \u2014 THIS MATTERS MORE THAN SOUNDING CONFIDENT: never estimate travel time from straight-line distance. In the Himalayas assume ~22km/h (100km can be 5 hours), hill/ghat roads ~32km/h, plains highways ~48km/h, and city traffic ~18km/h. Dehradun to Rishikesh is about an hour, not 30 minutes. Never suggest a day trip that needs more than ~6 hours of road time. Flag monsoon (Jun-Sep) road risk in hills, winter closures on high passes, and altitude acclimatisation for anywhere above 3000m. '
        +'MONEY: the user\u2019s selected currency is '+((CURR.find(function(x){return x.c===AC;})||{s:'\u20b9',c:'INR'}).s)+' ('+AC+'). Always give prices in that symbol, never $ unless AC is literally USD. '
        +'Prefer the verified guide text below over your own recollection; if it contradicts you, trust it. No markdown headers, no bullet spam.\n'
        +facts+(hist? 'Conversation so far:\n'+hist+'\n':'')+'User: '+t+'\nCopilot:';
      aiCallAny(prompt, 260, function(err, txt){
        var answer = (txt||'').trim();
        if(!answer){
          var kb2 = cpSmartAnswer(t) || '';
          var note = '<span style="font-size:11px;color:var(--t3)">\u26a1 AI engines unreachable right now'
            +(err? ' ('+esc2(String(err).slice(0,60))+')':'')
            +' \u2014 answered by Ailon Tusk\u2019s own engine.</span>';
          if(intents.dest) rwLearn(intents.dest);
          cpFinish(thinking, (kb2? kb2+'<br>':'')+note, intents, t);
          return;
        }
        /* AI wants a clarifying question with tappable options \u2014 render real
           chips via rwTuskAsk instead of dumping "ASK: ... || a | b" as text. */
        var askM = answer.match(/^ASK:\s*(.+?)\s*\|\|\s*(.+)$/i);
        if(askM){
          /* rwTuskAsk() does its own full HTML/attribute escaping of the raw
             question + option text below — don't pre-escape here (that
             would double-escape) and don't skip it (that's the XSS bug). */
          var askQ = askM[1].trim();
          var askOpts = askM[2].split('|').map(function(o){ return o.trim(); }).filter(Boolean).slice(0,4);
          if(askQ && askOpts.length>=2){
            if(intents.dest) rwLearn(intents.dest);
            cpFinish(thinking, rwTuskAsk(askQ, askOpts), intents, t);
            return;
          }
        }
        answer = escHtml(answer);
        if(lastAiSource && lastAiSource.prov!==activeProv){
          answer += '<br><span style="font-size:10.5px;color:var(--t3)">\u21aa answered by <b>'+esc2(lastAiSource.prov)+'</b> \u2014 '+esc2(activeProv)+' was unavailable</span>';
        }
        if(intents.dest) rwLearn(intents.dest);
        cpFinish(thinking, answer, intents, t);
      });
    });
  } else {
    /* Ailon Tusk: curated DB first (fastest, richest), then the live travel
       guide for anywhere on Earth, and only then admit it needs a key. This is
       what turned "generic answers" into real ones. */
    if(intents.smalltalk){ cpFinish(thinking, tkSmalltalk(intents.smalltalk), intents, t); return; }
    var kb = cpSmartAnswer(t);
    var place = intents.dest;
    /* Tusk recognised a place-shaped query but the curated engine has nothing
       for it — log it anonymously so the (previously unfed) daily learning
       pipeline in tusk-daily.yml has real place names to resolve. */
    if(place && !kb){ try{ rwTuskMiss(place); }catch(e){} }
    /* Carry the topic over — but only ONCE per destination (was the nagging repetition). */
    if(place && !new RegExp(place.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(t) && window._tkCarryShown!==place){
      kb = (kb? kb+'<br>' : '') + '<span style="font-size:11px;color:var(--t3)">\u21b3 still on <b>'+esc2(place)+'</b></span>';
      window._tkCarryShown = place;
    }
    if(place && new RegExp(place.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(t)) window._tkCarryShown=place;
    if(place){
      /* the card built in cpActionsHTML now carries the guide content; if we
         also have a text summary, give it a dash of masala */
      cpFinish(thinking, kb? rwMasalaWrap(kb) : '', intents, t);
    } else if(kb){
      cpFinish(thinking, rwMasalaWrap(kb), intents, t);
    } else {
      /* Nothing curated and no place named — quietly search the free open
         web (Wikipedia + DuckDuckGo, keyless, CORS-open) and present a card. */
      var _keyPrompt = 'I cover destinations, weather, budgets, transport and sharing. For open-ended conversation, add a free AI key \u2014 takes 2 minutes: <button class="tact" style="font-size:11px;padding:4px 10px" onclick="openWizard()">Get a free key</button>';
      /* MUST NOT throw: file:// cross-origin fetch can reject in the APK; an
         uncaught reject would freeze the "…" bubble = "chat broken in app". */
      Promise.resolve().then(function(){ return rwMiniSearch(t); }).then(function(res){
        cpFinish(thinking, res ? rwWebAnswerHTML(t, res) : _keyPrompt, intents, t);
      }).catch(function(){ cpFinish(thinking, _keyPrompt, intents, t); });
    }
  }
}
