'use strict';
const test=require('node:test'), assert=require('node:assert');
const fs=require('fs'), vm=require('vm');
const ctx={window:{}}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../events-data.js','utf8'),ctx);
const W=ctx.window;
test('new categories exist and every event uses a known category',()=>{
  const ids=W.RW_EVENT_CATS.map(c=>c.id);
  ['trade','art','festival'].forEach(c=>assert.ok(ids.includes(c)));
  W.RW_EVENTS.forEach(e=>assert.ok(ids.includes(e.cat),e.id));
});
test('event ids are unique',()=>{
  const ids=W.RW_EVENTS.map(e=>e.id); assert.strictEqual(new Set(ids).size,ids.length);
});
test('2026-28 entries have dates, honest verified flag, and a source link',()=>{
  const n=W.RW_EVENTS.filter(e=>['trade','art','festival'].includes(e.cat));
  assert.ok(n.length>=50);
  n.forEach(e=>{
    assert.match(e.start,/^20(26|27|28)-\d\d-\d\d$/); assert.ok(e.end>=e.start,e.id);
    assert.ok(['confirmed','typical'].includes(e.verified));
    assert.ok(e.tips.some(t=>/https?:\/\//.test(t)),e.id);
  });
});
test('stakeholder ratings are 1-5 for all seven audiences',()=>{
  const S=W.RW_EVENT_STAKE; assert.ok(Object.keys(S).length>=50);
  Object.entries(S).forEach(([id,m])=>{
    'RFUCPAV'.split('').forEach(k=>assert.ok(m[k]>=1&&m[k]<=5,id+k));
    assert.ok(m.p>=1&&m.p<=5);
  });
  ['hornbill','startupmahakumbh','websummit'].forEach(i=>assert.ok(S[i],i));
});
