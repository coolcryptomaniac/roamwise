// @ts-nocheck
/* Transparent, on-device personalisation. Account/payment data is deliberately
   outside this store. A user can pause learning or erase the learned planning
   profile from Settings without clearing their login or Pro entitlement. */
var RW_PREFS_KEY='rw_planning_preferences_v1';
var RW_PREFS_ENABLED_KEY='rw_personalisation_enabled';

function rwPersonalisationEnabled(){
  try{ return localStorage.getItem(RW_PREFS_ENABLED_KEY)!=='0'; }catch(e){ return true; }
}
function rwSetPersonalisationEnabled(on){
  try{ localStorage.setItem(RW_PREFS_ENABLED_KEY,on?'1':'0'); }catch(e){ /* optional storage */ }
  if(!on) rwClearLearnedPreferences(false);
  rwSyncPersonalisationUI();
  try{ showToast(on?'Personalisation is on':'Personalisation paused and learned travel preferences cleared'); }catch(e){ /* optional toast */ }
}
function rwReadPlanningPreferences(){
  if(!rwPersonalisationEnabled()) return {};
  try{ return JSON.parse(localStorage.getItem(RW_PREFS_KEY)||'{}')||{}; }catch(e){ return {}; }
}
function rwRememberPlanningPreferences(){
  if(!rwPersonalisationEnabled() || typeof document==='undefined') return;
  var get=function(id){var x=document.getElementById(id);return x?x.value:'';};
  var tags=[];
  document.querySelectorAll('#tagsContainer .tag.on').forEach(function(t){if(t.dataset&&t.dataset.v)tags.push(t.dataset.v);});
  var pref={
    origin:String(get('origin')||'').slice(0,80),
    style:String(get('style')||'').slice(0,50),crowd:String(get('crowd')||'').slice(0,20),
    travelMode:String(get('tmode')||'').slice(0,20),partySize:Math.min(50,Math.max(1,Number(get('partySize'))||1)),
    interests:tags.slice(0,12),focusModes:typeof rwActiveFocusModes==='function'?rwActiveFocusModes():[],updatedAt:Date.now()
  };
  try{ localStorage.setItem(RW_PREFS_KEY,JSON.stringify(pref));localStorage.setItem('rw_party_size',String(pref.partySize)); }catch(e){ /* optional storage */ }
}
function rwApplyPlanningPreferences(){
  if(typeof document==='undefined')return;
  var p=rwReadPlanningPreferences();
  function set(id,v){var x=document.getElementById(id);if(x&&v!=null&&v!=='')x.value=String(v);}
  set('origin',p.origin);set('style',p.style);set('crowd',p.crowd);set('tmode',p.travelMode);set('partySize',p.partySize);
  if(Array.isArray(p.interests)&&p.interests.length){
    document.querySelectorAll('#tagsContainer .tag').forEach(function(t){t.classList.toggle('on',p.interests.indexOf(t.dataset.v)>=0);});
  }
  if(typeof rwSyncFocusModes==='function'&&Array.isArray(p.focusModes))rwSyncFocusModes(p.focusModes);
  try{ if(typeof rwPartyChanged==='function')rwPartyChanged(); }catch(e){ /* optional module */ }
  rwPersonaliseHome();
}
function rwPersonaliseHome(){
  if(!rwPersonalisationEnabled())return;
  var profile={};
  try{ if(typeof rwUserProfile==='function')profile=rwUserProfile()||{}; }catch(e){ profile={}; }
  if((profile.count||0)<3)return;
  var input=document.getElementById('heroInput');if(!input)return;
  var bits=[];
  if(profile.typicalDays)bits.push(profile.typicalDays+' days');
  if(profile.topVibe)bits.push(profile.topVibe);
  input.placeholder='Plan another '+(bits.join(' ')||'trip')+' — add a destination and budget';
}
function rwClearLearnedPreferences(showMessage){
  try{
    localStorage.removeItem(RW_PREFS_KEY);
    localStorage.removeItem('rw_intent_profile');
    localStorage.removeItem('rw_turns');
    localStorage.removeItem('rw_party_size');
    localStorage.removeItem('rw_travel_focus_v1');
  }catch(e){ /* optional storage */ }
  var defaults={origin:'India',style:'Solo backpacker',crowd:'avoid',tmode:'std',partySize:'1'};
  Object.keys(defaults).forEach(function(id){var x=document.getElementById(id);if(x)x.value=defaults[id];});
  var hi=document.getElementById('heroInput');if(hi)hi.placeholder='Ask me anything — “chill 4 days near Rishikesh under 12k”';
  var partyNote=document.getElementById('partyCostNote');if(partyNote)partyNote.textContent='Costs shown for one traveller.';
  if(typeof rwSyncFocusModes==='function')rwSyncFocusModes([]);
  rwSyncPersonalisationUI();
  if(showMessage!==false){try{showToast('Learned travel preferences cleared');}catch(e){/* optional toast */}}
}
function rwSyncPersonalisationUI(){
  var toggle=document.getElementById('rwPersonalisationToggle');
  if(toggle){toggle.checked=rwPersonalisationEnabled();toggle.setAttribute('aria-checked',toggle.checked?'true':'false');}
  var status=document.getElementById('rwPersonalisationStatus');
  if(status)status.textContent=rwPersonalisationEnabled()?'On · saved only on this device':'Off · no travel preferences retained';
}
function rwMountPersonalisationSetting(){
  if(document.getElementById('rwPersonalisationSetting')){rwSyncPersonalisationUI();return;}
  var body=document.querySelector('#settingsOverlay .modal-body');if(!body)return;
  var section=document.createElement('section');
  section.id='rwPersonalisationSetting';section.className='key-section';
  section.innerHTML='<div class="key-sec-title">Personalisation</div>'+
    '<div class="rw-sound-row"><div><strong>Remember my travel style</strong><span id="rwPersonalisationStatus">On · saved only on this device</span></div>'+
    '<label class="rw-sound-switch" aria-label="Remember travel preferences"><input id="rwPersonalisationToggle" type="checkbox" role="switch"><i aria-hidden="true"></i></label></div>'+
    '<p class="rw-sound-note">Remembers your usual origin, group size, travel style and interests to adapt future suggestions. Payment details are never stored here.</p>'+
    '<button type="button" class="tact" style="width:100%;margin-top:9px" onclick="rwClearLearnedPreferences(true)">Clear learned travel preferences</button>';
  body.insertBefore(section,body.firstChild);
  document.getElementById('rwPersonalisationToggle').addEventListener('change',function(){rwSetPersonalisationEnabled(this.checked);});
  rwSyncPersonalisationUI();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rwApplyPlanningPreferences,{once:true});
  else rwApplyPlanningPreferences();
}
