const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const catalog = require('../shop/catalog.js');
// Run with the repository's jsdom, or a runtime-provided installation during development.
const {JSDOM} = require('jsdom');
function setup() {
  const dom = new JSDOM(fs.readFileSync(path.join(root,'shop/index.html'),'utf8'), {url:'https://www.roamwise.co.in/shop/',runScripts:'outside-only'});
  dom.window.HTMLElement.prototype.scrollIntoView = function() {};
  for (const f of ['catalog.js','shop.js']) vm.runInContext(fs.readFileSync(path.join(root,'shop',f),'utf8'), dom.getInternalVMContext());
  return dom;
}
test('catalogue IDs are unique and there are no purchase claims', () => {
  assert.equal(new Set(catalog.map(p=>p.id)).size,6);
  for(const p of catalog) { assert.ok(['wear','travel'].includes(p.category)); assert.equal(p.price,undefined); }
});
test('filters and enquiry correctly change between clothing and accessories', () => {
  const dom=setup(), d=dom.window.document;
  assert.equal(d.querySelectorAll('.product').length,6);
  d.querySelector('[data-filter="wear"]').click();
  assert.equal(d.querySelectorAll('.product').length,3);
  d.querySelector('.product button').click();
  assert.equal(d.querySelector('#size').disabled,false);
  d.querySelector('[name="quantity"]').value='2';
  d.querySelector('[name="pincode"]').value='263601';
  d.querySelector('#request-form').requestSubmit();
  assert.match(d.querySelector('#message').value,/Quantity: 2/);
  assert.match(d.querySelector('#message').value,/263601/);
  assert.match(d.querySelector('#email').href,/^mailto:support@roamwise.co.in\?subject=/);
  const whatsapp = new URL(d.querySelector('#whatsapp').href);
  assert.equal(whatsapp.origin, 'https://wa.me');
  assert.equal(whatsapp.pathname, '/919987379730');
  assert.equal(whatsapp.searchParams.get('text'), d.querySelector('#message').value);
  assert.match(d.querySelector('#message-status').textContent,/not sent/);
  d.querySelector('[data-filter="travel"]').click();
  d.querySelector('.product button').click();
  assert.equal(d.querySelector('#message-panel').hidden,true);
  assert.equal(d.querySelector('#size').disabled,true);
  assert.equal(d.querySelector('[name="quantity"]').value,'1');
  d.querySelector('#request-form').requestSubmit();
  assert.match(d.querySelector('#message').value,/Size: not applicable/);
  dom.window.close();
});
test('invalid input cannot prepare an enquiry', () => {
  const dom=setup(),d=dom.window.document;
  d.querySelector('.product button').click();
  for(const [name,value] of [['quantity','0'],['quantity','51'],['quantity','1.5'],['pincode','123']]) {
    d.querySelector('#request-form').reset();
    d.querySelector('[name="'+name+'"]').value=value;
    assert.equal(d.querySelector('#request-form').checkValidity(),false);
    d.querySelector('#request-form').requestSubmit();
    assert.equal(d.querySelector('#message-panel').hidden,true);
  }
  dom.window.close();
});
test('clipboard failure leaves a selectable manual fallback', async () => {
  const dom=setup(),d=dom.window.document;
  d.querySelector('.product button').click();
  d.querySelector('#request-form').requestSubmit();
  d.querySelector('#copy').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(d.querySelector('#message-status').textContent,/Select and copy/);
  dom.window.close();
});
