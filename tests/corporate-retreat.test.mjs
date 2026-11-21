import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bonusIllustration,estimateRetreat,checkCapacity,matchVenues,
  requiredFaceCostCeiling,testProfit,bonusAllowed,VENUES,SOURCING_LEADS
} from '../corporate/retreat-core.mjs';
import {parseCorporateLead,expiredCorporateLead} from '../worker/lib/corporate-lead-core.js';

test('₹20L corporate example is ₹5L maximum conditional bonus, never automatic stored money',()=>{
  const b=bonusIllustration(2000000);
  assert.equal(b.bonusCeiling,500000);
  assert.equal(b.illustrativeValue,2500000);
  assert.equal(b.rate,25);
});
test('tier ceilings rise with the annual amount, but remain illustrations',()=>{
  assert.equal(bonusIllustration(500000).rate,3);
  assert.equal(bonusIllustration(1000000).rate,7);
  assert.equal(bonusIllustration(5000000).rate,30);
  assert.equal(bonusIllustration(10000000).rate,35);
});
test('150 employees at ₹25k each require 75 twin rooms and ₹37.5 lakh',()=>{
  const q=estimateRetreat({employees:150,nights:2,perPerson:25000,sharing:2});
  assert.deepEqual([q.roomsNeeded,q.total],[75,3750000]);
});
test('group capacity never fabricates meeting seating or actual availability',()=>{
  const t=VENUES.find(x=>x.id==='tattwaa');
  const n=VENUES.find(x=>x.id==='nanau');
  assert.match(checkCapacity(t,100,2),/Potential.*unverified/);
  assert.equal(checkCapacity(n,100,2),'Needs additional properties');
  assert.equal(checkCapacity(t,250,2),'Needs additional properties');
  assert.equal(matchVenues(100,2,'Manali').some(v=>v.region==='Corbett'),false);
});
test('fully redeemed 20L+5L bundle needs <=18L ALL-IN cost to earn 10% cash contribution',()=>{
  const c=requiredFaceCostCeiling({cash:2000000,bonus:500000});
  assert.equal(c.maxSupplierCost,1800000);
  assert.equal(c.minimumSupplierSavingPercent,28);
  assert.equal(testProfit({cashCollected:2000000,supplierCosts:1800000}).passes,true);
  assert.equal(testProfit({cashCollected:2000000,supplierCosts:1800001}).passes,false);
  assert.equal(testProfit({cashCollected:2000000,supplierCosts:1750000,operatingCosts:50000}).passes,true);
  assert.equal(bonusAllowed({cash:2000000,facePrice:2500000,supplierCost:1900000}).approved,false);
});
test('a supplier earning normal 7% revenue commission cannot support 25% bonus',()=>{
  const b=testProfit({cashCollected:2000000,supplierCosts:2325000});
  assert.equal(b.passes,false);
  assert.ok(b.profit<0);
});
test('reject non-finite numbers and impossible employee counts',()=>{
  assert.throws(()=>estimateRetreat({employees:0,nights:2,perPerson:25000,sharing:2}));
  assert.throws(()=>estimateRetreat({employees:10001,nights:2,perPerson:25000,sharing:2}));
  assert.throws(()=>testProfit({cashCollected:NaN,supplierCosts:0}));
  assert.throws(()=>bonusIllustration(-1));
});
function lead(){
  return {company:'Acme AI',contact:'Human Resources',email:'hr@acme.example',role:'HR',
    employees:200,nights:2,sharing:2,perPerson:25000,destination:'Corbett',
    startDate:'',endDate:'',allocation:2000000,centralSharePct:70,
    preferences:['Workshops','Low crowd'],notes:'Accessibility and meals',consent:true};
}
test('lead parser enforces consent, records budgets server-side and limits preferences',()=>{
  assert.equal(parseCorporateLead({...lead(),consent:false}).error,'consent_required');
  assert.equal(parseCorporateLead({...lead(),employees:30000}).error,'retreat_invalid');
  assert.equal(parseCorporateLead({...lead(),allocation:0}).error,'allocation_invalid');
  const parsed=parseCorporateLead({...lead(),estimate:1,preferences:['Workshops','Workshops','fake']});
  assert.equal(parsed.value.estimate,5000000);
  assert.deepEqual(parsed.value.preferences,['Workshops']);
  assert.equal(parsed.value.consentVersion,'corporate-enquiry-2026-11');
});
test('lead parser rejects contradictory dates and sanitizes markup',()=>{
  assert.equal(parseCorporateLead({...lead(),startDate:'2027-03-18'}).error,'dates_incomplete');
  assert.equal(parseCorporateLead({...lead(),startDate:'2027-03-18',endDate:'2027-03-25'}).error,'dates_invalid');
  const p=parseCorporateLead({...lead(),company:'<Acme> AI'});
  assert.equal(p.value.company,'Acme AI');
});
test('corporate intake retention expires after one year',()=>{
  const now=Date.parse('2027-12-31T00:00:00Z');
  assert.equal(expiredCorporateLead('2026-11-21T00:00:00Z',now),true);
  assert.equal(expiredCorporateLead('2027-11-21T00:00:00Z',now),false);
});

test('all large-venue leads remain external research, never RoamWise approved inventory',()=>{
  assert.ok(SOURCING_LEADS.length>=4);
  assert.ok(SOURCING_LEADS.every(s=>s.status.includes('Outside RoamWise network')));
  const anantum=SOURCING_LEADS.find(x=>x.id==='anantum');
  assert.equal(anantum.keys,172);
  assert.equal(anantum.seats,300);
  assert.equal(SOURCING_LEADS.find(x=>x.id==='baagh').keys,90);
  assert.equal(SOURCING_LEADS.find(x=>x.id==='tribhav').keys,null);
});
