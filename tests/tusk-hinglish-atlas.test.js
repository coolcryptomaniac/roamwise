const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../js/copilot/atlas-answers.js'),'utf8');
const context = {module:{exports:{}},window:{}};
vm.runInNewContext(source,context);
const intent = context.module.exports.intent;
for (const [q,type,a,b] of [
  ['Chakrata kahan hai','where','Chakrata'],
  ['कनाताल कहाँ है','where','कनाताल'],
  ['kahan hai Kanatal','where','Kanatal'],
  ['Chakrata ke paas kya ghumne ki jagah','near','Chakrata'],
  ['घूमने की जगह के पास कनाताल','near','कनाताल'],
  ['Dehradun se Chakrata kitna door hai','distance','Dehradun','Chakrata'],
  ['दिल्ली से देहरादून कितना दूर है','distance','दिल्ली','देहरादून'],
  ['where is Almora','where','Almora'],
  ['how far is Jaipur from Delhi','distance','Delhi','Jaipur']
]) {
  const v=intent(q);
  assert.ok(v,q);
  assert.equal(v.type,type,q);
  assert.equal(v.a,a,q);
  if(b) assert.equal(v.b,b,q);
}
for(const s of ['hello','book a hotel','pay now','random nonsense']) assert.equal(intent(s),null,s);
console.log('Hinglish/Hindi atlas intent tests passed');
