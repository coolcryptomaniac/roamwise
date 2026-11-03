/* Pure Qikink order rules: canonical states, name/address splitting, order numbers and the create-order payload.
 * No network and no storage here. Money is integer paise in, rupees (numbers) out, as Qikink expects. */
import { rupees } from './shop-core.js';
import { canonicalState } from './india-states.js';

export { INDIA_STATES, canonicalState } from './india-states.js';

/* Qikink order_number: max 15 chars, a-z 0-9 _ only, unique. 'rws_' + the 10 id characters, lower-cased = 14 chars. */
export function qikinkOrderNumber(orderId) {
  const n = 'rws_' + String(orderId).replace(/^RWS-/, '').toLowerCase();
  return /^[a-z0-9_]{1,15}$/.test(n) ? n : null;
}

export function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: parts[0] || '', last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

/* address1 may not exceed 90 chars; overflow moves to address2 at a word boundary. */
export function splitAddress(line1, line2) {
  let a1 = String(line1 || '').trim();
  let a2 = String(line2 || '').trim();
  if (a1.length > 90) {
    let cut = a1.lastIndexOf(' ', 90);
    if (cut < 30) cut = 90;
    a2 = (a1.slice(cut).trim() + (a2 ? ', ' + a2 : '')).trim();
    a1 = a1.slice(0, cut).trim();
  }
  return { address1: a1, address2: a2 };
}

/* Builds the create-order body from a paid shopOrders document. Returns { body } or { error }.
 * `skuFor(line)` maps a stored order line to its Qikink My Products SKU (null when not configured). */
export function buildQikinkOrder(order, skuFor) {
  const number = qikinkOrderNumber(order && order.orderId);
  if (!number) return { error: 'bad_order_number' };
  const state = canonicalState(order.ship && order.ship.state);
  if (!state) return { error: 'bad_state' };
  const email = order.customer && order.customer.email;
  if (!email) return { error: 'missing_email' };
  if (!Array.isArray(order.lines) || !order.lines.length) return { error: 'no_lines' };
  const line_items = [];
  for (const l of order.lines) {
    const sku = skuFor(l);
    if (!sku) return { error: 'missing_sku', detail: l.id + '/' + l.variant };
    if (String(sku).length > 50) return { error: 'bad_sku' };
    line_items.push({ search_from_my_products: 1, quantity: l.qty, sku, price: Number(rupees(l.unitPaise)) });
  }
  const nm = splitName(order.customer.name);
  const ad = splitAddress(order.ship.line1, order.ship.line2);
  const shipping_address = {
    first_name: nm.first_name, ...(nm.last_name ? { last_name: nm.last_name } : {}),
    address1: ad.address1, ...(ad.address2 ? { address2: ad.address2 } : {}),
    phone: order.customer.phone, email, city: order.ship.city, zip: order.ship.pin, province: state, country_code: 'IN',
  };
  return {
    body: {
      order_number: number, qikink_shipping: 1, gateway: 'Prepaid',
      total_order_value: Number(rupees(order.totalPaise)), line_items, shipping_address,
    },
  };
}
