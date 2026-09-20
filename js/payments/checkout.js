// @ts-nocheck
/* Extracted from app.js — international Gumroad checkout and direct-wallet
   crypto payment panel. The plan picker / manual UPI logic lives elsewhere. */

/* saveGumroad removed — Gumroad link/ID now arrive via remote config (admin Config tab). */
function openGumroad(){
  var u = lsGet('rw_gum_url');
  if(!u){ showToast('International checkout isn’t configured yet — UPI works right now'); return false; }
  window.open(u, '_blank', 'noopener');
  showToast('After paying, check your email for the license key');
  return false;
}
function verifyGumroad(){
  var key = (el('gumLicKey').value||'').trim();
  var err = el('gumVerifyErr'), btn = el('gumVerifyBtn');
  err.style.display = 'none';
  if(key.length < 8){ err.textContent = 'That does not look like a license key — paste the full key from your email.'; err.style.display = 'block'; return; }
  var pid = lsGet('rw_gum_pid');
  if(!pid){ err.textContent = 'License verification isn’t configured yet — email founder@roamwise.co.in and we’ll unlock you manually.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Verifying…';
  fetch('https://api.gumroad.com/v2/licenses/verify', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'product_id='+encodeURIComponent(pid)+'&license_key='+encodeURIComponent(key)+'&increment_uses_count=false'
  }).then(function(r){ return r.json(); }).then(function(d){
    btn.disabled = false; btn.textContent = 'Verify & Unlock 🔓';
    if(d && d.success && d.purchase && !d.purchase.refunded && !d.purchase.chargebacked){
      activatePro(key, 'gumroad');
    }else{
      err.textContent = 'License key not valid. Check for typos, or make sure the payment went through. Refunded keys are rejected.';
      err.style.display = 'block';
    }
  }).catch(function(){
    btn.disabled = false; btn.textContent = 'Verifying…';
    err.textContent = 'Could not reach Gumroad to verify. Check your connection and try again.';
    err.style.display = 'block';
  });
}

/* Direct wallet payment is visible only when its addresses are configured. */
var CRYPTO_WALLETS = {
  /* e.g. usdt_polygon:'0xYourWallet...', usdt_tron:'TYourWallet...' */
};
function cryptoConfigured(){ return Object.keys(CRYPTO_WALLETS).length>0; }
function cryptoPanelHTML(){
  if(!cryptoConfigured()) return '';
  var rows = Object.keys(CRYPTO_WALLETS).map(function(k){
    var label = k.replace('_',' ').toUpperCase();
    return '<div style="background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:10px;margin-bottom:8px">'
      +'<div style="font-size:11px;color:var(--t3);margin-bottom:4px">'+label+'</div>'
      +'<div style="font-family:monospace;font-size:11px;word-break:break-all">'+CRYPTO_WALLETS[k]+'</div>'
      +'<button class="tact" style="font-size:11px;padding:5px 9px;margin-top:6px" onclick="copyText(\''+CRYPTO_WALLETS[k]+'\')">Copy address</button>'
      +'</div>';
  }).join('');
  return '<div style="margin-top:14px;border-top:1px solid var(--b2,#2A2A36);padding-top:12px">'
    +'<div style="font-size:12px;font-weight:700;margin-bottom:8px">₿ Pay with crypto (USDT)</div>'
    + rows
    +'<div style="background:rgba(232,186,108,.08);border:1px solid rgba(232,186,108,.3);border-radius:9px;padding:9px 11px;font-size:11px;line-height:1.55;color:var(--t2);margin-top:4px">'
    +'<b>Before you send:</b> crypto payments are verified by hand, so unlocking takes up to 48 hours — not instantly like UPI. '
    +'Send the exact amount to the correct network, then paste the transaction hash where the UPI reference goes. '
    +'A wrong network or a wrong amount cannot be recovered. '
    +'<b>UPI is instant and free</b> — use that unless you specifically need to pay in crypto.'
    +'</div>';
}
function copyText(t){
  try{ navigator.clipboard.writeText(t); showToast('Copied'); }
  catch(e){ showToast(t); }
}

/* Presentation only: load payment styling and account-linked order recovery.
   Order creation and Cashfree credentials remain exclusively on the Worker. */
(function(){
  function install(){
    var methods=document.getElementById('payMethods');
    if(!methods)return;
    if(!document.getElementById('rwCashfreeSkin')){
      var skin=document.createElement('link');skin.id='rwCashfreeSkin';skin.rel='stylesheet';skin.href='/my-payments/checkout-theme.css?v=2';
      document.head.appendChild(skin);
    }
    var cf=document.getElementById('cashfreeOption');
    if(cf){
      var heading=cf.querySelector('.section-label');
      if(heading)heading.textContent='RoamWise secure checkout · UPI / cards / netbanking';
      var button=cf.querySelector('button.upi-any');
      if(button)button.textContent='Continue to secure Cashfree checkout →';
      var note=cf.querySelector('.upi-note');
      if(note)note.textContent='One-time purchases only. Access follows verified payment. If debited but not unlocked, check My payments & plan instead of paying again.';
    }
    var title=methods.querySelector('.utr-title');
    if(title)title.textContent='Step 2 — submit your UTR for verification';
    var help=document.getElementById('utrHelp');
    if(help)help.textContent='After paying, copy the UPI reference from your bank app. Your submission starts manual review; Pro access follows independent payment verification.';
    if(document.getElementById('rwMyPaymentsLink'))return;
    var link=document.createElement('a');link.id='rwMyPaymentsLink';link.href='/my-payments/';link.textContent='My payments & plan →';
    methods.appendChild(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
