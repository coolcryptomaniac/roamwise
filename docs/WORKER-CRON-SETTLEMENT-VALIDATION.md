# Worker maintenance and settlement destination
This PR wires a **read-only** weekly and monthly audit to the existing single Worker scheduled handler and adds Cron Triggers without deleting the existing hourly/daily jobs. Weekly UTC 04:15 Monday (09:45 IST); monthly UTC 04:45 first of month (10:15 IST). Enabled with `RW_AUDIT_ENABLED = "true"`. Reports are KV snapshots, not security certification or proof of payment settlement. Reports are not publicly exposed.

## Payment intent (not executed)
Founder requested that RoamWise business collections settle to the **business current account**, and identified UPI VPA `roamwisepay@ybl`. A VPA is not proof of ownership of a bank account, nor an instruction for Cashfree to settle there. Verify the registered merchant legal entity, masked current-account number/IFSC, Cashfree settlement destination, and the VPA's beneficiary name and linked account through bank/Cashfree authenticated portals. Do not store raw account numbers in GitHub. Do not change settlement beneficiaries or redirect money automatically. The founder's phrase "all payments should be from my current account" is ambiguous between incoming settlements and outgoing charges: this implementation changes neither. Vendor payouts and refunds require separate approvals and provider-supported workflows.

## Validation
- Run `node --test tests/scheduled-site-audits.test.mjs` and existing Worker tests.
- Deploy with authorized Cloudflare account after reviewing cron changes; Cloudflare triggers are UTC and may take 15 minutes to propagate.
- Check Cloudflare Cron Events and KV `rw-audit:weekly:latest` / `rw-audit:monthly:latest`.
- Next: feed verified site telemetry, GitHub CI and Cashfree settlement report into audits. Multi-model calls remain disabled until #728's expense controls are integrated and provider model IDs are verified.
- Existing daily outreach remains scheduled separately. Do not duplicate mass marketing sends.
