# Proposal (not implemented): district-side data for Kainchi Dham

Phase 0 stores nothing on a server. Everything below needs the Uttarakhand district administration's
agreement and a separate review per `AI-ROLES-AND-HANDOFF.md` rule 7. No rules or schema change is in
this PR.

## Needs from the district (before any code)
- Who is the accountable office, and which channel receives visitor reports.
- Official, dated notices of rate cards, parking, shuttle and slot capacities.
- Whether slots are binding. If they are not, passes stay advisory.

## Candidate collections (draft)
- `kainchi_notices/{id}`: authority-published rate cards, peak dates and road status. Public read, admin write only, each with `issuer`, `noticeUrl`, `publishedAt`.
- `kainchi_reports/{id}`: visitor reports. Write-only for visitors, with rate limiting and App Check; read for the district role only. No phone number required; store category, place, text, optional amount.
- `kainchi_slots/{date}`: published capacities and counts, written only by a trusted function, never by the client.

## Privacy and abuse
Minimise personal data, no precise location by default, retention limit, rate limits against false
reports, a right-of-reply path for accused vendors. Reports are allegations until the authority verifies them.

## Rollout
1. Pilot with one office; 2. publish rate notices; 3. optional slots on declared peak days only; 4. review after one season.
