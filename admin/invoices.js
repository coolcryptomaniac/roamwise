(function(){'use strict';
var $=function(id){return document.getElementById(id);},B=RWInvoiceBooks,I=RWInvoice;
var cfg={apiKey:'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',appId:'1:299014744987:web:d5c316743e6d7a10904f3e'};
try{if(!firebase.apps.length)firebase.initializeApp(cfg);}catch(e){$('gate').textContent='Firebase initialization failed. Open the main admin console.';return;}
var auth=firebase.auth(),db=firebase.firestore(),invoices=[],ledger=[],verifyResult=null,unmatched=[],lastPnl=null;
var nowFy=new Date().getUTCFullYear()-(new Date().getUTCMonth()<3?1:0);
for(var y=nowFy;y>=nowFy-4;y--){var op=document.createElement('option');op.value=String(y);op.textContent=y+'–'+String(y+1).slice(-2);$('fy').appendChild(op);}
function fy(){return Number($('fy').value);}
function say(id,t){$(id).textContent=t;}
function fail(m){$('problem').textContent=m;$('problem').hidden=false;}
function el(tag,cls,t){var n=document.createElement(tag);if(cls)n.className=cls;if(t!=null)n.textContent=String(t);return n;}
function download(name,text,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
function inr(p){return RWInvoiceRender.inr(p);}

var SELLER=['legalName','tradeName','prefix','gstin','sac','address','pan','udyam','email','phone'];
function loadSeller(){
  return db.doc('invoiceConfig/seller').get({source:'server'}).then(function(d){
    var v=d.exists?d.data():{};SELLER.forEach(function(k){$('s_'+k).value=v[k]||'';});
    $('s_gstRegistered').value=v.gstRegistered===true?'true':'false';$('s_rate').value=Number.isInteger(v.gstRateBps)?String(v.gstRateBps/100):'';
    say('sellerMsg',d.exists?'Seller details loaded.':'No seller details saved yet. Invoices will say "RoamWise" and no GST until you save them.');
  });
}
function saveSeller(){
  var v={},reg=$('s_gstRegistered').value==='true';SELLER.forEach(function(k){v[k]=$('s_'+k).value.trim();});
  v.gstin=v.gstin.toUpperCase().replace(/\s/g,'');v.pan=v.pan.toUpperCase();v.prefix=(v.prefix||'RW').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(reg&&!I.gstState(v.gstin)){say('sellerMsg','GST registered needs a valid GSTIN (15 characters with a correct check character).');return;}
  var r=$('s_rate').value.trim();v.gstRegistered=reg;
  if(r){var bps=Math.round(Number(r)*100);if(!(bps>=0&&bps<=10000)){say('sellerMsg','Enter the GST rate as a percentage, for example 18.');return;}v.gstRateBps=bps;}else v.gstRateBps=null;
  v.updatedAt=new Date().toISOString();v.updatedBy=auth.currentUser.uid;
  $('saveSeller').disabled=true;
  db.doc('invoiceConfig/seller').set(v).then(function(){say('sellerMsg','Saved. New invoices use these details; issued invoices never change.');}).catch(function(e){say('sellerMsg','Could not save: '+(e&&e.message||e));}).then(function(){$('saveSeller').disabled=false;});
}
function readAll(name){return db.collection(name).get({source:'server'}).then(function(s){return s.docs.map(function(d){return Object.assign({id:d.id},d.data());});});}
function reload(){
  say('status','Loading invoices and ledger…');
  return Promise.all([readAll('invoices'),readAll('ledger')]).then(function(r){
    invoices=r[0];ledger=r[1];render();say('status',invoices.length+' invoice(s) and '+ledger.length+' ledger entr'+(ledger.length===1?'y':'ies')+' loaded.');
  }).catch(function(e){fail('Could not read records: '+(e&&e.message||e));});
}
function render(){
  var list=invoices.filter(function(i){return i.fy===fy()+'-'+String(fy()+1).slice(-2);}).sort(function(a,b){return b.seq-a.seq;}),rows=$('rows');rows.replaceChildren();
  $('count').textContent='('+list.length+' in this year)';
  list.forEach(function(i){var tr=el('tr');tr.appendChild(el('td',null,i.number));tr.appendChild(el('td',null,i.date));tr.appendChild(el('td',null,i.customer.name||i.customer.email||i.customer.uid||'—'));tr.appendChild(el('td','num',inr(i.totalPaise)));tr.appendChild(el('td',null,i.taxMode==='none'?'No GST':i.taxMode==='igst'?'IGST':'CGST+SGST'));tr.appendChild(el('td',null,(i.flags||[]).length?String(i.flags.length):''));
    var td=el('td'),b=el('button',null,'View');b.type='button';b.addEventListener('click',function(){$('preview').replaceChildren(RWInvoiceRender.render(i,{showFlags:true}));$('preview').scrollIntoView({behavior:'smooth'});});td.appendChild(b);tr.appendChild(td);rows.appendChild(tr);});
  var p=B.pnl(invoices,ledger,fy(),RWTaxEngine.kindOf);lastPnl=p;var c=$('pnlCards');c.replaceChildren();
  [['Revenue (ex-GST)',p.total.revenuePaise],['GST collected (liability)',p.total.gstCollectedPaise],['Recorded expenses',p.total.expensePaise],['Profit (provisional)',p.total.profitPaise]].forEach(function(x){var d=el('div','card');d.appendChild(el('small',null,x[0]));d.appendChild(el('div',null,inr(x[1])));c.appendChild(d);});
  $('pnlWarn').replaceChildren();p.warnings.forEach(function(w){$('pnlWarn').appendChild(el('li',null,w));});
}
function sweep(){
  var u=auth.currentUser,url=typeof rwApi==='function'?rwApi('admin/invoices/sweep'):null;
  if(!url){say('status','Worker URL is not configured, so the automatic issuer is unavailable. It runs daily once the Worker is deployed.');return;}
  $('sweep').disabled=true;say('status','Issuing invoices…');
  u.getIdToken().then(function(t){return fetch(url,{method:'POST',headers:{authorization:'Bearer '+t}});}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.message||j.error||r.status);return j;});})
   .then(function(j){say('status','Issued '+j.issued.length+' invoice(s)'+(j.errors&&j.errors.length?'; '+j.errors.length+' error(s): '+j.errors[0]:'')+(j.remaining?'; '+j.remaining+' more waiting, run again.':'.'));return reload();})
   .catch(function(e){say('status','Could not issue invoices: '+(e&&e.message||e));}).then(function(){$('sweep').disabled=false;});
}
function verify(){
  I.verifyChain(invoices.slice()).then(function(r){verifyResult=r;var o=$('verifyOut');o.replaceChildren();
    o.appendChild(el('div',r.ok?'ok':'bad',r.ok?'Trail intact: '+r.checked+' invoice(s), numbering gap-free, hash chain unbroken.':r.issues.length+' problem(s) found in '+r.checked+' invoice(s):'));
    r.issues.slice(0,20).forEach(function(x){o.appendChild(el('div','bad',x.code+' · '+(x.number||x.fy)+' · '+x.detail));});});
}
function fyList(){return invoices.filter(function(i){return i.fy===fy()+'-'+String(fy()+1).slice(-2);});}
function money(p){return (p/100).toFixed(2);}
function dlRegister(){download('sales-register-'+fy()+'.csv',B.toCsv(B.REGISTER_COLS,B.salesRegister(invoices,fy())));}
function dlGst(){var cols=[['month','Month'],['count','Invoices'],['taxable','Taxable value'],['cgst','CGST'],['sgst','SGST'],['igst','IGST'],['tax','Total GST'],['total','Invoice total']];
  download('gst-summary-'+fy()+'.csv',B.toCsv(cols,B.gstSummary(invoices,fy()).map(function(m){return {month:m.month,count:m.count,taxable:money(m.taxablePaise),cgst:money(m.cgstPaise),sgst:money(m.sgstPaise),igst:money(m.igstPaise),tax:money(m.taxPaise),total:money(m.totalPaise)};})));}
