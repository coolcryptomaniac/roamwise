// @ts-nocheck
/* sound-of-place.js — Sound of Place: maps destinations to their actual regional
   music traditions and living artists, with a Tusk-narrated audio intro via the
   device's own TTS (RW_SOUND, rwSoundFor, rwSoundHTML). Deliberately links out to
   Spotify/JioSaavn rather than hosting audio. Split out of
   js/misc/misc-features-3.js (an 8-feature grab-bag left over from Phase 6a
   modularization) as an SRP cleanup; verbatim move, zero logic changes. */

/* ==================== SOUND OF PLACE ====================
   The genuinely defensible half of the "media layer" idea: no travel planner
   ships localised sound. This maps destinations to their actual regional music
   traditions and living artists, with a Tusk-narrated audio intro using the
   device's own TTS (free, offline-capable, no licensing exposure).

   DELIBERATELY NOT: hosting or streaming copyrighted tracks. We link out to
   Spotify/JioSaavn/YouTube searches so playback happens on a licensed platform
   where the artist gets paid. Hosting audio ourselves would be infringement,
   and "curating a playlist" that streams from our servers is the same thing
   with a nicer name. */
var RW_SOUND = {
  goa:        {genre:'Konkani & Goan trance', why:'Portuguese-era mando meets the 90s Goa trance the state exported worldwide.',
               artists:['Remo Fernandes','Lorna Cordeiro','Goa Trance classics'], mood:'sunset beach'},
  rajasthan:  {genre:'Manganiyar & Langa folk', why:'Hereditary desert musician communities \u2014 khartal, kamaicha, voices built for open sky.',
               artists:['Mame Khan','Manganiyar Seduction','Anwar Khan Manganiyar'], mood:'desert night'},
  jaipur:     {genre:'Rajasthani folk', why:'Ghoomar rhythms and courtly compositions from the old city.',
               artists:['Mame Khan','Rajasthani folk ensembles'], mood:'fort courtyard'},
  jaisalmer:  {genre:'Manganiyar desert folk', why:'The purest form of it \u2014 sung in dunes it was written for.',
               artists:['Manganiyar','Anwar Khan'], mood:'dune sunset'},
  varanasi:   {genre:'Benares gharana \u00b7 Hindustani classical', why:'One of the great lineages of Indian classical music, still performed at the ghats.',
               artists:['Ravi Shankar','Girija Devi','Bismillah Khan'], mood:'dawn on the river'},
  kolkata:    {genre:'Rabindra Sangeet & Bengali folk', why:'Tagore wrote over 2,000 songs. The city still sings them.',
               artists:['Rabindra Sangeet','Baul folk','Kishore Kumar'], mood:'monsoon afternoon'},
  kerala:     {genre:'Sopana & Carnatic', why:'Temple-step singing and the percussion of chenda melam.',
               artists:['Sopana Sangeetham','Carnatic vocal'], mood:'backwater morning'},
  chennai:    {genre:'Carnatic classical', why:'The December music season is one of the largest classical festivals on earth.',
               artists:['M.S. Subbulakshmi','Carnatic vocal'], mood:'margazhi morning'},
  punjab:     {genre:'Punjabi folk & bhangra', why:'Dhol, tumbi, and a rhythm built for harvest.',
               artists:['Gurdas Maan','Punjabi folk'], mood:'harvest evening'},
  amritsar:   {genre:'Gurbani kirtan & Punjabi folk', why:'Continuous kirtan at the Golden Temple, and the folk outside it.',
               artists:['Gurbani kirtan','Punjabi folk'], mood:'temple dawn'},
  almora:     {genre:'Kumaoni folk', why:'Jhoda, chhapeli and hurka rhythms \u2014 hill music built around a single drum.',
               artists:['Kumaoni folk','Gopal Babu Goswami'], mood:'pine ridge morning'},
  manali:     {genre:'Himachali & Nati folk', why:'Nati, the circle dance, holds a Guinness record for the largest folk dance performed.',
               artists:['Himachali Nati','Pahari folk'], mood:'valley evening'},
  darjeeling: {genre:'Nepali & Gorkha folk', why:'Madal-driven hill songs, and a strong Nepali indie scene.',
               artists:['Nepali folk','Bipul Chettri'], mood:'misty morning'},
  shillong:   {genre:'Khasi folk & rock', why:'India\u2019s rock capital \u2014 an unusual overlap of Khasi tradition and guitar culture.',
               artists:['Soulmate','Khasi folk','Lou Majaw'], mood:'rainy evening'},
  mumbai:     {genre:'Bollywood & Marathi lavani', why:'The industry that soundtracks the country, and the folk form it keeps borrowing from.',
               artists:['Bollywood classics','Lavani','Indian Ocean'], mood:'monsoon city night'},
  bali:       {genre:'Gamelan', why:'Bronze percussion orchestras \u2014 you will hear rehearsals from village compounds at dusk.',
               artists:['Balinese gamelan','Gamelan Semar Pegulingan'], mood:'temple dusk'},
  kyoto:      {genre:'Shakuhachi & koto', why:'Bamboo flute and thirteen-string zither \u2014 music written around silence.',
               artists:['Shakuhachi','Koto traditional'], mood:'temple garden'},
  lisbon:     {genre:'Fado', why:'Saudade set to guitar in the Alfama\u2019s small rooms.',
               artists:['Am\u00e1lia Rodrigues','Mariza'], mood:'old quarter night'},
  marrakech:  {genre:'Gnawa', why:'Trance music with sub-Saharan roots \u2014 guembri, qraqeb, all night.',
               artists:['Gnawa','Maalem Mahmoud Guinia'], mood:'medina night'},
  havana:     {genre:'Son & rumba', why:'The root of everything later called salsa.',
               artists:['Buena Vista Social Club','Cuban son'], mood:'street corner evening'}
};
function rwSoundFor(place){
  var k=String(place||'').toLowerCase().trim();
  if(RW_SOUND[k]) return RW_SOUND[k];
  /* fall back to the state/region a city sits in */
  var REGION={jodhpur:'rajasthan', udaipur:'rajasthan', pushkar:'rajasthan',
              kochi:'kerala', munnar:'kerala', alleppey:'kerala',
              nainital:'almora', mussoorie:'almora', ranikhet:'almora',
              kasol:'manali', shimla:'manali', dharamshala:'manali',
              ludhiana:'punjab', chandigarh:'punjab', gangtok:'darjeeling'};
  var r=REGION[k];
  return r? RW_SOUND[r] : null;
}
function rwSoundHTML(place){
  var snd=rwSoundFor(place); if(!snd) return '';
  var q = encodeURIComponent(snd.artists[0]+' '+snd.genre);
  var id='snd_'+Math.random().toString(36).slice(2,7);
  window['_'+id] = 'Yeh hai '+place+' ki awaaz. '+snd.genre+'. '+snd.why;
  return '<div style="background:linear-gradient(135deg,rgba(167,139,250,.12),rgba(124,58,237,.05));border:1px solid rgba(167,139,250,.3);border-radius:13px;padding:12px 14px">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<button onclick="tuskSpeak(window._'+id+')" style="flex:0 0 auto;width:38px;height:38px;border-radius:50%;border:none;'
    +'background:linear-gradient(135deg,#A78BFA,#7C3AED);color:#fff;font-size:15px;cursor:pointer">\u25b6</button>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#A78BFA;font-weight:800">The sound of '+esc2(place)+'</div>'
    +'<div style="font-size:13.5px;font-weight:800;margin-top:1px">'+esc2(snd.genre)+'</div></div></div>'
    +'<div style="font-size:11.5px;color:var(--t2);line-height:1.55;margin-top:7px">'+esc2(snd.why)+'</div>'
    +'<div class="tk-chips" style="margin-top:8px">'
    + snd.artists.slice(0,3).map(function(a){
        return '<a class="tk-chip" style="font-size:11px;padding:5px 10px;text-decoration:none" target="_blank" rel="noopener" '
          +'href="https://open.spotify.com/search/'+encodeURIComponent(a)+'">\ud83c\udfb5 '+esc2(a)+'</a>';
      }).join('')
    +'<a class="tk-chip" style="font-size:11px;padding:5px 10px;text-decoration:none" target="_blank" rel="noopener" '
    +'href="https://www.jiosaavn.com/search/'+q+'">JioSaavn</a>'
    +'</div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:7px">Plays on Spotify or JioSaavn so the artists get paid \u2014 we don\u2019t host audio.</div>'
    +'</div>';
}
