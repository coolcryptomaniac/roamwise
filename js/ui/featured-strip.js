// @ts-nocheck
/* js/ui/featured-strip.js - "Featured" strip under the planner on the home page.
   Reads /featured/featured.json (edited only after a payment and listing are confirmed). Shows paid partners labelled "Featured",
   highest slot first, hides anything past its end date. When nobody is featured it shows a single invitation tile instead.
   Nothing is collected here and no personal data is read. */
(function(){
  var host=document.getElementById('rwFeatured');if(!host)return;
  var CSS='#rwFeatured{margin:10px 14px 6px;max-width:760px;box-sizing:border-box;color:#F2EFE6}@media(min-width:800px){#rwFeatured{margin-left:auto;margin-right:auto}}'
   +'#rwFeatured .fs-h{display:flex;justify-content:space-between;align-items:baseline;margin:0 2px 8px}#rwFeatured .fs-h b{font-size:11px;letter-spacing:.14em;color:#e8ba6c}#rwFeatured .fs-h a{font-size:12px;color:#e8ba6c;font-weight:700;text-decoration:none}'
   +'#rwFeatured .fs-r{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;margin:0 -14px;padding:2px 14px 6px}#rwFeatured .fs-r::-webkit-scrollbar{display:none}'
   +'#rwFeatured .fs-c{flex:0 0 78%;max-width:300px;scroll-snap-align:start;display:block;padding:12px 14px;border-radius:16px;border:1px solid rgba(232,186,108,.4);background:linear-gradient(160deg,#1b1226,#0f0a18);color:inherit;text-decoration:none}'
   +'#rwFeatured .fs-c:focus-visible{outline:2px solid #FFE0AE;outline-offset:2px}#rwFeatured .fs-t{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.12em;color:#1a1208;background:#e8ba6c;border-radius:6px;padding:2px 6px}'
   +'#rwFeatured .fs-c b{display:block;margin:6px 0 2px;font-size:15px}#rwFeatured .fs-c small{display:block;font-size:12px;line-height:1.4;opacity:.8}';
  var s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function safe(u){try{var x=new URL(u,location.href);return /^https?:$/.test(x.protocol)?x.href:'#';}catch(_){return '#';}}
  function today(){return new Date(Date.now()+19800000).toISOString().slice(0,10);}
  function render(items){
    var live=(items||[]).filter(function(i){return i&&i.name&&i.href&&(!i.until||i.until>=today());})
      .sort(function(a,b){return (b.tier||0)-(a.tier||0)||String(a.until).localeCompare(String(b.until));}).slice(0,8);
    var cards=live.map(function(i){return '<a class="fs-c" href="'+esc(safe(i.href))+'" rel="noopener sponsored"><span class="fs-t">FEATURED</span><b>'+esc(i.name)+'</b><small>'+esc([i.kind,i.town].filter(Boolean).join(' · '))+(i.blurb?'<br>'+esc(i.blurb):'')+'</small></a>';});
    if(!cards.length)cards=['<a class="fs-c" href="/feature/"><span class="fs-t">YOUR SPOT</span><b>Be featured here</b><small>Stays, artists, creators, music, transport, colleges and local businesses. From ₹500.</small></a>'];
    host.innerHTML='<div class="fs-h"><b>FEATURED ON ROAMWISE</b><a href="/feature/">Get featured &rarr;</a></div><div class="fs-r">'+cards.join('')+'</div>';
  }
  fetch('/featured/featured.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():{items:[]};}).catch(function(){return {items:[]};}).then(function(d){render(d&&d.items);});
})();
