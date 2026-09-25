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
function rwFocusSuggestion(){
  if(typeof document==='undefined')return '';
  var destination=String((document.getElementById('destInput')||{}).value||'');
  var wellness=document.querySelector('#tagsContainer .tag[data-v="Wellness"].on');
  var crowd=String((document.getElementById('crowd')||{}).value||'');
  if(wellness||/\b(rishikesh|yoga|ashram|wellness|meditat)/i.test(destination))return 'yoga';
  if(crowd==='avoid')return 'peace';
  return '';
}
function rwRefreshFocusSummary(modes){
  if(typeof document==='undefined')return;
  modes=rwNormaliseFocusModes(modes==null?rwActiveFocusModes():modes);
  var title=document.getElementById('focusSummaryTitle'),hint=document.getElementById('focusSummaryHint'),icon=document.querySelector('#focusPicker .focus-summary-icon'),suggestion=rwFocusSuggestion();
  if(title)title.textContent=rwFocusLabel(modes)||'Regular trip';
  if(icon)icon.textContent=modes.indexOf('yoga')>=0?'🧘':modes.indexOf('peace')>=0?'🌿':suggestion==='yoga'?'🧘':'🌿';
  if(hint)hint.textContent=modes.length===2?'Quiet rhythm + yoga-first days':modes[0]==='peace'?'Quiet times, calm routes, no shopping detours':modes[0]==='yoga'?'Practice, simple food and recovery first':suggestion==='yoga'?'Yoga focus may fit this plan':suggestion==='peace'?'Peace focus may fit your crowd choice':'Add calm or yoga only if it helps';
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
          :'No extra focus selected. Your other choices stay unchanged.';
  }
  rwRefreshFocusSummary(modes);
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
  var picker=typeof document!=='undefined'&&document.getElementById('focusPicker');if(picker)picker.open=true;
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
  if(!document.getElementById('rwFocusModeStyles')){
    var style=document.createElement('style');style.id='rwFocusModeStyles';style.textContent=`
      .focus-picker{border:1px solid rgba(129,145,191,.22);border-radius:13px;background:linear-gradient(145deg,rgba(21,29,51,.74),rgba(13,19,35,.58));overflow:hidden;transition:border-color .2s ease,background .2s ease}
      .focus-picker[open]{border-color:rgba(82,211,171,.34);background:linear-gradient(145deg,rgba(22,42,49,.72),rgba(20,25,44,.72))}
      .focus-picker>summary{list-style:none;display:grid;grid-template-columns:32px 1fr auto;gap:9px;align-items:center;min-height:48px;padding:8px 11px;cursor:pointer;user-select:none}.focus-picker>summary::-webkit-details-marker{display:none}.focus-picker>summary:focus-visible{outline:2px solid #5fd7b3;outline-offset:-2px}.focus-picker>summary b{display:block;font-size:12.5px;color:var(--t1)}.focus-picker>summary small{display:block;margin-top:2px;font-size:10.5px;line-height:1.3;color:var(--t3)}.focus-picker>summary i{font-size:10px;font-style:normal;color:#77dfc0;border:1px solid rgba(95,215,179,.28);border-radius:999px;padding:5px 8px}.focus-summary-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:rgba(78,199,159,.12);font-size:16px}
      .focus-modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 10px 8px}.focus-mode{display:flex;align-items:center;gap:8px;min-height:48px;padding:8px 10px;border:1px solid rgba(129,145,191,.22);border-radius:11px;background:rgba(18,25,45,.72);color:var(--t1);text-align:left;cursor:pointer;transition:transform .14s ease,border-color .2s ease,background .2s ease,box-shadow .2s ease}.focus-mode:active{transform:scale(.97)}.focus-mode:focus-visible{outline:2px solid #5fd7b3;outline-offset:2px}.focus-mode[aria-pressed="true"]{border-color:#52d3ab;background:linear-gradient(135deg,rgba(54,189,148,.19),rgba(93,80,205,.12));box-shadow:0 0 0 1px rgba(82,211,171,.08),0 8px 22px rgba(11,34,37,.22)}.focus-mode-icon{font-size:17px}.focus-mode b{display:block;font-size:12px}.focus-mode small{display:block;margin-top:1px;font-size:10px;color:var(--t3)}.focus-mode[aria-pressed="true"] small{color:#bfeadd}.focus-mode-note{padding:0 11px 10px;font-size:10.5px;line-height:1.42;color:var(--t3)}
      @media(max-width:420px){.focus-picker>summary{grid-template-columns:30px 1fr auto}.focus-modes{grid-template-columns:1fr 1fr}}
      @media(prefers-reduced-motion:reduce){.focus-picker,.focus-mode{transition:none!important}}
    `;document.head.appendChild(style);
  }
  if(host.dataset.bound==='true'){rwSyncFocusModes();return;}host.dataset.bound='true';
  host.addEventListener('click',function(e){var b=e.target.closest('.focus-mode');if(b&&host.contains(b))rwToggleFocusMode(b.dataset.focus);});
  var crowd=document.getElementById('crowd');if(crowd)crowd.addEventListener('change',function(){rwRefreshFocusSummary();});
  var tags=document.getElementById('tagsContainer');if(tags)tags.addEventListener('click',function(){setTimeout(function(){rwRefreshFocusSummary();},0);});
  var destination=document.getElementById('destInput');if(destination)destination.addEventListener('input',function(){rwRefreshFocusSummary();});
  rwSyncFocusModes();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rwInitFocusModes,{once:true});
  else rwInitFocusModes();
}
