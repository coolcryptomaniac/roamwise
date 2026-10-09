/* local-help-data.js — RoamWise "Local Help" (who to call in a Kumaon town).
 * Same pattern as events-data.js: edit data here, no code changes needed to add a listing.
 *
 * HONESTY RULES (enforced in code, not just policy):
 *  - A provider is shown ONLY if it has a consentAt date (they agreed to be listed).
 *  - Every shown provider carries a visible verification level.
 *  - Nothing here is copied from another site; add only people you have spoken to.
 *
 * Emergency numbers live in js/booking/local-rides.js (openSOS) — not duplicated here.
 */
var RW_LOCAL_DISTRICTS = [
  { id: 'nainital',    name: 'Nainital',           towns: ['Kathgodam', 'Haldwani', 'Nainital', 'Bhimtal', 'Mukteshwar', 'Ramnagar', 'Lalkuan'] },
  { id: 'almora',      name: 'Almora',             towns: ['Almora', 'Ranikhet', 'Binsar', 'Jageshwar'] },
  { id: 'bageshwar',   name: 'Bageshwar',          towns: ['Bageshwar', 'Kausani', 'Kapkot'] },
  { id: 'pithoragarh', name: 'Pithoragarh',        towns: ['Pithoragarh', 'Munsiyari', 'Dharchula'] },
  { id: 'champawat',   name: 'Champawat',          towns: ['Champawat', 'Lohaghat', 'Tanakpur'] },
  { id: 'usnagar',     name: 'Udham Singh Nagar',  towns: ['Rudrapur', 'Kashipur', 'Khatima', 'Sitarganj', 'Pantnagar'] }
];

/* Rail/road gateways into Kumaon (Kathgodam is the terminal railway station; Haldwani the road gateway). */
var RW_LOCAL_GATEWAYS = ['Kathgodam', 'Haldwani'];

var RW_LOCAL_CATEGORIES = [
  { id: 'taxi',   icon: '🚕', label: 'Taxi & drivers',        hint: 'Agree the fare and pick-up point before you set off.' },
  { id: 'stay',   icon: '🏡', label: 'Homestays',             hint: 'Message first — hill homestays often have no instant booking.' },
  { id: 'guide',  icon: '🥾', label: 'Guides & trek help',    hint: 'Ask what the fee covers: food, permits, porter.' },
  { id: 'health', icon: '🏥', label: 'Health & pharmacy',     hint: 'Clinics and chemists. For emergencies use the SOS page.' },
  { id: 'repair', icon: '🔧', label: 'Vehicle & bike repair', hint: 'Mechanics, tyre shops, towing.' },
  { id: 'daily',  icon: '🛒', label: 'Daily needs',           hint: 'Groceries, SIM, ATM, laundry.' }
];

var RW_LOCAL_VERIFY = {
  visited: 'We visited in person',
  called:  'We spoke on the phone',
  self:    'Self-listed, not yet checked'
};

/* One object per person/business. Leave empty until real, consenting entries exist.
 * { id, cat, town, name, phone, whatsapp, languages:['Hindi','Kumaoni'], note,
 *   verified:'visited'|'called'|'self', consentAt:'YYYY-MM-DD' } */
var RW_LOCAL_PROVIDERS = [];

var RW_LOCAL_LINKS = {
  blood: { label: 'Find a blood bank (e-RaktKosh, official)', url: 'https://eraktkosh.in' },
  listEmail: 'support@roamwise.co.in'
};

/* ---- pure helpers (no DOM) ---- */
function rwLocalTowns() {
  var out = [];
  RW_LOCAL_DISTRICTS.forEach(function (d) {
    d.towns.forEach(function (t) { out.push({ town: t, district: d.name }); });
  });
  return out;
}
function rwLocalFind(cat, town) {
  return RW_LOCAL_PROVIDERS.filter(function (p) {
    return !!p.consentAt && (!cat || cat === 'all' || p.cat === cat) && (!town || p.town === town);
  });
}
function rwLocalCount(town) { return rwLocalFind('all', town).length; }
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
if (typeof module !== 'undefined') module.exports = { RW_LOCAL_DISTRICTS: RW_LOCAL_DISTRICTS, RW_LOCAL_GATEWAYS: RW_LOCAL_GATEWAYS, RW_LOCAL_CATEGORIES: RW_LOCAL_CATEGORIES, RW_LOCAL_PROVIDERS: RW_LOCAL_PROVIDERS, RW_LOCAL_VERIFY: RW_LOCAL_VERIFY, rwLocalTowns: rwLocalTowns, rwLocalFind: rwLocalFind, rwLocalCount: rwLocalCount, rwLocalWhatsApp: rwLocalWhatsApp, rwLocalTel: rwLocalTel, rwLocalListMail: rwLocalListMail };
