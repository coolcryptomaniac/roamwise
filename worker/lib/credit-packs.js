/* Founding Traveller Credit: the packs and their bonus (pure logic, no storage; tests run it directly).
 *
 * Why the bonus never goes above 10%: credit is spent at our selling price, and our thinnest product (Aramness Gir,
 * sold 1% under rack) earns about 10%. A pack with 10% bonus gives 10/110 = 9.1% of what it buys, so even a booking
 * paid fully from pack credit never sells below cost. Larger packs get more, the first 100 members get a little
 * extra, and a member whose unused money was refunded at expiry gets a small "welcome back" bonus if they rejoin.
 *
 * Legal shape (founder decision 13 Nov 2026; claude/founding-traveller-credit.md): an advance for RoamWise services.
 * No interest, no returns, no equity, no profit share, never cashable. Unused paid credit is refunded for real at
 * expiry (lib/wallet-core.js CREDIT_VALID_DAYS); it is never re-booked as a new deposit on paper. */
export const CREDIT_PACKS = Object.freeze({
  explorer:    Object.freeze({ id: 'explorer', name: 'Explorer', pay: 5000, bonusPct: 4, perks: ['Founding member number', '1 year of RoamWise Pro'] }),
  voyager:     Object.freeze({ id: 'voyager', name: 'Voyager', pay: 10000, bonusPct: 6, perks: ['Founding member number', '1 year of RoamWise Pro', 'Name on the Founders Wall (if you like)'] }),
  trailblazer: Object.freeze({ id: 'trailblazer', name: 'Trailblazer', pay: 25000, bonusPct: 8, limit: 200,
    perks: ['Founding member number', 'RoamWise Pro for life', 'Name on the Founders Wall (if you like)', 'Priority booking desk on WhatsApp'] }),
  patron:      Object.freeze({ id: 'patron', name: 'Founding Patron', pay: 50000, bonusPct: 10, limit: 100,
    perks: ['Founding member number', 'RoamWise Pro for life', 'Name on the Founders Wall (if you like)', 'Priority booking desk on WhatsApp',
      'Annual members trip at cost', 'Quarterly call with the founder'] }),
});
export const MAX_BONUS_PCT = 10;
export const FOUNDING_SEATS = 100, FOUNDING_EXTRA_PCT = 2;     // the first 100 members overall
export const REJOIN_EXTRA_PCT = 2, REJOIN_WINDOW_DAYS = 30;    // after a real refund at expiry

/* counts: { members, sold: { packId: n } } from storage. Throws on an unknown or sold-out pack. */
export function priceCreditPack(packId, counts = {}, { rejoin = false } = {}) {
  const pack = CREDIT_PACKS[packId];
  if (!pack) throw new Error('Choose a pack.');
  const sold = (counts.sold || {})[packId] || 0;
  if (pack.limit && sold >= pack.limit) throw new Error(pack.name + ' packs are sold out.');
  const founding = (counts.members || 0) < FOUNDING_SEATS;
  const bonusPct = Math.min(MAX_BONUS_PCT, pack.bonusPct + (founding ? FOUNDING_EXTRA_PCT : 0) + (rejoin ? REJOIN_EXTRA_PCT : 0));
  const bonus = Math.round(pack.pay * bonusPct / 100);
  return { packId, name: pack.name, pay: pack.pay, bonusPct, bonus, credit: pack.pay + bonus, founding, rejoin: !!rejoin, perks: pack.perks };
}

export function publicPacks(counts = {}) {
  const foundingLeft = Math.max(0, FOUNDING_SEATS - (counts.members || 0));
  return {
    foundingLeft, validDays: 360, maxBonusPct: MAX_BONUS_PCT,
    packs: Object.values(CREDIT_PACKS).map((p) => {
      const left = p.limit ? Math.max(0, p.limit - ((counts.sold || {})[p.id] || 0)) : null;
      const q = left === 0 ? null : priceCreditPack(p.id, counts);
      return { id: p.id, name: p.name, pay: p.pay, bonusPct: q ? q.bonusPct : p.bonusPct, bonus: q ? q.bonus : 0, credit: q ? q.credit : p.pay,
        left, soldOut: left === 0, perks: p.perks };
    }),
  };
}
