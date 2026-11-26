import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validKey,canRequest,classify,cleanCard,pairId} from '../creators/match-exchange-core.mjs';
test('only creator↔property pairs with valid keys',()=>{
  assert.ok(canRequest('property-p1','creator-c1'));
  assert.ok(!canRequest('property-p1','property-p2'));
  assert.ok(!canRequest('creator-c1','creator-c1'));
  assert.ok(!validKey('creator-../x'));assert.equal(pairId('a','b'),'a__b');
});
test('mutual, incoming and outgoing are split correctly',()=>{
  const me='creator-c1';
  const c=classify(me,[{from:me,to:'property-a'},{from:'property-a',to:me},{from:'property-b',to:me},{from:me,to:'property-c'}]);
  assert.deepEqual(c,{mutual:['property-a'],incoming:['property-b'],outgoing:['property-c']});
});
test('contact card is validated like the rules',()=>{
  assert.deepEqual(cleanCard({phone:'+91 98765 43210',email:'a@b.in'}),{phone:'+91 98765 43210',email:'a@b.in'});
  assert.throws(()=>cleanCard({phone:'call me'}));assert.throws(()=>cleanCard({email:'nope'}));
});
test('rules protect contact cards behind a mutual match',()=>{
  const r=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
  assert.match(r,/match \/contactCards\/\{key\}/);assert.match(r,/mutualMatch\(myListing\(\), key\)/);
  assert.match(r,/match \/ownerListings\/\{uid\}[\s\S]{0,120}allow write: if isAdmin\(\);/);
});
