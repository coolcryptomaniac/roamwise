// packages/dates-core.mjs - "calm dates" for Kumaon / Garhwal group trips.
// Pure functions, no network. The traffic levels are a HEURISTIC built from published crowd reports
// (see SOURCES), not a live feed: 0 = calm, 1 = light, 2 = busy, 3 = jam. Edit EVENTS as new reports arrive.
// Dates are ISO strings (YYYY-MM-DD); all maths is done at noon UTC so time zones never shift a day.

export const SOURCES = Object.freeze([
  'Kainchi Dham crowd of 50,000 in one weekend and proposed daily cap (OneIndia, 7 Oct 2026)',
  'Nainital-Almora highway gridlock on Saturday 3 Oct 2026 (Free Press Journal)',
  'Almora crowds by month: quiet Mar-Apr and Jul-Aug, busy Oct and Dec-Feb (Champion Traveler)',
]);

const DAY = 86400000;
const t = (iso) => Date.parse(iso + 'T12:00:00Z');
export const addDays = (iso, n) => new Date(t(iso) + n * DAY).toISOString().slice(0, 10);
export const dow = (iso) => new Date(t(iso)).getUTCDay(); // 0 Sun .. 6 Sat
export const DOW_NAMES = Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
export const daysBetween = (a, b) => Math.round((t(b) - t(a)) / DAY);

/* Known crowd events. level = traffic on the Kathgodam/Kotdwar roads that day. */
export const EVENTS = Object.freeze([
  { from: '2026-10-01', to: '2026-10-21', level: 2, why: 'October is the second-busiest month; Navratri to Dussehra (20 Oct)' },
  { from: '2026-11-06', to: '2026-11-10', level: 3, why: 'Diwali week (Diwali is about 8 Nov 2026)' },
  { from: '2026-12-24', to: '2027-01-02', level: 3, why: 'Christmas to New Year rush' },
  { from: '2027-01-13', to: '2027-01-15', level: 1, why: 'Makar Sankranti (Ghughutia) in Kumaon' },
  { from: '2027-01-22', to: '2027-01-26', level: 2, why: 'Republic Day long weekend' },
  { from: '2027-05-15', to: '2027-06-30', level: 2, why: 'Summer holidays: the Nainital-Kainchi road is the busiest' },
  { from: '2027-06-13', to: '2027-06-16', level: 3, why: 'Kainchi Dham foundation day (15 June)' },
]);

/* Weekday base: weekends and Friday evenings are when Kainchi Dham and Nainital jam the highway. */
const WEEKDAY_BASE = Object.freeze([3, 1, 0, 0, 0, 2, 3]);

function inSeasonWinter(iso) {
  const md = iso.slice(5);
  return md >= '12-15' || md <= '02-28';
}
function inMonsoon(iso) {
  const md = iso.slice(5);
  return md >= '07-01' && md <= '09-15';
}

export function dayRisk(iso, events = EVENTS) {
  const reasons = [];
  let level = WEEKDAY_BASE[dow(iso)];
  if (level >= 2) reasons.push(DOW_NAMES[dow(iso)] === 'Fri' ? 'Friday-evening arrivals' : 'weekend traffic');
  for (const e of events) {
    if (iso >= e.from && iso <= e.to) { if (e.level > level) level = e.level; reasons.push(e.why); }
  }
  if (inSeasonWinter(iso) && level < 3) { level += 1; reasons.push('winter peak season'); }
  return { date: iso, level: Math.min(3, level), reasons, monsoon: inMonsoon(iso), fog: iso.slice(5) >= '12-15' || iso.slice(5) <= '01-31' };
}

/* Travel days (first and last) count double: that is when you are on the highway. Middle days are sightseeing. */
export function windowRisk(startISO, days, events = EVENTS) {
  const list = [];
  for (let i = 0; i < days; i++) list.push(dayRisk(addDays(startISO, i), events));
  let score = 0;
  list.forEach((d, i) => { score += (i === 0 || i === days - 1) ? 2 * d.level : 0.5 * d.level; });
  const worst = list.reduce((a, b) => (b.level > a.level ? b : a), list[0]);
  const label = score <= 2 ? 'calm' : score <= 6 ? 'ok' : 'busy';
  const why = [...new Set(list.flatMap((d) => d.reasons))];
  return {
    start: startISO, end: addDays(startISO, days - 1), days, score, label, levels: list.map((d) => d.level), why,
    monsoon: list.some((d) => d.monsoon), fog: list.some((d) => d.fog), worstDate: worst.date,
  };
}

const overlaps = (a0, a1, b0, b1) => a0 <= b1 && b0 <= a1;

/* Best windows between fromISO and toISO.
   allowed: optional [{from,to}] - the whole trip must sit inside one of these (a student vacation, say).
   blackout: [{from,to,label}] - the trip may not touch these (exams).  */
export function bestWindows({ days, fromISO, toISO, allowed = null, blackout = [], todayISO = null, minLeadDays = 21, limit = 5, events = EVENTS }) {
  const first = todayISO ? (addDays(todayISO, minLeadDays) > fromISO ? addDays(todayISO, minLeadDays) : fromISO) : fromISO;
  const out = [];
  for (let s = first; s <= toISO; s = addDays(s, 1)) {
    const e = addDays(s, days - 1);
    if (allowed && !allowed.some((r) => s >= r.from && e <= r.to)) continue;
    if (blackout.some((r) => overlaps(s, e, r.from, r.to))) continue;
    out.push(windowRisk(s, days, events));
  }
  out.sort((a, b) => a.score - b.score || (a.start < b.start ? -1 : 1));
  const picked = [];
  for (const w of out) {
    if (picked.every((p) => !overlaps(w.start, w.end, p.start, p.end))) picked.push(w);
    if (picked.length >= limit) break;
  }
  return picked;
}

/* A sample NMIMS 2026-27 calendar (MBA, Term I-III) used to show how a cohort's free days feed the engine.
   Source: familybusiness.nmims.edu academic calendar PDF. Each cohort's calendar differs: confirm with E-Cell. */
export const NMIMS_SAMPLE = Object.freeze({
  note: 'Sample NMIMS MBA 2026-27 calendar; confirm your cohort\'s dates with E-Cell before announcing.',
  free: [
    { from: '2026-11-06', to: '2026-11-12', label: 'Diwali vacation' },
    { from: '2026-12-26', to: '2027-01-01', label: 'Winter vacation' },
    { from: '2027-04-03', to: '2027-05-09', label: 'After Term III exams (maybe free: check internship dates)', maybe: true },
  ],
  blackout: [
    { from: '2026-11-14', to: '2026-11-20', label: 'Re-exams and mid-terms' },
    { from: '2027-01-02', to: '2027-01-10', label: 'Term-end exams' },
    { from: '2027-03-10', to: '2027-04-02', label: 'Mid-terms and term-end exams' },
  ],
});
