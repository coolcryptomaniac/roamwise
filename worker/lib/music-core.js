/* Pure music-store rules: licence tiers, validation, server-side pricing, order ids, signed download links.
 * No network and no storage here, so every rule is unit-tested. Money is integer paise. */
import { MUSIC_CATALOGUE } from './music-catalogue.js';

export const UPI_ID = 'roamwisepay@ybl';
export const UPI_PAYEE = 'RoamWise';
export const TERMS_VERSION = '2026-11-03';
export const UPI_MAX_PAISE = 2500000;      // direct UPI only up to Rs 25,000; larger licences pay by Cashfree (card / netbanking)
export const MAX_DOWNLOADS = 10;
export const LINK_TTL_SEC = 15 * 60;
export const CREDIT_LINE = (title) => `Music: "${title}" by Mohit Pandey (RoamWise Music)`;

export const rupees = (paise) => (paise / 100).toFixed(2);

/* Licence tiers. Every licence is NON-exclusive and covers the single track chosen. */
export const LICENCE_TIERS = Object.freeze({
  creator: Object.freeze({ label: 'Creator licence', pricePaise: 100000, use: 'Videos and podcasts on one YouTube, Instagram or podcast channel/account, monetisation allowed. Not for broadcast, ads or films.' }),
  indie: Object.freeze({ label: 'Indie film / video licence', pricePaise: 500000, use: 'One short film, web-series episode, documentary, corporate or explainer video (up to 40 minutes), festival and online release. No TV/OTT broadcast.' }),
  commercial: Object.freeze({ label: 'Commercial / advertising licence', pricePaise: 2500000, use: 'One advertising campaign, brand film, game or TV/OTT promo, in any media, worldwide.' }),
  feature: Object.freeze({ label: 'Feature film / series licence', pricePaise: 10000000, use: 'One feature film or one series season: theatrical, TV, OTT and home video worldwide, trailers and promos included.' }),
});

/* Plain-language terms, shown on the page and printed on the certificate. Have a lawyer review before enabling. */
export const LICENCE_TERMS = Object.freeze([
  'Non-exclusive, worldwide and perpetual for the single project and use described for the tier. It cannot be resold, sublicensed or transferred, except to a producer or distributor of that same project.',
  'You may sync the track to picture, edit and trim it, and use it in the project\'s trailers and promos. You may not release the track on its own, upload it as a standalone song, or use it to train AI models.',
  'Credit the music as shown on this certificate where credits are possible. Keep the licence number; it proves your rights.',
  'The licensor will not file copyright or Content ID claims against your project and will clear claims if you show the licence number.',
  'Some tracks were made with AI music tools on paid commercial plans. The licensor owns the rights granted here and gives no warranty beyond that. Liability is limited to the fee paid.',
  'A breach of these terms ends the licence for that project. Exclusive or buy-out rights are available by separate agreement.',
]);

export const DOWNLOAD_USE = 'Personal listening on your own devices. Not for public posting, monetised videos, films or resale. For those, take a licence.';

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function normalisePhone(v) {
  const digits = String(v == null ? '' : v).replace(/[^\d]/g, '');
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9][0-9]{9}$/.test(ten) ? ten : null;
}

/* buyer: {name, phone, email, licensee?, project?}; licence orders also need the licensee and project title. */
export function validateBuyer(b, kind) {
  b = b || {};
  const name = clean(b.name, 80);
  const phone = normalisePhone(b.phone);
  const email = clean(b.email, 160);
  if (name.length < 2) return { error: 'invalid_name', message: 'Enter your full name.' };
  if (!phone) return { error: 'invalid_phone', message: 'Enter a valid 10-digit Indian mobile number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'invalid_email', message: 'Enter a valid email address.' };
  const value = { name, phone, email };
  if (kind === 'licence') {
    const licensee = clean(b.licensee, 100);
    const project = clean(b.project, 120);
    if (licensee.length < 2) return { error: 'invalid_licensee', message: 'Enter the person or company the licence is issued to.' };
    if (project.length < 2) return { error: 'invalid_project', message: 'Enter the title of the film, video or project.' };
    value.licensee = licensee; value.project = project;
  }
  return { value };
}

/* item: {releaseId, kind: 'download'|'licence', tier?}. Returns {item, totalPaise} or {error, message}. */
export function priceItem(item, cat = MUSIC_CATALOGUE) {
  const release = cat.releases.find((r) => r.id === (item && item.releaseId));
  if (!release) return { error: 'unknown_track', message: 'That track is not available.' };
  if (item.kind === 'download') {
    return { item: { kind: 'download', releaseId: release.id, releaseTitle: release.title, label: 'Download (MP3)' }, totalPaise: release.pricePaise || cat.downloadPaise };
  }
  if (item.kind === 'licence') {
    const tier = Object.prototype.hasOwnProperty.call(LICENCE_TIERS, item.tier) ? LICENCE_TIERS[item.tier] : null;
    if (!tier) return { error: 'unknown_tier', message: 'Choose a licence type.' };
    return { item: { kind: 'licence', releaseId: release.id, releaseTitle: release.title, tier: item.tier, label: tier.label }, totalPaise: tier.pricePaise };
  }
  return { error: 'unknown_kind', message: 'Choose a download or a licence.' };
}

const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function newOrderId(bytes) {
  let s = '';
  for (let i = 0; i < 10; i++) s += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return 'RWM-' + s;
}
export const ORDER_ID_RE = /^RWM-[A-HJKMNP-Z2-9]{10}$/;

export function hex(bytes) { return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''); }
export async function sha256Hex(text) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)))));
}
export function timingSafeEqualHex(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* Direct UPI: exact amount, order id as note and reference. */
export function upiIntent(orderId, totalPaise) {
  const q = new URLSearchParams({ pa: UPI_ID, pn: UPI_PAYEE, am: rupees(totalPaise), cu: 'INR', tn: orderId, tr: orderId });
  return { pa: UPI_ID, pn: UPI_PAYEE, amount: rupees(totalPaise), note: orderId, uri: 'upi://pay?' + q.toString().replace(/\+/g, '%20') };
}

/* Signed, expiring download link: HMAC-SHA256(secret, orderId.exp). */
async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))));
}
export const linkSecretOk = (s) => typeof s === 'string' && s.length >= 32;
export async function signDownload(secret, orderId, expSec) { return hmacHex(secret, `${orderId}.${expSec}`); }
export async function verifyDownload(secret, orderId, expSec, sig, nowSec) {
  if (!linkSecretOk(secret) || !/^\d{9,12}$/.test(String(expSec)) || Number(expSec) < nowSec) return false;
  return timingSafeEqualHex(await signDownload(secret, orderId, expSec), String(sig || ''));
}

export const safeFileName = (title) => (String(title).replace(/[^\p{L}\p{N} _.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'track') + ' - Mohit Pandey';
