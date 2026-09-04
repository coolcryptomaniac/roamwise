// @ts-nocheck
/* ============================================================================
   AILON TUSK AGENT — a real ReAct tool-calling loop (rw-v52)
   ============================================================================
   Until now Tusk could only TALK about RoamWise's features. This makes it
   OPERATE them: the model is given a JSON tool schema of real app functions,
   picks one, we execute it against live app state, feed the result back, and
   loop until the objective is met or we hit the step ceiling.

   Design notes (the parts that actually matter in an agent):
     - BOUNDED: hard max-step ceiling, so a confused model can't spin forever.
     - OBSERVABLE: every thought/action/observation is recorded in a trace the
       user (and you, in a demo) can actually read.
     - RECOVERABLE: a tool that throws returns {ok:false,error} INTO the model's
       context rather than crashing, so it can self-correct and try another path.
     - HONEST: tools only expose things the app can genuinely do. No tool
       pretends to book, pay, or fetch data we don't have.
   ========================================================================== */

var RW_AGENT_TOOLS = [
  { type:'function', function:{ name:'search_stays',
    description:'Find bookable rooms with real prices in a city. Use whenever the traveller asks where to stay, what it costs, or wants to book.',
    parameters:{ type:'object', properties:{ zone:{type:'string', description:'City, e.g. "Manali"'}, maxPrice:{type:'number'} }, required:['zone'] } } },
  { type:'function', function:{ name:'find_partners',
    description:'Find verified RoamWise partner stays and adventure operators in a place, ranked by how much we can vouch for them.',
    parameters:{ type:'object', properties:{ zone:{type:'string'}, cat:{type:'string', enum:['stay','adventure']} }, required:['zone'] } } },
  { type:'function', function:{ name:'open_booking',
    description:'Open the booking screen for a specific room so the traveller can book it. Use after search_stays when they choose one.',
    parameters:{ type:'object', properties:{ roomId:{type:'string'} }, required:['roomId'] } } },
  { type:'function', function:{ name:'my_bookings',
    description:'Look up the travellers own bookings and their status.',
    parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'share_to_whatsapp',
    description:'Share a booking, itinerary, split-up or any text to WhatsApp. Use whenever the traveller wants to send something to friends or to a property.',
    parameters:{ type:'object', properties:{ text:{type:'string'}, kind:{type:'string', enum:['booking','plan','money','other']} }, required:['text'] } } },
  { type:'function', function:{ name:'travel_compatibility',
    description:'Explain or run the travel compatibility engine, which matches people on the six behaviours groups argue about rather than on age.',
    parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'open_feature',
    description:'Open any RoamWise screen by name. Use when the traveller asks for something the app already does.',
    parameters:{ type:'object', properties:{ feature:{type:'string', enum:['stays','partners','experiences','green','booking','sos','events','compat','listing','money','nearme','beacon','arrival'] } }, required:['feature'] } } },
  { type:'function', function:{ name:'emergency_help',
    description:'Bring up the stranded-traveller page. Use immediately if someone says they are stuck, unsafe, missed the last bus, or in trouble.',
    parameters:{ type:'object', properties:{} } } },

  { type:'function', function:{ name:'set_destination',
    description:'Set the active trip destination in the app.',
    parameters:{ type:'object', properties:{ place:{type:'string', description:'City or region, e.g. "Rishikesh"'} }, required:['place'] } } },
  { type:'function', function:{ name:'estimate_travel_time',
    description:'Honest India road travel time for a distance, accounting for terrain (Himalayan roads are ~3x slower than plains). Use before claiming any journey duration.',
    parameters:{ type:'object', properties:{ km:{type:'number'}, place:{type:'string'} }, required:['km','place'] } } },
  { type:'function', function:{ name:'check_cycle_safety',
    description:'Check whether Cycle Mode is safe at a place in a given month (blocks Himalayan terrain, peak monsoon, desert summer).',
    parameters:{ type:'object', properties:{ place:{type:'string'}, month:{type:'number', description:'1-12'} }, required:['place'] } } },
  { type:'function', function:{ name:'calculate_budget',
    description:'Split a trip budget into stay/food/transport/activities for a number of days and style.',
    parameters:{ type:'object', properties:{ total:{type:'number'}, days:{type:'number'}, style:{type:'string', enum:['backpacker','mid','comfort']} }, required:['total','days'] } } },
  { type:'function', function:{ name:'settle_group_money',
    description:'Run the settle engine over the current trip group and return who owes whom.',
    parameters:{ type:'object', properties:{}, } } },
  { type:'function', function:{ name:'find_nearby',
    description:'Find food, sights and things to do near a place.',
    parameters:{ type:'object', properties:{ place:{type:'string'} }, required:['place'] } } },
  { type:'function', function:{ name:'show_map',
    description:'Open the day-by-day trip map for a destination.',
    parameters:{ type:'object', properties:{ place:{type:'string'} }, required:['place'] } } },
  { type:'function', function:{ name:'parse_ticket',
    description:'Extract PNR, train, stations, date and status from a pasted booking SMS.',
    parameters:{ type:'object', properties:{ text:{type:'string'} }, required:['text'] } } },
  { type:'function', function:{ name:'finish',
    description:'Call when the objective is complete. Provide the final answer for the user.',
    parameters:{ type:'object', properties:{ answer:{type:'string'} }, required:['answer'] } } }
];

