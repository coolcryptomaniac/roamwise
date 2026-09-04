// @ts-nocheck
/* train-picker.js — Group Train Picker (rw-v44): propose 2-4 train options with
   fares, tally inline votes, and lock the winner into a decision that also drops
   the fare into the Live Kitty split (chatTrainAsk, chatTrainVote, chatTrainTally,
   rwFareOf, chatTrainBody, chatTrainLock). Split out of js/social/trip-board.js
   (which bundled 5 unrelated trip-hub features) as an SRP cleanup; verbatim move,
   zero logic changes. Depends on the shared room state in js/social/group-state.js
   (_chatMsgs, _chatRoom, chatPost) and on chatPost's kitty-expense posting also
   used by expense-split.js. */

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
