# Claude Code working contract for RoamWise

Before editing this repository, read:

1. `AI-ROLES-AND-HANDOFF.md` — shared ChatGPT/Claude responsibilities and safety rules.
2. `CLAUDE-ITINERARY-DEBUG-TEST.md` — the exact validation checklist for the cinematic itinerary preset library.
3. `itinerary-library/README.md` and `itinerary-library/CLAUDE-CODE-MERGE-NOTES.md` — library behavior and integration constraints.

## Your role on the itinerary-library work

You are the repo-local verification and debugging specialist. Reproduce failures, run the app/build/tests, inspect browser console/network/device behavior, and fix only evidenced defects with the smallest practical patch.

Do not redesign the itinerary product, regenerate strategy/content, replace the Classic planner, or touch auth/payments/Pro entitlement/Firestore/deployment bindings unless a reproduced defect specifically requires a separately reviewed change.

The current target branch is `feature/itinerary-library-v1.1` and the review target is PR #63. Keep the PR draft until the checklist passes. Post exact commands, PASS/FAIL results, fixes, remaining risks, and either `SAFE TO MERGE` or `DO NOT MERGE`.

If a preset lookup fails or throws, the existing live planner must continue unchanged. Production `main` is the source of truth and must not be broken to make the cache work.
