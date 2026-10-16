// @ts-nocheck
/* ============================================================================
   js/admin/trip-notify-panel.js — Admin -> Reminders -> Booking emails & trip reminders
   ============================================================================
   Switches for the guest acknowledgement email and the 3-day / 1-day trip
   reminders (worker/handlers/trip-notify.js). Stored in
   config/tripNotifySettings {ackEmail, reminders, maxEmailsPerRun}: public-read,
   admin-write under the existing config rules. Both default OFF.
   Preview / Send now call POST /admin/trip-notify/run with the admin's ID token. */
var RWTripNotifyPanel = (function(){
  var API = 'https://roamwise-api.founder-f53.workers.dev';
  var loaded = false;
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function note(msg, bad){ var e=$('tnNote'); if(e) e.innerHTML='<div class="alert'+(bad?' bad':'')+'">'+esc(msg)+'</div>'; }
  function ref(){ return firebase.firestore().collection('config').doc('tripNotifySettings'); }

  async function load(){
    if(loaded) return; loaded = true;
    try{
      var d = await ref().get(), s = d.exists ? d.data() : {};
      $('tnAck').checked = s.ackEmail === true;
      $('tnRem').checked = s.reminders === true;
      $('tnMax').value = s.maxEmailsPerRun || 40;
    }catch(e){ loaded = false; note('Could not load settings: '+(e.message||e), true); }
  }
  async function save(){
    try{
      var max = Math.min(90, Math.max(1, parseInt($('tnMax').value,10) || 40));
      await ref().set({ ackEmail:$('tnAck').checked, reminders:$('tnRem').checked, maxEmailsPerRun:max, updatedAt:new Date().toISOString() });
      note('Saved. Acknowledgements go out within the hour; reminders at 11:00 IST. Free Gmail allows about 100 emails a day, so keep the cap under 90.');
    }catch(e){ note(e.message||String(e), true); }
  }
  async function run(dry){
    var u = firebase.auth().currentUser;
    if(!u){ note('Sign in as admin first.', true); return; }
    if(!dry && !confirm('Send acknowledgements and reminders now? Run Preview first to see how many.')) return;
    note(dry ? 'Checking…' : 'Sending…');
    try{
      var tok = await u.getIdToken();
      var res = await fetch(API+'/admin/trip-notify/run'+(dry?'':'?dry=0'), { method:'POST', headers:{ authorization:'Bearer '+tok } });
      var d = await res.json();
      if(!res.ok){ note('Failed: '+(d.message||d.error||res.status), true); return; }
      if(d.off){ note('Both switches are off. Turn one on and press Save first.', true); return; }
      var txt = (dry ? 'PREVIEW (nothing sent). ' : 'DONE. ')
        + (dry ? 'Would send ' : 'Sent ') + d.acks + ' acknowledgement email(s), ' + d.pushes + ' reminder push(es) and ' + d.reminderEmails + ' reminder email(s). '
        + d.deferred + ' waiting for tomorrow; ' + d.failed + ' failed.';
      if(!d.mailer) txt += ' No email sender is set up yet (see EMAIL-PUSH-SETUP.md), so email is skipped; push still works.';
      note(txt);
    }catch(e){ note('Failed: '+(e.message||e), true); }
  }
  function init(){
    var btn = document.querySelector('[data-page="reminders"]');
    if(btn) btn.addEventListener('click', load);
    var s=$('tnSave'), p=$('tnPreview'), n=$('tnSend');
    if(s) s.onclick=save; if(p) p.onclick=function(){ run(true); }; if(n) n.onclick=function(){ run(false); };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { load:load };
})();
