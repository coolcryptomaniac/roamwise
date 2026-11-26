import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import schema from '../design/catalogue-core.js';
import { handleDesignCatalogue, DESIGN_CATALOGUE_KEY } from '../worker/handlers/design-catalogue.js';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const seed=JSON.parse(read('design/catalogue.json'));
const clone=()=>JSON.parse(JSON.stringify(seed));
function mount({reduced=false,remote=null,cached=null}={}){
 const dom=new JSDOM(read('index.html'),{url:'https://roamwise.co.in/',runScripts:'outside-only',pretendToBeVisual:true});
 const {window:w}=dom;const requests=[];let mediaChange;
 const media={matches:reduced,addEventListener:(_event,fn)=>{mediaChange=fn;}};
 w.matchMedia=()=>media;w.AbortController=AbortController;
 w.fetch=async(url,options)=>{requests.push({url,options});if(!remote)throw new Error('offline');return {ok:true,json:async()=>remote};};
 if(cached)w.localStorage.setItem('rw_design_catalogue_v1',JSON.stringify({catalogue:cached,savedAt:Date.now()}));
 ['catalogue-core.js','catalogue-seed.js','design-engine.js','design-vault.js'].forEach(f=>w.eval(read('design/'+f)));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {dom,w,requests,setReduced:v=>{media.matches=v;mediaChange();}};
}

test('catalogue rejects executable values, unknown recipes, unsafe motion and unsupported editions',()=>{
 assert.equal(schema.validate(seed),true);
 const mutations=[
  d=>{d.colors.amber='url(https://bad.invalid/track)'},
  d=>{d.borders.ailon.duration=.1},d=>{d.cards.ailon.radius=10000},
  d=>{d.animations.border.recipe='javascript:alert(1)'},d=>{d.carousel.interval=40},
  d=>{d.editions[0].id='unknown-layout'},d=>{d.editions[0].name='<img onerror=alert(1)>'},
  d=>{d.components[0].recipe='eval'},d=>{d.moods.push('remote-script')},
  d=>{d.carousel.pauseOnInteraction=false},d=>{d.schemaVersion=2}
 ];
 for(const mutate of mutations){const data=clone();mutate(data);assert.equal(schema.validate(data),false);}
 assert.equal(schema.validate(null),false);
});

test('catalogue API reads only design release key and never writes on public traffic',async()=>{
 const reads=[];let writes=0;
 const env={RW_KV:{get:async(k,t)=>{reads.push([k,t]);return clone();},put:()=>{writes++;}}};
 const response=await handleDesignCatalogue(new Request('https://api.test/design/catalogue'),env);
 assert.equal(response.status,200);const body=await response.json();
 assert.equal(body.storage,'kv');assert.deepEqual(body.catalogue,seed);
 assert.deepEqual(reads,[[DESIGN_CATALOGUE_KEY,'json']]);assert.equal(writes,0);
 const post=await handleDesignCatalogue(new Request('https://api.test/design/catalogue',{method:'POST',body:'{}'}),env);
 assert.equal(post.status,405);assert.equal(reads.length,1);
 assert.match(response.headers.get('Cache-Control'),/max-age=300/);
});

test('missing, invalid, stale-version and failing storage all use the reviewed offline release',async()=>{
 const invalid=clone();invalid.cards.credit.surface='url(evil)';const old=clone();old.version='2026-11-24.1';
 for(const stored of [null,invalid,old]){
  const response=await handleDesignCatalogue(new Request('https://api.test/design/catalogue'),{RW_KV:{get:async()=>stored}});
  const body=await response.json();assert.equal(body.storage,'bundled');assert.deepEqual(body.catalogue,seed);
 }
 const body=await (await handleDesignCatalogue(new Request('https://api.test/design/catalogue'),{RW_KV:{get:async()=>{throw Error('down')}}})).json();
 assert.deepEqual(body.catalogue,seed);
});

test('engine works offline and preserves original booking nodes through every edition',async()=>{
 const {w,dom}=mount();await new Promise(r=>setTimeout(r,0));
 assert.equal(w.RWDesignEngine.source(),'bundled');
 const cards=[...w.document.querySelectorAll('.rw-sales-card')],hrefs=cards.map(n=>n.href);
 const hero=w.document.getElementById('copilotHero'),credit=w.document.getElementById('rwCreditCard');
 for(const edition of seed.editions){
  w.RWDesignVault.select(edition.id);
  assert.equal(hero.nextElementSibling.id,'rwQuick');
  assert.equal(hero.nextElementSibling.nextElementSibling,credit);
  assert.deepEqual([...w.document.querySelectorAll('.rw-sales-card')],cards);
  assert.deepEqual(cards.map(n=>n.href),hrefs);
  assert.equal(w.document.querySelectorAll('#rwCreditCard').length,1);
 }
 assert.equal(credit.querySelector('a').getAttribute('href'),'/credit/');
 assert.match(credit.textContent,/360 days/);assert.match(credit.textContent,/bonus credit is not cash/);
 assert.equal(w.document.documentElement.style.getPropertyValue('--rwde-ailon-colors'),'#ffcf80,#ef5a77,#876bff,#2ed6b4,#ffcf80');
 dom.window.close();
});

test('valid database update applies bounded settings; invalid local cache is ignored',async()=>{
 const remote=clone();remote.borders.ailon.duration=20;
 const cached=clone();cached.colors.teal='red;display:none';
 const {w,dom,requests}=mount({cached,remote:{catalogue:remote,storage:'kv'}});
 await new Promise(r=>setTimeout(r,0));
 assert.equal(w.RWDesignEngine.source(),'database');assert.equal(w.document.documentElement.style.getPropertyValue('--rwde-ailon-duration'),'20s');
 assert.equal(requests[0].options.credentials,'omit');
 assert.equal(JSON.parse(w.localStorage.getItem('rw_design_catalogue_v1')).catalogue.version,seed.version);
 dom.window.close();
});

test('motion preference persists and cannot override device reduced motion',()=>{
 const {w,dom,setReduced}=mount();w.RWDesignVault.mountSettings();
 const input=w.document.querySelector('.rw-design-motion input');assert.ok(input);
 input.checked=false;input.dispatchEvent(new w.Event('change'));
 assert.equal(w.localStorage.getItem('rw_design_motion'),'off');assert.equal(w.RWDesignEngine.motionEnabled(),false);
 w.RWDesignEngine.setMotion('auto');assert.equal(w.RWDesignEngine.motionEnabled(),true);
 setReduced(true);assert.equal(w.RWDesignEngine.motionEnabled(),false);
 w.RWDesignEngine.setMotion('auto');assert.equal(w.RWDesignEngine.motionEnabled(),false);
 assert.equal(w.document.documentElement.getAttribute('data-rw-motion'),'off');
 dom.window.close();
});

test('credit presentation keeps original checkout script intact and has no invented balances',()=>{
 const page=read('credit/index.html');
 assert.match(page,/id="packs"/);assert.match(page,/id="buy"[^>]+disabled/);
 assert.match(page,/\/credit\/checkout/);assert.match(page,/acceptTerms:\$\('terms'\)\.checked/);
 assert.match(page,/Cashfree\(\{mode:d.environment/);
 const dom=new JSDOM(page),card=dom.window.document.querySelector('.rw-credit-plastic');
 assert.equal(card.getAttribute('aria-hidden'),'true');assert.doesNotMatch(card.textContent,/₹|\d{4}/);
 dom.window.close();
});
