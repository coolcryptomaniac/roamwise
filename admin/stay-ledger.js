/* Stay ledger: booking codes, guest confirmations and the monthly commission statement.
   Talks only to the Worker's /stay/* routes with the admin's own Firebase ID token.
   Never touches payment settings or moves money. */
(function(){
'use strict';
var base='',last=null;
var el=function(id){return document.getElementById(id)};
var str=function(v){return v==null?'':String(v)};
var h=function(v){return typeof window.esc==='function'?window.esc(str(v)):str(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var inr=function(n){return '₹'+Math.round(Number(n)||0).toLocaleString('en-IN')};
function say(t,bad){var b=el('stayMsg');if(b){b.textContent=t;b.className='alert '+(bad?'bad':'good')}}
async function workerBase(){
  if(base)return base;
  var d=await db.collection('config').doc('app').get(),v=d.exists?(d.data()||{}).WORKER_URL:'';
  var u=new URL(str(v));if(u.protocol!=='https:')throw Error('Worker URL is not set (Partner payments tab).');
  return base=u.href.replace(/\/+$/,'');
}
async function call(path,opts){
  var user=firebase.auth().currentUser;if(!user)throw Error('Sign in again.');
  var token=await user.getIdToken();
  var res=await fetch((await workerBase())+path,Object.assign({headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}},opts||{}));
  var data=await res.json().catch(function(){return{}});
  if(!res.ok)throw Error(data.message||data.error||('HTTP '+res.status));
  return data;
}
function gstReview(){
  var b=el('stayGstReview');if(!b||typeof RWGst==='undefined')return;
  var s=RWGst.reviewStatus(),word={ok:'In date',due_soon:'Review due soon',overdue:'REVIEW OVERDUE'}[s.state];
  b.className='alert '+(s.state==='ok'?'good':'bad');
  b.textContent='GST rules '+s.rulesVersion+': '+word+'. Reviewed '+s.reviewedOn+', next due '+s.dueOn+'. CA sign-off: '+(s.caSigned?'done':'pending')+'. '+s.unverified.length+' rules still need a CA to confirm (run npm run gst:review).';
}
window.rwStayStart=function(){
  gstReview();
  var m=el('stayMonth');if(m&&!m.value)m.value=new Date().toISOString().slice(0,7);
  if(!last)rwStayLoad();
};
window.rwStayLoad=async function(){
  var month=el('stayMonth').value;
  if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(month))return say('Choose a month.',true);
  say('Loading…');
  try{last=await call('/stay/statement?month='+encodeURIComponent(month));render();say('Loaded '+month+'. '+(last.gstRegistered?'GST at '+last.gstPct+'% is added to the fee.':'GST is NOT added: RoamWise is not marked GST-registered (RW_GST_REGISTERED).'))}
  catch(e){say(e.message,true)}
};
function render(){
  if(!last)return;
  var t=last.totals;
  el('stayKpis').innerHTML=[['enquiries',t.enquiries],['completed',t.completed],['gross stays',inr(t.gross)],['commission',inr(t.commission)],['GST on fee',inr(t.gst)],['invoice total',inr(t.total)],['unreported',t.unreported],['conflicts',t.conflicts]]
    .map(function(k){return'<div class="card kpi"><b>'+h(k[1])+'</b><span>'+h(k[0])+'</span></div>'}).join('');
  el('stayPartners').innerHTML=last.partners.map(function(p){
    return'<div class="row"><div class="grow"><strong>'+h(p.partnerId)+'</strong><div class="meta">'+p.enquiries+' enquiries · '+p.completed+' completed · '+p.guestConfirmed+' guest-confirmed · gross '+inr(p.gross)+' · commission '+inr(p.commission)+' + GST '+inr(p.gst)+' = <b>'+inr(p.total)+'</b>'+(p.unreported?' · <span class="tag warn">'+p.unreported+' unreported</span>':'')+(p.conflicts?' · <span class="tag warn">'+p.conflicts+' conflicts</span>':'')+'</div></div><button class="btn small" data-inv="'+h(p.partnerId)+'">Invoice text</button></div>';
  }).join('')||'<div class="empty">No enquiries or stays in this month yet.</div>';
  el('stayRows').innerHTML=(last.rows||[]).map(function(r){
    var flag=last.flags.filter(function(f){return f.code===r.code})[0];
    return'<div class="row"><div class="grow"><strong>'+h(r.code)+'</strong> <span class="tag">'+h(r.status)+'</span>'+(r.guestStayed?' <span class="tag '+(r.guestStayed==='yes'?'good':'warn')+'">guest: '+h(r.guestStayed)+'</span>':'')+(flag?' <span class="tag warn">review</span>':'')+'<div class="meta">'+h(r.partnerId)+(r.amount?' · '+inr(r.amount):'')+(r.checkIn?' · check-in '+h(r.checkIn):'')+(r.note?' · '+h(r.note):'')+'</div></div><button class="btn small" data-settle="'+h(r.code)+'" data-pid="'+h(r.partnerId)+'">Settle</button></div>';
  }).join('')||'<div class="empty">No rows.</div>';
}
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-inv],[data-settle]');if(!b)return;
  if(b.hasAttribute('data-inv'))return invoice(b.getAttribute('data-inv'));
  settleForm(b.getAttribute('data-settle'),b.getAttribute('data-pid'));
});
function invoice(pid){
  var p=last&&last.partners.filter(function(x){return x.partnerId===pid})[0];if(!p)return;
  var txt='RoamWise commission statement — '+last.month+'\nProperty: '+pid+'\nCompleted stays: '+p.completed+'\nStay value reported: '+inr(p.gross)+'\nRoamWise fee: '+inr(p.commission)+'\nGST @ '+last.gstPct+'% on fee: '+inr(p.gst)+'\nTotal due: '+inr(p.total)+'\n\nPay by UPI to the RoamWise business account within 7 days. Booking codes and guest confirmations are available on request.';
  openModal('<div class="modalhead"><div><div class="eyebrow">Copy and send on WhatsApp</div><h2>Statement '+h(pid)+'</h2></div><button class="btn" onclick="closeModal()">Close</button></div><textarea class="input" rows="11" readonly onclick="this.select()">'+h(txt)+'</textarea><p class="meta">GST applies only once RoamWise holds a GST registration. Ask your CA before sending a tax invoice.</p>');
}
function settleForm(code,pid){
  openModal('<div class="modalhead"><div><div class="eyebrow">Record the outcome</div><h2>'+h(code||'New stay')+'</h2></div><button class="btn" onclick="closeModal()">Close</button></div><div class="fields">'
    +(code?'':'<div class="field"><label>Property id</label><input id="stPid" class="input" placeholder="e.g. milan-heights"></div><div class="field"><label>Code (optional)</label><input id="stCode" class="input" placeholder="RW-XXXXXX"></div>')
    +'<div class="field"><label>Outcome</label><select id="stStatus" class="input"><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No-show</option><option value="disputed">Disputed</option></select></div>'
    +'<div class="field"><label>Stay value (₹)</label><input id="stAmount" class="input" type="number" min="0" inputmode="numeric"></div>'
    +'<div class="field"><label>Check-in date</label><input id="stCheckIn" class="input" type="date"></div>'
    +'<div class="field"><label>Commission % (7 free, 5 paid)</label><input id="stPct" class="input" type="number" min="0" max="30" step="0.5" value="7"></div>'
    +'<div class="field full"><label>Note</label><input id="stNote" class="input" maxlength="300"></div></div>'
    +'<button class="btn primary" style="width:100%;margin-top:12px" id="stSave">Save</button>');
  el('stSave').onclick=async function(){
    var c=code||str(el('stCode').value).trim().toUpperCase(),p=pid||str(el('stPid').value).trim();
    if(!c){c='RW-M'+Math.random().toString(36).replace(/[^a-z0-9]/g,'').toUpperCase().padEnd(5,'X').slice(0,5)}
    var body={code:c,status:el('stStatus').value,partnerId:p,commissionPct:Number(el('stPct').value),note:el('stNote').value.trim()};
    if(el('stAmount').value!=='')body.amount=Number(el('stAmount').value);
    if(el('stCheckIn').value)body.checkIn=el('stCheckIn').value;
    try{await call('/stay/settle',{method:'POST',body:JSON.stringify(body)});closeModal();say('Saved '+c+'.');rwStayLoad()}
    catch(e){say(e.message,true)}
  };
}
window.rwStayAdd=function(){settleForm('','')};
})();
