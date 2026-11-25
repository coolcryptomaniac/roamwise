import test from 'node:test';
import assert from 'node:assert/strict';
import {modelEnterprise,ENTERPRISE_DEFAULTS} from '../corporate/enterprise-core.mjs';
test('1,000-employee annual plan separates a licence from booking value',()=>{
 const m=modelEnterprise(ENTERPRISE_DEFAULTS);
 assert.equal(m.licenseFee,250000);
 assert.equal(m.segments.find(s=>s.id==='department').value,2880000);
 assert.equal(m.segments.find(s=>s.id==='leadership').value,1000000);
 assert.equal(m.segments.find(s=>s.id==='workation').value,480000);
 assert.equal(m.segments.find(s=>s.id==='personal').value,750000);
 assert.equal(m.bookingValue,5110000);
 assert.equal(m.projectedClientSpend,5360000);
 assert.equal(m.minimumBookingContributionGoal,511000);
});
test('headcount scaling affects licences but not assumed booking volume',()=>{
 const first=modelEnterprise({...ENTERPRISE_DEFAULTS,employees:1000});
 const scaled=modelEnterprise({...ENTERPRISE_DEFAULTS,employees:1200});
 assert.equal(scaled.licenseFee-first.licenseFee,50000);
 assert.equal(scaled.bookingValue,first.bookingValue);
});
test('empty travel plan has no guaranteed bookings or contribution',()=>{
 const zero=modelEnterprise({...ENTERPRISE_DEFAULTS,departmentTrips:0,leadershipTrips:0,workationBookings:0,personalBookings:0});
 assert.equal(zero.bookingValue,0);
 assert.equal(zero.minimumBookingContributionGoal,0);
 assert.equal(zero.licenseFee,250000);
});
test('every line item is bounded; booking group cannot exceed headcount',()=>{
 assert.throws(()=>modelEnterprise({...ENTERPRISE_DEFAULTS,employees:20,departmentSize:60}),/cannot be larger/);
 assert.throws(()=>modelEnterprise({...ENTERPRISE_DEFAULTS,employees:-1}),/Employees/);
 assert.throws(()=>modelEnterprise({...ENTERPRISE_DEFAULTS,licensePerSeat:999}),/Annual licence/);
 assert.throws(()=>modelEnterprise({...ENTERPRISE_DEFAULTS,leadershipTrips:NaN}),/Leadership retreats/);
});
test('annual enrolment at ₹150–₹300 for 1000 people yields ₹1.5L–₹3L in licence billings',()=>{
 assert.equal(modelEnterprise({...ENTERPRISE_DEFAULTS,licensePerSeat:150}).licenseFee,150000);
 assert.equal(modelEnterprise({...ENTERPRISE_DEFAULTS,licensePerSeat:300}).licenseFee,300000);
});


test('studio stages public enquiry without CRM or prospective partner claims',async()=>{
 const {readFileSync}=await import('node:fs');
 assert.match(readFileSync('corporate/index.html','utf8'),/corporate\/studio\.html/);
 assert.doesNotMatch(readFileSync('corporate/studio.html','utf8'),/CoinDCX/);
 assert.match(readFileSync('worker/wrangler.toml','utf8'),/CORPORATE_INTAKE_ENABLED = "false"/);
});
