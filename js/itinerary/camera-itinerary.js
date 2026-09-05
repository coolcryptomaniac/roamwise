// @ts-nocheck
// Moved verbatim from app.js — Camera -> Itinerary: reads travel places out
// of a screenshot via the user's own Gemini vision key. Called from
// index.html (onclick="scanImageOpen()").
/* ==================== CAMERA -> ITINERARY ====================
   Screenshot a reel, a blog, a handwritten list — the model reads it and pulls
   out the places. Vision needs a multimodal model, so this runs on the user's
   own Gemini key (its free tier is vision-capable). No key, no fake demo: it
   says what it needs and offers the wizard. */
function scanImageOpen(){
  /* Route output to the log the user is actually looking at — the default
     target is the overlay log, so this message was being written off-screen. */
  _cpTargetLog='heroLog';
  var hl=el('heroLog'); if(hl) hl.style.display='block';
  var key = lsGet('rwKey_gemini');
  if(!key){
    /* Explain what the feature does, what it needs and why — a bare "add a key"
       told people nothing, and tapping again just stacked the same message. */
    var log = el('heroLog');
    if(log && log.dataset.camNote==='1'){ showToast('\ud83d\udcf8 Still needs a free Gemini key \u2014 see the note above'); return; }
    if(log) log.dataset.camNote='1';
    cpBubble('<b>\ud83d\udcf8 Scan a screenshot into a trip</b><br>'
      +'Send a screenshot of a reel, a blog, or a handwritten list \u2014 I read the place names out of the image and give you a <b>Plan</b> button for each one.<br><br>'
      +'<b>What it needs:</b> a free Google Gemini key (vision is on their free tier).<br>'
      +'<b>Cost:</b> nothing \u2014 it runs on your key, and the image never touches RoamWise servers.<br>'
      +'<b>Setup:</b> about 2 minutes.<br><br>'
      +'<button class="tact" style="font-size:12px;padding:6px 12px;font-weight:800" onclick="openWizard()">Get a free key \u2192</button>', 'bot');
    return;
  }
  var inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.onchange=function(){ if(inp.files && inp.files[0]) scanImageRun(inp.files[0], key); };
  inp.click();
}
function scanImageRun(file, key){
  _cpTargetLog='heroLog'; var hl=el('heroLog'); if(hl) hl.style.display='block';
  cpBubble('\ud83d\udcf8 Reading '+String(file.name).replace(/[<>]/g,'')+'\u2026','me');
  var thinking=cpBubble('\u2026','bot');
  var fr=new FileReader();
  fr.onload=function(){
    var b64=String(fr.result).split(',')[1];
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+key,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{parts:[
        {text:'List every real-world travel place in this image (cities, neighbourhoods, restaurants, viewpoints, hotels, trails). Reply ONLY with JSON: {"places":[{"name":"...","kind":"city|food|sight|stay","note":"one short clause"}]}. No prose, no markdown fences. If none, return {"places":[]}.'},
        {inline_data:{mime_type:file.type||'image/jpeg', data:b64}}
      ]}]})
    }).then(function(r){ return r.json(); }).then(function(d){
      var txt='';
      try{ txt=d.candidates[0].content.parts.map(function(p){return p.text||'';}).join(''); }catch(e){}
      var out=null; try{ out=JSON.parse(txt.replace(/```json|```/g,'').trim()); }catch(e){}
      if(!out || !out.places || !out.places.length){
        thinking.innerHTML='I couldn\u2019t find recognisable places in that image. A screenshot with visible place names or captions works best.';
        return;
      }
      thinking.innerHTML='\ud83d\udccd Found '+out.places.length+' place(s):<br><br>'
        + out.places.slice(0,8).map(function(pl){
            var nm=String(pl.name).replace(/[<>']/g,'');
            return '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--b2,#2A2A36)">'
              +'<div><b>'+nm+'</b>'+(pl.note?'<div style="font-size:11px;color:var(--t3)">'+String(pl.note).replace(/[<>]/g,'')+'</div>':'')+'</div>'
              +'<button class="tact" style="font-size:11px;padding:5px 9px;flex:0 0 auto" onclick="cpGoPlan(\''+nm+'\')">Plan \u2192</button></div>';
          }).join('')
        +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Read from your image by Gemini on your own key \u2014 nothing was uploaded to RoamWise.</div>';
      try{ track('img_scans'); }catch(e){}
    }).catch(function(e){ thinking.innerHTML='Scan failed: '+(e.message||e); });
  };
  fr.readAsDataURL(file);
}
