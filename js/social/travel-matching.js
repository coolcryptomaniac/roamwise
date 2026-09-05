// @ts-nocheck
// Moved verbatim from app.js — Smart travel intent matching engine: matches
// people by travel intent (founder/investor/creator/traveller) heading to
// similar places via Firestore. Called from index.html (openMatchEngine).
/* ================= SMART TRAVEL MATCHING ENGINE (rw-v40) =================
   Matches people by travel INTENT — founders, investors, creators and
   travellers heading to similar places at similar times. Cross-device via
   Firestore so it works between real people, not just on one phone.
   Scoring is transparent (you can see WHY you matched), which beats a
   black-box "compatibility %" nobody trusts. */
var RW_MATCH_ROLES=[
  {id:'founder',  label:'\ud83d\ude80 Founder',   why:'building something'},
  {id:'investor', label:'\ud83d\udcbc Investor',  why:'looking at deals'},
  {id:'creator',  label:'\ud83c\udfa5 Creator',   why:'making content'},
  {id:'engineer', label:'\ud83d\udcbb Engineer',  why:'building / remote work'},
  {id:'traveller',label:'\ud83c\udf0d Traveller', why:'just exploring'}
];
var RW_MATCH_INTENT=[
  {id:'cofound',  label:'Meet co-founders'},
  {id:'raise',    label:'Meet investors'},
  {id:'invest',   label:'Meet founders to back'},
  {id:'collab',   label:'Creative collabs'},
  {id:'buddies',  label:'Travel buddies'},
  {id:'work',     label:'Co-work / remote'}
];
function openMatchEngine(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('matchSection');
  if(!sec){ sec=document.createElement('section'); sec.id='matchSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  var me=rwMatchProfile();
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83e\udd1d Travel <em>matching</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'matchSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Find founders, investors, creators and travellers heading where you\u2019re heading. You choose what to share \u2014 nothing is public until you post it.</p>'
    +'<div id="matchBody"></div>';
  rwMatchRender(me);
}
function rwMatchProfile(){ try{ return JSON.parse(lsGet('rw_match_me')||'null'); }catch(e){ return null; } }
function rwMatchRender(me){
  var host=el('matchBody'); if(!host) return;
  if(!me){
    host.innerHTML='<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:18px;text-align:center">'
      +'<div style="font-size:34px;margin-bottom:6px">\ud83e\udded</div>'
      +'<div style="font-weight:800;margin-bottom:4px">Set up your travel card</div>'
      +'<div style="font-size:13px;color:var(--t2);margin-bottom:14px">Takes 20 seconds. Say who you are and where you\u2019re headed \u2014 we\u2019ll surface people going the same way.</div>'
      +'<button class="tact" style="font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:12px 20px" onclick="rwMatchSetup()">Create my card</button></div>';
    return;
  }
  var role=RW_MATCH_ROLES.filter(function(r){return r.id===me.role;})[0]||RW_MATCH_ROLES[4];
  host.innerHTML='<div style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:15px;margin-bottom:14px">'
    +'<div style="display:flex;justify-content:space-between;align-items:start;gap:8px">'
    +'<div><div style="font-weight:800;font-size:15px">'+role.label+'</div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin-top:3px">Heading to <b>'+esc2(me.dest||'anywhere')+'</b>'+(me.when?' \u00b7 '+esc2(me.when):'')+'</div>'
    +'<div style="font-size:11.5px;color:var(--t3);margin-top:3px">'+esc2((me.intents||[]).map(function(i){var f=RW_MATCH_INTENT.filter(function(x){return x.id===i;})[0];return f?f.label:i;}).join(' \u00b7 '))+'</div></div>'
    +'<button class="tact" style="padding:5px 10px;font-size:11px" onclick="rwMatchSetup()">Edit</button></div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
    +'<button class="tact" style="flex:1;min-width:140px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwMatchPost()">\ud83d\udce3 Post my card</button>'
    +'<button class="tact" style="flex:1;min-width:140px" onclick="rwMatchFind()">\ud83d\udd0d Find matches</button></div>'
    +'<div id="matchResults"></div>';
}
function rwMatchSetup(){
  var me=rwMatchProfile()||{};
  var roleOpts=RW_MATCH_ROLES.map(function(r){ return {v:r.id, t:r.label}; });
  rwForm('\ud83e\udded Your travel card', [
    {key:'role', label:'I am a\u2026 ('+RW_MATCH_ROLES.map(function(r){return r.id;}).join(' / ')+')', value:me.role||'traveller'},
    {key:'dest', label:'Heading to (city or region)', value:me.dest||'', placeholder:'e.g. Bangalore, Goa, Bali'},
    {key:'when', label:'Roughly when?', value:me.when||'', placeholder:'e.g. Sep 2026'},
    {key:'about', label:'One line about you', value:me.about||'', placeholder:'e.g. building a travel app, open to co-founders'},
    {key:'contact', label:'How should matches reach you?', value:me.contact||'', placeholder:'email or @handle'}
  ], function(v){
    var prof={role:(v.role||'traveller').toLowerCase().trim(), dest:v.dest||'', when:v.when||'',
              about:v.about||'', contact:v.contact||'', intents:me.intents||['buddies']};
    try{ lsSet('rw_match_me', JSON.stringify(prof)); }catch(e){}
    rwMatchRender(prof); showToast('Travel card saved');
  });
}
/* Post my card so others can find me. Opt-in and explicit. */
function rwMatchPost(){
  var me=rwMatchProfile(); if(!me){ rwMatchSetup(); return; }
  if(!me.dest){ showToast('Add a destination first'); return; }
  if(!user){ showToast('Sign in first so matches can reach you'); return; }
  if(typeof db==='undefined' || !db){ showToast('Connect to the internet to post your card'); return; }
  db.collection('squads').add({
    key:'match:'+(me.dest||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,24),
    kind:'match', role:me.role, dest:me.dest, when:me.when, about:me.about,
    contact:me.contact, intents:me.intents||[],
    name:(user.displayName||'Traveller'), uid:user.uid,
    created: firebase.firestore.FieldValue.serverTimestamp(),
    expireAt: firebase.firestore.Timestamp.fromMillis(Date.now()+60*24*60*60*1000)
  }).then(function(){ showToast('\ud83d\udce3 Card posted \u2014 people heading to '+me.dest+' can find you'); })
    .catch(function(){ showToast('Could not post right now \u2014 try again'); });
}
/* Find people going the same way. Transparent scoring: you see WHY. */
function rwMatchFind(){
  var me=rwMatchProfile(); if(!me||!me.dest){ showToast('Set your destination first'); return; }
  var host=el('matchResults'); if(host) host.innerHTML='<div class="note">\ud83d\udd0d Looking for people heading to '+esc2(me.dest)+'\u2026</div>';
  if(typeof db==='undefined' || !db){ if(host) host.innerHTML='<div class="note">You\u2019re offline \u2014 matching needs a connection.</div>'; return; }
  var key='match:'+(me.dest||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,24);
  db.collection('squads').where('key','==',key).limit(30).get().then(function(qs){
    var rows=[];
    qs.forEach(function(d){ var x=d.data()||{}; if(x.uid!==(user&&user.uid)) rows.push(x); });
    rwMatchShow(rows, me);
  }).catch(function(){ if(host) host.innerHTML='<div class="note">Couldn\u2019t search right now \u2014 try again in a moment.</div>'; });
}
function rwMatchScore(them, me){
  var pts=0, why=[];
  if((them.dest||'').toLowerCase()===(me.dest||'').toLowerCase()){ pts+=3; why.push('same destination'); }
  if(them.when && me.when && them.when.toLowerCase()===me.when.toLowerCase()){ pts+=2; why.push('same dates'); }
  var mine=me.intents||[], theirs=them.intents||[];
  var shared=mine.filter(function(i){ return theirs.indexOf(i)>=0; });
  if(shared.length){ pts+=shared.length; why.push('both want '+shared.length+' of the same thing'+(shared.length>1?'s':'')); }
  /* complementary pairs are the valuable ones */
  var comp=[['founder','investor'],['investor','founder'],['founder','engineer'],['creator','founder']];
  comp.forEach(function(c){ if(me.role===c[0] && them.role===c[1]){ pts+=3; why.push('complementary roles'); } });
  return {pts:pts, why:why};
}
function rwMatchShow(rows, me){
  var host=el('matchResults'); if(!host) return;
  if(!rows.length){ host.innerHTML='<div class="note" style="text-align:center;padding:18px;color:var(--t3)">No one has posted for '+esc2(me.dest)+' yet. Post your card \u2014 be the first, and others will find you.</div>'; return; }
  var scored=rows.map(function(r){ var s=rwMatchScore(r, me); return {r:r, s:s}; })
                 .sort(function(a,b){ return b.s.pts-a.s.pts; });
  host.innerHTML='<div style="font-size:12px;color:var(--t3);margin-bottom:8px">'+scored.length+' heading the same way</div>'
    + scored.map(function(x){
      var r=x.r, role=RW_MATCH_ROLES.filter(function(q){return q.id===r.role;})[0]||RW_MATCH_ROLES[4];
      return '<div style="border:1px solid var(--b2,#2A2A36);border-radius:13px;padding:13px;margin-bottom:9px;background:var(--bg2,#12151F)">'
        +'<div style="display:flex;justify-content:space-between;gap:8px"><div style="font-weight:800;font-size:14px">'+role.label+' \u00b7 '+esc2(r.name||'Traveller')+'</div>'
        +'<div style="font-size:11px;color:var(--gold,#E8BA6C);font-weight:800">'+x.s.pts+' pts</div></div>'
        +(r.about?'<div style="font-size:13px;color:var(--t2);margin-top:4px">'+esc2(r.about)+'</div>':'')
        +'<div style="font-size:11px;color:var(--t3);margin-top:4px">'+esc2(r.dest||'')+(r.when?' \u00b7 '+esc2(r.when):'')+'</div>'
        +(x.s.why.length?'<div style="font-size:11px;color:#4ADE80;margin-top:5px">\u2713 '+esc2(x.s.why.join(' \u00b7 '))+'</div>':'')
        +(r.contact?'<div style="margin-top:8px"><a class="tact" style="padding:6px 12px;font-size:12px;text-decoration:none" href="'+(r.contact.indexOf('@')>=0&&r.contact.indexOf(' ')<0&&r.contact.indexOf('.')>0?'mailto:'+esc2(r.contact):'#')+'">\u2709\ufe0f '+esc2(r.contact)+'</a></div>':'')
        +'</div>';
    }).join('');
}
