/* Approved, static-first media manifest for the destination swipe rail.
 * Has no third-party image API calls and is safe when R2/D1 are unavailable.
 * A separate reader Worker can generate a versioned approved manifest later.
 */
(function(root){
 'use strict';
 var MANIFEST='/media/destination-manifest-v1.json';
 var remoteEnabled=false;
 var REMOTE='https://assets.roamwise.co.in/v1/media-manifest';
 var LICENSES=['owned','licensed','public-domain'];
 function safeUrl(src){
  if(typeof src!=='string'||src.length>450||/[\\?#]/.test(src)||/%2e/i.test(src))return false;
  if(/^\/(?:assets|media)\/[a-zA-Z0-9_./%-]+$/.test(src)&&src.indexOf('..')===-1&&src.indexOf('//')===-1)return true;
  try{
   var url=new URL(src);
   return url.protocol==='https:' && url.hostname==='assets.roamwise.co.in'
     && /^\/media\/[a-zA-Z0-9_./%-]+$/.test(url.pathname)
     && !url.username&&!url.password&&!url.search&&!url.hash&&!url.pathname.includes('..');
  }catch(_e){return false;}
 }
 function validate(json){
  var result={};
  if(!json||json.version!==1||!json.assets||Array.isArray(json.assets)||typeof json.assets!=='object')return result;
  Object.keys(json.assets).slice(0,1000).forEach(function(slug){
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return;
   var a=json.assets[slug];
   if(!a||a.status!=='published'||LICENSES.indexOf(a.rightsStatus)<0
      ||typeof a.licenseProof!=='string'||a.licenseProof.trim().length<12
      ||typeof a.alt!=='string'||!a.alt.trim()
      ||!safeUrl(a.src))return;
   result[slug]={src:a.src,note:String(a.note||'Licensed destination image').slice(0,130),
     alt:a.alt.slice(0,180),status:a.status,rightsStatus:a.rightsStatus,
     licenseProof:a.licenseProof};
  });
  return result;
 }
 async function loadRemote(){
  try{
   var res=await root.fetch(REMOTE,{credentials:'omit',mode:'cors',referrerPolicy:'no-referrer',redirect:'error',signal:AbortSignal.timeout(3000)});
   if(!res.ok)return {};
   var data=await res.json();if(data.ready!==true)return {};
   var approved=validate(data);
   /** @type {any} */ (root).RW_DEST_MEDIA=Object.assign({},/** @type {any} */(root).RW_DEST_MEDIA||{},approved);
   if(typeof root.dispatchEvent==='function'&&typeof root.CustomEvent==='function')root.dispatchEvent(new root.CustomEvent('rw:destination-media-ready'));
   return approved;
  }catch(_e){return {};}
 }
 async function load(){
  if(typeof root.fetch!=='function')return {};
  try{
   var res=await root.fetch(MANIFEST,{credentials:'omit',cache:'default'});
   if(!res.ok)return {};
   var data=await res.json();remoteEnabled=data&&data.remoteReady===true;
   var approved=validate(data);
   /** @type {any} */ (root).RW_DEST_MEDIA=approved;
   if(typeof root.dispatchEvent==='function'&&typeof root.CustomEvent==='function')
     root.dispatchEvent(new root.CustomEvent('rw:destination-media-ready'));
   return approved;
  }catch(_e){return {};}
 }
 /** @type {any} */ (root).RWDestinationMedia={validate:validate,safeUrl:safeUrl,load:load,loadRemote:loadRemote};
 function start(){load().then(function(){if(remoteEnabled)loadRemote();});}
 if(document.readyState==='complete')start();
 else document.addEventListener('DOMContentLoaded',start,{once:true});
})(window);
