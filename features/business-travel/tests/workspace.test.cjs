const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('node:path');
const repo = path.resolve(__dirname, '../../..');
const base = path.join(repo, 'business/');
const html = fs.readFileSync(base+'index.html','utf8');
const downloads=[];
function boot(saved, storageFailure=false) {
  const dom = new JSDOM(html,{url:'https://roamwise.co.in/business/',runScripts:'outside-only'});
  const w=dom.window;
  w.confirm=()=>true;
  w.Blob=global.Blob;
  w.URL.createObjectURL=b=>{downloads.push(b);return 'blob:local-test'};
  w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){};
  w.fetch=()=>{throw new Error('Unexpected network request')};
  if(saved)w.localStorage.setItem('rw_business_draft_v1',saved);
  if(storageFailure)Object.defineProperty(w,'localStorage',{get(){throw new Error('storage blocked')}});
  for (const tag of w.document.querySelectorAll('script[src]')) {
    w.eval(fs.readFileSync(path.resolve(base, tag.getAttribute('src')), 'utf8'));
  }
  return dom;
}
function put(w,form,name,value) {
  const e=w.document.getElementById(form).elements.namedItem(name);
  if(e.type==='checkbox')e.checked=value;else e.value=value;
  e.dispatchEvent(new w.Event('input',{bubbles:true}));
}
function click(w,id){w.document.getElementById(id).click()}
function trip(w){Object.entries({title:'Pilot visit',costCenter:'SALES',route:'Delhi → Jaipur',startDate:'2026-09-10',endDate:'2026-09-12',budget:'25000',dailyLimit:'8000',receiptThreshold:'500'}).forEach(([k,v])=>put(w,'trip-form',k,v));}
function expense(w,description='Train') {Object.entries({description,date:'2026-09-10',amount:'1200',receiptRef:'receipt.pdf',fxDate:'2026-09-10'}).forEach(([k,v])=>put(w,'expense-form',k,v));click(w,'add-expense');}
const test = require('node:test');
test('business workspace: real form handlers, data protection, exports, restore and storage failures', async () => {
  const dom=boot(),w=dom.window,d=w.document;
  assert.equal(d.getElementById('remember').checked,false);assert.equal(w.localStorage.length,0);
  trip(w);expense(w,'<img src=x onerror=alert(1)>');
  assert.equal(d.querySelectorAll('.expense').length,1);assert.equal(d.querySelectorAll('.expense img').length,0);
  assert.equal(d.getElementById('total').textContent,'INR 1,200.00');assert.equal(d.getElementById('export-csv').disabled,false);
  assert.equal(d.getElementById('base-currency').disabled,true);
  const ledgerRow=d.querySelector('.expense');
  put(w,'trip-form','title','Pilot visit updated');
  assert.equal(d.querySelector('.expense'),ledgerRow,'Trip typing must preserve existing ledger nodes');
  d.querySelector('.row-actions button').click();put(w,'expense-form','amount','0.10');click(w,'add-expense');assert.equal(d.getElementById('total').textContent,'INR 0.10');
  click(w,'remember');assert.ok(w.localStorage.getItem('rw_business_draft_v1'));const saved=w.localStorage.getItem('rw_business_draft_v1');
  put(w,'trip-form','title','Final title');
  assert.equal(JSON.parse(w.localStorage.getItem('rw_business_draft_v1')).draft.trip.title,'Pilot visit updated','Save should be batched while typing');
  w.dispatchEvent(new w.Event('beforeunload',{cancelable:true}));
  assert.equal(JSON.parse(w.localStorage.getItem('rw_business_draft_v1')).draft.trip.title,'Final title','Navigation must flush a pending opted-in save');
  click(w,'backup');const backup=await downloads.at(-1).text();assert.equal(JSON.parse(backup).draft.expenses.length,1);
  click(w,'export-csv');assert.ok((await downloads.at(-1).text()).includes('"0.10"'));
  click(w,'export-json');assert.equal(JSON.parse(await downloads.at(-1).text()).total,'0.10');
  click(w,'new-trip');assert.equal(d.querySelectorAll('.expense').length,0);
  const file=d.getElementById('restore');Object.defineProperty(file,'files',{value:[{size:backup.length,text:async()=>backup}],configurable:true});
  file.dispatchEvent(new w.Event('change'));await new Promise(r=>setImmediate(r));assert.equal(d.querySelectorAll('.expense').length,1);
  d.querySelectorAll('.row-actions button')[1].click();assert.equal(d.querySelectorAll('.expense').length,0);
  click(w,'remember');assert.equal(w.localStorage.getItem('rw_business_draft_v1'),null);
  const restored=boot(saved);assert.equal(restored.window.document.getElementById('total').textContent,'INR 0.10');restored.window.close();
  const corrupt=boot('{');assert.match(corrupt.window.document.getElementById('message').textContent,/could not be loaded/);corrupt.window.close();
  const blocked=boot(null,true);trip(blocked.window);expense(blocked.window);click(blocked.window,'remember');assert.match(blocked.window.document.getElementById('save-status').textContent,/Could not save/);blocked.window.close();
  assert.ok([...d.querySelectorAll('label[for]')].every(l=>d.getElementById(l.htmlFor)));
  dom.window.close();console.log('DOM smoke PASS: default privacy, trip/expense add+edit+remove, XSS-as-text, exact totals, all downloads, opt-in save, reload, restore, new trip, corrupt and blocked storage. No network calls.');
});
