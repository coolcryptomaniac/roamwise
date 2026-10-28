const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('js/admin/capital-discipline.js','utf8'),c);
const calc=c.RWCapitalDiscipline.calculate;
const base={cash:600000,committed:0,monthlyCost:25000,contribution:0,costGrowth:0,aiCap:2000,aiActual:1000};
test('flat zero-revenue runway matches 10 and 20 year arithmetic',()=>{
 const m=calc(base);assert.equal(m.runway,24);assert.equal(m.need10,3000000);assert.equal(m.need20,6000000);
 assert.equal(m.gap10,2400000);assert.equal(m.reserve,600000);assert.equal(m.experimentHeadroom,0);
});
test('liabilities are excluded, never become operating capital',()=>{
 const m=calc({...base,committed:700000});assert.equal(m.available,0);assert.equal(m.liabilityGap,100000);assert.equal(m.runway,0);assert.equal(m.experimentHeadroom,0);
});
test('missing, invalid and negative values are unknown rather than a healthy zero',()=>{
 for(const value of ['',null,undefined,-1,Infinity,'oops'])assert.ok(calc({...base,cash:value}).errors.length);
 assert.ok(calc({...base,costGrowth:101}).errors.length);
});
test('cost increases can exhaust cash even when initially at break-even',()=>{
 const m=calc({...base,cash:0,contribution:25000,costGrowth:10});assert.equal(m.runway,12);assert.ok(m.need20>m.need10);assert.ok(m.need10>0);
});
test('surpluses and zero burn are bounded scenarios, not infinite runway claims',()=>{
 const m=calc({...base,contribution:30000});assert.equal(m.runway,null);assert.equal(m.need20,0);assert.match(c.RWCapitalDiscipline.summary(m),/not a guarantee/);
});
test('AI overrun warns without double counting costs',()=>{
 const m=calc({...base,aiCap:0,aiActual:100});assert.equal(m.aiOver,100);assert.equal(m.need10,3000000);assert.match(c.RWCapitalDiscipline.summary(m),/do not enforce/);
});
test('mount waits for saved finance data and saves a dedicated nested object',()=>{
 const html=fs.readFileSync('admin/index.html','utf8');
 assert.match(html,/FINANCE_COSTS=d.exists\?d.data\(\):\{\};renderBusiness\(\);renderCapitalDiscipline\(\)/);
 assert.match(html,/capitalDiscipline:values,updatedAt:FV.serverTimestamp\(\),updatedBy:CURRENT_ADMIN.uid\},\{merge:true\}/);
});
