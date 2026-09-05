// @ts-nocheck
/* ==================== SOCIAL: TRIP BOARD (coordination layer) ====================
   Originally extracted verbatim from app.js (Phase 4c modularization); the Live
   Kitty, Group Train Picker and "When can everyone go?" features that used to live
   in this file have since moved to their own files (js/social/expense-split.js,
   js/social/train-picker.js, js/social/trip-scheduling-poll.js) as an SRP cleanup
   — verbatim moves, zero logic changes. What remains here is the trip hub's
   coordination/aggregation layer: the generic Decision Board poll engine
   (chatPollTally/chatVoteNew/chatLockPoll/chatNewPoll/chatVote/openChatPoll/
   rwPollVote/rwPollHTML), the pin-bar aggregator that switches between Kitty/
   Decisions/Plan/Board views (chatRenderPins/chatTogglePin), the Tusk group
   facilitator (chatTuskFacilitate), the Board of shared essentials
   (chatBoardBody/chatAddBoardItem), the pinned Living Plan editor (chatEditPlan),
   and the quick "share into chat" actions (chatShareBudget/chatSharePlan/
   chatShareMeet/chatMarkPaid). These are kept together because they all read/write
   the same pinned-message aggregation (_chatPinView, chatRenderPins) rather than
   being independently reusable features. Depends on the shared room state in
   js/social/group-state.js (_chatMsgs, _chatRoom, chatPost) which must load first.
   chatTuskFacilitate() and chatRenderPins() below are called from the chat files
   (js/social/group-chat.js / group-chat-social.js) — both are plain globals
   loaded before app.js, so the cross-file calls work regardless of load
   order between the two feature files. ==================================== */

