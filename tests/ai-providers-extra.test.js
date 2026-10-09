'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function load(store){
  const calls = [];
  const ctx = {
    lsGet: (k) => store[k] || '', AbortController, setTimeout, clearTimeout, window: { AbortController },
    fetch: (url, opts) => { calls.push({ url, opts }); return Promise.resolve({ status: 200, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) }); },
    console,
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/copilot/ai-providers.js'), 'utf8'), ctx);
  return { ctx, calls };
}

test('DeepSeek goes to api.deepseek.com with a bearer key', async () => {
  const { ctx, calls } = load({});
  assert.equal(await ctx.aiRequest('deepseek', 'sk-test', 'deepseek-flash', 'hi', 50, false), 'ok');
  assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer sk-test');
});

test('custom endpoint uses the saved base URL and model, defaulting to local Ollama', async () => {
  const a = load({ rwCustomBase: 'http://localhost:1234/v1/', rwCustomModel: 'qwen2.5' });
  await a.ctx.aiRequest('custom', 'x', '', 'hi', 50, false);
  assert.equal(a.calls[0].url, 'http://localhost:1234/v1/chat/completions');
  assert.equal(JSON.parse(a.calls[0].opts.body).model, 'qwen2.5');
  const b = load({});
  await b.ctx.aiRequest('custom', 'x', 'llama3.2', 'hi', 50, false);
  assert.equal(b.calls[0].url, 'http://localhost:11434/v1/chat/completions');
});

test('retired providers are gone from Settings and Gemini no longer depends on 2.5 Flash first', () => {
  const settings = fs.readFileSync(path.join(root, 'js/ui/settings-modal.js'), 'utf8');
  assert.doesNotMatch(settings, /cerebras|GitHub Models/i);
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /gemini: \['gemini-3\.5-flash-lite'/);
});
