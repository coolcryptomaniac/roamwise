import test from 'node:test';import assert from 'node:assert/strict';
import {parseSyncTargets,syncApprovedPublicTargets} from '../worker/lib/public-display-sync.js';
test('sync off by default',async()=>assert.deepEqual(await syncApprovedPublicTargets({}),{status:'disabled',processed:0}));
test('invalid or unsafe collections fail closed',()=>assert.deepEqual(parseSyncTargets('[{"collection":"payments","id":"abc"}]'),[]));
test('limits source reads to ten targets',()=>assert.deepEqual(parseSyncTargets(JSON.stringify(Array.from({length:11},(_,i)=>({collection:'destinations',id:'x'+i})))),[]));
test('duplicate targets rejected',()=>assert.deepEqual(parseSyncTargets('[{"collection":"destinations","id":"a"},{"collection":"destinations","id":"a"}]'),[]));
test('valid target list',()=>assert.deepEqual(parseSyncTargets('[{"collection":"destinations","id":"almora"}]'),[{collection:'destinations',id:'almora'}]));