var _chatPinView = null;
function chatPollTally(pollMsg){
  var votes={};
  _chatMsgs.forEach(function(m){ if(m.kind==='vote' && m.payload && m.payload.poll===pollMsg._id){ votes[m.uid]=m.payload.choice; } });
  var opts=(pollMsg.payload&&pollMsg.payload.options)||[];
  var counts=opts.map(function(){return 0;}); var total=0;
  Object.keys(votes).forEach(function(u){ var c=votes[u]; if(counts[c]!==undefined){ counts[c]++; total++; } });
  var winner=-1, max=-1; counts.forEach(function(c,i){ if(c>max){ max=c; winner=i; } });
  return {counts:counts, total:total, winner:winner, myVote:votes[user.uid]};
}
function chatVoteNew(pollId, idx){ if(_chatRoom && user) chatPost('vote', {poll:pollId, choice:idx}, '\ud83d\uddf3\ufe0f voted'); }
function chatLockPoll(pollId){
  var poll=_chatMsgs.filter(function(m){return m._id===pollId;})[0]; if(!poll) return;
  var t=chatPollTally(poll); var opts=(poll.payload&&poll.payload.options)||[];
  if(t.winner<0){ showToast('No votes yet'); return; }
  chatPost('decision', {q:poll.payload.q, choice:opts[t.winner], poll:pollId},
    '\u2705 Decided: '+poll.payload.q+' \u2192 '+opts[t.winner]);
}
function chatRenderPins(){
  var host=el('chatPins'); if(!host) return;
  var k=chatKittyState();
  var decisions=_chatMsgs.filter(function(m){return m.kind==='decision'&&m.payload;});
  var plan=_chatMsgs.filter(function(m){return m.kind==='plan'&&m.payload;}).slice(-1)[0];
  var chips='';
  chips+='<button class="chat-pin'+(_chatPinView==='kitty'?' on':'')+'" onclick="chatTogglePin(\'kitty\')">\ud83d\udcb0 Kitty'
    +(k? ' <span class="pin-badge">\u20b9'+(k.total>=1000?Math.round(k.total/1000)+'k':k.total)+'</span>':'')+'</button>';
  chips+='<button class="chat-pin'+(_chatPinView==='decisions'?' on':'')+'" onclick="chatTogglePin(\'decisions\')">\u2705 Decisions'
    +(decisions.length? ' <span class="pin-badge">'+decisions.length+'</span>':'')+'</button>';
  chips+='<button class="chat-pin'+(_chatPinView==='plan'?' on':'')+'" onclick="chatTogglePin(\'plan\')">\ud83d\uddd3\ufe0f Plan</button>';
  var boardCount = _chatMsgs.filter(function(m){ return m.kind==='board' && m.payload; }).length;
  chips+='<button class="chat-pin'+(_chatPinView==='board'?' on':'')+'" onclick="chatTogglePin(\'board\')">\ud83d\udccb Board'+(boardCount? ' <span class="pin-badge">'+boardCount+'</span>':'')+'</button>';
  var body='';
  if(_chatPinView==='kitty') body='<div class="pin-body">'+chatKittyHTML()+'</div>';
  else if(_chatPinView==='decisions'){
    body='<div class="pin-body">'+(decisions.length
      ? decisions.map(function(m){ return '<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12.5px"><b style="color:#4ADE80">\u2713</b> '+esc2((m.payload.q||'')+': ')+'<b>'+esc2(m.payload.choice||'')+'</b></div>'; }).join('')
      : '<div style="font-size:12px;color:var(--t3)">No decisions locked yet. Start a poll (\ud83d\uddf3\ufe0f below); when it\u2019s clear, lock the winner and it pins here so nobody re-asks \u201cso what did we decide?\u201d</div>')
      +'</div>';
  }
  else if(_chatPinView==='plan'){
    body='<div class="pin-body">'+(plan && plan.payload.text
      ? '<div style="font-size:12.5px;line-height:1.6;white-space:pre-wrap">'+esc2(plan.payload.text)+'</div>'
      : '<div style="font-size:12px;color:var(--t3)">No plan pinned yet. Type <b>@tusk plan 3 days in Goa</b> and I\u2019ll draft one everyone sees here.</div>')
      +'<button class="chat-tool" style="width:100%;margin-top:9px;justify-content:center" onclick="chatEditPlan()">\u270f\ufe0f Edit the plan</button></div>';
  }
  else if(_chatPinView==='board'){ body=chatBoardBody(); }
  host.innerHTML='<div class="pin-row">'+chips+'</div>'+body;
}
/* Toggle a pin tab open/closed. This was referenced by the pin chips but never
   defined — which is why Kitty/Decisions/Plan/Board didn't respond to taps. */