function dlPnl(){var cols=[['month','Month'],['rev','Revenue ex-GST'],['gst','GST collected'],['exp','Recorded expenses'],['profit','Profit (provisional)']];
  var rows=lastPnl.rows.concat([lastPnl.total]).map(function(r){return {month:r.month,rev:money(r.revenuePaise),gst:money(r.gstCollectedPaise),exp:money(r.expensePaise),profit:money(r.profitPaise)};});download('pnl-'+fy()+'.csv',B.toCsv(cols,rows));}
function dlPacket(){
  var list=fyList(),flagged=list.filter(function(i){return(i.flags||[]).length;}),t=lastPnl.total,lines=['ROAMWISE — CA HANDOFF NOTE (working paper, not a filing)','Financial year: '+fy()+'-'+String(fy()+1).slice(-2),'Prepared: '+new Date().toISOString().slice(0,10),'',
    'Invoices issued: '+list.length+' (first '+(list.length?list.slice().sort(function(a,b){return a.seq-b.seq;})[0].number:'n/a')+')','Revenue ex-GST: '+money(t.revenuePaise),'GST collected: '+money(t.gstCollectedPaise),'Recorded expenses: '+money(t.expensePaise),'Provisional profit: '+money(t.profitPaise),'',
    'Trail check: '+(verifyResult?(verifyResult.ok?'passed':verifyResult.issues.length+' issue(s)'):'not run yet — run it before sending'),'Invoices with flags needing your review: '+flagged.length,''];
  flagged.slice(0,40).forEach(function(i){lines.push(' - '+i.number+': '+i.flags.join(', '));});
  lines.push('','Attach: sales register CSV, GST summary CSV, monthly P&L CSV, bank statement and gateway settlement reports.','Questions for the CA: GST registration and rate, SAC code, place-of-supply for unregistered customers, treatment of gateway fees, TDS/TCS on platform collections, income-tax treatment.','Limits: expenses are only what was entered in the ledger; no bank feed is connected; figures are provisional.');
  download('ca-handoff-'+fy()+'.txt',lines.join('\n'),'text/plain;charset=utf-8');
}
function bankFile(ev){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;var r=new FileReader();
  r.onload=function(){try{var m=B.matchBank(fyList(),B.normaliseBank(String(r.result))),o=$('bankOut');o.replaceChildren();unmatched=m.unmatchedBank;
    [['Matched',m.matched.length],['Ambiguous (same amount, several invoices)',m.ambiguous.length],['Gateway payout lines (reconcile in Finance desk)',m.gatewayLines.length],['Bank credits with no invoice',m.unmatchedBank.length],['Invoices with no matching deposit',m.invoicesWithoutDeposit.length]].forEach(function(x){o.appendChild(el('div',null,x[0]+': '+x[1]));});
    $('dlBank').disabled=!unmatched.length;}catch(e){$('bankOut').textContent='Could not read this statement: '+(e&&e.message||e);}};
  r.readAsText(f);
}
function dlBank(){download('unmatched-bank-credits.csv',B.toCsv([['date','Date'],['narration','Narration'],['amount','Credit']],unmatched.map(function(b){return {date:b.date,narration:b.narration,amount:money(b.creditPaise)};})));}
$('saveSeller').addEventListener('click',saveSeller);$('sweep').addEventListener('click',sweep);$('reload').addEventListener('click',reload);$('verify').addEventListener('click',verify);$('fy').addEventListener('change',render);
$('dlRegister').addEventListener('click',dlRegister);$('dlGst').addEventListener('click',dlGst);$('dlPnl').addEventListener('click',dlPnl);$('dlPacket').addEventListener('click',dlPacket);$('bankFile').addEventListener('change',bankFile);$('dlBank').addEventListener('click',dlBank);
auth.onAuthStateChanged(function(user){
  if(!user){$('gate').textContent='Sign in via the main admin console, then return to this page.';return;}
  db.collection('admins').doc(user.uid).get({source:'server'}).then(function(a){if(!a.exists)throw new Error('Account is not an administrator.');$('gate').hidden=true;$('app').hidden=false;return Promise.all([loadSeller(),reload()]);}).catch(function(e){$('gate').textContent='Could not open this page: '+(e&&e.message||e);});
});
})();
