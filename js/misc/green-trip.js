// @ts-nocheck
/* ---------------- ROAMWISE GREEN ---------------- */
function openGreen(){
  rwPageOpen('green', function(body){
    var P=window.RW_GREEN_PILLARS||[];
    body.innerHTML=
       '<div class="gr-hero">'
      +'<div class="gr-badge">\u26a1 RoamWise Green</div>'
      +'<h2 class="gr-h">Travel that leaves the place<br>better than a normal trip would.</h2>'
      +'<p class="gr-sub">A premium tier where every part of the trip qualifies \u2014 electric mobility, genuinely solar stays, vegan or honest local food, and nature-first activities. Not a label we print. A checklist we verify.</p>'
      +'</div>'
      + P.map(function(x){
          return '<div class="gr-card">'
            +'<div class="gr-t"><span class="gr-ic">'+x.icon+'</span><b>'+esc2(x.title)+'</b></div>'
            +'<ul class="gr-ul">'+x.items.map(function(i){ return '<li>'+esc2(i)+'</li>'; }).join('')+'</ul>'
            +'<div class="gr-honest"><b>Straight talk:</b> '+esc2(x.honest)+'</div>'
            +'</div>';
        }).join('')
      +'<div class="gr-cta">'
      +'<b>Want a Green trip planned?</b>'
      +'<p class="note" style="margin:6px 0 12px">Tell us where and when. We build it entirely from verified electric and eco options, and tell you honestly where the network makes it hard.</p>'
      +'<button class="bk-go" onclick="rwGreenPlan()">\ud83c\udf3f Plan my Green trip</button>'
      +'</div>'
      +'<div class="gr-foot">We will always tell you when the greener option is worse \u2014 slower, pricier, or not actually available on your route. A tier you cannot trust is just marketing.</div>';
  });
}
function rwGreenPlan(){
  rwPageClose();
  var inp=el('heroInput')||el('cpInput');
  if(inp){
    inp.value='Plan me a RoamWise Green trip: electric mobility throughout (EV car or bike, charging stops planned), a solar-powered eco stay, vegan or honest local food, and nature-first activities. Tell me honestly where the EV charging network makes this hard.';
    try{ copilotSend(!!el('heroInput')); }catch(e){ /* best-effort, ignore */ }
  }
}
