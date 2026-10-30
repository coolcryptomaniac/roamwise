import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSupplyRecord,isPublicSupply} from '../creators/supply-record-core.mjs';
test('discovered records never leak into public supply',()=>{
 const p=normalizeSupplyRecord({name:'Example',sourceUrl:'https://example.org/place'});
 assert.equal(isPublicSupply(p),false);
 assert.equal(isPublicSupply({...p,status:'active',publicApproved:true,consent:true,verified:true}),true);
 assert.throws(()=>normalizeSupplyRecord({name:'Bad',sourceUrl:'javascript:alert(1)'}));
});
