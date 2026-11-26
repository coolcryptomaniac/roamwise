/* My matches: send collab interest, accept incoming, reveal contact cards only on a mutual yes.
   Security lives in firestore.rules (matchInterest, contactCards, ownerListings); this page only reads what they allow. */
import {validKey,canRequest,pairId,classify,cleanCard,kindOf} from './match-exchange-core.mjs';
const CFG={apiKey:'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',storageBucket:'roamwisepro.firebasestorage.app',messagingSenderId:'299014744987',appId:'1:299014744987:web:d5c316743e6d7a10904f3e'};
try{if(!firebase.apps.length)firebase.initializeApp(CFG)}catch(_){}
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=firebase.firestore(),auth=firebase.auth();
const target=new URLSearchParams(location.search).get('to')||'';
let me='',names={};
const status=t=>{$('mxStatus').textContent=t};
async function loadNames(){try{const r=await fetch('../network/directory.json',{cache:'no-store'});const d=await r.json();for(const [k,t] of [['creators','creator'],['properties','property'],['artists','creator']])for(const x of d[k]||[])names[t+'-'+x.id]=x.name}catch(_){}}
const label=k=>esc(names[k]||k.replace(/^(creator|property)-/,''))+' <small>'+(kindOf(k)==='creator'?'🎬 creator':'🏡 property')+'</small>';
async function send(to){
 if(!canRequest(me,to))return status('You can only send a request between a creator and a property.');
 await db.collection('matchInterest').doc(pairId(me,to)).set({from:me,to,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
 status('Request sent. Their number appears here as soon as they say yes too.');
 if(history.replaceState)history.replaceState(null,'',location.pathname);$('mxPending').hidden=true;await refresh();
}
async function card(k){try{const s=await db.collection('contactCards').doc(k).get();if(!s.exists)return '<p class="mx-hint">They have not added a contact card yet.</p>';const c=s.data(),bits=[];
 if(c.phone)bits.push('📞 <a href="tel:'+esc(c.phone.replace(/[^+0-9]/g,''))+'">'+esc(c.phone)+'</a>');
 if(c.whatsapp)bits.push('💬 <a target="_blank" rel="noopener" href="https://wa.me/'+esc(c.whatsapp.replace(/[^0-9]/g,''))+'">WhatsApp</a>');
 if(c.email)bits.push('✉️ <a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>');
 return '<p>'+bits.join('<br>')+'</p>'}catch(e){return '<p class="mx-hint">Card locked.</p>'}}
async function refresh(){
 const [o,i]=await Promise.all([db.collection('matchInterest').where('from','==',me).limit(200).get(),db.collection('matchInterest').where('to','==',me).limit(200).get()]);
 const c=classify(me,[...o.docs,...i.docs].map(d=>d.data()));
 $('mxMutual').innerHTML=(await Promise.all(c.mutual.map(async k=>'<article class="mx-item ok"><h3>'+label(k)+'</h3>'+await card(k)+'</article>'))).join('')||'<p class="mx-hint">No mutual matches yet.</p>';
 $('mxIncoming').innerHTML=c.incoming.map(k=>'<article class="mx-item"><h3>'+label(k)+'</h3><p class="mx-hint">📞 +91 ••••• •••••</p><button class="mx-btn" data-yes="'+esc(k)+'">Say yes</button></article>').join('')||'<p class="mx-hint">Nobody waiting.</p>';
 $('mxOutgoing').innerHTML=c.outgoing.map(k=>'<article class="mx-item"><h3>'+label(k)+'</h3><p class="mx-hint">Waiting for their yes · 📞 +91 ••••• •••••</p></article>').join('')||'<p class="mx-hint">No open requests.</p>';
 $('mxLists').hidden=false;
}
$('mxIncoming').addEventListener('click',e=>{const k=e.target.closest&&e.target.closest('[data-yes]');if(k)send(k.dataset.yes).catch(err=>status('Could not save: '+(err.code||err.message)))});
$('mxSigninBtn').addEventListener('click',()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e=>status('Sign-in failed: '+(e.code||e.message))));
$('mxSend').addEventListener('click',()=>send(target).catch(err=>status('Could not send: '+(err.code||err.message))));
$('mxCard').addEventListener('submit',async e=>{e.preventDefault();try{const c=cleanCard({phone:$('mxPhone').value,whatsapp:$('mxWa').value,email:$('mxEmail').value});
 await db.collection('contactCards').doc(me).set({...c,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});status('Contact card saved. Only mutual matches can see it.')}catch(err){status(err.message||String(err))}});
auth.onAuthStateChanged(async u=>{
 if(!u){$('mxSignin').hidden=false;return status(target?'Sign in to send your collab request.':'Sign in to see your matches.')}
 $('mxSignin').hidden=true;await loadNames();
 try{const s=await db.collection('ownerListings').doc(u.uid).get();me=s.exists?s.data().key:''}catch(_){me=''}
 if(!validKey(me))return status('Your account is not linked to a creator or property listing yet. Apply at the creator network page or list your property; RoamWise links your account after a quick check.');
 status('Signed in as '+(names[me]||me)+'.');$('mxMine').hidden=false;
 try{const c=await db.collection('contactCards').doc(me).get();if(c.exists){const d=c.data();$('mxPhone').value=d.phone||'';$('mxWa').value=d.whatsapp||'';$('mxEmail').value=d.email||''}}catch(_){}
 if(validKey(target)&&canRequest(me,target)){$('mxPending').hidden=false;$('mxPendingText').innerHTML='Send a collab request to '+label(target)+'?'}
 refresh().catch(e=>status('Could not load matches: '+(e.code||e.message)));
});
