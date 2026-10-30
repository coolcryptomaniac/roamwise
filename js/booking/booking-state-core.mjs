// Pure booking state machine: never charges, reserves or promises availability.
export function nextBookingState(state,event){
 const s=state||'draft';
 const transitions={draft:{request:'pending_partner'},pending_partner:{partner_confirm:'awaiting_customer',partner_decline:'declined'},awaiting_customer:{customer_confirm:'ready_for_payment',cancel:'cancelled'},ready_for_payment:{payment_confirmed:'confirmed',cancel:'cancelled'}};
 return transitions[s]?.[event]||s;
}
export function mayRequestPayment(state){return state==='ready_for_payment';}
