# RoamWise Discovery — publication checklist

**Status: MCP server deployed and read-only live smoke tested. NOT submitted to OpenAI or Anthropic and NOT publicly listed.**

Production origin: `https://roamwise-api.founder-f53.workers.dev/mcp`
Production evidence: https://github.com/coolcryptomaniac/roamwise/actions/runs/44982971643 (all health and MCP search/UI/itinerary smoke steps passed).
A custom domain `https://api.roamwise.co.in/mcp` has been proposed but is **not verified**. Do not use it in a submission form until SSL, DNS, route and tool listing are tested.

## OpenAI Plugins Directory — MCP-only route, first priority

1. In https://platform.openai.com/plugins open **Create plugin → With MCP**. MCP-only submission can be completed entirely in the portal; a ZIP is **not mandatory** unless bundling skills or testing a local plugin source.
2. Confirm verified RoamWise developer/business identity in the same OpenAI Platform organization; Owner or Apps Management Write permission is required. This account-level action cannot be inferred from repository status.
3. Enter the **working universal remote MCP URL**. Select authentication **none** for the current public catalog only; explicitly document that `quote_roamwise_shop` and `quote_roamwise_stay` never charge a customer. Any later private wallet/booking tools require separately designed OAuth 2.1 / PKCE and a new security review.
4. Use official production logo and public website, `https://roamwise.co.in/privacy.html`, `https://roamwise.co.in/terms.html`, `https://roamwise.co.in/contact.html`. Confirm the public policy accurately describes the MCP service and current checkout providers before publication.
5. Set UI CSP only for approved RoamWise origins. Confirm `resources/list`, `resources/read`, and fallback structuredContent in a real host.
6. If the portal requests Domain Verification, use the **exact token it generates**. Host only that token at `https://<challenge-base-host>/.well-known/openai-apps-challenge`; it must be on the MCP hostname or its parent domain. Do **not** invent a challenge value, hardcode it in GitHub or expose other secrets. The unowned workers.dev parent cannot be treated as roamwise.co.in. Prefer connecting the Worker to a custom domain you control (Cloudflare Worker Routes/Custom Domains) first.
7. Run Scan Tools and inspect tool metadata. All read-only tools must have `title`, truthful `readOnlyHint=true`, `destructiveHint=false` and `openWorldHint=false`; no create-order, account-wallet or private-booking tool belongs in this submission.
8. Add 5 positive + 3 negative cases from `review-tests.json` and 4 starter prompts from the plugin manifest. Add a real reviewer-visible walkthrough/screenshot if the portal requests one. No demo login is needed for the current anonymous read-only server.
9. Choose **India** as launch scope first unless additional jurisdictions, support and consumer terms have been verified. Submit for Review; **publishing is a separate step after approval**. Nothing is automatically installed or indexed by a working MCP URL.

Official sources:
- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/build/plugins

## Claude Connectors Directory — separate submission

Follow `CLAUDE-SUBMISSION.md` and https://claude.com/docs/connectors/building/submission. A current **Team/Enterprise** organization owner or directory admin is required to publish a remote connector. Ordinary Free/Pro/Max Claude accounts can still test custom connectors at Customize → Connectors → Add custom connector. Anthropic supports auth type `none` for public read-only services. Enter allowed link URIs and provide actual UI response screenshots (3–5 PNGs >=1000px wide). Do not claim a Verified badge or publication until issued by Anthropic.

## Custom domain deployment hand-off

If `api.roamwise.co.in` is under Cloudflare zone control:
- Configure a Worker **Custom Domain** or route targeting the existing `roamwise-api` service in Cloudflare dashboard. Confirm no existing DNS entry conflict and no impact on main site or email.
- Use a scoped Cloudflare deployment token. Do not paste credentials in chat or commit them to GitHub.
- Smoke-test all of `GET /health`, `GET /v1/discovery/search?q=Almora&type=stay`, `GET /v1/discovery/capabilities`, `POST /mcp` tools/list, search_roamwise, resources/list and resources/read with the new hostname.
- Only after success should the URL in `.mcp.json` and the platforms' listing forms be switched to `https://api.roamwise.co.in/mcp`.
- If zone control is not in Cloudflare, configure the domain through the appropriate DNS/SSL owner **first**; do not alter the app's already working Worker URL on a guess.

## Privacy / legal review blockers

Current `privacy.html` still lists historical checkout providers and was last updated in September 2026. Before public submission, a responsible RoamWise operator should verify and update its payment processors, hosted AI connector processing, public listing image permissions, access logs, data retention, support contacts, regional coverage, and disclosure of any third-party sharing in line with actual implementation. Avoid legal claims not supported by production.

MCP Apps image syndication rights must cover showing pictures **outside** RoamWise (including assistant clients). The connector deliberately withholds Natasha Guleria artwork photos until that permission is evidenced.

## Future authenticated commerce / wallet release (not public yet)

Use separate scope-limited tools for accounts, personal itineraries, wallet balances and orders. Authorization server must publish OAuth 2.1 discovery metadata, protected resource metadata and PKCE-compatible client registration. Tokens must be validated for issuer, audience, scopes and expiry. Wallet spending additionally requires an explicit customer approval, idempotent ledger transaction, authoritative pricing and verified Cashfree reconciliation. Do not expose these in this read-only plugin package. ChatGPT Wallet is not the RoamWise refund-credit wallet.

## Local bundle note

The optional `.codex-plugin/plugin.json` + `.mcp.json` files are developer source for local plugin workflows, not evidence of public review acceptance. The OpenAI universal directory's **With MCP** portal is the preferred initial submission path.
