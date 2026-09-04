// @ts-nocheck
/* ==================== SOCIAL: SECURE TRIP GROUP CHAT (reactions, presence, ====================
   members, vibe/phase, the message renderer, and safety/moderation)
   Extracted verbatim from app.js (Phase 4c modularization).
   Second half of the Secure Trip Group Chat feature — split from
   js/social/group-chat.js only to stay under the file line cap. Depends on
   the shared room state in js/social/group-state.js (_chatMsgs, _chatRoom)
   which must load first, and calls into js/social/trip-board.js's render
   helpers (chatBoardBody/chatTrainBody/chatWhenBody/rwPollHTML) from
   chatBubble() below — both files are plain globals loaded before app.js, so
   the call works regardless of load order between the two feature files.
   ==================================== */
/* ============================================================================
   TRIPCHAT — Gen-Z / Gen-Alpha layer (rw-v79)
   ============================================================================
   Design read: this generation grew up on Instagram DMs, Discord and BeReal.
   What they expect from a group chat is not "more features" — it's
   REACTIONS, REPLIES, STREAKS and PERSONALITY. Specifically:
     · double-tap to react (Instagram muscle memory)
     · emoji reactions that pile up, not a like counter
     · someone typing shown as movement, not text
     · the group having a visible identity (streak, vibe)
   Everything here is additive — no existing bubble or handler is replaced.
   ========================================================================= */
var RW_REACTS = ['\u2764\ufe0f','\ud83d\ude02','\ud83d\udd25','\ud83d\ude2d','\ud83d\udc40','\ud83d\udc4d'];

/* toggle my reaction on a message (stored as reactions.<emoji> = [uids]) */
function chatReact(id, emoji){
  if(!user || !_chatRoom) return;
  var msg=(_chatMsgs||[]).filter(function(m){ return m._id===id; })[0];
  var have = msg && msg.reactions && msg.reactions[emoji] && msg.reactions[emoji].indexOf(user.uid)>-1;
  var upd={};
  upd['reactions.'+emoji] = have
    ? firebase.firestore.FieldValue.arrayRemove(user.uid)
    : firebase.firestore.FieldValue.arrayUnion(user.uid);
  db.collection('tripchats').doc(_chatRoom).collection('msgs').doc(id).update(upd).catch(function(){});
  if(!have){ try{ rwHaptic&&rwHaptic(); }catch(e){} rwPopHeart(emoji); }
}
/* the little floating emoji burst — pure CSS, no library */
function rwPopHeart(e){
  var n=document.createElement('div');
  n.className='rw-pop'; n.textContent=e;
  document.body.appendChild(n);
  setTimeout(function(){ n.remove(); }, 900);
}
/* render the reaction pills under a bubble */
function chatReactsHTML(id, m){
  var r=m.reactions||{}, keys=Object.keys(r).filter(function(k){ return (r[k]||[]).length; });
  var out='';
  if(keys.length){
    out+='<div class="rx-row">'+keys.map(function(k){
      var mine = user && r[k].indexOf(user.uid)>-1;
      return '<span class="rx'+(mine?' mine':'')+'" onclick="chatReact(\''+id+'\',\''+k+'\')">'+k+' '+r[k].length+'</span>';
    }).join('')+'</div>';
  }
  return out;
}
/* long-press / double-tap opens the reaction picker */
function chatReactPicker(id, ev){
  try{ ev && ev.preventDefault(); }catch(e){}
  var old=el('rxPick'); if(old) old.remove();
  var d=document.createElement('div');
  d.id='rxPick'; d.className='rx-pick';
  d.innerHTML=RW_REACTS.map(function(e){
    return '<span onclick="chatReact(\''+id+'\',\''+e+'\');document.getElementById(\'rxPick\').remove()">'+e+'</span>';
  }).join('');
  document.body.appendChild(d);
  setTimeout(function(){
    document.addEventListener('click', function once(){ var x=el('rxPick'); if(x) x.remove(); document.removeEventListener('click',once); }, {once:true});
  }, 60);
}
/* group streak — consecutive days the group has said something */
function chatStreak(){
  var msgs=_chatMsgs||[]; if(!msgs.length) return 0;
  var days={};
  msgs.forEach(function(m){
    var t=m.at&&m.at.seconds? m.at.seconds*1000 : (m.ts||0);
    if(t) days[new Date(t).toISOString().slice(0,10)]=1;
  });
  var n=0, cur=new Date();
  for(var i=0;i<90;i++){
    var k=cur.toISOString().slice(0,10);
    if(days[k]) n++;
    else if(i>0) break;
    cur.setDate(cur.getDate()-1);
  }
  return n;
}
/* the header strip: streak + who's here + group vibe */

