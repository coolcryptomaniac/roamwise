/* ============================================================================
   QUIET HIMALAYA — RoamWise's curated collection for readers, writers,
   researchers, yoga and meditation travellers, and anyone who wants peace,
   good service and an honest bill.
   ----------------------------------------------------------------------------
   Picks point at partner ids in partners-data.js; the page and Tusk read name,
   area, booking route and nomad numbers from there, never from here. "why"
   lines restate only what the partner record, the host or a public listing
   says. Yoga and meditation are listed as NEARBY places (with sources), not
   as amenities, because no partner has stated an on-site class yet.

   Update rule: a pick needs a reason taken from its record; a nearby place
   needs a source URL. Remove a pick if the partner is delisted.
   ========================================================================== */
var RW_QUIET = {
  tags: [
    { id: 'silence', label: 'Silence', icon: '🤫' },
    { id: 'focus', label: 'Work-ready Wi-Fi', icon: '📶' },
    { id: 'reading', label: 'Read and write', icon: '📚' },
    { id: 'mind', label: 'Yoga and meditation nearby', icon: '🧘' },
    { id: 'meals', label: 'Home-cooked meals', icon: '🍲' },
    { id: 'nature', label: 'Forest and orchard', icon: '🌲' }
  ],
  pledge: [
    'The total you see is the property’s own rate. RoamWise adds Rs 0 to it: no convenience fee, no fee revealed at checkout.',
    'Your request asks the host to confirm the final total, including any applicable taxes, in writing on WhatsApp before you pay anything.',
    'You pay the property directly, as agreed with the host. RoamWise never holds your money.',
    'Each stay shows its real status: signed with RoamWise, founder-introduced, or listed and not yet signed.'
  ],
  picks: [
    { partnerId: 'p_woodbook_devine', tags: ['silence', 'nature', 'reading'],
      why: 'Treehouse and cottage in an apple orchard at Galoon, Banjar side of Tirthan Valley, near the Laida waterfall. Outdoor fireplace, forest views, five rooms.' },
    { partnerId: 'p_soulmate_homestay', tags: ['silence', 'meals'],
      why: 'Village homestay in Kotyura, Almora, with a local host and Kumaoni home cooking. Marked quiet in its listing.' },
    { partnerId: 'p_big_bro_hotel', tags: ['focus', 'meals'],
      why: 'Long stays of 15 nights or more in Ghurson, Almora. The host states 100 Mbps Wi-Fi, full power backup, a quiet call room and meals (not yet speed-test verified).' },
    { partnerId: 'p_corbett_jungle_view', tags: ['silence', 'nature'],
      why: 'Six-bedroom family homestay in Ghildiyal Gaon near Bansi, Lansdowne. Public listings mention Wi-Fi and kitchen access. Enquiries only while the agreement is pending.' },
    { partnerId: 'p_hygge', tags: ['silence', 'reading', 'nature'],
      why: 'Six-room slow-travel hotel in Khaknal, Manali, with orchard views, glass-roof stargazing rooms and breakfast included. Listed; RoamWise confirms rates on request.' },
    { partnerId: 'p_tranquility', tags: ['silence'],
      why: 'Homestay in Siyal, Manali, known for a quiet mountain setting. Listed; RoamWise confirms rates on request.' }
  ],
  nearby: [
    { name: 'Tushita Meditation Centre', place: 'Dharamkot, above McLeod Ganj', tags: ['mind'],
      what: 'Introduction to Buddhism and intermediate meditation courses in a forest setting.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Tushita_Meditation_Centre' },
    { name: 'Himalayan Writing Retreat', place: 'Satkhol, near Mukteshwar', tags: ['reading'],
      what: 'Residential space for writers at about 1,950 m, with courses in poetry, writing, translation and storytelling.',
      sourceUrl: 'https://www.ifindia.in/villa-swagatam/the-himalayan-writing-retreat.php' }
  ]
};
if (typeof module !== 'undefined' && module.exports) module.exports = { RW_QUIET: RW_QUIET };
