'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'../js/itinerary/travel-pressure.js'),'utf8');
function load(now){const s={Date:Object.assign(Date,{now:()=>now}),isFinite,esc2:s=>String(s)};vm.runInNewContext(code,s);return s;}
test('Kumaon incident marks named corridor places avoid while active',()=>{const s=load(Date.parse('2026-10-04T16:30:00+05:30'));assert.equal(s.rwPressureFor('Bhowali').status,'avoid');assert.equal(s.rwPressureFor('Almora').status,'avoid');});
test('incident expires instead of becoming stale travel advice',()=>{const s=load(Date.parse('2026-10-05T08:00:00+05:30'));assert.equal(s.rwPressureFor('Nainital'),null);});
test('unrelated places are not marked avoid',()=>{const s=load(Date.parse('2026-10-04T16:30:00+05:30'));assert.equal(s.rwPressureFor('Goa'),null);});
test('alert contains source and freshness metadata',()=>{const s=load(Date.parse('2026-10-04T16:30:00+05:30')),x=s.rwPressureFor('Kainchi Dham');assert.match(x.sourceUrl,/^https:\/\//);assert.ok(x.observedAt&&x.validUntil);});
