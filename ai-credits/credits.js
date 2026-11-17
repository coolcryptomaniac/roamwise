(function(){
'use strict';
var API='https://roamwise-api.founder-f53.workers.dev/ai/credits',auth,user=null,epoch=0,catalogue=null,quote=null,busy=false;
var $=function(id){return document.getElementById(id);},money=function(n){return '₹'+(n/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});};
var errors={sign_in_required:'Sign in with your RoamWise account.',verified_account_required:'Verify your email or use your verified phone account.',credits_unavailable:'Paid AI is not available yet. Your free tools still work.',invalid_pack_or_terms:'Choose a listed pack and accept the current terms.',phone_required:'Enter a valid 10-digit Indian mobile number.',pending_order:'An earlier payment is pending. Check it before starting another.',insufficient_credits:'Your balance is below this request’s price ceiling. Choose a cheaper model or add credits.',quote_changed:'Your question or model changed. Please get a fresh quote.',quote_expired:'The quote expired. Get a fresh quote.',quote_not_found:'Get a new quote before using paid AI.',request_in_progress:'This request is already running. Refresh shortly; do not submit it again.',account_on_hold:'Paid usage is paused while a payment or refund is reviewed. Contact support with your order ID.',slow_down:'Please wait a minute before trying again.',paid_pool_busy:'Paid AI capacity is temporarily full. No credits were charged.',provider_unavailable:'The model could not answer. No credits were charged.',payment_mismatch:'The payment details could not be verified. Keep your order ID and contact support.',refund_mismatch:'The refund details need review. Contact support with your order ID.',order_not_found:'This order does not belong to the signed-in account.',environment_mismatch:'This order was created in another payment environment. Contact support.',interrupted:'This request was interrupted. Its reserved credits were returned.'};
function say(t){$('notice').textContent=t;}
function elem(tag,text){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
function still(uid,revision){return user&&user.uid===uid&&epoch===revision;}
async function api(path,body,publicCall){
  var uid=user&&user.uid,revision=epoch,headers={};
  if(!publicCall){if(!user)throw Error(errors.sign_in_required);headers.Authorization='Bearer '+await user.getIdToken();if(!still(uid,revision))throw Error('Account changed. Try again.');}
  var opts={method:body===undefined?'GET':'POST',headers:headers,credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(35000)};
  if(body!==undefined){headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  var r=await fetch(API+path,opts),d=await r.json();if(!publicCall&&!still(uid,revision))throw Error('Account changed. Try again.');
  if(!r.ok||d.error){var err=Error(errors[d.error]||'The request could not be completed. Please refresh or contact support.');err.code=d.error;throw err;}return d;
}
function controls(){
  document.querySelectorAll('[data-pack]').forEach(function(b){b.disabled=busy||!user||!catalogue||!catalogue.enabled;});
  $('quote').disabled=busy||!user||!catalogue||!catalogue.enabled;$('run').disabled=busy||!quote;
  $('refresh').disabled=busy||!user;$('sign-in').hidden=!!user;
  $('prompt').disabled=busy;$('model').disabled=busy;
}
function invalidate(){quote=null;$('run').textContent='Confirm paid answer';$('quote-info').textContent='Get a fresh price ceiling for this question and model.';controls();}
function paintCatalogue(d){
  catalogue=d;$('packs').replaceChildren();
  d.packs.forEach(function(p){var card=elem('article');card.className='pack';card.append(elem('h3','₹'+p.amountPaise/100),elem('p',p.credits.toLocaleString('en-IN')+' AI credits'));var b=elem('button','Add ₹'+p.amountPaise/100);b.dataset.pack=p.id;b.onclick=function(){buy(p);};card.append(b);$('packs').append(card);});
  $('model').replaceChildren();d.models.forEach(function(m){var o=elem('option',m.label+(m.available?'':' · not enabled'));o.value=m.id;o.disabled=!m.available;$('model').append(o);});
  $('rate-note').textContent='Billing conversion: ₹'+d.billingInrPerUsd+' per US dollar. RoamWise service fee: '+d.servicePercent+'% of the converted model tariff plus any gateway fee, minimum ₹0.01. Components round up to whole credits. Failed requests cost you zero; successful requests never exceed the confirmed ceiling.';
  var table=elem('table');table.className='rates';var tr=elem('tr');['Model','Input / 1M tokens','Output / 1M tokens','Gateway'].forEach(function(t){tr.append(elem('th',t));});table.append(tr);
  d.models.forEach(function(m){var row=elem('tr');[m.label,'$'+m.inputUsdPerMillion,'$'+m.outputUsdPerMillion,m.gatewayPercent+'%'].forEach(function(t){row.append(elem('td',t));});table.append(row);});$('rates').replaceChildren(table);
  say(d.enabled?(d.environment==='sandbox'?'Sandbox checkout · test payments only.':'Choose a pack or use your existing balance.'):'Credit packs are being prepared. Checkout and paid usage are not open yet.');controls();
}
async function balance(){
  if(!user)return;var d=await api('/balance');$('balance').textContent=money(d.balancePaise);$('auth-status').textContent=d.accountHold?'Account under payment review.':d.heldPaise?money(d.heldPaise)+' temporarily reserved for requests.':'Your RoamWise AI balance · no automatic top-up';
  $('orders').replaceChildren();if(!d.orders.length)$('orders').append(elem('p','No AI credit orders yet.'));
  d.orders.forEach(function(o){var row=elem('div');row.className='order';row.append(elem('p',money(o.amountPaise)+' · '+o.status+'\n'+o.id));var b=elem('button','Check payment');b.className='secondary';b.onclick=function(){checkOrder(o.id);};row.append(b);$('orders').append(row);});
}
async function checkOrder(id){
  if(busy)return;busy=true;controls();say('Checking this order with the payment provider…');
  try{var d=await api('/orders/'+encodeURIComponent(id));say('Order: '+d.status+'. Your balance reflects verified payments and refunds.');await balance();}catch(e){say(e.message);}finally{busy=false;controls();}
}
var cashfreeLoading;
function cashfree(){
  if(window.Cashfree)return Promise.resolve();if(cashfreeLoading)return cashfreeLoading;
  cashfreeLoading=new Promise(function(resolve,reject){var s=document.createElement('script');s.src='https://sdk.cashfree.com/js/v3/cashfree.js';s.onload=resolve;s.onerror=function(){cashfreeLoading=null;reject(Error('Checkout could not load. Check your existing order before paying again.'));};document.head.append(s);});return cashfreeLoading;
}
async function buy(pack){
  if(busy)return;if(!$('agree').checked){say('Read the AI credit terms and tick the agreement before checkout.');return;}
  var uid=user&&user.uid,revision=epoch;busy=true;controls();say('Preparing secure checkout for '+money(pack.amountPaise)+'…');
  try{
    var d=await api('/order',{packId:pack.id,phone:$('phone').value,termsVersion:catalogue.rateVersion});
    if(d.checkStatus){busy=false;return await checkOrder(d.orderId);}
    await cashfree();if(!still(uid,revision))throw Error('Account changed. Checkout cancelled.');
    await window.Cashfree({mode:d.environment==='production'?'production':'sandbox'}).checkout({paymentSessionId:d.paymentSessionId,redirectTarget:'_self'});
    say('Checkout returned. Check the order below to confirm payment.');await balance();
  }catch(e){say(e.message);try{await balance();}catch(_){} }finally{busy=false;controls();}
}
$('quote').onclick=async function(){
  if(busy)return;busy=true;quote=null;controls();
  try{var prompt=$('prompt').value.trim(),modelId=$('model').value;if(!prompt)throw Error('Write your question first.');var d=await api('/quote',{prompt:prompt,modelId:modelId});quote={id:d.quote.id,prompt:prompt,modelId:modelId,price:d.quote.price};var p=quote.price;
    $('quote-info').textContent='Maximum '+money(p.totalPaise)+' · model tariff '+money(p.modelPaise)+' + gateway '+money(p.gatewayPaise)+' + RoamWise service '+money(p.servicePaise)+'. Final charge uses reported tokens and may be lower. Quote expires in 5 minutes.';$('run').textContent='Ask · up to '+money(p.totalPaise);
  }catch(e){say(e.message);}finally{busy=false;controls();}
};
$('run').onclick=async function(){
  if(busy||!quote)return;var q=quote;busy=true;controls();$('answer').textContent='Ailon is thinking…';$('receipt').textContent='';
  try{var d=await api('/run',{quoteId:q.id,prompt:q.prompt,modelId:q.modelId});$('answer').textContent=d.text||'No answer returned.';$('receipt').textContent='Charged '+money(d.chargedPaise)+' · balance '+money(d.balancePaise)+(d.receipt?' · '+d.receipt.inputTokens+' input / '+d.receipt.outputTokens+' output tokens.':' · no verified usage charge.');quote=null;await balance();}
  catch(e){var retry=!e.code||e.code==='request_in_progress';$('answer').textContent=retry?'The result is not confirmed yet. Use “Check same answer” to recover this request without another charge.':e.message;quote=retry?q:null;if(retry)$('run').textContent='Check same answer';try{await balance();}catch(_){} }finally{busy=false;controls();}
};
$('prompt').addEventListener('input',invalidate);$('model').addEventListener('change',invalidate);
$('refresh').onclick=function(){balance().catch(function(e){say(e.message);});};
$('sign-in').onclick=async function(){try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}catch(_){say('Sign in on the RoamWise home page, then return here.');}};
async function init(){
  controls();
  // Public Firebase configuration; no provider secret is stored in this page.
  if(!firebase.apps.length)firebase.initializeApp({apiKey:'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',appId:'1:299014744987:web:d5c316743e6d7a10904f3e'});
  auth=firebase.auth();auth.onAuthStateChanged(function(u){epoch++;user=u&&!u.isAnonymous?u:null;quote=null;$('answer').textContent='';$('receipt').textContent='';$('prompt').value='';$('phone').value='';$('agree').checked=false;$('auth-status').textContent=user?'Your RoamWise account':'Use your RoamWise account to keep purchases together.';
    $('balance').textContent=user?'Loading…':'Sign in to view';$('orders').replaceChildren(elem('p','Sign in to see your orders.'));controls();
    if(user)balance().then(function(){var id=new URLSearchParams(location.search).get('order_id');if(/^ai_[a-f0-9]{32}_[a-f0-9]{8}$/.test(id||''))return checkOrder(id);}).catch(function(e){say(e.message);});
  });
  try{paintCatalogue(await api('/catalogue',undefined,true));}catch(_){
    // Show the pack ladder for review, but keep every purchase action disabled.
    paintCatalogue({enabled:false,packs:[10,20,50,100,250,500,1000].map(function(n){return {id:'inr'+n,amountPaise:n*100,credits:n*100};}),models:[],billingInrPerUsd:90,servicePercent:25});
    say('The credit service is unavailable. No payment can be started.');
  }
}
init().catch(function(){say('Sign-in could not load. No payment can be started.');controls();});
})();
