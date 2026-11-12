import test from 'node:test';
import assert from 'node:assert/strict';
import {cohortForSeat, isQualifiedReferral, suggestedRewardPaise, proposedRuleCanPass, PRINCIPLES} from '../pioneer/core.mjs';
test('cohort boundary is stable without changing paid Founder Pro rights', () => {
  assert.equal(cohortForSeat(1).id,'origin');
  assert.equal(cohortForSeat(100).id,'origin');
  assert.equal(cohortForSeat(101).id,'pioneer');
  assert.equal(cohortForSeat(1000).id,'pioneer');
  assert.equal(cohortForSeat(1001).id,'explorer');
  for (const n of [0,-1,1.5,NaN,Infinity]) assert.equal(cohortForSeat(n),null);
});
test('a referral is never rewarded for self, duplicate or unconfirmed buying', () => {
  const good={identityVerified:true,paymentSettled:true,uniquePurchase:true,buyerId:'b',referrerId:'a'};
  assert.equal(Boolean(isQualifiedReferral(good)),true);
  for(const change of [{buyerId:'a'},{uniquePurchase:false},{paymentSettled:false},{refunded:true},{chargeback:true},{identityVerified:false}])
    assert.equal(Boolean(isQualifiedReferral({...good,...change})),false);
});
test('only settled, explicitly funded margin can generate a suggested reward', () => {
  const good={approved:true,settled:true,netRealizedMarginPaise:10000,remainingApprovedPoolPaise:500,maxBenefitPerOrderPaise:800};
  assert.equal(suggestedRewardPaise(good),500);
  assert.equal(suggestedRewardPaise({...good,remainingApprovedPoolPaise:900,maxBenefitPerOrderPaise:800}),800);
  for(const change of [{approved:false},{settled:false},{refunded:true},{chargeback:true},{netRealizedMarginPaise:-1},{netRealizedMarginPaise:1.1},{remainingApprovedPoolPaise:0}])
    assert.equal(suggestedRewardPaise({...good,...change}),0);
});
test('early users have optional stronger *relative* benefit without exceeding available margin', () => {
  const base={approved:true,settled:true,netRealizedMarginPaise:10000,remainingApprovedPoolPaise:3000,maxBenefitPerOrderPaise:3000};
  assert.equal(suggestedRewardPaise({...base,seat:10}),1000);
  assert.equal(suggestedRewardPaise({...base,seat:500}),800);
  assert.equal(suggestedRewardPaise({...base,seat:2000}),600);
});
test('change policy needs independently eligible supermajority and no veto', () => {
  const a=['ops','finance','security'];
  assert.equal(proposedRuleCanPass({eligibleSigners:a,approvals:['ops','finance']}),true);
  assert.equal(proposedRuleCanPass({eligibleSigners:a,approvals:['ops','ops']}),false);
  assert.equal(proposedRuleCanPass({eligibleSigners:a,approvals:['ops','unknown']}),false);
  assert.equal(proposedRuleCanPass({eligibleSigners:a,approvals:a,vetoed:true}),false);
  assert.equal(proposedRuleCanPass({eligibleSigners:['ops'],approvals:['ops']}),false);
  assert.equal(PRINCIPLES.investmentReturn,false);
});
