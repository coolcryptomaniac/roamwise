// packages/catalog.mjs - the PUBLIC side of the student package engine: itineraries, what is included,
// prices (from the generated grid), the transport plan and who-does-what. No costs, supplier rates or margins live
// here; those stay in the private engine (project docs: claude/packages-engine) which regenerates price-grid.mjs.
import { windowRisk } from './dates-core.mjs';
import { GRID } from './price-grid.mjs';

export const GST = 0.05;
export const GROUP = Object.freeze({ min: 6, max: 10, default: 8 });
export const WHATSAPP = '919987379730'; // RoamWise business number (js/copilot/nmims-answers.js)

export const PACKAGES = Object.freeze({
  almora: {
    id: 'almora', name: 'Almora Food Trail', tagline: 'Yaadein le jayein: food, ridges and temples from a hill kitchen',
    nights: 3, days: 4, start: 'Kathgodam station', stay: 'Milan Heights, Milan Chowk, Almora', accent: '#E8BA6C',
    status: 'open', statusNote: 'Pilot batch: the stay confirms rooms and the student rate when you ask for dates.',
    itinerary: [
      { title: 'Arrive and taste', plan: 'Meet at Kathgodam, ride up the hill (about 3 hours), check in, evening food walk: bal mithai, singori, Kumaoni snacks.', memory: 'The first group photo with the hills behind you.' },
      { title: 'Ridge and kitchen', plan: 'Kasar Devi sunrise, back for a Kumaoni thali session in the kitchen (bhatt ki churkani, aloo ke gutke, jhangora kheer).', memory: 'You cooked it, you eat it: a recipe card to take home.' },
      { title: 'Temples of the forest', plan: 'Katarmal Sun Temple and Jageshwar Dham with a local guide who tells the stories, lunch on the road.', memory: 'Sunset on the road back; the group reel is shot today.' },
      { title: 'Goodbye breakfast', plan: 'Slow breakfast, instant prints and the group reel, ride down by mid-morning to catch afternoon trains.', memory: 'Instant prints, one reel, one full camera roll.' },
    ],
    includes: ['3 nights, twin sharing, at Milan Heights', 'Meals with the food tastings', 'A local guide every day', 'Shared-cab seats up and down, and a private vehicle for the sightseeing days', 'Entry fees, group accident cover, first-aid kit', 'The Yaadein kit (optional): group reel, photos, instant prints'],
    notIncluded: ['Your train or flight to Kathgodam', 'Personal shopping', 'Anything not listed'],
  },
  lansdowne: {
    id: 'lansdowne', name: 'Lansdowne Pine & Peace', tagline: 'Yaadein le jayein: a quiet cantonment town, a village homestay and a bonfire',
    nights: 2, days: 3, start: 'Kotdwar station', stay: 'Corbett Jungle View Homestay, Ghildiyal Gaon, near Bansi', accent: '#6ee7c4',
    status: 'soon', statusNote: 'Opening soon: the homestay\'s rates and owner agreement are being finalised. You can register interest.',
    itinerary: [
      { title: 'Village arrival', plan: 'Pickup at Kotdwar (from the Mussoorie Express, 05:45), transfer to the homestay, village walk, home-cooked dinner and bonfire.', memory: 'Stars with no streetlight in sight.' },
      { title: 'Lansdowne day', plan: 'Bhulla Taal boating, War Memorial and Darwan Singh museum, Tip n Top viewpoint, Santoshi Mata sunset. Optional: Tarkeshwar Mahadev temple (about 38 km).', memory: 'The group on the boat, the sunset from the temple.' },
      { title: 'Slow goodbye', plan: 'Breakfast on the veranda, instant prints, drop at Kotdwar for the evening train.', memory: 'A printed trip map and a reel of the three days.' },
    ],
    includes: ['2 nights, twin sharing, in a six-bedroom village homestay', 'Home-cooked meals and a bonfire', 'A local guide every day', 'Private vehicle for the transfers and the sightseeing day', 'Entry fees, group accident cover, first-aid kit', 'The Yaadein kit (optional): group reel, photos, instant prints'],
    notIncluded: ['Your train to Kotdwar', 'Personal shopping', 'Anything not listed'],
  },
});

export const gridKey = ({ vehicle = 'single', kit = true } = {}) => vehicle + (kit ? '+kit' : '');

export function priceFor(pkgId, n, opts = {}) {
  const row = GRID[pkgId] && GRID[pkgId][gridKey(opts)] && GRID[pkgId][gridKey(opts)][n];
  if (!row) return null;
  return { ...row, gstPP: row.totalPP - row.pricePP, groupTotal: row.totalPP * n };
}

