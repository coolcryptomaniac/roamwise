'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { JSDOM } = require('jsdom');
const source = p => fs.readFileSync(p, 'utf8');
const models = source('app.js').match(/var AI_MODELS = \{[\s\S]*?\n\};/)[0];
const token = 'hf_unitTestTokenNotARealCredential';
const ok = text => ({ status: 200, json: async () => ({ choices: [{ message: { content: text } }] }) });
function setup(store = {}, response = () => ok('OK')) {
  const calls = [];
  const ctx = {
    window: { AbortController }, AbortController, setTimeout, clearTimeout, console,
    lsGet: k => store[k] || '', lsSet: (k,v) => { store[k] = v; },
    activeProv: 'smart', lastAiSource: null, isPro: false,
    showToast() {}, el() { return null; },
    fetch: async (url, init) => { calls.push({ url, init }); return response(url, init); },
  };
  vm.createContext(ctx);
  vm.runInContext(models + '\n' + source('js/copilot/ai-providers.js'), ctx);
  return { ctx, calls, store };
}
function callAny(ctx) {
  return new Promise(resolve => ctx.aiCallAny('Plan a quiet trip', 300, (error, text) => resolve({error,text}), true));
}

test('HF uses its fixed HTTPS router, bearer token, selected model and bounded output', async () => {
  const x = setup({rwHFModel:'Qwen/Qwen3.5-9B:cheapest'});
  await x.ctx.aiRequest('huggingface', token, 'ignored/default', 'नमस्ते', 9000, true);
  assert.equal(x.calls.length, 1);
  const {url,init} = x.calls[0], body = JSON.parse(init.body);
  assert.equal(url, 'https://router.huggingface.co/v1/chat/completions');
  assert.equal(init.headers.Authorization, 'Bearer ' + token);
  assert.equal(init.credentials, 'omit');
  assert.equal(init.redirect, 'error');
  assert.equal(body.model, 'Qwen/Qwen3.5-9B:cheapest');
  assert.equal(body.max_tokens, 4096);
  assert.match(body.messages[0].content, /नमस्ते/);
  assert.match(body.messages[0].content, /valid JSON/);
  assert.equal(body.response_format, undefined, 'do not require JSON mode on unsupported HF providers');
  assert.ok(!init.body.includes(token));
});

test('bad token and malformed model fail before any network call', async () => {
  const x = setup();
  await assert.rejects(x.ctx.aiRequest('huggingface', 'gsk_wrongProvider', 'org/model', 'hi', 20), /hf_/);
  await assert.rejects(x.ctx.aiRequest('huggingface', token, 'https://other.example/model', 'hi', 20), /model ID/);
  assert.equal(x.calls.length, 0);
});

test('a saved HF key never spends credits from Smart or another provider fallback', async () => {
  const x = setup({rwKey_huggingface:token});
  assert.deepEqual(await callAny(x.ctx), {error:null,text:null});
  assert.equal(x.calls.length, 0);
  x.store.rwKey_groq = 'gsk_unitTest';
  x.ctx.activeProv = 'groq';
  await callAny(x.ctx);
  assert.ok(x.calls.every(c => c.url.startsWith('https://api.groq.com/')));
});

test('explicit HF mode records the chosen model and does not call the managed Worker', async () => {
  const x = setup({rwKey_huggingface:token,rwHFModel:'org/custom-model:provider'});
  x.ctx.activeProv = 'huggingface';
  assert.deepEqual(await callAny(x.ctx), {error:null,text:'OK'});
  assert.equal(x.ctx.lastAiSource.prov, 'huggingface');
  assert.equal(x.ctx.lastAiSource.model, 'org/custom-model:provider');
  assert.equal(x.calls.length, 1);
  assert.ok(x.calls[0].url.startsWith('https://router.huggingface.co/'));
});

for (const [status, message] of [[401,/token rejected/],[402,/credits required/],[403,/Inference Providers permission/],[404,/model unavailable/],[429,/rate limit/],[503,/temporarily unavailable/]]) {
  test('HF ' + status + ' is actionable and never echoes upstream secrets', async () => {
    const x = setup({}, () => ({status,json:async()=>({error:{message:token + ' private prompt'}})}));
    await assert.rejects(x.ctx.aiRequest('huggingface',token,'org/model','hi',20), e => {
      assert.equal(e.httpStatus,status); assert.match(e.message,message);
      assert.ok(!e.message.includes(token)); assert.ok(!e.message.includes('private prompt')); return true;
    });
    assert.equal(x.calls.length,1);
  });
}

