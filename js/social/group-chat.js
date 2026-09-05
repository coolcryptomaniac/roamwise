// @ts-nocheck
/* ==================== SOCIAL: SECURE TRIP GROUP CHAT (core) ====================
   Extracted verbatim from app.js (Phase 4c modularization).
   Room lifecycle: opening/picking a room, sending, minimizing, panel/full size
   modes, backing up/exporting, and the @tusk-in-the-room entry point. Depends
   on the shared room state in js/social/group-state.js (_chatUnsub, _chatRoom,
   _chatMsgs, chatPost) which must load first. The reaction/streak/presence/
   member/moderation layer that renders on top of these rooms is split into
   js/social/group-chat-social.js purely to stay under the file line cap —
   both halves are still the one "Secure Trip Group Chat" feature.
   ==================================== */
/* Group CHAT is a different thing from the compromise PLANNER — people kept
   tapping "Group" expecting chat. This opens a room for any group name, so it
   works before a trip is even saved. */
function openGroupChat(){
  if(!window.user || !user.uid){ showToast('Sign in to use group chat'); try{ openAuth(); }catch(e){ /* best-effort, ignore */ } return; }
  /* Show recent chats so people return to an existing conversation instead of
     always starting fresh. History is remembered per device. */
  var recents = rwChatRecents();
  var ov=el('chatPickOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='chatPickOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83d\udcac Your trip chats</b><button class="x" onclick="rwOverlayClose(\'chatPickOverlay\')">\u2715</button></div>'
      +'<div id="chatPickBody" style="padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  var body=el('chatPickBody');
  var list = recents.length
    ? recents.map(function(r){
        return '<button class="tact" style="width:100%;text-align:left;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;gap:8px" onclick="rwOverlayClose(\'chatPickOverlay\');tripChatOpen(\''+r.id+'\',\''+esc2(r.name).replace(/\'/g,"")+'\')">'
          +'<span><b style="font-size:13.5px">'+esc2(r.name)+'</b><br><span style="font-size:10.5px;color:var(--t3)">last opened '+rwAgo(r.at)+'</span></span>'
          +'<span style="color:var(--t3);font-size:18px">\u203a</span></button>';
      }).join('')
    : '<p style="font-size:12.5px;color:var(--t2);line-height:1.6;padding:0 2px 10px">No chats yet. Start one below \u2014 then invite your travel buddies. Everything (Kitty, decisions, plan) lives here.</p>';
  body.innerHTML = list
    + '<button class="rzp-main-btn" style="width:100%;margin-top:6px" onclick="rwNewGroupChat()">\u2795 Start a new trip chat</button>';
  rwOverlayOpen('chatPickOverlay');
}
function rwNewGroupChat(){
  rwForm('\\u2795 New trip chat', [{key:'nm', label:'Name this trip chat', placeholder:'Goa gang', hint:'Everyone you invite uses the same name.'}], function(v){
    if(!v.nm){ return; }
    rwOverlayClose('chatPickOverlay');
    tripChatOpen('grp_' + wvSlug(v.nm).slice(0,24), v.nm);
  });
}
/* Local memory of chats this device has opened, most-recent first. */
function rwChatRecents(){
  try{ return JSON.parse(lsGet('rw_chat_recents')||'[]'); }catch(e){ return []; }
}
function rwChatRemember(id, name){
  try{
    var list = rwChatRecents().filter(function(r){ return r.id!==id; });
    list.unshift({id:id, name:name||'Trip chat', at:Date.now()});
    lsSet('rw_chat_recents', JSON.stringify(list.slice(0,12)));
  }catch(e){ /* storage best-effort, ignore */ }
}
function rwAgo(ts){
  var s=Math.round((Date.now()-ts)/1000);
  if(s<60) return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}

/* ==================== SECURE TRIP GROUP CHAT ====================
   A private room per trip so planning lives in the app, not scattered across
   WhatsApp. "Secure" here means specific, not hand-wavy: messages are readable
   and writable ONLY by members listed on the room doc (enforced in Firestore
   rules, not just the UI), every message is signed with its sender's uid, the
   room is reachable only by its unguessable ID, and nothing is world-readable.
   It is NOT end-to-end encrypted — Firestore can see message text — so the UI
   says exactly that rather than overpromising. */
function tripChatOpen(roomId, roomName){
  if(!user || !user.uid){ showToast('Sign in to use group chat'); try{ openAuth(); }catch(e){ /* best-effort, ignore */ } return; }
  _chatRoom=roomId;
  var ov=el('chatOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='chatOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet" style="display:flex;flex-direction:column;height:96dvh;max-height:96dvh;border-radius:20px 20px 0 0;padding:0;overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(135deg,rgba(232,186,108,.12),transparent);border-bottom:1px solid var(--b2,#2A2A36)">'
        +'<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 auto">\ud83d\udc65</div>'
        +'<div style="flex:1;min-width:0"><b id="chatTitle" style="font-size:15px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Trip chat</b>'
        +'<span style="font-size:10.5px;color:var(--t3)">\ud83d\udd12 Private \u00b7 auto-deletes after 30 days \u00b7 tap \u2b07 to save</span></div>'
        +'<button class="x" onclick="rwChatExport()" title="Backup / export this chat" style="font-size:15px">\u2b07\ufe0f</button>'
        +'<button class="x" onclick="rwReportOpen({room:_chatRoom})" title="Report" style="font-size:14px">\ud83d\udea9</button>'
        +'<button class="x" onclick="rwChatSizeToggle()" id="chatSizeBtn" title="Panel / full screen" style="font-size:15px">\u2922</button>'
        +'<button class="x" onclick="tripChatMinimize()" title="Minimize" style="font-size:16px">\u2013</button>'
        +'<button class="x" onclick="tripChatClose()">\u2715</button></div>'
      +'<div id="chatPins" style="border-bottom:1px solid var(--b2,#2A2A36);background:var(--bg2,#12121C);padding:8px 12px"></div>'
      +'<div id="chatLog" style="flex:1 1 auto;min-height:0;overflow-y:auto;padding:12px 14px;background:var(--bg,#0A0A0C)"></div>'
      +'<div style="padding:8px 12px 4px;border-top:1px solid var(--b2,#2A2A36);background:var(--bg2,#12121C)">'
      +'<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch">'
      +'<button class="chat-tool" onclick="chatTuskFacilitate()">\u2728 Tusk, sort this out</button>'
      +'<button class="chat-tool" onclick="chatSharePlan()">\ud83d\uddd3\ufe0f Itinerary</button>'
      +'<button class="chat-tool" onclick="chatAddExpense()">\ud83d\udcb0 Add expense</button>'
      +'<button class="chat-tool" onclick="chatShareMeet()">\ud83d\udccd Meet point</button>'
      +'<button class="chat-tool" onclick="chatNewPoll()">\ud83d\uddf3\ufe0f Poll</button>'
      +'<button class="chat-tool" onclick="chatWhenAsk()">\ud83d\udcc5 When can everyone go?</button>'
      +'<button class="chat-tool" onclick="chatTrainAsk()">\ud83d\ude82 Pick a train</button>'
      +'<button class="chat-tool" onclick="chatMarkPaid()">\u2705 Mark paid</button>'
      +'<button class="chat-tool" onclick="chatInvite()">\ud83d\udc65 Invite</button>'
      +'<button class="chat-tool" onclick="openChatGames()">\ud83c\udfae Play</button>'
      +'<button class="chat-tool" onclick="openStays()">\ud83c\udfe1 Book a stay</button>'
      +'</div>'
      +'<div style="display:flex;gap:8px;align-items:flex-end;padding:4px 0 8px">'
      +'<textarea id="chatInput" rows="1" placeholder="Message the group \u2014 or ask @tusk\u2026" style="flex:1;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:22px;padding:12px 16px;color:inherit;font:inherit;resize:none;outline:none;max-height:110px"></textarea>'
      +'<button aria-label="Send" style="width:46px;height:46px;flex:0 0 auto;border-radius:50%;font-size:18px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center" onclick="tripChatSend()">\u27a4</button></div>'
      +'</div>'
      +'</div>';
    document.body.appendChild(ov);
    el('chatInput').addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); tripChatSend(); } });
    el('chatInput').addEventListener('input',function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,110)+'px'; });
  }
  el('chatTitle').textContent='\ud83d\udcac '+(roomName||'Trip chat');
  try{ rwChatRemember(roomId, roomName||'Trip chat'); }catch(e){ /* best-effort, ignore */ }
  rwOverlayOpen('chatOverlay');
  try{ rwChatApplySize(); }catch(e){ /* best-effort, ignore */ }
  /* ensure the room exists with me as a member, then live-subscribe */
  var ref=db.collection('tripchats').doc(roomId);
  ref.get().then(function(d){
    if(!d.exists) return ref.set({name:roomName||'Trip', members:[user.uid], owner:user.uid, created:firebase.firestore.FieldValue.serverTimestamp()});
    try{ window._chatMembers=(d.data().members||[]); window._chatOwner=(d.data().owner||''); }catch(e){ /* best-effort, ignore */ }
    if((d.data().members||[]).indexOf(user.uid)===-1)
      return ref.update({members:firebase.firestore.FieldValue.arrayUnion(user.uid)});
  }).then(function(){
    /* keep the member list current so the header count is real */
    try{
      if(window._chatMemUnsub) window._chatMemUnsub();
      window._chatMemUnsub = ref.onSnapshot(function(rd){
        try{ var rr=rd.data()||{}; window._chatMembers=rr.members||[]; window._chatOwner=rr.owner||''; }catch(e){ /* best-effort, ignore */ }
        try{ var vb=el('tcVibe'); if(vb) vb.innerHTML=chatVibeHTML(); }catch(e){ /* best-effort, ignore */ }
      });
    }catch(e){ /* best-effort, ignore */ }
    try{ rwPresenceStart(); }catch(e){ /* best-effort, ignore */ }
    if(_chatUnsub) _chatUnsub();
    _chatUnsub = ref.collection('msgs').orderBy('at','asc').limitToLast(200).onSnapshot(function(qs){
      var log=el('chatLog'); if(!log) return;
      /* ====================================================================
         INCREMENTAL RENDER (rw-v97) — this is why the chat used to flicker
         ====================================================================
         The old loop did `log.innerHTML = allMessages.map(...)` on EVERY
         snapshot. Because each bubble has an entrance animation, every
         message re-animated every time anyone typed — and asking Tusk wrote
         two messages, so the whole thread flashed twice.

         Now: we diff. New messages are appended (and only they animate).
         Changed ones (a reaction, a poll vote) are patched in place. Nothing
         else is touched. This is what makes a chat feel like a chat.
      ==================================================================== */
      _chatMsgs = qs.docs.map(function(doc){ var m=doc.data()||{}; m._id=doc.id; return m; });
      var wasNearBottom = (log.scrollHeight - log.scrollTop - log.clientHeight) < 140;
      var visible = _chatMsgs.filter(function(m){ return !rwIsBlocked(m.uid); });

      _chatSeen = _chatSeen || {};
      var live = {};
      visible.forEach(function(m){
        live[m._id] = 1;
        var sig = rwMsgSignature(m);
        var node = document.getElementById('msg_'+m._id);
        if(!node){
          /* genuinely new — append and let it animate in, alone */
          var wrap = document.createElement('div');
          wrap.id = 'msg_'+m._id;
          wrap.className = 'tc-msg';
          wrap.innerHTML = chatBubble(m._id, m, m.uid===user.uid);
          log.appendChild(wrap);
          _chatSeen[m._id] = sig;
        } else if(_chatSeen[m._id] !== sig){
          /* same message, changed content — patch WITHOUT re-animating */
          node.classList.add('tc-noanim');
          node.innerHTML = chatBubble(m._id, m, m.uid===user.uid);
          _chatSeen[m._id] = sig;
        }
      });
      /* remove anything deleted or newly blocked */
      Object.keys(_chatSeen).forEach(function(id){
        if(!live[id]){
          var n=document.getElementById('msg_'+id);
          if(n) n.remove();
          delete _chatSeen[id];
        }
      });

      try{ chatRenderPins(); }catch(e){ /* best-effort, ignore */ }
      try{
        var vb=el('tcVibe');
        if(!vb && log.parentNode){ vb=document.createElement('div'); vb.id='tcVibe'; log.parentNode.insertBefore(vb, log); }
        if(vb) vb.innerHTML=chatVibeHTML()+rwPhaseHTML();
      }catch(e){ /* best-effort, ignore */ }
      if(wasNearBottom) log.scrollTop = log.scrollHeight;
    }, function(err){
      /* This is the path the user actually hits when rules are stale, so it
         must say what to DO, not just what failed. */
      var denied = (err && (err.code==='permission-denied' || /permission/i.test(err.message||'')));
      el('chatLog').innerHTML = denied
        ? '<div class="mode-box" style="text-align:left;line-height:1.65">'
          +'<b>Chat is blocked by the server rules.</b><br>'
          +'<span style="font-size:12px;color:var(--t2)">Almost always means the latest <code>firestore.rules</code> has not been published yet. '
          +'In Firebase Console \u2192 Firestore \u2192 Rules, paste the current file and press Publish. '
          +'Group chat needs the <code>tripchats</code> block.</span>'
          +'<button class="tact" style="font-size:11px;padding:6px 11px;margin-top:9px" onclick="rwRulesCheck()">Check which rules are live</button>'
          +'</div>'
        : '<div class="mode-box">Chat unavailable: '+esc2(err.message||err)+'</div>';
    });
  }).catch(function(e){
    var log=el('chatLog');
    if(e && e.code==='permission-denied'){
      if(log) log.innerHTML='<div class="mode-box" style="text-align:left;line-height:1.6">'
        +'<b>Group chat is blocked by the server rules.</b><br>'
        +'<span style="font-size:12px;color:var(--t2)">The latest <code>firestore.rules</code> needs to be published (Firebase Console \u2192 Firestore \u2192 Rules \u2192 paste \u2192 Publish). '
        +'Tap below to see exactly which collections are blocked right now.</span>'
        +'<button class="tact" style="font-size:11px;padding:6px 11px;margin-top:9px" onclick="rwRulesCheck()">Check which rules are live</button>'
        +'</div>';
    } else {
      if(log) log.innerHTML='<div class="mode-box">Could not open chat: '+esc2((e&&e.message)||e)+'</div>';
    }
  });
}
function tripChatSend(){
  var inp=el('chatInput'); var t=(inp.value||'').trim(); if(!t || !_chatRoom || !user) return;
  inp.value='';
  /* "@tusk <question>" asks Ailon Tusk and posts the answer into the room, so
     nobody has to leave the conversation to look something up. */
  var mAsk = t.match(/^@?tusk[,:\s]+(.+)$/i);
  if(mAsk){ chatAskTusk(mAsk[1]); return; }
  db.collection('tripchats').doc(_chatRoom).collection('msgs').add({
    kind:'text', text:t.slice(0,1000), uid:user.uid,
    name:(user.displayName||user.email||'Traveller').split('@')[0],
    at:firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(e){ showToast('Send failed: '+(e.message||e)); inp.value=t; });
}
function tripChatClose(){ if(_chatUnsub){ _chatUnsub(); _chatUnsub=null; } rwOverlayClose('chatOverlay'); rwChatFabHide(); }
/* MINIMIZE: hide the sheet but KEEP the live listener running, and show a
   floating bubble so people can browse other features and pop back in \u2014 the
   thing that lets them "do everything here" instead of leaving for WhatsApp. */
function tripChatMinimize(){
  /* The .overlay is position:fixed inset:0 with a backdrop — hiding only the
     inner sheet leaves it capturing every touch, which killed site scroll.
     Remove .open from the OVERLAY itself so the page is fully usable, and
     restore body scroll. The Firestore listener keeps running underneath. */
  var ov=el('chatOverlay');
  if(ov){ ov.classList.remove('open'); ov.style.display='none'; }
  document.body.style.overflow='';
  rwChatFabShow();
}
function rwChatFabShow(){
  var fab=el('chatFab');
  if(!fab){
    fab=document.createElement('button'); fab.id='chatFab';
    fab.setAttribute('aria-label','Open trip chat');
    fab.onclick=function(){
      var ov=el('chatOverlay');
      if(ov){ ov.style.display=''; ov.classList.add('open'); }
      rwChatFabHide();
      var log=el('chatLog'); if(log) log.scrollTop=log.scrollHeight;
    };
    fab.innerHTML='\ud83d\udcac';
    document.body.appendChild(fab);
  }
  fab.style.display='flex';
}
function rwChatFabHide(){ var fab=el('chatFab'); if(fab) fab.style.display='none'; }
/* Chat size modes: 'full' (default overlay) and 'panel' (docked to the bottom
   ~55% of the screen, with the app usable above it — no dark backdrop, so you
   can chat AND browse/plan at the same time). Persists the choice. */
var _chatSizeMode = (function(){ try{ return lsGet('rw_chatsize')||'full'; }catch(e){ return 'full'; } })();
function rwChatApplySize(){
  var ov=el('chatOverlay'); if(!ov) return;
  var sheet=ov.querySelector('.sheet'); if(!sheet) return;
  if(_chatSizeMode==='panel'){
    ov.style.background='transparent';
    ov.style.backdropFilter='none';
    ov.style.pointerEvents='none';           /* let taps pass through to the app above */
    ov.style.alignItems='flex-end';
    sheet.style.pointerEvents='auto';         /* but the panel itself is interactive */
    sheet.style.height='58dvh';
    sheet.style.maxHeight='58dvh';
    sheet.style.boxShadow='0 -8px 40px rgba(0,0,0,.55)';
    var b=el('chatSizeBtn'); if(b) b.textContent='\u26f6';   /* maximize glyph */
  } else {
    ov.style.background='';
    ov.style.backdropFilter='';
    ov.style.pointerEvents='';
    ov.style.alignItems='';
    sheet.style.pointerEvents='';
    sheet.style.height='96dvh';
    sheet.style.maxHeight='96dvh';
    sheet.style.boxShadow='';
    var b2=el('chatSizeBtn'); if(b2) b2.textContent='\u2922';  /* shrink glyph */
  }
}
function rwChatSizeToggle(){
  _chatSizeMode = (_chatSizeMode==='panel') ? 'full' : 'panel';
  try{ lsSet('rw_chatsize', _chatSizeMode); }catch(e){ /* storage best-effort, ignore */ }
  rwChatApplySize();
}
/* deterministic room id from a saved trip, so the same trip = the same room */
function tripChatById(id){ var t=vaultGet().filter(function(x){return x.id===id;})[0]; if(t) tripChatForTrip(t); }
function tripChatForTrip(trip){
  var id = 'trip_'+wvSlug(trip.name)+'_'+String(trip.id||'').slice(-6);
  tripChatOpen(id, trip.name+' group');
}
// tkFold/tkToggle (generic fold/unfold accordion helper, unrelated to chat)
// moved to js/ui/card-painter.js in the final modularization pass — it is a
// shared UI helper also called by js/copilot/rich-reply.js, tusk-persona.js
// and answer-cards.js, so it belongs with other shared card-rendering code,
// not filed under one caller.


/* ==================== CHAT: TUSK BOT + COORDINATION ====================
   Group trip planning falls apart in WhatsApp because the useful things —
   the budget, the itinerary, who has paid, where we're meeting — scroll away
   within an hour. This keeps them as structured, pinnable messages, and puts
   Ailon Tusk in the room so nobody has to leave to look something up.

   HONEST SCOPE on messaging apps: WhatsApp has no API that lets an app read or
   post into a normal group (the Business API is paid, approval-gated and
   template-only). Telegram does have a free bot API but needs a bot configured
   per group. So RoamWise shares OUT via deep links — one tap, their own app,
   their own account — rather than pretending to sync with either. */
var CHAT_KINDS = {
  text:    {icon:'', label:''},
  tusk:    {icon:'\u26a1', label:'Ailon Tusk'},
  when:    {icon:'\ud83d\udcc5', label:'When can everyone go?'},
  train:   {icon:'\ud83d\ude82', label:'Which train?'},
  trainvote:{icon:'', label:''},
  whenvote:{icon:'', label:''},
  budget:  {icon:'\ud83d\udcb0', label:'Budget'},
  plan:    {icon:'\ud83d\uddd3\ufe0f', label:'Itinerary'},
  meet:    {icon:'\ud83d\udccd', label:'Meeting point'},
  poll:    {icon:'\ud83d\uddf3\ufe0f', label:'Poll'},
  paid:    {icon:'\u2705', label:'Payment'},
  expense: {icon:'\ud83d\udcb0', label:'Expense'},
  settle:  {icon:'\u2705', label:'Settled'},
  decision:{icon:'\u2705', label:'Decision'},
  vote:    {icon:'\ud83d\uddf3\ufe0f', label:'Vote'}
};
/* Backup/export the whole chat so users can keep it before the 30-day auto-delete.
   Downloads a readable .txt (messages + money + decisions + board) + a .json for
   re-import later. This is why we can safely expire server data: users own a copy. */
function rwChatExport(){
  var msgs=_chatMsgs||[];
  if(!msgs.length){ showToast('Nothing to back up yet'); return; }
  var title=((el('chatTitle')&&el('chatTitle').textContent)||'RoamWise trip chat');
  var lines=['RoamWise chat backup \u2014 '+title, 'Saved '+new Date().toLocaleString('en-IN'), '\u2500'.repeat(30), ''];
  msgs.forEach(function(m){
    var who=(m.name||'Someone').split(' ')[0];
    var t=m.at?new Date(m.at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
    var line;
    if(m.kind==='expense'&&m.payload){ line='\ud83d\udcb0 '+who+' paid \u20b9'+(m.payload.amount||0)+' for '+(m.payload.what||'expense'); }
    else if(m.kind==='settle'&&m.payload){ line='\u2705 '+who+' settled \u20b9'+(m.payload.amount||0); }
    else if(m.kind==='decision'&&m.payload){ line='\u2705 Decision: '+(m.payload.q||'')+' \u2192 '+(m.payload.choice||''); }
    else if(m.kind==='meet'&&m.payload){ line='\ud83d\udccd Meet: '+(m.payload.place||'')+(m.payload.when?' @ '+m.payload.when:''); }
    else if(m.kind==='plan'&&m.payload){ line='\ud83d\uddd3\ufe0f Plan pinned: '+(m.payload.name||''); }
    else if(m.kind==='board'&&m.payload){ line='\ud83d\udccb Board: '+(m.payload.title||''); }
    else { line=who+': '+(m.text||''); }
    lines.push((t?'['+t+'] ':'')+line);
  });
  var txt=lines.join('\n');
  try{
    var blob=new Blob([txt],{type:'text/plain'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='roamwise-chat-'+(title.replace(/[^a-z0-9]+/gi,'-').toLowerCase())+'.txt';
    document.body.appendChild(a); a.click(); a.remove();
    showToast('Chat saved to your device \u2713');
  }catch(e){
    try{ navigator.clipboard.writeText(txt); showToast('Chat copied \u2014 paste to save'); }catch(e2){ showToast('Could not export'); }
  }
}
/* Close any unclosed <div>s left by truncation, and strip stray closers, so a
   Tusk card can never break the chat layout. Also removes <style>/<script>. */
function rwBalanceDivs(html){
  html = String(html||'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'');
  var open = (html.match(/<div\b[^>]*>/gi)||[]).length;
  var close = (html.match(/<\/div>/gi)||[]).length;
  if(close>open){ /* trim extra leading closers */ 
    var extra = close-open;
    while(extra-->0){ html = html.replace(/<\/div>/i, ''); }
  } else {
    for(var i=0;i<(open-close);i++){ html += '</div>'; }
  }
  return html;
}
/* ---- Ailon Tusk answers into the room ---- */
/* Build a friendly, exact settle-up answer from the live Kitty engine, so
   @tusk can answer "who owes whom?" in chat without guessing. */
function chatSettleAnswer(){
  var k = chatKittyState();
  if(!k) return '\ud83d\udcb0 No expenses logged yet, boss \u2014 tap "+ Add an expense" when someone pays, and I\u2019ll track who owes whom to the last rupee.';
  var nm = function(id){ return (k.names[id]||'Someone'); };
  if(!k.tx.length) return '\u2705 All square! Total spent: \u20b9'+k.total.toLocaleString('en-IN')+' across '+k.people+' \u2014 nobody owes anybody. Mast.';
  var lines = k.tx.map(function(t){ return '\u2022 '+nm(t.from)+' \u2192 '+nm(t.to)+': \u20b9'+Number(t.amount).toLocaleString('en-IN'); });
  return '\ud83d\udcb0 Hisaab time! Total \u20b9'+k.total.toLocaleString('en-IN')+' (\u2248\u20b9'+k.perHead.toLocaleString('en-IN')+'/head). Settle with just '+k.tx.length+' payment'+(k.tx.length>1?'s':'')+':\n'+lines.join('\n')+'\n\nTap the \ud83d\udcb0 Kitty pin to mark any of these paid.';
}
async function chatAskTusk(q){
  if(!q || !q.trim()) return;
  await chatPost('text', null, '@tusk '+q).catch(function(){});
  /* Settle-up questions get answered from the live expense ledger (exact),
     not the AI (which can't see the group's money). */
  if(/who\s+owes|owes?\s+whom|settle|split|kitty|hisaab|hisab|balance|paisa|kaun.*de|how\s+much.*owe/i.test(q)){
    var ans = chatSettleAnswer();
    if(ans){ await chatPost('text', null, ans).catch(function(){}); return; }
  }
  try{
    var it = cpParseRegex(q);
    it._raw = q;
    var parts = await cpActionsHTML(it);
    /* Keep Tusk's RICH output — cards, chips, images, buttons — instead of
       flattening to plain text. This is Tusk's own generated HTML (not user
       input), rendered in a sandboxed bubble, so it is safe to keep intact.
       We trim to the first couple of cards so a chat answer stays crisp. */
    var rich = String(parts.join(''));
    /* crispness: cap the size so one @tusk reply can't flood the chat */
    if(rich.length > 4200){
      var cut = rich.lastIndexOf('</div>', 4200);
      rich = (cut>800 ? rich.slice(0, cut+6) : rich.slice(0,4200));
    }
    /* CRITICAL: truncating HTML can leave unclosed <div>s. Unbalanced tags make
       EVERY following chat bubble render INSIDE the broken card, laid out as
       thin horizontal strips (the bug in the screenshot). Balance the divs so
       the card always closes cleanly. */
    rich = rwBalanceDivs(rich);
    var plainFallback = rich.replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]*>/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,240);
    if(!rich.trim()) { rich=''; plainFallback = 'I could not find anything solid on that \u2014 try naming the place with its country, e.g. "Goa, India".'; }
    await chatPost('tusk', {q:q, html:rich}, plainFallback);
    if(/\b(plan|itinerary|days? in|day trip|schedule)\b/i.test(q)){
      await chatPost('plan', {text:plainFallback}, '\ud83d\uddd3\ufe0f Tusk drafted a plan \u2014 see \ud83d\uddd3\ufe0f Plan up top').catch(function(){});
    }
  }catch(e){
    await chatPost('tusk', null, 'I hit an error answering that. Try rephrasing?').catch(function(){});
  }
}
/* ---- share the room outward ---- */
function chatInvite(){
  var link = 'https://www.roamwise.co.in/?join='+encodeURIComponent(_chatRoom||'');
  var msg = 'Join our trip planning on RoamWise \u2014 budgets, itineraries and Ailon Tusk in one place:\n'+link;
  var ov = el('chatInviteBox');
  if(!ov){
    ov=document.createElement('div'); ov.id='chatInviteBox'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83d\udc65 Invite the group</b><button class="x" onclick="rwOverlayClose(\'chatInviteBox\')">\u2715</button></div>'
      +'<div id="chatInviteBody" style="padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  el('chatInviteBody').innerHTML =
     '<p style="font-size:12.5px;color:var(--t2);line-height:1.6">Anyone who opens this and signs in joins the room. Share it where your group already talks.</p>'
    +'<div class="tk-chips" style="margin-top:11px">'
    +'<a class="tk-chip gold" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(msg)+'">\ud83d\udcac WhatsApp</a>'
    +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent('Join our trip planning on RoamWise')+'">\u2708\ufe0f Telegram</a>'
    +'<button class="tk-chip" onclick="copyText(\''+link+'\')">\ud83d\udd17 Copy link</button>'
    +'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);line-height:1.6;margin-top:12px">'
    +'RoamWise cannot read or post inside your WhatsApp group \u2014 no app can, WhatsApp provides no such API. This shares the link out to whichever app you already use.'
    +'</div>';
  rwOverlayOpen('chatInviteBox');
}
/* ---- render one message by kind ---- */


/* ============================================================================
   TRIPCHAT ENGINE (rw-v96) — coordination, games, and Tusk in the room
   ============================================================================
   A group chat is where trips actually get decided, so this is where the
   deciding tools live. Three things nobody else puts in one place:
     · DECIDE  — polls that close themselves and pin the result
     · PLAY    — games that pass the time on a 9-hour Himalayan drive
     · ASK     — @tusk in the group, answering with real app data
   ========================================================================= */
var RW_CHAT_GAMES = [
  { id:'twotruths', icon:'\ud83c\udfad', name:'Two truths, one lie',
    how:'Everyone posts three travel stories. One is invented. Guess.',
    seed:'\ud83c\udfad *Two truths, one lie* \u2014 post three travel stories, one made up. Rest of you guess!' },
  { id:'wouldyou', icon:'\u2696\ufe0f', name:'Would you rather',
    how:'Impossible travel choices. Reveals more than you expect.',
    pool:['Would you rather: window seat for 20 hours, or aisle seat for 10?',
          'Would you rather: lose your luggage, or lose your phone charger?',
          'Would you rather: perfect weather and crowds, or rain and an empty place?',
          'Would you rather: eat only street food, or only hotel food, all trip?',
          'Would you rather: no photos allowed, or no music allowed?',
          'Would you rather: sleep on a night bus, or wake up at 4am for a day bus?'] },
  { id:'guessplace', icon:'\ud83d\udccd', name:'Where am I?',
    how:'Post a photo with no caption. First to name the place wins.',
    seed:'\ud83d\udccd *Where am I?* \u2014 post a photo, no caption. First correct guess wins.' },
  { id:'countdown', icon:'\u23f3', name:'Trip countdown',
    how:'Everyone says the one thing they are most looking forward to.',
    seed:'\u23f3 One thing each \u2014 what are you MOST looking forward to on this trip?' },
  { id:'packing', icon:'\ud83c\udf92', name:'Packing roulette',
    how:'Name one thing you always forget. Somebody will save you.',
    seed:'\ud83c\udf92 *Packing roulette* \u2014 name the one thing you ALWAYS forget. Someone here will remember it for you.' },
  { id:'budget', icon:'\ud83d\udcb8', name:'Guess the bill',
    how:'Before the bill arrives, everyone guesses. Closest pays nothing extra.',
    seed:'\ud83d\udcb8 *Guess the bill* \u2014 everyone guess the total before it arrives. Furthest off buys chai.' }
];

function rwChatTuskHint(){
  var i=el('chatInput')||el('chatMsg')||el('tcInput');
  if(i){ i.value='@tusk '; i.focus(); showToast('Type your question \u2014 the whole group sees the answer'); }
  else showToast('Start a message with @tusk to ask him anything');
}
function openChatGames(){
  var ov=el('cgOv');
  if(!ov){ ov=document.createElement('div'); ov.id='cgOv'; ov.className='overlay'; ov.style.zIndex='4400';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('cgOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:430px">'
    +'<div class="sheet-h"><b>\ud83c\udfae Pass the time</b><button class="tact" onclick="rwOverlayClose(\'cgOv\')">\u2715</button></div>'
    +'<p class="note" style="margin-bottom:10px">For the nine-hour drive, the delayed train, the wait for everyone to wake up.</p>'
    + RW_CHAT_GAMES.map(function(g){
        return '<div class="cg-row" onclick="rwChatGame(\''+g.id+'\')">'
          +'<span class="cg-i">'+g.icon+'</span>'
          +'<span style="flex:1;min-width:0"><b>'+esc2(g.name)+'</b>'
          +'<div class="note" style="margin:0">'+esc2(g.how)+'</div></span>'
          +'<span class="cg-go">Start</span></div>';
      }).join('')
    +'</div>';
  ov.classList.add('open');
}
function rwChatGame(id){
  var g=RW_CHAT_GAMES.filter(function(x){ return x.id===id; })[0]; if(!g) return;
  var text = g.seed || (g.pool? g.pool[Math.floor(Math.random()*g.pool.length)] : g.name);
  rwOverlayClose('cgOv');
  try{ chatPost('text', null, text); }catch(e){
    try{ var i=el('chatInput'); if(i){ i.value=text; i.focus(); } }catch(e2){ /* best-effort, ignore */ }
  }
}


/* ---------------- ASK: Tusk in the group ---------------- */
function rwChatAskTusk(q){
  /* rw-v98: this used to run a SECOND, weaker agent path in parallel with the
     app's existing chatTuskFacilitate() — which is the one that produces the
     proper destination cards. Two agents answering the same message is why the
     chat filled with "I could not work that one out" next to a good card.
     There is now one path: the good one. */
  var question=String(q||'').replace(/^@tusk\s*/i,'').trim();
  if(!question) return;
  if(window._tuskBusy) return;
  window._tuskBusy = true;
  setTimeout(function(){ window._tuskBusy=false; }, 2500);
  try{
    if(typeof chatTuskFacilitate==='function'){ chatTuskFacilitate(question); return; }
  }catch(e){ /* best-effort, ignore */ }
  try{ if(typeof cpAsk==='function') cpAsk(question); }catch(e){ /* best-effort, ignore */ }
}



