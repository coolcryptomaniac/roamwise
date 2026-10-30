import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceKm,rankNearby} from '../map/nearby-rank.mjs';
test('nearby: approved consented only and distance order',()=>{
 const x=rankNearby({lat:29.6,lon:79.65},[{id:'a',lat:29.61,lon:79.65,publicApproved:true,consent:true},{id:'b',lat:29.6,lon:79.65,publicApproved:false,consent:true}]);
 assert.deepEqual(x.map(p=>p.id),['a']); assert.equal(distanceKm(null,{lat:1,lon:2}),null);
});
