# RoamWise AI Discovery: REST + MCP Apps (fast-track)

**Implementation status:** PR source code and automated tests. **Not production verified or installed in ChatGPT/Claude.** Deployment occurs only after review, merge, GitHub Actions success and Cloudflare routing validation.

## Architecture

One existing Cloudflare Worker (`worker/worker.js`) serves:
- `POST /mcp` — read-only Model Context Protocol (MCP) using Streamable HTTP JSON responses.
- `GET /v1/discovery/search?q=Almora&type=stay&limit=6` — structured items + image-first card metadata.
- `GET /v1/discovery/items/natasha-guleria` — public listing details.
- `GET /v1/discovery/openapi.json` — OpenAPI 3.1 description for developers.

Anticipated production base: `https://api.roamwise.co.in`. **Verify this DNS, SSL, Worker route and endpoint externally before sharing as live.** The previous `/tusk/mcp` route remains untouched.

### MCP tools
- `search_roamwise({q?,type?,region?,limit?})`
- `get_roamwise_listing({id})`
- `roamwise_enquiry_link({id})` — navigation only; never creates an order, invoice, booking or lead.

Search is linked to the standard `ui://roamwise-discovery/cards-v1.html` MCP Apps view. Hosts with MCP Apps support can render horizontal swipe cards and licensed stay photos; hosts without UI support receive structured text/JSON and the same official links. The UI never calls payment APIs.

The connector handles 2026-07-28 stateless requests (including `server/discover` and required matching method/version headers), and earlier 2025 Streamable HTTP initialize calls. No SSE streaming is needed for these short read-only operations.

## Catalog and publication controls

`worker/lib/roamwise-discovery-catalog.js` contains a manually curated **starter manifest**, not a live catalog of all suppliers or an authoritative reservation engine. Seed items: Natasha Guleria (public profile only), Milan Heights, Soulmate Homestay, Woodbook The Devine, Big Bro Hotel, Ailon Tusk, corporate offsite and destination wedding **enquiry categories**.

- Natasha's portrait and artwork photos are intentionally excluded from the connector until third-party syndication permission is confirmed. Her existing RoamWise public profile is linked.
- Stay photos use existing partner-listing images; review partner agreements and third-party image embedding permissions before enabling external distribution. Remove any image if permission is revoked.
- A `signed_partner` label refers to recorded RoamWise agreement status, **not real-time room verification**.
- Every response explicitly sets `availability_verified:false`, `price_verified:false`, `booking_confirmed:false`, and `payment_started:false` or equivalent. No owner mobile number, net rate, hidden commission, token, customer history, private trip, or bank detail is exposed.
- To scale to many listings, build a consent-gated approved public Firestore→KV catalog index with explicit removal/revocation, updatedAt, expiry, and safe page references. Do not scan CRM or use draft partner records.
- REST results are public and cacheable for 300 seconds, MCP requests are no-store; a loose public abuse guard is already used by the Worker.

## Testing

Run `node --test tests/roamwise-discovery-mcp.test.mjs tests/tusk-mcp.test.mjs`, `node --check worker/worker.js`, `node --check worker/handlers/roamwise-discovery.js`, `node --check worker/lib/roamwise-discovery-catalog.js`, `node --check worker/lib/roamwise-mcp-ui.js`, and the repository checks.

Before production release:
1. Verify this PR's checks and ensure there are no Worker route conflicts.
2. Deploy the reviewed merge using the existing Worker GitHub Actions setup (do not manually reveal Cloudflare secrets).
3. Smoke-test HTTPS GET searches, GET detail, POST `server/discover`, POST `tools/list`, POST `tools/call`, and `resources/read`. Check response metadata, UI iframe CSP and display on mobile.
4. Verify that public artist and property permissions permit external-host surfacing; remove unlicensed images.
5. Connect privately with a ChatGPT custom app/MCP client where the user's plan/workspace supports it; test with Claude's Customize → Connectors → Add custom connector using the verified `https://api.roamwise.co.in/mcp` address. Follow host-specific setup and OAuth requirements if write/personal tools are added.
6. Test one positive artist query, one Almora stay query, one package query, one unknown ID, one denied booking attempt and a no-availability claim.
7. Prepare privacy policy, support contact, developer verification and platform submission materials before public discoverability. A working MCP URL does **not** automatically make RoamWise a searchable or featured public ChatGPT/Claude app.

## Non-goals / future milestones

No direct reservation, payment, refund, login, BYOK, AI inference, WhatsApp message send, automated supplier outreach, owner-contact disclosure or fee changes. A future authenticated `quote_stay` tool must verify supplier availability and a final all-inclusive quote server-side, require user confirmation, and preserve Cashfree webhook/booking reconciliation. Do not call an enquiry a completed booking.

## Example request

```bash
curl -fsS 'https://api.roamwise.co.in/v1/discovery/search?q=Almora&type=stay'
```

```bash
curl -fsS 'https://api.roamwise.co.in/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: server/discover' \
  --data '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}'
```

These commands are illustrative **until deployment and live verification**.
