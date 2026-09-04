// @ts-nocheck
/* ============================================================================
   TRAVEL COMPATIBILITY ENGINE (rw-v92)
   ============================================================================
   Matches travellers on the six behaviours groups actually argue about, not on
   age. Every score comes with its reason, so a traveller can disagree with it.
   ========================================================================= */
function rwCompatPair(a, b){
  var AX=window.RW_AXES||[];
  var tot=0, wsum=0, worst=null, best=null;
  AX.forEach(function(x){
    var av=+a[x.k]||3, bv=+b[x.k]||3;
    var gap=Math.abs(av-bv);                 /* 0..4 */
    var fit=1-(gap/4);                       /* 1 = identical */
    tot += fit*x.weight; wsum += x.weight;
    var rec={ k:x.k, label:x.label, gap:gap, fit:fit, ax:x, av:av, bv:bv };
    if(!worst || gap*x.weight > worst.gap*worst.ax.weight) worst=rec;
    if(!best  || fit > best.fit) best=rec;
  });
  var pct=Math.round((tot/wsum)*100);
  return {
    pct: pct,
    verdict: pct>=85?'Rare fit' : pct>=72?'Good fit' : pct>=58?'Workable' : pct>=45?'Expect friction' : 'Probably not',
    best: best, worst: worst,
    why: pct>=72
      ? 'You line up on '+best.label.toLowerCase()+', which is most of the battle.'
      : worst.ax.friction
  };
}
/* Group chemistry — not just an average of pairs. */
function rwCompatGroup(people){
  var AX=window.RW_AXES||[];
  if(!people || people.length<2) return null;
  var pairs=[], sum=0;
  for(var i=0;i<people.length;i++)
    for(var j=i+1;j<people.length;j++){
      var r=rwCompatPair(people[i],people[j]);
      pairs.push({i:i,j:j,r:r}); sum+=r.pct;
    }
  var avg=Math.round(sum/pairs.length);
  var flags=[];
  AX.forEach(function(x){
    if(x.weight<1.2) return;
    var vals=people.map(function(p){ return +p[x.k]||3; });
    var mean=vals.reduce(function(a,b){return a+b;},0)/vals.length;
    vals.forEach(function(v,idx){
      if(Math.abs(v-mean)>=1.8)
        flags.push({ type:'outlier', who:idx, axis:x.label,
          say:(people[idx].name||'One traveller')+' is well outside the group on '+x.label.toLowerCase()+'. '+x.friction });
    });
    var lo=vals.filter(function(v){ return v<=mean; }).length;
    if(lo>1 && lo<vals.length-1){
      var spread=Math.max.apply(null,vals)-Math.min.apply(null,vals);
      if(spread>=3) flags.push({ type:'split', axis:x.label,
        say:'On '+x.label.toLowerCase()+' this is really two groups. Plan to split some days rather than pretending otherwise.' });
    }
  });
  var weakest=pairs.slice().sort(function(a,b){ return a.r.pct-b.r.pct; })[0];
  return { avg:avg, pairs:pairs, flags:flags, weakest:weakest,
    verdict: avg>=80?'This group will barely have to negotiate'
           : avg>=65?'Solid group \u2014 a couple of things to agree up front'
           : avg>=50?'Workable, but set the rules before you go'
           : 'This group will struggle unless you plan around the gaps' };
}
/* the quiz */
function openCompat(){
  rwPageOpen('compat', function(body){
    var AX=window.RW_AXES||[];
    var mine=rwCompatMine();
    body.innerHTML='<div class="cp-hero">'
      +'<div class="cp-ic">\u2699\ufe0f</div>'
      +'<h2 class="cp-h">Who you travel well with<br>has nothing to do with your age.</h2>'
      +'<p class="cp-sub">Every group-travel platform matches on age. We match on the six things groups actually argue about \u2014 when you get up, how fast you move, what you\u2019ll spend, and three more. Six questions, about a minute.</p>'
      +'</div>'
      + AX.map(function(x,i){
          var v=mine[x.k]||3;
          return '<div class="cp-q">'
            +'<div class="cp-l"><b>'+esc2(x.label)+'</b><span>'+esc2(x.ends[0])+' \u2192 '+esc2(x.ends[1])+'</span></div>'
            +'<input type="range" min="1" max="5" value="'+v+'" id="cq_'+x.k+'" oninput="rwCompatEcho(\''+x.k+'\')" class="cp-r">'
            +'<div class="cp-v" id="cv_'+x.k+'">'+esc2(x.scale[v-1])+'</div>'
            +'</div>';
        }).join('')
      +'<button class="bk-go" style="margin-top:14px" onclick="rwCompatSave()">Save my travel style</button>'
      +'<div id="cpOut" style="margin-top:18px"></div>'
      +'<div class="gr-foot">We show you the reason behind every match, so you can disagree with it. A number you can\u2019t argue with is worth nothing.</div>';
    rwCompatShow();
  });
}
function rwCompatEcho(k){
  var x=(window.RW_AXES||[]).filter(function(a){ return a.k===k; })[0];
  var v=+((el('cq_'+k)||{}).value||3);
  var n=el('cv_'+k); if(n && x) n.textContent=x.scale[v-1];
}
function rwCompatMine(){
  try{ return JSON.parse(lsGet('rw_compat')||'{}'); }catch(e){ return {}; }
}
function rwCompatSave(){
  var m={};
  (window.RW_AXES||[]).forEach(function(x){ m[x.k]=+((el('cq_'+x.k)||{}).value||3); });
  try{ lsSet('rw_compat', JSON.stringify(m)); }catch(e){}
  try{
    if(window.db && window.user) db.collection('users').doc(user.uid).set({compat:m},{merge:true});
  }catch(e){}
  showToast('\u2705 Saved \u2014 this is how we\u2019ll match you');
  rwCompatShow();
}
function rwCompatShow(){
  var host=el('cpOut'); if(!host) return;
  var mine=rwCompatMine();
  if(!Object.keys(mine).length){ host.innerHTML=''; return; }
  /* three illustrative travellers so the engine is understandable before
     there is a real pool. Labelled clearly as examples, never as real people. */
  var samples=[
    { name:'The sunrise trekker', clock:1,pace:2,spend:2,plan:2,social:3,comfort:2 },
    { name:'The slow cafe type',  clock:4,pace:5,spend:3,plan:4,social:3,comfort:3 },
    { name:'The comfort planner', clock:3,pace:3,spend:5,plan:1,social:2,comfort:5 }
  ];
  host.innerHTML='<div class="dk-lab" style="color:var(--t3)">HOW YOU\u2019D MATCH</div>'
    + samples.map(function(sp){
        var r=rwCompatPair(mine, sp);
        var col = r.pct>=72?'#4ADE80' : r.pct>=58?'#E8BA6C' : '#E0785B';
        return '<div class="cp-m">'
          +'<div class="cp-mt"><b>'+esc2(sp.name)+'</b>'
          +'<span style="color:'+col+'">'+r.pct+'% \u00b7 '+esc2(r.verdict)+'</span></div>'
          +'<div class="cp-bar"><i style="width:'+r.pct+'%;background:'+col+'"></i></div>'
          +'<div class="cp-why">'+esc2(r.why)+'</div></div>';
      }).join('')
    +'<div class="dk-note" style="color:var(--t3);font-size:11px;margin-top:8px">These three are illustrative travel styles, not real people \u2014 shown so you can see how the engine reasons before there\u2019s a pool to match against.</div>';
}