test('non-JSON HF billing errors retain their HTTP status', async () => {
  const x = setup({}, () => ({status:402,json:async()=>{throw new SyntaxError('not JSON');}}));
  await assert.rejects(x.ctx.aiRequest('huggingface',token,'org/model','hi',20), e => e.httpStatus===402 && /credits/.test(e.message));
});

test('HF key test reports missing permissions rather than claiming the key is invalid', async () => {
  const x=setup({},()=>({status:403,json:async()=>({})}));
  const status={textContent:'',className:''};
  x.ctx.testKeyFallbackChain('huggingface',token,status);
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(status.textContent,/Inference Providers permission/);
  assert.equal(status.className,'key-status ks-bad');
  assert.equal(x.calls.length,1);
});

test('HF key participates in the existing encrypted bundle and shared-device wipe', async () => {
  const x=setup({rwKey_huggingface:token});
  Object.assign(x.ctx,{crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,btoa,atob,
    localStorage:{removeItem:k=>delete x.store[k]},refreshProUI(){}});
  vm.runInContext(source('js/data-sync/key-sync.js'),x.ctx);
  const bundle=x.ctx.rwKeyBundle();
  assert.equal(bundle.huggingface,token);
  const encrypted=await x.ctx.rwEncryptSecrets(bundle,'a passphrase for this test');
  assert.ok(!JSON.stringify(encrypted).includes(token));
  assert.equal((await x.ctx.rwDecryptSecrets(encrypted,'a passphrase for this test')).huggingface,token);
  const auth=source('js/boot/auth-init.js');
  vm.runInContext(auth.slice(auth.indexOf('function wipeSession(){'),auth.indexOf('\nfunction authMenu(){')),x.ctx);
  x.ctx.wipeSession();
  assert.equal(x.store.rwKey_huggingface,token,'default existing persistence remains unchanged');
  x.store.rw_wipe_keys='1';
  x.ctx.wipeSession();
  assert.equal(x.store.rwKey_huggingface,undefined);
});

test('Settings opt-in, HF Save/Clear, model field and turning advanced AI off work in the current markup', async () => {
  const dom=new JSDOM(source('index.html'),{url:'https://www.roamwise.co.in/',runScripts:'outside-only'});
  const w=dom.window, store={}, calls=[];
  Object.assign(w,{lsGet:k=>store[k]||'',lsSet:(k,v)=>{store[k]=v;},el:id=>w.document.getElementById(id),
    showToast(){},secPanelHTML(){return '';},activeProv:'smart',isPro:false,RW_IS_ADMIN:false,RW_WEBGPU_MODELS:{},
    fetch:async(url,init)=>{calls.push({url,init});return ok('OK');}});
  w.eval(models);
  w.eval(source('js/copilot/ai-providers.js'));
  w.eval(source('js/ui/settings-modal.js'));
  w.eval(source('js/ui/key-wizard.js'));
  const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
  w.openSettings(); await tick();
  assert.ok(w.el('advOptIn'),'the current section headings must expose the opt-in control');
  assert.equal(w.el('keyBoxes').closest('.key-section').style.display,'none');
  w.el('advOptIn').click(); w.el('advOptIn').click(); await tick();
  assert.equal(store.rwAdvAI,'1');
  w.el('advToggle').click();
  assert.notEqual(w.el('keyBoxes').closest('.key-section').style.display,'none');
  assert.equal(w.el('huggingfaceKey').type,'password');
  const input=w.el('huggingfaceModel');
  input.value='Qwen/Qwen3.5-9B:cheapest';
  w.Function(input.getAttribute('oninput')).call(input);
  assert.equal(store.rwHFModel,input.value);
  w.el('huggingfaceKey').value=token;
  w.eval(w.el('huggingfaceKey').parentNode.querySelector('.k-save').getAttribute('onclick'));
  assert.equal(store.rwKey_huggingface,token);
  assert.equal(w.activeProv,'huggingface');
  assert.equal(calls.length,0,'saving alone never makes a paid inference call');
  assert.equal(w.keyProvider(token),'huggingface');
  const st=w.document.createElement('div');
  w.wizTest('huggingface',token,st); await tick();
  assert.match(st.textContent,/is working/);
  assert.equal(calls.length,1);
  assert.equal(JSON.parse(calls[0].init.body).model,store.rwHFModel);
  w.clearKey('huggingface');
  assert.equal(store.rwKey_huggingface,'');
  assert.equal(w.activeProv,'smart');
  w.el('advOff').click();
  w.openSettings(); await tick();
  assert.ok(w.el('advOptIn'));
  assert.equal(w.el('keyBoxes').closest('.key-section').style.display,'none');
  dom.window.close();
});
