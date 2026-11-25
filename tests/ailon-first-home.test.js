'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

test('completed Bengaluru summit is archived, not promoted on the app homepage',()=>{
  const home=read('index.html');
  const seed=JSON.parse(read('memories/seed.json'));
  const data=JSON.parse(read('memories/data.json'));
  assert.doesNotMatch(home,/id="rwBtsSummit"/);
  assert.doesNotMatch(home,/Bengaluru Tech Summit, meet Ailon Tusk/);
  const event=seed.events.find(e=>e.id==='bengaluru-tech-summit-2026');
  assert.ok(event,'summit archive must survive memories rebuilds');
  assert.ok(event.videos.length>=3);
  for(const id of ['42_OibYl_yg','Jz5hebOvd6Q','5TiLF9tYf-U'])assert.ok(event.videos.some(v=>v.youtube===id));
  assert.equal(data.events.filter(e=>e.id===event.id).length,1);
  assert.equal(data.events.filter(e=>/^yt-/.test(e.id)&&/Bengaluru Tech Summit|\bBTS 2026\b/i.test(e.title)).length,0);
});

test('Ailon is the primary entry point and saved trips and requests remain reachable',()=>{
  const home=read('index.html');
  const script=read('js/ui/ailon-first.js');
  const css=read('design/ailon-first.css');
  assert.match(home,/id="copilotHero"/);
  assert.match(home,/id="rwTuskPrompts"/);
  assert.match(home,/id="rwTuskDesk"/);
  assert.match(home,/data-rw-open="bookings"/);
  assert.match(home,/data-rw-open="itineraries"/);
  assert.match(script,/W\.copilotSend\(true\)/);
  assert.match(script,/Do not assume a payment or booking is confirmed/);
  assert.match(css,/body\.shell\[data-view="home"\] #rwSalesCarousels/);
  assert.match(css,/body\.shell\[data-view="home"\] #bigSix/);
});

test('More has a real page, searchable tools and Android-friendly navigation',()=>{
  const more=read('more/index.html');
  const quick=read('js/ui/home-quick-access.js');
  const adaptive=read('js/ui/adaptive-shell.js');
  assert.match(more,/id="moreSearch"/);
  assert.match(more,/href="\/memories\/"/);
  assert.match(more,/href="\/\?rw_open=bookings"/);
  assert.match(quick,/href: '\/more\/'/);
  assert.match(adaptive,/var RW_TABS_DEFAULT = \['home','copilot','plan','more'\]/);
  assert.doesNotMatch(read('index.html'),/id="tb-trips"/);
  assert.match(more,/href="\/partner\/join\/"/);
  assert.match(more,/href="\/corporate\/\#hr"/);
  assert.match(more,/href="\/pricing\.html"/);
  assert.match(adaptive,/\/more\/index\.html/);
  for(const p of ['more/index.html','memories/index.html','design/ailon-first.css','js/ui/ailon-first.js'])assert.ok(fs.existsSync(p));
});

test('new scripts remain syntactically valid',()=>{
  for(const p of ['js/ui/ailon-first.js','js/ui/adaptive-shell.js','js/ui/home-quick-access.js','js/ui/home-curated-discovery.js']){
    assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
  }
});

test('curated commerce is a single category at a time, with real itinerary, shop and HR destinations',()=>{
  const home=read('index.html'),dir=read('js/ui/home-curated-discovery.js'),style=read('design/home-curated-commerce.css');
  assert.match(home,/id="rwDiscoverFilters"/);
  assert.match(home,/id="rwSalesItineraries"/);
  assert.match(home,/id="rwSalesCorporate"/);
  assert.match(home,/href="\/itinerary-library\/presets\/kumaon\/signature\.pdf"/);
  assert.match(home,/href="\/corporate\/#hr"/);
  assert.match(home,/id="rwSalesShop"/);
  assert.doesNotMatch(home,/#rwSalesShop,\.rw-trackheading:has\(\+ #rwSalesShop\)\{display:none!important\}/);
  assert.match(dir,/sessionStorage\.setItem\('rw_discovery_category'/);
  assert.match(dir,/aria-pressed/);
  assert.match(style,/\[hidden\].*display:none!important/);
  assert.match(read('corporate/index.html'),/Supplier|supplier/);
});

test('default curated homepage hides duplicate promotions while leaving destinations in More',()=>{
  const css=read('design/home-curated-commerce.css'),more=read('more/index.html');
  assert.match(css,/data-rw-design\] body.shell\[data-view="home"\] #rwCreditCard \{display:grid!important/);
  assert.match(css,/data-rw-design="himalayan-saanjh".*#rwPioneerRail/);
  assert.match(css,/data-rw-design="himalayan-saanjh".*#brand-ambassador/);
  assert.match(more,/href="\/credit\/"/);
  assert.match(more,/href="\/pioneer\/"/);
});
