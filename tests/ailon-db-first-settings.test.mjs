import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const core=read('js/copilot/core.js');
const search=read('js/copilot/sourced-search.js');
const settings=read('js/ui/settings-modal.js');
const css=read('design/design-vault.css');
const vault=read('design/design-vault.js');
const html=read('index.html');

test('normal and fallback Ailon paths are database-first',()=>{
 assert.match(core,/await rwTuskWorkerSearch\(q,out\)/);
 assert.match(core,/if\(out\.abs\|\|out\.hits\.length\)return out;/);
 assert.match(core,/if\(place&&!kb&&typeof rwTuskIsPublicQuery/);
 assert.match(search,/return rwMiniSearch\(t\)/);
 assert.match(core,/rwCuratedFirst\(t,intents,thinking,shared\)/);
});
test('external providers are an explicit off-by-default preference',()=>{
 assert.match(search,/rw_tusk_external_search/);
 assert.match(core,/!rwTuskExternalSourcesEnabled\(\)\)return null/);
 assert.match(settings,/rwTuskExternalSearch/);
 assert.match(settings,/check\.addEventListener\('change'/);
});
test('Settings opens deliberately, has an accessible shortcut and keeps three editions',()=>{
 assert.match(settings,/window\.navigator\.userActivation\.isActive===false/);
 assert.equal((html.match(/class="rw-tusk-ai-settings"/g)||[]).length,1);
 assert.match(css,/#rwSettingsHome/);
 assert.match(settings,/rwSettingsLanguage/);
 assert.match(settings,/openSizeSettings\(\)/);
 assert.match(vault,/himalayan-saanjh/);
 assert.match(vault,/kasar-cloud/);
 assert.match(vault,/buransh-bazaar/);
 assert.match(html,/design\/design-vault\.css\?v=20261124-atlas1/);
});
test('booking and payment processing are not moved into the search module',()=>{
 assert.doesNotMatch(search,/\/payments\/checkout|Cashfree\.createOrder/);
 assert.match(core,/No verified RoamWise answer yet/);
 assert.match(search,/Public knowledge lookup was skipped/);
});
