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

function loadOnDevice(LanguageModel){
  const toasts = [];
  const ctx = { self: { LanguageModel }, showToast: (m) => toasts.push(m), lsSet: () => {}, el: () => null, setProv: () => {}, Promise };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/copilot/on-device-ai.js'), 'utf8'), ctx);
  return { ctx, toasts };
}

test('on-device AI reports unsupported in browsers without the Prompt API', async () => {
  const { ctx } = loadOnDevice(undefined);
  assert.equal(await ctx.rwOnDeviceStatus(), 'unsupported');
  await assert.rejects(() => ctx.rwOnDeviceAsk('hi'), /not ready/);
});

test('on-device AI answers with a fresh session that is destroyed afterwards', async () => {
  let destroyed = 0, created = 0;
  const LM = { availability: async () => 'available', create: async () => { created++; return { prompt: async (p) => ' echo:' + p + ' ', destroy: () => { destroyed++; } }; } };
  const { ctx } = loadOnDevice(LM);
  assert.equal(await ctx.rwOnDeviceAsk('plan'), 'echo:plan');
  assert.equal(await ctx.rwOnDeviceAsk('plan2'), 'echo:plan2');
  assert.equal(created, 2);
  assert.equal(destroyed, 2);
});

test('aiRequest routes ondevice without any network call', () => {
  const src = fs.readFileSync(path.join(root, 'js/copilot/ai-providers.js'), 'utf8');
  assert.match(src, /if\(prov==='ondevice'\) return rwOnDeviceAsk\(prompt\)/);
});

function loadWebGPU(navigatorObj, store){
  const toasts = [];
  const ctx = { navigator: navigatorObj, document: { baseURI: 'https://x/' }, lsGet: (k) => (store || {})[k] || '', lsSet: () => {}, showToast: (m) => toasts.push(m), el: () => null, setProv: () => {}, Promise, URL };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/copilot/webgpu-ai.js'), 'utf8'), ctx);
  return { ctx, toasts };
}

test('WebGPU AI: unsupported browsers get a clear reason; f16 decides the model variant', async () => {
  const none = loadWebGPU({});
  const st = await none.ctx.rwWebGPUStatus();
  assert.equal(st.ok, false);
  assert.match(st.reason, /WebGPU/);
  const f16 = loadWebGPU({ gpu: { requestAdapter: async () => ({ features: new Set(['shader-f16']) }) } });
  assert.deepEqual(JSON.parse(JSON.stringify(await f16.ctx.rwWebGPUStatus())), { ok: true, f16: true });
  const noF16 = loadWebGPU({ gpu: { requestAdapter: async () => ({ features: new Set() }) } });
  assert.equal((await noF16.ctx.rwWebGPUStatus()).f16, false);
  assert.match(f16.ctx.rwWebGPUModelId('light', true), /Llama-3\.2-1B.*q4f16_1/);
  assert.match(f16.ctx.rwWebGPUModelId('light', false), /Llama-3\.2-1B.*q4f32_1/);
  assert.match(f16.ctx.rwWebGPUModelId('nonsense', true), /Llama-3\.2-1B/, 'unknown size falls back to the smallest model');
});

test('WebGPU AI: asking before setup fails with guidance, and aiRequest routes to it', async () => {
  const { ctx } = loadWebGPU({ gpu: {} });
  await assert.rejects(() => ctx.rwWebGPUAsk('hi', 100), /not set up/);
  const src = fs.readFileSync(path.join(root, 'js/copilot/ai-providers.js'), 'utf8');
  assert.match(src, /if\(prov==='webgpu'\) return rwWebGPUAsk\(prompt, maxTok\)/);
});

test('WebGPU engine is vendored with its licence and bypasses the service worker cache', () => {
  assert.ok(fs.existsSync(path.join(root, 'vendor/webllm/index.js')));
  assert.ok(fs.existsSync(path.join(root, 'vendor/webllm/LICENSE')));
  assert.match(fs.readFileSync(path.join(root, 'vendor/webllm/LICENSE'), 'utf8'), /Apache License/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /\/vendor\/webllm\//);
});

test('WebGPU AI: setup failures become plain-language messages', () => {
  const { ctx } = loadWebGPU({});
  assert.match(ctx.rwWebGPUFriendlyError('QuotaExceededError: Quota exceeded.'), /free storage/);
  assert.match(ctx.rwWebGPUFriendlyError(new Error('Failed to fetch')), /interrupted/);
  assert.match(ctx.rwWebGPUFriendlyError(new Error('Device lost: out of memory')), /Light size/);
});
