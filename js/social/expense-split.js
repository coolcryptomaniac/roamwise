// @ts-nocheck
/* expense-split.js — Live Kitty: who-owes-whom money tracking for a group trip
   (chatAddExpense, chatKittyState, chatKittyHTML, chatSettle), computed live from
   the shared message stream via the CoordKit settle engine. Split out of
   js/social/trip-board.js (which bundled 5 unrelated trip-hub features) as an SRP
   cleanup; verbatim move, zero logic changes. Depends on the shared room state in
   js/social/group-state.js (_chatMsgs, _chatRoom, chatPost), which must load
   first. */

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
