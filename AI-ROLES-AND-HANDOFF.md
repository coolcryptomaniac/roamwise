# RoamWise AI engineering roles

This repository is intentionally shared between ChatGPT/OpenAI tooling and Claude Code. The goal is complementary work, not two agents independently redesigning the same feature.

## Non-negotiable safety rules

1. `main` is the production source of truth. Feature work starts on a branch and reaches `main` through a reviewed PR.
2. Do not rewrite working production architecture merely to make a new feature cleaner.
3. Classic/default itinerary rendering stays intact unless a bug is reproduced and the fix is scoped to that bug.
4. Premium cinematic/preset functionality is additive. If it fails, the existing live planner must still work.
5. Never replace verified live behavior with fabricated fallback data.
6. Before touching a file another agent recently changed, inspect the PR/branch diff and preserve intentional changes.
7. High-risk changes (auth, payments, Pro entitlement, Firestore/security rules, deployment configuration) require separate review and must not be bundled into itinerary presentation work.

## ChatGPT / OpenAI role — product + integration owner

Owns:
- Product architecture and feature boundaries.
- Travel intelligence, route logic, preset matching rules and destination content quality.
- Cinematic UX, maps/photos/share attribution and generated artifacts.
- Cross-feature integration decisions and backward compatibility.
- GitHub branch/PR orchestration, code review and release recommendation.
- Research, growth, marketing, documentation and user-facing copy.

ChatGPT should prefer minimal integration patches over broad refactors and should leave reproducible validation instructions for Claude Code.

## Claude Code role — repo-local verification + debugging specialist

Owns:
- Run the actual repository locally in the supported environments.
- Run syntax checks, tests, build commands, browser/device smoke tests and inspect console/network failures.
- Reproduce bugs before fixing them.
- Fix evidenced integration/runtime defects with the smallest practical patch.
- Verify paths, CSP/static hosting behavior, mobile responsiveness, offline degradation and GitHub Pages behavior.
- Report architectural concerns in the PR instead of silently replacing the design.

Claude Code should NOT regenerate destination strategy/content or redesign the premium engine unless a test proves the existing design cannot work.

## Shared handoff protocol

Every material PR should record:
- What changed.
- What was deliberately not changed.
- Tests executed and exact result.
- Remaining risks/unknowns.
- Whether production `main` is safe to merge.

If agents disagree, preserve production behavior and surface the disagreement in the PR rather than making a speculative destructive change.
