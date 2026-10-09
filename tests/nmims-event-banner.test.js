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
test('countdown uses India midnight; today on the day; gone the day after',()=>{
  const start=Date.parse('2026-10-14T18:30:00Z'); /* 00:00 IST 15 Oct */
  assert.equal(B.startMs('2026-10-15'),start);
  const c=B.countdown(start-(2*86400000+3*3600000+4*60000+5000),'2026-10-15');
  assert.deepEqual([c.state,c.d,c.h,c.m,c.s],['before',2,3,4,5]);
  assert.equal(B.countdown(start+1000,'2026-10-15').state,'today');
  assert.equal(B.countdown(start+86400000,'2026-10-15').state,'over');
});
test('index.html loads the banner script',()=>{
  assert.match(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),/js\/ui\/nmims-event-banner\.js/);
});
