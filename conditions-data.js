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
var RW_CONDITIONS_CHECKED = '2026-10-31';
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
  {"id":"auto-20261030-watch-video-shri-gangotri-dham-covered-i","kind":"snow","official":false,"auto":true,"match":["gangotri"],"title":"WATCH VIDEO: Shri Gangotri Dham Covered in Fresh Snowfall as Winter Arrives in…","detail":"The Sunday Guardian reports this. Check with local police or the district administration before you travel.","from":"2026-10-30","until":"2026-11-02","source":"The Sunday Guardian","sourceUrl":"https://news.google.com/rss/articles/CBMilgJBVV95cUxOeW5nVS1PM0V0NUsxeDdiUXA5N1VaZHhVYXlCeEdTMWNzS0FmMFByTWNidklPd1lDOHQzdXE5RHk2cWVrY2tPcUNNekYwb29GWG1hV0FCeVJPc0liOTRaakJhSTBhN3R4MThienRzODN3Q0ZEbUJ2ZkJRWUlSZFNPVndZbmRpUV8xbnRBR3NpUXRNd0hNNzJtNUFfRFBjUV80dE82V3F1R3R4b2lvRzhSV1MzcWVHQ2diWHJpLTB5N0VvdENMXzZ2X3pKenB3YWoyWXNtWjBfSi15UjRsc1hHS2N4UllkejQzUXRWNWgwbUdWT2JiaWllNW1VNWpzX3hGV2kwWjVMZW5CdUpyYUpfMkh2cjRFZ9IBmwJBVV95cUxNSnBrOHBFdUdqTmVWSW50UzY4ZjlTX1JwU0FGSTlpSEdtZWlHVXFVbnMzbmt1T29aRG1FbGV3SE01ZWpLNmJsa0YtVmtvWDZHWG9iS2kyZGx0dzBObjlURTItbmhCVXJsdzIyZnM2RjRfbklfc3VDaW92eGtWSGhkRmlzR0JIOFgwT0YyVkoyUjdBNkhTOWMzNE44WHNXanptZjh5UEJEYnpRYU1zbGlJeVZaUjhwOE9lNE9MNzhyckY5SVFWaGdIc1hiWjVXNVM3QWhheF9MZ3lxS2FrNHpGMFgySHdfczVZS3N3RWFFMHV1azQ0MnJrYlVBNVRxSmU1MVdWMzRIcEZoM1NDak1mTFZuZmVGS2l5LVpB?oc=5","checkedAt":"2026-10-31"},
  {"id":"auto-20261029-gridlock-forces-tourists-to-cancel-kainc","kind":"crowd","official":false,"auto":true,"match":["kainchi"],"title":"Gridlock forces tourists to cancel Kainchi Dham trips amid soaring hotel rates","detail":"Pioneer Edge reports this. Check with local police or the district administration before you travel.","from":"2026-10-29","until":"2026-11-01","source":"Pioneer Edge","sourceUrl":"https://news.google.com/rss/articles/CBMipAFBVV95cUxOTUNSam9VRDFpXzhoSC1JdG5sNDZvb0phdVJvUm9ER0FDLXEyc1dieWxJcGtWdWtRWl9Xdk54eUExMVVWWEdXVWYtLWhBQ00zb2FHeG5zeGt0SXc4TTFxaG9Xb1B1RkFYYlp0TEk0V2dSc0QzWUFXOU9MSmI5aGp4WDdBLXRnUFZJdXg2QzFIYzg4by1ZcWJseVhCLThKNEpXZzE5cg?oc=5","checkedAt":"2026-10-31"},
  {"id":"auto-20261030-kedarnath-dham-receives-season-s-first-h","kind":"snow","official":false,"auto":true,"match":["kedarnath"],"title":"Kedarnath Dham receives season's first heavy snowfall; temperatures plummet","detail":"ANI News reports this. Check with local police or the district administration before you travel.","from":"2026-10-30","until":"2026-11-02","source":"ANI News","sourceUrl":"https://news.google.com/rss/articles/CBMi1wFBVV95cUxPTC1sd2l0S0ZEN01qUzJlejBvMEFxRlRYbWlKSVZzZDEzS3RPU01nWEpjeF9Gazk4WjVYaFNrUWJpZ3BBS2tsbzhfeWdldW1xQ2E0d3lRbjhBTi01aTJBR0dyUkZJd0FudjFKNTBqSWw2cjQwMjIzSlRzYmFQWk5pYmhwVmUzOEp4RWpJcm1uMDJrOUpFdUl1eXYzUlVOYmM3MG5sWEJEZnpQN2VuXzVHNFhsZGI1Mmx0Wm8zX2EyVXlwd255cXdIeGlNRS02YUxyRTJvblFJZw?oc=5","checkedAt":"2026-10-30"},
  {"id":"auto-20261029-snowfall-blankets-peaks-around-badrinath","kind":"snow","official":false,"auto":true,"match":["badrinath"],"title":"Snowfall Blankets Peaks Around Badrinath Temple in Uttarakhand as Temperatures Drop","detail":"ETV Bharat reports this. Check with local police or the district administration before you travel.","from":"2026-10-29","until":"2026-11-01","source":"ETV Bharat","sourceUrl":"https://news.google.com/rss/articles/CBMizgFBVV95cUxOeEpVajZSOUxaMXBBMVlhLWw2ckhid20xYm4wRjIxcGZCM2hJd0FTMWFxVER5Q3EwU3dtdnNYTEVubjJBcHQ2cGpaUEJHMTVVS1djNkpjSmsxeHdXOVNyd014X1JnT2llX2xuOUhlREVUdERDN21JRml4bmthekt6UnBuZU9mQkozSFI5M1BrTWlIY3M2U2hPNDFpMjlYbFVFMWZ4YjA5THNNeFhfLUYwejJ1U0tWaEEwMXo4WGJ3VkRNa0J0UlBnZnlhaEVXQdIB0wFBVV95cUxNVUsyWnduUXNHalRBbVpCNjJzVzRPeG9MelltSzBiQXhDWnZkcGhKTjlHdnItRnB0TXFGaTNMVVZLeGU0YXBXYnMyQUhPUmZfcVNUUHJsRkkzR2xQOXFJRDdxaXhOSEtjU1RTd0xhWGQyY0hpcC1fS3BYS0hKN0VfUGxkbTUySHo4elQ2TkUycHVvY0xFWG95cmFzWGJVSnVrd3ZlUUNMdUxhby1GbW1SbGlXM3VPLTZhTlFscXJnWkdRYzFHcF9ORmUwRExEZDNiMFRv?oc=5","checkedAt":"2026-10-30"},
  /* AUTO-SCOUT:END */
];
if (typeof module !== 'undefined' && module.exports) module.exports = { RW_CONDITIONS: RW_CONDITIONS, RW_CONDITIONS_CHECKED: RW_CONDITIONS_CHECKED };