/* A cheap fingerprint of everything that can change inside one message.
   If this is unchanged we do not touch the DOM node at all. */
var _chatSeen = {};
function rwMsgSignature(m){
  var r=m.reactions||{}, keys=Object.keys(r).sort();
  var rx=keys.map(function(k){ return k+':'+((r[k]||[]).length); }).join(',');
  var votes='';
  if(m.kind==='poll' && m.payload && m.payload.votes){
    var v=m.payload.votes;
    votes=Object.keys(v).sort().map(function(u){ return u.slice(0,6)+v[u]; }).join(',');
  }
  return (m.text||'').length+'|'+(m.kind||'')+'|'+rx+'|'+votes+'|'+(m.edited||'');
}



/* ============================================================================
   PRESENCE + MEMBERS (rw-v99)
   ============================================================================
   WHY THE COUNT SAID 3 WITH NOBODY ELSE THERE: members[] grows by arrayUnion
   every time a NEW auth uid opens the room. Anonymous sign-in mints a fresh
   uid whenever storage is cleared, so testing across a few devices or browsers
   leaves real-but-empty ghost accounts in the list. The number was honest; the
   accounts were the founder's own.

   FIX: presence is now SEPARATE from membership.
     MEMBERS = who has the room (room doc)
     ONLINE  = who pinged in the last 90 seconds (presence subcollection)
     GHOSTS  = a member who never posted and is not online; the owner can
               clear them in one tap.
   And everyone now has a NAME, not just a count.
   ========================================================================= */
var RW_PRESENCE_MS = 90*1000;
var _presUnsub=null, _presTimer=null, _presence={};

