# Daily RoamWise lead marketing

The founder requested daily segmented lead marketing and artist/hotel matching on 19 October 2026. The execution channel is a ChatGPT recurring task using the connected Gmail account `founder@roamwise.co.in`, not a browser mail loop. Read `policy.json` before every run. Scheduling was verified active on 19 October 2026: task `6ad53b4da02c81919dcbe3cff7d66e78`, every morning around 09:00 Asia/Kolkata (flexible schedule). The founder paused other tasks to free capacity. This is a setup snapshot; the live ChatGPT task state is authoritative. A scheduled task or draft queue is not evidence that a message has been sent.

## One run

1. Read current policy, public `seeds.json`, current artist/property facts and any accessible authorised private CRM records. Never commit private CRM/customer contacts to GitHub. Do not equate a source-verified hotel with an active RoamWise partner.
2. Verify the Gmail sending account. Stop on connection/authentication errors. Before creating a message, resolve the recipient against the source and current thread history. Public hotel role/team inboxes may receive a relevant first introduction. Customer marketing requires explicit, evidenced marketing opt-in; account registration and a property enquiry alone do not qualify.
3. Use Firecrawl to verify fresh official sources. Do not use guessed addresses, personal contact scraping or historical VC contact lists. Resolve conflicting label/mailto links before sending. Ananda's page currently has such a mismatch, so it is an official-route-only prospect. Taj's reservations inbox is not treated as a verified art procurement contact.
4. Inspect Sent and all relevant conversations for each address before sending. Suppress previous marketing recipients, replies, bounces, unsubscribe/remove requests, ambassadors, staff and existing partners unless a particular update was requested. Uncertain state means skip; do not retry a possibly sent message.
5. Apply `eligibility.mjs`, including the number already sent during the current Asia/Kolkata calendar day. Maximum 12 emails/day, maximum 3 each to customer/property/creator/investor segments. These are ceilings, not targets. Never send multiple introductions to the same recipient. Do not fill an empty segment with unsuitable addresses.
6. Send short individual, source-specific emails through the Gmail connector. Include one relevant RoamWise link, founder identity and “If this is not relevant, reply ‘no thanks’ and I won’t contact you again.” Do not BCC-batch or use fake urgency. Investor messages must not invent traction, a deal, return, valuation or funding commitment. Do not make artist fee, booking, exclusivity or contract commitments. Art, accommodation, travel, shipping and usage rights are separate discussions.
7. Verify each send result, retain exact message/thread IDs in the task's private report, and count only confirmed sends. On failure, report the reason; on an ambiguous send response, search Sent before any retry. Read opt-out replies on every subsequent run. Send a concise private report of counts, recipients contacted, skipped records and blockers to the user in ChatGPT.

## Segment routes

| Segment | Purpose and CTA | Eligibility |
| --- | --- | --- |
| Customer | Relevant travel benefit; current site or Stay & Do | Accessible opt-in customer list with evidence; otherwise zero sends |
| Property | Source-specific collaboration / artist introduction; artist page or partner join | Verified official business/team route and a relevant, bounded first introduction |
| Creator | Portfolio/creator partnership; creator join | Verified published professional business route or explicit authorised CRM record |
| Investor | Concise stage/thesis-specific introduction; current investor page | Verified official pitch route and current fit; no stale metrics or guessed personal email |

## Current setup limitations

The connected Gmail account was verified. The RoamWise private admin page required sign-in during setup, so no private customer or CRM list was read, exported or assumed. There are three public hotel business inbox seeds, plus two hotel prospects needing contact routing. A daily task may discover other eligible B2B prospects; it must report blocked private segments honestly. Creating source files or saving a prospect in the admin UI does not itself send any email.

The hotel shortlist is an editorial potential-fit ranking, not an acceptance probability, confirmed procurement programme or booked event. Natasha's ambassador title follows the founder's instruction; no term, fee, exclusivity, signed contract or guaranteed deliverable is represented.

## Private spreadsheet sources

The founder authorised connected Google Drive and relevant spreadsheets as read-only sources on 19 October 2026. The task stores verified source references privately and rereads current contents each run. Native Google Sheets uses metadata plus bounded named-tab ranges; Excel/CSV/TSV uses Drive fetch. Investor directory rows are candidates for current official-source verification, not preapproved email recipients. Outreach tracker rows help suppress previous contacts; community activity is not customer marketing consent. Existing files, permissions and private records are preserved.

A phone or computer file is usable only after upload or sync into an accessible source. The separate Smartsheet service is not automatically connected by Google Drive. Missing customer opt-in evidence still means zero customer sends. Never store private spreadsheet IDs, rows or contacts in this public repository.
