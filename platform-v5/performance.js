/* RoamWise Platform V5 — client performance guardrails.
 * Keeps critical planner JS untouched; defers only media/enrichment that can
 * safely wait. No analytics, no third-party performance SDK.
 */
(function(){'use strict';
function conn(href,cross){if(document.querySelector(`link[href="${href}"]`))return;const l=document.createElement('link');l.rel='preconnect';l.href=href;if(cross)l.crossOrigin='anonymous';document.head.appendChild(l)}
function tuneImg(img){if(img.dataset.rwPerf==='1')return;img.dataset.rwPerf='1';if(!img.hasAttribute('loading')&&!img.closest('.intro,.nav,.rw-v5-hero'))img.loading='lazy';if(!img.hasAttribute('decoding'))img.decoding='async';if(!img.hasAttribute('fetchpriority')&&!img.closest('.intro,.nav,.rw-v5-hero'))img.fetchPriority='low'}
function tuneVideo(v){if(v.dataset.rwPerf==='1')return;v.dataset.rwPerf='1';if(!v.autoplay||navigator.connection?.saveData)v.preload='none';else v.preload='metadata';if(navigator.connection?.saveData){v.autoplay=false;v.removeAttribute('autoplay')}}
function tuneFrame(f){if(f.dataset.rwPerf==='1')return;f.dataset.rwPerf='1';if(!f.hasAttribute('loading'))f.loading='lazy'}
function tune(root=document){root.querySelectorAll?.('img').forEach(tuneImg);root.querySelectorAll?.('video').forEach(tuneVideo);root.querySelectorAll?.('iframe').forEach(tuneFrame)}
function boot(){conn('https://fonts.gstatic.com',true);tune();const mo=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.matches?.('img'))tuneImg(n);else if(n.matches?.('video'))tuneVideo(n);else if(n.matches?.('iframe'))tuneFrame(n);tune(n)})));mo.observe(document.documentElement,{subtree:true,childList:true});if('requestIdleCallback'in window)requestIdleCallback(()=>{try{document.querySelectorAll('link[rel="preload"][as="video"]').forEach(x=>x.remove())}catch(_){}},{timeout:2500})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
