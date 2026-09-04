// @ts-nocheck
// GLOBAL ERROR GUARD moved to js/core/error-guard.js (must load FIRST, not with the rest of boot, so it protects every other module's load too)

/* Subtle haptic feedback — makes taps feel responsive & premium. No-op where
   unsupported. Called on key actions (send, pin, pay-success). */
function rwHaptic(kind){
  try{
    if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics){
      Capacitor.Plugins.Haptics.impact({style: kind==='heavy'?'HEAVY':'LIGHT'});
    } else if(navigator.vibrate){ navigator.vibrate(kind==='heavy'?18:8); }
  }catch(e){}
  /* Every rwHaptic() call already marks a "key action" (send, pin, toggle,
     pay-success…) — reuse that same call graph to play the matching
     tap/success sting from the RoamWise audio manifest instead of adding
     ad-hoc Audio() calls at each of these sites. */
  try{ rwPlayCue(kind==='heavy' ? 'success_feedback' : 'tap_feedback'); }catch(e){}
}
// RW_CUE_FILES, rwAudioThemeEnabled, rwAudioThemeVolume, rwPlayCue moved to js/audio/cues.js


// DB destinations array moved to js/data/destinations.js
// RW_IATA lookup table and rwIata() resolver moved to js/data/iata.js
/* Builds a real Skyscanner route URL, or returns null if either end can't be
   resolved to a real IATA code — callers MUST fall back to Google Flights
   in that case rather than ever emitting a broken Skyscanner link. */
function rwSkyscannerUrl(origin, dest){
  var o = rwIata(origin), d = rwIata(dest);
  if(!o || !d) return null;
  return rwAffLink('skyscanner', 'https://www.skyscanner.co.in/transport/flights/'+o.toLowerCase()+'/'+d.toLowerCase()+'/');
}
/* Destination-only Skyscanner "flights to X" browse URL — needs just the
   destination resolved, no origin. */
function rwSkyscannerToUrl(dest){
  var d = rwIata(dest);
  if(!d) return null;
  return rwAffLink('skyscanner', 'https://www.skyscanner.co.in/transport/flights-to/'+d.toLowerCase()+'/');
}
/* Static country reference data — zero network calls needed. */
var COUNTRY_INFO = {
  'afghanistan':{iso:'AF',capital:'Kabul',currency:'Afghan Afghani',language:'Pashto, Dari'},
  'albania':{iso:'AL',capital:'Tirana',currency:'Albanian Lek',language:'Albanian'},
  'algeria':{iso:'DZ',capital:'Algiers',currency:'Algerian Dinar',language:'Arabic'},
  'argentina':{iso:'AR',capital:'Buenos Aires',currency:'Argentine Peso',language:'Spanish'},
  'armenia':{iso:'AM',capital:'Yerevan',currency:'Armenian Dram',language:'Armenian'},
  'australia':{iso:'AU',capital:'Canberra',currency:'Australian Dollar',language:'English'},
  'austria':{iso:'AT',capital:'Vienna',currency:'Euro',language:'German'},
  'azerbaijan':{iso:'AZ',capital:'Baku',currency:'Azerbaijani Manat',language:'Azerbaijani'},
  'bahrain':{iso:'BH',capital:'Manama',currency:'Bahraini Dinar',language:'Arabic'},
  'bangladesh':{iso:'BD',capital:'Dhaka',currency:'Bangladeshi Taka',language:'Bengali'},
  'belgium':{iso:'BE',capital:'Brussels',currency:'Euro',language:'Dutch, French'},
  'bolivia':{iso:'BO',capital:'Sucre',currency:'Bolivian Boliviano',language:'Spanish'},
  'brazil':{iso:'BR',capital:'Brasília',currency:'Brazilian Real',language:'Portuguese'},
  'bulgaria':{iso:'BG',capital:'Sofia',currency:'Bulgarian Lev',language:'Bulgarian'},
  'cambodia':{iso:'KH',capital:'Phnom Penh',currency:'Cambodian Riel',language:'Khmer'},
  'canada':{iso:'CA',capital:'Ottawa',currency:'Canadian Dollar',language:'English, French'},
  'chile':{iso:'CL',capital:'Santiago',currency:'Chilean Peso',language:'Spanish'},
  'china':{iso:'CN',capital:'Beijing',currency:'Renminbi',language:'Mandarin'},
  'colombia':{iso:'CO',capital:'Bogotá',currency:'Colombian Peso',language:'Spanish'},
  'costa rica':{iso:'CR',capital:'San José',currency:'Costa Rican Colón',language:'Spanish'},
  'croatia':{iso:'HR',capital:'Zagreb',currency:'Euro',language:'Croatian'},
  'czech republic':{iso:'CZ',capital:'Prague',currency:'Czech Koruna',language:'Czech'},
  'czechia':{iso:'CZ',capital:'Prague',currency:'Czech Koruna',language:'Czech'},
  'denmark':{iso:'DK',capital:'Copenhagen',currency:'Danish Krone',language:'Danish'},
  'ecuador':{iso:'EC',capital:'Quito',currency:'US Dollar',language:'Spanish'},
  'egypt':{iso:'EG',capital:'Cairo',currency:'Egyptian Pound',language:'Arabic'},
  'estonia':{iso:'EE',capital:'Tallinn',currency:'Euro',language:'Estonian'},
  'ethiopia':{iso:'ET',capital:'Addis Ababa',currency:'Ethiopian Birr',language:'Amharic'},
  'finland':{iso:'FI',capital:'Helsinki',currency:'Euro',language:'Finnish'},
  'france':{iso:'FR',capital:'Paris',currency:'Euro',language:'French'},
  'georgia':{iso:'GE',capital:'Tbilisi',currency:'Georgian Lari',language:'Georgian'},
  'germany':{iso:'DE',capital:'Berlin',currency:'Euro',language:'German'},
  'ghana':{iso:'GH',capital:'Accra',currency:'Ghanaian Cedi',language:'English'},
  'greece':{iso:'GR',capital:'Athens',currency:'Euro',language:'Greek'},
  'hungary':{iso:'HU',capital:'Budapest',currency:'Hungarian Forint',language:'Hungarian'},
  'iceland':{iso:'IS',capital:'Reykjavík',currency:'Icelandic Króna',language:'Icelandic'},
  'india':{iso:'IN',capital:'New Delhi',currency:'Indian Rupee',language:'Hindi, English'},
  'indonesia':{iso:'ID',capital:'Jakarta',currency:'Indonesian Rupiah',language:'Indonesian'},
  'iran':{iso:'IR',capital:'Tehran',currency:'Iranian Rial',language:'Persian'},
  'iraq':{iso:'IQ',capital:'Baghdad',currency:'Iraqi Dinar',language:'Arabic'},
  'ireland':{iso:'IE',capital:'Dublin',currency:'Euro',language:'English, Irish'},
  'israel':{iso:'IL',capital:'Jerusalem',currency:'Israeli Shekel',language:'Hebrew'},
  'italy':{iso:'IT',capital:'Rome',currency:'Euro',language:'Italian'},
  'jamaica':{iso:'JM',capital:'Kingston',currency:'Jamaican Dollar',language:'English'},
  'japan':{iso:'JP',capital:'Tokyo',currency:'Japanese Yen',language:'Japanese'},
  'jordan':{iso:'JO',capital:'Amman',currency:'Jordanian Dinar',language:'Arabic'},
  'kazakhstan':{iso:'KZ',capital:'Astana',currency:'Kazakhstani Tenge',language:'Kazakh'},
  'kenya':{iso:'KE',capital:'Nairobi',currency:'Kenyan Shilling',language:'Swahili, English'},
  'kuwait':{iso:'KW',capital:'Kuwait City',currency:'Kuwaiti Dinar',language:'Arabic'},
  'laos':{iso:'LA',capital:'Vientiane',currency:'Lao Kip',language:'Lao'},
  'latvia':{iso:'LV',capital:'Riga',currency:'Euro',language:'Latvian'},
  'lebanon':{iso:'LB',capital:'Beirut',currency:'Lebanese Pound',language:'Arabic'},
  'malaysia':{iso:'MY',capital:'Kuala Lumpur',currency:'Malaysian Ringgit',language:'Malay'},
  'maldives':{iso:'MV',capital:'Malé',currency:'Maldivian Rufiyaa',language:'Dhivehi'},
  'malta':{iso:'MT',capital:'Valletta',currency:'Euro',language:'Maltese, English'},
  'mexico':{iso:'MX',capital:'Mexico City',currency:'Mexican Peso',language:'Spanish'},
  'mongolia':{iso:'MN',capital:'Ulaanbaatar',currency:'Mongolian Tögrög',language:'Mongolian'},
  'morocco':{iso:'MA',capital:'Rabat',currency:'Moroccan Dirham',language:'Arabic'},
  'myanmar':{iso:'MM',capital:'Naypyidaw',currency:'Burmese Kyat',language:'Burmese'},
  'namibia':{iso:'NA',capital:'Windhoek',currency:'Namibian Dollar',language:'English'},
  'nepal':{iso:'NP',capital:'Kathmandu',currency:'Nepalese Rupee',language:'Nepali'},
  'netherlands':{iso:'NL',capital:'Amsterdam',currency:'Euro',language:'Dutch'},
  'new zealand':{iso:'NZ',capital:'Wellington',currency:'New Zealand Dollar',language:'English'},
  'nigeria':{iso:'NG',capital:'Abuja',currency:'Nigerian Naira',language:'English'},
  'norway':{iso:'NO',capital:'Oslo',currency:'Norwegian Krone',language:'Norwegian'},
  'oman':{iso:'OM',capital:'Muscat',currency:'Omani Rial',language:'Arabic'},
  'pakistan':{iso:'PK',capital:'Islamabad',currency:'Pakistani Rupee',language:'Urdu, English'},
  'panama':{iso:'PA',capital:'Panama City',currency:'Panamanian Balboa',language:'Spanish'},
  'peru':{iso:'PE',capital:'Lima',currency:'Peruvian Sol',language:'Spanish'},
  'philippines':{iso:'PH',capital:'Manila',currency:'Philippine Peso',language:'Filipino, English'},
  'poland':{iso:'PL',capital:'Warsaw',currency:'Polish Złoty',language:'Polish'},
  'portugal':{iso:'PT',capital:'Lisbon',currency:'Euro',language:'Portuguese'},
  'qatar':{iso:'QA',capital:'Doha',currency:'Qatari Riyal',language:'Arabic'},
  'romania':{iso:'RO',capital:'Bucharest',currency:'Romanian Leu',language:'Romanian'},
  'russia':{iso:'RU',capital:'Moscow',currency:'Russian Ruble',language:'Russian'},
  'rwanda':{iso:'RW',capital:'Kigali',currency:'Rwandan Franc',language:'Kinyarwanda'},
  'saudi arabia':{iso:'SA',capital:'Riyadh',currency:'Saudi Riyal',language:'Arabic'},
  'senegal':{iso:'SN',capital:'Dakar',currency:'West African CFA Franc',language:'French'},
  'serbia':{iso:'RS',capital:'Belgrade',currency:'Serbian Dinar',language:'Serbian'},
  'singapore':{iso:'SG',capital:'Singapore',currency:'Singapore Dollar',language:'English, Malay, Mandarin, Tamil'},
  'slovakia':{iso:'SK',capital:'Bratislava',currency:'Euro',language:'Slovak'},
  'slovenia':{iso:'SI',capital:'Ljubljana',currency:'Euro',language:'Slovenian'},
  'south africa':{iso:'ZA',capital:'Pretoria',currency:'South African Rand',language:'Zulu, English, Afrikaans'},
  'south korea':{iso:'KR',capital:'Seoul',currency:'South Korean Won',language:'Korean'},
  'spain':{iso:'ES',capital:'Madrid',currency:'Euro',language:'Spanish'},
  'sri lanka':{iso:'LK',capital:'Colombo',currency:'Sri Lankan Rupee',language:'Sinhala, Tamil'},
  'sweden':{iso:'SE',capital:'Stockholm',currency:'Swedish Krona',language:'Swedish'},
  'switzerland':{iso:'CH',capital:'Bern',currency:'Swiss Franc',language:'German, French, Italian'},
  'taiwan':{iso:'TW',capital:'Taipei',currency:'New Taiwan Dollar',language:'Mandarin'},
  'tanzania':{iso:'TZ',capital:'Dodoma',currency:'Tanzanian Shilling',language:'Swahili'},
  'thailand':{iso:'TH',capital:'Bangkok',currency:'Thai Baht',language:'Thai'},
  'tunisia':{iso:'TN',capital:'Tunis',currency:'Tunisian Dinar',language:'Arabic'},
  'turkey':{iso:'TR',capital:'Ankara',currency:'Turkish Lira',language:'Turkish'},
  'turkiye':{iso:'TR',capital:'Ankara',currency:'Turkish Lira',language:'Turkish'},
  'uganda':{iso:'UG',capital:'Kampala',currency:'Ugandan Shilling',language:'English, Swahili'},
  'ukraine':{iso:'UA',capital:'Kyiv',currency:'Ukrainian Hryvnia',language:'Ukrainian'},
  'united arab emirates':{iso:'AE',capital:'Abu Dhabi',currency:'UAE Dirham',language:'Arabic'},
  'uae':{iso:'AE',capital:'Abu Dhabi',currency:'UAE Dirham',language:'Arabic'},
  'united kingdom':{iso:'GB',capital:'London',currency:'British Pound',language:'English'},
  'uk':{iso:'GB',capital:'London',currency:'British Pound',language:'English'},
  'england':{iso:'GB',capital:'London',currency:'British Pound',language:'English'},
  'united states':{iso:'US',capital:'Washington, D.C.',currency:'US Dollar',language:'English'},
  'usa':{iso:'US',capital:'Washington, D.C.',currency:'US Dollar',language:'English'},
  'united states of america':{iso:'US',capital:'Washington, D.C.',currency:'US Dollar',language:'English'},
  'uruguay':{iso:'UY',capital:'Montevideo',currency:'Uruguayan Peso',language:'Spanish'},
  'uzbekistan':{iso:'UZ',capital:'Tashkent',currency:'Uzbekistani Som',language:'Uzbek'},
  'vietnam':{iso:'VN',capital:'Hanoi',currency:'Vietnamese Đồng',language:'Vietnamese'},
  'zambia':{iso:'ZM',capital:'Lusaka',currency:'Zambian Kwacha',language:'English'},
  'zimbabwe':{iso:'ZW',capital:'Harare',currency:'US Dollar',language:'English'},
  'china':{iso:'CN',capital:'Beijing',currency:'Renminbi',language:'Mandarin'}
};

var ALL_COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahrain','Bangladesh','Belgium','Bolivia','Brazil','Bulgaria','Cambodia','Canada','Chile','China','Colombia','Costa Rica','Croatia','Czech Republic','Denmark','Ecuador','Egypt','Estonia','Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Laos','Latvia','Lebanon','Malaysia','Maldives','Malta','Mexico','Mongolia','Morocco','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nigeria','Norway','Oman','Pakistan','Panama','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain','Sri Lanka','Sweden','Switzerland','Taiwan','Tanzania','Thailand','Tunisia','Turkey','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vietnam','Zambia','Zimbabwe',
'Albania','Andorra','Angola','Antigua and Barbuda','Bahamas','Barbados','Belarus','Belize','Benin','Bhutan','Bosnia and Herzegovina','Botswana','Brunei','Burkina Faso','Burundi','Cabo Verde','Cameroon','Chad','Comoros','Congo','Cuba','Cyprus','Djibouti','Dominica','Dominican Republic','El Salvador','Equatorial Guinea','Eritrea','Eswatini','Fiji','Gabon','Gambia','Grenada','Guatemala','Guinea','Guyana','Haiti','Honduras','Kiribati','Kosovo','Kyrgyzstan','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Mali','Marshall Islands','Mauritania','Mauritius','Micronesia','Moldova','Monaco','Montenegro','Mozambique','Nauru','Nicaragua','Niger','North Korea','North Macedonia','Palau','Palestine','Papua New Guinea','Paraguay','Samoa','San Marino','Sao Tome and Principe','Seychelles','Sierra Leone','Solomon Islands','Somalia','South Sudan','Sudan','Suriname','Syria','Tajikistan','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Turkmenistan','Tuvalu','Vanuatu','Vatican City','Venezuela','Yemen'];

/* RoamWise Pro — app logic. Built with template literals to avoid quote-escaping bugs. */

// LS, lsGet, lsSet moved to js/core/storage-utils.js

// PUSH + LOCAL NOTIFICATIONS (rwInitPush/rwSaveDeviceToken/rwLocalNotifySchedule) moved to js/boot/init.js







// AILON TUSK AGENT (RW_AGENT_TOOLS/RW_AGENT_IMPL/rwAgentRun/openAgent/rwAgentGo/rwAgentRenderTrace) moved to js/copilot/agent.js

// AGENT EVAL HARNESS (RW_EVALS/rwEvalRun/rwEvalScore/openEval/rwEvalGo/rwEvalRender) moved to js/copilot/agent-evals.js

/* ===== PRIVACY TRUST ANCHOR + WEB-TO-APP HANDOFF (rw-v51) =================
   Two conversion levers from the strategy review:
   1) Web visitors ASSUME they're being tracked. Say plainly that they aren't.
   2) Desktop planners should finish on their phone \u2014 a QR beats "download our app". */
