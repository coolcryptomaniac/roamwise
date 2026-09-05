// @ts-nocheck
/* ===== PRIVACY TRUST ANCHOR + WEB-TO-APP HANDOFF (rw-v51) =================
   Moved verbatim from app.js (modularization round 5) — plain functions,
   no top-level DOM queries or other order-sensitive code, so this file can
   load anywhere before app.js.

   Two conversion levers from the strategy review:
   1) Web visitors ASSUME they're being tracked. Say plainly that they aren't.
   2) Desktop planners should finish on their phone — a QR beats "download our app". */
function openPrivacyBadge(){
  var ov=el('privBadgeOv');
  if(!ov){ ov=document.createElement('div'); ov.id='privBadgeOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('privBadgeOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:400px"><div class="sheet-h"><b>🔒 Your data stays yours</b>'
    +'<button onclick="rwOverlayClose(\'privBadgeOv\')" class="tact">✕</button></div>'
    +'<div style="font-size:13px;color:var(--t2);line-height:1.7;margin-top:6px">'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">✓ On your device</b><br>Your saved trips, itineraries, journal, budgets and preferences never leave this device.</div>'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">✓ Only when you invite people</b><br>The only things that reach our servers are group chats you create and beacons you deliberately light.</div>'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">✓ No background tracking</b><br>Location is read once, when you tap a feature that needs it. Never in the background. Never sold.</div>'
    +'<div><b style="color:#4ADE80">✓ No signup required</b><br>You can plan an entire trip without giving us an email address.</div>'
    +'</div><a class="tact" style="display:block;text-align:center;margin-top:14px;text-decoration:none" href="/legal/privacy.html" target="_blank">Read the full privacy policy ↗</a></div>';
  ov.classList.add('open');
}
/* QR handoff: finish planning on the phone. Uses a public QR image service so
   there's no library to bundle; falls back to a copyable link. */
function rwHandoffToPhone(){
  var url='https://www.roamwise.co.in/';
  try{
    var t=(window._lastItin&&window._lastItin.name)||'';
    if(t) url+='?plan='+encodeURIComponent(t);
  }catch(e){ /* best-effort, ignore */ }
  var qr='https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data='+encodeURIComponent(url);
  var ov=el('handoffOv');
  if(!ov){ ov=document.createElement('div'); ov.id='handoffOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('handoffOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:340px;text-align:center"><div class="sheet-h" style="text-align:left"><b>📱 Continue on your phone</b>'
    +'<button onclick="rwOverlayClose(\'handoffOv\')" class="tact">✕</button></div>'
    +'<div style="background:#fff;border-radius:14px;padding:10px;display:inline-block;margin:8px 0">'
    +'<img src="'+qr+'" alt="QR code" width="220" height="220" style="display:block"></div>'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.6">Scan with your phone camera to open this plan there — maps, Near Me and your group chat all work better on mobile.</div>'
    +'<button class="tact" style="width:100%;margin-top:12px" onclick="rwCopy(\''+url+'\');showToast(\'Link copied\')">Copy link instead</button></div>';
  ov.classList.add('open');
}
