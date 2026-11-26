import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
function fixture({total=4000,kind='nightly',reject=false,delay}={}){
 const calls=[],answers=[];
 const w={console,Date,Promise,URLSearchParams,AbortController,setTimeout,clearTimeout,document:{addEventListener(){}},RWTuskCommerce:{resolveScope:raw=>(raw.match(/nainital|manali|almora/i)||[''])[0]},
 fetch:async(url,opts)=>{calls.push({url,opts});if(reject)throw Error('offline');if(delay)await delay;
  if(url.endsWith('/stays/rates'))return {ok:true,json:async()=>({stays:{padma:{kind:'amor',name:'Padma Villa, Manali',place:'Manali',rooms:{royal:{label:'Royal Chamber',guests:2,perNight:{ro:2000}}}},milan:{kind:'advance',name:'Milan Heights, Almora'}}})};
  const b=JSON.parse(opts.body);return {ok:true,json:async()=>({quote:{stay:b.stay,kind:b.stay==='milan'?'advance':kind,total:b.stay==='milan'?null:total,amount:b.stay==='milan'?1000:total,checkin:b.checkin,checkout:b.checkout}})};
 }};w.window=w;vm.createContext(w);vm.runInContext(read('js/voice/stay-concierge.js'),w);
 const say=(raw,voice=true)=>w.RWVoiceStayBooking.accept(raw,(html,intents)=>answers.push({html,intents}),voice);
 const flush=()=>new Promise(resolve=>setImmediate(resolve));return {w,calls,answers,say,flush};
}
test('voice collects explicit dates, guests and budget without overwriting a chat draft or invoking an LLM',async()=>{
 const f=fixture();assert.equal(f.say('book 2 days stay in Manali under 5k'),true);assert.match(f.answers.at(-1).html,/check-in and check-out/);assert.equal(f.calls.length,0);
 f.say('2027-02-10 to 2027-02-12');assert.match(f.answers.at(-1).html,/How many guests/);f.say('two guests');await f.flush();
 assert.match(f.answers.at(-1).html,/Option 1.*Padma Villa.*4,000/s);assert.deepEqual(f.calls.map(c=>c.url.split('.dev')[1]),['/stays/rates','/stays/quote']);
});
test('selection and explicit confirmation produce a date/room/meal-specific checkout link but never debit or order',async()=>{
 const f=fixture();f.say('book a stay in Manali 2027-02-10 to 2027-02-12 for 2 guests under 5k');await f.flush();
 f.say('option 1');assert.match(f.answers.at(-1).html,/confirm selection/);assert.doesNotMatch(f.answers.at(-1).html,/href=.*amor-checkout/);
 f.say('yes');assert.doesNotMatch(f.answers.at(-1).html,/href=.*amor-checkout/);f.say('confirm selection');
 const html=f.answers.at(-1).html;for(const part of ['stay=padma','checkin=2027-02-10','checkout=2027-02-12','paymentType=full','room=royal','plan=ro'])assert.ok(html.includes(part),part);
 assert.match(html,/Continue with Cashfree/);assert.match(html,/Voice will not deduct money/);assert.equal(f.calls.length,2);f.say('confirm selection');assert.equal(f.calls.length,2);
});
test('unsupported destination never silently substitutes another town',async()=>{
 const f=fixture();f.say('book a stay in Nainital 2027-02-10 to 2027-02-12 for 2 guests under 5k');await f.flush();
 assert.match(f.answers.at(-1).html,/no direct-checkout property in nainital/i);assert.doesNotMatch(f.answers.at(-1).html,/padma|manali/i);assert.equal(f.calls.length,1);
});
test('unknown totals and over-budget quotes never become affordable-booking recommendations',async()=>{
 for(const [place,total] of [['Almora',4000],['Manali',6000]]){
  const f=fixture({total});f.say('book a stay in '+place+' 2027-02-10 to 2027-02-12 for 2 guests under 5k');await f.flush();
  assert.match(f.answers.at(-1).html,/no confirmed full-price quote within/i);assert.doesNotMatch(f.answers.at(-1).html,/Choose option/);
 }
});
test('cancelled pending requests cannot resurrect offers',async()=>{
 let release;const delay=new Promise(resolve=>release=resolve),f=fixture({delay});f.say('book a stay in Manali 2027-02-10 to 2027-02-12 for 2 guests under 5k');f.say('cancel');release();await f.flush();await f.flush();
 assert.match(f.answers.at(-1).html,/Stopped this booking search/);assert.equal(f.say('confirm selection'),false);
});
test('expired confirmations require a new search and do not show an old checkout link',async()=>{
 const f=fixture();f.say('book a stay in Manali 2027-02-10 to 2027-02-12 for 2 guests under 5k');await f.flush();f.say('option 1');
 const now=Date.now;Date.now=()=>now()+301000;try{f.say('confirm selection');assert.match(f.answers.at(-1).html,/expired/);assert.doesNotMatch(f.answers.at(-1).html,/amor-checkout/);}finally{Date.now=now;}
});
test('rate failures and larger groups provide a real handoff, with no automatic payment',async()=>{
 const f=fixture({reject:true});f.say('book a stay in Manali 2027-02-10 to 2027-02-12 for 2 guests under 5k');await f.flush();assert.match(f.answers.at(-1).html,/rate book could not be checked/);
 const g=fixture();g.say('book a stay in Manali 2027-02-10 to 2027-02-12 for 4 guests under 5k');assert.match(g.answers.at(-1).html,/choose the number of rooms/);assert.equal(g.calls.length,0);
 assert.equal(g.say('Tell me about a temple',false),false);
});
test('voice integration retains actions, speaks the exact quote summary and resets on Stop',()=>{
 const studio=read('js/voice/tusk-studio.js'),core=read('js/copilot/core.js'),handoff=read('js/voice/stay-concierge.js');
 assert.match(core,/RWVoiceStayBooking\.accept\(t/);assert.match(studio,/RWVoiceStayBooking\.reset/);assert.match(studio,/_voiceStaySpeech/);assert.match(studio,/data-rw-voice-stay/);
 assert.doesNotMatch(handoff,/\/stays\/checkout|\/shop\/order|payWith|Authorization|rwWalletT/);
 assert.match(read('packages/amor-checkout.html'),/params\.get\('paymentType'\)==='full'/);
});