function chatTogglePin(view){
  try{ rwHaptic(); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
  _chatPinView = (_chatPinView===view) ? null : view;
  try{ chatRenderPins(); }catch(e){ /* best-effort, ignore */ }
}
/* ===== UNIQUE: "Tusk, sort this out" — the group facilitator =====
   Reads the recent group conversation and produces a clear summary + the single
   most useful next action (settle money, lock a decision, or poll an open
   question). No other travel app turns the AI into a group-decision facilitator.
   This makes the trip-hub genuinely indispensable for planning together. */
function chatTuskFacilitate(){
  var recent=(_chatMsgs||[]).slice(-25).map(function(m){
    var who=(m.name||'Someone').split(' ')[0];
    if(m.kind==='expense'&&m.payload) return who+' paid \u20b9'+(m.payload.amount||0)+' for '+(m.payload.what||'something');
    if(m.kind==='decision'&&m.payload) return 'DECIDED: '+(m.payload.q||'')+' \u2192 '+(m.payload.choice||'');
    if(m.kind==='meet'&&m.payload) return 'Meeting point: '+(m.payload.place||'');
    if(m.kind==='vote'&&m.payload) return who+' is polling: '+(m.payload.q||'');
    return who+': '+(m.text||'');
  }).filter(Boolean).join('\n');
  if(!recent){ showToast('Chat a bit first, then I\u2019ll help sort it out'); return; }
  var k=chatKittyState();
  var moneyLine = k ? ('Money so far: \u20b9'+k.total+' total, '+(k.tx.length?k.tx.length+' payments to settle':'all square')+'.') : 'No expenses yet.';
  var prompt='You are Ailon Tusk, a warm, witty travel-group facilitator. Read this group trip chat and help them move forward. '
    +'Give: (1) a one-line summary of where things stand, (2) what\u2019s still undecided, (3) ONE concrete next step. '
    +'Keep it under 70 words, friendly, a little fun. '+moneyLine+'\n\nChat:\n'+recent;
  showToast('\u2728 Tusk is reading the chat\u2026');
  var post=function(txt){ chatPost('text', null, '\u2728 Tusk: '+txt); };
  if(typeof aiCallAny==='function'){
    aiCallAny(prompt, 220, function(err, txt){
      if(txt){ post(String(txt).trim().slice(0,600)); }
      else { post('Here\u2019s where you\u2019re at \u2014 '+moneyLine+' If you\u2019re stuck on a choice, tap \ud83d\uddf3\ufe0f Poll and I\u2019ll tally it.'); }
    });
  } else {
    post('Here\u2019s where you\u2019re at \u2014 '+moneyLine+' If a decision\u2019s open, start a \ud83d\uddf3\ufe0f Poll and I\u2019ll tally it.');
  }
}
/* ===== TRIP BOARD: one dropdown with everything the group needs at a glance —
   the pinned meeting point, expense summary, locked decisions, and member-added
   essentials (emergency numbers / tickets / docs). Each essential is marked
   "shared with group" or "private to me" so personal info never leaks. ===== */
function chatBoardBody(){
  var out='<div class="pin-body">';
  /* 1) Meeting point (latest) */
  var meet=_chatMsgs.filter(function(m){ return m.kind==='meet' && m.payload; }).slice(-1)[0];
  out+='<div class="board-sec"><div class="board-h">\ud83d\udccd Meeting point</div>';
  out+= meet ? '<div class="board-v"><b>'+esc2(meet.payload.place||'')+'</b>'+(meet.payload.when?' \u00b7 '+esc2(meet.payload.when):'')+'</div>'
             : '<div class="board-x">Not set \u2014 tap \ud83d\udccd Meet point below.</div>';
  out+='</div>';
  /* 2) Money (from the live Kitty) */
  var k=chatKittyState();
  out+='<div class="board-sec"><div class="board-h">\ud83d\udcb0 Money</div>';
  if(k){
    out+='<div class="board-v">Total \u20b9'+k.total.toLocaleString('en-IN')+' \u00b7 \u2248\u20b9'+k.perHead.toLocaleString('en-IN')+'/head';
    if(k.tx.length){ out+=' \u00b7 '+k.tx.length+' payment'+(k.tx.length>1?'s':'')+' to settle'; } else { out+=' \u00b7 all square \u2705'; }
    out+='</div>';
  } else out+='<div class="board-x">No expenses yet.</div>';
  out+='</div>';
  /* 3) Locked decisions */
  var decs=_chatMsgs.filter(function(m){ return m.kind==='decision' && m.payload; });
  out+='<div class="board-sec"><div class="board-h">\u2705 Decisions</div>';
  out+= decs.length ? decs.map(function(m){ return '<div class="board-v">'+esc2((m.payload.q||'')+': ')+'<b>'+esc2(m.payload.choice||'')+'</b></div>'; }).join('')
                    : '<div class="board-x">Nothing locked yet.</div>';
  out+='</div>';
  /* 4) Essentials the group added (emergency / tickets / docs) — respect privacy */
  var items=_chatMsgs.filter(function(m){ return m.kind==='board' && m.payload; });
  var myUid=(user||{}).uid;
  var ICON={emergency:'\ud83c\udd98',ticket:'\ud83c\udfab',doc:'\ud83d\udcc4',note:'\ud83d\udccc'};
  out+='<div class="board-sec"><div class="board-h">\ud83d\udd11 Essentials</div>';
  var shown=items.filter(function(m){ return m.payload.share!==false || m.uid===myUid; });
  if(shown.length){
    out+=shown.map(function(m){
      var p=m.payload, priv=(p.share===false);
      return '<div class="board-v" style="display:flex;justify-content:space-between;gap:8px">'
        +'<span>'+(ICON[p.type]||'\ud83d\udccc')+' <b>'+esc2(p.title||'')+'</b>'+(p.value?': '+esc2(p.value):'')+'</span>'
        +(priv?'<span class="board-tag" style="color:#F87171">\ud83d\udd12 you</span>':'<span class="board-tag" style="color:#4ADE80">shared</span>')
        +'</div>';
    }).join('');
  } else out+='<div class="board-x">No emergency numbers, tickets or docs added yet.</div>';
  out+='<button class="chat-tool" style="width:100%;margin-top:9px;justify-content:center" onclick="chatAddBoardItem()">+ Add emergency no. / ticket / doc</button>';
  out+='</div>';
  out+='<div style="font-size:10px;color:var(--t3);margin-top:8px;line-height:1.5">Items marked \ud83d\udd12 stay private to you. \u201cShared\u201d items are visible to everyone in this trip \u2014 don\u2019t share OTPs, passwords or full card numbers.</div>';
  return out+'</div>';
}
function chatAddBoardItem(){
  var f=[
    {key:'type', label:'What is it?', type:'select', options:[
      {value:'emergency', label:'\ud83c\udd98 Emergency contact'},
      {value:'ticket', label:'\ud83c\udfab Ticket / booking ref'},
      {value:'doc', label:'\ud83d\udcc4 Document / ID note'},
      {value:'note', label:'\ud83d\udccc Other note'}]},
    {key:'title', label:'Label', placeholder:'e.g. Hotel front desk, Bus PNR, Insurance'},
    {key:'value', label:'Detail', placeholder:'e.g. +91 98xxxxxx / PNR 4821 / policy no.'},
    {key:'share', label:'Who can see it?', type:'select', options:[
      {value:'yes', label:'\u2705 Share with the group'},
      {value:'no', label:'\ud83d\udd12 Private to me'}]}
  ]; f._submit='Add to board';
  rwForm('\ud83d\udd11 Add an essential', f, function(v){
    if(!v.title){ showToast('Give it a label'); return; }
    /* Gentle guard: warn if it looks like a secret being shared with the group */
    var looksSecret=/otp|password|cvv|\b\d{12,19}\b|pin\b/i.test((v.value||'')+' '+(v.title||''));
    if(v.share==='yes' && looksSecret && !confirm('This looks like a password/OTP/card number. Share it with the whole group anyway?')){ return; }
    chatPost('board', {type:v.type||'note', title:v.title.slice(0,60), value:(v.value||'').slice(0,120), share:(v.share!=='no')},
      '\ud83d\udccb added '+(v.share==='no'?'a private ':'')+'board item: '+v.title.slice(0,40))
      .then(function(){ _chatPinView='board'; setTimeout(function(){ try{ chatRenderPins(); }catch(e){ /* best-effort, ignore */ } },200); });
  });
}
function chatEditPlan(){
  var cur=_chatMsgs.filter(function(m){return m.kind==='plan';}).slice(-1)[0];
  var f=[{key:'text', label:'The shared plan', type:'textarea', value:(cur&&cur.payload&&cur.payload.text)||'', placeholder:'Day 1: reach Goa, check in\nDay 2: North beaches\n\u2026', hint:'Everyone in the chat sees this pinned at the top.'}];
  f._submit='Save plan';
  rwForm('\ud83d\uddd3\ufe0f Edit the plan', f, function(v){
    chatPost('plan', {text:(v.text||'').slice(0,2000)}, '\ud83d\uddd3\ufe0f updated the plan')
      .then(function(){ _chatPinView='plan'; setTimeout(function(){ try{ chatRenderPins(); }catch(e){ /* best-effort, ignore */ } }, 200); });
  });
}

function chatShareBudget(){
  var dest = (_cpCtx && _cpCtx.dest) || '';
  var days = (_cpCtx && _cpCtx.days) || 5;
  var entry = dest ? (cpDbFind(dest) || null) : null;
  if(!entry){ showToast('Ask Tusk about a destination first, then share its budget'); return; }
  try{
    var fx = window._rwFxINR || 88;
    var e2 = JSON.parse(JSON.stringify(entry)); delete e2.brk;
    if(e2.cost && !e2.cost.budget) e2.cost.budget = Math.round(e2.cost.mid*0.55);
    var mid = Math.round(shadowBudget(e2, days, 'mid').total*fx);
    var lo  = Math.round(shadowBudget(e2, days, 'budget').total*fx);
    chatPost('budget', {dest:dest, days:days, mid:mid, lo:lo},
      dest+' \u00b7 '+days+' days \u2014 shoestring \u20b9'+lo.toLocaleString('en-IN')+', mid-range \u20b9'+mid.toLocaleString('en-IN')+' per person');
  }catch(e){ showToast('Could not build that budget'); }
}
function chatSharePlan(){
  var trips = (typeof vaultGet==='function') ? (vaultGet()||[]) : [];
  if(!trips.length){ showToast('Save a trip first \u2014 plan one, tap \u2708\ufe0f Save offline, then share it here'); return; }
  function postPlan(t){
    var existing = _chatMsgs.filter(function(m){ return m.kind==='plan' && m.payload; });
    var last = existing[existing.length-1];
    if(last && last.payload && last.payload.id===t.id){
      showToast('That itinerary is already pinned above \u2705'); _chatPinView='plan'; chatRenderPins(); return;
    }
    chatPost('plan', {id:t.id, name:t.name, days:(t.days||[]).length},
      t.name+' \u2014 '+((t.days||[]).length)+'-day plan')
      .then(function(){ _chatPinView='plan'; setTimeout(function(){ try{ chatRenderPins(); }catch(e){ /* best-effort, ignore */ } },200); });
  }
  if(trips.length===1){ postPlan(trips[0]); return; }
  var f=[ { key:'trip', label:'Which saved trip?', type:'select',
      options: trips.map(function(t){ return {value:t.id, label:t.name+' ('+((t.days||[]).length)+'d)'}; }) } ];
  f._submit='Share this itinerary';
  rwForm('\ud83d\uddd3\ufe0f Pin an itinerary', f, function(v){
    var t = trips.filter(function(x){ return x.id===v.trip; })[0] || trips[0];
    postPlan(t);
  });
}
function chatShareMeet(){
  var f=[
    {key:'place', label:'Meeting place', placeholder:'Kashmere Gate metro, Gate 3'},
    {key:'when', label:'When', placeholder:'Sat 6:00 am'},
    {key:'city', label:'City / area (for map & events)', placeholder:'Delhi', hint:'Used to add a map pin and find events on your dates.'}
  ]; f._submit='Share meeting point';
  rwForm('\ud83d\udccd Set a meeting point', f, function(v){
    if(!v.place){ showToast('Where are you meeting?'); return; }
    var q=encodeURIComponent(v.place+(v.city?', '+v.city:''));
    var mapUrl='https://www.google.com/maps/search/?api=1&query='+q;
    chatPost('meet', {place:v.place, when:v.when||'', city:v.city||'', map:mapUrl},
      '\ud83d\udccd '+v.place+(v.when?' \u00b7 '+v.when:''))
      .then(function(){ _chatPinView=null; });
  });
}
function chatMarkPaid(){
  var f=[{key:'note', label:'What did you pay / settle?', placeholder:'Hotel advance \u20b94,000 \u2014 paid to Amit'}];
  f._submit='Post';
  rwForm('\u2705 Mark a payment', f, function(v){
    if(!v.note){ return; }
    chatPost('paid', {note:v.note}, v.note);
  });
}
function chatNewPoll(){
  var f=[
    {key:'q', label:'Question', placeholder:'Which weekend works?'},
    {key:'o1', label:'Option 1', placeholder:'12\u201314 Oct'},
    {key:'o2', label:'Option 2', placeholder:'19\u201321 Oct'},
    {key:'o3', label:'Option 3 (optional)', placeholder:''},
    {key:'o4', label:'Option 4 (optional)', placeholder:''}
  ]; f._submit='Start poll';
  rwForm('\ud83d\uddf3\ufe0f New poll', f, function(v){
    if(!v.q){ showToast('Add a question'); return; }
    var list=[v.o1,v.o2,v.o3,v.o4].map(function(x){return (x||'').trim();}).filter(Boolean).slice(0,4);
    if(list.length<2){ showToast('Give at least two options'); return; }
    chatPost('poll', {q:v.q, options:list, votes:{}}, v.q);
  });
}
async function chatVote(msgId, idx){
  if(!_chatRoom || !user) return;
  var ref = db.collection('tripchats').doc(_chatRoom).collection('msgs').doc(msgId);
  try{
    var d = await ref.get(); if(!d.exists) return;
    var p = d.data().payload||{}; p.votes = p.votes||{};
    p.votes[user.uid] = idx;
    /* messages are immutable by rule, so a vote is posted as its own message
       and tallied client-side — simpler than loosening the write rules */
    await chatPost('text', null, '\ud83d\uddf3\ufe0f voted: '+(p.options[idx]||''));
  }catch(e){ showToast('Could not vote'); }
}
/* ---------------- DECIDE: polls that close themselves ---------------- */
function openChatPoll(){
  rwForm('\ud83d\uddf3\ufe0f Ask the group', [
    { key:'pq', label:'What are you deciding?', placeholder:'e.g. Which day do we do the trek?' },
    { key:'po', label:'Options (comma separated)', placeholder:'Tuesday, Wednesday, Thursday' }
  ], function(v){
    var q=(v.pq||'').trim(), opts=(v.po||'').split(',').map(function(x){return x.trim();}).filter(Boolean);
    if(!q || opts.length<2){ showToast('Give a question and at least two options'); return; }
    try{
      chatPost('poll', { q:q, opts:opts, votes:{} }, q);
    }catch(e){ showToast('Could not post the poll'); }
  }, 'Everyone votes, the result pins itself to the top. No more forty messages about one decision.');
}
function rwPollVote(id, idx){
  if(!user || !_chatRoom) return;
  var u={}; u['payload.votes.'+user.uid]=idx;
  db.collection('tripchats').doc(_chatRoom).collection('msgs').doc(id).update(u).catch(function(){});
  try{ rwHaptic&&rwHaptic(); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
}
function rwPollHTML(id, m){
  var p=m.payload||{}, votes=p.votes||{}, opts=p.opts||[];
  var counts=opts.map(function(){ return 0; });
  var total=0, mine=null;
  Object.keys(votes).forEach(function(uid){
    var i=votes[uid];
    if(counts[i]!=null){ counts[i]++; total++; }
    if(user && uid===user.uid) mine=i;
  });
  var lead=counts.indexOf(Math.max.apply(null,counts));
  return '<div class="pl-box">'
    +'<div class="pl-q">\ud83d\uddf3\ufe0f '+esc2(p.q||'')+'</div>'
    + opts.map(function(o,i){
        var pct = total? Math.round(counts[i]/total*100) : 0;
        return '<div class="pl-o'+(mine===i?' mine':'')+(total&&i===lead?' lead':'')+'" onclick="rwPollVote(\''+id+'\','+i+')">'
          +'<i style="width:'+pct+'%"></i>'
          +'<span>'+esc2(o)+'</span><b>'+(total?pct+'%':'')+'</b></div>';
      }).join('')
    +'<div class="pl-f">'+(total? total+' vote'+(total>1?'s':'') : 'No votes yet')
    + (total && counts[lead]>total/2 ? ' \u00b7 <b style="color:#4ADE80">'+esc2(opts[lead])+' wins</b>' : '')
    +'</div></div>';
}
