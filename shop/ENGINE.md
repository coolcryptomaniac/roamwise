# Shop engine: auto design → auto catalogue → sales-led promotion

Mohit's brief (27 Nov 2026): an AI shop that designs, lists and promotes print-on-demand products by itself, so he rarely has to check it. Promotion decision (same day): **no paid ads; promote in-house on the site**, featuring the products that get the most clicks or purchases. This builds on the existing shop: server-priced checkout (Cashfree/UPI), Qikink fulfilment and the D1/R2 storage added in #916.

## How a design becomes a sale
| Step | Where | What happens |
|---|---|---|
| 1. Theme queue | `shop/engine/themes.json` | Curated themes: Raveverse songs, Kumaon AIverse, travel, and trend songs such as *Paanch Sitaare*. The trend autopilot may append themes. |
| 2. Design (daily 09:10 IST) | `.github/workflows/shop-engine-design.yml` → `tools/shop-engine/design.py` | Workers AI emblem on black → 4× FSRCNN upscale → background keyed out → title typography → 3600×4200 px print PNG (12×14 in at 300 dpi) → garment preview. |
| 3. Automatic QC | same | Exact print size; ink coverage 10–80 %; bright enough for a dark garment; no AI-garbled text in the art (OCR); brand/franchise blocklist on the theme. Up to 3 tries, then the design is recorded as `rejected`. |
| 4. Register | `tools/shop-engine/publish.py` | Print file and mockup go to R2 `roamwise-media/shop/designs/<id>/`, served at `/media/r2/shop/...`. A row goes into D1 `shop_designs` with status `review`. |
| 5. Go live (daily 11:00 IST) | Worker cron → `runShopEngineCron` | With `SHOP_ENGINE_AUTOPUBLISH=true`, up to 3 QC-passed designs per day go `live`, with at most 24 live at once. |
| 6. Sell | `/shop/catalogue`, `/shop/quote`, `/shop/order` | Live designs join the catalogue. **Prices come only from `PRODUCT_TYPES` in `worker/lib/shop-engine-core.js`.** The shop page shows them under "New drops". |
| 7. Fulfil | `worker/lib/shop-fulfil.js` | A paid order goes to Qikink as a blank SKU plus `design_link` (`search_from_my_products: 0`). Retired designs stay resolvable for old orders. |
| 8. Learn | D1 `shop_sales_lines` | Every order accepted by Qikink is recorded once per line. |
| 9. Retire | Worker cron | A design that sells nothing in 45 days, or nothing for 90 days after its last sale, is retired. |
| 10. Promote in-site | `POST /shop/click`, `/shop/catalogue` → `popular` | Product-card and Buy-now clicks are counted anonymously, one per visitor per product per hour, with no personal data stored. Purchases weigh 40× (last 14 days) and clicks 1×. The top 4 products, static or engine-made, appear in "Popular now" at the top of the shop. New drops are ordered by the same score. |

## Switches
`SHOP_ENGINE_ENABLED` and `SHOP_ENGINE_AUTOPUBLISH` are on in `wrangler.toml` (27 Nov 2026). They are safe before setup: no design can go live or be bought until its product type has blank SKUs. Until then, "Popular now" ranks the existing live products by clicks.
| Switch | Where | Effect |
|---|---|---|
| `SHOP_ENGINE_ENABLED=true` | Worker variable | Engine products can be listed and bought; the daily cron runs. |
| `SHOP_ENGINE_AUTOPUBLISH=true` | Worker variable | QC-passed designs go live without a human look. |
| `SHOP_ENGINE_DESIGN=off` | Repository variable | Pauses the daily design workflow, which is on by default. It can always be run by hand. |
| `CF_AI_TOKEN` | Repository secret (optional) | A Cloudflare token with Workers AI permission, if the deploy token lacks it. |

## One-time setup before switching on
1. **Blank SKUs.** In the Qikink dashboard, copy the blank SKUs for each colour and size into `worker/lib/shop-engine-blanks.js`. A product type with no blanks is never sold.
2. **Sandbox order.** Place one order per product type in Qikink **sandbox** to confirm the design-line fields: `design_code`, `width_inches`, `height_inches`, `placement_sku` (`fr`/`bk`), `design_link`, `mockup_link`. These follow Qikink's create-order API but have not yet been run against it.
3. **Prices.** Check the prices in `PRODUCT_TYPES`: tee ₹899, hoodie ₹1,999, tote ₹599. They must cover blank + print + shipping + gateway fees.
4. **Deploy.** Run "Deploy Worker (manual)". Migration `0002_shop_engine.sql` is applied automatically.
5. **Design workflow.** Runs daily by default; set `SHOP_ENGINE_DESIGN=off` to pause it.

## Guardrails
- Original art only. Themes may not name a franchise, brand or game; the blocklist in `design.py` enforces this. No deity imagery on apparel. Kumaoni text only after a native-speaker check.
- The browser never sends a price. Design rows cannot set a price.
- Engine failures never break the static shop: every D1 error falls back to the static catalogue.
- No paid advertising. Promotion is on roamwise.co.in only.

## Not in v1
- Dropshipping of non-printed goods. These stay on the affiliate route in `PROVIDERS-AND-CURATION.md` until a product passes its scoring gates.
- Photographic mockups. v1 draws an honest garment preview.

## Free listings beyond the shop page
- **Product feed:** `https://roamwise-api.founder-f53.workers.dev/shop/feed.xml`. It lists every buyable product, with the same server prices as checkout.
- **Google Merchant Center:** free listings in Google Search and Shopping. Add the feed as a scheduled fetch (daily). Shipping is ₹99, or free from ₹1,000.
- **Meta Commerce Manager:** Instagram/Facebook catalogue for product tags on posts and Reels. Add the same feed URL as a data source.
- **Marketplaces:**
  - Amazon, Flipkart and Meesho need a GST registration first.
  - Myntra also needs brand/trademark proof and a ₹15,000 growth fee, and its model is stocked inventory, not on-demand printing.
  - Blinkit and Zepto (quick commerce) need stock in their dark stores, so they are not a fit for print on demand.
