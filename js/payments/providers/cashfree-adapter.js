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

function _cfLoadSdk(){
  if(typeof Cashfree !== 'undefined') return Promise.resolve();
  if(_cfSdkPromise) return _cfSdkPromise;
  _cfSdkPromise = new Promise(function(resolve, reject){
    var s = document.createElement('script');
    s.src = CF_SDK_URL;
    s.onload = function(){ resolve(); };
    s.onerror = function(){ _cfSdkPromise = null; reject(new Error('Could not load the Cashfree checkout script.')); };
    document.head.appendChild(s);
  });
  return _cfSdkPromise;
}

/* Best-effort current-user details for Cashfree's customer_details block.
   Resolved at call time from the same `user` global every other payments
   file in this app already reads (app.js's Firebase Auth state) — never
   invents a phone number when one isn't on the account (see
   worker/handlers/cashfree.js, which rejects a missing/invalid phone rather
   than accepting a fake one). */
function _cfCustomer(){
  var u = (typeof user !== 'undefined') ? user : null;
  return {
    id: (u && u.uid) || ('guest_' + Date.now()),
    email: (u && u.email) || '',
    phone: (u && u.phoneNumber) || ''
  };
}

/* Polls GET /cashfree/order/:id/status a few times (Cashfree's own status
   can lag a couple seconds behind the checkout SDK's promise resolving —
   see the comment on handleCashfreeOrderStatus in worker/handlers/
   cashfree.js for why this app checks rather than trusting the SDK alone).
   Resolves true only on a confirmed 'PAID' status. */
function _cfConfirmPaid(orderId, attemptsLeft){
  var endpoint = (typeof rwApi === 'function') ? rwApi('cashfree/order/' + encodeURIComponent(orderId) + '/status') : null;
  if(!endpoint) return Promise.resolve(false);
  return fetch(endpoint).then(function(r){ return r.json().catch(function(){ return {}; }); }).then(function(d){
    if(d && d.order_status === 'PAID') return true;
    if(attemptsLeft > 0) return new Promise(function(resolve){ setTimeout(resolve, 1500); }).then(function(){ return _cfConfirmPaid(orderId, attemptsLeft - 1); });
    return false;
  }).catch(function(){ return false; });
}

var CashfreeAdapter = {
  id: 'cashfree',

  createOrder: function(amount, meta){
    meta = meta || {};
    var shell = {amountINR: amount, planId: meta.planId, tierId: meta.tierId, label: meta.label, category: meta.category, provider: 'cashfree', ready: false};
    var endpoint = (typeof rwApi === 'function') ? rwApi('cashfree/order') : null;
    if(!endpoint){
      _cfOrderPromise = Promise.reject(new Error('Cashfree checkout is not configured on this deployment yet.'));
      _cfOrderPromise.catch(function(){}); /* prevent an unhandled-rejection warning until openCheckout() reads it */
      return shell;
    }
    _cfOrderPromise = fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({amount: amount, customer: _cfCustomer(), meta: {planId: meta.planId, tierId: meta.tierId, label: meta.label}})
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(d){
        if(!r.ok) throw new Error((d && d.message) || 'Cashfree order creation failed.');
        return d;
      });
    }).then(function(d){
      if(!d || !d.payment_session_id) throw new Error('Cashfree did not return a payment session.');
      shell.paymentSessionId = d.payment_session_id;
      shell.orderId = d.order_id;
      shell.environment = d.environment || 'sandbox';
      shell.ready = true;
      return shell;
    });
    _cfOrderPromise.catch(function(){});
    return shell;
  },

  /* Hosted-checkout gateway: success/failure/cancel all resolve inside
     Cashfree's own SDK promise, so — same as this file's header and
     PAYMENT-GATEWAY-ARCHITECTURE.md's "Adding gateway #2" guide both note —
     there is no separate verifyPayment() step. */
  openCheckout: function(order, method){
    if(!_cfOrderPromise){ showToast('Pick a plan again — the Cashfree session expired.'); return; }
    showToast('Opening secure Cashfree checkout…');
    _cfOrderPromise.then(function(ready){
      return _cfLoadSdk().then(function(){ return ready; });
    }).then(function(ready){
      var cashfree = Cashfree({mode: ready.environment === 'production' ? 'production' : 'sandbox'});
      return cashfree.checkout({paymentSessionId: ready.paymentSessionId, redirectTarget: '_modal'}).then(function(result){
        return {result: result, orderId: ready.orderId, planId: ready.planId};
      });
    }).then(function(res){
      var result = res.result || {};
      if(result.error){
        showToast('Payment was not completed' + (result.error.message ? ': ' + result.error.message : ' — you can try again.'));
        return;
      }
      /* The SDK resolving without `error` means the checkout flow finished,
         not necessarily a successful charge (Cashfree's own docs: the
         completion callback fires "irrespective of transaction status") —
         confirm order_status server-side before granting anything. */
      showToast('Confirming your payment…');
      _cfConfirmPaid(res.orderId, 3).then(function(paid){
        if(paid){
          try{ track('cashfree_paid'); }catch(e){ /* analytics best-effort, ignore */ }
          /* FULFILLMENT FIX: Cashfree's confirmation is real-time/automatic —
             unlike the manual-UPI/UTR flow's honor-system admin approval,
             there is no human review step before granting anything here, so
             this MUST branch per what was actually purchased rather than a
             single blanket Pro grant. grantPurchase() (js/payments/
             plan-picker.js) is the exact same per-product fulfillment logic
             the manual-UPI flow's instant provisional unlock already uses
             (rwTierForPlan()) — reused here, not reinvented, so a Plus/Pro
             monthly buyer gets exactly that tier and a Founder/long-term/
             short-term buyer still gets full access, never the other way
             around. */
          grantPurchase(res.orderId || 'cashfree', 'cashfree', res.planId);
        } else {
          showToast('Payment is still processing with Cashfree — if it completed, Pro will unlock automatically shortly. Contact support if it does not.');
        }
      });
    }).catch(function(e){
      showToast('Could not open Cashfree checkout' + ((e && e.message) ? ': ' + e.message : ' — try again.'));
    });
  }
};

RWPaymentGateway.register('cashfree', CashfreeAdapter);
