/* local-help-data.js — RoamWise "Local Help" (who to call in a Kumaon town).
 * Same pattern as events-data.js: edit data here, no code changes needed to add a listing.
 *
 * HONESTY RULES (enforced in code, not just policy):
 *  - A provider is shown ONLY if it has a consentAt date (they agreed to be listed).
 *  - A provider older than RW_LOCAL_MAX_AGE_DAYS (by updatedAt, else consentAt) is hidden automatically.
 *  - Every shown provider carries a visible verification level.
 *  - Nothing here is copied from another site; add only people you have spoken to.
 *
 * Emergency numbers live in js/booking/local-rides.js (openSOS) — not duplicated here.
 */
var RW_LOCAL_DISTRICTS = [
  { id: 'nainital',    name: 'Nainital',           towns: ['Kathgodam', 'Haldwani', 'Nainital', 'Bhimtal', 'Mukteshwar', 'Ramnagar', 'Lalkuan'] },
  { id: 'almora',      name: 'Almora',             towns: ['Almora', 'Ranikhet', 'Binsar', 'Jageshwar'] },
  { id: 'bageshwar',   name: 'Bageshwar',          towns: ['Bageshwar', 'Kausani', 'Kapkot'] },
  { id: 'pithoragarh', name: 'Pithoragarh',        towns: ['Pithoragarh', 'Didihat', 'Munsiyari', 'Thal', 'Dharchula'] },
  { id: 'champawat',   name: 'Champawat',          towns: ['Champawat', 'Lohaghat', 'Tanakpur'] },
  { id: 'usnagar',     name: 'Udham Singh Nagar',  towns: ['Rudrapur', 'Kashipur', 'Khatima', 'Sitarganj', 'Pantnagar'] }
];

/* Rail/road gateways into Kumaon (Kathgodam is the terminal railway station; Haldwani the road gateway). */
var RW_LOCAL_GATEWAYS = ['Kathgodam', 'Haldwani'];

var RW_LOCAL_CATEGORIES = [
  { id: 'taxi', maps: 'taxi service',   icon: '🚕', label: 'Taxi & drivers',        hint: 'Agree the fare and pick-up point before you set off.' },
  { id: 'rental', maps: 'bike rental', icon: '\ud83c\udfcd\ufe0f', label: 'Bike & car rental',     hint: 'Check the vehicle, helmet and papers before you pay.' },
  { id: 'stay', maps: 'homestay',   icon: '🏡', label: 'Homestays',             hint: 'Message first — hill homestays often have no instant booking.' },
  { id: 'guide', maps: 'trekking guide',  icon: '🥾', label: 'Guides & trek help',    hint: 'Ask what the fee covers: food, permits, porter.' },
  { id: 'health', maps: 'pharmacy', icon: '🏥', label: 'Health & pharmacy',     hint: 'Clinics and chemists. For emergencies use the SOS page.' },
  { id: 'repair', maps: 'bike mechanic', icon: '🔧', label: 'Vehicle & bike repair', hint: 'Mechanics, tyre shops, towing.' },
  { id: 'daily', maps: 'grocery store',  icon: '🛒', label: 'Daily needs',           hint: 'Groceries, SIM, ATM, laundry.' }
];

var RW_LOCAL_VERIFY = {
  kb:      '',   /* imported listing: no verification claim of our own; the card shows only the updated month */
  visited: 'We visited in person',
  called:  'We spoke on the phone',
  self:    'Self-listed, not yet checked'
};

/* One object per person/business. Leave empty until real, consenting entries exist.
 * { id, cat, town, name, phone, whatsapp, languages:['Hindi','Kumaoni'], note,
 *   verified:'visited'|'called'|'self', consentAt:'YYYY-MM-DD' } */
var RW_LOCAL_PROVIDERS = [];   /* imported listings arrive from local-help-listings.js (lazy-loaded) */
var RW_LOCAL_MAX_AGE_DAYS = 365;

