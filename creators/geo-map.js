/* Creator coverage map: approximate public town centers only.
 * Does not track devices, request geolocation, or write to Firestore. */
(function(){
'use strict';
var dash=document.getElementById('caDash');if(!dash)return;
var panel=document.createElement('section');panel.id='rwGeoPanel';panel.className='ca-panel';
panel.innerHTML='<div class="ca-head"><div><small>GEOGRAPHIC COVERAGE</small><h2>Creator network map</h2><p>Approximate town-centre pins from creator-submitted locations. No live GPS or precise home addresses.</p></div><button class="ca-action secondary" id="rwGeoReload">Refresh map</button></div><div id="rwGeoStatus" role="status"></div><div id="rwGeoMap" aria-label="Approximate creator distribution by town"></div><div id="rwGeoLegend"></div>';
var anchor=document.getElementById('rwOpportunityDesk')||document.getElementById('rwIntelligence');if(anchor)anchor.insertAdjacentElement('afterend',panel);else dash.appendChild(panel);
var towns={
'almora':[29.5971,79.6591],'kasar devi':[29.646,79.673],'ranikhet':[29.643,79.432],'kausani':[29.844,79.604],
'nainital':[29.380,79.463],'bhimtal':[29.347,79.563],'mukteshwar':[29.472,79.646],
'dehradun':[30.3165,78.0322],'rishikesh':[30.0869,78.2676],'haridwar':[29.9457,78.1642],
'uttarkashi':[30.7268,78.4354],'harsil':[31.033,78.748],'gangotri':[30.9947,78.9398],
'dayara bugyal':[30.84,78.51],'tehri':[30.378,78.481],'new tehri':[30.378,78.481],
'mussoorie':[30.4598,78.0644],'rudraprayag':[30.284,78.981],'chamoli':[30.402,79.320],
'pithoragarh':[29.583,80.218],'bageshwar':[29.838,79.771],'pauri':[30.147,78.779],
'haldwani':[29.218,79.513],'ramnagar':[29.392,79.129],'delhi':[28.614,77.209],
'mumbai':[19.076,72.878],'pune':[18.520,73.857],'jaipur':[26.912,75.787],
'varanasi':[25.317,82.974],'lucknow':[26.847,80.946],'chandigarh':[30.733,76.779],
'manali':[32.244,77.189],'shimla':[31.104,77.173],'srinagar':[34.084,74.874]
};
var map=null,layer=null;
function norm(v){return String(v||'').toLowerCase().trim().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ')}
function city(a){var b=a.barter||{},l=b.location||{},m=a.matchProfile||{};return String(l.town||a.town||a.city||(typeof a.location==='string'?a.location:'')||(Array.isArray(m.destinations)?m.destinations[0]:'')||'').trim()}
function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
async function load(){var status=document.getElementById('rwGeoStatus');status.textContent='Loading approximate town distribution…';
try{
var auth=firebase.auth(),u=auth.currentUser;if(!u||!u.emailVerified){status.textContent='Verified admin sign-in required.';return}
var db=firebase.firestore(),check=await db.collection('admins').doc(u.uid).get();if(!check.exists){status.textContent='Admin access required.';return}
var q=await db.collection('crm').where('seg','==','creator').limit(500).get(),counts={},unknown=0,seen=new Set();
q.docs.forEach(function(d){var a=d.data()||{},key=norm(a.email)||norm(a.handle)||d.id;if(seen.has(key))return;seen.add(key);var t=norm(city(a));if(!Object.prototype.hasOwnProperty.call(towns,t)){unknown++;return}if(!counts[t])counts[t]=0;counts[t]++});
var rows=Object.keys(counts).map(function(t){return{town:t,count:counts[t],coords:towns[t]}}).sort(function(a,b){return b.count-a.count});
status.textContent=rows.length+' mapped towns · '+rows.reduce(function(n,r){return n+r.count},0)+' unique creator leads · '+unknown+' without a recognized town. Pins are approximate town centres, not current locations.';
document.getElementById('rwGeoLegend').innerHTML=rows.map(function(r){return'<span>'+esc(r.town)+' <strong>'+r.count+'</strong></span>'}).join('')||'<p>No town-matched creators available.</p>';
if(!window.L){document.getElementById('rwGeoMap').textContent='Map library unavailable. Town counts are listed below.';return}
if(!map){map=L.map('rwGeoMap',{scrollWheelZoom:false}).setView([30.1,79.1],7);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:16}).addTo(map);layer=L.layerGroup().addTo(map)}
layer.clearLayers();rows.forEach(function(r){L.circleMarker(r.coords,{radius:Math.min(20,7+r.count*2),color:'#f8c65d',weight:2,fillColor:'#9b45ce',fillOpacity:.72}).bindPopup('<strong>'+esc(r.town)+'</strong><p>'+r.count+' creator lead(s) · approximate town only</p>').addTo(layer)});
if(rows.length){map.fitBounds(L.latLngBounds(rows.map(function(r){return r.coords})).pad(.2),{maxZoom:10})}setTimeout(function(){map.invalidateSize()},120)
}catch(e){status.textContent='Map data unavailable: '+(e.code||e.message)+'. No records changed.'}}
document.getElementById('rwGeoReload').addEventListener('click',load);
firebase.auth().onAuthStateChanged(function(u){if(u)load();else document.getElementById('rwGeoStatus').textContent='Admin sign-in required.'});
})();