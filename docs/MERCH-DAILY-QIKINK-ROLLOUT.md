# RoamWise AI-style merchandise studio — daily concept and Qikink gates
**22 November 2026 · implementation note**

## What is implemented
- `/shop/` now has a white, mobile-first, swipeable Ailon-inspired discovery interface with voice input where the browser supports Web Speech Recognition. Select a card, then explicitly continue to the **existing** product checkout or the review-only enquiry form.
- Catalog has one original **Rave to Rise × Buransh** graphic concept in two garment candidates (T-shirt and hoodie) with separate transparent vector previews for **back, chest, sleeve** under `shop/img/`. These are concepts, **not manufacturing mockups** or provider-approved print files. The independent bitmap generated during design review also remains a non-print-ready concept until proper full-size prepress.
- `.github/workflows/merch-daily-review.yml` runs at 04:50 UTC / ~10:20 IST each day and commits **at most one new original, dated design concept** per IST day directly to the public preview inventory. It never commits a payable Qikink SKU. Scheduling is best effort, subject to GitHub Actions.
- `tools/merch-daily.mjs` generates **procedural vector art**, no expensive AI API calls, and appends a review-only record to `shop/daily-products.json`. The site loads daily entries as clearly marked **unapproved concept previews**, never as verified product listings. No new product is made payable automatically.
- Inspiration rotation: original Rave series, Aipan-inspired geometry, Panchachuli, Buransh, Kasar Devi, Myar Pahad, Almora landscapes. Avoid copyrighted anime franchise artwork, official marks and unlicensed artists' designs.

## Current AI and Qikink capabilities — no false promises
Qikink's own guide says it does **not provide designs or in-house design services**: https://qikink.com/help/getting-started/how-do-i-get-started/ . It supports Shopify/WooCommerce product push, and Open API for custom-store integrations. Its documented product flow involves creating the design+product, saving in **My Products**, and obtaining real SKUs. https://qikink.com/help/integrations/push-products-to-your-shopify-or-woo-commerce-store/

RoamWise **already has** Qikink order submission (`worker/lib/qikink-client.js`, `worker/lib/shop-fulfil.js`), and the server-side authoritative `worker/lib/shop-catalogue.js` with real variant SKUs for currently approved products. Never insert a review concept into that server catalogue or call Qikink to fulfil it without supplier SKU validation. The order pipeline may charge the Qikink wallet on verified paid orders.

The daily pipeline is **autonomous design ideation**, not live model-generated art, live trend rankings, Qikink product creation or automatic commercial publication. To later enable AI imagery, connect an approved model provider with a strict cost ceiling, preserve original copyright policy, manually validate source file size and print suitability, and establish an authenticated upload/product-creation API in Qikink where supported. Do not invent or assume that API. Trend inputs should be dated evidence from Search Console, consenting site query analytics and published market studies, **not invented search-volume metrics**.

## Review to first paid sale
1. Choose actual Qikink blank (fit, fabric, colour), then actual print placement and price, not an assumed manufacturer price.
2. Provide image files at supplier's requested print dimensions, check transparency, bleed, anti-aliasing, contrast, colour and print licensing. **SVG browser preview does not guarantee the supplier accepts SVG.** If a 300 DPI 12-inch back print is required, the raster source should actually contain at least 3,600 source pixels; merely changing DPI metadata or upscaling a small bitmap will not create missing details.
3. Place a paid sample **only with founder approval**, confirm print on garment and photograph the real sample before labelling it a product photo.
4. Create the approved Qikink My Products SKU(s), map variants to `worker/lib/shop-catalogue.js` server-only, add matching live product sections on `/shop/`, test Cashfree/UPI checkout plus Qikink fulfilment and refund conditions in sandbox.
5. Only then change catalog entry `live:true` and show buying options. The site displays final quote from the Worker, never a client-calculated payment amount.

## Operational constraints
- No paid ads, unapproved seller commitments, automatic Qikink-wallet charges or outside AI API spend are introduced.
- Unreviewed original vector designs may be auto-committed to GitHub's public **concept preview** feed, with no purchase enabled. Real SKUs, prices and inventory must still pass a separate human approval before becoming buyable. This is intentionally not a fulfilment-ready inventory feed.
- GitHub Actions needs only `contents:write` to commit dated concept records; the original PR bot route was denied by repository settings on 22 Nov 2026. Daily commits stage only the dated SVG, concept JSON and a run-status JSON, never binary print artifacts. Protected branches may still reject commits.
- Existing homepage Ailon booking/room data contracts remain distinct from the new shop visual cards; no supplier live quote is fabricated by this UI.
- Future trend insight sources: internal product search with consent, Google Search Console verified metrics, actual orders, credible streetwear market research, and first-party interviews.
