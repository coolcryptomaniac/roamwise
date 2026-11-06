# RoamWise Network Atlas — publication and creator onboarding

Public URL after deployment: `https://roamwise.co.in/network/`. Creator portfolio template: `https://roamwise.co.in/creators/profile.html?id=<approved-public-id>`.

**Current state:** directory.json intentionally contains zero public listings until authorized publication consent and professional details are verified. There are 25–27 internal applications, but application does not imply consent to publicly publish a name, profile, city, photograph or social handle. Do not bulk export CRM records to the public directory.

## Founder workflow

1. In the private Creator Network admin, review likely duplicate applications by normalized email and Instagram handle; preserve the original records and resolve conflicts manually.
2. Contact each creator using their opted-in address and invite them to confirm professional display name, town (optional), niche, biography, portfolio links, licensing and public listing permission. Do not send unsolicited bulk messages.
3. Confirm Instagram handle URLs. `creators/social-links.mjs` turns `@username` and `instagram.com/username` into canonical external HTTPS links. Khushi Sharma and Vaidehi Yadav require verification against their real submitted handles before any public link is populated.
4. Only after explicit consent, add a minimal public record to `network/directory.json` with `id`, `name`, `town` (optional), `niche`, `description`, `instagram` (optional), `publicApproved:true`, `publicConsent:true`. Use a non-sensitive opaque public ID. Exclude emails, phones, private addresses, payouts, legal documents, IDs, login credentials and unverified audience metrics.
5. For properties and artists, use the same flags and minimal public fields. Property pins are gold, creators violet, artists green. Town-centre coordinates are approximate. No live tracking.
6. Revoke publication immediately if consent is withdrawn. Rebuild directory and purge relevant CDN caches.
7. Email the approved portfolio link and the Creator Studio login link to each creator. They can manage their professional profile in Studio; publishing Studio changes publicly needs a reviewed sync pipeline, not automatic raw Firestore exposure.

## Example approved record (illustrative only, not a real creator)

`{"id":"public-example","name":"Example Creator","town":"Almora","niche":"Travel filmmaking","description":"Short-form destination storytelling","instagram":"@example","publicApproved":true,"publicConsent":true}`

## Next engineering tasks

- Authenticated Firestore review/publish workflow with verified consent provenance and moderation.
- Stable public JSON generation on scheduled Worker job, with atomic publication, takedown and CDN invalidation.
- Creator portfolio edit request and approval dashboard.
- AgentMail/Gmail onboarding invitations with suppression, per-recipient consent, delivery tracking and manual approval.
- Verify all existing creator handles and dedupe records without deleting personal data.
- Run browser accessibility, link and mobile tests on deployment.

No creator was emailed, no live CRM data was exported, and no property/artist location was invented by this change.
