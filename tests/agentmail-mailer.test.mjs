import test from 'node:test';
import assert from 'node:assert/strict';
import { mailerKind, sendMail } from '../worker/lib/mailer.js';

test('AgentMail requires both secret and inbox id', () => {
  assert.equal(mailerKind({ AGENTMAIL_API_KEY: 'secret' }), null);
  assert.equal(mailerKind({ AGENTMAIL_INBOX_ID: 'agent@example.com' }), null);
  assert.equal(mailerKind({ AGENTMAIL_API_KEY: 'secret', AGENTMAIL_INBOX_ID: 'agent@example.com' }), 'agentmail');
});
test('existing Gmail relay retains precedence', () => {
  assert.equal(mailerKind({ GMAIL_RELAY_URL: 'https://relay.example', GMAIL_RELAY_SECRET: 'secret', AGENTMAIL_API_KEY: 'secret', AGENTMAIL_INBOX_ID: 'agent@example.com' }), 'gmail');
});
test('AgentMail sends through authenticated inbox without leaking secret', async () => {
  const original = globalThis.fetch;
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return { ok: true, status: 200 };
  };
  try {
    const result = await sendMail({ AGENTMAIL_API_KEY: 'test-secret', AGENTMAIL_INBOX_ID: 'bot@agentmail.to' }, { to: 'founder@roamwise.co.in', subject: 'Test', text: 'Hello' });
    assert.deepEqual(result, { ok: true });
    assert.match(call.url, /inboxes\/bot%40agentmail\.to\/messages\/send$/);
    assert.equal(call.options.headers.authorization, 'Bearer test-secret');
    const body = JSON.parse(call.options.body);
    assert.deepEqual(body.to, ['founder@roamwise.co.in']);
    assert.equal(body.subject, 'Test');
    assert.doesNotMatch(call.options.body, /test-secret/);
  } finally { globalThis.fetch = original; }
});
test('AgentMail maps rate limits to cap and errors fail closed', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 429 });
    assert.deepEqual(await sendMail({ AGENTMAIL_API_KEY: 'key', AGENTMAIL_INBOX_ID: 'id' }, { to: 'a@example.com', subject: 's', text: 't' }), { ok: false, reason: 'cap' });
    globalThis.fetch = async () => { throw new Error('network down'); };
    assert.deepEqual(await sendMail({ AGENTMAIL_API_KEY: 'key', AGENTMAIL_INBOX_ID: 'id' }, { to: 'a@example.com', subject: 's', text: 't' }), { ok: false, reason: 'error' });
  } finally { globalThis.fetch = original; }
});
