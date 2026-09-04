// @ts-nocheck
/* ==================== SOCIAL: COORDKIT + MONEY LAYER ====================
   Extracted verbatim from app.js (Phase 4 modularization).
     - rwSettleEngine: paise-exact, minimal-transfer settle-up algorithm shared
       by the trip-chat Kitty (js/... chat, still in app.js) and the standalone
       Money Layer below.
     - Money Layer: the same settle engine, freed from "trips" — any group
       (flatmates, friends, office) tracks expenses and sees who owes whom.
   ==================================== */

/* ===== CoordKit settle engine (paise-exact, minimal transfers) — shared by
   the Live Kitty and Ailon Tusk. Money handled in integer paise to avoid float
   drift; rounding remainder distributed deterministically so shares always sum
   to the exact amount. ===== */
function rwSettleEngine(expenses, settles){
  function toMinor(a){ return Math.round((typeof a==='string'?parseFloat(a):a)*100); }
  function fromMinor(m){ return Math.round(m)/100; }
  var bal=Object.create(null);
  (expenses||[]).forEach(function(e){
    var amt=toMinor(e.amount||0);
    var parts=(e.participants&&e.participants.length)?e.participants:[e.payer];
    var w=parts.map(function(){return 1;}); var tot=w.length;
    var raw=parts.map(function(){return amt/tot;});
    var fl=raw.map(function(x){return Math.floor(x);});
    var rem=amt-fl.reduce(function(a,b){return a+b;},0);
    var ord=parts.map(function(_,i){return {i:i,f:raw[i]-fl[i]};}).sort(function(a,b){return b.f-a.f||a.i-b.i;});
    var sh=fl.slice(); for(var k=0;k<rem;k++) sh[ord[k].i]+=1;
    bal[e.payer]=(bal[e.payer]||0)+amt;
    parts.forEach(function(p,i){ bal[p]=(bal[p]||0)-sh[i]; });
  });
  (settles||[]).forEach(function(s){ if(!s) return; if(bal[s.from]!==undefined) bal[s.from]+=toMinor(s.amount); if(bal[s.to]!==undefined) bal[s.to]-=toMinor(s.amount); });
  var cr=[], db=[];
  Object.keys(bal).forEach(function(id){ var v=bal[id]; if(v>0) cr.push({id:id,v:v}); else if(v<0) db.push({id:id,v:-v}); });
  cr.sort(function(a,b){return b.v-a.v;}); db.sort(function(a,b){return b.v-a.v;});
  var tx=[], ci=0, di=0;
  while(ci<cr.length && di<db.length){
    var pay=Math.min(cr[ci].v, db[di].v);
    if(pay>0) tx.push({from:db[di].id, to:cr[ci].id, amount:fromMinor(pay)});
    cr[ci].v-=pay; db[di].v-=pay;
    if(cr[ci].v===0) ci++; if(db[di].v===0) di++;
  }
  var balances={}; Object.keys(bal).forEach(function(id){ balances[id]=fromMinor(bal[id]); });
  return { balances:balances, transfers:tx };
}

/* ===================== MONEY LAYER (everyday group money) =====================
   The settle engine, freed from "trips". Any group — flatmates, friends, family,
   office lunch — tracks who paid what and sees the minimum payments to settle.
   Stored locally (rw_money_groups); the same paise-exact rwSettleEngine powers it.
   This is the universal, use-it-weekly layer. */
