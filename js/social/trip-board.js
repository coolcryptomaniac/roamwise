// @ts-nocheck
/* ==================== SOCIAL: TRIP BOARD ====================
   Extracted verbatim from app.js (Phase 4c modularization).
   "The Trip Hub" — Live Kitty (expenses/settle-up), the Decision Board (polls,
   the Group Train Picker, "When can everyone go?"), and the Living Plan/Board
   pins. Depends on the shared room state in js/social/group-state.js
   (_chatMsgs, _chatRoom, chatPost) which must load first. chatTuskFacilitate()
   and chatRenderPins() below are called from the chat files
   (js/social/group-chat.js / group-chat-social.js) — both are plain globals
   loaded before app.js, so the cross-file calls work regardless of load
   order between the two feature files. ==================================== */
/* ---- structured shares ---- */
/* ==================== THE TRIP HUB: what WhatsApp can't do ====================
   Groups will always CHAT on WhatsApp. We win on turning a messy group into a
   DECIDED, PAID-FOR, COORDINATED trip. All computed live from the message
   stream (no extra schema, works offline once loaded):
     1. LIVE KITTY     - who-owes-whom money tracker with minimal settle-up
     2. DECISION BOARD - polls that tally live and lock into a pinned decision
     3. LIVING PLAN    - the itinerary pinned at the top, @tusk can fill it
   ============================================================================ */
