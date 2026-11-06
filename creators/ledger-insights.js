/* Admin-only ledger insights. No fake subscriber attribution; no Firestore writes. */
(function(){'use strict';
var dash=document.getElementById('caDash');if(!dash||!window.firebase)return;
var section=document.createElement('section');section.className='ca-panel';section.id='rwCreatorLedgerInsights';
section.innerHTML='<div class="ca-head"><div><small>REVENUE & ATTRIBUTION</small><h2>Verified creator performance</h2><p>RoamWise reconciliation ledger, not social-platform subscriber estimates. No paid subscription counts are inferred.</p></div><button class="ca-action secondary" id="rwLedgerRefresh">Refresh</button></div><div id="rwLedgerStatus" role="status" aria-live="polite"></div><div class="rw-ledger-stats" id="rwLedgerStats"></div><div class="rw-ledger-scroll"><table><thead><tr><th>Creator</th><th>Referral code</th><th>Verified sales</th><th>Verified clicks</th><th>Pending</th><th>Approved</th><th>Paid</th><th>Reconciliation</th></tr></thead><tbody id="rwLedgerRows"></tbody></table></div><p class="rw-ledger-note">Paid subscribers: not connected to a verified subscription event source. The ledger’s verified sales must not be presented as paid subscribers. Commission values reflect the latest administrator-owned ledger and require financial reconciliation.</p>';
var anchor=document.getElementById('rwGeoPanel')||document.getElementById('rwIntelligence');if(anchor)anchor.insertAdjacentElement('afterend',section);else dash.appendChild(section);
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){var n=Number(v);return Number.isFinite(n)&&n>0?n:0}
function rupee(v){return '₹'+Math.round(num(v)).toLocaleString('en-IN')}
function metric(label,v){return '<div><small>'+esc(label)+'</small><strong>'+esc(v)+'</strong></div>'}
async function load(){var status=document.getElementById('rwLedgerStatus');status.textContent='Loading reconciliation ledger…';try{
var u=firebase.auth().currentUser;if(!u||!u.emailVerified){status.textContent='Verified administrator login required.';return}
var db=firebase.firestore(),admin=await db.collection('admins').doc(u.uid).get();if(!admin.exists){status.textContent='Administrator access required.';return}
var snap=await db.collection('creatorEarnings').limit(500).get(),tot={sales:0,clicks:0,pending:0,approved:0,paid:0},rows=[];
snap.docs.forEach(function(d){var x=d.data()||{},r={name:x.creatorName||x.email||d.id,code:x.referralCode||'',sales:num(x.verifiedSales),clicks:num(x.verifiedClicks),pending:num(x.pendingCommission),approved:num(x.approvedCommission),paid:num(x.paidCommission),reconciled:x.lastReconciledAt||x.updatedAt||''};rows.push(r);tot.sales+=r.sales;tot.clicks+=r.clicks;tot.pending+=r.pending;tot.approved+=r.approved;tot.paid+=r.paid});
rows.sort(function(a,b){return b.sales-a.sales||b.clicks-a.clicks});
document.getElementById('rwLedgerStats').innerHTML=metric('Creator ledgers',rows.length)+metric('Verified sales',tot.sales.toLocaleString('en-IN'))+metric('Verified clicks',tot.clicks.toLocaleString('en-IN'))+metric('Pending commissions',rupee(tot.pending))+metric('Approved commissions',rupee(tot.approved))+metric('Paid commissions',rupee(tot.paid))+metric('Verified paid subscribers','Not connected');
document.getElementById('rwLedgerRows').innerHTML=rows.map(function(r){return '<tr><td>'+esc(r.name)+'</td><td>'+esc(r.code||'—')+'</td><td>'+r.sales+'</td><td>'+r.clicks+'</td><td>'+rupee(r.pending)+'</td><td>'+rupee(r.approved)+'</td><td>'+rupee(r.paid)+'</td><td>'+esc(String(r.reconciled).slice(0,10)||'Not recorded')+'</td></tr>'}).join('')||'<tr><td colspan="8">No creator ledgers available.</td></tr>';
status.textContent=rows.length+' ledger records loaded. Amounts are recorded figures, not independently audited payments.';
}catch(e){status.textContent='Ledger unavailable: '+(e.code||e.message)+'. No records changed.'}}
document.getElementById('rwLedgerRefresh').addEventListener('click',load);firebase.auth().onAuthStateChanged(function(u){if(u)load();else document.getElementById('rwLedgerStatus').textContent='Sign in to see ledger analytics.'});
})();