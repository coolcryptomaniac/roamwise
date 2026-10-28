const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/booking/everyday-needs.js','utf8');
function load(extra={}){const c={...extra};vm.createContext(c);vm.runInContext(source,c);return c;}
const base={purpose:'monthly',tier:'budget',place:'Almora',budget:'5000'};
test('all needs and comfort tiers produce bounded, approval-based planning requests',()=>{
 const c=load();
 for(const purpose of ['monthly','work','family','medical','transfer','pilgrimage'])for(const tier of ['budget','comfort','premium']){
  const prompt=c.rwEverydayRequest({...base,purpose,tier});
  assert.match(prompt,/Maximum total budget for the whole request: INR 5000/);
  assert.match(prompt,/Ask for dates, people/);
  assert.match(prompt,/No booking or payment without my approval/);
 }
 assert.match(c.rwEverydayRequest({...base,purpose:'transfer'}),/electric transport where available and suitable/);
});
test('bad inputs do not silently produce a budget or unsupported category',()=>{
 const c=load();
 for(const budget of ['',0,-1,'abc',1.2,10000001,Infinity])assert.equal(c.rwEverydayRequest({...base,budget}),'');
 for(const purpose of ['other','constructor','__proto__'])assert.equal(c.rwEverydayRequest({...base,purpose}),'');
 assert.equal(c.rwEverydayRequest({...base,place:'   '}),'');
 assert.doesNotMatch(c.rwEverydayRequest({...base,place:'<Almora>'}),/[<>]/);
});
test('form preserves existing chat draft, then prepares without sending or persisting',()=>{
 let submit;const status={};const input={value:'My existing question',focus(){},scrollIntoView(){},dispatchEvent(){}};
 const form={elements:Object.fromEntries(Object.entries(base).map(([k,v])=>[k,{value:v}])),reportValidity:()=>true,addEventListener:(name,fn)=>{submit=fn;}};
 const nodes={rwEverydayForm:form,rwEverydayStatus:status,heroInput:input};
 load({document:{getElementById:id=>nodes[id]},Event:class{}});
 submit({preventDefault(){}});assert.equal(input.value,'My existing question');assert.match(status.textContent,/unsent chat draft/);
 input.value='';submit({preventDefault(){}});assert.match(input.value,/monthly or relocation/);assert.match(status.textContent,/press Send/);
});
