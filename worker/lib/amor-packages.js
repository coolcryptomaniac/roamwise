/* Curated Amor packages for winter 2026-27. Prices are NOT written here: the Worker prices every package
 * from the net rate sheets for the guest's exact dates (season, peak nights, blackout tables, supplements).
 * `extras.cost` is RoamWise's own tax-inclusive cost and stays on the server; `ref` extras take their cost from the
 * sealed rate book (lodge price list).
 * Celebration / wedding budgets are pass-through money RoamWise spends with the property or local vendors on
 * the couple's behalf (itemised receipts), so their cost is exactly the amount shown.
 * Seasonality used: Indian wedding season (late Nov-Feb) drives honeymoons Dec-Mar; Manali snowfall is likeliest
 * late Dec-Feb; Corbett is at its best Nov-Mar; Gir is open 16 Oct-15 Jun (Aramness winter rates to 28 Feb). */

const pkg = (o) => Object.freeze({ guestsPerRoom: 2, ...o });

export const PACKAGES = Object.freeze({
  /* ---------- Honeymoon ---------- */
  'manali-snow-honeymoon': pkg({
    id: 'manali-snow-honeymoon', group: 'honeymoon', name: 'Manali Snowfall Honeymoon', nightsLabel: '4 days / 3 nights',
    tagline: 'A private mountain estate, a bathtub suite and a candle-lit dinner in the snow',
    legs: [{ stay: 'padma', room: 'king', plan: 'MAP', nights: 3 }],
    extras: [{ label: 'Celebration credit Rs 3,000: candle-light dinner or cake and room décor, arranged by the villa', cost: 3000, public: 3000 }],
    best: 'Dec-Feb for the best chance of snow', photo: 'padma',
    includes: ['3 nights in the King Suite with bathtub and private balcony', 'Breakfast and dinner daily, cooked to order', 'Candle-light dinner or cake and décor', 'Bonfire evenings on request', 'All taxes'],
  }),
  'manali-glass-suite': pkg({
    id: 'manali-glass-suite', group: 'honeymoon', name: 'Glass Suite Under the Stars', nightsLabel: '4 days / 3 nights',
    tagline: 'Sky-view glass suite with a private jacuzzi above Naggar Road',
    legs: [{ stay: 'padma', room: 'glass', plan: 'MAP', nights: 3 }],
    extras: [{ label: 'Celebration credit Rs 5,000: candle-light dinner, bonfire and barbeque evening', cost: 5000, public: 5000 }],
    best: 'Clear winter skies, Nov-Feb', photo: 'padma',
    includes: ['3 nights in the Glass Suite (sky view, jacuzzi)', 'Breakfast and dinner daily', 'Candle-light dinner, bonfire and barbeque evening', 'Pet-friendly suite, no pet charge', 'All taxes'],
  }),
  'corbett-plunge-honeymoon': pkg({
    id: 'corbett-plunge-honeymoon', group: 'honeymoon', name: 'Jungle Plunge-Pool Honeymoon', nightsLabel: '4 days / 3 nights',
    tagline: 'Your own plunge pool at the edge of the Sitabani sal forest',
    legs: [{ stay: 'nanau', room: 'pebble', plan: 'MAP', nights: 3 }],
    extras: [{ label: 'Spa and celebration credit Rs 4,000 (partner rate: 15% off all spa, food and drinks)', cost: 4000, public: 4000 }],
    best: 'Nov-Mar', photo: 'nanau',
    includes: ['3 nights in a Pebble Path Cottage with private plunge pool', 'Breakfast, dinner and evening hi-tea', 'Rs 4,000 spa and celebration credit, plus 15% off every extra', 'Indoor pool, spa and game zone; pet-friendly cottage', 'All taxes'],
  }),
  'gir-lion-honeymoon': pkg({
    id: 'gir-lion-honeymoon', group: 'honeymoon', name: 'Lions & a Private Pool, Gir', nightsLabel: '3 days / 2 nights', exclusiveDeal: true,
    tagline: 'A private-pool Kothi, all meals and your own Gir lion safari',
    legs: [{ stay: 'aramness', room: 'kothi', plan: 'AP', nights: 2 }],
    extras: [{ ref: 'keshodTransfer', label: 'Keshod airport pickup' }, { ref: 'keshodTransfer', label: 'Keshod airport drop' }, { ref: 'girSafari' }],
    best: 'Nov-Feb (park open from 16 Oct)', photo: 'aramness', window: { from: '2026-11-13', to: '2027-02-27' },
    includes: ['2 nights in a Kothi with private pool', 'Breakfast, lunch and dinner', 'One private Gir safari with park entry (permit on ID, subject to forest department allocation)', 'Keshod airport pickup and drop by Innova Crysta', 'Conservation fee and all taxes'],
  }),

  /* ---------- Family and high-spend ---------- */
  'corbett-forest-duo': pkg({
    id: 'corbett-forest-duo', group: 'family', name: 'Corbett Forest Duo', nightsLabel: '5 days / 4 nights', rooms: { max: 4 },
    tagline: 'Two forest resorts, one trip: pool and lawns at Tattwaa, plunge pools and spa at Nanau',
    legs: [{ stay: 'tattwaa', room: 'premium', plan: 'MAP', nights: 2 }, { stay: 'nanau', room: 'pebble', plan: 'MAP', nights: 2 }],
    extras: [{ label: 'Resort-to-resort transfer (short drive near Sitabani)', cost: 2000 }],
    best: 'Nov-Mar', photo: 'tattwaa',
    includes: ['2 nights Premium Room at Tattwaa (pool, game zone)', '2 nights Pebble Path Cottage with plunge pool at Nanau', 'Breakfast, dinner and hi-tea daily', 'Transfer between the resorts', 'Kids up to 5 stay free on the parents\' bed', 'All taxes'],
  }),
  'corbett-family-suite': pkg({
    id: 'corbett-family-suite', group: 'family', name: 'Corbett Family Suite Holiday', nightsLabel: '4 days / 3 nights', guestsPerRoom: 4,
    tagline: 'Two bedrooms, a plunge pool, an indoor pool and a private movie room for the kids',
    legs: [{ stay: 'nanau', room: 'suite2', plan: 'MAP', nights: 3 }],
    extras: [{ label: 'Family experience credit Rs 3,000: guided nature walk, village visit or movie night', cost: 3000, public: 3000 }],
    best: 'School holidays: late Dec, Feb-Mar', photo: 'nanau',
    includes: ['3 nights in the two-bedroom Nanau Suite (4 guests, plunge pool, bathtub)', 'Breakfast, dinner and hi-tea', 'Rs 3,000 family experience credit', 'One child up to 7 free', 'Indoor pool, game zone, private movie setup', 'All taxes'],
  }),
  'gir-family-safari': pkg({
    id: 'gir-family-safari', group: 'family', name: 'Gir Family Lion Safari', nightsLabel: '4 days / 3 nights', guestsPerRoom: 4, exclusiveDeal: true,
    tagline: 'Two safaris, Somnath darshan and a two-bedroom private-pool Kothi',
    legs: [{ stay: 'aramness', room: 'family', plan: 'AP', nights: 3 }],
    extras: [{ ref: 'keshodTransfer', label: 'Keshod airport pickup' }, { ref: 'keshodTransfer', label: 'Keshod airport drop' }, { ref: 'girSafari' }, { ref: 'devaliaSafari' }, { ref: 'somnath' }],
    best: 'Nov-Feb', photo: 'aramness', window: { from: '2026-11-13', to: '2027-02-26' },
    includes: ['3 nights in a Family Kothi (2 bedrooms, private pool, 4 guests)', 'All meals', 'Private Gir safari and private Devalia safari, park entry included', 'Somnath temple excursion', 'Keshod airport pickup and drop', 'One child up to 12 free on the parents\' bed', 'Conservation fee and all taxes'],
  }),
  'padma-villa-takeover': pkg({
    id: 'padma-villa-takeover', group: 'family', name: 'Private Villa Takeover, Manali', nightsLabel: '3 days / 2 nights', guestsPerRoom: 12, extraGuests: 8,
    tagline: 'All six rooms of Padma Villa for your family or friends, up to 12 guests (20 with extra beds)',
    legs: [{ stay: 'padma', room: 'villa', plan: 'MAP', nights: 2 }],
    extras: [{ label: 'Bonfire and barbeque night for the group (Rs 6,000 credit)', cost: 6000, public: 6000 }],
    best: 'Oct-Mar; snow Dec-Feb', photo: 'padma',
    includes: ['The entire 6-bedroom villa, just your group', 'Breakfast and dinner, cooked to order', 'Bonfire and barbeque night', 'Pet-friendly', 'All taxes'],
  }),

  /* ---------- Circuits ---------- */
  'jungle-to-snow': pkg({
    id: 'jungle-to-snow', group: 'circuit', name: 'Jungle to Snow Grand Honeymoon', nightsLabel: '7 days / 5 hotel nights',
    tagline: 'Corbett plunge pool, then Manali\'s glass suite: forest and snow in one trip',
    legs: [{ stay: 'nanau', room: 'pebble', plan: 'MAP', nights: 2 }, { stay: 'padma', room: 'glass', plan: 'MAP', nights: 3, gapBefore: 1 }],
    extras: [{ label: 'Celebration credit Rs 5,000 at Padma Villa: candle-light dinner and bonfire', cost: 5000, public: 5000 }],
    best: 'Dec-Feb', photo: 'padma',
    includes: ['2 nights Pebble Path Cottage with plunge pool, Nanau (Corbett)', '1 travel day (overnight Volvo or flight via Delhi; not included, we can quote)', '3 nights Glass Suite with jacuzzi, Padma Villa (Manali)', 'Breakfast and dinner at both', 'Candle-light dinner and bonfire', 'All taxes'],
  }),
  'manali-white-christmas': pkg({
    id: 'manali-white-christmas', group: 'festive', name: 'White Christmas & New Year, Manali', nightsLabel: '5 days / 4 nights', rooms: { max: 4 },
    tagline: 'Four winter nights at a private estate, with a New Year bonfire and cake',
    legs: [{ stay: 'padma', room: 'royal', plan: 'MAP', nights: 4 }],
    extras: [{ label: 'New Year bonfire and cake (Rs 4,000 credit)', cost: 4000, public: 4000 }],
    best: 'Starts 18 Dec - 6 Jan', photo: 'padma', window: { from: '2026-12-18', to: '2027-01-06' },
    includes: ['4 nights Royal Chamber (forest and mountain view)', 'Breakfast and dinner daily', 'Bonfire night and celebration cake', 'All taxes'],
    note: 'Festive dates are non-refundable at the property (Padma blackout policy).',
  }),

  /* ---------- Destination weddings at Padma Villa (whole-villa buyout) ---------- */
  'manali-mountain-pheras': pkg({
    id: 'manali-mountain-pheras', group: 'wedding', name: 'Mountain Pheras: Intimate Elopement', nightsLabel: '3 days / 2 nights', guestsPerRoom: 12, extraGuests: 8,
    tagline: 'Pheras on a Himalayan lawn with your closest 12 (up to 20 with extra beds)',
    legs: [{ stay: 'padma', room: 'villa', plan: 'MAP', nights: 2 }],
    extras: [{ label: 'Wedding budget Rs 75,000: mandap décor, pandit ji and samagri, photographer (1 day), mehendi artist, wedding cake', cost: 75000, budget: true }],
    best: 'Oct-Nov and Feb-Mar (clear days, before and after peak snow)', photo: 'padma',
    includes: ['Whole villa for 2 nights, only your guests', 'Breakfast and dinner for everyone', 'Rs 75,000 wedding budget spent by RoamWise with receipts: décor, pandit, photographer, mehendi, cake', 'A RoamWise coordinator on WhatsApp from booking to send-off', 'All taxes'],
    note: 'Event use is confirmed by the villa in writing before the date is locked; if not approved you get a full refund. Music outdoors ends by 10 pm.',
  }),
  'manali-intimate-wedding': pkg({
    id: 'manali-intimate-wedding', group: 'wedding', name: 'Intimate Himalayan Wedding Weekend', nightsLabel: '4 days / 3 nights', guestsPerRoom: 12, extraGuests: 8,
    tagline: 'Haldi, mehendi, pheras and a bonfire sangeet: three days, one private estate',
    legs: [{ stay: 'padma', room: 'villa', plan: 'MAP', nights: 3 }],
    extras: [{ label: 'Wedding budget Rs 1,75,000: haldi and mehendi décor, mandap, pandit ji, photo and video (2 days), DJ and sound for the sangeet, bonfire barbeque, cake', cost: 175000, budget: true }],
    best: 'Oct-Nov and Feb-Mar', photo: 'padma',
    includes: ['Whole villa for 3 nights', 'Breakfast and dinner for all guests', 'Rs 1,75,000 wedding budget: haldi, mehendi, mandap, pandit, photo and video, sangeet sound, bonfire barbeque, cake', 'Coordinator from booking to send-off', 'All taxes'],
    note: 'Event use is confirmed by the villa in writing before the date is locked; if not approved you get a full refund. Music outdoors ends by 10 pm.',
  }),
  'manali-signature-wedding': pkg({
    id: 'manali-signature-wedding', group: 'wedding', name: 'Signature Snow Wedding', nightsLabel: '5 days / 4 nights', guestsPerRoom: 12, extraGuests: 8,
    tagline: 'A four-night wedding in the snow season with full décor, florals and a film',
    legs: [{ stay: 'padma', room: 'villa', plan: 'MAP', nights: 4 }],
    extras: [{ label: 'Wedding budget Rs 3,50,000: florals and full décor for every function, mandap, pandit ji, wedding film and photos (3 days), live musician and DJ, makeup artist, welcome hampers, cake', cost: 350000, budget: true }],
    best: 'Late Jan-Feb for snow (outside the 18 Dec-10 Jan blackout)', photo: 'padma',
    includes: ['Whole villa for 4 nights', 'Breakfast and dinner for all guests', 'Rs 3,50,000 wedding budget: florals, décor, mandap, pandit, film and photos, live music, makeup, hampers, cake', 'Coordinator from booking to send-off', 'All taxes'],
    note: 'Event use is confirmed by the villa in writing before the date is locked; if not approved you get a full refund. Music outdoors ends by 10 pm. Snow is never guaranteed.',
  }),
});

/* Browser-safe view: no costs. */
export function publicPackages() {
  return Object.values(PACKAGES).map((k) => ({
    id: k.id, group: k.group, name: k.name, nightsLabel: k.nightsLabel, tagline: k.tagline, best: k.best, photo: k.photo,
    includes: k.includes, note: k.note || null, exclusiveDeal: !!k.exclusiveDeal, window: k.window || null,
    rooms: k.rooms ? k.rooms.max : 1, extraGuests: k.extraGuests || 0, guestsPerRoom: k.guestsPerRoom,
  }));
}
