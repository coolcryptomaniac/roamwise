/* ============================================================================
   MOUNTAIN CONDITIONS — curated, sourced advisories for the next few weeks
   ----------------------------------------------------------------------------
   Read by js/booking/mountain-conditions.js (Tusk warnings, direct-booking
   reminders, the Quiet Himalaya page). Every entry carries its source and an
   "until" date, and drops out by itself once that date passes. Add new items
   from the weekly scout run; never add an item without a source URL.

   official:true  = announced by the authority (temple committee, police, IMD).
   official:false = derived (e.g. a festival-calendar date) — shown as "confirm".
   ========================================================================== */
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
  { id: 'lahaul-snow-oct-2026', kind: 'snow', official: true,
    match: ['lahaul', 'spiti', 'kaza', 'keylong', 'jispa', 'darcha', 'sissu', 'atal tunnel', 'chandratal', 'leh', 'baralacha', 'kunzum', 'shinkula'],
    title: 'Early snow in Lahaul-Spiti: high passes shut',
    detail: 'On 15 Oct 2026 the Leh-Manali highway was closed beyond Darcha, the Manali-Kaza road was closed, and Shinkula, Baralacha La and Kunzum were shut to vehicles. Treat anything past Atal Tunnel as weather-dependent and check with police before setting out.',
    from: '2026-10-15', until: '2026-11-30',
    source: 'ETV Bharat', sourceUrl: 'https://www.etvbharat.com/en/state/snow-rain-herald-onset-of-winter-in-himachal-pradesh-enn26101503615' }
];
if (typeof module !== 'undefined' && module.exports) module.exports = { RW_CONDITIONS: RW_CONDITIONS };
