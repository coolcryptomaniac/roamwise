/* RoamWise Platform V6.2 — canonical cinematic opening.
 * One startup runtime only. Approved film + CSS fallback, responsive
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
  #${ROOT_ID} .rw-bg,#${ROOT_ID} .rw-film,#${ROOT_ID} .rw-fx{position:absolute;inset:0;width:100%;height:100%}
  #${ROOT_ID} .rw-bg{
    background:
      radial-gradient(circle at 52% 42%,rgba(150,49,255,.38),transparent 25%),
      radial-gradient(circle at 58% 66%,rgba(255,52,124,.30),transparent 31%),
      conic-gradient(from 205deg at 50% 70%,#090311,#30103e,#18051f,#090311);
    filter:saturate(1.25) brightness(.72);transform:scale(1.04);
  }
  #${ROOT_ID} .rw-stage{position:relative;z-index:2;width:100%;height:100%;display:grid;place-items:center;overflow:hidden}
  #${ROOT_ID} .rw-media{position:relative;width:100%;height:100%;overflow:hidden;background:
    radial-gradient(circle at 50% 42%,rgba(129,49,255,.42),transparent 28%),
    radial-gradient(circle at 54% 70%,rgba(255,44,125,.30),transparent 38%),#16051e}
  #${ROOT_ID} .rw-film{object-fit:cover;object-position:center;transition:opacity .38s ease;transform:scale(1.015)}
  #${ROOT_ID} .rw-film{opacity:0;z-index:2}
  #${ROOT_ID}.rw-video-ready .rw-film{opacity:1}
  #${ROOT_ID}.rw-video-failed .rw-film{display:none}
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

  /* Deep-black/crimson traveler overlay. It deliberately reads as a graphic
     silhouette so it complements the approved artwork instead of fighting it.
     Position/rotation/scale and the cloak, scarf and leg poses are all driven
     per-frame by the requestAnimationFrame physics sim below (see runShinobiPhysics) —
     the left/top/transform/--legL-angle/--legR-angle values here are only the
     resting pose shown before the intro is unpaused (rw-started). */
  #${ROOT_ID} .rw-shinobi{
    position:absolute;z-index:8;left:12%;top:69%;width:clamp(64px,11vw,96px);height:clamp(96px,17vw,144px);
    pointer-events:none;filter:drop-shadow(0 9px 13px rgba(0,0,0,.60)) drop-shadow(0 0 12px rgba(178,20,56,.34));
    transform:translate(-50%,-50%) rotate(-9deg) scale(.92);
    transform-origin:50% 88%;
    --rw-glow-o:.28;--rw-glow-sx:.65;
  }
  #${ROOT_ID} .rw-shinobi .rw-head{position:absolute;left:39%;top:4%;width:24%;aspect-ratio:1;border-radius:50%;background:#07060a;box-shadow:inset -3px -2px 0 rgba(255,255,255,.05)}
  #${ROOT_ID} .rw-shinobi .rw-hair{position:absolute;left:44%;top:-2%;width:13%;height:16%;background:#08060a;border-radius:70% 30% 55% 45%;transform:rotate(-14deg);box-shadow:5px -7px 0 -2px #08060a}
  #${ROOT_ID} .rw-shinobi .rw-body{position:absolute;left:31%;top:20%;width:38%;height:51%;border-radius:30% 30% 18% 18%;background:linear-gradient(135deg,#150408 0%,#7a0f26 45%,#0e030a 100%);box-shadow:inset -8px 0 12px rgba(0,0,0,.42),inset 5px 0 10px rgba(190,30,60,.14)}
  #${ROOT_ID} .rw-shinobi .rw-cloak{position:absolute;left:16%;top:28%;width:68%;height:57%;clip-path:polygon(18% 0,79% 5%,100% 76%,73% 67%,82% 100%,52% 84%,27% 99%,32% 69%,0 78%);background:linear-gradient(120deg,#050408 0%,#1c0810 28%,#87102c 47%,#170509 66%,#08060a 100%);transform-origin:52% 5%;box-shadow:0 0 10px rgba(178,20,56,.30)}
  #${ROOT_ID} .rw-shinobi .rw-emblem{position:absolute;left:38%;top:43%;width:25%;aspect-ratio:1;border:2px solid rgba(200,54,68,.70);border-radius:50%;opacity:.78}
  #${ROOT_ID} .rw-shinobi .rw-emblem:before,#${ROOT_ID} .rw-shinobi .rw-emblem:after{content:"";position:absolute;left:50%;top:15%;width:2px;height:70%;background:rgba(200,54,68,.66);transform-origin:center}
  #${ROOT_ID} .rw-shinobi .rw-emblem:before{transform:rotate(45deg)}
  #${ROOT_ID} .rw-shinobi .rw-emblem:after{transform:rotate(-45deg)}
  #${ROOT_ID} .rw-shinobi .rw-leg{position:absolute;top:69%;width:12%;height:28%;background:#0a0810;border-radius:30% 30% 12% 12%;transform-origin:50% 5%}
  #${ROOT_ID} .rw-shinobi .rw-leg.l{left:37%;transform:rotate(var(--legL-angle,8deg))}
  #${ROOT_ID} .rw-shinobi .rw-leg.r{right:36%;transform:rotate(var(--legR-angle,-11deg))}
  #${ROOT_ID} .rw-shinobi .rw-scarf{position:absolute;left:59%;top:18%;width:55%;height:10%;border-radius:99px;background:linear-gradient(90deg,#8a1026,rgba(138,16,38,0));transform-origin:0 50%}
  #${ROOT_ID} .rw-shinobi:after{content:"";position:absolute;left:30%;bottom:3%;width:46%;height:8%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,208,111,.60),rgba(178,20,56,.32) 45%,transparent 72%);filter:blur(3px);opacity:var(--rw-glow-o,.28);transform:scaleX(var(--rw-glow-sx,.65))}

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
  #${ROOT_ID} .rw-audio-gate{position:absolute;inset:0;z-index:16;display:grid;place-content:center;justify-items:center;gap:10px;padding:24px;text-align:center;background:rgba(8,2,14,.34);backdrop-filter:blur(3px);transition:opacity .28s ease,visibility .28s ease}
  #${ROOT_ID}.rw-started .rw-audio-gate{opacity:0;visibility:hidden;pointer-events:none}
  #${ROOT_ID} .rw-audio-start{display:flex;align-items:center;gap:11px;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:13px 22px;background:linear-gradient(135deg,rgba(255,65,175,.92),rgba(117,54,255,.94));box-shadow:0 12px 42px rgba(168,44,255,.34);color:#fff;font:800 13px/1 'Outfit',system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
  #${ROOT_ID} .rw-audio-start:hover{transform:translateY(-2px);box-shadow:0 16px 52px rgba(255,57,173,.42)}
  #${ROOT_ID} .rw-audio-start:active{transform:scale(.97)}
  #${ROOT_ID} .rw-audio-start b{font-size:19px;line-height:1}
  #${ROOT_ID} .rw-audio-help{font-size:11px;color:rgba(255,239,249,.72);letter-spacing:.04em}
  #${ROOT_ID}:not(.rw-started) .rw-film{visibility:hidden}
  #${ROOT_ID}:not(.rw-started) .rw-sheen,#${ROOT_ID}:not(.rw-started) .rw-matrix,#${ROOT_ID}:not(.rw-started) .rw-rain,#${ROOT_ID}:not(.rw-started) .rw-thunder,#${ROOT_ID}:not(.rw-started) .rw-track i,#${ROOT_ID}:not(.rw-started) .rw-fire b{animation-play-state:paused!important}

  @media (min-width:900px) and (min-aspect-ratio:4/3){
    #${ROOT_ID}{place-items:stretch}
    #${ROOT_ID} .rw-stage{display:block}
    #${ROOT_ID} .rw-media{position:absolute;right:3vw;top:4vh;width:min(43vw,520px);height:92vh;border-radius:28px;box-shadow:0 34px 120px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.10),0 0 90px rgba(255,40,177,.10)}
    #${ROOT_ID} .rw-film{object-fit:cover}
    #${ROOT_ID} .rw-brandDesk,#${ROOT_ID} .rw-loadDesk{display:block}
    #${ROOT_ID} .rw-loadMobile{display:none}
    #${ROOT_ID} .rw-bg{filter:blur(32px) saturate(1.6) brightness(.47);background-position:center 45%}
    #${ROOT_ID} .rw-shinobi{width:clamp(68px,7vw,104px);height:clamp(102px,10.5vw,156px)}
  }
  @media (max-width:899px),(max-aspect-ratio:4/3){
    #${ROOT_ID} .rw-media{border-radius:0}
    #${ROOT_ID} .rw-film{object-fit:cover;object-position:center center}
  }
  @media (prefers-reduced-motion:reduce){
    #${ROOT_ID} .rw-film{display:none!important}
    #${ROOT_ID} .rw-sheen,#${ROOT_ID} .rw-matrix,#${ROOT_ID} .rw-rain,#${ROOT_ID} .rw-thunder,#${ROOT_ID} .rw-brandDesk h1,#${ROOT_ID} .rw-track i,#${ROOT_ID} .rw-fire b{animation:none!important}
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
  `;
  /* The shinobi's motion (position, lean, squash-stretch, cloak/scarf sway,
     leg gait) is no longer a fixed @keyframes path — see runShinobiPhysics(),
     a small requestAnimationFrame kinematics sim wired up below. */

  function fireBits(){
    return '<span class="rw-fire" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></span>';
  }

  function track(){
    return '<div class="rw-track"><i>'+fireBits()+'</i></div>';
  }

  /* Hand-rolled requestAnimationFrame kinematics for the shinobi globe-jump.
   * Replaces the old single fixed @keyframes path with 3 chained ballistic
   * (projectile-motion) leap arcs, so the traversal reads as an actual
   * running leap sequence (launch -> apex -> fall -> impact -> next launch)
   * instead of one smooth cartoonish glide. Total run time matches the
   * previous animation exactly: 350ms hold + 5850ms of leaping.
   */
  function runShinobiPhysics(shinobi){
    var legL = shinobi.querySelector('.rw-leg.l');
    var legR = shinobi.querySelector('.rw-leg.r');
    var cloak = shinobi.querySelector('.rw-cloak');
    var scarf = shinobi.querySelector('.rw-scarf');

    // Same start/land waypoints the old fixed keyframes used (values lifted
    // from its 0%/26%/57%/100% left/top marks), now chained as 3 leaps with
    // real launch -> apex -> landing arcs instead of interpolated percentages.
    var START_X = 12, START_Y = 69;
    var LEAP_DEFS = [
      { x1: 34, y1: 57, apexY: 44, dur: 1900 },
      { x1: 64, y1: 51, apexY: 30, dur: 2000 },
      { x1: 78, y1: 47, apexY: 28, dur: 1650 }
    ];
    var CONTACT_MS = 150;   // brief ground-contact/compression pause between leaps
    var LAND_HOLD_MS = 260; // extra settle time after the final landing for squash/glow decay
    var START_DELAY = 350;  // matches the old animation-delay

    var MAX_LEAN = 34;      // deg, cap on velocity-derived rotation
    var LEAN_SCALE = 0.62;
    var VY_REF = .34;       // %/ms — reference vertical speed used to normalize gait/impact intensity

    // Precompute each leap's real ballistic parameters (x(t)=x0+vx*t,
    // y(t)=y0+vy*t+0.5*g*t^2) from its start/end height and apex height:
    // rise time t_up=sqrt(2*hUp/g), fall time t_down=sqrt(2*hDown/g), with
    // t_up+t_down pinned to the leap's total duration.
    var x0 = START_X, y0 = START_Y;
    LEAP_DEFS.forEach(function(leap){
      leap.x0 = x0; leap.y0 = y0;
      leap.vx = (leap.x1 - x0) / leap.dur;
      var hUp = Math.max(y0 - leap.apexY, 1);
      var hDown = Math.max(leap.y1 - leap.apexY, 1);
      var ratio = Math.sqrt(hUp / hDown);
      var tUp = leap.dur * ratio / (1 + ratio);
      var tDown = leap.dur - tUp;
      leap.g = (2 * hUp) / (tUp * tUp);
      leap.vy0 = -leap.g * tUp;
      leap.impactVy = leap.vy0 + leap.g * leap.dur;
      x0 = leap.x1; y0 = leap.y1;
    });

    // Flatten into a timeline of leap / ground-contact segments.
    var segments = [];
    var t = 0;
    LEAP_DEFS.forEach(function(leap, i){
      segments.push({ type:'leap', leap:leap, start:t, end:t+leap.dur });
      t += leap.dur;
      var isLast = i === LEAP_DEFS.length - 1;
      var contactDur = isLast ? LAND_HOLD_MS : CONTACT_MS;
      segments.push({ type:'contact', x:leap.x1, y:leap.y1, impactV:leap.impactVy, start:t, end:t+contactDur });
      t += contactDur;
    });
    var TOTAL_MS = t;

    function clamp(v, lo, hi){ return v < lo ? lo : (v > hi ? hi : v); }
    function springK(base, dt){ return 1 - Math.pow(1 - base, dt / 16.67); }

    // Spring-follow state for the secondary motion (cloak/scarf lag the
    // body's real velocity instead of looping on a fixed timer) plus the
    // impact squash-stretch and landing-glow decay.
    var pose = {
      cloakA:-3, cloakSkew:-2, scarfA:7, scarfSx:1,
      legLA:8, legRA:-11,
      sx:1, sy:1, glow:0
    };

    var rafId = null;
    var launchTime = null;
    var lastSegIndex = -1;

    function findSegment(elapsed){
      for (var i = 0; i < segments.length; i++){
        if (elapsed <= segments[i].end || i === segments.length - 1) return i;
      }
      return segments.length - 1;
    }

    function triggerImpact(impactVy){
      var intensity = clamp(Math.abs(impactVy) / VY_REF, 0, 1);
      pose.sy = clamp(1 - intensity * .38, .60, .96);
      pose.sx = clamp(1 + intensity * .32, 1.04, 1.55);
      pose.glow = clamp(.4 + intensity * .8, 0, 1);
    }

    function legTargetsFor(vyNow, inContact){
      var vyNorm = clamp(vyNow / VY_REF, -1, 1);
      // Rising (vyNorm<0) => legs trail back and tuck; falling toward a
      // landing (vyNorm>0) or already on the ground => legs extend to plant.
      var tuck = inContact ? 0 : (1 - vyNorm) / 2;
      var TUCK_L = 34, TUCK_R = -34, PLANT_L = -8, PLANT_R = 10;
      return {
        l: PLANT_L + tuck * (TUCK_L - PLANT_L),
        r: PLANT_R + tuck * (TUCK_R - PLANT_R)
      };
    }

    function applyDom(x, y, rotDeg){
      shinobi.style.left = x + '%';
      shinobi.style.top = y + '%';
      shinobi.style.transform = 'translate(-50%,-50%) rotate(' + rotDeg.toFixed(2) + 'deg) scale(' +
        pose.sx.toFixed(3) + ',' + pose.sy.toFixed(3) + ')';
      shinobi.style.setProperty('--legL-angle', pose.legLA.toFixed(2) + 'deg');
      shinobi.style.setProperty('--legR-angle', pose.legRA.toFixed(2) + 'deg');
      shinobi.style.setProperty('--rw-glow-o', (.20 + pose.glow * .60).toFixed(3));
      shinobi.style.setProperty('--rw-glow-sx', (.55 + pose.glow * .65).toFixed(3));
      if (cloak) cloak.style.transform = 'rotate(' + pose.cloakA.toFixed(2) + 'deg) skewX(' + pose.cloakSkew.toFixed(2) + 'deg)';
      if (scarf) scarf.style.transform = 'rotate(' + pose.scarfA.toFixed(2) + 'deg) scaleX(' + pose.scarfSx.toFixed(3) + ')';
    }

    var lastNow = null;
    function frame(now){
      if (launchTime == null) launchTime = now;
      var dt = lastNow == null ? 16.67 : Math.min(now - lastNow, 48);
      lastNow = now;
      var elapsed = now - launchTime - START_DELAY;

      var x, y, rotTarget = 0, vyNow = 0, inContact = false;
      if (elapsed < 0) {
        x = START_X; y = START_Y;
      } else if (elapsed >= TOTAL_MS) {
        var lastLeap = LEAP_DEFS[LEAP_DEFS.length - 1];
        x = lastLeap.x1; y = lastLeap.y1; inContact = true;
      } else {
        var segIdx = findSegment(elapsed);
        var seg = segments[segIdx];
        if (segIdx !== lastSegIndex && seg.type === 'contact') {
          triggerImpact(seg.impactV);
        }
        lastSegIndex = segIdx;
        if (seg.type === 'leap') {
          var lt = elapsed - seg.start;
          var leap = seg.leap;
          x = leap.x0 + leap.vx * lt;
          y = leap.y0 + leap.vy0 * lt + 0.5 * leap.g * lt * lt;
          vyNow = leap.vy0 + leap.g * lt;
          rotTarget = clamp(Math.atan2(vyNow, leap.vx) * 180 / Math.PI * LEAN_SCALE, -MAX_LEAN, MAX_LEAN);
        } else {
          x = seg.x; y = seg.y; inContact = true;
        }
      }

      // Spring-follow secondary motion: cloak/scarf lag the real horizontal
      // + vertical velocity instead of looping on a fixed timer.
      var vyNorm = clamp(vyNow / VY_REF, -1, 1);
      var activeVx = 0;
      if (!inContact && elapsed >= 0 && elapsed < TOTAL_MS) {
        var si = findSegment(elapsed);
        if (segments[si].type === 'leap') activeVx = segments[si].leap.vx;
      }
      var cloakTarget = clamp(-(activeVx * 1000) * .55 + vyNorm * 5, -18, 14);
      var cloakSkewTarget = clamp(vyNorm * 6, -7, 7);
      var scarfTarget = clamp(-(activeVx * 1000) * .85 + vyNorm * 9, -24, 18);
      var scarfSxTarget = clamp(1 + Math.abs(activeVx * 1000) * .012, .85, 1.30);

      var kCloak = springK(.10, dt);
      var kScarf = springK(.17, dt);
      var kLeg = springK(.30, dt);
      var kSquash = springK(.40, dt);
      var kGlow = springK(.12, dt);

      pose.cloakA += (cloakTarget - pose.cloakA) * kCloak;
      pose.cloakSkew += (cloakSkewTarget - pose.cloakSkew) * kCloak;
      pose.scarfA += (scarfTarget - pose.scarfA) * kScarf;
      pose.scarfSx += (scarfSxTarget - pose.scarfSx) * kScarf;

      var legTargets = legTargetsFor(vyNow, inContact);
      pose.legLA += (legTargets.l - pose.legLA) * kLeg;
      pose.legRA += (legTargets.r - pose.legRA) * kLeg;

      pose.sx += (1 - pose.sx) * kSquash;
      pose.sy += (1 - pose.sy) * kSquash;
      pose.glow += (0 - pose.glow) * kGlow;

      applyDom(x, y, rotTarget);

      if (elapsed < TOTAL_MS + 400) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = null;
      }
    }

    return {
      start: function(){
        if (rafId != null) return;
        launchTime = null;
        lastNow = null;
        lastSegIndex = -1;
        rafId = requestAnimationFrame(frame);
      },
      stop: function(){
        if (rafId != null) cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }

  function mount(){
    removeLegacy();
    if (document.getElementById(ROOT_ID)) return;

    /* Stop the retired dream-question opener from claiming this same root id
       700ms later. The cinematic screen is the sole first-launch owner. */
    try { localStorage.setItem('rw_opening','1'); } catch (_) {}

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
          '<video class="rw-film" muted playsinline preload="auto" aria-hidden="true">'+
            '<source src="/assets/roamwise-opening.mp4" type="video/mp4">'+
          '</video>'+
          '<div class="rw-sheen" aria-hidden="true"></div>'+
          '<div class="rw-shinobi" aria-hidden="true"><i class="rw-hair"></i><i class="rw-head"></i><i class="rw-body"></i><i class="rw-cloak"></i><i class="rw-emblem"></i><i class="rw-leg l"></i><i class="rw-leg r"></i><i class="rw-scarf"></i></div>'+
          '<div class="rw-loadMobile"><span>Sound on &middot; entering RoamWise</span>'+track()+'</div>'+
        '</div>'+
        '<div class="rw-brandDesk" aria-hidden="true"><h1>ROAMWISE</h1><p>Shinobi Atlas</p><div class="rw-loadDesk"><span>Sound on &middot; entering RoamWise</span>'+track()+'</div></div>'+
      '</div>'+
      '<div class="rw-fx rw-matrix" aria-hidden="true"></div>'+
      '<div class="rw-fx rw-rain" aria-hidden="true"></div>'+
      '<div class="rw-fx rw-thunder" aria-hidden="true"></div>'+
      '<div class="rw-vignette" aria-hidden="true"></div>'+
      '<div class="rw-audio-gate"><button class="rw-audio-start" type="button"><b aria-hidden="true">&#9835;</b><span>Tap to begin with sound</span></button><div class="rw-audio-help">Mute or change volume anytime in Settings</div></div>'+
      '<button class="rw-skip" type="button">Skip</button>';

    document.body.appendChild(root);
    finishBoot();

    var video = root.querySelector('.rw-film');
    var startButton = root.querySelector('.rw-audio-start');
    var skip = root.querySelector('.rw-skip');
    var shinobiEl = root.querySelector('.rw-shinobi');
    var shinobiPhysics = shinobiEl ? runShinobiPhysics(shinobiEl) : null;
    var closed = false;
    var started = false;
    var videoReady = false;
    var closeTimer = null;

    function beginVisual(){
      if (started || closed) return;
      started = true;
      root.classList.add('rw-started');
      var reducedMotionNow = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (shinobiPhysics && !reducedMotionNow) shinobiPhysics.start();
      try {
        window.dispatchEvent(new CustomEvent('rw:opening-start'));
      } catch (_) {}
      /* site_opening cue from the audio manifest — fires once the audio gate
         has cleared (or immediately when audio is muted/unsupported), so it
         never doubles up with the ambient bed RWAudio.play() already started.
         rwPlayCue lives in app.js (kept out of this module's own no-media-file
         Web Audio engine) and reads the same rw_audio_enabled/volume keys. */
      try { if (typeof window.rwPlayCue === 'function') window.rwPlayCue('site_opening'); } catch (_) {}
      if (videoReady) {
        var videoPlay = video.play();
        if (videoPlay && typeof videoPlay.catch === 'function') videoPlay.catch(function(){});
      }
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      closeTimer = setTimeout(close, reduced ? Math.min(DURATION, 4200) : DURATION);
    }

    function startExperience(){
      if (started || closed) return;
      if (!window.RWAudio || !RWAudio.isEnabled || !RWAudio.isEnabled()) {
        beginVisual();
        return;
      }
      Promise.resolve(RWAudio.play()).then(function(playing){
        if (playing || !RWAudio.getState || !RWAudio.getState().supported) beginVisual();
      }).catch(function(){});
    }

    function close(){
      if (closed) return;
      closed = true;
      if (closeTimer) clearTimeout(closeTimer);
      if (shinobiPhysics) shinobiPhysics.stop();
      root.classList.add('rw-closing');
      try { video.pause(); } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('rw:opening-end')); } catch (_) {}
      setTimeout(function(){
        root.remove();
        if (style.parentNode) style.remove();
      }, 620);
    }

    skip.addEventListener('click', close);
    startButton.addEventListener('click', startExperience);
    window.addEventListener('keydown', function esc(e){
      if (e.key === 'Escape') { close(); window.removeEventListener('keydown', esc); }
    });

    video.addEventListener('canplay', function(){
      videoReady = true;
      root.classList.add('rw-video-ready');
      if (started) {
        var play = video.play();
        if (play && typeof play.catch === 'function') play.catch(function(){});
      }
    }, {once:true});
    video.addEventListener('ended', close, {once:true});
    video.addEventListener('error', function(){
      root.classList.add('rw-video-failed');
    }, {once:true});

    /* Native WebViews and previously-authorised browsers can start immediately.
       Other browsers keep the film paused behind the explicit sound gate, so
       the cinematic animation itself never runs silently. */
    startExperience();
  }

  /* rw-config is loaded near the bottom of index.html, so body already exists in
     normal navigation. Mount immediately rather than waiting for DOMContentLoaded. */
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, {once:true});
})();
