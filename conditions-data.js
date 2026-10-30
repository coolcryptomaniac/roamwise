/* ============================================================================
   MOUNTAIN CONDITIONS — curated, sourced advisories for the next few weeks
   ----------------------------------------------------------------------------
   Read by js/booking/mountain-conditions.js (Tusk warnings, direct-booking
   reminders, the Quiet Himalaya page). Every entry carries its source and an
   "until" date, and drops out by itself once that date passes. Add new items
   from the weekly scout run; never add an item without a source URL.

   After any edit: bump RW_CONDITIONS_CHECKED and run `npm run conditions:build`, which
   rewrites data/conditions.json. The Worker reads that JSON to send automatic alerts
   (ADVISORY-ALERTS.md); `npm run check` fails while it is stale.

   official:true  = announced by the authority (temple committee, police, IMD).
   official:false = derived (e.g. a festival-calendar date) — shown as "confirm".
   ========================================================================== */
/* Day the list was last reviewed against the news (shown on /uttarakhand-road-status/). Bump on every edit. */
var RW_CONDITIONS_CHECKED = '2026-10-30';
var RW_CONDITIONS = [
  { id: 'badrinath-close-2026', kind: 'closure', official: true,
    match: ['badrinath', 'joshimath', 'jyotirmath', 'mana', 'chamoli', 'char dham', 'chardham'],
    title: 'Badrinath closes for winter on 16 Nov 2026, 9:37 PM',
    detail: 'Date fixed on Vijayadashami (20 Oct 2026) in the presence of the Badrinath-Kedarnath Temple Committee. Plan darshan before 16 Nov.',
    from: '2026-10-20', until: '2026-11-16',
    source: 'Tirtha Yatra', sourceUrl: 'https://www.tirthayatra.org/sri-badrinath-dham-kapaat-to-close-for-winter-on-november-16-2026/' },
  { id: 'kedarnath-close-2026', kind: 'closure', official: false,
    match: ['kedarnath', 'sonprayag', 'gaurikund', 'guptkashi', 'char dham', 'chardham'],
    title: 'Kedarnath expected to close on Bhai Dooj, 11 Nov 2026',
    detail: 'Follows the festival calendar; confirm the exact time with the temple committee before travel.',
    from: '2026-10-20', until: '2026-11-11',
    source: 'Shivganga Travels (calendar-based)', sourceUrl: 'https://www.shivgangatravels.com/blog/char-dham-yatra-closing-dates-2026' },
  { id: 'gangotri-yamunotri-close-2026', kind: 'closure', official: false,
    match: ['gangotri', 'yamunotri', 'uttarkashi', 'harsil', 'janki chatti', 'char dham', 'chardham'],
    title: 'Gangotri expected to close 10 Nov, Yamunotri 11 Nov 2026',
    detail: 'Annakut and Bhai Dooj dates; confirm with the temple committees before travel.',
    from: '2026-10-20', until: '2026-11-11',
    source: 'Shivganga Travels (calendar-based)', sourceUrl: 'https://www.shivgangatravels.com/blog/char-dham-yatra-closing-dates-2026' },
  { id: 'kainchi-crowds-autumn-2026', kind: 'crowd', official: false,
    match: ['kainchi', 'bhowali', 'neem karoli'],
    title: 'Kainchi Dham: very heavy weekend and holiday crowds',
    detail: 'Over 50,000 visitors came on the 2026 Gandhi Jayanti weekend and the Bhowali-Kainchi road jammed for hours. Officials are weighing online pre-registration. Go early on a weekday and expect parking limits on holidays.',
    from: '2026-10-08', until: '2026-11-30',
    source: 'NewsBytes', sourceUrl: 'https://www.newsbytesapp.com/news/india/uttarakhands-kainchi-dham-surge-after-hanuman-ansh-sparks-pre-registration/tldr' },
  { id: 'himalayan-car-rally-2026', kind: 'event', official: true,
    match: ['almora', 'nainital', 'dehradun', 'tehri', 'pauri', 'ranikhet', 'bhowali'],
    title: 'Himalayan Car Rally, 19–21 Nov 2026: expect stage closures',
    detail: 'The Uttarakhand Tourism calendar runs the rally through Dehradun, Tehri, Pauri, Almora and Nainital. Expect short road closures and busy hotels on rally days; check local police diversions.',
    from: '2026-11-12', until: '2026-11-21',
    source: 'Indian Masterminds (UTDB calendar)', sourceUrl: 'https://indianmasterminds.com/news/uttarakhand-tourism-calendar-2026-27-239001/' },
  { id: 'adi-kailash-season-end-2026', kind: 'closure', official: false,
    match: ['adi kailash', 'om parvat', 'gunji', 'jolingkong', 'kalapani', 'dharchula'],
    title: 'Adi Kailash yatra season ends in November',
    detail: 'The 2026 yatra runs May to November with a monsoon pause. Late-season permits and KMVN departures thin out as snow arrives; confirm with the Dharchula SDM office or KMVN before booking.',
    from: '2026-10-20', until: '2026-11-30',
    source: 'News Arena', sourceUrl: 'https://www.newsarenaindia.com/states/adi-kailash-yatra-surpasses-last-year-s-turnout-in-40-days/79561' },
  { id: 'lahaul-snow-oct-2026', kind: 'snow', official: true,
    match: ['lahaul', 'spiti', 'kaza', 'keylong', 'jispa', 'darcha', 'sissu', 'atal tunnel', 'chandratal', 'leh', 'baralacha', 'kunzum', 'shinkula'],
    title: 'Early snow in Lahaul-Spiti: high passes shut',
    detail: 'On 15 Oct 2026 the Leh-Manali highway was closed beyond Darcha, the Manali-Kaza road was closed, and Shinkula, Baralacha La and Kunzum were shut to vehicles. Treat anything past Atal Tunnel as weather-dependent and check with police before setting out.',
    from: '2026-10-15', until: '2026-11-30',
    source: 'ETV Bharat', sourceUrl: 'https://www.etvbharat.com/en/state/snow-rain-herald-onset-of-winter-in-himachal-pradesh-enn26101503615' }
];
if (typeof module !== 'undefined' && module.exports) module.exports = { RW_CONDITIONS: RW_CONDITIONS, RW_CONDITIONS_CHECKED: RW_CONDITIONS_CHECKED };
