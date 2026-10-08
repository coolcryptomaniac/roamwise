// @ts-nocheck
/* ============================================================================
   js/admin/reminders-panel.js — Admin -> Reminders
   ============================================================================
   Founder-friendly controls for the "come back" reminders (push first, email
   second). Everything is edited here; nothing needs the command line:
     config/reminderSettings  {emailEnabled, pushEnabled, inactiveDays, cooldownDays}
     config/reminderContent   {headline, intro, items[{title,text,url}], cta{label,url}}
   Preview / Send now call the Worker (POST /admin/reminders/run) with the
   admin's Firebase ID token. Both channels default OFF. */
var RWRemindersPanel = (function(){
  var API = 'https://roamwise-api.founder-f53.workers.dev';
  var loaded = false;
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function db(){ return firebase.firestore(); }
  function note(msg, bad){ var e=$('remNote'); if(e) e.innerHTML='<div class="alert'+(bad?' bad':'')+'">'+esc(msg)+'</div>'; }

  function fillForm(s, c){
    $('remEmailOn').checked = s.emailEnabled===true;
    $('remPushOn').checked = s.pushEnabled===true;
    $('remDays').value = s.inactiveDays || 7;
    $('remCool').value = s.cooldownDays || 14;
    $('remHeadline').value = c.headline || '';
    $('remIntro').value = c.intro || '';
    var items = Array.isArray(c.items) ? c.items : [];
    for(var i=0;i<3;i++){
      var it = items[i] || {};
      $('remT'+i).value = it.title||''; $('remX'+i).value = it.text||''; $('remU'+i).value = it.url||'';
    }
    $('remCtaL').value = (c.cta&&c.cta.label)||''; $('remCtaU').value = (c.cta&&c.cta.url)||'';
  }

  async function load(){
    if(loaded) return; loaded = true;
    try{
      var r = await Promise.all([db().collection('config').doc('reminderSettings').get(), db().collection('config').doc('reminderContent').get()]);
      fillForm(r[0].exists?r[0].data():{}, r[1].exists?r[1].data():{});
    }catch(e){ loaded=false; note('Could not load settings: '+(e.message||e), true); }
  }

  function readForm(){
    var items=[];
    for(var i=0;i<3;i++){ var t=$('remT'+i).value.trim(); if(t) items.push({title:t.slice(0,100), text:$('remX'+i).value.trim().slice(0,300), url:$('remU'+i).value.trim()}); }
    var bad = items.concat([{url:$('remCtaU').value.trim()}]).filter(function(x){ return x.url && !/^https:\/\//.test(x.url); });
    if(bad.length) throw new Error('Links must start with https://');
    return {
      settings:{ emailEnabled:$('remEmailOn').checked, pushEnabled:$('remPushOn').checked,
        inactiveDays:Math.min(60,Math.max(3,parseInt($('remDays').value,10)||7)), cooldownDays:Math.min(90,Math.max(7,parseInt($('remCool').value,10)||14)) },
      content:{ headline:$('remHeadline').value.trim().slice(0,120), intro:$('remIntro').value.trim().slice(0,300), items:items,
        cta:{label:$('remCtaL').value.trim().slice(0,40), url:$('remCtaU').value.trim()} }
    };
  }

  async function save(){
    try{
      var f = readForm(), at = new Date().toISOString();
      await Promise.all([
        db().collection('config').doc('reminderSettings').set(Object.assign({updatedAt:at}, f.settings)),
        db().collection('config').doc('reminderContent').set(Object.assign({updatedAt:at}, f.content))
      ]);
      note('Saved. Reminders run automatically every day at 11:00 IST when a channel is switched on.');
    }catch(e){ note(e.message||String(e), true); }
  }

  async function run(dry){
    var u = firebase.auth().currentUser;
    if(!u){ note('Sign in as admin first.', true); return; }
    if(!dry && !confirm('Send reminders now to everyone who is eligible? Run Preview first to see how many.')) return;
    note(dry?'Checking…':'Sending…');
    try{
      var tok = await u.getIdToken();
      var res = await fetch(API+'/admin/reminders/run'+(dry?'':'?dry=0'), {method:'POST', headers:{authorization:'Bearer '+tok}});
      var d = await res.json();
      if(!res.ok){ note('Failed: '+(d.message||d.error||res.status), true); return; }
      if(d.off){ note('Both channels are switched off. Turn one on and press Save first.', true); return; }
      var s = d.skipped||{}, skips = Object.keys(s).map(function(k){ return k.replace(/_/g,' ')+': '+s[k]; }).join(', ') || 'none';
      var txt = (dry?'PREVIEW (nothing sent). ':'DONE. ')+'Checked '+d.scanned+' inactive users. '+(dry?('Would send '+d.willSend+' ('+d.willPush+' push, '+d.willEmail+' email). '):('Sent '+d.pushSent+' push and '+d.emailSent+' email; '+d.failed+' failed. '))+'Skipped — '+skips+'.';
      if(d.settings && d.settings.emailEnabled && !d.emailReady) txt += ' Email is switched on but the email service key is not set in Cloudflare yet, so email users were skipped.';
      note(txt);
    }catch(e){ note('Failed: '+(e.message||e), true); }
  }

  function init(){
    var btn = document.querySelector('[data-page="reminders"]');
    if(btn) btn.addEventListener('click', load);
    var s=$('remSave'), p=$('remPreview'), n=$('remSend');
    if(s) s.onclick=save; if(p) p.onclick=function(){ run(true); }; if(n) n.onclick=function(){ run(false); };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { load:load, readForm:readForm };
})();
