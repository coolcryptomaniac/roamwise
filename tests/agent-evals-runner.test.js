/* Tests for tools/run-evals.js — the CLI wiring around the existing eval
   harness in js/copilot/agent-evals.js (RW_EVALS/rwEvalRun/rwEvalScore).

   These tests do NOT hit a real LLM API (no live network, no real key
   needed) — global.fetch is mocked with a small scripted "model" so the
   full pipeline (vm sandbox -> real agent.js/agent-evals.js source ->
   rwEvalRun -> rwEvalScore -> formatReport) is exercised deterministically.
   This checks the WIRING is correct, not the model's real-world quality —
   that requires an actual key and `npm run evals`, by design (see
   AILON-TUSK-ROADMAP.md and tools/run-evals.js's header comment for why). */
const assert = require('node:assert/strict');
const test = require('node:test');

const runner = require('../tools/run-evals.js');

/* A scripted OpenAI-compatible chat-completions response: always replies
   with a single tool call, i.e. an assistant that "does nothing useful"
   for every objective except calling finish immediately. This is the worst
   plausible agent — it should score badly on tool_precision, but still
   terminate cleanly every time (it always calls finish). */
function mockFetchAlwaysFinishes() {
  return async function fakeFetch() {
    return {
      json: async () => ({
        choices: [{
          message: {
            role: 'assistant', content: null,
            tool_calls: [{ id: 'call_1', function: { name: 'finish', arguments: JSON.stringify({ answer: 'done' }) } }]
          }
        }]
      })
    };
  };
}

test('findConfiguredProvider picks the first configured provider in preference order', () => {
  assert.equal(runner.findConfiguredProvider({ GROQ_API_KEY: 'x', MISTRAL_API_KEY: 'y' }), 'groq');
  assert.equal(runner.findConfiguredProvider({ MISTRAL_API_KEY: 'y' }), 'mistral');
  assert.equal(runner.findConfiguredProvider({}), null);
});

test('runEvals rejects with NO_PROVIDER_KEY when no supported key is set', async () => {
  await assert.rejects(() => runner.runEvals({}), /NO_PROVIDER_KEY/);
});

test('loadAgentSandbox exposes the real, unmodified eval harness globals', () => {
  const sandbox = runner.loadAgentSandbox({ GROQ_API_KEY: 'sk-test-dummy' });
  assert.equal(typeof sandbox.rwEvalRun, 'function');
  assert.equal(typeof sandbox.rwAgentRun, 'function');
  assert.ok(Array.isArray(sandbox.RW_EVALS));
  assert.equal(sandbox.RW_EVALS.length, 11, 'RW_EVALS is the real, unmodified 11-objective suite');
});

test('destination_facts tool grounds answers in the real curated DB, not model memory', () => {
  const sandbox = runner.loadAgentSandbox({ GROQ_API_KEY: 'sk-test-dummy' });
  const hit = sandbox.RW_AGENT_IMPL.destination_facts({ place: 'Goa' });
  assert.equal(hit.ok, true);
  assert.equal(hit.found, true);
  assert.equal(hit.name, 'Goa');
  assert.ok(Array.isArray(hit.best_months) && hit.best_months.length > 0);
  assert.ok(Array.isArray(hit.signature_food) && hit.signature_food.length > 0);
  assert.ok(Array.isArray(hit.hidden_gems) && hit.hidden_gems.length > 0);

  const miss = sandbox.RW_AGENT_IMPL.destination_facts({ place: 'Nonexistentcityxyz123' });
  assert.equal(miss.ok, true);
  assert.equal(miss.found, false);
  assert.match(miss.note, /no curated entry/i);

  const noPlace = sandbox.RW_AGENT_IMPL.destination_facts({});
  assert.equal(noPlace.ok, false);
});

test('runEvals drives the real rwEvalRun/rwEvalScore end to end against a mocked provider', async () => {
  const savedFetch = global.fetch;
  global.fetch = mockFetchAlwaysFinishes();
  try {
    const progressIds = [];
    const result = await runner.runEvals(
      { GROQ_API_KEY: 'sk-test-dummy' },
      (p) => { if (p.phase === 'running') progressIds.push(p.id); }
    );
    assert.equal(result.provider, 'groq');
    assert.equal(result.score.total, 11);
    /* an agent that only ever calls finish() terminates on every objective... */
    assert.equal(result.score.termination, 100);
    /* ...but calls zero real tools, so it cannot hit any objective's
       required tool(s) except the one purely-off-topic objective (e10,
       must:[]), which needs nothing but a clean finish. */
    assert.equal(result.score.tool_precision, 0);
    assert.equal(result.score.passed, 1);
    assert.equal(progressIds.length, 11);
    /* compare via JSON, not assert.deepEqual: sandboxEvalIds() builds its
       array inside a separate vm realm, and deepStrictEqual can trip on
       cross-realm Array identity even when every element matches. */
    assert.equal(JSON.stringify(progressIds), JSON.stringify(sandboxEvalIds()));
  } finally {
    global.fetch = savedFetch;
  }
});

function sandboxEvalIds() {
  const sandbox = runner.loadAgentSandbox({ GROQ_API_KEY: 'sk-test-dummy' });
  return sandbox.RW_EVALS.map((e) => e.id);
}

test('formatReport never claims a fixed/rounded score — always prints the live sample size', async () => {
  const savedFetch = global.fetch;
  global.fetch = mockFetchAlwaysFinishes();
  try {
    const result = await runner.runEvals({ GROQ_API_KEY: 'sk-test-dummy' });
    const report = runner.formatReport(result);
    assert.match(report, /n=11/);
    assert.match(report, /never round up/);
    assert.match(report, /tool_precision: 0%/);
  } finally {
    global.fetch = savedFetch;
  }
});

test('AGENT_FILES points at real, existing source files (no drift if agent.js moves)', () => {
  const path = require('node:path');
  const fs = require('node:fs');
  const root = path.join(__dirname, '..');
  runner.AGENT_FILES.forEach((rel) => {
    assert.ok(fs.existsSync(path.join(root, rel)), rel + ' should exist');
  });
});