/* --- the tool belt: real functions, each returns a plain JSON-able result --- */
var RW_AGENT_IMPL = {
  set_destination: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    try{ var d=el('destInput'); if(d) d.value=a.place; }catch(e){}
    window._agentDest=a.place;
    return {ok:true, destination:a.place, terrain:rwTerrainOf(a.place), ground_truth:rwGroundTruth(a.place)||'normal roads'};
  },
  estimate_travel_time: function(a){
    if(typeof a.km!=='number' || a.km<=0) return {ok:false, error:'km must be a positive number'};
    var r=rwRoadTime(a.km, a.place||'');
    return {ok:true, km:a.km, duration:r.label, terrain:r.terrain, caution:r.note};
  },
  check_cycle_safety: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    var m=(typeof a.month==='number')? a.month-1 : undefined;
    var c=rwCycleSafety(a.place, m);
    return {ok:true, safe:c.ok, terrain:c.terrain,
      warnings:c.warnings.map(function(w){ return (w.lvl==='stop'?'BLOCK: ':'WARN: ')+w.t+' \u2014 '+w.d; })};
  },
  calculate_budget: function(a){
    var total=+a.total, days=+a.days;
    if(!total||!days) return {ok:false, error:'total and days are required'};
    var style=a.style||'mid';
    var w={backpacker:{stay:.30,food:.25,transport:.30,acts:.15},
           mid:{stay:.38,food:.25,transport:.22,acts:.15},
           comfort:{stay:.45,food:.24,transport:.18,acts:.13}}[style]||{stay:.38,food:.25,transport:.22,acts:.15};
    var r=function(x){ return Math.round(total*x); };
    return {ok:true, currency:'INR', per_day:Math.round(total/days), style:style,
      breakdown:{stay:r(w.stay), food:r(w.food), transport:r(w.transport), activities:r(w.acts)}};
  },
  settle_group_money: function(){
    try{
      var k=(typeof chatKittyState==='function')? chatKittyState() : null;
      if(!k) return {ok:false, error:'no active trip group \u2014 the user needs to open a trip chat first'};
      if(!k.tx.length) return {ok:true, settled:true, message:'All square \u2014 nobody owes anybody.', total:k.total};
      return {ok:true, settled:false, total:k.total, per_head:k.perHead,
        transfers:k.tx.map(function(t){ return {from:(k.names[t.from]||'someone'), to:(k.names[t.to]||'someone'), amount:t.amount}; })};
    }catch(e){ return {ok:false, error:'could not read the group kitty'}; }
  },
  find_nearby: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    try{ openNearMe(); setTimeout(function(){ var i=el('nearManualInp'); if(i){ i.value=a.place; rwNearMeManualGo(); } }, 300); }catch(e){}
    return {ok:true, opened:'near_me', searching:a.place, note:'Results are rendering in the app for the user to see.'};
  },
  show_map: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    try{ openTripMap(a.place, null); }catch(e){ return {ok:false, error:'map failed to open'}; }
    return {ok:true, opened:'trip_map', place:a.place};
  },
  parse_ticket: function(a){
    var r=rwParsePNR(a.text||'');
    if(!r.found) return {ok:false, error:'no ticket details found in that text'};
    return {ok:true, ticket:r};
  },
  finish: function(a){ return {ok:true, done:true, answer:a.answer||''}; }
};

