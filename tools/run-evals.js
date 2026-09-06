#!/usr/bin/env node
/* ============================================================================
   run-evals.js — CLI runner for the existing agent eval harness
   (js/copilot/agent-evals.js: RW_EVALS / rwEvalRun / rwEvalScore).
   ----------------------------------------------------------------------------
   CONTEXT: js/copilot/agent-evals.js already implements an honest eval suite
   for the Ailon Tusk agent loop (js/copilot/agent.js) — tool_precision,
   termination, efficiency, recovery, scored against 10 fixed objectives.
   Before this file existed, the ONLY way to run it was opening the app,
   navigating Drawer -> "Agent evals (DEV)", and reading the numbers off a
   rendered card — there was no CLI, no npm script, and nothing in CI ever
   invoked it. That means every past "the agent works better now" claim about
   this repo was unverified by this harness, even though the harness existed.

   This script does NOT reimplement or modify the eval logic — it loads the
   real, unmodified js/copilot/agent.js and js/copilot/agent-evals.js source
   into a small Node vm sandbox (a handful of browser-shaped globals: el(),
   lsGet/lsSet, a plain `window`, AI_MODELS, fetch) and calls the exact same
   rwEvalRun()/rwEvalScore() functions the in-app "Agent evals" button calls.
   Zero logic changes to the eval harness or the agent loop; this is plumbing
   only, per CLAUDE.md's verbatim-move discipline extended to "wiring", not a
   behavior change to either file.

   WHY THIS MATTERS (see AILON-TUSK-ROADMAP.md): an LLM-API-based product like
   this one cannot "train" or "self-improve" in the machine-learning sense —
   there is no model weights update happening here, ever. What it CAN do is
   give humans (and future AI sessions) a real, repeatable, checkable signal
   for "did this prompt/tool change make the agent measurably better or
   worse?" instead of a vibes-based judgment. That signal is only real if it's
   actually run — hence wiring it into `npm run evals`.

   THESE ARE LIVE LLM CALLS. Each run makes real network requests to whichever
   tool-calling provider you have a key for (Groq, Cerebras, OpenRouter, or
   Mistral — the same four `js/copilot/agent.js`'s rwAgentCall() supports).
   That means: (a) it costs a small amount of provider quota/money per run,
   (b) results are NOT deterministic between runs (same caveat the in-app UI
   already prints: "quote them with the sample size and never round up"), and
   (c) it is deliberately NOT wired into `npm test` or `npm run check` or CI —
   an eval run should never block a commit on a live third-party API being
   reachable, and no provider key is checked into this repo or its CI secrets
   as of this writing. Run it manually, on demand, when you want a quality
   signal after changing agent.js/agent-evals.js/the system prompt.

   USAGE
     GROQ_API_KEY=sk-... npm run evals
     (or CEREBRAS_API_KEY / OPENROUTER_API_KEY / MISTRAL_API_KEY — first one
     found wins, same provider-preference order as rwAgentCall's own list.)

   With no key set, this exits with a clear explanation instead of silently
   doing nothing or faking a passing result.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

/* Same provider list, same preference order, as js/copilot/agent.js's
   rwAgentCall() — only these four support OpenAI-compatible tool calling. */
const PROVIDER_ENV = {
  groq: 'GROQ_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  mistral: 'MISTRAL_API_KEY'
};
const PROVIDER_ORDER = ['groq', 'cerebras', 'openrouter', 'mistral'];

/* Static fallback model chain, copied from app.js's AI_MODELS (the one
   var that agent.js depends on but doesn't itself define — app.js can't be
   loaded whole here, it assumes a real DOM). Only the four tool-calling
   providers matter for this harness. */
const AI_MODELS = {
  groq: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'],
  cerebras: ['llama-3.3-70b', 'llama3.1-8b'],
  openrouter: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemma-3-27b-it:free'
  ],
  mistral: ['mistral-small-latest', 'open-mistral-nemo']
};

/* Real, unmodified source files this harness needs, in dependency order:
   the curated destinations DB (pure data) and the js/copilot/core.js
   function that looks a place up in it (cpDbFind — used by the
   destination_facts tool for grounded, non-hallucinated answers), the two
   ground-truth data/logic files RW_AGENT_IMPL calls into (both pure
   functions, no DOM), then the agent loop itself, then the eval harness.
   js/copilot/core.js is much bigger than what this harness actually needs,
   but per CLAUDE.md's verbatim-move discipline this loads the real,
   unmodified file rather than hand-copying cpDbFind out of it — its one
   top-level statement (the rw_keep_chat chat-history restore) only touches
   lsGet/localStorage, both stubbed below, so it's safe to load as-is. */
const AGENT_FILES = [
  'js/data/destinations.js',
  'js/copilot/core.js',
  'js/itinerary/ground-truth.js',
  'js/booking/pnr-parser.js',
  'js/copilot/agent.js',
  'js/copilot/agent-evals.js'
];

