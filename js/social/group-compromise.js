// @ts-nocheck
/* ==================== SOCIAL: GROUP COMPROMISE ENGINE ====================
   Extracted verbatim from app.js (Phase 4c modularization).
   Self-contained: scores destinations against everyone's interests/budget/diet
   from localStorage ('rw_group'). Does not touch the trip-chat room state, so
   it has no dependency on js/social/group-state.js or the chat/board files.
   ==================================== */
/* ==================== GROUP COMPROMISE ENGINE ====================
   The problem it kills: five people in a WhatsApp thread arguing over a trip.
   Each member sets what they want (interests, daily budget, pace, wake time,
   dietary need). The engine scores every candidate destination against the
   WHOLE group and finds the itinerary shape that upsets the fewest people.

   It is pure deterministic logic over data the app already has — no server, no
   AI cost, and the maths is explainable (we SHOW each person's satisfaction,
   not a black-box number). That transparency is the point: a compromise people
   can see is fair is one they'll actually accept. */
var RW_INTERESTS = ['beaches','mountains','food','nightlife','culture','adventure','shopping','relaxation','wildlife','history'];
function grpMembers(){ try{ return JSON.parse(lsGet('rw_group')||'[]'); }catch(e){ return []; } }
function grpSave(m){ lsSet('rw_group', JSON.stringify(m.slice(0,12))); }
function grpTagsFor(entry){
  var j=((entry.tags||[]).concat(entry.interests||[]).join(' ')+' '+(entry.name||'')+' '+(entry.region||'')).toLowerCase();
  var t=[];
  if(/beach|island|coast|goa|bali|maldiv/.test(j)) t.push('beaches');
  if(/trek|mountain|himalaya|alpine|leh|spiti|manali|peak/.test(j)) t.push('mountains');
  t.push('food'); /* every destination has food */
  if(/night|party|club|bar|bangkok|vegas/.test(j)) t.push('nightlife');
  if(/temple|museum|heritage|fort|palace|culture|history|varanasi/.test(j)) { t.push('culture'); t.push('history'); }
  if(/trek|raft|dive|surf|safari|adventure|ski/.test(j)) t.push('adventure');
  if(/market|shop|bazaar|mall/.test(j)) t.push('shopping');
  if(/beach|spa|lake|relax|retreat/.test(j)) t.push('relaxation');
  if(/safari|wildlife|park|jungle|national/.test(j)) t.push('wildlife');
  return t;
}
function grpScoreMember(member, entry, tags){
  /* interest overlap */
  var want=member.interests||[], hit=0;
  want.forEach(function(w){ if(tags.indexOf(w)>-1) hit++; });
  var interestScore = want.length ? hit/want.length : 0.5;
  /* budget fit: their daily cap vs the destination's mid daily (weekly/7, INR) */
  var fx=window._rwFxINR||88;
  var dailyMidINR = ((entry.cost&&entry.cost.mid)||700)/7*fx;
  var budgetScore = !member.budget ? 0.6
    : member.budget >= dailyMidINR ? 1
    : Math.max(0, member.budget/dailyMidINR);
  /* dietary comfort — veg/halal easier in some regions */
  var dietScore=1, reg=(entry.region||'').toLowerCase();
  if(member.diet==='veg')  dietScore = /south asia|india/.test(reg)?1 : /southeast asia|east asia/.test(reg)?0.7 : 0.55;
  if(member.diet==='halal')dietScore = /middle east|south asia|southeast asia/.test(reg)?1 : 0.6;
  if(member.diet==='vegan')dietScore = /south asia|southeast asia/.test(reg)?0.8 : 0.6;
  return Math.round((interestScore*0.5 + budgetScore*0.35 + dietScore*0.15)*100);
}
function grpCompromise(members){
  if(!members.length) return [];
  var pool=(typeof DB!=='undefined'? DB:[]).slice();
  var scored=pool.map(function(entry){
    var tags=grpTagsFor(entry);
    var per=members.map(function(m){ return {name:m.name||'Traveller', score:grpScoreMember(m,entry,tags)}; });
    var vals=per.map(function(p){return p.score;});
    var avg=Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length);
    var min=Math.min.apply(null,vals);
    /* fairness = high average BUT penalise leaving anyone miserable; the min
       term is what stops "great for 4, awful for 1" winning. */
    var fairness=Math.round(avg*0.6 + min*0.4);
    return {entry:entry, per:per, avg:avg, min:min, fairness:fairness, tags:tags};
  });
  scored.sort(function(a,b){ return b.fairness-a.fairness; });
  return scored.slice(0,5);
}
function openGroupPlanner(){
  try{ badgeBump('group'); }catch(e){}
  var ov=el('grpOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='grpOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83e\udd1d Group Compromise</b><button class="x" onclick="rwOverlayClose(\'grpOverlay\')">\u2715</button></div>'
      +'<div id="grpBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  grpRender();
  rwOverlayOpen('grpOverlay');
}
function grpRender(){
  var body=el('grpBody'); if(!body) return;
  var m=grpMembers();
  var chips=RW_INTERESTS.map(function(x){return x;});
  var memHTML = m.map(function(mem,i){
    return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:10px 12px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center">'
      +'<b style="font-size:13px">'+(String(mem.name||'Traveller '+(i+1)).replace(/[<>]/g,''))+'</b>'
      +'<button class="tact" style="font-size:11px;padding:4px 8px" onclick="grpRemove('+i+')">\u2715</button></div>'
      +'<div style="font-size:11px;color:var(--t3);margin-top:3px">'
      +(mem.interests&&mem.interests.length? mem.interests.join(', '):'no interests set')
      +(mem.budget? ' \u00b7 \u20b9'+mem.budget+'/day':'')
      +(mem.diet&&mem.diet!=='none'? ' \u00b7 '+mem.diet:'')+'</div></div>';
  }).join('');
  body.innerHTML =
    '<p style="font-size:12px;color:var(--t2);line-height:1.6;margin:2px 2px 12px">Add everyone travelling. The engine finds destinations that keep the <b>whole group</b> happy \u2014 and shows each person\u2019s score so the pick is provably fair.</p>'
    + memHTML
    + '<div style="background:var(--bg3,#1A1A20);border:1px dashed var(--b2,#2A2A36);border-radius:12px;padding:12px;margin-bottom:10px">'
    + '<input id="grpName" class="k-inp" placeholder="Name" style="width:100%;margin-bottom:8px">'
    + '<div style="font-size:11px;color:var(--t3);margin-bottom:5px">Interests (tap):</div>'
    + '<div id="grpInterests" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">'
    + chips.map(function(c){ return '<button class="tact grp-int" data-i="'+c+'" style="font-size:11px;padding:5px 10px" onclick="this.classList.toggle(\'on\');this.style.background=this.classList.contains(\'on\')?\'var(--gold,#E8BA6C)\':\'\';this.style.color=this.classList.contains(\'on\')?\'#0A0A0C\':\'\'">'+c+'</button>'; }).join('')
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:8px">'
    + '<input id="grpBudget" class="k-inp" type="number" placeholder="\u20b9/day" style="flex:1">'
    + '<select id="grpDiet" class="k-inp" style="flex:1"><option value="none">No diet limit</option><option value="veg">Vegetarian</option><option value="vegan">Vegan</option><option value="halal">Halal</option></select>'
    + '</div>'
    + '<button class="g-btn" style="width:100%;min-height:40px" onclick="grpAdd()">+ Add traveller</button></div>'
    + (m.length>=2 ? '<button class="g-btn" style="width:100%;min-height:46px;font-size:15px;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E))" onclick="grpResults()">\ud83c\udfaf Find our compromise</button>'
                   : '<div style="text-align:center;font-size:11px;color:var(--t3);padding:6px">Add at least 2 travellers</div>')
    + '<div id="grpOut" style="margin-top:12px"></div>';
}
function grpAdd(){
  var name=(el('grpName').value||'').trim();
  var interests=[].slice.call(document.querySelectorAll('.grp-int.on')).map(function(b){return b.dataset.i;});
  var budget=parseInt(el('grpBudget').value,10)||0;
  var diet=el('grpDiet').value;
  if(!name && !interests.length){ showToast('Add a name or pick interests'); return; }
  var m=grpMembers(); m.push({name:name, interests:interests, budget:budget, diet:diet});
  grpSave(m); grpRender();
}
function grpRemove(i){ var m=grpMembers(); m.splice(i,1); grpSave(m); grpRender(); }
function grpResults(){
  var m=grpMembers(); var out=el('grpOut');
  var res=grpCompromise(m);
  if(!res.length){ out.innerHTML='<div class="mode-box">No destinations to score yet.</div>'; return; }
  out.innerHTML = '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:8px">Best for everyone</div>'
    + res.map(function(r,idx){
        var bar = r.per.map(function(p){
          var col = p.score>=70?'#4ADE80':p.score>=45?'#E8BA6C':'#E05B5B';
          return '<div style="flex:1;text-align:center"><div style="font-size:9px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+String(p.name).replace(/[<>]/g,'')+'</div>'
            +'<div style="height:5px;background:var(--b2,#2A2A36);border-radius:3px;margin-top:2px;overflow:hidden"><div style="width:'+p.score+'%;height:100%;background:'+col+'"></div></div>'
            +'<div style="font-size:10px;color:'+col+';margin-top:1px">'+p.score+'</div></div>';
        }).join('');
        return '<div style="background:var(--bg2,#12121C);border:1px solid '+(idx===0?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';border-radius:14px;padding:12px 14px;margin-bottom:10px">'
          +'<div style="display:flex;justify-content:space-between;align-items:center">'
          +'<div><b style="font-size:15px">'+(idx===0?'\ud83c\udfc6 ':'')+r.entry.name+'</b> <span style="font-size:11px;color:var(--t3)">'+r.entry.country+'</span></div>'
          +'<div style="text-align:right"><div style="font-size:20px;font-weight:800;color:var(--gold,#E8BA6C)">'+r.fairness+'</div><div style="font-size:9px;color:var(--t3)">fairness</div></div></div>'
          +'<div style="display:flex;gap:6px;margin-top:10px">'+bar+'</div>'
          +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Avg '+r.avg+' \u00b7 nobody below '+r.min+' \u00b7 '+r.tags.slice(0,4).join(', ')+'</div>'
          +'<button class="tact" style="font-size:11.5px;padding:6px 11px;margin-top:8px;font-weight:800" onclick="rwOverlayClose(\'grpOverlay\');cpGoPlan(\''+r.entry.name.replace(/'/g,'')+'\')">Plan '+r.entry.name+' \u2192</button>'
          +'</div>';
      }).join('');
}
