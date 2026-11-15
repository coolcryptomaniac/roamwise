# Ailon Tusk: event handoff and optional sourced web search (November 2026)

## Event carousel handoff

All homepage event cards now hand their event record directly to `RWEventHandoff` before any generic destination parsing. The BTS 2026 answer is a deterministic swipeable itinerary with official agenda, directions, cost builder and visitor-access caveats. Scroll and haptics are opt-in and reduced-motion aware. This path does not depend on any paid model or user registration.

A typed request such as "Plan my trip around Bengaluru Tech Summit 2026" also receives this event-aware card. Live flight fares, hotel inventory, speaker appointment slots and investor access are *not* inferred from this static guide.

## Model failure and honest fallback

When AI providers are unavailable, the client no longer presents invented daily schedules or unrelated trekking vault cards as if they answered a complex query. The client tries cited/source-linked snippets through `rwMiniSearch` and always offers full search links. Search results are source excerpts, not verified synthesized factual answers.

## Optional backend search

`GET /tusk/search?q=...` is a disabled-by-default Cloudflare Worker route. If you decide to pay for Brave Search after checking the account cost and terms, set these **server secrets and switches only**:

- `BRAVE_SEARCH_API_KEY` — a secret Worker variable; never add it to browser code or GitHub.
- `TUSK_WEB_SEARCH_ENABLED=true` — explicit feature toggle, **off** by default.

The route returns up to four HTTPS Brave Search results and snippets, rejects email addresses and phone numbers in queries, has a 6.5-second provider timeout and uses the existing abuse and AI per-IP rate guards. Those guards are **not a reliable global monetary spending cap** because the backing limits are per-edge; do not enable a paid key without an independently enforced provider spend budget/alert and testing. RoamWise presently has not configured or verified an active key or payments for this route.

Do **not** implement a new Google Custom Search JSON API dependency: Google closed it to new customers in 2026 and has announced retirement of existing integrations by 1 January 2027. Google search remains an outbound user-opened link. Consider Google Gemini grounding/Vertex or Brave only after establishing pricing, legal terms, and server quotas.

## Release checklist

- `node --test tests/summit-event-handoff.test.mjs` and repository CI.
- Verify live homepage event rail: choose BTS → page moves to Ailon and shows the BTS itinerary, never trek cards.
- Verify voice and chat both use event-specific facts for a natural language BTS query.
- Test on Android Chrome and WebView: swipe gesture still works, light haptics only on deliberate card activations or strong swipes, reduced motion avoids animation.
- With a disabled AI provider, ask a complex non-event question: a cited search card or honest uncertainty must appear; no invented details.
- Optional Brave route returns 503 when not configured; never claim live search without real production verification.
