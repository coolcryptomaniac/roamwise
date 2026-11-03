const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const d=JSON.parse(fs.readFileSync('creators/natasha-opportunities.json','utf8'));
const page=fs.readFileSync('creators/natasha.html','utf8');
test('every opportunity has the required fields and a known tier',()=>{
  assert.match(d.updatedAt,/^\d{4}-\d{2}-\d{2}$/);
  const ids=new Set();
  for(const i of d.items){
    for(const k of ['id','tier','title','place','when','status','blurb','checked'])assert.ok(i[k],i.id+' missing '+k);
    assert.ok(['himachal','national','international'].includes(i.tier),i.id);
    assert.ok(!ids.has(i.id),'duplicate '+i.id);ids.add(i.id);
  }
});
test('links are https only (or absent)',()=>{
  for(const i of d.items)if(i.url!==null)assert.match(i.url,/^https:\/\//,i.id);
});
test('list is ordered near home, then India, then abroad',()=>{
  const o=['himachal','national','international'],t=d.items.map(i=>o.indexOf(i.tier));
  assert.deepEqual(t,[...t].sort((a,b)=>a-b));
  for(const k of o)assert.ok(d.items.some(i=>i.tier===k),k+' empty');
});
test('page is information-only and respects reduced motion',()=>{
  assert.match(page,/does not apply on her behalf/);
  assert.match(page,/prefers-reduced-motion/);
  assert.match(page,/natasha-opportunities\.json/);
  assert.ok(!/innerHTML/.test(page.split('id="opps"')[1]||''),'no innerHTML for feed');
});
