// packages/ambassador-core.mjs - campus ambassador codes and "reward after the trip" rules. Pure functions, no storage.
// The reward is earned only when a referred group has fully paid AND travelled, so a fake sign-up never costs money.
// POLICY numbers are planning assumptions (see the strategy doc); change them here, not in callers.
import { normalisePhone } from './booking-core.mjs';

export const POLICY = Object.freeze({
  rewardPct: 0.04,       // of each travelling member's price before GST (assumption)
  rewardCapPerHead: 600, // rupees (assumption)
  minTravellers: 6,      // matches the smallest group the packages sell
  maxGroupsPerMonth: 5,  // per ambassador, counted by departure month
});

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const CODE_RE = /^[A-Z]{2,4}-[A-HJ-KM-NP-Z2-9]{4}$/;

function hash(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }

/** Stable code like "NMI-K7Q2" from a campus short name and the ambassador's phone. Same inputs, same code. */
export function makeCode(campus, phone) {
  const pre = String(campus || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const p = normalisePhone(phone);
  if (pre.length < 2 || !p) return '';
  let n = hash(pre + '|' + p), tail = '';
  for (let i = 0; i < 4; i++) { tail += CODE_ALPHABET[n % CODE_ALPHABET.length]; n = Math.floor(n / CODE_ALPHABET.length) || hash(tail + p); }
  return pre + '-' + tail;
}
export const isCode = (c) => CODE_RE.test(String(c || '').trim().toUpperCase());

/**
 * Decide whether a referred group earns the ambassador a reward.
 * group = { leaderPhone, members: [{ phone, paidInFull, travelled }], refunded, pricePPBeforeGst, departMonth: 'YYYY-MM' }
 * priorPaid = number of groups already rewarded to this ambassador in the same departure month.
 */
export function evaluateReferral({ ambassadorPhone, group, priorPaid = 0, policy = POLICY }) {
  const reasons = [];
  const amb = normalisePhone(ambassadorPhone);
  if (!amb) reasons.push('Ambassador phone is missing or invalid');
  const members = Array.isArray(group && group.members) ? group.members : [];
  const phones = members.map((m) => normalisePhone(m && m.phone)).filter(Boolean);
  if (new Set(phones).size !== phones.length) reasons.push('Two members share a phone number');
  if (amb && phones.includes(amb)) reasons.push('The ambassador cannot be a member of their own referred group');
  if (amb && normalisePhone(group && group.leaderPhone) === amb) reasons.push('The ambassador cannot lead their own referred group');
  if (group && group.refunded) reasons.push('The booking was refunded');
  const unpaid = members.filter((m) => !m.paidInFull).length;
  if (unpaid) reasons.push(unpaid + ' member(s) have not paid in full');
  const travellers = members.filter((m) => m.travelled && m.paidInFull);
  if (travellers.length < policy.minTravellers) reasons.push('Only ' + travellers.length + ' travelled; at least ' + policy.minTravellers + ' needed');
  if (!(group && group.pricePPBeforeGst > 0)) reasons.push('Price per person is missing');
  if (priorPaid >= policy.maxGroupsPerMonth) reasons.push('Monthly limit of ' + policy.maxGroupsPerMonth + ' rewarded groups reached');
  if (reasons.length) return { eligible: false, reward: 0, reasons };
  const perHead = Math.min(policy.rewardCapPerHead, Math.round(group.pricePPBeforeGst * policy.rewardPct));
  return { eligible: true, reward: perHead * travellers.length, perHead, travellers: travellers.length, reasons: [] };
}
