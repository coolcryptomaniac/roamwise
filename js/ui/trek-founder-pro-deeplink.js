// @ts-nocheck
/* Open the existing RoamWise checkout overlay only after the full app boots.
   No payment is initiated by visiting the Founder Pro deep link. */
(function(){
 'use strict';
 const qs=new URLSearchParams(location.search);
 if(qs.get('openPro')!=='1')return;
 let done=false,attempts=0;
 function show(){
  if(done||attempts++>30)return;
  const action=typeof window.rwOpenPaySafely==='function'?window.rwOpenPaySafely:
    typeof window.openPay==='function'?window.openPay:null;
  if(!action){setTimeout(show,650);return}
  done=true;
  qs.delete('openPro');history.replaceState(history.state,'',location.pathname+(qs.toString()?'?'+qs.toString():'')+location.hash);
  try{action()}catch(e){console.warn('Pro overlay not ready; use the Pro button in the header.')}
 }
 window.addEventListener('rw:booted',show,{once:true});
 if(document.readyState==='complete')setTimeout(show,600);
 else window.addEventListener('load',()=>setTimeout(show,600),{once:true});
})();