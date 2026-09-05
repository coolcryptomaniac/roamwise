// @ts-nocheck
// POST-TRIP MEMORIES STUDIO — extracted verbatim from app.js (modularization
// round 4). Auto-generates a shareable trip blog via AI, a photo collage
// (canvas-composited), and a lightweight memory log, all reachable from the
// "Trip memories & blog" drawer link and from the itinerary's post-trip CTA
// (js/itinerary/build.js). Uses runtime globals from app.js (showToast, el,
// esc2, saveOrDownload, lsGet/lsSet) and js/copilot/ai-providers.js
// (aiCallAny) — all resolved at call time, so load order doesn't matter.
/* ==================== POST-TRIP MEMORIES STUDIO ====================
   After a trip: auto-generate a blog (Medium/Reddit/X ready), a photo collage,
   and a memory log. Cross-post via the share sheet to text platforms; collages
   download for Instagram/Facebook (those need manual upload — no web post API). */
function openMemories(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var it=window._lastItin;
  var dest=(it&&it.name)||'';
  if(!dest){ try{ showToast('Plan or finish a trip first \u2014 then turn it into a story \u270d\ufe0f'); }catch(e){ /* toast is a nice-to-have, ignore */ }; return; }
  var sec=el('memSection');
  if(!sec){ sec=document.createElement('section'); sec.id='memSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\u270d\ufe0f Trip <em>memories</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'memSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Turn your '+esc2(dest)+' trip into a blog, a collage, and a keepsake log \u2014 then share it.</p>'
    +'<div class="mem-tabs">'
      +'<button class="mem-tab on" onclick="rwMemTab(this,\'blog\')">\ud83d\udcdd Blog</button>'
      +'<button class="mem-tab" onclick="rwMemTab(this,\'collage\')">\ud83d\uddbc\ufe0f Collage</button>'
      +'<button class="mem-tab" onclick="rwMemTab(this,\'log\')">\ud83d\udcd3 Memory log</button>'
    +'</div>'
    +'<div id="memBlog" class="mem-pane"><button class="tact" style="width:100%;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwGenBlog()">\u2728 Write my trip blog</button><div id="memBlogOut" style="margin-top:12px"></div></div>'
    +'<div id="memCollage" class="mem-pane" style="display:none"><p class="note">Add up to 6 photos from your trip \u2014 RoamWise arranges them into a shareable collage.</p>'
      +'<input type="file" id="memPhotos" accept="image/*" multiple onchange="rwCollagePreview()" style="margin:8px 0">'
      +'<canvas id="memCanvas" style="width:100%;border-radius:14px;display:none;border:1px solid var(--b2)"></canvas>'
      +'<div id="memCollageBtns"></div></div>'
    +'<div id="memLog" class="mem-pane" style="display:none"><div id="memLogOut"></div></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
  rwRenderLog();
}
function rwMemTab(btn,which){
  document.querySelectorAll('.mem-tab').forEach(function(b){b.classList.remove('on');}); btn.classList.add('on');
  ['blog','collage','log'].forEach(function(k){ var p=el('mem'+k.charAt(0).toUpperCase()+k.slice(1)); if(p) p.style.display=(k===which?'':'none'); });
}
function rwGenBlog(){
  var it=window._lastItin; var dest=(it&&it.name)||'my trip';
  var stops=(typeof rwDeriveStops==='function')?rwDeriveStops(dest):[];
  var stopList=stops.map(function(s){return s.name;}).join(', ');
  var out=el('memBlogOut'); out.innerHTML='<div class="note">\u270d\ufe0f Writing your story\u2026</div>';
  var prompt='Write a warm, vivid first-person travel blog post about a trip to '+dest+'.'
    +(stopList?' Places visited: '+stopList+'.':'')
    +' 300-400 words, engaging and personal, with a short catchy title on the first line. Evocative but honest \u2014 no clich\u00e9 overload. End with one practical tip for future travellers. Plain text, no markdown headers.';
  if(typeof aiCallAny==='function'){
    aiCallAny(prompt, 700, function(err,txt){
      if(!txt){ out.innerHTML='<div class="note">Couldn\u2019t reach the AI engine. Add a free AI key in Settings for blog generation, then try again.</div>'; return; }
      var title=txt.split('\n')[0].replace(/^#+\s*/,'');
      window._rwBlog={title:title,body:txt};
      out.innerHTML='<div class="mem-blog"><h3 style="margin:0 0 8px">'+esc2(title)+'</h3><div style="white-space:pre-wrap;font-size:13.5px;line-height:1.7;color:var(--t1)">'+esc2(txt.split('\n').slice(1).join('\n').trim())+'</div></div>'
        +'<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">'
        +'<button class="tact" style="flex:1;min-width:120px" onclick="rwBlogCopy()">\ud83d\udccb Copy</button>'
        +'<button class="tact" style="flex:1;min-width:120px" onclick="rwBlogCrosspost()">\ud83d\ude80 Cross-post</button></div>'
        +'<div style="font-size:11px;color:var(--t3);margin-top:8px">Cross-post opens Medium, Reddit, X or Dev.to with your draft ready. Instagram/Facebook: use the collage tab.</div>';
      try{ rwSaveMemory('blog', dest, title); }catch(e){ /* best-effort, ignore */ }
    });
  } else { out.innerHTML='<div class="note">AI engine unavailable.</div>'; }
}
function rwBlogCopy(){ if(window._rwBlog){ try{ navigator.clipboard.writeText(_rwBlog.title+'\n\n'+_rwBlog.body); showToast('Blog copied \u2713'); }catch(e){ /* clipboard best-effort, ignore */ } } }
function rwBlogCrosspost(){
  if(!window._rwBlog) return;
  try{ navigator.clipboard.writeText(_rwBlog.title+'\n\n'+_rwBlog.body); }catch(e){ /* clipboard best-effort, ignore */ }
  var title=encodeURIComponent(_rwBlog.title), url=encodeURIComponent('https://roamwise.co.in');
  var ov=el('rwShareOverlay')||document.createElement('div');
  ov.id='rwShareOverlay'; ov.className='share-overlay'; ov.onclick=function(e){if(e.target===ov)rwCloseShare();};
  if(!ov.parentNode) document.body.appendChild(ov);
  var sites=[
    {l:'Medium',e:'\u270d\ufe0f',h:'https://medium.com/new-story'},
    {l:'Reddit',e:'\ud83d\udc7d',h:'https://www.reddit.com/submit?title='+title+'&url='+url},
    {l:'Dev.to',e:'\ud83d\udcbb',h:'https://dev.to/new'},
    {l:'X',e:'\u2715',h:'https://twitter.com/intent/tweet?text='+title+'&url='+url},
    {l:'Blogger',e:'\ud83d\udcd8',h:'https://www.blogger.com/blog/post/edit'},
    {l:'LinkedIn',e:'\ud83d\udcbc',h:'https://www.linkedin.com/feed/?shareActive=true'}
  ];
  ov.innerHTML='<div class="share-modal-inner"><div class="share-head">Cross-post your blog</div>'
    +'<p class="note" style="text-align:center;margin:-6px 0 12px">Your draft is copied \u2014 paste it after the site opens.</p>'
    +'<div class="share-grid">'+sites.map(function(s){return '<button class="share-cell" onclick="window.open(\''+s.h+'\',\'_blank\');rwCloseShare()"><span class="share-emoji">'+s.e+'</span><span>'+s.l+'</span></button>';}).join('')+'</div>'
    +'<button class="tact" style="width:100%" onclick="rwCloseShare()">Close</button></div>';
  ov.style.display='flex';
}
/* ---- Photo collage (canvas) ---- */
function rwCollagePreview(){
  var files=(el('memPhotos').files)||[]; if(!files.length) return;
  var imgs=[]; var loaded=0; var n=Math.min(files.length,6);
  for(var i=0;i<n;i++){ (function(f){ var img=new Image(); img.onload=function(){ imgs.push(img); if(++loaded===n) rwDrawCollage(imgs); }; img.src=URL.createObjectURL(f); })(files[i]); }
}
function rwDrawCollage(imgs){
  var c=el('memCanvas'); var W=1080,H=1080; c.width=W;c.height=H; var ctx=c.getContext('2d');
  ctx.fillStyle='#0B0E16'; ctx.fillRect(0,0,W,H);
  var n=imgs.length;
  var grid = n<=1?[1,1]: n<=2?[2,1]: n<=4?[2,2]: [3,2];
  var cols=grid[0], rows=grid[1], pad=14;
  var cw=(W-pad*(cols+1))/cols, ch=(H-90-pad*(rows+1))/rows;
  imgs.forEach(function(img,i){
    var cx=i%cols, cy=Math.floor(i/cols);
    var x=pad+cx*(cw+pad), y=pad+cy*(ch+pad);
    var ar=img.width/img.height, tar=cw/ch, sw,sh,sx,sy;
    if(ar>tar){ sh=img.height; sw=sh*tar; sx=(img.width-sw)/2; sy=0; } else { sw=img.width; sh=sw/tar; sx=0; sy=(img.height-sh)/2; }
    ctx.save(); rwRoundRect(ctx,x,y,cw,ch,12); ctx.clip(); ctx.drawImage(img,sx,sy,sw,sh,x,y,cw,ch); ctx.restore();
  });
  var dest=(window._lastItin&&_lastItin.name)||'My Trip';
  ctx.fillStyle='#E8BA6C'; ctx.font='bold 40px system-ui,sans-serif'; ctx.textAlign='center';
  ctx.fillText(dest+' \u2708\ufe0f', W/2, H-34);
  ctx.fillStyle='rgba(237,232,223,.6)'; ctx.font='500 20px system-ui,sans-serif';
  ctx.fillText('made on RoamWise', W/2, H-14);
  c.style.display='block';
  el('memCollageBtns').innerHTML='<div style="display:flex;gap:8px;margin-top:10px"><button class="tact" style="flex:1;font-weight:800" onclick="rwCollageSave()">\u2b07\ufe0f Save collage</button><button class="tact" style="flex:1;font-weight:800" onclick="rwCollageShare()">\ud83d\udce4 Share</button></div><div style="font-size:11px;color:var(--t3);margin-top:6px">Save it, then post to Instagram or Facebook (they need manual upload).</div>';
  try{ rwSaveMemory('collage', dest, imgs.length+' photos'); }catch(e){ /* best-effort, ignore */ }
}
function rwRoundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function rwCollageSave(){ var c=el('memCanvas'); if(c){ try{ saveOrDownload(c.toDataURL('image/jpeg',0.92),'roamwise-collage.jpg'); }catch(e){ showToast('Long-press the collage to save'); } } }
function rwCollageShare(){
  var c=el('memCanvas'); if(!c) return;
  c.toBlob(function(b){
    var f=new File([b],'roamwise-collage.jpg',{type:'image/jpeg'});
    if(navigator.share && navigator.canShare && navigator.canShare({files:[f]})){
      navigator.share({files:[f], text:'My '+((window._lastItin&&_lastItin.name)||'trip')+' \u2708\ufe0f made on RoamWise'}).catch(function(){});
    } else { rwCollageSave(); showToast('Saved \u2014 upload it to Instagram/Facebook'); }
  },'image/jpeg',0.92);
}
/* ---- Memory log ---- */
function rwSaveMemory(kind, dest, detail){
  var log=[]; try{ log=JSON.parse(lsGet('rw_memlog')||'[]'); }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  log.unshift({kind:kind,dest:dest,detail:detail,at:Date.now()});
  try{ lsSet('rw_memlog', JSON.stringify(log.slice(0,50))); }catch(e){ /* storage best-effort, ignore */ }
}

