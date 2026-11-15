// @ts-nocheck
/* Shared carousel gesture feedback: one optional light haptic per explicit
   card activation or snapped swipe, no audio, no passive background vibrations.
   Respect reduced motion and preserve existing click/touch handlers. */
(function(){
 'use strict';
 if(typeof document==='undefined')return;
 var css=document.createElement('style');css.id='rwCarouselFeedbackStyles';
 css.textContent=
 '.rw-sales-track,.rwx-track,.rwa-track,.rw-cards-track,[data-rw-carousel]{overscroll-behavior-x:contain;scroll-padding-inline:12px;-webkit-overflow-scrolling:touch}'+
 '.rw-sales-card,.rwx-card,.rw-card,.rw-arrow,[data-rw-prev],[data-rw-next]{-webkit-tap-highlight-color:transparent;touch-action:manipulation}'+
 '.rw-sales-card:focus-visible,.rwx-card:focus-visible,.rw-card:focus-visible,.rw-arrow:focus-visible{outline:3px solid #f7d68a!important;outline-offset:3px}'+
 '@media(prefers-reduced-motion:no-preference){.rw-sales-card,.rwx-card,.rw-card,.rw-arrow,[data-rw-prev],[data-rw-next]{transition:transform .17s ease,box-shadow .17s ease,filter .17s ease}'+
 '.rw-sales-card.rw-touch-active,.rwx-card.rw-touch-active,.rw-card.rw-touch-active,.rw-arrow.rw-touch-active{transform:scale(.978)!important;filter:brightness(1.07)}'+
 '@media(hover:hover){.rw-sales-card:hover,.rwx-card:hover,.rw-arrow:hover{transform:translateY(-3px);box-shadow:0 8px 22px #0005}}}';
 document.head.appendChild(css);
 var clickable='.rw-sales-card,.rwx-card,.rw-card,.rw-arrow,[data-rw-prev],[data-rw-next],[data-rw-event],[data-rw-event-all],.rwm-btn,.rwm-ghost';
 var tracks='.rw-sales-track,.rwx-track,.rwa-track,.rwm-track,.rw-cards-track,[data-rw-carousel],[id*="carousel" i]';
 var down=null,lastTap=0,lastSwipe=0;
 function haptic(){
  var now=Date.now();if(now-lastTap<260)return;lastTap=now;
  try{if(typeof rwHaptic==='function')rwHaptic('light');}catch(e){}
 }
 function target(el,selector){return el&&typeof el.closest==='function'?el.closest(selector):null;}
 document.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  var button=target(e.target,clickable);
  if(button){down={el:button,x:e.clientX,y:e.clientY};button.classList.add('rw-touch-active');}
 },{passive:true});
 document.addEventListener('pointerup',function(e){
  if(!down)return;
  var active=down;down=null;active.el.classList.remove('rw-touch-active');
  if(Math.abs(e.clientX-active.x)<18 && Math.abs(e.clientY-active.y)<18)haptic();
 },{passive:true});
 document.addEventListener('pointercancel',function(){
  if(down){down.el.classList.remove('rw-touch-active');down=null;}
 },{passive:true});
 document.addEventListener('keydown',function(e){
  if((e.key==='Enter'||e.key===' ')&&target(e.target,clickable))haptic();
 });
 var positions=new WeakMap();
 document.addEventListener('scroll',function(e){
  var track=target(e.target,tracks);
  if(!track || track.scrollWidth<=track.clientWidth+20)return;
  var now=Date.now(),x=track.scrollLeft,previous=positions.get(track);
  if(previous && Math.abs(x-previous.x)>=100 && now-lastSwipe>420){
   lastSwipe=now;haptic();positions.set(track,{x:x});
  }else if(!previous){positions.set(track,{x:x});}
 },{capture:true,passive:true});
})();
