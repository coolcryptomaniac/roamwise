/* Account payment history is read-only. Only the authenticated Worker can verify
   Cashfree and grant access; this page never initiates a charge or writes Pro. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var FB={apiKey:'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',appId:'1:299014744987:web:d5c316743e6d7a10904f3e'};
var auth,db,current=null,epoch=0,orders=[],claims=[],workerUrl='';
var ordersRead=false,claimsRead=false,historyTruncated=false;
function text(node,value){node.textContent=String(value == null ? '' : value);return node;}
function element(tag,className,value){var x=document.createElement(tag);if(className)x.className=className;if(value != null)text(x,value);return x;}
function safeWorker(value){
  try{var u=new URL(String(value||''));
    if(u.protocol!=='https:'||!u.hostname||u.username||u.password||u.search||u.hash||u.port||u.hostname==='localhost')return '';
    return u.origin+u.pathname.replace(/\/+$/,'');
  }catch(_){return '';}
}
function dateLabel(value){
  if(!value)return 'Date unavailable';
  var d=value&&typeof value.toDate==='function'?value.toDate():new Date(value);
  return Number.isFinite(d.getTime())?d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Date unavailable';
}
function timestamp(value){if(value&&typeof value.toMillis==='function')return value.toMillis();var n=Date.parse(String(value||''));return Number.isFinite(n)?n:0;}
function money(value){var n=Number(value);return value!==''&&value!=null&&Number.isFinite(n)&&n>=0?'₹'+n.toLocaleString('en-IN',{maximumFractionDigits:2}):'Amount unavailable';}
function maskUtr(value){var s=String(value||'').replace(/[^0-9A-Za-z]/g,'');return s.length>4?'•••• '+s.slice(-4):'Reference unavailable';}
function statusBadge(label,tone){return element('span','status '+(tone||''),label);}
function line(label,value){var x=element('span');x.append(element('strong','',label+' '),document.createTextNode(String(value)));return x;}
function signedIn(uid,revision){return !!current&&current.uid===uid&&epoch===revision&&auth.currentUser&&auth.currentUser.uid===uid;}
function showAuth(message,error){var box=$('auth-state');box.className='panel auth-state'+(error?' error':'');box.replaceChildren(element('span','',message));if(error){var a=element('a','','Sign in at RoamWise →');a.href='../';box.append(a);}}
function reset(){orders=[];claims=[];workerUrl='';ordersRead=false;claimsRead=false;historyTruncated=false;$('dashboard').classList.add('hidden');$('environment').classList.add('hidden');$('orders').replaceChildren(element('div','empty','Loading your orders…'));$('claims').replaceChildren(element('div','empty','Loading your claims…'));$('purchase-guidance').textContent='Checking your previous payment attempts…';}
function guidance(){
  if(!ordersRead||!claimsRead){$('purchase-guidance').textContent='Payment history is incomplete or unavailable. Do not attempt another payment until the original debit is checked.';return;}
  var uncertain=orders.some(function(o){return !o.fulfilled&&!['FAILED','CANCELLED','EXPIRED','TERMINATED'].includes(String(o.status||'').toUpperCase());});
  var claimPending=claims.some(function(c){return String(c.status||'').toLowerCase()==='pending';});
  $('purchase-guidance').textContent=uncertain?'An earlier Cashfree order is unresolved. Check its status below before attempting any other payment.':claimPending?'You have a manual UPI claim awaiting review. Keep the original bank receipt; do not pay again.':historyTruncated?'Only 75 records per payment type are loaded. Older payments may not be shown; check your bank and contact support before another payment.':'No unresolved orders or claims appear in the records loaded for this account. Check your bank before making another payment.';
}
function renderPlan(userData){
  var pro=userData&&userData.pro===true;
  var until=userData&&userData.proUntil;
  var ms=until==null||until===''?0:until&&typeof until.toMillis==='function'?until.toMillis():Number(until);
  if(!Number.isFinite(ms))ms=Date.parse(String(until||''));
  var lifetime=pro&&(until==null||until===''||until===0);
  var active=pro&&(lifetime||(Number.isFinite(ms)&&ms>Date.now()));
  var tier=String(userData&&userData.proTier||'Pro').replace(/[_-]/g,' ');
  $('plan-value').textContent=active?tier+' · '+(lifetime?'Lifetime':'Active'):'Free access';
  $('plan-detail').textContent=active?(lifetime?'Lifetime access is recorded on your RoamWise account.':'Recorded access ends '+dateLabel(new Date(ms))+'.'):'No active paid entitlement is recorded for this account. If you paid, check your order below.';
}
function renderOrders(){
  var target=$('orders');target.replaceChildren();
  if(!orders.length){target.append(element('div','empty','No Cashfree orders found in the loaded records for this account.'));guidance();return;}
  orders.slice().sort(function(a,b){return timestamp(b.createdAt)-timestamp(a.createdAt);}).forEach(function(o){
    var status=String(o.status||'UNKNOWN').toUpperCase();var paid=status==='PAID'&&o.fulfilled===true;
    var pending=!paid&&!['FAILED','CANCELLED','EXPIRED','TERMINATED'].includes(status);
    var card=element('article','record');var head=element('div','record-top');
    head.append(element('div','record-title',String(o.planId||'One-time RoamWise purchase').replace(/[_-]/g,' ')),statusBadge(paid?'PAID · VERIFIED':pending?'CHECK REQUIRED':status,paid?'good':pending?'warn':'bad'));card.append(head);
    var meta=element('div','record-meta');meta.append(line('Amount',money(o.amountINR)),line('Created',dateLabel(o.createdAt)),line('Order',o.id));card.append(meta);
    var note=element('div','record-note'+(pending?' important':''),paid?'Cashfree payment and account fulfillment are recorded.':pending?'Payment is not confirmed here. Check this existing order before any new payment.':'This order is not marked as paid. If your bank was debited, contact support with the order ID.');card.append(note);
    if(pending){var actions=element('div','record-actions');var button=element('button','button secondary','Check this order');button.type='button';button.addEventListener('click',function(){verify(o,button,note);});actions.append(button);card.append(actions);}
    target.append(card);
  });guidance();
}
function renderClaims(){
  var target=$('claims');target.replaceChildren();
  if(!claims.length){target.append(element('div','empty','No manual UPI claims found in the loaded records for this account.'));guidance();return;}
  claims.slice().sort(function(a,b){return timestamp(b.created)-timestamp(a.created);}).forEach(function(c){
    var state=String(c.status||'pending').toLowerCase();var approved=['approved','verified','paid'].includes(state);
    var card=element('article','record');var head=element('div','record-top');head.append(element('div','record-title',String(c.planLabel||c.plan||'Manual UPI claim')),statusBadge(state.toUpperCase(),approved?'good':state==='pending'?'warn':'bad'));card.append(head);
    var meta=element('div','record-meta');meta.append(line('Claim amount',money(c.amount)),line('UPI reference',maskUtr(c.utr)),line('Submitted',dateLabel(c.created)));card.append(meta);
    card.append(element('div','record-note',approved?'An administrator marked this claim approved. Your actual access is shown above.':state==='pending'?'Under manual review. A submitted UTR is not bank-verified payment proof.':'Contact support if your bank statement shows a completed debit.'));target.append(card);
  });guidance();
}
async function verify(order,button,note){
  var uid=current&&current.uid,revision=epoch;
  if(!uid||!signedIn(uid,revision))return;
  if(!workerUrl){text(note,'Payment status service is unavailable. Keep your order ID and contact support; do not pay again.');return;}
  button.disabled=true;text(button,'Checking existing order…');
  try{
    var token=await current.getIdToken();if(!signedIn(uid,revision))return;
    var controller=new AbortController(),timeout=setTimeout(function(){controller.abort();},12000),response;
    try{response=await fetch(workerUrl+'/cashfree/order/'+encodeURIComponent(order.id)+'/status',{method:'GET',headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',signal:controller.signal});}
    finally{clearTimeout(timeout);}
    if(!signedIn(uid,revision))return;
    var result=await response.json().catch(function(){return {};});
    if(!response.ok)throw Error(result.message||'Status could not be confirmed.');
    if(result.order_status==='PAID'&&result.entitlement&&result.entitlement.persisted===true){
      text(note,'Cashfree confirmed this payment and saved account access. Refreshing records…');
      await loadAccount(uid,revision);
    }else{text(note,'This order is '+String(result.order_status||'unconfirmed')+'. Do not pay again while the result is uncertain.');}
  }catch(e){if(signedIn(uid,revision))text(note,'Could not verify this order: '+String(e&&e.message||'connection error')+'. Keep the order ID; do not pay again.');}
  finally{if(signedIn(uid,revision)){button.disabled=false;text(button,'Check this order');}}
}
async function loadAccount(uid,revision){
  if(!signedIn(uid,revision))return;
  ordersRead=false;claimsRead=false;historyTruncated=false;
  var results=await Promise.allSettled([
    db.doc('users/'+uid).get(),
    db.collection('cashfreeOrders').where('uid','==',uid).limit(75).get(),
    db.collection('claims').where('uid','==',uid).limit(75).get(),
    db.doc('config/app').get()
  ]);
  if(!signedIn(uid,revision))return;
  if(results[0].status==='fulfilled')renderPlan(results[0].value.exists?results[0].value.data():{});
  else{$('plan-value').textContent='Status unavailable';$('plan-detail').textContent='Could not read your plan. No payment status has been assumed.';}
  ordersRead=results[1].status==='fulfilled';claimsRead=results[2].status==='fulfilled';
  if(ordersRead){
    historyTruncated=results[1].value.size===75;
    orders=results[1].value.docs.map(function(doc){return Object.assign({id:doc.id},doc.data());}).filter(function(r){return r.uid===uid;});renderOrders();
  }else{$('orders').replaceChildren(element('div','empty','Could not securely load Cashfree orders. Do not pay again until your records are available.'));}
  if(claimsRead){
    historyTruncated=historyTruncated||results[2].value.size===75;
    claims=results[2].value.docs.map(function(doc){return Object.assign({id:doc.id},doc.data());}).filter(function(r){return r.uid===uid;});renderClaims();
  }else{$('claims').replaceChildren(element('div','empty','Manual UPI claims could not be loaded. Keep your UTR and contact support.'));}
  guidance();
  if(results[3].status==='fulfilled'&&results[3].value.exists){
    var cfg=results[3].value.data();workerUrl=safeWorker(cfg.WORKER_URL);
    var env=String(cfg.CASHFREE_ENVIRONMENT||'sandbox').toLowerCase();
    if(env==='sandbox'){$('environment').textContent='SANDBOX · TEST ORDERS';$('environment').classList.remove('hidden');}
  }
}
$('refresh').addEventListener('click',function(){if(!current)return;this.disabled=true;var b=this,uid=current.uid,revision=epoch;loadAccount(uid,revision).finally(function(){if(signedIn(uid,revision))b.disabled=false;});});
try{
  if(typeof firebase==='undefined')throw Error('Firebase is unavailable on this connection.');
  if(!firebase.apps.length)firebase.initializeApp(FB);
  auth=firebase.auth();db=firebase.firestore();
  auth.onAuthStateChanged(function(u){
    epoch++;current=u||null;reset();var revision=epoch;
    if(!u){showAuth('Sign in to RoamWise to see your private payment history.',true);return;}
    $('auth-state').classList.add('hidden');$('dashboard').classList.remove('hidden');loadAccount(u.uid,revision).catch(function(){if(signedIn(u.uid,revision))$('purchase-guidance').textContent='Could not load payment records. Do not start another payment until your account is checked.';});
  },function(){showAuth('Authentication could not be checked. No payment details are available.',true);});
}catch(e){showAuth('Payment history cannot load right now. Please return to RoamWise and sign in.',true);}
})();
