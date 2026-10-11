'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const rd=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('track() buffers counters and flushes ONE merged write (not one write per event)',()=>{
  const src=rd('js/misc/engagement.js'); const a=src.indexOf('var _trkBuf'); const b=src.indexOf('/* Per-response thumbs');
  const writes=[]; const timers=[];
  const ctx={AUTH_READY:true,lsSet(){}, setTimeout:(f)=>{timers.push(f);return 1;}, document:{addEventListener(){}},
    firebase:{firestore:{FieldValue:{increment:n=>({inc:n})}}},
    db:{collection:()=>({doc:()=>({set:(o)=>{writes.push(o);return Promise.resolve();}})})}};
  vm.runInNewContext(src.slice(a,b),ctx);
  ctx.track('a');ctx.track('a');ctx.track('b');
  assert.equal(writes.length,0); assert.equal(timers.length,1);
  timers[0]();
  assert.equal(writes.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0])),{a:{inc:2},b:{inc:1}});
});
test('lastActive + device registration run at most once per 6h per account per browser',()=>{
  const s=rd('js/boot/auth-init.js');
  assert.match(s,/rw_reg_'\+u\.uid/);
  assert.match(s,/6\*3600\*1000/);
  assert.match(s,/if\(rwRegDue\) try\{ ref\.set\(\{lastActive/);
  assert.match(s,/if\(rwRegDue\) try\{\s*ref\.collection\('devices'\)/);
});
test('compressed opening film is already in use',()=>{
  assert.match(rd('platform-v5/atlas-shinobi.js'),/Date\.UTC\(2026, 9, 11\)/);
});
