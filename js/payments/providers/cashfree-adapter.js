// @ts-nocheck
/* CASHFREE PAYMENT ADAPTER — js/payments/providers/cashfree-adapter.js
   ============================================================================
   Implements the RWPaymentGateway provider interface (js/payments/
   gateway-adapter.js — read that file first) for Cashfree, following the
   exact pattern manual-upi-adapter.js established. NOT wired into
   production by default: RW_PAYMENT_PROVIDER stays 'manual_upi' until an
   admin sets config/app.PAYMENT_PROVIDER to 'cashfree' in Firestore (see
   CASHFREE-INTEGRATION-SETUP.md) — registering here only makes 'cashfree' a
   *selectable* provider id, same as every other adapter.

   SECURITY: this file never sees a Cashfree secret key. createOrder() calls
   this app's OWN Worker endpoint (POST /cashfree/order, via rwApi() — see
   rw-config.js and worker/handlers/cashfree.js) to get back a
   payment_session_id; only THAT id is ever handled here. Order creation
   (the step that needs the App ID/Secret Key) happens entirely server-side.

   ASYNC NOTE: unlike manual UPI (no network call), Cashfree's real order
   creation is a network round trip. plan-picker.js's pickPlan() calls
   createOrder() synchronously and expects a plain order object back (it
   can't be changed — see PAYMENT-GATEWAY-ARCHITECTURE.md's "do not touch
   plan-picker.js" rule), so createOrder() here returns an immediately-usable
   order "shell" synchronously and resolves the actual Cashfree session in
   the background; openCheckout() (called later, when the user taps a pay
   button) awaits that same in-flight promise before presenting checkout.
   This adapter does not implement buildQR() — RWPaymentGateway.buildQR()
   already no-ops safely for any adapter that omits it (gateway-adapter.js),
   and Cashfree's own hosted checkout has no QR step in this integration. */

var CF_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';
var _cfOrderPromise = null;
var _cfSdkPromise = null;
var _cfPhoneOverride = '';
var CF_PENDING_KEY = 'rw_cashfree_pending_v2';

function _cfLoadSdk(){
  if(typeof Cashfree === 'function') return Promise.resolve();
  if(_cfSdkPromise) return _cfSdkPromise;
  _cfSdkPromise = new Promise(function(resolve, reject){
    var s = document.createElement('script');
    s.src = CF_SDK_URL;
    s.async = true;
    s.setAttribute('data-rw-cashfree-sdk','1');
    var finished=false;
    var timer=setTimeout(function(){
      if(finished)return;finished=true;_cfSdkPromise=null;
      reject(new Error('Cashfree took too long to load. Check your connection or use direct UPI.'));
    },12000);
    s.onload = function(){
      if(finished)return;finished=true;if(typeof clearTimeout==='function')clearTimeout(timer);
      if(typeof Cashfree==='function')resolve();
      else{_cfSdkPromise=null;reject(new Error('Cashfree loaded incompletely. Refresh or use direct UPI.'));}
    };
    s.onerror = function(){
      if(finished)return;finished=true;if(typeof clearTimeout==='function')clearTimeout(timer);
      _cfSdkPromise = null;reject(new Error('Could not load the Cashfree checkout script.'));
    };
    document.head.appendChild(s);
  });
  return _cfSdkPromise;
}

function _cfUi(state,message){
  try{if(typeof rwSetCashfreeState==='function')rwSetCashfreeState(state,message);}catch(e){/* optional UI */}
}
function _cfStorePending(order){
  try{localStorage.setItem(CF_PENDING_KEY,JSON.stringify({
    orderId:order.orderId,planId:order.planId,amountINR:order.amountINR,
    createdAt:Date.now(),environment:order.environment
  }));}catch(e){/* private browsing/storage denial must not block payment */}
}
function _cfReadPending(){
  try{
    var pending=JSON.parse(localStorage.getItem(CF_PENDING_KEY)||'null');
    if(!pending||!pending.orderId||Date.now()-Number(pending.createdAt||0)>864e5){localStorage.removeItem(CF_PENDING_KEY);return null;}
    return pending;
  }catch(e){return null;}
}
function _cfClearPending(){try{localStorage.removeItem(CF_PENDING_KEY);}catch(e){/* optional */}}
function _cfReturnUrl(orderId){
  try{
    var u=new URL(window.location.href);
    u.hash='';u.search='';
    u.searchParams.set('rw_payment','return');
    u.searchParams.set('order_id',orderId);
    return u.href;
  }catch(e){return undefined;}
}

