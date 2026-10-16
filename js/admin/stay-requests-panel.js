// @ts-nocheck
/* ============================================================================
   js/admin/stay-requests-panel.js — Admin -> Stay requests
   ============================================================================
   Guest stay requests saved by the Worker (stayLeads/{id}, see
   worker/handlers/stay-lead.js). Only an admin can read them (firestore.rules).
   Each row has a tap-to-WhatsApp link and a "Mark contacted" button, which may
   change only status/contactedAt. Requests are deleted automatically after 12
   months. The reply is about THIS request; do not use the number for marketing. */
var RWStayRequestsPanel = (function(){
  var loaded = false;
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function db(){ return firebase.firestore(); }

  function waLink(l){
    var what = (l.items||[]).slice(0,3).map(function(i){ return i.name||i.partnerId; }).filter(Boolean).join(', ') || 'your stay request';
    var msg = 'Hi '+(l.name||'')+', this is RoamWise about your request for '+what+'. ';
    return 'https://wa.me/91'+encodeURIComponent(l.phone||'')+'?text='+encodeURIComponent(msg);
  }
  function row(l){
    var items = (l.items||[]).map(function(i){ return esc(i.name||i.partnerId)+(i.room?' ('+esc(i.room)+')':'')+(i.where?' · '+esc(i.where):''); }).join('<br>');
    var when = l.checkIn ? esc(l.checkIn)+(l.checkOut?' → '+esc(l.checkOut):'') : esc(l.dates||'dates not given');
    var who = l.guests ? l.guests+' guests' : (l.people ? esc(l.people)+' people' : '');
    var done = l.status === 'contacted';
    return '<div class="card" style="margin-top:10px"><div style="display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap">'
      +'<div style="min-width:0"><b>'+esc(l.name)+'</b> <span class="muted" style="font-size:12px">'+esc(l.phone)+' · '+esc(String(l.createdAt||'').slice(0,16).replace('T',' '))+'</span>'
      +'<div style="font-size:13px;margin-top:6px">'+items+'</div>'
      +'<div class="muted" style="font-size:12px;margin-top:4px">'+when+(who?' · '+who:'')+(l.estTotal?' · est ₹'+Number(l.estTotal).toLocaleString('en-IN'):'')+'</div>'
      +(l.note?'<div style="font-size:12px;margin-top:4px">“'+esc(l.note)+'”</div>':'')+'</div>'
      +'<div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap">'
      +'<a class="btn primary" target="_blank" rel="noopener" href="'+esc(waLink(l))+'">WhatsApp</a>'
      +(done?'<span class="muted" style="font-size:12px;align-self:center">contacted</span>':'<button class="btn" type="button" data-lead="'+esc(l.id)+'">Mark contacted</button>')
      +'</div></div></div>';
  }
  async function load(force){
    if(loaded && !force) return; loaded = true;
    var box = $('srList'); if(!box) return;
    box.innerHTML = '<div class="empty">Loading…</div>';
    try{
      var snap = await db().collection('stayLeads').orderBy('createdAt','desc').limit(100).get();
      var rows = []; snap.forEach(function(d){ var x = d.data(); x.id = d.id; rows.push(x); });
      var open = rows.filter(function(l){ return l.status !== 'contacted'; }).length;
      $('srCount').textContent = open ? open+' new' : 'none new';
      box.innerHTML = rows.length ? rows.map(row).join('') : '<div class="empty">No stay requests yet.</div>';
    }catch(e){ loaded = false; box.innerHTML = '<div class="alert bad">Could not load: '+esc(e.message||e)+'</div>'; }
  }
  async function mark(id, btn){
    btn.disabled = true;
    try{ await db().collection('stayLeads').doc(id).update({ status:'contacted', contactedAt:new Date().toISOString() }); load(true); }
    catch(e){ btn.disabled = false; alert('Could not update: '+(e.message||e)); }
  }
  function init(){
    var nav = document.querySelector('[data-page="stayreq"]');
    if(nav) nav.addEventListener('click', function(){ load(false); });
    var box = $('srList');
    if(box) box.addEventListener('click', function(ev){ var b = ev.target.closest && ev.target.closest('[data-lead]'); if(b) mark(b.getAttribute('data-lead'), b); });
    var r = $('srRefresh'); if(r) r.onclick = function(){ load(true); };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { load:load, waLink:waLink };
})();
