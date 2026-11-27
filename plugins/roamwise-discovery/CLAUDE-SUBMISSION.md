# RoamWise Discovery — Claude Connectors Directory draft

**STATUS: Source metadata only. Not submitted, approved or publicly indexed.**
Reviewed against official Anthropic [submission requirements](https://claude.com/docs/connectors/building/submission) on 22 November 2026.

## Connection
- Type: Remote MCP / MCP Apps
- Transport: Streamable HTTP
- Server URL for initial testing: `https://roamwise-api.founder-f53.workers.dev/mcp`
- Auth: `none` (anonymous public discovery, server-priced **read-only** previews)
- Persistent user data: not accessible through this connector
- User setup: no RoamWise account required to search public listings. Product or stay checkout opens RoamWise's first-party site and may request an account.
- Public listing slug **proposed**: `roamwise-discovery` (only select if available; cannot be changed after publishing)
- Server name: RoamWise Discovery
- Tagline (55 characters max): `Find stays, art & shareable travel itineraries`
- Category: Travel
- Developer: RoamWise
- Website: https://roamwise.co.in
- Docs: https://roamwise.co.in (replace with a dedicated docs page when published)
- Support: support@roamwise.co.in
- Privacy: https://roamwise.co.in/privacy.html
- Terms: https://roamwise.co.in/terms.html
- Icon: existing RoamWise logo (obtain source binary from repo `assets/img/roamwise-logo-176.webp`, check portal pixel/format rules before upload)

## Listing description

Discover thoughtful travel and original art through RoamWise. Search curated public hotel and homestay listings in Uttarakhand and Himachal, explore artist portfolios, and open beautiful prebuilt itineraries for Kumaon, Ladakh and other destinations. Browse official RoamWise merchandise and request server-calculated pricing previews for eligible products and stays. Swipeable cards make it easy to compare and open the original listing.

RoamWise shows public listings, not real-time room availability or artwork stock. Quotes do not reserve inventory or collect payment. For purchases and bookings, customers continue to the official RoamWise checkout and expressly authorize payment. Personal trip history, private contact details and wallet balances are not available through this connector.

## Primary use cases
1. Search RoamWise-listed stays in Almora, by destination or type.
2. Explore Natasha Guleria's public artist page, subject to artwork image rights.
3. Discover and share public ready-made Kumaon or Ladakh route PDFs and web itineraries.
4. Browse RoamWise merchandise, variants and official product pages.
5. Preview a server-calculated payment quote without creating any order.

## Allowed link URIs
- https://roamwise.co.in
- https://roamwise.co.in

These are the exact origins currently permitted by the MCP Apps card link allowlist. Do not add Cloudflare, Cashfree, third-party image-CDN or unowned domains to Anthropic's allowed links.

## Required before clicking Submit
- An Anthropic **Team or Enterprise organization** and authorized Directory management admin access (individual Pro/Max plans can TEST custom connectors, not use the current directory portal).
- Test this server with Claude custom connector and MCP Inspector (all seven current tools, read/write annotations, error cases and MCP Apps resource).
- Capture **3–5 actual PNG screenshots**, at least 1000px wide, cropped to the MCP Apps response. Pair each with its triggering prompt. Do not submit mockup screenshots as if they were real client output.
- Verify all links on live DNS/HTTPS, image rights, privacy policy, company name and account-support address.
- Auth = none is permitted for this public catalog; introduce OAuth 2.0 only in a later separately reviewed authenticated release.
- Verify no credential or user history appears in a response and that checkout is user-controlled.
- Review any additional compliance assertions in the live portal; do not accept on another person's behalf.

## Submission
https://claude.ai/directory/manage

The public directory's current reviewer account requirements are described at https://claude.com/docs/connectors/building/submission.
