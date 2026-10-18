'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','js/ui/nmims-event-banner.js'),'utf8');
function load(){ const w={}; const ctx={window:w,document:{getElementById(){return null;},querySelector(){return null;}},setTimeout(){},setInterval(){},db:undefined}; vm.runInNewContext(src,ctx); return w.rwNmimsBanner; }
const B=load();
test('hidden unless the MOU go-live switch is on, and bannerOn can hide it',()=>{
  assert.equal(B.parse(null).show,false);
  assert.equal(B.parse({officialConfirmed:false}).show,false);
  assert.equal(B.parse({officialConfirmed:true}).show,true);
  assert.equal(B.parse({officialConfirmed:true,bannerOn:false}).show,false);
});
test('defaults to 15 Oct 2026; venue/time only if founder set them; text sanitised',()=>{
  const c=B.parse({officialConfirmed:true});
  assert.equal(c.date,'2026-10-15'); assert.equal(c.venue,''); assert.equal(c.timeText,'');
  const d=B.parse({officialConfirmed:true,eventDate:'bad',eventName:'<img src=x> Fest',venue:'Hall\nA'});
  assert.equal(d.date,'2026-10-15'); assert.ok(!/[<>]/.test(d.name)); assert.ok(!/\n/.test(d.venue));
});
test('countdown uses India midnight; today on the day; thanks the day after; then redeem-your-pass until the coupons expire',()=>{
  const start=Date.parse('2026-10-14T18:30:00Z'); /* 00:00 IST 15 Oct */
  assert.equal(B.startMs('2026-10-15'),start);
  const c=B.countdown(start-(2*86400000+3*3600000+4*60000+5000),'2026-10-15');
  assert.deepEqual([c.state,c.d,c.h,c.m,c.s],['before',2,3,4,5]);
  assert.equal(B.countdown(start+1000,'2026-10-15').state,'today');
  assert.equal(B.countdown(start+86400000,'2026-10-15').state,'after');
  assert.equal(B.countdown(start+2*86400000-1000,'2026-10-15').state,'after');
  const end=Date.parse('2026-11-10T09:00:00Z');
  const r=B.countdown(start+2*86400000,'2026-10-15',end);
  assert.equal(r.state,'redeem'); assert.ok(r.daysLeft>=24);
  assert.equal(B.countdown(end-1000,'2026-10-15',end).state,'redeem');
  assert.equal(B.countdown(end-1000,'2026-10-15',end).daysLeft,1);
  assert.equal(B.countdown(end,'2026-10-15',end).state,'over');
  /* no stored deadline: fallback is 26 days after the event starts, never "gone after two days" */
  assert.equal(B.countdown(start+10*86400000,'2026-10-15').state,'redeem');
  assert.equal(B.countdown(start+26*86400000,'2026-10-15').state,'over');
});
test('redeem deadline comes from couponExpiresAt (Timestamp, seconds object or number); highlights link must be https',()=>{
  const ms=Date.parse('2026-11-10T09:00:00Z');
  assert.equal(B.parse({officialConfirmed:true,couponExpiresAt:{toMillis:()=>ms}}).endMs,ms);
  assert.equal(B.parse({officialConfirmed:true,couponExpiresAt:{seconds:ms/1000}}).endMs,ms);
  assert.equal(B.parse({officialConfirmed:true,couponExpiresAt:ms}).endMs,ms);
  assert.equal(B.parse({officialConfirmed:true,couponExpiresAt:'junk'}).endMs,B.startMs('2026-10-15')+26*86400000);
  assert.equal(B.parse({officialConfirmed:true}).highlightsUrl,'');
  assert.equal(B.parse({officialConfirmed:true,highlightsUrl:'javascript:alert(1)'}).highlightsUrl,'');
  assert.equal(B.parse({officialConfirmed:true,highlightsUrl:'http://x.example/a'}).highlightsUrl,'');
  assert.equal(B.parse({officialConfirmed:true,highlightsUrl:'https://www.instagram.com/p/abc/'}).highlightsUrl,'https://www.instagram.com/p/abc/');
  assert.equal(B.parse({officialConfirmed:true}).highlightsText,'See event highlights');
});
test('index.html loads the banner script',()=>{
  assert.match(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),/js\/ui\/nmims-event-banner\.js/);
});
test('banner shows the RoamWise logo crest from a real, small asset and respects reduced motion',()=>{
  assert.match(src,/roamwise-logo-176\.webp/);
  assert.match(src,/crest\.alt='RoamWise'/);
  const f=path.join(__dirname,'..','assets/img/roamwise-logo-176.webp');
  assert.ok(fs.existsSync(f)&&fs.statSync(f).size<20000);
  assert.match(src,/prefers-reduced-motion:reduce[^']*sg-crest/);
});
test('real RoamWise logo replaces the placeholder R/RW boxes, favicon and install prompt use it',()=>{
  const root=path.join(__dirname,'..'), rd=f=>fs.readFileSync(path.join(root,f),'utf8');
  const html=rd('index.html');
  assert.doesNotMatch(html,/<div class="logo-icon">RW?<\/div>/);
  assert.equal((html.match(/class="logo-icon logo-img" src="\/assets\/img\/roamwise-logo-176\.webp"/g)||[]).length,2);
  assert.doesNotMatch(html,/rel="icon" href="data:image\/svg/);
  assert.match(html,/rel="icon" type="image\/png" sizes="32x32" href="\/icons\/favicon-32\.png\?v=20261018"/);
  assert.match(rd('css/base/02-shell.css'),/\.logo-img\{/);
  assert.match(rd('js/boot/init.js'),/roamwise-logo-176\.webp[^]*Install RoamWise/);
  assert.match(rd('sw.js'),/'\/assets\/img\/roamwise-logo-176\.webp'/);
  assert.match(rd('nmims/redeem/index.html'),/class="brand"[^>]*><img src="\/assets\/img\/roamwise-logo-176\.webp"/);
  for(const f of ['icons/favicon-32.png','icons/icon-192.png']) assert.ok(fs.existsSync(path.join(root,f)),f);
});
test('logo also appears on the first-visit opening, the loading veil and the intro, with reduced-motion respected',()=>{
  const root=path.join(__dirname,'..'), rd=f=>fs.readFileSync(path.join(root,f),'utf8');
  assert.match(rd('js/ui/opening.js'),/rw-open-logo[^]*roamwise-logo-176\.webp/);
  assert.match(rd('css/base/05-desktop-and-discovery.css'),/\.rw-open-logo\{/);
  const html=rd('index.html');
  assert.match(html,/<div id="rwVeil"[^>]*><img src="\/assets\/img\/roamwise-logo-176\.webp"/);
  assert.match(html,/class="introLogo" src="\/assets\/img\/roamwise-logo-176\.webp"/);
  assert.match(rd('css/base/03-features-legacy.css'),/prefers-reduced-motion:reduce\)\{\.intro \.introLogo\{animation:none\}/);
});
