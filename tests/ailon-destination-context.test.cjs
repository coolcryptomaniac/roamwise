'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {makeTusk}=require('../tools/ai-ops/tusk-harness.cjs');
function fresh(){
 const a=makeTusk();
 a.state.DB=[{name:'Almora',country:'India'},{name:'Manali',country:'India'},{name:'Tokyo',country:'Japan'}];
 a.state.RW_COMMON_WORDS=/^(plan|trip|from|to|about|city|hello)$/i;
 a.state.showToast=()=>{};
 return a;
}
test('a clearly named new city replaces the old destination',()=>{
 const a=fresh();
 assert.equal(a.parse('Plan 3 days in Almora').dest,'Almora');
 const next=a.parse('Plan 4 days in Reykjavik');
 assert.equal(next.dest,'Reykjavik');
 assert.notEqual(next._inherited,true);
 assert.equal(a.state._cpCtx.dest,'Reykjavik');
});
test('ambiguous weak place does not inherit or overwrite the previous location',()=>{
 const a=fresh();
 assert.equal(a.parse('Plan 3 days in Almora').dest,'Almora');
 const uncertain=a.parse('Plan a whimsical trip');
 assert.notEqual(uncertain.dest,'Almora');
 assert.notEqual(uncertain._inherited,true);
 assert.equal(a.state._cpCtx.dest,'Almora','unverified guess is never retained as validated context');
});
test('a new place-less plan does not automatically reuse old trip',()=>{
 const a=fresh();
 a.parse('Plan 3 days in Almora');
 const next=a.parse('Plan a trip anywhere');
 assert.notEqual(next.dest,'Almora');
 assert.notEqual(next._inherited,true);
});
test('an explicit follow-up about there can still reuse the prior city',()=>{
 const a=fresh();
 a.parse('Plan 3 days in Almora');
 const follow=a.parse('What about food there?');
 assert.equal(follow.dest,'Almora');
 assert.equal(follow._inherited,true);
});
test('switching between known destinations never carries stale budget or days',()=>{
 const a=fresh();
 const one=a.parse('Plan 3 days in Almora under Rs 5000');
 assert.equal(one.dest,'Almora');
 const two=a.parse('Plan Tokyo');
 assert.equal(two.dest,'Tokyo');
 assert.equal(two.days,null);
 assert.equal(two.budget,null);
 const three=a.parse('Plan Manali');
 assert.equal(three.dest,'Manali');
 assert.equal(three.days,null);
});
