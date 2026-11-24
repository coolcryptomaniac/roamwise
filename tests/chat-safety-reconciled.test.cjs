const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../js/social/chat-safety.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('stored chat refuses unsafe IDs, hostile URL schemes and reaction keys',()=>{
 assert.equal(S.rwChatSafeId('safe-id_20'),true);assert.equal(S.rwChatSafeId("x');alert(1)"),false);
 for(const u of ['javascript:alert(1)','data:text/html,hi','https://x.test/"bad','https://user:pass@x.test'])assert.equal(S.rwChatSafeUrl(u),'');
 assert.equal(S.rwChatSafeUrl('https://www.google.com/maps?q=Almora'),'https://www.google.com/maps?q=Almora');
 const m=S.rwChatCleanMessage({kind:'expense',reactions:{'❤️':['u1',42],'<script>':['u1'],'é':['u1']},payload:{amount:'bad',map:'javascript:alert(1)',options:['a',1],votes:{u1:1,u2:'0'}}});
 assert.deepEqual(Object.keys(m.reactions),['❤️']);assert.deepEqual(m.reactions['❤️'],['u1']);assert.equal(m.payload.amount,0);assert.equal(m.payload.map,'');assert.deepEqual(m.payload.options,['a','1']);assert.equal(m.payload.votes.u2,undefined);
});
test('shared card HTML degrades to escaped text without DOM; no unsafe action is passed through',()=>{
 assert.doesNotMatch(S.rwChatSafeHtml('<img src=x onerror=alert(1)><b>Trip</b>'),/[<>]/);
 const src=read('js/social/chat-safety.js');assert.match(src,/document\.createElement\(tag\)/);assert.match(src,/createTextNode/);assert.doesNotMatch(src,/setAttribute|cloneNode|appendChild\(node\)/);
 const renderer=read('js/social/group-chat-social.js');assert.match(renderer,/rwChatSafeHtml\(m\.payload\.html\)/);assert.match(renderer,/rwChatCleanMessage\(m\)/);
 assert.match(read('js/social/group-chat.js'),/rwChatSafeId\(doc\.id\)/);
 const html=read('index.html');assert.ok(html.indexOf('js/social/chat-safety.js')<html.indexOf('js/social/group-chat.js'));
});
test('scam warnings are contextual and do not accept untrusted handler arguments',()=>{
 assert.match(S.rwChatRisk('please send the advance amount'),/money/);assert.match(S.rwChatRisk('tell me your OTP'),/OTP/);assert.match(S.rwChatRisk('pay at abc@okaxis'),/UPI/);
 assert.equal(S.rwChatRisk('meet at 6 am'), '');assert.equal(S.rwChatRiskHTML('OTP',"bad'"),'');
});
test('events refresh fails closed and the booking request formatter is distinct',()=>{
 assert.match(read('worker/handlers/events.js'),/if\(!env\.REFRESH_TOKEN \|\|/);
 assert.match(read('js/booking/routes.js'),/function rwBookingRequestText\(/);
 assert.match(read('js/booking/form.js'),/rwBookingRequestText\(p,/);
 assert.match(read('js/copilot/agent.js'),/function rwBookingText\(b\)/);
 const src=read('worker/worker.js');assert.ok(src.indexOf("path === 'stay/lead'")<src.indexOf("path.indexOf('stay/')"));
});
