import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileDirectory,founderListedCreator,pickFeatured} from '../network/publish-core.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('founder-listed creators publish public Instagram fields only, never contacts',()=>{
  const raw={id:'abc1',seg:'creator',name:'Hill Tales',handle:'https://instagram.com/hilltales',email:'a@b.in',phone:'+919999999999',note:'WhatsApp: 99999',barter:{metrics:{followers:52000},location:{town:'Almora'}}};
  const r=founderListedCreator(raw);
  assert.equal(r.instagram,'https://www.instagram.com/hilltales/');
  assert.equal(r.followers,52000);assert.equal(r.listing,'founder');assert.equal(r.publicConsent,false);
  const json=JSON.stringify(r);
  for(const secret of ['a@b.in','9999','WhatsApp'])assert.ok(!json.includes(secret));
});
test('applicants without Instagram, hidden or removal-requested are not listed',()=>{
  assert.equal(founderListedCreator({id:'x',seg:'creator',name:'No IG'}),null);
  assert.equal(founderListedCreator({id:'x',seg:'creator',name:'Gone',handle:'@gone',removalRequested:true}),null);
  assert.equal(founderListedCreator({id:'x',seg:'creator',name:'a@b.in',handle:'@mail'}),null);
});
test('founder listing is opt-in at export time and features at most two big creators',()=>{
  const creators=[1,2,3].map(i=>({id:'c'+i,seg:'creator',name:'C'+i,handle:'@c'+i,barter:{metrics:{followers:i*20000}}}));
  assert.equal(compileDirectory({creators}).directory.creators.length,0);
  const d=compileDirectory({creators},{includeFounderListed:true}).directory;
  assert.equal(d.creators.length,3);
  assert.deepEqual(d.creators.filter(c=>c.featured).map(c=>c.id).sort(),['c2','c3']);
  assert.deepEqual(pickFeatured([{id:'s',followers:500}]),[]);
});
test('home creators section is wired and keeps numbers masked',()=>{
  const html=read('index.html'),js=read('js/ui/home-creators.js');
  assert.match(html,/js\/ui\/home-creators\.js/);assert.match(html,/design\/home-creators\.css/);
  assert.match(js,/\/network\/directory\.json/);
  assert.match(js,/Shared only when you both accept a match/);
  assert.ok(!/phone|whatsapp/i.test(js.replace(/rwc-phone|📞/g,'')),'no contact field is read');
});