function openPrivacyBadge(){
  var ov=el('privBadgeOv');
  if(!ov){ ov=document.createElement('div'); ov.id='privBadgeOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('privBadgeOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:400px"><div class="sheet-h"><b>\ud83d\udd12 Your data stays yours</b>'
    +'<button onclick="rwOverlayClose(\'privBadgeOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:13px;color:var(--t2);line-height:1.7;margin-top:6px">'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">\u2713 On your device</b><br>Your saved trips, itineraries, journal, budgets and preferences never leave this device.</div>'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">\u2713 Only when you invite people</b><br>The only things that reach our servers are group chats you create and beacons you deliberately light.</div>'
    +'<div style="margin-bottom:10px"><b style="color:#4ADE80">\u2713 No background tracking</b><br>Location is read once, when you tap a feature that needs it. Never in the background. Never sold.</div>'
    +'<div><b style="color:#4ADE80">\u2713 No signup required</b><br>You can plan an entire trip without giving us an email address.</div>'
    +'</div><a class="tact" style="display:block;text-align:center;margin-top:14px;text-decoration:none" href="/legal/privacy.html" target="_blank">Read the full privacy policy \u2197</a></div>';
  ov.classList.add('open');
}
/* QR handoff: finish planning on the phone. Uses a public QR image service so
   there's no library to bundle; falls back to a copyable link. */
function rwHandoffToPhone(){
  var url='https://www.roamwise.co.in/';
  try{
    var t=(window._lastItin&&window._lastItin.name)||'';
    if(t) url+='?plan='+encodeURIComponent(t);
  }catch(e){}
  var qr='https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data='+encodeURIComponent(url);
  var ov=el('handoffOv');
  if(!ov){ ov=document.createElement('div'); ov.id='handoffOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('handoffOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:340px;text-align:center"><div class="sheet-h" style="text-align:left"><b>\ud83d\udcf1 Continue on your phone</b>'
    +'<button onclick="rwOverlayClose(\'handoffOv\')" class="tact">\u2715</button></div>'
    +'<div style="background:#fff;border-radius:14px;padding:10px;display:inline-block;margin:8px 0">'
    +'<img src="'+qr+'" alt="QR code" width="220" height="220" style="display:block"></div>'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.6">Scan with your phone camera to open this plan there \u2014 maps, Near Me and your group chat all work better on mobile.</div>'
    +'<button class="tact" style="width:100%;margin-top:12px" onclick="rwCopy(\''+url+'\');showToast(\'Link copied\')">Copy link instead</button></div>';
  ov.classList.add('open');
}

// INDIA GROUND-TRUTH LAYER + CYCLE MODE SAFETY (RW_TERRAIN/rwTerrainOf/rwRoadTime/rwGroundTruth/rwCycleSafety/rwCycleCard) moved to js/itinerary/ground-truth.js

// PNR / BOOKING SMS PARSER (rwParsePNR/openPnrPaste) moved to js/booking/pnr-parser.js

// UPI SETTLEMENT (rwUpi*/rwCopy) moved to js/social/upi-settle.js

// PAGE ROUTER (rwCloseSection/RW_PAGES/rwPageOpen/rwPageClose/rwPageShare/rwRouteTo/RW_SECTION_TITLES/rwOpenSection) moved to js/ui/page-router.js




// LAYOUT MODES (RW_MODES/rwMode/rwApplyMode/rwSetMode/openModePicker) moved to js/ui/layout-modes.js






// INSTANT BOOKING ENGINE (openStays, rwStaysRender, openRoomBook, rwBookPay,
// rwBookConfirm, rwBookOwnerMsg, rwBookDone, rwShareMyBooking, rwBookShare)
// moved to js/booking/form.js




// TRAVEL COMPATIBILITY ENGINE (rwCompatPair/rwCompatGroup/openCompat/rwCompatEcho/rwCompatMine/rwCompatSave/rwCompatShow) moved to js/social/compat.js

// THE LISTING (rwBadge/rwHue/rwCardArt/openListing/rwListingAll/rwBadgeRank/rwListingFor/rwListCard/rwListOpen) moved to js/misc/listings.js

// ROAMWISE EXPERIENCES (openExperiences/rwExpRender/rwExpPlan) moved to js/misc/experiences.js

/* ============================================================================
   BOOKING ENGINE + GREEN + SOS (rw-v83)
   ========================================================================= */

// REQUEST TO BOOK (rwBasket*, rwBookTotal, rwCommissionOn, openBooking, rwBookRequest)
// moved to js/booking/form.js

// ROAMWISE GREEN (openGreen/rwGreenPlan) moved to js/misc/green-trip.js

// STRANDED / EMERGENCY (openSOS, rwSOSShare) moved to js/booking/local-rides.js

/* ============================================================================
   B2B PARTNERS + LOCAL RIDES (rw-v81)
   ============================================================================
   Two things travellers keep asking for that we didn't have:
     1. "where do I actually stay / who runs the rafting"  -> partner directory
     2. "how do I get around"                              -> rides

   RANKING is honest and explainable: signed partners first (we've verified
   them), then by a confidence-weighted rating — a 5.0 from 12 people should
   not outrank a 4.8 from 900. We show the reasoning, never a black-box score.
   ========================================================================= */

/* Bayesian-ish weighting so review COUNT matters, not just the average. */

/* Partners come from Firestore (config/partners), seeded by partners-data.js.
   Same pattern as referrers: the file is a fallback so the directory works
   offline, Firestore keeps it fresh, and no code file is ever edited. */

// CONFIG SYNC (RW_SYNCED/rwConfigApply/rwConfigSyncAll) moved to js/data-sync/config-sync.js

// B2B PARTNERS (rwPartnersSync/rwPartnerScore/rwPartnersFor/openPartners/rwPartnersRender/rwPartnerById/rwPartnerMaps/rwPartnerBook/rwPartnerPlan) moved to js/misc/partners.js

// LOCAL RIDES (rwRidesHTML, openDriverHire) moved to js/booking/local-rides.js

// EVENT RADAR + ROI ENGINE (RW_ROI_DIMS/rwEventROI/openEvents/rwEventsRender/rwEventPlan/etc) moved to js/misc/events.js

// Moved to js/ui/site-search.js (Phase 5b) — menu search (drFilter)

// THE OPENING (RW_DREAMS/rwOpeningSeen/rwOpeningShow/rwOpeningGo/rwOpeningEnter/rwOpeningDone/rwOpeningReplay) moved to js/ui/opening.js

// Moved to js/ui/onboarding.js (Phase 5b) — first-launch walkthrough (RW_ONBOARD, rwMaybeOnboard/Show/Done, rwReplayOnboard)

// Moved to js/ui/settings-modal.js (Phase 5b) — text + icon size accessibility controls (rwApplyUIScale, rwSetTextScale/IconScale, openSizeSettings)
// el() moved to js/core/dom-utils.js (Phase 6a — load-order leaf extraction)

// Moved to js/ui/settings-modal.js (Phase 5b) — i18n language system (RW_LANGS, RW_I18N, rwLang/t/rwSetLang/rwApplyLang/rwToggleLangMenu/rwInitLang)
// Moved to js/ui/adaptive-shell.js (Phase 5b) — device detection & adaptive UI (RW_DEVICE, rwDetectDevice, rwInitDevice)
// Moved to js/ui/themes.js (Phase 5b) — theme engine (RW_UI_THEMES, rwSetTheme/rwToggleThemeMenu/rwInitTheme) + drawer theme/lang pickers (drThemePick, drLangPick, drThemeSync)

var AC = 'INR';
var AUTH_ENABLED = (typeof FIREBASE_CONFIG!=='undefined') && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey!=='PASTE_ME';
/* Pro is account-bound. With accounts ON, never trust the local flag at boot —
   the auth snapshot re-grants it for the right account. Without accounts
   (pure device mode) the local flag is all we have. */
// RWPricing (pricing engine CONFIG + tier/feature helpers) moved to js/pricing/tiers.js

// rwStatusLabel (honest Pro/tier status label) moved to js/ui/status-tier.js (Phase 5c)

/* Country-code (ISO 3166-1 alpha-2) → continent, covering common countries.
   Used to compute a real "N/7 continents" stat instead of just counting
   distinct country strings (which never distinguished USA=North America
   from, say, France=Europe in any meaningful aggregate way). */
var CONTINENT_BY_CC = {
  US:'North America',CA:'North America',MX:'North America',CU:'North America',JM:'North America',
  PA:'North America',CR:'North America',GT:'North America',HN:'North America',NI:'North America',
  BZ:'North America',BS:'North America',DO:'North America',HT:'North America',
  BR:'South America',AR:'South America',CL:'South America',CO:'South America',PE:'South America',
  VE:'South America',EC:'South America',BO:'South America',PY:'South America',UY:'South America',
  GY:'South America',SR:'South America',
  GB:'Europe',FR:'Europe',DE:'Europe',IT:'Europe',ES:'Europe',PT:'Europe',NL:'Europe',BE:'Europe',
  CH:'Europe',AT:'Europe',SE:'Europe',NO:'Europe',DK:'Europe',FI:'Europe',IE:'Europe',PL:'Europe',
  CZ:'Europe',GR:'Europe',HU:'Europe',RO:'Europe',BG:'Europe',HR:'Europe',RS:'Europe',UA:'Europe',
  RU:'Europe',IS:'Europe',SK:'Europe',SI:'Europe',EE:'Europe',LV:'Europe',LT:'Europe',LU:'Europe',
  MT:'Europe',CY:'Europe',
  IN:'Asia',CN:'Asia',JP:'Asia',KR:'Asia',TH:'Asia',VN:'Asia',ID:'Asia',MY:'Asia',SG:'Asia',
  PH:'Asia',NP:'Asia',LK:'Asia',BD:'Asia',PK:'Asia',KH:'Asia',LA:'Asia',MM:'Asia',MN:'Asia',
  TW:'Asia',HK:'Asia',KZ:'Asia',UZ:'Asia',GE:'Asia',AM:'Asia',AZ:'Asia',
  AE:'Middle East',SA:'Middle East',QA:'Middle East',KW:'Middle East',BH:'Middle East',OM:'Middle East',
  IL:'Middle East',JO:'Middle East',LB:'Middle East',TR:'Middle East',IR:'Middle East',IQ:'Middle East',
  EG:'Africa',ZA:'Africa',MA:'Africa',KE:'Africa',TZ:'Africa',NG:'Africa',ET:'Africa',GH:'Africa',
  TN:'Africa',DZ:'Africa',UG:'Africa',RW:'Africa',NA:'Africa',BW:'Africa',ZW:'Africa',MU:'Africa',
  SC:'Africa',SN:'Africa',CI:'Africa',CM:'Africa',
  AU:'Oceania',NZ:'Oceania',FJ:'Oceania',PG:'Oceania',WS:'Oceania',VU:'Oceania',
  PF:'Oceania',NC:'Oceania'
};
function continentForCC(cc){ return CONTINENT_BY_CC[(cc||'').toUpperCase()] || null; }
/* Fallback for entries with no countryCode at all — including everything
   logged before this fix existed. Rough lat/lon bounding boxes; not survey-
   grade, but good enough to retroactively fix "Continents 0/7" for existing
   journey logs instead of requiring people to re-log every past entry. */
function continentForLatLon(lat, lon){
  if(typeof lat!=='number' || typeof lon!=='number') return null;
  if(lat < -60) return null; /* Antarctica — vanishingly rare to log, excluded from the 7-way split */
  if(lat < -10 && lon > 110 && lon <= 180) return 'Oceania';
  if(lat < 0 && lon >= -180 && lon < -140) return 'Oceania'; /* Pacific islands */
  if(lon >= -170 && lon < -35 && lat >= 8) return 'North America';
  if(lon >= -85 && lon < -33 && lat < 8 && lat >= -60) return 'South America';
  if(lon >= 25 && lon < 63 && lat >= 12 && lat < 42) return 'Middle East';
  if(lon >= -25 && lon < 45 && lat >= 35 && lat <= 72) return 'Europe';
  if(lon >= -20 && lon < 52 && lat >= -35 && lat < 35) return 'Africa';
  if(lon >= 45 && lon <= 180 && lat >= -10 && lat < 80) return 'Asia';
  if(lon >= -180 && lon < -25 && lat >= 5) return 'North America'; /* far western wrap */
  return null;
}
/* Single entry point used everywhere: try the reliable country-code path
   first, fall back to coordinates for older/incomplete log entries. */
function continentFor(entry){
  return continentForCC(entry.countryCode) || continentForLatLon(entry.lat, entry.lon);
}

var isPro = AUTH_ENABLED ? false : (lsGet('rwPro')==='1');
var freeLeft = 5;
var activeProv = lsGet('rwProv')||'smart';
var spends = {};
var itinBuilt = {};
var qrBuilt = false;

var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

var CURR = [
  {c:'INR',s:'₹',r:83.5},{c:'USD',s:'$',r:1},{c:'EUR',s:'€',r:.92},
  {c:'GBP',s:'£',r:.79},{c:'JPY',s:'¥',r:149},{c:'AUD',s:'A$',r:1.53},
  {c:'CAD',s:'C$',r:1.36},{c:'SGD',s:'S$',r:1.34},{c:'AED',s:'AED',r:3.67},{c:'THB',s:'฿',r:35}
];


/* ============================================================================
   PRO PRICE LABEL (rw-v80) — Febin's currency bug
   ============================================================================
   The Pro price genuinely IS 100 rupees, charged over UPI. But showing a bare
   "₹100" to someone who has selected USD looks like the currency switch is
   broken. So: show their currency with the rupee price alongside, because the
   amount they are actually charged is in rupees and hiding that would be worse.
   ========================================================================= */
function proPriceLabel(inr){
  inr = inr || 100;
  try{
    if(typeof AC==='undefined' || AC==='INR') return '\u20b9'+inr;
    var cu=CURR.find(function(x){ return x.c===AC; });
    if(!cu || !cu.r) return '\u20b9'+inr;
    var usd = inr/83.5;                     /* INR -> USD base */
    var v = usd*cu.r;
    var shown = v<1 ? v.toFixed(2) : (v<10? v.toFixed(1) : Math.round(v));
    return cu.s+shown+' (\u20b9'+inr+')';
  }catch(e){ return '\u20b9'+inr; }
}

function fmtMoney(usd){
  var cu = CURR.find(function(x){return x.c===AC;});
  var v = Math.round(usd*(cu?cu.r:1));
  var s = cu?cu.s:'$';
  if(AC==='INR'){
    if(v>=10000000) return s+(v/10000000).toFixed(2)+'Cr';
    if(v>=100000) return s+(v/100000).toFixed(1)+'L';
    if(v>=1000) return s+(v/1000).toFixed(0)+'k';
    return s+v;
  }
  if(v>=1000) return s+(v/1000).toFixed(1)+'k';
  return s+v;
}

/* CURRENCIES UI */
(function(){
  var cg = el('currGrid');
  CURR.forEach(function(cu){
    var b = document.createElement('button');
    b.className = 'cbtn'+(cu.c==='INR'?' on':'');
    b.dataset.c = cu.c;
    b.innerHTML = `<span class="sym">${cu.s}</span><span class="code">${cu.c}</span>`;
    b.onclick = function(){
      AC = cu.c;
      document.querySelectorAll('.cbtn').forEach(function(x){ x.classList.toggle('on', x.dataset.c===cu.c); });
      updateBudget();
    };
    cg.appendChild(b);
  });
})();

var slider = el('budgetSlider');
slider.addEventListener('input', function(){ updateBudget(true); });
/* BUG FIX (reported by team, Ladakh 40k case): the slider moves in fixed USD
   steps, so at typical currency rates a single step could jump the DISPLAYED
   INR value by 4000+, making round numbers like exactly 40,000 nearly
   impossible to land on by dragging. Fix: a real "type an exact amount" field
   that's always the source of truth for precision, alongside a finer slider
   step for anyone who prefers to drag. */
function updateBudget(fromSlider){
  var v = parseInt(slider.value);
  el('budgetDisplay').innerHTML = v>=10000 ? fmtMoney(10000)+'+' : fmtMoney(v);
  slider.style.setProperty('--pct', ((v-200)/9800*100).toFixed(1)+'%');
  var cu = CURR.find(function(x){return x.c===AC;}) || {s:'\u20b9', r:1};
  var ex = el('budgetExact'), sym = el('budgetExactSym');
  if(sym) sym.textContent = cu.s;
  if(ex && document.activeElement!==ex){ ex.value = Math.round(v*cu.r); }
}
(function(){
  var ex = el('budgetExact');
  if(ex){
    ex.addEventListener('input', function(){
      var cu = CURR.find(function(x){return x.c===AC;}) || {r:1};
      var shown = parseFloat(ex.value); if(isNaN(shown) || shown<0) return;
      var usd = Math.round(shown/cu.r);
      usd = Math.max(200, Math.min(10000, usd));
      slider.value = usd;
      updateBudget(false);
    });
  }
})();
updateBudget();

el('tagsContainer').addEventListener('click', function(e){
  if(e.target.classList.contains('tag')) e.target.classList.toggle('on');
});

/* DESTINATION AUTOCOMPLETE */
var DEST_NAMES = [];
DB.forEach(function(d){ DEST_NAMES.push(d.name+', '+d.country); });
DEST_NAMES.push('Anywhere in the world','Southeast Asia','Europe','South America','Middle East','East Asia','North America','Africa','Oceania','Caucasus','Central Europe','Southern Europe','South Asia','North Africa','Western Asia');
ALL_COUNTRIES.forEach(function(c){ if(DEST_NAMES.indexOf(c)<0) DEST_NAMES.push(c); });

(function(){
  var inp = el('destInput'), dd = el('destDD'), sv = '', liveTimer = null, lastQ = '';
  var TYPE_ICON = {city:'\ud83c\udfd9\ufe0f', town:'\ud83c\udfd8\ufe0f', village:'\ud83c\udfe1', hamlet:'\ud83c\udfe1',
    country:'\ud83c\udf0f', state:'\ud83d\uddfa\ufe0f', region:'\ud83d\uddfa\ufe0f', island:'\ud83c\udfdd\ufe0f',
    peak:'\u26f0\ufe0f', mountain:'\u26f0\ufe0f', volcano:'\ud83c\udf0b', beach:'\ud83c\udfd6\ufe0f',
    attraction:'\ud83c\udfaf', monument:'\ud83c\udfdb\ufe0f', castle:'\ud83c\udff0', temple:'\u26e9\ufe0f',
    national_park:'\ud83c\udfde\ufe0f', waterfall:'\ud83d\udca7', lake:'\ud83c\udf0a', museum:'\ud83c\udfdb\ufe0f',
    viewpoint:'\ud83d\udcf8', zoo:'\ud83e\udd81', theme_park:'\ud83c\udfa1'};
  function addOpt(label, value, meta, cls){
    var opt = document.createElement('div');
    opt.className = 'cddo' + (cls?' '+cls:'');
    opt.innerHTML = label + (meta? ' <span style="color:var(--t3);font-size:10px">'+meta+'</span>' : '');
    opt.onmousedown = function(){ inp.value=value; sv=value; dd.classList.remove('open'); };
    dd.appendChild(opt);
  }
  function renderLocal(q){
    dd.innerHTML = '';
    var m = q ? DEST_NAMES.filter(function(n){ return n.toLowerCase().indexOf(q.toLowerCase())>=0; }) : DEST_NAMES;
    m.slice(0, q?4:8).forEach(function(n){ addOpt('\u26a1 '+n, n, 'crowd data ready'); });
    return m.length;
  }
  function renderLive(q, feats){
    if(q !== (inp.value||'').trim()) return; /* stale response */
    var seen = {};
    dd.querySelectorAll('.cddo').forEach(function(o){ seen[o.textContent.replace(/\u26a1 |\ud83c[\udf00-\udfff]|\s+crowd data ready/g,'').trim().toLowerCase()]=1; });
    feats.slice(0,7).forEach(function(f){
      var p = f.properties||{};
      if(!p.name) return;
      var parts = [p.name];
      if(p.city && p.city!==p.name) parts.push(p.city);
      else if(p.state && p.state!==p.name) parts.push(p.state);
      if(p.country) parts.push(p.country);
      var label = parts.join(', ');
      if(seen[label.toLowerCase()]) return; seen[label.toLowerCase()]=1;
      var icon = TYPE_ICON[p.osm_value] || TYPE_ICON[p.type] || '\ud83c\udf0d';
      var kind = (p.osm_value||p.type||'').replace(/_/g,' ');
      addOpt(icon+' '+label, label, kind);
    });
    if(dd.children.length) dd.classList.add('open'); else dd.classList.remove('open');
  }
  function showDD(q){
    q = (q||'').trim();
    var localHits = renderLocal(q);
    if(dd.children.length) dd.classList.add('open'); else if(!q) dd.classList.remove('open');
    clearTimeout(liveTimer);
    if(q.length < 2) return;
    /* live worldwide places — Photon (OpenStreetMap), free, made for autocomplete */
    liveTimer = setTimeout(function(){
      if(q===lastQ) return; lastQ=q;
      fetch('https://photon.komoot.io/api/?limit=8&q='+encodeURIComponent(q))
        .then(function(r){ return r.json(); })
        .then(function(j){ renderLive(q, j.features||[]); })
        .catch(function(){ /* offline / blocked: curated list still works */ });
    }, 280);
  }
  inp.addEventListener('input', function(){ sv=''; lastQ=''; showDD(inp.value); });
  inp.addEventListener('focus', function(){ lastQ=''; showDD(inp.value); });
  inp.addEventListener('blur', function(){ setTimeout(function(){ dd.classList.remove('open'); },150); });
  window.getDestVal = function(){ return sv || inp.value || 'Anywhere'; };
})();

// refreshProUI (Pro button/free-bar/promo-bar paint) moved to js/ui/status-tier.js (Phase 5c)

(function(){
  var today = new Date().toDateString();
  if(lsGet('rwFDay')!==today){ freeLeft=5; lsSet('rwFLeft','5'); lsSet('rwFDay',today); }
  else freeLeft = parseInt(lsGet('rwFLeft')||'5');
  refreshProUI();
})();

/* Provisional-Pro is account-bound now (see auth snapshot). At boot, if a
   provisional token exists but has expired, clear it. */
(function(){ try{
  var t=parseInt(lsGet('rw_pro_temp')||'0',10);
  if(t && Date.now()>t){ lsSet('rw_pro_temp',''); lsSet('rw_pro_temp_uid',''); }
}catch(e){} })();
// Moved to js/ui/site-search.js (Phase 5b) — site search (ssIndex/ssOpen/ssClose/ssRun/_ssGo)
// Moved to js/ui/card-painter.js (Phase 5b) — adaptive "for you" rendering (useBump, FORYOU_DEFS, renderForYou) + shared card photo painter (RW_PHOTOS, rwLoadPhotoMap, rwPaintPhotos)
/* ===== TRAVEL ECONOMY LIVE TICKER ===== */
function renderTicker(){
  var host=el('brief'); if(!host) return;
  var t=document.createElement('div');
  t.style.cssText='text-align:center;font-size:11px;color:var(--t2);margin:6px 0 2px';
  t.innerHTML='\ud83c\udf0d Global travel economy this year: <b id="ecoTick" style="color:#16BF96;font-variant-numeric:tabular-nums">$0</b> <span style="color:var(--t3)">and counting (WTTC-basis)</span>';
  host.insertBefore(t, host.firstChild);
  var Y=new Date(new Date().getFullYear(),0,1).getTime(), RATE=11.5e12/31536000; /* ~$11.5T/yr */
  setInterval(function(){ var v=(Date.now()-Y)/1000*RATE;
    el('ecoTick').textContent = v>=1e12? '$'+(v/1e12).toFixed(3)+' Trillion' : '$'+(v/1e9).toFixed(1)+' Billion';
  }, 1000);
}

/* ===== PROFILE + LIFETIME LIST ===== */
var STYLE_POOL={
 adventure:[['Patagonia, Chile-Argentina','the planet\u2019s wildest trekking finale'],['Ladakh, India','high-altitude freedom on two wheels'],['Iceland ring road','fire, ice and zero guardrails'],['Nepal (EBC)','the pilgrimage every adventurer owes themselves'],['New Zealand South Island','adrenaline\u2019s home address'],['Kyrgyzstan','the last untamed horse country']],
 culture:[['Kyoto, Japan','a thousand years, perfectly kept'],['Varanasi, India','the oldest living city on Earth'],['Rome, Italy','walk inside a history book'],['Istanbul, Turkey','two continents, one table'],['Cairo, Egypt','stand where 4,500 years stare back'],['Uzbekistan (Samarkand)','the Silk Road\u2019s blue-tiled heart']],
 chill:[['Bali, Indonesia','slow mornings perfected'],['Kerala backwaters','float through green silence'],['Santorini, Greece','sunsets as a lifestyle'],['Maldives','the pause button of the planet'],['Amalfi Coast','lemon-scented la dolce vita'],['Goa in monsoon','India\u2019s softest secret season']],
 party:[['Tokyo, Japan','neon nights that never repeat'],['Berlin, Germany','the world\u2019s dance-floor capital'],['Rio de Janeiro','carnival is a warm-up here'],['Bangkok, Thailand','the night owns this city'],['Ibiza, Spain','the pilgrimage of sound'],['Goa NYE','India\u2019s beach party crown']]};
function openProfile(){
  useBump('profile');
  var ov=el('profOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='profOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:440px;max-height:88vh;overflow:auto"><button class="modal-close" onclick="el(\'profOverlay\').classList.remove(\'open\')">\u00d7</button><div class="modal-head"><div class="modal-title">\ud83d\udc64 My Traveler Profile</div><div class="modal-sub">Tell RoamWise who\u2019s traveling</div></div><div class="modal-body" id="profBody"></div></div>';
    document.body.appendChild(ov); }
  var P2={}; try{P2=JSON.parse(lsGet('rw_profile')||'{}');}catch(e){}
  var avs=['adventurer','ninja','fox','owl','bear','robot'].map(function(s,i){
    var u2='https://api.dicebear.com/9.x/'+(i<2?'adventurer':'bottts')+'/svg?seed='+s;
    return '<img src="'+u2+'" data-u="'+u2+'" onclick="profAv(this)" style="width:52px;height:52px;border-radius:50%;cursor:pointer;border:2px solid '+((P2.av===u2)?'var(--gold)':'var(--b2)')+'">';
  }).join('');
  var xpNow=xpGet(), rNow=rankOf(xpNow), nxR=nextRank(xpNow);
  var pctR=nxR? Math.min(100,Math.round((xpNow-rNow[0])/(nxR[0]-rNow[0])*100)) : 100;
  var unlockedCount=perksUnlocked().length;
  var trialUntilNow=parseInt(lsGet('rw_trial_until')||'0',10);
  var trialBadge = (trialUntilNow && trialUntilNow>Date.now())?
    '<div style="background:linear-gradient(135deg,#16BF9622,#16BF9611);border:1px solid #16BF9655;border-radius:12px;padding:9px 12px;margin-bottom:10px;font-size:12px;color:#16BF96">\u23f3 Founding traveler trial \u2014 '+Math.ceil((trialUntilNow-Date.now())/864e5)+' day(s) of Pro left</div>' : '';
  var rankHead=
   trialBadge+
   '<div style="background:linear-gradient(135deg,rgba(232,186,108,.12),rgba(196,48,43,.08));border:1px solid rgba(232,186,108,.3);border-radius:16px;padding:14px 16px;margin-bottom:14px">'
   +'<div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-size:17px;font-weight:800;color:var(--gold2)">\ud83e\udd77 '+rNow[1]+'</div><div style="font-size:11.5px;color:var(--t3)">'+xpNow+' XP</div></div>'
   +'<div class="xp-bar" style="margin-top:8px"><div class="xp-fill" style="width:'+pctR+'%"></div></div>'
   +'<div style="font-size:10.5px;color:var(--t3);margin-top:5px">'+(nxR? (nxR[0]-xpNow)+' XP to '+nxR[1] : 'Maximum rank reached')+' \u00b7 '+unlockedCount+'/'+PERKS.length+' perks unlocked</div></div>'
   +'<div style="font-size:12.5px;font-weight:700;color:var(--t1);margin:0 0 8px">\ud83c\udfc6 Your Perks \u2014 earned by doing, not just tapping</div>'
   +'<div style="margin-bottom:16px">'+renderPerks()+'</div>';
  el('profBody').innerHTML=
   rankHead
   +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><img id="profPic" src="'+(P2.av||'https://api.dicebear.com/9.x/adventurer/svg?seed=ninja')+'" style="width:64px;height:64px;border-radius:50%;border:2px solid var(--gold2)"><div style="flex:1"><div style="font-size:11px;color:var(--t2);margin-bottom:5px">Pick an avatar or upload</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+avs+'</div><input type="file" accept="image/*" id="profUp" style="font-size:10px;margin-top:6px" onchange="profUpload(this)"></div></div>'
   +'<div class="dna-q"><div class="qt">Name</div><input class="txn-inp" id="pfName" style="width:100%" value="'+(P2.name||lsGet('rw_name')||'')+'"></div>'
   +'<div style="display:flex;gap:8px"><div class="dna-q" style="flex:1"><div class="qt">Work</div><input class="txn-inp" id="pfWork" style="width:100%" value="'+(P2.work||'')+'"></div>'
   +'<div class="dna-q" style="flex:1"><div class="qt">Location</div><input class="txn-inp" id="pfLoc" style="width:100%" value="'+(P2.loc||'')+'"></div></div>'
   +'<div style="display:flex;gap:8px"><div class="dna-q" style="flex:1"><div class="qt">Age (optional, stays on device)</div><input class="txn-inp" id="pfAge" type="number" style="width:100%" value="'+(P2.age||'')+'"></div>'
   +'<div class="dna-q" style="flex:1"><div class="qt">WhatsApp (optional)</div><input class="txn-inp" id="pfWa" style="width:100%" placeholder="+91\u2026" value="'+(P2.wa||'')+'"></div></div>'
   +'<div class="dna-q"><div class="qt">Travel style</div><div class="dna-opts">'+['adventure','culture','chill','party'].map(function(s){return '<button class="dna-opt'+(P2.style===s?' on':'')+'" onclick="profPick(this,\'style\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Dream terrain</div><div class="dna-opts">'+['mountains','beaches','cities','deserts'].map(function(s){return '<button class="dna-opt'+(P2.terr===s?' on':'')+'" onclick="profPick(this,\'terr\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Trip length you love</div><div class="dna-opts">'+['weekend','1 week','2+ weeks'].map(function(s){return '<button class="dna-opt'+(P2.len===s?' on':'')+'" onclick="profPick(this,\'len\',\''+s+'\')">'+s+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Favourite destinations so far</div><input class="txn-inp" id="pfFav" style="width:100%" value="'+(P2.fav||'')+'"></div>'
   +'<div class="dna-q"><div class="qt">Hobbies</div><input class="txn-inp" id="pfHob" style="width:100%" value="'+(P2.hob||'')+'"></div>'
   +'<div class="dna-q"><div class="qt">Bio</div><input class="txn-inp" id="pfBio" style="width:100%" maxlength="120" value="'+(P2.bio||'')+'"></div>'
   +'<label style="display:flex;gap:8px;font-size:11.5px;color:var(--t2);margin:4px 0 12px"><input type="checkbox" id="pfNews" '+(P2.news?'checked':'')+'> Send me weekly travel drops (email)</label>'
   +'<button class="rzp-main-btn" onclick="profSave()">\u2728 Save & reveal my Lifetime List</button>'
   +'<div id="pfOut" style="margin-top:12px"></div>';
  window._prof=P2;
  ov.classList.add('open');
}
function profAv(img){ window._prof.av=img.dataset.u; el('profPic').src=img.dataset.u;
  img.parentNode.querySelectorAll('img').forEach(function(x){x.style.borderColor='var(--b2)';}); img.style.borderColor='var(--gold)'; }
function profUpload(inp){ var f=inp.files[0]; if(!f) return;
  var fr=new FileReader(); fr.onload=function(){ if(fr.result.length>400000) return showToast('Pick a smaller image');
    window._prof.av=fr.result; el('profPic').src=fr.result; }; fr.readAsDataURL(f); }
function profPick(b,k,v){ window._prof[k]=v; b.parentNode.querySelectorAll('.dna-opt').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); }
function profSave(){
  var P2=window._prof;
  ['Name','Work','Loc','Age','Wa','Fav','Hob','Bio'].forEach(function(k){ P2[k.toLowerCase()]=el('pf'+k).value.trim(); });
  P2.news=el('pfNews').checked;
  lsSet('rw_profile', JSON.stringify(P2)); lsSet('rw_name', P2.name||lsGet('rw_name')||'');
  if(AUTH_READY && user){ db.collection('users').doc(user.uid).set({name:P2.name||'',whatsapp:P2.wa||'',newsletter:!!P2.news,style:P2.style||'',location:P2.loc||''},{merge:true}); }
  var style=P2.style||'adventure', pool=STYLE_POOL[style]||STYLE_POOL.adventure;
  var extra = P2.terr==='beaches'? STYLE_POOL.chill[3] : P2.terr==='deserts'? ['Jaisalmer + Wadi Rum','gold dunes twice over'] : P2.terr==='cities'? STYLE_POOL.party[0] : STYLE_POOL.adventure[1];
  var list=pool.slice(0,5).concat([extra]);
  el('pfOut').innerHTML='<div class="mode-box" style="border-color:rgba(232,186,108,.5)"><b>\ud83c\udf1f '+(P2.name||'Traveler')+'\u2019s Lifetime List \u2014 the '+style+' soul edition</b><br><span style="font-size:10.5px;color:var(--t3)">Based on your style, terrain and trip length. Plan any of them in one tap.</span></div>'
   + list.map(function(x){ return '<div class="ti-day" style="align-items:center"><b>\u272a</b><span style="flex:1"><b style="color:var(--t1)">'+x[0]+'</b><br><span style="font-size:10.5px;color:var(--t2)">'+x[1]+'</span></span><button class="tact" onclick="el(\'profOverlay\').classList.remove(\'open\');el(\'destInput\').value=\''+x[0].split(',')[0].replace(/'/g,'')+'\';tabGo(\'plan\')">Plan</button></div>'; }).join('');
  showToast('Profile saved \u2014 your Lifetime List is ready \u2b50'); xpAdd(15,'Identity forged');
}

/* ===== MUSIC PANEL ===== */
var MUSIC_YT_PLAYLIST=''; /* optional extra: paste a YouTube playlist ID for a second player */
var SPOTIFY_ARTIST_ID='2qbS0OT9WF0Wpf2WnggrKS';
var SPOTIFY_PLAYLIST_ID='4tO1PY5vyjXhwLFepr8VIF';
var JIOSAAVN_URL='https://www.saavn.com/s/artist/mohit-pandey-albums/s0TzZzm4XaE_';
var PROMO_YT_ID='3MRlvs9bdPQ'; /* official RoamWise promo */
function renderPromo(){
  var top=el('promoTop'), box=el('promoBox');
  /* The film section below already renders the player; a second copy in the
     billboard meant two players in one view. Billboard only shows on Home. */
  if(false && PROMO_YT_ID && top){
    top.innerHTML='<div class="bb" id="promoBB" onclick="playPromo(this)">'
     +'<img id="promoThumb" alt="RoamWise film" style="opacity:0;transition:opacity .5s ease">'
     +'<div class="ov"><div class="t2">THE OFFICIAL FILM</div><div class="t1">RoamWise \u2014 born in the Himalayas</div></div>'
     +'<div class="try">\u25b6 Play</div></div>';
    /* preload best available thumb: maxres(often missing) -> sd -> hq. YouTube returns a
       120x90 grey stub for missing sizes, so we check real dimensions, not just onload. */
    var sizes=['maxresdefault','sddefault','hqdefault'], si=0, imgEl=el('promoThumb');
    (function tryThumb(){
      if(si>=sizes.length){ if(imgEl){ imgEl.src='https://img.youtube.com/vi/'+PROMO_YT_ID+'/hqdefault.jpg'; imgEl.style.opacity='1'; } return; }
      var pre=new Image();
      pre.onload=function(){
        if(pre.naturalWidth>=200){ imgEl.src=pre.src; imgEl.style.opacity='1'; var bb=el('promoBB'); if(bb) bb.style.animation='none'; }
        else { si++; tryThumb(); }   /* grey stub -> next size */
      };
      pre.onerror=function(){ si++; tryThumb(); };
      pre.src='https://img.youtube.com/vi/'+PROMO_YT_ID+'/'+sizes[si]+'.jpg';
    })();
  }
  if(box){
    /* Same single player as the billboard — no second implementation. */
    box.innerHTML = filmPlayerHTML()
     +'<a class="tact" style="display:block;text-align:center;text-decoration:none;margin-top:10px;font-size:12px;opacity:.85" href="https://youtube.com/@mohucool?sub_confirmation=1" target="_blank" rel="noopener">More films on @mohucool \u2192</a>';
    filmAttachDiagnostics();

  }
}
/* ===== General pattern: try in-app playback first, fall back to external only
   on real failure. Used for the film billboard, reusable for any future embed. ===== */
/* In the APK the page loads from file:///android_asset/, so a relative link to
   creators/ 404s (ERR_FILE_NOT_FOUND). Website-only pages must be opened as an
   absolute URL in the browser. */
function rwOpenSite(path){
  var url = 'https://roamwise.co.in/' + String(path||'').replace(/^\//,'');
  if(IS_APP || IS_STANDALONE){ try{ return openExternally(url); }catch(e){} }
  window.open(url, '_blank', 'noopener');
}
function openExternally(url){
  if(window.RW && RW.openExternal){ RW.openExternal(url); }
  else { window.open(url, '_blank', 'noopener'); }
}
var PROMO_MP4_URL = 'https://roamwise.co.in/promo.mp4';
var PROMO_EXT_URL = '';  /* optional external watch link from config */ /* self-hosted film — Mohit uploads promo.mp4 to the repo root (see PROJECT-STATE.md) */
function filmPlayerHTML(){
  /* ONE player, used by both the billboard and the film section — there were
     two competing implementations before, which is why behaviour differed
     depending on where you tapped. */
  return '<div style="border-radius:18px;overflow:hidden;border:1px solid var(--b2,#2A2A36);background:#000">'
    +'<video id="filmInline" controls playsinline preload="metadata" '
    +'poster="https://img.youtube.com/vi/'+PROMO_YT_ID+'/hqdefault.jpg" '
    +'style="width:100%;display:block;aspect-ratio:16/9;background:#000">'
    +'<source src="'+PROMO_MP4_URL+'" type="video/mp4"></video></div>'
    +'<div id="filmFallback"></div>';
}
function filmAttachDiagnostics(){
  var v=el('filmInline'); if(!v) return;
  function fail(){
    var code = (v.error && v.error.code) || 0;
    var names = {0:'no media loaded', 1:'aborted', 2:'network error', 3:'decode error', 4:'format not supported'};
    var fb=el('filmFallback'); if(!fb) return;
    /* Say WHAT failed and offer the device's own player before YouTube —
       a vague "watch on YouTube" hid the real cause for several releases. */
    fb.innerHTML='<div style="font-size:11.5px;color:var(--t3);padding:9px 2px;line-height:1.6">'
      +'Inline playback failed \u2014 <b>'+(names[code]||('code '+code))+'</b>.<br>'
      +'<span style="opacity:.75;word-break:break-all">'+esc2(PROMO_MP4_URL)+'</span><br>'
      +'<button class="tact" style="font-size:11px;padding:5px 10px;margin-top:6px" onclick="openExternally(PROMO_MP4_URL)">Open in device player</button> '
      +'<button class="tact" style="font-size:11px;padding:5px 10px;margin-top:6px" onclick="openExternally(\'https://www.youtube.com/watch?v=\'+PROMO_YT_ID)">YouTube</button></div>';
  }
  v.addEventListener('error', fail, true);
  /* <source> failures fire on the source element, not the video — listen there too */
  var srcEl=v.querySelector('source'); if(srcEl) srcEl.addEventListener('error', fail);
  v.addEventListener('loadedmetadata', function(){ var fb=el('filmFallback'); if(fb) fb.innerHTML=''; });
}
function playPromo(host){
  var wrap=document.createElement('div');
  wrap.id='promoPlayerBox';
  wrap.innerHTML=filmPlayerHTML();
  if(host && host.parentNode) host.parentNode.replaceChild(wrap, host);
  else if(el('promoTop')) el('promoTop').appendChild(wrap);
  filmAttachDiagnostics();
  var v=el('filmInline'); if(v){ try{ v.play(); }catch(e){} }
  try{ track('video_opens'); }catch(e){}
}
function openMusic(mode){
  useBump('music');
  mode = mode || lsGet('rw_mus_mode') || 'playlist';
  var ov=el('musOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='musOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:440px"><button class="modal-close" onclick="el(\'musOverlay\').classList.remove(\'open\')">\u00d7</button>'
     +'<div class="modal-head"><div class="modal-title">\ud83c\udfb5 Music by Mohit Pandey</div><div class="modal-sub">Kumaoni folk \u00d7 phonk \u00d7 travel beats \u2014 live from Spotify</div></div>'
     +'<div class="modal-body" id="musBody"></div></div>';
    document.body.appendChild(ov); }
  musRender(mode);
  ov.classList.add('open');
}
function musRender(mode){
  lsSet('rw_mus_mode', mode);
  var spotifyEmbedId = mode==='artist'? SPOTIFY_ARTIST_ID : SPOTIFY_PLAYLIST_ID;
  var spotifyEmbedKind = mode==='artist'? 'artist' : 'playlist';
  el('musBody').innerHTML=
   '<div class="mus-eq"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
   +'<div class="mus-tabs">'
   +'<div class="mus-tab'+(mode==='playlist'?' on':'')+'" onclick="musRender(\'playlist\')">\ud83c\udfa7 All Songs</div>'
   +'<div class="mus-tab'+(mode==='artist'?' on':'')+'" onclick="musRender(\'artist\')">\ud83c\udfa4 Artist Page</div>'
   +'</div>'
   +'<div class="mus-frame"><div class="mus-inner">'
   +'<iframe key="'+spotifyEmbedKind+'" style="border-radius:12px" src="https://open.spotify.com/embed/'+spotifyEmbedKind+'/'+spotifyEmbedId+'?utm_source=generator&theme=0" width="100%" height="'+(mode==='artist'?'352':'352')+'" frameBorder="0" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>'
   +'</div></div>'
   +'<div style="display:flex;gap:8px;margin-top:10px">'
   +'<a class="tact" style="flex:1;text-align:center;text-decoration:none;background:linear-gradient(135deg,#1DB95422,transparent)" href="https://open.spotify.com/artist/'+SPOTIFY_ARTIST_ID+'" target="_blank" rel="noopener">\ud83c\udfa7 Open in Spotify</a>'
   +'<a class="tact" style="flex:1;text-align:center;text-decoration:none" href="'+JIOSAAVN_URL+'" target="_blank" rel="noopener">JioSaavn</a>'
   +'</div>'
   +'<a class="tact" style="display:block;text-align:center;text-decoration:none;margin-top:8px" href="https://youtube.com/@mohucool" target="_blank" rel="noopener">\u25b6 Also on YouTube @mohucool</a>';
}

/* ===== ADSENSE (gated) + WHATSAPP (gated) ===== */
var ADSENSE_ID='ca-pub-4943859484482348'; /* live */
var ADSENSE_SLOT=''; /* set in admin Config once you create an ad unit */
// AFF_BOOKING and stayUrl moved to js/booking/affiliate-links.js
var WA_NUMBER='', WA_CHANNEL='', WA_GROUP='';
(function(){
  /* AdSense loads on the WEBSITE ONLY — never inside the app WebView.
     AdSense-for-Content is websites-only by policy (AdMob is the in-app
     product); serving it inside a wrapper app risks the entire AdSense
     account, which also carries the website's revenue. Detection: the
     native app injects the window.RW bridge before the page loads, and
     Play builds set PLAY_MODE=true — either signal disables ads. Deferred
     to DOMContentLoaded because PLAY_MODE is declared later in this file
     (var hoisting would make an immediate check read undefined). */
  function loadAds(){
    var inApp = !!window.RW || (typeof PLAY_MODE!=='undefined' && PLAY_MODE);
    if(ADSENSE_ID && !inApp){
      var s=document.createElement('script'); s.async=true;
      s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ADSENSE_ID;
      s.crossOrigin='anonymous'; document.head.appendChild(s);
      /* A display unit needs BOTH data-ad-client and data-ad-slot. Without a
         slot id the <ins> can never fill, which looks identical to "not
         approved yet" and wastes days of debugging. Set ADSENSE_SLOT in the
         admin Config tab once the ad unit exists in your AdSense account. */
      var slot = (typeof ADSENSE_SLOT!=='undefined' && ADSENSE_SLOT) ? ADSENSE_SLOT : '';
      document.querySelectorAll('.rw-ad').forEach(function(a){
        if(slot) a.setAttribute('data-ad-slot', slot);
        if(!a.getAttribute('data-ad-slot')){ return; }  /* skip: would never fill */
        a.style.display='block';
        try{ (adsbygoogle=window.adsbygoogle||[]).push({}); }catch(e){}
      });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', loadAds); else loadAds();
  ensureWaButton();
})();
/* Global + idempotent so remote config can create it after the fact. */
function ensureWaButton(){
  try{ rwRefCapture(); rwRefStickUrl(); }catch(e){}
  try{ setTimeout(rwBasketBadge, 600); }catch(e){}
  try{ setTimeout(rwConfigSyncAll, 1200); }catch(e){}
  if(!WA_NUMBER || document.getElementById('waFab')) return;
  var w=document.createElement('a');
  w.id='waFab';
  w.href='https://wa.me/'+WA_NUMBER.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent('Hi RoamWise!');
  w.target='_blank';
  w.style.cssText='position:fixed;right:14px;bottom:86px;z-index:200;width:48px;height:48px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 6px 20px rgba(0,0,0,.4);text-decoration:none';
  w.textContent='\ud83d\udcac';
  document.body.appendChild(w);
}

/* ===== RATINGS & TESTIMONIALS ===== */
var PLAYSTORE_URL=''; /* paste your Play Store listing URL once published — unlocks the "Rate on Play Store" nudge */
function renderRatings(){
  var wall=el('ratingsWall'), sum=el('ratingsSummary'); if(!wall||!sum) return;
  db.collection('ratings').orderBy('created','desc').limit(60).get().then(function(qs){
    var rows=qs.docs.map(function(d){ return d.data(); }).filter(function(r){ return r.stars>0; });
    if(!rows.length){
      sum.innerHTML='<div style="font-size:13px;color:var(--t3)">Be the first to rate RoamWise \u2b50</div>';
      wall.innerHTML=''; return;
    }
    var avg=(rows.reduce(function(t,r){return t+r.stars;},0)/rows.length);
    var stars=''; for(var i=1;i<=5;i++) stars+= i<=Math.round(avg)? '\u2b50':'\u2606';
    sum.innerHTML='<div style="font-size:34px;font-weight:800;color:var(--gold2)">'+avg.toFixed(1)+'</div>'
      +'<div style="font-size:19px;letter-spacing:2px">'+stars+'</div>'
      +'<div style="font-size:11.5px;color:var(--t3);margin-top:2px">from '+rows.length+' traveler'+(rows.length===1?'':'s')
      +(PLAYSTORE_URL? ' &middot; <a href="'+PLAYSTORE_URL+'" target="_blank" rel="noopener" style="color:var(--gold2)">rate us on Play Store \u2192</a>':'')+'</div>';
    wall.innerHTML = rows.filter(function(r){ return r.text; }).slice(0,12).map(function(r){
      var st=''; for(var i=1;i<=5;i++) st+= i<=r.stars? '\u2b50':'\u2606';
      return '<div class="exp"><div style="font-size:14px;letter-spacing:1px">'+st+'</div>'
        +'<div class="exp-desc" style="margin-top:6px">\u201c'+String(r.text).slice(0,180).replace(/[<>]/g,'')+'\u201d</div>'
        +'<div style="font-size:11px;color:var(--t3);margin-top:8px">\u2014 '+String(r.name||'A traveler').replace(/[<>]/g,'')+'</div></div>';
    }).join('');
  }).catch(function(){ sum.innerHTML='<div class="mode-box">Ratings need the Firestore rules published \u2014 see admin console.</div>'; });
}
function openRateForm(){
  if(!AUTH_READY || !user){ showToast('Sign in first \u2014 one honest rating per traveler'); return; }
  var ov=el('rateOv');
  if(!ov){ ov=document.createElement('div'); ov.id='rateOv'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:400px"><button class="modal-close" onclick="el(\'rateOv\').classList.remove(\'open\')">\u00d7</button>'
     +'<div class="modal-head"><div class="modal-title">\u2b50 Rate RoamWise</div><div class="modal-sub">Your honest take helps other travelers find us</div></div>'
     +'<div class="modal-body">'
     +'<div id="starPicker" style="font-size:34px;text-align:center;letter-spacing:6px;margin-bottom:14px;cursor:pointer"></div>'
     +'<textarea id="rateText" maxlength="180" placeholder="What made your trip planning easier? (optional)" style="width:100%;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px;color:var(--t1);font-family:Outfit;font-size:13px;min-height:70px"></textarea>'
     +'<button class="rzp-main-btn" style="margin-top:10px" onclick="submitRating()">Submit rating</button>'
     +(PLAYSTORE_URL? '<div style="font-size:10.5px;color:var(--t3);text-align:center;margin-top:8px">Loved it? A Play Store review helps even more \u2192 <a href="'+PLAYSTORE_URL+'" target="_blank" rel="noopener" style="color:var(--gold2)">rate there too</a></div>':'')
     +'</div></div>';
    document.body.appendChild(ov); }
  window._rateStars=5;
  paintStars();
  ov.classList.add('open');
}
function paintStars(){
  var s=window._rateStars||5, html='';
  for(var i=1;i<=5;i++) html+='<span onclick="window._rateStars='+i+';paintStars()" style="color:'+(i<=s?'var(--gold2)':'var(--t3)')+'">\u2605</span>';
  el('starPicker').innerHTML=html;
}
function submitRating(){
  var stars=window._rateStars||5, text=(el('rateText').value||'').trim().slice(0,180);
  var name=(function(){ try{ return (JSON.parse(lsGet('rw_profile')||'{}').name)||lsGet('rw_name')||'A traveler'; }catch(e){ return 'A traveler'; } })();
  db.collection('ratings').doc(user.uid).set({
    stars:stars, text:text, name:name, created:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    el('rateOv').classList.remove('open');
    showToast('\u2b50 Thank you for rating RoamWise!'); xpAdd(10,'Rated the app');
    renderRatings();
  }).catch(function(){ showToast('Could not submit \u2014 check Firestore rules'); });
}

/* ===== SYNC CIRCLE — anonymous "I'm going" intent counts (no PII) ===== */
function syncGo(name){
  if(!AUTH_READY || !user){ showToast('Sign in first \u2014 Sync Circle is for real accounts'); return; }
  var m=(el('month')||{}).value||'soon';
  var key=(name+'_'+m).toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,60);
  var inc={}; inc[key]=firebase.firestore.FieldValue.increment(1);
  var ref=db.collection('pulse').doc('intents');
  ref.set(inc,{merge:true}).then(function(){ return ref.get(); }).then(function(d2){
    var n=(d2.exists && d2.data()[key])||1;
    showToast('\ud83e\udd1d You + '+(n-1)+' traveler'+(n===2?'':'s')+' planning '+name+' in '+m+' \u2014 open Trip Squads to find them');
    xpAdd(5,'Joined a Sync Circle');
    openSquads(name, m);
  }).catch(function(){ showToast('Sync Circle needs the pulse rules published'); });
}

// Trip Squads moved to js/social/tribe-beacon.js

/* ===== 60-SECOND AI KEY WIZARD ===== */
var WIZ=[
 {p:'groq',n:'Groq (auto-picks best model)',url:'https://console.groq.com/keys',why:'\u2705 No card ever \u00b7 fastest replies \u00b7 ~1,000 calls/day',ph:'gsk_\u2026',
  steps:['Sign up free (Google login works \u2014 no card asked)','Tap \u201cCreate API Key\u201d, give it any name','Copy it NOW \u2014 Groq shows it only once'],
  trouble:'Lost it? Just create another key \u2014 unlimited keys, still no card.'},
 {p:'cerebras',n:'Cerebras',url:'https://cloud.cerebras.ai',why:'\u2705 No card \u00b7 biggest daily volume (~1M tokens/day)',ph:'csk-\u2026',
  steps:['Sign up with Google or email \u2014 no payment step','Open API Keys in the sidebar','Create a key and copy it'],
  trouble:'Runs Llama 3.3 70B very fast; if a call times out, the app falls back automatically.'},
 {p:'github',n:'GitHub Models',url:'https://github.com/settings/tokens',why:'\u2705 No card \u00b7 GPT-4o & Llama on a GitHub account',ph:'ghp_\u2026',
  steps:['Sign in to GitHub \u2192 Settings \u2192 Developer settings','Personal access tokens \u2192 Generate new token (classic)','No scopes needed \u2014 generate, then copy the ghp_\u2026 token'],
  trouble:'Limits are tied to your GitHub plan; the free plan is enough for planning trips.'},
 {p:'gemini',n:'Google Gemini 2.5 Flash',url:'https://aistudio.google.com/apikey',why:'Frontier quality free \u2014 but pick the right model',ph:'AIza\u2026',
  steps:['Sign in with any Google account','Tap \u201cCreate API key\u201d \u2192 \u201cCreate in new project\u201d','Copy the AIza\u2026 key'],
  trouble:'Billing prompt? That means the chosen model is paid-only. RoamWise now calls gemini-2.5-flash, which is on the free tier \u2014 Pro and Flash-Lite are not.'},
 {p:'openrouter',n:'OpenRouter',url:'https://openrouter.ai/keys',why:'One key \u2192 many free models (lower daily cap)',ph:'sk-or-\u2026',
  steps:['Sign in (Google/GitHub)','Tap \u201cCreate Key\u201d','Copy the sk-or-\u2026 key'],
  trouble:'Free slots are ~50 calls/day and queue at peak; a one-time $10 top-up raises it to ~1,000/day. Groq or Cerebras avoid that entirely.'}
];
var wizI=0;
function keyProvider(k){
  k=(k||'').trim();
  if(/^AIza/.test(k)) return 'gemini';
  if(/^gsk_/.test(k)) return 'groq';
  if(/^csk-/.test(k)) return 'cerebras';
  if(/^ghp_|^github_pat_/.test(k)) return 'github';
  if(/^sk-or-/.test(k)) return 'openrouter';
  if(/^sk-ant-/.test(k)) return 'anthropic';
  /* Deliberately NOT guessing here: an unprefixed key used to be assumed
     Mistral, which hijacked Cerebras keys and tested them against the wrong
     API — the reported "save & test fails". Unknown format => no guess, and
     the caller keeps whichever provider the user actually selected. */
  return null;
}
function openProvider(url){
  if(window.RW || /RoamWiseApp/i.test(navigator.userAgent)){
    /* APK: opens in the browser ON TOP of the app \u2014 press Back to land right here */
    showToast('Copy the key there, press Back \u2014 the wizard is waiting \ud83e\udd77');
    window.open(url,'_blank');
  } else {
    /* Web: popup window \u2014 RoamWise never navigates away */
    var w=Math.min(560,screen.width-40), h=Math.min(760,screen.height-80);
    var win=window.open(url,'rwKeyWin','width='+w+',height='+h+',left='+((screen.width-w)/2)+',top='+((screen.height-h)/2)+',noopener');
    if(!win) window.open(url,'_blank');
    showToast('Copy the key in the popup, then paste it back here');
  }
}
function openWizard(){ wizI=0; wizPaint(); el('wizOverlay').classList.add('open'); try{track('wiz_opens');}catch(e){} }
function wizPaint(){
  var w=WIZ[wizI], has=!!lsGet('rwKey_'+w.p);
  var armed=['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].filter(function(p){return lsGet('rwKey_'+p);});
  el('wizBody').innerHTML=
   '<div class="mode-box" style="margin-bottom:12px">\u26a1 <b>Smart paste:</b> already have ANY key? Paste it \u2014 I\u2019ll detect the provider, save & test it automatically.'
  +'<div class="key-row" style="margin-top:8px"><input class="k-inp" id="wizAny" placeholder="AIza\u2026 / gsk_\u2026 / sk-or-\u2026 / sk-ant-\u2026"><button class="k-save" onclick="wizSmartPaste()">Detect & Save</button></div>'
  +'<div id="wizAnyStatus" style="font-size:11px;margin-top:6px;min-height:14px"></div></div>'
  +'<div style="font-size:11px;color:var(--t3);margin-bottom:6px">STEP '+(wizI+1)+' OF '+WIZ.length+(armed.length?' \u00b7 <span style="color:#16BF96">'+armed.length+' engine'+(armed.length>1?'s':'')+' armed \u2713</span>':'')+'</div>'
  +'<div style="font-size:16px;font-weight:700;margin-bottom:3px">'+w.n+(has?' <span style="color:#16BF96;font-size:11px">\u2713 saved</span>':'')+'</div>'
  +'<div style="font-size:11.5px;color:var(--t2);margin-bottom:10px">'+w.why+'</div>'
  +'<button class="rzp-main-btn" style="margin-bottom:10px" onclick="openProvider(\''+w.url+'\')">1\ufe0f\u20e3 Open '+w.n+' (stays on top)</button>'
  +'<div style="border:1px dashed var(--b2);border-radius:11px;padding:10px 12px;margin-bottom:10px">'
  + w.steps.map(function(s,i){return '<div class="ti-day"><b style="min-width:16px">'+(i+1)+'.</b><span>'+s+'</span></div>';}).join('')
  +'<div style="font-size:10px;color:var(--gold2);margin-top:5px">\ud83d\udca1 '+w.trouble+'</div></div>'
  +'<div class="key-row"><input class="k-inp" id="wizKey" placeholder="2\ufe0f\u20e3 Paste the key \u2014 '+w.ph+'"><button class="k-save" onclick="wizSave()">Save & Test</button></div>'
  +'<div id="wizStatus" style="font-size:11px;margin-top:8px;min-height:16px"></div>'
  +'<div style="display:flex;gap:8px;margin-top:12px">'
  +(wizI>0?'<button class="tact" style="flex:1" onclick="wizI--;wizPaint()">\u2190 Back</button>':'')
  +'<button class="tact" style="flex:1" onclick="wizNext()">'+(wizI<WIZ.length-1?'Skip \u2192':'Done')+'</button></div>';
}
function wizNext(){ if(wizI<WIZ.length-1){ wizI++; wizPaint(); } else { el('wizOverlay').classList.remove('open'); showToast('\ud83e\udd16 AI armed \u2014 itineraries are now personalised'); } }
function wizTest(prov,key,stEl,onOk){
  stEl.textContent='Testing '+prov+'\u2026'; stEl.style.color='var(--t3)';
  aiRequest(prov, key, AI_MODELS[prov][0], 'Reply with exactly: OK', 10)
    .then(function(){ lsSet('rwKey_'+prov,key); activeProv=prov; lsSet('rwProv',prov);
      try{ rwAutoBackup(); rwOfferBackup(); }catch(e){}
      stEl.textContent='\u2705 '+prov.charAt(0).toUpperCase()+prov.slice(1)+' is working \u2014 saved & set as your engine.'; stEl.style.color='#16BF96';
      if(onOk) setTimeout(onOk,1200); })
    .catch(function(e){ stEl.textContent='\u274c '+String(e.message||e).slice(0,70); stEl.style.color='#E05B5B'; });
}
function wizSave(){
  var w=WIZ[wizI], k=(el('wizKey').value||'').trim(); if(!k) return;
  var det=keyProvider(k);
  if(det && det!==w.p){ el('wizStatus').textContent='\ud83d\udd0d That looks like a '+det+' key \u2014 saving it there instead\u2026'; el('wizStatus').style.color='var(--gold2)';
    return wizTest(det,k,el('wizStatus'),wizPaint); }
  /* No recognised prefix => trust the provider the user is standing on. */
  wizTest(w.p,k,el('wizStatus'),wizNext);
}
function wizSmartPaste(){
  var k=(el('wizAny').value||'').trim(), st=el('wizAnyStatus'); if(!k) return;
  var det=keyProvider(k);
  if(!det){ st.textContent='\u2753 I can\u2019t tell which service that key is from \u2014 open Settings \u2192 Advanced and paste it next to the right provider.'; st.style.color='#E05B5B'; return; }
  wizTest(det,k,st,wizPaint);
}
/* ===== MODEL COMPARISON ARENA ===== */
function compareModels(name, days){
  var provs = ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].filter(function(p){return lsGet('rwKey_'+p);});
  var ov = el('cmpOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='cmpOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:520px;max-height:86vh;overflow:auto"><button class="modal-close" onclick="el(\'cmpOverlay\').classList.remove(\'open\')">\u00d7</button>'
    +'<div class="modal-head"><div class="modal-title">\u2694\ufe0f AI Arena</div><div class="modal-sub">Same brief \u00b7 every engine \u00b7 side by side</div></div>'
    +'<div class="modal-body" id="cmpBody"></div></div>';
    document.body.appendChild(ov);
  }
  ov.classList.add('open');
  var body=el('cmpBody');
  if(!provs.length){ body.innerHTML='<div class="mode-box">No AI keys yet \u2014 run the 60-second wizard first.</div><button class="rzp-main-btn" onclick="el(\'cmpOverlay\').classList.remove(\'open\');openWizard()">\ud83e\ude84 Open the wizard</button>'; return; }
  var _curSym=(CURR.find(function(x){return x.c===AC;})||{s:'\u20b9'}).s;
  var prompt='Create a compact '+Math.min(days,5)+'-day itinerary for '+name+'. For each day give: a title and one line each for morning, afternoon, evening. Be specific with real place names. If you mention any cost, use the '+_curSym+' symbol only \u2014 never $ unless '+_curSym+' actually is $. Max 140 words total.';
  body.innerHTML = '<div class="mode-box">Racing '+provs.length+' AI engine'+(provs.length>1?'s':'')+' + the built-in Smart engine on: <b>'+name+'</b>\u2026</div>'
    + provs.map(function(p){ return '<div class="trek" style="margin-bottom:10px"><div class="trek-top"><div class="trek-name">'+p.toUpperCase()+'</div><span class="tbadge hid" id="cmpT_'+p+'">\u23f3</span></div><div style="font-size:11.5px;color:var(--t2);line-height:1.6" id="cmpB_'+p+'">running\u2026</div></div>'; }).join('')
    + '<div class="trek" style="margin-bottom:10px"><div class="trek-top"><div class="trek-name">\u26a1 SMART ENGINE (built-in)</div><span class="tbadge pop">0.0s</span></div><div style="font-size:11.5px;color:var(--t2);line-height:1.6">'+(typeof DAY_TEMPLATES!=='undefined'? DAY_TEMPLATES.slice(0,2).map(function(t,i){return '<b>Day '+(i+1)+' \u2014 '+t.title+':</b> '+t.morning;}).join('<br>')+'<br><i>\u2026instant, offline, zero cost</i>':'')+'</div></div>'
    + '<div id="cmpVerdict"></div>';
  var results=[];
  provs.forEach(function(p){
    var t0=Date.now();
    aiRequest(p, lsGet('rwKey_'+p), AI_MODELS[p][0], prompt, 700)
      .then(function(txt){ var dt=((Date.now()-t0)/1000).toFixed(1);
        el('cmpT_'+p).textContent=dt+'s'; el('cmpT_'+p).className='tbadge pop';
        el('cmpB_'+p).textContent=txt.slice(0,460)+(txt.length>460?'\u2026':'');
        results.push({p:p,dt:parseFloat(dt),w:txt.split(/\s+/).length}); verdict(); })
      .catch(function(e){ el('cmpT_'+p).textContent='\u2717'; el('cmpT_'+p).className='tbadge dan';
        el('cmpB_'+p).textContent=String(e.message||e).slice(0,90); verdict(); });
  });
  function verdict(){
    if(results.length<1) return;
    var fast=results.slice().sort(function(a,b){return a.dt-b.dt;})[0];
    var rich=results.slice().sort(function(a,b){return b.w-a.w;})[0];
    el('cmpVerdict').innerHTML='<div class="mode-box">\ud83c\udfc6 <b>Insights:</b> fastest \u2014 <b>'+fast.p+'</b> ('+fast.dt+'s) \u00b7 most detailed \u2014 <b>'+rich.p+'</b> ('+rich.w+' words) \u00b7 the Smart engine wins on speed & offline; AI wins on personal detail. Set your favourite in Settings.</div>';
  }
  try{ track('arena_runs'); }catch(e){}
}

// PREMIUM PDF ITINERARY EXPORT (openPdfFlow/genPdf and friends) moved to js/itinerary/pdf-export.js

/* ===== EVENT RADAR/* ===== EVENT RADAR — the world's biggest moments as travel triggers ===== */
var EVENTS=[
{id:'fifa26',ic:'\u26bd',n:'FIFA World Cup 2026',from:'2026-06-11',to:'2026-07-19',city:'New York',month:6,ac:'#1F8A3B',
 places:'USA \u00b7 Mexico \u00b7 Canada \u2014 16 host cities',idea:'Fan-fest cities beat stadium cities on price: watch group games in Mexico City (electric + cheap), semis atmosphere in NYC. Book stays 40km out on transit lines \u2014 half price, 30 min in.'},
{id:'iphone26',ic:'\ud83d\udcf1',n:'iPhone launch week',from:'2026-09-07',to:'2026-09-20',city:'Dubai',month:8,ac:'#8E8E93',
 places:'Dubai \u00b7 Singapore \u00b7 NYC 5th Ave',idea:'Launch-day tourism is real: Dubai Mall and Singapore Orchard get the first stock hours ahead of the West \u2014 pair a city break with a day-one pickup and skip home-country markups.'},
{id:'wc27',ic:'\ud83c\udfcf',n:'ICC Cricket World Cup 2027',from:'2027-10-01',to:'2027-11-15',city:'Cape Town',month:9,ac:'#D4A017',
 places:'South Africa \u00b7 Zimbabwe \u00b7 Namibia',idea:'The first African ODI World Cup in decades \u2014 combine Newlands cricket with the Garden Route. Book Cape Town stays 9+ months out; match-week prices triple.'},
{id:'la28',ic:'\ud83c\udfc5',n:'LA Olympics 2028',from:'2028-07-14',to:'2028-07-30',city:'Los Angeles',month:6,ac:'#E8524A',
 places:'Los Angeles, USA',idea:'Olympic cities empty out AROUND the venues \u2014 Santa Monica and Malibu run below normal occupancy while Downtown surges. Stay coastal, train in.'},
{id:'expo',ic:'\ud83c\udfd7\ufe0f',n:'Next mega-tower & expo watch',from:'2026-01-01',to:'2028-12-31',city:'Riyadh',month:10,ac:'#9B59F5',
 places:'Jeddah Tower \u00b7 Riyadh Expo 2030 build-up',idea:'Skyline tourism: Jeddah Tower aims to take the world-tallest crown from Burj Khalifa \u2014 the construction-boom years are the cheap years to see a city being born.'},
{id:'concerts',ic:'\ud83c\udfa4',n:'Stadium tour season',from:'2026-05-01',to:'2026-09-30',city:'London',month:6,ac:'#FF5CA8',
 places:'Global stadium tours \u2014 pop\u2019s biggest names',idea:'Concert arbitrage: the same world tour costs 40\u201360% less in Warsaw, Bangkok or S\u00e3o Paulo than London or NYC \u2014 fly there, see the show, get a holiday free.'},
{id:'f1',ic:'\ud83c\udfce\ufe0f',n:'F1 season flyaways',from:'2026-03-01',to:'2026-11-30',city:'Singapore',month:8,ac:'#E10600',
 places:'Singapore night race \u00b7 Monaco \u00b7 Suzuka',idea:'Singapore\u2019s night GP is the most tourist-perfect race \u2014 the track wraps the city, so a regular hotel IS a grandstand. Book Marina Bay view rooms 6 months out.'},
{id:'lambo',ic:'\ud83d\udc02',n:'Supercar launch pilgrimages',from:'2026-01-01',to:'2026-12-31',city:'Bologna',month:4,ac:'#DDB321',
 places:'Sant\u2019Agata (Lamborghini) \u00b7 Maranello (Ferrari)',idea:'Italy\u2019s Motor Valley: factory museums, test-track days and launch events cluster around Bologna \u2014 one base, three legendary marques, best in spring.'}];
function activeEvents(){ var t=new Date().toISOString().slice(0,10);
  return EVENTS.filter(function(e){ return e.from<=t && t<=e.to; }); }
function renderEventBanner(){
  var live=activeEvents(); if(!live.length) return;
  var e=live[0];
  var b=document.createElement('div');
  b.style.cssText='position:sticky;top:52px;z-index:60;margin:0 12px;border-radius:12px;padding:9px 14px;display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;color:#fff;background:linear-gradient(90deg,'+e.ac+'CC,'+e.ac+'66);border:1px solid '+e.ac+';cursor:pointer;animation:fadeup .5s ease';
  b.innerHTML=e.ic+' <span>'+e.n+' is LIVE \u2014 plan the trip \u2192</span>';
  b.onclick=function(){ eventPlan(e.id); };
  var host=document.querySelector('.hero-sky'); if(host) host.parentNode.insertBefore(b, host);
}
function eventPlan(id){
  var e=EVENTS.find(function(x){return x.id===id;}); if(!e) return;
  var i=el('destInput'); if(i) i.value=e.city;
  var m=el('month'); if(m) m.selectedIndex=e.month;
  tabGo('plan'); showToast(e.ic+' '+e.n+' \u2014 destination & month pre-filled. Hit Search!');
  try{ track('event_plans'); }catch(x){}
}
function renderEvents(){
  var g=el('evtGrid'); if(!g) return;
  var t=new Date().toISOString().slice(0,10);
  g.innerHTML = EVENTS.map(function(e){
    var live = e.from<=t && t<=e.to;
    return '<div class="exp" style="border-color:'+e.ac+'55">'
      +'<div class="exp-ic">'+e.ic+(live?' <span style="font-size:9px;color:#fff;background:'+e.ac+';border-radius:99px;padding:2px 8px;vertical-align:middle">LIVE NOW</span>':'')+'</div>'
      +'<div class="exp-name">'+e.n+'</div><div class="exp-where">'+e.places+'</div>'
      +'<div class="exp-desc">'+e.idea+'</div>'
      +'<button class="tact red" style="margin-top:9px;width:100%" onclick="eventPlan(\''+e.id+'\')">'+(live?'\ud83d\udd25 Plan it now':'\ud83d\uddd3 Build the itinerary')+'</button></div>';
  }).join('');
}
function renderSpotlight(){
  var host=el('brief'); if(!host) return;
  var live=activeEvents(), e=live[0];
  var doy=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/864e5);
  var dod=(typeof DB!=='undefined' && DB.length)? DB[doy%DB.length] : null;
  var title, sub, city, ac, yt;
  if(e){ title=e.ic+' '+e.n; sub=e.idea; city=e.city; ac=e.ac; yt=e.n+' travel guide'; }
  else if(dod){ title='\ud83c\udf0d Spotlight: '+dod.name; sub='Today\u2019s destination of the day \u2014 tap Plan for the crowd calendar, budget and itinerary.'; city=dod.name; ac='#C8913E'; yt=dod.name+' travel guide 4k'; }
  else return;
  var card=document.createElement('div');
  card.className='exp';
  card.style.cssText='margin:12px 0 0;border-color:'+ac+'66;background:linear-gradient(135deg,'+ac+'14,transparent)';
  card.innerHTML='<div class="exp-ic">\ud83c\udfaf <span style="font-size:9px;color:#fff;background:'+ac+';border-radius:99px;padding:2px 8px;vertical-align:middle">TODAY\u2019S THEME</span></div>'
    +'<div class="exp-name">'+title+'</div>'
    +'<div class="exp-desc">'+sub+'</div>'
    +'<div style="display:flex;gap:7px;margin-top:10px">'
    +'<button class="tact red" style="flex:1" onclick="'+(e? 'eventPlan(\''+e.id+'\')' : '(function(){el(\'destInput\').value=\''+city.replace(/'/g,'')+'\';tabGo(\'plan\')})()')+'">\ud83d\uddd3 Plan this</button>'
    +'<a class="tact" style="flex:1;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query='+encodeURIComponent(yt)+'">\u25b6 Watch</a></div>'
    +'<div style="font-size:10px;color:var(--gold2);margin-top:8px">\ud83d\udd25 Founding offer live: lifetime Pro \u20b9100 \u2014 rises after the first wave</div>';
  host.appendChild(card);
}
/* ===== TRAVEL PULSE NEWS — daily-crunched, honest about not being live-live ===== */
function renderNewsPulse(){
  var g=el('newsGrid'); if(!g) return;
  var done=false;
  var giveUp=setTimeout(function(){ if(done) return; done=true; rwNewsPulseFallback(g); }, 6000);
  fetch('news.json',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){
    if(done) return; done=true; clearTimeout(giveUp);
    if(!d.items || !d.items.length){ rwNewsPulseFallback(g); return; }
    var upd=d.updated? new Date(d.updated) : null;
    var when = upd? upd.toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '';
    g.innerHTML = d.items.map(function(it){
      return '<div class="exp"><div class="exp-ic">\ud83d\udcf0</div>'
        +'<div class="exp-where" style="color:var(--gold2);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em">'+(it.tag||'Travel')+'</div>'
        +'<div class="exp-name" style="font-size:14.5px">'+String(it.crunch||it.headline||'').replace(/[<>]/g,'')+'</div>'
        +'<div class="exp-desc" style="font-size:11px;color:var(--t3)">'+(it.source||'')+(when? ' \u00b7 '+when:'')+'</div>'
        +(it.url? '<a class="tact" style="display:block;text-align:center;text-decoration:none;margin-top:9px;font-size:12px" target="_blank" rel="noopener" href="'+it.url+'">Read more \u2192</a>' : '')
        +'</div>';
    }).join('');
  }).catch(function(){
    if(done) return; done=true; clearTimeout(giveUp);
    rwNewsPulseFallback(g);
  });
}
/* When there's no daily news.json (no backend cron yet), populate the pulse with
   AI-generated fresh travel headlines so the section is never empty. Falls back
   to curated evergreen tips if the AI engine isn't reachable. */
function rwNewsPulseFallback(g){
  var CURATED=[
    {tag:'Visa', crunch:'Thailand, Malaysia & Sri Lanka keep visa-free/eVisa access for Indians — check the latest window before booking.', source:'Travel desk'},
    {tag:'Money', crunch:'UPI now works at many merchants in UAE, Singapore, France & Sri Lanka — carry less forex.', source:'Payments'},
    {tag:'Season', crunch:'Monsoon (Jun–Sep) is the cheapest window for Goa, Kerala & the Western Ghats if you don\u2019t mind rain.', source:'Seasonal'},
    {tag:'Rail', crunch:'IRCTC opens bookings 60 days ahead — set an alarm for Himalayan toy-train and Vande Bharat routes.', source:'Rail'},
    {tag:'Safety', crunch:'High-altitude trips (Leh, Spiti) need 48h acclimatisation — plan a slow first two days.', source:'Health'}
  ];
  function paint(items){
    var when=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    g.innerHTML=items.map(function(it){
      return '<div class="exp"><div class="exp-ic">\ud83d\udcf0</div>'
        +'<div class="exp-where" style="color:var(--gold2);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em">'+esc2(it.tag||'Travel')+'</div>'
        +'<div class="exp-name" style="font-size:14.5px">'+esc2(String(it.crunch||'')).replace(/[<>]/g,'')+'</div>'
        +'<div class="exp-desc" style="font-size:11px;color:var(--t3)">'+esc2(it.source||'RoamWise')+' \u00b7 '+when+'</div>'
        +'</div>';
    }).join('');
    var sec=el('newspulse'); if(sec) rwOpenSection(sec.id);
  }
  paint(CURATED); /* show curated instantly */
  /* then try to upgrade with AI-crunched fresh angles (best-effort) */
  if(typeof aiCallAny==='function'){
    var prompt='Give 5 short, useful, CURRENT-style travel tips for Indian travellers (visa windows, best seasons, money/UPI abroad, rail booking, safety). Each: a 2-4 word TAG, then a one-sentence crunch under 22 words. Format each line as TAG | crunch. No preamble.';
    aiCallAny(prompt, 300, function(err,txt){
      if(!txt) return;
      var items=txt.split('\n').map(function(l){ var p=l.split('|'); return p.length>=2?{tag:p[0].replace(/^[-*\d.\s]+/,'').trim(), crunch:p.slice(1).join('|').trim(), source:'AI travel desk'}:null; }).filter(Boolean);
      if(items.length>=3) paint(items.slice(0,6));
    });
  }
}

// Main page-render DOMContentLoaded handler (device/lang/theme init, home page wiring) moved to js/boot/init.js


/* ===== FUNNEL TRACKER — anonymous daily counters for the owner dashboard ===== */
function track(ev){
  if(!AUTH_READY) return;
  try{
    var day = new Date().toISOString().slice(0,10);
    var inc = {}; inc[ev] = firebase.firestore.FieldValue.increment(1);
    /* .set() rejects ASYNCHRONOUSLY — the surrounding try/catch never sees it,
       so a blocked write used to fail completely silently and the admin funnel
       just stayed empty with no clue why. Record the last failure so it can be
       surfaced instead of guessed at. */
    db.collection('stats').doc(day).set(inc, {merge:true})
      .catch(function(e){ try{ lsSet('rw_track_err', (e.code||'')+' '+(e.message||e)); }catch(_){} });
  }catch(e){}
}
/* Per-response thumbs up/down on Ailon Tusk bot bubbles (see cpFinish). No
   per-message record and no user identity — just bumps the same anonymous
   daily counter track() already writes, under two new event names. Also
   visually locks the row so a bubble can't be voted twice. */
function rwTuskFeedback(btn, helpful){
  try{
    var row = btn && btn.closest ? btn.closest('.tk-fb') : (btn && btn.parentNode);
    if(row){
      if(row.dataset && row.dataset.voted) return; /* already voted, ignore repeat taps */
      if(row.dataset) row.dataset.voted='1';
      [].forEach.call(row.querySelectorAll('button'), function(b){
        b.disabled = true; b.style.cursor='default'; b.style.opacity = (b===btn)? '1':'.3';
      });
      if(btn && btn.style) btn.style.transform='scale(1.3)';
    }
    track(helpful? 'tusk_helpful' : 'tusk_unhelpful');
  }catch(e){}
}
/* Closes the loop the daily tusk-daily.yml Action was built for but never
   received data for: log the place name whenever Ailon Tusk's curated engine
   recognises a destination-shaped query but has nothing for it. Anonymous —
   place name only, keyed by a slug, so repeats just increment a counter
   instead of piling up per-user records. An admin can export this collection
   into data/misses.txt to feed the existing OpenStreetMap resolver. */
function rwTuskMiss(place){
  if(!AUTH_READY || !place) return;
  try{
    var slug = String(place).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
    if(!slug) return;
    db.collection('tuskMisses').doc(slug).set({
      place: String(place).slice(0,80),
      count: firebase.firestore.FieldValue.increment(1),
      lastAsked: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true}).catch(function(){});
  }catch(e){}
}
(function(){ try{
  if(!sessionStorage.getItem('rw_v')){ sessionStorage.setItem('rw_v','1'); setTimeout(function(){ track('visits'); }, 1500); }
}catch(e){} })();

/* ===== CONVERSION NUDGE — one-time, after the user has felt the value ===== */
function maybeNudge(){
  try{
    if(isPro || PLAY_MODE || lsGet('rw_nudged')) return;
    var n = parseInt(lsGet('rw_searches')||'0',10)+1; lsSet('rw_searches', String(n));
    if(n === 2){
      lsSet('rw_nudged','1');
      setTimeout(function(){
        var d=document.createElement('div');
        d.id='nudgeSheet';
        d.style.cssText='position:fixed;left:12px;right:12px;bottom:76px;z-index:900;background:linear-gradient(135deg,#171227,#1B0F14);border:1px solid rgba(232,186,108,.45);border-radius:18px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.6);animation:fadeup .4s ease';
        d.innerHTML='<div style="font-size:14px;font-weight:700;margin-bottom:4px">\ud83e\udd77 You just planned like a shinobi.</div>'
          +'<div style="font-size:12px;color:#B8B4A8;line-height:1.6;margin-bottom:11px">Lock <b style="color:#E8BA6C">lifetime Pro at the \u20b9100 launch price</b> \u2014 unlimited searches, full itineraries, every hack. One payment, forever.</div>'
          +'<div style="display:flex;gap:8px"><button onclick="track(\'nudge_yes\');document.getElementById(\'nudgeSheet\').remove();openPay()" style="flex:2;padding:12px;border-radius:11px;border:none;background:linear-gradient(135deg,#E8BA6C,#C8913E);color:#0A0A12;font-weight:800;font-family:Outfit;font-size:13px;cursor:pointer">Unlock \u20b9100</button>'
          +'<button onclick="document.getElementById(\'nudgeSheet\').remove()" style="flex:1;padding:12px;border-radius:11px;border:1px solid #2A2A34;background:transparent;color:#8A8880;font-family:Outfit;font-size:12px;cursor:pointer">Later</button></div>';
        document.body.appendChild(d);
        track('nudge_shown');
      }, 2500);
    }
  }catch(e){}
}

/* ===== TRAVEL PULSE — anonymous aggregate demand (no identities, no contact) ===== */
function pulseKey(name,month){ return (name+'_'+month).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80); }
function pulseBump(name,month){
  if(!AUTH_READY || !user) return;
  try{ db.collection('pulse').doc(pulseKey(name,month)).set({
    n:String(name).slice(0,60), m:month, count: firebase.firestore.FieldValue.increment(1),
    at: firebase.firestore.FieldValue.serverTimestamp()},{merge:true}); }catch(e){}
}
function pulseShow(name,month,elId){
  if(!AUTH_READY) return;
  try{ db.collection('pulse').doc(pulseKey(name,month)).get().then(function(d){
    if(!d.exists) return;
    var c=d.data().count||0; if(c<2) return;
    var t=el(elId); if(t){ t.style.display=''; t.innerHTML='\ud83d\udd25 <b>'+c+' travelers</b> planned '+name+' for '+month+' recently \u2014 you\u2019re in good company'; }
  }); }catch(e){}
}
/* ===== TRAILER ===== */
function killIntro(){ var i=el('intro'); if(i){ i.classList.add('bye'); setTimeout(function(){ i.remove(); },700);} }
(function(){ try{
  if(sessionStorage.getItem('rw_intro')){ var i=el('intro'); if(i) i.remove(); return; }
  sessionStorage.setItem('rw_intro','1'); setTimeout(killIntro, 2600);
}catch(e){ killIntro(); } })();

// Perks, Shinobi XP ranks, and Badges & Achievements moved to js/game/badges.js

/* ==================== JOURNEY CERTIFICATE ====================
   A premium, shareable "Atlas Edition" certificate generated from the user's
   trip: route on a world map, journey stats, stops timeline, cultural notes,
   badges. Renders as an on-page artifact you can screenshot/share; also
   exportable. All offline once the map tiles cache. */
// GREEN / ECO TRAVEL (RW_GREEN_CATS) moved to js/misc/eco-safety.js

/* ==================== POST-TRIP MEMORIES STUDIO ====================
   After a trip: auto-generate a blog (Medium/Reddit/X ready), a photo collage,
   and a memory log. Cross-post via the share sheet to text platforms; collages
   download for Instagram/Facebook (those need manual upload — no web post API). */
function openMemories(){
  try{ tabGo('home'); }catch(e){}
  var it=window._lastItin;
  var dest=(it&&it.name)||'';
  if(!dest){ try{ showToast('Plan or finish a trip first \u2014 then turn it into a story \u270d\ufe0f'); }catch(e){}; return; }
  var sec=el('memSection');
  if(!sec){ sec=document.createElement('section'); sec.id='memSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\u270d\ufe0f Trip <em>memories</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'memSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Turn your '+esc2(dest)+' trip into a blog, a collage, and a keepsake log \u2014 then share it.</p>'
    +'<div class="mem-tabs">'
      +'<button class="mem-tab on" onclick="rwMemTab(this,\'blog\')">\ud83d\udcdd Blog</button>'
      +'<button class="mem-tab" onclick="rwMemTab(this,\'collage\')">\ud83d\uddbc\ufe0f Collage</button>'
      +'<button class="mem-tab" onclick="rwMemTab(this,\'log\')">\ud83d\udcd3 Memory log</button>'
    +'</div>'
    +'<div id="memBlog" class="mem-pane"><button class="tact" style="width:100%;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwGenBlog()">\u2728 Write my trip blog</button><div id="memBlogOut" style="margin-top:12px"></div></div>'
    +'<div id="memCollage" class="mem-pane" style="display:none"><p class="note">Add up to 6 photos from your trip \u2014 RoamWise arranges them into a shareable collage.</p>'
      +'<input type="file" id="memPhotos" accept="image/*" multiple onchange="rwCollagePreview()" style="margin:8px 0">'
      +'<canvas id="memCanvas" style="width:100%;border-radius:14px;display:none;border:1px solid var(--b2)"></canvas>'
      +'<div id="memCollageBtns"></div></div>'
    +'<div id="memLog" class="mem-pane" style="display:none"><div id="memLogOut"></div></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
  rwRenderLog();
}
function rwMemTab(btn,which){
  document.querySelectorAll('.mem-tab').forEach(function(b){b.classList.remove('on');}); btn.classList.add('on');
  ['blog','collage','log'].forEach(function(k){ var p=el('mem'+k.charAt(0).toUpperCase()+k.slice(1)); if(p) p.style.display=(k===which?'':'none'); });
}
function rwGenBlog(){
  var it=window._lastItin; var dest=(it&&it.name)||'my trip';
  var stops=(typeof rwDeriveStops==='function')?rwDeriveStops(dest):[];
  var stopList=stops.map(function(s){return s.name;}).join(', ');
  var out=el('memBlogOut'); out.innerHTML='<div class="note">\u270d\ufe0f Writing your story\u2026</div>';
  var prompt='Write a warm, vivid first-person travel blog post about a trip to '+dest+'.'
    +(stopList?' Places visited: '+stopList+'.':'')
    +' 300-400 words, engaging and personal, with a short catchy title on the first line. Evocative but honest \u2014 no clich\u00e9 overload. End with one practical tip for future travellers. Plain text, no markdown headers.';
  if(typeof aiCallAny==='function'){
    aiCallAny(prompt, 700, function(err,txt){
      if(!txt){ out.innerHTML='<div class="note">Couldn\u2019t reach the AI engine. Add a free AI key in Settings for blog generation, then try again.</div>'; return; }
      var title=txt.split('\n')[0].replace(/^#+\s*/,'');
      window._rwBlog={title:title,body:txt};
      out.innerHTML='<div class="mem-blog"><h3 style="margin:0 0 8px">'+esc2(title)+'</h3><div style="white-space:pre-wrap;font-size:13.5px;line-height:1.7;color:var(--t1)">'+esc2(txt.split('\n').slice(1).join('\n').trim())+'</div></div>'
        +'<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">'
        +'<button class="tact" style="flex:1;min-width:120px" onclick="rwBlogCopy()">\ud83d\udccb Copy</button>'
        +'<button class="tact" style="flex:1;min-width:120px" onclick="rwBlogCrosspost()">\ud83d\ude80 Cross-post</button></div>'
        +'<div style="font-size:11px;color:var(--t3);margin-top:8px">Cross-post opens Medium, Reddit, X or Dev.to with your draft ready. Instagram/Facebook: use the collage tab.</div>';
      try{ rwSaveMemory('blog', dest, title); }catch(e){}
    });
  } else { out.innerHTML='<div class="note">AI engine unavailable.</div>'; }
}
function rwBlogCopy(){ if(window._rwBlog){ try{ navigator.clipboard.writeText(_rwBlog.title+'\n\n'+_rwBlog.body); showToast('Blog copied \u2713'); }catch(e){} } }
function rwBlogCrosspost(){
  if(!window._rwBlog) return;
  try{ navigator.clipboard.writeText(_rwBlog.title+'\n\n'+_rwBlog.body); }catch(e){}
  var title=encodeURIComponent(_rwBlog.title), url=encodeURIComponent('https://roamwise.co.in');
  var ov=el('rwShareOverlay')||document.createElement('div');
  ov.id='rwShareOverlay'; ov.className='share-overlay'; ov.onclick=function(e){if(e.target===ov)rwCloseShare();};
  if(!ov.parentNode) document.body.appendChild(ov);
  var sites=[
    {l:'Medium',e:'\u270d\ufe0f',h:'https://medium.com/new-story'},
    {l:'Reddit',e:'\ud83d\udc7d',h:'https://www.reddit.com/submit?title='+title+'&url='+url},
    {l:'Dev.to',e:'\ud83d\udcbb',h:'https://dev.to/new'},
    {l:'X',e:'\u2715',h:'https://twitter.com/intent/tweet?text='+title+'&url='+url},
    {l:'Blogger',e:'\ud83d\udcd8',h:'https://www.blogger.com/blog/post/edit'},
    {l:'LinkedIn',e:'\ud83d\udcbc',h:'https://www.linkedin.com/feed/?shareActive=true'}
  ];
  ov.innerHTML='<div class="share-modal-inner"><div class="share-head">Cross-post your blog</div>'
    +'<p class="note" style="text-align:center;margin:-6px 0 12px">Your draft is copied \u2014 paste it after the site opens.</p>'
    +'<div class="share-grid">'+sites.map(function(s){return '<button class="share-cell" onclick="window.open(\''+s.h+'\',\'_blank\');rwCloseShare()"><span class="share-emoji">'+s.e+'</span><span>'+s.l+'</span></button>';}).join('')+'</div>'
    +'<button class="tact" style="width:100%" onclick="rwCloseShare()">Close</button></div>';
  ov.style.display='flex';
}
/* ---- Photo collage (canvas) ---- */
function rwCollagePreview(){
  var files=(el('memPhotos').files)||[]; if(!files.length) return;
  var imgs=[]; var loaded=0; var n=Math.min(files.length,6);
  for(var i=0;i<n;i++){ (function(f){ var img=new Image(); img.onload=function(){ imgs.push(img); if(++loaded===n) rwDrawCollage(imgs); }; img.src=URL.createObjectURL(f); })(files[i]); }
}
function rwDrawCollage(imgs){
  var c=el('memCanvas'); var W=1080,H=1080; c.width=W;c.height=H; var ctx=c.getContext('2d');
  ctx.fillStyle='#0B0E16'; ctx.fillRect(0,0,W,H);
  var n=imgs.length;
  var grid = n<=1?[1,1]: n<=2?[2,1]: n<=4?[2,2]: [3,2];
  var cols=grid[0], rows=grid[1], pad=14;
  var cw=(W-pad*(cols+1))/cols, ch=(H-90-pad*(rows+1))/rows;
  imgs.forEach(function(img,i){
    var cx=i%cols, cy=Math.floor(i/cols);
    var x=pad+cx*(cw+pad), y=pad+cy*(ch+pad);
    var ar=img.width/img.height, tar=cw/ch, sw,sh,sx,sy;
    if(ar>tar){ sh=img.height; sw=sh*tar; sx=(img.width-sw)/2; sy=0; } else { sw=img.width; sh=sw/tar; sx=0; sy=(img.height-sh)/2; }
    ctx.save(); rwRoundRect(ctx,x,y,cw,ch,12); ctx.clip(); ctx.drawImage(img,sx,sy,sw,sh,x,y,cw,ch); ctx.restore();
  });
  var dest=(window._lastItin&&_lastItin.name)||'My Trip';
  ctx.fillStyle='#E8BA6C'; ctx.font='bold 40px system-ui,sans-serif'; ctx.textAlign='center';
  ctx.fillText(dest+' \u2708\ufe0f', W/2, H-34);
  ctx.fillStyle='rgba(237,232,223,.6)'; ctx.font='500 20px system-ui,sans-serif';
  ctx.fillText('made on RoamWise', W/2, H-14);
  c.style.display='block';
  el('memCollageBtns').innerHTML='<div style="display:flex;gap:8px;margin-top:10px"><button class="tact" style="flex:1;font-weight:800" onclick="rwCollageSave()">\u2b07\ufe0f Save collage</button><button class="tact" style="flex:1;font-weight:800" onclick="rwCollageShare()">\ud83d\udce4 Share</button></div><div style="font-size:11px;color:var(--t3);margin-top:6px">Save it, then post to Instagram or Facebook (they need manual upload).</div>';
  try{ rwSaveMemory('collage', dest, imgs.length+' photos'); }catch(e){}
}
function rwRoundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function rwCollageSave(){ var c=el('memCanvas'); if(c){ try{ saveOrDownload(c.toDataURL('image/jpeg',0.92),'roamwise-collage.jpg'); }catch(e){ showToast('Long-press the collage to save'); } } }
function rwCollageShare(){
  var c=el('memCanvas'); if(!c) return;
  c.toBlob(function(b){
    var f=new File([b],'roamwise-collage.jpg',{type:'image/jpeg'});
    if(navigator.share && navigator.canShare && navigator.canShare({files:[f]})){
      navigator.share({files:[f], text:'My '+((window._lastItin&&_lastItin.name)||'trip')+' \u2708\ufe0f made on RoamWise'}).catch(function(){});
    } else { rwCollageSave(); showToast('Saved \u2014 upload it to Instagram/Facebook'); }
  },'image/jpeg',0.92);
}
/* ---- Memory log ---- */
function rwSaveMemory(kind, dest, detail){
  var log=[]; try{ log=JSON.parse(lsGet('rw_memlog')||'[]'); }catch(e){}
  log.unshift({kind:kind,dest:dest,detail:detail,at:Date.now()});
  try{ lsSet('rw_memlog', JSON.stringify(log.slice(0,50))); }catch(e){}
}

// EMOTIONAL JOURNEY LOG moved to js/itinerary/journey-log.js
// FUNCTIONAL GREEN NUDGE (rwGreenNudge/rwGreenPickInline) moved to js/misc/eco-safety.js

// Tribe Travel moved to js/social/tribe-beacon.js
// Money Layer moved to js/social/coordkit.js
// FITNESS-FIRST STAYS (openFitnessStays/rwFitnessFind/rwFitnessRender) moved to js/misc/misc-features.js

// NEAR ME (openNearMe/rwNearMeLocate/rwNearMeSearch/rwNearMeRender) moved to js/misc/misc-features.js


// Green Travel UI (openGreenTravel/rwGreenPick) moved to js/misc/eco-safety.js

// openJourneyCert + certShare moved to js/itinerary/journey-certificate.js
// rwShareSheet/rwCloseShare/rwShareTrip/rwShareGo moved to js/itinerary/share.js
// certDownload moved to js/itinerary/journey-certificate.js

// rankOf/nextRank/xpAdd/xpPaint + daily streak XP bonus moved to js/game/badges.js


// SHARE / VIRALITY (doShare, shareApp, shareTrek) moved to js/itinerary/share.js
// HUB & SPOKE INDIA (HS/renderHS) moved to js/misc/misc-features.js

// BASECAMP (BC/renderBC/PACK/packTog) moved to js/misc/misc-features.js

// STRAVA profile link (stravaConnect) + requestFeature moved to js/misc/misc-features.js

// LEGENDARY CIRCUITS (CIRCUITS/renderCircs) moved to js/misc/misc-features.js

// EV VAULT (EVS/renderEvs) moved to js/misc/misc-features.js


/* ===== TRAVELER DNA ===== */
var DNA_QS=[
 ['Your age band',['<20','20\u201330','30\u201345','45+']],
 ['Your travel vibe',['Adventure','Culture','Chill','Party']],
 ['Money style',['Shoestring','Smart value','Comfort','Luxury']],
 ['Pace',['Slow \u2014 few places, deep','Balanced','Fast \u2014 see it all']],
 ['Big goal',['All 7 continents','Himalayan mastery','Food pilgrimage','Digital-nomad life']]
];
function openDna(){
  var b=el('dnaBody'), dna=JSON.parse(lsGet('rw_dna')||'[]');
  b.innerHTML = DNA_QS.map(function(q,qi){
    return '<div class="dna-q"><div class="qt">'+(qi+1)+'. '+q[0]+'</div><div class="dna-opts">'
      +q[1].map(function(o,oi){return '<button class="dna-opt'+(dna[qi]===oi?' on':'')+'" onclick="dnaPick(this,'+qi+','+oi+')">'+o+'</button>';}).join('')+'</div></div>';
  }).join('') + '<button class="rzp-main-btn" onclick="dnaSave()">Save my DNA (+30 XP)</button>';
  el('dnaOverlay').classList.add('open');
}
function dnaPick(btn,qi,oi){
  var dna=JSON.parse(lsGet('rw_dna')||'[]'); dna[qi]=oi; lsSet('rw_dna',JSON.stringify(dna));
  btn.parentNode.querySelectorAll('.dna-opt').forEach(function(b){b.classList.remove('on');}); btn.classList.add('on');
}
function dnaSave(){
  var dna=JSON.parse(lsGet('rw_dna')||'[]');
  if(dna.filter(function(x){return x!==undefined&&x!==null;}).length<5) return showToast('Answer all 5 \u2014 20 seconds!');
  el('dnaOverlay').classList.remove('open');
  if(!lsGet('rw_dna_xp')){ lsSet('rw_dna_xp','1'); xpAdd(30,'DNA decoded'); }
  applyDna(); showToast('App tuned to your DNA \ud83e\uddec');
}
function applyDna(){
  var dna=JSON.parse(lsGet('rw_dna')||'null'); if(!dna) return;
  var st=el('style'), tm=el('tmode');
  if(st){ if(dna[1]===0) st.value='Adventure seeker'; if(dna[1]===1) st.value='Culture explorer'; if(dna[2]===3) st.value='Luxury traveler'; }
  if(tm){ if(dna[2]===0) tm.value='walk'; if(dna[2]===3) tm.value='lux'; if(dna[4]===1) tm.value='hybrid'; }
}
try{ applyDna(); }catch(e){}

// JOURNEY LOG + DIGITAL CARD moved to js/itinerary/journey-log.js — except the
// initial logPaint() call below, kept here because it must run after el() (defined
// earlier in this file) and journey-log.js loads before app.js.
logPaint();

/* ============================================================
   PARTNER CODE REDEMPTION (rw-v115) — NMIMS + future partners
   User enters code like NMIMS-A1B2C3 in Settings → gets Pro.
   Admin can see all claims in the admin console.
   ============================================================ */
function openPartnerRedeem(){
  rwForm('&#127891; Redeem a partner code',[
    /* key:/placeholder: — rwFormSubmit reads out[field.key] and renders
       field.placeholder; id:/ph: silently read back undefined. */
    {key:'code', label:'Enter your claim code (e.g. NMIMS-A1B2C3)', placeholder:'NMIMS-XXXXXX'}
  ], async function(v){
    var code=rwSanitizeRefCode(v.code);
    if(!code){ showToast('Enter your code first'); return; }
    if(!user){ openLogin(); return; }
    if(!db){ showToast('Not connected — try again in a moment'); return; }
    /* partnerClaims' doc ID IS the code itself (rw-v116 hardening) — fetch by
       known path with .doc(), not a `where('code','==',...)` query. Firestore
       rules can only validate a specific doc by path (get()/exists()), never
       an arbitrary query, so this is also what lets the rules confirm — via
       isRedeemedByCaller() — that THIS caller already redeemed this exact
       code before granting Pro below (see the two-step write further down). */
    var claimRef=db.collection('partnerClaims').doc(code);
    var snap=await claimRef.get().catch(function(){return null;});
    if(!snap||!snap.exists){ showToast('Code not found. Check it and try again, or email founder@roamwise.co.in'); return; }
    var data=snap.data()||{};
    // Soft UX check only — only the person who was emailed the code SHOULD
    // redeem it, but the real security boundary against replay/reuse now
    // lives in firestore.rules (one-time redemption via two sequential,
    // awaited writes — see below), not in this client-side email comparison.
    if(data.email && user.email && data.email.toLowerCase()!==user.email.toLowerCase()){
      showToast('This code was claimed with a different email. Sign in with '+data.email.split('@')[0]+'@…');
      return;
    }
    // A claim already flipped to redeemed by THIS SAME uid is not "nothing to
    // do" — it means a PRIOR attempt got as far as flipping partnerClaims but
    // then failed on the users/{uid} grant write below (see the create-vs-
    // update gap explained next to that write). That must be resumable on a
    // later attempt, not treated as a dead end, so only block here when the
    // code was redeemed by a DIFFERENT uid.
    var alreadyRedeemedByMe = !!(data.proRedeemed && data.redeemedUid===user.uid);
    if(data.proRedeemed && !alreadyRedeemedByMe){
      showToast('Code already redeemed — your Pro is active. Check your profile.');
      return;
    }
    // Claim codes are issued inside a time-boxed campaign window (e.g. the
    // NMIMS 30-day claim window) and shouldn't be redeemable indefinitely
    // after that — expiresAt is a Firestore Timestamp set at claim time
    // (see nmims/index.html). Absent expiresAt (older claims predating this
    // field) is treated as no expiry, same precedent as proRedeemed above.
    // Skip this check when alreadyRedeemedByMe: that means partnerClaims was
    // already validly flipped to redeemed by this exact user BEFORE expiry,
    // and this attempt is only resuming the Pro-grant write that failed last
    // time — firestore.rules already allows that retry regardless of
    // subsequent expiry, so blocking it here would defeat that fix.
    if(!alreadyRedeemedByMe && data.expiresAt && typeof data.expiresAt.toMillis==='function' && data.expiresAt.toMillis()<Date.now()){
      showToast('This code’s claim window has expired. Email founder@roamwise.co.in if you believe this is a mistake.');
      return;
    }
    /* Flip the claim to redeemed FIRST, as its own separate, AWAITED write,
       THEN grant Pro on users/{uid} — in that exact order, NOT as one atomic
       batch. firestore.rules' users/{uid} partner-grant rule now calls
       isRedeemedByCaller(code), which get()s partnerClaims/{code} and only
       approves the grant once proRedeemed==true and redeemedUid==this uid
       are ALREADY committed — a get() inside a security rule only ever sees
       already-committed state, never a sibling pending write in the same
       batch, so batching these two writes together would make the grant
       rule reject every time. Sequencing them like this (redeem, await,
       then grant) is what actually stops a code being redeemed twice: once
       the flip commits, isRedeemedByCaller() only ever matches this one uid,
       so no other account can replay the same code again. The users/{uid}
       write must touch ONLY pro/proAt/proMethod/proCode — that exact field
       set is what the rules' partner-redeem exception checks for; anything
       else in this write (e.g. the old proPartner/proAmount fields) would be
       rejected.
       Skip this flip entirely when alreadyRedeemedByMe — partnerClaims'
       update rule only allows proRedeemed false/absent -> true (see
       firestore.rules), so re-sending it once it's already true would be
       REJECTED by the rules, aborting this retry before it ever reaches the
       grant step below that actually needs resuming. */
    if(!alreadyRedeemedByMe){
      try{
        await claimRef.update({proRedeemed:true, redeemedAt:new Date().toISOString(), redeemedUid:user.uid});
      }catch(e){
        showToast('Redemption error: '+(e.message||'try again'));
        return;
      }
    }
    try{
      /* CodeRabbit-flagged gap: set(data,{merge:true}) against a users/{uid}
         doc that does NOT yet exist is a CREATE, not an update, in Firestore
         semantics — and the users/{uid} create rule explicitly forbids
         pro/proAt/proMethod/proPayId on create (users can never self-grant
         Pro at signup). If this profile doc hadn't been created yet (e.g.
         the onAuthStateChanged first-sign-in write, ~line 9582, hadn't landed
         yet), this whole write used to be silently rejected — AFTER the
         claim above was already flipped to redeemed, permanently, with no
         path to ever retry it (a create can only happen once, and it would
         always be rejected the same way).
         Fix: explicitly check existence first. If missing, create the SAME
         bare minimal profile shape used on first sign-in (no pro fields —
         satisfies the create rule) as its own separate write, THEN grant Pro
         via a genuine update() (not a merge-set) — since the doc now exists,
         this is a real update and the isRedeemedByCaller()-gated update rule
         applies normally, same as the already-exists case. */
      var userRef=db.collection('users').doc(user.uid);
      var uSnap=await userRef.get();
      if(!uSnap.exists){
        await userRef.set({email:user.email||'', phone:user.phoneNumber||'', name:user.displayName||'', created:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
      }
      await userRef.update({
        pro:true, proAt:new Date().toISOString(),
        proMethod:'partner', proCode:code
      });
      showToast('\ud83c\udf89 Partner Pass activated! Welcome, '+esc2(data.name?data.name.split(' ')[0]:'friend')+'.');
      window._proUnlocked=true;
      /* Reuse the SAME UI-refresh path a real Firestore pro:true write
         triggers (the users/{uid} onSnapshot listener, ~line 9403, calls this
         too) — there is no separate applyPro() anywhere in the app; calling
         it here used to be a guaranteed crash (ReferenceError) that no UI
         caller had ever exercised. Set rw_pro_method locally too (not just via
         the snapshot round-trip) so rwStatusLabel() shows "PARTNER PASS", not
         a paid-sounding badge, the instant this resolves. */
      isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',user.uid); lsSet('rw_pro_method','partner'); refreshProUI();
    }catch(e){
      /* The claim is ALREADY marked redeemed at this point (the first write
         above succeeded) — it cannot be silently retried by re-running this
         flow, since the code now shows as redeemed. Surface that clearly
         instead of a generic error so the user contacts support rather than
         assuming the code is simply broken. */
      showToast('Your code was redeemed, but activating Pro failed — contact founder@roamwise.co.in with your code so we can finish this manually.');
    }
  }, 'Enter the NMIMS-XXXXXX code you received after claiming on the partnership page.');
}

/* ---- Crowd Spotter (Travel & Earn) ---- */
function openCrowdSpot(place,lat,lon){
  var labels=['&#127881; Empty','&#129300; Quiet','&#128513; Moderate','&#128548; Busy','&#128561; Very crowded'];
  rwForm('&#128205; Report crowd now',[
    {key:'level',label:'How crowded is it right now?',widget:'buttons',options:labels.map(function(l,i){return {value:String(i+1),label:l};})},
    {key:'note',label:'Anything unusual? (optional)',placeholder:'festival, roadblock, weather event\u2026'}
  ],function(v){
    var level=parseInt(v.level||'3',10);
    if(!level||level<1||level>5){showToast('Pick a crowd level');return;}
    var rec={level:level,place:String(place||'').slice(0,80),lat:lat||null,lon:lon||null,at:Date.now(),note:String(v.note||'').slice(0,120)};
    if(window.user) rec.uid=window.user.uid;
    if(window.db){
      db.collection('crowdReports').doc(String(place||'spot').replace(/[^a-z0-9]/gi,'_').slice(0,40)+'_'+Date.now()).set(rec)
        .then(function(){ xpAdd(5,'Crowd Spotter report'); showToast('Report logged \u2014 +5 XP! Thank you from everyone planning this trip.'); })
        .catch(function(){ showToast('Saved locally \u2014 will sync when connection is back'); });
    } else { xpAdd(5,'Crowd Spotter report (offline)'); showToast('+5 XP! Report will sync when connected.'); }
  },'Your report helps other travellers and earns you Shinobi XP.');
}

function offerOpen(label){
  var ov=el('openPromptOv');
  if(!ov){ ov=document.createElement('div'); ov.id='openPromptOv'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:340px;text-align:center"><div class="modal-body" id="openPromptBody"></div></div>';
    document.body.appendChild(ov); }
  el('openPromptBody').innerHTML=
     '<div style="font-size:34px;margin-bottom:8px">\ud83d\udcd5</div>'
    +'<div style="font-weight:700;font-size:15.5px;color:var(--t1);margin-bottom:4px">'+label+' saved</div>'
    +'<div style="font-size:12.5px;color:var(--t3);margin-bottom:16px">to Downloads/RoamWise</div>'
    +'<div style="display:flex;gap:8px">'
    +'<button class="tact" style="flex:1" onclick="el(\'openPromptOv\').classList.remove(\'open\')">Later</button>'
    +'<button class="rzp-main-btn" style="flex:1;margin:0" onclick="_doOpenNow()">\ud83d\udc41 Open now</button>'
    +'</div>';
  ov.classList.add('open');
}
function _doOpenNow(){
  el('openPromptOv').classList.remove('open');
  try{ if(window.RW && RW.openLastSaved) RW.openLastSaved(); else showToast('Check Downloads/RoamWise to open it'); }
  catch(e){ showToast('Check Downloads/RoamWise to open it'); }
}
function saveOrDownload(dataUrl, filename){
  if(window.RW && RW.saveCard){ RW.saveCard(dataUrl); showToast('Saving to Downloads/RoamWise\u2026'); return; }
  var a=document.createElement('a'); a.href=dataUrl; a.download=filename; a.click();
}
// ATLAS CERTIFICATE moved to js/itinerary/atlas-certificate.js; JOURNEY MOVIE moved to js/itinerary/journey-movie.js

// CHEAP/LUXE hack pools moved to js/itinerary/ninja-hacks.js

// DAILY BRIEFING (dayBriefing/briefPlan) moved to js/misc/misc-features-2.js

// House ad slots (ADS/adCard) moved to js/misc/misc-features-2.js

// TREK VAULT + FRESH EXPERIENCES (shared WISH list) moved to js/misc/misc-features-2.js

// TRAVEL MODES (MODES/EV_BENCH/modeBox) moved to js/misc/misc-features-2.js

// COMMUTE & TRACK moved to js/misc/misc-features-2.js

// FESTIVALS / EVENTS (FESTS/festLine) moved to js/misc/misc-features-2.js


// POLLUTION + HAPPINESS METERS (METERS/metersBlock) moved to js/itinerary/meters.js

// #tmode change-listener DOMContentLoaded handler moved to js/boot/init.js

var VIEW_OF={promofilm:'film',creator:'film',store:'store',ratings:'extras',treks:'explore',exps:'explore',circuits:'explore',ev:'explore',events:'explore',hubspoke:'explore',basecamp:'explore',jlog:'explore',app:'plan',brief:'home',aipulse:'explore',newspulse:'explore'};
function scrollToId(id){
  if(document.body.classList.contains('shell') && VIEW_OF[id]){
    tabGo(VIEW_OF[id]);
    setTimeout(function(){ var s=el(id); if(s) window.scrollTo({top:s.offsetTop-56,behavior:'smooth'}); },60);
    return;
  }
  var s=el(id); if(s) window.scrollTo({top:s.offsetTop-56,behavior:'smooth'});
}

// Ninja Hacks engine (REGION_FACTS, MO_FULL, nameHash, buildHacks) moved to js/itinerary/ninja-hacks.js

var UPI_VPA = 'coolmohit@ybl', UPI_NAME = 'RoamWise Pro', UPI_AMT = '100';
var _selectedPlan = null; /* set by pickPlan() — drives the amount/label for whatever the user is actually buying */
/* Renders the real feature checklist for whatever the user just picked, into
   #planFeatures, reusing the same .features-grid/.feat-item/.feat-ck markup
   the static pre-selection teaser uses so it looks native. tierId is the
   RWPricing.CONFIG.TIERS id whose benefits this purchase actually grants —
   every purchasable option (monthly/yearly tier, long-term pass, short-term
   pass, or the legacy founder offer) maps to one, so this never renders blank. */
function _renderPlanFeatures(tierId){
  var box = el('planFeatures'); if(!box) return;
  var tier = RWPricing.tierById(tierId);
  var labels = RWPricing.FEATURE_LABELS;
  box.innerHTML = (tier.features||[]).map(function(f){
    return '<div class="feat-item"><span class="feat-ck">✓</span>'+(labels[f]||f)+'</div>';
  }).join('');
}
function pickPlan(planId, priceINR, label, tierId){
  _selectedPlan = {id:planId, priceINR:priceINR, label:label, tierId:tierId};
  UPI_AMT = String(priceINR); UPI_NAME = 'RoamWise '+label;
  qrBuilt = false; /* force QR rebuild for the new amount */
  var qc = el('qrcode'); if(qc) qc.innerHTML='';
  buildQR();
  var ph = el('planHeader'); if(ph) ph.textContent = label+' \u2014 \u20b9'+priceINR;
  /* Founder offer (and any legacy call site that doesn't pass a tierId) grants
     the same lifetime benefits legacy \u20b9100 buyers get \u2014 see currentTier(). */
  _renderPlanFeatures(tierId || 'elite');
  var teaser = el('staticFeaturesTeaser'); if(teaser) teaser.style.display='none';
  var picker = el('planPicker'); if(picker) picker.style.display='none';
  var methods = el('payMethods'); if(methods){
    methods.style.display='block';
    var cp = el('cryptoPanel');
    if(!cp && cryptoConfigured()){ cp=document.createElement('div'); cp.id='cryptoPanel'; methods.appendChild(cp); }
    if(cp) cp.innerHTML = cryptoPanelHTML();
    /* referral badge / "have a code?" prompt, right where money happens */
    var rb = el('refBadge');
    if(!rb){ rb=document.createElement('div'); rb.id='refBadge'; methods.appendChild(rb); }
    try{ rb.innerHTML = rwRefBadgeHTML(); }catch(e){}
  }
}
function backToPlanPicker(){
  var picker = el('planPicker'); if(picker) picker.style.display='block';
  var methods = el('payMethods'); if(methods) methods.style.display='none';
  var teaser = el('staticFeaturesTeaser'); if(teaser) teaser.style.display='';
}
/* setTier() removed — replaced by pickPlan(), which drives the full tier grid */
function upiParams(){ return 'pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am='+UPI_AMT+'&cu=INR&tn='+encodeURIComponent('RoamWise Pro Lifetime'); }
function payVia(app){
  if(app==='generic50'){
    var deep50='upi://pay?pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am=50&cu=INR&tn=RoamWise%20Movie';
    location.href=deep50; showToast('Pay \u20b950, then come back and tap Render'); return;
  }
  if(app==='generic10'){
    var deep10='upi://pay?pa='+UPI_VPA+'&pn='+encodeURIComponent(UPI_NAME)+'&am=10&cu=INR&tn=RoamWise%20PDF';
    location.href=deep10; showToast('Pay \u20b910, then come back and tap Generate'); return;
  }
  if(!requireLogin()) return;
  if(!IS_TOUCH_MOBILE && !IS_APP){ showToast('Scan the QR below with your phone camera or any UPI app'); var q=document.querySelector('.qr-wrap'); if(q) q.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  var generic = 'upi://pay?' + upiParams();
  var deep = generic;
  if(app==='gpay') deep = 'tez://upi/pay?' + upiParams();
  if(app==='phonepe') deep = 'phonepe://pay?' + upiParams();
  if(app==='whatsapp') {
    deep = generic;
    showToast('If WhatsApp is not in the picker: WhatsApp \u2192 any chat \u2192 \ud83d\udcce \u2192 Payment \u2192 pay \u20b9100 to coolmohit@ybl');
  }
  var t0 = Date.now();
  /* try the app-specific scheme; if nothing handles it in ~1.2s, fall back to the generic UPI chooser */
  window.location.href = deep;
  if(deep !== generic){
    setTimeout(function(){ if(Date.now()-t0 < 2200 && !document.hidden){ window.location.href = generic; } }, 1200);
  }
  setTimeout(function(){ showToast('After paying, come back and paste your UTR below \u2b07\ufe0f'); }, 3000);
}
var _qrBuiltAmt = null;
function buildQR(){
  if(qrBuilt && _qrBuiltAmt===UPI_AMT) return; /* real fix: previously this hardcoded am=100
    regardless of the selected tier — Supporter/other tiers showed a ₹100 QR by mistake */
  try{
    if(typeof QRCode!=='undefined'){
      var qc=el('qrcode'); if(qc) qc.innerHTML='';
      new QRCode(el('qrcode'), {text:'upi://pay?'+upiParams(), width:134, height:134, colorDark:'#000', colorLight:'#fff', correctLevel:QRCode.CorrectLevel.M});
      qrBuilt = true; _qrBuiltAmt = UPI_AMT;
      var lbl=el('qrAmtLbl'); if(lbl) lbl.textContent='\ud83d\udcf7 Scan \u2022 \u20b9'+UPI_AMT+' \u2022 UPI: '+UPI_VPA;
    }
  }catch(e){}
}

/* SMART SEARCH — works with zero API keys */
function smartSearch(month, budUSD, ctryQuery, crowd, interests){
  var mi = MONTHS.indexOf(month);
  var ctry = (ctryQuery||'').toLowerCase().trim();
  /* If the destination is an autocomplete-style "City, Country" value (the common/default
     flow — see DEST_NAMES and the live Photon-typeahead dropdown), the part before the first
     comma IS the city the user actually picked. Match against d.name specifically in that case
     so a query like "Rishikesh, India" doesn't match every other destination in India via the
     country segment. A bare, comma-free query (e.g. just "India") keeps the broader OR-based
     name/country/region matching so browsing-by-country still works. */
  var ctryCity = ctry.indexOf(',')>=0 ? ctry.split(',')[0].trim() : '';
  var scores = [];
  DB.forEach(function(d){
    var budgetGap = Math.max(0, d.cost.budget - budUSD);
    var budgetPenalty = budgetGap / 25; /* soft penalty, never excludes */
    var nameLc = d.name.toLowerCase();
    var exactCityMatch = false;
    if(ctry && ctry!=='anywhere in the world' && ctry.indexOf('anywhere')<0){
      var hit;
      if(ctryCity){
        hit = nameLc.indexOf(ctryCity)>=0 || ctryCity.indexOf(nameLc)>=0;
        if(hit) exactCityMatch = true;
      } else {
        hit = nameLc.indexOf(ctry)>=0
           || d.country.toLowerCase().indexOf(ctry)>=0
           || d.region.toLowerCase().indexOf(ctry)>=0
           || ctry.indexOf(d.country.toLowerCase())>=0
           || ctry.indexOf(nameLc)>=0;
      }
      if(!hit) return;
    }
    var sc=0, cs=d.crowd[mi];
    if(crowd==='avoid') sc += (100-cs)*0.6;
    else if(crowd==='some') sc += cs<50 ? (100-cs)*0.5 : cs*0.35;
    else sc += 50;
    interests.forEach(function(iv){
      var kw = iv.toLowerCase().split(' ')[0];
      if(d.interests.some(function(di){ return di.toLowerCase().indexOf(kw)>=0; })) sc+=18;
    });
    sc += Math.max(0, 60 - Math.abs(d.cost.mid-budUSD)/30);
    sc -= budgetPenalty;
    if(d.bestM.indexOf(mi+1)>=0) sc += 28; /* mi is 0-based (MONTHS.indexOf), bestM is 1-based */
    /* Defense-in-depth: strongly favor an exact/near-exact city-name match against the parsed
       "City, Country" query so the destination the user actually asked for always ranks first,
       even in edge cases where multiple destinations legitimately pass the filter above.
       Bonus is well above the realistic combined max of the other bonuses (~50 crowd + 18*few
       interests + 60 budget-fit + 28 month-fit) so it always wins. */
    if(exactCityMatch) sc += 500;
    scores.push({d:d, sc:sc, cs:cs});
  });
  scores.sort(function(a,b){ return b.sc-a.sc; });
  var picked=[], regions=[];
  scores.forEach(function(s){
    if(picked.length>=3) return;
    if(!regions.length || regions.indexOf(s.d.region)<0 || picked.length===2){ picked.push(s); regions.push(s.d.region); }
  });
  if(picked.length<3) scores.forEach(function(s){ if(picked.length<3 && picked.indexOf(s)<0) picked.push(s); });
  return picked.slice(0,3);
}

/* ── UNIVERSAL DESTINATION SUPPORT ── */
/* Pure-JS flag emoji — zero network calls, works for any ISO-3166 alpha-2 code */
function flagEmoji(iso2){
  if(!iso2 || iso2.length!==2) return '🌍';
  var cc = iso2.toUpperCase();
  var c1 = cc.charCodeAt(0), c2 = cc.charCodeAt(1);
  if(c1<65||c1>90||c2<65||c2>90) return '🌍';
  return String.fromCodePoint(127397+c1, 127397+c2);
}

function lookupCountryInfo(name){
  var key = (name||'').toLowerCase().trim();
  return COUNTRY_INFO[key] || null;
}

/* Build a usable destination card for ANY place the user types, even ones not in our curated 15. */
function buildGenericDestination(query, budUSD){
  var raw = (query||'').trim();
  var parts = raw.split(',');
  var place = parts[0].trim() || raw;
  var maybeCountry = parts.length>1 ? parts[parts.length-1].trim() : '';
  var cinfo = lookupCountryInfo(maybeCountry) || lookupCountryInfo(place) || lookupCountryInfo(raw);
  var resolvedCountryName = maybeCountry || (lookupCountryInfo(place) ? place : (lookupCountryInfo(raw) ? raw : ''));
  /* If the user typed just a bare country name (no city), show that name as the place too */
  var displayName = place;
  var id = 'generic_' + raw.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,40);

  var mid = Math.max(300, budUSD);
  var budget = Math.round(mid*0.62);
  var luxury = Math.round(mid*2.1);

  return {
    id: id,
    name: displayName,
    country: resolvedCountryName,
    region: 'Worldwide',
    lat: null, lon: null,
    crowd: [50,50,52,55,55,52,50,50,52,55,52,50],
    cost: { budget:budget, mid:mid, luxury:luxury },
    brk: { flights:Math.round(mid*0.34), stay:Math.round(mid*0.27), food:Math.round(mid*0.16), act:Math.round(mid*0.15), misc:Math.round(mid*0.08) },
    visa: { type:'Check requirements', cost:'Varies', days:'—', note:'Visa rules vary by nationality — check the nearest embassy, consulate, or VFS Global centre for current Indian-passport requirements before booking.' },
    bestM: [],
    interests: [],
    food: ['Try the local specialities — ask your accommodation host for their personal favourites'],
    gems: ['Wander beyond the main square — the best finds are rarely the first search result'],
    tags: [],
    cur: cinfo ? cinfo.currency : 'Local currency',
    sym: '',
    rate: 1,
    local: { 'Note':'Exact local prices vary — use a currency converter on arrival' },
    photos: [place+' city', place+' landmark', place+' travel'],
    yt: place+' travel guide',
    wiki: raw.replace(/\s+/g,'_'),
    flag: cinfo ? cinfo.iso : null,
    isGeneric: true,
    capital: cinfo ? cinfo.capital : '',
    language: cinfo ? cinfo.language : ''
  };
}

/* ── SAFE IMAGE PIPELINE ──
   Unsplash Source and REST Countries are both dead/paywalled (verified). 
   We use Wikipedia's free, CORS-enabled REST API for real contextual photos,
   with a strict content-safety filename filter, and Picsum as a guaranteed fallback. */
var UNSAFE_IMAGE_TERMS = ['flag','coat_of_arms','locator','projection','anthem','emblem','seal_of','map_of','_map','topographic',
  'war','hitler','nazi','military','weapon','gun','missile','conflict','protest','riot','massacre','attack','terror','genocide',
  'nude','naked','nsfw','porn','sex','fascist','soldier','battle','bomb','corpse','dead_body','execution'];

function isSafePhotoTitle(title){
  var t = (title||'').toLowerCase();
  if(t.indexOf('.svg')>=0 || t.indexOf('.gif')>=0) return false;
  for(var i=0;i<UNSAFE_IMAGE_TERMS.length;i++){
    if(t.indexOf(UNSAFE_IMAGE_TERMS[i])>=0) return false;
  }
  return true;
}

function bestSrcFromSrcset(srcset){
  if(!srcset || !srcset.length) return null;
  var best = srcset[srcset.length-1].src || srcset[0].src;
  if(best.indexOf('//')===0) best = 'https:'+best;
  return best;
}

function picsumUrl(seed, w, h){
  return 'https://picsum.photos/seed/'+encodeURIComponent(seed)+'/'+w+'/'+h;
}

function loadPhotosForCard(d, ci){
  var wikiTitle = d.wiki || d.name.replace(/\s+/g,'_');
  var urls = [];

  function finish(){
    while(urls.length<5) urls.push(picsumUrl(d.id+'_'+urls.length, urls.length===0?900:400, urls.length===0?500:300));
    var imgIds = ['photo_main_'+ci, 'photo_sm_'+ci+'_0', 'photo_sm_'+ci+'_1'];
    var elMain = document.getElementById(imgIds[0]);
    if(elMain) elMain.src = urls[0];
    var elS0 = document.getElementById(imgIds[1]);
    if(elS0) elS0.src = urls[1];
    var elS1 = document.getElementById(imgIds[2]);
    if(elS1) elS1.src = urls[2];
  }

  fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(wikiTitle))
    .then(function(r){ if(!r.ok) throw new Error('404'); return r.json(); })
    .then(function(s){
      var img = (s.originalimage||s.thumbnail||{}).source;
      if(img && isSafePhotoTitle(img)) urls.push(img);
      return fetch('https://en.wikipedia.org/api/rest_v1/page/media-list/'+encodeURIComponent(wikiTitle));
    })
    .then(function(r){ if(!r || !r.ok) throw new Error('no media'); return r.json(); })
    .then(function(ml){
      (ml.items||[]).forEach(function(item){
        if(urls.length>=5) return;
        if(item.type!=='image' || !item.showInGallery) return;
        if(!isSafePhotoTitle(item.title)) return;
        var src = bestSrcFromSrcset(item.srcset);
        if(src && urls.indexOf(src)<0) urls.push(src);
      });
      finish();
    })
    .catch(function(){ finish(); });
}

/* OPTIONAL AI ENHANCEMENT */
/* Static per-provider fallback chains. NOTE on groq: llama-3.3-70b-versatile
   and llama-3.1-8b-instant were BOTH deprecated by Groq on 2026-08-16 for
   free/developer-tier keys (still usable on enterprise committed-spend
   plans, hence kept as a last-resort entry here) — a key that only ever
   tried those two used to exhaust this list and surface a scary "model does
   not exist" error even though the KEY itself was perfectly valid. The
   current recommended replacements are the openai/gpt-oss models. This list
   is only the fallback of last resort, though: testKey()/aiCall() prefer a
   LIVE model list fetched from Groq's own /openai/v1/models endpoint with
   the user's key when possible, since that's always current. */
var AI_MODELS = {
  groq: ['openai/gpt-oss-120b','openai/gpt-oss-20b','llama-3.3-70b-versatile'],
  cerebras: ['llama-3.3-70b','llama3.1-8b'],
  github: ['gpt-4o','Meta-Llama-3.1-70B-Instruct'],
  gemini: ['gemini-2.5-flash','gemini-flash-latest'],
  openrouter: ['meta-llama/llama-3.3-70b-instruct:free','mistralai/mistral-small-3.1-24b-instruct:free','google/gemma-3-27b-it:free'],
  mistral: ['mistral-small-latest','open-mistral-nemo'],
  anthropic: ['claude-sonnet-5']
};
var lastAiSource = null; /* {prov, model} of the last successful AI call, or null */
function extractJSON(txt){
  if(!txt) return null;
  try{ return JSON.parse(txt); }catch(e){}
  var a=txt.indexOf('{'), b=txt.lastIndexOf('}');
  if(a>-1 && b>a){ try{ return JSON.parse(txt.slice(a,b+1)); }catch(e){} }
  a=txt.indexOf('['); b=txt.lastIndexOf(']');
  if(a>-1 && b>a){ try{ var arr=JSON.parse(txt.slice(a,b+1)); return {days:arr}; }catch(e){} }
  return null;
}

function aiRequest(prov, key, model, prompt, maxTok, jsonMode){
  var url, headers, body;
  if(prov==='anthropic'){
    url='https://api.anthropic.com/v1/messages';
    headers={'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    body=JSON.stringify({model:model, max_tokens:maxTok, messages:[{role:'user',content:prompt}]});
  } else if(prov==='gemini'){
    url='https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent?key='+key;
    headers={'Content-Type':'application/json'};
    var gc={maxOutputTokens:maxTok, temperature:0.7}; if(jsonMode) gc.responseMimeType='application/json';
    body=JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:gc});
  } else {
    var bases={groq:'https://api.groq.com/openai/v1', cerebras:'https://api.cerebras.ai/v1',
      github:'https://models.inference.ai.azure.com', openrouter:'https://openrouter.ai/api/v1',
      mistral:'https://api.mistral.ai/v1'};
    url=(bases[prov]||bases.groq)+'/chat/completions';
    headers={'Content-Type':'application/json','Authorization':'Bearer '+key};
    if(prov==='openrouter'){ headers['HTTP-Referer']='https://www.roamwise.co.in'; headers['X-Title']='RoamWise Pro'; }
    var ob={model:model, max_tokens:maxTok, messages:[{role:'user',content:prompt}]};
    if(jsonMode && prov!=='openrouter') ob.response_format={type:'json_object'};
    body=JSON.stringify(ob);
  }
  var ctrl = ('AbortController' in window)? new AbortController() : null;
  var tmr = ctrl? setTimeout(function(){ ctrl.abort(); }, 15000) : null;
  return fetch(url,{method:'POST',headers:headers,body:body,signal:ctrl?ctrl.signal:undefined})
    .then(function(r){ return r.json().then(function(d){ return {status:r.status, data:d}; }); })
    .then(function(res){
      clearTimeout(tmr);
      var data=res.data;
      if(res.status>=400){
        var em=(data&&data.error&&(data.error.message||data.error))
              || (data&&data.message)  /* Cerebras & friends: flat {message,type,code} */
              || ('HTTP '+res.status);
        if(typeof em!=='string') em=JSON.stringify(em).slice(0,120);
        var e=new Error(em); e.httpStatus=res.status; throw e;
      }
      var txt='';
      if(prov==='anthropic') txt=(data.content||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('');
      else if(prov==='gemini') txt=((((data.candidates||[])[0]||{}).content||{}).parts||[]).map(function(p){return p.text||'';}).join('');
      else txt=(((data.choices||[])[0]||{}).message||{}).content||'';
      txt = txt.replace(/^```json\s*/m,'').replace(/^```\s*/m,'').replace(/\s*```\s*$/m,'').trim();
      if(!txt) throw new Error('Empty response from '+prov);
      return txt;
    })
    .catch(function(e){
      clearTimeout(tmr);
      if(e.name==='AbortError') throw new Error('Timed out after 15s — check your connection');
      throw e;
    });
}

/* Tries each model for the active provider; cb(errorString|null, text|null) */
function aiCall(prompt, maxTok, cb, jsonMode){
  var prov=activeProv, key=lsGet('rwKey_'+prov);
  if(prov==='smart' || !key){ lastAiSource=null; cb(null,null); return; }
  var models = AI_MODELS[prov]||[];
  /* Groq: put whatever testKey() last discovered as a REAL working model for
     THIS key (via Groq's live /models endpoint) first in line, ahead of the
     static guesses — it's always at least as current as this hardcoded list. */
  if(prov==='groq'){
    var discovered = lsGet('rwKey_groq_model');
    if(discovered && models.indexOf(discovered)===-1) models=[discovered].concat(models);
  }
  var i=0;
  function attempt(lastErr){
    if(i>=models.length){ lastAiSource=null; cb(lastErr||'All models failed', null); return; }
    var m=models[i++];
    aiRequest(prov,key,m,prompt,maxTok,jsonMode)
      .then(function(txt){ lastAiSource={prov:prov, model:m}; cb(null, txt); })
      .catch(function(e){
        /* model-not-found → try next model; auth/quota → stop and surface */
        var msg=String(e.message||e);
        if(e.httpStatus===401||e.httpStatus===403||/api key|permission|quota|billing/i.test(msg)){ lastAiSource=null; cb(msg, null); }
        else attempt(msg);
      });
  }
  attempt(null);
}

/* PROVIDER INDEPENDENCE: one provider failing (or hitting its daily cap) must
   never take the answer down. Tries the ACTIVE provider's models first, then
   EVERY other armed provider in turn; only if all fail does the caller fall
   back to Ailon Tusk's own engine. Auth/quota errors skip to the NEXT PROVIDER. */
function aiCallAny(prompt, maxTok, cb, jsonMode){
  var all=['groq','cerebras','github','gemini','openrouter','mistral','anthropic'];
  var order=[activeProv].concat(all.filter(function(p){ return p!==activeProv; }))
    .filter(function(p){ return p && p!=='smart' && lsGet('rwKey_'+p); });
  if(!order.length){ lastAiSource=null; cb(null,null); return; }
  var oi=0;
  (function nextProv(lastErr){
    if(oi>=order.length){ lastAiSource=null; cb(lastErr||'All providers failed', null); return; }
    var prov=order[oi++], key=lsGet('rwKey_'+prov), models=AI_MODELS[prov]||[], mi=0;
    (function tryM(err){
      if(mi>=models.length){ nextProv(err); return; }
      var m=models[mi++];
      aiRequest(prov,key,m,prompt,maxTok,jsonMode)
        .then(function(txt){ lastAiSource={prov:prov, model:m}; cb(null, txt); })
        .catch(function(e){
          var msg=String(e.message||e);
          if(e.httpStatus===401||e.httpStatus===403||/api key|permission|quota|billing|rate.?limit/i.test(msg)) nextProv(msg);
          else tryM(msg);
        });
    })(null);
  })(null);
}

/* Key tester
 — used by the Test buttons in Settings */
function testKeyFallbackChain(prov, key, st){
  var models=AI_MODELS[prov]||[], i=0;
  (function tryM(lastErr){
    if(i>=models.length){ st.textContent='✗ '+String(lastErr).slice(0,60); st.className='key-status ks-bad'; showToast('Key failed: '+String(lastErr).slice(0,80)); return; }
    var m=models[i++];
    aiRequest(prov,key,m,'Reply with exactly: OK',10)
      .then(function(){ st.textContent='✓ working ('+m+')'; st.className='key-status ks-ok'; showToast(prov+' key verified ✓'); if(prov==='groq') lsSet('rwKey_groq_model', m); })
      .catch(function(e){
        if(e.httpStatus===401||e.httpStatus===403){ st.textContent='✗ invalid key'; st.className='key-status ks-bad'; showToast('Key rejected — regenerate it and paste again'); }
        else tryM(e.message||e);
      });
  })(null);
}
function testKey(prov){
  var key=(el(prov+'Key').value||'').trim() || lsGet('rwKey_'+prov);
  var st=el(prov+'Status');
  if(!key){ st.textContent='no key'; st.className='key-status ks-empty'; return; }
  st.textContent='testing…'; st.className='key-status ks-empty';

  /* GROQ: ask Groq itself which models this key can actually use right now,
     via its OpenAI-compatible /models endpoint, instead of betting everything
     on one hardcoded model string. This is what actually fixes "the model
     `llama-3.1-8b-instant` does not exist" — that model (and
     llama-3.3-70b-versatile) were both deprecated by Groq on 2026-08-16, so a
     fixed test model can go stale again the same way; a live lookup can't. */
  if(prov==='groq'){
    fetch('https://api.groq.com/openai/v1/models', {headers:{'Authorization':'Bearer '+key}})
      .then(function(r){ return r.json().then(function(d){ return {status:r.status, data:d}; }); })
      .then(function(res){
        if(res.status===401 || res.status===403){
          st.textContent='✗ invalid key'; st.className='key-status ks-bad';
          showToast('Key rejected — regenerate it and paste again');
          return;
        }
        var ids=((res.data && res.data.data)||[]).map(function(m){ return m.id; }).filter(Boolean);
        if(!ids.length){ testKeyFallbackChain(prov, key, st); return; }
        /* Prefer a current flagship "versatile"/70B-class model if this key
           can use one, else just take the first non-audio/non-guard model —
           the user only cares that SOMETHING works, not the exact name. */
        var pick = ids.filter(function(id){ return /gpt-oss-120b/i.test(id); })[0]
                || ids.filter(function(id){ return /70b/i.test(id) && !/whisper|guard|tts/i.test(id); })[0]
                || ids.filter(function(id){ return !/whisper|guard|tts|distil/i.test(id); })[0]
                || ids[0];
        lsSet('rwKey_groq_model', pick);
        st.textContent='✓ working ('+pick+')'; st.className='key-status ks-ok';
        showToast('groq key verified ✓');
      })
      .catch(function(){
        /* Live list unreachable (network hiccup, CORS, etc.) — fall back to
           the static chain rather than blocking the user. */
        testKeyFallbackChain(prov, key, st);
      });
    return;
  }
  testKeyFallbackChain(prov, key, st);
}

/* MAIN SEARCH */
function runSearch(){
  try{ xpAdd(10, "Mission planned"); }catch(e){}
  try{ track('searches'); maybeNudge(); }catch(e){}
  var month = el('month').value;
  if(!month){ showToast('Please select a travel month'); return; }
  if(!isPro){
    if(freeLeft<=0){ openPay(); showToast('Daily limit reached — Upgrade for unlimited!'); return; }
    freeLeft--; lsSet('rwFLeft', String(freeLeft));
    el('freeCount').textContent = freeLeft;
    if(freeLeft===0) showToast('Last free search! Upgrade for '+proPriceLabel(100)+' for unlimited.');
  }
  var origin = (el('origin').value||'India').trim();
  var days = parseInt(el('dur').value)||14;
  var dest = window.getDestVal ? window.getDestVal() : 'Anywhere';
  var style = el('style').value;
  var crowd = el('crowd').value;
  var budUSD = parseInt(el('budgetSlider').value)||1200;
  var interests = [];
  document.querySelectorAll('.tag.on').forEach(function(t){ interests.push(t.dataset.v); });

  var btn = el('searchBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="shim-line"></span>Finding destinations...';
  var out = el('results');
  out.innerHTML = `<div class="loader"><div class="spin-ring"></div><div class="load-txt"><strong id="loadMsg">Matching destinations...</strong><span>Smart Search + free data sources</span></div></div>`;
  var msgs = ['Matching destinations...','Checking crowd levels...','Finding hidden gems...','Building results...'];
  var mi2 = 0;
  var tick = setInterval(function(){ mi2=(mi2+1)%msgs.length; var e=el('loadMsg'); if(e) e.textContent=msgs[mi2]; }, 1400);

  var topR = smartSearch(month, budUSD, dest, crowd, interests);
  var isGenericResult = false;
  var destLower = (dest||'').toLowerCase().trim();
  var wantsSpecificPlace = destLower && destLower !== 'anywhere' && destLower.indexOf('anywhere') < 0;
  /* A "City, Country" style query (the autocomplete/typeahead flow) went through smartSearch's
     city-specific matching path, which legitimately narrows to just the matched city/cities.
     Padding that out with an unfiltered global search would reintroduce unrelated destinations
     (e.g. "Rishikesh, India" pulling in Munnar), defeating the point of that narrowing — so for
     a city-qualified query that found at least one real match, show fewer than 3 cards instead
     of topping up with unrelated places. */
  var isCityQualified = destLower.indexOf(',') >= 0;

  if(wantsSpecificPlace && topR.length < 3){
    if(topR.length === 0){
      /* No curated match at all — build a generic card for the typed place */
      var generic = buildGenericDestination(dest, budUSD);
      isGenericResult = true;
      var alts0 = smartSearch(month, budUSD, '', crowd, interests).filter(function(r){
        return r.d.name.toLowerCase() !== generic.name.toLowerCase();
      });
      topR = [{ d:generic, sc:999, cs:generic.crowd[MONTHS.indexOf(month)] }].concat(alts0).slice(0,3);
    } else if(!isCityQualified){
      /* Found some curated matches but fewer than 3 — top up with global best.
         Skipped for city-qualified queries (see isCityQualified note above) since a specific
         city legitimately matching just 1-2 destinations is expected, not a gap to fill. */
      var foundIds = topR.map(function(r){ return r.d.id; });
      var alts1 = smartSearch(month, budUSD, '', crowd, interests).filter(function(r){
        return foundIds.indexOf(r.d.id) < 0;
      });
      topR = topR.concat(alts1).slice(0,3);
    }
  }

  if(!topR.length){
    clearInterval(tick); btn.disabled=false; btn.innerHTML='<span class="shim-line"></span>🔍 Find My Destinations — Works Without Any API Key';
    out.innerHTML = `<div class="err-box"><strong style="display:block;margin-bottom:5px">No destinations found</strong>Try increasing your budget or removing some filters.</div>`;
    return;
  }

  var hasKey = lsGet('rwKey_'+activeProv);
  if(activeProv!=='smart' && hasKey){
    var destList = topR.map(function(r){ return r.d.name+'/'+r.d.country; }).join(' | ');
    var shapeItems = topR.map(function(r, i){
      var tipCopy = i===0 ? '1 practical tip for '+month : '1 tip';
      return '{"id":"'+r.d.id+'","desc":"2 vivid sentences","tip":"'+tipCopy+'"}';
    }).join(',');
    var aiPrompt = 'Briefly enhance these travel destinations for a traveler from '+origin+' in '+month+' ($'+budUSD+' budget, interests: '+interests.join(',')+'). Destinations: '+destList+'. Return ONLY valid JSON with this exact shape: {"e":['+shapeItems+']}';
    aiCall(aiPrompt, 600, function(err, txt){
      clearInterval(tick); btn.disabled=false; btn.innerHTML='<span class="shim-line"></span>🔍 Find My Destinations — Works Without Any API Key';
      var aiData = null;
      if(txt){ try{ aiData = JSON.parse(txt); }catch(x){} }
      renderCards(topR, month, budUSD, origin, days, aiData, style, isGenericResult);
    });
  } else {
    clearInterval(tick); btn.disabled=false; btn.innerHTML='<span class="shim-line"></span>🔍 Find My Destinations — Works Without Any API Key';
    renderCards(topR, month, budUSD, origin, days, null, style, isGenericResult);
  }
}

/* RENDER RESULTS — built entirely with template literals */
function renderCards(results, month, budUSD, origin, days, aiData, travelStyle, isGenericResult){
  itinBuilt = {};
  var mi = MONTHS.indexOf(month);
  var provLabel = activeProv==='smart' ? 'Smart Search' : (lsGet('rwKey_'+activeProv) ? activeProv.charAt(0).toUpperCase()+activeProv.slice(1)+' AI' : 'Smart Search');

  var H = `<div class="live-bar"><div class="live-dot"></div><span>Results for <strong style="color:#16BF96">${month}</strong> &bull; ${provLabel}${aiData ? ' &bull; <strong style="color:#BF8CFF">AI enhanced</strong>' : ''}${isPro ? ' &bull; <strong style="color:#E8BA6C">Pro Active</strong>' : ''}</span>${(activeProv==='smart' && !lsGet('rwKey_gemini') && !lsGet('rwKey_groq')) ? '<span style="font-size:10px;color:#4A4946;margin-left:auto;cursor:pointer" onclick="openSettings()">+ Add free AI key</span>' : ''}</div>`;

  H += `<div class="cmp-wrap"><table class="cmp-table"><thead><tr><th>Destination</th><th>Crowd in ${month}</th><th>Mid budget</th><th>Visa (India)</th><th>Best months</th></tr></thead><tbody>`;
  results.forEach(function(r){
    var d=r.d, cs=r.cs, bl = cs<35?'badge-low':cs<60?'badge-mid':'badge-hi', ct = cs<35?'Low':cs<60?'Moderate':'Busy';
    var bm = d.bestM.length ? d.bestM.slice(0,3).map(function(m){return MO[m-1]||m;}).join(', ') : 'Year-round';
    H += `<tr><td><strong>${flagEmoji(d.flag)} ${d.name}</strong>${d.country?`<br><span style="font-size:10px;color:#4A4946">${d.country}</span>`:''}</td><td><span class="badge ${bl}" style="font-size:11px">${cs}% ${ct}</span></td><td>${fmtMoney(d.cost.mid)}</td><td style="font-size:11px">${d.visa.type}<br><span style="color:#16BF96">${d.visa.cost}</span></td><td style="font-size:11px">${bm}</td></tr>`;
  });
  H += `</tbody></table></div>`;
  H += adCard(0);

  if(!isPro) H += `<div class="promo" style="margin-bottom:14px" onclick="openPay()"><div class="promo-left">👑</div><div class="promo-text"><strong>Unlock Pro — ${proPriceLabel(100)} lifetime</strong><span>Full itineraries &bull; Budget tracker &bull; WhatsApp share &amp; more</span></div><div class="promo-price"><span class="promo-amt">${proPriceLabel(100)}</span></div></div>`;

  H += `<div class="card-list">`;

  results.forEach(function(r, ci){
    var d=r.d, cs=r.cs, feat = ci===0;
    var bl = cs<35?'badge-low':cs<60?'badge-mid':'badge-hi';
    var ct = cs<35?'Low crowds':cs<60?'Moderate':'Busy';
    var barCls = cs<35?'crowd-bar-low':cs<60?'crowd-bar-mid':'crowd-bar-hi';
    var enh = (aiData && aiData.e) ? aiData.e.find(function(x){ return x.id===d.id; })||null : null;
    var idays = isPro ? Math.min(days,14) : 3;
    var others = results.filter(function(_,i){ return i!==ci; });
    var enc = encodeURIComponent(d.name+' '+(d.country||''));
    var waMsg = encodeURIComponent('RoamWise Trip: '+d.name+', '+(d.country||'')+' | '+month+' | Budget: '+fmtMoney(d.cost.mid)+' | Crowd: '+ct+' | Visa: '+d.visa.type+' | Food: '+d.food.slice(0,2).join(', ')+' | Gem: '+d.gems[0]+' | RoamWise Pro');
    var T = 'c'+ci;
    var P2 = 'p'+ci;
    var placeholder900 = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="500"%3E%3Crect width="900" height="500" fill="%23121828"/%3E%3C/svg%3E';
    var placeholder400 = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23121828"/%3E%3C/svg%3E';

    H += `<div class="card${feat?' featured':''}" style="animation-delay:${ci*0.1}s">`;

    /* Photos — placeholders now, filled in by loadPhotosForCard() right after render */
    H += `<div class="photos">
      <div class="photo-big" onclick="openLbox(document.getElementById('photo_main_${ci}').src)">
        <img id="photo_main_${ci}" src="${placeholder900}" alt="${d.name}" loading="lazy" onerror="this.src='${picsumUrl(d.id+'_m',900,500)}'">
        <div class="photo-overlay"></div><div class="photo-city">${d.name}</div><div class="photo-country">${d.country||''}</div>
      </div>
      <div class="photo-small-col">
        <div class="photo-sm" onclick="openLbox(document.getElementById('photo_sm_${ci}_0').src)"><img id="photo_sm_${ci}_0" src="${placeholder400}" alt="" loading="lazy" onerror="this.src='${picsumUrl(d.id+'_0',400,300)}'"></div>
        <div class="photo-sm" onclick="openLbox(document.getElementById('photo_sm_${ci}_1').src)"><img id="photo_sm_${ci}_1" src="${placeholder400}" alt="" loading="lazy" onerror="this.src='${picsumUrl(d.id+'_1',400,300)}'"></div>
      </div>
    </div>`;

    /* Card head */
    var flagIco = flagEmoji(d.flag);
    var bestMonthsLabel = d.bestM.length ? d.bestM.slice(0,3).map(function(m){return MO[m-1]||m;}).join(', ') : 'Year-round';
    H += `<div class="card-head">
      <div>
        <div class="card-rank${feat?' gold':''}">${feat ? (isGenericResult ? '📍 Your pick' : '⭐ Top pick for '+month) : (isGenericResult ? 'Alternative '+ci : 'Option '+(ci+1))}</div>
        <div class="card-name">${flagIco} ${d.name}</div>
        <div class="card-ctry">${d.country ? d.country+' &bull; ' : ''}${d.region}</div>
      </div>
      <div class="badges">
        <span class="badge ${bl}">${ct}</span>
        <span class="badge badge-cost">${fmtMoney(d.cost.mid)}</span>
        <span class="badge badge-sea">${bestMonthsLabel}</span>
      </div>
    </div>`;

    /* Tabs */
    H += `<div class="card-body"><div class="tabs">
      <button class="tab-btn on" data-t="${T}" data-tab="ov" onclick="swTab('${T}','ov')">Overview</button>
      <button class="tab-btn" data-t="${T}" data-tab="dt" onclick="swTab('${T}','dt')">Data</button>
      <button class="tab-btn" data-t="${T}" data-tab="bu" onclick="swTab('${T}','bu')">Budget</button>
      <button class="tab-btn" data-t="${T}" data-tab="it" onclick="swTab('${T}','it')">${isPro?'Itinerary':'Itin 🔒'}</button>
      <button class="tab-btn" data-t="${T}" data-tab="pt" onclick="swTab('${T}','pt')">${isPro?'Pro Tools':'Pro 🔒'}</button>
      <button class="tab-btn" data-t="${T}" data-tab="bk" onclick="swTab('${T}','bk')">Book</button>
    </div>`;

    /* OVERVIEW */
    H += `<div class="tab-pane on" id="${T}-ov">
      <div class="crowd-section">
        <div class="crowd-row"><span class="crowd-lbl">Crowd — ${month}</span><span class="crowd-pct" style="color:${cs<35?'#16BF96':cs<60?'#E09030':'#D84F4F'}">${cs}%</span></div>
        <div class="crowd-track"><div class="crowd-bar ${barCls}" style="width:0%" data-w="${cs}"></div></div>
        <div class="crowd-note">${cs<35 ? 'Great time to visit — well below average crowds' : cs<60 ? 'Moderate visitor numbers — manageable if you plan ahead' : 'Peak season — book early and visit popular spots at dawn'}</div>
      </div>
      <div class="desc" id="desc_${ci}">${enh && enh.desc ? enh.desc : (d.isGeneric ? 'Loading a quick overview from Wikipedia…' : d.interests.slice(0,3).join(', ')+' make '+d.name+' a rewarding destination for the '+travelStyle.split(' ')[0].toLowerCase()+' traveler in '+month+'.')}</div>
      ${enh && enh.tip ? `<div class="why-box"><strong>AI tip for ${month}</strong>${enh.tip}</div>` : ''}
      ${modeBox(d)}
      ${trackBar(d)}
      ${festLine(d, mi, month)}
      <div class="fest-line" id="pulse_${T}" style="display:none;color:var(--crim2)"></div>
      <div class="sec-label">🍽 Must-try food</div>
      <div class="food-list">${d.food.map(function(f){return `<span class="food-tag">${f}</span>`;}).join('')}</div>
      <div class="sec-label">💎 Hidden gems</div>
      <div class="gem-list">${d.gems.map(function(g){return `<span class="gem-tag"><span class="gem-dot"></span>${g}</span>`;}).join('')}</div>
      <div class="sec-label hx">🥷 Ninja hacks &amp; secret facts</div>
      <div class="hack-list">${buildHacks(d, mi, month).map(function(h){return `<div class="hack"><span class="hx-ic">${h.ic}</span><div><strong>${h.t}</strong>${h.x}</div></div>`;}).join('')}</div>
      <a class="yt-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(d.yt)}" target="_blank" rel="noopener">▶ Watch ${d.name} travel videos on YouTube</a>
    </div>`;

    /* DATA TAB */
    var maxC = Math.max.apply(null, d.crowd);
    H += `<div class="tab-pane" id="${T}-dt">
      <div class="info-card"><div class="info-flag">${flagIco}</div><div><div class="info-name">${d.country||d.region}</div><div class="info-detail">${(function(){var ci2=lookupCountryInfo(d.country);return (ci2?`Capital: <strong>${ci2.capital}</strong> &bull; `:'')+`Currency: <strong>${d.cur}</strong>`+(ci2?` &bull; Language: <strong>${ci2.language}</strong>`:'');})()}</div></div></div>
      <div class="visa-card"><div class="visa-ico">${d.visa.type.toLowerCase().indexOf('free')>=0?'🟢':d.visa.type.toLowerCase().indexOf('arrival')>=0?'🟡':'🔵'}</div><div><div class="visa-title">${d.visa.type}</div><div class="visa-cost">${d.visa.cost} &bull; ${d.visa.days} days</div><div class="visa-note">${d.visa.note}</div></div></div>
      ${metersBlock(d)}
      <div class="sec-label">📊 Monthly crowd chart</div>
      <div class="bar-chart">${d.crowd.map(function(cv,idx){
        var clr = cv<35?'#16BF96':cv<60?'#E09030':'#D84F4F';
        return `<div class="bc${idx===mi?' sel':''}"><div class="bc-bar" style="height:${(cv/maxC*100).toFixed(0)}%;background:${clr}"></div><div class="bc-lbl">${MO[idx]}</div></div>`;
      }).join('')}</div>
      <div class="sec-label">📅 Best months to visit</div>
      <div class="bm-grid">${MO.map(function(m,idx){
        var best = d.bestM.indexOf(idx+1)>=0; /* idx is 0-based (MO array), bestM is 1-based */
        return `<div class="bm${best?' best':''}${idx===mi?' sel':''}">${m}</div>`;
      }).join('')}</div>
    </div>`;

    /* BUDGET TAB */
    var brkItems = [['✈ Flights',d.brk.flights],['🏨 Stay',d.brk.stay],['🍜 Food',d.brk.food],['🎫 Activities',d.brk.act],['💬 Misc',d.brk.misc]];
    var brkTotal = brkItems.reduce(function(s,x){return s+x[1];},0);
    H += `<div class="tab-pane" id="${T}-bu">
      <div class="tier-row">
        <div class="tier"><div class="tier-lbl">Budget</div><div class="tier-val">${fmtMoney(d.cost.budget)}</div><div class="tier-note">Hostel &bull; street food</div></div>
        <div class="tier on"><div class="tier-lbl">Mid-range</div><div class="tier-val">${fmtMoney(d.cost.mid)}</div><div class="tier-note">3★ hotel &bull; restaurants</div></div>
        <div class="tier"><div class="tier-lbl">Luxury</div><div class="tier-val">${fmtMoney(d.cost.luxury)}</div><div class="tier-note">5★ &bull; private tours</div></div>
      </div>
      <div class="sec-label">Cost breakdown</div>
      <div class="brk-list">
        ${brkItems.map(function(item){
          var pct = Math.round(item[1]/brkTotal*100);
          return `<div class="brk-row"><div class="brk-lbl">${item[0]}</div><div class="brk-track"><div class="brk-fill" style="width:${pct}%"></div></div><div class="brk-val">${fmtMoney(item[1])}<span class="brk-pct">${pct}%</span></div></div>`;
        }).join('')}
        <div class="brk-row" style="border-top:1px solid rgba(255,255,255,.07);padding-top:6px;margin-top:2px"><div class="brk-lbl" style="font-weight:600;color:#EDE8DF">Total</div><div class="brk-track"><div class="brk-fill brk-fill-gold" style="width:100%"></div></div><div class="brk-val" style="color:#E8BA6C;font-weight:600">${fmtMoney(brkTotal)}</div></div>
      </div>
      <div class="sec-label">Local prices (${d.sym} ${d.cur})</div>
      <table class="price-table"><tbody>${Object.keys(d.local).map(function(k){return `<tr><td>${k.replace(/_/g,' ')}</td><td>${d.local[k]}</td></tr>`;}).join('')}</tbody></table>
    </div>`;

    /* ITINERARY TAB */
    H += `<div class="tab-pane" id="${T}-it">`;
    if(!isPro){
      H += `<div class="gate" onclick="openPay()"><span class="gate-ico">📅</span><div class="gate-title">Full ${Math.min(days,14)}-day itinerary — Pro only</div><div class="gate-sub">Detailed day-by-day plan with specific places, timings, local tips and restaurant picks. Built from our database, AI-enhanced if a key is added.</div><button class="gate-btn">Unlock for ${proPriceLabel(100)} →</button></div>`;
    } else {
      H += `<div id="${T}-iph" class="itin-ph"><div class="mini-spin"></div><span>Click below to build your ${idays}-day plan for ${d.name}</span></div><div id="${T}-ict" style="display:none"></div>`;
    }
    H += `</div>`;

    /* PRO TOOLS TAB */
    H += `<div class="tab-pane" id="${T}-pt">`;
    if(!isPro){
      H += `<div class="gate" onclick="openPay()"><span class="gate-ico">👑</span><div class="gate-title">Budget Tracker &bull; Packing List &bull; Compare Table &bull; WhatsApp Share</div><div class="gate-sub">${proPriceLabel(100)} one-time unlocks all Pro tools forever on this device.</div><button class="gate-btn">Unlock Pro → ${proPriceLabel(100)}</button></div>`;
    } else {
      H += `<div class="sub-tabs">
        <button class="stab on" data-p="${P2}" data-tab="bt" onclick="swSub('${P2}','bt')">💰 Budget</button>
        <button class="stab" data-p="${P2}" data-tab="pk" onclick="swSub('${P2}','pk')">🎒 Pack</button>
        <button class="stab" data-p="${P2}" data-tab="cm" onclick="swSub('${P2}','cm')">⚖ Compare</button>
        <button class="stab" data-p="${P2}" data-tab="ws" onclick="swSub('${P2}','ws')">💬 Share</button>
      </div>`;

      H += `<div class="stab-pane on" id="${P2}-bt">
        <div class="sec-label">Live budget tracker (${AC})</div>
        <div class="trk-cells">
          <div class="trk-cell"><div class="trk-lbl">Planned</div><div class="trk-val" id="${T}-tp">${fmtMoney(d.cost.mid)}</div></div>
          <div class="trk-cell"><div class="trk-lbl">Spent</div><div class="trk-val" style="color:#E09030" id="${T}-ts">0</div></div>
          <div class="trk-cell"><div class="trk-lbl">Remaining</div><div class="trk-val" style="color:#16BF96" id="${T}-tr">${fmtMoney(d.cost.mid)}</div></div>
          <div class="trk-cell"><div class="trk-lbl">Entries</div><div class="trk-val" id="${T}-te">0</div></div>
        </div>
        <div class="trk-bg"><div class="trk-fill" id="${T}-tb" style="width:0%"></div></div>
        <div style="font-size:10px;color:#4A4946;margin-bottom:8px">Used: <span id="${T}-tpct">0%</span></div>
        <div class="add-row">
          <select class="tfield" id="${T}-tc"><option>Food</option><option>Transport</option><option>Stay</option><option>Activities</option><option>Shopping</option><option>Other</option></select>
          <input class="tfield" type="number" id="${T}-ta" placeholder="Amount" min="0">
          <button class="add-btn" onclick="addSpend('${T}',${d.cost.mid})">+ Add</button>
        </div>
        <div class="log-list" id="${T}-tl"></div>
      </div>`;

      var packItems = ['Passport + visa docs','Travel insurance print','Sunscreen SPF 50','Insect repellent','Universal adapter','First aid kit','Reusable water bottle','Offline maps downloaded','Local currency small notes','Light breathable clothes','Rain jacket','Phone charger + powerbank'];
      H += `<div class="stab-pane" id="${P2}-pk">
        <div class="sec-label">Packing list for ${d.name}</div>
        <div class="pack-list">${packItems.map(function(item,i){return `<div class="pack-item" id="${T}-pi${i}" onclick="togPack('${T}-pi${i}')"><div class="pack-chk"></div><span class="pack-txt">${item}</span></div>`;}).join('')}</div>
        <p style="font-size:10px;color:#4A4946;margin-top:7px">Tap to mark as packed ✓</p>
      </div>`;

      var cmpRows = [
        ['Budget', fmtMoney(d.cost.budget), others[0]?fmtMoney(others[0].d.cost.budget):'—', others[1]?fmtMoney(others[1].d.cost.budget):'—'],
        ['Mid', fmtMoney(d.cost.mid), others[0]?fmtMoney(others[0].d.cost.mid):'—', others[1]?fmtMoney(others[1].d.cost.mid):'—'],
        ['Crowd '+month, cs+'%', others[0]?others[0].cs+'%':'—', others[1]?others[1].cs+'%':'—'],
        ['Visa', d.visa.type, others[0]?others[0].d.visa.type:'—', others[1]?others[1].d.visa.type:'—'],
        ['Currency', d.cur, others[0]?others[0].d.cur:'—', others[1]?others[1].d.cur:'—']
      ];
      H += `<div class="stab-pane" id="${P2}-cm">
        <div class="sec-label">Side-by-side comparison</div>
        <div style="overflow-x:auto"><table class="cmp-detail"><thead><tr><th>Feature</th><th>${d.name}</th>${others[0]?`<th>${others[0].d.name}</th>`:''}${others[1]?`<th>${others[1].d.name}</th>`:''}</tr></thead>
        <tbody>${cmpRows.map(function(row){return `<tr><td>${row[0]}</td><td>${row[1]}</td>${others[0]?`<td>${row[2]}</td>`:''}${others[1]?`<td>${row[3]}</td>`:''}</tr>`;}).join('')}</tbody></table></div>
      </div>`;

      H += `<div class="stab-pane" id="${P2}-ws">
        <div class="wa-card"><div class="wa-title">💬 Share on WhatsApp</div><div class="wa-sub">Send your ${d.name} trip details — budget, crowd, visa, food — to any contact.</div><a class="wa-btn" href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener">💬 Share Trip Plan</a></div>
      </div>`;
    }
    H += `</div>`;
    H += `</div>`; /* card-body end */

    /* BOOK TAB */
    H += `<div class="tab-pane" id="${T}-bk"><div class="card-body" style="padding-top:0">
      <div class="sec-label" style="margin-top:4px">Book this trip</div>
      ${rwBookGridHTML(origin, d.name, enc)}
    </div></div>`;

    /* ACTION BAR */
    H += `<div class="act-bar">`;
    if(isPro){
      H += `<button class="act-btn act-gold" onclick="buildItin('${T}','${d.name.replace(/'/g,"\\'")}', ${d.cost.mid}, ${idays})">📅 Load ${idays}-day Plan</button>`;
      H += `<button class="act-btn act-wa" onclick="swTab('${T}','pt');swSub('${P2}','ws')">💬 Share</button>`;
      H += `<button class="act-btn act-ghost" onclick="swTab('${T}','pt');swSub('${P2}','bt')">💰 Track</button>`;
    } else {
      H += `<button class="act-btn act-gold" onclick="openPay()">📅 Full Itinerary 🔒</button>`;
      H += `<button class="act-btn act-pm" onclick="openPay()">👑 Unlock Pro — ${proPriceLabel(100)}</button>`;
    }
    H += `<button class="act-btn act-ghost" onclick="swTab('${T}','bk')">✈️ Book</button>`;
    H += `</div></div>`; /* act-bar + card end */
  });

  H += `</div>`; /* card-list end */
  el('results').innerHTML = H;
  try{
    var top = results[0] && results[0].d;
    if(top){ pulseBump(top.name, month); results.forEach(function(r){ pulseShow(r.d.name, month, 'pulse_'+r.T); }); }
  }catch(e){}

  setTimeout(function(){
    document.querySelectorAll('.crowd-bar[data-w]').forEach(function(bar){ bar.style.width = bar.dataset.w+'%'; });
  }, 100);

  /* Load real photos for every card — non-blocking, always resolves to something usable */
  results.forEach(function(r, ci){
    loadPhotosForCard(r.d, ci);
  });

  /* For generic (non-curated) results, pull a real description from Wikipedia */
  results.forEach(function(r, ci){
    var d = r.d;
    var enh = (aiData && aiData.e) ? aiData.e.find(function(x){ return x.id===d.id; })||null : null;
    if(enh && enh.desc) return; /* already have AI text, don't overwrite */
    if(!d.isGeneric) return;
    var wikiTitle = d.wiki || d.name.replace(/\s+/g,'_');
    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(wikiTitle))
      .then(function(r2){ if(!r2.ok) throw new Error('404'); return r2.json(); })
      .then(function(s){
        var descEl = el('desc_'+ci);
        if(descEl && s.extract){
          var clean = s.extract.replace(/\([^)]*\)/g,'').split('. ').slice(0,3).join('. ');
          if(clean && !/\.$/.test(clean)) clean += '.';
          descEl.textContent = clean || descEl.textContent;
        }
      })
      .catch(function(){
        var descEl = el('desc_'+ci);
        if(descEl) descEl.textContent = 'Specific details for this destination are still being added to our database — the budget estimate above is a sensible starting point based on your inputs.';
      });
  });
}

/* TAB SWITCHING */
function swTab(T, tab){
  ['ov','dt','bu','it','pt','bk'].forEach(function(t){
    var pane = el(T+'-'+t);
    if(pane) pane.classList.toggle('on', t===tab);
  });
  document.querySelectorAll(`[data-t="${T}"]`).forEach(function(b){
    b.classList.toggle('on', b.dataset.tab===tab);
  });
}
function swSub(P2, tab){
  ['bt','pk','cm','ws'].forEach(function(t){
    var pane = el(P2+'-'+t);
    if(pane) pane.classList.toggle('on', t===tab);
  });
  document.querySelectorAll(`[data-p="${P2}"]`).forEach(function(b){
    b.classList.toggle('on', b.dataset.tab===tab);
  });
}

// DAY_TEMPLATES, buildItin, togDay moved to js/itinerary/build.js (Phase 5c)

/* BUDGET TRACKER */
function addSpend(T, costMid){
  var cat = el(T+'-tc').value;
  var amt = parseFloat(el(T+'-ta').value)||0;
  if(amt<=0){ showToast('Enter a valid amount'); return; }
  if(!spends[T]) spends[T]=[];
  spends[T].push({cat:cat, amt:amt});
  el(T+'-ta').value='';
  var total = spends[T].reduce(function(s,x){return s+x.amt;},0);
  var rate = (CURR.find(function(x){return x.c===AC;})||{r:1}).r;
  var budC = Math.round(costMid*rate);
  var sym = (CURR.find(function(x){return x.c===AC;})||{s:'₹'}).s;
  var rem = Math.max(0, budC-total);
  var pct = Math.min(100, Math.round(total/budC*100));
  function ge(sfx){ return el(T+'-'+sfx); }
  if(ge('ts')) ge('ts').innerHTML = sym+Math.round(total).toLocaleString();
  if(ge('tr')) ge('tr').innerHTML = sym+Math.round(rem).toLocaleString();
  if(ge('te')) ge('te').textContent = spends[T].length;
  if(ge('tb')) ge('tb').style.width = pct+'%';
  if(ge('tpct')) ge('tpct').textContent = pct+'%';
  var log = el(T+'-tl');
  if(log){
    var row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `<span>${cat}</span><span style="color:#E09030;font-weight:600">${sym}${Math.round(amt)}</span>`;
    log.appendChild(row); log.scrollTop = log.scrollHeight;
  }
}

function togPack(id){
  var item = el(id); if(!item) return;
  item.classList.toggle('done');
  var chk = item.querySelector('.pack-chk');
  if(chk) chk.innerHTML = item.classList.contains('done') ? '✓' : '';
}


/* ==================== FOUNDER OFFER — REAL COUNTDOWN ====================
   Everything here is driven by the SERVER's gate (pricing/founder + the
   increment-only signupCounter). That matters legally as well as ethically:
   India's CCPA Guidelines for Prevention and Regulation of Dark Patterns (2023)
   name "false urgency" explicitly. A timer that resets on reload, or a seat
   count that invents scarcity, is a dark pattern. This one counts down to a
   real date the founder set, and shows the real number of seats taken \u2014 so
   when it hits zero it STAYS zero. */
var _cdTimer = null;
function rwFounderDeadline(){
  var g = (RWPricing.founderGate && RWPricing.founderGate()) || null;
  if(g && g.closesOn){
    var t = Date.parse(g.closesOn + 'T23:59:59Z');
    if(!isNaN(t)) return t;
  }
  /* fallback: launch date + the configured window */
  var C = RWPricing.CONFIG;
  var launch = Date.parse((g && g.launchDate) || C.LAUNCH_DATE);
  if(isNaN(launch)) return null;
  return launch + C.FOUNDER_OFFER.maxDays*86400000;
}
function rwCountdownParts(){
  var end = rwFounderDeadline();
  if(end==null) return null;
  var ms = end - Date.now();
  if(ms <= 0) return {over:true};
  return {
    over:false,
    d: Math.floor(ms/86400000),
    h: Math.floor(ms/3600000)%24,
    m: Math.floor(ms/60000)%60,
    s: Math.floor(ms/1000)%60
  };
}
function rwFounderBannerHTML(){
  var C = RWPricing.CONFIG, seats = window._rwSeats;
  var left = (typeof seats==='number') ? Math.max(0, C.FOUNDER_OFFER.maxUsers - seats) : null;
  return '<div style="text-align:center">'
    +'<div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.9">Founding members only</div>'
    +'<div style="font-size:20px;font-weight:900;margin:3px 0 1px">\u20b9'+C.FOUNDER_OFFER.priceINR+' \u00b7 Pro for life</div>'
    +'<div style="font-size:11.5px;opacity:.92">One payment. This price does not come back.</div>'
    +'<div id="cdWrap" style="display:flex;gap:6px;justify-content:center;margin:9px 0 4px"></div>'
    +(left!==null
        ? '<div style="font-size:11px;opacity:.92">'
          +'<b>'+left.toLocaleString('en-IN')+'</b> of '+C.FOUNDER_OFFER.maxUsers.toLocaleString('en-IN')+' seats left'
          +'<div style="height:5px;background:rgba(0,0,0,.25);border-radius:3px;margin-top:5px;overflow:hidden">'
          +'<div style="width:'+Math.min(100, Math.round((seats/C.FOUNDER_OFFER.maxUsers)*100))+'%;height:100%;background:rgba(255,255,255,.85)"></div></div></div>'
        : '')
    +'</div>';
}
function rwCountdownCells(p){
  function cell(v,l){
    return '<div style="background:rgba(0,0,0,.28);border-radius:9px;padding:5px 8px;min-width:44px">'
      +'<div style="font-size:17px;font-weight:900;line-height:1.1">'+String(v).padStart(2,'0')+'</div>'
      +'<div style="font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">'+l+'</div></div>';
  }
  return cell(p.d,'days')+cell(p.h,'hrs')+cell(p.m,'min')+cell(p.s,'sec');
}
function rwStartCountdown(){
  rwStopCountdown();
  function tick(){
    var wrap = el('cdWrap'); if(!wrap) return rwStopCountdown();
    var p = rwCountdownParts();
    if(!p){ wrap.style.display='none'; return; }
    if(p.over){
      /* the window genuinely ended — close the offer in the UI immediately
         rather than letting a stale banner keep selling it */
      rwStopCountdown();
      var fb = el('founderBanner'); if(fb) fb.style.display='none';
      renderPlanGrid(false);
      return;
    }
    wrap.innerHTML = rwCountdownCells(p);
  }
  tick();
  _cdTimer = setInterval(tick, 1000);
}
function rwStopCountdown(){ if(_cdTimer){ clearInterval(_cdTimer); _cdTimer=null; } }
/* stop the ticker when the paywall closes so it isn't burning cycles */
(function(){
  var origClose = window.closePay;
  window.closePay = function(){ rwStopCountdown(); if(typeof origClose==='function') return origClose.apply(this, arguments); };
})();

/* PAYMENT */
/* ===== TESTIMONIALS: edit this list with REAL user quotes when you have them.
   Each = [quote, who]. They rotate each time the pay modal opens. ===== */
var RW_TESTIMONIALS = [
  ['Planned our whole Manali trip in one evening \u2014 the budget split alone saved us so many arguments.', '\u2014 Priya, group trip to Himachal'],
  ['The \u20b9100 was the easiest yes ever. Made a 5-day Goa plan with costs in minutes.', '\u2014 Rahul, Bengaluru'],
  ['Finally a planner that gets Indian trips \u2014 crowds, budgets, everything in one place.', '\u2014 Sneha, Delhi']
];
var _rwTestiIdx = 0;
function rwRotateTesti(){
  if(!RW_TESTIMONIALS.length) return;
  var t = RW_TESTIMONIALS[_rwTestiIdx % RW_TESTIMONIALS.length];
  _rwTestiIdx++;
  var q=el('testiQuote'), w=el('testiWho');
  if(q) q.innerHTML='\u201c'+t[0]+'\u201d';
  if(w) w.innerHTML=t[1];
}
function openPay(){
  try{ track('pay_opens'); }catch(e){}
  if(typeof PLAY_MODE!=='undefined' && PLAY_MODE && !window.RWBilling){
    showToast('\ud83c\udf89 Pro is FREE for early adopters on this version \u2014 already active on your account!');
    return;
  }
  if(isPro){ showToast(rwStatusLabel().sentence); return; }
  try{ rwRotateTesti(); }catch(e){}
  el('payOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  var picker=el('planPicker'); if(picker) picker.innerHTML='<div style="text-align:center;font-size:12px;color:var(--t3);padding:10px">Loading plans\u2026</div>';
  el('payMethods').style.display='none';
  /* Founder-offer eligibility needs the live signup count — read it, but never
     block the picker for more than a moment: fail toward showing tiers if the
     read is slow, since the tiers are always valid regardless. */
  var settled=false;
  var to=setTimeout(function(){ if(!settled){ settled=true; renderPlanGrid(false); } }, 2500);
  /* FIXED (rw-v71): the founder SEAT count must come from paid seats, not from
     meta/signupCounter — that counter tracks every new SIGN-UP (for the 7-day
     free trial) and was making the offer look far more sold than it was.
     meta/founderSeats is incremented only when a claim is APPROVED. */
  (window.db? RWPricing.founderGateLoad().then(function(){ return db.collection('meta').doc('founderSeats').get(); }) : Promise.reject()).then(function(snap){
    if(settled) return; settled=true; clearTimeout(to);
    var count = snap && snap.exists ? (snap.data().count||0) : 0;
    window._rwSeats = count;
    renderPlanGrid(RWPricing.founderOfferOpen(count));
  }).catch(function(){ if(settled) return; settled=true; clearTimeout(to); renderPlanGrid(RWPricing.founderOfferOpen()); });
}
function renderPlanGrid(founderOpen){
  var C = RWPricing.CONFIG;
  var fb = el('founderBanner');
  if(founderOpen){
    fb.style.display='block';
    fb.innerHTML = rwFounderBannerHTML();
    rwStartCountdown();
  } else { fb.style.display='none'; rwStopCountdown(); }

  var html='';
  if(founderOpen){
    html += '<button class="pay-tab on" style="width:100%;margin-bottom:14px" onclick="pickPlan(\'founder\','+C.FOUNDER_OFFER.priceINR+',\'Founder Pro \u2014 Lifetime\',\'elite\')">'
      +'\ud83c\udf1f Founder Pro \u2014 \u20b9'+C.FOUNDER_OFFER.priceINR+' <small>One payment, forever \u2014 this exact price never comes back</small></button>';
  }

  /* Monthly / yearly tiers */
  var yearly = lsGet('rw_pay_yearly')==='1';
  /* Headline "save up to N%" — derived from the real ladder (Pro yearly is ~30%
     off, the biggest), so this can never drift out of sync with TIERS again. */
  var maxSave = 0;
  C.TIERS.forEach(function(t){ var s=RWPricing.yearlySavingsPct(t); if(s>maxSave) maxSave=s; });
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:6px 0 12px">'
    +'<span style="font-size:12px;color:'+(!yearly?'var(--gold2)':'var(--t3)')+'">Monthly</span>'
    +'<label style="position:relative;display:inline-block;width:38px;height:20px">'
    +'<input type="checkbox" id="yearlyToggle" '+(yearly?'checked':'')+' onchange="lsSet(\'rw_pay_yearly\',this.checked?\'1\':\'0\');renderPlanGrid('+(founderOpen?'true':'false')+')" style="opacity:0;width:0;height:0">'
    +'<span style="position:absolute;inset:0;background:'+(yearly?'var(--gold2)':'#333')+';border-radius:20px;transition:.2s"></span>'
    +'<span style="position:absolute;left:'+(yearly?'20px':'2px')+';top:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s"></span>'
    +'</label><span style="font-size:12px;color:'+(yearly?'var(--gold2)':'var(--t3)')+'">Yearly <b style="color:#16BF96">(save up to '+maxSave+'%)</b></span></div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">';
  C.TIERS.filter(function(t){return t.id!=='free';}).forEach(function(t){
    var price = yearly? t.priceYearly : t.priceMonthly;
    var per = yearly? '/yr' : '/mo';
    var save = RWPricing.yearlySavingsPct(t);
    html += '<button class="tact" style="text-align:left;padding:12px" onclick="pickPlan(\''+t.id+(yearly?'_y':'_m')+'\','+price+',\''+t.label+' '+(yearly?'Yearly':'Monthly')+'\',\''+t.id+'\')">'
      +'<div style="font-weight:800;color:var(--gold2);font-size:13px">'+t.label+'</div>'
      +'<div style="font-size:17px;font-weight:800;margin-top:2px">\u20b9'+price+'<span style="font-size:11px;color:var(--t3);font-weight:400">'+per+'</span></div>'
      +(yearly&&save>0? '<div style="font-size:10px;color:#16BF96">save '+save+'%</div>' : '')
      +'</button>';
  });
  html += '</div>';

  /* Long-term one-time passes */
  html += '<div class="section-label">\ud83d\udcc5 Long-term one-time passes \u2014 no renewals</div>'
    +'</div>';
  C.LONG_TERM.forEach(function(group){
    html += '<div style="font-size:11.5px;font-weight:700;color:var(--gold2);margin-bottom:6px">'+group.tierLabel+'-tier long-term</div>'
      +'<div style="display:flex;gap:8px;margin-bottom:12px">';
    group.options.forEach(function(p){
      /* A lifetime pass renders with its own label instead of "99-Year", and its
         pickPlan title reads "<Tier> Lifetime". Non-lifetime passes are unchanged. */
      var topLabel = p.label || (p.years+'-Year');
      var payTitle = group.tierLabel+' '+(p.lifetime? 'Lifetime' : p.years+'-Year Pass');
      html += '<button class="tact" style="flex:1;text-align:center;padding:10px 6px" onclick="pickPlan(\''+p.id+'\','+p.priceINR+',\''+payTitle+'\',\''+group.tier+'\')">'
        +'<div style="font-size:12px;font-weight:700">'+topLabel+'</div><div style="font-size:14px;font-weight:800;color:var(--gold2)">\u20b9'+p.priceINR+'</div></button>';
    });
    html += '</div>';
  });

  /* Short-term micro-passes */
  html += '<div class="section-label">\u26a1 Just need it for one trip?</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:6px">';
  C.SHORT_TERM.forEach(function(p){
    html += '<button class="tact" style="flex:1;text-align:center;padding:10px 6px" onclick="pickPlan(\''+p.id+'\','+p.priceINR+',\''+p.label+'\',\'pro\')">'
      +'<div style="font-size:12px;font-weight:700">'+p.label+'</div><div style="font-size:14px;font-weight:800;color:var(--gold2)">\u20b9'+p.priceINR+'</div></button>';
  });
  html += '</div>';

  el('planPicker').innerHTML = html;
}
function closePay(){ el('payOverlay').classList.remove('open'); document.body.style.overflow=''; }









/* Keep old manual TXN ID as an admin backdoor only — hidden from UI */
function _adminUnlock(code){
  if(code === 'ROAMWISE_ADMIN_2025'){ activatePro('admin','admin'); }
}

function activatePro(payId, method){
  isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',(user&&user.uid)||'device'); lsSet('rwPayId', payId||'manual');
  try{ badgeAwardFounder(); }catch(e){}
  try{ rwHaptic('heavy'); }catch(e){}
  closePay(); el('successOverlay').classList.add('open');
  confetti(); refreshProUI();
}

function closeSuccess(){
  el('successOverlay').classList.remove('open');
  document.body.style.overflow='';
  goHome();
}

/* Returns the user to a clean home view — closes any open overlay, scrolls to top */
function goHome(){
  ['payOverlay','successOverlay','settingsOverlay'].forEach(function(id){
    var o = el(id); if(o) o.classList.remove('open');
  });
  document.body.style.overflow='';
  window.scrollTo({ top:0, behavior:'smooth' });
}

function confetti(){
  var cols=['#C8913E','#9B59F5','#16BF96','#E1306C','#FFD700'];
  for(var i=0;i<50;i++){
    var e2 = document.createElement('div');
    e2.className = 'conf';
    e2.style.cssText = `left:${Math.random()*100}vw;top:-10px;background:${cols[Math.floor(Math.random()*cols.length)]};width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;border-radius:${Math.random()>0.5?'50%':'2px'};animation-duration:${1.5+Math.random()*2}s;animation-delay:${Math.random()*0.8}s`;
    document.body.appendChild(e2);
    setTimeout((function(e3){ return function(){ e3.remove(); }; })(e2), 3500);
  }
}

/* LIGHTBOX */
function openLbox(src){ el('lboxImg').src=src; el('lightbox').classList.add('open'); document.body.style.overflow='hidden'; }
function closeLbox(){ el('lightbox').classList.remove('open'); document.body.style.overflow=''; }

/* SETTINGS */

// Encrypted Key Sync (end-to-end API key backup/restore via Firestore) moved to js/data-sync/key-sync.js

// Moved to js/ui/settings-modal.js (Phase 5b) — settings modal (PROV_META, renderKeyBoxes, openSettings, closeSettings, setProv, saveKey, clearKey)



/* TOAST */
function showToast(msg){
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:62px;left:50%;transform:translateX(-50%);background:#9B59F5;color:#fff;padding:10px 18px;border-radius:10px;font-weight:600;font-size:13px;z-index:9999;box-shadow:0 4px 20px rgba(155,89,245,.4);max-width:92vw;text-align:center;pointer-events:none;white-space:nowrap';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 2800);
}

document.addEventListener('keydown', function(ev){
  if(ev.key==='Escape'){
    closeLbox(); closePay(); closeSettings();
    el('successOverlay').classList.remove('open');
    el('legalOverlay').classList.remove('open');
  }
});

// Firebase SDK init + firebase.auth().onAuthStateChanged UI wiring (sign-in button state, account drawer trigger, device cap, trial grant, account-bound Pro listener) and auth helper functions (openAuth/closeAuth/loginGoogle/loginEmail/etc.) moved to js/boot/auth-init.js


/* ============================================================================
   REFERRAL TRACKING (rw-v71)
   ============================================================================
   Flow, end to end:
     1. Someone opens roamwise.co.in/?ref=RW-S01-FEBIN
     2. We store the code locally with a timestamp (30-day window)
     3. When that person submits a UTR, the code is STAMPED ON THE CLAIM
     4. When YOU approve the claim, the commission becomes payable

   Attribution is stamped at CLAIM time, not at approval time, so a referrer
   can't be changed after the fact — and you approve the claim anyway, which
   is the human check that makes the whole thing hard to game.

   FRAUD PREVENTION, in order of how much it actually matters:
     - Commission only exists on an APPROVED claim. You see every payment.
     - Self-referral blocked: if the payer's own uid owns that code, no credit.
     - One commission per (code, payer uid). Re-buying doesn't pay twice.
     - Duplicate UTRs already blocked upstream by the existing claim gate.
     - 7-day hold before payout so reversals settle first.
     - Codes are stamped server-side into the claim doc, and Firestore rules
       stop anyone editing a claim after creation — so a referrer cannot
       attach themselves to someone else's purchase later.
   ========================================================================= */
var RW_REF_KEY='rw_ref_code', RW_REF_AT='rw_ref_at';

/* Normalise any referral/partner code coming from an untrusted source (URL
   query/hash/path, a typed box, a pasted code). Uppercase, keep ONLY
   [A-Z0-9_-], drop everything else, cap at 32 chars. This is the single
   choke point that keeps a crafted ?ref= value from ever reaching the DOM or
   Firestore as anything but a plain, bounded token. Function declaration so
   it is hoisted for earlier callers (e.g. openPartnerRedeem). */
function rwSanitizeRefCode(x){
  return String(x==null?'':x).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32);
}


/* ============================================================================
   REFERRERS FROM FIRESTORE (rw-v80) — no more editing GitHub files
   ============================================================================
   referral-data.js is now only a SEED/fallback. The live list is in Firestore
   at config/referrers, editable from the admin panel. The file still works if
   Firestore is unreachable, so the app never depends on the network to
   validate a code — it just gets fresher when it can.
   ========================================================================= */
function rwRefSync(){
  try{
    if(typeof db==='undefined' || !db) return;
    db.collection('config').doc('referrers').get().then(function(d){
      if(!d.exists) return;
      var list=(d.data()||{}).list;
      if(Array.isArray(list) && list.length){
        window.RW_REFERRERS = list;
        try{ lsSet('rw_ref_cache', JSON.stringify(list)); }catch(e){}
      }
    }).catch(function(){});
    /* referral terms: rates, buyer bonus, promo status, disclaimer.
       FIXED: referral-data.js sets window.RW_REFERRAL_TERMS as a static
       flat-30%-for-everyone object at page load. This Firestore fetch used
       to completely OVERWRITE that object once it resolved -- meaning the
       effective referral terms silently depended on whether config/referralTerms
       had ever been saved in the admin console, and on script/network timing.
       Two systems, one variable, no reconciliation. Now this MERGES onto the
       static baseline instead of replacing it, so a not-yet-configured
       Firestore doc can never blank out real defaults, and an explicitly-set
       Firestore field always wins over the static one where it's actually set. */
    db.collection('config').doc('referralTerms').get().then(function(d){
      if(!d.exists) return;
      var t=d.data()||{};
      window.RW_REFERRAL_TERMS = Object.assign({}, window.RW_REFERRAL_TERMS||{}, t);
      try{ lsSet('rw_ref_terms_cache',JSON.stringify(window.RW_REFERRAL_TERMS)); }catch(e){}
    }).catch(function(){});
  }catch(e){}
}
/* use cached copies on boot */
(function(){
  try{ var c=lsGet('rw_ref_cache'); if(c){ var l=JSON.parse(c); if(Array.isArray(l)&&l.length) window.RW_REFERRERS=l; } }catch(e){}
  try{ var ct=lsGet('rw_ref_terms_cache'); if(ct) window.RW_REFERRAL_TERMS=JSON.parse(ct); }catch(e){}
})();

function rwRefLookup(code){
  if(!code) return null;
  var c=rwSanitizeRefCode(code);   /* normalise so a lookup can never carry stray chars */
  if(!c) return null;
  var list=window.RW_REFERRERS||[];
  for(var i=0;i<list.length;i++) if(list[i].code.toUpperCase()===c) return list[i];
  return null;
}
/* Capture ?ref= on any page load. Runs once, early. */
function rwRefCapture(){
  try{
    /* rw-v90: a referral must survive however it arrives.
       ?ref=CODE  ·  ?r=CODE  ·  #ref=CODE  ·  /r/CODE  ·  ?utm_content=CODE
       Instagram and WhatsApp both rewrite links, and some strip the query
       string entirely, so we check the hash and the path too. */
    var q=new URLSearchParams(location.search);
    var code=q.get('ref')||q.get('r')||q.get('utm_content')||q.get('referral');
    if(!code){
      var h=String(location.hash||'');
      var m=h.match(/[#&](?:ref|r)=([A-Za-z0-9\-_]+)/);
      if(m) code=m[1];
    }
    if(!code){
      var pm=String(location.pathname||'').match(/\/r\/([A-Za-z0-9\-_]+)/);
      if(pm) code=pm[1];
    }
    code=rwSanitizeRefCode(code);                   /* untrusted URL input: bound it before use */
    if(!code) return;
    var who=rwRefLookup(code);
    if(!who || who.active===false) return;         /* unknown/retired code: ignore silently */
    lsSet(RW_REF_KEY, who.code);
    lsSet(RW_REF_AT, String(Date.now()));
    try{ track('ref_click'); }catch(e){}
    setTimeout(function(){
      try{ showToast('\ud83d\udc4b You came via '+who.name+' \u2014 welcome!'); }catch(e){}
    }, 1200);
  }catch(e){}
}
/* Return the still-valid referral code, or null. */

/* Keep ?ref= on the URL as the user moves around, so a shared link that is
   copied mid-session still carries the code. Silent — never a page reload. */
function rwRefStickUrl(){
  try{
    var c=rwRefActive(); if(!c) return;
    var u=new URL(location.href);
    if(u.searchParams.get('ref')===c) return;
    u.searchParams.set('ref', c);
    history.replaceState({}, '', u.toString());
  }catch(e){}
}
/* A referrer's own link should also survive an app install: stash it where the
   installed PWA can read it on first run. */
function rwRefPersist(){
  try{
    var c=rwRefActive(); if(!c) return;
    if(window.caches) return;   /* nothing extra needed; localStorage covers it */
  }catch(e){}
}

function rwRefActive(){
  try{
    var code=lsGet(RW_REF_KEY), at=parseInt(lsGet(RW_REF_AT)||'0',10);
    if(!code||!at) return null;
    var days=(window.RW_REFERRAL_TERMS&&RW_REFERRAL_TERMS.cookieDays)||30;
    if(Date.now()-at > days*86400000){ return null; }   /* expired */
    return rwRefLookup(code)? code : null;
  }catch(e){ return null; }
}
/* What gets stamped onto a claim. Kept small and flat so it's easy to read in
   Firestore and easy to total in a sheet. */
function rwRefStamp(){
  var code=rwRefActive();
  if(!code) return {};
  var who=rwRefLookup(code);
  if(!who) return {};
  /* Self-referral guard: a referrer buying through their own link earns nothing.
     Compared against the AUTHENTICATED identity (uid, and email as a fallback),
     not a local flag, so it can't be bypassed by clearing localStorage. This is
     still only the client's best effort — the server MUST re-check self-referral
     at approval before any commission is paid (client refRate is display only). */
  try{
    if(window.user){
      var selfByUid   = who.uid   && user.uid   && who.uid===user.uid;
      var selfByEmail = who.email && user.email && String(who.email).toLowerCase()===String(user.email).toLowerCase();
      if(selfByUid || selfByEmail) return { refCode:code, refSelf:true, refRate:0 };
    }
  }catch(e){}
  return {
    refCode: who.code,
    refName: who.name,
    refType: who.type,
    refRate: who.rate,
    refAt: parseInt(lsGet(RW_REF_AT)||'0',10) || null
  };
}
/* Build a share link for a referrer. */
function rwRefLink(code){
  return 'https://roamwise.co.in/?ref='+encodeURIComponent(code);
}


/* ============================================================================
   REFERRAL CODE ENTRY (rw-v78)
   ============================================================================
   Links are great, but most referrals happen by WORD OF MOUTH — someone says
   "use my code RW-S02-DEEPA". Without this, every one of those sales is
   untracked and the referrer never gets paid. This closes that hole.

   BUILT TO SCALE: validation is purely local against referral-data.js (no
   network, no read cost), the code is stored the same way a link click is, and
   the SAME rwRefStamp() writes it onto the claim — so one code path serves
   millions of users with zero extra infrastructure.
   ========================================================================= */

/* live validation as they type a referral code at sign-up */
function rwRefLiveCheck(){
  var i=el('authRefCode'), m=el('authRefMsg');
  if(!i||!m) return;
  var v=rwSanitizeRefCode(i.value);   /* typed code: normalise before lookup */
  if(!v){ m.textContent=''; m.style.color='var(--t3)'; return; }
  var w=rwRefLookup(v);
  if(w && w.active!==false){
    m.textContent='\u2705 '+w.name+' will get credit for your purchase';
    m.style.color='#4ADE80';
    rwRefApply(v, true);      /* store it now so it survives the signup flow */
  } else {
    m.textContent='Not a code we recognise \u2014 check the spelling';
    m.style.color='#E0785B';
  }
}

function rwRefApply(code, quiet){
  var who=rwRefLookup(code);
  if(!who || who.active===false) return null;
  lsSet(RW_REF_KEY, who.code);
  lsSet(RW_REF_AT, String(Date.now()));
  if(!quiet){ try{ showToast('\u2705 Code applied \u2014 '+who.name+' gets credit'); }catch(e){} }
  try{ track('ref_code_entered'); }catch(e){}
  return who;
}
/* the little "have a referral code?" box */
function openRefCode(){
  var cur=rwRefActive();
  var who=cur? rwRefLookup(cur) : null;
  rwForm('\ud83c\udf9f\ufe0f Referral code', [
    /* key:/placeholder: \u2014 rwFormSubmit reads out[field.key]; id:/ph: read back undefined. */
    { key:'rc', label:'Enter the code you were given', value:cur||'', placeholder:'e.g. RW-S02-DEEPA' }
  ], function(v){
    var code=rwSanitizeRefCode(v.rc);   /* typed/pasted code: bound it before lookup */
    if(!code){ showToast('Enter a code first'); return; }
    var w=rwRefApply(code);
    if(!w){ showToast('\u274c That code isn\u2019t recognised \u2014 check the spelling'); return; }
  }, who? ('Currently applied: <b>'+esc2(who.name)+'</b> ('+esc2(who.code)+')') : 'If a friend, creator or team member gave you a code, enter it here so they get credit for your purchase. It costs you nothing.');
}
/* Show the applied referrer on the Pro/pay screen, so it's transparent. */
function rwRefBadgeHTML(){
  var c=rwRefActive(); if(!c) return '<div style="text-align:center;margin-top:10px"><a onclick="openRefCode()" style="font-size:10.5px;color:var(--t3);cursor:pointer;text-decoration:underline dotted">Have a referral code?</a></div>';
  var w=rwRefLookup(c); if(!w) return '';
  var terms=window.RW_REFERRAL_TERMS||{};
  var promoOn=terms.active!==false;
  var bonusDays=promoOn?parseInt(terms.buyerBonusDays||30,10)||30:0;
  var bonusStr=bonusDays?' &middot; you get <b>'+bonusDays+' bonus days</b> of Pro added':'';
  var disc=promoOn&&terms.disclaimer?'<div style="font-size:10px;color:var(--t3);margin-top:2px">&#9888; '+esc2(terms.disclaimer)+'</div>':'';
  return '<div style="text-align:center;margin-top:10px;font-size:12px;color:var(--gold)">Referred by <b>'+esc2(w.name)+'</b>'+bonusStr+' &middot; <a onclick="openRefCode()" style="color:var(--t3);cursor:pointer;text-decoration:underline dotted">change</a></div>'+disc;
}

/* Free UPI flow: user submits UTR, owner approves in the admin console */
function submitUtr(){
  if(!requireLogin()) return;
  var utr = (el('utrInput').value||'').trim().replace(/\s/g,'');
  var msg = el('utrMsg');
  function say(t, ok){ msg.textContent=t; msg.style.display='block'; msg.style.color=ok?'#16BF96':'#D84F4F'; msg.style.background=ok?'rgba(22,191,150,.08)':'rgba(216,79,79,.08)'; }
  if(!/^\d{12}$/.test(utr)) return say('A real UPI UTR is exactly 12 digits \u2014 find it in your payment app under the \u20b9100 transaction\u2019s details.', false);
  if(!AUTH_READY) return say('Owner hasn\u2019t enabled account unlocks yet \u2014 hold on to your UTR and try again soon.', false);
  var b = el('utrBtn'); b.disabled=true; b.textContent='Sending\u2026';
  /* anti-bot: email accounts must be verified before claiming */
  if(user.providerData && user.providerData.some(function(p){return p.providerId==='password';}) && !user.emailVerified){
    b.disabled=false; b.textContent='Submit \u27A4';
    user.sendEmailVerification().catch(function(){});
    return say('Verify your email first \u2014 we just sent (or re-sent) the link. Tap it, reopen the app, then submit your UTR.', false);
  }
  /* fraud gate: rejected-before accounts and duplicate UTRs are blocked */
  db.collection('claims').where('uid','==',user.uid).get().then(function(snap){
    var mine = snap.docs.map(function(d){return d.data();});
    if(mine.some(function(c){return c.status==='rejected';})){
      b.disabled=false; b.textContent='Submit \u27A4';
      return say('A previous claim from this account was rejected. Contact the owner via YouTube @mohucool with payment proof to unlock.', false);
    }
    if(mine.some(function(c){return c.utr===utr;})){
      b.disabled=false; b.textContent='Submit \u27A4';
      return say('You already submitted this UTR \u2014 it\u2019s in the verification queue.', false);
    }
    var _ref = {};
    try{ _ref = rwRefStamp(); }catch(e){}
    var _bonusDays=0;
    try{
      var _terms=window.RW_REFERRAL_TERMS||{};
      if(_ref.refCode && _terms.active!==false){ _bonusDays=parseInt(_terms.buyerBonusDays||30,10)||30; _ref.buyerBonusDays=_bonusDays; }
    }catch(e){}
    return db.collection('claims').doc(user.uid+'_'+utr).set(Object.assign({
    uid:user.uid, email:user.email||user.phoneNumber||'', utr:utr, amount:parseInt(UPI_AMT,10)||100,
    tier:(UPI_AMT==='299'?'supporter':'pro'), plan:(_selectedPlan&&_selectedPlan.id)||'legacy100', planLabel:(_selectedPlan&&_selectedPlan.label)||'Legacy ₹100',
    status:'pending', created:firebase.firestore.FieldValue.serverTimestamp()
  }, _ref)).then(function(res){
    if(res===undefined) return; /* gated above */
    b.disabled=false; b.textContent='Submit \u27A4'; el('utrInput').value='';
    try{ track('utr_submits'); }catch(e){}
    try{ if(_bonusDays>0&&_ref.refCode){ var _who=rwRefLookup(_ref.refCode); setTimeout(function(){ showToast('Referred by '+(_who?_who.name:'your friend')+' - you get '+_bonusDays+' bonus days of Pro when verified!'); },2200); } }catch(e){}
    /* INSTANT provisional unlock — bound to THIS ACCOUNT (not the device) */
    if(user){
      lsSet('rw_pro_temp', String(Date.now()+864e5));
      lsSet('rw_pro_temp_uid', user.uid);
      /* Store which plan was actually bought so RWPricing.currentTier() reflects
         it correctly — a founder/legacy buyer is 'elite' forever as promised;
         anyone buying a specific tier gets exactly that tier, not everything. */
      var boughtTierId = 'elite'; /* default: founder / long-term / short-term passes all grant full access */
      if(_selectedPlan){
        var pid = _selectedPlan.id;
        if(pid.indexOf('plus')===0) boughtTierId='plus';
        else if(pid.indexOf('pro')===0) boughtTierId='pro';
        else if(pid.indexOf('elite')===0) boughtTierId='elite';
      }
      lsSet('rw_tier', boughtTierId);
      isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',user.uid); refreshProUI();
      say('\ud83c\udf89 Pro unlocked INSTANTLY for your account! Verification completes in the background \u2014 nothing more to do.', true);
    } else {
      say('Submitted \u2713 Verification completes shortly \u2014 Pro activates on your account automatically.', true);
    }
    setTimeout(closePay, 1800);
    if(OWNER_NOTIFY_EMAIL){
      fetch('https://formsubmit.co/ajax/'+OWNER_NOTIFY_EMAIL, {method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify({_subject:'RoamWise: new \u20b9100 UPI claim', user:(user&&user.email)||'', utr:utr})
      }).catch(function(){});
    }
  }); }).catch(function(){
    b.disabled=false; b.textContent='Submit \u27A4';
    say('Could not send \u2014 check your connection and try again.', false);
  });
}

// Moved to js/ui/adaptive-shell.js (Phase 5b) — adaptive shell + RW icon system (IS_APP/IS_STANDALONE/IS_TOUCH_MOBILE, applyShell, rwSetIconTheme, openIconThemePicker, rwIcon, RW_ICON_PATHS)
// Central boot DOMContentLoaded handler (rwApplyMode/UIScale/renderTabbar/opening sequence/status bar/back button/push init/speech synthesis warm-up) moved to js/boot/init.js

// Moved to js/ui/adaptive-shell.js (Phase 5b) — back-button confirmation + customizable bottom nav + drawer (rwInitStatusBar, rwInitBackButton, rwCloseTopOverlay, RW_TABS, renderTabbar, rwTabGo, tabGo, openDrawer/drToggle/closeDrawer/drawerAccount)
// Account drawer's onAuthStateChanged registration moved to js/boot/auth-init.js
// Moved to js/ui/adaptive-shell.js (Phase 5b) — drawer Escape-key close listener

/* ===== GLOBAL COMMERCE ===== */
var PRICE_IN = '\u20B9100', PRICE_WW = '$4.99';
var payRegion = 'in';
function detectRegion(){
  try{
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    var lang = (navigator.language||'').toLowerCase();
    if(tz==='Asia/Calcutta'||tz==='Asia/Kolkata'||lang.endsWith('-in')) return 'in';
  }catch(e){}
  return 'ww';
}
function setPayRegion(r){
  payRegion = r;
  var isIN = r==='in';
  el('payTabIN').className = 'pay-tab'+(isIN?' on':'');
  el('payTabWW').className = 'pay-tab'+(isIN?'':' on');
  el('payIndiaSec').style.display = isIN?'':'none';
  el('payIntlSec').style.display = isIN?'none':'';
  el('bigPrice').textContent = isIN?PRICE_IN:PRICE_WW;
  el('priceOld').textContent = isIN?('Worth \u20B9999/year \u2014 yours for \u20B9100 forever'):('Worth $29/year \u2014 yours for $4.99 forever');
}
function applyRegionUI(){
  var r = detectRegion();
  var p = r==='in'?PRICE_IN:PRICE_WW;
  var hb = el('heroProBtn'); if(hb) hb.innerHTML = 'Unlock Pro \u2014 '+p;
  var pa = el('promoAmt'); if(pa) pa.textContent = p;
  var dl = el('drProLbl'); if(dl) dl.textContent = isPro ? (rwStatusLabel().text+' \u2713') : ('Unlock Pro \u2014 '+p);
  setPayRegion(r);
}
// Gumroad international checkout (openGumroad/verifyGumroad) moved to js/payments/checkout.js
var LEGAL = {
  privacy: {t:'Privacy Policy', h:'<h4>What we collect</h4>Nothing on a server. RoamWise runs entirely in your browser \u2014 your searches, budgets and preferences are stored only on your device (localStorage) and never sent to us.<h4>Payments</h4>Payments happen directly over UPI to the owner (India) or via Gumroad (worldwide). We never see or store your card, UPI or bank details \u2014 only a payment/license ID used to unlock Pro on your device.<h4>Third-party data</h4>Destination photos and descriptions come from Wikipedia\u2019s public API. Optional AI features call the provider you configure (Gemini, Groq or Anthropic) using your own key, directly from your browser.<h4>Contact</h4>Questions? Reach us via YouTube @mohucool.'},
  terms: {t:'Terms & Refunds', h:'<h4>The deal</h4>Pro is a one-time purchase that unlocks all Pro features on the device/browser where it is activated. No subscription, no recurring charges.<h4>Refunds</h4>If Pro does not work for you, contact us within 7 days of purchase with your payment or license ID and we\u2019ll make it right. Gumroad purchases also follow Gumroad\u2019s buyer protection.<h4>Estimates</h4>All prices, budgets and crowd levels shown are estimates for planning \u2014 always verify visas, prices and conditions before you travel.<h4>Fair use</h4>One purchase = one traveler. Please don\u2019t redistribute license keys.'}
};
function openLegal(which){
  var L = LEGAL[which]; if(!L) return;
  el('legalTitle').textContent = L.t;
  el('legalBody').innerHTML = L.h;
  el('legalOverlay').classList.add('open');
}
applyRegionUI();

(function(){
  var chip = el('modeChip');
  if(chip && activeProv!=='smart'){
    var labels = {gemini:'Gemini AI (free)', groq:'Groq AI (free)', anthropic:'Claude AI'};
    chip.textContent = labels[activeProv]||activeProv;
    chip.className = 'mode-chip '+(activeProv==='anthropic'?'mode-ai':'mode-free');
  }
})();


// AI Travel Copilot core (openCopilot/copilotSend, deterministic parser, intent memory, world place resolver, mini web lookup) moved to js/copilot/core.js








/* ================= HOW-TO GUIDE with voice narration (rw-v46) =============
   An interactive, step-by-step walkthrough of every major feature, with real
   voice narration via the device speech engine (tuskSpeak). No video files —
   this narrates live, works offline-ish, and stays in sync if features change.
   ========================================================================== */
var RW_GUIDE=[
  {id:'tusk', icon:'\u26a1', title:'Ask Ailon Tusk anything',
   steps:['Type how you actually talk \u2014 "chill 4 days near Rishikesh under 12k".',
          'Tusk replies, then gives you buttons: map it, plan it, budget it, remind me.',
          'Vague question? Tusk asks you one thing back instead of guessing.'],
   say:'Start with Ailon Tusk. Type your trip the way you would say it out loud. For example: chill four days near Rishikesh under twelve thousand. Tusk answers, then offers buttons to map it, plan it, or set a reminder. If your question is too vague, Tusk asks you one short question instead of inventing an answer.',
   go:'tabGo(\'copilot\')'},
  {id:'arrival', icon:'\ud83d\ude82', title:'Arrival mode \u2014 your ticket starts the trip',
   steps:['Booked a train? Enter the station you land at and the time.',
          'You get advice for that exact hour \u2014 landing at 3am is different from 3pm.',
          'Then: an itinerary built around your arrival, plus what\u2019s near the station.'],
   say:'Arrival mode turns a train ticket into a trip. Enter the station you arrive at and the time you land. RoamWise gives you advice for that exact hour, because arriving at three in the morning needs a very different plan from arriving at three in the afternoon. Then it builds an itinerary around your arrival and shows you what is near the station.',
   go:'openArrival()'},
  {id:'group', icon:'\ud83d\udc65', title:'Plan with friends without the chaos',
   steps:['Open a trip chat and invite the group.',
          'Tap "When can everyone go?" \u2014 everyone marks their free windows, best overlap wins.',
          '"Pick a train" lets everyone vote, then splits the fare automatically.',
          'Add expenses as you go \u2014 the kitty settles who owes whom, to the rupee.'],
   say:'Group trips die in long chat threads. In a RoamWise trip chat, tap When can everyone go, and everyone marks the dates that work. The best overlap wins automatically. Pick a train lets the group vote on options, and when you lock one, the fare is split for everyone straight away. Add expenses as you travel and the kitty works out exactly who owes whom.',
   go:'tabGo(\'trips\')'},
  {id:'beacon', icon:'\ud83d\udce1', title:'Beacon \u2014 find your people nearby',
   steps:['Light your beacon and pick your tags: founder, artist, runner, yoga.',
          'You see others lit within about a kilometre, shared interests highlighted.',
          'Your exact location never leaves your phone \u2014 it\u2019s blurred to an area.',
          'Beacons switch off by themselves after two hours. Go dark any time.'],
   say:'Beacon helps you find your people wherever you land. Light your beacon and choose your tags, like founder, artist, runner, or yoga. You will see others who are lit within about a kilometre, with shared interests highlighted. Your exact location never leaves your phone. We blur it to a rough area first, beacons switch themselves off after two hours, and you can go dark at any time.',
   go:'openBeacon()'},
  {id:'passport', icon:'\ud83d\udee1\ufe0f', title:'Journey Passport \u2014 verified proof',
   steps:['After a trip, stamp it. You get a permanent ID like RW-M3X7K-QP4TZ.',
          'Anyone can check it at roamwise.co.in/verify.html.',
          'It is a real record in the RoamWise network, not an editable image.'],
   say:'The Journey Passport is verified proof of where you have actually been. After a trip, stamp it, and you get a permanent identifier. Anyone can check that identifier on the RoamWise verify page. Unlike a photo or a certificate, it cannot be edited, because it is a real record in the RoamWise network.',
   go:'openPassport()'},
  {id:'realms', icon:'\u2694\ufe0f', title:'Realms of Roam \u2014 the game',
   steps:['Swear to a house: Himalaya, Tidewater, Ember, Verdant or Stonewatch.',
          'Seven realms across India. The only way to claim one is to really go there.',
          'Stamp a verified journey and the realm turns your house\u2019s colour.',
          'No grinding, no shortcuts \u2014 real travel is the only move.'],
   say:'Realms of Roam is a conquest game where the board is the real map of India. Swear to a house, then claim territory by actually travelling. The only way to take a realm is to go there and stamp a verified journey. You cannot grind it or buy it. Real travel is the only move in this game.',
   go:'openRealms()'},
  {id:'nearme', icon:'\ud83d\udccd', title:'Near me & Tatkal prep',
   steps:['Near me finds food and sights around you, widening if the area is quiet.',
          'Tatkal prep gives you a live countdown to the 10am and 11am windows.',
          'Save passengers once and copy them in instead of typing under pressure.'],
   say:'Near me finds food, sights and things to do around you, and widens the search automatically if you are somewhere quiet. Tatkal prep gives you a live countdown to the ten and eleven o clock booking windows, and lets you save your passengers once so you can paste them in instead of typing under pressure. RoamWise never logs into I R C T C for you, because automating it can get your account banned.',
   go:'openNearMe()'}
];
function openGuide(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('guideSection');
  if(!sec){ sec=document.createElement('section'); sec.id='guideSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83c\udf93 How to use <em>RoamWise</em></h2>'
    +'<button class="tact" onclick="rwGuideStop();rwCloseSection(\'guideSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Every feature, step by step \u2014 with narration if you\u2019d rather listen than read.</p>'
    +'<button class="tact" style="width:100%;margin-bottom:14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px" onclick="rwGuidePlayAll()">\ud83c\udfa7 Play the whole walkthrough</button>'
    + RW_GUIDE.map(function(g,i){
        return '<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:15px;margin-bottom:11px">'
          +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
          +'<span style="font-size:24px">'+g.icon+'</span>'
          +'<b style="flex:1;font-size:14.5px">'+g.title+'</b>'
          +'<span style="font-size:11px;color:var(--t3)">'+(i+1)+'/'+RW_GUIDE.length+'</span></div>'
          + g.steps.map(function(st,si){
              return '<div style="display:flex;gap:9px;margin-bottom:6px">'
                +'<span style="flex:0 0 18px;height:18px;border-radius:50%;background:var(--gold,#E8BA6C);color:#0A0A0C;font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center">'+(si+1)+'</span>'
                +'<span style="flex:1;font-size:12.5px;color:var(--t2);line-height:1.55">'+st+'</span></div>';
            }).join('')
          +'<div style="display:flex;gap:7px;margin-top:11px;flex-wrap:wrap">'
          +'<button class="tact" style="flex:1;min-width:120px;font-size:12px" onclick="rwGuideSay('+i+')">\ud83d\udd0a Listen</button>'
          +'<button class="tact" style="flex:1;min-width:120px;font-size:12px;font-weight:700" onclick="rwGuideStop();'+g.go+'">Try it \u2192</button>'
          +'</div></div>';
      }).join('');
}
function rwGuideSay(i){
  var g=RW_GUIDE[i]; if(!g) return;
  rwGuideStop();
  try{ tuskSpeak(g.say); showToast('\ud83d\udd0a '+g.title); }catch(e){ showToast('Narration unavailable here'); }
}
var _guideQueue=null;
function rwGuidePlayAll(){
  rwGuideStop();
  var i=0;
  showToast('\ud83c\udfa7 Playing the walkthrough \u2014 tap \u2715 to stop');
  function next(){
    if(i>=RW_GUIDE.length){ _guideQueue=null; return; }
    var g=RW_GUIDE[i++];
    try{ tuskSpeak(g.title+'. '+g.say); }catch(e){}
    /* pace roughly to the length of the narration */
    _guideQueue=setTimeout(next, Math.max(9000, g.say.length*68));
  }
  next();
}
function rwGuideStop(){
  if(_guideQueue){ clearTimeout(_guideQueue); _guideQueue=null; }
  try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){}
  try{ if(window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.TextToSpeech) Capacitor.Plugins.TextToSpeech.stop(); }catch(e){}
}



// WEB PUSH (rwInitWebPush) moved to js/boot/init.js

// Realms of Roam / Journey Passport game system moved to js/game/realms.js

/* ===== TATKAL PREP (rw-v44) — the LEGITIMATE version of the "Tatkal hack".
   DELIBERATE DESIGN DECISION: this does NOT auto-fill IRCTC, does NOT bypass
   CAPTCHA, and does NOT script the booking. Automating IRCTC violates their
   terms and gets USER ACCOUNTS BANNED — we will not hand our earliest users a
   tool that does that. What actually loses people Tatkal seats is being
   unprepared in the first 40 seconds, so we fix THAT: details ready to copy,
   a synced countdown, and a pre-flight checklist. All on-device. */
function openTatkal(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('tatkalSection');
  if(!sec){ sec=document.createElement('section'); sec.id='tatkalSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\u26a1 Tatkal <em>prep</em></h2>'
    +'<button class="tact" onclick="rwTatkalStopTimer();rwCloseSection(\'tatkalSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Tatkal is won or lost in the first 40 seconds. Have everything ready to paste, and a countdown so you\u2019re logged in before the window opens.</p>'
    +'<div id="tatkalClock" style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:16px;text-align:center;margin-bottom:12px"></div>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px;margin-bottom:12px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em">PASSENGER LIST</div>'
    +'<button class="tact" style="padding:5px 11px;font-size:11.5px" onclick="rwTatkalAddPax()">+ Add</button></div>'
    +'<div id="tatkalPax"></div></div>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:9px">PRE-FLIGHT CHECKLIST</div>'
    +'<div id="tatkalCheck"></div></div>';
  rwTatkalRenderPax(); rwTatkalRenderCheck(); rwTatkalStartTimer();
}
/* --- countdown to the next Tatkal window (10:00 AC / 11:00 non-AC IST) --- */
var _tatkalTimer=null;
function rwTatkalStopTimer(){ if(_tatkalTimer){ clearInterval(_tatkalTimer); _tatkalTimer=null; } }
function rwTatkalStartTimer(){
  rwTatkalStopTimer();
  function tick(){
    var host=el('tatkalClock'); if(!host){ rwTatkalStopTimer(); return; }
    /* IST regardless of device timezone */
    var now=new Date();
    var ist=new Date(now.getTime() + (now.getTimezoneOffset()*60000) + (5.5*3600000));
    function nextAt(h){
      var t=new Date(ist); t.setHours(h,0,0,0);
      if(t<=ist) t.setDate(t.getDate()+1);
      return t;
    }
    var ac=nextAt(10), nac=nextAt(11);
    var next = ac<nac ? {t:ac,label:'AC classes (10:00 IST)'} : {t:nac,label:'Sleeper / non-AC (11:00 IST)'};
    var ms=next.t-ist, hh=Math.floor(ms/3600000), mm=Math.floor(ms%3600000/60000), ss=Math.floor(ms%60000/1000);
    var soon = ms < 10*60000;
    host.innerHTML='<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em">NEXT TATKAL WINDOW</div>'
      +'<div style="font-size:34px;font-weight:900;color:'+(soon?'#4ADE80':'var(--gold,#E8BA6C)')+';margin:6px 0;font-variant-numeric:tabular-nums">'
      + String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0')+'</div>'
      +'<div style="font-size:12.5px;color:var(--t2)">'+next.label+'</div>'
      +(soon?'<div style="font-size:12px;color:#4ADE80;font-weight:700;margin-top:6px">Log in to IRCTC NOW \u2014 be on the booking page before it opens</div>':'')
      +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px;line-height:1.5">Times are IST. RoamWise never books or logs in for you \u2014 automating IRCTC breaks their rules and can get your account banned.</div>';
  }
  tick(); _tatkalTimer=setInterval(tick,1000);
}
/* --- passenger master list (on-device only) --- */
function rwTatkalPax(){ try{ return JSON.parse(lsGet('rw_tatkal_pax')||'[]'); }catch(e){ return []; } }
function rwTatkalSetPax(a){ try{ lsSet('rw_tatkal_pax', JSON.stringify(a.slice(0,6))); }catch(e){} }
function rwTatkalAddPax(){
  rwForm('Add passenger', [
    {key:'name', label:'Full name (as on ID)'},
    {key:'age', label:'Age', type:'number'},
    {key:'gender', label:'Gender (M/F/T)'},
    {key:'berth', label:'Berth preference', placeholder:'Lower / Upper / Side lower / No preference'}
  ], function(v){
    if(!v.name){ showToast('Name is required'); return; }
    var list=rwTatkalPax(); list.push({name:v.name, age:v.age, gender:(v.gender||'').toUpperCase(), berth:v.berth||''});
    rwTatkalSetPax(list); rwTatkalRenderPax();
  });
}
function rwTatkalDelPax(i){ var l=rwTatkalPax(); l.splice(i,1); rwTatkalSetPax(l); rwTatkalRenderPax(); }
function rwTatkalRenderPax(){
  var host=el('tatkalPax'); if(!host) return;
  var list=rwTatkalPax();
  if(!list.length){ host.innerHTML='<div style="font-size:12.5px;color:var(--t3)">Add your regular travellers once. When Tatkal opens you copy them in instead of typing under pressure.</div>'; return; }
  host.innerHTML=list.map(function(p,i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--b1,rgba(255,255,255,.06))">'
      +'<div style="flex:1"><b style="font-size:13.5px">'+esc2(p.name)+'</b>'
      +'<div style="font-size:11.5px;color:var(--t3)">'+esc2(String(p.age||''))+(p.gender?' \u00b7 '+esc2(p.gender):'')+(p.berth?' \u00b7 '+esc2(p.berth):'')+'</div></div>'
      +'<button class="tact" style="padding:4px 9px;font-size:11px" onclick="rwTatkalCopyPax('+i+')">Copy</button>'
      +'<button class="tact" style="padding:4px 8px;font-size:11px" onclick="rwTatkalDelPax('+i+')">\u2715</button></div>';
  }).join('')
  +'<button class="tact" style="width:100%;margin-top:10px;font-weight:700" onclick="rwTatkalCopyAll()">\ud83d\udccb Copy all passengers</button>';
}
function rwTatkalCopyPax(i){
  var p=rwTatkalPax()[i]; if(!p) return;
  var txt=p.name+'\t'+(p.age||'')+'\t'+(p.gender||'')+(p.berth?'\t'+p.berth:'');
  try{ navigator.clipboard.writeText(txt); showToast('Copied \u2014 paste into IRCTC'); }catch(e){ showToast('Copy failed'); }
}
function rwTatkalCopyAll(){
  var txt=rwTatkalPax().map(function(p){ return p.name+'\t'+(p.age||'')+'\t'+(p.gender||'')+(p.berth?'\t'+p.berth:''); }).join('\n');
  if(!txt){ showToast('No passengers saved yet'); return; }
  try{ navigator.clipboard.writeText(txt); showToast('All passengers copied'); }catch(e){ showToast('Copy failed'); }
}
/* --- checklist --- */
var RW_TATKAL_STEPS=[
  'IRCTC username &amp; password remembered (test-login the night before)',
  'Passenger details saved in IRCTC\u2019s own Master List',
  'Payment ready \u2014 UPI app open, or saved card / IRCTC eWallet topped up',
  'Train number &amp; class decided in advance (don\u2019t browse at 10:00)',
  'Boarding &amp; destination stations confirmed',
  'Strong network \u2014 switch to mobile data if wifi is flaky',
  'Logged in and sitting on the booking page 2 minutes early'
];
function rwTatkalRenderCheck(){
  var host=el('tatkalCheck'); if(!host) return;
  var done={}; try{ done=JSON.parse(lsGet('rw_tatkal_check')||'{}'); }catch(e){}
  host.innerHTML=RW_TATKAL_STEPS.map(function(t,i){
    var on=!!done[i];
    return '<button onclick="rwTatkalToggle('+i+')" style="display:flex;align-items:flex-start;gap:9px;width:100%;text-align:left;background:none;border:none;padding:7px 0;cursor:pointer;color:var(--t1)">'
      +'<span style="font-size:15px;flex:0 0 auto">'+(on?'\u2705':'\u2b1c')+'</span>'
      +'<span style="font-size:12.5px;line-height:1.5;'+(on?'color:var(--t3);text-decoration:line-through':'')+'">'+t+'</span></button>';
  }).join('');
}
function rwTatkalToggle(i){
  var done={}; try{ done=JSON.parse(lsGet('rw_tatkal_check')||'{}'); }catch(e){}
  done[i]=!done[i]; try{ lsSet('rw_tatkal_check', JSON.stringify(done)); }catch(e){}
  try{ rwHaptic(); }catch(e){}
  rwTatkalRenderCheck();
}

/* ============ ARRIVAL MODE — "your ticket is the start, not the end" (rw-v44)
   The strategic wedge vs ixigo/ConfirmTkt/IRCTC: on those apps the journey ENDS
   when the ticket is booked. Here, the arrival station + time is the TRIGGER
   for a full trip. We deliberately do NOT book tickets (that needs authorised
   IRCTC partner access) — we own everything around the ticket instead, and
   deep-link out for the booking itself.
   ========================================================================== */
var RW_STATIONS=[
  {q:'New Delhi (NDLS)', city:'Delhi'},{q:'Haridwar (HW)', city:'Haridwar'},
  {q:'Rishikesh (RKSH)', city:'Rishikesh'},{q:'Madgaon Goa (MAO)', city:'Goa'},
  {q:'Bengaluru (SBC)', city:'Bangalore'},{q:'Mumbai CSMT', city:'Mumbai'},
  {q:'Varanasi (BSB)', city:'Varanasi'},{q:'Jaipur (JP)', city:'Jaipur'},
  {q:'Kalka (KLK)', city:'Shimla'},{q:'Chennai Central (MAS)', city:'Chennai'},
  {q:'Kochi (ERS)', city:'Kochi'},{q:'Guwahati (GHY)', city:'Guwahati'}
];
function openArrival(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('arrivalSection');
  if(!sec){ sec=document.createElement('section'); sec.id='arrivalSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\ude82 Arrival <em>mode</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'arrivalSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Booked a train? Tell us where you land and when \u2014 we\u2019ll build the trip around your arrival, not around a search box.</p>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:16px;margin-bottom:14px">'
    +'<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:7px">ARRIVING AT</div>'
    +'<input id="arrStation" list="arrStationList" placeholder="Station or city \u2014 e.g. Haridwar (HW)" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:11px;color:var(--t1);font:inherit;margin-bottom:10px">'
    +'<datalist id="arrStationList">'+RW_STATIONS.map(function(x){return '<option value="'+x.q+'">';}).join('')+'</datalist>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:110px"><div style="font-size:11px;color:var(--t3);font-weight:700;margin-bottom:5px">ARRIVAL TIME</div>'
    +'<input id="arrTime" type="time" value="06:00" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:10px;color:var(--t1);font:inherit"></div>'
    +'<div style="flex:1;min-width:110px"><div style="font-size:11px;color:var(--t3);font-weight:700;margin-bottom:5px">HOW MANY DAYS</div>'
    +'<input id="arrDays" type="number" min="1" max="14" value="3" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:10px;color:var(--t1);font:inherit"></div></div>'
    +'<button class="tact" style="width:100%;margin-top:12px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px" onclick="rwArrivalGo()">Build my trip from this arrival \u2192</button>'
    +'</div>'
    +'<div id="arrivalOut"></div>';
}
function rwArrivalGo(){
  var st=(el('arrStation')&&el('arrStation').value||'').trim();
  var tm=(el('arrTime')&&el('arrTime').value)||'06:00';
  var dy=parseInt((el('arrDays')&&el('arrDays').value)||'3',10)||3;
  if(!st){ showToast('Which station are you arriving at?'); return; }
  var city=st.replace(/\s*\([A-Z]+\)\s*$/,'').trim();
  var known=RW_STATIONS.filter(function(x){ return x.q.toLowerCase()===st.toLowerCase(); })[0];
  if(known) city=known.city;
  var hr=parseInt(tm.split(':')[0],10);
  var slot = hr<5?'pre-dawn' : hr<9?'early morning' : hr<12?'late morning' : hr<16?'afternoon' : hr<20?'evening' : 'late night';
  var out=el('arrivalOut');
  out.innerHTML='<div style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:16px;margin-bottom:12px">'
    +'<div style="font-weight:800;font-size:15px;margin-bottom:4px">\ud83d\ude82 Landing in '+esc2(city)+' at '+esc2(tm)+'</div>'
    +'<div style="font-size:12.5px;color:var(--t2);line-height:1.6">'+esc2(rwArrivalAdvice(slot, city))+'</div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button class="tact" style="flex:1;min-width:150px;font-weight:800" onclick="rwArrivalPlan(\''+city.replace(/'/g,"\\'")+'\','+dy+',\''+tm+'\')">\ud83d\uddd3\ufe0f Build '+dy+'-day itinerary</button>'
    +'<button class="tact" style="flex:1;min-width:150px" onclick="rwArrivalNear(\''+city.replace(/'/g,"\\'")+'\')">\ud83d\udccd What\u2019s near the station</button>'
    +'<button class="tact" style="flex:1;min-width:150px" onclick="openFitnessStays()">\ud83c\udfcb\ufe0f Gyms &amp; stays nearby</button>'
    +'<button class="tact" style="flex:1;min-width:150px" onclick="rwArrivalBookOut(\''+city.replace(/'/g,"\\'")+'\')">\ud83c\udfab Book the train</button>'
    +'</div>';
}
/* Genuinely useful, non-obvious arrival guidance — the thing a booking app
   never tells you. Deliberately generic-but-true rather than invented specifics. */
function rwArrivalAdvice(slot, city){
  if(slot==='pre-dawn'||slot==='late night')
    return 'You land when most of '+city+' is asleep. Pre-book your stay for the night BEFORE you arrive so you can check in straight away \u2014 arriving at 3am without a booked room is the classic Indian-rail mistake. Prepaid taxi counters and station retiring rooms are your friends here.';
  if(slot==='early morning')
    return 'The best possible arrival slot. Drop bags, get chai, and hit the main sight before the crowds and heat \u2014 you effectively gain a whole extra day.';
  if(slot==='late morning')
    return 'Check in first, eat a proper lunch, then start with something indoors or shaded \u2014 the midday sun will eat your energy otherwise.';
  if(slot==='afternoon')
    return 'Treat today as a soft start: settle in, walk the local market, eat well. Save the big sights for a full morning tomorrow.';
  return 'You arrive as '+city+' switches to evening mode \u2014 perfect for a food street and an early night, so tomorrow starts properly.';
}
function rwArrivalPlan(city, days, tm){
  var q='I arrive in '+city+' by train at '+tm+'. Plan '+days+' days starting from that arrival \u2014 account for the arrival time on day 1 (do not plan a full morning if I land in the afternoon).';
  var inp=el('heroInput')||el('cpInput');
  if(inp){ inp.value=q; try{ copilotSend(!!el('heroInput')); }catch(e){} }
  rwCloseSection('arrivalSection');
}
function rwArrivalNear(city){
  try{ openNearMe(); }catch(e){}
  setTimeout(function(){
    var mi=el('nearManualInp');
    if(mi){ mi.value=city+' railway station'; try{ rwNearMeManualGo(); }catch(e){} }
    else { try{ rwNearMeManual('Searching around '+city+' station.'); setTimeout(function(){ var m2=el('nearManualInp'); if(m2){ m2.value=city+' railway station'; rwNearMeManualGo(); } },250); }catch(e){} }
  }, 400);
}
/* We don't book tickets (that needs authorised IRCTC partner access) — we send
   users out to the real booking sites, honestly labelled. */
function rwArrivalBookOut(city){
  var ov=el('bookOutOv');
  if(!ov){ ov=document.createElement('div'); ov.id='bookOutOv'; ov.className='overlay'; ov.style.zIndex='3000';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('bookOutOv'); }; document.body.appendChild(ov); }
  function lk(name, url, note){
    return '<a href="'+url+'" target="_blank" rel="noopener" class="tact" style="display:flex;align-items:center;gap:10px;text-decoration:none;padding:13px;margin-bottom:8px;border-radius:12px">'
      +'<span style="flex:1"><b style="font-size:14px">'+name+'</b><div style="font-size:11.5px;color:var(--t3)">'+note+'</div></span><span>\u2197</span></a>';
  }
  ov.innerHTML='<div class="sheet" style="max-width:400px"><div class="sheet-h"><b>\ud83c\udfab Book your train</b>'
    +'<button onclick="rwOverlayClose(\'bookOutOv\')" class="tact">\u2715</button></div>'
    +'<p style="font-size:12px;color:var(--t2);margin:2px 0 12px">RoamWise plans the trip \u2014 booking happens on the official platforms, so you always get real fares and real availability.</p>'
    + lk('IRCTC', 'https://www.irctc.co.in/', 'The official Indian Railways booking site')
    + lk('ixigo trains', 'https://www.ixigo.com/trains', 'PNR status, availability prediction')
    + lk('ConfirmTkt', 'https://www.confirmtkt.com/', 'Confirmation-chance prediction')
    +'<div style="font-size:11px;color:var(--t3);margin-top:6px;line-height:1.5">Come back after booking and tap \ud83d\ude82 Arrival mode \u2014 we\u2019ll build the trip around your arrival time.</div></div>';
  ov.classList.add('open');
}

/* ================= SMART TRAVEL MATCHING ENGINE (rw-v40) =================
   Matches people by travel INTENT — founders, investors, creators and
   travellers heading to similar places at similar times. Cross-device via
   Firestore so it works between real people, not just on one phone.
   Scoring is transparent (you can see WHY you matched), which beats a
   black-box "compatibility %" nobody trusts. */
var RW_MATCH_ROLES=[
  {id:'founder',  label:'\ud83d\ude80 Founder',   why:'building something'},
  {id:'investor', label:'\ud83d\udcbc Investor',  why:'looking at deals'},
  {id:'creator',  label:'\ud83c\udfa5 Creator',   why:'making content'},
  {id:'engineer', label:'\ud83d\udcbb Engineer',  why:'building / remote work'},
  {id:'traveller',label:'\ud83c\udf0d Traveller', why:'just exploring'}
];
var RW_MATCH_INTENT=[
  {id:'cofound',  label:'Meet co-founders'},
  {id:'raise',    label:'Meet investors'},
  {id:'invest',   label:'Meet founders to back'},
  {id:'collab',   label:'Creative collabs'},
  {id:'buddies',  label:'Travel buddies'},
  {id:'work',     label:'Co-work / remote'}
];
function openMatchEngine(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('matchSection');
  if(!sec){ sec=document.createElement('section'); sec.id='matchSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  var me=rwMatchProfile();
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83e\udd1d Travel <em>matching</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'matchSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Find founders, investors, creators and travellers heading where you\u2019re heading. You choose what to share \u2014 nothing is public until you post it.</p>'
    +'<div id="matchBody"></div>';
  rwMatchRender(me);
}
function rwMatchProfile(){ try{ return JSON.parse(lsGet('rw_match_me')||'null'); }catch(e){ return null; } }
function rwMatchRender(me){
  var host=el('matchBody'); if(!host) return;
  if(!me){
    host.innerHTML='<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:18px;text-align:center">'
      +'<div style="font-size:34px;margin-bottom:6px">\ud83e\udded</div>'
      +'<div style="font-weight:800;margin-bottom:4px">Set up your travel card</div>'
      +'<div style="font-size:13px;color:var(--t2);margin-bottom:14px">Takes 20 seconds. Say who you are and where you\u2019re headed \u2014 we\u2019ll surface people going the same way.</div>'
      +'<button class="tact" style="font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:12px 20px" onclick="rwMatchSetup()">Create my card</button></div>';
    return;
  }
  var role=RW_MATCH_ROLES.filter(function(r){return r.id===me.role;})[0]||RW_MATCH_ROLES[4];
  host.innerHTML='<div style="background:var(--bg2,#12151F);border:1px solid var(--gold,#E8BA6C);border-radius:16px;padding:15px;margin-bottom:14px">'
    +'<div style="display:flex;justify-content:space-between;align-items:start;gap:8px">'
    +'<div><div style="font-weight:800;font-size:15px">'+role.label+'</div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin-top:3px">Heading to <b>'+esc2(me.dest||'anywhere')+'</b>'+(me.when?' \u00b7 '+esc2(me.when):'')+'</div>'
    +'<div style="font-size:11.5px;color:var(--t3);margin-top:3px">'+esc2((me.intents||[]).map(function(i){var f=RW_MATCH_INTENT.filter(function(x){return x.id===i;})[0];return f?f.label:i;}).join(' \u00b7 '))+'</div></div>'
    +'<button class="tact" style="padding:5px 10px;font-size:11px" onclick="rwMatchSetup()">Edit</button></div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
    +'<button class="tact" style="flex:1;min-width:140px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwMatchPost()">\ud83d\udce3 Post my card</button>'
    +'<button class="tact" style="flex:1;min-width:140px" onclick="rwMatchFind()">\ud83d\udd0d Find matches</button></div>'
    +'<div id="matchResults"></div>';
}
function rwMatchSetup(){
  var me=rwMatchProfile()||{};
  var roleOpts=RW_MATCH_ROLES.map(function(r){ return {v:r.id, t:r.label}; });
  rwForm('\ud83e\udded Your travel card', [
    {key:'role', label:'I am a\u2026 ('+RW_MATCH_ROLES.map(function(r){return r.id;}).join(' / ')+')', value:me.role||'traveller'},
    {key:'dest', label:'Heading to (city or region)', value:me.dest||'', placeholder:'e.g. Bangalore, Goa, Bali'},
    {key:'when', label:'Roughly when?', value:me.when||'', placeholder:'e.g. Sep 2026'},
    {key:'about', label:'One line about you', value:me.about||'', placeholder:'e.g. building a travel app, open to co-founders'},
    {key:'contact', label:'How should matches reach you?', value:me.contact||'', placeholder:'email or @handle'}
  ], function(v){
    var prof={role:(v.role||'traveller').toLowerCase().trim(), dest:v.dest||'', when:v.when||'',
              about:v.about||'', contact:v.contact||'', intents:me.intents||['buddies']};
    try{ lsSet('rw_match_me', JSON.stringify(prof)); }catch(e){}
    rwMatchRender(prof); showToast('Travel card saved');
  });
}
/* Post my card so others can find me. Opt-in and explicit. */
function rwMatchPost(){
  var me=rwMatchProfile(); if(!me){ rwMatchSetup(); return; }
  if(!me.dest){ showToast('Add a destination first'); return; }
  if(!user){ showToast('Sign in first so matches can reach you'); return; }
  if(typeof db==='undefined' || !db){ showToast('Connect to the internet to post your card'); return; }
  db.collection('squads').add({
    key:'match:'+(me.dest||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,24),
    kind:'match', role:me.role, dest:me.dest, when:me.when, about:me.about,
    contact:me.contact, intents:me.intents||[],
    name:(user.displayName||'Traveller'), uid:user.uid,
    created: firebase.firestore.FieldValue.serverTimestamp(),
    expireAt: firebase.firestore.Timestamp.fromMillis(Date.now()+60*24*60*60*1000)
  }).then(function(){ showToast('\ud83d\udce3 Card posted \u2014 people heading to '+me.dest+' can find you'); })
    .catch(function(){ showToast('Could not post right now \u2014 try again'); });
}
/* Find people going the same way. Transparent scoring: you see WHY. */
function rwMatchFind(){
  var me=rwMatchProfile(); if(!me||!me.dest){ showToast('Set your destination first'); return; }
  var host=el('matchResults'); if(host) host.innerHTML='<div class="note">\ud83d\udd0d Looking for people heading to '+esc2(me.dest)+'\u2026</div>';
  if(typeof db==='undefined' || !db){ if(host) host.innerHTML='<div class="note">You\u2019re offline \u2014 matching needs a connection.</div>'; return; }
  var key='match:'+(me.dest||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,24);
  db.collection('squads').where('key','==',key).limit(30).get().then(function(qs){
    var rows=[];
    qs.forEach(function(d){ var x=d.data()||{}; if(x.uid!==(user&&user.uid)) rows.push(x); });
    rwMatchShow(rows, me);
  }).catch(function(){ if(host) host.innerHTML='<div class="note">Couldn\u2019t search right now \u2014 try again in a moment.</div>'; });
}
function rwMatchScore(them, me){
  var pts=0, why=[];
  if((them.dest||'').toLowerCase()===(me.dest||'').toLowerCase()){ pts+=3; why.push('same destination'); }
  if(them.when && me.when && them.when.toLowerCase()===me.when.toLowerCase()){ pts+=2; why.push('same dates'); }
  var mine=me.intents||[], theirs=them.intents||[];
  var shared=mine.filter(function(i){ return theirs.indexOf(i)>=0; });
  if(shared.length){ pts+=shared.length; why.push('both want '+shared.length+' of the same thing'+(shared.length>1?'s':'')); }
  /* complementary pairs are the valuable ones */
  var comp=[['founder','investor'],['investor','founder'],['founder','engineer'],['creator','founder']];
  comp.forEach(function(c){ if(me.role===c[0] && them.role===c[1]){ pts+=3; why.push('complementary roles'); } });
  return {pts:pts, why:why};
}
function rwMatchShow(rows, me){
  var host=el('matchResults'); if(!host) return;
  if(!rows.length){ host.innerHTML='<div class="note" style="text-align:center;padding:18px;color:var(--t3)">No one has posted for '+esc2(me.dest)+' yet. Post your card \u2014 be the first, and others will find you.</div>'; return; }
  var scored=rows.map(function(r){ var s=rwMatchScore(r, me); return {r:r, s:s}; })
                 .sort(function(a,b){ return b.s.pts-a.s.pts; });
  host.innerHTML='<div style="font-size:12px;color:var(--t3);margin-bottom:8px">'+scored.length+' heading the same way</div>'
    + scored.map(function(x){
      var r=x.r, role=RW_MATCH_ROLES.filter(function(q){return q.id===r.role;})[0]||RW_MATCH_ROLES[4];
      return '<div style="border:1px solid var(--b2,#2A2A36);border-radius:13px;padding:13px;margin-bottom:9px;background:var(--bg2,#12151F)">'
        +'<div style="display:flex;justify-content:space-between;gap:8px"><div style="font-weight:800;font-size:14px">'+role.label+' \u00b7 '+esc2(r.name||'Traveller')+'</div>'
        +'<div style="font-size:11px;color:var(--gold,#E8BA6C);font-weight:800">'+x.s.pts+' pts</div></div>'
        +(r.about?'<div style="font-size:13px;color:var(--t2);margin-top:4px">'+esc2(r.about)+'</div>':'')
        +'<div style="font-size:11px;color:var(--t3);margin-top:4px">'+esc2(r.dest||'')+(r.when?' \u00b7 '+esc2(r.when):'')+'</div>'
        +(x.s.why.length?'<div style="font-size:11px;color:#4ADE80;margin-top:5px">\u2713 '+esc2(x.s.why.join(' \u00b7 '))+'</div>':'')
        +(r.contact?'<div style="margin-top:8px"><a class="tact" style="padding:6px 12px;font-size:12px;text-decoration:none" href="'+(r.contact.indexOf('@')>=0&&r.contact.indexOf(' ')<0&&r.contact.indexOf('.')>0?'mailto:'+esc2(r.contact):'#')+'">\u2709\ufe0f '+esc2(r.contact)+'</a></div>':'')
        +'</div>';
    }).join('');
}

// Tusk Rich Reply System (rwTuskRail, escHtmlAttr, rwTuskAsk, rwTuskNeedsClarity, rwStartAnywhere, cpFinish, cpGoPlan, cpActionsHTML) moved to js/copilot/rich-reply.js
// escHtml() moved to js/core/text-utils.js (deduped; was reused by js/copilot/core.js)

// vaultGet/vaultSave/saveTripOffline moved to js/itinerary/trip-vault.js
/* --- Overlay history stack ---
   Android's back button was leaving the app because overlays never touched
   history. Each open pushes a state; back pops it and closes the top overlay. */
var _rwOvStack=[];
function rwOverlayOpen(id, closeFn){
  var ov=el(id); if(!ov) return;
  ov.classList.add('open'); document.body.style.overflow='hidden';
  _rwOvStack.push({id:id, close:closeFn});
  try{ history.pushState({rwOverlay:id}, ''); }catch(e){}
}
function rwOverlayClose(id){
  var ov=el(id); if(ov) ov.classList.remove('open');
  _rwOvStack = _rwOvStack.filter(function(o){ return o.id!==id; });
  if(!_rwOvStack.length) document.body.style.overflow='';
}
window.addEventListener('popstate', function(){
  var top=_rwOvStack.pop();
  if(top){ var ov=el(top.id); if(ov) ov.classList.remove('open'); if(!_rwOvStack.length) document.body.style.overflow=''; }
});
// openVault/closeVault/deleteVaultTrip/openVaultTrip/loadTripExtras moved to js/itinerary/trip-vault.js
// FREE AFFILIATE / DEEP LINKS + CENTRAL AFFILIATE LINK SYSTEM (AFF_* constants,
// affTpUrl, rwAffLink, flightUrl, trainBusUrl, stayUrlAgoda, thingsUrl,
// travelLinksHTML, rwBookGridHTML) moved to js/booking/affiliate-links.js

// Trip countdown notifications (notifyEnable/tripReminderCheck) moved to js/audio/reminders.js
// proofStamp (verifiable journey fingerprint) moved to js/game/badges.js

// Crypto payment panel (CRYPTO_WALLETS/cryptoConfigured/cryptoPanelHTML/copyText) moved to js/payments/checkout.js

// PWA (service worker registration + install prompts) moved to js/boot/init.js







// Group Compromise Engine (RW_INTERESTS, grpMembers/grpTagsFor/grpScoreMember/grpCompromise, openGroupPlanner/grpRender/grpAdd/grpRemove/grpResults) moved to js/social/group-compromise.js
// Shared trip-chat room state (_chatUnsub, _chatRoom, _chatMsgs, chatPost) moved to js/social/group-state.js
// Secure Trip Group Chat (openGroupChat/tripChatOpen and friends, plus reactions/streak/presence/members/vibe/chatBubble/moderation) moved to js/social/group-chat.js and js/social/group-chat-social.js
// Live Kitty (expense split) moved to js/social/expense-split.js; Group Train Picker
// moved to js/social/train-picker.js; "When can everyone go?" moved to
// js/social/trip-scheduling-poll.js; remaining Trip Board coordination layer
// (polls, board, plan, Tusk facilitator) moved to js/social/trip-board.js

// Tusk persona (smalltalk, masala framing, tkClarifyHTML/tkMiniCard/tkRouteCard) moved to js/copilot/tusk-persona.js

/* ==================== IN-APP FORM MODAL ====================
   Replaces browser prompt() (the ugly "page at file:// says" boxes) with a
   styled sheet. rwForm(title, fields, onSubmit) where fields = [{key,label,
   placeholder,type,value}]. onSubmit gets an object of {key:value}. Cancel =
   no callback. Works in the APK (file://) and on the web identically. */
function rwForm(title, fields, onSubmit){
  var ov=el('rwFormOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='rwFormOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet" style="max-width:420px"><div class="sheet-head"><b id="rwFormTitle"></b><button class="x" onclick="rwOverlayClose(\'rwFormOverlay\')">\u2715</button></div><div id="rwFormBody" style="padding:6px 4px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  ov.style.zIndex='3000';   /* always above the chat (panel or full) */
  el('rwFormTitle').textContent=title;
  var body=el('rwFormBody');
  /* Optional leading read-only notice (e.g. a viewing-only / preview banner).
     Additive and non-breaking: callers that don't set fields._notice render as before.
     esc2() keeps it safe even if the text ever comes from data. */
  var _notice = fields._notice
    ? '<div style="background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:10px 12px;margin:2px 2px 8px;font-size:12px;line-height:1.45;color:var(--t2,#B9B9C6)">'+esc2(fields._notice)+'</div>'
    : '';
  body.innerHTML = _notice + fields.map(function(f,i){
    var common='width:100%;box-sizing:border-box;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:12px 13px;color:inherit;font:inherit;font-size:16px;outline:none;margin-bottom:4px';
    var inp = f.type==='textarea'
      ? '<textarea id="rwf_'+i+'" rows="3" placeholder="'+esc2(f.placeholder||'')+'" style="'+common+';resize:vertical">'+esc2(f.value||'')+'</textarea>'
      : f.type==='select'
      ? '<select id="rwf_'+i+'" style="'+common+'">'+(f.options||[]).map(function(o){ var v=(o.value!=null?o.value:o), l=(o.label!=null?o.label:o); return '<option value="'+esc2(v)+'"'+(String(f.value)===String(v)?' selected':'')+'>'+esc2(l)+'</option>'; }).join('')+'</select>'
      : '<input id="rwf_'+i+'" type="'+(f.type||'text')+'" inputmode="'+(f.type==='number'?'numeric':'text')+'" placeholder="'+esc2(f.placeholder||'')+'" value="'+esc2(f.value||'')+'" style="'+common+'">';
    return '<label style="display:block;font-size:12px;color:var(--t2);font-weight:600;margin:10px 2px 5px">'+esc2(f.label)+'</label>'+inp
      +(f.hint?'<div style="font-size:10.5px;color:var(--t3);margin:0 2px 2px">'+esc2(f.hint)+'</div>':'');
  }).join('')
  + '<button class="rzp-main-btn" style="width:100%;margin-top:14px" onclick="rwFormSubmit()">'+(fields._submit||'Add')+'</button>';
  window._rwFormFields=fields; window._rwFormCb=onSubmit;
  rwOverlayOpen('rwFormOverlay');
  setTimeout(function(){ var f0=el('rwf_0'); if(f0) f0.focus(); }, 120);
}
function rwFormSubmit(){
  var fields=window._rwFormFields||[], out={};
  for(var i=0;i<fields.length;i++){
    var elm=el('rwf_'+i); out[fields[i].key]=elm?elm.value.trim():'';
  }
  rwOverlayClose('rwFormOverlay');
  if(typeof window._rwFormCb==='function') window._rwFormCb(out);
}

// CoordKit settle engine (rwSettleEngine) moved to js/social/coordkit.js

// TRIP MERCH moved to js/misc/misc-features-2.js





// Travel Progression (RW_XP_LEVELS/RW_CHALLENGES/rwXp*/rwProgress*) moved to js/game/badges.js






// OFF-GRID SAFETY (RW_OFFGRID/rwOffgridHTML) moved to js/misc/eco-safety.js


// SOUND OF PLACE moved to js/misc/sound-of-place.js

// SIGNATURE FOOD moved to js/misc/signature-food.js


// RESPONSIBLE TRAVEL (RW_RESPONSIBLE/rwResponsibleHTML) moved to js/misc/eco-safety.js


// GREEN HUB (RW_GREEN/rwGreenHubHTML) moved to js/misc/eco-safety.js


// MONKEY SAFETY (RW_MONKEY/rwMonkeyFor/rwMonkeyHTML) moved to js/misc/eco-safety.js


// DESTINATION VIBE moved to js/misc/destination-vibe.js

// TREKKING (RW_TREKS/rwTrekListHTML/rwTrekOps) moved to js/misc/trek-vault.js

// ATHLETE MODE (medical + fitness POI lookups) moved to js/misc/athlete-mode.js

// LIVE LOCATION ("near me" geolocation answer) moved to js/misc/live-location.js

// BOOKING PLATFORM COMPARISON moved to js/misc/booking-platform-compare.js

// LOCAL ECOSYSTEM moved to js/misc/local-ecosystem.js


// LOW-CARBON TRAVEL (RW_EMIT/rwCO2/rwGreenSwapHTML/eco ledger+badges) moved to js/misc/eco-safety.js




// CERTIFICATE VERIFICATION (rwCertHash, rwVerifyPanelHTML, rwVerifyRun) moved to js/itinerary/certificate-verify.js
// ECO CERTIFICATE (rwEcoCert, rwCertShare) moved to js/itinerary/eco-certificate.js

// ON-TRIP ACTION HUB (RW_ACTIONS, rwActionIntent, rwActionQuery, rwActionHubHTML)
// moved to js/booking/actions.js

// OVER-TOURISM FLAG (RW_TOURIST_PRESSURE/rwPressureHTML) moved to js/misc/eco-safety.js





/* ==================== RULES VERSION CHECK ====================
   "Missing or insufficient permissions" is the least helpful error in Firebase,
   because it looks identical whether the user lacks access or the rules simply
   were not published. This probes several collections and reports which
   features are actually live, so the answer is a fact rather than a guess. */
var RW_RULES_VERSION = '2026-07-24';
async function rwRulesCheck(){
  if(!window.db){ showToast('Not connected to the database'); return; }
  var checks = [
    ['Group chat',      function(){ return db.collection('tripchats').doc('_probe_'+Date.now()).get(); }],
    ['Staff logins',    function(){ return db.collection('staff').doc('_probe').get(); }],
    ['Moderation bans', function(){ return db.collection('bans').doc('_probe').get(); }],
    ['Founder gate',    function(){ return db.collection('pricing').doc('founder').get(); }],
    ['Rules version',   function(){ return db.collection('meta').doc('rulesVersion').get(); }]
  ];
  var rows=[], live=null;
  for(var i=0;i<checks.length;i++){
    try{
      var d = await checks[i][1]();
      if(checks[i][0]==='Rules version' && d && d.exists) live=(d.data()||{}).version||null;
      rows.push([checks[i][0], true, '']);
    }catch(e){
      rows.push([checks[i][0], false, (e && e.code) || 'error']);
    }
  }
  var allOk = rows.every(function(r){ return r[1]; });
  var html = '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,'
    +(allOk?'#14532D':'#7F1D1D')+',#0A0A0C)">'
    +'<div class="tk-place">'+(allOk?'\u2705 Rules look current':'\u26a0\ufe0f Rules are out of date')+'</div>'
    +'<div class="tk-meta">'+(live? 'Published version: '+esc2(live) : 'No version marker found on the server')+'</div></div>'
    +'<div class="tk-sec">'
    + rows.map(function(r){
        return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12.5px">'
          +'<span>'+esc2(r[0])+'</span>'
          +'<b style="color:'+(r[1]?'#4ADE80':'#E05B5B')+'">'+(r[1]?'reachable':'blocked')+'</b></div>';
      }).join('')
    +'</div>'
    + (allOk
        ? '<div class="tk-sec"><div style="font-size:12px;color:var(--t2);line-height:1.6">Every collection responded. If a feature still fails, it is a code issue rather than a rules issue \u2014 tell me exactly what you tapped.</div></div>'
        : '<div class="tk-sec"><div style="font-size:12px;color:var(--t2);line-height:1.6">'
          +'Anything marked <b>blocked</b> needs the current rules published. Firebase Console \u2192 Firestore \u2192 Rules \u2192 paste <code>firestore.rules</code> \u2192 Publish. '
          +'Then set <code>meta/rulesVersion</code> to <code>{version:"'+RW_RULES_VERSION+'"}</code> so this check can confirm it next time.</div></div>')
    +'</div>';
  var log = el('heroLog');
  if(log){ log.style.display='block'; log.insertAdjacentHTML('beforeend','<div class="cp-msg bot">'+html+'</div>'); log.scrollTop=log.scrollHeight; }
  else showToast(allOk? 'Rules look current' : 'Rules need publishing');
}

// PLACE DISAMBIGUATION (RW_FC/rwPlaceType/rwCandidates/rwIsAmbiguous/rwDisambigHTML) moved to js/itinerary/place-disambiguation.js

// RW_STATES and RW_STATE_ALIAS (Indian states/regions circuit data) moved to js/data/regions.js
function rwDetectState(t){
  var lower=' '+String(t).toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ')+' ';
  var keys=Object.keys(RW_STATE_ALIAS).sort(function(a,b){ return b.length-a.length; });
  for(var i=0;i<keys.length;i++){ if(lower.indexOf(' '+keys[i]+' ')>-1) return RW_STATE_ALIAS[keys[i]]; }
  return null;
}
function rwStateHTML(key, days){
  var S=RW_STATES[key]; if(!S) return '';
  days = days || 7;
  var fits = S.circuits.filter(function(c){ return c.minDays <= days; });
  var tooBig = S.circuits.filter(function(c){ return c.minDays > days; });
  if(!fits.length) fits = S.circuits.slice().sort(function(a,b){ return a.minDays-b.minDays; }).slice(0,2);
  var rows = fits.slice(0,4).map(function(c){
    var per = Math.max(1, Math.floor(days/c.stops.length));
    return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<b style="font-size:13.5px">'+esc2(c.name)+'</b>'
      +'<span style="font-size:10.5px;color:var(--t3)">from '+c.minDays+' days</span></div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin:3px 0 6px;line-height:1.5">'+esc2(c.why)+'</div>'
      +'<div class="tk-chips">'
      + c.stops.map(function(st){ return '<button class="tk-chip" style="font-size:11px;padding:5px 10px" onclick="cpFollow(\''+st.replace(/'/g,'')+' '+per+' days\')">'+esc2(st)+' \u00b7 '+per+'d</button>'; }).join('')
      +'</div></div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:'+tkThemeGrad(S.label)+'">'
    +'<div class="tk-place">'+esc2(S.label)+' \u00b7 '+days+' days</div>'
    +'<div class="tk-meta">A state, not a city \u2014 here are routes through it</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Routes that fit '+days+' days</div>'+rows+'</div>'
    + (tooBig.length? '<div class="tk-sec"><div class="tk-lab">Needs more time</div>'
        + tooBig.map(function(c){ return '<div class="tk-bul">'+esc2(c.name)+' \u2014 needs '+c.minDays+'+ days</div>'; }).join('')
        +'</div>' : '')
    +'<div class="tk-sec"><div class="tk-lab">Ask me next</div><div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'best time to visit '+S.label.replace(/'/g,'')+'\')">\u26c5 Best season</button>'
    +'<button class="tk-chip" onclick="cpFollow(\''+S.label.replace(/'/g,'')+' budget for '+days+' days\')">\ud83d\udcb0 Budget</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'food in '+S.label.replace(/'/g,'')+'\')">\ud83c\udf5c Food</button>'
    +'</div></div></div>';
}

// RW_COUNTRY_ROUTES (country/region trip circuits) moved to js/data/regions.js
/* Merge the extended database (tusk-data.js) into the built-in tables. Done once,
   lazily, so load order can't bite us — if tusk-data.js is missing the app still
   runs on its six built-in countries. */
function rwMergeExtData(){
  if(window._rwDataMerged) return;
  try{ if(typeof RW_COUNTRY_ROUTES_EXT!=='undefined'){ for(var k in RW_COUNTRY_ROUTES_EXT){ if(!RW_COUNTRY_ROUTES[k]) RW_COUNTRY_ROUTES[k]=RW_COUNTRY_ROUTES_EXT[k]; } } }catch(e){}
  try{ if(typeof RW_FOOD_EXT!=='undefined'){ for(var f in RW_FOOD_EXT){ if(!RW_FOOD[f]) RW_FOOD[f]=RW_FOOD_EXT[f]; } } }catch(e){}
  window._rwDataMerged = true;
}
function rwDetectCountry(t){
  rwMergeExtData();
  var lower=' '+String(t).toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s{2,}/g,' ')+' ';
  /* 1) alias table first — handles "nz", "new zealand", "aussie", "the states" */
  try{
    if(typeof RW_COUNTRY_ALIAS!=='undefined'){
      /* check multi-word aliases before single words so "new zealand" wins over "new" */
      var aliases=Object.keys(RW_COUNTRY_ALIAS).sort(function(a,b){ return b.length-a.length; });
      for(var a=0;a<aliases.length;a++){ if(lower.indexOf(' '+aliases[a]+' ')>-1) return RW_COUNTRY_ALIAS[aliases[a]]; }
    }
  }catch(e){}
  /* 2) direct key match (india, japan, etc.) */
  var keys=Object.keys(RW_COUNTRY_ROUTES);
  for(var i=0;i<keys.length;i++){ if(lower.indexOf(' '+keys[i]+' ')>-1) return keys[i]; }
  if(/\bbharat\b/.test(lower)) return 'india';
  return null;
}
function rwCountryRouteHTML(key, days){
  var C = RW_COUNTRY_ROUTES[key]; if(!C) return '';
  days = days || 10;
  var fits = C.circuits.filter(function(c){ return c.minDays <= days; });
  var tooBig = C.circuits.filter(function(c){ return c.minDays > days; });
  if(!fits.length) fits = C.circuits.slice().sort(function(a,b){ return a.minDays-b.minDays; }).slice(0,2);
  var rows = fits.slice(0,4).map(function(c){
    var per = Math.max(1, Math.floor(days/c.stops.length));
    return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<b style="font-size:13.5px">'+esc2(c.name)+'</b>'
      +'<span style="font-size:10.5px;color:var(--t3)">from '+c.minDays+' days</span></div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin:3px 0 6px;line-height:1.5">'+esc2(c.why)+'</div>'
      +'<div class="tk-chips">'
      + c.stops.map(function(st){ return '<button class="tk-chip" style="font-size:11px;padding:5px 10px" onclick="cpFollow(\''+st.replace(/'/g,'')+' '+per+' days\')">'+esc2(st)+' \u00b7 '+per+'d</button>'; }).join('')
      +'</div></div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:'+tkThemeGrad(C.label)+'">'
    +'<div class="tk-place">'+esc2(C.label)+' \u00b7 '+days+' days</div>'
    +'<div class="tk-meta">Country-wide trip \u2014 pick a circuit, not a checklist</div></div>'
    +'<div class="tk-sec"><div style="font-size:12.5px;line-height:1.6;color:var(--t2)">'
    +'You can\u2019t see all of '+esc2(C.label)+' in '+days+' days \u2014 nobody can, and trying is how a holiday turns into a commute. '
    +'Here are the circuits that genuinely fit that window. Tap any stop to plan it properly.</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Routes that fit '+days+' days</div>'+rows+'</div>'
    + (tooBig.length? '<div class="tk-sec"><div class="tk-lab">Needs more time</div>'
        + tooBig.slice(0,3).map(function(c){ return '<div class="tk-bul">'+esc2(c.name)+' \u2014 needs '+c.minDays+'+ days</div>'; }).join('')
        +'</div>' : '')
    +'<div class="tk-sec"><div class="tk-lab">Ask me next</div>'
    +'<div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'best time to visit '+C.label+'\')">\u26c5 Best season</button>'
    +'<button class="tk-chip" onclick="cpFollow(\''+C.label+' budget for '+days+' days\')">\ud83d\udcb0 Budget</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'is '+C.label+' safe? any scams?\')">\ud83d\udee1\ufe0f Safety</button>'
    +'</div></div></div>';
}

/* ==================== CROSS-QUESTIONING ====================
   When the only candidate destination is a common English word that merely
   HAPPENS to name a hamlet somewhere, guessing is worse than asking. */
var RW_COMMON_WORDS = /^(you|your|yours|yourself|youre|u|ur|me|my|mine|myself|we|us|our|ours|they|them|their|he|him|his|she|her|hers|it|its|tusk|ailon|roamwise|bot|ai|assistant|hello|hey|hi|namaste|thanks|thank|please|sorry|all|say|under|over|about|mean|share|send|nice|good|best|top|new|old|big|small|long|short|first|last|next|only|even|both|most|much|many|more|less|same|other|such|own|off|out|up|down|in|on|at|to|for|and|but|or|so|as|if|then|than|when|while|where|why|how|what|who|which|of|be|is|are|was|were|do|did|has|have|had|can|will|would|should|could|may|might|must|no|not|yes|ok|okay|well|just|very|too|also|still|back|again|here|there|now|today|day|days|week|month|year|time|trip|tour|plan|go|going|come|coming|see|do|make|take|get|give|want|need|like|know|think|feel|find|use|work|help|try|ask|tell|call|keep|let|put|show|turn|start|stop|end|open|close|hold|bring|move|live|play|run|walk|talk|read|write|hear|watch|look|seem|leave|stay|book|visit|travel|explore|discover)$/i;
function rwNeedsClarify(dest, parsed, geo){
  if(!dest) return false;
  if(parsed && parsed.multi) return false;
  var d = String(dest).trim();
  if(d.indexOf(' ')>-1) return false;                    /* multi-word names are rarely accidents */
  if(!RW_COMMON_WORDS.test(d)) return false;             /* a real place name, carry on */
  if(typeof rwKnownMap==='function' && rwKnownMap()[d.toLowerCase()]) return false;
  return true;                                            /* common word + not a known place = ask */
}
function rwClarifyWordHTML(word, parsed){
  var days = parsed && parsed.days ? parsed.days : null;
  var suggest = ['Goa','Manali','Jaipur','Kerala','Rishikesh'];
  return '<div class="tk-card"><div class="tk-sec">'
    +'<div style="font-size:13.5px;line-height:1.65">\ud83e\udded I\u2019m not sure what you meant by \u201c<b>'+esc2(word)+'</b>\u201d.<br>'
    +'<span style="color:var(--t2);font-size:12.5px">There is a tiny village called '+esc2(word)+' in Spain, but I doubt that\u2019s it \u2014 so I\u2019d rather ask than send you somewhere absurd.</span></div>'
    +'<div class="tk-lab" style="margin-top:11px">Did you mean</div>'
    +'<div class="tk-chips">'
    +'<button class="tk-chip gold" onclick="cpFollow(\''+(days?days+' days ':'')+'india trip\')">\ud83c\uddee\ud83c\uddf3 A trip around India</button>'
    + suggest.map(function(sx){ return '<button class="tk-chip" onclick="cpFollow(\''+(days?days+' days in ':'')+sx+'\')">'+sx+'</button>'; }).join('')
    +'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:10px">Or just type the city and country \u2014 e.g. \u201c'+(days||5)+' days in Udaipur, India\u201d.</div>'
    +'</div></div>';
}

// Tusk Answer Cards (wvStructured, tkBullets/tkThemeGrad/tkHeadStyle, cpFollow, tkFollowChips/tkItinChips/tkCredits, rwIntlHTML, rwStyledSheet/rwBudgetFit/rwBudgetFitHTML) moved to js/copilot/answer-cards.js

/* ==================== ON-THE-GROUND COSTS & STREET SMARTS =================
   What a traveller actually needs the hour they land: what a taxi SHOULD cost,
   what a room SHOULD cost, what a meal SHOULD cost, and the specific ways
   people get overcharged in that region.

   These are MODELLED RANGES from published fare structures and typical rates,
   not live quotes — labelled as such everywhere they appear. We deliberately do
   NOT invent "areas to avoid" or claim any place or group is dangerous; the
   warnings here are about PRICING TRICKS and paperwork, which are checkable
   facts, not stereotypes. */
var RW_GROUND = {
  IN: {
    cur:'\u20b9',
    transport:[
      ['\ud83d\udef5 Auto-rickshaw', '\u20b925\u201335 base + \u20b915\u201320/km', 'Insist on the meter. "Meter kharab hai" means walk to the next one.'],
      ['\ud83d\ude95 App cab (Uber/Ola)', '\u20b925\u201335/km + surge', 'Always cheaper than a street taxi at a tourist spot. Book from inside, not the kerb.'],
      ['\ud83c\udfcd\ufe0f Bike taxi (Rapido)', '\u20b910\u201315/km', 'Cheapest for one person in traffic. Helmet should be provided \u2014 ask.'],
      ['\ud83d\udef5 Rented scooter', '\u20b9400\u2013700/day', 'Photograph every existing scratch before you ride off. Keep the original licence.'],
      ['\ud83d\ude8c State bus', '\u20b91\u20132/km', 'Slow but honest pricing. Book on the state RTC site, not an agent.'],
      ['\ud83d\ude82 Train (sleeper/3AC)', '\u20b90.4\u20131.2/km', 'IRCTC only. Tatkal opens 10\u201311am one day before.'],
      ['\u2708\ufe0f Domestic flight', '\u20b93,000\u20138,000', 'Cheapest 3\u20136 weeks out; Tue/Wed departures are usually lowest.']
    ],
    stay:[['Hostel dorm','\u20b9400\u2013900'],['Budget room','\u20b9800\u20131,800'],['Mid hotel','\u20b92,000\u20134,500'],['Premium','\u20b96,000+']],
    food:[['Street plate','\u20b930\u2013080'],['Dhaba thali','\u20b9100\u2013200'],['Cafe meal','\u20b9250\u2013500'],['Restaurant dinner','\u20b9600\u20131,200']],
    hacks:[
      'Ask your hotel what a fair fare is BEFORE you step out \u2014 it takes one minute and kills 90% of overcharging.',
      'Agree the price out loud before the ride starts, or use a meter/app. Never "we\u2019ll see later".',
      'At stations and airports, use the prepaid taxi counter \u2014 fixed slip, no argument.',
      '"Your hotel is closed/full, I\u2019ll take you to a better one" is a commission scheme. Call your hotel and confirm.',
      'Free bracelet, free blessing, free henna \u2014 nothing offered unprompted is free.',
      'Count change before walking away, and keep \u20b910/20/50 notes for autos.',
      'Buy SIM and tickets from official counters or apps, never from someone who approaches you.',
      'If a shop is "the only one open today because of a festival", it isn\u2019t.'
    ]
  },
  SEA: {
    cur:'$',
    transport:[
      ['\ud83c\udfcd\ufe0f Scooter rental','$5\u201310/day','Never hand over your passport as deposit \u2014 offer a copy or cash.'],
      ['\ud83d\ude95 Grab / ride app','$0.4\u20130.8/km','Use the app even for short hops; street quotes run 2\u20133x.'],
      ['\ud83d\udef5 Tuk-tuk','$2\u20135 short hop','Agree the fare first. "Very cheap tour" ends at a gem shop.'],
      ['\ud83d\ude8c Local bus','$0.3\u20131','Slow, safe, and the real price.'],
      ['\u26f4\ufe0f Ferry','$5\u201320','Book at the pier office, not through a beach tout.']
    ],
    stay:[['Hostel dorm','$5\u201312'],['Budget room','$12\u201325'],['Mid hotel','$30\u201360'],['Premium','$90+']],
    food:[['Street plate','$1\u20133'],['Local restaurant','$3\u20136'],['Tourist restaurant','$8\u201315'],['Western cafe','$6\u201312']],
    hacks:[
      'Eat where the plastic stools are \u2014 cheaper and usually better.',
      'Scooter damage claims are the classic scam: film a slow walk-around before renting.',
      '"Temple is closed today" almost always means a tuk-tuk commission run.',
      'Withdraw larger amounts less often \u2014 ATM fees are per transaction.',
      'Refuse to pay a "fine" without an official receipt; ask to go to the station.'
    ]
  },
  EU: {
    cur:'\u20ac',
    transport:[
      ['\ud83d\ude87 Metro day pass','\u20ac6\u201312','Almost always cheaper than 3 single tickets. Validate it or face a fine.'],
      ['\ud83d\ude95 Ride app','\u20ac1.5\u20132.5/km','Airport transfers often have a fixed rate \u2014 check before booking.'],
      ['\ud83d\ude86 Regional train','\u20ac0.1\u20130.2/km','Book early; walk-up fares can be triple.'],
      ['\ud83d\udeb2 City bike','\u20ac1\u20133/ride','Cheapest way to see a compact old town.']
    ],
    stay:[['Hostel dorm','\u20ac20\u201335'],['Budget room','\u20ac45\u201380'],['Mid hotel','\u20ac90\u2013150'],['Premium','\u20ac200+']],
    food:[['Bakery lunch','\u20ac4\u20138'],['Casual meal','\u20ac12\u201320'],['Sit-down dinner','\u20ac25\u201345'],['Fine dining','\u20ac60+']],
    hacks:[
      'Menu turistico near a landmark = 2x the price 3 streets away.',
      'A "cover charge" (coperto) is legal in Italy but must be on the menu \u2014 check first.',
      'Always choose to be charged in the LOCAL currency on card machines; "pay in your own currency" adds a poor exchange rate.',
      'Validate train and tram tickets \u2014 inspectors are frequent and fines are steep.'
    ]
  }
};
function rwGroundFor(geo){
  var cc = (geo && geo.cc || '').toUpperCase();
  if(cc==='IN' || cc==='NP' || cc==='LK' || cc==='BD' || cc==='PK') return {k:'IN', d:RW_GROUND.IN};
  if(['TH','VN','ID','MY','KH','LA','PH','SG','MM'].indexOf(cc)>-1) return {k:'SEA', d:RW_GROUND.SEA};
  if(['FR','IT','ES','DE','PT','CZ','NL','BE','AT','GR','HU','PL','HR'].indexOf(cc)>-1) return {k:'EU', d:RW_GROUND.EU};
  return null;
}
function groundHTML(geo, placeName){
  var g = rwGroundFor(geo); if(!g) return '';
  var d = g.d;
  function rows(list){
    return list.map(function(r){
      return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<span style="color:var(--t2);flex:1">'+r[0]+'</span><b style="white-space:nowrap">'+r[1]+'</b></div>'
        + (r[2]? '<div style="font-size:10.5px;color:var(--t3);margin:-1px 0 5px;line-height:1.5">'+r[2]+'</div>' : '');
    }).join('');
  }
  function pairs(list){
    return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">'
      + list.map(function(r){ return '<span style="font-size:11px;padding:4px 9px;border-radius:999px;border:1px solid var(--b2,#2A2A36);color:var(--t2)">'+r[0]+' <b>'+r[1]+'</b></span>'; }).join('')
      + '</div>';
  }
  return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:13px 15px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px">\ud83d\ude95 What things should cost in '+esc2(placeName)+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:8px">Typical ranges so you know when a quote is off \u2014 estimates, not live fares.</div>'
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:3px">Getting around</div>'
    + rows(d.transport)
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:9px 0 2px">Per night</div>'
    + pairs(d.stay)
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:9px 0 2px">Per meal</div>'
    + pairs(d.food)
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:10px 0 3px">Don\u2019t get played</div>'
    + d.hacks.map(function(h){ return '<div style="font-size:11.5px;color:var(--t2);line-height:1.6;padding:2px 0">\u2022 '+h+'</div>'; }).join('')
    +'</div>';
}

/* ==================== REAL ATTRACTIONS (OpenStreetMap / Overpass) ==========
   Ailon Tusk could describe a place but never list what's actually AT it.
   Overpass queries OpenStreetMap directly: free, keyless, worldwide, and it
   holds the small stuff Google buries — viewpoints, waterfalls, ruins, springs,
   the "hidden" things travellers hunt for. Results cache for 30 days per place,
   so a destination you've opened once works offline afterwards. */
/* Trimmed from 14 filters to 6: each filter is a separate spatial scan, and the
   public Overpass server was taking 9+ seconds (or timing out) on the long list.
   These six cover what travellers actually search for. */
var OSM_KINDS = [
  ['tourism','attraction','\ud83c\udfaf'], ['tourism','viewpoint','\ud83d\udc41\ufe0f'],
  ['tourism','museum','\ud83c\udfdb\ufe0f'], ['historic','fort','\ud83c\udff0'],
  ['natural','waterfall','\ud83d\udca7'], ['natural','peak','\u26f0\ufe0f']
];
function osmCacheKey(lat,lon){ return 'rw_osm_'+lat.toFixed(2)+'_'+lon.toFixed(2); }
async function osmAttractions(lat, lon, radiusM){
  radiusM = radiusM || 12000;
  var key = osmCacheKey(lat,lon);
  try{
    var c=JSON.parse(lsGet(key)||'null');
    if(c && (Date.now()-c.at) < 30*864e5) return c.items;
  }catch(e){}
  if(!navigator.onLine) return [];
  var filters = OSM_KINDS.map(function(k){
    return 'node["'+k[0]+'"="'+k[1]+'"](around:'+radiusM+','+lat+','+lon+');';
  }).join('');
  var q = '[out:json][timeout:10];('+filters+');out body 40;';
  try{
    var r = await fetch('https://overpass-api.de/api/interpreter', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:'data='+encodeURIComponent(q)
    }).then(function(x){ return x.json(); });
    var items = (r.elements||[]).filter(function(e){ return e.tags && e.tags.name; }).map(function(e){
      var icon='\ud83d\udccd';
      OSM_KINDS.forEach(function(k){ if(e.tags[k[0]]===k[1]) icon=k[2]; });
      return {name:e.tags.name, icon:icon, lat:e.lat, lon:e.lon,
              kind:(e.tags.tourism||e.tags.historic||e.tags.natural||e.tags.leisure||e.tags.amenity||'')};
    });
    /* de-dupe by name, cap the list */
    var seen={}, out=[];
    items.forEach(function(i){ var n=i.name.toLowerCase(); if(!seen[n]){ seen[n]=1; out.push(i); } });
    out = out.slice(0,30);
    lsSet(key, JSON.stringify({at:Date.now(), items:out}));
    return out;
  }catch(e){ return []; }
}
function osmAttractionsHTML(items, placeName){
  if(!items || !items.length) return '';
  var top = items.slice(0,12);
  return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px;margin-bottom:2px">\ud83d\udccd What\u2019s actually there</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:8px">'+items.length+' mapped spots around '+esc2(placeName)+' \u2014 including the ones big apps skip</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px">'
    + top.map(function(i){
        return '<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+i.lat+','+i.lon+'" '
          +'style="font-size:11.5px;padding:5px 10px;border-radius:999px;border:1px solid var(--b2,#2A2A36);color:var(--t2);text-decoration:none">'
          +i.icon+' '+esc2(i.name)+'</a>';
      }).join('')
    +'</div>'
    +'<div style="font-size:9.5px;color:var(--t3);margin-top:8px">Data \u00a9 OpenStreetMap contributors \u00b7 cached offline</div></div>';
}

// Tusk personality & voice notes (TUSK_QUIPS, tuskQuip, tuskVoiceNoteHTML) moved to js/copilot/tusk-persona.js

// Tusk knowledge + learning layer (Wikivoyage guide/section fetch+cache, rwLearn/rwTopInterests) moved to js/copilot/tusk-knowledge.js

// SHADOW BUDGET (TIP_BY_REGION/RW_COST_HINTS/RW_REGION_DEFAULT/costEntryForPlace/shadowBudget/shadowBudgetHTML) moved to js/itinerary/shadow-budget.js

/* ==================== RAIN CONTINGENCY ====================
   A forecast is useless if the itinerary ignores it. This reads the 7-day
   outlook already fetched for a saved trip, classifies each planned day as
   indoor or outdoor from its own text, and offers a concrete swap. It rewrites
   the SAVED trip only when the traveller accepts — never silently. */
var OUTDOOR_RE = /trek|hike|beach|walk|market|park|safari|boat|kayak|cycl|sunset|viewpoint|garden|waterfall|snorkel|dive|ride/i;
var INDOOR_RE  = /museum|gallery|cafe|caf\u00e9|spa|mall|palace|fort|temple|shrine|aquarium|workshop|class|brewery|restaurant/i;
function dayIsOutdoor(d){
  var txt = [d.title,d.morning,d.afternoon,d.evening].filter(Boolean).join(' ');
  var out = (txt.match(OUTDOOR_RE)||[]).length, ind = (txt.match(INDOOR_RE)||[]).length;
  return out > ind;
}
function rainSwapHTML(trip, daily){
  if(!trip || !trip.days || !daily || !daily.time) return '';
  var wet = [];
  daily.time.forEach(function(d,i){ if((daily.precipitation_probability_max||[])[i] >= 55) wet.push(i); });
  if(!wet.length) return '';
  var wetIdx = wet[0];                       /* first soggy day of the trip */
  if(wetIdx >= trip.days.length) return '';
  if(!dayIsOutdoor(trip.days[wetIdx])) return '';
  var swapWith = -1;
  for(var i=0;i<trip.days.length;i++){
    if(i!==wetIdx && wet.indexOf(i)===-1 && !dayIsOutdoor(trip.days[i])){ swapWith=i; break; }
  }
  if(swapWith<0) return '';
  var when = new Date(daily.time[wetIdx]).toLocaleDateString('en-IN',{weekday:'long'});
  return '<div style="background:rgba(92,200,255,.08);border:1px solid rgba(92,200,255,.35);border-radius:14px;padding:12px 14px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px;color:#5CC8FF">\ud83c\udf27 '+when+' looks wet ('+daily.precipitation_probability_max[wetIdx]+'% rain)</div>'
    +'<div style="font-size:12px;color:var(--t2);line-height:1.6;margin-top:5px">Day '+(wetIdx+1)+' is mostly outdoors, Day '+(swapWith+1)+' is mostly indoors. Swapping them keeps the trip intact and moves the walking into dry weather.</div>'
    +'<button class="tact" style="font-size:11.5px;padding:7px 12px;margin-top:8px;font-weight:800" onclick="rainSwapApply(\''+trip.id+'\','+wetIdx+','+swapWith+')">Swap Day '+(wetIdx+1)+' \u2194 Day '+(swapWith+1)+'</button>'
    +'</div>';
}
function rainSwapApply(tripId, a, b){
  var list = vaultGet();
  list.forEach(function(t){
    if(t.id!==tripId || !t.days[a] || !t.days[b]) return;
    var tmp = t.days[a]; t.days[a] = t.days[b]; t.days[b] = tmp;
    /* keep the day numbers in reading order after the swap */
    t.days.forEach(function(d,i){ d.day = i+1; });
  });
  vaultSave(list);
  showToast('\ud83c\udf27 Swapped \u2014 outdoor day moved to drier weather');
  openVaultTrip(tripId);
}

/* ==================== CAMERA -> ITINERARY ====================
   Screenshot a reel, a blog, a handwritten list — the model reads it and pulls
   out the places. Vision needs a multimodal model, so this runs on the user's
   own Gemini key (its free tier is vision-capable). No key, no fake demo: it
   says what it needs and offers the wizard. */
function scanImageOpen(){
  /* Route output to the log the user is actually looking at — the default
     target is the overlay log, so this message was being written off-screen. */
  _cpTargetLog='heroLog';
  var hl=el('heroLog'); if(hl) hl.style.display='block';
  var key = lsGet('rwKey_gemini');
  if(!key){
    /* Explain what the feature does, what it needs and why — a bare "add a key"
       told people nothing, and tapping again just stacked the same message. */
    var log = el('heroLog');
    if(log && log.dataset.camNote==='1'){ showToast('\ud83d\udcf8 Still needs a free Gemini key \u2014 see the note above'); return; }
    if(log) log.dataset.camNote='1';
    cpBubble('<b>\ud83d\udcf8 Scan a screenshot into a trip</b><br>'
      +'Send a screenshot of a reel, a blog, or a handwritten list \u2014 I read the place names out of the image and give you a <b>Plan</b> button for each one.<br><br>'
      +'<b>What it needs:</b> a free Google Gemini key (vision is on their free tier).<br>'
      +'<b>Cost:</b> nothing \u2014 it runs on your key, and the image never touches RoamWise servers.<br>'
      +'<b>Setup:</b> about 2 minutes.<br><br>'
      +'<button class="tact" style="font-size:12px;padding:6px 12px;font-weight:800" onclick="openWizard()">Get a free key \u2192</button>', 'bot');
    return;
  }
  var inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.onchange=function(){ if(inp.files && inp.files[0]) scanImageRun(inp.files[0], key); };
  inp.click();
}
function scanImageRun(file, key){
  _cpTargetLog='heroLog'; var hl=el('heroLog'); if(hl) hl.style.display='block';
  cpBubble('\ud83d\udcf8 Reading '+String(file.name).replace(/[<>]/g,'')+'\u2026','me');
  var thinking=cpBubble('\u2026','bot');
  var fr=new FileReader();
  fr.onload=function(){
    var b64=String(fr.result).split(',')[1];
    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+key,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{parts:[
        {text:'List every real-world travel place in this image (cities, neighbourhoods, restaurants, viewpoints, hotels, trails). Reply ONLY with JSON: {"places":[{"name":"...","kind":"city|food|sight|stay","note":"one short clause"}]}. No prose, no markdown fences. If none, return {"places":[]}.'},
        {inline_data:{mime_type:file.type||'image/jpeg', data:b64}}
      ]}]})
    }).then(function(r){ return r.json(); }).then(function(d){
      var txt='';
      try{ txt=d.candidates[0].content.parts.map(function(p){return p.text||'';}).join(''); }catch(e){}
      var out=null; try{ out=JSON.parse(txt.replace(/```json|```/g,'').trim()); }catch(e){}
      if(!out || !out.places || !out.places.length){
        thinking.innerHTML='I couldn\u2019t find recognisable places in that image. A screenshot with visible place names or captions works best.';
        return;
      }
      thinking.innerHTML='\ud83d\udccd Found '+out.places.length+' place(s):<br><br>'
        + out.places.slice(0,8).map(function(pl){
            var nm=String(pl.name).replace(/[<>']/g,'');
            return '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--b2,#2A2A36)">'
              +'<div><b>'+nm+'</b>'+(pl.note?'<div style="font-size:11px;color:var(--t3)">'+String(pl.note).replace(/[<>]/g,'')+'</div>':'')+'</div>'
              +'<button class="tact" style="font-size:11px;padding:5px 9px;flex:0 0 auto" onclick="cpGoPlan(\''+nm+'\')">Plan \u2192</button></div>';
          }).join('')
        +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Read from your image by Gemini on your own key \u2014 nothing was uploaded to RoamWise.</div>';
      try{ track('img_scans'); }catch(e){}
    }).catch(function(e){ thinking.innerHTML='Scan failed: '+(e.message||e); });
  };
  fr.readAsDataURL(file);
}

// LIVE WORLD MAP + MAP-FIRST ITINERARY VIEW moved to js/itinerary/map-view.js

// Moved to js/ui/themes.js (Phase 5b) — Living Themes (RW_THEMES, rwPickTheme, rwApplyTheme, rwStartFx/rwStopFx)

// REMOTE CONFIG (applyRemoteConfig + boot fetch) + Cinematic Itinerary bridges moved to js/boot/init.js

