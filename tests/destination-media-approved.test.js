'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const loader=fs.readFileSync(path.join(root,'js/ui/destination-media-loader.js'),'utf8');
const filmstrip=fs.readFileSync(path.join(root,'js/ui/destination-filmstrip.js'),'utf8');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'media/destination-manifest-v1.json'),'utf8'));
function setup(){
 const dom=new JSDOM('<!doctype html><html><body><section id="rwDestinationsRail"><div id="rwDestinationTrack"></div><button id="rwDestinationPrev"></button><button id="rwDestinationNext"></button><span id="rwDestinationCount"></span></section><div id="copilotHero"><textarea id="heroInput"></textarea></div></body></html>',{url:'https://roamwise-web.pages.dev/',runScripts:'outside-only'});
 dom.window.DB=[{id:'tokyo',name:'Tokyo',country:'Japan'}];
 dom.window.eval(loader);dom.window.eval(filmstrip);
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 return dom;
}
const valid={version:1,assets:{
 tokyo:{src:'https://assets.roamwise.co.in/media/tokyo-photo-v1',note:'© licensed photographer',
 alt:'Tokyo skyline at dusk',rightsStatus:'licensed',status:'published',
 licenseProof:'verified-in-d1-editorial-ledger'}
}};
test('empty initial manifest is intentional and no third-party generator required',()=>{
 assert.equal(manifest.version,1);
 assert.deepEqual(manifest.assets,{});
 assert.match(home,/js\/ui\/destination-media-loader\.js/);
 assert.ok(home.indexOf('destination-media-loader.js')<home.indexOf('destination-filmstrip.js'));
 assert.doesNotMatch(loader,/pollinations\.ai|cashfree\/order|CASHFREE_SECRET/);
});
test('accept only published rights-cleared exact-domain images',()=>{
 const d=setup(),validate=d.window.RWDestinationMedia.validate;
 assert.ok(validate(valid).tokyo);
 assert.deepEqual(Object.keys(validate({version:1,assets:{
  tokyo:{...valid.assets.tokyo,rightsStatus:'pending'},
  almora:{...valid.assets.tokyo,src:'https://assets.roamwise.co.in.evil.test/media/x'},
  london:{...valid.assets.tokyo,src:'https://assets.roamwise.co.in/media/../../private'},
  'new-york':{...valid.assets.tokyo,licenseProof:''}
 }})),[]);
 d.window.close();
});
test('manifest arriving later upgrades a Tokyo placeholder without changing destination or booking',async()=>{
 const d=setup(),w=d.window;
 const target=w.document.querySelector('[data-rw-destination-id="tokyo"]');
 assert.ok(target,'Tokyo destination exists');
 assert.ok(target.querySelector('.rw-photo-fallback'),'initial destination has a gradient fallback');
 const originalActions=target.querySelector('.rw-destination-actions').textContent;
 w.fetch=async()=>({ok:true,json:async()=>valid});
 const media=await w.RWDestinationMedia.load();
 assert.equal(media.tokyo.src,'https://assets.roamwise.co.in/media/tokyo-photo-v1');
 const img=target.querySelector('.rw-destination-photo img');
 assert.ok(img,'photo upgraded without page reload');
 assert.equal(img.getAttribute('alt'),'Tokyo — Tokyo skyline at dusk');
 assert.equal(target.querySelector('.rw-destination-actions').textContent,originalActions);
 assert.equal(target.querySelector('.rw-dest-stays').getAttribute('href'),'/partner/?role=customer&destination=Tokyo');
 d.window.close();
});
test('manifest network failures preserve existing browsing and fallback',async()=>{
 const d=setup(),w=d.window;
 w.fetch=async()=>{throw Error('offline')};
 assert.equal(Object.keys(await w.RWDestinationMedia.load()).length,0);
 assert.ok(w.document.querySelector('[data-rw-destination-id="tokyo"] .rw-photo-fallback'));
 d.window.close();
});
