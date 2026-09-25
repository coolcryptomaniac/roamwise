// @ts-nocheck
/* Peace Mode + Yoga Mode are planner constraints, not decorative themes.
   They remain on-device and can be combined. The mode scorer only uses the
   curated destination fields already present in RoamWise. */
var RW_FOCUS_KEY='rw_travel_focus_v1';
var RW_FOCUS_IDS=['peace','yoga'];

function rwNormaliseFocusModes(value){
  var list=Array.isArray(value)?value:[];
  return RW_FOCUS_IDS.filter(function(id){return list.indexOf(id)>=0;});
}
function rwStoredFocusModes(){
  try{return rwNormaliseFocusModes(JSON.parse(localStorage.getItem(RW_FOCUS_KEY)||'[]'));}catch(e){return [];}
}
function rwActiveFocusModes(){
  if(typeof document!=='undefined'){
    var host=document.getElementById('focusModes');
    if(host){
      return [].slice.call(host.querySelectorAll('.focus-mode[aria-pressed="true"]')).map(function(b){return b.dataset.focus;});
    }
  }
  return rwStoredFocusModes();
}
function rwFocusLabel(modes){
  modes=rwNormaliseFocusModes(modes||rwActiveFocusModes());
  if(modes.length===2)return 'Peace + Yoga Mode';
  if(modes[0]==='peace')return 'Peace Mode';
  if(modes[0]==='yoga')return 'Yoga Mode';
  return '';
}
function rwSaveFocusModes(modes){
  modes=rwNormaliseFocusModes(modes);
  try{
    if(typeof rwPersonalisationEnabled==='function'&&!rwPersonalisationEnabled())localStorage.removeItem(RW_FOCUS_KEY);
    else localStorage.setItem(RW_FOCUS_KEY,JSON.stringify(modes));
  }catch(e){/* optional on-device preference */}
  return modes;
}
function rwSyncFocusModes(modes){
  modes=rwNormaliseFocusModes(modes==null?rwStoredFocusModes():modes);
  if(typeof document==='undefined')return modes;
  document.querySelectorAll('#focusModes .focus-mode').forEach(function(b){
    var on=modes.indexOf(b.dataset.focus)>=0;
    b.setAttribute('aria-pressed',on?'true':'false');
  });
  var note=document.getElementById('focusModeNote');
  if(note){
    note.textContent=modes.length===2
      ?'Combined: quiet timings, low-pressure routes and a yoga-first daily rhythm.'
      :modes[0]==='peace'
        ?'Peace Mode: quieter timings and routes, with shopping stops left out unless requested.'
        :modes[0]==='yoga'
          ?'Yoga Mode: practice, rest and suitable schools come before checklist sightseeing.'
          :'Choose either mode, or combine both for a quiet yoga-first journey.';
  }
  return modes;
}
function rwSetFocusMode(id,on,quiet){
  if(RW_FOCUS_IDS.indexOf(id)<0)return rwActiveFocusModes();
  var modes=rwActiveFocusModes();
  var at=modes.indexOf(id);
  if(on&&at<0)modes.push(id);
  if(!on&&at>=0)modes.splice(at,1);
  modes=rwSaveFocusModes(modes);
  rwSyncFocusModes(modes);
  if(on&&typeof document!=='undefined'){
    var crowd=document.getElementById('crowd');if(crowd)crowd.value='avoid';
    if(id==='yoga'){
      var wellness=document.querySelector('#tagsContainer .tag[data-v="Wellness"]');
      if(wellness)wellness.classList.add('on');
    }
  }
  if(!quiet&&typeof showToast==='function')showToast((rwFocusLabel(modes)||'Travel focus')+(modes.length?' selected':' cleared'));
  return modes;
}
function rwToggleFocusMode(id){
  var modes=rwActiveFocusModes();
  return rwSetFocusMode(id,modes.indexOf(id)<0,false);
}
function rwOpenFocusMode(id){
  rwSetFocusMode(id,true,true);
  try{if(typeof tabGo==='function')tabGo('plan');}catch(e){/* optional adaptive shell */}
  var host=typeof document!=='undefined'&&document.getElementById('focusModes');
  if(host)setTimeout(function(){host.scrollIntoView({behavior:'smooth',block:'center'});},80);
}
function rwModesFromText(text){
  text=String(text||'');var out=[];
  if(/\b(peace mode|quiet trip|quieter trip|avoid crowds?|less crowded|minimal crowds?|no shopping stops?|sales pressure|selling pressure|high[- ]pressure|low[- ]pressure|sukoon|shaant)\b/i.test(text)||/\bquiet(?:\s+[^\s]+){0,3}\s+(?:trip|travel|stay|holiday|journey)\b/i.test(text))out.push('peace');
  if(/\b(yoga mode|yoga[- ]first|yoga retreat|yoga holiday|yoga trip|ashram stay|meditation retreat)\b/i.test(text))out.push('yoga');
  return out;
}
function rwActivateFocusFromText(text,quiet){
  var found=rwModesFromText(text),modes=rwActiveFocusModes();
  found.forEach(function(id){if(modes.indexOf(id)<0)modes.push(id);});
  if(found.length){rwSaveFocusModes(modes);rwSyncFocusModes(modes);var c=typeof document!=='undefined'&&document.getElementById('crowd');if(c)c.value='avoid';}
  if(found.length&&!quiet&&typeof showToast==='function')showToast(rwFocusLabel(modes)+' selected');
  return found;
}
function rwFocusScore(destination,crowdValue){
  var modes=rwActiveFocusModes();if(!modes.length||!destination)return 0;
  var words=((destination.interests||[]).concat(destination.tags||[]).join(' ')).toLowerCase();
  var score=0,cs=Number(crowdValue);if(!isFinite(cs))cs=50;
  if(modes.indexOf('peace')>=0){
    score+=(100-cs)*.35;
    if(/slow|nature|offbeat|wellness|spiritual|hills|monaster/.test(words))score+=14;
    if(cs>65)score-=22;
  }
  if(modes.indexOf('yoga')>=0){
    if(/\byoga\b/.test(words))score+=46;
    if(/wellness|meditat|ayurveda/.test(words))score+=22;
    if(/spiritual|ashram/.test(words))score+=14;
  }
  return score;
}
function rwFocusPrompt(){
  var modes=rwActiveFocusModes(),parts=[];
  if(modes.indexOf('peace')>=0)parts.push('PEACE MODE: use opening-time visits, quieter routes and calm breaks; leave out markets and shopping stops unless requested; prefer clearly priced options; describe pressure neutrally and never accuse a person or business without verified evidence.');
  if(modes.indexOf('yoga')>=0)parts.push('YOGA MODE: build the day around level-suitable yoga or meditation, simple vegetarian food, recovery time and realistic transfers; tell the traveller to verify teacher credentials, style, level, schedule and total price; never invent certification or make medical claims.');
  return parts.join(' ');
}
function rwFocusSummaryHTML(){
  var modes=rwActiveFocusModes(),label=rwFocusLabel(modes);if(!label)return '';
  var copy=modes.length===2
    ?'Quieter timings, lower-pressure routes and a yoga-first daily rhythm are being prioritised.'
    :modes[0]==='peace'
      ?'Quieter timings and calm routes are prioritised. Shopping stops stay out unless requested.'
      :'Yoga practice, suitable schools, simple food and recovery time are prioritised.';
  return '<div class="focus-result"><b>'+(modes.indexOf('yoga')>=0?'&#129496; ':'&#127807; ')+label+'</b><br>'+copy+'</div>';
}
function rwInitFocusModes(){
  if(typeof document==='undefined')return;
  var host=document.getElementById('focusModes');if(!host)return;
  host.addEventListener('click',function(e){var b=e.target.closest('.focus-mode');if(b&&host.contains(b))rwToggleFocusMode(b.dataset.focus);});
  rwSyncFocusModes();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rwInitFocusModes,{once:true});
  else rwInitFocusModes();
}
