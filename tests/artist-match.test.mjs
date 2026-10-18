import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rankArtistProperties,buildArtBrief,sourceFresh,safeHttps} from '../creators/artist-match-core.mjs';
import {eligibleLead,selectDailyBatch} from '../ops/outreach/eligibility.mjs';
const data=JSON.parse(fs.readFileSync('creators/artists-data.json','utf8'));
const policy=JSON.parse(fs.readFileSync('ops/outreach/policy.json','utf8'));
const seeds=JSON.parse(fs.readFileSync('ops/outreach/seeds.json','utf8')).leads;
const now=Date.parse(data.checkedAt)+1000;
test('project and state filters produce source-backed prospects without partnership claims',()=>{
  const rows=rankArtistProperties(data.artists[0],data.properties,{goal:'workshop',region:'Himachal Pradesh'},now);
  assert.equal(rows.length,3);assert.equal(rows[0].id,'rakkh');
  for(const p of rows){assert.equal(p.partnerConfirmed,false);assert.equal(p.budget,null);assert.ok(p.score<=100);assert.ok(safeHttps(p.sourceUrl));}
  assert.equal(rankArtistProperties(data.artists[0],data.properties,{region:'unknown'},now).length,0);
});
test('enquiries preserve both parties control and never turn proposals into bookings',()=>{
  const text=buildArtBrief(data.artists[0],data.properties[0],{goal:'workshop',notes:'A guest painting session'});
  assert.match(text,/workshop proposal/);assert.match(text,/artist’s agreement/);assert.match(text,/not a confirmed partnership/);assert.match(text,/artist fee, travel\/stay/);
  assert.equal(safeHttps('javascript:alert(1)'), '');assert.equal(sourceFresh('invalid',now),false);
});
test('stale or conflicting business contact evidence is blocked',()=>{
  assert.equal(eligibleLead(seeds[0],{now}).ok,true);
  assert.equal(eligibleLead({...seeds[0],sourceCheckedAt:'2020-01-01'},{now}).ok,false);
  assert.equal(eligibleLead({...seeds[0],contactConflict:true},{now}).ok,false);
  assert.equal(eligibleLead({...seeds[0],emailSource:'javascript:void(0)'},{now}).ok,false);
  assert.equal(data.properties.find(p=>p.id==='ananda').contact.email,'');
});
test('daily selection deduplicates, observes previous sends and caps each segment',()=>{
  const leads=Array.from({length:20},(_,i)=>({...seeds[0],id:'lead'+i,email:'team'+i+'@business.example'}));
  let result=selectDailyBatch([...leads,leads[0]],policy,{now,sentToday:{property:1},sentTo:['team0@business.example']});
  assert.equal(result.selected.length,2);assert.equal(result.total,3);assert.ok(result.selected.every(x=>x.email!=='team0@business.example'));
  result=selectDailyBatch(leads,policy,{now,sentTodayTotal:12});assert.equal(result.selected.length,0);
});
test('registration is not customer marketing consent; replies and opt-outs suppress sends',()=>{
  const lead={id:'customer',segment:'customer',email:'guest@example.com',consent:true};
  assert.equal(eligibleLead(lead,{now}).ok,false);
  const opted={...lead,marketingOptIn:true,marketingOptInAt:new Date(now-1000).toISOString(),marketingOptInEvidence:'Explicit marketing checkbox'};
  assert.equal(eligibleLead(opted,{now}).ok,true);
  for(const flag of ['optedOut','bounced','replied','isAmbassador','isStaff','existingPartner'])assert.equal(eligibleLead({...opted,[flag]:true},{now}).ok,false);
});
