# RoamWise editorial collection

The JSON files in `articles/` are the source for the public HTML collection.
`node tools/build-editorial.js` renders them without an API, build service or paid dependency.
Do not edit generated HTML directly. `npm run content:check` checks reproducibility,
navigation, source metadata, duplicate passages and retired URL handling.

This collection replaces the previous mass-produced weather/month templates.
Every article separates source-backed facts from RoamWise's own planning analysis.
Numerical examples are explicitly illustrative, not surveyed prices or live inventory.
No article claims a visit, interview, measurement or human review that did not occur.

## Publishing

1. Choose a specific reader decision; check whether an existing article can answer it.
2. Read the primary sources. Record exact URLs, checked dates and the claims supported.
   A government domain is not sufficient: reject irrelevant or inconsistent content.
3. Write the original explanation, alternatives, worked example and limitations.
4. Check facts and quotations manually; automated checks cannot certify originality,
   safety, licensing or AdSense eligibility. Add media only when useful and licensed.
5. Run `npm run content:build`, `npm run sitemap`, `npm run related-links`,
   `npm run content:check`, `npm test`, and `npm run check`. Inspect mobile rendering.
6. Submit a reviewed PR under `AI-ROLES-AND-HANDOFF.md`. No unattended model output
   may push articles to production. Do not use word counts or multimedia quotas as
   evidence of approval. Google's review remains independent.

`migration.json` records the old URLs and their disposition. Equivalent material is
consolidated into relevant articles; unsupported pages without an equivalent are
retired and return the host's real 404. They are not redirected to unrelated content.
The previous versions remain recoverable from Git history.
