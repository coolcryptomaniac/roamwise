import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
function setup(){
 const dom=new JSDOM('<section id="copilotHero"><div class="copilot-compose"><textarea id="heroInput"></textarea></div><button data-rw-tusk="stay">Find a stay</button><button data-rw-tusk="booking">Booking assistance</button></section><section id="rwCreditCard"></section>',{url:'https://roamwise.co.in/',runScripts:'outside-only'});
 const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.scrollTo=function(opts){this.scrollLeft=opts.left;};
 w.eval(read('partners-data.js'));w.eval(read('js/booking/routes.js'));w.eval(read('js/misc/listings.js'));
 w.eval(read('js/ui/stay-browser.js'));w.eval(read('js/ui/ailon-first.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {dom,w,d:w.document};
}
test('Find a stay shows every published property with existing checkout destinations, preserving a draft and using no AI',()=>{
 const {dom,w,d}=setup();let sends=0;w.copilotSend=()=>sends++;
 d.querySelector('#heroInput').value='My unsent itinerary';d.querySelector('[data-rw-tusk="stay"]').click();
 assert.equal(d.querySelector('#heroInput').value,'My unsent itinerary');assert.equal(sends,0);assert.equal(d.querySelector('#rwGuidedPrompt'),null);
 const expected=w.RW_PARTNERS.filter(p=>p.cat==='stay'&&w.rwStayPublicEligible(p)&&w.rwBookingOpen(p));
 assert.equal(expected.length,10);assert.equal(d.querySelectorAll('.rw-property-card').length,expected.length);
 for(const p of expected){const card=d.querySelector('[data-property-id="'+p.id+'"]');const pay=w.rwBookingRoutes(p).find(r=>r.type==='pay');assert.equal(card.querySelector('a').getAttribute('href'),pay.href);}
 assert.equal(d.activeElement.id,'rwStayBrowserTitle');dom.window.close();
});
test('property search, empty results, clearing and live refresh retain the whole collection without duplicates',()=>{
 const {dom,w,d}=setup(),search=d.querySelector('#rwStaySearch');
 search.value='Almora';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.rw-property-card').length,3);
 search.value='unlisted island';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.rw-property-card').length,0);assert.match(d.querySelector('[role="status"]').textContent,/No property matches/);
 Array.from(d.querySelectorAll('button')).find(b=>b.textContent==='Show all properties').click();assert.equal(d.querySelectorAll('.rw-property-card').length,10);
 w.RW_PARTNERS.push({...w.RW_PARTNERS[0],id:'duplicate'});d.dispatchEvent(new w.CustomEvent('rw:partners-refreshed'));assert.equal(d.querySelectorAll('.rw-property-card').length,10);
 dom.window.close();
});
test('new enquiry-only listings have no payment button and ineligible research stays stay hidden',()=>{
 const {dom,w,d}=setup();
 w.RW_PARTNERS.push({id:'p_new',cat:'stay',name:'New mountain home',zone:'Kasar Devi',listingReady:true,verified:'self-listed',enquiryOnly:true,selfListed:{mouVersion:'RW-PMOU-2026-09-27-V4'}},{id:'research',cat:'stay',name:'Unapproved hotel',zone:'Test',listingReady:true,verified:'listed',bookingMode:'pay'});
 d.dispatchEvent(new w.CustomEvent('rw:partners-refreshed'));
 const card=d.querySelector('[data-property-id="p_new"]');assert.ok(card);assert.match(card.querySelector('a').href,/\/escapes\/\?stay=New\+mountain\+home/);assert.doesNotMatch(card.textContent,/pay|Choose room/);assert.equal(d.querySelector('[data-property-id="research"]'),null);dom.window.close();
});
test('Booking assistance exposes working stay, reservation, request and support actions even with a draft',()=>{
 const {dom,w,d}=setup();let reservations=0,requests=0;w.rwOpenTripDesk=()=>reservations++;w.openBooking=()=>requests++;
 d.querySelector('#heroInput').value='Keep this draft';d.querySelector('[data-rw-tusk="booking"]').click();
 const help=d.querySelector('#rwBookingHelp');assert.ok(help&&!help.hidden);assert.equal(d.activeElement.id,'rwBookingHelpTitle');
 Array.from(help.querySelectorAll('button')).find(b=>b.textContent==='View my reservations').click();assert.equal(reservations,1);
 Array.from(help.querySelectorAll('button')).find(b=>b.textContent==='View my trip requests').click();assert.equal(requests,1);
 assert.match(help.querySelector('a').href,/^mailto:support@roamwise.co.in/);
 Array.from(help.querySelectorAll('button')).find(b=>b.textContent==='Find & book a stay').click();assert.equal(help.hidden,true);assert.equal(d.activeElement.id,'rwStayBrowserTitle');assert.equal(d.querySelector('#heroInput').value,'Keep this draft');dom.window.close();
});
test('carousel arrows wrap and keyboard navigation respects reduced motion',()=>{
 const {dom,w,d}=setup(),track=d.querySelector('#rwStayTrack');w.RWDesignEngine={motionEnabled:()=>false};
 Object.defineProperties(track,{scrollWidth:{value:2000},clientWidth:{value:400}});track.firstElementChild.getBoundingClientRect=()=>({width:300});
 let call;track.scrollTo=opts=>{call=opts;track.scrollLeft=opts.left;};
 d.querySelector('[data-stay-arrow="-1"]').click();assert.deepEqual({...call},{left:1600,behavior:'auto'});
 d.querySelector('[data-stay-arrow="1"]').click();assert.equal(call.left,0);
 track.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(call.left,313);dom.window.close();
});
