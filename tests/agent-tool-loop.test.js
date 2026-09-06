/* Tests for js/copilot/agent.js's rwAgentCall — the tool-calling request
   function the Ailon Tusk agent loop (rwAgentRun) drives every step through.
   Loaded via the same real-source vm sandbox tools/run-evals.js uses, so
   these exercise the actual shipped code, not a reimplementation. No real
   network access or API key is used — global.fetch is replaced per test. */
const assert = require('node:assert/strict');
const test = require('node:test');

const runner = require('../tools/run-evals.js');

function withMockFetch(mockFn, fn) {
  const saved = global.fetch;
  global.fetch = mockFn;
  return Promise.resolve()
    .then(fn)
    .finally(() => { global.fetch = saved; });
}

test('rwAgentCall falls through to the next configured provider on an auth error', async () => {
  const calls = [];
  await withMockFetch(async (url) => {
    calls.push(url);
    if (calls.length === 1) {
      // first provider (groq): key rejected
      return { status: 401, json: async () => ({ error: { message: 'invalid api key' } }) };
    }
    // second provider (cerebras): succeeds
    return {
      status: 200,
      json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok from fallback provider' } }] })
    };
  }, async () => {
    const sandbox = runner.loadAgentSandbox({ GROQ_API_KEY: 'bad-key', CEREBRAS_API_KEY: 'good-key' });
    const reply = await new Promise((resolve, reject) => {
      sandbox.rwAgentCall([{ role: 'user', content: 'hi' }], (err, msg) => {
        if (err) reject(new Error(err)); else resolve(msg);
      });
    });
    assert.equal(calls.length, 2, 'should have tried a second provider after the first was rejected');
    assert.match(calls[0], /groq/);
    assert.match(calls[1], /cerebras/);
    assert.equal(reply.content, 'ok from fallback provider');
  });
});

test('rwAgentCall reports a clear error once every configured provider is exhausted', async () => {
  await withMockFetch(async () => ({ status: 401, json: async () => ({ error: { message: 'invalid api key' } }) }), async () => {
    const sandbox = runner.loadAgentSandbox({ GROQ_API_KEY: 'bad', CEREBRAS_API_KEY: 'also-bad' });
    const err = await new Promise((resolve) => {
      sandbox.rwAgentCall([{ role: 'user', content: 'hi' }], (err) => resolve(err));
    });
    assert.match(String(err), /invalid api key/);
  });
});

test('rwAgentCall treats an AbortError as a timeout and tries the next provider', async () => {
  const calls = [];
  await withMockFetch(async (url) => {
    calls.push(url);
    if (calls.length === 1) {
      const e = new Error('The operation was aborted');
      e.name = 'AbortError';
      throw e;
    }
    return { status: 200, json: async () => ({ choices: [{ message: { role: 'assistant', content: 'recovered' } }] }) };
  }, async () => {
    const sandbox = runner.loadAgentSandbox({ GROQ_API_KEY: 'x', CEREBRAS_API_KEY: 'y' });
    const reply = await new Promise((resolve, reject) => {
      sandbox.rwAgentCall([{ role: 'user', content: 'hi' }], (err, msg) => {
        if (err) reject(new Error(err)); else resolve(msg);
      });
    });
    assert.equal(calls.length, 2);
    assert.equal(reply.content, 'recovered');
  });
});

test('rwAgentCall reports no-provider-configured without calling fetch at all', async () => {
  let fetchCalled = false;
  await withMockFetch(async () => { fetchCalled = true; return { status: 200, json: async () => ({}) }; }, async () => {
    const sandbox = runner.loadAgentSandbox({});
    const err = await new Promise((resolve) => {
      sandbox.rwAgentCall([{ role: 'user', content: 'hi' }], (err) => resolve(err));
    });
    assert.match(String(err), /no tool-calling provider configured/);
    assert.equal(fetchCalled, false);
  });
});
