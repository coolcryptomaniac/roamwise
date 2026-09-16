# NMIMS partnership — single source of truth

## Send and review

- **One public partnership proposal:** `https://roamwise.co.in/nmims/`. This is the only current proposal and currently says **PROPOSAL ONLY / NOT LIVE**. Its navy/gold palette inherits the look of the previous `/nmims/proposal/` page. Share this URL with Tannu; avoid old PDF/Word attachments.
- `/nmims/proposal/` and `/nmims/proposal.html` are URL-preserving redirects to `/nmims/`; the query string and hash remain intact for existing email links.
- **One unsigned draft agreement:** `https://roamwise.co.in/nmims/mou/`. Old `/nmims/mou.html` redirects here. Use the browser's Print / save PDF button only after legal entity details, signatory authority, event dates and financial terms are agreed; do not treat this online draft as an executed MOU.
- `/nmims/creators/` is an independent expression-of-interest page. Its mailto application must be sent by the creator; no collaboration fee or NMIMS pass is promised.
- `/nmims/pass-issuer/` remains the founder/admin-only pass desk, protected by deployed Firestore rules; `/nmims/admin.html` remains a read-only admin report. Neither is a public signup path.

The eight previous downloadable PDF/Word artifacts under `nmims/`, `nmims/proposal/` and `nmims/mou/` were removed from the public tree because they had conflicting self-service claims, unsourced price/sponsor comparisons, and—in one MOU version—an unjustified electronic-signature assertion. Git history retains them for auditing; **do not attach downloaded copies from older emails**. Former direct download URLs will stop working; the canonical HTML pages can be printed instead.

## Release gate, in this order

1. Confirm the correct NMIMS/E-Cell authorised entity, signatories, festival/event name and dates, media-deliverables schedule, eligibility for 50 organisers + 450 students/participating audience, and who may receive personal data.
2. Agree on referral-code payee, what amount earns 30%, eligibility, duplicate attribution, refund treatment, tax/invoice requirements and payout schedule. The repository's `referral-data.js` fallback now sets `NMIMS2026.active=false` **until signed**. The live Firestore `config/referrers` document and cached browser entries can override that fallback: review and disable any active NMIMS2026 entry before sharing a referral link; re-enable only after authorisation.
3. Have the parties review and complete the MOU. Do not claim a signature or institutional endorsement on a webpage in advance. Draft terms are not a substitute for verification of authority or professional legal advice.
4. Publish the currently hardened `firestore.rules` in Firebase Console if not already published; merging GitHub files alone does **not** deploy rules. Audit `admins/{uid}` and revoke offboarded staff. Keep the pass desk issuance flag disabled until agreed.
5. Test one controlled founder-issued code with an owned verified email, email delivery and one-time app redemption, plus the 50/450 cap and existing-founder-seat counter; verify this against **live** Firestore after Emulator checks. Do not write real student PII or announce open claims in tests.
6. After signed approval, explicitly enable the correct 50/450 campaign pool, approve any public code/QR instructions and privacy notice, activate the institutional referral only if agreed, and update the public proposal's status and dates. The HTML page does not automatically become official when someone signs a document.
7. Send Tannu only the canonical proposal link and unsigned MOU review link, with founder in CC; Deepanshi coordinates follow-up. Do not send outdated PDF/Word attachments or promise a payment/commission before written settlement terms exist.

## QA

Run `node --test tests/nmims-consolidation.test.js tests/nmims-full-proposal.test.js` and the existing NMIMS pass-issuer/Firestore Emulator CI workflow. Inspect desktop/mobile layouts, old URL redirects, public claims, affiliate state and exact deployed domain separately; GitHub checks alone cannot verify live Firebase configuration or email deliverability.
