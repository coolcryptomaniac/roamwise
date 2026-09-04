// @ts-nocheck
// Moved verbatim from app.js (Phase 7a) — Place Disambiguation: turns
// GeoNames feature_code hints into a "which one did you mean?" prompt
// instead of silently sending the traveller to the wrong namesake.
// Called from js/copilot/rich-reply.js.
/* ==================== PLACE DISAMBIGUATION ====================
   Guessing wrong is worse than asking. The geocoder returns GeoNames
   `feature_code`, which tells us exactly WHAT each candidate is — a village, a
   district capital, a state, a mountain — so the traveller can pick the right
   one instead of being silently sent to a namesake.

   Real failures this prevents, all reproduced against the live API:
     "Almora"  -> Almorox, SPAIN ranked above Almora, Uttarakhand
     "Manali"  -> Manali, Tamil Nadu (pop 35k) above Manali, Himachal (pop 8k)
     "Kerala"  -> five Finnish villages called Ker\u00e4l\u00e4
     "Goa"     -> Genoa, Italy on a fuzzy match
   Population ranking is exactly wrong for travel: the famous Manali is the
   small one. So when candidates are genuinely close, we ask. */
var RW_FC = {
  PCLI:['\ud83c\udf0d','Country'], PCLD:['\ud83c\udf0d','Territory'], PCLS:['\ud83c\udf0d','Country'],
  ADM1:['\ud83d\uddfa\ufe0f','State / province'], ADM2:['\ud83d\uddfa\ufe0f','District'],
  ADM3:['\ud83d\uddfa\ufe0f','Sub-district'], ADM4:['\ud83d\uddfa\ufe0f','Local area'],
  PPLC:['\ud83c\udfdb\ufe0f','Capital city'], PPLA:['\ud83c\udfd9\ufe0f','State capital'],
  PPLA2:['\ud83c\udfd9\ufe0f','District town'], PPLA3:['\ud83c\udfd8\ufe0f','Town'], PPLA4:['\ud83c\udfd8\ufe0f','Town'],
  PPL:['\ud83c\udfd8\ufe0f','Town / village'], PPLL:['\ud83c\udfe1','Village'], PPLX:['\ud83c\udfd8\ufe0f','Neighbourhood'],
  PPLF:['\ud83c\udf3e','Farm village'], PPLS:['\ud83c\udfd8\ufe0f','Settlements'], PPLW:['\ud83c\udfda\ufe0f','Former village'],
  MT:['\u26f0\ufe0f','Mountain'], PK:['\u26f0\ufe0f','Peak'], MTS:['\u26f0\ufe0f','Mountain range'],
  LK:['\ud83c\udf0a','Lake'], STM:['\ud83c\udf0a','River'], FLLS:['\ud83d\udca7','Waterfall'],
  BCH:['\ud83c\udfd6\ufe0f','Beach'], ISL:['\ud83c\udfdd\ufe0f','Island'], VAL:['\ud83c\udfde\ufe0f','Valley'],
  PASS:['\u26f0\ufe0f','Mountain pass'], PRK:['\ud83c\udf33','Park / reserve'],
  RLG:['\ud83d\uded5','Temple / shrine'], HSTS:['\ud83c\udfdb\ufe0f','Historic site'],
  AIRP:['\u2708\ufe0f','Airport'], RSTN:['\ud83d\ude82','Railway station']
};
function rwPlaceType(fc){
  var t = RW_FC[String(fc||'').toUpperCase()];
  if(t) return {icon:t[0], label:t[1]};
  var f = String(fc||'').toUpperCase();
  if(f.indexOf('PPL')===0) return {icon:'\ud83c\udfd8\ufe0f', label:'Town / village'};
  if(f.indexOf('ADM')===0) return {icon:'\ud83d\uddfa\ufe0f', label:'Administrative area'};
  return {icon:'\ud83d\udccd', label:'Place'};
}
/* fetch every plausible candidate, typed and de-duplicated */
async function rwCandidates(q){
  if(!navigator.onLine) return [];
  try{
    var r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)
      +'&count=10&language=en&format=json').then(function(x){ return x.json(); });
    var list = r.results||[];
    var ql = String(q).toLowerCase().trim();
    /* keep only candidates whose name genuinely resembles the query \u2014 stops
       "Goa" surfacing Genoa, and "Almora" surfacing Almorox */
    var close = list.filter(function(x){
      var n=String(x.name||'').toLowerCase();
      return n===ql || n.indexOf(ql)===0 || ql.indexOf(n)===0;
    });
    if(!close.length) close = list.slice(0,4);
    var seen={}, out=[];
    close.forEach(function(x){
      var key=[x.name,x.country,x.admin1].join('|').toLowerCase();
      if(seen[key]) return; seen[key]=1;
      var ty=rwPlaceType(x.feature_code);
      out.push({name:x.name, country:x.country||'', cc:x.country_code||'',
                admin:[x.admin1,x.admin2].filter(Boolean).slice(0,1).join(', '),
                lat:x.latitude, lon:x.longitude, pop:x.population||null,
                icon:ty.icon, type:ty.label, fc:x.feature_code||''});
    });
    return out.slice(0,6);
  }catch(e){ return []; }
}
/* Is this genuinely ambiguous, or obvious? */
function rwIsAmbiguous(cands, homeCC){
  if(!cands || cands.length<2) return false;
  var countries={}, admins={};
  cands.forEach(function(c){ countries[c.cc]=1; admins[(c.cc||'')+'|'+(c.admin||'')]=1; });
  var multiCountry = Object.keys(countries).length>1;
  var multiAdmin   = Object.keys(admins).length>1;
  if(!multiCountry && !multiAdmin) return false;

  /* A world-famous place is not ambiguous just because a hamlet shares its
     name. Tokyo was being flagged because five tiny namesakes exist. Two
     escape hatches, both evidence-based rather than a hardcoded list: */
  var sorted = cands.slice().sort(function(a,b){ return (b.pop||0)-(a.pop||0); });
  var top = sorted[0], second = sorted[1];

  /* 1. Population dominance — top is an order of magnitude bigger than the
        next. Note this is checked GLOBALLY, not only for the home country,
        which is the bug that made Tokyo look ambiguous. */
  if((top.pop||0) >= 250000 && (top.pop||0) > ((second&&second.pop)||0)*10) return false;

  /* 2. Rank dominance — top is a national or state capital while the rest are
        villages. "Which Paris?" is not a question worth asking. */
  var topFC = String(top.fc||'').toUpperCase();
  if((topFC==='PPLC' || topFC==='PPLA') && (top.pop||0) > 100000){
    var rivals = sorted.slice(1).filter(function(c){ return (c.pop||0) > 50000; });
    if(!rivals.length) return false;
  }

  /* one candidate overwhelmingly dominant in the home country = not ambiguous */
  var home = cands.filter(function(c){ return c.cc===homeCC; });
  if(home.length===1){
    var others = cands.filter(function(c){ return c.cc!==homeCC; });
    var biggestOther = Math.max.apply(null, others.map(function(c){ return c.pop||0; }).concat([0]));
    if((home[0].pop||0) > biggestOther*5) return false;
  }
  return true;
}
function rwDisambigHTML(query, cands){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A8A,#0A0A0C)">'
    +'<div class="tk-place">Which '+esc2(query)+'?</div>'
    +'<div class="tk-meta">'+cands.length+' places share that name \u2014 pick one and I\u2019ll get it right</div></div>'
    +'<div class="tk-sec">'
    + cands.map(function(c){
        var where=[c.admin, c.country].filter(Boolean).join(', ');
        var pop = c.pop ? Number(c.pop).toLocaleString('en-IN')+' people' : 'small settlement';
        return '<button onclick="cpFollow(\''+String(c.name+', '+(c.admin||c.country)).replace(/'/g,"\\'")+'\')" '
          +'style="display:flex;width:100%;text-align:left;gap:11px;align-items:center;background:transparent;border:none;'
          +'border-bottom:1px solid rgba(255,255,255,.06);padding:11px 2px;cursor:pointer;color:inherit;font:inherit">'
          +'<span style="font-size:20px">'+c.icon+'</span>'
          +'<span style="flex:1"><b style="font-size:13.5px;display:block">'+esc2(c.name)+'</b>'
          +'<span style="font-size:11px;color:var(--t3)">'+esc2(c.type)+' \u00b7 '+esc2(where)+' \u00b7 '+pop+'</span></span>'
          +'<span style="color:var(--gold,#E8BA6C);font-size:15px">\u203a</span></button>';
      }).join('')
    +'</div>'
    +'<div class="tk-sec"><div style="font-size:11.5px;color:var(--t2);line-height:1.6">'
    +'None of these? Type the place with its state or country \u2014 e.g. \u201c'+esc2(query)+', Himachal Pradesh\u201d.</div>'
    +'</div></div>';
}
