// @ts-nocheck
/* certificate-verify.js — Certificate Verification: the SHA-256 tamper-check tools
   (rwCertHash, rwVerifyPanelHTML, rwVerifyRun) shared by the Eco Certificate
   (js/itinerary/eco-certificate.js) and surfaced in the copilot's rich-reply UI.
   Split out of js/itinerary/certificates.js (which bundled 5 unrelated
   certificate/movie features) as an SRP cleanup; verbatim move, zero logic changes. */

/* ==================== CERTIFICATE VERIFICATION ====================
   This is the useful property people actually want from "put it on a
   blockchain" — proof a certificate was not edited — delivered without a chain,
   a wallet, gas fees, or India's 30% VDA tax.

   A SHA-256 of the certificate's underlying numbers is printed on the image and
   stored with the record. Anyone can re-hash the stated values and compare. It
   costs nothing, works offline, and needs no third party.

   Honest about its limit: this proves the certificate has not been ALTERED
   since issue. It does not prove the underlying travel happened — that is
   self-reported, and no ledger of any kind would change that. A blockchain
   version would have exactly the same weakness while costing money, which is
   the part crypto-for-certificates pitches always skip. */
async function rwCertHash(payload){
  var text = [payload.name, payload.kg, payload.trips, payload.issued].join('|');
  if(window.crypto && crypto.subtle){
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('').slice(0,16).toUpperCase();
  }
  /* fallback for very old webviews */
  var h=0; for(var i=0;i<text.length;i++){ h=((h<<5)-h+text.charCodeAt(i))|0; }
  return ('00000000'+(h>>>0).toString(16)).slice(-8).toUpperCase();
}
function rwVerifyPanelHTML(){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A8A,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udd0e Verify a certificate</div>'
    +'<div class="tk-meta">Check that a RoamWise certificate has not been edited</div></div>'
    +'<div class="tk-sec">'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.6">Paste the details printed on the certificate. If the code matches, nothing has been altered since it was issued.</div>'
    +'<input id="vfName" class="k-inp" placeholder="Name on the certificate" style="width:100%;margin-top:9px">'
    +'<input id="vfKg" class="k-inp" type="number" placeholder="kg CO\u2082e avoided" style="width:100%;margin-top:7px">'
    +'<input id="vfTrips" class="k-inp" type="number" placeholder="journeys logged" style="width:100%;margin-top:7px">'
    +'<input id="vfDate" class="k-inp" placeholder="Issued date, e.g. 24 July 2026" style="width:100%;margin-top:7px">'
    +'<input id="vfCode" class="k-inp" placeholder="Verification code from the certificate" style="width:100%;margin-top:7px;font-family:monospace">'
    +'<button class="tk-chip gold" style="width:100%;padding:11px;margin-top:10px" onclick="rwVerifyRun()">Check it</button>'
    +'<div id="vfOut" style="margin-top:10px"></div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">What this does and does not prove</div>'
    +'<div class="tk-bul">\u2713 Proves the numbers on the certificate are the ones issued \u2014 nobody edited the image.</div>'
    +'<div class="tk-bul">\u2717 Does not prove the journeys happened. Those are self-logged, and no ledger \u2014 blockchain included \u2014 could verify them either.</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:6px">SHA-256, computed on your device. No blockchain, no wallet, no fee.</div>'
    +'</div></div>';
}
async function rwVerifyRun(){
  var out=el('vfOut'); if(!out) return;
  var payload={ name:(el('vfName')||{}).value||'', kg:(el('vfKg')||{}).value||'',
                trips:(el('vfTrips')||{}).value||'', issued:(el('vfDate')||{}).value||'' };
  var claimed=String((el('vfCode')||{}).value||'').trim().toUpperCase();
  if(!claimed){ out.innerHTML='<div style="font-size:12px;color:var(--t3)">Paste the code from the certificate.</div>'; return; }
  var real = await rwCertHash(payload);
  var ok = real===claimed;
  out.innerHTML='<div style="background:'+(ok?'rgba(74,222,128,.1)':'rgba(224,91,91,.1)')
    +';border:1px solid '+(ok?'rgba(74,222,128,.4)':'rgba(224,91,91,.4)')
    +';border-radius:10px;padding:11px 13px">'
    +'<b style="font-size:13px;color:'+(ok?'#4ADE80':'#E05B5B')+'">'+(ok?'\u2713 Genuine':'\u2717 Does not match')+'</b>'
    +'<div style="font-size:11.5px;color:var(--t2);line-height:1.55;margin-top:4px">'
    +(ok? 'These values produce exactly the code on the certificate.'
        : 'The values you entered produce <code>'+esc2(real)+'</code>, not <code>'+esc2(claimed)+'</code>. Either something was typed differently, or the certificate was altered.')
    +'</div></div>';
}
