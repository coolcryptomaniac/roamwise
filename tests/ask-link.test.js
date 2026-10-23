'use strict';
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
function load() {
  const ctx = { window: {}, document: { readyState: 'loading', getElementById: () => null }, location: { search: '' }, setTimeout: () => 0 };
  ctx.window = ctx; ctx.window.addEventListener = () => {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/copilot/ask-link.js'), 'utf8'), ctx);
  return ctx.rwAskFromSearch;
}
test('?ask= decodes, strips markup and control characters, limits length', () => {
  const f = load();
  assert.equal(f(''), ''); assert.equal(f('?x=1'), '');
  assert.equal(f('?ask=Is%20the%20road%20safe%3F'), 'Is the road safe?');
  assert.equal(f('?ask=a%3Cscript%3Eb%0A%0Ac'), 'a script b c');
  assert.equal(f('?ask=' + 'x'.repeat(900)).length, 600);
  assert.equal(f('?ask=%E0%A4%A'), '');
});
