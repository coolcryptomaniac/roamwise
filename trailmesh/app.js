(function(){
'use strict';
var KEY='rw_trailmesh_fieldkit_v1';
var CHECKS=['Operator, permit and route confirmed','Current forecast and closure notices checked','Offline map downloaded and tested','Route shared with designated home contact','Guide contact and turnaround time agreed','Warm layers, rain shell and spare socks','Water, food and water treatment','First-aid, headlamp and power reserve','Group regroup and lost-person plan agreed','Dedicated emergency device if required by conditions'];
var LESSONS={
pace:'Take a conservative pace and allow time to acclimatise. Headache, nausea or unusual fatigue at altitude can be warning signs. Stop ascending, tell your guide and seek qualified help. Do not use an app to dismiss symptoms.',
wildlife:'Observe from a distance. Never feed animals or reveal sensitive wildlife locations online. Pack out litter, protect water sources and follow local community rules.',
lost:'Stop in a safe visible place, avoid risky shortcuts, conserve warmth and battery, and follow the agreed separated-person protocol. Use whistle/light and your emergency device where appropriate; never assume phone service.',
weather:'Recheck official forecasts and local advisories with a competent guide. If visibility or conditions deteriorate, pause or turn back. An offline note is not real-time weather information.',
history:'The Himalayas are lived-in homelands with many languages and practices. Follow locally posted rules, respect sacred spaces and seek context from people who live here rather than treating villages as scenery.'
};
function $(id){return document.getElementById(id);}
function empty(){return {plan:{},checks:{},notes:[]};}
function read(){try{var obj=JSON.parse(localStorage.getItem(KEY)||'null');if(!obj||typeof obj!=='object')return empty();return {plan:obj.plan||{},checks:obj.checks||{},notes:Array.isArray(obj.notes)?obj.notes.slice(-50):[]};}catch(e){return empty();}}
var state=read();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){return false;}}
document.querySelectorAll('[data-panel]').forEach(function(b){b.addEventListener('click',function(){
document.querySelectorAll('[data-panel]').forEach(function(x){x.classList.toggle('active',x===b);});
document.querySelectorAll('.panel').forEach(function(x){x.classList.toggle('active',x.id===b.dataset.panel);});
});});
['trail','departure','meeting','operator','contact','return'].forEach(function(id){$(id).value=String(state.plan[id]||'');});
$('savePlan').addEventListener('click',function(){
var p={};['trail','departure','meeting','operator','contact','return'].forEach(function(id){p[id]=$(id).value.trim();});
state.plan=p;$('planStatus').textContent=save()?'Saved on this device.':'Storage unavailable — copy your details somewhere safe.';
});
CHECKS.forEach(function(label,i){
var line=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.type='checkbox';input.checked===false;
input.checked=state.checks[i]===true;input.addEventListener('change',function(){state.checks[i]=input.checked;save();});
text.textContent=label;line.append(input,text);$('checks').appendChild(line);
});
$('resetChecks').addEventListener('click',function(){state.checks={};document.querySelectorAll('#checks input').forEach(function(c){c.checked=false;});save();});
function showNotes(){
$('notes').replaceChildren();
state.notes.slice().reverse().forEach(function(n){
var p=document.createElement('p');p.className='tile';var small=document.createElement('small');small.textContent=n.when+' · ';p.append(small,document.createTextNode(n.text));$('notes').append(p);
});
}
$('addEntry').addEventListener('click',function(){
var value=$('entry').value.trim();if(!value)return;
state.notes.push({when:new Date().toLocaleString(),text:value.slice(0,1200)});
state.notes=state.notes.slice(-50);if(save()){$('entry').value='';showNotes();}else alert('Storage unavailable; copy your note before leaving.');
});
$('exportNotes').addEventListener('click',function(){
var text=['TrailMesh field notes',state.plan.trail||'Unnamed trek',''].concat(state.notes.map(function(n){return n.when+'  '+n.text;})).join('\n');
var url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');
a.href=url;a.download='trailmesh-notes.txt';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
});
showNotes();
function guide(){var text=LESSONS[$('topic').value]||LESSONS.pace;$('scoutAnswer').textContent=text;return text;}
$('askScout').addEventListener('click',guide);
$('sayScout').addEventListener('click',function(){
if(!('speechSynthesis' in window)){ $('scoutAnswer').textContent+=' (Speech output unavailable on this device.)';return;}
speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(guide());u.lang='en-IN';u.rate=.92;speechSynthesis.speak(u);
});
$('quizA').addEventListener('click',function(){$('quizResult').textContent='Risky. Stop and check with your guide and an independent route source.';});
$('quizB').addEventListener('click',function(){$('quizResult').textContent='Correct. Staying together and reassessing is the safer default.';});
var locationLine='';
$('findLocation').addEventListener('click',function(){
if(!navigator.geolocation){$('location').textContent='Location is not available in this browser.';return;}
$('location').textContent='Requesting location permission…';
navigator.geolocation.getCurrentPosition(function(pos){
locationLine=pos.coords.latitude.toFixed(5)+', '+pos.coords.longitude.toFixed(5)+' (accuracy ±'+Math.round(pos.coords.accuracy)+' m)';
$('location').textContent='Current position: '+locationLine+' · not transmitted by TrailMesh.';
},function(){$('location').textContent='Position unavailable or permission denied. Use a reliable map/GPS device.';},
{enableHighAccuracy:true,timeout:12000,maximumAge:0});
});
function briefing(){
var p=state.plan;return [
'TRAILMESH · EXPEDITION BRIEFING (device-prepared, not verified by operator)',
'Trek: '+(p.trail||'not filled'),
'Departure: '+(p.departure||'not filled'),
'Expected return: '+(p.return||'not filled'),
'Guide/operator: '+(p.operator||'not filled'),
'Agreed meeting point: '+(p.meeting||'not filled'),
'Operator/emergency contact: '+(p.contact||'not filled'),
'Checked items: '+CHECKS.filter(function(_,i){return state.checks[i];}).join('; '),
'Position: '+(locationLine||'not requested'),
'HOME CONTACT ACTION: contact the operator or relevant authorities if overdue, as agreed before departure.',
'IMPORTANT: This message has not been sent. No live tracking, mesh radio or SOS is provided.'
].join('\n');}
$('makeBrief').addEventListener('click',function(){$('output').value=briefing();$('briefStatus').textContent='Briefing prepared locally. Share with a real person before leaving.';});
$('copyBrief').addEventListener('click',function(){
var txt=$('output').value||briefing();$('output').value=txt;
if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){$('briefStatus').textContent='Copied to clipboard.';}).catch(function(){$('output').select();$('briefStatus').textContent='Select and copy the briefing manually.';});
else{$('output').select();$('briefStatus').textContent='Select and copy the briefing manually.';}
});
if('serviceWorker' in navigator)window.addEventListener('load',function(){
navigator.serviceWorker.register('/trailmesh/sw.js',{scope:'/trailmesh/'}).catch(function(){});
});
})();