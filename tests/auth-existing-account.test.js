const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/boot/auth-init.js'),'utf8');
const start=source.indexOf('function rwSendVerificationNonBlocking(');
const end=source.indexOf('function resetPassword(){',start);
assert.ok(start>=0&&end>start,'extract real app functions');
function harness({create,signIn,send,verified=false}={}){
  const messages=[],signs=[],stored={};
  const elements={authEmail:{value:'  Person@Example.COM  '},authPass:{value:'CorrectPassword123'}};
  const user={uid:'original-uid',email:'person@example.com',emailVerified:verified,providerData:[{providerId:'password'}],reload:()=>Promise.resolve(),sendEmailVerification:settings=>send(settings),delete:()=>{throw Error('must never delete user');}};
  const firebase={auth:()=>({createUserWithEmailAndPassword:(e,p)=>create(e,p,user),signInWithEmailAndPassword:(e,p)=>signIn(e,p,user),signOut:()=>{signs.push('out');return Promise.resolve();}})};
  const ctx={firebase,window:{RWAuthSecurity:{normaliseEmail:e=>e.trim().toLowerCase(),passwordStatus:()=>({ok:true}),actionCodeSettings:()=>({url:'https://www.roamwise.co.in/?auth=verified'}),rememberProvider:()=>{}}},AUTH_READY:true,authMode:'up',rwEmailAuthBusy:false,
    el:id=>elements[id]||(elements[id]={}),authError:m=>messages.push(m),rwShowVerificationPane:(e,m)=>messages.push(m),rwIsUnverifiedPasswordUser:u=>!u.emailVerified,rwSetAuthBusy:()=>{},rwApplyAuthModeUI:()=>{},rwRenderVerificationStatus:()=>{},showToast:m=>messages.push(m),closeAuth:()=>{},track:()=>{},rwRefActive:()=>null,lsSet:(k,v)=>{stored[k]=v;},rwVerificationKey:u=>'verify_'+u.uid,pendingVerificationEmail:'',friendly:e=>String(e&&e.code||'').includes('email-already-in-use')?'Account exists — choose sign in or Google.':String(e&&e.code||'')};
  ctx.RWAuthSecurity=ctx.window.RWAuthSecurity;
  vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
  return {ctx,messages,signs,user,run:async()=>{ctx.loginEmail();await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));}};
}
const duplicate=()=>Object.assign(new Error('exists'),{code:'auth/email-already-in-use'});
test('new account: verification is requested once, session and original UID are retained',async()=>{
  let n=0;
  const h=harness({create:()=>{n++;return Promise.resolve({user:h.user});},signIn:()=>{throw Error('unexpected sign in');},send:()=>Promise.resolve()});
  await h.run();assert.equal(n,1);assert.deepEqual(h.signs,[]);assert.match(h.messages.join(' '),/Account ready/);assert.equal(h.user.uid,'original-uid');
});
test('failed verification send never signs out or blocks the new account',async()=>{
  const h=harness({create:()=>Promise.resolve({user:h.user}),signIn:()=>Promise.resolve({user:h.user}),send:()=>Promise.reject(Object.assign(Error('rejected'),{code:'auth/too-many-requests'}))});
  await h.run();assert.deepEqual(h.signs,[]);assert.match(h.messages.join(' '),/signed in/);assert.match(h.messages.join(' '),/continue and pay for Pro/);
});
test('duplicate signup with same password resumes original UID without spending another email',async()=>{
  let signin=0,send=0;
  const h=harness({create:()=>Promise.reject(duplicate()),signIn:(email,pw,u)=>{signin++;assert.equal(email,'person@example.com');assert.equal(pw,'CorrectPassword123');return Promise.resolve({user:u});},send:()=>{send++;return Promise.resolve();}});
  await h.run();assert.equal(signin,1);assert.equal(send,0);assert.equal(h.user.uid,'original-uid');assert.deepEqual(h.signs,[]);assert.match(h.messages.join(' '),/Verify later/);
});
test('existing Google/unknown password never guessed or merged',async()=>{
  const h=harness({create:()=>Promise.reject(duplicate()),signIn:()=>Promise.reject(Object.assign(Error('wrong'),{code:'auth/invalid-credential'})),send:()=>{throw Error('must not send');}});
  await h.run();assert.equal(h.ctx.authMode,'in');assert.match(h.messages.join(' '),/Account exists/);assert.deepEqual(h.signs,[]);
});
test('invalid continue domain retries once with default Firebase action URL',async()=>{
  let calls=0;
  const h=harness({create:()=>Promise.resolve({user:h.user}),signIn:()=>{throw Error('unexpected');},send:settings=>{calls++;return settings?Promise.reject(Object.assign(Error('domain'),{code:'auth/unauthorized-continue-uri'})):Promise.resolve();}});
  await h.run();assert.equal(calls,2);assert.match(h.messages.join(' '),/Account ready/);assert.deepEqual(h.signs,[]);
});

test('global auth listener never force-signs-out an unverified password account',()=>{
  assert.doesNotMatch(source,/if\(rwIsUnverifiedPasswordUser\(u\)\)[\s\S]{0,260}firebase\.auth\(\)\.signOut/);
  assert.match(source,/Verification is deliberately NON-BLOCKING/);
});
