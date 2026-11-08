import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateTrekQuote} from '../treks/price-policy.mjs';
test('1% low-friction fee adds to supplier price and is capped at 99',()=>{
 const q=calculateTrekQuote({unitPrice:3000,pricingUnit:'person',travellers:1,capacity:12});
 assert.equal(q.operatorTotal,3000);assert.equal(q.roamwiseServiceFee,30);
 assert.equal(q.total,3030);assert.equal(q.partnerCommission,0);
 const capped=calculateTrekQuote({unitPrice:6000,pricingUnit:'person',travellers:2,capacity:12});
 assert.equal(capped.operatorTotal,12000);assert.equal(capped.roamwiseServiceFee,99);
});
test('private vehicle and private group rates do not multiply by passengers',()=>{
 for(const pricingUnit of ['vehicle','group']){
  const q=calculateTrekQuote({unitPrice:4500,pricingUnit,travellers:4,capacity:4});
  assert.equal(q.operatorTotal,4500);assert.equal(q.roamwiseServiceFee,45);assert.equal(q.total,4545);
 }
});
test('booking above capacity, invalid units, fractional and extreme price fail closed',()=>{
 for(const invalid of [
  {unitPrice:1500,pricingUnit:'person',travellers:5,capacity:4},
  {unitPrice:1500,pricingUnit:'some-other',travellers:1,capacity:4},
  {unitPrice:999.99,pricingUnit:'person',travellers:1,capacity:4},
  {unitPrice:200001,pricingUnit:'person',travellers:1,capacity:4},
  {unitPrice:999,pricingUnit:'person',travellers:0,capacity:4},
  {unitPrice:999,pricingUnit:'person',travellers:13,capacity:20}
 ])assert.throws(()=>calculateTrekQuote(invalid));
});
