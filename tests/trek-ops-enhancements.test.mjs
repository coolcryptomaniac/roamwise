import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const backend=file('worker/handlers/treks-marketplace.js');
const portal=file('treks/app.js');
const studio=file('treks/studio-plus.js');
const page=file('treks/index.html');
const home=file('js/ui/trek-home-carousel.js');

test('operator closing a batch checks ownership and makes it unavailable to quote/catalog',()=>{
 assert.match(backend,/path==='treks\/package\/close'/);
 assert.match(backend,/pkg\.ownerUid!==claims\.uid/);
 assert.match(backend,/status:'paused',closedByOperator:true/);
 assert.match(backend,/if\(!pkg\|\|pkg\.status!=='published'/);
 assert.match(backend,/packages\.filter\(p=>p\.status==='published'/);
 assert.match(portal,/data-close=/);
 assert.match(portal,/Existing paid requests must still be managed/);
});

test('operator real photo galleries are bounded, reviewed and displayed only on approved listings',()=>{
 assert.match(backend,/gallery\.length>4/);
 assert.match(backend,/gallery\.some\(u=>u\.length>450/);
 assert.match(backend,/galleryUrls:gallery/);
 assert.match(backend,/galleryUrls:Array\.isArray\(pkg\.galleryUrls\)\?pkg\.galleryUrls\.slice\(0,4\)/);
 assert.match(page,/name="galleryUrls"/);
 assert.match(portal,/class="trek-photo-strip"/);
 assert.match(home,/Array\.isArray\(p\.galleryUrls\)/);
 assert.match(home,/Approved treks only/);
});

test('quick-day wizard retains exact operator route notes and marks unknown days',()=>{
 assert.match(page,/id="dayNotes"/);
 assert.match(page,/id="fillDayPlan"/);
 assert.match(studio,/function fillDayPlan\(/);
 assert.match(studio,/notes\.length>days/);
 assert.match(studio,/Add route, safety, food and timings before submitting/);
 assert.match(studio,/no route or safety facts were invented/);
});

test('marketing poster is explicit about approval and real photo rights',()=>{
 assert.match(page,/id="printPromo"/);
 assert.match(studio,/\$\('printPromo'\)\.addEventListener/);
 assert.match(studio,/DRAFT · NOT BOOKABLE/);
 assert.match(studio,/APPROVED DEPARTURE · OPERATOR CONFIRMATION REQUIRED/);
 assert.match(studio,/Photo: /);
 assert.match(studio,/Print → Save as PDF/);
});

test('approved operators may share their own filtered listing and see truthful readiness steps',()=>{
 assert.match(portal,/new URLSearchParams\(location\.search\)\.get\('operator'\)/);
 assert.match(portal,/p\.provider\?\.id===operatorFilter/);
 assert.match(studio,/function readiness\(/);
 assert.match(studio,/owner\?\.status/);
 assert.match(studio,/currentOwner\?\.status==='approved'/);
 assert.match(studio,/rights to verify/);
 assert.match(studio,/not a safety certification, rating or promise of sales/);
});
