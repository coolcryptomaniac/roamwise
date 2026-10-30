import { nextBookingState, mayRequestPayment } from './booking-state-core.mjs';

// In-memory transition guard; production persistence, auth and payment webhooks remain separate.
export function createBookingSession({ bookingId, onTransition = () => {} }) {
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(String(bookingId || ''))) throw new Error('Invalid booking ID');
  let state = 'draft';
  const processed = new Set();
  return {
    snapshot: () => ({ bookingId, state, paymentAllowed: mayRequestPayment(state) }),
    apply: ({ event, eventId, actor }) => {
      if (!/^[a-zA-Z0-9_-]{8,120}$/.test(String(eventId || ''))) throw new Error('Invalid event ID');
      if (processed.has(eventId)) return { applied: false, reason: 'duplicate', state };
      const roles = { request: 'customer', partner_confirm: 'partner', partner_decline: 'partner',
        customer_confirm: 'customer', payment_confirmed: 'server', cancel: 'customer' };
      if (roles[event] !== actor) return { applied: false, reason: 'unauthorized_actor', state };
      const next = nextBookingState(state, event);
      if (next === state) return { applied: false, reason: 'invalid_transition', state };
      processed.add(eventId); state = next; onTransition({ bookingId, event, state });
      return { applied: true, state, paymentAllowed: mayRequestPayment(state) };
    },
  };
}
