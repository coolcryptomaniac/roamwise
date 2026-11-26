import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('composer has one toolbar: voice agent left; model picker, dictate and send right',()=>{
  const h=read('index.html');
  const bar=h.slice(h.indexOf('class="rw-tusk-bar"'),h.indexOf('class="rw-tusk-prompts"'));
  assert.ok(bar.indexOf('rw-tb-voice')<bar.indexOf('rw-tusk-bar-right'));
  const right=bar.slice(bar.indexOf('rw-tusk-bar-right'));
  assert.ok(right.indexOf('rwModelPill')<right.indexOf('rw-tb-mic')&&right.indexOf('rw-tb-mic')<right.indexOf('heroSend'));
  assert.match(bar,/id="heroModels"/);assert.match(bar,/id="rwHomeVoiceLang"/);
  assert.ok(!h.includes('rw-tusk-hero-tools'),'single voice entry, no second row above the box');
  assert.ok(h.indexOf('design/tusk-composer.css')>h.indexOf('design/design-vault.css'),'composer css loads last');
});
test('voice agent keeps answer structure and does not leak into the text chat',()=>{
  const v=read('js/voice/tusk-studio.js'),core=read('js/copilot/core.js');
  assert.match(v,/function formatted\(div\)/);assert.match(v,/SAFE_TAGS/);
  assert.match(v,/data-action=\\"to-chat\\"|data-action="to-chat"/);
  assert.match(v,/querySelectorAll\('\[data-voice\]'\)\.forEach\(function\(n\)\{n\.remove\(\);\}\)/);
  assert.match(core,/setAttribute\('data-voice','1'\)/);
});
