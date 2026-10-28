import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import * as core from '../yoga/match-core.mjs';

const teacher = { ownerId: 't1', approved: true, consentToMatch: true, place: 'Almora', group: 6, from: '2026-11-01', to: '2026-11-03', models: ['paid'], budget: 10000, quiet: true, optional: true, noFilming: true };
const property = { id: 'p1', ownerId: 'h1', approved: true, consentToMatch: true, place: 'Almora', capacity: 8, from: '2026-11-01', to: '2026-11-05', models: ['paid'], rate: 8000, quiet: true, optional: true, noFilming: true, yogaSpaceReviewed: true };

test('owner-teachers get all three routes, not an exclusive role', () => {
  assert.deepEqual(core.routesFor('both'), ['find_property','find_teacher','offer_own_property']);
  const msg = core.introductionText({ role: 'both', group: 4, propertyName: 'My studio' });
  assert.match(msg, /Own property: My studio/);
  assert.match(msg, /not a booking/);
});
test('dates and group size are validated; a blank budget is unknown, not free', () => {
  assert.equal(core.cleanBrief({group: 6, budget: ''}).budget, null);
  assert.equal(core.cleanBrief({group: 6, from: '2026-02-30'}).from, '');
  assert.throws(() => core.cleanBrief({group: 0}));
  assert.throws(() => core.cleanBrief({group: 6, from: '2026-11-05', to: '2026-11-01'}));
});
test('reviews, consent and own-property separation are hard gates', () => {
  assert.equal(core.scoreYogaMatch(teacher, property).eligible, true);
  for (const patch of [{approved:false},{consentToMatch:false},{ownerId:'t1'}]) assert.equal(core.scoreYogaMatch(teacher, {...property,...patch}).eligible, false);
  assert.equal(core.scoreYogaMatch({...teacher, ownPropertyId:'p1'}, property).eligible, false);
});
test('capacity, terms, location, budget and dates must fit', () => {
  for (const patch of [{capacity:2},{models:['barter']},{place:'Goa'},{rate:20000},{from:'2026-12-01',to:'2026-12-03'}]) assert.equal(core.scoreYogaMatch(teacher, {...property,...patch}).eligible, false);
});
test('unknown comfort, practice space, capacity or location cannot be an eligible match', () => {
  for (const patch of [{quiet:undefined},{optional:undefined},{noFilming:undefined},{yogaSpaceReviewed:false},{capacity:null},{place:''}]) {
    const result = core.scoreYogaMatch(teacher, {...property,...patch});
    assert.equal(result.status, 'needs_confirmation'); assert.equal(result.eligible, false);
  }
  assert.deepEqual(core.rankYogaMatches(teacher, [{...property,approved:false},property]).map(r=>r.property.id), ['p1']);
  assert.deepEqual(core.rankYogaMatches(teacher), []);
});

function page() {
  const dom = new JSDOM(readFileSync(new URL('../yoga/match.html', import.meta.url), 'utf8'), {url:'https://roamwise.co.in/yoga/match.html', runScripts:'outside-only'});
  const w = dom.window;
  w.core = core;
  w.RW_PARTNER_CONFIG = {};
  w.RW_PARTNER_SEED = [
    {name:'Reviewed stay',zone:'Almora',verified:'signed',listingReady:true},
    {name:'Unreviewed stay',zone:'Almora',verified:'listed',listingReady:true},
    {name:'Hidden stay',zone:'Almora',verified:'signed',listingReady:false},
    {name:'Other town',zone:'Goa',verified:'signed',listingReady:true}
  ];
  const script = readFileSync(new URL('../yoga/yoga.js', import.meta.url), 'utf8').replace(/^import .*?;\n/, 'const { cleanBrief, introductionText } = window.core;\n');
  w.eval(script);
  const $ = id => w.document.getElementById(id);
  $('name').value='Test teacher'; $('place').value='Almora'; $('consent').checked=true;
  return { w, $, submit:()=> $('yogaForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true})) };
}
test('browser flow shows only published signed candidates and honest draft status', () => {
  const {w,$,submit}=page();
  submit();
  assert.equal($('result').hidden,false);
  const candidates=[...w.document.querySelectorAll('.candidate')];
  assert.equal(candidates.length,1); assert.match(candidates[0].textContent,/Reviewed stay/);
  assert.match($('result').textContent,/suitability unconfirmed/);
  assert.match($('status').textContent,/No details have been sent or saved/);
  assert.ok(w.document.querySelector('a[href^="mailto:"]'));
  assert.equal(w.localStorage.length,0);
  w.close();
});
test('both roles keep the original yoga application and never invent teacher profiles', () => {
  const {w,$,submit}=page();
  $('role').value='both'; $('role').dispatchEvent(new w.Event('change')); $('propertyName').value='My space';
  assert.equal($('ownProperty').disabled,false); submit();
  assert.match($('result').textContent,/offering your own property/);
  $('role').value='property'; $('role').dispatchEvent(new w.Event('change')); submit();
  assert.match($('result').textContent,/No reviewed yoga-teacher directory/);
  assert.equal(w.document.querySelectorAll('.candidate').length,0);
  const original = readFileSync(new URL('../yoga/index.html',import.meta.url),'utf8');
  assert.match(original,/db.collection\('crm'\).add\(rec\)/); assert.match(original,/href="match.html"/);
  w.close();
});
test('consent is required and profile text cannot create HTML', () => {
  const {w,$,submit}=page(); $('consent').checked=false; submit(); assert.equal($('result').hidden,true);
  $('consent').checked=true; $('name').value='<img src=x onerror=alert(1)>'; submit();
  assert.equal($('result').querySelector('img'),null); assert.match($('result').textContent,/<img/);
  $('place').dispatchEvent(new w.Event('input',{bubbles:true})); assert.equal($('result').hidden,true);
  w.close();
});
