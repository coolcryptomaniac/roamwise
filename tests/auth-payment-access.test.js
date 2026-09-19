const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function paymentHarness(verified=false){
  const writes=[],toasts=[],store={};
  const elements={
    utrInput:{value:'123456789012'},utrMsg:{style:{}},utrBtn:{disabled:false,textContent:'Submit'},
    qrcode:{innerHTML:'',replaceChildren(){this.innerHTML='';this.textContent='';}},upiPrefillNote:{},utrHelp:{},qrAmtLbl:{}
  };
  const user={uid:'unverified-uid',email:'traveler@example.com',emailVerified:verified,providerData:[{providerId:'password'}],sendEmailVerification(){throw new Error('payment must not send verification email');}};
  const claims={
    where(){return {get:()=>Promise.resolve({docs:[]})};},
    doc(id){return {set(data){writes.push({id,data});return Promise.resolve();}};}
  };
  const ctx={
    window:null,navigator:{clipboard:null},document:{querySelector:()=>null,hidden:false},location:{href:''},console,
    setTimeout:fn=>{fn();return 1;},clearTimeout(){},
    el:id=>elements[id]||(elements[id]={style:{}}),showToast:m=>toasts.push(m),requireLogin:()=>true,
    IS_TOUCH_MOBILE:true,IS_APP:false,user,AUTH_READY:true,isPro:false,OWNER_NOTIFY_EMAIL:'',
    db:{collection:name=>{assert.equal(name,'claims');return claims;}},
    firebase:{firestore:{FieldValue:{serverTimestamp:()=>({server:true})}}},
    lsSet:(k,v)=>{store[k]=String(v);},track(){},rwRefStamp:()=>({}),rwRefLookup:()=>null,
    refreshProUI(){},closePay(){},rwTierForPlan:()=> 'elite',_selectedPlan:{id:'founder',label:'Founder Pro'},
    fetch:()=>Promise.resolve(),prompt(){},QRCode:undefined
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(read('js/payments/gateway-adapter.js'),ctx);
  vm.runInContext(read('js/payments/providers/manual-upi-adapter.js'),ctx);
  return {ctx,writes,toasts,store,elements};
}

test('unverified signed-in users can submit a UPI claim but never receive Pro from a UTR alone',async()=>{
  const h=paymentHarness();
  const adapter=h.ctx.RWPaymentGateway.provider('manual_upi');
  adapter.createOrder(100,{planId:'founder',label:'Founder Pro — Lifetime',tierId:'elite',category:'oneoff'});
  adapter.verifyPayment();
  for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].id,'unverified-uid_123456789012');
  assert.equal(h.writes[0].data.amount,100);
  assert.equal(h.writes[0].data.status,'pending');
  assert.equal(h.store.rw_pro_temp_uid,undefined);
  assert.equal(h.store.rwPro,undefined);
  assert.match(h.elements.utrMsg.textContent,/only after RoamWise verifies/);
});

test('even verified users receive no provisional UPI unlock until independently reconciled',async()=>{
  const h=paymentHarness(true);
  h.ctx.RWPaymentGateway.provider('manual_upi').createOrder(100,{planId:'founder',label:'Founder Pro',tierId:'elite',category:'oneoff'});
  h.ctx.RWPaymentGateway.provider('manual_upi').verifyPayment();
  for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].data.status,'pending');
  assert.equal(h.store.rw_pro_temp_uid,undefined);
  assert.equal(h.store.rwPro,undefined);
  assert.equal(h.ctx.isPro,false);
  assert.match(h.elements.utrMsg.textContent,/only after RoamWise verifies/);
});

test('checkout copy and help text always follow the selected amount',()=>{
  const h=paymentHarness();
  h.ctx.RWPaymentGateway.provider('manual_upi').createOrder(749,{planId:'pro_3m',label:'Pro 3-Month',tierId:'pro',category:'oneoff'});
  assert.match(h.elements.upiPrefillNote.innerHTML,/₹749/);
  assert.match(h.elements.utrHelp.innerHTML,/₹749/);
  assert.equal(h.ctx.UPI_AMT,'749');
});

test('verified checkmark exists while high-risk Firestore paths still require verified email',()=>{
  const html=read('index.html');
  const rules=read('firestore.rules');
  assert.match(html,/id="authVerifiedBadge"/);
  assert.match(rules,/match \/creatorAccounts\/\{uid\}[\s\S]*request\.auth\.token\.email_verified == true/);
  assert.match(rules,/match \/roomBookings\/\{ref\}[\s\S]*request\.auth\.token\.email_verified == true/);
  assert.match(rules,/isRedeemedByCaller\(code\)[\s\S]*request\.auth\.token\.email_verified == true/);
});
