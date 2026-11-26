import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('organiser page offers all three plan models',()=>{
  const d=JSON.parse(read('organisers/plans.json'));
  assert.deepEqual(d.plans.map(p=>p.id),['monthly','per-trip','commission']);
  for(const p of d.plans)assert.ok(p.name&&Array.isArray(p.points)&&p.points.length>0);
});
test('organiser page links from home and More, no checkout on the page',()=>{
  assert.match(read('js/ui/home-quick-access.js'),/href: '\/organisers\/'/);
  assert.match(read('more/index.html'),/href="\/organisers\/"/);
  const js=read('organisers/organisers.js');assert.match(js,/Founding price on request/);assert.ok(!/cashfree|razorpay|checkout/i.test(js));
});