var _chatPinView = null;
function chatAddExpense(){
  var who = (user.displayName||user.email||'Traveller').split('@')[0];
  var f=[
    {key:'what', label:'What was paid for?', placeholder:'Hotel advance, Petrol, Dinner\u2026'},
    {key:'amount', label:'How much did YOU pay? (\u20b9)', placeholder:'4000', type:'number'},
    {key:'split', label:'Split between how many people?', placeholder:'leave blank for the whole group', type:'number', hint:'Including you. Blank = split across everyone in the chat.'}
  ]; f._submit='Add expense';
  rwForm('\ud83d\udcb0 Add an expense', f, function(v){
    if(!v.what){ showToast('Say what it was for'); return; }
    var amt=parseFloat(String(v.amount).replace(/[^0-9.]/g,''));
    if(!amt||amt<=0){ showToast('Enter a valid amount'); return; }
    var split=v.split?parseInt(v.split,10):0;
    chatPost('expense', {what:v.what, amount:Math.round(amt), payer:user.uid, payerName:who, split:split||0},
      who+' paid \u20b9'+Math.round(amt).toLocaleString('en-IN')+' for '+v.what)
      .then(function(){ _chatPinView='kitty'; setTimeout(function(){ try{ chatRenderPins(); }catch(e){} }, 200); });
  });
}
function chatKittyState(){
  var expenses = _chatMsgs.filter(function(m){ return m.kind==='expense' && m.payload; });
  var settles  = _chatMsgs.filter(function(m){ return m.kind==='settle' && m.payload; });
  if(!expenses.length) return null;
  var people={}, names={};
  _chatMsgs.forEach(function(m){ if(m.uid){ people[m.uid]=true; if(m.name) names[m.uid]=m.name; } });
  expenses.forEach(function(m){ var p=m.payload; if(p.payer){ people[p.payer]=true; if(p.payerName) names[p.payer]=p.payerName; } });
  var ids=Object.keys(people); var n=ids.length||1;
  /* Paise-exact settle via the CoordKit engine: build expense records
     (each split across its participants, or everyone if unspecified) and let
     rwSettleEngine compute balances + minimal transfers with no lost rupees. */
  var recs = expenses.map(function(m){
    var p=m.payload;
    return { payer:p.payer, amount:p.amount||0, participants:(p.participants&&p.participants.length)?p.participants:ids };
  });
  var eng = rwSettleEngine(recs, settles.map(function(m){ return m.payload; }));
  var total = expenses.reduce(function(s,m){ return s+(m.payload.amount||0); },0);
  var tx = eng.transfers.map(function(t){ return { from:t.from, to:t.to, amount:t.amount }; });
  return {total:total, perHead:Math.round(total/n), people:n, names:names, tx:tx, myBal:Math.round(eng.balances[user.uid]||0), count:expenses.length};
}
function chatKittyHTML(){
  var k=chatKittyState();
  if(!k) return '<div style="font-size:12px;color:var(--t3);padding:8px 2px">No expenses yet. Tap <b>+ Add an expense</b> when someone pays for something \u2014 I\u2019ll track who owes whom and how to settle up with the fewest payments.</div>';
  var mine = k.myBal>1 ? '<span style="color:#4ADE80">you\u2019re owed \u20b9'+k.myBal.toLocaleString('en-IN')+'</span>'
           : k.myBal<-1 ? '<span style="color:#F87171">you owe \u20b9'+Math.abs(k.myBal).toLocaleString('en-IN')+'</span>'
           : '<span style="color:var(--t3)">you\u2019re settled</span>';
  var out='<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;flex-wrap:wrap;gap:4px">'
    +'<span style="color:var(--t2)">Total \u20b9'+k.total.toLocaleString('en-IN')+' \u00b7 \u20b9'+k.perHead.toLocaleString('en-IN')+'/head</span>'+mine+'</div>';
  if(!k.tx.length){ out+='<div style="font-size:12px;color:#4ADE80;text-align:center;padding:6px">\u2705 Everyone\u2019s square.</div>'; }
  else {
    out+='<div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:5px">Settle up in '+k.tx.length+' payment'+(k.tx.length>1?'s':'')+'</div>';
    out+=k.tx.map(function(t){
      var fromMe = t.from===user.uid;
      var fromN = fromMe?'You':(k.names[t.from]||'Someone'), toN = t.to===user.uid?'you':(k.names[t.to]||'someone');
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        +'<span style="font-size:12.5px"><b>'+esc2(fromN)+'</b> \u2192 '+esc2(toN)+' <b style="color:var(--gold,#E8BA6C)">\u20b9'+t.amount.toLocaleString('en-IN')+'</b></span>'
        +(fromMe? '<span style="display:flex;gap:5px">'
            +'<button class="chat-tool" style="font-size:11px;padding:4px 10px;font-weight:700;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwUpiPayUid(\''+t.to+'\','+t.amount+')">\ud83d\udcb3 Pay</button>'
            +'<button class="chat-tool" style="font-size:11px;padding:4px 10px" onclick="chatSettle(\''+t.to+'\','+t.amount+')">Mark paid</button></span>':'')
        +'</div>';
    }).join('');
  }
  out+='<button class="chat-tool" style="width:100%;margin-top:9px;justify-content:center;background:var(--bg3,#1A1A20)" onclick="chatAddExpense()">+ Add an expense</button>';
  out+='<button class="chat-tool" style="width:100%;margin-top:6px;justify-content:center;background:var(--bg3,#1A1A20);font-size:11.5px" onclick="rwUpiSetMine()">\ud83d\udcb3 '+(rwUpiMine()? 'My UPI: '+esc2(rwUpiMine()) : 'Add your UPI ID so friends can pay you')+'</button>';
  return out;
}
function chatSettle(toUid, amount){
  chatPost('settle', {from:user.uid, to:toUid, amount:amount},
    (user.displayName||'Someone').split('@')[0]+' settled \u20b9'+amount.toLocaleString('en-IN'));
}


/* ===== GROUP TRAIN PICKER (rw-v44) — pillar 2 of the rail strategy.
   On IRCTC/ixigo, group travel means one person books and everyone argues in
   WhatsApp afterwards. Here: propose 2-4 train options with fares, everyone
   votes inline, the winner auto-posts as a decision AND drops the fare into
   the kitty split so nobody chases anyone for money. Reuses the existing
   poll + settle-engine plumbing. */