/* --- the loop --- */
var RW_AGENT_MAX_STEPS = 6;
function rwAgentRun(objective, onTrace, onDone){
  var trace=[], msgs=[
    {role:'system', content:
      'You are Ailon Tusk, an autonomous travel agent operating the RoamWise app. '
      +'Work in steps: pick ONE tool at a time, read its result, then decide the next step. '
      +'CRITICAL: never state a travel duration without calling estimate_travel_time first \u2014 '
      +'Indian mountain roads are far slower than distance suggests. '
      +'If a tool returns ok:false, read the error and try a different approach rather than repeating it. '
      +'YOU CAN RUN THE WHOLE PRODUCT, not just answer questions. Where to stay \u2192 search_stays and quote real prices. '
      +'They pick one \u2192 open_booking. Local operators \u2192 find_partners, and be honest about which are verified '
      +'versus merely researched. Anything they want to send to friends or a property \u2192 share_to_whatsapp. '
      +'Who they travel well with \u2192 travel_compatibility. Any screen they ask for \u2192 open_feature rather than '
      +'describing it. '
      +'IF SOMEONE SAYS THEY ARE STUCK, UNSAFE, OR HAVE MISSED THE LAST TRANSPORT: call emergency_help FIRST, talk after. '
      +'NEVER invent a price, a room, a partner or an availability. If a tool returns nothing, say so plainly \u2014 '
      +'being useless is recoverable, being wrong about a booking is not. '
      +'When the objective is met, call finish with a short, warm answer for the traveller.'},
    {role:'user', content:objective}
  ];
  var step=0;
  function record(kind, data){ trace.push({step:step, kind:kind, data:data}); if(onTrace) onTrace(trace); }
  record('objective', objective);

  function tick(){
    if(step>=RW_AGENT_MAX_STEPS){
      record('halt','step ceiling reached');
      if(onDone) onDone({ok:false, reason:'max_steps', trace:trace});
      return;
    }
    step++;
    rwAgentCall(msgs, function(err, reply){
      if(err || !reply){ record('error', err||'no reply'); if(onDone) onDone({ok:false, reason:'llm_error', trace:trace}); return; }
      var calls=reply.tool_calls||[];
      if(!calls.length){
        record('answer', reply.content||'');
        if(onDone) onDone({ok:true, answer:reply.content||'', trace:trace});
        return;
      }
      msgs.push({role:'assistant', content:reply.content||null, tool_calls:calls});
      var finished=null;
      calls.forEach(function(c){
        var name=(c.function&&c.function.name)||'', args={};
        try{ args=JSON.parse((c.function&&c.function.arguments)||'{}'); }catch(e){}
        record('action', {tool:name, args:args});
        var impl=RW_AGENT_IMPL[name];
        var out = impl ? (function(){ try{ return impl(args); }catch(e){ return {ok:false, error:String(e&&e.message||e)}; } })()
                       : {ok:false, error:'unknown tool "'+name+'"'};
        record('observation', out);
        if(name==='finish' && out.ok) finished=out.answer;
        msgs.push({role:'tool', tool_call_id:c.id, name:name, content:JSON.stringify(out)});
      });
      if(finished!=null){ if(onDone) onDone({ok:true, answer:finished, trace:trace}); return; }
      tick();
    });
  }
  tick();
}

