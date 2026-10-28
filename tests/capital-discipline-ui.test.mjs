import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const source=fs.readFileSync('js/admin/capital-discipline.js','utf8');
const values={cash:600000,committed:0,monthlyCost:25000,contribution:0,costGrowth:0,aiCap:2000,aiActual:1000};
function setup(saved){
 const dom=new JSDOM('<div id="capitalDiscipline"></div>',{runScripts:'outside-only'});
 dom.window.eval(source);const host=dom.window.document.getElementById('capitalDiscipline');
 let savedValues;
 dom.window.RWCapitalDiscipline.mount(host,saved,async v=>{savedValues=v;});
 return {dom,host,saved:()=>savedValues};
}
test('Kumaon presentation preserves labelled fields and empty-state honesty',()=>{
 const {dom,host}=setup();
 assert.equal(host.querySelectorAll('fieldset').length,3);
 assert.equal(host.querySelectorAll('input').length,7);
 for(const input of host.querySelectorAll('input'))assert.ok(host.querySelector('label[for="'+input.id+'"]'));
 assert.ok(host.querySelector('svg[aria-hidden="true"]'));
 assert.ok(host.querySelector('.cd-empty'));
 assert.equal(host.querySelector('.cd-ring'),null);
 assert.equal(host.querySelector('[name="cash"]').value,'');
 dom.window.close();
});
test('reserve and timeline correspond to calculations; edits clear the result',()=>{
 const {dom,host}=setup(values);
 host.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(host.querySelector('.cd-ring').style.getPropertyValue('--coverage'),'100%');
 assert.equal(host.querySelector('.cd-track span').style.width,'10%');
 assert.match(host.querySelector('.cd-runway-value').textContent,/24 full months/);
 assert.equal(host.querySelectorAll('table tbody tr').length,2);
 host.querySelector('input').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.equal(host.querySelector('.cd-results'),null);
 assert.match(host.querySelector('[role="status"]').textContent,/Recalculate/);
 dom.window.close();
});
test('save action still passes reviewed numbers and retains accessibility cues',async()=>{
 const {dom,host,saved}=setup(values);
 host.querySelector('[data-save]').click();
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(saved().cash,600000);
 assert.equal(host.querySelector('[data-save]').disabled,false);
 assert.match(host.querySelector('[role="status"]').textContent,/saved/);
 assert.ok(host.querySelector('[data-result][aria-live="polite"]'));
 dom.window.close();
});
test('zero-cost reserve does not claim 100% coverage',()=>{
 const {dom,host}=setup({...values,monthlyCost:0});
 host.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
 assert.equal(host.querySelector('.cd-ring').style.getPropertyValue('--coverage'),'0%');
 assert.match(host.textContent,/No reserve target can be assessed/);
 dom.window.close();
});
