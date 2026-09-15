// @ts-nocheck
/* Founder-only staff access policy helpers. Firestore wiring lives in
   admin/index.html so this module stays deterministic and testable. */
var RWTeamAccess = (function(){
  var ROLES = ['admin','finance','marketing','support','ops','partnerships','content','engineering','qa','none'];

  function text(v,max){ return String(v == null ? '' : v).trim().slice(0,max); }
  function role(v){ v=text(v,32).toLowerCase(); return ROLES.indexOf(v)>-1?v:'none'; }
  function normalise(input){
    var uid=text(input&&input.uid,160),name=text(input&&input.name,120),email=text(input&&input.email,320).toLowerCase();
    if(!uid)return {ok:false,error:'Firebase UID is required.'};
    if(!/^[A-Za-z0-9_-]+$/.test(uid))return {ok:false,error:'Firebase UID contains unsupported characters.'};
    if(!name)return {ok:false,error:'Team member name is required.'};
    return {ok:true,member:{uid:uid,name:name,email:email,type:text(input&&input.type,80)||'Team member',role:role(input&&input.role),salaryFixed:Math.max(0,Math.round(Number(input&&input.salaryFixed)||0)),incentive:Math.max(0,Math.round(Number(input&&input.incentive)||0)),joined:text(input&&input.joined,10),status:'active',accessActive:role(input&&input.role)!=='none'}};
  }
  function isOffboarded(m){ return !!(m&&(m.status==='offboarded'||m.accessActive===false)); }
  function escAttr(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function render(list,helpers){
    var esc=helpers&&helpers.esc||escAttr,when=helpers&&helpers.when||function(){return '—';};
    var rows=(list||[]).slice().sort(function(a,b){
      if(isOffboarded(a)!==isOffboarded(b))return isOffboarded(a)?1:-1;
      return String(a.name||a.email||a.id).localeCompare(String(b.name||b.email||b.id));
    }).map(function(m){
      var off=isOffboarded(m),uid=escAttr(m.id||m.uid||'');
      return '<div class="row"><div class="grow"><strong>'+esc(m.name||m.email||'Unnamed team member')+(off?' <span class="tag">offboarded</span>':'')+'</strong>'+
        '<div class="meta">'+esc(m.email||'—')+' &middot; role: '+esc(m.role||'none')+' &middot; UID '+esc(m.id||m.uid||'')+'</div>'+
        (off?'<div class="meta">Access removed '+when(m.offboardedAt)+'; employment history retained.</div>':'<div class="meta">Firestore access is live only while this role remains active.</div>')+'</div>'+
        '<div class="actions">'+(off?'<button class="btn small" onclick="openTeamMemberForm(\''+uid+'\')">Reactivate</button>':'<button class="btn small" onclick="openTeamMemberForm(\''+uid+'\')">Edit</button><button class="btn danger small" onclick="offboardTeamMember(\''+uid+'\')">Offboard</button>')+'</div></div>';
    }).join('');
    return '<div class="list">'+(rows||'<div class="empty">No staff access records found.</div>')+'</div>';
  }
  function form(m){m=m||{};var id=m.id||m.uid||'';return ''+
    '<div class="field full"><label>Firebase UID</label><input id="teamUid" class="input" value="'+escAttr(id)+'" '+(id?'readonly':'')+' placeholder="UID from the person\'s verified sign-in"></div>'+
    '<div class="field"><label>Name</label><input id="teamName" class="input" value="'+escAttr(m.name)+'"></div>'+
    '<div class="field"><label>Email</label><input id="teamEmail" class="input" type="email" value="'+escAttr(m.email)+'"></div>'+
    '<div class="field"><label>Employment type</label><input id="teamType" class="input" value="'+escAttr(m.type||'Team member')+'"></div>'+
    '<div class="field"><label>Access role</label><select id="teamRole" class="input">'+ROLES.map(function(r){return '<option value="'+r+'"'+((m.role||'none')===r?' selected':'')+'>'+r+'</option>';}).join('')+'</select></div>'+
    '<div class="field"><label>Fixed salary / month (INR)</label><input id="teamSalary" class="input" type="number" min="0" value="'+Math.max(0,Number(m.salaryFixed)||0)+'"></div>'+
    '<div class="field"><label>Incentive / month (INR)</label><input id="teamIncentive" class="input" type="number" min="0" value="'+Math.max(0,Number(m.incentive)||0)+'"></div>'+
    '<div class="field"><label>Joining date</label><input id="teamJoined" class="input" type="date" value="'+escAttr(m.joined)+'"></div>';
  }
  function read($){return {uid:$('teamUid').value,name:$('teamName').value,email:$('teamEmail').value,type:$('teamType').value,role:$('teamRole').value,salaryFixed:$('teamSalary').value,incentive:$('teamIncentive').value,joined:$('teamJoined').value};}
  function retireMatchingReferrers(list,member){
    var name=text(member&&member.name,120).toLowerCase(),email=text(member&&member.email,320).toLowerCase(),changed=false;
    var out=(list||[]).map(function(r){var hay=(String(r.name||'')+' '+String(r.note||'')).toLowerCase();if((name&&hay.indexOf(name)>-1)||(email&&hay.indexOf(email)>-1)){changed=true;return Object.assign({},r,{active:false,note:text((r.note?r.note+' · ':'')+'Offboarded team member',240)});}return r;});
    return {list:out,changed:changed};
  }
  return {ROLES:ROLES,normalise:normalise,isOffboarded:isOffboarded,render:render,form:form,read:read,retireMatchingReferrers:retireMatchingReferrers};
})();
