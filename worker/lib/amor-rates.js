/* Amor Hospitality net rates (PRIVATE: never sent to the browser).
 * Source: the four PDF rate sheets Amor's sales desk sent on 6 Nov 2026 (Gmail, forwarded by Deepanshi).
 * Commercial model (Manish Bhola, Amor, call with the founder on 13 Nov 2026):
 *   - every rate on the sheets is a NET rate (no commission is paid back later);
 *   - RoamWise adds its own 7% commission, plus 18% GST on that commission, and sets the guest price;
 *   - on a few properties Amor can give up to Rs 500 more off a booking; that is NOT built into prices
 *     (it is margin headroom the founder can keep or pass on, case by case).
 * Tax: Nanau and Aramness sheets say "inclusive of all applicable taxes". Tattwaa and Padma sheets say
 * "exclusive of all applicable taxes", so hotel GST is added here: 5% for a room tariff up to Rs 7,500
 * a night, 18% above (GST on hotel accommodation from 22 Sep 2025). Reconfirm with Amor and the CA.
 * Tattwaa's sheet was valid to 31 Mar 2026; it is carried forward as PROVISIONAL until Amor sends the
 * 2026-27 card, and its Christmas / New Year nights (separate festive packages, not received) are blocked. */

export const COMMISSION = 0.07;
export const COMMISSION_GST = 0.18;
export const EXTRA_DISCOUNT_HEADROOM = 500; // per booking, some properties only; not applied to prices

export const roomGstRate = (tariff) => (tariff <= 7500 ? 0.05 : 0.18);

/* Dates are inclusive ISO night dates (the night that starts on that date). */
const range = (a, b) => { const out = []; for (let t = Date.parse(a + 'T00:00:00Z'); t <= Date.parse(b + 'T00:00:00Z'); t += 864e5) out.push(new Date(t).toISOString().slice(0, 10)); return out; };
const days = (...groups) => new Set(groups.flat());

export const PLAN_LABEL = {
  EP: 'Room only', CP: 'Breakfast', MAP: 'Breakfast and dinner', AP: 'All meals',
};

const CORBETT_PEAK = days(range('2026-12-24', '2026-12-31'), range('2027-01-01', '2027-01-03'), range('2027-01-23', '2027-01-26'), ['2027-03-20', '2027-03-21', '2027-03-26', '2027-03-27']);