/* Best-effort current-user details for Cashfree's customer_details block.
   Resolved at call time from the same `user` global every other payments
   file in this app already reads (app.js's Firebase Auth state) — never
   invents a phone number when one isn't on the account (see
   worker/handlers/cashfree.js, which rejects a missing/invalid phone rather
   than accepting a fake one). */
function _cfCustomer(){
  var u = (typeof user !== 'undefined') ? user : null;
  var saved='';try{saved=localStorage.getItem('rw_checkout_phone')||'';}catch(e){ /* storage may be blocked */ }
  return {
    id: (u && u.uid) || ('guest_' + Date.now()),
    email: (u && u.email) || '',
    phone: _cfPhoneOverride || (u && u.phoneNumber) || saved
  };
}
function _cfValidPhone(value){return /^\+?\d{7,15}$/.test(String(value||'').replace(/[\s()-]/g,''));}
function _cfToken(){
  var u=(typeof user!=='undefined')?user:null;
  if(!u||!u.uid||typeof u.getIdToken!=='function')return Promise.reject(new Error('Sign in again before payment.'));
  return u.getIdToken();
}
function _cfBeginOrder(shell){
  var endpoint = (typeof rwApi === 'function') ? rwApi('cashfree/order') : null;
  if(!endpoint){
    _cfOrderPromise = Promise.reject(new Error('Cashfree checkout is not configured on this deployment yet.'));
    _cfOrderPromise.catch(function(){});return shell;
  }
  var customer=_cfCustomer();
  if(!customer.id||customer.id.indexOf('guest_')===0){shell.needsAuth=true;_cfOrderPromise=null;return shell;}
  if(!_cfValidPhone(customer.phone)){shell.needsPhone=true;_cfOrderPromise=null;return shell;}
  shell.needsPhone=false;shell.needsAuth=false;
  _cfOrderPromise = _cfToken().then(function(token){return fetch(endpoint, {
    method: 'POST',headers: {'Content-Type': 'application/json','Authorization':'Bearer '+token},
    body: JSON.stringify({amount: shell.amountINR, customer: customer, meta: {planId: shell.planId, tierId: shell.tierId, label: shell.label}})
  });}).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(d){if(!r.ok) throw new Error((d&&d.message)||'Cashfree order creation failed.');return d;});
  }).then(function(d){
    if(!d||!d.payment_session_id)throw new Error('Cashfree did not return a payment session.');
    shell.paymentSessionId=d.payment_session_id;shell.orderId=d.order_id;shell.environment=d.environment||'sandbox';shell.ready=true;return shell;
  });
  _cfOrderPromise.catch(function(){});return shell;
}

/* Polls GET /cashfree/order/:id/status a few times (Cashfree's own status
   can lag a couple seconds behind the checkout SDK's promise resolving —
   see the comment on handleCashfreeOrderStatus in worker/handlers/
   cashfree.js for why this app checks rather than trusting the SDK alone).
   Resolves true only on a confirmed 'PAID' status. */
function _cfConfirmPaid(orderId, attemptsLeft){
  var endpoint = (typeof rwApi === 'function') ? rwApi('cashfree/order/' + encodeURIComponent(orderId) + '/status') : null;
  if(!endpoint) return Promise.resolve(false);
  return _cfToken().then(function(token){return fetch(endpoint,{headers:{'Authorization':'Bearer '+token}});}).then(function(r){ return r.json().catch(function(){ return {}; }); }).then(function(d){
    if(d && d.order_status === 'PAID' && d.entitlement && d.entitlement.persisted===true) return d;
    if(attemptsLeft > 0) return new Promise(function(resolve){ setTimeout(resolve, 1500); }).then(function(){ return _cfConfirmPaid(orderId, attemptsLeft - 1); });
    return false;
  }).catch(function(){ return false; });
}

function _cfGrantConfirmed(order){
  try{ track('cashfree_paid'); }catch(e){ /* analytics best-effort */ }
  grantPurchase(order.orderId || 'cashfree', 'cashfree', order.planId);
  _cfClearPending();
  _cfUi('success','Payment confirmed. Your plan is active.');
  /* Keep the existing shared Founder seat counter behaviour. This write is
     best-effort and never controls entitlement. */
  if(order.planId === 'founder' && typeof db !== 'undefined' && db){
    db.collection('pricing').doc('founder').update({
      count: firebase.firestore.FieldValue.increment(1)
    }).catch(function(){});
  }
}

function _cfCleanReturnQuery(){
  try{
    var u=new URL(window.location.href);
    if(!u.searchParams.has('rw_payment'))return;
    u.searchParams.delete('rw_payment');u.searchParams.delete('order_id');
    window.history.replaceState({},document.title,u.pathname+(u.search||'')+(u.hash||''));
  }catch(e){/* cosmetic only */}
}

