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

Provider selection remains Gmail relay > AgentMail > Resend. If Gmail relay
is configured, it continues to be used. AgentMail is selected only when both
AgentMail bindings are present. To switch providers, adjust the production
bindings deliberately, not during a blind deployment.

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