export const AMOR = Object.freeze({
  tattwaa: {
    name: 'The Tattwaa Corbett Spa & Resort', place: 'Sitabani Gate, Bhalon, Jim Corbett',
    taxIncluded: false, provisional: true, validFrom: '2026-11-13', validTo: '2027-03-31', plans: ['CP', 'MAP', 'AP'],
    planNote: 'Evening hi-tea included',
    rooms: {
      forest: { label: 'Forest Room with private sit-out', pax: 2, keys: 14, rates: { CP: 5500, MAP: 6000, AP: 6500 } },
      premium: { label: 'Premium Room with private sit-out', pax: 2, keys: 16, rates: { CP: 6000, MAP: 6500, AP: 7000 } },
      pine: { label: 'Pine Cottage with private sit-out', pax: 2, keys: 6, rates: { CP: 6000, MAP: 6500, AP: 7000 } },
      junior: { label: 'Junior Suite with bathtub', pax: 2, keys: 8, rates: { CP: 6750, MAP: 7250, AP: 7750 } },
      villa: { label: 'Private Pool Villa room (8-bedroom villa)', pax: 2, keys: 8, rates: { CP: 6750, MAP: 7250, AP: 7750 } },
    },
    extraBed: { CP: 1500, MAP: 2000, AP: 2500 },
    peakDates: CORBETT_PEAK, peakSupplement: 1500,
    blocked: days(range('2026-12-24', '2027-01-01')), blockedReason: 'Christmas and New Year at Tattwaa are sold as festive packages; ask us for the gala rate.',
    freeChildUpTo: 5, deposit: 'corbett',
  },
  nanau: {
    name: 'Nanau Resort & Spa', place: 'Sitabani Gate, Patkote Road, Jim Corbett',
    taxIncluded: true, validFrom: '2026-10-01', validTo: '2027-03-31', plans: ['CP', 'MAP', 'AP'],
    planNote: 'Evening hi-tea included',
    rooms: {
      studio: { label: 'Sitabani Studio with private sit-out', pax: 2, keys: 12, rates: { CP: 5500, MAP: 6250, AP: 7000 } },
      jungle: { label: 'Jungle Suite with two twin beds', pax: 2, keys: 4, rates: { CP: 5500, MAP: 6250, AP: 7000 } },
      pebble: { label: 'Pebble Path Cottage with plunge pool', pax: 2, keys: 3, rates: { CP: 6250, MAP: 7000, AP: 7750 } },
      suite1: { label: 'Nanau Suite with plunge pool and bathtub', pax: 2, keys: 1, rates: { CP: 7750, MAP: 9000, AP: 10000 } },
      apartment: { label: 'Two-bedroom Jungle Apartment (4 guests)', pax: 4, keys: 1, rates: { CP: 11000, MAP: 12500, AP: 14000 } },
      suite2: { label: 'Two-bedroom Nanau Suite, plunge pool and bathtub (4 guests)', pax: 4, keys: 1, rates: { CP: 13000, MAP: 14500, AP: 16000 } },
    },
    extraBed: { CP: 1000, MAP: 1500, AP: 2000 },
    peakDates: CORBETT_PEAK, peakSupplement: 1500,
    freeChildUpTo: 7, deposit: 'corbett',
  },
  padma: {
    name: 'Padma Villa, a private mountain estate', place: 'Naggar Road, Manali',
    taxIncluded: false, validFrom: '2026-10-01', validTo: '2027-03-31', plans: ['EP', 'CP', 'MAP'],
    rooms: {
      royal: { label: 'Royal Chamber, forest and mountain view', pax: 2, keys: 4, rates: { EP: 5000, CP: 5500, MAP: 6500 }, peak: { EP: 6250, CP: 6875, MAP: 8125 } },
      king: { label: 'King Suite with bathtub and private balcony', pax: 2, keys: 1, rates: { EP: 9999, CP: 9999, MAP: 11000 }, peak: { EP: 12500, CP: 12500, MAP: 13750 } },
      glass: { label: 'Glass Suite (sky view) with jacuzzi', pax: 2, keys: 1, rates: { EP: 12500, CP: 12500, MAP: 13500 }, peak: { EP: 15625, CP: 15625, MAP: 16875 } },
      villa: { label: 'Entire 6-bedroom villa (up to 12 guests)', pax: 12, keys: 1, exclusive: true, rates: { EP: 39999, CP: 45000, MAP: 49999 }, peak: { EP: 49999, CP: 56250, MAP: 62500 } },
    },
    extraBed: { EP: 1500, CP: 1500, MAP: 2000 }, extraBedPeak: { EP: 2000, CP: 2000, MAP: 2500 },
    /* Blackout table applies 18 Dec - 10 Jan and on the sheet's listed long weekends; those bookings are non-refundable. */
    peakDates: days(range('2026-12-18', '2027-01-10'), ['2026-11-06', '2026-11-07'], range('2027-01-22', '2027-01-25'), range('2027-03-19', '2027-03-21'), range('2027-03-25', '2027-03-27')),
    peakTable: true, peakNonRefundable: true,
    freeChildUpTo: 12, deposit: 'padma',
  },
  aramness: {
    name: 'Aramness Gir', place: 'Gir National Park, Gujarat',
    taxIncluded: true, validFrom: '2026-11-13', validTo: '2027-02-28', plans: ['AP'],
    rooms: {
      kothi: { label: 'Kothi with private pool (1 bedroom)', pax: 2, rates: { AP: 72216 }, peak: { AP: 74765 }, rack: 84960 },
      family: { label: 'Family Kothi with private pool (2 bedrooms, 4 guests)', pax: 4, rates: { AP: 97793 }, peak: { AP: 101244 }, rack: 115050 },
    },
    peakDates: days(range('2026-11-05', '2026-11-11'), range('2026-12-24', '2027-01-02')), peakTable: true,
    perStayFee: { label: 'Conservation fee', amount: 1500 }, // per Kothi per stay, tax included
    exclusiveDeal: true, // Amor: promote Gir at rack rate or as an exclusive deal
    freeChildUpTo: 12, childMealsFrom: 6, deposit: 'aramness',
  },
});

/* Priced extras from the Aramness sheet (tax-inclusive costs to RoamWise). Safaris need 100% upfront and are non-refundable. */
const GST18 = (n) => Math.round(n * 1.18);
export const GIR_EXTRAS = Object.freeze({
  keshodTransfer: { label: 'Keshod airport transfer, Innova Crysta (one way)', cost: 5500 },
  rajkotTransfer: { label: 'Rajkot airport transfer, Innova Crysta (one way)', cost: 11500 },
  diuTransfer: { label: 'Diu airport transfer, Innova Crysta (one way)', cost: 8000 },
  girSafari: { label: 'Private Gir National Park safari (up to 6 guests, park entry included)', cost: GST18(18000) + 1000, prepay: true },
  devaliaSafari: { label: 'Private Devalia Park safari (up to 6 guests, park entry included)', cost: GST18(12500) + 1000, prepay: true },
  somnath: { label: 'Somnath temple excursion, 4-5 hours, Innova Crysta', cost: 6000 },
  maldhari: { label: 'Maldhari village visit (60-90 minutes)', cost: GST18(5000) },
  birding: { label: 'Bird-watching walk (60-90 minutes)', cost: GST18(7000) },
});

/* Share of the stay Amor needs at booking, by property policy and days to arrival. RoamWise never collects
 * less than this as an advance, so it never pays a supplier with its own money. */
export function supplierUpfront(policy, daysOut, peak) {
  if (policy === 'corbett') return daysOut > 30 ? 0.30 : daysOut >= 15 ? 0.50 : 1;
  if (policy === 'padma') return daysOut > 7 ? 0.50 : 1;
  if (policy === 'aramness') return daysOut > 30 ? 0.25 : 1;
  return peak ? 1 : 0.25;
}