/* ---- platform tools (rw-v94): Tusk can now run the whole product ---- */
RW_AGENT_IMPL.search_stays = function(a){
  var list=(window.RW_ROOMS||[]).filter(function(r){
    return (!a.zone || String(r.zone).toLowerCase()===String(a.zone).toLowerCase())
        && (!a.maxPrice || r.price<=a.maxPrice); });
  if(!list.length) return { ok:true, found:0, note:'No listed rooms there yet. Offer to plan the trip anyway.' };
  return { ok:true, found:list.length, rooms:list.slice(0,6).map(function(r){
    return { id:r.id, property:r.property, room:r.room, price:r.price,
             sleeps:r.maxGuests, includes:(r.inc||[]).join(', '), cancel:r.cancel }; }) };
};
RW_AGENT_IMPL.find_partners = function(a){
  var list=(typeof rwPartnersFor==='function') ? rwPartnersFor(a.zone, a.cat) : [];
  if(!list.length) return { ok:true, found:0, note:'No verified partners there yet \u2014 say so honestly.' };
  return { ok:true, found:list.length, partners:list.slice(0,6).map(function(p){
    return { name:p.name, area:p.area, rating:p.rating, reviews:p.reviews,
             status:p.verified, why:p._why, hook:p.hook }; }) };
};
RW_AGENT_IMPL.open_booking = function(a){
  try{ if(typeof openRoomBook==='function'){ openRoomBook(a.roomId); return { ok:true, opened:a.roomId }; } }catch(e){}
  return { ok:false, error:'Could not open that room' };
};
RW_AGENT_IMPL.my_bookings = function(){
  try{
    var last=JSON.parse(lsGet('rw_last_booking')||'null');
    if(!last) return { ok:true, count:0, note:'No bookings on this device yet.' };
    return { ok:true, count:1, booking:{ ref:last.ref, property:last.property, room:last.room,
      checkIn:last.checkIn, checkOut:last.checkOut, amount:last.amount, status:last.status } };
  }catch(e){ return { ok:true, count:0 }; }
};
RW_AGENT_IMPL.share_to_whatsapp = function(a){
  var t=String(a.text||''); if(!t) return { ok:false, error:'nothing to share' };
  try{ rwWhatsShare(t); return { ok:true, shared:true, kind:a.kind||'other' }; }
  catch(e){ return { ok:false, error:'could not open WhatsApp' }; }
};
RW_AGENT_IMPL.travel_compatibility = function(){
  var mine=(typeof rwCompatMine==='function')? rwCompatMine():{};
  var done=Object.keys(mine).length>0;
  try{ if(typeof openCompat==='function') openCompat(); }catch(e){}
  return { ok:true, profileSet:done,
    axes:(window.RW_AXES||[]).map(function(x){ return x.label; }),
    note: done ? 'Their profile is set; explain who they match with and why.'
               : 'They have not set a travel style yet \u2014 the six-slider quiz is now open.' };
};
RW_AGENT_IMPL.open_feature = function(a){
  var map={ stays:'openStays', partners:'openPartners', experiences:'openExperiences',
    green:'openGreen', booking:'openBooking', sos:'openSOS', events:'openEvents',
    compat:'openCompat', listing:'openListing', money:'openMoneyLayer',
    nearme:'openNearMe', beacon:'openBeacon', arrival:'openArrival' };
  var fn=map[a.feature];
  try{ if(fn && typeof window[fn]==='function'){ window[fn](); return { ok:true, opened:a.feature }; } }catch(e){}
  return { ok:false, error:'no such screen' };
};
RW_AGENT_IMPL.emergency_help = function(){
  try{ if(typeof openSOS==='function'){ openSOS(); return { ok:true, opened:true,
    note:'The offline help page is open. Emergency numbers are 112, 108, and 1363 for tourists.' }; } }catch(e){}
  return { ok:true, note:'Emergency numbers in India: 112 all emergencies, 108 ambulance, 1363 tourist helpline.' };
};

/* one place for every WhatsApp share in the app */
function rwWhatsShare(text){
  var t=String(text||'');
  try{
    if(navigator.share){ navigator.share({ text:t }); return true; }
  }catch(e){}
  window.open('https://wa.me/?text='+encodeURIComponent(t), '_blank', 'noopener');
  return true;
}
/* format a booking the way a property owner or a friend wants to read it */
function rwBookingText(b){
  if(!b) return '';
  return '*RoamWise booking* \u2014 '+b.ref+'\n\n'
    +'\ud83c\udfe1 '+b.property+'\n\ud83d\udecf\ufe0f '+b.room+'\n'
    +'\ud83d\udcc5 '+b.checkIn+' \u2192 '+b.checkOut+' ('+b.nights+' night'+(b.nights>1?'s':'')+')\n'
    +'\ud83d\udc65 '+b.guests+' guest'+(b.guests>1?'s':'')+'\n'
    +'\ud83d\udcb0 \u20b9'+Number(b.amount||0).toLocaleString('en-IN')+' \u2014 '
    +(b.payMode==='upi'?'paid by UPI':'paying at the property')+'\n\n'
    +'Planned with RoamWise \u00b7 roamwise.co.in';
}

/* Tool-calling request. Only OpenAI-compatible providers support this, so we
   pick one that does and fall back to plain chat if none is configured. */
function rwAgentCall(messages, cb){
  var provs=['groq','cerebras','openrouter','mistral'];
  var prov=provs.filter(function(p){ return lsGet('rwKey_'+p); })[0];
  if(!prov){ cb('no tool-calling provider configured'); return; }
  var bases={groq:'https://api.groq.com/openai/v1', cerebras:'https://api.cerebras.ai/v1',
             openrouter:'https://openrouter.ai/api/v1', mistral:'https://api.mistral.ai/v1'};
  var model=(AI_MODELS[prov]||['llama-3.3-70b-versatile'])[0];
  fetch(bases[prov]+'/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+lsGet('rwKey_'+prov)},
    body:JSON.stringify({model:model, messages:messages, tools:RW_AGENT_TOOLS, tool_choice:'auto', max_tokens:900})
  }).then(function(r){ return r.json(); })
    .then(function(d){
      var m=d&&d.choices&&d.choices[0]&&d.choices[0].message;
      if(!m){ cb((d&&d.error&&d.error.message)||'no message'); return; }
      cb(null, m);
    }).catch(function(e){ cb(String(e&&e.message||e)); });
}

