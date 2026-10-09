// Firestore Emulator permission test for event-day NMIMS coupons. Demo project only; never touches production.
// Run: firebase emulators:exec --only firestore "node tests/nmims-coupons-emulator.cjs"
const fs=require('node:fs');const path=require('node:path');const {webcrypto}=require('node:crypto');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc,updateDoc,getDocs,collection,Timestamp,writeBatch}=require('firebase/firestore');
const U=require('../nmims/pass-issuer/pass-utils.js');
const ok=(c,m)=>{if(!c)throw Error('FAILED: '+m);console.log('  ok -',m);};
async function run(){
  if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Refusing to test outside Firestore Emulator');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  const env=await initializeTestEnvironment({projectId:'demo-nmims-coupons',firestore:{rules}});
  const as=(uid,email,verified=true)=>env.authenticatedContext(uid,{email,email_verified:verified}).firestore();
  const founder=as('founder','founder@example.com'),anon=env.unauthenticatedContext().firestore();
  const batch=U.couponBatch(n=>webcrypto.getRandomValues(new Uint8Array(n)));
  ok(batch.length===500&&new Set(batch.map(c=>c.code)).size===500,'500 unique coupons generated');
  ok(batch.every(c=>/^NMIMS-(STU|ORG)-\d{4}-[0-9A-HJKMNP-TV-Z]{13}$/.test(c.code)&&c.code.length<=32),'all codes match format and the 32-char cap');
  ok(batch.filter(c=>c.role==='organiser').length===50&&batch.filter(c=>c.role==='student').length===450,'50 organiser + 450 student');
  let [c1,c2,c3,expired,future]=[batch[0],batch[1],batch[2],batch[3],batch[4]].map(c=>c.code);
  const soon=Timestamp.fromMillis(Date.now()+30*86400000),past=Timestamp.fromMillis(Date.now()-1000);
  await env.withSecurityRulesDisabled(async c=>{
    const d=c.firestore();
    await setDoc(doc(d,'admins','founder'),{role:'owner'});
    for(const [code,exp] of [[c1,soon],[c2,soon],[c3,soon],[expired,past],[future,soon],[batch[5].code,soon]])
      await setDoc(doc(d,'partnerClaims',code),{bearer:true,role:'student',partnership:'nmims2026',proRedeemed:false,status:'issued',expiresAt:exp});
    for(const u of ['alice','bob','carol','dave','erin'])await setDoc(doc(d,'users',u),{email:u+'@example.com'});
    await setDoc(doc(d,'users','paid'),{email:'paid@example.com',pro:true});
  });
  const alice=as('alice','alice@example.com'),bob=as('bob','bob@example.com'),carol=as('carol','carol@example.com');
  const flip=(db,code,uid,email)=>updateDoc(doc(db,'partnerClaims',code),{proRedeemed:true,redeemedAt:new Date().toISOString(),redeemedUid:uid,email});
  const grant=(db,uid,code)=>updateDoc(doc(db,'users',uid),{pro:true,proAt:new Date().toISOString(),proMethod:'partner',proCode:code});

  // admin generator shape: two batches of 250 coupons + pool update (what nmims/pass-issuer/index.html does)
  await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'partnerships','nmims2026'),{issuanceEnabled:true,cap:500,claimed:0,studentCap:450,studentClaimed:0,organiserCap:50,organiserClaimed:0,nextSerial:1});});
  for(let i=0;i<500;i+=250){const b=writeBatch(founder);for(const c of batch.slice(i,i+250))b.set(doc(founder,'partnerClaims','GEN-'+c.code),{bearer:true,role:c.role,serial:c.serial,partnership:'nmims2026',code:c.code,proRedeemed:false,status:'issued',expiresAt:soon});await assertSucceeds(b.commit());}
  await assertSucceeds(updateDoc(doc(founder,'partnerships','nmims2026'),{claimed:500,organiserClaimed:50,studentClaimed:450,nextSerial:501,couponCount:500}));ok(true,'admin generator: 2 batches of 250 coupons + pool update succeed');
  await assertFails(updateDoc(doc(alice,'partnerships','nmims2026'),{claimed:0}));ok(true,'users cannot touch the pool counters');
  await assertSucceeds(updateDoc(doc(founder,'partnerClaims',batch[5].code),{expiresAt:Timestamp.fromMillis(Date.now()-1000),status:'revoked'}));ok(true,'admin can revoke a coupon');
  await assertFails(flip(as('dave','dave@example.com'),batch[5].code,'dave','dave@example.com'));ok(true,'a revoked coupon cannot be redeemed');
  // read side
  await assertSucceeds(getDoc(doc(alice,'partnerClaims',c1)));ok(true,'a signed-in user can fetch an unredeemed coupon by exact code');
  await assertFails(getDocs(collection(alice,'partnerClaims')));ok(true,'coupons cannot be listed or enumerated');
  await assertFails(getDoc(doc(anon,'partnerClaims',c1)));ok(true,'signed-out users cannot read coupons');
  // redeem
  await assertFails(flip(anon,c1,'alice','alice@example.com'));ok(true,'signed-out redeem refused');
  await assertFails(flip(as('alice','alice@example.com',false),c1,'alice','alice@example.com'));ok(true,'unverified email refused');
  await assertFails(flip(alice,c1,'bob','alice@example.com'));ok(true,'cannot record someone else\'s uid');
  await assertFails(flip(alice,c1,'alice','bob@example.com'));ok(true,'cannot record a different email');
  await assertFails(updateDoc(doc(alice,'partnerClaims',c1),{proRedeemed:true,redeemedUid:'alice',email:'alice@example.com',role:'organiser'}));ok(true,'cannot change other fields (role) while redeeming');
  await assertFails(updateDoc(doc(alice,'partnerClaims',c1),{proRedeemed:true,redeemedUid:'alice',email:'alice@example.com',expiresAt:Timestamp.fromMillis(Date.now()+9e12)}));ok(true,'cannot extend expiry while redeeming');
  await assertFails(flip(alice,expired,'alice','alice@example.com'));ok(true,'expired coupon refused');
  await assertFails(flip(as('paid','paid@example.com'),future,'paid','paid@example.com'));ok(true,'an account that is already Pro cannot burn a coupon');
  await assertFails(grant(alice,'alice',c1));ok(true,'grant before redeeming refused');
  await assertSucceeds(flip(alice,c1,'alice','alice@example.com'));ok(true,'valid redeem succeeds');
  await assertFails(flip(bob,c1,'bob','bob@example.com'));ok(true,'same coupon cannot be redeemed twice by another account');
  await assertFails(flip(alice,c1,'alice','alice@example.com'));ok(true,'same coupon cannot be redeemed twice by the same account');
  await assertFails(getDoc(doc(bob,'partnerClaims',c1)));ok(true,'a redeemed coupon is not readable by others');
  await assertSucceeds(getDoc(doc(alice,'partnerClaims',c1)));ok(true,'redeemer can still read it (needed to resume grant)');
  await assertFails(grant(bob,'bob',c1));ok(true,'someone else cannot use a redeemed coupon to grant themselves Pro');
  await assertFails(updateDoc(doc(alice,'users','alice'),{pro:true,proAt:'x',proMethod:'partner',proCode:c2}));ok(true,'cannot grant Pro with an unredeemed code');
  await assertFails(updateDoc(doc(alice,'users','alice'),{pro:true,proAt:'x',proMethod:'paid',proCode:c1}));ok(true,'grant must use proMethod partner');
  await assertFails(updateDoc(doc(alice,'users','alice'),{pro:true,proAt:'x',proMethod:'partner',proCode:c1,proTier:'elite'}));ok(true,'grant cannot carry extra entitlement fields');
  await assertSucceeds(grant(alice,'alice',c1));ok(true,'redeemer is granted Pro');
  await assertSucceeds(grant(alice,'alice',c1));ok(true,'grant retry is idempotent (resumable)');
  // users cannot create or edit coupons
  await assertFails(setDoc(doc(bob,'partnerClaims','NMIMS-STU-9999-AAAAAAAAAAAAA'),{bearer:true,expiresAt:soon,proRedeemed:false}));ok(true,'users cannot mint coupons');
  await assertFails(updateDoc(doc(bob,'partnerClaims',c3),{expiresAt:Timestamp.fromMillis(Date.now()+9e12)}));ok(true,'users cannot edit coupons');
  await assertFails(env.unauthenticatedContext().firestore().doc('partnerClaims/'+c3).delete());ok(true,'anonymous cannot delete coupons');
  await assertSucceeds(setDoc(doc(founder,'partnerClaims','NMIMS-STU-0451-AAAAAAAAAAAAA'),{bearer:true,expiresAt:soon,proRedeemed:false}));ok(true,'admin can create coupons');
  // regression: individual (email-bound) claims keep working
  await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'partnerClaims','NMIMS-ANAYA-0001-AAAAAAAAAAAAA'),{email:'carol@example.com',proRedeemed:false,expiresAt:soon});});
  await assertFails(flip(bob,'NMIMS-ANAYA-0001-AAAAAAAAAAAAA','bob','bob@example.com'));ok(true,'email-bound claim cannot be redeemed by another email');
  await assertSucceeds(updateDoc(doc(carol,'partnerClaims','NMIMS-ANAYA-0001-AAAAAAAAAAAAA'),{proRedeemed:true,redeemedAt:'x',redeemedUid:'carol'}));ok(true,'email-bound claim still redeems for its owner');
  await assertFails(getDoc(doc(bob,'partnerClaims','NMIMS-ANAYA-0001-AAAAAAAAAAAAA')));ok(true,'email-bound claims stay private to their owner');
  // race: 10 accounts, one coupon -> exactly one wins
  await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'partnerClaims','NMIMS-STU-0777-RACERACERACE1'),{bearer:true,expiresAt:soon,proRedeemed:false});for(let i=0;i<10;i++)await setDoc(doc(c.firestore(),'users','r'+i),{email:'r'+i+'@example.com'});});
  const res=await Promise.allSettled(Array.from({length:10},(_,i)=>flip(as('r'+i,'r'+i+'@example.com'),'NMIMS-STU-0777-RACERACERACE1','r'+i,'r'+i+'@example.com')));
  ok(res.filter(r=>r.status==='fulfilled').length===1,'10 simultaneous redeems of one coupon: exactly one succeeds');
  await env.cleanup();console.log('ALL COUPON RULE TESTS PASSED');
}
run().catch(e=>{console.error(e);process.exit(1);});