export const OPERATING_MODEL = Object.freeze({
  roamwise: ['Takes the booking and collects payment, in full or in parts', 'Holds the dates with the stay, driver and guide', 'Sends each driver and guide a pickup card on WhatsApp', 'Supports the group on the trip and collects ratings'],
  partners: {
    stay: 'Rooms and meals, paid after check-out.',
    driver: 'A registered, vetted driver with a commercial vehicle, paid per leg on completion.',
    guide: 'A local guide for each day, paid per day.',
    keepsake: 'A local photographer or creator, paid on delivery.',
  },
  timeline: [
    { t: '45 to 30 days before', do: 'We hold the dates with the stay, a lead driver, a backup driver and the guide.' },
    { t: '30 days before', do: 'Booking opens: deposit paid, group chat created.' },
    { t: '14 days before', do: 'Final part due. Driver and guide get the pickup card; the stay gets the room list.' },
    { t: '3 days before', do: 'We check the road and weather and reconfirm the driver, backup and guide.' },
    { t: 'On the trip', do: 'A morning check-in to the group and the driver every day.' },
    { t: 'The day after', do: 'The group rates the trip (on time, safe driving, price kept).' },
  ],
});

const DRIVER_NEEDS = ['Commercial registration, permit and insurance for the vehicle', 'Driving licence with badge', 'Two references and one paid trial trip', 'A backup driver on call for every trip'];

/* Transport plan for a group and start date. The rail or air leg to the railhead is the students' own. */
export function transportPlan(pkgId, n, startISO, opts = {}) {
  const pkg = PACKAGES[pkgId];
  const price = priceFor(pkgId, n, opts);
  if (!pkg || !price) return null;
  const risk = windowRisk(startISO, pkg.days);
  const almora = pkgId === 'almora';
  const legs = almora ? [
    { day: 1, from: 'Kathgodam station', to: 'Almora', by: price.longLeg, depart: 'by 09:00', note: 'Leave before the Kainchi Dham crowd builds. Allow about 3 hours.' },
    { day: 2, from: 'Almora', to: 'Kasar Devi and back', by: price.local, depart: '05:15', note: 'Sunrise run, back for breakfast.' },
    { day: 3, from: 'Almora', to: 'Katarmal and Jageshwar and back', by: price.local, depart: '08:30', note: 'Back on the hill road before dark.' },
    { day: 4, from: 'Almora', to: 'Kathgodam station', by: price.longLeg, depart: 'by 10:00', note: 'Book onward trains that leave after 15:00.' },
  ] : [
    { day: 1, from: 'Kotdwar station', to: 'The homestay', by: price.longLeg, depart: 'on train arrival', note: 'The Mussoorie Express arrives at 05:45; the Garhwal Express at 15:20 is too late for a daylight transfer.' },
    { day: 2, from: 'The homestay', to: 'Lansdowne and back', by: price.local, depart: '09:00', note: 'Tarkeshwar Mahadev adds about 76 km of road.' },
    { day: 3, from: 'The homestay', to: 'Kotdwar station', by: price.longLeg, depart: 'to suit the train', note: 'Book an evening train from Kotdwar.' },
  ];
  const studentLegs = [
    almora
      ? 'From Mumbai: a train or flight to Delhi, then Delhi to Kathgodam on 12040 Kathgodam Shatabdi (about 5h35), 15035 Utar Sampark Kranti (about 6h45) or 15013 Ranikhet Express (about 7h). Choose one that arrives before 09:30 and check times on IRCTC.'
      : 'From Mumbai: a train or flight to Delhi, then Delhi to Kotdwar on the Mussoorie Express 14041 (22:20 to 05:45) or the Garhwal Express 14044 (07:20 to 15:20), both daily.',
    'Book the train as a group on IRCTC as early as the booking window allows.',
  ];
  const advice = risk.label === 'busy' ? 'These dates cross busy days. If you can, start on a Monday to Thursday in a quiet month.'
    : risk.label === 'ok' ? 'Reasonable dates, with some traffic on a travel day.' : 'These dates avoid the worst of the traffic.';
  return { pkg: pkgId, n, startISO, risk, legs, studentLegs, driverNeeds: DRIVER_NEEDS, advice };
}

export function whatsappLink({ pkgId, n, startISO, opts = {}, total }) {
  const pkg = PACKAGES[pkgId];
  const text = 'Hi RoamWise, I am interested in the ' + pkg.name + ' for ' + n + ' people starting ' + startISO
    + (total ? ' (about Rs ' + total.toLocaleString('en-IN') + ' per person incl. GST)' : '') + '. Please share availability and next steps.';
  return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text);
}