function chatTrainAsk(){
  rwForm('\ud83d\ude82 Which train should we take?', [
    {key:'route', label:'Route', placeholder:'e.g. Delhi \u2192 Haridwar', value:''},
    {key:'o1', label:'Option 1 (train + time + fare)', placeholder:'e.g. Shatabdi 12017, 06:45, \u20b9805'},
    {key:'o2', label:'Option 2', placeholder:'e.g. Jan Shatabdi 12055, 15:20, \u20b9420'},
    {key:'o3', label:'Option 3 (optional)', placeholder:''},
    {key:'o4', label:'Option 4 (optional)', placeholder:''}
  ], function(v){
    var options=[v.o1,v.o2,v.o3,v.o4].map(function(x){return (x||'').trim();}).filter(Boolean);
    if(options.length<2){ showToast('Give at least two train options'); return; }
    chatPost('train', {route:v.route||'Our train', options:options},
      '\ud83d\ude82 '+(v.route||'Which train?'));
  });
}
function chatTrainVote(msgId, idx){
  if(!_chatRoom || !user) return;
  chatPost('trainvote', {poll:msgId, pick:idx}, '\ud83d\ude82 voted');
  try{ rwHaptic(); }catch(e){}
}
function chatTrainTally(msg){
  var opts=(msg.payload&&msg.payload.options)||[];
  var byUser={};
  _chatMsgs.forEach(function(m){
    if(m.kind==='trainvote' && m.payload && m.payload.poll===msg._id){
      byUser[m.uid]={pick:m.payload.pick, name:m.name||'Someone'};
    }
  });
  var counts=opts.map(function(){return 0;}), names=opts.map(function(){return [];});
  Object.keys(byUser).forEach(function(u){
    var pk=byUser[u].pick;
    if(counts[pk]!==undefined){ counts[pk]++; names[pk].push(byUser[u].name.split(' ')[0]); }
  });
  var people=Object.keys(byUser).length, best=-1, max=0;
  counts.forEach(function(c,i){ if(c>max){ max=c; best=i; } });
  var mine=(byUser[user&&user.uid]||{}).pick;
  return {counts:counts,names:names,people:people,best:best,max:max,mine:mine,opts:opts};
}
/* pull a ₹ fare out of the free-text option so we can split it automatically */
function rwFareOf(text){
  var m=String(text||'').match(/(?:\u20b9|rs\.?\s*)\s*([\d,]+)/i);
  return m ? parseInt(m[1].replace(/,/g,''),10) : 0;
}
function chatTrainBody(msg){
  var t=chatTrainTally(msg);
  var rows=t.opts.map(function(o,i){
    var isBest=i===t.best && t.max>0, picked=t.mine===i, fare=rwFareOf(o);
    return '<button onclick="chatTrainVote(\''+msg._id+'\','+i+')" style="display:block;width:100%;text-align:left;margin-bottom:7px;padding:10px 12px;border-radius:11px;cursor:pointer;'
      +'background:'+(picked?'rgba(232,186,108,.14)':'var(--bg3,#1A1A20)')+';'
      +'border:1px solid '+(isBest?'var(--gold,#E8BA6C)':(picked?'rgba(232,186,108,.5)':'var(--b2,#2A2A36)'))+';color:var(--t1,#EDEAE2)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<span style="font-weight:700;font-size:13px">'+(picked?'\u25c9 ':'\u25cb ')+esc2(o)+'</span>'
      +'<span style="font-size:11px;color:'+(isBest?'var(--gold,#E8BA6C)':'var(--t3,#7A7870)')+';font-weight:700">'+t.counts[i]+'/'+t.people+(isBest?' \u2b50':'')+'</span></div>'
      +(t.names[i].length?'<div style="font-size:10.5px;color:var(--t3,#7A7870);margin-top:3px">'+esc2(t.names[i].join(', '))+'</div>':'')
      +(fare?'<div style="font-size:10.5px;color:#4ADE80;margin-top:3px">\u20b9'+fare+' each \u00b7 splits automatically if chosen</div>':'')
      +'</button>';
  }).join('');
  var lock = t.max>0
    ? '<button class="chat-tool" style="width:100%;margin-top:6px;justify-content:center" onclick="chatTrainLock(\''+msg._id+'\')">\u2705 Lock this train &amp; split the fare</button>'
    : '<div style="font-size:11.5px;color:var(--t3,#7A7870);margin-top:6px">Tap the train that works for you.</div>';
  return '<div style="margin-top:6px">'+rows+lock+'</div>';
}
function chatTrainLock(msgId){
  var msg=_chatMsgs.filter(function(m){return m._id===msgId;})[0]; if(!msg) return;
  var t=chatTrainTally(msg);
  if(t.best<0||!t.max){ showToast('Nobody has voted yet'); return; }
  var choice=t.opts[t.best], fare=rwFareOf(choice);
  chatPost('decision', {q:(msg.payload&&msg.payload.route)||'Train', choice:choice},
    '\u2705 Train locked: '+choice+' ('+t.max+' of '+t.people+')');
  if(fare>0 && user){
    /* drop it straight into the kitty so the fare is already split */
    chatPost('expense', {amount:fare*Math.max(1,t.people), what:'Train tickets \u2014 '+choice.slice(0,40)},
      '\ud83d\udcb0 Train fare added to the kitty');
    showToast('Train locked \u00b7 \u20b9'+fare+' each added to the split');
  } else {
    showToast('Train locked \u2705');
  }
}

