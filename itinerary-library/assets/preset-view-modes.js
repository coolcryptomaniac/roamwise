/* RoamWise cached itinerary display modes: one itinerary, four presentations.
 * Runs after existing preset runtime. No data, pricing, booking or payment edits.
 * Map mode emphasises the schematic route and the explicit local-map action;
 * it does NOT claim to provide turn-by-turn directions or real-time routing.
 */
(function(root){
 'use strict';
 var ALLOWED=['cinematic','editorial','cards','map'];
 var STORAGE='rw_preset_view_v1';
 var body=document.body;
 var toolbar=document.querySelector('.hero .toolbar');
 if(!body||!toolbar||document.getElementById('rwPresetViewModes'))return;
 function valid(value){return ALLOWED.indexOf(value)>=0?value:null;}
 function saved(){
   try {return valid(root.localStorage.getItem(STORAGE));}catch(_e){return null;}
 }
 function chooseInitial(){
   var query=null;
   try{query=new URLSearchParams(root.location.search).get('view');}catch(_e){}
   return valid(query)||saved()||'cinematic';
 }
 var wrap=document.createElement('div');
 wrap.id='rwPresetViewModes';
 wrap.className='rw-preset-view-modes';
 wrap.setAttribute('role','group');
 wrap.setAttribute('aria-label','Itinerary display style');
 var label=document.createElement('span');
 label.className='rw-preset-view-label';
 label.textContent='Itinerary view';
 wrap.appendChild(label);
 var labels={
   cinematic:'🎞 Cinematic',
   editorial:'◐ Black & white',
   cards:'▤ Cards',
   map:'🗺 Map'
 };
 var buttons={};
 ALLOWED.forEach(function(mode){
   var button=document.createElement('button');
   button.type='button';
   button.dataset.rwPresetView=mode;
   button.textContent=labels[mode];
   button.setAttribute('aria-label',labels[mode]+' itinerary view');
   button.addEventListener('click',function(){setMode(mode,true);});
   buttons[mode]=button;
   wrap.appendChild(button);
 });
 var anchor=toolbar.querySelector('[data-theme]');
 toolbar.insertBefore(wrap,anchor||toolbar.firstChild);
 var note=document.createElement('p');
 note.id='rwPresetViewNote';
 note.className='rw-preset-view-note';
 note.setAttribute('role','status');
 note.setAttribute('aria-live','polite');
 wrap.after(note);
 function setMode(mode,userAction){
   mode=valid(mode)||'cinematic';
   body.dataset.rwView=mode;
   ALLOWED.forEach(function(m){
     buttons[m].setAttribute('aria-pressed',String(m===mode));
   });
   note.textContent=mode==='map'
     ? 'Schematic route only, not navigation. Tap “Open local map” to load a location map; verify actual road conditions separately.'
     : mode==='editorial'
     ? 'Editorial layout — the same trip content in a high-contrast black-and-white view.'
     : mode==='cards'
     ? 'Cards layout — all days remain visible and searchable on this page.'
     : 'Cinematic layout — swipe the day-by-day journey.';
   if(!userAction)return;
   try{root.localStorage.setItem(STORAGE,mode);}catch(_e){}
   try{
     var next=new URL(root.location.href);
     next.searchParams.set('view',mode);
     root.history.replaceState(root.history.state||null,'',next.href);
   }catch(_e){}
   if(mode==='map'){
     var section=document.querySelector('.map-panel');
     if(section&&typeof section.scrollIntoView==='function'){
       var reduce=false;
       try{reduce=root.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_e){}
       section.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
     }
   }
 }
 setMode(chooseInitial(),false);
 root.RWPresetDisplayModes={get:function(){return body.dataset.rwView;},set:function(mode){if(valid(mode))setMode(mode,true);}};
})(window);
