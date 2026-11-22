# RoamWise chat-commerce roadmap — 22 Nov 2026

## What actually works in this PR
- MCP Apps v2 UI with image-first artist, stay, package and merchandise cards, mobile horizontal swipe, accessible controls, strong contrast and calm RoamWise branding.
- Listing cards can launch an **in-chat, read-only quote preview**, using `tools/call` from the embedded MCP Apps view. Falls back to canonical RoamWise URLs if host UI tooling is missing.
- `browse_roamwise_shop` reads existing shop configuration and public variant catalogue; it never claims stock is reserved.
- `quote_roamwise_shop` delegates to the existing `POST /shop/quote` engine. It needs item, variant, quantity and Indian shipping PIN, and returns the calculated INR item/delivery amount. **It does not create an order or charge anything.**
- `quote_roamwise_stay` delegates to the existing `POST /stays/quote` engine. Currently only the four public catalog records with the known pricing IDs: Milan Heights, Soulmate Homestay, Woodbook The Devine and Big Bro Hotel. For refundable advances, **only the deposit is known**, not the room's final amount; the tool displays this explicitly. No supplier availability/hold is guaranteed.
- Both quote flows open the existing verified RoamWise web checkout only after the user elects to continue. No automatically submitted orders, personal details sent in chat, silent wallet debits, or payment tokens handled by MCP.
- All amounts are supplied by the server's existing pricing logic. Never trust a model-proposed total. Existing signed Cashfree webhooks and supplier-confirmation lifecycle remain unchanged.

## Real purchase/booking inside ChatGPT and Claude

### Today: embedded selection + merchant checkout
MCP Apps supports shared rich UI in compatible ChatGPT and Claude clients: https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ .
Merchant-hosted checkout remains the general recommendation for ChatGPT plugins, and current review is limited to eligible physical-goods commerce categories: https://developers.openai.com/plugins/build/chatgpt-ui .
No embedded payment API for Claude or ordinary merchant access to ChatGPT's payment sheet is assumed. Never label checkout as completed if the user merely clicks a merchant link.

### ChatGPT payment sheet (restricted partner option)
Official technical reference: https://developers.openai.com/plugins/build/monetization .
An eligible, explicitly approved integration may someday return a server-owned checkout session to `window.openai.requestCheckout` and implement `complete_checkout` to verify delegated payment tokens, total amount, fraud checks, merchant account details and idempotency. This **must not be enabled** until:
1. OpenAI enables RoamWise for the applicable commerce category (physical merchandise and hospitality need separate platform approval if required).
2. The merchant PSP explicitly supports the delegated token format and settlement in the relevant market.
3. The payment session persists securely with a server-side total, expiry, buyer approval, unique idempotency key, and order reference.
4. A provider webhook or authoritative lookup verifies settlement and a supplier confirms room inventory.
5. A declined/cancelled/3DS/error case is tested in sandbox and refunds are operational.
6. Sensitive payment credentials and personal data never enter the model, MCP logs, or a general chat transcript.

### ChatGPT Wallet (announced 13 Nov 2026)
Wallet is initially limited to US-eligible Pro users in **Dots**, not normal ChatGPT chat, and requires an eligible US-issued payment card. It works through compatible merchant checkout websites, NOT by RoamWise receiving an OpenAI wallet balance API or automatically collecting funds.
Official: https://openai.com/index/introducing-chatgpt-wallet/ and https://help.openai.com/en/articles/20001654-making-purchases-with-chatgpt-wallet .
To improve compatibility, investigate Cloudflare **Web Bot Auth** verified agent requests and test that Cloudflare's rules don't block the authenticated ChatGPT browser. Do not blindly allow all bots, disable fraud protection, or weaken checkout validation. Ask Cashfree whether agent-generated tokenized card credentials can pass its processor/fraud systems in the markets supported. Dots Wallet must never be conflated with the **RoamWise refund-credit wallet** in `worker/handlers/wallet.js`.

### RoamWise refund-credit wallet
Already supported in the existing first-party stay/shop web flows. Never expose its email link token or balance through the public MCP connector. A later authenticated MCP payment experience needs account-scoped OAuth, a verified user, server-side wallet ledger transaction/idempotency and a separate explicit approval step. Wallet balance is not a payment authorization.

## Design: premium professional marketplace cards
- Artists: large creator image **only after written external syndication permission**; name, discipline, city, reviewed portfolio, one clear portfolio action.
- Stays: approved property photo, concise location, partner/listing status, verified room facts where available, quote/dates action. Avoid reviews/ratings that have not been independently verified.
- Products: first-party product image, real SKU-independent public variant, server-published price label, PIN delivery quote and merchant checkout.
- Experiences: supporting destination photo only where licensed; package brief and enquiry button, not fabricated availability or live total.
- Mobile: one prominent card per swipe, calm whitespace, accessible 44px touch areas, no horizontal page overflow. Desktop: cards remain a horizontal rail.
- No dark patterns, fabricated reviews, infinite promotions, paid placements disguised as independent recommendations or stale price badges.
- Host look-and-feel isn't controlled by RoamWise; use MCP Apps data and UI for best cross-host presentation, with text fallback.

## Launch checkpoints
1. Run `node --test tests/roamwise-discovery-mcp.test.mjs tests/roamwise-mcp-commerce-preview.test.mjs` and full repo health checks.
2. Review the card HTML sandbox and host-message semantics on both ChatGPT and Claude; the embed origin must be allowed and the card resource CSP must be locked to RoamWise domains.
3. Merge only after tests pass. Deploy the existing Cloudflare Worker with no new secrets or services.
4. Validate /mcp and /v1/discovery live. Check real shop quote and stay quote responses without generating payment orders.
5. Verify seller photo syndication permission and artist commission contracts before enabling external art payment flows. Natasha's image remains intentionally absent in this phase.
6. Pilot shop merchandise with a sandbox Cashfree transaction from *RoamWise's own merchant checkout*, verify webhook and fulfillment before claiming any end-to-end purchase.
7. Apply to host marketplaces separately. A merged MCP PR does NOT install or feature the app for ChatGPT/Claude users.

## No-go rules
- No `complete_checkout`, `create_order`, `book_room`, `spend_wallet` public MCP tool until payment-processing rights, authenticated user consent, anti-replay protections, authoritative inventory, pricing, webhook reconciliation and platform authorization are proven.
- No claim that RoamWise has blanket ChatGPT Wallet merchant access; no access to a user's saved Wallet cards.
- No fake seller rating, inventory, exclusivity, instant confirmation, tax-inclusive quote or price comparison.
