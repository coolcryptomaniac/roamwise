# RoamWise: built to outlast any one technology

Nobody can promise ten years, so this is a list of the choices that keep change cheap, and of what is still a risk.

## What is already in place
- **Nothing is welded to one AI.** All model calls go through `aiCallAny` / `aiCall` (js/copilot/ai-providers.js) and the Worker `/ai` route. Swapping Cloudflare AI, Sarvam, Gemini, Groq or a future model is a one-file change; answers are cached and re-checked, not tied to a model.
- **Facts are ours, models are guests.** Curated place facts, events, stay data and the stay-receipt maths are plain data and pure functions with tests. A new model can improve wording; it cannot silently change a price or a date.
- **No bundler, no framework.** Classic `<script>` files and plain CSS run in any browser that exists now and are readable by any future tool. The cost is manual load order (see ARCHITECTURE.md).
- **Versioned storage everywhere.** Device keys (`rw_ans_v1`, user memory) and cloud records (`v: 1` in `tusk-learned.js`) carry a schema version, so a future format can read old data and migrate it instead of dropping it.
- **Storage behind one function.** Shared learnings use `learnedStore()` in `worker/handlers/tusk-learned.js`. Moving from Cloudflare KV to D1, R2 or another provider means rewriting that function only.
- **Free-tier ceilings are designed in:** KV writes are capped (300/day), reads are edge-cached, and every limiter fails open so a broken limiter never blocks a traveller.
- **Users own their data:** memory and cache live on the device, are viewable and erasable by the user, and cloud copies are opt-in or anonymous.
- **Self-checking:** the daily Tusk self-check and the tests catch drift when a model, a data file or a browser changes.

## When to move up (not yet needed)
| Signal | Move |
|---|---|
| Shared answers pass ~300 new/day or ~100k reads/day | Cloudflare D1 (free 5 GB, 100k writes/day) behind `learnedStore()`; keep KV as the read cache |
| Learned corpus passes a few thousand entries | Add per-answer vote counts and review via the daily bot before promoting |
| Per-user memory sync is wanted at scale | Owner-only Firestore path with a rules review (payment/auth rules rule 7) |
| Free quotas are exceeded | Paid Workers plan is a few dollars a month; spend must stay under revenue (the AI spend governor already enforces this for models) |

## Honest risks
- Cloudflare, Firebase and Google Play can change prices or terms. Mitigation: data is exportable and the adapters above are small.
- Play Store and DPDP rules will keep changing; privacy.html and the in-app notices must be reviewed at each release.
- Android/browser APIs deprecate; the app relies only on long-standing web APIs and wraps every optional one in try/catch.
