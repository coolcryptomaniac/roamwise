/* Ailon-first homepage: one curated category at a time.
 * Never reprice, change booking state, or submit an enquiry from navigation.
 * The existing rails remain intact as a readable no-JS fallback.
 */
(function(){
 'use strict';
 var GROUPS={
   stays:['rwSalesStays','rwSalesPackages','rwSalesWeddings'],
   itineraries:['rwSalesItineraries'],
   artists:['rwSalesArtists'],
   shop:['rwSalesShop'],
   teams:['rwSalesCorporate'],
   weddings:['rwSalesWeddings'],
   adventures:['rwTreksRail','rwEventsRail']
 };
 var TITLES={stays:'Stays & packages',itineraries:'Itineraries',artists:'Artists',shop:'Shop',teams:'Corporate',weddings:'Weddings',adventures:'Treks & events'};
 function mount(){
  var section=document.getElementById('rwSalesCarousels'),nav=document.getElementById('rwDiscoverFilters');
  if(!section||!nav||nav.dataset.ready==='1')return;
  nav.dataset.ready='1';
  // The APK intentionally does not bundle 192 large itinerary PDFs. Open the
  // published HTML/PDF and specialist web pages by HTTPS from its local WebView.
  try {
    var app=/** @type {any} */ (window);
    var isNative=location.protocol==='file:' || !!(app.Capacitor&&app.Capacitor.isNativePlatform&&app.Capacitor.isNativePlatform());
    if(isNative){
      [].slice.call(section.querySelectorAll('a[href]')).forEach(function(a){
        var href=a.getAttribute('href')||'';
        if(href.indexOf('/itinerary-library/')===0 || href.indexOf('/corporate/')===0)
          a.href='https://www.roamwise.co.in'+href;
      });
    }
  }catch(e){ /* web links remain valid as ordinary relative URLs */ }
  var groups={};
  Object.keys(GROUPS).forEach(function(cat){
   groups[cat]=[];
   GROUPS[cat].forEach(function(id){
    var rail=document.getElementById(id);
    if(!rail)return;
    var wrap=(id==='rwTreksRail'||id==='rwEventsRail')?rail:null;
    if(wrap){groups[cat].push(wrap);return;}
    var heading=section.querySelector('.rw-trackheading [data-rw-next="'+id+'"]');
    heading=heading&&heading.closest('.rw-trackheading');
    if(heading)groups[cat].push(heading);
    if(heading){
      var sibling=heading.nextElementSibling;
      while(sibling&&sibling!==rail&&sibling.classList&&!sibling.classList.contains('rw-trackheading')){
        // Only the intro paragraph belongs to this rail, never unrelated blocks.
        if(sibling.tagName!=='P')break;
        groups[cat].push(sibling);
        sibling=sibling.nextElementSibling;
      }
    }
    groups[cat].push(rail);
   });
  });
  var active='stays';
  try{var saved=sessionStorage.getItem('rw_discovery_category');if(GROUPS[saved])active=saved;}catch(e){}
  nav.replaceChildren();
  Object.keys(GROUPS).forEach(function(cat){
   var button=document.createElement('button');
   button.type='button';button.className='rw-discover-filter';
   button.textContent=TITLES[cat];button.dataset.category=cat;
   button.addEventListener('click',function(){select(cat,true);});
   nav.appendChild(button);
  });
  function select(cat,scroll){
   active=cat;
   /* The Weddings rail intentionally belongs to both Stays and Weddings.
      Apply visibility once per DOM node, not once per category: otherwise
      whichever category is visited last can incorrectly hide a shared rail. */
   var shown=groups[cat]||[],visited=[];
   Object.keys(groups).forEach(function(key){
    groups[key].forEach(function(node){
     if(!node||visited.indexOf(node)!==-1)return;
     visited.push(node);
     node.hidden=shown.indexOf(node)===-1;
     // Dynamic rails must contain approved cards before being revealed.
     if(!node.hidden&&(node.id==='rwEventsRail'||node.id==='rwTreksRail')){
       var inner=node.querySelector('.rw-sales-track');
       if(!inner||!inner.querySelector('.rw-sales-card'))node.hidden=true;
     }
    });
   });
   [].slice.call(nav.querySelectorAll('button')).forEach(function(b){
      var is=b.dataset.category===cat;
      b.classList.toggle('selected',is);
      b.setAttribute('aria-pressed',String(is));
   });
   var status=document.getElementById('rwDiscoverTitle');
   if(status)status.textContent=TITLES[cat];
   try{sessionStorage.setItem('rw_discovery_category',cat);}catch(e){}
   if(scroll){var first=groups[cat].find(function(n){return n&&!n.hidden&&n.classList&&n.classList.contains('rw-sales-track');});if(first)first.scrollLeft=0;}
  }
  select(active,false);
  // Dynamic event/trek arrivals should never silently switch the user's tab.
  // If they arrive while Adventures is open, reveal their approved wrapper.
  if(window.MutationObserver){
    ['rwTreksRail','rwEventsRail'].forEach(function(id){
      var wrapper=document.getElementById(id);if(!wrapper)return;
      var inner=wrapper.querySelector('.rw-sales-track');if(!inner)return;
      var observer=new MutationObserver(function(){
        if(active==='adventures'&&inner.querySelector('.rw-sales-card'))wrapper.hidden=false;
      });
      observer.observe(inner,{childList:true,subtree:false});
    });
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
 else mount();
})();
