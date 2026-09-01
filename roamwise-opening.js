(function(){
  function initRoamwiseOpening(){
    if(document.getElementById('rwOpening')) return;
    var onceKey='rw-opening-seen';
    if(sessionStorage.getItem(onceKey)==='1') return;
    sessionStorage.setItem(onceKey,'1');
    var wrap=document.createElement('div');
    wrap.id='rwOpening';
    wrap.innerHTML=''
      +'<div class="rw-posterWrap">'
      +'<img class="rw-poster" src="assets/roamwise-opening-poster.png" alt="Roamwise opening" />'
      +'<video class="rw-video" muted playsinline preload="auto"><source src="assets/roamwise-opening.mp4" type="video/mp4"></video>'
      +'<div class="rw-matrix"></div><div class="rw-rain"></div><div class="rw-lightning"></div>'
      +'<div class="rw-brand"><h1>ROAMWISE</h1><p>SHINOBI ATLAS</p></div>'
      +'<div class="rw-loader"><div class="rw-loaderLabel">Loading</div><div class="rw-progress"><i></i></div></div>'
      +'<button class="rw-skip" type="button" aria-label="Skip intro">Skip</button>'
      +'<div class="rw-fog"></div></div>';
    document.body.appendChild(wrap);
    var video=wrap.querySelector('video');
    var skip=wrap.querySelector('.rw-skip');
    var done=false;
    function closeIntro(){
      if(done) return; done=true;
      wrap.classList.add('rw-hide');
      setTimeout(function(){wrap.remove();},560);
    }
    skip.addEventListener('click',closeIntro);
    wrap.addEventListener('click',function(e){ if(e.target===wrap) closeIntro(); });
    var timeout=setTimeout(closeIntro,6500);
    video.addEventListener('canplay',function(){wrap.classList.add('rw-video-ready'); video.play().catch(function(){});},{once:true});
    video.addEventListener('ended',closeIntro,{once:true});
    window.addEventListener('keydown',function esc(e){ if(e.key==='Escape'){ closeIntro(); window.removeEventListener('keydown',esc); }});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initRoamwiseOpening,{once:true});
  else initRoamwiseOpening();
})();
