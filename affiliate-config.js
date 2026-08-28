/* ============================================================================
   RW_AFFILIATE_PROGRAMS — central affiliate-link registry
   ============================================================================
   ONE place that knows how to turn a plain public URL into a monetised one.
   Nothing here holds a real ID — every program is inert (plain link, zero
   revenue) until its config key is filled in via the admin console / Firestore
   `config/app` doc (see the AFF_* sync block near the bottom of app.js).

   Two kinds of program:

   (A) DIRECT-ID — the merchant's own domain accepts a tracking param straight
       on the URL (Booking's `aid=`, Agoda's `cid=`, ...). Schema:
         { id, label, domain, paramName, region:'india'|'intl'|'both',
           category:'stay'|'flight'|'activity'|'train'|'shop'|'insurance'|'other',
           tpPartner: true|false }
       `tpPartner` records whether we found evidence this merchant is ALSO
       reachable through Travelpayouts (see rwTpWrap below) — checked, not
       assumed, per merchant. Where a paramName is unconfirmed we say so in a
       comment rather than guessing silently; the field is left populated with
       our best research guess so the plumbing works the moment it's verified,
       but ops must re-check it against the live partner dashboard before
       flipping the matching AFF_* key on in production.

   (B) NETWORK-WRAP — generic redirectors that can wrap ANY destination URL
       (Travelpayouts, Cuelinks, EarnKaro, Admitad). These don't need a
       per-program entry; rwAffLink() calls their wrap function directly.

   Research sources (Aug 2026, WebSearch): Viator's `pid` (9-digit account id)
   and SafetyWing's `referenceID` are confirmed from their own partner docs.
   Klook, 12Go Asia, Trip.com, Hostelworld and Yatra/ClearTrip do not publish a
   simple static URL param in public docs (Hostelworld and Trip.com run through
   Partnerize/their own affiliate dashboards, which mint a full tracking link
   rather than a param you append yourself) — flagged "verify before launch"
   below rather than guessed. Amazon.in (`tag=`) and Flipkart (`affid=`) are the
   standard, long-published Associates/affiliate params.
   ========================================================================= */
window.RW_AFFILIATE_PROGRAMS = [
  /* ---- already live in production (kept exactly as-is) ---- */
  { id:'booking',    label:'Booking.com',  domain:'www.booking.com',
    paramName:'aid',        region:'both', category:'stay',     tpPartner:true },
  { id:'agoda',      label:'Agoda',        domain:'www.agoda.com',
    paramName:'cid',        region:'both', category:'stay',     tpPartner:false },
  { id:'gyg',        label:'GetYourGuide', domain:'www.getyourguide.com',
    paramName:'partner_id', region:'both', category:'activity', tpPartner:true },

  /* ---- new direct-ID slots (no real IDs — config-gated, off by default) ---- */
  { id:'skyscanner', label:'Skyscanner',   domain:'www.skyscanner.co.in',
    /* Skyscanner's public affiliate program runs through Partnerize deep
       links, not a static query param — leaving paramName null on purpose so
       rwAffLink() never fabricates one. Revenue path for Skyscanner is the
       Travelpayouts wrap below once/if it's confirmed as a TP partner, or a
       real Partnerize deep link generated from the affiliate dashboard. */
    paramName:null,         region:'both', category:'flight',   tpPartner:false },
  { id:'klook',      label:'Klook',        domain:'www.klook.com',
    paramName:'aid', /* verify exact param name before launch */
    region:'both', category:'activity', tpPartner:false },
  { id:'12go',       label:'12Go Asia',    domain:'www.12go.asia',
    paramName:'ref', /* verify exact param name before launch */
    region:'intl',  category:'train',    tpPartner:false },
  { id:'viator',     label:'Viator',       domain:'www.viator.com',
    paramName:'pid', /* confirmed: Viator's 9-digit affiliate account id */
    region:'both', category:'activity', tpPartner:false },
  { id:'safetywing', label:'SafetyWing',   domain:'safetywing.com',
    paramName:'referenceID', /* confirmed via SafetyWing's own ambassador docs */
    region:'both', category:'insurance', tpPartner:false },
  { id:'tripcom',    label:'Trip.com',     domain:'www.trip.com',
    paramName:'Allid', /* verify exact param name before launch */
    region:'both', category:'other',    tpPartner:true },
  { id:'hostelworld',label:'Hostelworld',  domain:'www.hostelworld.com',
    paramName:null, /* runs through Partnerize's own link generator, not a
                        static param — verify before launch; falls back to
                        the Travelpayouts wrap since Hostelworld is a
                        confirmed Travelpayouts offer */
    region:'intl',  category:'stay',     tpPartner:true },
  { id:'amazonin',   label:'Amazon.in',    domain:'www.amazon.in',
    paramName:'tag',        region:'india', category:'shop',    tpPartner:false },
  { id:'flipkart',   label:'Flipkart',     domain:'www.flipkart.com',
    paramName:'affid',      region:'india', category:'shop',    tpPartner:false },
  { id:'yatra',      label:'Yatra',        domain:'www.yatra.com',
    paramName:'ref', /* verify exact param name before launch */
    region:'india', category:'other',    tpPartner:false },
  { id:'cleartrip',  label:'ClearTrip',    domain:'www.cleartrip.com',
    paramName:'ref', /* verify exact param name before launch */
    region:'india', category:'other',    tpPartner:false },

  /* Uber: has a real publisher affiliate program (developer.uber.com/docs/
     riders/affiliate-program) and turns up as a live campaign on Cuelinks
     and EarnKaro — confirmed via WebSearch, Aug 2026. No stable direct URL
     param is publicly documented, so paramName stays null; this entry only
     exists so rwAffLink() can route Uber links through a generic network
     wrap (Cuelinks/EarnKaro/Admitad) if one is configured — never a
     fabricated direct param. Ola was checked too: its only public program is
     a rider-to-rider "refer and earn" credit scheme, not a publisher
     affiliate program, so it deliberately has no entry here and its links
     stay plain. */
  { id:'uber',       label:'Uber',         domain:'m.uber.com',
    paramName:null,          region:'both',  category:'other',   tpPartner:false }
];

