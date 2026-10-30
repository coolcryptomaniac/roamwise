# Kumaon collection launch — 30 October 2026

## Delivered
`/shop/` is a concept catalogue and client-side enquiry composer, linked from the homepage. Twelve concepts, category filtering, applicable size selection, quantity and optional PIN validation, encoded email handoff and copy fallback. No personal information is persisted by this page, and no message is sent automatically. No supplier integration, payments, reservations, inventory or order tracking is active.

## Supplier decision
- Qikink: first sample candidate. Official site advertises custom storefront support, POD, COD and 2–3 business-day dispatch. Dispatch is not delivery. Confirm actual SKU, API access, wallet funding, print cost, shipping, tax, RTO and defect policy in the seller account. https://qikink.com/
- NexelPrint: earlier research candidate, superseded by the active Qikink/Printrove/Printify shortlist; not an approved partner. Official catalogue distinguishes 240 GSM tees from 320–350 GSM hoodies. Obtain a full landed quote and test quality rather than assuming vendor marketing is a guarantee. https://nexelprint.com/pricing
- Roposo Clout: exclude. Official notice says marketplace services ended 1 April 2026. https://app.roposoclout.com/b2b/login
- Pocketly: no verified wholesale integration identified. Do not connect a similarly named lending service or unverified app.
- Travel goods: shortlist domestic suppliers only after comparing actual samples, invoice identity, shipping to Almora and a metro, tracking, return handling and margin. Until then, remain concepts. Affiliate links require approved accounts and disclosure; resale is a distinct model, not commission income.

## Small-batch launch sequence
1. Founder creates/authorises the selected POD seller account; complete its business verification. Keep credentials in deployment secrets, never public JavaScript or chat.
2. Request a written landed quote for one tee and one hoodie sample from each candidate. Do not order or spend without a defined budget. Select on print/wash/shrinkage/fit tests, not GSM alone. Photograph actual samples and publish measured size charts.
3. Founder supplies and approves designs created with AI assistance. No commissioned artist or royalty is required by default. Use original or appropriately licensed assets; obtain permission for any third-party artwork used.
4. Approve one tee, one hoodie and one tote first. Keep gadgets on hold until their own sample and supplier checks pass. Avoid a separate Shopify/Wix subscription while existing RoamWise can host the catalogue.
5. Calculate SKU economics using ex-tax revenue and cost consistently: contribution = revenue minus blank/print, outbound shipping, payment charges, packaging, any applicable artwork licence cost, expected returns/RTO and customer acquisition. Separate tax payable from revenue. ₹1,600 minus ₹800 is ₹800 gross spread (50% of selling price), not net profit.
6. Obtain current tax/invoice and consumer-policy review for the actual selling model, destination coverage and seller entity. Do not reuse the accommodation or Pro checkout for merchandise.
7. Separate payment/integration PR: server-priced SKU/variant allowlist; stock/pincode verification; immutable order ID; signed webhook verification; idempotent payment and supplier submission; retry/manual exception queue; verified tracking; refunds to original payment method; status visible to buyer. Secrets stay server-side. Test duplicate webhooks, failed payments, supplier rejection, cancellation and refund reconciliation before enabling sales.
8. Publish final customer price, seller identity, sample photos, material, size chart, dispatch plus delivery estimate, cancellation/return/defect terms and support contact. Confirm COD costs and coverage before offering COD.
9. Pilot with five paid orders after the preceding checks. Expand only after delivery and support workload are measured. No inventory bulk-buy or daily manual founder workflow is assumed.

## Owner workload
Batch enquiries twice weekly at support@roamwise.co.in; one operator can collect supplier quotes and sample evidence. Founder makes the sample, economics and artwork decisions. Once enabled, automated fulfilment should handle normal orders and show only exceptions to the operator. This automation is a future integration, not part of this release.

## Verification and rollback
Run `node --check shop/shop.js`, `node --check shop/catalog.js`, `node --test tests/shop-launch.test.js`, and `node tools/generate-sitemap.js --check`. Check mobile and desktop category filtering; select clothing then accessories; validate quantity and PIN; prepare but do not send an email; test clipboard failure; check keyboard focus and no-JS fallback. Revert the feature commit to remove the route, homepage link and sitemap entry. Existing auth, bookings and payment code are unchanged.

