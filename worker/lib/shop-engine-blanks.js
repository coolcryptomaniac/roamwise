/* Qikink BLANK product SKUs the shop engine prints auto designs on (search_from_my_products = 0).
 * Server-side only; never published. A product type with an empty list is never sold.
 *
 * One-time setup (founder or operator, ~10 minutes): in the Qikink seller dashboard open the product
 * catalogue, pick the blank (e.g. Unisex Oversized T-shirt, black), and copy each colour/size SKU into the
 * list below as { id, label, sku }. Test one sandbox order per type before setting SHOP_ENGINE_ENABLED.
 * ids: lower-case a-z 0-9 '-' (shown in the order, e.g. 'black-m'). */
export const SHOP_ENGINE_BLANKS = Object.freeze({
  'oversized-tee': Object.freeze([
    // { id: 'black-s', label: 'Black · S', sku: '<Qikink SKU>' },
  ]),
  'hoodie': Object.freeze([]),
  'tote': Object.freeze([]),
});
