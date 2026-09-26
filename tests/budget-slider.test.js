'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const code=fs.readFileSync(path.join(__dirname,'../js/ui/currency-budget.js'),'utf8');
function load(){const state={};vm.runInNewContext(code,state);return state;}

test('budget stages change from ultra budget through luxury',()=>{
  const s=load();
  assert.equal(s.rwBudgetStage(500,'INR').stage.title,'Jugaad Ninja');
  assert.equal(s.rwBudgetStage(250000,'INR').stage.title,'Picture Abhi Baaki');
  assert.equal(s.rwBudgetStage(450000,'INR').stage.title,'Main Character Energy');
  assert.equal(s.rwBudgetStage(490900,'INR').stage.band,'Ultra luxury');
});

test('stage thresholds follow each currency profile',()=>{
  const s=load();
  assert.equal(s.rwBudgetStage(10,'USD').index,0);
  assert.equal(s.rwBudgetStage(5000,'USD').index,2);
  assert.equal(s.rwBudgetStage(10000,'USD').index,4);
});

test('slider publishes accessible live value text and versioned asset',()=>{
  const home=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(code,/aria-valuetext/);
  assert.match(home,/currency-budget\.js\?v=rw-budget-stages-2/);
});
