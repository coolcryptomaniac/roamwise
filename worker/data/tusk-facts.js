/* ============================================================================
   worker/data/tusk-facts.js — Ailon Tusk's VERIFIED facts pack
   ============================================================================
   Every line here was checked against an official or primary source on
   `checkedAt`. Tusk is told to treat these as the only authoritative facts and
   to say "not sure, check <official site>" for anything else.

   Rules for editing (humans and the weekly refresh task alike):
   - One fact per string, short, no marketing. Prefer "about" for dates the
     authority changes each year, and always name the official site.
   - Never add supplier net rates, private phone numbers or WhatsApp numbers.
   - Bump `checkedAt` only after re-checking the source. Set `validUntil` on
     anything seasonal: after that date the item is NOT served (stale facts are
     worse than none) until someone re-checks it.
   - Phone numbers and links Tusk may say are only the ones that appear here
     (see lib/tusk-facts.js guardAnswer).
   ========================================================================= */
export const TUSK_FACTS = {
  v: 1,
  reviewedAt: '2026-11-14',
  items: [
    {
      id: 'emergency-india',
      title: 'Emergency and tourist helplines (India)',
      keys: ['emergency', 'helpline', 'sos', 'police', 'ambulance', 'help number', 'lost my', 'stolen', 'accident', 'tourist help'],
      facts: [
        'All emergencies (police, fire, ambulance): dial 112.',
        'Ambulance: 108 works in most states, including Uttarakhand, Himachal Pradesh and Gujarat.',
        'Ministry of Tourism 24x7 tourist helpline: 1363 or 1800-11-1363 (toll free), in Hindi, English and 10 foreign languages. It also helps in distress and alerts authorities.',
        'For a RoamWise booking problem, open your trip or wallet page on roamwise.co.in; refunds go back to the original payment method.'
      ],
      sources: ['https://www.indembassysweden.gov.in/page/tourist-help-line-in-india/', 'https://112.gov.in'],
      checkedAt: '2026-11-14',
      validUntil: '2027-11-14',
      direct: true
    },
    {
      id: 'gir',
      title: 'Gir National Park (Sasan Gir, Gujarat)',
      keys: ['gir', 'sasan', 'devalia', 'lion safari', 'asiatic lion'],
      facts: [
        'Gir Jungle Safari is closed every year from 16 June to 15 October and reopens on 16 October.',
        'Safari permits are sold ONLY on the official site girlion.gujarat.gov.in; avoid other sites claiming confirmed permits.',
        'Devalia Safari Park (fenced interpretation zone) is closed every Wednesday.',
        'One e-permit covers up to 6 people plus one child aged 3–12. Guide and vehicle are paid separately. E-permits are non-refundable and late reporting cancels them.',
        'Best season: November to March.'
      ],
      sources: ['https://girlion.gujarat.gov.in/AboutGir.aspx', 'https://girlion.gujarat.gov.in/TermsConditions.aspx'],
      checkedAt: '2026-11-14',
      validUntil: '2027-06-15'
    },
    {
      id: 'corbett',
      title: 'Jim Corbett Tiger Reserve (Ramnagar, Uttarakhand)',
      keys: ['corbett', 'jim corbett', 'dhikala', 'bijrani', 'jhirna', 'ramnagar', 'garjia', 'garjiya'],
      facts: [
        'Bijrani and Garjia zones open for day safaris from about 15 October; Dhikala and most other core zones run about 15 November to 15 June.',
        'Jhirna and Dhela zones are open most of the year, subject to weather.',
        'In Dhikala a day visitor can only take the shared Canter; a private jeep inside Dhikala needs a forest rest house night stay.',
        'Safari and night-stay permits are booked only on the official Corbett Tiger Reserve portal (corbettonline.uk.gov.in; info at corbettgov.org). Dhikala sells out within minutes of release.',
        'Nearest railway station: Ramnagar. Kathgodam is the other common rail-head.'
      ],
      sources: ['https://corbettgov.org', 'https://corbettonline.uk.gov.in'],
      checkedAt: '2026-11-14',
      validUntil: '2027-06-15'
    },
    {
      id: 'rohtang-manali',
      title: 'Manali, Rohtang Pass and Atal Tunnel (Himachal Pradesh)',
      keys: ['rohtang', 'manali', 'atal tunnel', 'solang', 'sissu', 'lahaul'],
      facts: [
        'Rohtang Pass is snowbound and closed to tourists from about November to mid-May; the 2026 season opened in mid-May.',
        'Every vehicle going to Rohtang needs an online permit from rohtangpermits.hp.gov.in (the old rohtangpermits.nic.in moved there). Fee is about ₹550 for a car (₹500 permit + ₹50 congestion), with a daily vehicle quota.',
        'Maintenance-day closures (often Tuesday) change each season: check the permit portal for your date.',
        'The Atal Tunnel route to Sissu/Lahaul needs no Rohtang permit, but heavy snow can still shut the road. Check the district administration before driving in winter.'
      ],
      sources: ['https://rohtangpermits.hp.gov.in', 'https://hpkullu.nic.in'],
      checkedAt: '2026-11-14',
      validUntil: '2027-05-31'
    },
    {
      id: 'char-dham-2026',
      title: 'Kedarnath, Badrinath and Char Dham season',
      keys: ['kedarnath', 'badrinath', 'char dham', 'chardham', 'gangotri', 'yamunotri', 'kedar'],
      facts: [
        'The 2026 Kedarnath season ran 22 April to 11 November 2026 (closed on Bhai Dooj). In winter Lord Kedarnath is worshipped at Omkareshwar Temple, Ukhimath.',
        'Gangotri closed on 10 November and Yamunotri on 11 November 2026. Badrinath was announced to close on 16 November 2026.',
        'The shrines reopen around Akshaya Tritiya (April–May). The Kedarnath opening date is announced on Mahashivratri, so the 2027 date is not yet fixed.',
        'Pilgrim registration with the Uttarakhand government is required for the yatra; register only on the official Uttarakhand tourism portal.'
      ],
      sources: ['https://badrinath-kedarnath.gov.in', 'https://newsonair.gov.in/portals-of-gangotri-dham-to-close-for-winter-season/', 'https://registrationandtouristcare.uk.gov.in'],
      checkedAt: '2026-11-14',
      validUntil: '2027-03-31'
    },
    {
      id: 'rishikesh-rafting',
      title: 'Rishikesh river rafting',
      keys: ['rishikesh', 'rafting', 'shivpuri', 'white water'],
      facts: [
        'Rafting on the Ganga at Rishikesh runs about 10 months a year and is suspended in the monsoon, roughly July to mid-September; it can also pause any day the river nears warning level.',
        'Raft only with licensed operators, wear the life jacket and helmet throughout, and follow the guide.'
      ],
      sources: ['https://www.tribuneindia.com/news/uttarakhand/river-rafting-suspended-in-rishikesh-as-ganga-nears-warning-level'],
      checkedAt: '2026-11-14',
      validUntil: '2027-07-01'
    },
    {
      id: 'mountain-safety',
      title: 'Mountain travel safety (Himalaya)',
      keys: ['altitude', 'ams', 'breathless', 'landslide', 'road closed', 'snowfall', 'black ice', 'mountain sickness', 'monsoon travel'],
      facts: [
        'Altitude sickness: stop climbing; if headache, vomiting or breathlessness gets worse, go down and get medical help at once. Call 112 or 108 in an emergency.',
        'Hill roads are risky after dark and in heavy rain; landslides close roads without notice in the monsoon (about July–September).',
        'Check the district administration or state disaster-management updates before driving, and keep a buffer day for road closures.'
      ],
      sources: ['https://112.gov.in', 'https://ndma.gov.in'],
      checkedAt: '2026-11-14',
      validUntil: '2027-11-14'
    },
    {
      id: 'booking-safety',
      title: 'Booking scams and safe payments',
      keys: ['scam', 'fraud', 'fake', 'is this legit', 'genuine', 'cheated', 'advance payment'],
      facts: [
        'Park permits (Gir, Corbett), Rohtang permits and Char Dham registration are sold only on official government sites; agents can help but cannot guarantee quota.',
        'Pay RoamWise only on roamwise.co.in checkout or a payment link that opens on roamwise.co.in. RoamWise never asks for OTPs, card PINs or UPI PINs.',
        'Report cyber fraud at cybercrime.gov.in or call 1930.'
      ],
      sources: ['https://cybercrime.gov.in'],
      checkedAt: '2026-11-14',
      validUntil: '2027-11-14'
    }
  ]
};
