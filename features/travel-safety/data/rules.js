/* ============================================================================
   Uttarakhand permits, registrations and rules: the data behind the checker
   ----------------------------------------------------------------------------
   HONESTY RULES (same spirit as features/kainchi-yatra/AGENTS.md):
   · Every rule names a source (news report or authority page) and the day we
     checked it. Nothing here is invented; where the authority has not published
     a detail (a portal URL, a fee) the text says "ask" instead of guessing.
   · status: 'in-force'  announced and running
             'draft'     proposed, not yet notified; shown as "coming"
             'seasonal'  applies only in some months
             'info'      practical advice, not a legal requirement
   · links[].official: true only for government / temple-committee / IRCTC
     sites. RoamWise never sells permits, passes or helicopter tickets.
   · applies: places = lowercase words matched against the trip's places,
              activities = trip activities, months = 1-12 travel months,
              always = shown for every Uttarakhand trip.
   Re-check every rule when its `checked` date is 60+ days old (the page flags it).
   Classic script; also loads in Node (module.exports).
   ========================================================================= */
var RW_UK_RULES_CHECKED = '2026-10-30';

var RW_UK_RULES = [
  { id: 'char-dham-registration', kind: 'must', status: 'in-force',
    applies: { places: ['char dham', 'chardham', 'kedarnath', 'badrinath', 'gangotri', 'yamunotri', 'hemkund'] },
    title: 'Register for the Char Dham / Hemkund yatra before you travel',
    body: ['Registration is compulsory for every pilgrim, online on the Uttarakhand Tourism registration portal or at offline counters (Haridwar, Rishikesh and on the route).',
      'Carry the registration (phone copy is fine) and the same photo ID you registered with; it is checked on the way.',
      'Over 50 lakh people registered in 2026, so register early for peak weeks.'],
    links: [{ label: 'Registration & tourist care portal', url: 'https://registrationandtouristcare.uk.gov.in/', official: true }],
    source: { label: 'News Arena: Char Dham Yatra draws over 50 lakh registrations', url: 'https://newsarenaindia.com/states/char-dham-yatra-draws-over-50-lakh-registrations/84468' },
    checked: '2026-10-30' },

  { id: 'kedarnath-helicopter', kind: 'must', status: 'in-force',
    applies: { places: ['kedarnath', 'char dham', 'chardham'], activities: ['helicopter'] },
    title: 'Kedarnath helicopter tickets: only on IRCTC HeliYatra',
    body: ['All online Kedarnath helicopter bookings go through IRCTC HeliYatra. Nobody else sells genuine tickets: no WhatsApp number, Facebook page, "agent" or website.',
      'Police have blocked around 550 fake pages, websites, WhatsApp numbers and bank accounts selling fake heli tickets.',
      'Seats are 3–4 times oversubscribed, so a "guaranteed seat" offer is itself a warning sign.'],
    links: [{ label: 'IRCTC HeliYatra', url: 'https://heliyatra.irctc.co.in/', official: true }, { label: 'Check a booking link', url: '/booking-safety/' }],
    source: { label: 'NewKerala: police block ~550 Kedarnath heli fraud platforms', url: 'https://www.newkerala.com/news/a/action-against-cyber-fraudsters-operating-name-kedarnath-heli-439.htm' },
    checked: '2026-10-30' },

  { id: 'adi-kailash-ilp', kind: 'must', status: 'in-force',
    applies: { places: ['adi kailash', 'om parvat', 'gunji', 'jolingkong', 'kalapani', 'lipulekh', 'nabhidhang'] },
    title: 'Adi Kailash and Om Parvat need an Inner Line Permit',
    body: ['The route beyond Dharchula is a border area. Every visitor needs an Inner Line Permit issued by the Dharchula sub-divisional (SDM) administration; KMVN tours arrange it for their groups.',
      'Keep your Aadhaar or another photo ID, passport photos and a medical fitness certificate ready (ask the SDM office for the current list and fee).',
      'The yatra pauses in the July–August monsoon. Permits crossed last year\'s full-season total by 8 June 2026, so apply early.'],
    links: [{ label: 'Pithoragarh district', url: 'https://pithoragarh.nic.in/', official: true }, { label: 'Kumaon Mandal Vikas Nigam (KMVN)', url: 'https://kmvn.gov.in/', official: true }, { label: 'RoamWise Adi Kailash planner', url: '/adi-kailash/' }],
    source: { label: 'News Arena: Adi Kailash yatra surpasses last year in 40 days', url: 'https://www.newsarenaindia.com/states/adi-kailash-yatra-surpasses-last-year-s-turnout-in-40-days/79561' },
    checked: '2026-10-30' },

  { id: 'mussoorie-registration', kind: 'must', status: 'in-force',
    applies: { places: ['mussoorie', 'landour', 'kempty', 'dhanaulti'] },
    title: 'Mussoorie: tourists must be registered',
    body: ['Since 30 July 2025 every tourist staying in Mussoorie is registered on the Uttarakhand Tourism portal. Your hotel, guest house or homestay registers you at check-in.',
      'Stay at a registered property and carry photo ID. If you are only passing through, keep your stay booking handy in case you are asked.'],
    links: [{ label: 'Uttarakhand Tourism registration portal', url: 'https://registrationandtouristcare.uk.gov.in/', official: true }],
    source: { label: 'ThePrint: registration now mandatory for tourists visiting Mussoorie', url: 'https://theprint.in/india/registration-now-mandatory-for-tourists-visiting-ukhands-mussoorie/2708847' },
    checked: '2026-10-30' },

  { id: 'green-cess', kind: 'must', status: 'in-force',
    applies: { activities: ['car-outside'] },
    title: 'Green cess on vehicles from outside Uttarakhand',
    body: ['Out-of-state vehicles pay a green cess at 15 border points, collected automatically by number-plate cameras (reported at Rs 80 for a private car; buses and trucks pay more).',
      'Two-wheelers, three-wheelers, electric and CNG vehicles and Uttarakhand-registered vehicles are exempt.',
      'Keep your FASTag active and topped up so the entry is not held up. Confirm the current rate before you drive.'],
    links: [{ label: 'Uttarakhand Transport Department', url: 'https://transport.uk.gov.in/', official: true }],
    source: { label: 'ETV Bharat: green cess collection at 15 points from 15 February', url: 'https://www.etvbharat.com/en/bharat/uttarakhand-to-start-collecting-green-cess-at-15-points-from-february-15-enn26020803686' },
    checked: '2026-10-30' },

  { id: 'kainchi-crowd-rules', kind: 'must', status: 'in-force',
    applies: { places: ['kainchi', 'bhowali'] },
    title: 'Kainchi Dham: crowd and vehicle rules',
    body: ['Weekends and holidays bring very heavy crowds; over 50,000 people came over the 2026 Gandhi Jayanti weekend and the road jammed for hours. Go early on a weekday.',
      'On the foundation-day fair (15 June) private vehicles are stopped: park at Bhimtal / Vikas Bhawan (from Haldwani) or Metropole / DSA Flats (from Nainital) and take the shuttle.',
      'Officials are considering online pre-registration like Char Dham. It is not live yet; RoamWise will update this when it is.'],
    links: [{ label: 'Nainital district', url: 'https://nainital.nic.in/', official: true }, { label: 'RoamWise Kainchi Dham planner', url: '/kainchi/' }],
    source: { label: 'NewsBytes: Kainchi Dham surge sparks pre-registration plan', url: 'https://www.newsbytesapp.com/news/india/uttarakhands-kainchi-dham-surge-after-hanuman-ansh-sparks-pre-registration/tldr' },
    checked: '2026-10-30' },

  { id: 'valley-of-flowers-permit', kind: 'must', status: 'seasonal',
    applies: { places: ['valley of flowers', 'ghangaria', 'hemkund'] },
    title: 'Valley of Flowers: entry permit (June–October)',
    body: ['The park opens on 1 June. Entry needs a Forest Department permit, now booked online (the window opens a couple of days before the season); it was Rs 200 for Indians and Rs 800 for foreign visitors in 2025.',
      'Hemkund Sahib pilgrims also register on the Char Dham registration portal.'],
    links: [{ label: 'Uttarakhand Forest Department', url: 'https://forest.uk.gov.in/', official: true }],
    source: { label: 'ETV Bharat: Valley of Flowers registration goes virtual', url: 'https://www.etvbharat.com/en/!bharat/valley-of-flowers-set-to-open-from-june-1-registration-goes-virtual-enn25051704922' },
    checked: '2026-10-30' },

  { id: 'trek-rules-draft', kind: 'know', status: 'draft',
    applies: { activities: ['trek'] },
    title: 'Trekking: new rules are coming',
    body: ['Uttarakhand has drafted trekking rules: only registered operators, insurance and a medical certificate for every trekker, trained local guides, and route limits. They are not notified yet.',
      'Already today: treks inside national parks and sanctuaries need a Forest Department permit, and you should go with a local, registered operator who checks the weather before each day.'],
    links: [{ label: 'Uttarakhand Tourism', url: 'https://uttarakhandtourism.gov.in/', official: true }],
    source: { label: 'ETV Bharat: Uttarakhand to regulate trekking and mountaineering', url: 'https://www.etvbharat.com/en/bharat/uttarakhand-to-regulate-trekking-and-mountaineering-enn26012502063' },
    checked: '2026-10-30' },

  { id: 'monsoon-roads', kind: 'safety', status: 'seasonal',
    applies: { months: [6, 7, 8, 9] },
    title: 'Monsoon: roads close often, keep a buffer day',
    body: ['Landslides closed over 100 roads in early August 2026 and 71 in July. Highways to Yamunotri, Gangotri and Badrinath are hit most.',
      'Do not drive in the hills after dark, keep one spare day, and check the road status the morning you move.'],
    links: [{ label: 'Uttarakhand traffic police', url: 'https://uttarakhandtraffic.com/', official: true }, { label: 'RoamWise road & safety status', url: '/uttarakhand-road-status/' }],
    source: { label: 'ETV Bharat: landslides block over 100 roads (Aug 2026)', url: 'https://www.etvbharat.com/en/state/peak-monsoon-havoc-in-uttarakhand-landslides-block-over-100-roads-heavy-rain-alerts-issued-enn26080508519' },
    checked: '2026-10-30' },

  { id: 'winter-shrines', kind: 'know', status: 'seasonal',
    applies: { months: [11, 12, 1, 2, 3, 4], places: ['char dham', 'chardham', 'kedarnath', 'badrinath', 'gangotri', 'yamunotri'] },
    title: 'Winter: the Char Dham shrines close, the winter seats stay open',
    body: ['From Diwali/Bhai Dooj until spring the four high shrines are closed. Worship moves to the winter seats: Ukhimath (Kedarnath), Jyotirmath–Pandukeshwar (Badrinath), Mukhba (Gangotri) and Kharsali (Yamunotri).',
      'Expect snow and short days above 2,000 m; carry chains or hire local taxis for snowy stretches.'],
    links: [{ label: 'Badrinath–Kedarnath Temple Committee', url: 'https://badrinath-kedarnath.gov.in/', official: true }],
    source: { label: 'ETV Bharat: exploring the winter Char Dham circuit', url: 'https://www.etvbharat.com/en/bharat/exploring-the-winter-char-dham-circuit-a-guide-to-the-off-season-pilgrimage-enn25102504268' },
    checked: '2026-10-30' },

  { id: 'booking-scams', kind: 'safety', status: 'info', applies: { always: true },
    title: 'Book only through official sites or people you can verify',
    body: ['Fake helicopter, Char Dham, GMVN/KMVN and hotel booking sites appear every season, often as paid ads. The government\'s cyber crime centre warns pilgrims about them.',
      'Paste any link, UPI ID or phone number into the RoamWise checker before you pay.'],
    links: [{ label: 'Check a booking link', url: '/booking-safety/' }, { label: 'Report cyber fraud: 1930 / cybercrime.gov.in', url: 'https://cybercrime.gov.in/', official: true }],
    source: { label: 'News On AIR: I4C alert on online booking frauds targeting pilgrims', url: 'https://www.newsonair.gov.in/i4c-issues-alert-on-online-booking-frauds-targeting-pilgrims-and-tourists-warns-against-fake-websites-and-ads' },
    checked: '2026-10-30' },

  { id: 'emergency-numbers', kind: 'safety', status: 'info', applies: { always: true },
    title: 'Save the emergency numbers before you lose signal',
    body: ['112 for police, fire and ambulance anywhere in India.',
      '1070 is the Uttarakhand disaster helpline run by the State Disaster Management Authority (USDMA). The State Emergency Operations Centre in Dehradun is on 0135-2710334.'],
    links: [{ label: 'USDMA', url: 'https://usdma.uk.gov.in/', official: true }],
    source: { label: 'Indian Masterminds: USDMA helpline 1070 (Aug 2026)', url: 'https://indianmasterminds.com/news/uttarakhand-nepal-flood-helpline-1070-228122/' },
    checked: '2026-10-30' }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { RW_UK_RULES: RW_UK_RULES, RW_UK_RULES_CHECKED: RW_UK_RULES_CHECKED };