var RW_LOCAL_LINKS = {
  blood: { label: 'Find a blood bank (e-RaktKosh, official)', url: 'https://eraktkosh.in' },
  listEmail: 'support@roamwise.co.in'
};

/* Official Google Maps search URL (free, no key, nothing scraped or stored). */
function rwLocalMapsUrl(catId, town) {
  var c = RW_LOCAL_CATEGORIES.filter(function (x) { return x.id === catId; })[0];
  var q = (c && c.maps ? c.maps : 'services') + ' near ' + town + ', Uttarakhand';
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

/* ---- pure helpers (no DOM) ---- */
function rwLocalTowns() {
  var out = [];
  RW_LOCAL_DISTRICTS.forEach(function (d) {
    d.towns.forEach(function (t) { out.push({ town: t, district: d.name }); });
  });
  return out;
}
function rwLocalFresh(p, nowMs) {
  var t = Date.parse((p && (p.updatedAt || p.consentAt)) || '');
  if (!t) return false;
  return ((nowMs || Date.now()) - t) <= RW_LOCAL_MAX_AGE_DAYS * 86400000;
}
function rwLocalFind(cat, town, nowMs) {
  return RW_LOCAL_PROVIDERS.filter(function (p) {
    return !!p.consentAt && rwLocalFresh(p, nowMs) && (!cat || cat === 'all' || p.cat === cat) && (!town || p.town === town);
  });
}
function rwLocalMonth(p) {
  var d = new Date((p && (p.updatedAt || p.consentAt)) || '');
  if (isNaN(d)) return '';
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}
function rwLocalCount(town, nowMs) { return rwLocalFind('all', town, nowMs).length; }
function rwLocalWhatsApp(p, msg) {
  var n = String((p && (p.whatsapp || p.phone)) || '').replace(/\D/g, '');
  if (n.length === 10) n = '91' + n;
  if (n.length < 11) return '';
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(msg || 'Hi, I found you on RoamWise.');
}
function rwLocalTel(p) {
  var n = String((p && p.phone) || '').replace(/[^\d+]/g, '');
  return n.length >= 10 ? 'tel:' + n : '';
}
function rwLocalListMail(town) {
  var body = 'Name:\nWhat you offer (taxi / homestay / guide / repair / health / daily needs):\nTown:' + (town ? ' ' + town : '') +
    '\nPhone / WhatsApp:\nLanguages:\n\nI agree to be listed on RoamWise Local Help.';
  return 'mailto:' + RW_LOCAL_LINKS.listEmail + '?subject=' + encodeURIComponent('List me on RoamWise Local Help') + '&body=' + encodeURIComponent(body);
}
function rwLocalRemoveMail(p) {
  var body = 'Please remove this listing from RoamWise Local Help.\n\nName: ' + ((p && p.name) || '') + '\nListing id: ' + ((p && p.id) || '');
  return 'mailto:' + RW_LOCAL_LINKS.listEmail + '?subject=' + encodeURIComponent('Remove my RoamWise Local Help listing') + '&body=' + encodeURIComponent(body);
}
if (typeof module !== 'undefined') module.exports = { RW_LOCAL_DISTRICTS: RW_LOCAL_DISTRICTS, RW_LOCAL_GATEWAYS: RW_LOCAL_GATEWAYS, RW_LOCAL_CATEGORIES: RW_LOCAL_CATEGORIES, RW_LOCAL_PROVIDERS: RW_LOCAL_PROVIDERS, RW_LOCAL_VERIFY: RW_LOCAL_VERIFY, rwLocalTowns: rwLocalTowns, rwLocalFind: rwLocalFind, rwLocalMapsUrl: rwLocalMapsUrl, rwLocalFresh: rwLocalFresh, rwLocalMonth: rwLocalMonth, rwLocalRemoveMail: rwLocalRemoveMail, RW_LOCAL_MAX_AGE_DAYS: RW_LOCAL_MAX_AGE_DAYS, rwLocalCount: rwLocalCount, rwLocalWhatsApp: rwLocalWhatsApp, rwLocalTel: rwLocalTel, rwLocalListMail: rwLocalListMail };
