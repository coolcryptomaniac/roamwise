# Amor market check: public prices vs RoamWise

Policy (`worker/lib/amor-policy.js`, founder decision 13 Nov 2026): **20% base margin**, plus demand uplifts (weekend +3, peak +5, curated bundle +3, high season +2 points, ceiling 40%). The price is **never above 3× cost** (200% markup cap, same rule as PR #695), **never below the 7% floor** agreed with Amor, and the whole booking is **capped 1% under any known public price** for the same room/plan or bundle.

Margin = RoamWise commission before GST ÷ pre-GST guest price. GST at 18% is charged on the commission.

## Public references in use (tax included, per room per night)

| Property | Room / plan | Public price | Source | Checked |
|---|---|---|---|---|
| Aramness Gir | Kothi, all meals | ₹84,960 | Amor sheet "published rate" (₹72,000 + 18% GST); Outlook Traveller lists "from ₹85,000 incl. taxes" | 13 Nov 2026 |
| Aramness Gir | Family Kothi, all meals | ₹1,15,050 | Amor sheet published rate | 13 Nov 2026 |
| Aramness extras | transfers, safaris, excursions | same as cost | lodge's own list prices on the sheet | 13 Nov 2026 |

## Signals found but not used as caps (not like-for-like)

- **Tattwaa:** Expedia-group listings show about ₹10,500–11,800 a night in season (Mar–May; room type and plan not stated). One aggregator (Adani One) showed ₹4,417 for an April night, probably room-only off season. Our Forest Room with breakfast is ₹7,480 a night (Monday 8 Feb 2027), well below the in-season OTA level.
- **Nanau:** Expedia showed about ₹7,300 (NZ$146) for a July 2025 night, which is monsoon low season. Our Sitabani Studio with breakfast is ₹7,130.
- **Padma Villa:** listed on Booking.com (rated 7.4) with no price visible; the SaffronStays "PADM Villa" listing is withdrawn. No public price found.
- Booking.com search pages render prices with JavaScript, so a plain scrape returns nothing (15 Firecrawl credits used on 13 Nov, no data). The weekly check uses free web search first and at most 15 Firecrawl credits a run.

## How to add a reference

Add `market: { CP: 9000 }` to the room in `worker/lib/amor-rates.js` (tax-included, same room and meal plan, for a comparable date), add a row above with the source and date, then run `node tools/build-amor-offers.mjs` and `npm test`.
