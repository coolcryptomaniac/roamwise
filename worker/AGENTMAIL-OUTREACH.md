# AgentMail guarded outreach (pilot)

Status: **Not deployed / no automatic sends enabled**. This branch adds an isolated admin-only endpoint.

## Existing secret
`AGENTMAIL_API_KEY` is the secret the founder reports adding to Cloudflare. The code never exposes its value.

## Configure in Cloudflare Worker
1. Create or find AgentMail inbox identifiers in AgentMail console (Free: three inboxes).
2. Add Worker secrets `AGENTMAIL_ADMIN_TOKEN` (random independent 32+ character secret), and set these as non-secret Worker vars:
   - `AGENTMAIL_INBOX_PROPERTIES`
   - `AGENTMAIL_INBOX_CREATORS`
   - `AGENTMAIL_INBOX_BUSINESS`
   - `AGENTMAIL_SEND_ENABLED = "false"` for preview mode; **don't enable before security review**.
3. Deploy reviewed changes using existing worker pipeline.
4. Authenticated `POST /admin/agentmail/outreach` with `Authorization: Bearer <AGENTMAIL_ADMIN_TOKEN>`:
```json
{"category":"properties","to":"consenting@example.com","subject":"RoamWise partnership enquiry","text":"Relevant personalised offer...\n\nReply STOP to opt out.","optIn":true,"humanApproved":true,"suppressed":false,"send":false}
```
5. The route returns a preview; it doesn't send until both environment enablement and the per-request `send: true` flag are present.
6. Hard limits: 20/day and 1800/month; duplicate recipient/category blocked for 180 days; suppression stored in `RW_KV`. Use `suppressAgentMailRecipient(email, env)` when an unsubscribe, objection or complaint is received. Human review needed; this version does **not** automatically process replies.
7. **Do not enable unattended sends**. KV limits are non-atomic and this implementation intentionally rejects automated bulk use. Implement an atomic Durable Object coordinator, verified webhook signatures, opt-out processing, CRM reconciliation and audit log before enabling any scheduled sending.

## Rollout gates
- [ ] Confirm inbox identifiers and real account verification/limits.
- [ ] Test preview without network calls; verify 401 without admin bearer.
- [ ] Test suppression, opt-in, duplicate, and daily/monthly cap conditions.
- [ ] Test against a self-owned approved test address.
- [ ] Verify actual sent/replied counts in AgentMail.
- [ ] Implement automatic reply processing and staff notifications in a follow-up PR.
- [ ] Legal/consent review for Indian commercial outreach, unsubscribe and cross-border recipients.

No secrets are committed; no production automatic sends or inbox creation occur in this PR.
