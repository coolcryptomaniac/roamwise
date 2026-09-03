/* ============================================================================
   js/data/iata.js
   ----------------------------------------------------------------------------
   The IATA airport-code lookup table and resolver — moved verbatim out of
   app.js (Phase 1 of the app.js modularization). Pure data/config plus its
   lookup helper, no logic changes. Loaded as a plain classic <script> (not a
   module) in index.html, before app.js, so RW_IATA and rwIata stay bare
   globals exactly as before.
   ========================================================================= */
/* ==================== IATA LOOKUP (rw-v95) ====================
   Skyscanner deep-links need real 3-letter airport codes, not free-text city
   names. This is a compact, hand-checked lookup — every destination in DB
   above, plus the major Indian cities travellers most often fly from — NOT
   an exhaustive worldwide gazetteer. Where a place has no airport of its own
   (hill towns, valleys) it maps to the nearest airport actually used to
   reach it; where even that isn't confident enough to state as fact, the
   place is deliberately left OUT of this table rather than guessed, so the
   caller falls back to the always-correct Google Flights link instead of a
   broken Skyscanner URL. Keys are lower-cased for lookup. */
var RW_IATA = {
  /* ---- India: DB destinations ---- */
  'goa':'GOI', 'manali':'KUU', 'rishikesh':'DED', 'spiti valley':'KUU',
  'alleppey':'COK', 'jaipur':'JAI', 'varanasi':'VNS', 'munnar':'COK',
  'coorg':'IXE', 'hampi':'HBX', 'pondicherry':'PNY', 'rann of kutch':'BHJ',
  'havelock island':'IXZ', 'darjeeling':'IXB', 'gangtok':'IXB',
  'mcleodganj':'DHM', 'jaisalmer':'JSA', 'udaipur':'UDR', 'mysore':'MYQ',
  'wayanad':'CCJ', 'auli':'DED', 'kaziranga':'JRH', 'khajuraho':'HJR',
  'leh':'IXL',
  /* ziro valley and chopta intentionally omitted — no airport within a
     distance confident enough to call "the" airport for that place. */

  /* ---- International: DB destinations ---- */
  'chiang mai':'CNX', 'ubud':'DPS', 'hoi an':'DAD', 'kyoto':'KIX',
  'marrakech':'RAK', 'tbilisi':'TBS', 'cappadocia':'NAV', 'porto':'OPO',
  'prague':'PRG', 'cusco':'CUZ', 'medellín':'MDE', 'medellin':'MDE',
  'petra':'AMM', 'kandy':'CMB', 'queenstown':'ZQN', 'oaxaca':'OAX',
  'pokhara':'PKR', 'paro':'PBH', 'malé':'MLE', 'male':'MLE',
  'port louis':'MRU', 'victoria':'SEZ', 'perhentian islands':'KBR',
  'maasai mara':'NBO', 'nadi':'NAN',

  /* ---- Major Indian cities (common trip origins) ---- */
  'delhi':'DEL', 'new delhi':'DEL', 'mumbai':'BOM', 'bangalore':'BLR',
  'bengaluru':'BLR', 'chennai':'MAA', 'kolkata':'CCU', 'hyderabad':'HYD',
  'pune':'PNQ', 'ahmedabad':'AMD', 'kochi':'COK', 'cochin':'COK',
  'lucknow':'LKO', 'chandigarh':'IXC', 'indore':'IDR', 'guwahati':'GAU',
  'bhubaneswar':'BBI', 'amritsar':'ATQ', 'srinagar':'SXR', 'nagpur':'NAG',
  'patna':'PAT'
};
/* Best-effort resolve: exact match, then match on the part before the first
   comma (handles "Goa, India" style strings). Returns null — never a guess —
   when nothing confident is found. */
function rwIata(place){
  if(!place) return null;
  var k = String(place).trim().toLowerCase();
  if(RW_IATA[k]) return RW_IATA[k];
  var first = k.split(',')[0].trim();
  if(RW_IATA[first]) return RW_IATA[first];
  return null;
}
