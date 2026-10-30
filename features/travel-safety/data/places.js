/* ============================================================================
   Uttarakhand regions and places for the travel-safety pages and alerts
   ----------------------------------------------------------------------------
   One list shared by:
     · /uttarakhand-travel-rules/  (pick places -> rules + advisories)
     · /uttarakhand-road-status/   (advisories grouped by region, follow a region)
     · tools/build-conditions-json.js -> data/conditions.json -> the Worker's
       advisory alerts (which region an advisory touches, who follows it)
   `words` are lowercase place names. An advisory (conditions-data.js) touches a
   region when one of its `match` words is in that region's `words`, and a stay
   booking is in a region when its zone/area/property text contains one of them.
   Classic script; also loads in Node (module.exports).
   ========================================================================= */
var RW_UK_REGIONS = [
  { id: 'almora', name: 'Almora', hi: 'अल्मोड़ा', side: 'Kumaon',
    words: ['almora', 'kasar devi', 'kasardevi', 'jageshwar', 'binsar', 'ranikhet', 'chitai', 'katarmal', 'kausani', 'dwarahat', 'kotyura', 'ghurson', 'milan chowk'] },
  { id: 'nainital', name: 'Nainital · Kainchi', hi: 'नैनीताल · कैंची', side: 'Kumaon',
    words: ['nainital', 'kainchi', 'bhowali', 'bhimtal', 'mukteshwar', 'naukuchiatal', 'sattal', 'ramgarh', 'haldwani', 'kathgodam', 'ramnagar', 'corbett'] },
  { id: 'pithoragarh', name: 'Pithoragarh · Adi Kailash', hi: 'पिथौरागढ़ · आदि कैलाश', side: 'Kumaon',
    words: ['pithoragarh', 'adi kailash', 'om parvat', 'dharchula', 'gunji', 'jolingkong', 'kalapani', 'munsiyari', 'chaukori', 'patal bhuvaneshwar', 'gangolihat'] },
  { id: 'bageshwar', name: 'Bageshwar', hi: 'बागेश्वर', side: 'Kumaon',
    words: ['bageshwar', 'pindari', 'kafni', 'sunderdhunga', 'baijnath'] },
  { id: 'champawat', name: 'Champawat · Lohaghat', hi: 'चंपावत', side: 'Kumaon',
    words: ['champawat', 'lohaghat', 'abbott mount', 'tanakpur', 'purnagiri', 'mayawati'] },
  { id: 'rudraprayag', name: 'Kedarnath valley', hi: 'केदारनाथ घाटी', side: 'Garhwal',
    words: ['kedarnath', 'rudraprayag', 'sonprayag', 'gaurikund', 'guptkashi', 'phata', 'ukhimath', 'chopta', 'tungnath', 'madhmaheshwar'] },
  { id: 'chamoli', name: 'Badrinath · Auli', hi: 'बद्रीनाथ · औली', side: 'Garhwal',
    words: ['badrinath', 'chamoli', 'joshimath', 'jyotirmath', 'auli', 'mana', 'valley of flowers', 'ghangaria', 'hemkund', 'pandukeshwar', 'karnaprayag', 'gopeshwar', 'niti'] },
  { id: 'uttarkashi', name: 'Gangotri · Yamunotri', hi: 'गंगोत्री · यमुनोत्री', side: 'Garhwal',
    words: ['gangotri', 'yamunotri', 'uttarkashi', 'harsil', 'dharali', 'mukhba', 'kharsali', 'janki chatti', 'barkot', 'dayara', 'kedarkantha', 'sankri'] },
  { id: 'tehri', name: 'Tehri · Dhanaulti', hi: 'टिहरी', side: 'Garhwal',
    words: ['tehri', 'new tehri', 'dhanaulti', 'kanatal', 'surkanda', 'chamba'] },
  { id: 'pauri', name: 'Pauri · Lansdowne', hi: 'पौड़ी · लैंसडाउन', side: 'Garhwal',
    words: ['pauri', 'lansdowne', 'khirsu', 'bilkhet', 'kotdwar', 'devprayag', 'srinagar garhwal'] },
  { id: 'dehradun', name: 'Dehradun · Mussoorie', hi: 'देहरादून · मसूरी', side: 'Garhwal',
    words: ['dehradun', 'mussoorie', 'landour', 'kempty', 'chakrata', 'rajaji', 'sahastradhara'] },
  { id: 'haridwar', name: 'Haridwar · Rishikesh', hi: 'हरिद्वार · ऋषिकेश', side: 'Garhwal',
    words: ['haridwar', 'rishikesh', 'shivpuri', 'neelkanth', 'kumbh'] }
];

/* The Char Dham words touch every shrine region, so a "Char Dham" trip matches them all. */
var RW_UK_CIRCUITS = { 'char dham': ['rudraprayag', 'chamoli', 'uttarkashi'], chardham: ['rudraprayag', 'chamoli', 'uttarkashi'] };

/* Places offered as quick picks on the rules checker, with RoamWise's own planner where one exists. */
var RW_UK_PICKS = [
  { id: 'kainchi', label: 'Kainchi Dham', region: 'nainital', guide: '/kainchi/' },
  { id: 'nainital', label: 'Nainital · Bhimtal', region: 'nainital' },
  { id: 'almora', label: 'Almora · Kasar Devi', region: 'almora', guide: '/kasar-devi-almora/' },
  { id: 'jageshwar', label: 'Jageshwar', region: 'almora', guide: '/jageshwar/' },
  { id: 'binsar', label: 'Binsar · Kausani', region: 'almora', guide: '/guides/binsar-india.html' },
  { id: 'adi kailash', label: 'Adi Kailash · Om Parvat', region: 'pithoragarh', guide: '/adi-kailash/' },
  { id: 'munsiyari', label: 'Munsiyari', region: 'pithoragarh' },
  { id: 'char dham', label: 'Char Dham (all four)', region: 'rudraprayag', guide: '/char-dham/' },
  { id: 'kedarnath', label: 'Kedarnath', region: 'rudraprayag', guide: '/char-dham/' },
  { id: 'badrinath', label: 'Badrinath', region: 'chamoli', guide: '/char-dham/' },
  { id: 'valley of flowers', label: 'Valley of Flowers · Hemkund', region: 'chamoli' },
  { id: 'auli', label: 'Auli · Joshimath', region: 'chamoli' },
  { id: 'gangotri', label: 'Gangotri · Yamunotri', region: 'uttarkashi', guide: '/char-dham/' },
  { id: 'mussoorie', label: 'Mussoorie · Dhanaulti', region: 'dehradun' },
  { id: 'rishikesh', label: 'Rishikesh · Haridwar', region: 'haridwar', guide: '/guides/rishikesh-uttarakhand.html' },
  { id: 'lansdowne', label: 'Lansdowne', region: 'pauri' }
];

function rwUkRegionsForText(text) {
  var t = String(text || '').toLowerCase();
  var out = [];
  Object.keys(RW_UK_CIRCUITS).forEach(function (k) {
    if (t.indexOf(k) !== -1) RW_UK_CIRCUITS[k].forEach(function (id) { if (out.indexOf(id) === -1) out.push(id); });
  });
  RW_UK_REGIONS.forEach(function (r) {
    if (out.indexOf(r.id) === -1 && r.words.some(function (w) { return t.indexOf(w) !== -1; })) out.push(r.id);
  });
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RW_UK_REGIONS: RW_UK_REGIONS, RW_UK_CIRCUITS: RW_UK_CIRCUITS, RW_UK_PICKS: RW_UK_PICKS, rwUkRegionsForText: rwUkRegionsForText };
}
