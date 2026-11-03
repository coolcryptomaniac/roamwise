/* Pure merchandise-checkout rules: validation, server-side pricing, order ids, UPI intent.
 * No network and no storage here, so every rule is unit-tested. All money is integer paise. */
import { SHOP_CATALOGUE } from './shop-catalogue.js';

export const UPI_ID = 'roamwisepay@ybl';
export const UPI_PAYEE = 'RoamWise';
export const MAX_LINES = 5;
export const MAX_ORDER_PAISE = 5000000; // Rs 50,000 sanity cap per order

export const rupees = (paise) => (paise / 100).toFixed(2);

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/* India PIN codes: 6 digits, first digit 1-8 (9 is Army Post Office, 0 is unused). */
export function validPin(pin) { return /^[1-8][0-9]{5}$/.test(String(pin == null ? '' : pin)); }

export function normalisePhone(v) {
  const digits = String(v == null ? '' : v).replace(/[^\d]/g, '');
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9][0-9]{9}$/.test(ten) ? ten : null;
}

export function validateCustomer(c) {
  c = c || {};
  const name = clean(c.name, 80);
  const phone = normalisePhone(c.phone);
  const email = clean(c.email, 160);
  if (name.length < 2) return { error: 'invalid_name', message: 'Enter your full name.' };
  if (!phone) return { error: 'invalid_phone', message: 'Enter a valid 10-digit Indian mobile number.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'invalid_email', message: 'That email address does not look right.' };
  return { value: { name, phone, email } };
}

export function validateShipTo(s) {
  s = s || {};
  const v = { line1: clean(s.line1, 120), line2: clean(s.line2, 120), city: clean(s.city, 60), state: clean(s.state, 40), pin: String(s.pin == null ? '' : s.pin).trim() };
  if (v.line1.length < 5) return { error: 'invalid_address', message: 'Enter your delivery address (house, street, area).' };
  if (v.city.length < 2) return { error: 'invalid_city', message: 'Enter your city or town.' };
  if (v.state.length < 2) return { error: 'invalid_state', message: 'Enter your state.' };
  if (!validPin(v.pin)) return { error: 'invalid_pin', message: 'Enter a valid 6-digit PIN code.' };
  return { value: v };
}

export function shippingFeePaise(pin, subtotalPaise, cat = SHOP_CATALOGUE) {
  const sh = cat.shipping || {};
  if (sh.freeAbovePaise != null && subtotalPaise >= sh.freeAbovePaise) return 0;
  for (const r of sh.rules || []) {
    if ((r.pinPrefixes || []).some((p) => String(pin).startsWith(p))) return r.feePaise;
  }
  return sh.defaultFeePaise == null ? null : sh.defaultFeePaise;
}

/* items: [{id, variant, qty}]. Returns { lines, subtotalPaise, shippingPaise, totalPaise } or { error, message }. */
export function priceCart(items, pin, cat = SHOP_CATALOGUE) {
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_LINES) return { error: 'invalid_items', message: 'Your basket is empty or too large.' };
  if (!validPin(pin)) return { error: 'invalid_pin', message: 'Enter a valid 6-digit PIN code.' };
  const seen = new Set();
  const lines = [];
  let subtotalPaise = 0;
  for (const it of items) {
    const product = cat.products.find((p) => p.id === (it && it.id));
    const variant = product && product.variants.find((v) => v.id === it.variant);
    if (!product || !variant) return { error: 'unknown_product', message: 'One of the items is not available.' };
    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > product.maxQty) return { error: 'invalid_quantity', message: 'Quantity must be between 1 and ' + product.maxQty + '.' };
    const key = product.id + '/' + variant.id;
    if (seen.has(key)) return { error: 'duplicate_line', message: 'Each item can appear once; change its quantity instead.' };
    seen.add(key);
    const linePaise = product.pricePaise * qty;
    subtotalPaise += linePaise;
    lines.push({ id: product.id, variant: variant.id, name: product.name, variantLabel: variant.label, qty, unitPaise: product.pricePaise, linePaise });
  }
  const shippingPaise = shippingFeePaise(pin, subtotalPaise, cat);
  if (shippingPaise == null) return { error: 'shipping_not_available', message: 'We will confirm delivery to this PIN code on WhatsApp before you pay.' };
  const totalPaise = subtotalPaise + shippingPaise;
  if (totalPaise > MAX_ORDER_PAISE) return { error: 'order_too_large', message: 'This order is too large for online checkout. Please message us.' };
  return { lines, subtotalPaise, shippingPaise, totalPaise };
}

/* Order ids use an alphabet without look-alike characters (no 0/O/1/I/L). */
const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function newOrderId(bytes) {
  let s = '';
  for (let i = 0; i < 10; i++) s += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return 'RWS-' + s;
}
export const ORDER_ID_RE = /^RWS-[A-HJKMNP-Z2-9]{10}$/;

export function hex(bytes) { return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''); }

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return hex(new Uint8Array(buf));
}

export function timingSafeEqualHex(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* Direct UPI: exact amount and the order id as the transaction note and reference. */
export function upiIntent(orderId, totalPaise) {
  const q = new URLSearchParams({ pa: UPI_ID, pn: UPI_PAYEE, am: rupees(totalPaise), cu: 'INR', tn: orderId, tr: orderId });
  return { pa: UPI_ID, pn: UPI_PAYEE, amount: rupees(totalPaise), note: orderId, uri: 'upi://pay?' + q.toString().replace(/\+/g, '%20') };
}
