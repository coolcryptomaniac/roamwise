/* Founder-only network publication preview/export; does not publish or send email. */
import {compileDirectory} from '../network/publish-core.mjs';
const dash=document.getElementById('caDash');
if(dash&&window.firebase){
 const root=document.createElement('section');root.className='ca-panel';root.id='rwPublishReview';
 root.innerHTML='<div class="ca-head"><div><small>PUBLICATION CONTROL</small><h2>Network Atlas publishing review</h2><p>Only records explicitly marked publicApproved and publicConsent are eligible. Export a minimal JSON file for review before publishing. No automatic publication.</p></div><button class="ca-action secondary" id="rwPublishCheck">Review public-ready records</button></div><p id="rwPublishStatus" role="status">Sign in as an administrator to review.</p><div id="rwPublishCounts"></div><label class="rw-publish-hint"><input type="checkbox" id="rwPublishFounder"> Also list every creator applicant who gave an Instagram profile (name, Instagram, niche, town and self-reported followers only). Set <code>featured: true</code> on a CRM record to pin it to the home banner.</label><button class="ca-action" id="rwPublishDownload" disabled>Download approved directory JSON</button><p class="rw-publish-hint">Private emails, phone numbers, exact addresses, payouts, applications and hidden profile fields are excluded. A creator application is never itself publication consent.</p>';
 dash.appendChild(root);
 /* Link a verified account to one listing so it can use the number exchange (creators/matches.html). */
 const link=document.createElement('section');link.className='ca-panel';link.id='rwListingLink';
 link.innerHTML='<div class="ca-head"><div><small>NUMBER EXCHANGE</small><h2>Link an account to a listing</h2><p>Paste the Firebase user ID and the listing key (creator-&lt;id&gt; or property-&lt;id&gt;). After linking, that person can send and accept collab requests; numbers show only on a mutual yes.</p></div></div><input id="rwLinkUid" placeholder="Firebase UID" maxlength="128"> <input id="rwLinkKey" placeholder="creator-abc123" maxlength="100"> <button class="ca-action" id="rwLinkSave">Link</button><p id="rwLinkStatus" role="status"></p>';
 dash.appendChild(link);
 document.getElementById('rwLinkSave').addEventListener('click',async()=>{const uid=document.getElementById('rwLinkUid').value.trim(),key=document.getElementById('rwLinkKey').value.trim(),st=document.getElementById('rwLinkStatus');
  if(!/^[A-Za-z0-9]{6,128}$/.test(uid)||!/^(creator|property)-[A-Za-z0-9_-]{1,90}$/.test(key)){st.textContent='Check the UID and key format.';return}
  try{const db=firebase.firestore(),b=db.batch();b.set(db.collection('ownerListings').doc(uid),{key});b.set(db.collection('listingOwners').doc(key),{uid});await b.commit();st.textContent='Linked '+key+'.'}catch(e){st.textContent='Link failed: '+(e.code||e.message)}});
 let compiled=null;
 const $=id=>document.getElementById(id);
 async function load(){compiled=null;$('rwPublishDownload').disabled=true;$('rwPublishStatus').textContent='Checking administrator access…';try{
  const u=firebase.auth().currentUser;if(!u||!u.emailVerified){$('rwPublishStatus').textContent='Verified admin login required.';return}
  const db=firebase.firestore(),a=await db.collection('admins').doc(u.uid).get();if(!a.exists){$('rwPublishStatus').textContent='Administrator permission required.';return}
  const names=['crm','partners','artists'];const snapshots=await Promise.allSettled(names.map((n,i)=>i===0?db.collection(n).where('seg','==','creator').limit(500).get():db.collection(n).limit(500).get()));
  const failed=snapshots.map((x,i)=>x.status==='rejected'?names[i]:null).filter(Boolean);
  if(failed.length){$('rwPublishStatus').textContent='Cannot build complete directory. Missing access to '+failed.join(', ')+'. No export generated.';return}
  const lists=snapshots.map(s=>s.value.docs.map(d=>({id:d.id,...d.data()})));
  compiled=compileDirectory({creators:lists[0],properties:lists[1],artists:lists[2]},{includeFounderListed:$('rwPublishFounder').checked});
  const d=compiled.directory;
  $('rwPublishCounts').textContent='Eligible for review: '+d.creators.length+' creators · '+d.properties.length+' properties · '+d.artists.length+' artists. Excluded (unapproved, incomplete or duplicate): '+Object.values(compiled.rejected).reduce((a,b)=>a+b,0)+'.';
  $('rwPublishStatus').textContent='Preview generated locally. Download for founder review; nothing has been published.';
  $('rwPublishDownload').disabled=false;
 }catch(e){$('rwPublishStatus').textContent='Review failed: '+(e.code||e.message)}}
 $('rwPublishCheck').addEventListener('click',load);$('rwPublishFounder').addEventListener('change',()=>{if(compiled)load()});
 $('rwPublishDownload').addEventListener('click',()=>{if(!compiled)return;const b=new Blob([JSON.stringify(compiled.directory,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='roamwise-network-approved-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)});
}
