# Ailon Tusk rollout
This PR is a foundation, not a live ChatGPT App, MCP server or production checkout.
Default UI: short summary and up to four cards, expand only on request. Never invent inventory, prices, images or booking confirmation.
One-click/chat checkout must reuse authenticated server-side quote and Cashfree order APIs; verify price and availability at checkout, require explicit customer payment approval, persist payment/webhook and booking status atomically, and never equate redirect with confirmation.
Existing BYOK and Cloudflare provider routes must be reviewed before changing. Keep secrets server-side; enforce rate limits and actual spend caps.
Third-party ChatGPT integration needs a standards-compliant MCP server, authentication, consent, tool schemas and platform review. Public read-only OpenAPI discovery does not make it an installed app.
Run node --test tests/tusk-presentation.test.mjs, then staging tests, merge, deploy and verify host routing. No real payment or booking changes in this PR.
