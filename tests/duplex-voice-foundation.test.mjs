import test from 'node:test';
import assert from 'node:assert/strict';
import {nextVoiceTurn} from '../js/voice/duplex-turn-core.mjs';
test('interrupt cancels speaking state and advances generation',()=>{
 let s=nextVoiceTurn(null,'listen');s=nextVoiceTurn(s,'speech-end');s=nextVoiceTurn(s,'reply');
 assert.equal(s.mode,'speaking');const n=nextVoiceTurn(s,'interrupt');assert.equal(n.mode,'listening');assert.ok(n.turn>s.turn);
});
