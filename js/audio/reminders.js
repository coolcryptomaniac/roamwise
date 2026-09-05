// @ts-nocheck
/* --- 3. REMINDERS (local, with optional chime) --- */
function rwRemindAsk(about){
  var txt=(about||'your trip plan').slice(0,90);
  rwForm('\u23f0 Remind me', [
    {key:'what', label:'Remind me about', value:txt},
    {key:'mins', label:'In how many minutes?', placeholder:'e.g. 60', type:'number', value:'60'}
  ], function(v){
    var mins=parseInt(v.mins,10); if(!mins||mins<1){ showToast('Give me a number of minutes'); return; }
    rwRemindSet(v.what||txt, mins);
  });
}
function rwRemindSet(what, mins){
  var when=Date.now()+mins*60000;
  var list=[]; try{ list=JSON.parse(lsGet('rw_reminders')||'[]'); }catch(e){ /* parse best-effort, ignore malformed/missing data */ }
  list.push({what:what, at:when}); try{ lsSet('rw_reminders', JSON.stringify(list.slice(-40))); }catch(e){ /* storage best-effort, ignore */ }
  /* real OS-scheduled notification (survives the app being closed) */
  var native=false; try{ native=rwLocalNotifySchedule(what, mins); }catch(e){ /* best-effort, ignore */ }
  if(!native){
    try{ if(window.Notification && Notification.permission==='default') Notification.requestPermission(); }catch(e){ /* best-effort, ignore */ }
    setTimeout(function(){ rwRemindFire(what); }, mins*60000);
  }
  showToast('\u23f0 Reminder set for '+mins+' min from now'+(native?' (works even if you close the app)':''));
}
function rwRemindFire(what){
  try{
    if(window.Notification && Notification.permission==='granted'){
      new Notification('RoamWise reminder', {body:what, icon:'/icon-512.png'});
    }
  }catch(e){ /* best-effort, ignore */ }
  /* Route through the same RoamWise audio-manifest cue player used elsewhere
     (rwHaptic, copilotSend, tabGo) instead of a bespoke oscillator beep, so
     there is one cue engine and one mute switch (rw_audio_enabled). A
     reminder firing is a notification event, which is exactly what
     success_feedback's "notification-success" haptic + short sting are
     designed for. */
  try{ rwPlayCue('success_feedback'); }catch(e){ /* best-effort, ignore */ }
  try{ showToast('\u23f0 '+what); }catch(e){ /* toast is a nice-to-have, ignore */ }
}

/* --- 4. TRIP COUNTDOWN NOTIFICATIONS (extracted verbatim from app.js,
   final modularization pass) --- */
/* ==================== TRIP NOTIFICATIONS ====================
   Deliberately LOCAL notifications, not server push. Real push needs a server
   or Cloud Function sending via FCM — infrastructure that costs money and
   maintenance. Local notifications are free forever, need no backend, and
   cover the actually-useful case: countdown reminders for a saved trip,
   fired when the app is opened. Honest limit: they can't fire while the app
   is closed, which is why nothing here promises "real-time alerts". */
function notifyEnable(){
  if(!('Notification' in window)){ showToast('This device doesn\u2019t support notifications'); return; }
  Notification.requestPermission().then(function(p){
    lsSet('rw_notify', p==='granted'?'1':'0');
    showToast(p==='granted' ? '\ud83d\udd14 Trip reminders on' : 'Reminders stayed off');
    if(p==='granted') tripReminderCheck();
  });
}
function tripReminderCheck(){
  if(lsGet('rw_notify')!=='1' || !('Notification' in window) || Notification.permission!=='granted') return;
  var today=new Date(); today.setHours(0,0,0,0);
  vaultGet().forEach(function(t){
    if(!t.start) return;
    var d=new Date(t.start); if(isNaN(d)) return;
    d.setHours(0,0,0,0);
    var days=Math.round((d-today)/864e5);
    if(days<0 || days>7) return;
    var key='rw_notified_'+t.id+'_'+days;
    if(lsGet(key)==='1') return;
    lsSet(key,'1');
    var msg = days===0 ? 'Your '+t.name+' trip starts today \u2014 itinerary is offline-ready \ud83e\udd77'
            : days===1 ? 'Tomorrow: '+t.name+'. Packing list ready?'
            : days+' days to '+t.name+' \u2014 tap to review your plan';
    try{ new Notification('RoamWise', {body:msg, icon:'icons/icon-192.png', tag:t.id}); }catch(e){ /* best-effort, ignore */ }
  });
}

