'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({window:{_rwFxINR:90}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/itinerary/shadow-budget.js'),'utf8'),context);
const calc=context.shadowBudget;
const goa={name:'Goa',country:'India',region:'South Asia',cur:'INR',
  cost:{budget:1400,mid:3200,luxury:8500},
  brk:{flights:0,stay:1400,food:700,act:600,misc:500}};
test('Goa daily INR data is not interpreted as USD/week',()=>{
  const mid=calc(goa,6,'mid');
  const rupees=mid.total*90;
  assert.ok(rupees>19000&&rupees<23000,`expected roughly ₹21k, got ₹${rupees}`);
  assert.equal(mid.sourceCurrency,'INR');
  assert.equal(mid.sourcePeriod,'day');
  assert.equal(mid.tips,0);
  assert.equal(mid.oneOff.airport,0);
  assert.equal(mid.flightsIncluded,false);
});
test('budget, mid and luxury styles actually produce different expenses',()=>{
  const low=calc(goa,6,'budget');
  const mid=calc(goa,6,'mid');
  const high=calc(goa,6,'luxury');
  assert.ok(low.total<mid.total&&mid.total<high.total);
  assert.ok(low.perDay.stay<mid.perDay.stay);
  assert.ok(mid.perDay.food<high.perDay.food);
});
test('generic India hint stays a non-live model and remains domestic',()=>{
  const e=context.costEntryForPlace({cc:'IN',name:'Auli',country:'India'});
  const b=calc(e,5,'budget');
  assert.equal(b.domestic,true);
  assert.equal(b.sourcePeriod,'week');
  assert.ok(b.total>0&&Number.isFinite(b.total));
});
test('international dollar weekly data keeps weekly USD semantics',()=>{
  const e={name:'Hoi An',country:'Vietnam',region:'Southeast Asia',cur:'VND',
    cost:{budget:450,mid:800,luxury:1800},
    brk:{flights:260,stay:130,food:70,act:60,misc:40}};
  const b=calc(e,7,'mid');
  assert.equal(b.sourceCurrency,'USD');
  assert.equal(b.sourcePeriod,'week');
  assert.ok(b.total>0&&b.total<900);
});
test('markup describes the estimate as not live and excludes unquoted transfers',()=>{
  const html=context.shadowBudgetHTML(goa,6,'budget');
  assert.match(html,/NOT live rates/);
  assert.match(html,/unquoted airport transfers are EXCLUDED/);
  assert.doesNotMatch(html,/Carry roughly/);
});
