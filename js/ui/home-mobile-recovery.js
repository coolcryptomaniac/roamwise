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
  // Mirror only already-published, self-listed MOU-approved stay records.
  // These are ENQUIRY ONLY. Never display host pricing, contact data or payment.
  function addPublicCards(){
    var W=/** @type {any} */ (window);
    var partners=Array.isArray(W.RW_PARTNERS)?W.RW_PARTNERS:[];
    function allowed(p){
      return !!p&&p.cat==='stay'&&p.verified==='self-listed'&&p.enquiryOnly===true
       &&p.listingReady===true&&p.selfListed
       &&p.selfListed.mouVersion==='RW-PMOU-2026-09-27-V4'
       &&(!W.rwStayPublicEligible||W.rwStayPublicEligible(p));
    }
    function render(id,arr){
      var rail=document.getElementById(id);if(!rail)return;
      arr.slice(0,12).forEach(function(p){
        var key=String(p.id||'').replace(/[^a-zA-Z0-9_-]/g,'');
        if(!key||rail.querySelector('[data-rw-self-listed="'+key+'"]'))return;
        var link=document.createElement('a');
        link.className='rw-sales-card rw-new-self-listing';
        link.dataset.rwSelfListed=key;
        var params=new URLSearchParams({stay:String(p.name||''),zone:String(p.zone||'')});
        link.href='/escapes/?'+params.toString()+'#request-quote';
        link.setAttribute('aria-label','Enquire about '+String(p.name||'')+' on RoamWise');
        var art=document.createElement('div');art.className='rw-new-self-listing-art';art.textContent='🏡';
        var copy=document.createElement('span');copy.className='rw-sales-copy';
        var title=document.createElement('strong');title.textContent=String(p.name||'New RoamWise stay');
        var where=document.createElement('small');where.textContent=String(p.area||p.zone||'India')+' · New on RoamWise · Self-listed';
        var trust=document.createElement('small');trust.textContent='MOU accepted · automatic checks · enquiry only. Dates, availability and final price require confirmation.';
        var action=document.createElement('b');action.textContent='Request a quote →';
        copy.append(title,where,trust,action);link.append(art,copy);rail.append(link);
      });
    }
    var publicStays=partners.filter(allowed);
    render('rwSalesStays',publicStays);
    render('rwSalesWeddings',publicStays.filter(function(p){
      return Array.isArray(p.segments)&&p.segments.indexOf('wedding')>=0;
    }));
  }
  addPublicCards();
  document.addEventListener('rw:partners-refreshed',addPublicCards);
  var front=document.getElementById('rwPartnerFrontdoors');
  if(front&&front.hasAttribute('data-rw-fallback-hidden'))front.removeAttribute('data-rw-fallback-hidden');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);
 else ready();
})();
