(function(){
 'use strict';
 function ready(){
  var engine=window.RWDesignEngine;if(!engine)return;
  var animation=document.getElementById('animate'),edition=document.getElementById('edition');
  animation.checked=document.documentElement.getAttribute('data-rw-motion')==='on';
  animation.addEventListener('change',function(){engine.setMotion(animation.checked?'auto':'off');});
  edition.value=window.RWDesignVault.current();edition.addEventListener('change',function(){window.RWDesignVault.select(edition.value);});
  function status(){document.getElementById('catalogueStatus').textContent='Collection '+engine.get().version+' · '+(engine.source()==='database'?'Saved collection connected':engine.source()==='cached'?'Saved on this device':'Included offline collection');}
  document.addEventListener('rw:design-catalogue',status);status();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
