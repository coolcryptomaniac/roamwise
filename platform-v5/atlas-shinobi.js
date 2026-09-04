/* RoamWise Platform V6.3 — canonical cinematic opening.
 * One startup runtime only. Globe-first film continuity, responsive device
 * framing, rain/lightning/matrix atmosphere, three continent-route shinobi,
 * a single fire/lightning loading bar, and a dated live insight card.
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
  #${ROOT_ID} .rw-bg,#${ROOT_ID} .rw-film,#${ROOT_ID} .rw-film-gif,#${ROOT_ID} .rw-fx{position:absolute;inset:0;width:100%;height:100%}
  #${ROOT_ID} .rw-bg{
    background:
      radial-gradient(circle at 52% 42%,rgba(150,49,255,.38),transparent 25%),
      radial-gradient(circle at 58% 66%,rgba(255,52,124,.30),transparent 31%),
      conic-gradient(from 205deg at 50% 70%,#090311,#30103e,#18051f,#090311);
    filter:saturate(1.25) brightness(.72);transform:scale(1.04);
  }
  #${ROOT_ID} .rw-stage{position:relative;z-index:2;width:100%;height:100%;display:grid;place-items:center;overflow:hidden}
  #${ROOT_ID} .rw-media{position:relative;width:100%;height:100%;overflow:hidden;background:#16051e url('assets/roamwise-opening-first.webp') center/cover no-repeat}
  #${ROOT_ID} .rw-film{object-fit:cover;object-position:center;transition:opacity .16s ease;transform:scale(1.015)}
  #${ROOT_ID} .rw-film{opacity:0;z-index:2;background:#16051e}
  #${ROOT_ID}.rw-video-ready .rw-film{opacity:1}
  #${ROOT_ID}.rw-video-failed .rw-film{display:none}
  /* GIF fallback: a still image element, never a <source> inside <video>
     (browsers don't support animated GIF as a video-element source at all).
     Its src is only assigned by JS once the video actually errors, so the
     ~5MB GIF is never fetched on the normal (video-plays-fine) path. */
  #${ROOT_ID} .rw-film-gif{object-fit:cover;object-position:center;opacity:0;z-index:2;display:none}
  #${ROOT_ID}.rw-video-failed .rw-film-gif{display:block;opacity:1}
  #${ROOT_ID} .rw-sheen{position:absolute;inset:-30%;z-index:4;pointer-events:none;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.11) 48%,rgba(255,184,244,.16) 50%,transparent 60%);transform:translateX(-65%) rotate(-4deg);animation:rwIntroSheen 3.5s ease-in-out infinite}
  #${ROOT_ID} .rw-matrix{z-index:5;opacity:.28;mix-blend-mode:screen;background-image:
    repeating-linear-gradient(90deg,transparent 0 29px,rgba(255,52,191,.13) 30px,transparent 31px 58px),
    repeating-linear-gradient(180deg,transparent 0 25px,rgba(185,79,255,.08) 26px,transparent 27px 52px);
    background-size:58px 52px;animation:rwIntroMatrix 7s linear infinite}
  #${ROOT_ID} .rw-rain{z-index:6;opacity:.50;background-image:repeating-linear-gradient(103deg,transparent 0 21px,rgba(255,205,255,.22) 22px,transparent 23px 45px);background-size:100% 32px;animation:rwIntroRain .48s linear infinite;filter:blur(.2px)}
  #${ROOT_ID} .rw-thunder{z-index:7;opacity:0;background:
    radial-gradient(circle at 7% 28%,rgba(184,95,255,.52),transparent 19%),
    radial-gradient(circle at 91% 24%,rgba(255,70,207,.45),transparent 18%);
    animation:rwIntroThunder 2.9s steps(1,end) infinite;mix-blend-mode:screen}
  #${ROOT_ID} .rw-thunder:before,#${ROOT_ID} .rw-thunder:after{content:"";position:absolute;top:-8%;width:5px;height:58%;opacity:.18;background:linear-gradient(#fff,#b568ff 28%,#ff4bc8 68%,transparent);clip-path:polygon(40% 0,100% 0,62% 39%,100% 39%,20% 100%,42% 52%,0 52%);filter:drop-shadow(0 0 9px #d977ff);animation:rwBoltCrack 2.9s steps(1,end) infinite}
  #${ROOT_ID} .rw-thunder:before{left:12%;transform:rotate(8deg)}
  #${ROOT_ID} .rw-thunder:after{right:11%;transform:rotate(-11deg);animation-delay:1.35s}

  /* Deep-black/crimson traveler overlay. It deliberately reads as a graphic
     silhouette so it complements the approved artwork instead of fighting it.
     Position/rotation/scale and the cloak, scarf and leg poses are all driven
     per-frame by the requestAnimationFrame physics sim below (see runShinobiPhysics) —
     the left/top/transform/--legL-angle/--legR-angle values here are only the
     resting pose shown before the intro is unpaused (rw-started). */
  #${ROOT_ID} .rw-shinobi{
    position:absolute;z-index:8;left:50%;top:52%;width:clamp(52px,9vw,78px);height:clamp(78px,13.5vw,117px);
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
  #${ROOT_ID} .rw-shinobi--secondary{width:clamp(38px,6.7vw,58px);height:clamp(57px,10vw,87px);opacity:.82;filter:drop-shadow(0 7px 10px rgba(0,0,0,.66)) drop-shadow(0 0 10px rgba(123,56,255,.38))}
  #${ROOT_ID} .rw-shinobi--tertiary{width:clamp(34px,6vw,52px);height:clamp(51px,9vw,78px);opacity:.70;filter:drop-shadow(0 7px 10px rgba(0,0,0,.66)) drop-shadow(0 0 9px rgba(255,63,189,.34))}

  #${ROOT_ID} .rw-brandDesk{display:none;position:absolute;z-index:9;left:7vw;top:50%;transform:translateY(-58%);width:min(42vw,690px);text-align:left}
  #${ROOT_ID} .rw-brandDesk h1{margin:0;font:800 clamp(62px,7vw,128px)/.86 Georgia,'Times New Roman',serif;letter-spacing:.015em;text-transform:uppercase;background:linear-gradient(90deg,#8244ff 0%,#f052e5 29%,#ff5e8c 55%,#ff954d 78%,#ffd475 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 24px rgba(255,65,193,.33));animation:rwIntroBrand 3.2s linear infinite,rwIntroBrandGlow 2.2s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-brandDesk p{margin:20px 0 0;color:rgba(255,236,248,.83);font-weight:600;letter-spacing:.48em;font-size:clamp(12px,1vw,18px);text-transform:uppercase}

  #${ROOT_ID} .rw-loader-mask{position:absolute;z-index:10;left:0;right:0;bottom:0;height:19%;pointer-events:none;background:linear-gradient(180deg,transparent 0%,rgba(8,2,14,.84) 38%,#08020e 76%)}
  #${ROOT_ID} .rw-loadDesk{display:none;margin-top:clamp(80px,13vh,160px);width:min(440px,34vw)}
  #${ROOT_ID} .rw-loadMobile{position:absolute;z-index:11;left:9%;right:9%;bottom:max(28px,4.2vh);text-align:center}
  #${ROOT_ID} .rw-loadDesk>span,#${ROOT_ID} .rw-loadMobile>span{display:block;margin-bottom:15px;color:#ffe5f4;font-size:12px;font-weight:800;letter-spacing:.36em;text-transform:uppercase;text-shadow:0 0 12px rgba(255,54,188,.62)}
  #${ROOT_ID} .rw-track{height:10px;border:1px solid rgba(255,151,220,.66);border-radius:99px;background:rgba(255,37,174,.13);overflow:visible;position:relative;box-shadow:0 0 23px rgba(255,44,174,.30),inset 0 0 8px rgba(255,255,255,.10)}
  #${ROOT_ID} .rw-track i{position:relative;display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#d92169 0%,#ff3b9e 38%,#ff753c 72%,#ffd36b 100%);box-shadow:0 0 17px rgba(255,83,205,.88),0 0 22px rgba(255,112,50,.26);animation:rwIntroLoad 6.15s ease-out forwards}
  #${ROOT_ID} .rw-track i:before{content:"";position:absolute;right:-13px;top:50%;width:36px;height:42px;transform:translateY(-54%) rotate(45deg);border-radius:70% 22% 70% 32%;background:radial-gradient(circle at 62% 64%,#fffce1 0 10%,#ffd75c 18% 34%,#ff762c 48% 65%,rgba(255,31,90,.28) 76%,transparent 78%);filter:drop-shadow(0 0 12px #ff622d) drop-shadow(0 0 20px rgba(255,39,150,.55));animation:rwFlameTip .16s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-track i:after{content:"";position:absolute;right:-7px;top:50%;width:11px;height:11px;border-radius:50%;transform:translateY(-50%);background:#fffbe6;box-shadow:0 0 11px #fff0a1,0 0 22px #ff7137,0 0 38px rgba(255,45,135,.92);animation:rwSparkTip .22s ease-in-out infinite alternate}
  #${ROOT_ID} .rw-fire{position:absolute;right:-10px;top:50%;width:46px;height:48px;transform:translate(50%,-50%);pointer-events:none}
  #${ROOT_ID} .rw-fire b{position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:50%;background:var(--rw-ember);box-shadow:0 0 9px #ff792e;opacity:0;animation:rwEmber var(--dur,.82s) ease-out var(--delay,0s) infinite}
  #${ROOT_ID} .rw-fire b:nth-child(1){--dx:-13px;--dy:-31px;--dur:.78s;--delay:-.18s}
  #${ROOT_ID} .rw-fire b:nth-child(2){--dx:10px;--dy:-28px;--dur:.66s;--delay:-.41s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(3){--dx:-4px;--dy:-38px;--dur:.91s;--delay:-.12s;width:2px;height:2px}
  #${ROOT_ID} .rw-fire b:nth-child(4){--dx:15px;--dy:-19px;--dur:.72s;--delay:-.53s}
  #${ROOT_ID} .rw-fire b:nth-child(5){--dx:-18px;--dy:-22px;--dur:.87s;--delay:-.33s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(6){--dx:5px;--dy:-42px;--dur:1.02s;--delay:-.64s;width:2px;height:2px}
  #${ROOT_ID} .rw-fire b:nth-child(7){--dx:20px;--dy:-34px;--dur:.84s;--delay:-.06s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(8){--dx:-8px;--dy:-24px;--dur:.62s;--delay:-.29s;width:2px;height:2px}
  #${ROOT_ID} .rw-fire b:nth-child(9){--dx:27px;--dy:-45px;--dur:.72s;--delay:-.44s}
  #${ROOT_ID} .rw-fire b:nth-child(10){--dx:-26px;--dy:-49px;--dur:.88s;--delay:-.11s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(11){--dx:31px;--dy:-21px;--dur:.64s;--delay:-.35s;width:3px;height:3px}
  #${ROOT_ID} .rw-fire b:nth-child(12){--dx:-31px;--dy:-27px;--dur:.79s;--delay:-.57s}
  #${ROOT_ID} .rw-fire em{position:absolute;left:54%;top:42%;width:4px;height:29px;background:linear-gradient(#fff,#ffe26b 35%,#a854ff 100%);clip-path:polygon(38% 0,100% 0,60% 42%,100% 42%,10% 100%,38% 55%,0 55%);opacity:0;filter:drop-shadow(0 0 7px #fff06a);animation:rwFireBolt 1.05s steps(1,end) infinite}
  #${ROOT_ID} .rw-fire em:nth-of-type(1){transform:translate(-31px,-31px) rotate(-48deg);animation-delay:-.18s}
  #${ROOT_ID} .rw-fire em:nth-of-type(2){transform:translate(22px,-35px) rotate(44deg);animation-delay:-.62s}
  #${ROOT_ID} .rw-fire em:nth-of-type(3){transform:translate(32px,2px) rotate(86deg);animation-delay:-.39s}

  #${ROOT_ID} .rw-skip{position:absolute;right:max(16px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));z-index:18;min-width:116px;border:1px solid rgba(255,208,111,.72);background:linear-gradient(135deg,rgba(31,8,34,.90),rgba(89,18,76,.82));backdrop-filter:blur(14px);box-shadow:0 9px 28px rgba(0,0,0,.42),0 0 18px rgba(255,73,186,.22);color:#fff7df;border-radius:999px;padding:14px 18px;font:800 13px/1 'Outfit',system-ui,sans-serif;letter-spacing:.10em;text-transform:uppercase;cursor:pointer}
  #${ROOT_ID} .rw-skip:focus-visible{outline:2px solid #ff77d6;outline-offset:3px}
  #${ROOT_ID} .rw-vignette{position:absolute;inset:0;z-index:10;pointer-events:none;box-shadow:inset 0 0 150px rgba(8,0,15,.55),inset 0 -90px 140px rgba(6,0,12,.48)}
  #${ROOT_ID} .rw-audio-gate{position:absolute;z-index:16;left:50%;bottom:18%;width:min(430px,calc(100% - 40px));transform:translateX(-50%);display:grid;justify-items:center;gap:9px;text-align:center;pointer-events:none}
  #${ROOT_ID} .rw-stat-card{width:100%;box-sizing:border-box;padding:11px 14px;border:1px solid transparent;border-radius:16px;background:linear-gradient(135deg,rgba(10,4,20,.48),rgba(55,9,48,.28)) padding-box,linear-gradient(110deg,rgba(255,208,111,.24),rgba(255,63,189,.82),rgba(123,56,255,.72),rgba(255,208,111,.24)) border-box;background-size:100% 100%,240% 100%;backdrop-filter:blur(9px);box-shadow:0 14px 38px rgba(0,0,0,.30),0 0 24px rgba(255,63,189,.10);animation:rwStatFloat 3.4s ease-in-out infinite alternate,rwStatBorder 5s linear infinite}
  #${ROOT_ID} .rw-stat-kicker{display:block;margin-bottom:5px;color:#ffd98a;font:800 8px/1 'Outfit',system-ui,sans-serif;letter-spacing:.23em;text-transform:uppercase}
  #${ROOT_ID} .rw-stat-value{display:block;color:#fff;font:800 clamp(16px,3.7vw,23px)/1.16 'Outfit',system-ui,sans-serif;text-shadow:0 0 18px rgba(255,69,190,.28)}
  #${ROOT_ID} .rw-stat-detail{display:block;margin-top:5px;color:rgba(255,239,249,.74);font:500 10px/1.4 'Outfit',system-ui,sans-serif;letter-spacing:.02em}
  #${ROOT_ID} .rw-skip-hint{padding:7px 12px;border-radius:999px;background:rgba(7,3,14,.38);color:rgba(255,245,252,.80);font:700 8px/1 'Outfit',system-ui,sans-serif;letter-spacing:.17em;text-transform:uppercase}
  #${ROOT_ID}:not(.rw-started) .rw-film,#${ROOT_ID}:not(.rw-started) .rw-film-gif{visibility:hidden}
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
    #${ROOT_ID} .rw-film,#${ROOT_ID} .rw-film-gif{display:none!important}
    #${ROOT_ID} .rw-sheen,#${ROOT_ID} .rw-matrix,#${ROOT_ID} .rw-rain,#${ROOT_ID} .rw-thunder,#${ROOT_ID} .rw-brandDesk h1,#${ROOT_ID} .rw-track i,#${ROOT_ID} .rw-fire b{animation:none!important}
    #${ROOT_ID} .rw-track i{width:100%}
    #${ROOT_ID} .rw-shinobi{display:none}
  }

  @keyframes rwIntroRain{from{background-position:0 -20px}to{background-position:-8px 32px}}
  @keyframes rwIntroMatrix{from{background-position:0 -80px,0 -30px}to{background-position:0 260px,0 178px}}
  @keyframes rwIntroThunder{0%,17%,19%,52%,54%,100%{opacity:0}18%,53%{opacity:.46}18.4%,53.4%{opacity:.10}}
  @keyframes rwBoltCrack{0%,12%,14%,51%,53%,100%{opacity:0}12.4%,51.4%{opacity:.92}13%,52%{opacity:.20}}
  @keyframes rwIntroSheen{0%,18%{transform:translateX(-70%) rotate(-4deg);opacity:0}36%{opacity:.6}62%,100%{transform:translateX(72%) rotate(-4deg);opacity:0}}
  @keyframes rwIntroBrand{from{background-position:0% 50%}to{background-position:220% 50%}}
  @keyframes rwIntroBrandGlow{from{filter:drop-shadow(0 0 12px rgba(126,60,255,.28))}to{filter:drop-shadow(0 0 30px rgba(255,79,188,.52))}}
  @keyframes rwIntroLoad{from{width:0}to{width:100%}}
  @keyframes rwFlameTip{from{transform:translateY(-54%) rotate(40deg) scale(.88,1.08)}to{transform:translateY(-58%) rotate(49deg) scale(1.05,.90)}}
  @keyframes rwSparkTip{from{transform:translateY(-50%) scale(.75);opacity:.76}to{transform:translateY(-50%) scale(1.2);opacity:1}}
  @keyframes rwEmber{0%{transform:translate(-50%,-50%) scale(.55);opacity:0}18%{opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.10);opacity:0}}
  @keyframes rwFireBolt{0%,71%,75%,100%{opacity:0}72%{opacity:1}73%{opacity:.28}74%{opacity:.86}}
  @keyframes rwStatFloat{from{transform:translateY(0)}to{transform:translateY(-3px)}}
  @keyframes rwStatBorder{from{background-position:0 0,0% 50%}to{background-position:0 0,240% 50%}}
  `;
  /* The shinobi's motion (position, lean, squash-stretch, cloak/scarf sway,
     leg gait) is no longer a fixed @keyframes path — see runShinobiPhysics(),
     a small requestAnimationFrame kinematics sim wired up below. */

  function fireBits(){
    return '<span class="rw-fire" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><em></em><em></em><em></em></span>';
  }

  function track(){
    return '<div class="rw-track"><i>'+fireBits()+'</i></div>';
  }

  function traveler(extraClass){
    return '<div class="rw-shinobi '+(extraClass||'')+'" aria-hidden="true"><i class="rw-hair"></i><i class="rw-head"></i><i class="rw-body"></i><i class="rw-cloak"></i><i class="rw-emblem"></i><i class="rw-leg l"></i><i class="rw-leg r"></i><i class="rw-scarf"></i></div>';
  }

  /* Hand-rolled requestAnimationFrame kinematics for the shinobi globe-jump.
   * Replaces the old single fixed @keyframes path with 3 chained ballistic
   * (projectile-motion) leap arcs, so the traversal reads as an actual
   * running leap sequence (crouch -> launch -> apex -> fall -> impact ->
   * next crouch) instead of one smooth cartoonish glide. Arcs are kept flat
   * and quick (a modest apex rise, not a floaty bounce) and rotation is
   * capped low so the torso stays upright with only a subtle lean into the
   * direction of travel. All motion is computed from real elapsed time (see
   * `elapsed`/`dt` below), not fixed per-frame steps, so pacing is identical
   * regardless of frame rate. Total run time matches the previous animation
   * exactly: 350ms hold + 5850ms of leaping.
   */
  function runShinobiPhysics(shinobi, route){
    route = route || {};
    var legL = shinobi.querySelector('.rw-leg.l');
    var legR = shinobi.querySelector('.rw-leg.r');
    var cloak = shinobi.querySelector('.rw-cloak');
    var scarf = shinobi.querySelector('.rw-scarf');

    // Same start/land waypoints the old fixed keyframes used (values lifted
    // from its 0%/26%/57%/100% left/top marks), now chained as 3 leaps with
    // real launch -> apex -> landing arcs instead of interpolated percentages.
    var START_X = Number(route.x || 50), START_Y = Number(route.y || 52);
    // Apex heights are now only a modest rise above the higher of each leap's
    // two endpoints (~8%), not a big floaty bulge (was 13-21%). Same start/end
    // waypoints and durations as before, so the traversal still lands in the
    // same places at the same times — only the shape of the arc in between is
    // flatter and reads as a committed running leap rather than a bounce.
    var LEAP_DEFS = (route.leaps || [
      { x1: 73, y1: 47, apexY: 40, dur: 1600 },
      { x1: 92, y1: 42, apexY: 34, dur: 1050 },
      { x0: 8, y0: 41, x1: 28, y1: 39, apexY: 31, dur: 1500 }
    ]).map(function(leap){ return Object.assign({}, leap); });
    var CONTACT_MS = 150;   // brief ground-contact/compression pause between leaps
    var LAND_HOLD_MS = 260; // extra settle time after the final landing for squash/glow decay
    var START_DELAY = Number(route.delay == null ? 280 : route.delay);

    // Real parkour/leap traversal keeps the torso upright and controlled — a
    // subtle lean into the direction of travel, not a visible tumble. Both
    // values cut roughly in half from the previous pass, which read as a
    // leaning/tumbling silhouette.
    var MAX_LEAN = 16;      // deg, cap on velocity-derived rotation
    var LEAN_SCALE = 0.32;
    var VY_REF = .34;       // %/ms — reference vertical speed used to normalize gait/impact intensity

    // Brief crouch/wind-up before each launch (anticipation) — legs/torso
    // compress for the last ~100ms of ground contact right before takeoff,
    // on top of the existing post-landing squash-stretch settle.
    var ANTICIPATION_MS = 100;
    var CROUCH_SX = 1.10, CROUCH_SY = 0.90;

    // Precompute each leap's real ballistic parameters (x(t)=x0+vx*t,
    // y(t)=y0+vy*t+0.5*g*t^2) from its start/end height and apex height:
    // rise time t_up=sqrt(2*hUp/g), fall time t_down=sqrt(2*hDown/g), with
    // t_up+t_down pinned to the leap's total duration.
    var x0 = START_X, y0 = START_Y;
    LEAP_DEFS.forEach(function(leap){
      if (Number.isFinite(leap.x0)) x0 = leap.x0;
      if (Number.isFinite(leap.y0)) y0 = leap.y0;
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

      // Anticipation: a brief crouch/wind-up in the last ANTICIPATION_MS
      // before each launch (including the very first one, off the initial
      // hold). 0 while airborne or freshly landed, ramping to 1 right as the
      // next leap's launch instant arrives.
      var crouchT = 0;
      if (elapsed < 0) {
        crouchT = clamp(1 - (0 - elapsed) / ANTICIPATION_MS, 0, 1);
      } else if (elapsed < TOTAL_MS) {
        var crouchSegIdx = findSegment(elapsed);
        var crouchSeg = segments[crouchSegIdx];
        if (crouchSeg.type === 'contact' && crouchSegIdx + 1 < segments.length) {
          var nextLaunch = segments[crouchSegIdx + 1].start;
          crouchT = clamp(1 - (nextLaunch - elapsed) / ANTICIPATION_MS, 0, 1);
        }
      }
      if (crouchT > 0 && inContact) {
        y += crouchT * 0.8; // sink very slightly into the ground right before takeoff
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

      // Squash/stretch target is 1/1 at rest, but blends toward the crouch
      // pose during the pre-launch anticipation window computed above — the
      // same spring that eases the post-landing impact squash back to
      // neutral now also eases it into (and back out of) the wind-up crouch.
      var squashTargetSx = 1 + (CROUCH_SX - 1) * crouchT;
      var squashTargetSy = 1 - (1 - CROUCH_SY) * crouchT;
      pose.sx += (squashTargetSx - pose.sx) * kSquash;
      pose.sy += (squashTargetSy - pose.sy) * kSquash;
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
          '<video class="rw-film" muted autoplay playsinline webkit-playsinline preload="auto" poster="assets/roamwise-opening-first.webp" aria-hidden="true">'+
            '<source src="assets/roamwise-opening.mp4" type="video/mp4">'+
          '</video>'+
          '<div class="rw-sheen" aria-hidden="true"></div>'+
          traveler('rw-shinobi--primary')+
          traveler('rw-shinobi--secondary')+
          traveler('rw-shinobi--tertiary')+
          '<div class="rw-loader-mask" aria-hidden="true"></div>'+
          '<div class="rw-loadMobile"><span>Entering RoamWise</span>'+track()+'</div>'+
        '</div>'+
        '<div class="rw-brandDesk" aria-hidden="true"><h1>ROAMWISE</h1><p>Shinobi Atlas</p><div class="rw-loadDesk"><span>Entering RoamWise</span>'+track()+'</div></div>'+
      '</div>'+
      '<div class="rw-fx rw-matrix" aria-hidden="true"></div>'+
      '<div class="rw-fx rw-rain" aria-hidden="true"></div>'+
      '<div class="rw-fx rw-thunder" aria-hidden="true"></div>'+
      '<div class="rw-vignette" aria-hidden="true"></div>'+
      '<div class="rw-audio-gate rw-auto-info" aria-live="polite"><div class="rw-stat-card"><span class="rw-stat-kicker">Today&#39;s travel signal</span><strong class="rw-stat-value">Checking today&#39;s world update&hellip;</strong><small class="rw-stat-detail">Fresh insight for your local date.</small></div><div class="rw-skip-hint">Tap anywhere to skip</div></div>'+
      '<button class="rw-skip" type="button" aria-label="Skip intro">Skip&nbsp; &#8594;</button>';

    document.body.appendChild(root);
    finishBoot();

    var video = root.querySelector('.rw-film');
    /* Built via the DOM rather than as innerHTML markup so this stays a still
       fallback that only ever loads its ~5MB GIF on the video's actual error
       path (see the video 'error' listener below) — never a poster/preview
       image fetched up front. */
    var filmGif = document.createElement('img');
    filmGif.className = 'rw-film-gif';
    filmGif.alt = '';
    filmGif.setAttribute('aria-hidden', 'true');
    video.insertAdjacentElement('afterend', filmGif);
    var skip = root.querySelector('.rw-skip');
    var statKicker = root.querySelector('.rw-stat-kicker');
    var statValue = root.querySelector('.rw-stat-value');
    var statDetail = root.querySelector('.rw-stat-detail');
    var shinobiEls = root.querySelectorAll('.rw-shinobi');
    /* Route 1 is deliberately Africa -> India -> across the globe to North
       America. The two smaller travellers take different continental paths,
       so the atlas feels inhabited without turning into visual clutter. */
    var routes = [
      {x:50,y:52,delay:260,leaps:[
        {x1:73,y1:47,apexY:40,dur:1600},
        {x1:92,y1:42,apexY:34,dur:1050},
        {x0:8,y0:41,x1:28,y1:39,apexY:31,dur:1500}
      ]},
      {x:38,y:59,delay:760,leaps:[
        {x1:57,y1:38,apexY:31,dur:1750},
        {x1:82,y1:43,apexY:34,dur:1850}
      ]},
      {x:24,y:40,delay:1180,leaps:[
        {x1:55,y1:36,apexY:28,dur:1850},
        {x1:51,y1:57,apexY:32,dur:1900}
      ]}
    ];
    var shinobiPhysics = Array.prototype.map.call(shinobiEls, function(el, index){
      return runShinobiPhysics(el, routes[index]);
    });
    var closed = false;
    var started = false;
    var videoReady = false;
    var closeTimer = null;
    var statTimer = null;
    var now = new Date();
    var dateLabel = now.toLocaleDateString('en-IN', {day:'numeric', month:'short'});
    /* Two calm, readable cards across the 6.8s film. More rapid messages
       looked busy and disappeared before people could actually read them. */
    var stats = [
      ['Today · '+dateLabel, 'Checking today\'s world update…', 'Fresh insight for your local date.'],
      ['RoamWise signal', '5 free searches every day', 'Fast planning — no account needed.']
    ];

    function showStat(stat){
      if (statKicker) statKicker.textContent = stat[0];
      if (statValue) statValue.textContent = stat[1];
      if (statDetail) statDetail.textContent = stat[2];
    }

    function cycleStats(){
      var index = 0;
      statTimer = setInterval(function(){
        index = (index + 1) % stats.length;
        showStat(stats[index]);
      }, 3400);
    }

    function cleanInsight(value){
      var text = String(value || '').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
      if (text.length > 92) text = text.slice(0, 89).replace(/\s+\S*$/,'') + '…';
      return text;
    }

    function useNewsJson(data){
      var updated = data && data.updated ? new Date(data.updated) : null;
      var age = updated && !Number.isNaN(updated.getTime()) ? Math.abs(Date.now() - updated.getTime()) : Infinity;
      var item = data && data.items && data.items[0];
      if (!item || age > 36 * 60 * 60 * 1000) throw new Error('stale travel feed');
      var headline = cleanInsight(item.crunch || item.headline);
      if (!headline) throw new Error('empty travel feed');
      stats[0] = ['Live travel update · '+dateLabel, headline, cleanInsight(item.source || 'RoamWise Travel Pulse')];
      showStat(stats[0]);
    }

    function useWikimedia(data){
      var story = data && data.news && data.news[0] && data.news[0].story;
      story = cleanInsight(story);
      if (!story) throw new Error('no same-day current event');
      stats[0] = ['World update · '+dateLabel, story, 'Wikimedia current events · checked today'];
      showStat(stats[0]);
    }

    function useOnThisDay(data){
      var selected = data && data.selected && data.selected[0];
      var insight = cleanInsight(selected && selected.text);
      if (!insight) return;
      stats[0] = ['On this day · '+dateLabel, insight, 'A date-matched travel and culture insight'];
      showStat(stats[0]);
    }

    function loadDailySignal(){
      var yyyy = now.getFullYear();
      var mm = String(now.getMonth()+1).padStart(2,'0');
      var dd = String(now.getDate()).padStart(2,'0');
      fetch('news.json?date='+yyyy+'-'+mm+'-'+dd, {cache:'no-store'})
        .then(function(response){ if (!response.ok) throw new Error('no daily feed'); return response.json(); })
        .then(useNewsJson)
        .catch(function(){
          return fetch('https://api.wikimedia.org/feed/v1/wikipedia/en/featured/'+yyyy+'/'+mm+'/'+dd, {cache:'no-store'})
            .then(function(response){ if (!response.ok) throw new Error('no current events'); return response.json(); })
            .then(useWikimedia);
        })
        .catch(function(){
          return fetch('https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/'+mm+'/'+dd, {cache:'no-store'})
            .then(function(response){ if (!response.ok) throw new Error('no daily insight'); return response.json(); })
            .then(useOnThisDay);
        })
        .catch(function(){
          stats[0] = ['Today · '+dateLabel, 'Travel farther, plan lighter', 'RoamWise keeps this card useful even when you are offline.'];
          showStat(stats[0]);
        });
    }

    function beginVisual(withSound){
      if (started || closed) return;
      started = true;
      root.classList.add('rw-started');
      var reducedMotionNow = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reducedMotionNow) shinobiPhysics.forEach(function(physics){ physics.start(); });
      try {
        window.dispatchEvent(new CustomEvent('rw:opening-start'));
      } catch (_) {}
      /* The ordered startup loader makes the one-shot cue available before
         the opener. Audible autoplay may still be blocked by browser policy;
         the visual never waits for it. Do not call RWAudio.play() here:
         starting ambient before the cue would recreate overlapping audio. */
      try {
        if (withSound && typeof window.rwPlayCue === 'function') {
          var resumeAmbient = !!(window.RWAudio && RWAudio.isLoopEnabled && RWAudio.isLoopEnabled());
          window.rwPlayCue('site_opening', { resumeAmbient: resumeAmbient });
        }
      } catch (_) {}
      /* Calling play before canplay intentionally kicks browsers that ignore
         preload while media is hidden behind the sound gate. The film is
         muted/inline, so this is permitted; canplay retries if still needed. */
      var videoPlay = video.play();
      if (videoPlay && typeof videoPlay.catch === 'function') videoPlay.catch(function(){});
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      closeTimer = setTimeout(close, reduced ? Math.min(DURATION, 4200) : DURATION);
    }

    function close(){
      if (closed) return;
      closed = true;
      if (closeTimer) clearTimeout(closeTimer);
      if (statTimer) clearInterval(statTimer);
      shinobiPhysics.forEach(function(physics){ physics.stop(); });
      root.classList.add('rw-closing');
      try { video.pause(); } catch (_) {}
      try { if (typeof window.rwStopCue === 'function') window.rwStopCue(true); } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('rw:opening-end')); } catch (_) {}
      setTimeout(function(){
        root.remove();
        if (style.parentNode) style.remove();
      }, 620);
    }

    skip.addEventListener('click', close);
    root.addEventListener('click', close);
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
    video.addEventListener('loadedmetadata', function(){
      /* The encoded film begins with a short black frame. The continuity
         image is already visible, then playback joins it at the first globe
         frame instead of flashing the discarded splash. */
      try { if (video.currentTime < .2) video.currentTime = .22; } catch (_) {}
    }, {once:true});
    video.addEventListener('ended', close, {once:true});
    video.addEventListener('error', function(){
      root.classList.add('rw-video-failed');
      /* The GIF is only fetched now, on the actual failure path, so the
         normal (video-plays-fine) path never pays for its ~5MB download. */
      if (filmGif && !filmGif.src) filmGif.src = 'assets/roamwise-opening.gif';
    }, {once:true});

    loadDailySignal();
    cycleStats();
    /* Start the muted inline film and all visual effects immediately. The
       cue is attempted at the same time and fails silently where audible
       autoplay is prohibited; tapping anywhere is reserved only for skip. */
    beginVisual(true);
  }

  /* rw-config is loaded near the bottom of index.html, so body already exists in
     normal navigation. Mount immediately rather than waiting for DOMContentLoaded. */
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, {once:true});
})();