/* --- the visible reasoning trace (useful UX AND the thing to film for a demo) --- */
function openAgent(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('agentSection');
  if(!sec){ sec=document.createElement('section'); sec.id='agentSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83e\udde0 Tusk <em>Agent</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'agentSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Give Tusk an objective and watch it work \u2014 it picks tools, reads the results, and corrects itself. Every step is shown.</p>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:15px;margin-bottom:12px">'
    +'<input id="agentObj" placeholder="e.g. Plan 3 days in Spiti under 20k and check if cycling works" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:12px;color:var(--t1);font:inherit">'
    +'<button class="tact rw-cine-btn" style="width:100%;margin-top:10px;font-weight:800;padding:12px" onclick="rwAgentGo()">Run agent</button>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Needs an AI key with tool-calling (Groq, Cerebras, OpenRouter or Mistral). Max '+RW_AGENT_MAX_STEPS+' steps.</div></div>'
    +'<div id="agentTrace"></div>';
}
function rwAgentGo(){
  var obj=(el('agentObj')&&el('agentObj').value||'').trim();
  if(!obj){ showToast('Give the agent an objective'); return; }
  var host=el('agentTrace');
  host.innerHTML='<div class="rw-cine-load"><div class="rw-cine-orb"></div><div style="font-size:13px;color:var(--t2);margin-top:12px">Tusk is thinking\u2026</div></div>';
  rwAgentRun(obj, function(tr){ rwAgentRenderTrace(tr, host); },
    function(res){
      rwAgentRenderTrace(res.trace, host);
      if(res.ok) host.insertAdjacentHTML('beforeend',
        '<div class="rw-cine-panel" style="margin-top:12px;padding:20px">'
        +'<div style="position:relative;z-index:1"><b style="color:#4ADE80;font-size:13px;letter-spacing:.06em">\u2713 OBJECTIVE COMPLETE</b>'
        +'<div style="font-size:14px;color:#EDEAE2;margin-top:8px;line-height:1.65">'+esc2(res.answer||'')+'</div></div></div>');
      else host.insertAdjacentHTML('beforeend',
        '<div style="border:1px solid #E05B5B;background:rgba(224,91,91,.08);border-radius:12px;padding:14px;margin-top:10px">'
        +'<b style="color:#E05B5B;font-size:13px">Stopped: '+esc2(res.reason)+'</b>'
        +'<div style="font-size:12px;color:var(--t2);margin-top:4px">'
        +(res.reason==='llm_error'?'Add an AI key with tool-calling support in Settings.':'The agent hit its step limit without finishing \u2014 try a narrower objective.')
        +'</div></div>');
    });
}
function rwAgentRenderTrace(trace, host){
  var ic={objective:'\ud83c\udfaf', action:'\u2699\ufe0f', observation:'\ud83d\udc41\ufe0f', answer:'\ud83d\udcac', error:'\u26a0\ufe0f', halt:'\u23f9\ufe0f'};
  host.innerHTML=trace.map(function(t){
    var body = (t.kind==='action')
      ? '<b>'+esc2(t.data.tool)+'</b>(<span style="color:var(--t3)">'+esc2(JSON.stringify(t.data.args).slice(0,90))+'</span>)'
      : (t.kind==='observation')
        ? '<span style="color:'+(t.data&&t.data.ok===false?'#E05B5B':'#4ADE80')+'">'+esc2(JSON.stringify(t.data).slice(0,220))+'</span>'
        : esc2(String(t.data).slice(0,240));
    return '<div class="rw-cine-row" style="animation-delay:'+(Math.min(t.step,8)*0.05)+'s">'
      +'<span style="flex:0 0 22px;font-size:14px">'+(ic[t.kind]||'\u2022')+'</span>'
      +'<span style="flex:1;font-size:12px;font-family:ui-monospace,monospace;line-height:1.5;word-break:break-word">'+body+'</span>'
      +'<span style="flex:0 0 auto;font-size:10px;color:var(--t3)">'+t.step+'</span></div>';
  }).join('');
}

