import {ROLE_INFO,rankCandidates,conceptIdeasFor} from './core.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='rw-network-match-shortlist-v1';
let profiles=[],ready=false,deck=[],position=0,limited=false,saved=[];
const ICON=role=>ROLE_INFO[role]?.icon||'🤝';
function loadSaved(){
 try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&['idea','profile'].includes(x.kind)&&typeof x.id==='string').slice(0,100):[];}catch{return[];}
}
saved=loadSaved();
function storeSaved(){try{localStorage.setItem(KEY,JSON.stringify(saved.slice(-100)));}catch{}}
function viewer(){
 const role=$('matchRole').value,place=$('matchRegion').value.trim();
 return {role,town:place,region:place,topics:$('matchTopics').value.split(',').map(x=>x.trim()).filter(Boolean),
  modes:$('matchMode').value?[$('matchMode').value]:[],goals:[],lookingFor:[],offers:[]};
}
function makeCards(){
 const me=viewer(),view=$('matchView').value;
 $('matchJoin').href=ROLE_INFO[me.role]?.join||'/';
 const real=rankCandidates(me,profiles,{limit:100});
 let items=view==='profiles'?real.map(x=>({kind:'profile',...x})):[],fallback=false;
 if(!items.length){
  fallback=true;
  items=conceptIdeasFor(me.role).map((x,i)=>({kind:'idea',idea:x,id:x.forRole+'-'+x.withRole+'-'+i}));
 }
 deck=items;position=0;
 const total=profiles.length;
 $('deckStatus').textContent=!ready?'Public directory unavailable. Showing idea cards only.'
  :view==='ideas'?'Exploratory collaboration concepts · these are not real offers or people.'
  :total===0?'No mutually opted-in public profiles yet. Showing clearly labeled collaboration ideas.'
  :fallback?'No compatible approved profile for these preferences. Showing collaboration concepts.'
  :real.length+' compatible public professional profiles from '+total+' opt-in listings'+(limited?' · index is size-limited':'')+'.';
 render();
}
function drawCard(item){
 if(item.kind==='profile'){
  const {profile:p,fit}=item;
  return '<div class="art" aria-hidden="true">'+ICON(p.role)+'<span class="art-motif">✧</span></div>'
    +'<div class="deck-content"><div class="type">'+esc(ROLE_INFO[p.role]?.name||p.role)+' · public matching consent</div>'
    +'<h3>'+esc(p.name)+'</h3>'
    +'<p>'+esc([p.town,p.region].filter(Boolean).join(', ')||'Location not disclosed')+'</p>'
    +'<p>'+esc(p.description||p.niche||'Professional profile. Ask about collaboration goals before agreeing.')+'</p>'
    +'<div class="signal"><span class="fit">'+fit.score+' / 100 preference fit</span>'
    +'<span class="pill">Mutual interest not yet confirmed</span></div>'
    +'<div class="why"><strong>Why this may fit</strong><ul>'+fit.reasons.slice(0,5).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'
    +'<p class="sub">Opted-in public listing. Published status is not a guarantee of safety, availability, credentials or payment.</p></div>';
 }
 const x=item.idea;
 return '<div class="art" aria-hidden="true">'+ICON(x.forRole)+' <span style="font-size:49px">×</span> '+ICON(x.withRole)+'<span class="art-motif">✧</span></div>'
   +'<div class="deck-content"><div class="concept-flag">Collaboration concept · NOT an actual person, property or live offer</div>'
   +'<div class="type" style="margin-top:15px">'+esc(ROLE_INFO[x.forRole]?.name||x.forRole)+' × '+esc(ROLE_INFO[x.withRole]?.name||x.withRole)+'</div>'
   +'<h3>'+esc(x.title)+'</h3><p>'+esc(x.explanation)+'</p>'
   +'<div class="signal">'+x.tags.map(t=>'<span class="pill">#'+esc(t)+'</span>').join('')+'</div>'
   +'<div class="why"><strong>What to check together</strong><ul><li>Both sides opt in and approve the same brief</li>'
   +'<li>Verify identity, qualifications and provider status where relevant</li><li>Confirm exact dates, rights, money and cancellation terms separately</li></ul></div></div>';
}
function render(){
 const item=deck[position],total=deck.length;
 $('deckPosition').textContent=total?Math.min(position+1,total)+' / '+total:'0 / 0';
 $('skipBtn').disabled=!item;$('saveBtn').disabled=!item;$('detailsBtn').disabled=!item;
 if(!item){$('deckCard').innerHTML='<div class="empty-card"><h3>All cards explored ✨</h3><p>Change your role or preferences to discover more ideas, or join the network so future approved matches can find you.</p></div>';renderSaved();return;}
 $('deckCard').style.transform='';
 $('deckCard').style.opacity='1';
 $('deckCard').innerHTML=drawCard(item);
 $('deckCard').setAttribute('aria-label',(item.kind==='profile'?item.profile.name:item.idea.title)+', card '+(position+1)+' of '+total);
 renderSaved();
}
function saveItem(item){
 const id=item.kind==='profile'?item.profile.role+'|'+item.profile.id:item.id;
 if(!saved.some(x=>x.kind===item.kind&&x.id===id)){
  saved.push({kind:item.kind,id,title:item.kind==='profile'?item.profile.name:item.idea.title,
     role:item.kind==='profile'?item.profile.role:item.idea.withRole});
  storeSaved();
 }
}
function next(save){
 const item=deck[position];if(!item)return;
 if(save)saveItem(item);
 position++;
 render();
}
function details(){
 const item=deck[position];if(!item)return;
 if(item.kind==='profile'){
  const p=item.profile;
  const link=p.profileUrl||p.portfolioUrl;
  if(link){window.open(link,'_blank','noopener,noreferrer');return;}
 }
 const role=viewer().role,join=ROLE_INFO[role]?.join||'/network/';
 window.location.assign(join);
}
function renderSaved(){
 const host=$('savedCards');
 if(!saved.length){host.innerHTML='<p class="sub">No saved matches yet. Tap ♥ to keep a useful profile or concept here.</p>';return;}
 host.innerHTML=saved.slice().reverse().map(x=>'<article><strong>'+ICON(x.role)+' '+esc(x.title)+'</strong><small>'
  +(x.kind==='profile'?'Saved public profile':'Saved collaboration idea')+'</small></article>').join('');
}
function bind(){
 for(const k of ['matchRole','matchRegion','matchTopics','matchMode','matchView']){
  $(k).addEventListener(k==='matchRegion'||k==='matchTopics'?'input':'change',makeCards);
 }
 $('matchPrefs').addEventListener('submit',e=>e.preventDefault());
 $('skipBtn').addEventListener('click',()=>next(false));
 $('saveBtn').addEventListener('click',()=>next(true));
 $('detailsBtn').addEventListener('click',details);
 $('clearSaved').addEventListener('click',()=>{saved=[];storeSaved();renderSaved();});
 $('deckCard').addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){e.preventDefault();next(false);}
  if(e.key==='ArrowRight'){e.preventDefault();next(true);}
  if(e.key==='Enter'){e.preventDefault();details();}
 });
 let start=null;
 $('deckCard').addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.pointerType==='mouse')return;
  start={x:e.clientX,y:e.clientY};
 });
 $('deckCard').addEventListener('pointerup',e=>{
  if(!start)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
  if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.4)next(dx>0);
 });
 $('deckCard').addEventListener('pointercancel',()=>{start=null;});
}
async function boot(){
 bind();
 try{
  const res=await fetch('./data.json',{credentials:'omit',cache:'no-store'});
  if(!res.ok)throw Error('directory missing');
  const d=await res.json();
  if(d.version!==1||d.source!=='public-network-directory-only'||!Array.isArray(d.profiles))throw Error('unsupported directory');
  profiles=d.profiles.filter(p=>p&&p.publicStatus==='approved_for_public_matching'&&typeof p.name==='string'&&ROLE_INFO[p.role]).slice(0,2000);
  limited=Boolean(d.limited);ready=true;
 }catch{profiles=[];ready=false;}
 makeCards();
}
boot();
