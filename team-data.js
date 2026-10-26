/* ============================================================================
   TEAM & INVESTORS — EDIT THIS FILE ONLY.
   To add someone: copy a block, change the values, save. Nothing else to touch.

   photo   : put the image in /team/ and write "team/name.webp"
             (leave "" and the page shows a branded monogram instead)
   links   : linkedin / twitter / instagram / website / email are optional
   funRole : optional human title shown as a small secondary badge
   ========================================================================= */

window.RW_TEAM = [
  {
    name: "Mohit Pandey",
    role: "Founder",
    funRole: "Operating behind the scenes",
    photo: "/team/mohit-pandey.webp",
    photoPosition: "50% 50%",
    bio: "Leads RoamWise across product, technology, partnerships and day-to-day operations — building quietly from the Himalayas.",
    links: { linkedin: "https://www.linkedin.com/in/rockermohit/", website: "/about.html#founder", email: "founder@roamwise.co.in" }
  },
  {
    name: "Febin",
    role: "Content & Growth",
    funRole: "Content Ninja",
    photo: "/team/febin.webp",
    photoPosition: "50% 28%",
    bio: "Turns travel insight into useful stories, campaigns and community feedback that help RoamWise grow with clarity.",
    links: { linkedin: "", email: "febin@roamwise.co.in" }
  },
  {
    name: "Deepanshi",
    role: "B2B Partnerships",
    funRole: "B2B Legal Ninja",
    photo: "/team/deepanshi.webp",
    photoPosition: "50% 34%",
    bio: "Builds thoughtful property and institutional partnerships, from the first conversation to fair, clearly documented agreements.",
    links: { linkedin: "", email: "deepanshi@roamwise.co.in" }
  }
];

/* Investors & advisors. Same shape. Leave the array empty [] to hide the whole
   section automatically. They also appear on The Rope Team page (/rope/),
   which reads these optional extra fields:
     kind   : "Investor" or "Advisor"
     holds  : what they help RoamWise with, in a few words
     joined : "2026-11" (year-month they signed)
     note   : why they joined, in THEIR OWN words, only with their permission
   Only add someone after they have signed. Example (copy, fill, uncomment):
   {
     name: "Full Name", kind: "Advisor", role: "Advisor, travel distribution",
     holds: "OTA and hotel-chain partnerships", photo: "/team/full-name.webp",
     photoPosition: "50% 35%", joined: "2026-11",
     bio: "Two short sentences about their work.",
     note: "",
     links: { linkedin: "https://www.linkedin.com/in/...", website: "" }
   }
*/
window.RW_INVESTORS = [];

/* Open seats on The Rope Team page. Remove a seat once it is filled. */
window.RW_ROPE_SEATS = [
  { kind: "Advisor", title: "Travel distribution", need: "Someone who has grown bookings with OTAs, hotel chains or a tourism board in India." },
  { kind: "Advisor", title: "Payments and compliance", need: "GST, payment gateways, split settlements to property owners, and staying on the right side of RBI rules." },
  { kind: "Advisor", title: "Himalayan hospitality", need: "Knows homestays and small hotels in the hills, and how to bring hundreds of them on board fairly." },
  { kind: "Advisor", title: "AI and infrastructure", need: "Has run AI products at scale and can keep a lean stack fast, cheap and reliable." },
  { kind: "Advisor", title: "Brand and creators", need: "Has built an Indian consumer brand with creators and communities rather than paid ads." },
  { kind: "Advisor", title: "Visual storytelling and short-form content", need: "A photographer and short-form producer who sets how stays, treks and creator reels look and feel on RoamWise. A quarterly role: a few reviews a year, not day-to-day work." },
  { kind: "Investor", title: "Angel investor", need: "Backs India-first consumer products early. The current round terms are public on the invest page." }
];

/* Page-level content kept here so future team updates stay in one place. */
window.RW_TEAM_INTRO =
  "A founder-led team combining product, content and partnerships to make travel planning more useful, honest and human.";

window.RW_TEAM_CONTACT = {
  label: "General support",
  email: "support@roamwise.co.in",
  note: "Accounts, bookings, payments and product help"
};

/* Official contacts. ONLY the people listed here speak for RoamWise.
   Keep this in step with RW_TEAM: when someone leaves, remove them here too. */
window.RW_OFFICIAL_CONTACTS = [
  { name: "Febin", role: "Content & Growth (intern)", email: "febin@roamwise.co.in" },
  { name: "Deepanshi", role: "B2B Partnerships (intern)", email: "deepanshi@roamwise.co.in" }
];

window.RW_CONTACT_NOTICE =
  "Be cautious. RoamWise only works with the people listed on this page. We never ask for payment, OTPs, passwords or advance deposits over WhatsApp, Telegram, Instagram or a personal email. If someone claims to represent RoamWise and is not listed here, treat it as unofficial and write to support@roamwise.co.in to check.";
