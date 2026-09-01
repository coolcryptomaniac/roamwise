/* RoamWise Platform V6 — canonical cinematic opening.
 * One startup runtime only. Uses the approved RoamWise portrait film asset,
 * responsive desktop framing, graceful poster/GIF fallback, rain, lightning
 * and Matrix-inspired atmosphere. The legacy #intro is suppressed in rw-config.
 */
(function(){
  'use strict';

  var ROOT_ID = 'rwOpening';
  var DURATION = Number((((window.RW_CONFIG||{}).intro||{}).cinematicDurationMs) || 6800);
  var SHOULD_SHOW = window.__RW_INTRO_SHOULD_SHOW === true;

  function removeLegacy(){
    var legacy = document.getElementById('intro');
    if (legacy) legacy.remove();
  }

  function finishBoot(){
    document.documentElement.classList.add('rw-opening-mounted');
  }

  if (!SHOULD_SHOW) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ removeLegacy(); finishBoot(); }, {once:true});
    } else {
      removeLegacy(); finishBoot();
    }
    return;
  }

  var css = `
  #${ROOT_ID}{
    --rw-violet:#7b38ff;--rw-pink:#ff3fbd;--rw-hot:#ff566e;--rw-gold:#ffd06f;
    position:fixed;inset:0;z-index:2147483000;overflow:hidden;isolation:isolate;
    display:grid;place-items:center;background:
      radial-gradient(circle at 48% 16%,rgba(119,46,255,.50),transparent 39%),
      radial-gradient(circle at 74% 67%,rgba(255,43,153,.31),transparent 37%),
      radial-gradient(circle at 20% 76%,rgba(136,20,89,.34),transparent 38%),
      linear-gradient(145deg,#130621 0%,#260824 48%,#10051b 100%);
    opacity:1;transition:opacity .58s ease,filter .58s ease;color:#fff;
    font-family:'Outfit',system-ui,-apple-system,Segoe UI,sans-serif;
  }
  #${ROOT_ID}.rw-closing{opacity:0;filter:blur(8px);pointer-events:none}
  #${ROOT_ID} .rw-bg,#${ROOT_ID} .rw-film,#${ROOT_ID} .rw-poster,#${ROOT_ID} .rw-fx{position:absolute;inset:0;width:100%;height:100%}
  #${ROOT_ID} .rw-bg{
    background-image:linear-gradient(rgba(12,2,20,.34),rgba(12,2,20,.34)),url('/assets/roamwise-opening-poster.png');
    background-position:center 48%;background-size:cover;filter:blur(28px) saturate(1.35) brightness(.52);transform:scale(1.12);
  }
  #${ROOT_ID} .rw-stage{position:relative;z-index:2;width:100%;height:100%;display:grid;place-items:center;overflow:hidden}
  #${ROOT_ID} .rw-media{position:relative;width:100%;height:100%;overflow:hidden;background:#16051e}
  #${ROOT_ID} .rw-film,#${ROOT_ID} .rw-poster{object-fit:cover;object-position:center;transition:opacity .38s ease;transform:scale(1.015)}
  #${ROOT_ID} .rw-film{opacity:0;z-index:2}
  #${ROOT_ID}.rw-video-ready .rw-film{opacity:1}
  #${ROOT_ID}.rw-video-ready .rw-poster{opacity:0}
  #${ROOT_ID}.rw-video-failed .rw-poster{content:url('/assets/roamwise-opening.gif')}
  #${ROOT_ID} .rw-sheen{position:absolute;inset:-30%;z-index:4;pointer-events:none;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.11) 48%,rgba(255,184,244,.16) 50%,transparent 60%);transform:translateX(-65%) rotate(-4deg);animation:rwIntroSheen 3.5s ease-in-out infinite}
  #${ROOT_ID} .rw-matrix{z-index:5;opacity:.28;mix-blend-mode:screen;background-image:
    repeating-linear-gradient(90deg,transparent 0 29px,rgba(255,52,191,.13) 30px,transparent 31px 58px),
    repeating-linear-gradient(180deg,transparent 0 25px,rgba(185,79,255,.08) 26px,transparent 27px 52px);
    background-size:58px 52px;animation:rwIntroMatrix 7s linear infinite}
  #${ROOT_ID} .rw-rain{z-index:6;opacity:.50;background-image:repeating-linear-gradient(103deg,transparent 0 21px,rgba(255,205,255,.22) 22px,transparent 23px 45px);background-size:100% 32px;animation:rwIntroRain .48s linear infinite;filter:blur(.2px)}
  #${ROOT_ID} .rw-thunder{z-index:7;opacity:0;background:
    radial-gradient(circle at 7% 28%,rgba(184,95,255,.52),transparent 19%),
    radial-gradient(circle at 91% 24%,rgba(255,70,207,.45),transparent 18%);
    animation:rwIntroThunder 4.8s steps(1,end) infinite;mix-blend-mode:screen}
  #${ROOT_ID} .rw-brandDesk{display:none;position:absolute;z-index:9;left:7vw;top:50%;transform:translateY(-58%);width:min(42vw,690px);text-align:left}
  #${ROOT_ID} .rw-brandDesk h1{margin:0;font:800 clamp(62px,7vw,128px)/.86 Georgia,'Times New Roman',serif;letter-spacing:.015em;text-transform:uppercase;background:linear-gradient(90deg,#8244ff 0%,#f052e5 29%,#ff5e8c 55%,#ff954d 78%,#ffd475 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 24px rgba(255,65,193,.33));animation:rwIntroBrand 3.2s linear infinite,rwIntroBrandGlow 2.2s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-brandDesk p{margin:20px 0 0;color:rgba(255,236,248,.83);font-weight:600;letter-spacing:.48em;font-size:clamp(12px,1vw,18px);text-transform:uppercase}
  #${ROOT_ID} .rw-loadDesk{display:none;margin-top:clamp(80px,13vh,160px);width:min(380px,30vw)}
  #${ROOT_ID} .rw-loadDesk span{display:block;margin-bottom:12px;color:rgba(255,207,233,.78);font-size:12px;letter-spacing:.42em;text-transform:uppercase}
  #${ROOT_ID} .rw-track{height:5px;border:1px solid rgba(255,100,202,.36);border-radius:99px;background:rgba(255,37,174,.10);overflow:visible;position:relative}
  #${ROOT_ID} .rw-track i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#ff38bd,#ff77d6,#ffd476);box-shadow:0 0 17px rgba(255,83,205,.88);animation:rwIntroLoad 6.15s ease-out forwards}
  #${ROOT_ID} .rw-skip{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:12;border:1px solid rgba(255,255,255,.18);background:rgba(12,5,20,.38);backdrop-filter:blur(12px);color:rgba(255,245,252,.80);border-radius:999px;padding:10px 14px;font:600 10px/1 'Outfit',system-ui,sans-serif;letter-spacing:.20em;text-transform:uppercase;cursor:pointer}
  #${ROOT_ID} .rw-skip:focus-visible{outline:2px solid #ff77d6;outline-offset:3px}
  #${ROOT_ID} .rw-vignette{position:absolute;inset:0;z-index:8;pointer-events:none;box-shadow:inset 0 0 150px rgba(8,0,15,.55),inset 0 -90px 140px rgba(6,0,12,.48)}

  @media (min-width:900px) and (min-aspect-ratio:4/3){
    #${ROOT_ID}{place-items:stretch}
    #${ROOT_ID} .rw-stage{display:block}
    #${ROOT_ID} .rw-media{position:absolute;right:3vw;top:4vh;width:min(43vw,520px);height:92vh;border-radius:28px;box-shadow:0 34px 120px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.10),0 0 90px rgba(255,40,177,.10)}
    #${ROOT_ID} .rw-film,#${ROOT_ID} .rw-poster{object-fit:cover}
    #${ROOT_ID} .rw-brandDesk,#${ROOT_ID} .rw-loadDesk{display:block}
    #${ROOT_ID} .rw-bg{filter:blur(32px) saturate(1.6) brightness(.47);background-position:center 45%}
  }
  @media (max-width:899px),(max-aspect-ratio:4/3){
    #${ROOT_ID} .rw-media{border-radius:0}
    #${ROOT_ID} .rw-film,#${ROOT_ID} .rw-poster{object-fit:cover;object-position:center center}
  }
  @media (prefers-reduced-motion:reduce){
    #${ROOT_ID} .rw-film{display:none!important}
    #${ROOT_ID} .rw-poster{opacity:1!important}
    #${ROOT_ID} .rw-sheen,#${ROOT_ID} .rw-matrix,#${ROOT_ID} .rw-rain,#${ROOT_ID} .rw-thunder,#${ROOT_ID} .rw-brandDesk h1,#${ROOT_ID} .rw-track i{animation:none!important}
    #${ROOT_ID} .rw-track i{width:100%}
  }
  @keyframes rwIntroRain{from{background-position:0 -20px}to{background-position:-8px 32px}}
  @keyframes rwIntroMatrix{from{background-position:0 -80px,0 -30px}to{background-position:0 260px,0 178px}}
  @keyframes rwIntroThunder{0%,17%,19%,52%,54%,100%{opacity:0}18%,53%{opacity:.46}18.4%,53.4%{opacity:.10}}
  @keyframes rwIntroSheen{0%,18%{transform:translateX(-70%) rotate(-4deg);opacity:0}36%{opacity:.6}62%,100%{transform:translateX(72%) rotate(-4deg);opacity:0}}
  @keyframes rwIntroBrand{from{background-position:0% 50%}to{background-position:220% 50%}}
  @keyframes rwIntroBrandGlow{from{filter:drop-shadow(0 0 12px rgba(126,60,255,.28))}to{filter:drop-shadow(0 0 30px rgba(255,79,188,.52))}}
  @keyframes rwIntroLoad{from{width:0}to{width:100%}}
  `;

  function mount(){
    removeLegacy();
    if (document.getElementById(ROOT_ID)) return;

    var style = document.createElement('style');
    style.id = 'rw-opening-style';
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement('section');
    root.id = ROOT_ID;
    root.setAttribute('role','dialog');
    root.setAttribute('aria-label','RoamWise cinematic opening');
    root.innerHTML = ''+
      '<div class="rw-bg" aria-hidden="true"></div>'+
      '<div class="rw-stage">'+
        '<div class="rw-media">'+
          '<img class="rw-poster" src="/assets/roamwise-opening-poster.png" alt="RoamWise Shinobi Atlas opening artwork">'+
          '<video class="rw-film" muted playsinline preload="auto" aria-hidden="true">'+
            '<source src="/assets/roamwise-opening.mp4" type="video/mp4">'+
          '</video>'+
          '<div class="rw-sheen" aria-hidden="true"></div>'+
        '</div>'+
        '<div class="rw-brandDesk" aria-hidden="true"><h1>ROAMWISE</h1><p>Shinobi Atlas</p><div class="rw-loadDesk"><span>Loading</span><div class="rw-track"><i></i></div></div></div>'+
      '</div>'+
      '<div class="rw-fx rw-matrix" aria-hidden="true"></div>'+
      '<div class="rw-fx rw-rain" aria-hidden="true"></div>'+
      '<div class="rw-fx rw-thunder" aria-hidden="true"></div>'+
      '<div class="rw-vignette" aria-hidden="true"></div>'+
      '<button class="rw-skip" type="button">Skip</button>';

    document.body.appendChild(root);
    finishBoot();

    var video = root.querySelector('.rw-film');
    var poster = root.querySelector('.rw-poster');
    var skip = root.querySelector('.rw-skip');
    var closed = false;
    var closeTimer = null;

    function close(){
      if (closed) return;
      closed = true;
      if (closeTimer) clearTimeout(closeTimer);
      root.classList.add('rw-closing');
      try { video.pause(); } catch (_) {}
      setTimeout(function(){
        root.remove();
        if (style.parentNode) style.remove();
      }, 620);
    }

    skip.addEventListener('click', close);
    root.addEventListener('pointerdown', function(e){
      if (e.target === root || e.target.classList.contains('rw-bg')) close();
    });
    window.addEventListener('keydown', function esc(e){
      if (e.key === 'Escape') { close(); window.removeEventListener('keydown', esc); }
    });

    video.addEventListener('canplay', function(){
      root.classList.add('rw-video-ready');
      var play = video.play();
      if (play && typeof play.catch === 'function') play.catch(function(){});
    }, {once:true});
    video.addEventListener('ended', close, {once:true});
    video.addEventListener('error', function(){
      root.classList.add('rw-video-failed');
      poster.src = '/assets/roamwise-opening.gif';
    }, {once:true});

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      closeTimer = setTimeout(close, Math.min(DURATION, 4200));
    } else {
      closeTimer = setTimeout(close, DURATION);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
