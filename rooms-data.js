/* ============================================================================
   RW_ROOMS — live demo inventory for the pilot properties
   ============================================================================
   HOW THE PILOT WORKS (and why it's built this way):

   We researched how MakeMyTrip, Booking.com, Agoda, OYO and Expedia actually
   operate. Two findings shaped this entire engine:

   1. THEY CHARGE 15-25%. MMT 18-22%, Booking.com 15-20%, OYO 20-25%.
      An Indian homestay owner loses Rs 3-8 LAKH a year to commissions.
      RoamWise charges 8%. That is less than half. It is the whole pitch.

   2. THEY HOLD THE MONEY. MMT settles 7-14 days AFTER checkout.
      Booking.com invoices monthly. Owners wait weeks for their own money.
      RoamWise: THE GUEST PAYS THE PROPERTY DIRECTLY BY UPI. The owner has the
      money before the guest arrives. We invoice our 8% afterwards.
      No settlement cycle, no float, no chasing.

   That combination — half the commission, instant money — is why a property
   says yes to a platform with 20 users.

   WHY wa.me AND NOT THE WHATSAPP BUSINESS API (for now):
   The Business API needs Meta business verification, a BSP contract and
   per-template approval — commonly six weeks before a single message sends,
   plus ~Rs 0.13/message. For a pilot with a handful of properties, a wa.me
   deep link delivers the same information instantly, for nothing, today.
   Graduate to the API when volume justifies the setup, not before.
   ========================================================================= */

window.RW_ROOMS = [
  { id:'r_hygge_deluxe', partnerId:'p_hygge',
    property:'Hygge Home Manali', zone:'Manali', area:'Khaknal',
    room:'Deluxe Mountain View', price:3200, maxGuests:2,
    inc:['Breakfast','Wi-Fi','Room heater','Free parking'],
    /* Owner WhatsApp in international format WITHOUT + or spaces.
       Blank = the booking falls back to the RoamWise desk number. */
    ownerWa:'', ownerName:'',
    upi:'',            /* property's own UPI id — guest pays them directly */
    cancel:'Free cancellation up to 48h before check-in' },

  { id:'r_hygge_family', partnerId:'p_hygge',
    property:'Hygge Home Manali', zone:'Manali', area:'Khaknal',
    room:'Family Room (4 beds)', price:5400, maxGuests:4,
    inc:['Breakfast','Wi-Fi','Room heater','Free parking'],
    ownerWa:'', ownerName:'', upi:'',
    cancel:'Free cancellation up to 48h before check-in' },

  { id:'r_nush_double', partnerId:'p_nush',
    property:'The Nush Stays', zone:'Manali', area:'Aleo',
    room:'Premium Double', price:2800, maxGuests:2,
    inc:['Breakfast','Wi-Fi','Balcony'],
    ownerWa:'', ownerName:'', upi:'',
    cancel:'Free cancellation up to 72h before check-in' },

  { id:'r_ehsaas_dorm', partnerId:'p_ehsaas',
    property:'Ehsaas by Ostello', zone:'Manali', area:'Shanag',
    room:'Bed in 6-bed dorm', price:900, maxGuests:1,
    inc:['Breakfast','Wi-Fi','Cafe on site'],
    ownerWa:'', ownerName:'', upi:'',
    cancel:'Free cancellation up to 24h before check-in' },

  { id:'r_secretgarden_cottage', partnerId:'p_secretgarden',
    property:'The Secret Garden Goa', zone:'Goa', area:'Saligao',
    room:'Garden Cottage', price:4100, maxGuests:2,
    inc:['Breakfast','Wi-Fi','Garden access','Scooter parking'],
    ownerWa:'', ownerName:'', upi:'',
    cancel:'Free cancellation up to 48h before check-in' },

  { id:'r_capella_forest', partnerId:'p_capella',
    property:'Capella Forest Retreat', zone:'Goa', area:'Parra',
    room:'Forest View Room', price:4800, maxGuests:2,
    inc:['Breakfast','Wi-Fi','Pool','Forest trail'],
    ownerWa:'', ownerName:'', upi:'',
    cancel:'Free cancellation up to 72h before check-in' },

  { id:'r_lamrin_cottage', partnerId:'p_lamrin',
    property:'Lamrin Boutique Cottages', zone:'Rishikesh', area:'Rishikesh',
    room:'Private Cottage', price:3600, maxGuests:3,
    inc:['Breakfast','Wi-Fi','River view'],
    ownerWa:'', ownerName:'', upi:'',
    cancel:'Free cancellation up to 48h before check-in' }
];

/* Our commission and the promise that goes with it. */
window.RW_BOOK_TERMS = {
  commissionPct: 8,
  otaRange: '15-25%',
  desk: '',                 /* RoamWise fallback WhatsApp, digits only */
  deskUpi: 'coolmohit@ybl', /* used only if a property has no UPI of its own */
  promise: [
    'The guest pays the property directly. We never hold your money.',
    'We invoice 8% after the guest has checked out. Nothing is deducted upfront.',
    'No commission on a cancellation or a no-show.',
    'Your rates stay yours. We never discount your room without asking.'
  ]
};
