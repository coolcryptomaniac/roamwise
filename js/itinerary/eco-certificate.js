// @ts-nocheck
/* eco-certificate.js — Eco Certificate: canvas-rendered, shareable PNG certificate
   for avoided-emissions travel (rwEcoCert, rwCertShare). Uses rwCertHash from
   js/itinerary/certificate-verify.js for its tamper-evidence stamp. Split out of
   js/itinerary/certificates.js (which bundled 5 unrelated certificate/movie
   features) as an SRP cleanup; verbatim move, zero logic changes. */

/* ==================== ECO CERTIFICATE ====================
   Rendered to a canvas so it can be saved as a real PNG and shared. Deliberately
   states AVOIDED emissions rather than "carbon removed" or "climate reversed" —
   an honest certificate is worth keeping; an inflated one is worth nothing and
   would be greenwashing on the traveller's behalf. */
function rwEcoCert(){
  var d = rwEcoLoad(), kg = d.kgSaved||0, eq = rwEcoEquiv(kg);
  var badges = rwEcoBadges(kg).filter(function(b){ return b.earned; });
  var top = badges.length ? badges[badges.length-1] : {icon:'\ud83c\udf31', name:'First Step'};
  var name = (user && (user.displayName || (user.email||'').split('@')[0])) || 'Traveller';

  var W=1080, H=1350, c=document.createElement('canvas');
  c.width=W; c.height=H;
  var x=c.getContext('2d');

  var g=x.createLinearGradient(0,0,W,H);
  g.addColorStop(0,'#052E16'); g.addColorStop(.55,'#0A0A0C'); g.addColorStop(1,'#14532D');
  x.fillStyle=g; x.fillRect(0,0,W,H);

  /* subtle contour rings */
  x.strokeStyle='rgba(74,222,128,.10)'; x.lineWidth=2;
  for(var r=120;r<900;r+=64){ x.beginPath(); x.arc(W/2, 470, r, 0, Math.PI*2); x.stroke(); }

  x.strokeStyle='rgba(232,186,108,.55)'; x.lineWidth=3;
  x.strokeRect(44,44,W-88,H-88);

  x.textAlign='center'; x.fillStyle='#E8BA6C';
  x.font='600 26px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('R O A M W I S E', W/2, 132);
  x.font='500 17px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillStyle='rgba(255,255,255,.62)';
  x.fillText('LOW-CARBON TRAVEL', W/2, 168);

  x.font='700 96px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(top.icon, W/2, 320);

  x.fillStyle='#FFFFFF'; x.font='800 62px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(top.name, W/2, 410);

  x.fillStyle='rgba(255,255,255,.75)'; x.font='400 26px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('awarded to', W/2, 478);
  x.fillStyle='#E8BA6C'; x.font='700 52px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(name, W/2, 546);

  x.fillStyle='#4ADE80'; x.font='800 118px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(kg.toLocaleString('en-IN'), W/2, 712);
  x.fillStyle='rgba(255,255,255,.82)'; x.font='500 30px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('kg CO\u2082e avoided', W/2, 758);

  x.fillStyle='rgba(255,255,255,.62)'; x.font='400 24px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('\u2248 what ' + eq.trees + ' mature trees absorb in a year', W/2, 820);
  x.fillText('\u2248 ' + eq.kmNotDriven.toLocaleString('en-IN') + ' km not driven', W/2, 862);
  x.fillText(d.trips.length + ' low-carbon journeys logged', W/2, 904);

  /* earned badges row */
  var bx = W/2 - (badges.length-1)*46;
  x.font='400 54px -apple-system,Segoe UI,Roboto,sans-serif';
  badges.forEach(function(b,i){ x.fillText(b.icon, bx + i*92, 1010); });

  x.fillStyle='rgba(255,255,255,.42)'; x.font='400 20px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText(new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}), W/2, 1108);
  x.fillStyle='rgba(255,255,255,.34)'; x.font='400 17px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('Avoided emissions vs the default option \u2014 not carbon removed from the air.', W/2, 1176);
  x.fillText('Calculated with DEFRA/BEIS 2023 and IPCC AR6 average factors.', W/2, 1206);
  x.fillStyle='#E8BA6C'; x.font='600 20px -apple-system,Segoe UI,Roboto,sans-serif';
  x.fillText('roamwise.co.in', W/2, 1262);

  /* tamper-evidence: print a hash of the stated values so anyone can check the
     certificate was not edited — see rwVerifyPanelHTML for why this beats
     minting it on a chain */
  var issued = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  rwCertHash({name:name, kg:kg, trips:d.trips.length, issued:issued}).then(function(code){
    x.fillStyle='rgba(255,255,255,.30)'; x.font='400 15px monospace';
    x.fillText('verify: '+code+'  ·  roamwise.co.in/verify', W/2, 1300);
  });

  c.toBlob(function(blob){
    var url=URL.createObjectURL(blob);
    var f=new File([blob],'roamwise-eco-certificate.png',{type:'image/png'});
    var canShare = navigator.canShare && navigator.canShare({files:[f]});
    var ov=el('certOverlay');
    if(!ov){
      ov=document.createElement('div'); ov.id='certOverlay'; ov.className='overlay';
      ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83c\udfc5 Your certificate</b><button class="x" onclick="rwOverlayClose(\'certOverlay\')">\u2715</button></div>'
        +'<div id="certBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
      document.body.appendChild(ov);
    }
    el('certBody').innerHTML =
      '<img src="'+url+'" style="width:100%;border-radius:14px;border:1px solid var(--b2,#2A2A36)">'
      +'<div style="display:flex;gap:8px;margin-top:12px">'
      +'<a class="g-btn" style="flex:1;text-align:center;text-decoration:none;padding:12px" download="roamwise-eco-certificate.png" href="'+url+'">\u2b07\ufe0f Save</a>'
      + (canShare? '<button class="tact" style="flex:1;padding:12px;font-weight:800" onclick="rwCertShare()">\ud83d\udce4 Share</button>' : '')
      +'</div>'
      +'<p style="font-size:11px;color:var(--t3);line-height:1.6;margin-top:10px">This records emissions you <b>avoided</b> by choosing lower-carbon options \u2014 not carbon removed from the atmosphere. Both matter; only one is honest to claim.</p>';
    window._rwCertFile = f;
    rwOverlayOpen('certOverlay');
  }, 'image/png');
}
function rwCertShare(){
  var f=window._rwCertFile; if(!f) return;
  if(navigator.share){ navigator.share({files:[f], title:'My RoamWise low-carbon travel', text:'Travelling lighter with @roamwise'}).catch(function(){}); }
}
