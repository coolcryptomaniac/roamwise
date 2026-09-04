// @ts-nocheck
/* local-ecosystem.js — Local Ecosystem: a short, curated list of the people who
   make a destination itself — homestays, working artists, musicians, writers and
   research stations (RW_ECOSYSTEM, rwEcosystemHTML). Split out of
   js/misc/misc-features-3.js (an 8-feature grab-bag left over from Phase 6a
   modularization) as an SRP cleanup; verbatim move, zero logic changes. */

/* ==================== LOCAL ECOSYSTEM ====================
   Naming the people who make a place itself: homestays over chains, working
   artists, musicians, writers, and the research stations that quietly sit in
   these landscapes. Curated and small on purpose \u2014 a short honest list beats a
   long invented one, and every entry here is a documented, checkable thing. */
var RW_ECOSYSTEM = {
  'almora':   [['\ud83c\udfe1','Kumaoni homestays','Family-run houses around Binsar and Kasar Devi \u2014 book direct, not through an aggregator'],
               ['\u270d\ufe0f','Writers\u2019 hill','Kasar Devi drew Uttarakhand\u2019s writer-and-seeker crowd for decades'],
               ['\ud83c\udfb5','Kumaoni folk','Hurka and Jhoda traditions still performed at village festivals']],
  'varanasi': [['\ud83c\udfb6','Benares gharana','One of Hindustani music\u2019s major lineages \u2014 evening riverside recitals'],
               ['\ud83e\uddf5','Weavers','Banarasi handloom families in Madanpura; buy from the weaver, not the showroom']],
  'jaipur':   [['\ud83c\udfa8','Blue pottery','A Jaipur craft kept alive by a handful of workshops'],
               ['\ud83d\udcda','Literature','The city\u2019s literature festival is India\u2019s largest free one']],
  'rishikesh':[['\ud83e\uddd8','Teachers','Long-standing yoga schools \u2014 look for Yoga Alliance registration, not Instagram following'],
               ['\ud83c\udfe1','Ashram stays','Simple rooms at working ashrams cost a fraction of the riverside hotels']],
  'goa':      [['\ud83c\udfb7','Goan jazz','Live jazz and Konkani music in Panjim\u2019s Latin Quarter'],
               ['\ud83c\udfe1','Portuguese-era homestays','Restored family houses inland \u2014 cheaper and quieter than the beach strip'],
               ['\ud83d\udd2c','Marine research','The National Institute of Oceanography is headquartered in Dona Paula']],
  'leh':      [['\ud83d\udd2d','Astronomy','The Indian Astronomical Observatory at Hanle \u2014 one of the world\u2019s highest, now a Dark Sky Reserve'],
               ['\ud83c\udfe1','Village homestays','The Sham and Markha valley networks pay families directly']],
  'kochi':    [['\ud83c\udfa8','Kochi-Muziris Biennale','South Asia\u2019s largest contemporary art event, in warehouse spaces'],
               ['\ud83c\udfad','Kathakali','Nightly performances \u2014 arrive an hour early to watch the makeup being applied']],
  'darjeeling':[['\ud83c\udf75','Tea gardens','Estate walks and tastings direct with growers'],
               ['\ud83d\ude82','Himalayan Railway','A working UNESCO World Heritage steam line, not a museum']]
};
function rwEcosystemHTML(place){
  var k=String(place||'').toLowerCase().trim(), list=RW_ECOSYSTEM[k];
  if(!list) return '';
  return '<div style="background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.25);border-radius:12px;padding:11px 13px">'
    +'<div style="font-weight:800;font-size:12.5px">\u2728 The people who make this place</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:6px">Spend here and the money stays here</div>'
    + list.map(function(e){
        return '<div style="display:flex;gap:9px;padding:5px 0"><span style="font-size:15px">'+e[0]+'</span>'
          +'<div><b style="font-size:12px">'+esc2(e[1])+'</b>'
          +'<div style="font-size:11.5px;color:var(--t2);line-height:1.5">'+esc2(e[2])+'</div></div></div>';
      }).join('')
    +'</div>';
}