function rwMoneyGroups(){ try{ return JSON.parse(lsGet('rw_money_groups')||'[]'); }catch(e){ return []; } }
function rwMoneySave(g){ try{ lsSet('rw_money_groups', JSON.stringify(g)); }catch(e){} }
function openMoneyLayer(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('moneySection');
  if(!sec){ sec=document.createElement('section'); sec.id='moneySection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udcb0 Money <em>groups</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'moneySection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Split anything with anyone \u2014 flatmates, friends, family, office lunch. Fair to the last paisa. Not just for trips.</p>'
    +'<div id="moneyBody"></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
  rwMoneyRender();
}
function rwMoneyRender(){
  var body=el('moneyBody'); if(!body) return;
  var groups=rwMoneyGroups();
  var list = groups.length ? groups.map(function(g,i){
    var eng=rwSettleEngine(g.expenses||[], g.settles||[]);
    var total=(g.expenses||[]).reduce(function(s,e){return s+(+e.amount||0);},0);
    var owe=eng.transfers.length;
    return '<button class="money-card" onclick="rwMoneyOpen('+i+')">'
      +'<span class="money-card-name">'+esc2(g.name)+'</span>'
      +'<span class="money-card-meta">\u20b9'+total.toLocaleString('en-IN')+' \u00b7 '+(g.members||[]).length+' people \u00b7 '+(owe?owe+' to settle':'all square')+'</span></button>';
  }).join('') : '<div class="note">No money groups yet. Create one for your flat, your friends, or this weekend\u2019s plan.</div>';
  body.innerHTML=list+'<button class="tact" style="width:100%;margin-top:12px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwMoneyNew()">+ New money group</button>';
}
function rwMoneyNew(){
  var f=[{key:'name',label:'Group name',placeholder:'Flat 302 / Goa gang / Office lunch'},
    {key:'members',label:'Members (comma-separated)',placeholder:'You, Rahul, Priya, Sam'}]; f._submit='Create';
  rwForm('\ud83d\udcb0 New money group', f, function(v){
    if(!v.name){ showToast('Give it a name'); return; }
    var members=(v.members||'').split(',').map(function(x){return x.trim();}).filter(Boolean);
    if(!members.length) members=['You'];
    var groups=rwMoneyGroups();
    groups.unshift({name:v.name, members:members, expenses:[], settles:[], created:Date.now()});
    rwMoneySave(groups); rwMoneyRender();
  });
}
function rwMoneyOpen(idx){
  var groups=rwMoneyGroups(); var g=groups[idx]; if(!g) return;
  var eng=rwSettleEngine(g.expenses||[], g.settles||[]);
  var total=(g.expenses||[]).reduce(function(s,e){return s+(+e.amount||0);},0);
  var body=el('moneyBody');
  var exp=(g.expenses||[]).map(function(e){ return '<div class="money-exp"><span>'+esc2(e.what||'Expense')+' \u00b7 <b>'+esc2(e.payerName||e.payer)+'</b></span><span>\u20b9'+(+e.amount).toLocaleString('en-IN')+'</span></div>'; }).join('') || '<div class="note">No expenses yet.</div>';
  var settle = eng.transfers.length
    ? eng.transfers.map(function(t){ return '<div class="money-settle" style="display:flex;align-items:center;flex-wrap:wrap"><span style="flex:1">'+esc2(t.from)+' \u2192 <b>'+esc2(t.to)+'</b>: \u20b9'+Number(t.amount).toLocaleString('en-IN')+'</span>'+rwUpiRowBtn(t.from,t.to,t.amount,'RoamWise \u00b7 '+(g.name||'trip'))+'</div>'; }).join('')
    : '<div class="money-square">\u2705 All square \u2014 nobody owes anyone.</div>';
  body.innerHTML='<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">'
    +'<button class="tact" onclick="rwMoneyRender()">\u2190 All groups</button>'
    +'<button class="tact" onclick="rwUpiSetMine()">\ud83d\udcb3 '+(rwUpiMine()? 'My UPI: '+esc2(rwUpiMine()) : 'Add my UPI ID')+'</button></div>'
    +'<div class="money-detail"><div class="money-dh">'+esc2(g.name)+'</div>'
    +'<div class="money-dsub">\u20b9'+total.toLocaleString('en-IN')+' total \u00b7 '+(g.members||[]).length+' people</div>'
    +'<div class="money-label">Expenses</div>'+exp
    +'<button class="tact" style="width:100%;margin:8px 0" onclick="rwMoneyAddExp('+idx+')">+ Add expense</button>'
    +'<div class="money-label">Settle up (fewest payments)</div>'+settle
    +'<button class="tact" style="width:100%;margin-top:12px" onclick="rwMoneyShare('+idx+')">\ud83d\udce4 Share settle-up</button>'
    +'</div>';
}
function rwMoneyAddExp(idx){
  var groups=rwMoneyGroups(); var g=groups[idx]; if(!g) return;
  var f=[{key:'what',label:'What for?',placeholder:'Groceries, Rent, Dinner'},
    {key:'amount',label:'Amount (\u20b9)',placeholder:'1200',type:'number'},
    {key:'payer',label:'Who paid?',type:'select',options:(g.members||['You']).map(function(m){return {value:m,label:m};})}]; f._submit='Add';
  rwForm('\ud83d\udcb0 Add expense', f, function(v){
    var amt=parseFloat(v.amount); if(!amt){ showToast('Enter an amount'); return; }
    g.expenses=g.expenses||[];
    g.expenses.push({what:v.what||'Expense', amount:Math.round(amt), payer:v.payer||g.members[0], payerName:v.payer||g.members[0], participants:g.members});
    rwMoneySave(groups); rwMoneyOpen(idx);
  });
}
function rwMoneyShare(idx){
  var groups=rwMoneyGroups(); var g=groups[idx]; if(!g) return;
  var eng=rwSettleEngine(g.expenses||[], g.settles||[]);
  var lines=eng.transfers.length ? eng.transfers.map(function(t){return t.from+' \u2192 '+t.to+': \u20b9'+t.amount;}).join('\n') : 'All square \u2014 nobody owes anyone!';
  var txt=g.name+' \u2014 settle up:\n'+lines+'\n\n(via RoamWise)';
  if(typeof rwShareSheet==='function') rwShareSheet(txt,'https://roamwise.co.in','settle-up');
  else if(navigator.share) navigator.share({text:txt}).catch(function(){});
  else { try{ navigator.clipboard.writeText(txt); showToast('Copied'); }catch(e){} }
}