/* ============ "WHEN CAN EVERYONE GO?" — group date finder (rw-v39) ============
   The hardest part of any group trip isn't where — it's WHEN. Everyone has
   different free weekends and it dies in a 200-message thread. This turns it
   into two taps: propose windows, everyone marks what works, the overlap wins.
   No competitor does this inside the trip chat. Follows the poll pattern:
   kind 'when' = the proposal, kind 'whenvote' = one member's availability. */
function chatWhenAsk(){
  /* Suggest the next 4 weekends so the common case is zero typing. */
  var opts=[], d=new Date();
  for(var i=0;i<28 && opts.length<4;i++){
    var day=new Date(d.getTime()+i*86400000);
    if(day.getDay()===6){ /* Saturday */
      var end=new Date(day.getTime()+86400000);
      opts.push(day.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+'\u2013'+end.toLocaleDateString('en-IN',{day:'numeric',month:'short'}));
    }
  }
  rwForm('\ud83d\udcc5 When can everyone go?', [
    {key:'q', label:'What are we deciding?', value:'Which dates work for everyone?'},
    {key:'o1', label:'Option 1', value:opts[0]||''},
    {key:'o2', label:'Option 2', value:opts[1]||''},
    {key:'o3', label:'Option 3', value:opts[2]||''},
    {key:'o4', label:'Option 4 (optional)', value:opts[3]||''}
  ], function(v){
    var options=[v.o1,v.o2,v.o3,v.o4].map(function(x){return (x||'').trim();}).filter(Boolean);
    if(options.length<2){ showToast('Give at least two date options'); return; }
    chatPost('when', {q:v.q||'Which dates work?', options:options},
      '\ud83d\udcc5 ' + (v.q||'Which dates work?'));
  });
}
/* Toggle my availability for one option (multi-select — unlike a normal poll,
   you can be free on several windows, which is the whole point). */