/* ==================== GENERIC NETWORK WRAPS ====================
   Each wrap is a passthrough (returns destUrl unchanged) until its own
   config key is set — so turning one on never accidentally double-wraps a
   link meant for a different network. rwAffLink() in app.js is responsible
   for picking exactly ONE of these (or a direct-ID param) per link. */

/* ---- Travelpayouts (marker-based deep link) ----
   Reuses the existing AFF_TRAVELPAYOUTS config key (already synced from
   Firestore config/app) as the marker id — one signup already covers
   Booking.com, GetYourGuide, Trip.com and Hostelworld per Travelpayouts'
   published brand list (checked via WebSearch, Aug 2026); Agoda, Skyscanner
   and Rome2Rio were NOT confirmed as Travelpayouts brands, so they are
   marked tpPartner:false above rather than assumed. */
function rwTpWrap(destUrl){
  if(typeof AFF_TRAVELPAYOUTS==='undefined' || !AFF_TRAVELPAYOUTS) return destUrl;
  return 'https://tp.media/click?marker='+encodeURIComponent(AFF_TRAVELPAYOUTS)+'&url='+encodeURIComponent(destUrl);
}

/* ---- Cuelinks ----
   PATTERN NOT PUBLICLY DOCUMENTED with certainty (dashboard mints links per
   click, no stable public redirect template found via WebSearch) — this is
   the commonly reported / commonly used shape (go.cuelinks.com/?url=...);
   RE-VERIFY AGAINST THE LIVE CUELINKS DASHBOARD BEFORE REAL LAUNCH. */
function rwCuelinksWrap(destUrl){
  if(typeof AFF_CUELINKS==='undefined' || !AFF_CUELINKS) return destUrl;
  return 'https://go.cuelinks.com/'+encodeURIComponent(AFF_CUELINKS)+'/?url='+encodeURIComponent(destUrl);
}

/* ---- EarnKaro ----
   Same caveat as Cuelinks — pattern below is the commonly reported shape,
   NOT confirmed from EarnKaro's own technical docs. RE-VERIFY BEFORE LAUNCH. */
function rwEarnKaroWrap(destUrl){
  if(typeof AFF_EARNKARO==='undefined' || !AFF_EARNKARO) return destUrl;
  return 'https://earnkaro.com/?ref='+encodeURIComponent(AFF_EARNKARO)+'&url='+encodeURIComponent(destUrl);
}

/* ---- Admitad ----
   CONFIRMED format via Admitad's own deeplink docs (developers.admitad.com):
   https://ad.admitad.com/g/<CAMPAIGN_CODE>/?ulp=<url-encoded destination> */
function rwAdmitadWrap(destUrl){
  if(typeof AFF_ADMITAD==='undefined' || !AFF_ADMITAD) return destUrl;
  return 'https://ad.admitad.com/g/'+encodeURIComponent(AFF_ADMITAD)+'/?ulp='+encodeURIComponent(destUrl);
}
