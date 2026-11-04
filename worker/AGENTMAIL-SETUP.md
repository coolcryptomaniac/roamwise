# AgentMail in the RoamWise Worker

AgentMail is now an **optional outbound email transport** in `worker/lib/mailer.js`.
No new public endpoint, auto-send job, inbox creation, or API key is introduced.
Existing mail paths (booking notices, reminders, advisory digests) use `sendMail`
and can use AgentMail once configured. This change does **not** monitor founder Gmail.

## Existing Cloudflare configuration

In Cloudflare > Workers > `roamwise-api` > Settings > Variables and Secrets,
verify these two bindings exist in the **production Worker**:

- `AGENTMAIL_API_KEY` — encrypted Secret; never add to GitHub or chat.
- `AGENTMAIL_INBOX_ID` — ID/address of an already-created, authorized sending inbox;
  use an encrypted Secret or Worker variable. It must be an AgentMail inbox, not
  automatically `founder@roamwise.co.in` unless that address is actually configured there.

Provider selection for existing automatic Worker notifications is **AgentMail > Gmail relay > Resend**.
For explicitly manual sends (`sendMail(env, { ..., channel: 'manual' })`) it is **Gmail relay > AgentMail > Resend**.
Both AgentMail bindings must exist before it can be selected. No automatic
provider retry occurs after an HTTP/network failure, preventing duplicate sends.
A missing provider configuration can fall back to the next configured provider.

The Worker has no public manual-send endpoint. Manual email is still sent
from Gmail directly or through trusted internal code with `channel: 'manual'`.
This routing change is not a two-way AI email agent, inbox reader, or approval
system; those require separate authenticated workflows and consent.

## Validate and deploy

1. Review `tests/agentmail-mailer.test.mjs`; run
   `node --test tests/agentmail-mailer.test.mjs` and `node --check worker/lib/mailer.js`.
2. Merge the PR only after CI passes.
3. GitHub Actions > **Deploy Worker (manual)** > Run workflow. The existing
   workflow performs Wrangler dry-run, deploy, health checks and rollback.
4. Verify `/health` and existing payment routes are unaffected. A green
   health check does **not** prove that AgentMail credentials or the sender inbox work.
5. Send one controlled test through an existing authenticated, authorized
   notification path after checking which provider is selected; confirm
   delivery from the intended inbox and watch Cloudflare logs for redacted errors.

No automated test sends a live email. The Worker does not expose AgentMail
secrets or a public send-email endpoint. AgentMail API 429 maps to the existing
`cap` result; all other failures are handled as `error`.

## Skills (developer tooling, not Worker runtime)

The official skills are instructions for coding agents, not an AgentMail API
deployment dependency. To install them in a developer environment:

```sh
npx skills add agentmail-to/agentmail-skills --skill agentmail --yes
```

See https://github.com/agentmail-to/agentmail-skills .
Do not install the skills inside the production Worker or package their
instructions as runtime assets.
