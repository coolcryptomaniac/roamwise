import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('rail engine loads before the rails that use it',()=>{
  const html=read('index.html');
  const engine=html.indexOf('js/ui/rail-engine.js'),stays=html.indexOf('js/ui/stay-browser.js'),creators=html.indexOf('js/ui/home-creators.js');
  assert.ok(engine>0&&engine<stays&&engine<creators);
  assert.match(read('js/ui/stay-browser.js'),/W\.RWRail\.create\(track/);
  assert.match(read('js/ui/home-creators.js'),/W\.RWRail\.create\(track/);
});
test('rail engine keeps the page bounded and supports server pages and queries',()=>{
  const js=read('js/ui/rail-engine.js');
  assert.match(js,/MAX_NODES = 120/);assert.match(js,/fetchPage/);assert.match(js,/setQuery/);assert.match(js,/data-rw-loop-of/);
});
test('footer names the three startup programs in text, without third-party logos',()=>{
  const html=read('index.html');
  const foot=html.slice(html.indexOf('id="rwHomeFooter"'),html.indexOf('</footer>',html.indexOf('id="rwHomeFooter"')));
  for(const t of ['NVIDIA Inception','Google for Startups Cloud Program','Sarvam Startup Program'])assert.ok(foot.includes(t),t);
  assert.ok(!/<img/i.test(foot));
  const eco=read('ecosystem.html');for(const id of ['nvidia-inception','google-for-startups','sarvam-startup-program'])assert.match(eco,new RegExp('id="'+id+'"'));
});
