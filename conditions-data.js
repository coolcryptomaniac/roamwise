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
var RW_CONDITIONS_CHECKED = '2026-11-12';
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
    source: 'ETV Bharat', sourceUrl: 'https://www.etvbharat.com/en/state/snow-rain-herald-onset-of-winter-in-himachal-pradesh-enn26101503615' },
  /* AUTO-SCOUT:START  Written daily by .github/workflows/uttarakhand-advisory-scout.yml from
     Uttarakhand news (tools/advisory-scout). auto:true items are always official:false
     ("confirm locally"), expire within 21 days and are pruned by the scout. To remove one
     early, delete it here; to keep one longer, move it above this block. */
  {"id":"auto-20261110-heavy-rainfall-alert-issued-in-uttarakha","kind":"rain","official":false,"auto":true,"match":["kedarnath"],"title":"Heavy rainfall alert issued in Uttarakhand; Kedarnath pedestrian route disrupted","detail":"DD News reports this. Check with local police or the district administration before you travel.","from":"2026-11-10","until":"2026-11-12","source":"DD News","sourceUrl":"https://news.google.com/rss/articles/CBMiqAFBVV95cUxPS1cxYmlrVFBwaU0zZkdUQUJIMjY0VExDd1lJbzEtMGlfYUcwd2I3WFpCUEZTdV9adnFrYktQYlhrdXRCa09XLVZMNDRyak5hYkJxaVB6RThjNmRZY0xTbVRyOFlNSHNTNzlTckc2dk9GU1hLcTZCay1DeTRRN1RnNlg4dTByNm9NQW9oMUpKWnBSS2J1Si1Hd25pLTJ2NEZQLWRQdjdTaWk?oc=5","checkedAt":"2026-11-11"},
  {"id":"auto-20261102-char-dham-yatra-2026-check-closing-dates","kind":"closure","official":false,"auto":true,"match":["kedarnath","badrinath","gangotri","yamunotri"],"title":"Char Dham Yatra 2026: Check Closing Dates And Timings Of Yamunotri, Gangotri, Kedarnath…","detail":"Times Now reports this. Check with local police or the district administration before you travel.","from":"2026-11-02","until":"2026-11-16","source":"Times Now","sourceUrl":"https://news.google.com/rss/articles/CBMi6wFBVV95cUxQTzFKODZKa1lPMlV1a3hUVjB5N25yZ29NMll2d1RyQWdyZWhwUnNHZjI1Tk5lMjRqRS00cndsNkFLMy1GQUtnLUFadGxyWVdwTDVCajVDOWl6MGYzNXlFSkp1S3Yxc29SOHVsd1Q5RVBEX3dyb1hTV1k4dkwwWXhOSVJwNURBbkVteEw3Zi1fUTBlSk55MWlLWDNQeXljSUpvcUlBNXNlQWU2U1B6dEJ2YjMxejc1RmVJUUtaaEdrUVpCbERwNUhybXBQUUxZdWg5WFJ4VGRVRC1INVN5QmIwTDRueDNzQ1BPZHBJ0gHwAUFVX3lxTE12M0ZDMXhTLXdPQ2lxOE1aVzdGckR4WTh6WmJhVGRHM0R4b0M5MnNIVlA2RHY3YUxzazM1SUp3enFPeUg0T1dxQk13c2VQUkt3VVJLc0NaWjktUF95ZUt3Y1QycnBSNVBCeWRqRjVmYUdLSnNMWUZYNUhZLXZ1S0hHSUZlUS1LRVNSeEZwWXI4bDRzS3dNRkJXSkI3dUlNUkZ5Um10cnpFVjF4NEI1NjRQOWV6ck1IWWVaYVdnZ3ZEZHBma05CTngySnBHb0dqWk9qczZxRk9EZ3VjczFrdTVfWWV0RGtJQWtmUjNMYXNscA?oc=5","checkedAt":"2026-11-03"},
  {"id":"auto-20261102-charter-helicopter-flights-for-char-dham","kind":"closure","official":false,"auto":true,"match":["dehradun"],"title":"Charter Helicopter Flights For Char Dham Yatra Suspended In Dehradun","detail":"Asianet Newsable reports this. Check with local police or the district administration before you travel.","from":"2026-11-02","until":"2026-11-16","source":"Asianet Newsable","sourceUrl":"https://news.google.com/rss/articles/CBMixgFBVV95cUxOcWJjZFRmQXRHcDVVVmJ6MzRzaTl3LTRDQW9lb2xwVGdGNzBMcWVIUTJPOGxJRVFMOUpoQ2o4VzM3RnhiOXFQV0FXc0dQekdEbThodjFXajRlTTFPLVU5V2ZQa090cVVsQ3pydk5ka1pmR0VRZDdmS3BFNklLSldINE5YX3BKSE1Cc1BUcHZIWWZZSTUySTh2WnFfWFdfWEJiZkI1UkJYT3pKZ3hKT3Y0OVdYY3dwcmVYVlVJQWR3emdXaUZSbXfSAcsBQVVfeXFMT194amFPcXZuV204ZVp3UUF6cG15MFk1enZxVXo2QUtWYTZwdi1ZSUdySDhJeVJxUExpRzl6eWZnaDNHWFI0bWFfU2JiLW51MFN2bTZNTnNjejV2SlY2YU90VzkwQmdCZGM5T2tvY3lFdDlhYmF3VVBNWlJUc1Biakl6WllpS0dkUVgxRzRYdk9mbkd2SFhFSjVLdmJhdUJOTFRwbW1vcGg2RzJHZGVPbmxCVVZpZTE0ZWtJUTVKeDhLTW5yOG5mbVZyY00?oc=5","checkedAt":"2026-11-03"},
  /* AUTO-SCOUT:END */
];
if (typeof module !== 'undefined' && module.exports) module.exports = { RW_CONDITIONS: RW_CONDITIONS, RW_CONDITIONS_CHECKED: RW_CONDITIONS_CHECKED };
