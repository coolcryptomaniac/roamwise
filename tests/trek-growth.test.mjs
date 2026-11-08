import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(join(root,p),'utf8');
test('trek tools and homepage JS all parse',()=>{
 for(const p of ['treks/app.js','treks/studio-plus.js','js/ui/trek-home-carousel.js','js/ui/trek-founder-pro-deeplink.js'])
  assert.doesNotThrow(()=>new Function(read(p)),p);
});
test('only founder-reviewed approved departures reach the homepage',()=>{
 const worker=read('worker/handlers/treks-marketplace.js');
 const home=read('js/ui/trek-home-carousel.js');
 assert.match(worker,/p\.status==='published'&&map\.has\(p\.ownerUid\)/);
 assert.match(worker,/p\.status==='approved'&&p\.verified===true/);
 assert.match(home,/\.\/treks\/catalog|\/treks\/catalog/);
 assert.doesNotMatch(home,/hike_and__seek|Gaurav Aswal/);
 assert.match(home,/package=.+encodeURIComponent\(p\.id\)/);
});
test('enquiries require permission, valid package and verified operator before writes',()=>{
 const worker=read('worker/handlers/treks-marketplace.js');
 assert.match(worker,/path==='treks\/enquiry'/);
 assert.match(worker,/b\.consent!==true/);
 assert.match(worker,/const entry=await approved\(ctx,b\.packageId\)/);
 assert.match(worker,/await create\(ctx,'trekEnquiries'/);
 assert.match(worker,/path==='treks\/enquiries'/);
 assert.match(worker,/queryEqualsString\(env,ctx\.token,ctx\.project,'trekEnquiries','ownerUid',claims\.uid/);
 assert.match(worker,/partner\.status!=='approved'\|\|partner\.verified!==true/);
});
test('onboarding does not require Pro, payment stays gated, and operator photos carry provenance',()=>{
 const html=read('treks/index.html');
 const worker=read('worker/handlers/treks-marketplace.js');
 assert.match(html,/Partner registration and batch management work without a Pro purchase/);
 assert.match(html,/Sachinbauriyan/);
 assert.match(html,/CC BY-SA 4\.0/);
 assert.match(worker,/gate\.checkoutEnabled!==true/);
 assert.match(worker,/order\.order_status==='PAID'/);
 assert.match(html,/showBusinessWhatsapp/);
});
test('itinerary generation explicitly refuses to invent confirmed facts',()=>{
 const js=read('treks/studio-plus.js');
 assert.match(js,/Pending operator confirmation/);
 assert.match(js,/No trek is confirmed until the operator accepts the booking/);
 assert.match(js,/Print → Save as PDF/);
 assert.match(js,/No customer enquiries yet/);
});