function rwPresenceStart(){
  if(!_chatRoom || !user || !window.db) return;
  var col=db.collection('tripchats').doc(_chatRoom).collection('presence');
  var ref=col.doc(user.uid);
  function beat(){
    try{ ref.set({ name:(user.displayName||user.email||'Traveller').split('@')[0], at:Date.now() },{merge:true}); }catch(e){}
  }
  beat();
  if(_presTimer) clearInterval(_presTimer);
  _presTimer=setInterval(function(){ if(!document.hidden) beat(); }, 45000);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) beat(); });
  if(_presUnsub){ try{ _presUnsub(); }catch(e){} }
  _presUnsub = col.onSnapshot(function(qs){
    _presence={};
    qs.forEach(function(d){ _presence[d.id]=d.data()||{}; });
    try{ var vb=el('tcVibe'); if(vb) vb.innerHTML=chatVibeHTML(); }catch(e){}
    try{ if(el('memList')) rwMembersRender(); }catch(e){}
  }, function(){});
}
function rwIsOnline(uid){
  var p=_presence[uid];
  return !!(p && p.at && (Date.now()-p.at) < RW_PRESENCE_MS);
}
function rwMemberName(uid){
  if(_presence[uid] && _presence[uid].name) return _presence[uid].name;
  var hits=(_chatMsgs||[]).filter(function(x){ return x.uid===uid && x.name; });
  if(hits.length) return hits[hits.length-1].name;
  if(user && uid===user.uid) return 'You';
  return 'Traveller '+String(uid).slice(0,4);
}
function rwMembers(){
  var list=(window._chatMembers||[]).filter(function(u){ return u && u!=='tusk'; });
  if(user && list.indexOf(user.uid)===-1) list.push(user.uid);
  return list;
}
function openChatMembers(){
  var ov=el('memOv');
  if(!ov){ ov=document.createElement('div'); ov.id='memOv'; ov.className='overlay'; ov.style.zIndex='4500';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('memOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:420px">'
    +'<div class="sheet-h"><b>\ud83d\udc65 Who\u2019s in this trip</b>'
    +'<button class="tact" onclick="rwOverlayClose(\'memOv\')">\u2715</button></div>'
    +'<div id="memList"></div>'
    +'<button class="bk-go" style="margin-top:12px" onclick="rwOverlayClose(\'memOv\');chatInvite()">\ud83d\udd17 Invite someone</button>'
    +'</div>';
  ov.classList.add('open');
  rwMembersRender();
}
function rwMembersRender(){
  var host=el('memList'); if(!host) return;
  var owner=window._chatOwner||'';
  var iAmOwner = !!(user && owner===user.uid);
  var rows=rwMembers().map(function(uid){
    var on=rwIsOnline(uid);
    var posted=(_chatMsgs||[]).some(function(m){ return m.uid===uid; });
    return { uid:uid, on:on, name:rwMemberName(uid),
             ghost: (!posted && !on && uid!==(user&&user.uid)) };
  }).sort(function(a,b){ return (b.on?1:0)-(a.on?1:0); });

  host.innerHTML = rows.map(function(r){
    return '<div class="mem-row">'
      +'<span class="mem-av'+(r.on?' on':'')+'">'+esc2(r.name.charAt(0).toUpperCase())+'</span>'
      +'<span style="flex:1;min-width:0"><b>'+esc2(r.name)+(r.uid===(user&&user.uid)?' (you)':'')+'</b>'
      +'<div class="mem-sub">'+(r.on? '<i class="tc-live"></i>online now'
          : r.ghost? 'never posted \u2014 likely an old test sign-in' : 'offline')+'</div></span>'
      + (iAmOwner && r.ghost ? '<button class="tact" style="font-size:11px;padding:5px 9px" onclick="rwMemberRemove(\''+r.uid+'\')">Remove</button>':'')
      +'</div>';
  }).join('')
  +'<div class="dk-note" style="margin-top:9px;font-size:11.5px;color:var(--t3)">'
  + rows.filter(function(r){return r.on;}).length+' online \u00b7 '+rows.length+' member'+(rows.length===1?'':'s')
  + (iAmOwner && rows.some(function(r){return r.ghost;})
     ? '<br>Entries marked \u201cnever posted\u201d are usually old sign-ins from testing. Safe to remove.':'')
  +'</div>';
}
function rwMemberRemove(uid){
  if(!_chatRoom || !user) return;
  if(!confirm('Remove this member? They can rejoin with the invite link.')) return;
  db.collection('tripchats').doc(_chatRoom)
    .update({ members: firebase.firestore.FieldValue.arrayRemove(uid) })
    .then(function(){
      db.collection('tripchats').doc(_chatRoom).collection('presence').doc(uid).delete().catch(function(){});
      rwMembersRender();
    }).catch(function(e){ showToast((e&&e.message)||'Could not remove'); });
}


/* ============================================================================
   TRIP LIFECYCLE (rw-v99) — a trip is not one moment, it is five
   ============================================================================
   Group chats die between "shall we go somewhere?" and "we're going". They die
   again after the trip, when the money is still unsettled. So the room knows
   which phase it is in and surfaces the ONE thing that matters right now.

   Phases are inferred from what the group has actually done, never asked for.
   ========================================================================= */
var RW_TRIP_PHASES = [
  { id:'idea',    icon:'\ud83d\udca1', label:'Just an idea',
    need:'Nobody has picked a place yet.',
    cta:{ t:'Ask the group where', fn:'chatNewPoll()' } },
  { id:'dates',   icon:'\ud83d\udcc5', label:'Finding dates',
    need:'You have a place. Now the hard part: when.',
    cta:{ t:'When can everyone go?', fn:'chatWhenAsk()' } },
  { id:'booking', icon:'\ud83c\udfe1', label:'Booking it',
    need:'Dates are set. Lock the beds before prices move.',
    cta:{ t:'Find a stay', fn:'openStays()' } },
  { id:'onTrip',  icon:'\ud83c\udf92', label:'On the trip',
    need:'Log what people pay as it happens \u2014 nobody remembers on day four.',
    cta:{ t:'Add an expense', fn:'chatAddExpense()' } },
  { id:'settle',  icon:'\ud83e\uddfe', label:'Settling up',
    need:'The trip is done. Clear the money while everyone still cares.',
    cta:{ t:'Settle the kitty', fn:'openMoneyLayer()' } }
];
function rwTripPhase(){
  var msgs=_chatMsgs||[];
  var has=function(k){ return msgs.some(function(m){ return m.kind===k; }); };
  var expenses=msgs.filter(function(m){ return m.kind==='expense'; }).length;
  var settled =msgs.filter(function(m){ return m.kind==='settle'; }).length;
  var booked  =msgs.some(function(m){ return m.kind==='booking' || /booking|confirmed|\bref\b/i.test(m.text||''); });
  var dated   =msgs.some(function(m){ return m.kind==='dates' || m.kind==='when'; });
  var place   =msgs.some(function(m){ return m.kind==='dest' || m.kind==='plan'; });

  if(expenses>0 && settled>0) return RW_TRIP_PHASES[4];
  if(expenses>0)              return RW_TRIP_PHASES[3];
  if(booked)                  return RW_TRIP_PHASES[3];
  if(dated)                   return RW_TRIP_PHASES[2];
  if(place || has('poll'))    return RW_TRIP_PHASES[1];
  return RW_TRIP_PHASES[0];
}
function rwPhaseHTML(){
  var p=rwTripPhase();
  var idx=RW_TRIP_PHASES.indexOf(p);
  return '<div class="ph-wrap">'
    +'<div class="ph-dots">'
    + RW_TRIP_PHASES.map(function(x,i){
        return '<span class="ph-d'+(i<idx?' done':i===idx?' now':'')+'" title="'+esc2(x.label)+'"></span>';
      }).join('')
    +'</div>'
    +'<div class="ph-body"><b>'+p.icon+' '+esc2(p.label)+'</b>'
    +'<span>'+esc2(p.need)+'</span></div>'
    +'<button class="ph-cta" onclick="'+p.cta.fn+'">'+esc2(p.cta.t)+'</button>'
    +'</div>';
}

function chatVibeHTML(){
  var st=chatStreak();
  var msgs=_chatMsgs||[];
  /* FIXED (rw-v98): this counted anyone who had EVER posted — including Tusk
     and game prompts — so a solo chat claimed "3 in here". Now it uses the
     room's actual member list, and counts humans only. */
  var n=0, live=0, names=[];
  try{
    var mem=rwMembers();
    n=mem.length;
    mem.forEach(function(u){ if(rwIsOnline(u)){ live++; names.push(rwMemberName(u)); } });
  }catch(e){}
  if(!n) n=1;
  var vibe = st>=7 ? 'locked in \ud83d\udd25' : st>=3 ? 'warming up \u2728' : n>2 ? 'the squad is here \ud83d\udc65' : 'just getting started \ud83c\udf31';
  return '<div class="tc-vibe">'
    +(st>1? '<span class="tc-streak">\ud83d\udd25 '+st+'-day streak</span>':'')
    +'<span class="tc-vibe-t">'+vibe+'</span>'
    +'<span class="tc-count" onclick="openChatMembers()" style="cursor:pointer">'
    + (live? '<i class="tc-live"></i>'+esc2(names.slice(0,2).join(', '))
             +(names.length>2? ' +'+(names.length-2):'')+' \u00b7 ':'')
    + n+' member'+(n===1?'':'s')+' \u203a</span>'
    +'</div>';
}

function chatBubble(id, m, mine){
  var kind = m.kind||'text', K = CHAT_KINDS[kind]||CHAT_KINDS.text;
  if(kind==='poll'){
    return '<div class="tc-row"><div class="tc-av">\ud83d\uddf3\ufe0f</div>'
      +'<div style="max-width:88%">'+rwPollHTML(id, m)+chatReactsHTML(id, m)+'</div></div>';
  }
  if(kind==='tusk'){
    var richHtml = (m.payload && m.payload.html) ? (typeof rwBalanceDivs==='function' ? rwBalanceDivs(m.payload.html) : m.payload.html) : '';
    var inner = richHtml
      ? '<div class="tusk-rich clamped" id="tr_'+id+'">'+richHtml+'</div>'
        +'<button class="tusk-more" onclick="var b=el(\'tr_'+id+'\');b.classList.toggle(\'clamped\');this.textContent=b.classList.contains(\'clamped\')?\'Show more\':\'Show less\'">Show more</button>'
      : '<div style="font-size:12.5px;line-height:1.6;color:var(--t2)">'+esc2(m.text||'')+'</div>';
    return '<div style="display:flex;justify-content:flex-start;margin:6px 0">'
      +'<div style="max-width:92%;background:linear-gradient(135deg,rgba(232,186,108,.14),rgba(200,145,62,.05));border:1px solid rgba(232,186,108,.32);border-radius:14px 14px 14px 4px;padding:10px 12px;overflow:hidden">'
      +'<div style="font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);font-weight:800;margin-bottom:5px">\u26a1 Ailon Tusk</div>'
      + inner +'</div></div>';
  }
  if(kind==='poll'){
    var p=m.payload||{}, opts=p.options||[];
    var tally = (typeof chatPollTally==='function') ? chatPollTally(m) : {counts:opts.map(function(){return 0;}),total:0,winner:-1,myVote:undefined};
    return '<div style="margin:7px 0"><div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:13px;padding:11px 13px">'
      +'<div style="font-size:9.5px;color:var(--gold2,#C8913E);font-weight:800;text-transform:uppercase;letter-spacing:.08em">\ud83d\uddf3\ufe0f Poll \u00b7 '+esc2(m.name||'')+(tally.total?' \u00b7 '+tally.total+' vote'+(tally.total>1?'s':''):'')+'</div>'
      +'<div style="font-size:13px;font-weight:700;margin:4px 0 7px">'+esc2(p.q||m.text||'')+'</div>'
      + opts.map(function(o,i){
          var votes=tally.counts[i]||0, pct=tally.total? Math.round(votes/tally.total*100):0;
          var mineVote = tally.myVote===i, leading=tally.winner===i && tally.total>0;
          return '<button onclick="chatVoteNew(\''+id+'\','+i+')" style="position:relative;display:block;width:100%;text-align:left;background:var(--bg3,#1A1A20);border:1px solid '+(mineVote?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';border-radius:9px;padding:8px 11px;margin-bottom:5px;color:inherit;font:inherit;font-size:12px;cursor:pointer;overflow:hidden">'
            +'<div style="position:absolute;inset:0;width:'+pct+'%;background:'+(leading?'rgba(232,186,108,.18)':'rgba(255,255,255,.05)')+';transition:width .3s"></div>'
            +'<span style="position:relative;display:flex;justify-content:space-between"><span>'+(mineVote?'\u25c9 ':'')+esc2(o)+'</span><span style="color:var(--t3)">'+(tally.total?pct+'%':'')+'</span></span></button>';
        }).join('')
      + '<button class="chat-tool" style="width:100%;justify-content:center;margin-top:3px;font-size:11px" onclick="chatLockPoll(\''+id+'\')">\u2705 Lock the winner as a decision</button>'
      +'</div></div>';
  }
  if(kind==='expense'){
    var p=m.payload||{};
    return '<div style="margin:6px 0"><div style="background:var(--bg2,#12121C);border-left:3px solid #4ADE80;border-radius:9px;padding:8px 12px">'
      +'<div style="font-size:9.5px;color:#4ADE80;font-weight:800;text-transform:uppercase;letter-spacing:.08em">\ud83d\udcb0 Expense</div>'
      +'<div style="font-size:12.5px;margin-top:2px"><b>'+esc2(p.payerName||m.name||'Someone')+'</b> paid <b style="color:var(--gold,#E8BA6C)">\u20b9'+((p.amount||0).toLocaleString('en-IN'))+'</b> for '+esc2(p.what||'')+'</div></div></div>';
  }
  if(kind==='settle'){
    return '<div style="margin:5px 0;text-align:center"><span style="font-size:11px;color:#4ADE80;background:rgba(74,222,128,.1);padding:3px 10px;border-radius:999px">\u2705 '+esc2(m.text||'settled up')+'</span></div>';
  }
  if(kind==='decision'){
    var p=m.payload||{};
    return '<div style="margin:6px 0"><div style="background:linear-gradient(135deg,rgba(74,222,128,.12),transparent);border:1px solid rgba(74,222,128,.3);border-radius:11px;padding:9px 12px">'
      +'<div style="font-size:9.5px;color:#4ADE80;font-weight:800;text-transform:uppercase;letter-spacing:.08em">\u2705 Decided \u00b7 pinned up top</div>'
      +'<div style="font-size:12.5px;margin-top:2px">'+esc2(p.q||'')+' \u2192 <b>'+esc2(p.choice||'')+'</b></div></div></div>';
  }
  if(kind==='vote'){ return ''; }
  if(kind==='whenvote'){ return ''; }
  if(kind==='trainvote'){ return ''; }
  if(kind==='train'){
    var pt=m.payload||{};
    return '<div class="tk-card" style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:13px;margin:7px 0">'
      +'<div style="font-size:12px;font-weight:800;color:var(--gold,#E8BA6C);margin-bottom:2px">\ud83d\ude82 '+esc2(pt.route||'Which train?')+'</div>'
      +'<div style="font-size:10.5px;color:var(--t3,#7A7870);margin-bottom:8px">Asked by '+esc2((m.name||'Someone').split(' ')[0])+' \u00b7 tap the one that works</div>'
      + chatTrainBody(m) + '</div>';
  }   /* availability updates are silent — the card shows the tally */
  if(kind==='when'){
    var pw=m.payload||{};
    return '<div class="tk-card" style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:13px;margin:7px 0">'
      +'<div style="font-size:12px;font-weight:800;color:var(--gold,#E8BA6C);margin-bottom:2px">\ud83d\udcc5 '+esc2(pw.q||'Which dates work?')+'</div>'
      +'<div style="font-size:10.5px;color:var(--t3,#7A7870);margin-bottom:8px">Asked by '+esc2((m.name||'Someone').split(' ')[0])+' \u00b7 tap all that work for you</div>'
      + chatWhenBody(m) + '</div>';
  }
  if(kind==='board'){
    var p=m.payload||{}, mineB=(m.uid===((user||{}).uid));
    /* private items are only shown to their owner, even in the log */
    if(p.share===false && !mineB) return '';
    var ic={emergency:'\ud83c\udd98',ticket:'\ud83c\udfab',doc:'\ud83d\udcc4',note:'\ud83d\udccc'}[p.type]||'\ud83d\udccc';
    return '<div style="margin:5px 0;text-align:center"><span style="font-size:11px;color:var(--t2);background:rgba(255,255,255,.05);padding:3px 10px;border-radius:999px">'+ic+' '+esc2((m.name||'Someone').split(' ')[0])+' added '+(p.share===false?'a private ':'')+'board item \u00b7 tap \ud83d\udccb Board</span></div>';
  }
  if(kind==='meet'){
    var p=m.payload||{};
    var place=p.place||m.text||'', when=p.when||'', city=p.city||place;
    var mapQ=encodeURIComponent(place+(p.city?', '+p.city:''));
    var mapUrl=p.map||('https://www.google.com/maps/search/?api=1&query='+mapQ);
    var slug=(city||place).toLowerCase().replace(/[^a-z ]/g,'').trim().replace(/\s+/g,'-');
    var bms='https://in.bookmyshow.com/explore/events-'+encodeURIComponent(slug);
    /* Zomato has no stable city-slug URL (that 404s in the app WebView). Its
       search endpoint is the reliable one across web + WebView. */
    var zomato='https://www.zomato.com/search?q='+encodeURIComponent(place+(p.city?' '+p.city:''));
    return '<div style="margin:7px 0"><div style="background:var(--bg2,#12121C);border-left:3px solid #60A5FA;border-radius:9px;padding:10px 12px">'
      +'<div style="font-size:9.5px;color:#60A5FA;font-weight:800;text-transform:uppercase;letter-spacing:.08em">\ud83d\udccd Meeting point \u00b7 '+esc2(m.name||'')+'</div>'
      +'<div style="font-size:13px;font-weight:700;margin:3px 0 1px">'+esc2(place)+'</div>'
      +(when?'<div style="font-size:12px;color:var(--t2)">\ud83d\udd52 '+esc2(when)+'</div>':'')
      +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">'
      +'<a class="chat-tool" style="text-decoration:none" href="'+esc2(mapUrl)+'" target="_blank" rel="noopener" onclick="return rwOpenMap(\''+mapQ+'\')">\ud83d\uddfa\ufe0f Open in Maps</a>'
      +'<a class="chat-tool" style="text-decoration:none" href="'+esc2(bms)+'" target="_blank" rel="noopener">\ud83c\udfab Events here</a>'
      +'<a class="chat-tool" style="text-decoration:none" href="'+esc2(zomato)+'" target="_blank" rel="noopener">\ud83c\udf7d\ufe0f Food</a>'
      +'</div></div></div>';
  }
  if(kind==='budget' || kind==='plan' || kind==='paid'){
    var col = kind==='paid' ? '#4ADE80' : 'var(--gold,#E8BA6C)';
    return '<div style="margin:7px 0"><div style="background:var(--bg2,#12121C);border-left:3px solid '+col+';border-radius:9px;padding:9px 12px">'
      +'<div style="font-size:9.5px;color:'+col+';font-weight:800;text-transform:uppercase;letter-spacing:.08em">'+K.icon+' '+K.label+' \u00b7 '+esc2(m.name||'')+'</div>'
      +'<div style="font-size:12.5px;line-height:1.55;margin-top:3px">'+esc2(m.text||'')+'</div></div></div>';
  }
    /* Gen-Z bubble: double-tap to react (Instagram muscle memory), long-press
       for the picker, reactions pile up underneath. */
    return '<div class="tc-row'+(mine?' me':'')+'">'
    +(mine?'':'<div class="tc-av">'+esc2((m.name||'T').charAt(0).toUpperCase())+'</div>')
    +'<div style="max-width:78%">'
    +'<div class="tc-bub'+(mine?' me':'')+'" ondblclick="chatReact(\''+id+'\',\'\u2764\ufe0f\')" oncontextmenu="chatReactPicker(\''+id+'\',event);return false">'
    +(mine?'':'<div class="tc-nm">'+esc2(m.name||'Traveller')+'</div>')
    +esc2(m.text||'')
    +'</div>'
    + chatReactsHTML(id, m)
    +'</div></div>';
}

/* ==================== SAFETY & MODERATION ====================
   The ban is enforced in Firestore rules (isBanned() gates every social write),
   not just in this UI — otherwise anyone with devtools is straight back in.
   This layer is the reporting path and the honest explanation of what happens. */
function rwReportOpen(ctx){
  if(!window.user || !user.uid){ showToast('Sign in to report'); return; }
  var ov=el('reportOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='reportOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83d\udea9 Report</b><button class="x" onclick="rwOverlayClose(\'reportOverlay\')">\u2715</button></div>'
      +'<div id="reportBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  var reasons=['Scam or fraud attempt','Harassment or abuse','Sexual content','Spam or advertising','Impersonation','Something else'];
  el('reportBody').innerHTML =
     '<p style="font-size:12.5px;color:var(--t2);line-height:1.6">Tell me what happened. Reports are read by a person \u2014 me \u2014 not an automated filter.</p>'
    +'<div class="tk-chips" style="margin:10px 0">'
    + reasons.map(function(r,i){ return '<button class="tk-chip'+(i===0?' gold':'')+'" onclick="[].forEach.call(this.parentNode.children,function(b){b.classList.remove(\'gold\')});this.classList.add(\'gold\');window._repReason=\''+r.replace(/'/g,"")+'\'">'+r+'</button>'; }).join('')
    +'</div>'
    +'<textarea id="repDetail" class="k-inp" style="width:100%;min-height:96px" placeholder="What happened? Paste any message text \u2014 it helps."></textarea>'
    +'<button class="g-btn" style="width:100%;min-height:44px;margin-top:11px" onclick="rwReportSend('+JSON.stringify(ctx||{}).replace(/"/g,'&quot;')+')">Send report</button>'
    +'<div style="background:var(--bg3,#1A1A20);border-radius:12px;padding:11px 13px;margin-top:12px">'
    +'<b style="font-size:12px">What happens next</b>'
    +'<div class="tk-bul">I read every report myself, usually within 24 hours.</div>'
    +'<div class="tk-bul">Scam attempts and harassment get a permanent ban \u2014 enforced at the database, so a new sign-in on the same account does nothing.</div>'
    +'<div class="tk-bul">Bans are appealable once, by email, and I will tell you the reason.</div>'
    +'<div class="tk-bul">If someone has taken your money or threatened you, report it to <b>cybercrime.gov.in</b> as well \u2014 I can ban an account, only the police can pursue a person.</div>'
    +'</div>';
  window._repReason = reasons[0];
  rwOverlayOpen('reportOverlay');
}
function rwReportSend(ctx){
  var detail=(el('repDetail')||{}).value||'';
  if(!detail.trim()){ showToast('A line of detail helps a lot'); return; }
  db.collection('abuse').add({
    reporter:user.uid,
    reason:(window._repReason||'Something else')+': '+detail.trim().slice(0,500),
    ctx:ctx||{}, status:'open', at:new Date().toISOString()
  }).then(function(){
    el('reportBody').innerHTML='<div style="text-align:center;padding:26px 10px">'
      +'<div style="font-size:38px">\u2705</div><b style="display:block;margin-top:8px">Report sent</b>'
      +'<p style="font-size:12.5px;color:var(--t2);line-height:1.6;margin-top:8px">I read it personally, usually within a day. You can also block this person from the chat menu.</p></div>';
  }).catch(function(e){ showToast('Could not send: '+(e.message||e)); });
}
/* local block: hides them for you immediately, before any moderation happens */
function rwBlock(uid){
  if(!uid) return;
  var b=[]; try{ b=JSON.parse(lsGet('rw_blocked')||'[]'); }catch(e){}
  if(b.indexOf(uid)===-1){ b.push(uid); lsSet('rw_blocked', JSON.stringify(b)); }
  showToast('Blocked \u2014 their messages are hidden for you');
  try{ if(_chatRoom) tripChatOpen(_chatRoom); }catch(e){}
}
function rwIsBlocked(uid){
  try{ return (JSON.parse(lsGet('rw_blocked')||'[]')).indexOf(uid)>-1; }catch(e){ return false; }
}
/* am I banned? checked once at sign-in so the UI can explain rather than just fail */
function rwCheckBan(){
  if(!window.db || !window.user || !user.uid) return;
  db.collection('bans').doc(user.uid).get().then(function(d){
    if(!d.exists) return;
    var r=d.data()||{};
    showToast('Your account is restricted from social features.');
    window._rwBanned = true;
    var note=el('banNote');
    if(!note){
      note=document.createElement('div'); note.id='banNote';
      note.style.cssText='margin:12px 14px;padding:12px 14px;border-radius:12px;background:rgba(224,91,91,.09);border:1px solid rgba(224,91,91,.35);font-size:12.5px;line-height:1.6';
      note.innerHTML='<b>Social features are disabled on this account.</b><br>'
        +(r.reason? 'Reason: '+String(r.reason).replace(/[<>]/g,'')+'<br>':'')
        +'Planning, budgets and maps still work. To appeal once, email founder@roamwise.co.in from the address on this account.';
      var host=el('app'); if(host && host.parentNode) host.parentNode.insertBefore(note, host);
    }
  }).catch(function(){});
}
