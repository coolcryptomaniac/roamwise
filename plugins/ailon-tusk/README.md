> **Legacy package — not the current directory submission.** The old `/tusk/mcp` URL at `api.roamwise.co.in` remains unverified. For the deployed, read-only public RoamWise MCP and current OpenAI/Claude directory checklist use [../roamwise-discovery/README.md](../roamwise-discovery/README.md). OpenAI now accepts MCP-only submissions directly in its portal; a ZIP is not mandatory unless bundling a plugin. Do not submit this legacy manifest without updating its endpoint, schema and test cases.

# Ailon Tusk ChatGPT plugin submission candidate

This is a source package, not a submitted or approved plugin. Before upload, verify `api.roamwise.co.in` resolves and serves the Cloudflare Worker `/tusk/mcp` endpoint. The current MCP endpoint is intentionally read-only and unauthenticated; personalized booking/payment tools require OAuth and verified consent.

Official process: verify developer identity; add a custom MCP server in ChatGPT Plugins; validate tools; package plugin.json and mcp.json at ZIP root; upload in developer plugin portal; pass metadata/MCP scans and domain challenge; supply five positive and three negative review cases, demo video and privacy policy; submit for review. Do not include API keys or customer data. Confirm schema compatibility with current portal before submission.

For website use /embed/ailon-tusk.js. For mobile apps, use a WebView or platform-specific wrapper. Checkout stays on RoamWise.
