import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('choosing a model in AI settings refreshes the Ailon Tusk chips',()=>{
  const s=read('js/ui/settings-modal.js');
  assert.match(s,/cpModelChips\('heroModels'\); cpModelChips\('cpModels'\)/);
});
test('active model chip is listed first and visible in the current design',()=>{
  assert.match(read('js/copilot/core.js'),/chips\.sort\(function\(a,b\)\{ return \(b\[0\]===cur\)-\(a\[0\]===cur\); \}\)/);
  assert.ok(!/#heroModels \{display:none/.test(read('design/design-vault.css')));
});
