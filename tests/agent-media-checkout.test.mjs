import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectMedia} from '../knowledge/tools/collect-commons-media.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const info={url:'https://upload.wikimedia.org/wikipedia/commons/1/11/Test.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Test.jpg',mime:'image/jpeg',size:1000,extmetadata:{LicenseShortName:{value:'CC BY 4.0'},Artist:{value:'Author'}}};
test('private intake rejects noncommercial, untrusted source, oversized, unknown licence and restricted material',()=>{
 assert.equal(selectMedia(info).author,'Author');
 for(const license of ['CC BY-NC 4.0','CC BY-SA 4.0','unknown'])assert.equal(selectMedia({...info,extmetadata:{...info.extmetadata,LicenseShortName:{value:license}}}),null);
 assert.equal(selectMedia({...info,url:'https://example.org/Test.jpg'}),null);
 assert.equal(selectMedia({...info,size:5000000}),null);
 assert.equal(selectMedia({...info,extmetadata:{...info.extmetadata,Restrictions:{value:'third-party rights'}}}),null);
});
test('agent only prepares catalogue references; payment stays behind user click and expected amount checks',()=>{
 const ui=read('js/copilot/tusk-commerce.js'),agent=read('js/copilot/agent.js');
 assert.match(agent,/prepare_roamwise_checkout:function/);
 assert.match(agent,/requiresServerQuote:true,requiresUserApproval:true,paymentConfirmed:false/);
 assert.match(ui,/payload\.expectedAmountPaise/);
 assert.match(ui,/cur\.paymentAttempted=true/);
 assert.match(ui,/Date\.now\(\)>=cur\.quote\.expiresAt/);
 for(const p of ['worker/handlers/stay-cashfree.js','worker/handlers/shop-order.js'])assert.match(read(p),/quote_changed/);
});
