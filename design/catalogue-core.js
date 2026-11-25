/* Shared validator. Only bounded design data; no HTML, CSS, URLs or executable templates. */
(function(root, factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RWDesignSchema=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var keys=['amber','coral','violet','teal','ink','plum','gold','cream'];
  function number(n,min,max){return typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;}
  function label(s){return typeof s==='string'&&s.length>0&&s.length<=100&&!/[<>\x00-\x1f]/.test(s);}
  function validate(d){
    try{
      if(!d||JSON.stringify(d).length>16000||d.schemaVersion!==1||!/^20\d{2}-\d{2}-\d{2}\.\d{1,3}$/.test(d.version)||!label(d.name))return false;
      if(!keys.every(function(k){return /^#[0-9a-f]{6}$/i.test(d.colors[k]);}))return false;
      if(!['ailon','spectrum','founder'].every(function(k){var b=d.borders[k];return b&&number(b.width,1,4)&&number(b.duration,8,40)&&Array.isArray(b.colors)&&b.colors.length>=3&&b.colors.length<=6&&b.colors.every(function(c){return keys.indexOf(c)>=0;});}))return false;
      if(!['ailon','travel','credit'].every(function(k){var c=d.cards[k];return c&&['ailon','spectrum','founder'].indexOf(c.border)>=0&&keys.indexOf(c.surface)>=0&&number(c.radius,12,32);}))return false;
      var a=d.animations,c=d.carousel;
      if(a.border.recipe!=='gradient-orbit'||typeof a.border.enabled!=='boolean'||a.hover.recipe!=='lift'||!number(a.hover.distance,0,5)||!number(a.hover.duration,100,500)||a.credit.recipe!=='soft-sheen'||!number(a.credit.duration,12,40))return false;
      if(!number(c.interval,5000,15000)||typeof c.autoplay!=='boolean'||!number(c.gap,8,24)||!number(c.cardWidth,240,380)||['mandatory','proximity'].indexOf(c.snap)<0||c.pauseOnInteraction!==true)return false;
      var ids=['himalayan-saanjh','kasar-cloud','buransh-bazaar'];
      if(!Array.isArray(d.editions)||d.editions.length!==3||!ids.every(function(id){return d.editions.filter(function(e){return e.id===id&&label(e.name)&&label(e.desc);}).length===1;}))return false;
      if(JSON.stringify(d.moods)!==JSON.stringify(['default','rave','odyssey','aipan']))return false;
      var recipes={'ailon-composer':'ailon','travel-card':'travel','founder-credit':'credit','wallet-card':'credit','swipe-carousel':'carousel'};
      return Array.isArray(d.components)&&d.components.length===5&&Object.keys(recipes).every(function(id){return d.components.filter(function(x){return x.id===id&&x.recipe===recipes[id]&&label(x.name);}).length===1;});
    }catch(e){return false;}
  }
  return {validate:validate};
});