## Confirmed founder model — 30 October 2026

| Channel | RoamWise responsibility | Supplier responsibility | Revenue |
|---|---|---|---|
| Clothing | Founder-approved designs, product listings, website/WhatsApp order intake and customer support | Qikink, Printrove or Printify, selected per approved SKU and destination: garment, print, packing and delivery | Retail price less fulfilment and other actual costs |
| Travel essentials | Demand screening, curated listings, order attribution and agreed commission accounting | Approved dropshipping supplier: stock, dispatch, tracking and contracted returns handling | Fixed negotiated percentage or rupee commission per eligible order |

Do not substitute an arbitrary wholesale markup for the travel-goods commission agreement. Record for each supplier: percentage or fixed amount; commission base (including or excluding tax/shipping); who collects payment; seller/invoice issuer; when commission is earned; cancelled/refunded order treatment; settlement cycle; support and returns owner. No rate or supplier agreement has been accepted yet.

Travel products must have dated evidence of demand (supplier fulfilled-sales evidence where available, corroborating marketplace demand signals, or RoamWise customer enquiries), viable commission after support/returns costs, sample approval and a reliable domestic fulfilment record before publication as purchasable listings. Packing cubes and tech organisers remain hypotheses, not verified high-demand products. Review a small initial shortlist; remove weak performers rather than expanding a generic catalogue.

Website and WhatsApp are two intake channels for the same future order ledger. Both must resolve to a validated SKU, variant, quantity, confirmed price and shipping address, then a unique order/payment reference. Never mark payment complete from a WhatsApp screenshot. Confirm gateway status server-side and forward only paid/approved orders to the supplier. A WhatsApp enquiry alone is not a placed order.

WhatsApp sales recipient confirmed by the founder: +91 99873 79730. The enquiry composer opens a direct `wa.me/919987379730` chat with the selected concept, applicable size, quantity and optional PIN. Customers explicitly open WhatsApp and send the message themselves. No group is used and no messages are sent automatically. Checkout, order records, payment verification and supplier fulfilment remain pending; WhatsApp currently accepts enquiries only.

## Confirmed payment channels
Founder authorised the existing business UPI ID `roamwisepay@ybl` and Cashfree for merchandise. The enquiry composer records the customer's preference; it does not create a payment or represent success. No prices or supplier SKUs are approved in the current concept catalogue.

Implementation boundary: the existing `/cashfree/order` grants Pro/Bhakti entitlements and `/partner/cashfree/order` handles stay bookings. Neither is a merchandise checkout. Do not route merchandise through either endpoint or treat a payment as Pro access. Add merchandise order creation/status under a separate reviewed payment PR, using the existing server-side Cashfree credentials without exposing or copying them.

Before charging: a confirmed, immutable order must carry approved SKU/variant, quantity, shipping details, server-calculated total, seller identity, fulfilment confirmation and payment expiry. Cashfree should create a session for that order; trusted status verification must match order ID, amount and INR before marking paid. Direct UPI should use the same order reference, recipient and exact total, remain pending until the receiving bank/merchant record is reconciled by an authorised operator, and never trust a screenshot, UTR entry or return from a payment app as confirmation. Reconcile across both methods to avoid duplicate charging; fulfil each order once. Cashfree settlement destination remains controlled by the existing merchant dashboard, not by setting this UPI ID.

Remaining inputs: approved product SKU/variants and full prices, supplier account/fulfilment configuration, plus merchandise payment sandbox verification before enabling checkout. The confirmed payment preference requires no change to existing Pro, stays or entitlement logic.

## Three-provider configuration
`RWShopProviders` in `shop/catalog.js` lists Qikink, Printrove and Printify, all `not_connected`. Customers can express an optional preference for POD items (including the tote); travel-goods enquiries do not offer print providers. This is a catalogue/enquiry configuration, not an API integration or promise that every concept exists at every provider. See `PROVIDERS-AND-CURATION.md` for the dated comparison and travel-goods launch rules. Never substitute providers automatically after a customer's sample/specification is confirmed.
