/* Creator Command Centre navigation and data-quality summary.
   Read-only; never sends outreach or mutates creator verification. */
(function(){
'use strict';
var dash=document.getElementById('caDash');if(!dash)return;
var hero=dash.querySelector('.ca-hero');if(!hero)return;
var nav=document.createElement('nav');nav.id='rwCreatorNav';nav.setAttribute('aria-label','Creator management sections');
var sections=[
['Overview','.ca-stats'],['Roster','#rsRoster'],['Onboarding','#caApps'],['Active creators','#caCreators'],
['Payments','#caProtection'],['Content','#caContent']
];
function addLinks(){
var found=0;nav.textContent='';
sections.forEach(function(s){var el=dash.querySelector(s[1]);if(!el)return;
if(!el.id)el.id='rwNav'+(++found);var a=document.createElement('a');a.href='#'+el.id;a.textContent=s[0];nav.appendChild(a)});
}
hero.insertAdjacentElement('afterend',nav);
var banner=document.createElement('div');banner.className='rw-ops-banner';banner.setAttribute('role','status');
banner.innerHTML='<strong>Creator safety & quality</strong> · Outreach is review-first. Application counts are not verified creators; missing locations and duplicate submissions must be checked before offers. AI-generated rankings are advisory, not proof of engagement or consent.';
nav.insertAdjacentElement('afterend',banner);
function update(){addLinks();var rows=dash.querySelectorAll('.rs-row');var labels=new Map(),duplicates=0;
rows.forEach(function(el){var body=el.querySelector('.rs-body');if(!body)return;var name=(body.querySelector('b,h3,strong')||{}).textContent||'';name=name.trim().toLowerCase();if(name){if(labels.has(name))duplicates++;else labels.set(name,true)}});
banner.setAttribute('data-visible-duplicates',String(duplicates));
}
update();
var observer=new MutationObserver(function(m){if(m.some(function(x){return x.target!==nav&&x.target!==banner&&!nav.contains(x.target)&&!banner.contains(x.target)}))schedule()});
var pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;update()})}
observer.observe(dash,{childList:true,subtree:true});
window.addEventListener('hashchange',function(){var id=location.hash.slice(1);var el=id&&document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})});
})();
