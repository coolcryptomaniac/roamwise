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
  var list=[]; try{ list=JSON.parse(lsGet('rw_reminders')||'[]'); }catch(e){}
  list.push({what:what, at:when}); try{ lsSet('rw_reminders', JSON.stringify(list.slice(-40))); }catch(e){}
  /* real OS-scheduled notification (survives the app being closed) */
  var native=false; try{ native=rwLocalNotifySchedule(what, mins); }catch(e){}
  if(!native){
    try{ if(window.Notification && Notification.permission==='default') Notification.requestPermission(); }catch(e){}
    setTimeout(function(){ rwRemindFire(what); }, mins*60000);
  }
  showToast('\u23f0 Reminder set for '+mins+' min from now'+(native?' (works even if you close the app)':''));
}
function rwRemindFire(what){
  try{
    if(window.Notification && Notification.permission==='granted'){
      new Notification('RoamWise reminder', {body:what, icon:'/icon-512.png'});
    }
  }catch(e){}
  /* Route through the same RoamWise audio-manifest cue player used elsewhere
     (rwHaptic, copilotSend, tabGo) instead of a bespoke oscillator beep, so
     there is one cue engine and one mute switch (rw_audio_enabled). A
     reminder firing is a notification event, which is exactly what
     success_feedback's "notification-success" haptic + short sting are
     designed for. */
  try{ rwPlayCue('success_feedback'); }catch(e){}
  try{ showToast('\u23f0 '+what); }catch(e){}
}
