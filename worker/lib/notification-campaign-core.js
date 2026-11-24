/* RoamWise notification campaigns: pure, conservative eligibility rules.
   This module NEVER creates a discount, offers inventory, or claims a booking. */
const DAY = 86400000;
const HOSTS = new Set(['roamwise.co.in','www.roamwise.co.in']);
export const MAX_CAMPAIGN_AGE_DAYS = 7;
export function trustedDestination(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && HOSTS.has(u.hostname) &&
      !u.pathname.startsWith('/admin/') && !u.username && !u.password;
  } catch (_) { return false; }
}
export function istHour(nowMs) {
  return new Date(nowMs + 330 * 60000).getUTCHours();
}
export function marketingWindow(nowMs) {
  const hour = istHour(nowMs);
  return hour >= 9 && hour < 20;
}
export function campaignValidation(c, nowMs, verifiedOffers) {
  if (!c || c.status !== 'approved' || !c.approvedBy || !c.approvedAt)
    return 'awaiting_admin_approval';
  const approved = Date.parse(String(c.approvedAt));
  if (!Number.isFinite(approved) || approved > nowMs + 60000 ||
    nowMs - approved > MAX_CAMPAIGN_AGE_DAYS * DAY) return 'approval_expired';
  if (!['booking','account','safety','travel','offers'].includes(c.category))
    return 'unknown_category';
  if (!c.title || String(c.title).length > 100 ||
      !c.body || String(c.body).length > 500) return 'invalid_content';
  if (!trustedDestination(c.url)) return 'unsafe_destination';
  if (!c.target || !['uid','all'].includes(c.target.type)) return 'invalid_target';
  if (c.target.type === 'uid' && !/^[A-Za-z0-9_-]{1,128}$/.test(String(c.target.uid || '')))
    return 'invalid_target_uid';
  if (c.target.type === 'all' && !['travel','offers'].includes(c.category))
    return 'broadcast_not_permitted';
  if (c.category === 'travel' && c.reviewedContent !== true) return 'review_required';
  if (c.category === 'offers') {
    const id = String(c.verifiedOfferId || '');
    const rows = Array.isArray(verifiedOffers) ? verifiedOffers : [];
    const o = rows.find(x => x && x.id === id && id && x.status === 'verified' && x.active === true);
    if (!o || !trustedDestination(o.url) || o.url !== c.url) return 'offer_not_verified';
    if (c.reviewedContent !== true || typeof o.title !== 'string' ||
        typeof o.body !== 'string' || o.title !== c.title || o.body !== c.body)
      return 'offer_copy_not_verified';
    const reviewedAt = Date.parse(String(o.reviewedAt || ''));
    if (!Number.isFinite(reviewedAt) || nowMs - reviewedAt > 7 * DAY ||
        reviewedAt > nowMs + 60000) return 'offer_review_stale';
    const expires = Date.parse(String(o.expiresAt || ''));
    if (!Number.isFinite(expires) || expires <= nowMs) return 'offer_expired';
  }
  return null;
}
export function proExpiryEvent(user, nowMs) {
  if (!user || user.pro !== true) return null;
  const until = Number(user.proUntil);
  if (!Number.isFinite(until) || until <= nowMs || until === 0) return null;
  const remaining = Math.ceil((until - nowMs) / DAY);
  if (remaining > 7) return null;
  const stage = remaining <= 1 ? 'one_day' : 'seven_days';
  return {
    kind: 'pro_expiry_' + stage, marker: 'pro_expiry:' + until + ':' + stage,
    category: 'account',
    title: remaining <= 1 ? 'RoamWise Pro expires soon' : 'Your RoamWise Pro renewal reminder',
    body: remaining <= 1 ? 'Your current Pro access ends within 24 hours. Check your membership details.' :
      'Your current Pro access is due to end within 7 days. Review your membership.',
    url: 'https://www.roamwise.co.in/my-payments/'
  };
}
