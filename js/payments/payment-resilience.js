// @ts-nocheck
// Zero-dependency payment launcher and privacy-safe checkout diagnostics.
(function(){
  'use strict';
  var openedAt=0,selected=false,completed=false,session='pay_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  function clean(v,n){return String(v==null?'':v).replace(/[^A-Za-z0-9_.:-]/g,'_').slice(0,n||60)}
  function save(row){try{var a=JSON.parse(localStorage.getItem('rw_payment_trace_v1')||'[]');a.push(row);localStorage.setItem('rw_payment_trace_v1',JSON.stringify(a.slice(-30)))}catch(e){}}
  function send(row){try{var u=window.user||(window.firebase&&firebase.auth&&firebase.auth().currentUser);if(!u||typeof u.getIdToken!=='function'||typeof window.rwApi!=='function')return;var url=rwApi('payment-events');if(!url)return;u.getIdToken().then(function(token){return fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(row),keepalive:true})}).catch(function(){})}catch(e){}}
  window.rwPaymentTrace=function(stage,details){details=details||{};var row={stage:clean(stage,40),session:session,planId:clean(details.planId,50),code:clean(details.code,80),path:clean(location.pathname,120),at:new Date().toISOString()};if(stage==='plan_selected')selected=true;if(stage==='paid')completed=true;save(row);send(row);try{if(typeof track==='function')track('payment_'+row.stage)}catch(e){}};
  window.rwOpenPaySafely=function(event){
    if(event&&event.preventDefault)event.preventDefault();openedAt=Date.now();selected=false;completed=false;
    var overlay=document.getElementById('payOverlay');if(overlay){overlay.classList.add('open');document.body.style.overflow='hidden'}
    rwPaymentTrace('ui_open',{});
    setTimeout(function(){try{if(typeof window.openPay==='function')window.openPay();else throw Error('module_unavailable')}catch(e){rwPaymentTrace('ui_error',{code:e&&e.message||'open_failed'});var p=document.getElementById('planPicker');if(p)p.innerHTML='<div class="payment-recovery"><b>Checkout needs a quick refresh.</b><span>Your payment has not started and nothing was charged.</span><button type="button" onclick="location.reload()">Reload checkout</button><a href="mailto:founder@roamwise.co.in?subject=RoamWise%20checkout%20help">Get payment help</a></div>'; }},0);
    return false;
  };
  window.addEventListener('error',function(e){var o=document.getElementById('payOverlay');if(o&&o.classList.contains('open'))rwPaymentTrace('ui_error',{code:(e&&e.message)||'script_error'})});
  window.addEventListener('pagehide',function(){if(openedAt&&selected&&!completed)rwPaymentTrace('checkout_left',{code:'before_paid'})});
})();
