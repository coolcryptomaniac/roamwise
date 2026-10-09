// @ts-nocheck
/* ============================================================================
   js/payments/qr-scan.js - scan a pass QR by camera photo OR by uploading an image
   ============================================================================
   Adds two buttons to the existing "Redeem a partner code" form:
     "Take a photo of the QR"   (opens the phone camera, no live-video permission needed)
     "Upload a QR image"        (pick a screenshot / saved card from the gallery)
   so a single phone can test or redeem without a second device.
   The image is decoded on the device and never uploaded. Decoder: the browser's
   BarcodeDetector when present, otherwise the vendored jsQR (Apache-2.0, loaded
   only when needed). The result only FILLS the code box (or shows the TEST screen);
   redeeming still needs the user to sign in and press the existing button, and all
   checks stay in the existing flow and Firestore rules.
   ========================================================================= */
(function(){
  var JSQR_SRC='vendor/jsqr/jsQR.js';
  /* Pull a pass code out of whatever the QR held: our redeem link, a bare code, or something else. */
  function extractCode(text){
    var t=String(text||'').trim(), c='';
    try{ var u=new URL(t); var r=u.searchParams.get('redeem'); if(r) c=r; else if(u.searchParams.get('ref')) return {kind:'ref'}; }catch(e){ c=t; }
    c=String(c).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32);
    if(!c||c==='OPEN'||c==='1') return {kind:c?'open':'none'};
    return /^[A-Z0-9][A-Z0-9_-]{5,31}$/.test(c)?{kind:'code',code:c}:{kind:'none'};
  }
  function loadJsQR(){
    return new Promise(function(res,rej){
      if(window.jsQR) return res(window.jsQR);
      var s=document.createElement('script'); s.src=JSQR_SRC; s.onload=function(){ window.jsQR?res(window.jsQR):rej(); }; s.onerror=rej; document.head.appendChild(s);
    });
  }
  function toCanvas(file){
    return new Promise(function(res,rej){
      var url=URL.createObjectURL(file), img=new Image();
      img.onload=function(){
        var k=Math.min(1,1400/Math.max(img.width,img.height)), c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(img.width*k)); c.height=Math.max(1,Math.round(img.height*k));
        var x=c.getContext('2d',{willReadFrequently:true}); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0,c.width,c.height);
        URL.revokeObjectURL(url); res(c);
      };
      img.onerror=function(){ URL.revokeObjectURL(url); rej(); };
      img.src=url;
    });
  }
  async function decodeFile(file){
    var canvas=await toCanvas(file);
    try{
      if('BarcodeDetector' in window){
        var found=await new BarcodeDetector({formats:['qr_code']}).detect(canvas);
        if(found&&found[0]&&found[0].rawValue) return found[0].rawValue;
      }
    }catch(e){ /* fall through to jsQR */ }
    var jsQR=await loadJsQR(), d=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height);
    var r=jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});
    return r&&r.data?r.data:'';
  }
  function say(m){ try{ showToast(m); }catch(e){ alert(m); } }
  async function onFile(file){
    if(!file) return;
    var text=''; try{ text=await decodeFile(file); }catch(e){ text=''; }
    if(!text){ say('Could not find a QR in that image. Try a clearer photo or screenshot.'); return; }
    var r=extractCode(text);
    if(r.kind==='ref'){ say('That QR is the NMIMS sharing link, not a pass code.'); return; }
    if(r.kind!=='code'){ say('That QR is not a RoamWise pass.'); return; }
    if(r.code==='NMIMS-TEST-0000-DEMO'){ try{ rwOverlayClose('rwFormOverlay'); }catch(e){} if(window.rwShowRedeemTest) window.rwShowRedeemTest(); return; }
    var box=document.getElementById('rwf_0'); if(box){ box.value=r.code; }
    say('Code filled in. Sign in, then tap Redeem.');
  }
  function inject(){
    var body=document.getElementById('rwFormBody');
    if(!body||document.getElementById('rwQrScanRow')) return;
    var row=document.createElement('div'); row.id='rwQrScanRow'; row.style.cssText='display:flex;gap:8px;margin:12px 0 2px';
    function mk(label,capture){
      var b=document.createElement('button'); b.type='button'; b.textContent=label;
      b.style.cssText='flex:1;border:1px solid var(--b2,#2a2a36);background:transparent;color:inherit;border-radius:12px;padding:11px 8px;font:700 13px inherit;cursor:pointer';
      var f=document.createElement('input'); f.type='file'; f.accept='image/*'; if(capture) f.setAttribute('capture','environment'); f.style.display='none';
      f.onchange=function(){ var file=f.files&&f.files[0]; f.value=''; onFile(file); };
      b.onclick=function(){ f.click(); };
      var w=document.createElement('span'); w.style.cssText='flex:1;display:flex'; b.style.width='100%'; w.appendChild(b); w.appendChild(f); return w;
    }
    row.appendChild(mk('📷 Take a photo of the QR',true));
    row.appendChild(mk('🖼 Upload a QR image',false));
    var btn=body.querySelector('.rzp-main-btn'); if(btn) body.insertBefore(row,btn); else body.appendChild(row);
  }
  window.rwQrScan={extractCode:extractCode};
  window.addEventListener('load',function(){
    if(typeof window.openPartnerRedeem!=='function') return;
    var orig=window.openPartnerRedeem;
    window.openPartnerRedeem=function(){ var r=orig.apply(this,arguments); try{ inject(); }catch(e){} return r; };
  });
})();
