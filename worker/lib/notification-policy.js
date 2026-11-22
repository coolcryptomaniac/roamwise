/* Notification delivery policy shared by the authenticated Worker sender.
   Booking/account/safety updates are useful once a user enables push.
   Travel discovery and offers require separate, affirmative opt-in.
   No invented discounts, no broadcast, and no admin digests for travellers. */
export const NOTIFICATION_CATEGORIES = Object.freeze(['booking','account','safety','travel','offers','operations']);
export const DEFAULT_NOTIFICATION_PREFS = Object.freeze({
  booking: true, account: true, safety: true, travel: false, offers: false
});
export function notificationCategory(value) {
  if (value == null || value === '') return null; // backwards-compatible legacy admin sender
  return typeof value === 'string' && NOTIFICATION_CATEGORIES.includes(value) ? value : undefined;
}
export function preferenceAllows(category, prefs) {
  if (category == null) return true; // legacy sends only: new senders should always label their category
  if (category === 'operations') return false; // staff digests use the dedicated admin-only path
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_NOTIFICATION_PREFS, category)) return false;
  const stored = prefs && typeof prefs === 'object' ? prefs : {};
  const allowed = stored[category];
  return typeof allowed === 'boolean' ? allowed : DEFAULT_NOTIFICATION_PREFS[category];
}
export function throttleSeconds(category) {
  if (category === 'offers') return 7 * 86400;
  if (category === 'travel') return 2 * 86400;
  return 0;
}
