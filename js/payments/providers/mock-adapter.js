// @ts-nocheck
/* TEST-ONLY MOCK PAYMENT ADAPTER — js/payments/providers/mock-adapter.js
   ============================================================================
   *** NOT wired into production. Not added to index.html. Not registered by
   *** any config value — RW_PAYMENT_PROVIDER never resolves to this adapter
   *** unless a test explicitly sets it. This file exists purely to prove the
   *** RWPaymentGateway plug point in js/payments/gateway-adapter.js actually
   *** decouples checkout code from any one provider's specifics, WITHOUT
   *** needing a real second gateway's API keys/business decisions (which
   *** this task explicitly excludes — see PAYMENT-GATEWAY-ARCHITECTURE.md).

   Every method just records how it was called (into `calls`) and returns a
   small fixed value, so a test can assert both "the right adapter's methods
   ran" and "they ran with the right arguments" — see
   tests/payment-gateway-adapter.test.js. Loaded only by tests (via Node's
   vm module), never by index.html. */

function RWMockPaymentAdapter(){
  var calls = { createOrder: [], openCheckout: [], buildQR: [], verifyPayment: [] };
  return {
    id: 'mock',
    calls: calls,
    createOrder: function(amount, meta){
      calls.createOrder.push({amount: amount, meta: meta});
      return {amountINR: amount, mock: true, planId: meta && meta.planId, tierId: meta && meta.tierId, label: meta && meta.label};
    },
    openCheckout: function(order, method){
      calls.openCheckout.push({order: order, method: method});
    },
    buildQR: function(order){
      calls.buildQR.push({order: order});
    },
    verifyPayment: function(){
      calls.verifyPayment.push({});
    }
  };
}

if(typeof module!=='undefined' && module.exports){ module.exports = RWMockPaymentAdapter; }