function chatWhenToggle(pollId, idx){
  if(!_chatRoom || !user) return;
  var mine=null;
  _chatMsgs.forEach(function(m){ if(m.kind==='whenvote' && m.payload && m.payload.poll===pollId && m.uid===user.uid) mine=m; });
  var picks=(mine && mine.payload && mine.payload.free) ? mine.payload.free.slice() : [];
  var at=picks.indexOf(idx);
  if(at>=0) picks.splice(at,1); else picks.push(idx);
  chatPost('whenvote', {poll:pollId, free:picks}, '\ud83d\udcc5 updated availability');
  try{ rwHaptic(); }catch(e){}
}
function chatWhenTally(msg){
  var opts=(msg.payload&&msg.payload.options)||[];
  var byUser={};
  _chatMsgs.forEach(function(m){
    if(m.kind==='whenvote' && m.payload && m.payload.poll===msg._id){
      byUser[m.uid]={free:m.payload.free||[], name:m.name||'Someone'};
    }
  });
  var counts=opts.map(function(){return 0;});
  var names=opts.map(function(){return [];});
  Object.keys(byUser).forEach(function(u){
    (byUser[u].free||[]).forEach(function(i){
      if(counts[i]!==undefined){ counts[i]++; names[i].push(byUser[u].name.split(' ')[0]); }
    });
  });
  var people=Object.keys(byUser).length;
  var best=-1, max=0; counts.forEach(function(c,i){ if(c>max){ max=c; best=i; } });
  var mine=(byUser[user&&user.uid]||{}).free||[];
  return {counts:counts, names:names, people:people, best:best, max:max, mine:mine, opts:opts};
}
function chatWhenBody(msg){
  var t=chatWhenTally(msg);
  var rows=t.opts.map(function(o,i){
    var isBest = i===t.best && t.max>0;
    var pct = t.people? Math.round(t.counts[i]/t.people*100) : 0;
    var picked = t.mine.indexOf(i)>=0;
    return '<button onclick="chatWhenToggle(\''+msg._id+'\','+i+')" style="display:block;width:100%;text-align:left;margin-bottom:7px;padding:10px 12px;border-radius:11px;cursor:pointer;'
      +'background:'+(picked?'rgba(74,222,128,.13)':'var(--bg3,#1A1A20)')+';'
      +'border:1px solid '+(isBest?'#4ADE80':(picked?'rgba(74,222,128,.5)':'var(--b2,#2A2A36)'))+';color:var(--t1,#EDEAE2)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<span style="font-weight:700;font-size:13px">'+(picked?'\u2705 ':'\u2b1c ')+esc2(o)+'</span>'
      +'<span style="font-size:11px;color:'+(isBest?'#4ADE80':'var(--t3,#7A7870)')+';font-weight:700">'+t.counts[i]+'/'+t.people+(isBest?' \u2b50':'')+'</span></div>'
      +(t.names[i].length?'<div style="font-size:10.5px;color:var(--t3,#7A7870);margin-top:3px">'+esc2(t.names[i].join(', '))+'</div>':'')
      +'</button>';
  }).join('');
  var verdict = t.max>0
    ? '<div style="font-size:12px;color:#4ADE80;font-weight:700;margin-top:6px">\u2b50 Best overlap: '+esc2(t.opts[t.best])+' \u2014 works for '+t.max+' of '+t.people+'</div>'
    : '<div style="font-size:11.5px;color:var(--t3,#7A7870);margin-top:6px">Tap every window that works for you \u2014 you can pick more than one.</div>';
  return '<div style="margin-top:6px">'+rows+verdict
    + (t.max>0 ? '<button class="chat-tool" style="width:100%;margin-top:8px;justify-content:center" onclick="chatWhenLock(\''+msg._id+'\')">\u2705 Lock these dates</button>' : '')
    +'</div>';
}
function chatWhenLock(pollId){
  var msg=_chatMsgs.filter(function(m){return m._id===pollId;})[0]; if(!msg) return;
  var t=chatWhenTally(msg);
  if(t.best<0 || !t.max){ showToast('No one has marked availability yet'); return; }
  chatPost('decision', {q:'Trip dates', choice:t.opts[t.best], poll:pollId},
    '\u2705 Dates locked: '+t.opts[t.best]+' (works for '+t.max+' of '+t.people+')');
}

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
  try{ rwHaptic(); }catch(e){}
  _chatPinView = (_chatPinView===view) ? null : view;
  try{ chatRenderPins(); }catch(e){}
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
      .then(function(){ _chatPinView='board'; setTimeout(function(){ try{ chatRenderPins(); }catch(e){} },200); });
  });
}
function chatEditPlan(){
  var cur=_chatMsgs.filter(function(m){return m.kind==='plan';}).slice(-1)[0];
  var f=[{key:'text', label:'The shared plan', type:'textarea', value:(cur&&cur.payload&&cur.payload.text)||'', placeholder:'Day 1: reach Goa, check in\nDay 2: North beaches\n\u2026', hint:'Everyone in the chat sees this pinned at the top.'}];
  f._submit='Save plan';
  rwForm('\ud83d\uddd3\ufe0f Edit the plan', f, function(v){
    chatPost('plan', {text:(v.text||'').slice(0,2000)}, '\ud83d\uddd3\ufe0f updated the plan')
      .then(function(){ _chatPinView='plan'; setTimeout(function(){ try{ chatRenderPins(); }catch(e){} }, 200); });
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
      .then(function(){ _chatPinView='plan'; setTimeout(function(){ try{ chatRenderPins(); }catch(e){} },200); });
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
  try{ rwHaptic&&rwHaptic(); }catch(e){}
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
