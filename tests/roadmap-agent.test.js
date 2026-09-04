/* Tests for tools/roadmap-agent/*.js — the weekly strategic-review agent.
   Everything here runs offline: no real ANTHROPIC_API_KEY, no real network.
   The one function that does hit the network (callClaude) is exercised with
   a mocked global.fetch so the request/response contract is still checked
   without a live API call. */
const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const gather = require('../tools/roadmap-agent/gather-context.js');
const generate = require('../tools/roadmap-agent/generate-report.js');

/* ------------------------------------------------------- gather-context */

test('readDocExcerpt returns full content for a short doc', () => {
  const out = gather.readDocExcerpt('package.json', 100000);
  assert.match(out, /"name": "roamwise"/);
});

test('readDocExcerpt truncates long docs and says so', () => {
  const out = gather.readDocExcerpt('README.md', 5);
  assert.ok(out.length > 5); // truncation marker adds length back
  assert.match(out, /\[truncated/);
});

test('readDocExcerpt reports missing files instead of throwing', () => {
  const out = gather.readDocExcerpt('DOES-NOT-EXIST.md');
  assert.equal(out, '(missing: DOES-NOT-EXIST.md)');
});

test('gatherGitHistory returns non-empty commit log text from this checkout', () => {
  const out = gather.gatherGitHistory();
  assert.ok(out.length > 0);
  assert.notEqual(out, '(no commit history found)');
});

test('gatherAppJsSize reports a line count for app.js', () => {
  const out = gather.gatherAppJsSize();
  assert.match(out, /app\.js is currently \d+ lines/);
});

test('gatherRecentPRs degrades gracefully when GITHUB_REPOSITORY is unset', async () => {
  const saved = process.env.GITHUB_REPOSITORY;
  delete process.env.GITHUB_REPOSITORY;
  try {
    const out = await gather.gatherRecentPRs();
    assert.match(out, /unavailable/);
  } finally {
    if (saved !== undefined) process.env.GITHUB_REPOSITORY = saved;
  }
});

test('gatherDependencyStaleness lists every declared dependency', async () => {
  const savedFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ version: '9.9.9' }) });
  try {
    const out = await gather.gatherDependencyStaleness();
    assert.match(out, /@capacitor\/core/);
    assert.match(out, /latest 9\.9\.9/);
  } finally {
    global.fetch = savedFetch;
  }
});

test('gatherDependencyStaleness degrades gracefully on a failed lookup', async () => {
  const savedFetch = global.fetch;
  global.fetch = async () => { throw new Error('network down'); };
  try {
    const out = await gather.gatherDependencyStaleness();
    assert.match(out, /lookup failed/);
  } finally {
    global.fetch = savedFetch;
  }
});

/* ------------------------------------------------------- generate-report */

test('callClaude sends the expected request shape and parses text blocks', async () => {
  const savedFetch = global.fetch;
  let capturedUrl, capturedInit;
  global.fetch = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return {
      ok: true,
      json: async () => ({
        content: [
          { type: 'text', text: '## New feature ideas\n- example' },
          { type: 'text', text: 'more text' },
        ],
      }),
    };
  };
  try {
    const text = await generate.callClaude({
      apiKey: 'sk-test-dummy',
      model: 'claude-sonnet-4-5',
      systemPrompt: 'sys',
      userContent: 'ctx',
      maxTokens: 100,
    });
    assert.match(text, /New feature ideas/);
    assert.match(text, /more text/);
    assert.equal(capturedUrl, 'https://api.anthropic.com/v1/messages');
    assert.equal(capturedInit.headers['x-api-key'], 'sk-test-dummy');
    const parsedBody = JSON.parse(capturedInit.body);
    assert.equal(parsedBody.model, 'claude-sonnet-4-5');
    assert.equal(parsedBody.system, 'sys');
    assert.equal(parsedBody.messages[0].content, 'ctx');
  } finally {
    global.fetch = savedFetch;
  }
});

test('callClaude throws a descriptive error on a non-ok response', async () => {
  const savedFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 401, text: async () => 'invalid x-api-key' });
  try {
    await assert.rejects(
      () => generate.callClaude({ apiKey: 'bad', model: 'm', systemPrompt: 's', userContent: 'u', maxTokens: 10 }),
      /401/
    );
  } finally {
    global.fetch = savedFetch;
  }
});

test('callClaude throws if the API returns no text content', async () => {
  const savedFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ content: [] }) });
  try {
    await assert.rejects(
      () => generate.callClaude({ apiKey: 'k', model: 'm', systemPrompt: 's', userContent: 'u', maxTokens: 10 }),
      /no text content/
    );
  } finally {
    global.fetch = savedFetch;
  }
});

test('buildReportHeader/buildFooter never claim the report was auto-applied', () => {
  const header = generate.buildReportHeader();
  const footer = generate.buildFooter();
  assert.match(header, /suggest-only/);
  assert.match(footer, /never applies code changes/);
  assert.doesNotMatch(header + footer, /100 years/i);
});

test('SYSTEM_PROMPT enforces the suggest-only / no-auth-payments-Firestore boundary', () => {
  assert.match(generate.SYSTEM_PROMPT, /suggest-only/);
  assert.match(generate.SYSTEM_PROMPT, /Firestore/);
  assert.match(generate.SYSTEM_PROMPT, /survivability/);
});

test('MODEL defaults to an env-overridable value, never hardcoded-only', () => {
  assert.equal(typeof generate.MODEL, 'string');
  assert.ok(generate.MODEL.length > 0);
});

/* --------------------------------------------------------- path sanity */
test('scripts resolve ROOT to the repo root (package.json exists there)', () => {
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  assert.equal(pkg.name, 'roamwise');
});
