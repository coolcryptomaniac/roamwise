import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(new URL('../'+p, import.meta.url),'utf8');
const atlasSource=read('js/copilot/summit-atlas.js');
const toolsSource=read('js/ui/summit-field-tools.js');
const summit=read('summit/index.html');
const home=read('index.html');
const studio=read('js/voice/voice-input.js');
const kit=read('summit/field-kit.html');
const sandbox={window:{},Date};
vm.runInNewContext(atlasSource,sandbox,{timeout:1500});
const atlas=sandbox.window.RWSummitAtlas;
const ask=(q,language='en-IN')=>atlas.answer(q,{force:true,language});

test('shared source pack covers more than eighty topics, parses and leaves open travel alone',()=>{
 assert.ok(atlas.topics>=80 && atlas.topics<=100);
 assert.equal(atlas.answer('Plan a trip to Coorg',{force:false}),null);
 assert.match(ask('Which startups are coming to BTS?').text,/directory/i);
 assert.match(ask('When is BTS?').text,/17–19 November/);
 assert.equal(ask('What is nearest metro to BIEC?').id,'metro');
 assert.equal(ask('Tell me Kannada culture during summit').id,'kannada-culture');
});

test('investor facts preserve approval and strong tourism focus without guarantees',()=>{
 const v=ask('What time Harish Gadagin meeting?');
 assert.equal(v.id,'harish');
 assert.match(v.text,/Kannada Culture and Tourism/);
 assert.match(ask('How do I meet investor at summit?').text,/approval/i);
 assert.match(ask('free business visitor registration at BTS').text,/exhibition/i);
});

test('supported locale sample responds with real localized text',()=>{
 assert.match(ask('When is BTS?','kn-IN').text,/ಬೆಂಗಳೂರು/);
 assert.match(ask('When is BTS?','hi-IN').text,/बेंगलुरु/);
});

test('summit and homepage share one knowledge source and language selection',()=>{
 new vm.Script(toolsSource);
 new vm.Script(studio);
 assert.match(summit,/summit-atlas\.js/);
 assert.match(summit,/summit-field-tools\.js/);
 assert.match(home,/summit-atlas\.js/);
 assert.match(home,/rwHomeVoiceLang/);
 assert.match(home,/rw_summit_q/);
 assert.match(studio,/rwHomeVoiceLang/);
});

test('field kit and lead exchange remain opt-in, never silent server upload',()=>{
 assert.match(kit,/demoQR/);
 assert.match(kit,/leadQR/);
 assert.match(toolsSource,/rwLeadConsent/);
 assert.match(toolsSource,/mailto:founder@roamwise.co.in/);
 assert.match(toolsSource,/Download consented vCard/);
 assert.doesNotMatch(toolsSource,/fetch\(.{0,70}rwLead/i);
});

test('cost estimator is explicitly user-priced; official booking untouched',()=>{
 assert.match(toolsSource,/not live quotes/);
 assert.match(toolsSource,/rwFare/);
 assert.match(toolsSource,/rwNights/);
 assert.match(toolsSource,/rwPlanAsk/);
 assert.match(toolsSource,/official hall map/i);
 assert.match(summit,/QR scan does not automatically grant Founder Pro|A QR scan does not automatically grant|A QR scan alone does not grant|does not automatically grant Founder Pro|scanning a QR alone does not grant Pro/i);
});
