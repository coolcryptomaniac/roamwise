// @ts-nocheck
/* Extracted verbatim from app.js (final modularization pass) — end-to-end
   encrypted API-key backup/restore (Firestore-backed). Depends on user/db
   from js/boot/auth-init.js (loads earlier) and lsGet/lsSet/el/showToast
   from js/core/*. Zero logic changes from the original app.js code. */

/* ==================== ENCRYPTED KEY SYNC (end-to-end) ====================
   Goal: stop re-pasting API keys on every device and after every sign-out.
   Design decision that matters: the keys are encrypted IN THE BROWSER with a
   passphrase only the user knows (PBKDF2-SHA256, 210k iterations -> AES-GCM
   256). Firestore only ever stores ciphertext.
   Why a passphrase and not something automatic: any key the app could derive
   on its own (from the UID, the email, a constant) could also be derived by
   anyone who can read the document — an admin, a leaked backup, or a bad
   rules deploy. That would be encryption theatre. The trade-off is real and
   deliberate: forget the passphrase and the stored keys are unrecoverable,
   which is exactly what "we can't read them" means. */
var RW_SEC_ITER = 210000;
function _b64(buf){ return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
function _unb64(str){ return Uint8Array.from(atob(str), function(c){ return c.charCodeAt(0); }); }
async function rwDeriveKey(pass, salt){
  var base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2', salt:salt, iterations:RW_SEC_ITER, hash:'SHA-256'},
    base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function rwEncryptSecrets(obj, pass){
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var iv   = crypto.getRandomValues(new Uint8Array(12));
  var key  = await rwDeriveKey(pass, salt);
  var ct   = await crypto.subtle.encrypt({name:'AES-GCM', iv:iv}, key, new TextEncoder().encode(JSON.stringify(obj)));
  return {v:1, salt:_b64(salt), iv:_b64(iv), blob:_b64(ct)};
}
async function rwDecryptSecrets(rec, pass){
  var key = await rwDeriveKey(pass, _unb64(rec.salt));
  var pt  = await crypto.subtle.decrypt({name:'AES-GCM', iv:_unb64(rec.iv)}, key, _unb64(rec.blob));
  return JSON.parse(new TextDecoder().decode(pt));
}
function rwKeyBundle(){
  var out={};
  ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].forEach(function(p){
    var v=lsGet('rwKey_'+p); if(v) out[p]=v;
  });
  return out;
}
async function rwAutoBackup(){
  /* Silent push after any key change — so "save once" really means once. */
  var pass = lsGet('rw_sec_pass');
  if(!pass || !user || !user.uid) return;
  try{
    var bundle=rwKeyBundle(); if(!Object.keys(bundle).length) return;
    var rec=await rwEncryptSecrets(bundle, pass);
    rec.updated=firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('secrets').doc(user.uid).set(rec);
  }catch(e){}
}
async function rwSyncKeysUp(){
  var pass=(el('secPass')&&el('secPass').value||'').trim();
  var st=el('secStatus');
  if(pass.length<8){ st.textContent='Use at least 8 characters \u2014 this is the only thing protecting your keys.'; st.style.color='#E05B5B'; return; }
  if(!user || !user.uid){ st.textContent='Sign in first, then sync.'; st.style.color='#E05B5B'; return; }
  var bundle=rwKeyBundle();
  if(!Object.keys(bundle).length){ st.textContent='No keys saved on this device yet \u2014 add one below first.'; st.style.color='#E05B5B'; return; }
  st.textContent='Encrypting\u2026'; st.style.color='var(--t3)';
  try{
    var rec=await rwEncryptSecrets(bundle, pass);
    rec.updated=firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('secrets').doc(user.uid).set(rec);
    if(el('secRemember') && el('secRemember').checked) lsSet('rw_sec_pass', pass);
    st.innerHTML='\u2713 Saved to your account, encrypted \u00b7 '+Object.keys(bundle).length+' key(s). They restore on any device with this passphrase.';
    st.style.color='#4ADE80';
  }catch(e){ st.textContent='Sync failed: '+(e.message||e); st.style.color='#E05B5B'; }
}
async function rwSyncKeysDown(silent){
  var st=el('secStatus');
  var pass=(el('secPass')&&el('secPass').value||'').trim() || lsGet('rw_sec_pass') || '';
  if(!user || !user.uid){ if(st&&!silent){ st.textContent='Sign in first.'; st.style.color='#E05B5B'; } return false; }
  if(!pass){ if(st&&!silent){ st.textContent='Enter your passphrase to unlock the stored keys.'; st.style.color='#E05B5B'; } return false; }
  try{
    var snap=await db.collection('secrets').doc(user.uid).get();
    if(!snap.exists){ if(st&&!silent){ st.textContent='Nothing stored yet \u2014 save your keys first.'; st.style.color='var(--t3)'; } return false; }
    var bundle=await rwDecryptSecrets(snap.data(), pass);
    var n=0;
    Object.keys(bundle).forEach(function(p){ if(bundle[p]){ lsSet('rwKey_'+p, bundle[p]); n++; } });
    if(el('secRemember') && el('secRemember').checked) lsSet('rw_sec_pass', pass);
    try{ renderKeyBoxes(); openSettings(); }catch(e){}
    try{ cpModelChips('heroModels'); cpModelChips('cpModels'); }catch(e){}
    if(st && !silent){ st.textContent='\u2713 Restored '+n+' key(s) to this device.'; st.style.color='#4ADE80'; }
    else if(n) showToast('\ud83d\udd11 '+n+' AI key(s) restored');
    return true;
  }catch(e){
    if(st && !silent){ st.textContent='Wrong passphrase (or the stored data is from another passphrase).'; st.style.color='#E05B5B'; }
    return false;
  }
}
async function rwForgetSynced(){
  if(!user || !user.uid) return;
  if(!confirm('Delete the encrypted key backup from your account? Keys on this device stay until you sign out.')) return;
  try{ await db.collection('secrets').doc(user.uid).delete(); lsRemove('rw_sec_pass');
    el('secStatus').textContent='Backup deleted.'; el('secStatus').style.color='var(--t3)';
  }catch(e){ el('secStatus').textContent='Delete failed: '+(e.message||e); }
}
function lsRemove(k){ try{ localStorage.removeItem(k); }catch(e){} }
function rwOfferBackup(){
  if(lsGet('rw_sec_pass') || lsGet('rw_sec_declined')==='1') return;
  if(!user || !user.uid) return;
  setTimeout(function(){
    var pass = prompt('Save this key to your account so you never paste it again?\n\nChoose a passphrase (8+ characters). Your keys are encrypted on this device before upload \u2014 RoamWise can never read them, and the passphrase cannot be reset.\n\nLeave blank to skip.');
    if(!pass){ lsSet('rw_sec_declined','1'); return; }
    if(pass.trim().length<8){ showToast('Passphrase needs 8+ characters \u2014 you can set it in Settings anytime'); return; }
    lsSet('rw_sec_pass', pass.trim());
    rwAutoBackup().then(function(){ showToast('\ud83d\udd10 Keys backed up to your account'); });
  }, 400);
}
function secPanelHTML(){
  return '<div class="key-box" style="border-color:rgba(232,186,108,.35)">'
    +'<div class="key-box-name">\u2601\ufe0f Keep my keys in my account <span class="key-status ks-empty" id="secStatus">encrypted end-to-end</span></div>'
    +'<div class="key-box-hint">Encrypted in this browser with your passphrase before upload \u2014 RoamWise stores only ciphertext and cannot read your keys. Forget the passphrase and the backup is unrecoverable.</div>'
    +'<div class="key-row"><input class="k-inp" type="password" id="secPass" placeholder="Passphrase (8+ characters)">'
    +'<button class="k-save" onclick="rwSyncKeysUp()">Save</button>'
    +'<button class="k-save" style="background:var(--teal)" onclick="rwSyncKeysDown()">Restore</button>'
    +'<button class="k-clear" onclick="rwForgetSynced()">Delete</button></div>'
    +'<label style="display:flex;gap:7px;align-items:center;font-size:11px;color:var(--t3);margin-top:7px">'
    +'<input type="checkbox" id="secRemember" checked> Remember on this device (auto-restore at sign-in)</label>'
    +'<label style="display:flex;gap:7px;align-items:center;font-size:11px;color:var(--t3);margin-top:5px">'
    +'<input type="checkbox" id="secWipe" '+(lsGet('rw_wipe_keys')==='1'?'checked':'')+' onchange="lsSet(\'rw_wipe_keys\', this.checked?\'1\':\'0\')">'
    +' Shared device: also delete my keys from this device when I sign out</label>'
    +'<div style="font-size:11px;margin-top:8px;color:'+(lsGet('rw_sec_pass')?'#4ADE80':'var(--t3)')+'">'
    +(lsGet('rw_sec_pass')? '\u2713 Backup is on \u2014 keys re-appear automatically after sign-in.' : '\u25cb Backup is off \u2014 keys live only on this device.')+'</div>'
    +'</div>';
}
