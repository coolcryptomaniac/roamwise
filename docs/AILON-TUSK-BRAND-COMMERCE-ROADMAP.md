# Ailon Tusk branded commerce rollout
This PR adds an opt-in presentation contract and daily read-only review, not an automatic checkout or deployed UI.

Design: dark midnight surface, violet/blue primary actions, restrained gold accent, rounded cards, concise responses (200 chars), maximum four cards; full response only when expanded. Kumaoni Aipan motifs must be respectful and decorative, never obscure price, consent or accessibility. Maintain responsive keyboard navigation, contrast and reduced-motion support when integrating actual UI.

Catalog coverage: stays, shop, music, Pro, treks and packages. Each action opens the existing product/category flow; never use unverified model-provided price or external checkout URLs. Some categories have no generic checkout endpoint, so integration must use verified package-specific checkout and server-side SKU/rate resolution. Never auto-charge, auto-refund or assume Cashfree return means paid.

Daily Worker review: deterministic, no AI calls, no autonomous edits, no external messages. Stores last report in existing KV. To add Workers AI/OpenAI/Claude proposals later, use a separate capped and authenticated proposal pipeline, redact customer data, test changes, require human approval for deploys and payment logic. Do not permit models to modify production code or spend without governance.

Existing Worker /ai supports managed providers and caching with spend governance; verify current model availability and BYOK key handling before adding providers. Do not send customer BYOK secrets to a public browser or external partner API.

Testing: node --test tests/tusk-commerce-ui.test.mjs; stage and visually review before merging or enabling customer-facing UI. No live site, provider keys, payment configurations or bills changed.
