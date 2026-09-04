// @ts-nocheck
/* Extracted verbatim from app.js (final modularization pass) — international
   Gumroad checkout (openGumroad/verifyGumroad) and the direct-wallet crypto
   payment panel (CRYPTO_WALLETS/cryptoConfigured/cryptoPanelHTML/copyText).
   activatePro() (called by verifyGumroad) remains a global defined elsewhere
   in app.js; CRYPTO_WALLETS is also written by js/boot/init.js's remote-config
   applier, which runs at DOMContentLoaded (after this file has loaded).
   The core UPI/QR/plan-picker checkout flow (openPay/pickPlan/renderPlanGrid/
   payVia/buildQR/submitUtr, "GLOBAL COMMERCE" region pricing) is NOT included
   here: it is tightly interleaved with pricing-tier and referral state across
   roughly 2000 non-contiguous app.js lines, and a safe verbatim split needs
   its own dedicated, more surgical pass rather than being forced into this
   one — the same reasoning js/boot/init.js already documents for why the
   Firebase/auth init block was deferred until this pass. Zero logic changes
   from the original app.js code. */

/* saveGumroad removed — Gumroad link/ID now arrive via remote config (admin Config tab). */
function openGumroad(){
  var u = lsGet('rw_gum_url');
  if(!u){ showToast('International checkout isn\u2019t configured yet \u2014 UPI works right now'); return false; }
  window.open(u, '_blank', 'noopener');
  showToast('After paying, check your email for the license key');
  return false;
}
function verifyGumroad(){
  var key = (el('gumLicKey').value||'').trim();
  var err = el('gumVerifyErr'), btn = el('gumVerifyBtn');
  err.style.display = 'none';
  if(key.length < 8){ err.textContent = 'That does not look like a license key \u2014 paste the full key from your email.'; err.style.display = 'block'; return; }
  var pid = lsGet('rw_gum_pid');
  if(!pid){ err.textContent = 'License verification isn\u2019t configured yet \u2014 email founder@roamwise.co.in and we\u2019ll unlock you manually.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Verifying\u2026';
  fetch('https://api.gumroad.com/v2/licenses/verify', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'product_id='+encodeURIComponent(pid)+'&license_key='+encodeURIComponent(key)+'&increment_uses_count=false'
  }).then(function(r){ return r.json(); }).then(function(d){
    btn.disabled = false; btn.textContent = 'Verify & Unlock \uD83D\uDD13';
    if(d && d.success && d.purchase && !d.purchase.refunded && !d.purchase.chargebacked){
      activatePro(key, 'gumroad');
    }else{
      err.textContent = 'License key not valid. Check for typos, or make sure the payment went through. Refunded keys are rejected.';
      err.style.display = 'block';
    }
  }).catch(function(){
    btn.disabled = false; btn.textContent = 'Verify & Unlock \uD83D\uDD13';
    err.textContent = 'Could not reach Gumroad to verify. Check your connection and try again.';
    err.style.display = 'block';
  });
}

/* ==================== CRYPTO PAYMENT (direct wallet, zero fees) =============
   No gateway, no partnership, no monthly cost: the user sends stablecoin
   straight to your own wallet and submits the transaction hash, verified the
   same honour-system way UPI UTRs already are in this app. Fill the addresses
   below to switch it on — until then the option stays hidden rather than
   showing a broken payment path. */
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
    +'<div style="font-size:12px;font-weight:700;margin-bottom:8px">\u20bf Pay with crypto (USDT)</div>'
    + rows
    +'<div style="background:rgba(232,186,108,.08);border:1px solid rgba(232,186,108,.3);border-radius:9px;padding:9px 11px;font-size:11px;line-height:1.55;color:var(--t2);margin-top:4px">'
    +'<b>Before you send:</b> crypto payments are verified by hand, so unlocking takes up to 48 hours \u2014 not instantly like UPI. '
    +'Send the exact amount to the correct network, then paste the transaction hash where the UPI reference goes. '
    +'A wrong network or a wrong amount cannot be recovered. '
    +'<b>UPI is instant and free</b> \u2014 use that unless you specifically need to pay in crypto.'
    +'</div>';
}
function copyText(t){
  try{ navigator.clipboard.writeText(t); showToast('Copied'); }
  catch(e){ showToast(t); }
}
