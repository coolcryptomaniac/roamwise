// @ts-nocheck
/* ==================== COPILOT: TUSK KNOWLEDGE + LEARNING LAYER ====================
   Extracted verbatim from app.js (Phase 4b modularization).
   Wikivoyage (CC BY-SA, keyless, open CORS) is the built-in engine's real
   knowledge source: wvGuide/wvSection fetch and cache a place's guide text,
   wvPickSections/wvAnswer turn a question into the right excerpt. The
   "learning layer" (rwLearn/rwTopInterests) is a modest, honest local
   counter of which places the traveller actually engages with — no model
   training happens in a phone browser. ==== */

/* ==================== AILON TUSK — the built-in engine's knowledge layer ====
   "Crawl Google in the background" cannot be done from a static app: Google
   blocks cross-origin browser calls and its terms forbid scraping, and the
   official Search API bills per query. Wikivoyage is the honest substitute —
   a real, community-written travel guide for tens of thousands of places, with
   open CORS, no API key, no cost, and a licence that permits reuse with
   attribution (CC BY-SA). It answers the exact questions people ask: how to
   get in, what to see, what to eat, where to sleep, what to watch out for.

   The "learning" is real but modest and honestly named: every guide fetched is
   cached on the device, and every place the traveller actually engages with is
   counted, so answers get faster and ordering gets more personal the more the
   app is used. No model weights are trained in a phone browser. */
var WV_CACHE_DAYS = 30;
var WV_SECTION_MAP = [
  [/eat|food|restaurant|cuisine|dish|cafe|drink/i,            ['Eat','Drink']],
  [/reach|get in|getting there|how to go|travel to|flight|train|bus|airport/i, ['Get in']],
  [/get around|around|local transport|taxi|metro|rickshaw/i,  ['Get around']],
  [/see|attraction|sight|monument|temple|museum|viewpoint/i,  ['See']],
  [/do|activity|trek|adventure|experience|hike|raft|ski/i,    ['Do']],
  [/stay|hotel|hostel|sleep|accommodation|homestay|camp/i,    ['Sleep']],
  [/safe|danger|scam|theft|security|health|altitude/i,        ['Stay safe','Stay healthy']],
  [/buy|shop|market|souvenir|bazaar/i,                        ['Buy']],
  [/weather|climate|season|best time|month/i,                 ['Weather','Climate','Understand']],
  [/history|about|understand|culture|language/i,              ['Understand']]
];
function wvSlug(p){ return String(p).toLowerCase().replace(/[^a-z0-9]/g,''); }
async function wvGuide(place){
  var key='rw_wv_'+wvSlug(place);
  try{
    var c=JSON.parse(lsGet(key)||'null');
    if(c && (Date.now()-c.at) < WV_CACHE_DAYS*864e5) return c;
  }catch(e){}
  if(!navigator.onLine) return null;
  try{
    var api='https://en.wikivoyage.org/w/api.php?origin=*&format=json&';
    var q = await fetch(api+'action=query&list=search&srlimit=1&srsearch='+encodeURIComponent(place)).then(function(r){return r.json();});
    var hit=((q.query||{}).search||[])[0]; if(!hit) return null;
    var title=hit.title;
    var ex = await fetch(api+'action=query&prop=extracts&exintro=1&explaintext=1&titles='+encodeURIComponent(title)).then(function(r){return r.json();});
    var pg=Object.values((ex.query||{}).pages||{})[0]||{};
    var se = await fetch(api+'action=parse&prop=sections&page='+encodeURIComponent(title)).then(function(r){return r.json();});
    var sections=((se.parse||{}).sections||[]).map(function(x){ return {line:x.line, index:x.index}; });
    var rec={title:title, extract:(pg.extract||'').trim(), sections:sections, at:Date.now()};
    lsSet(key, JSON.stringify(rec));
    return rec;
  }catch(e){ return null; }
}
async function wvSection(title, index){
  var key='rw_wvs_'+wvSlug(title)+'_'+index;
  var c=lsGet(key); if(c) return c;
  if(!navigator.onLine) return null;
  try{
    var d = await fetch('https://en.wikivoyage.org/w/api.php?origin=*&format=json&action=parse&prop=wikitext&section='
      +index+'&page='+encodeURIComponent(title)).then(function(r){return r.json();});
    var wt=(((d.parse||{}).wikitext||{})['*']||'');
    /* wikitext -> readable: drop templates, listings, markup, refs */
    var txt = wt
      .replace(/={2,}[^=\n]+={2,}/g,' ')   /* section headers like ==Get in== */
      .replace(/\{\{[^{}]*\}\}/g,' ')
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g,' ')
      .replace(/<[^>]+>/g,' ')
      .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g,'$2')
      .replace(/'''?/g,'')
      .replace(/^[=*#:;]+/gm,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
    if(txt.length>20){ lsSet(key, txt.slice(0,1200)); return txt.slice(0,1200); }
    return null;
  }catch(e){ return null; }
}
function wvPickSections(question, sections){
  var want=[];
  WV_SECTION_MAP.forEach(function(m){ if(m[0].test(question)) want=want.concat(m[1]); });
  if(!want.length) want=['Understand','See','Do'];
  var out=[];
  want.forEach(function(name){
    var hit=sections.filter(function(s){ return s.line.toLowerCase()===name.toLowerCase(); })[0];
    if(hit && out.length<2) out.push(hit);
  });
  return out;
}
async function wvAnswer(place, question){
  var g = await wvGuide(place);
  if(!g) return null;
  rwLearn(place);
  var parts=[];
  if(g.extract) parts.push('<div style="font-size:12.5px;line-height:1.6">'+esc2(g.extract.slice(0,340))+(g.extract.length>340?'\u2026':'')+'</div>');
  var picks = wvPickSections(question||'', g.sections||[]);
  for(var i=0;i<picks.length;i++){
    var body = await wvSection(g.title, picks[i].index);
    if(body && body.length>40){
      parts.push('<div style="margin-top:8px"><div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E)">'
        +esc2(picks[i].line)+'</div><div style="font-size:12px;line-height:1.6;color:var(--t2)">'+esc2(body.slice(0,420))+'\u2026</div></div>');
    }
  }
  if(!parts.length) return null;
  parts.push('<div style="font-size:10px;color:var(--t3);margin-top:8px">Source: <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://en.wikivoyage.org/wiki/'
    +encodeURIComponent(g.title)+'">Wikivoyage \u2014 '+esc2(g.title)+'</a> \u00b7 CC BY-SA \u00b7 cached on your device</div>');
  return parts.join('');
}

/* ---- the learning layer: local, honest, and actually useful ---- */
function rwLearn(place){
  try{
    var m=JSON.parse(lsGet('rw_learn')||'{}');
    var k=wvSlug(place); m[k]=(m[k]||0)+1;
    lsSet('rw_learn', JSON.stringify(m));
  }catch(e){}
}
function rwTopInterests(n){
  try{
    var m=JSON.parse(lsGet('rw_learn')||'{}');
    return Object.keys(m).sort(function(a,b){ return m[b]-m[a]; }).slice(0, n||5);
  }catch(e){ return []; }
}
