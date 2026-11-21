'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = p => fs.readFileSync(p, 'utf8');

test('all revenue sections remain in one existing horizontal home rail', () => {
  const home = read('index.html');
  for(const id of ['rwSalesCarousels','rwSalesStays','rwSalesPackages','rwSalesWeddings','rwSalesShop','rwSalesTreks']){
    assert.match(home,new RegExp('id="'+id+'"'),id+' must be rendered');
  }
  assert.match(home,/\/packages\/amor-checkout\.html\?package=manali-intimate-wedding/);
  assert.match(home,/\/shop\/\?buy=almora-after-dark-hoodie/);
  assert.match(home,/scroll-snap-type:x mandatory/);
  assert.doesNotMatch(read('design/ailon-first.css'),/data-view="home"\] #rwSalesCarousels\s*,/);
  assert.doesNotMatch(home,/#rwSalesShop,\.rw-trackheading:has\(\+ #rwSalesShop\)\{display:none/);
});

test('artist, wallet and partner routes are reachable', () => {
  const home=read('index.html');
  assert.match(home,/class="xsec v v-home v-explore" id="brand-ambassador"/);
  assert.doesNotMatch(home, /body\[data-view="home"\] #brand-ambassador/);
  assert.match(home,/natasha/);
  assert.match(read('js/ui/home-quick-access.js'),/id: 'wallet'.*href: '\/wallet\/'/);
  assert.doesNotMatch(read('design/ailon-first.css'),/body\.shell\[data-view="home"\] #rwWalletChip/);
  assert.ok(fs.existsSync('wallet/index.html'));
  assert.ok(fs.existsSync('partners/index.html'));
  assert.match(read('partners/index.html'),/location\.replace\('\/partnership\/'/);
  assert.ok(fs.existsSync('partnership/index.html'));
});

test('Ailon shortcuts do not auto-submit sensitive generic instructions', () => {
  const source=read('js/ui/ailon-first.js');
  assert.doesNotMatch(source,/W\.copilotSend\(true\)/);
  assert.match(source,/inp\.focus\(\)/);
  assert.match(source,/Plan a day-by-day trip to/);
  const rail=read('js/copilot/rich-reply.js');
  assert.match(rail,/class="rw-rail-more"/);
  assert.match(rail,/Road advisories/);
  assert.match(rail,/More tools/);
  assert.doesNotThrow(()=>new vm.Script(source));
  assert.doesNotThrow(()=>new vm.Script(rail));
});

test('Ailon composer has reduced height without reducing touch target sizes', () => {
  const css=read('app.css'),mobile=read('mobile-stability.css');
  assert.match(css,/min-height:168px!important/);
  assert.match(mobile,/min-height: 164px !important/);
  assert.match(mobile,/width: 42px !important/);
  assert.match(read('js/ui/adaptive-shell.js'),/document\.body\.dataset\.view/);
});

test('checkout and account security paths remain unchanged by UI recovery', () => {
  const home=read('index.html');
  assert.match(home,/booking.*provider confirmation|Prices and reservations require provider confirmation/i);
  assert.match(home,/id="rwWalletChip"/);
  const audit=read('docs/ROAMWISE-MOBILE-COMMERCE-AUDIT-2026-11-22.md');
  assert.match(audit,/Cashfree/);
  assert.match(audit,/No permanent deletion/);
});
