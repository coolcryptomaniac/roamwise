import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserVoiceSession } from '../js/voice/browser-voice-session.mjs';
test('browser voice only starts after explicit user action and ignores stale replies',()=>{
 let starts=0, spoken=0, token=0;
 class Recognition { start(){starts++} abort(){} }
 class Utterance { constructor(text){this.text=text} }
 const s=createBrowserVoiceSession({Recognition,synthesis:{cancel(){},speak(){spoken++}},Utterance,onTranscript:(_,t)=>{token=t}});
 assert.equal(starts,0);s.start();assert.equal(starts,1);
 // No reply before speech recognition completes.
 assert.equal(s.speak('hello',0),false);
 s.stop();assert.equal(s.speak('late',token),false);assert.equal(spoken,0);
});
