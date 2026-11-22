/* Deduplicated wallet/header controls. No account, pricing or payment mutation. */
(function(){
 'use strict';
 function ready(){
  var chip=document.getElementById('rwWalletChip');
  var link=document.querySelector('.nav .rw-vault-wallet-link');
  if(link){
    link.textContent='Wallet';link.setAttribute('aria-label','Open RoamWise wallet');
    link.setAttribute('title','Wallet and account credits');
  }
  var settings=document.getElementById('rwSettingsShortcut');
  if(settings){settings.setAttribute('aria-label','Settings: language, privacy, AI models and BYOK');settings.setAttribute('title','Settings · AI routing and BYOK');}
  function sync(){
    if(!chip||!link)return;
    // Only one wallet control: signed-in balance chip OR icon linking to wallet.
    var visible=chip.style.display!=='none'&&getComputedStyle(chip).display!=='none'&&!chip.hidden;
    link.toggleAttribute('hidden',visible);
    if(visible)chip.setAttribute('title','Open RoamWise wallet');
  }
  if(chip&&link){
    sync();
    if(typeof MutationObserver==='function'){
      var mo=new MutationObserver(sync);
      mo.observe(chip,{attributes:true,attributeFilter:['style','hidden','class']});
    }
    document.addEventListener('rw:auth-changed',sync);
  }
  var front=document.getElementById('rwPartnerFrontdoors');
  if(front&&front.hasAttribute('data-rw-fallback-hidden'))front.removeAttribute('data-rw-fallback-hidden');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
 else ready();
})();