function findConfiguredProvider(env) {
  env = env || process.env;
  return PROVIDER_ORDER.find(function (p) { return !!env[PROVIDER_ENV[p]]; }) || null;
}

/* A deliberately small sandbox: just enough browser-shaped globals for
   RW_AGENT_IMPL's tools to run without throwing. Every tool implementation in
   agent.js already wraps its own DOM-touching calls in try/catch (that's the
   "RECOVERABLE" design note at the top of agent.js) and the agent loop itself
   wraps every impl() call in try/catch again — so a missing `openTripMap` or
   `chatKittyState` degrades to a graceful {ok:false, error:...} observation
   fed back to the model, exactly like it would on a real device with that
   feature screen unavailable. Nothing here changes eval *scoring* — it only
   keeps the sandbox from crashing on a ReferenceError. */
function buildSandbox(env) {
  env = env || process.env;
  var store = {};
  PROVIDER_ORDER.forEach(function (p) {
    if (env[PROVIDER_ENV[p]]) store['rwKey_' + p] = env[PROVIDER_ENV[p]];
  });
  var sandbox = {
    console: console,
    fetch: (...args) => fetch(...args),
    AbortController: AbortController,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    Math: Math,
    JSON: JSON,
    el: function () { return null; },
    lsGet: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    lsSet: function (k, v) { store[k] = String(v); },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[k] = String(v); },
      removeItem: function (k) { delete store[k]; }
    },
    navigator: { onLine: true },
    AI_MODELS: AI_MODELS
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function loadAgentSandbox(env) {
  var sandbox = buildSandbox(env);
  AGENT_FILES.forEach(function (rel) {
    var code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  });
  return sandbox;
}

/* Runs the real, unmodified rwEvalRun()/rwEvalScore() and resolves with
   {provider, score}. Rejects with an Error whose message is 'NO_PROVIDER_KEY'
   if no supported provider key is configured. */
function runEvals(env, onProgress) {
  env = env || process.env;
  return new Promise(function (resolve, reject) {
    var provider = findConfiguredProvider(env);
    if (!provider) { reject(new Error('NO_PROVIDER_KEY')); return; }
    var sandbox;
    try { sandbox = loadAgentSandbox(env); } catch (e) { reject(e); return; }
    sandbox.rwEvalRun(
      function (p) { if (onProgress) onProgress(p); },
      function (score) { resolve({ provider: provider, score: score }); }
    );
  });
}

function formatReport(result) {
  var s = result.score;
  var lines = [];
  lines.push('Ailon Tusk agent evals — provider: ' + result.provider + ' (n=' + s.total + ')');
  lines.push('  tool_precision: ' + s.tool_precision + '%  (right tool chosen)');
  lines.push('  termination:    ' + s.termination + '%  (finished cleanly)');
  lines.push('  efficiency:     ' + s.efficiency + '%  (within +1 of minimum steps)');
  lines.push('  recovery:       ' + (s.recovery == null ? 'n/a — no errors hit' : s.recovery + '% of ' + s.recovery_n + ' error run(s)'));
  lines.push('  passed:         ' + s.passed + '/' + s.total + ' · avg ' + s.avg_steps + ' steps · avg ' + s.avg_ms + 'ms');
  lines.push('');
  s.results.forEach(function (r) {
    lines.push('  [' + (r.pass ? 'PASS' : 'FAIL') + '] ' + r.id + ' — ' + r.objective);
    lines.push('         tools: ' + (r.called.length ? r.called.join(' -> ') : 'none') +
      ' · ' + r.steps + ' steps' + (r.errors ? ' · ' + r.errors + ' err' + (r.recovered ? ' (recovered)' : '') : '') +
      (r.terminated ? '' : ' · stopped: ' + r.reason));
  });
  lines.push('');
  lines.push('These are real runs against a live provider, so numbers move between runs — quote them with the sample size (n=' + s.total + ') and never round up.');
  return lines.join('\n');
}

module.exports = {
  PROVIDER_ENV,
  PROVIDER_ORDER,
  AGENT_FILES,
  AI_MODELS,
  findConfiguredProvider,
  buildSandbox,
  loadAgentSandbox,
  runEvals,
  formatReport
};

if (require.main === module) {
  runEvals(process.env, function (p) {
    if (p.phase === 'running') console.log('[' + (p.done + 1) + '/' + p.total + '] ' + p.objective);
  }).then(function (result) {
    console.log('\n' + formatReport(result));
    process.exit(0);
  }).catch(function (e) {
    if (e && e.message === 'NO_PROVIDER_KEY') {
      console.error('No tool-calling provider API key found in the environment.');
      console.error('Set one of: ' + PROVIDER_ORDER.map(function (p) { return PROVIDER_ENV[p]; }).join(', ') + '.');
      console.error('This suite makes real, billed calls to a live LLM API, so it is opt-in and not run in CI — see AILON-TUSK-ROADMAP.md.');
      process.exit(1);
      return;
    }
    console.error('Eval run failed: ' + (e && e.stack || e));
    process.exit(1);
  });
}
