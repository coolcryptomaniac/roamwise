import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('home has two endless destination rows wired after the rail engine',()=>{
  const html=read('index.html'),js=read('js/ui/destination-rows.js');
  assert.ok(html.indexOf('js/ui/rail-engine.js')<html.indexOf('js/ui/destination-rows.js'));
  assert.match(js,/Across India/);assert.match(js,/Beyond India/);assert.match(js,/RWRail\.create/);
  assert.match(js,/wikiAny/);assert.match(js,/rw_pimg_/);
});
test('100+ destinations are available for the rows (states excluded)',()=>{
  const ctx={};const o=new Function(read('js/data/place-overrides.js').replace('var RW_PLACE_OVERRIDES','this.RW_PLACE_OVERRIDES')+';return this;').call(ctx);
  const db=new Function('var window={};'+read('js/data/destinations.js')+';return DB;')();
  const names=new Set();db.filter(d=>d.country==='India').forEach(d=>names.add(d.name.toLowerCase()));
  Object.values(o.RW_PLACE_OVERRIDES).forEach(p=>{if(!/\(/.test(p.admin||''))names.add(p.name.toLowerCase())});
  assert.ok(names.size+db.filter(d=>d.country!=='India').length>=100,String(names.size));
});
test('essential home sections are no longer hidden',()=>{
  const css=read('design/ailon-first.css');
  for(const id of ['#rwFeatured,','#bigSix,','> #rwBoard,'])assert.ok(!css.includes('body.shell[data-view="home"] '+id),id);
});
