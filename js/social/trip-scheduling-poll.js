// @ts-nocheck
/* trip-scheduling-poll.js — "When can everyone go?" (rw-v39): a multi-select
   group date finder — propose date windows, everyone marks their own availability
   (unlike a normal single-choice poll), the best overlap wins (chatWhenAsk,
   chatWhenToggle, chatWhenTally, chatWhenBody, chatWhenLock). Split out of
   js/social/trip-board.js (which bundled 5 unrelated trip-hub features) as an SRP
   cleanup; verbatim move, zero logic changes. Depends on the shared room state in
   js/social/group-state.js (_chatMsgs, _chatRoom, chatPost). */

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
  try{ rwHaptic(); }catch(e){ /* haptic feedback is a nice-to-have, ignore */ }
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
