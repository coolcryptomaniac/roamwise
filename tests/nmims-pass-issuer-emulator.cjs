// Isolated demo-project permission test. Never connects to production Firebase.
const fs=require('node:fs');const path=require('node:path');
const {webcrypto}=require('node:crypto');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc,runTransaction,serverTimestamp,Timestamp}=require('firebase/firestore');
const U=require('../nmims/pass-issuer/pass-utils.js');
async function run(){
  if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Refusing to test outside Firestore Emulator');
  const rules=fs.readFileSync(path.join(__dirname,'..','firestore.rules'),'utf8');
  const env=await initializeTestEnvironment({projectId:'demo-nmims-pass-issuer',firestore:{rules}});
  try{
    const founder=env.authenticatedContext('founder',{email:'founder@example.com',email_verified:true}).firestore();
    const alice=env.authenticatedContext('alice',{email:'alice@example.com',email_verified:true}).firestore();
    const bob=env.authenticatedContext('bob',{email:'bob@example.com',email_verified:true}).firestore();
    const anon=env.unauthenticatedContext().firestore();
    const poolPath='partnerships/nmims2026';
    await env.withSecurityRulesDisabled(async c=>{
      await setDoc(doc(c.firestore(),'admins','founder'),{role:'owner'});
      await setDoc(doc(c.firestore(),poolPath),{issuanceEnabled:true,cap:500,claimed:0,studentCap:450,studentClaimed:0,organiserCap:50,organiserClaimed:0,nextSerial:1});
    });
    async function issue(db,address){
      const key=await U.emailIndex(address,webcrypto.subtle),bytes=webcrypto.getRandomValues(new Uint8Array(8));
      return runTransaction(db,async tx=>{
        const p=doc(db,poolPath),ix=doc(db,'partnerClaimEmails',key);
        const [ps,is]=await Promise.all([tx.get(p),tx.get(ix)]);
        if(is.exists())return {code:is.data().code,existing:true};
        if(!ps.exists())throw Error('Disabled');
        const alloc=U.allocation(ps.data(),'student');
        const code=U.code('Alice',alloc.serial,bytes),cl=doc(db,'partnerClaims',code);
        if((await tx.get(cl)).exists())throw Error('Collision');
        tx.set(cl,{name:'Alice',email:address,code,role:'student',partnership:U.CAMPAIGN,proRedeemed:false,issuedAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+86400000)});
        tx.set(ix,{code,partnership:U.CAMPAIGN,issuedAt:serverTimestamp()});
        tx.update(p,{claimed:alloc.claimed,nextSerial:alloc.serial+1,[alloc.field]:alloc.roleUsed});
        return {code,existing:false};
      });
    }
    await assertFails(setDoc(doc(anon,'partnerClaims','NMIMS-FAKE'),{email:'alice@example.com',proRedeemed:false}));
    await assertFails(setDoc(doc(bob,'partnerClaims','NMIMS-FAKE2'),{email:'bob@example.com',proRedeemed:false}));
    const created=await issue(founder,'alice@example.com');if(created.existing)throw Error('First issuance was not new');
    const again=await issue(founder,'alice@example.com');if(!again.existing||created.code!==again.code)throw Error('Duplicate email consumed a new pass');
    const pool=await getDoc(doc(founder,poolPath));if(pool.data().claimed!==1||pool.data().studentClaimed!==1)throw Error('Atomic counters did not increment once');
    await assertFails(getDoc(doc(anon,'partnerClaimEmails',await U.emailIndex('alice@example.com',webcrypto.subtle))));
    await assertFails(getDoc(doc(bob,'partnerClaims',created.code)));
    await assertSucceeds(getDoc(doc(alice,'partnerClaims',created.code)));
    await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),poolPath),{issuanceEnabled:true,cap:500,claimed:500,studentCap:450,studentClaimed:450,organiserCap:50,organiserClaimed:50,nextSerial:501});});
    try{await issue(founder,'new@example.com');throw Error('Full pool incorrectly issued a pass');}catch(e){if(!/limit/.test(e.message))throw e;}
    console.log('PASS: founder-only issue, private email index, verified owner read, duplicate dedup, atomic count and cap.');
  }finally{await env.cleanup();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});