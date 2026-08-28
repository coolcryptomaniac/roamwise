# firestore-rules-history/

`firestore.rules` in the repo root is the single source of truth for what
should be deployed. Every time it changes, save a dated copy in this folder
**before** deploying, so there is always an audit trail of what was live and
when.

## Naming

- `YYYY-MM-DD-vX.Y.rules` — a dated snapshot of the root `firestore.rules` at
  the point it was published, named after the version marker in its own
  header comment (e.g. `2026-08-28-v15.7.rules`).
- `live-snapshot-YYYY-MM-DD-preclean.rules` — an as-found copy of what was
  actually pasted into the Firebase Console before a cleanup pass, kept for
  audit purposes even though it is never meant to be deployed again. The
  2026-08-28 snapshot documents the state that had 9 duplicated `match`
  blocks (tripchats, pulse, staff, squads, reports, pricing, meta, ledger,
  claims) silently unioned with newer hardened rules — see the PR that added
  it for the full list of live regressions this caused and how they were
  fixed.

## How to deploy

1. Open the root `firestore.rules` file in this repo (not a file from this
   folder — that's history, not the thing to paste).
2. Firebase Console → your project → Build → Firestore Database → Rules tab.
3. Select **all** existing text, delete it, then paste the **entire** root
   file. Never paste it as an addition next to what's already there —
   Firestore unions every `match` block that applies to a path with OR, so a
   leftover old block does not get replaced by a new one, it gets combined
   with it. That is exactly what caused the 2026-08-28 regressions above.
4. Click Publish.
5. Save a dated copy of the file you just deployed into this folder (see
   naming above) so the next person auditing the rules can see history.
