'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const core=require('../tools/everyday-core.js');
const page=fs.readFileSync(path.join(root,'tools/everyday-essentials.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'tools/everyday.js'),'utf8');

test('only valid, bounded, user-entered rupee amounts count',()=>{
  assert.equal(core.money(''),null);
  assert.equal(core.money('-1'),null);
  assert.equal(core.money('10000001'),null);
  assert.equal(core.money('1e4'),null);
  assert.equal(core.money('100.001'),null);
  assert.equal(core.money('100.50'),100.5);
  assert.equal(core.money('0'),0);
  assert.equal(core.plannedTotal({housing:'5000',food:'2500.50',transport:''}),7500.5);
  assert.equal(core.plannedTotal({housing:'nope'}),null);
});

test('recurring return-journey costs use a stated 52/12-week month',()=>{
  assert.equal(core.monthlyReturnTrip('100',5),2166.67);
  assert.equal(core.monthlyReturnTrip('100',8),null);
  assert.equal(core.monthlyReturnTrip('-2',5),null);
  assert.equal(core.monthlyReturnTrip('',5),null);
  assert.equal(core.monthlyReturnTrip('0',0),0);
});

test('only expenses in the selected month are summed',()=>{
  const rows=[{date:'2026-09-01',amount:50},{date:'2026-09-20',amount:125.25},{date:'2026-08-31',amount:100}];
  assert.equal(core.monthSpend(rows,'2026-09'),175.25);
  assert.equal(core.monthSpend(rows,'2026-08'),100);
  assert.equal(core.monthSpend(rows,'not-a-month'),null);
});

test('standalone utility has no payment, auth, tracking or invented live pricing',()=>{
  assert.match(page,/Free · no sign-in/);
  assert.match(page,/Stored on this device/);
  assert.match(page,/everyday-core\.js/);
  assert.match(page,/everyday\.js/);
  assert.match(page,/id="spendForm"/);
  assert.match(page,/id="journeyResults"/);
  assert.doesNotMatch(page+'\n'+ui,/cashfree|firebase|fetch\(|navigator\.geolocation|google-analytics|gtag\(/i);
  assert.doesNotThrow(()=>new vm.Script(ui));
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(root,'tools/everyday-core.js'),'utf8')));
});
