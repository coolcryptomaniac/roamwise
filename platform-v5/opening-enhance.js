/* Enhances the approved cinematic opener without replacing its artwork. */
(function(){'use strict';
var css='\
#rwOpening .rw-media:after{content:"";position:absolute;left:0;right:0;bottom:0;height:12%;z-index:10;background:linear-gradient(180deg,transparent,rgba(22,5,30,.74) 32%,rgba(18,4,24,.96));pointer-events:none}\
#rwOpening .rw-shinobi{animation-name:rwHumanShinobiJourney!important;width:clamp(82px,13vw,122px)!important;height:clamp(124px,20vw,184px)!important}\
#rwOpening .rw-shinobi .rw-arm{position:absolute;top:30%;width:12%;height:37%;background:#0b0910;border-radius:999px;transform-origin:50% 8%;z-index:-1}\
#rwOpening .rw-shinobi .rw-arm.l{left:23%;animation:rwArmL .72s ease-in-out infinite alternate}\
#rwOpening .rw-shinobi .rw-arm.r{right:22%;animation:rwArmR .72s ease-in-out infinite alternate}\
#rwOpening .rw-shinobi .rw-foot{position:absolute;top:92%;width:23%;height:7%;background:#08070b;border-radius:80% 25% 60% 35%}\
#rwOpening .rw-shinobi .rw-foot.l{left:25%;transform:rotate(15deg)}#rwOpening .rw-shinobi .rw-foot.r{right:22%;transform:rotate(-13deg)}\
@keyframes rwArmL{from{transform:rotate(42deg)}to{transform:rotate(-54deg)}}@keyframes rwArmR{from{transform:rotate(-50deg)}to{transform:rotate(38deg)}}\
@keyframes rwHumanShinobiJourney{0%{left:9%;top:68%;transform:rotate(-4deg) scale(.92)}13%{left:20%;top:49%;transform:rotate(-18deg) scale(.98)}22%{left:29%;top:62%;transform:rotate(5deg) scale(1)}31%{left:39%;top:42%;transform:rotate(-12deg) scale(1.04)}43%{left:48%;top:58%;transform:rotate(4deg) scale(1.03)}55%{left:58%;top:37%;transform:rotate(-13deg) scale(1.08)}68%{left:66%;top:55%;transform:rotate(5deg) scale(1.05)}82%{left:76%;top:34%;transform:rotate(-10deg) scale(1.1)}100%{left:87%;top:52%;transform:rotate(3deg) scale(1.06)}}';
function mount(){var root=document.getElementById('rwOpening');if(!root){setTimeout(mount,80);return}var st=document.createElement('style');st.id='rwOpeningEnhance';st.textContent=css;document.head.appendChild(st);var s=root.querySelector('.rw-shinobi');if(s&&!s.querySelector('.rw-arm')){['l','r'].forEach(function(c){var a=document.createElement('i');a.className='rw-arm '+c;s.appendChild(a);var f=document.createElement('i');f.className='rw-foot '+c;s.appendChild(f)})}if(window.RWAudio){RWAudio.playTheme('opening');[1450,2900,4400,5750].forEach(function(ms,i){setTimeout(function(){RWAudio.haptic(i===3?'heavy':'light');RWAudio.playSfx('transition',.16)},ms)})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();