/* Full-page hosted checkout is the most consistent presentation across
   Safari, Firefox, Chrome and WebViews. After Cashfree returns, restore the
   saved order and ask the Worker for the authoritative status. */
function rwResumeCashfreePayment(attempt){
  var pending=_cfReadPending();
  if(!pending)return Promise.resolve(false);
  attempt=Number(attempt||0);
  if((typeof user==='undefined'||!user||typeof user.getIdToken!=='function')&&attempt<30){
    return new Promise(function(resolve){setTimeout(resolve,400);}).then(function(){return rwResumeCashfreePayment(attempt+1);});
  }
  if(typeof user==='undefined'||!user)return Promise.resolve(false);
  _cfUi('busy','Confirming your Cashfree payment\u2026');
  return _cfConfirmPaid(pending.orderId,4).then(function(confirmation){
    _cfCleanReturnQuery();
    if(confirmation){_cfGrantConfirmed(pending);return true;}
    _cfUi('ready','Payment is not confirmed yet. You can retry safely or check My Payments.');
    return false;
  });
}

var CashfreeAdapter = {
  id: 'cashfree',

  createOrder: function(amount, meta){
    meta = meta || {};
    var shell = {amountINR: amount, planId: meta.planId, tierId: meta.tierId, label: meta.label, category: meta.category, provider: 'cashfree', ready: false};
    return _cfBeginOrder(shell);
  },

  setCustomerPhone: function(order, phone){
    var cleaned=String(phone||'').replace(/[\s()-]/g,'');
    if(!_cfValidPhone(cleaned))return false;
    _cfPhoneOverride=cleaned;try{localStorage.setItem('rw_checkout_phone',cleaned);}catch(e){ /* storage may be blocked */ }
    if(order&&order.needsPhone)_cfBeginOrder(order);
    return true;
  },

  /* Use Cashfree's full-page hosted checkout. A nested provider modal inside
     RoamWise's already-scrollable modal was the source of clipped/sandwiched
     controls on iPhone and cramped desktop windows. `_self` is Cashfree's
     documented default and works consistently across modern browsers. */
  openCheckout: function(order, method){
    if(!_cfOrderPromise&&order&&!order.needsPhone)_cfBeginOrder(order);
    if(!_cfOrderPromise){
      var missing=order&&order.needsPhone?'Add a valid mobile number for the Cashfree receipt.':'Sign in again, then reopen checkout.';
      showToast(missing);_cfUi('error',missing);return Promise.resolve(false);
    }
    _cfUi('busy','Preparing Cashfree’s secure payment page\u2026');
    var flow=_cfOrderPromise.then(function(ready){
      return _cfLoadSdk().then(function(){ return ready; });
    }).then(function(ready){
      _cfStorePending(ready);
      var cashfree = Cashfree({mode: ready.environment === 'production' ? 'production' : 'sandbox'});
      var options={paymentSessionId:ready.paymentSessionId,redirectTarget:'_self'};
      var returnUrl=_cfReturnUrl(ready.orderId);if(returnUrl)options.returnUrl=returnUrl;
      return Promise.resolve(cashfree.checkout(options)).then(function(result){return {result:result||{},order:ready};});
    }).then(function(res){
      var result = res.result || {};
      if(result.error){
        var msg='Payment was not completed' + (result.error.message ? ': ' + result.error.message : ' — you can try again.');
        showToast(msg);_cfUi('error',msg);return false;
      }
      /* Popup mocks/tests and unusual browsers can resolve without navigating.
         Still verify server-side; the normal `_self` flow resumes after the
         return URL reload. */
      _cfUi('busy','Confirming your payment\u2026');
      return _cfConfirmPaid(res.order.orderId,3).then(function(confirmation){
        if(confirmation){_cfGrantConfirmed(res.order);return true;}
        _cfUi('ready','Payment is still processing. If you paid, check My Payments before trying again.');
        return false;
      });
    }).catch(function(e){
      var msg='Could not open Cashfree checkout' + ((e && e.message) ? ': ' + e.message : ' — use direct UPI or retry.');
      showToast(msg);_cfUi('error',msg);return false;
    });
    return flow;
  }
};

RWPaymentGateway.register('cashfree', CashfreeAdapter);

if(typeof window!=='undefined'&&window.addEventListener){
  window.addEventListener('load',function(){
    if(_cfReadPending())setTimeout(function(){rwResumeCashfreePayment(0);},300);
  });
}
