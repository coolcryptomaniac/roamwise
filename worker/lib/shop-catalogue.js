/* RoamWise shop catalogue: the ONLY source of prices for merchandise checkout.
 * The browser never sends a price; the Worker prices every order from this file.
 * Prices are integer paise. qikinkSku stays server-side and is never published.
 *
 * To add a Qikink product: append an entry (price = RoamWise retail price, not Qikink cost),
 * add its variants, and deploy the Worker. Only products listed here can be bought. */
export const SHOP_CATALOGUE = Object.freeze({
  version: 1,
  currency: 'INR',
  /* Delivery is confirmed after the buyer's PIN is entered. Leave defaultFeePaise null until real
   * Qikink/courier costs are known: with null, quotes for any PIN without a matching rule are
   * refused instead of guessing a fee. Rules are checked in order; first matching prefix wins.
   * Example: rules: [{ pinPrefixes: ['26', '24'], feePaise: 6900 }], defaultFeePaise: 9900 */
  shipping: Object.freeze({ rules: Object.freeze([]), defaultFeePaise: null, freeAbovePaise: null }),
  products: Object.freeze([
    Object.freeze({
      id: 'almora-after-dark-hoodie',
      name: 'Almora After Dark Oversized Hoodie',
      type: 'Unisex oversized hoodie',
      description: 'A geru-red Himalayan ridgeline across the back, a small mountain crest on the chest and an Aipan-inspired stripe on the right sleeve. 400 GSM, 90% cotton and 10% polyester.',
      image: 'https://roamwise.co.in/shop/img/hoodie.jpg',
      pricePaise: 199900,
      maxQty: 5,
      fulfilment: 'qikink',
      variants: Object.freeze([
        Object.freeze({ id: 'black-s', label: 'Black · Size S', qikinkSku: 'v-9R6l3yaFaVZW1scJMRQqubfWrwza9XuZ' }),
      ]),
    }),
    Object.freeze({
      id: 'roamwise-mandala-headband',
      name: 'RoamWise Red Mandala Headband',
      type: 'All-over printed headband',
      description: 'A stretch headband with a cream mandala and floral border on geru red. All-over printed on demand, standard size.',
      image: 'https://roamwise.co.in/shop/img/headband.jpg',
      pricePaise: 19900,
      maxQty: 10,
      fulfilment: 'qikink',
      variants: Object.freeze([
        Object.freeze({ id: 'standard', label: 'Red · Standard size', qikinkSku: 'v-9R6l3yaFaVZW1scJMxcpubfWrwzY-Xua' }),
      ]),
    }),
    Object.freeze({
      id: 'roamwise-mandala-tote',
      name: 'RoamWise Red Mandala Large Tote Bag',
      type: 'Unisex all-over printed large tote',
      description: 'A large tote with a cream mandala, floral corners and a mountain-ridge border on geru red. All-over printed on demand, standard size.',
      image: 'https://roamwise.co.in/shop/img/tote.jpg',
      pricePaise: 79900,
      maxQty: 5,
      fulfilment: 'qikink',
      variants: Object.freeze([
        Object.freeze({ id: 'standard', label: 'Red · Standard size', qikinkSku: 'v-9R6l3yaFaVZW1scJMhArubfWrwzY9HWb' }),
      ]),
    }),
  ]),
});

/* What the browser may see: no SKUs, no supplier data. */
export function publicCatalogue(cat = SHOP_CATALOGUE) {
  return {
    version: cat.version,
    currency: cat.currency,
    products: cat.products.map((p) => ({
      id: p.id, name: p.name, type: p.type, description: p.description, image: p.image,
      pricePaise: p.pricePaise, maxQty: p.maxQty,
      variants: p.variants.map((v) => ({ id: v.id, label: v.label })),
    })),
  };
}
