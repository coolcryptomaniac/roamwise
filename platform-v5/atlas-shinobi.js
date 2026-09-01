/* RoamWise Platform V6.1 — canonical cinematic opening.
 * One startup runtime only. Approved film + poster/GIF fallback, responsive
 * device framing, rain/lightning/matrix atmosphere, a restrained red-cloak
 * shinobi globe-jump overlay, and a fire/spark loading bar.
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
    removeLegacy();
    finishBoot();
    return;
  }

  var css = `
  #${ROOT_ID}{
    --rw-violet:#7b38ff;--rw-pink:#ff3fbd;--rw-hot:#ff566e;--rw-gold:#ffd06f;
    --rw-fire:#ff6728;--rw-fire2:#ffbe44;--rw-ember:#ffe59b;
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

  /* Original red-cloak traveler overlay. It deliberately reads as a graphic
     silhouette so it complements the approved artwork instead of fighting it. */
  #${ROOT_ID} .rw-shinobi{
    position:absolute;z-index:8;left:15%;top:64%;width:clamp(64px,11vw,96px);height:clamp(96px,17vw,144px);
    pointer-events:none;filter:drop-shadow(0 9px 13px rgba(0,0,0,.56)) drop-shadow(0 0 12px rgba(255,44,96,.36));
    animation:rwShinobiGlobe 5.85s cubic-bezier(.38,.02,.20,1) .35s both;
    transform-origin:50% 88%;
  }
  #${ROOT_ID} .rw-shinobi .rw-head{position:absolute;left:39%;top:4%;width:24%;aspect-ratio:1;border-radius:50%;background:#08070b;box-shadow:inset -3px -2px 0 rgba(255,255,255,.06)}
  #${ROOT_ID} .rw-shinobi .rw-hair{position:absolute;left:44%;top:-2%;width:13%;height:16%;background:#09070b;border-radius:70% 30% 55% 45%;transform:rotate(-14deg);box-shadow:5px -7px 0 -2px #09070b}
  #${ROOT_ID} .rw-shinobi .rw-body{position:absolute;left:31%;top:20%;width:38%;height:51%;border-radius:30% 30% 18% 18%;background:linear-gradient(135deg,#5d0717 0%,#b2172d 45%,#4b0612 100%);box-shadow:inset -8px 0 12px rgba(0,0,0,.30),inset 5px 0 10px rgba(255,86,98,.12)}
  #${ROOT_ID} .rw-shinobi .rw-cloak{position:absolute;left:16%;top:28%;width:68%;height:57%;clip-path:polygon(18% 0,79% 5%,100% 76%,73% 67%,82% 100%,52% 84%,27% 99%,32% 69%,0 78%);background:linear-gradient(120deg,#520611 0%,#cb1833 42%,#790a1c 70%,#2e040d 100%);transform-origin:52% 5%;animation:rwCloakFlare .62s ease-in-out infinite alternate;box-shadow:0 0 10px rgba(255,28,72,.32)}
  #${ROOT_ID} .rw-shinobi .rw-emblem{position:absolute;left:38%;top:43%;width:25%;aspect-ratio:1;border:2px solid rgba(240,222,218,.72);border-radius:50%;opacity:.75}
  #${ROOT_ID} .rw-shinobi .rw-emblem:before,#${ROOT_ID} .rw-shinobi .rw-emblem:after{content:"";position:absolute;left:50%;top:15%;width:2px;height:70%;background:rgba(240,222,218,.68);transform-origin:center}
  #${ROOT_ID} .rw-shinobi .rw-emblem:before{transform:rotate(45deg)}
  #${ROOT_ID} .rw-shinobi .rw-emblem:after{transform:rotate(-45deg)}
  #${ROOT_ID} .rw-shinobi .rw-leg{position:absolute;top:69%;width:12%;height:28%;background:#0b0910;border-radius:30% 30% 12% 12%;transform-origin:50% 5%}
  #${ROOT_ID} .rw-shinobi .rw-leg.l{left:37%;transform:rotate(8deg)}
  #${ROOT_ID} .rw-shinobi .rw-leg.r{right:36%;transform:rotate(-11deg)}
  #${ROOT_ID} .rw-shinobi .rw-scarf{position:absolute;left:59%;top:18%;width:55%;height:10%;border-radius:99px;background:linear-gradient(90deg,#ca1732,rgba(202,23,50,0));transform-origin:0 50%;animation:rwScarf  .46s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-shinobi:after{content:"";position:absolute;left:30%;bottom:3%;width:46%;height:8%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,177,84,.72),rgba(255,38,86,.30) 42%,transparent 70%);filter:blur(3px);opacity:.75;animation:rwLandingGlow .56s ease-in-out infinite alternate}

  #${ROOT_ID} .rw-brandDesk{display:none;position:absolute;z-index:9;left:7vw;top:50%;transform:translateY(-58%);width:min(42vw,690px);text-align:left}
  #${ROOT_ID} .rw-brandDesk h1{margin:0;font:800 clamp(62px,7vw,128px)/.86 Georgia,'Times New Roman',serif;letter-spacing:.015em;text-transform:uppercase;background:linear-gradient(90deg,#8244ff 0%,#f052e5 29%,#ff5e8c 55%,#ff954d 78%,#ffd475 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 24px rgba(255,65,193,.33));animation:rwIntroBrand 3.2s linear infinite,rwIntroBrandGlow 2.2s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-brandDesk p{margin:20px 0 0;color:rgba(255,236,248,.83);font-weight:600;letter-spacing:.48em;font-size:clamp(12px,1vw,18px);text-transform:uppercase}

  #${ROOT_ID} .rw-loadDesk{display:none;margin-top:clamp(80px,13vh,160px);width:min(390px,31vw)}
  #${ROOT_ID} .rw-loadMobile{position:absolute;z-index:11;left:14%;right:14%;bottom:max(28px,4.2vh);text-align:center}
  #${ROOT_ID} .rw-loadDesk>span,#${ROOT_ID} .rw-loadMobile>span{display:block;margin-bottom:12px;color:rgba(255,207,233,.82);font-size:11px;letter-spacing:.42em;text-transform:uppercase;text-shadow:0 0 10px rgba(255,54,188,.35)}
  #${ROOT_ID} .rw-track{height:6px;border:1px solid rgba(255,100,202,.42);border-radius:99px;background:rgba(255,37,174,.11);overflow:visible;position:relative;box-shadow:0 0 18px rgba(255,44,174,.13)}
  #${ROOT_ID} .rw-track i{position:relative;display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#d92169 0%,#ff3b9e 38%,#ff753c 72%,#ffd36b 100%);box-shadow:0 0 17px rgba(255,83,205,.88),0 0 22px rgba(255,112,50,.26);animation:rwIntroLoad 6.15s ease-out forwards}
  #${ROOT_ID} .rw-track i:before{content:"";position:absolute;right:-8px;top:50%;width:22px;height:25px;transform:translateY(-54%) rotate(45deg);border-radius:70% 22% 70% 32%;background:radial-gradient(circle at 62% 64%,#fff5c4 0 13%,#ffc64f 20% 38%,#ff6a25 52% 68%,rgba(255,31,90,.25) 78%,transparent 79%);filter:drop-shadow(0 0 9px #ff622d);animation:rwFlameTip .20s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-track i:after{content:"";position:absolute;right:-5px;top:50%;width:8px;height:8px;border-radius:50%;transform:translateY(-50%);background:#fff8d8;box-shadow:0 0 9px #ffd66f,0 0 18px #ff5c37,0 0 28px rgba(255,45,135,.8);animation:rwSparkTip .28s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-fire{position:absolute;right:-7px;top:50%;width:26px;height:28px;transform:translate(50%,-50%);pointer-events:none}
  #${ROOT_ID} .rw-fire b{position:absolute;left:50%;top:50%;width:4px;height:4px;border-radius:50%;background:var(--rw-ember);box-shadow:0 0 7px #ff792e;opacity:0;animation:rwEmber var(--dur,.82s) ease-out var(--delay,0s) infinite}
  #${ROOT_ID} .rw-fire b:nth-child(1){--dx:-13px;--dy:-31px;--dur:.78s;--delay:-.18s}
  #${ROOT_ID} .rw-fire b:nth-child(2){--dx:10px;--dy:-28px;--dur:.66s;--delay:-.41s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(3){--dx:-4px;--dy:-38px;--dur:.91s;--delay:-.12s;width:2px;height:2px}
  #${ROOT_ID} .rw-fire b:nth-child(4){--dx:15px;--dy:-19px;--dur:.72s;--delay:-.53s}
  #${ROOT_ID} .rw-fire b:nth-child(5){--dx:-18px;--dy:-22px;--dur:.87s;--delay:-.33s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(6){--dx:5px;--dy:-42px;--dur:1.02s;--delay:-.64s;width:2px;height:2px}
  #${ROOT_ID} .rw-fire b:nth-child(7){--dx:20px;--dy:-34px;--dur:.84s;--delay:-.06s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(8){--dx:-8px;--dy:-24px;--dur:.62s;--delay:-.29s;width:2px;height:2px}

  #${ROOT_ID} .rw-skip{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:14;border:1px solid rgba(255,255,255,.18);background:rgba(12,5,20,.38);backdrop-filter:blur(12px);color:rgba(255,245,252,.80);border-radius:999px;padding:10px 14px;font:600 10px/1 'Outfit',system-ui,sans-serif;letter-spacing:.20em;text-transform:uppercase;cursor:pointer}
  #${ROOT_ID} .rw-skip:focus-visible{outline:2px solid #ff77d6;outline-offset:3px}
  #${ROOT_ID} .rw-vignette{position:absolute;inset:0;z-index:10;pointer-events:none;box-shadow:inset 0 0 150px rgba(8,0,15,.55),inset 0 -90px 140px rgba(6,0,12,.48)}

  @media (min-width:900px) and (min-aspect-ratio:4/3){
    #${ROOT_ID}{place-items:stretch}
    #${ROOT_ID} .rw-stage{display:block}
    #${ROOT_ID} .rw-media{position:absolute;right:3vw;top:4vh;width:min(43vw,520px);height:92vh;border-radius:28px;box-shadow:0 34px 120px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.10),0 0 90px rgba(255,40,177,.10)}
    #${ROOT_ID} .rw-film,#${ROOT_ID} .rw-poster{object-fit:cover}
    #${ROOT_ID} .rw-brandDesk,#${ROOT_ID} .rw-loadDesk{display:block}
    #${ROOT_ID} .rw-loadMobile{display:none}
    #${ROOT_ID} .rw-bg{filter:blur(32px) saturate(1.6) brightness(.47);background-position:center 45%}
    #${ROOT_ID} .rw-shinobi{width:clamp(68px,7vw,104px);height:clamp(102px,10.5vw,156px)}
  }
  @media (max-width:899px),(max-aspect-ratio:4/3){
    #${ROOT_ID} .rw-media{border-radius:0}
    #${ROOT_ID} .rw-film,#${ROOT_ID} .rw-poster{object-fit:cover;object-position:center center}
  }
  @media (prefers-reduced-motion:reduce){
    #${ROOT_ID} .rw-film{display:none!important}
    #${ROOT_ID} .rw-poster{opacity:1!important}
    #${ROOT_ID} .rw-sheen,#${ROOT_ID} .rw-matrix,#${ROOT_ID} .rw-rain,#${ROOT_ID} .rw-thunder,#${ROOT_ID} .rw-brandDesk h1,#${ROOT_ID} .rw-track i,#${ROOT_ID} .rw-shinobi,#${ROOT_ID} .rw-cloak,#${ROOT_ID} .rw-scarf,#${ROOT_ID} .rw-fire b{animation:none!important}
    #${ROOT_ID} .rw-track i{width:100%}
    #${ROOT_ID} .rw-shinobi{display:none}
  }

  @keyframes rwIntroRain{from{background-position:0 -20px}to{background-position:-8px 32px}}
  @keyframes rwIntroMatrix{from{background-position:0 -80px,0 -30px}to{background-position:0 260px,0 178px}}
  @keyframes rwIntroThunder{0%,17%,19%,52%,54%,100%{opacity:0}18%,53%{opacity:.46}18.4%,53.4%{opacity:.10}}
  @keyframes rwIntroSheen{0%,18%{transform:translateX(-70%) rotate(-4deg);opacity:0}36%{opacity:.6}62%,100%{transform:translateX(72%) rotate(-4deg);opacity:0}}
  @keyframes rwIntroBrand{from{background-position:0% 50%}to{background-position:220% 50%}}
  @keyframes rwIntroBrandGlow{from{filter:drop-shadow(0 0 12px rgba(126,60,255,.28))}to{filter:drop-shadow(0 0 30px rgba(255,79,188,.52))}}
  @keyframes rwIntroLoad{from{width:0}to{width:100%}}
  @keyframes rwFlameTip{from{transform:translateY(-54%) rotate(40deg) scale(.88,1.08)}to{transform:translateY(-58%) rotate(49deg) scale(1.05,.90)}}
  @keyframes rwSparkTip{from{transform:translateY(-50%) scale(.75);opacity:.76}to{transform:translateY(-50%) scale(1.2);opacity:1}}
  @keyframes rwEmber{0%{transform:translate(-50%,-50%) scale(.55);opacity:0}18%{opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.10);opacity:0}}
  @keyframes rwCloakFlare{from{transform:rotate(-3deg) skewX(-2deg)}to{transform:rotate(4deg) skewX(3deg)}}
  @keyframes rwScarf{from{transform:rotate(7deg) scaleX(.88)}to{transform:rotate(-8deg) scaleX(1.12)}}
  @keyframes rwLandingGlow{from{transform:scaleX(.65);opacity:.34}to{transform:scaleX(1.15);opacity:.82}}
  @keyframes rwShinobiGlobe{
    0%{left:12%;top:69%;transform:translate(-50%,-50%) rotate(-9deg) scale(.92)}
    9%{left:18%;top:60%;transform:translate(-50%,-50%) rotate(-14deg) scale(1)}
    18%{left:28%;top:48%;transform:translate(-50%,-50%) rotate(-4deg) scale(1.07)}
    26%{left:34%;top:57%;transform:translate(-50%,-50%) rotate(7deg) scale(.98)}
    36%{left:43%;top:43%;transform:translate(-50%,-50%) rotate(-9deg) scale(1.09)}
    47%{left:55%;top:34%;transform:translate(-50%,-50%) rotate(3deg) scale(1.12)}
    57%{left:64%;top:51%;transform:translate(-50%,-50%) rotate(8deg) scale(1.00)}
    68%{left:70%;top:39%;transform:translate(-50%,-50%) rotate(-8deg) scale(1.06)}
    79%{left:61%;top:32%;transform:translate(-50%,-50%) rotate(-13deg) scale(1.10)}
    89%{left:70%;top:43%;transform:translate(-50%,-50%) rotate(6deg) scale(1.02)}
    100%{left:78%;top:47%;transform:translate(-50%,-50%) rotate(2deg) scale(.96)}
  }
  `;

  function fireBits(){
    return '<span class="rw-fire" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></span>';
  }

  function track(){
    return '<div class="rw-track"><i>'+fireBits()+'</i></div>';
  }

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
          '<div class="rw-shinobi" aria-hidden="true"><i class="rw-hair"></i><i class="rw-head"></i><i class="rw-body"></i><i class="rw-cloak"></i><i class="rw-emblem"></i><i class="rw-leg l"></i><i class="rw-leg r"></i><i class="rw-scarf"></i></div>'+
          '<div class="rw-loadMobile"><span>Loading</span>'+track()+'</div>'+
        '</div>'+
        '<div class="rw-brandDesk" aria-hidden="true"><h1>ROAMWISE</h1><p>Shinobi Atlas</p><div class="rw-loadDesk"><span>Loading</span>'+track()+'</div></div>'+
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

  /* rw-config is loaded near the bottom of index.html, so body already exists in
     normal navigation. Mount immediately rather than waiting for DOMContentLoaded. */
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, {once:true});
})();
