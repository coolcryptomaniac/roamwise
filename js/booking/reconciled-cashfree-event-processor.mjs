import {createCashfreeEventProcessor} from './cashfree-event-processor.mjs';
import {createCashfreePaymentReconciler} from './cashfree-payment-reconciler.mjs';

// Fail-closed composition: production integration must always reconcile a
// signed webhook against Cashfree's independent server-side payment lookup.
export function createReconciledCashfreeEventProcessor({db,signingSecret,resolveBookingByOrderId,appId,secretKey,environment='sandbox',fetchImpl,now}) {
 const reconcilePayment=createCashfreePaymentReconciler({appId,secretKey,environment,fetchImpl});
 return createCashfreeEventProcessor({db,signingSecret,resolveBookingByOrderId,reconcilePayment,now});
}
