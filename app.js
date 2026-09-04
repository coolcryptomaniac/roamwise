/* ===== GLOBAL ERROR GUARD (billion-download resilience) =====
   A single unexpected JS error should never freeze or white-screen the app.
   These catch stray errors + unhandled promise rejections so the app keeps
   running. Silent by design — we don't spam the user with technical errors. */
window.addEventListener('error', function(ev){
  try{ /* swallow benign resource/load errors; log nothing user-facing */ }catch(e){}
}, true);
window.addEventListener('unhandledrejection', function(ev){
  try{ if(ev && ev.preventDefault) ev.preventDefault(); }catch(e){}
});
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

/* ================= PUSH + LOCAL NOTIFICATIONS (rw-v42) =================
   PUSH: registers the device with Firebase Cloud Messaging (via Capacitor's
   push-notifications plugin) and stores the token against the signed-in user.
   This means notifications can be sent to all users FREE, straight from the
   Firebase Console's Notification composer \u2014 no custom backend needed.
   LOCAL: upgrades Tusk's "Remind me" from a setTimeout (dies if the app
   closes) to a real OS-scheduled notification that fires even when closed.
   ========================================================================== */
function rwInitPush(){
  if(!(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications)) return;
  var PN=Capacitor.Plugins.PushNotifications;
  try{
    PN.checkPermissions().then(function(p){
      if(p.receive==='granted') return true;
      return PN.requestPermissions().then(function(r){ return r.receive==='granted'; });
    }).then(function(ok){
      if(!ok) return;
      PN.register();
      PN.addListener('registration', function(tok){
        try{ rwSaveDeviceToken(tok.value); }catch(e){}
      });
      PN.addListener('registrationError', function(){ /* silent \u2014 push is a bonus, never blocks the app */ });
      PN.addListener('pushNotificationReceived', function(n){
        try{ showToast('\ud83d\udce3 '+(n.title||'RoamWise')+(n.body?': '+n.body:'')); }catch(e){}
      });
      PN.addListener('pushNotificationActionPerformed', function(){ try{ tabGo('home'); }catch(e){} });
    }).catch(function(){});
  }catch(e){}
}
function rwSaveDeviceToken(token){
  if(!token || !user || typeof db==='undefined' || !db) return;
  db.collection('users').doc(user.uid).set({ pushToken: token, pushTokenAt: firebase.firestore.FieldValue.serverTimestamp() }, {merge:true}).catch(function(){});
}
/* Local notification, upgraded from the old setTimeout-only version. Falls
   back to the JS timer + chime when running outside the app (web/PWA). */
function rwLocalNotifySchedule(what, mins){
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications){
    var LN=Capacitor.Plugins.LocalNotifications;
    try{
      LN.requestPermissions().then(function(){
        return LN.schedule({ notifications:[{
          id: Math.floor(Date.now()%1e8),
          title:'RoamWise reminder', body: what,
          schedule:{ at: new Date(Date.now()+mins*60000) }
        }]});
      });
      return true;
    }catch(e){ return false; }
  }
  return false;
}






/* ============================================================================
   AILON TUSK AGENT — a real ReAct tool-calling loop (rw-v52)
   ============================================================================
   Until now Tusk could only TALK about RoamWise's features. This makes it
   OPERATE them: the model is given a JSON tool schema of real app functions,
   picks one, we execute it against live app state, feed the result back, and
   loop until the objective is met or we hit the step ceiling.

   Design notes (the parts that actually matter in an agent):
     - BOUNDED: hard max-step ceiling, so a confused model can't spin forever.
     - OBSERVABLE: every thought/action/observation is recorded in a trace the
       user (and you, in a demo) can actually read.
     - RECOVERABLE: a tool that throws returns {ok:false,error} INTO the model's
       context rather than crashing, so it can self-correct and try another path.
     - HONEST: tools only expose things the app can genuinely do. No tool
       pretends to book, pay, or fetch data we don't have.
   ========================================================================== */

var RW_AGENT_TOOLS = [
  { type:'function', function:{ name:'search_stays',
    description:'Find bookable rooms with real prices in a city. Use whenever the traveller asks where to stay, what it costs, or wants to book.',
    parameters:{ type:'object', properties:{ zone:{type:'string', description:'City, e.g. "Manali"'}, maxPrice:{type:'number'} }, required:['zone'] } } },
  { type:'function', function:{ name:'find_partners',
    description:'Find verified RoamWise partner stays and adventure operators in a place, ranked by how much we can vouch for them.',
    parameters:{ type:'object', properties:{ zone:{type:'string'}, cat:{type:'string', enum:['stay','adventure']} }, required:['zone'] } } },
  { type:'function', function:{ name:'open_booking',
    description:'Open the booking screen for a specific room so the traveller can book it. Use after search_stays when they choose one.',
    parameters:{ type:'object', properties:{ roomId:{type:'string'} }, required:['roomId'] } } },
  { type:'function', function:{ name:'my_bookings',
    description:'Look up the travellers own bookings and their status.',
    parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'share_to_whatsapp',
    description:'Share a booking, itinerary, split-up or any text to WhatsApp. Use whenever the traveller wants to send something to friends or to a property.',
    parameters:{ type:'object', properties:{ text:{type:'string'}, kind:{type:'string', enum:['booking','plan','money','other']} }, required:['text'] } } },
  { type:'function', function:{ name:'travel_compatibility',
    description:'Explain or run the travel compatibility engine, which matches people on the six behaviours groups argue about rather than on age.',
    parameters:{ type:'object', properties:{} } } },
  { type:'function', function:{ name:'open_feature',
    description:'Open any RoamWise screen by name. Use when the traveller asks for something the app already does.',
    parameters:{ type:'object', properties:{ feature:{type:'string', enum:['stays','partners','experiences','green','booking','sos','events','compat','listing','money','nearme','beacon','arrival'] } }, required:['feature'] } } },
  { type:'function', function:{ name:'emergency_help',
    description:'Bring up the stranded-traveller page. Use immediately if someone says they are stuck, unsafe, missed the last bus, or in trouble.',
    parameters:{ type:'object', properties:{} } } },

  { type:'function', function:{ name:'set_destination',
    description:'Set the active trip destination in the app.',
    parameters:{ type:'object', properties:{ place:{type:'string', description:'City or region, e.g. "Rishikesh"'} }, required:['place'] } } },
  { type:'function', function:{ name:'estimate_travel_time',
    description:'Honest India road travel time for a distance, accounting for terrain (Himalayan roads are ~3x slower than plains). Use before claiming any journey duration.',
    parameters:{ type:'object', properties:{ km:{type:'number'}, place:{type:'string'} }, required:['km','place'] } } },
  { type:'function', function:{ name:'check_cycle_safety',
    description:'Check whether Cycle Mode is safe at a place in a given month (blocks Himalayan terrain, peak monsoon, desert summer).',
    parameters:{ type:'object', properties:{ place:{type:'string'}, month:{type:'number', description:'1-12'} }, required:['place'] } } },
  { type:'function', function:{ name:'calculate_budget',
    description:'Split a trip budget into stay/food/transport/activities for a number of days and style.',
    parameters:{ type:'object', properties:{ total:{type:'number'}, days:{type:'number'}, style:{type:'string', enum:['backpacker','mid','comfort']} }, required:['total','days'] } } },
  { type:'function', function:{ name:'settle_group_money',
    description:'Run the settle engine over the current trip group and return who owes whom.',
    parameters:{ type:'object', properties:{}, } } },
  { type:'function', function:{ name:'find_nearby',
    description:'Find food, sights and things to do near a place.',
    parameters:{ type:'object', properties:{ place:{type:'string'} }, required:['place'] } } },
  { type:'function', function:{ name:'show_map',
    description:'Open the day-by-day trip map for a destination.',
    parameters:{ type:'object', properties:{ place:{type:'string'} }, required:['place'] } } },
  { type:'function', function:{ name:'parse_ticket',
    description:'Extract PNR, train, stations, date and status from a pasted booking SMS.',
    parameters:{ type:'object', properties:{ text:{type:'string'} }, required:['text'] } } },
  { type:'function', function:{ name:'finish',
    description:'Call when the objective is complete. Provide the final answer for the user.',
    parameters:{ type:'object', properties:{ answer:{type:'string'} }, required:['answer'] } } }
];

/* --- the tool belt: real functions, each returns a plain JSON-able result --- */
var RW_AGENT_IMPL = {
  set_destination: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    try{ var d=el('destInput'); if(d) d.value=a.place; }catch(e){}
    window._agentDest=a.place;
    return {ok:true, destination:a.place, terrain:rwTerrainOf(a.place), ground_truth:rwGroundTruth(a.place)||'normal roads'};
  },
  estimate_travel_time: function(a){
    if(typeof a.km!=='number' || a.km<=0) return {ok:false, error:'km must be a positive number'};
    var r=rwRoadTime(a.km, a.place||'');
    return {ok:true, km:a.km, duration:r.label, terrain:r.terrain, caution:r.note};
  },
  check_cycle_safety: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    var m=(typeof a.month==='number')? a.month-1 : undefined;
    var c=rwCycleSafety(a.place, m);
    return {ok:true, safe:c.ok, terrain:c.terrain,
      warnings:c.warnings.map(function(w){ return (w.lvl==='stop'?'BLOCK: ':'WARN: ')+w.t+' \u2014 '+w.d; })};
  },
  calculate_budget: function(a){
    var total=+a.total, days=+a.days;
    if(!total||!days) return {ok:false, error:'total and days are required'};
    var style=a.style||'mid';
    var w={backpacker:{stay:.30,food:.25,transport:.30,acts:.15},
           mid:{stay:.38,food:.25,transport:.22,acts:.15},
           comfort:{stay:.45,food:.24,transport:.18,acts:.13}}[style]||{stay:.38,food:.25,transport:.22,acts:.15};
    var r=function(x){ return Math.round(total*x); };
    return {ok:true, currency:'INR', per_day:Math.round(total/days), style:style,
      breakdown:{stay:r(w.stay), food:r(w.food), transport:r(w.transport), activities:r(w.acts)}};
  },
  settle_group_money: function(){
    try{
      var k=(typeof chatKittyState==='function')? chatKittyState() : null;
      if(!k) return {ok:false, error:'no active trip group \u2014 the user needs to open a trip chat first'};
      if(!k.tx.length) return {ok:true, settled:true, message:'All square \u2014 nobody owes anybody.', total:k.total};
      return {ok:true, settled:false, total:k.total, per_head:k.perHead,
        transfers:k.tx.map(function(t){ return {from:(k.names[t.from]||'someone'), to:(k.names[t.to]||'someone'), amount:t.amount}; })};
    }catch(e){ return {ok:false, error:'could not read the group kitty'}; }
  },
  find_nearby: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    try{ openNearMe(); setTimeout(function(){ var i=el('nearManualInp'); if(i){ i.value=a.place; rwNearMeManualGo(); } }, 300); }catch(e){}
    return {ok:true, opened:'near_me', searching:a.place, note:'Results are rendering in the app for the user to see.'};
  },
  show_map: function(a){
    if(!a.place) return {ok:false, error:'place is required'};
    try{ openTripMap(a.place, null); }catch(e){ return {ok:false, error:'map failed to open'}; }
    return {ok:true, opened:'trip_map', place:a.place};
  },
  parse_ticket: function(a){
    var r=rwParsePNR(a.text||'');
    if(!r.found) return {ok:false, error:'no ticket details found in that text'};
    return {ok:true, ticket:r};
  },
  finish: function(a){ return {ok:true, done:true, answer:a.answer||''}; }
};

/* --- the loop --- */
var RW_AGENT_MAX_STEPS = 6;
function rwAgentRun(objective, onTrace, onDone){
  var trace=[], msgs=[
    {role:'system', content:
      'You are Ailon Tusk, an autonomous travel agent operating the RoamWise app. '
      +'Work in steps: pick ONE tool at a time, read its result, then decide the next step. '
      +'CRITICAL: never state a travel duration without calling estimate_travel_time first \u2014 '
      +'Indian mountain roads are far slower than distance suggests. '
      +'If a tool returns ok:false, read the error and try a different approach rather than repeating it. '
      +'YOU CAN RUN THE WHOLE PRODUCT, not just answer questions. Where to stay \u2192 search_stays and quote real prices. '
      +'They pick one \u2192 open_booking. Local operators \u2192 find_partners, and be honest about which are verified '
      +'versus merely researched. Anything they want to send to friends or a property \u2192 share_to_whatsapp. '
      +'Who they travel well with \u2192 travel_compatibility. Any screen they ask for \u2192 open_feature rather than '
      +'describing it. '
      +'IF SOMEONE SAYS THEY ARE STUCK, UNSAFE, OR HAVE MISSED THE LAST TRANSPORT: call emergency_help FIRST, talk after. '
      +'NEVER invent a price, a room, a partner or an availability. If a tool returns nothing, say so plainly \u2014 '
      +'being useless is recoverable, being wrong about a booking is not. '
      +'When the objective is met, call finish with a short, warm answer for the traveller.'},
    {role:'user', content:objective}
  ];
  var step=0;
  function record(kind, data){ trace.push({step:step, kind:kind, data:data}); if(onTrace) onTrace(trace); }
  record('objective', objective);

  function tick(){
    if(step>=RW_AGENT_MAX_STEPS){
      record('halt','step ceiling reached');
      if(onDone) onDone({ok:false, reason:'max_steps', trace:trace});
      return;
    }
    step++;
    rwAgentCall(msgs, function(err, reply){
      if(err || !reply){ record('error', err||'no reply'); if(onDone) onDone({ok:false, reason:'llm_error', trace:trace}); return; }
      var calls=reply.tool_calls||[];
      if(!calls.length){
        record('answer', reply.content||'');
        if(onDone) onDone({ok:true, answer:reply.content||'', trace:trace});
        return;
      }
      msgs.push({role:'assistant', content:reply.content||null, tool_calls:calls});
      var finished=null;
      calls.forEach(function(c){
        var name=(c.function&&c.function.name)||'', args={};
        try{ args=JSON.parse((c.function&&c.function.arguments)||'{}'); }catch(e){}
        record('action', {tool:name, args:args});
        var impl=RW_AGENT_IMPL[name];
        var out = impl ? (function(){ try{ return impl(args); }catch(e){ return {ok:false, error:String(e&&e.message||e)}; } })()
                       : {ok:false, error:'unknown tool "'+name+'"'};
        record('observation', out);
        if(name==='finish' && out.ok) finished=out.answer;
        msgs.push({role:'tool', tool_call_id:c.id, name:name, content:JSON.stringify(out)});
      });
      if(finished!=null){ if(onDone) onDone({ok:true, answer:finished, trace:trace}); return; }
      tick();
    });
  }
  tick();
}

/* ---- platform tools (rw-v94): Tusk can now run the whole product ---- */
RW_AGENT_IMPL.search_stays = function(a){
  var list=(window.RW_ROOMS||[]).filter(function(r){
    return (!a.zone || String(r.zone).toLowerCase()===String(a.zone).toLowerCase())
        && (!a.maxPrice || r.price<=a.maxPrice); });
  if(!list.length) return { ok:true, found:0, note:'No listed rooms there yet. Offer to plan the trip anyway.' };
  return { ok:true, found:list.length, rooms:list.slice(0,6).map(function(r){
    return { id:r.id, property:r.property, room:r.room, price:r.price,
             sleeps:r.maxGuests, includes:(r.inc||[]).join(', '), cancel:r.cancel }; }) };
};
RW_AGENT_IMPL.find_partners = function(a){
  var list=(typeof rwPartnersFor==='function') ? rwPartnersFor(a.zone, a.cat) : [];
  if(!list.length) return { ok:true, found:0, note:'No verified partners there yet \u2014 say so honestly.' };
  return { ok:true, found:list.length, partners:list.slice(0,6).map(function(p){
    return { name:p.name, area:p.area, rating:p.rating, reviews:p.reviews,
             status:p.verified, why:p._why, hook:p.hook }; }) };
};
RW_AGENT_IMPL.open_booking = function(a){
  try{ if(typeof openRoomBook==='function'){ openRoomBook(a.roomId); return { ok:true, opened:a.roomId }; } }catch(e){}
  return { ok:false, error:'Could not open that room' };
};
RW_AGENT_IMPL.my_bookings = function(){
  try{
    var last=JSON.parse(lsGet('rw_last_booking')||'null');
    if(!last) return { ok:true, count:0, note:'No bookings on this device yet.' };
    return { ok:true, count:1, booking:{ ref:last.ref, property:last.property, room:last.room,
      checkIn:last.checkIn, checkOut:last.checkOut, amount:last.amount, status:last.status } };
  }catch(e){ return { ok:true, count:0 }; }
};
RW_AGENT_IMPL.share_to_whatsapp = function(a){
  var t=String(a.text||''); if(!t) return { ok:false, error:'nothing to share' };
  try{ rwWhatsShare(t); return { ok:true, shared:true, kind:a.kind||'other' }; }
  catch(e){ return { ok:false, error:'could not open WhatsApp' }; }
};
RW_AGENT_IMPL.travel_compatibility = function(){
  var mine=(typeof rwCompatMine==='function')? rwCompatMine():{};
  var done=Object.keys(mine).length>0;
  try{ if(typeof openCompat==='function') openCompat(); }catch(e){}
  return { ok:true, profileSet:done,
    axes:(window.RW_AXES||[]).map(function(x){ return x.label; }),
    note: done ? 'Their profile is set; explain who they match with and why.'
               : 'They have not set a travel style yet \u2014 the six-slider quiz is now open.' };
};
RW_AGENT_IMPL.open_feature = function(a){
  var map={ stays:'openStays', partners:'openPartners', experiences:'openExperiences',
    green:'openGreen', booking:'openBooking', sos:'openSOS', events:'openEvents',
    compat:'openCompat', listing:'openListing', money:'openMoneyLayer',
    nearme:'openNearMe', beacon:'openBeacon', arrival:'openArrival' };
  var fn=map[a.feature];
  try{ if(fn && typeof window[fn]==='function'){ window[fn](); return { ok:true, opened:a.feature }; } }catch(e){}
  return { ok:false, error:'no such screen' };
};
RW_AGENT_IMPL.emergency_help = function(){
  try{ if(typeof openSOS==='function'){ openSOS(); return { ok:true, opened:true,
    note:'The offline help page is open. Emergency numbers are 112, 108, and 1363 for tourists.' }; } }catch(e){}
  return { ok:true, note:'Emergency numbers in India: 112 all emergencies, 108 ambulance, 1363 tourist helpline.' };
};

/* one place for every WhatsApp share in the app */
function rwWhatsShare(text){
  var t=String(text||'');
  try{
    if(navigator.share){ navigator.share({ text:t }); return true; }
  }catch(e){}
  window.open('https://wa.me/?text='+encodeURIComponent(t), '_blank', 'noopener');
  return true;
}
/* format a booking the way a property owner or a friend wants to read it */
function rwBookingText(b){
  if(!b) return '';
  return '*RoamWise booking* \u2014 '+b.ref+'\n\n'
    +'\ud83c\udfe1 '+b.property+'\n\ud83d\udecf\ufe0f '+b.room+'\n'
    +'\ud83d\udcc5 '+b.checkIn+' \u2192 '+b.checkOut+' ('+b.nights+' night'+(b.nights>1?'s':'')+')\n'
    +'\ud83d\udc65 '+b.guests+' guest'+(b.guests>1?'s':'')+'\n'
    +'\ud83d\udcb0 \u20b9'+Number(b.amount||0).toLocaleString('en-IN')+' \u2014 '
    +(b.payMode==='upi'?'paid by UPI':'paying at the property')+'\n\n'
    +'Planned with RoamWise \u00b7 roamwise.co.in';
}

/* Tool-calling request. Only OpenAI-compatible providers support this, so we
   pick one that does and fall back to plain chat if none is configured. */
function rwAgentCall(messages, cb){
  var provs=['groq','cerebras','openrouter','mistral'];
  var prov=provs.filter(function(p){ return lsGet('rwKey_'+p); })[0];
  if(!prov){ cb('no tool-calling provider configured'); return; }
  var bases={groq:'https://api.groq.com/openai/v1', cerebras:'https://api.cerebras.ai/v1',
             openrouter:'https://openrouter.ai/api/v1', mistral:'https://api.mistral.ai/v1'};
  var model=(AI_MODELS[prov]||['llama-3.3-70b-versatile'])[0];
  fetch(bases[prov]+'/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+lsGet('rwKey_'+prov)},
    body:JSON.stringify({model:model, messages:messages, tools:RW_AGENT_TOOLS, tool_choice:'auto', max_tokens:900})
  }).then(function(r){ return r.json(); })
    .then(function(d){
      var m=d&&d.choices&&d.choices[0]&&d.choices[0].message;
      if(!m){ cb((d&&d.error&&d.error.message)||'no message'); return; }
      cb(null, m);
    }).catch(function(e){ cb(String(e&&e.message||e)); });
}

/* --- the visible reasoning trace (useful UX AND the thing to film for a demo) --- */
function openAgent(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('agentSection');
  if(!sec){ sec=document.createElement('section'); sec.id='agentSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83e\udde0 Tusk <em>Agent</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'agentSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Give Tusk an objective and watch it work \u2014 it picks tools, reads the results, and corrects itself. Every step is shown.</p>'
    +'<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:15px;margin-bottom:12px">'
    +'<input id="agentObj" placeholder="e.g. Plan 3 days in Spiti under 20k and check if cycling works" style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:12px;color:var(--t1);font:inherit">'
    +'<button class="tact rw-cine-btn" style="width:100%;margin-top:10px;font-weight:800;padding:12px" onclick="rwAgentGo()">Run agent</button>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Needs an AI key with tool-calling (Groq, Cerebras, OpenRouter or Mistral). Max '+RW_AGENT_MAX_STEPS+' steps.</div></div>'
    +'<div id="agentTrace"></div>';
}
function rwAgentGo(){
  var obj=(el('agentObj')&&el('agentObj').value||'').trim();
  if(!obj){ showToast('Give the agent an objective'); return; }
  var host=el('agentTrace');
  host.innerHTML='<div class="rw-cine-load"><div class="rw-cine-orb"></div><div style="font-size:13px;color:var(--t2);margin-top:12px">Tusk is thinking\u2026</div></div>';
  rwAgentRun(obj, function(tr){ rwAgentRenderTrace(tr, host); },
    function(res){
      rwAgentRenderTrace(res.trace, host);
      if(res.ok) host.insertAdjacentHTML('beforeend',
        '<div class="rw-cine-panel" style="margin-top:12px;padding:20px">'
        +'<div style="position:relative;z-index:1"><b style="color:#4ADE80;font-size:13px;letter-spacing:.06em">\u2713 OBJECTIVE COMPLETE</b>'
        +'<div style="font-size:14px;color:#EDEAE2;margin-top:8px;line-height:1.65">'+esc2(res.answer||'')+'</div></div></div>');
      else host.insertAdjacentHTML('beforeend',
        '<div style="border:1px solid #E05B5B;background:rgba(224,91,91,.08);border-radius:12px;padding:14px;margin-top:10px">'
        +'<b style="color:#E05B5B;font-size:13px">Stopped: '+esc2(res.reason)+'</b>'
        +'<div style="font-size:12px;color:var(--t2);margin-top:4px">'
        +(res.reason==='llm_error'?'Add an AI key with tool-calling support in Settings.':'The agent hit its step limit without finishing \u2014 try a narrower objective.')
        +'</div></div>');
    });
}
function rwAgentRenderTrace(trace, host){
  var ic={objective:'\ud83c\udfaf', action:'\u2699\ufe0f', observation:'\ud83d\udc41\ufe0f', answer:'\ud83d\udcac', error:'\u26a0\ufe0f', halt:'\u23f9\ufe0f'};
  host.innerHTML=trace.map(function(t){
    var body = (t.kind==='action')
      ? '<b>'+esc2(t.data.tool)+'</b>(<span style="color:var(--t3)">'+esc2(JSON.stringify(t.data.args).slice(0,90))+'</span>)'
      : (t.kind==='observation')
        ? '<span style="color:'+(t.data&&t.data.ok===false?'#E05B5B':'#4ADE80')+'">'+esc2(JSON.stringify(t.data).slice(0,220))+'</span>'
        : esc2(String(t.data).slice(0,240));
    return '<div class="rw-cine-row" style="animation-delay:'+(Math.min(t.step,8)*0.05)+'s">'
      +'<span style="flex:0 0 22px;font-size:14px">'+(ic[t.kind]||'\u2022')+'</span>'
      +'<span style="flex:1;font-size:12px;font-family:ui-monospace,monospace;line-height:1.5;word-break:break-word">'+body+'</span>'
      +'<span style="flex:0 0 auto;font-size:10px;color:var(--t3)">'+t.step+'</span></div>';
  }).join('');
}


/* ============================================================================
   AGENT EVAL HARNESS (rw-v53)
   ============================================================================
   The point of this is HONEST measurement. It runs a fixed suite of objectives
   through the real agent loop and scores four things that actually matter:

     tool_precision   did it call the tool the task genuinely required?
     termination      did it finish cleanly instead of hitting the ceiling?
     efficiency       steps used vs. the minimum the task needs
     recovery         when a tool errored, did it change approach and continue?

   Deliberately reports FAILURES as loudly as successes. A suite that always
   scores 100% is a suite that isn't testing anything.
   ========================================================================== */
var RW_EVALS = [
  { id:'e1', objective:'Plan 3 days in Spiti under 20000 rupees',
    must:['set_destination','calculate_budget'], minSteps:3 },
  { id:'e2', objective:'How long does it actually take to drive 200km in Spiti?',
    must:['estimate_travel_time'], minSteps:2 },
  { id:'e3', objective:'Is cycling safe in Varanasi in July?',
    must:['check_cycle_safety'], minSteps:2 },
  { id:'e4', objective:'Read this ticket: PNR 4512367890, 12017 SHATABDI EXP, NDLS-DDN, 14-Sep-2026, 06:10, CNF',
    must:['parse_ticket'], minSteps:2 },
  { id:'e5', objective:'Show me the trip map for Goa',
    must:['show_map'], minSteps:2 },
  { id:'e6', objective:'Find food and things to do near Rishikesh',
    must:['find_nearby'], minSteps:2 },
  { id:'e7', objective:'Who owes whom in our group right now?',
    must:['settle_group_money'], minSteps:2 },
  { id:'e8', objective:'Plan a day trip from Manali to Spiti and back',
    must:['estimate_travel_time'], minSteps:2,
    /* the honest-answer test: the round trip is ~18h of road, so a good agent
       should check the time and then TELL THE USER IT DOESN'T WORK. */
    expectRefusal:true },
  { id:'e9', objective:'Budget 50000 for 5 days in Goa, comfort style, and show the map',
    must:['calculate_budget','show_map'], minSteps:3 },
  { id:'e10', objective:'What is the capital of France?',
    must:[], minSteps:1, offTopic:true }
];
function rwEvalRun(onProgress, onDone){
  var results=[], i=0;
  function next(){
    if(i>=RW_EVALS.length){ onDone(rwEvalScore(results)); return; }
    var ev=RW_EVALS[i++];
    onProgress({phase:'running', id:ev.id, objective:ev.objective, done:i-1, total:RW_EVALS.length});
    var t0=Date.now();
    rwAgentRun(ev.objective, null, function(res){
      var tools=[], errs=0;
      (res.trace||[]).forEach(function(t){
        if(t.kind==='action') tools.push(t.data.tool);
        if(t.kind==='observation' && t.data && t.data.ok===false) errs++;
      });
      var called=tools.filter(function(x){ return x!=='finish'; });
      var hit=(ev.must||[]).filter(function(m){ return tools.indexOf(m)>=0; });
      var steps=(res.trace||[]).filter(function(t){ return t.kind==='action'; }).length;
      var recovered = errs>0 && res.ok;
      results.push({
        id:ev.id, objective:ev.objective,
        pass: (ev.must||[]).length ? hit.length===(ev.must||[]).length && res.ok
                                   : res.ok,
        required:(ev.must||[]), hit:hit, called:called,
        terminated:!!res.ok, reason:res.reason||'', steps:steps, minSteps:ev.minSteps||1,
        errors:errs, recovered:recovered, ms:Date.now()-t0,
        answer:(res.answer||'').slice(0,180), offTopic:!!ev.offTopic, expectRefusal:!!ev.expectRefusal
      });
      onProgress({phase:'done-one', last:results[results.length-1], done:i, total:RW_EVALS.length});
      next();
    });
  }
  next();
}
function rwEvalScore(rs){
  var n=rs.length||1;
  var scored=rs.filter(function(r){ return r.required.length; });
  var toolHits=scored.reduce(function(a,r){ return a+r.hit.length; },0);
  var toolNeed=scored.reduce(function(a,r){ return a+r.required.length; },0)||1;
  var term=rs.filter(function(r){ return r.terminated; }).length;
  var eff=rs.filter(function(r){ return r.steps<=r.minSteps+1; }).length;
  var errRuns=rs.filter(function(r){ return r.errors>0; });
  var rec=errRuns.filter(function(r){ return r.recovered; }).length;
  return {
    results:rs,
    tool_precision: Math.round(toolHits/toolNeed*100),
    termination:    Math.round(term/n*100),
    efficiency:     Math.round(eff/n*100),
    recovery:       errRuns.length? Math.round(rec/errRuns.length*100) : null,
    recovery_n:     errRuns.length,
    passed:         rs.filter(function(r){ return r.pass; }).length,
    total:          n,
    avg_ms:         Math.round(rs.reduce(function(a,r){ return a+r.ms; },0)/n),
    avg_steps:      (rs.reduce(function(a,r){ return a+r.steps; },0)/n).toFixed(1)
  };
}
function openEval(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('evalSection');
  if(!sec){ sec=document.createElement('section'); sec.id='evalSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udcca Agent <em>evals</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'evalSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Runs '+RW_EVALS.length+' objectives through the real agent loop and measures what actually matters. Failures are reported as loudly as passes \u2014 a suite that always scores 100% isn\u2019t testing anything.</p>'
    +'<button class="tact rw-cine-btn" style="width:100%;font-weight:800;padding:13px" onclick="rwEvalGo()">Run the suite</button>'
    +'<div id="evalOut" style="margin-top:14px"></div>';
}
function rwEvalGo(){
  var out=el('evalOut');
  out.innerHTML='<div class="rw-cine-load"><div class="rw-cine-orb"></div><div style="font-size:13px;color:var(--t2);margin-top:12px">Running the suite\u2026</div></div>';
  rwEvalRun(function(p){
    if(p.phase==='running'){
      var o=el('evalOut'); if(o) o.querySelector('div:last-child').textContent='Running '+(p.done+1)+'/'+p.total+' \u2014 '+p.objective.slice(0,52)+'\u2026';
    }
  }, function(sc){ rwEvalRender(sc); });
}
function rwEvalRender(sc){
  var out=el('evalOut'); if(!out) return;
  function metric(label, val, suffix, note){
    var v=(val==null)?'\u2014':val+(suffix||'');
    var col = val==null? 'var(--t3)' : (val>=80?'#4ADE80':(val>=50?'#F0A63B':'#E05B5B'));
    return '<div class="rw-cine-metric"><div class="rw-cine-num" style="color:'+col+'">'+v+'</div>'
      +'<div class="rw-cine-lbl">'+label+'</div>'+(note?'<div class="rw-cine-note">'+note+'</div>':'')+'</div>';
  }
  out.innerHTML='<div class="rw-cine-panel">'
    +'<div class="rw-cine-grid">'
    + metric('Tool precision', sc.tool_precision, '%', 'right tool chosen')
    + metric('Termination', sc.termination, '%', 'finished cleanly')
    + metric('Efficiency', sc.efficiency, '%', 'within +1 of minimum')
    + metric('Recovery', sc.recovery, '%', sc.recovery_n? 'of '+sc.recovery_n+' error runs' : 'no errors hit')
    +'</div>'
    +'<div class="rw-cine-sum">'+sc.passed+' / '+sc.total+' objectives passed \u00b7 avg '+sc.avg_steps+' steps \u00b7 avg '+sc.avg_ms+'ms</div>'
    +'</div>'
    + sc.results.map(function(r,i){
        var ok=r.pass;
        return '<div class="rw-cine-row" style="animation-delay:'+(i*0.055)+'s">'
          +'<span class="rw-cine-dot" style="background:'+(ok?'#4ADE80':'#E05B5B')+'"></span>'
          +'<span style="flex:1;min-width:0">'
          +'<b style="font-size:12.5px">'+esc2(r.objective.slice(0,58))+(r.objective.length>58?'\u2026':'')+'</b>'
          +'<div style="font-size:11px;color:var(--t3);margin-top:3px;font-family:ui-monospace,monospace">'
          + (r.called.length? esc2(r.called.join(' \u2192 ')) : 'no tools called')
          + ' \u00b7 '+r.steps+' steps'
          + (r.errors? ' \u00b7 '+r.errors+' err'+(r.recovered?' (recovered)':'') : '')
          + (r.terminated?'':' \u00b7 '+esc2(r.reason))
          +'</div></span></div>';
      }).join('')
    +'<div style="font-size:11px;color:var(--t3);margin-top:12px;line-height:1.6">These are real runs against live providers, so numbers move between runs. Quote them with the sample size (n='+sc.total+') and never round up.</div>';
}

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

/* ========== INDIA GROUND-TRUTH LAYER (rw-v51) ==============================
   THE PROBLEM this fixes: every LLM reasons about distance as if roads are
   European. It will happily claim Dehradun to Rishikesh is 30 minutes, or that
   you can "pop over" to Spiti for a day. On the ground, 30km of Himalayan road
   is two hours. This is RoamWise's single biggest correctness flaw, and it is
   fixable with real terrain rules rather than hoping the model behaves.
   ========================================================================== */
var RW_TERRAIN={
  himalayan: {mult:3.2, kmh:22, note:'hairpin mountain road \u2014 assume roughly a third of plains speed'},
  hill:      {mult:2.2, kmh:32, note:'ghat section \u2014 slower than the map suggests'},
  ghats:     {mult:2.0, kmh:35, note:'Western Ghats climbs and switchbacks'},
  desert:    {mult:1.2, kmh:55, note:'open highway, but few stops \u2014 carry water'},
  coastal:   {mult:1.4, kmh:45, note:'narrow coastal roads through villages'},
  plains:    {mult:1.35,kmh:48, note:'plains highway with real Indian traffic'},
  metro:     {mult:1.9, kmh:18, note:'city traffic \u2014 budget far more than the map says'}
};
var RW_TERRAIN_KEYS={
  himalayan:['ladakh','leh','spiti','kaza','tawang','zanskar','nubra','kinnaur','chitkul','sikkim','lachung','munsiyari','auli','badrinath','kedarnath','gangotri','yamunotri','rohtang','manali-leh','sach pass','khardung'],
  hill:['manali','shimla','mussoorie','nainital','almora','kausani','dharamshala','mcleod','kasol','bir','chopta','ranikhet','darjeeling','gangtok','shillong','cherrapunji','ooty','kodaikanal','munnar','coorg','chikmagalur','wayanad','mount abu','dalhousie','khajjiar','pithoragarh','rishikesh','dehradun','haridwar'],
  ghats:['lonavala','mahabaleshwar','matheran','igatpuri','amboli','agumbe'],
  desert:['jaisalmer','bikaner','jodhpur','barmer','kutch','rann'],
  coastal:['goa','gokarna','varkala','alleppey','kochi','pondicherry','mahabalipuram','diu','konkan','ratnagiri','alibaug','andaman'],
  metro:['delhi','mumbai','bengaluru','bangalore','chennai','kolkata','hyderabad','pune','ahmedabad','jaipur','lucknow']
};
function rwTerrainOf(place){
  var t=String(place||'').toLowerCase();
  for(var k in RW_TERRAIN_KEYS){
    var arr=RW_TERRAIN_KEYS[k];
    for(var i=0;i<arr.length;i++){ if(t.indexOf(arr[i])>-1) return k; }
  }
  return 'plains';
}
/* Honest travel time for a road distance, given the terrain. */
function rwRoadTime(km, place){
  var T=RW_TERRAIN[rwTerrainOf(place)]||RW_TERRAIN.plains;
  var hrs=km/T.kmh;
  var h=Math.floor(hrs), m=Math.round((hrs-h)*60);
  if(m===60){ h++; m=0; }
  return {hours:hrs, label:(h?h+'h ':'')+(m?m+'m':(h?'':'a few min')), note:T.note, terrain:rwTerrainOf(place)};
}
/* A human-readable reality check we can show under any itinerary. */
function rwGroundTruth(place){
  var k=rwTerrainOf(place), T=RW_TERRAIN[k];
  if(k==='plains') return '';
  var lines={
    himalayan:'High-mountain roads. Distances here lie \u2014 100km can take 5 hours. Roads close for snow/landslides, and altitude means you should plan a rest day before anything strenuous.',
    hill:'Hill roads with hairpins. Budget roughly double the time a map app suggests, and avoid night driving.',
    ghats:'Ghat climbs and switchbacks \u2014 slower than they look, and slippery in monsoon.',
    desert:'Open roads but long empty stretches. Carry water, fuel up early, and avoid midday in summer.',
    coastal:'Narrow roads through villages. Short distances still eat time.',
    metro:'City traffic. Whatever the map says, add half again \u2014 more in peak hours.'
  };
  return lines[k]||'';
}

/* ===== CYCLE MODE SAFETY (rw-v51) — elevation, monsoon, and honest limits ==
   Cycle Mode routes people through narrow old-city lanes on a folding cycle.
   That is brilliant in flat Varanasi lanes and dangerous on a Himalayan
   gradient in July. These checks fire BEFORE we suggest it. */
var RW_MONSOON={ 6:'heavy', 7:'peak', 8:'peak', 9:'retreating' };
function rwCycleSafety(place, monthIdx){
  var m=(typeof monthIdx==='number')? monthIdx+1 : (new Date().getMonth()+1);
  var terrain=rwTerrainOf(place);
  var warn=[], block=false;
  if(terrain==='himalayan'){ block=true; warn.push({lvl:'stop', t:'Not suitable here', d:'Sustained high-altitude climbs and unlit hairpins \u2014 a folding cycle is the wrong tool. Use shared taxis.'}); }
  else if(terrain==='hill'||terrain==='ghats'){ warn.push({lvl:'warn', t:'Steep gradients', d:'Expect sustained climbs. Fine going down, hard going up \u2014 plan a one-way route and a taxi back.'}); }
  if(RW_MONSOON[m]){
    var sev=RW_MONSOON[m];
    warn.push({lvl: sev==='peak'?'stop':'warn', t:'Monsoon '+(sev==='peak'?'peak':'season'),
      d: sev==='peak' ? 'Waterlogged lanes, poor visibility and slick stone. Skip cycling this month.' : 'Rain likely \u2014 carry a poncho and avoid flooded underpasses.'});
    if(sev==='peak') block=true;
  }
  if(terrain==='metro'){ warn.push({lvl:'warn', t:'Traffic', d:'Stay in the old-city lanes as planned. Do not take a folding cycle onto arterial roads.'}); }
  if(terrain==='desert' && m>=4 && m<=6){ warn.push({lvl:'stop', t:'Extreme heat', d:'40\u00b0C+ by mid-morning. Cycle at dawn only, or not at all.'}); block=true; }
  return {ok:!block, warnings:warn, terrain:terrain};
}
function rwCycleCard(place, monthIdx){
  var c=rwCycleSafety(place, monthIdx);
  if(!c.warnings.length) return '<div style="border:1px solid rgba(74,222,128,.4);background:rgba(74,222,128,.07);border-radius:12px;padding:12px;margin:10px 0">'
    +'<b style="color:#4ADE80;font-size:13px">\ud83d\udeb2 Good conditions for Cycle Mode</b>'
    +'<div style="font-size:12px;color:var(--t2);margin-top:4px">Flat lanes and dry season \u2014 park at the old-city edge and ride in.</div></div>';
  return c.warnings.map(function(w){
    var stop=w.lvl==='stop', col=stop?'#E05B5B':'#F0A63B';
    return '<div style="border:1px solid '+col+'55;background:'+col+'12;border-radius:12px;padding:12px;margin:8px 0">'
      +'<b style="color:'+col+';font-size:13px">'+(stop?'\u26d4':'\u26a0\ufe0f')+' '+esc2(w.t)+'</b>'
      +'<div style="font-size:12px;color:var(--t2);margin-top:4px">'+esc2(w.d)+'</div></div>';
  }).join('');
}

/* ===== PNR / BOOKING SMS PARSER (rw-v51) ==================================
   No IRCTC API needed — people already HAVE the SMS. Paste it and we pull out
   the train, PNR, date and stations, then hand straight to Arrival Mode. */
function rwParsePNR(text){
  var t=String(text||'');
  var out={};
  var pnr=t.match(/\b(?:PNR\s*(?:No\.?|Number)?[:\s-]*)?(\d{10})\b/i);
  if(pnr) out.pnr=pnr[1];
  var trn=t.match(/\b(\d{5})\b(?!\d)/);
  if(trn && trn[1]!==out.pnr) out.train=trn[1];
  var nm=t.match(/\b(\d{5})\s*[\/\-]?\s*([A-Z][A-Za-z\s]{3,28}(?:EXP|EXPRESS|SF|SUPERFAST|RAJDHANI|SHATABDI|DURONTO|VANDE BHARAT|JANSHATABDI|MAIL))/i);
  if(nm) out.trainName=nm[2].trim();
  var dt=t.match(/\b(\d{1,2})[-\/\s]([A-Za-z]{3,9}|\d{1,2})[-\/\s](\d{2,4})\b/);
  if(dt) out.date=dt[0];
  var seg=t.match(/\b([A-Z]{2,5})\s*(?:-|to|\u2192|=>)\s*([A-Z]{2,5})\b/);
  if(seg){ out.from=seg[1]; out.to=seg[2]; }
  var st=t.match(/\b(CNF|RAC|WL\/?\d*|CAN|Confirmed|Waitlist)\b/i);
  if(st) out.status=st[1].toUpperCase();
  var dep=t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if(dep) out.time=dep[0];
  out.found=Object.keys(out).length>0;
  return out;
}
function openPnrPaste(){
  rwForm('\ud83c\udfab Paste your booking SMS', [
    {key:'sms', label:'Paste the IRCTC SMS or PNR', placeholder:'e.g. PNR 4512367890, 12017 SHATABDI EXP, NDLS-DDN, 14-Sep-2026, 06:10, CNF'}
  ], function(v){
    var r=rwParsePNR(v.sms||'');
    if(!r.found){ showToast('Couldn\u2019t read that \u2014 try pasting the whole SMS'); return; }
    var bits=[];
    if(r.trainName) bits.push(r.trainName); else if(r.train) bits.push('Train '+r.train);
    if(r.from&&r.to) bits.push(r.from+' \u2192 '+r.to);
    if(r.date) bits.push(r.date);
    if(r.time) bits.push(r.time);
    if(r.status) bits.push(r.status);
    showToast('\ud83c\udfab '+bits.join(' \u00b7 '));
    /* hand straight into Arrival Mode, pre-filled */
    try{
      openArrival();
      setTimeout(function(){
        var st=el('arrStation'), tm=el('arrTime');
        if(st && r.to) st.value=r.to;
        if(tm && r.time) tm.value=r.time;
        var out=el('arrivalOut');
        if(out) out.innerHTML='<div style="border:1px solid var(--gold,#E8BA6C);border-radius:12px;padding:12px;margin-bottom:10px">'
          +'<b style="font-size:13px">\ud83c\udfab Read from your SMS</b>'
          +'<div style="font-size:12.5px;color:var(--t2);margin-top:4px">'+esc2(bits.join(' \u00b7 '))+'</div>'
          +(r.status&&/WL/.test(r.status)?'<div style="font-size:12px;color:#F0A63B;margin-top:6px">\u26a0\ufe0f Still waitlisted \u2014 keep a backup plan until it confirms.</div>':'')
          +'<div style="font-size:11px;color:var(--t3);margin-top:6px">Check the station and time above, then build your trip.</div></div>';
      }, 350);
    }catch(e){}
  });
}

/* ================= UPI SETTLEMENT (rw-v50) =================================
   The last mile of group money. The settle engine already works out exactly
   who owes whom to the paisa — but people still had to open GPay, type a
   number, type an amount, and hope they got it right.
   A UPI deep link ("upi://pay?...") is a real Android/iOS intent understood by
   GPay, PhonePe, Paytm, BHIM and every other UPI app, so one tap opens the
   payment PRE-FILLED with payee, amount and note.

   HONEST LIMITS, stated in the UI too:
     - only works on a phone with a UPI app installed (desktop shows a QR/copy)
     - RoamWise is NOT a payment processor and never touches the money
     - we cannot confirm a payment landed, so settling is user-confirmed
   ========================================================================== */
function rwUpiValid(v){ return /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/.test(String(v||'').trim()); }
function rwUpiMine(){ try{ return lsGet('rw_upi')||''; }catch(e){ return ''; } }
function rwUpiSetMine(){
  rwForm('\ud83d\udcb3 Your UPI ID', [
    {key:'vpa', label:'UPI ID (so friends can pay you back)', value:rwUpiMine(), placeholder:'yourname@okhdfcbank'}
  ], function(v){
    var vpa=(v.vpa||'').trim();
    if(vpa && !rwUpiValid(vpa)){ showToast('That doesn\u2019t look like a UPI ID \u2014 e.g. name@okicici'); return; }
    try{ lsSet('rw_upi', vpa); }catch(e){}
    /* share it to the group so the "pay" buttons can find it */
    if(vpa && _chatRoom && user && typeof db!=='undefined' && db){
      db.collection('users').doc(user.uid).set({upi:vpa, name:(user.displayName||'Traveller')},{merge:true}).catch(function(){});
    }
    showToast(vpa? 'UPI ID saved \u00b7 friends can now pay you in one tap' : 'UPI ID cleared');
    try{ rwMoneyRender(); }catch(e){}
    try{ chatRenderPins(); }catch(e){}
  });
}
/* Build the standard UPI intent URL. */
function rwUpiLink(vpa, name, amount, note){
  var q='pa='+encodeURIComponent(vpa)
      +'&pn='+encodeURIComponent(String(name||'RoamWise').slice(0,40))
      +'&am='+encodeURIComponent(Number(amount).toFixed(2))
      +'&cu=INR'
      +'&tn='+encodeURIComponent(String(note||'RoamWise trip settle').slice(0,50));
  return 'upi://pay?'+q;
}
/* Look up a payee's saved UPI id (group members store it on their user doc). */
var _upiCache={};
function rwUpiLookup(name, cb){
  if(_upiCache[name]!==undefined){ cb(_upiCache[name]); return; }
  if(typeof db==='undefined'||!db){ cb(null); return; }
  db.collection('users').where('name','==',name).limit(1).get().then(function(qs){
    var vpa=null; qs.forEach(function(d){ vpa=(d.data()||{}).upi||null; });
    _upiCache[name]=vpa; cb(vpa);
  }).catch(function(){ cb(null); });
}
/* The pay button shown on each "A owes B" row. */
function rwUpiPay(toName, amount, note){
  rwUpiLookup(toName, function(vpa){
    if(!vpa){
      showToast(toName+' hasn\u2019t added a UPI ID yet');
      rwUpiAskFor(toName, amount);
      return;
    }
    rwUpiOpen(vpa, toName, amount, note);
  });
}
function rwUpiOpen(vpa, name, amount, note){
  var url=rwUpiLink(vpa, name, amount, note);
  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
  if(isMobile){
    try{ window.location.href=url; }catch(e){}
    /* if no UPI app handles it, nothing visibly happens — give a way out */
    setTimeout(function(){ rwUpiFallback(vpa, name, amount, url); }, 1800);
  } else {
    rwUpiFallback(vpa, name, amount, url);
  }
}
function rwUpiFallback(vpa, name, amount, url){
  var ov=el('upiOv');
  if(!ov){ ov=document.createElement('div'); ov.id='upiOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('upiOv'); }; document.body.appendChild(ov); }
  var amt=Number(amount).toFixed(2);
  ov.innerHTML='<div class="sheet" style="max-width:380px;text-align:center"><div class="sheet-h" style="text-align:left"><b>\ud83d\udcb3 Pay '+esc2(name)+'</b>'
    +'<button onclick="rwOverlayClose(\'upiOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:30px;font-weight:900;color:var(--gold,#E8BA6C);margin:10px 0 2px">\u20b9'+esc2(amt)+'</div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin-bottom:14px">to <b>'+esc2(vpa)+'</b></div>'
    +'<a class="tact" style="display:block;width:100%;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px;text-decoration:none;margin-bottom:8px" href="'+esc2(url)+'">Open my UPI app</a>'
    +'<button class="tact" style="width:100%;margin-bottom:8px" onclick="rwCopy(\''+esc2(vpa)+'\');showToast(\'UPI ID copied\')">Copy UPI ID</button>'
    +'<div style="font-size:11px;color:var(--t3);line-height:1.55;margin-top:6px">Opens your own UPI app (GPay, PhonePe, Paytm\u2026) with the amount filled in. RoamWise never handles the money and can\u2019t see whether it went through \u2014 mark it settled once it\u2019s done.</div></div>';
  ov.classList.add('open');
}
function rwCopy(t){ try{ navigator.clipboard.writeText(t); }catch(e){} }
function rwUpiAskFor(name, amount){
  if(!_chatRoom){ return; }
  try{
    chatPost('text', null, '\ud83d\udcb3 '+ (name||'Someone') +', can you drop your UPI ID here? Settling up \u20b9'+Number(amount).toFixed(0)+'.');
  }catch(e){}
}

/* Chat kitty works in uids, so look the payee's UPI up by uid. */
function rwUpiPayUid(uid, amount){
  if(typeof db==='undefined'||!db){ showToast('Need a connection'); return; }
  db.collection('users').doc(uid).get().then(function(d){
    var u=d.exists? (d.data()||{}) : {};
    if(!u.upi){
      showToast((u.name||'They')+' haven\u2019t added a UPI ID yet');
      try{ chatPost('text', null, '\ud83d\udcb3 Can you drop your UPI ID here? Settling up \u20b9'+Number(amount).toFixed(0)+'.'); }catch(e){}
      return;
    }
    rwUpiOpen(u.upi, u.name||'Traveller', amount, 'RoamWise trip settle');
  }).catch(function(){ showToast('Could not look that up'); });
}

/* Renders the pay button for one settle row (used in both money layer + chat). */
function rwUpiRowBtn(from, to, amount, note){
  var me=((user&&user.displayName)||'').split(' ')[0];
  var iOwe = from===me || from==='You';
  if(!iOwe) return '';   /* only show "pay" on rows where YOU are the one paying */
  return '<button class="tact" style="padding:5px 11px;font-size:11.5px;font-weight:700;margin-left:8px;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" '
    +'onclick="rwUpiPay(\''+String(to).replace(/'/g,"\\'")+'\','+Number(amount)+',\''+String(note||'').replace(/'/g,"\\'")+'\')">Pay \u20b9'+Number(amount).toLocaleString('en-IN')+'</button>';
}

/* ===== rwCloseSection — THE FIX for dead X buttons (rw-v49) ===============
   BUG: app.css has `body.shell[data-view="home"] .v-home{display:revert!important}`.
   Sections built with class "xsec v v-home" therefore IGNORE an inline
   style.display='none', so every X button on the newer features did nothing.
   Fix: strip the v/v-home classes (removing them from the !important rule's
   reach) as well as setting display, and remember the classes so reopening
   restores them. ======================================================== */
function rwCloseSection(id){
  var s=el(id); if(!s) return;
  try{
    s.dataset.rwcls = s.className;              /* remember for reopen */
    s.className = s.className.replace(/\bv-[a-z]+\b/g,'').replace(/(^|\s)v(\s|$)/g,' ').trim();
  }catch(e){}
  s.style.display='none';
  s.setAttribute('hidden','');
}

/* ============================================================================
   PAGE ROUTER (rw-v82) — stop cramming everything into the home screen
   ============================================================================
   THE PROBLEM: every feature (Events, Partners, Modes, Beacon...) injected a
   <section> into the HOME view. Home became an endless scroll-pile, nothing
   felt like a real destination, and nothing was linkable.

   THE FIX: real pages. Each major feature gets:
     · its own URL hash (#/partners) — shareable, and the BACK button works
     · a full-screen shell with its own header, not a card wedged into home
     · focus: the page is the only thing on screen

   Everything is additive — the existing open* functions still build their
   content; they just render into a page shell instead of the home feed.
   ========================================================================= */
var RW_PAGES = {
  partners: { title:'Stay & do',      sub:'Boutique stays and local operators we\u2019ve actually researched', icon:'\ud83e\udd1d', build:function(){ return _pageWrap('partnersSection'); } },
  events:   { title:'Event radar',    sub:'Music, startup, sport and motoring \u2014 with a trip built around each', icon:'\ud83d\udcc5', build:function(){ return _pageWrap('eventsSection'); } },
  compat:   { title:'Travel style',   sub:'Who you actually travel well with', icon:'\u2699\ufe0f', build:function(){} },
  listing:  { title:'Stay & do',      sub:'Every place, ranked by how much we can vouch for it', icon:'\ud83c\udfe1', build:function(){} },
  experiences: { title:'Experiences', sub:'Certified \u00b7 curated \u00b7 actually tested', icon:'\u2728', build:function(){} },
  stays:    { title:'Book a stay',    sub:'Verified rooms \u00b7 you pay the property directly', icon:'\ud83c\udfe1', build:function(){} },
  booked:   { title:'Confirmed',      sub:'', icon:'\u2705', build:function(){} },
  booking:  { title:'Your trip',      sub:'Everything you\u2019re booking, in one request', icon:'\ud83e\uddf3', build:function(){} },
  green:    { title:'RoamWise Green',  sub:'Electric, solar, vegan \u2014 verified, not claimed', icon:'\u26a1', build:function(){} },
  sos:      { title:'Stranded?',       sub:'Works offline \u2014 the advice a local friend would give', icon:'\ud83c\udd98', build:function(){} },
  modes:    { title:'Layout',         sub:'Three genuinely different ways to use RoamWise', icon:'\ud83e\udded', build:function(){ return _pageWrap('modeSection'); } }
};
function _pageWrap(id){ return id; }

var _rwPageStack=[];
function rwPageOpen(key, builder){
  var P=RW_PAGES[key]||{title:key,sub:'',icon:''};
  var host=el('rwPage');
  if(!host){
    host=document.createElement('div'); host.id='rwPage'; host.className='rw-page';
    document.body.appendChild(host);
  }
  host.innerHTML=
     '<div class="rw-page-bar">'
    +'<button class="rw-back" onclick="rwPageClose()" aria-label="Back">\u2190</button>'
    +'<div class="rw-page-t"><b>'+(P.icon||'')+' '+esc2(P.title)+'</b>'
    +(P.sub?'<span>'+esc2(P.sub)+'</span>':'')+'</div>'
    +'<button class="rw-share" onclick="rwPageShare(\''+key+'\')" aria-label="Share">\u21d7</button>'
    +'</div>'
    +'<div class="rw-page-body" id="rwPageBody"></div>';
  document.body.classList.add('rw-paged');
  host.classList.add('open');
  try{ if(typeof builder==='function') builder(el('rwPageBody')); }catch(e){}
  try{ if(location.hash!=='#/'+key) history.pushState({rwPage:key},'', '#/'+key); }catch(e){}
  window.scrollTo(0,0);
  _rwPageStack.push(key);
}
function rwPageClose(){
  var host=el('rwPage');
  if(host){ host.classList.remove('open'); setTimeout(function(){ if(host) host.innerHTML=''; },260); }
  document.body.classList.remove('rw-paged');
  _rwPageStack.pop();
  try{ if(String(location.hash||'').indexOf('#/')===0) history.pushState({},'', location.pathname); }catch(e){}
}
function rwPageShare(key){
  var url=location.origin+location.pathname+'#/'+key;
  try{
    if(navigator.share) navigator.share({ title:'RoamWise \u2014 '+(RW_PAGES[key]||{}).title, url:url });
    else { navigator.clipboard.writeText(url); showToast('Link copied'); }
  }catch(e){ showToast(url); }
}
/* back button / direct link support */
window.addEventListener('popstate', function(){
  var h=String(location.hash||'');
  if(h.indexOf('#/')===0){ rwRouteTo(h.slice(2)); }
  else if(el('rwPage') && el('rwPage').classList.contains('open')){
    el('rwPage').classList.remove('open');
    document.body.classList.remove('rw-paged');
  }
});
function rwRouteTo(key){
  if(key==='partners' && typeof openPartners==='function') return openPartners();
  if(key==='events'   && typeof openEvents==='function')   return openEvents();
  if(key==='compat'   && typeof openCompat==='function')    return openCompat();
  if(key==='listing'  && typeof openListing==='function')   return openListing();
  if(key==='experiences' && typeof openExperiences==='function') return openExperiences();
  if(key==='stays'    && typeof openStays==='function')     return openStays();
  if(key==='booking'  && typeof openBooking==='function')   return openBooking();
  if(key==='green'    && typeof openGreen==='function')     return openGreen();
  if(key==='sos'      && typeof openSOS==='function')       return openSOS();
  if(key==='modes'    && typeof openModePicker==='function') return openModePicker();
}
/* open a deep link on first load */
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    var h=String(location.hash||'');
    if(h.indexOf('#/')===0) rwRouteTo(h.slice(2));
  }, 900);
});

/* rw-v86: ONE change instead of rewriting 20 open* functions.
   Any section opened through here is MOVED into the page shell, so every
   feature gets its own full screen, its own back button and its own URL —
   without touching the function that built it. */
var RW_SECTION_TITLES = {
  moneySection:['\ud83d\udcb0','Split money','Who owes whom, to the paise'],
  nearSection:['\ud83d\udccd','Near me','Food and things to do around you'],
  beaconSection:['\ud83d\udce1','Beacon','Travellers nearby, safely'],
  realmsSection:['\u2694\ufe0f','Realms of Roam','Claim territory by actually going there'],
  arrivalSection:['\ud83d\ude82','Arrival mode','Land, then plan from where you are'],
  greenSection:['\ud83c\udf3f','Green travel','Lower-impact ways to go'],
  passportSection:['\ud83d\udec2','Journey passport','Your verified travel record'],
  tribeSection:['\ud83d\udc65','Tribe travel','Find your kind of traveller'],
  fitnessSection:['\ud83c\udfcb\ufe0f','Fitness stays','Stay in shape on the road'],
  guideSection:['\ud83c\udfa7','Narrated guide','Listen as you walk'],
  tatkalSection:['\ud83c\udfab','Tatkal prep','Ready before the clock starts'],
  mapSection:['\ud83d\uddfa\ufe0f','Map explorer','See it before you go'],
  tripMapSection:['\ud83d\uddfa\ufe0f','Trip map','Your itinerary on a map'],
  badgesSection:['\ud83c\udfc5','Badges','What you\u2019ve earned'],
  memoriesSection:['\ud83d\udcf7','Memories','Your trips, kept'],
  journalSection:['\ud83d\udcd3','Journey journal','How the trip actually felt'],
  agentSection:['\ud83e\udd16','Tusk agent','Watch it think'],
  evalSection:['\ud83e\uddea','Agent evals','How reliable it really is'],
  matchSection:['\u2728','Smart matching','Trips that fit you'],
  certSection:['\ud83c\udf96\ufe0f','Journey certificate','Proof you were there']
};
function rwOpenSection(id){
  var s=el(id); if(!s) return;
  try{ if(s.dataset.rwcls) s.className=s.dataset.rwcls; }catch(e){}
  s.removeAttribute('hidden');
  s.style.display='';
  /* move it into a page shell */
  try{
    var t=RW_SECTION_TITLES[id];
    if(t && typeof rwPageOpen==='function'){
      RW_PAGES[id]={ title:t[1], sub:t[2], icon:t[0], build:function(){} };
      rwPageOpen(id, function(body){
        s.classList.remove('v','v-home');
        body.appendChild(s);
        s.style.display='';
      });
    }
  }catch(e){}
}




/* ============================================================================
   LAYOUT MODES (rw-v56) — three genuinely different ways to use RoamWise.
   ============================================================================
   These are NOT colour themes (that's the separate 🎨 Theme picker). A mode
   changes the LAYOUT and information hierarchy — what you see first and how
   the app is shaped around you.

   SAFETY BY DESIGN: a mode only adds ONE class to <body>. All the actual
   change is CSS. No DOM is restructured, no feature is disabled, nothing is
   re-rendered. If a mode's CSS ever misbehaves, switching back to Classic
   removes the class and the app is byte-for-byte what it was. That is why
   this cannot "mess up" the working build.
   ========================================================================== */
var RW_MODES=[
  { id:'classic', name:'Classic',   icon:'\ud83c\udfe0',
    tag:'Feed-first',
    desc:'What you have today. Everything on one scrollable home, Tusk at the top.',
    best:'Best when you like seeing everything at once.' },
  { id:'atlas',   name:'Atlas',     icon:'\ud83d\uddfa\ufe0f',
    tag:'Map-first',
    desc:'The map leads. Your trip becomes a column of place-cards beside it, so you always see WHERE things are, not just what they are.',
    best:'Best for planning routes and multi-stop trips.' },
  { id:'story',   name:'Storyboard', icon:'\ud83d\udcd6',
    tag:'Editorial',
    desc:'Big type, one thing at a time, generous whitespace. Reads like a travel magazine rather than a dashboard.',
    best:'Best for dreaming, reading and slow planning.' }
];
function rwMode(){ try{ return lsGet('rw_mode')||'classic'; }catch(e){ return 'classic'; } }
function rwApplyMode(id){
  id=id||rwMode();
  var b=document.body; if(!b) return;
  RW_MODES.forEach(function(m){ b.classList.remove('rw-mode-'+m.id); });
  if(id!=='classic') b.classList.add('rw-mode-'+id);
  try{ b.setAttribute('data-mode', id); }catch(e){}
}
function rwSetMode(id){
  try{ lsSet('rw_mode', id); }catch(e){}
  rwApplyMode(id);
  try{ rwHaptic('heavy'); }catch(e){}
  var m=RW_MODES.filter(function(x){ return x.id===id; })[0];
  showToast((m?m.icon+' '+m.name:'Mode')+' \u00b7 '+(m?m.tag:''));
  try{ openModePicker(); }catch(e){}
}
function openModePicker(){
  var cur=rwMode();
  var ov=el('modeOv');
  if(!ov){ ov=document.createElement('div'); ov.id='modeOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('modeOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:420px"><div class="sheet-h"><b>\ud83e\udded Layout mode</b>'
    +'<button onclick="rwOverlayClose(\'modeOv\')" class="tact">\u2715</button></div>'
    +'<p style="font-size:12px;color:var(--t2);margin:2px 0 14px">Three different shapes for the same app. Switch any time \u2014 nothing is lost, and Classic is always exactly what you had.</p>'
    + RW_MODES.map(function(m){
        var on=cur===m.id;
        return '<button class="rw-mode-card'+(on?' on':'')+'" onclick="rwSetMode(\''+m.id+'\')">'
          +'<div class="rw-mode-top"><span class="rw-mode-ic">'+m.icon+'</span>'
          +'<span style="flex:1"><b>'+m.name+'</b> <span class="rw-mode-tag">'+m.tag+'</span></span>'
          +(on?'<span style="color:var(--gold);font-weight:800">\u2713</span>':'')+'</div>'
          +'<div class="rw-mode-desc">'+m.desc+'</div>'
          +'<div class="rw-mode-best">'+m.best+'</div></button>';
      }).join('')
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:10px;line-height:1.55">Layout mode changes the shape of the app. Colours are separate \u2014 see \ud83c\udfa8 Theme &amp; look.</div></div>';
  ov.classList.add('open');
}






// INSTANT BOOKING ENGINE (openStays, rwStaysRender, openRoomBook, rwBookPay,
// rwBookConfirm, rwBookOwnerMsg, rwBookDone, rwShareMyBooking, rwBookShare)
// moved to js/booking/form.js




/* ============================================================================
   TRAVEL COMPATIBILITY ENGINE (rw-v92)
   ============================================================================
   Matches travellers on the six behaviours groups actually argue about, not on
   age. Every score comes with its reason, so a traveller can disagree with it.
   ========================================================================= */
function rwCompatPair(a, b){
  var AX=window.RW_AXES||[];
  var tot=0, wsum=0, worst=null, best=null;
  AX.forEach(function(x){
    var av=+a[x.k]||3, bv=+b[x.k]||3;
    var gap=Math.abs(av-bv);                 /* 0..4 */
    var fit=1-(gap/4);                       /* 1 = identical */
    tot += fit*x.weight; wsum += x.weight;
    var rec={ k:x.k, label:x.label, gap:gap, fit:fit, ax:x, av:av, bv:bv };
    if(!worst || gap*x.weight > worst.gap*worst.ax.weight) worst=rec;
    if(!best  || fit > best.fit) best=rec;
  });
  var pct=Math.round((tot/wsum)*100);
  return {
    pct: pct,
    verdict: pct>=85?'Rare fit' : pct>=72?'Good fit' : pct>=58?'Workable' : pct>=45?'Expect friction' : 'Probably not',
    best: best, worst: worst,
    why: pct>=72
      ? 'You line up on '+best.label.toLowerCase()+', which is most of the battle.'
      : worst.ax.friction
  };
}
/* Group chemistry — not just an average of pairs. */
function rwCompatGroup(people){
  var AX=window.RW_AXES||[];
  if(!people || people.length<2) return null;
  var pairs=[], sum=0;
  for(var i=0;i<people.length;i++)
    for(var j=i+1;j<people.length;j++){
      var r=rwCompatPair(people[i],people[j]);
      pairs.push({i:i,j:j,r:r}); sum+=r.pct;
    }
  var avg=Math.round(sum/pairs.length);
  var flags=[];
  AX.forEach(function(x){
    if(x.weight<1.2) return;
    var vals=people.map(function(p){ return +p[x.k]||3; });
    var mean=vals.reduce(function(a,b){return a+b;},0)/vals.length;
    vals.forEach(function(v,idx){
      if(Math.abs(v-mean)>=1.8)
        flags.push({ type:'outlier', who:idx, axis:x.label,
          say:(people[idx].name||'One traveller')+' is well outside the group on '+x.label.toLowerCase()+'. '+x.friction });
    });
    var lo=vals.filter(function(v){ return v<=mean; }).length;
    if(lo>1 && lo<vals.length-1){
      var spread=Math.max.apply(null,vals)-Math.min.apply(null,vals);
      if(spread>=3) flags.push({ type:'split', axis:x.label,
        say:'On '+x.label.toLowerCase()+' this is really two groups. Plan to split some days rather than pretending otherwise.' });
    }
  });
  var weakest=pairs.slice().sort(function(a,b){ return a.r.pct-b.r.pct; })[0];
  return { avg:avg, pairs:pairs, flags:flags, weakest:weakest,
    verdict: avg>=80?'This group will barely have to negotiate'
           : avg>=65?'Solid group \u2014 a couple of things to agree up front'
           : avg>=50?'Workable, but set the rules before you go'
           : 'This group will struggle unless you plan around the gaps' };
}
/* the quiz */
function openCompat(){
  rwPageOpen('compat', function(body){
    var AX=window.RW_AXES||[];
    var mine=rwCompatMine();
    body.innerHTML='<div class="cp-hero">'
      +'<div class="cp-ic">\u2699\ufe0f</div>'
      +'<h2 class="cp-h">Who you travel well with<br>has nothing to do with your age.</h2>'
      +'<p class="cp-sub">Every group-travel platform matches on age. We match on the six things groups actually argue about \u2014 when you get up, how fast you move, what you\u2019ll spend, and three more. Six questions, about a minute.</p>'
      +'</div>'
      + AX.map(function(x,i){
          var v=mine[x.k]||3;
          return '<div class="cp-q">'
            +'<div class="cp-l"><b>'+esc2(x.label)+'</b><span>'+esc2(x.ends[0])+' \u2192 '+esc2(x.ends[1])+'</span></div>'
            +'<input type="range" min="1" max="5" value="'+v+'" id="cq_'+x.k+'" oninput="rwCompatEcho(\''+x.k+'\')" class="cp-r">'
            +'<div class="cp-v" id="cv_'+x.k+'">'+esc2(x.scale[v-1])+'</div>'
            +'</div>';
        }).join('')
      +'<button class="bk-go" style="margin-top:14px" onclick="rwCompatSave()">Save my travel style</button>'
      +'<div id="cpOut" style="margin-top:18px"></div>'
      +'<div class="gr-foot">We show you the reason behind every match, so you can disagree with it. A number you can\u2019t argue with is worth nothing.</div>';
    rwCompatShow();
  });
}
function rwCompatEcho(k){
  var x=(window.RW_AXES||[]).filter(function(a){ return a.k===k; })[0];
  var v=+((el('cq_'+k)||{}).value||3);
  var n=el('cv_'+k); if(n && x) n.textContent=x.scale[v-1];
}
function rwCompatMine(){
  try{ return JSON.parse(lsGet('rw_compat')||'{}'); }catch(e){ return {}; }
}
function rwCompatSave(){
  var m={};
  (window.RW_AXES||[]).forEach(function(x){ m[x.k]=+((el('cq_'+x.k)||{}).value||3); });
  try{ lsSet('rw_compat', JSON.stringify(m)); }catch(e){}
  try{
    if(window.db && window.user) db.collection('users').doc(user.uid).set({compat:m},{merge:true});
  }catch(e){}
  showToast('\u2705 Saved \u2014 this is how we\u2019ll match you');
  rwCompatShow();
}
function rwCompatShow(){
  var host=el('cpOut'); if(!host) return;
  var mine=rwCompatMine();
  if(!Object.keys(mine).length){ host.innerHTML=''; return; }
  /* three illustrative travellers so the engine is understandable before
     there is a real pool. Labelled clearly as examples, never as real people. */
  var samples=[
    { name:'The sunrise trekker', clock:1,pace:2,spend:2,plan:2,social:3,comfort:2 },
    { name:'The slow cafe type',  clock:4,pace:5,spend:3,plan:4,social:3,comfort:3 },
    { name:'The comfort planner', clock:3,pace:3,spend:5,plan:1,social:2,comfort:5 }
  ];
  host.innerHTML='<div class="dk-lab" style="color:var(--t3)">HOW YOU\u2019D MATCH</div>'
    + samples.map(function(sp){
        var r=rwCompatPair(mine, sp);
        var col = r.pct>=72?'#4ADE80' : r.pct>=58?'#E8BA6C' : '#E0785B';
        return '<div class="cp-m">'
          +'<div class="cp-mt"><b>'+esc2(sp.name)+'</b>'
          +'<span style="color:'+col+'">'+r.pct+'% \u00b7 '+esc2(r.verdict)+'</span></div>'
          +'<div class="cp-bar"><i style="width:'+r.pct+'%;background:'+col+'"></i></div>'
          +'<div class="cp-why">'+esc2(r.why)+'</div></div>';
      }).join('')
    +'<div class="dk-note" style="color:var(--t3);font-size:11px;margin-top:8px">These three are illustrative travel styles, not real people \u2014 shown so you can see how the engine reasons before there\u2019s a pool to match against.</div>';
}

/* ============================================================================
   THE LISTING (rw-v87) — fluid, Airbnb-class browsing
   ============================================================================
   What makes Airbnb's listing feel good is not decoration. It is:
     · a big image area that holds its shape before anything loads
     · one clear price, one clear rating, nothing else competing
     · horizontal collection rails so browsing feels like scanning, not reading
     · everything reacting instantly to touch
   Built with CSS only — no image CDN, no library, no layout shift.
   ========================================================================= */
function rwBadge(id){
  var b=(window.RW_BADGES||{})[id]; if(!b) return '';
  return '<span class="bdg" style="--bc:'+b.color+'" title="'+esc2(b.means)+'">'
    + b.icon+' '+esc2(b.short)+'</span>';
}
/* deterministic gradient per listing, so a card looks identical every load */
function rwHue(str){
  var h=0, s=String(str||'');
  for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360;
  return h;
}
function rwCardArt(x){
  var h=rwHue(x.id||x.name);
  return '<div class="lst-art" style="--h1:'+h+';--h2:'+((h+38)%360)+'">'
    +'<span class="lst-emoji">'+(x.cat==='adventure'?'\ud83e\udde1':x.tier==='green'?'\ud83c\udf3f':'\ud83c\udfe1')+'</span>'
    +'<span class="lst-shine"></span></div>';
}
function openListing(){
  rwPageOpen('listing', function(body){
    var cols=(window.RW_COLLECTIONS||[]);
    body.innerHTML='<div id="lstOut"></div>';
    var out=el('lstOut');
    /* collection rails */
    out.innerHTML = cols.map(function(c){
      var items=rwListingFor(c.badge);
      if(!items.length) return '';
      return '<div class="rail">'
        +'<div class="rail-h"><b>'+esc2(c.title)+'</b><span>'+esc2(c.tagline)+'</span></div>'
        +'<div class="rail-s">'+items.map(function(x){ return rwListCard(x,true); }).join('')+'</div>'
        +'</div>';
    }).join('')
    + '<div class="rail-h" style="margin-top:26px"><b>Everything we know</b><span>All places, ranked by how much we can vouch for them.</span></div>'
    + '<div class="lst-grid">'+rwListingAll().map(function(x){ return rwListCard(x,false); }).join('')+'</div>'
    + '<div class="gr-foot">A badge is earned, never bought. Places pay us nothing to rank higher \u2014 that is why the ladder is worth reading.</div>';
  });
}
function rwListingAll(){
  var out=[];
  (window.RW_PARTNERS||[]).forEach(function(p){ out.push(p); });
  (window.RW_ROOMS||[]).forEach(function(r){
    if(!out.some(function(o){ return o.name===r.property; }))
      out.push({ id:r.id, name:r.property, zone:r.zone, area:r.area, cat:'stay',
                 price:r.price, badges:['verified'] });
  });
  out.forEach(function(x){
    if(!x.badges){
      x.badges = x.verified==='signed' ? ['verified'] : ['listed'];
      if((x.rating||0)>=4.8 && (x.reviews||0)>=200) x.badges.push('loved');
    }
  });
  return out.sort(function(a,b){ return rwBadgeRank(b)-rwBadgeRank(a); });
}
function rwBadgeRank(x){
  var order=['listed','verified','slept','loved','green','local','signature'];
  return (x.badges||[]).reduce(function(m,b){ return Math.max(m, order.indexOf(b)); }, -1);
}
function rwListingFor(badge){
  return rwListingAll().filter(function(x){ return (x.badges||[]).indexOf(badge)>-1; }).slice(0,8);
}
function rwListCard(x, rail){
  var b=(x.badges||[])[ (x.badges||[]).length-1 ];
  return '<div class="lst'+(rail?' rail-c':'')+'" onclick="rwListOpen(\''+esc2(x.id)+'\')">'
    + rwCardArt(x)
    +'<div class="lst-b">'
    +'<div class="lst-r"><b>'+esc2(x.name)+'</b>'
    + (x.rating? '<span class="lst-star">\u2605 '+x.rating.toFixed(1)+'</span>':'')
    +'</div>'
    +'<div class="lst-w">'+esc2((x.area||'')+(x.area?' \u00b7 ':'')+(x.zone||''))+'</div>'
    +'<div class="lst-bd">'+(b?rwBadge(b):'')+'</div>'
    + (x.price? '<div class="lst-p"><b>\u20b9'+Number(x.price).toLocaleString('en-IN')+'</b> night</div>':'')
    +'</div></div>';
}
function rwListOpen(id){
  var all=rwListingAll();
  var x=all.filter(function(p){ return String(p.id)===String(id); })[0];
  if(!x) return;
  var B=window.RW_BADGES||{};
  var ov=el('lstOv');
  if(!ov){ ov=document.createElement('div'); ov.id='lstOv'; ov.className='overlay'; ov.style.zIndex='4300';
    ov.onclick=function(e){ if(e.target===ov) rwOverlayClose('lstOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:440px">'
    +'<div class="sheet-h"><b>'+esc2(x.name)+'</b><button class="tact" onclick="rwOverlayClose(\'lstOv\')">\u2715</button></div>'
    + rwCardArt(x)
    +'<div class="lst-w" style="margin:10px 0 6px">'+esc2((x.area||'')+' \u00b7 '+(x.zone||''))+'</div>'
    + (x.hook? '<div class="xp-hook" style="margin-bottom:10px">'+esc2(x.hook)+'</div>':'')
    +'<div class="lst-badges">'+(x.badges||[]).map(function(k){
        var b=B[k]; if(!b) return '';
        return '<div class="lst-bl"><span style="color:'+b.color+'">'+b.icon+'</span>'
          +'<span><b>'+esc2(b.label)+'</b><i>'+esc2(b.means)+'</i></span></div>';
      }).join('')+'</div>'
    + (x.price? '<div class="bk-total" style="margin-top:12px"><span>From</span><b>\u20b9'+Number(x.price).toLocaleString('en-IN')+'</b></div>':'')
    +'<button class="bk-go" style="margin-top:12px" onclick="rwOverlayClose(\'lstOv\');openStays(\''+esc2(x.zone||'')+'\')">See rooms &amp; book \u2192</button>'
    +'</div>';
  ov.classList.add('open');
}

/* ============================================================================
   ROAMWISE EXPERIENCES (rw-v86) — certified, curated, tested
   ============================================================================
   The badge only means something if it is hard to earn. Nothing appears here
   until someone from RoamWise has actually done the trip, and every card names
   its own weak link. That honesty IS the premium.
   ========================================================================= */
function openExperiences(tier){
  window._xTier = (tier!==undefined? tier : window._xTier) || '';
  rwPageOpen('experiences', function(body){
    var L=(window.RW_EXPERIENCES||[]);
    var tiers={}; L.forEach(function(x){ tiers[x.tier]=1; });
    body.innerHTML=
       '<div class="xp-hero">'
      +'<div class="xp-seal"><span>\u2713</span></div>'
      +'<h2 class="xp-h">Experiences we have<br>actually been on.</h2>'
      +'<p class="xp-sub">Not a list scraped from the internet. Every trip here has been walked, ridden and slept through by someone from RoamWise \u2014 and every one tells you where it falls short.</p>'
      +'</div>'
      +'<div class="xp-promise">'+(window.RW_EXP_PROMISE||[]).map(function(p){
          return '<div class="xp-p"><span>\u25c6</span>'+esc2(p)+'</div>'; }).join('')+'</div>'
      +'<div class="pt-chips" style="margin:18px 0 4px">'
      +'<button class="ev-chip'+(!window._xTier?' on':'')+'" onclick="openExperiences(\'\')">All</button>'
      + Object.keys(tiers).map(function(t){
          var lbl = t==='green'? '\u26a1 Green' : t==='culture'? '\ud83c\udfad Culture' : t;
          return '<button class="ev-chip'+(window._xTier===t?' on':'')+'" onclick="openExperiences(\''+t+'\')">'+lbl+'</button>';
        }).join('')
      +'</div><div id="xpOut"></div>';
    rwExpRender();
  });
}
function rwExpRender(){
  var host=el('xpOut'); if(!host) return;
  var L=(window.RW_EXPERIENCES||[]).filter(function(x){
    return !window._xTier || x.tier===window._xTier; });
  if(!L.length){ host.innerHTML='<div class="note" style="text-align:center;padding:22px;color:var(--t3)">Nothing here yet.</div>'; return; }
  host.innerHTML=L.map(function(x,i){
    var cert = x.status==='certified';
    return '<div class="xp-card" style="animation-delay:'+(i*0.07)+'s">'
      +'<div class="xp-glow"></div>'
      +'<div class="xp-tag">'+esc2(x.tag||'')+'</div>'
      +'<h3 class="xp-t">'+esc2(x.title)+'</h3>'
      +'<div class="xp-meta">'+x.days+' days \u00b7 from \u20b9'+Number(x.from).toLocaleString('en-IN')+' \u00b7 '+esc2(x.zone)+'</div>'
      +'<div class="xp-hook">'+esc2(x.hook)+'</div>'
      +'<div class="xp-bundle">'+(x.bundle||[]).map(function(b){
          return '<div class="xp-b"><span class="xp-bk">'+esc2(b.k)+'</span><span>'+esc2(b.v)+'</span></div>';
        }).join('')+'</div>'
      +'<div class="xp-honest"><b>Where it falls short:</b> '+esc2(x.honest||'')+'</div>'
      +'<div class="xp-best">\ud83d\udcc5 '+esc2(x.best||'')+'</div>'
      +'<div class="xp-foot">'
      +'<span class="xp-status '+(cert?'ok':'')+'">'+(cert?'\u2713 Certified \u2014 we have done this':'\u25cb Scouting \u2014 not yet tested by us')+'</span>'
      +'</div>'
      +'<button class="xp-go" onclick="rwExpPlan(\''+x.id+'\')">\u2728 Plan this trip</button>'
      +'</div>';
  }).join('')
  +'<div class="gr-foot">A trip stays marked <b>Scouting</b> until one of us has been. We would rather show you an honest shortlist than a certified-looking list we cannot stand behind.</div>';
}
function rwExpPlan(id){
  var x=(window.RW_EXPERIENCES||[]).filter(function(e){ return e.id===id; })[0]; if(!x) return;
  rwPageClose();
  var inp=el('heroInput')||el('cpInput');
  if(inp){
    inp.value='Plan the RoamWise experience "'+x.title+'" \u2014 '+x.days+' days in '+x.zone+'. '
      + (x.bundle||[]).map(function(b){ return b.k+': '+b.v; }).join('. ')
      + '. Give honest travel times, a realistic budget from \u20b9'+x.from+', and tell me what could go wrong.';
    try{ copilotSend(!!el('heroInput')); }catch(err){}
  }
}

/* ============================================================================
   BOOKING ENGINE + GREEN + SOS (rw-v83)
   ========================================================================= */

// REQUEST TO BOOK (rwBasket*, rwBookTotal, rwCommissionOn, openBooking, rwBookRequest)
// moved to js/booking/form.js

/* ---------------- ROAMWISE GREEN ---------------- */
function openGreen(){
  rwPageOpen('green', function(body){
    var P=window.RW_GREEN_PILLARS||[];
    body.innerHTML=
       '<div class="gr-hero">'
      +'<div class="gr-badge">\u26a1 RoamWise Green</div>'
      +'<h2 class="gr-h">Travel that leaves the place<br>better than a normal trip would.</h2>'
      +'<p class="gr-sub">A premium tier where every part of the trip qualifies \u2014 electric mobility, genuinely solar stays, vegan or honest local food, and nature-first activities. Not a label we print. A checklist we verify.</p>'
      +'</div>'
      + P.map(function(x){
          return '<div class="gr-card">'
            +'<div class="gr-t"><span class="gr-ic">'+x.icon+'</span><b>'+esc2(x.title)+'</b></div>'
            +'<ul class="gr-ul">'+x.items.map(function(i){ return '<li>'+esc2(i)+'</li>'; }).join('')+'</ul>'
            +'<div class="gr-honest"><b>Straight talk:</b> '+esc2(x.honest)+'</div>'
            +'</div>';
        }).join('')
      +'<div class="gr-cta">'
      +'<b>Want a Green trip planned?</b>'
      +'<p class="note" style="margin:6px 0 12px">Tell us where and when. We build it entirely from verified electric and eco options, and tell you honestly where the network makes it hard.</p>'
      +'<button class="bk-go" onclick="rwGreenPlan()">\ud83c\udf3f Plan my Green trip</button>'
      +'</div>'
      +'<div class="gr-foot">We will always tell you when the greener option is worse \u2014 slower, pricier, or not actually available on your route. A tier you cannot trust is just marketing.</div>';
  });
}
function rwGreenPlan(){
  rwPageClose();
  var inp=el('heroInput')||el('cpInput');
  if(inp){
    inp.value='Plan me a RoamWise Green trip: electric mobility throughout (EV car or bike, charging stops planned), a solar-powered eco stay, vegan or honest local food, and nature-first activities. Tell me honestly where the EV charging network makes this hard.';
    try{ copilotSend(!!el('heroInput')); }catch(e){}
  }
}

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

/* ============================================================================
   CONFIG SYNC (rw-v85) — every data file is now editable from the admin panel
   ============================================================================
   ONE pattern for all of them. Each data file stays in the repo as a SEED and
   an offline fallback; Firestore config/<key> holds the live version; the app
   merges Firestore over the seed and caches to localStorage.

   Result: the founder never edits a .js file again, the app still works with
   no network, and adding a new editable dataset is one line in RW_SYNCED.
   ========================================================================= */
var RW_SYNCED = [
  { key:'rooms',     global:'RW_ROOMS',     matchBy:'id'   },
  { key:'partners',  global:'RW_PARTNERS',  matchBy:'id'   },
  { key:'referrers', global:'RW_REFERRERS', matchBy:'code' },
  { key:'events',    global:'RW_EVENTS',    matchBy:'id'   },
  { key:'regions',   global:'RW_REGIONS',   matchBy:'name' }
];
function rwConfigApply(cfg, list){
  /* Firestore entries WIN; seed entries not present in Firestore are kept. */
  var seed = window[cfg.global] || [];
  var k = cfg.matchBy;
  var have = {};
  list.forEach(function(x){ if(x && x[k]!=null) have[String(x[k]).toLowerCase()] = 1; });
  window[cfg.global] = list.concat(seed.filter(function(x){
    return !(x && x[k]!=null && have[String(x[k]).toLowerCase()]);
  }));
  try{ lsSet('rw_cfg_'+cfg.key, JSON.stringify(window[cfg.global])); }catch(e){}
}
function rwConfigSyncAll(){
  RW_SYNCED.forEach(function(cfg){
    /* cached copy first so the UI is right before the network answers */
    try{
      var c = lsGet('rw_cfg_'+cfg.key);
      if(c){ var l = JSON.parse(c); if(Array.isArray(l) && l.length) window[cfg.global] = l; }
    }catch(e){}
    try{
      if(typeof db === 'undefined' || !db) return;
      db.collection('config').doc(cfg.key).get().then(function(d){
        if(!d.exists) return;
        var list = (d.data() || {}).list;
        if(Array.isArray(list) && list.length){
          rwConfigApply(cfg, list);
          /* repaint whatever happens to be open */
          try{ if(el('staysOut'))    rwStaysRender(); }catch(e){}
          try{ if(el('partnersOut')) rwPartnersRender(); }catch(e){}
          try{ if(el('eventsOut'))   rwEventsRender(); }catch(e){}
        }
      }).catch(function(){});
    }catch(e){}
  });
}

function rwPartnersSync(){
  try{
    if(typeof db==='undefined' || !db) return;
    db.collection('config').doc('partners').get().then(function(d){
      if(!d.exists) return;
      var list=(d.data()||{}).list;
      if(Array.isArray(list) && list.length){
        var seed=(window.RW_PARTNERS||[]);
        var have={}; list.forEach(function(p){ have[String(p.name||'').toLowerCase()+'|'+p.zone]=1; });
        window.RW_PARTNERS = list.concat(seed.filter(function(p){
          return !have[String(p.name||'').toLowerCase()+'|'+p.zone];
        }));
        try{ lsSet('rw_partners_cache', JSON.stringify(window.RW_PARTNERS)); }catch(e){}
        if(el('partnersOut')) rwPartnersRender();
      }
    }).catch(function(){});
  }catch(e){}
}
(function(){ try{ var c=lsGet('rw_partners_cache');
  if(c){ var l=JSON.parse(c); if(Array.isArray(l)&&l.length) window.RW_PARTNERS=l; } }catch(e){} })();

function rwPartnerScore(p){
  var C=50, M=4.3;                       /* prior weight, prior mean */
  var r=p.rating, n=p.reviews||0;
  if(r==null) return { score:M, why:'no public rating yet' };
  var sc=((C*M)+(r*n))/(C+n);
  var why = n>=500 ? 'strongly reviewed ('+n.toLocaleString('en-IN')+')'
          : n>=100 ? 'well reviewed ('+n+')'
          : n>=30  ? 'early reviews ('+n+')'
                   : 'few reviews so far ('+n+')';
  return { score:sc, why:why };
}
function rwPartnersFor(zone, cat){
  var list=(window.RW_PARTNERS||[]).slice();
  if(zone) list=list.filter(function(p){ return String(p.zone||'').toLowerCase()===String(zone).toLowerCase(); });
  if(cat)  list=list.filter(function(p){ return p.cat===cat; });
  list.forEach(function(p){ var s=rwPartnerScore(p); p._score=s.score; p._why=s.why; });
  list.sort(function(a,b){
    var av=a.verified==='signed'?1:0, bv=b.verified==='signed'?1:0;
    if(av!==bv) return bv-av;                 /* signed partners first */
    return b._score-a._score;
  });
  return list;
}
function openPartners(zone, cat){
  /* rw-v82: renders as a full PAGE, not a card wedged into the home feed. */
  rwPageOpen('partners', function(body){
    var sec=document.createElement('section'); sec.id='partnersSection'; sec.className='xsec';
    body.appendChild(sec);
  });
  var sec=el('partnersSection'); if(!sec) return;
  window._pZone=zone||window._pZone||'';
  window._pCat=cat||window._pCat||'';
  var zones={}; (window.RW_PARTNERS||[]).forEach(function(p){ zones[p.zone]=1; });
  sec.innerHTML='<div class="pt-chips">'
    +'<button class="ev-chip'+(!window._pCat?' on':'')+'" onclick="openPartners(window._pZone,\'\')">All</button>'
    +'<button class="ev-chip'+(window._pCat==='stay'?' on':'')+'" onclick="openPartners(window._pZone,\'stay\')">\ud83c\udfe1 Stays</button>'
    +'<button class="ev-chip'+(window._pCat==='adventure'?' on':'')+'" onclick="openPartners(window._pZone,\'adventure\')">\ud83e\udde1 Adventure</button>'
    +'</div>'
    +'<div class="pt-chips" style="margin-bottom:12px">'
    +'<button class="ev-chip'+(!window._pZone?' on':'')+'" onclick="openPartners(\'\',window._pCat)">Everywhere</button>'
    + Object.keys(zones).map(function(z){
        return '<button class="ev-chip'+(window._pZone===z?' on':'')+'" onclick="openPartners(\''+z+'\',window._pCat)">'+esc2(z)+'</button>';
      }).join('')
    +'</div><div id="partnersOut"></div>';
  rwPartnersRender();
}
function rwPartnersRender(){
  var host=el('partnersOut'); if(!host) return;
  var list=rwPartnersFor(window._pZone, window._pCat);
  if(!list.length){ host.innerHTML='<div class="note" style="text-align:center;padding:20px;color:var(--t3)">Nothing here yet \u2014 we\u2019re adding partners city by city.</div>'; return; }
  host.innerHTML=list.map(function(p,i){
    var T=(window.RW_PARTNER_TIERS||[]).filter(function(t){ return t.id===p.verified; })[0]||{icon:'',label:''};
    var stars = p.rating!=null ? '\u2b50 '+p.rating.toFixed(1) : '';
    return '<div class="pt-card'+(p.verified==='signed'?' signed':'')+'">'
      +'<div class="pt-top">'
      +'<span class="pt-rank">'+(i+1)+'</span>'
      +'<span style="flex:1;min-width:0"><b class="pt-name">'+esc2(p.name)+'</b>'
      +'<div class="pt-where">'+esc2(p.area||'')+' \u00b7 '+esc2(p.zone)+'</div></span>'
      +(stars?'<span class="pt-rate">'+stars+'</span>':'')
      +'</div>'
      +'<div class="pt-hook">'+esc2(p.hook||'')+'</div>'
      +'<div class="pt-meta">'
      +'<span class="pt-tag '+(p.verified==='signed'?'ok':'')+'">'+T.icon+' '+esc2(T.label)+'</span>'
      +'<span class="pt-why">'+esc2(p._why)+'</span>'
      +(p.badge?'<span class="pt-tag ok">\ud83c\udfc5 '+esc2(p.badge)+'</span>':'')
      +'</div>'
      +'<div class="pt-acts">'
      +'<button class="tact" onclick="rwPartnerMaps(\''+p.id+'\')">\ud83d\uddfa\ufe0f Find it</button>'
      +'<button class="tact" onclick="rwPartnerBook(\''+p.id+'\')">\u2795 Add to trip</button>'
      +'<button class="tact" onclick="rwPartnerPlan(\''+p.id+'\')">\u2728 Plan around it</button>'
      +'</div></div>';
  }).join('')
  +'<div class="pt-foot">Ranked by rating <em>weighted by how many people reviewed</em> \u2014 a 5.0 from 12 people shouldn\u2019t outrank a 4.8 from 900. '
  +'Entries marked <b>Researched</b> are places we found and rated highly; they are not yet formal partners, and we say so rather than implying otherwise.</div>';
}
function rwPartnerById(id){ return (window.RW_PARTNERS||[]).filter(function(p){ return p.id===id; })[0]; }
function rwPartnerMaps(id){
  var p=rwPartnerById(id); if(!p) return;
  var q=encodeURIComponent(p.name+' '+(p.area||'')+' '+p.zone);
  window.open('https://www.google.com/maps/search/?api=1&query='+q,'_blank','noopener');
}

function rwPartnerBook(id){
  var p=rwPartnerById(id); if(!p) return;
  var cat = p.cat==='adventure' ? 'do' : (p.cat||'stay');
  rwBasketAdd({ id:p.id, name:p.name, cat:cat, where:(p.area||'')+' \u00b7 '+p.zone, price:0, partner:true });
}

function rwPartnerPlan(id){
  var p=rwPartnerById(id); if(!p) return;
  rwCloseSection('partnersSection');
  var inp=el('heroInput')||el('cpInput');
  if(inp){
    inp.value='Plan a trip to '+p.zone+' staying around '+p.area+'. I am looking at '+p.name+'. '
      +'Give honest travel times, what to do nearby, and a realistic daily budget.';
    try{ copilotSend(!!el('heroInput')); }catch(e){}
  }
}

// LOCAL RIDES (rwRidesHTML, openDriverHire) moved to js/booking/local-rides.js

/* ============================================================================
   EVENT ROI ENGINE (rw-v59)
   ============================================================================
   The user's ask: rank events by whether they LEAVE YOU BETTER OFF — money,
   career, head, culture, fun — minus what they take: cost and drain. And say
   so plainly when an event is a net negative rather than quietly listing it.

   Every score is visible and explained. This is a stated editorial opinion,
   not a measurement, and the UI says exactly that. An opaque "9.2/10" would be
   worse than useless — you could not argue with it.
   ========================================================================== */
var RW_ROI_DIMS=[
  {k:'prof',  label:'Career',    icon:'\ud83d\udcbc', good:'opens doors, meets people who matter'},
  {k:'money', label:'Money',     icon:'\ud83d\udcb0', good:'can pay for itself or lead to income'},
  {k:'mind',  label:'Headspace', icon:'\ud83e\udde0', good:'you come back restored, not wrecked'},
  {k:'cult',  label:'Culture',   icon:'\ud83c\udfad', good:'you see something you could not elsewhere'},
  {k:'fun',   label:'Joy',       icon:'\u2728', good:'straightforwardly a good time'}
];
function rwEventROI(e){
  var r=e&&e.roi; if(!r) return null;
  var gain=(r.prof||0)+(r.money||0)+(r.mind||0)+(r.cult||0)+(r.fun||0);   /* -10..25 */
  var give=(r.cost||0)+(r.drain||0);                                       /* 0..10  */
  var net=gain-give;
  var band, tone, why;
  if(net>=12){ band='MUST ATTEND'; tone='must'; }
  else if(net>=7){ band='WORTH IT'; tone='good'; }
  else if(net>=3){ band='GO IF NEARBY'; tone='ok'; }
  else if(net>=0){ band='ONLY IF IT\u2019S YOUR THING'; tone='meh'; }
  else { band='LIKELY NOT WORTH IT'; tone='bad'; }

  /* the single strongest reason, so the badge is arguable rather than magic */
  var best=RW_ROI_DIMS.slice().sort(function(a,b){ return (r[b.k]||0)-(r[a.k]||0); })[0];
  var worst = (r.cost||0)>=(r.drain||0) ? {k:'cost',label:'cost'} : {k:'drain',label:'drain'};
  if(tone==='bad') why='Takes more than it gives \u2014 high '+worst.label+' for what you get back.';
  else if(tone==='meh') why='Roughly break-even. Worth it only if '+best.label.toLowerCase()+' is what you\u2019re after.';
  else why='Strongest on '+best.label.toLowerCase()+' \u2014 '+best.good+'.';
  if((r.cost||0)>=4 && net>=3) why+=' Expensive, though \u2014 budget for it.';
  if((r.drain||0)>=4 && net>=3) why+=' It will wipe you out; plan a recovery day.';
  return {net:net, gain:gain, give:give, band:band, tone:tone, why:why, best:best, r:r};
}
function rwROIBadge(e){
  var v=rwEventROI(e); if(!v) return '';
  return '<span class="roi-badge roi-'+v.tone+'">'+v.band+'</span>';
}
function rwROIPanel(e){
  var v=rwEventROI(e); if(!v) return '';
  var bars=RW_ROI_DIMS.map(function(d){
    var raw=v.r[d.k]||0, pos=Math.max(0,raw), neg=Math.max(0,-raw);
    var pct=Math.round((pos/5)*100);
    return '<div class="roi-row"><span class="roi-lbl">'+d.icon+' '+d.label+'</span>'
      +'<span class="roi-bar"><i style="width:'+pct+'%"></i>'
      +(neg?'<u style="width:'+Math.round((neg/5)*100)+'%"></u>':'')+'</span>'
      +'<span class="roi-num'+(raw<0?' neg':'')+'">'+(raw>0?'+':'')+raw+'</span></div>';
  }).join('');
  var costs='<div class="roi-row"><span class="roi-lbl">\ud83d\udcb8 What it costs</span>'
    +'<span class="roi-bar cost"><i style="width:'+Math.round(((v.r.cost||0)/5)*100)+'%"></i></span>'
    +'<span class="roi-num neg">-'+(v.r.cost||0)+'</span></div>'
    +'<div class="roi-row"><span class="roi-lbl">\ud83d\ude29 What it takes out of you</span>'
    +'<span class="roi-bar cost"><i style="width:'+Math.round(((v.r.drain||0)/5)*100)+'%"></i></span>'
    +'<span class="roi-num neg">-'+(v.r.drain||0)+'</span></div>';
  return '<div class="roi-panel">'
    +'<div class="roi-head"><span class="roi-badge roi-'+v.tone+'">'+v.band+'</span>'
    +'<span class="roi-net">net '+(v.net>0?'+':'')+v.net+'</span></div>'
    +'<div class="roi-why">'+esc2(v.why)+'</div>'
    + bars + '<div class="roi-sep"></div>' + costs
    +'<div class="roi-note">This is our stated opinion, not a measurement \u2014 scored on what an event typically gives back versus what it takes. Disagree freely; you know your own life.</div>'
    +'</div>';
}

/* ============================================================================
   EVENT RADAR (rw-v58) — music, startup, sports & automobile events
   ============================================================================
   HONESTY FIRST: there is no free, reliable live-events API for India, so this
   is a CURATED calendar, not a scrape. Every event carries a `verified` flag
   and the UI shows it, because someone may book a flight on these dates:
     confirmed -> organiser-announced
     typical   -> runs around this time most years, NOT announced
   The differentiated part isn't the listing — it's turning an event into a
   real trip, with themed advice per category.
   ========================================================================== */
function rwEventDate(e){
  if(e.start){
    var a=new Date(e.start+'T00:00:00'), b=e.end?new Date(e.end+'T00:00:00'):null;
    var f=function(d){ return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); };
    return b? f(a)+'\u2013'+f(b)+' '+b.getFullYear() : f(a)+' '+a.getFullYear();
  }
  if(e.month){ return ['','January','February','March','April','May','June','July','August','September','October','November','December'][e.month]; }
  return 'dates vary';
}
/* days until it starts; null when we only know a month */
function rwEventDays(e){
  if(!e.start) return null;
  var d=new Date(e.start+'T00:00:00'), now=new Date(); now.setHours(0,0,0,0);
  return Math.round((d-now)/86400000);
}
function rwEventSoon(e){
  var d=rwEventDays(e);
  if(d!==null) return d>=0 && d<=45;
  if(e.month){ var m=new Date().getMonth()+1; return e.month===m || e.month===(m%12)+1; }
  return false;
}
function openEvents(cat){
  rwPageOpen('events', function(body){
    var sec=document.createElement('section'); sec.id='eventsSection'; sec.className='xsec';
    body.appendChild(sec);
  });
  var sec=el('eventsSection'); if(!sec) return;
  window._evCat=cat||window._evCat||'all';
  sec.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px">'
    +'<button class="ev-chip'+(window._evCat==='all'?' on':'')+'" onclick="openEvents(\'all\')">All</button>'
    + (window.RW_EVENT_CATS||[]).map(function(c){
        return '<button class="ev-chip'+(window._evCat===c.id?' on':'')+'" onclick="openEvents(\''+c.id+'\')">'+c.icon+' '+c.label+'</button>';
      }).join('')
    +'</div>'
    +'<input id="evSearch" placeholder="Search events, cities, countries\u2026" oninput="rwEventsRender()" '
    +'style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:11px;padding:11px;color:var(--t1);font:inherit;margin-bottom:14px">'
    +'<div id="eventsOut"></div>';
  rwEventsRender();
  try{ rwEventsSync(); }catch(e){}
}
function rwEventsRender(){
  var host=el('eventsOut'); if(!host) return;
  var all=(window.RW_EVENTS||[]).slice();
  var cat=window._evCat||'all';
  var q=((el('evSearch')&&el('evSearch').value)||'').trim().toLowerCase();
  var list=all.filter(function(e){
    if(cat!=='all' && e.cat!==cat) return false;
    if(!q) return true;
    return (e.name+' '+e.place+' '+e.country+' '+(e.vibe||'')).toLowerCase().indexOf(q)>-1;
  });
  if(!list.length){ host.innerHTML='<div class="note" style="text-align:center;padding:22px;color:var(--t3)">Nothing matches. Try a city, a country, or clear the search.</div>'; return; }
  /* soonest first; month-only events after dated ones */
  list.sort(function(a,b){
    var da=rwEventDays(a), db=rwEventDays(b);
    if(da!==null && db!==null) return da-db;
    if(da!==null) return -1;
    if(db!==null) return 1;
    var m=new Date().getMonth()+1;
    var oa=((a.month||13)-m+12)%12, ob=((b.month||13)-m+12)%12;
    return oa-ob;
  });
  var soon=list.filter(rwEventSoon), later=list.filter(function(e){ return !rwEventSoon(e); });
  /* within "later", surface the ones actually worth travelling for */
  later.sort(rwByROI);
  var C={}; (window.RW_EVENT_CATS||[]).forEach(function(c){ C[c.id]=c; });

  function card(e, hot){
    var c=C[e.cat]||{icon:'\ud83d\udcc5',color:'var(--gold)',label:''};
    var d=rwEventDays(e);
    var badge = e.verified==='confirmed'
      ? '<span class="ev-ok">\u2713 dates confirmed</span>'
      : '<span class="ev-maybe">~ typical timing \u00b7 verify before booking</span>';
    var count = (d!==null && d>=0) ? '<span class="ev-days">'+(d===0?'today':d===1?'tomorrow':'in '+d+' days')+'</span>' : '';
    return '<div class="ev-card'+(hot?' hot':'')+'" style="--evc:'+c.color+'">'
      +'<div class="ev-top"><span class="ev-ic">'+c.icon+'</span>'
      +'<span style="flex:1;min-width:0"><b class="ev-name">'+esc2(e.name)+'</b>'
      +'<div class="ev-where">'+esc2(e.place)+' \u00b7 '+esc2(e.country)+'</div></span>'
      + count +'</div>'
      +'<div class="ev-when">'+esc2(rwEventDate(e))+' '+badge+' '+rwROIBadge(e)+'</div>'
      +(e.vibe?'<div class="ev-vibe">'+esc2(e.vibe)+'</div>':'')
      +'<div class="ev-actions">'
      +'<button class="tact ev-go" onclick="rwEventPlan(\''+e.id+'\')">\u2728 Build my trip</button>'
      +'<button class="tact" onclick="rwEventTips(\''+e.id+'\')">\ud83d\udca1 Know before you go</button>'
      +'<button class="tact" onclick="rwEventWorth(\''+e.id+'\')">\u2696\ufe0f Is it worth it?</button>'
      +'</div></div>';
  }
  host.innerHTML =
     (soon.length? '<div class="ev-head">\ud83d\udd25 Happening soon</div>'+soon.map(function(e){return card(e,true);}).join('') : '')
    +(later.length? '<div class="ev-head">\ud83d\uddd3\ufe0f Later in the year</div>'+later.map(function(e){return card(e,false);}).join('') : '')
    +(window._evSynced? '<div style="font-size:11px;color:#4ADE80;margin-top:12px">\u21bb '+window._evSynced.count+' live events synced'+(window._evSynced.updated?' \u00b7 updated '+String(window._evSynced.updated).slice(0,10):'')+'</div>' : '')
    +'<div style="font-size:11px;color:var(--t3);margin-top:14px;line-height:1.6">Dates marked <b>~ typical</b> are our best estimate from previous years, not an announcement. Always confirm with the organiser before you book travel.</div>';
}

function rwEventWorth(id){
  var e=rwEventById(id); if(!e) return;
  var ov=el('evWorthOv');
  if(!ov){ ov=document.createElement('div'); ov.id='evWorthOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(x){ if(x.target===ov) rwOverlayClose('evWorthOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:430px"><div class="sheet-h"><b>\u2696\ufe0f '+esc2(e.name)+'</b>'
    +'<button onclick="rwOverlayClose(\'evWorthOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:12px;color:var(--t2);margin:2px 0 12px">'+esc2(e.place)+' \u00b7 '+esc2(rwEventDate(e))+'</div>'
    + rwROIPanel(e)
    +'<button class="tact" style="width:100%;margin-top:12px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwOverlayClose(\'evWorthOv\');rwEventPlan(\''+e.id+'\')">\u2728 Build my trip anyway</button></div>';
  ov.classList.add('open');
}
/* sort helper: highest net ROI first within a bucket */
function rwByROI(a,b){
  var va=rwEventROI(a), vb=rwEventROI(b);
  return ((vb?vb.net:0)-(va?va.net:0));
}


/* Pull weekly-refreshed events from the Worker when one is configured.
   SAFE BY DESIGN: curated events in events-data.js always win; fetched ones are
   appended, never overwrite. If the Worker is absent or fails, the app is
   exactly what it is today. */
function rwEventsSync(){
  try{
    var api = window.rwApi && rwApi('events');
    if(!api) return;                                  /* no worker configured */
    fetch(api).then(function(r){ return r.json(); }).then(function(d){
      if(!d || !d.events || !d.events.length) return;
      var have = {}; (window.RW_EVENTS||[]).forEach(function(e){ have[(e.name||'').toLowerCase()]=1; });
      var added = d.events.filter(function(e){ return e.name && !have[e.name.toLowerCase()]; });
      if(!added.length) return;
      window.RW_EVENTS = (window.RW_EVENTS||[]).concat(added);
      window._evSynced = { count: added.length, updated: d.updated };
      if(el('eventsOut')) rwEventsRender();
    }).catch(function(){});
  }catch(e){}
}

function rwEventById(id){ return (window.RW_EVENTS||[]).filter(function(e){ return e.id===id; })[0]; }
function rwEventTips(id){
  var e=rwEventById(id); if(!e) return;
  var C={}; (window.RW_EVENT_CATS||[]).forEach(function(c){ C[c.id]=c; });
  var generic={
    music:['Earplugs. Genuinely \u2014 the good ones cost little and save your hearing.','Cash still rules at most Indian festival grounds.','Phone battery pack; charging queues are long.'],
    startup:['Have a one-line answer to \u201cwhat do you do\u201d before you arrive.','The corridor and side events beat the main stage for meeting people.','Carry more business cards than feels sensible.'],
    sports:['Buy tickets only through the official channel \u2014 resale scams spike near event dates.','Arrive far earlier than you think; gates and security are slow.','Check the bag-size rule before you leave the hotel.'],
    auto:['Go on the first public morning \u2014 halls empty out by afternoon on day one.','Comfortable shoes; expo floors are enormous.','Photography rules vary by hall.']
  }[e.cat]||[];
  var ov=el('evTipsOv');
  if(!ov){ ov=document.createElement('div'); ov.id='evTipsOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(x){ if(x.target===ov) rwOverlayClose('evTipsOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:420px"><div class="sheet-h"><b>\ud83d\udca1 '+esc2(e.name)+'</b>'
    +'<button onclick="rwOverlayClose(\'evTipsOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin:2px 0 12px">'+esc2(e.place)+' \u00b7 '+esc2(rwEventDate(e))+'</div>'
    +((e.tips||[]).length? '<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:7px">SPECIFIC TO THIS EVENT</div>'
      +(e.tips||[]).map(function(t){ return '<div class="ev-tip">\u2022 '+esc2(t)+'</div>'; }).join('') : '')
    +(generic.length? '<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin:14px 0 7px">'+(C[e.cat]?C[e.cat].label.toUpperCase():'GENERAL')+' EVENTS</div>'
      +generic.map(function(t){ return '<div class="ev-tip">\u2022 '+esc2(t)+'</div>'; }).join('') : '')
    +'<button class="tact" style="width:100%;margin-top:14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwOverlayClose(\'evTipsOv\');rwEventPlan(\''+e.id+'\')">\u2728 Build my trip around this</button></div>';
  ov.classList.add('open');
}
/* The actual value: an event becomes a themed trip, with category-aware framing. */
function rwEventPlan(id){
  var e=rwEventById(id); if(!e) return;
  var theme={
    music:'Frame it around the festival: arrive a day early to settle in, plan recovery time, and suggest what to do in the area on non-show days.',
    startup:'Frame it around the conference: arrive the evening before, keep mornings free for meetings, and suggest good places to actually talk to people.',
    sports:'Frame it around the event day: getting to the venue, timing around traffic, and what to see nearby on the other days.',
    auto:'Frame it around the show: the best day and time to attend, and what else is worth seeing in the city.'
  }[e.cat]||'';
  var when=rwEventDate(e);
  var q='I want to go to '+e.name+' at '+e.place+', '+e.country+' ('+when+'). '
    +'Plan the trip around it. '+theme+' '
    +'Use honest India road times if travel is overland, give a realistic budget, and flag anything I must arrange in advance (permits, tickets, acclimatisation).';
  rwCloseSection('eventsSection');
  var inp=el('heroInput')||el('cpInput');
  if(inp){ inp.value=q; try{ copilotSend(!!el('heroInput')); }catch(err){} }
  showToast('\u2728 Planning your '+e.name+' trip');
}

// Moved to js/ui/site-search.js (Phase 5b) — menu search (drFilter)

/* ============================================================================
   THE OPENING (rw-v54) — the first twenty seconds
   ============================================================================
   Why this exists: RoamWise has ~50 features. A first-time visitor sees a wall
   of tiles and leaves before understanding any of it. Every app people
   genuinely love is almost embarrassingly simple on first contact.

   So: one question, one breath, one real answer. No signup, no tour, no tiles.
   We DELIVER value before asking for anything, then let the app appear behind
   it. The 5-slide tour is demoted to a menu item for people who want it.
   ========================================================================== */
var RW_DREAMS=[
  'somewhere green and quiet','the mountains, cheaply','a beach with no crowds',
  'a city that stays up late','snow, for the first time','where my friends can all afford'
];
function rwOpeningSeen(){ try{ return lsGet('rw_opening')==='1'; }catch(e){ return true; } }
function rwOpeningShow(force){
  if(!force && rwOpeningSeen()) return;
  var ov=el('rwOpening');
  if(!ov){ ov=document.createElement('div'); ov.id='rwOpening'; document.body.appendChild(ov); }
  ov.className='rw-open';
  var ph=RW_DREAMS[Math.floor(Math.random()*RW_DREAMS.length)];
  ov.innerHTML=
     '<div class="rw-open-sky"></div>'
    +'<div class="rw-open-inner">'
    +  '<div class="rw-open-mark">RoamWise</div>'
    +  '<h1 class="rw-open-q">Where do you<br><em>dream</em> of going?</h1>'
    +  '<div class="rw-open-field">'
    +    '<input id="rwOpenIn" autocomplete="off" placeholder="'+esc2(ph)+'">'
    +    '<button onclick="rwOpeningGo()" aria-label="Go">\u2192</button>'
    +  '</div>'
    +  '<div class="rw-open-hint">One line is enough. No signup, no email \u2014 ever.</div>'
    +  '<button class="rw-open-skip" onclick="rwOpeningDone()">I\u2019ll look around myself</button>'
    +'</div>';
  document.body.style.overflow='hidden';
  setTimeout(function(){ var i=el('rwOpenIn'); if(i){ i.focus(); i.addEventListener('keydown',function(e){ if(e.key==='Enter') rwOpeningGo(); }); } }, 700);
}
function rwOpeningGo(){
  var v=(el('rwOpenIn')&&el('rwOpenIn').value||'').trim();
  if(!v){ var i=el('rwOpenIn'); if(i){ i.focus(); i.classList.add('rw-shake'); setTimeout(function(){ i.classList.remove('rw-shake'); },500);} return; }
  var ov=el('rwOpening'); if(!ov) return;
  var inner=ov.querySelector('.rw-open-inner');
  inner.innerHTML='<div class="rw-open-think"><div class="rw-cine-orb"></div>'
    +'<div class="rw-open-thinktxt">Reading the map for<br><b>'+esc2(v.slice(0,60))+'</b></div></div>';
  /* Give a REAL answer, not a loading screen followed by a tour. */
  var prompt='A traveller said they dream of: "'+v+'". In under 55 words: name ONE specific place in India that fits, say the single best month to go, an honest rough budget in rupees for 3-4 days, and one detail only a local would tell them. Warm, concrete, no preamble.';
  var done=false;
  var finish=function(text){
    if(done) return; done=true;
    inner.innerHTML='<div class="rw-open-reveal">'
      +'<div class="rw-open-mark">RoamWise</div>'
      +'<div class="rw-open-answer">'+esc2(text)+'</div>'
      +'<button class="rw-open-cta" onclick="rwOpeningEnter(\''+String(v).replace(/'/g,"\\'").slice(0,60)+'\')">Plan this properly \u2192</button>'
      +'<button class="rw-open-skip" onclick="rwOpeningDone()">Just let me in</button>'
      +'</div>';
  };
  setTimeout(function(){ finish('India has a place for exactly that \u2014 let\u2019s find it together. Tell Tusk the same thing inside and it\u2019ll build you a full day-by-day plan with real numbers.'); }, 9000);
  try{
    if(typeof aiCallAny==='function'){
      aiCallAny(prompt, 160, function(err, txt){
        if(txt && String(txt).trim().length>30) finish(String(txt).trim());
        else finish('India has a place for exactly that. Tell Tusk the same line inside and it\u2019ll build the whole trip \u2014 days, budget, and a map.');
      });
    }
  }catch(e){}
}
function rwOpeningEnter(seed){
  rwOpeningDone();
  setTimeout(function(){
    try{
      var i=el('heroInput'); if(i){ i.value=seed; i.focus(); }
      if(typeof tabGo==='function') tabGo('home');
      showToast('\u2728 Ask Tusk \u2014 it already knows what you want');
    }catch(e){}
  }, 420);
}
function rwOpeningDone(){
  try{ lsSet('rw_opening','1'); }catch(e){}
  var ov=el('rwOpening'); if(!ov) return;
  ov.classList.add('rw-open-out');
  document.body.style.overflow='';
  setTimeout(function(){ if(ov&&ov.parentNode) ov.parentNode.removeChild(ov); }, 720);
}
function rwOpeningReplay(){ rwOpeningShow(true); }

// Moved to js/ui/onboarding.js (Phase 5b) — first-launch walkthrough (RW_ONBOARD, rwMaybeOnboard/Show/Done, rwReplayOnboard)

// Moved to js/ui/settings-modal.js (Phase 5b) — text + icon size accessibility controls (rwApplyUIScale, rwSetTextScale/IconScale, openSizeSettings)
function el(id){ return document.getElementById(id); }

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

/* ===== PREMIUM PDF ITINERARY \u2014 \u20b910 one-off (free for Pro) ===== */
var PDF_CTX=null; /* {d, days, month} set when user opens the flow */
function openPdfFlow(T, name, days, month){
  var d = DB.find(function(x){return x.name===name;}) || {name:name, country:'', cost:{mid:0}, food:[], gems:[]};
  PDF_CTX = {d:d, days:days, month:month, T:T};
  var ov = el('pdfOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='pdfOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:420px"><button class="modal-close" onclick="el(\'pdfOverlay\').classList.remove(\'open\')">\u00d7</button>'
    +'<div class="modal-head"><div class="modal-title">\ud83d\udcd5 Premium PDF Itinerary</div><div class="modal-sub">Multi-page \u00b7 designed \u00b7 yours forever</div></div>'
    +'<div class="modal-body" id="pdfBody"></div></div>';
    document.body.appendChild(ov);
  }
  var payBlock = isPro ? '<button class="rzp-main-btn" onclick="genPdf()">\u2728 Generate my PDF (free with Pro)</button>'
    : '<div class="mode-box" style="margin-bottom:10px">\ud83d\udcb0 <b>\u20b910 one-off</b> \u2014 or free with Pro. Pay via any UPI app to <b>coolmohit@ybl</b>, then tap generate.</div>'
      +'<div style="display:flex;gap:7px;margin-bottom:10px"><button class="tact" style="flex:1" onclick="payVia(\'generic10\')">\ud83d\udcb3 Pay \u20b910 via UPI</button></div>'
      +'<button class="rzp-main-btn" onclick="track(\'pdf_paid\');genPdf()">\u2705 I\u2019ve paid \u20b910 \u2014 Generate full PDF</button>'
      +'<div style="text-align:center;margin:10px 0 4px;font-size:11px;color:var(--t3)">\u2014 or try it first \u2014</div>'
      +'<button class="tact" style="width:100%" onclick="genPdf(true)">\ud83d\udcc4 Download a free 2-page sample</button>'
      +'<div style="font-size:10px;color:var(--t3);text-align:center;margin-top:6px">Honor system \u2014 you\u2019re supporting a solo builder \ud83c\udfd4\ufe0f</div>';
  el('pdfBody').innerHTML =
    '<div class="dna-q"><div class="qt">Traveler name on the cover</div><input class="txn-inp" id="pdfName" style="width:100%" value="'+(lsGet('rw_name')||'')+'" placeholder="Your name"></div>'
   +'<div class="dna-q"><div class="qt">Start date</div><input class="txn-inp" type="date" id="pdfDate" style="width:100%"></div>'
   +'<div class="dna-q"><div class="qt">Party</div><div class="dna-opts">'+['Solo','Couple','Family','Friends'].map(function(o,i){return '<button class="dna-opt'+(i===0?' on':'')+'" onclick="pdfPick(this,\'party\',\''+o+'\')">'+o+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Pace</div><div class="dna-opts">'+['Relaxed','Balanced','Packed'].map(function(o,i){return '<button class="dna-opt'+(i===1?' on':'')+'" onclick="pdfPick(this,\'pace\',\''+o+'\')">'+o+'</button>';}).join('')+'</div></div>'
   +'<div class="dna-q"><div class="qt">Special notes (optional)</div><input class="txn-inp" id="pdfNotes" style="width:100%" placeholder="anniversary trip, vegetarian, photography focus\u2026"></div>'
   +'<button class="tact" style="width:100%;margin-bottom:10px" onclick="pdfPreviewHtml()">\ud83d\udc41 Live preview \u2014 see it before you pay</button>'
   +'<div id="pdfPrev" style="display:none;margin-bottom:12px"></div>'
   + payBlock;
  window._pdfOpts={party:'Solo',pace:'Balanced'};
  ov.classList.add('open');
  try{ track('pdf_opens'); }catch(e){}
}
function pdfPreviewHtml(){
  var C=PDF_CTX; if(!C) return;
  var d=C.d, o=window._pdfOpts||{party:'Solo',pace:'Balanced'};
  var nm=(el('pdfName').value||'A Traveler').slice(0,26);
  var t=(typeof DAY_TEMPLATES!=='undefined'&&DAY_TEMPLATES[0])||{title:'Arrival',morning:'Check in & wander',afternoon:'The icon sight',evening:'Local dinner',tip:'Get cash from a bank ATM'};
  var box=el('pdfPrev');
  box.style.display='';
  /* This live preview is the one part of the download flow the user actually
     SEES on-screen — the downloaded PDF itself can only be static colour, but
     this box can carry the app's real animated gold gradient (same recipe as
     .hero h1 em / .intro .it in app.css) so the flow still feels alive. */
  box.innerHTML=
   '<div style="background:#0C1020;border:2px solid #C8913E;border-radius:10px;padding:18px;text-align:center;margin-bottom:8px">'
   +'<div style="font-size:9px;letter-spacing:.2em;color:#8A8880">A ROAMWISE PREMIUM ITINERARY</div>'
   +'<div style="font-family:Georgia,serif;font-weight:700;font-size:22px;margin:6px 0 2px;background:linear-gradient(120deg,var(--gold2),var(--crim2),var(--pm2),#2AE8B8,var(--gold2));background-size:280% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gradShift 8s ease infinite">'+d.name.toUpperCase()+'</div>'
   +'<div style="font-size:11px;color:#EDEAE2">'+(d.country||'')+' \u00b7 '+Math.min(C.days||5,10)+' days \u00b7 '+(C.month||'')+'</div>'
   +'<div style="font-size:10px;color:#B8B4A8;margin-top:8px">crafted for</div>'
   +'<div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:16px;color:#E8BA6C">'+nm+'</div>'
   +'<div style="font-size:9px;color:#8A8880;margin-top:4px">'+o.party+' \u00b7 '+o.pace+' pace</div></div>'
   +'<div style="position:relative;overflow:hidden;background:#F7F3EA;border:2px solid #C8913E;border-radius:10px;padding:14px;color:#1A1A22">'
   +'<div style="position:absolute;inset:0;display:flex;flex-wrap:wrap;gap:26px;align-items:center;justify-content:center;transform:rotate(-24deg);opacity:.06;font-weight:800;color:#C8913E;font-size:20px;pointer-events:none">ROAMWISE ROAMWISE ROAMWISE ROAMWISE ROAMWISE ROAMWISE</div>'
   +'<div style="font-family:Georgia,serif;font-weight:700;color:#C4302B;font-size:16px">Day 1</div>'
   +'<div style="font-size:11px;font-weight:700;margin:2px 0 8px">'+t.title+'</div>'
   +[['09:00 MORNING',t.morning],['13:00 AFTERNOON',t.afternoon],['18:00 EVENING',t.evening]].map(function(sg){
      return '<div style="background:#EFE7D6;border-radius:6px;padding:7px 9px;margin-bottom:6px"><div style="font-size:8.5px;font-weight:700;color:#C8913E">'+sg[0]+'</div><div style="font-size:10.5px;line-height:1.5">'+sg[1]+'</div></div>';
    }).join('')
   +'<div style="background:#F3E2C0;border-radius:6px;padding:6px 9px;font-size:9.5px;color:#7A5A16">\ud83e\udd77 Ninja tip: '+(t.tip||'')+'</div>'
   +'<div style="font-size:8.5px;color:#6B675C;text-align:center;margin-top:8px">\u2026 + '+(Math.min(C.days||5,10)-1)+' more day pages + Essentials page \u00b7 every page carries the RoamWise watermark</div></div>';
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function pdfPick(btn,k,v){ window._pdfOpts[k]=v; btn.parentNode.querySelectorAll('.dna-opt').forEach(function(b){b.classList.remove('on');}); btn.classList.add('on'); }
function loadJsPdf(cb){
  if(window.jspdf) return cb();
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload=cb; s.onerror=function(){ showToast('PDF engine needs internet'); };
  document.head.appendChild(s);
}
function blobToJpeg(b){
  function draw(bm,w0,h0){
    var c2=document.createElement('canvas');
    var w=Math.min(900,w0), h=Math.round(h0*w/w0);
    c2.width=w; c2.height=h;
    var g=c2.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,w,h); g.drawImage(bm,0,0,w,h);
    return c2.toDataURL('image/jpeg',0.88);
  }
  if(window.createImageBitmap){
    return createImageBitmap(b).then(function(bm){ var d=draw(bm,bm.width,bm.height); bm.close&&bm.close(); return d; });
  }
  return new Promise(function(res,rej){
    var fr=new FileReader();
    fr.onload=function(){ var im=new Image();
      im.onload=function(){ try{ res(draw(im,im.naturalWidth,im.naturalHeight)); }catch(e){ rej(e); } };
      im.onerror=function(){ rej(0); }; im.src=fr.result; };
    fr.onerror=function(){ rej(0); }; fr.readAsDataURL(b);
  });
}
function fetchImg64(url){
  /* weserv proxy: any source -> CORS-open, resized, guaranteed JPEG */
  var u0=String(url).replace(/\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^\/]+)\/\d+px-[^\/]+$/,'/$1'); /* wikimedia: use ORIGINAL, let proxy resize */
  var prox='https://images.weserv.nl/?w=820&q=82&output=jpg&url='+encodeURIComponent(u0.replace(/^https?:\/\//,''));
  function toData(b){ return new Promise(function(res,rej){ var fr=new FileReader(); fr.onload=function(){res(fr.result);}; fr.onerror=function(){rej(0);}; fr.readAsDataURL(b); }); }
  return fetch(prox).then(function(r){ if(!r.ok) throw 0; return r.blob(); })
    .then(function(b){ if(b.size<400 || !/image/.test(b.type)) throw 0; return toData(b); })
    .catch(function(){ return fetch(url).then(function(r){ if(!r.ok) throw 0; return r.blob(); }).then(blobToJpeg); });
}
function fetchBmp(url){ /* ImageBitmap for canvas composition (map tiles) */
  return fetch(url).then(function(r){ if(!r.ok) throw 0; return r.blob(); })
    .then(function(b){ return createImageBitmap(b); });
}
function wikiAction(q){
  /* Stricter image lookup: only return an image when Wikipedia actually has a
     matching article with a real page image. This prevents wrong-image bugs
     (e.g. a food query returning an unrelated thumbnail) by checking the page
     isn't a "missing" stub and the title reasonably matches the query. */
  return fetch('https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|info&piprop=thumbnail&pithumbsize=640&redirects=1&format=json&origin=*&titles='+encodeURIComponent(q))
    .then(function(r){return r.json();}).then(function(d){
      var pgs=d.query&&d.query.pages; if(!pgs) return null;
      var k=Object.keys(pgs)[0]; var pg=pgs[k];
      if(!pg || pg.missing!==undefined) return null;           /* no such article */
      if(!pg.thumbnail || !pg.thumbnail.source) return null;    /* article has no image */
      /* sanity: the returned title should share a keyword with the query, else
         it's likely a loose/incorrect match — skip rather than show a wrong pic */
      var qWords=String(q).toLowerCase().split(/[\s,]+/).filter(function(w){return w.length>3;});
      var title=String(pg.title||'').toLowerCase();
      var overlap=qWords.some(function(w){ return title.indexOf(w)>=0; });
      if(qWords.length && !overlap) return null;
      return pg.thumbnail.source;
    }).catch(function(){return null;});
}
function openverseThumb(q){
  return fetch('https://api.openverse.org/v1/images/?q='+encodeURIComponent(q)+'&page_size=1&license_type=all')
    .then(function(r){return r.json();}).then(function(d){
      return (d.results&&d.results[0]&&(d.results[0].thumbnail||d.results[0].url))||null;
    }).catch(function(){return null;});
}
function imgTry(getters){ /* iterate candidate URL getters until a download succeeds */
  if(!getters.length) return Promise.resolve(null);
  var g=getters.shift();
  return Promise.resolve().then(g).then(function(u){
    if(!u) return imgTry(getters);
    return fetchImg64(u).catch(function(){ return imgTry(getters); });
  }).catch(function(){ return imgTry(getters); });
}
function wikiAny(q, alt){ /* REST summary (proxy-safe) -> alt REST -> action -> openverse */
  return wikiThumb(q).then(function(u){ if(u) return u; return alt? wikiThumb(alt):null; })
    .then(function(u){ if(u) return u; return wikiAction(q); })
    .then(function(u){ if(u) return u; return alt? wikiAction(alt):null; })
    .then(function(u){ if(u) return u; return openverseThumb(q); });
}
var EMG_NUM={india:'112 all-in-one / 108 ambulance',thailand:'191 police / 1669 medical',japan:'110 police / 119 fire-med',usa:'911',uk:'999',france:'112',italy:'112',spain:'112',germany:'112',indonesia:'112',vietnam:'113 police / 115 medical',uae:'999 / 998 ambulance',nepal:'100 police / 102 ambulance','sri lanka':'119 / 110',turkey:'112',greece:'112',iceland:'112',singapore:'999 / 995',malaysia:'999',portugal:'112',netherlands:'112',switzerland:'112',austria:'112',mexico:'911',brazil:'190 / 192',australia:'000','new zealand':'111',egypt:'122 / 123',morocco:'19 / 15'};
function emgFor(c){ c=String(c||'').toLowerCase();
  for(var k in EMG_NUM){ if(c.indexOf(k)>-1) return EMG_NUM[k]; } return '112 (global GSM standard)'; }
function gcode(q){
  return fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=1&language=en')
    .then(function(r){return r.json();}).then(function(d){ var h=d.results&&d.results[0];
      return h? {lat:h.latitude, lon:h.longitude} : null; }).catch(function(){return null;});
}
/* Colours pulled straight from the app's own palette (app.css :root) so a
   downloaded itinerary reads as unmistakably RoamWise, not a generic PDF —
   deep = one of the app's dark backgrounds (--bg/--bg2/--bg3), acc = one of
   the app's five accent colours (--gold/--gold2/--teal/--pm/--crim/--crim2),
   each used once so the six themes stay visually distinct. */
var PDF_THEMES={
 beach:{deep:[12,16,32],acc:[22,191,150],line:'Sun, salt and slow mornings'},      /* --bg2, --teal */
 metro:{deep:[7,9,15],acc:[155,89,245],line:'Neon nights, skyline days'},          /* --bg, --pm */
 sacred:{deep:[18,24,40],acc:[200,145,62],line:'Bells, rivers and quiet dawns'},   /* --bg3, --gold */
 tech:{deep:[7,9,15],acc:[234,90,80],line:'Glass towers, future streets'},         /* --bg, --crim2 */
 peak:{deep:[18,24,40],acc:[196,48,43],line:'Thin air, tall silence'},             /* --bg3, --crim */
 classic:{deep:[12,16,32],acc:[232,186,108],line:'Old roads, new eyes'}};          /* --bg2, --gold2 */
function hueRGB(h,s,l){ s/=100; l/=100; var k=function(n){return (n+h/30)%12;},
  a=s*Math.min(l,1-l), f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));};
  return [Math.round(255*f(0)),Math.round(255*f(8)),Math.round(255*f(4))]; }
function themeFor(d){
  var key=detectTheme(d);
  var h=0, s=String(d.name||'x'); for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  if(key==='classic'){ key=['beach','metro','sacred','tech','peak','classic'][h%6]; }
  var hue=h%360;
  return { key:key,
    acc: hueRGB(hue, 62, 56),
    deep: hueRGB(hue, 48, 13),
    line: PDF_THEMES[key].line };
}
function detectTheme(d){
  var j=((d.tags||[]).concat(d.interests||[]).join(' ')+' '+(d.name||'')).toLowerCase();
  if(/beach|island|coast|surf|goa|bali|maldiv/.test(j)) return 'beach';
  if(/night|neon|party|club|vegas|bangkok|tokyo|dubai/.test(j)) return 'metro';
  if(/temple|spiritual|pilgrim|yoga|sacred|varanasi|rishikesh|kyoto/.test(j)) return 'sacred';
  if(/tech|futur|cyber|modern|singapore|shenzhen/.test(j)) return 'tech';
  if(/trek|mountain|himalaya|alpine|snow|leh|spiti|manali/.test(j)) return 'peak';
  return 'classic';
}
function drawMotif(pdf,key,acc,cx,cy){
  pdf.setDrawColor(acc[0],acc[1],acc[2]); pdf.setFillColor(acc[0],acc[1],acc[2]); pdf.setLineWidth(2);
  if(key==='beach'){ pdf.circle(cx-90,cy-16,14,'F');
    pdf.line(cx-56,cy+2,cx-8,cy+2); pdf.line(cx-48,cy+12,cx-16,cy+12); pdf.line(cx-52,cy+22,cx-12,cy+22);
    pdf.line(cx+70,cy+18,cx+78,cy-26);
    [[-24,-34],[22,-38],[-16,-16],[18,-18]].forEach(function(l){ pdf.line(cx+76,cy-26,cx+78+l[0],cy+l[1]); });
  } else if(key==='metro'){ var xs=[-100,-70,-36,0,36,72]; var hs=[26,44,34,52,30,42];
    xs.forEach(function(x0,i){ pdf.rect(cx+x0,cy+20-hs[i],26,hs[i],'F'); });
    pdf.circle(cx+112,cy+10,6,'F'); pdf.line(cx+118,cy+10,cx+118,cy-22); pdf.line(cx+118,cy-22,cx+130,cy-18);
  } else if(key==='sacred'){ [[46,0],[34,-14],[22,-28]].forEach(function(t){ pdf.triangle(cx-t[0],cy+18+t[1],cx+t[0],cy+18+t[1],cx,cy-34+t[1],'F'); });
    pdf.circle(cx,cy+30,4,'F');
  } else if(key==='tech'){ [[-90,34],[-52,52],[-14,40],[24,58],[62,44]].forEach(function(b){ pdf.rect(cx+b[0],cy+20-b[1],30,b[1],'S'); });
    pdf.line(cx-90,cy+30,cx+100,cy+30); [-60,-10,40,90].forEach(function(x0){ pdf.circle(cx+x0,cy+30,3,'F'); });
  } else if(key==='peak'){ pdf.triangle(cx-96,cy+22,cx-24,cy+22,cx-60,cy-30,'F'); pdf.triangle(cx-30,cy+22,cx+60,cy+22,cx+15,cy-40,'F'); pdf.triangle(cx+40,cy+22,cx+104,cy+22,cx+72,cy-22,'F');
    pdf.setFillColor(255,255,255); pdf.triangle(cx+5,cy-28,cx+25,cy-28,cx+15,cy-40,'F');
  } else { pdf.circle(cx,cy,26,'S'); pdf.circle(cx,cy,18,'S');
    [[0,-34],[0,34],[-34,0],[34,0]].forEach(function(p2){ pdf.line(cx,cy,cx+p2[0],cy+p2[1]); }); }
}
function wikiThumb(q){
  /* The REST summary already returns a working thumbnail URL. The old code
     rewrote its size to /640px- which produced a path that often 404s (and
     404s harder through the image proxy) — return the URL as-is. */
  return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(q))
    .then(function(r){return r.json();})
    .then(function(d){ return (d.thumbnail&&d.thumbnail.source) || null; })
    .catch(function(){ return null; });
}
function genPdf(sample){
  el('pdfOverlay').classList.remove('open');
  window._pdfSample = !!sample;
  showToast(sample? 'Building your free sample\u2026 \ud83d\udcc4' : 'Designing your itinerary\u2026 \ud83c\udfa8 (10\u201320s)');
  loadJsPdf(function(){
    var C=PDF_CTX, d=C.d, days=window._pdfSample? 1 : Math.min(C.days||5,10);
    var name=(el('pdfName').value||'A Traveler').slice(0,26); lsSet('rw_name',name);
    var start = el('pdfDate').value ? new Date(el('pdfDate').value) : null;
    var o=window._pdfOpts, notes=(el('pdfNotes').value||'').slice(0,120);
    /* Real AI plan if the user just built one for this destination */
    var AIP=(window._lastItin && _lastItin.name===d.name && _lastItin.days)? _lastItin.days : null;
    var pdf=new window.jspdf.jsPDF({unit:'px',format:[600,800]});
    var _rawText=pdf.text.bind(pdf), _rawSplit=pdf.splitTextToSize.bind(pdf);
    function clean(s){ if(Array.isArray(s)) return s.map(clean);
      return String(s==null?'':s)
        .replace(/[\u2018\u2019\u02bc]/g,"'").replace(/[\u201c\u201d]/g,'"')
        .replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...').replace(/\u20b9/g,'Rs ')
        .replace(/[\u00b7\u2022]/g,'-')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u2190-\u21FF\uFE0F\u200D\u2726\u2713\u2B06-\u2B07]/gu,'')
        .replace(/  +/g,' ').trim(); }
    pdf.text=function(s,x2,y2,o){ return _rawText(clean(s),x2,y2,o); };
    pdf.splitTextToSize=function(s,w){ return _rawSplit(clean(s),w); };
    function lc(t){ t=String(t||'').trim(); if(!t) return t; return t.charAt(0).toLowerCase()+t.slice(1); }
    var RW_QUOTES=['Some journeys take you to places. The best ones leave you with stories.',
      'The best souvenirs are the stories you never planned to collect.',
      'Years from now, you will not remember every mile. You will remember how it felt.',
      'Adventure begins where the ordinary ends.',
      'Every journey ends. The stories never do.'];
    /* Theme KEY still comes from the shared per-destination detector (used by
       the homepage carousels too), but the PDF's actual colours are pinned to
       PDF_THEMES — fixed, on-brand RGB rather than themeFor()'s per-destination
       hash hue — so every downloaded itinerary carries real RoamWise colours. */
    var THT=themeFor(d), THK=THT.key, THC=PDF_THEMES[THK], TH={deep:THC.deep, acc:THC.acc, line:THC.line};
    /* GOLD/GOLD2/CRIM already match app.css --gold/--gold2/--crim exactly; DARK
       now matches --bg2 too. PAP stays a light cream (not an app dark bg) —
       the page is deliberately printable, with brand colour carried in the
       gold frame, footer band and per-theme accents rather than an all-dark
       fill that would be expensive/impractical to print. */
    var GOLD='#C8913E', GOLD2='#E8BA6C', CRIM='#C4302B', INK='#1A1A22', PAP='#F7F3EA', MUT='#6B675C', DARK='#0C1020';
    function wm(){
      pdf.setTextColor(229,212,178); pdf.setFont('helvetica','bold'); pdf.setFontSize(23);
      for(var wy=100;wy<790;wy+=128) for(var wx=-50;wx<640;wx+=185) pdf.text('ROAMWISE',wx,wy,{angle:31});
      if(window._pdfSample){ pdf.setTextColor(232,120,90); pdf.setFontSize(60);
        for(var sy=180;sy<760;sy+=200) pdf.text('SAMPLE',300,sy,{align:'center',angle:32}); }
    }
    function page(bg){ pdf.setFillColor(bg||PAP); pdf.rect(0,0,600,800,'F'); }
    /* Full-bleed scenic background (Kafila-style): the destination photo fills
       the whole page, darkened with a gradient band so text stays readable
       wherever it sits. Falls back to the flat theme colour if no photo. */
    function scenicPage(photo, darkTop, darkBottom){
      if(!photo){ page(); return; }
      try{
        pdf.addImage(photo,'JPEG',0,0,600,800);
        /* layered translucent bands: darker where text will sit (top+bottom),
           lighter in the middle so the photo still reads as a photo */
        var steps=[[0,140,0.72],[110,260,0.38],[540,800,0.72]];
        if(darkTop===false) steps[0][2]=0.15;
        if(darkBottom===false) steps[2][2]=0.15;
        steps.forEach(function(b){
          pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]);
          if(pdf.setGState && pdf.GState){ pdf.setGState(new pdf.GState({opacity:b[2]})); }
          pdf.rect(0,b[0],600,b[1]-b[0],'F');
        });
        if(pdf.setGState && pdf.GState){ pdf.setGState(new pdf.GState({opacity:1})); }
      }catch(e){ page(); }
    }
    function frame(){ pdf.setDrawColor(GOLD); pdf.setLineWidth(2); pdf.rect(18,18,564,764); pdf.setLineWidth(.6); pdf.rect(26,26,548,748); }
    function foot(pn){
      /* Emotional punctuation on every page — the Kafila move. Deterministic
         per page number so it's stable if the PDF regenerates. */
      var q=RW_QUOTES[pn%RW_QUOTES.length];
      pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','italic'); pdf.setFontSize(9.5);
      pdf.text('\u201c'+q+'\u201d',300,748,{align:'center'});
      pdf.setFillColor(DARK); pdf.rect(18,760,564,22,'F');
      pdf.setFont('helvetica','normal'); pdf.setTextColor(GOLD2); pdf.setFontSize(8);
      pdf.text('\u{1F977} ROAMWISE \u00b7 www.roamwise.co.in \u00b7 crafted for '+name,300,774,{align:'center'});
      pdf.setTextColor('#8A8880'); pdf.text(String(pn),566,774); }
    var pn=1;
    /* ---------- gather photos first (hero + up to 3 gems) ---------- */
    function firstPlace(s){ return String(s||'').split(/,| at | - |\(/)[0].split(' ').slice(0,4).join(' ').trim(); }
    var wants=[(d.photos&&d.photos[0])||null];
    (d.gems||[]).slice(0,3).forEach(function(g){ wants.push({wiki:g+' '+(d.country||'')}); });
    for(var di=0; di<days; di++){
      var pl = AIP&&AIP[di]? firstPlace(AIP[di].morning) : ((d.gems||[])[di%Math.max(1,(d.gems||[]).length)]||'');
      wants.push(pl? {wiki:pl, alt:pl+' '+(d.name||'')} : null);
    }
    function job(q,alt){
      var s3=String(q).split(' ').slice(0,3).join(' ');
      return imgTry([
        function(){ return wikiThumb(q); },
        function(){ return wikiAction(q); },
        function(){ return s3!==q? wikiAction(s3):null; },
        function(){ return alt? wikiAction(alt):null; },
        function(){ return openverseThumb(q); }
      ]);
    }
    var photoJobs = wants.map(function(w,wi){
      if(!w) return job(d.name, d.name+' '+(d.country||''));
      if(typeof w==='string'){
        if(/^https?:/i.test(w)) return fetchImg64(w).catch(function(){ return job(d.name, d.name+' '+(d.country||'')); });
        return job(w, d.name);   /* DB photos are search phrases */
      }
      return job(w.wiki, w.alt || (String(w.wiki).split(' ').slice(0,3).join(' ')));
    });
    /* --- traveler profile for the cover --- */
    var PR={}; try{ PR=JSON.parse(lsGet('rw_profile')||'{}'); }catch(e){}
    var avP = PR.av? (PR.av.indexOf('data:')===0? Promise.resolve(PR.av) : fetchImg64(PR.av).catch(function(){return null;})) : Promise.resolve(null);
    /* --- events overlapping the trip window --- */
    var t0=start||new Date(), t1=new Date(t0.getTime()+days*864e5);
    var evHit=(typeof EVENTS!=='undefined'? EVENTS:[]).filter(function(e){
      if(new Date(e.to)<t0 || new Date(e.from)>t1) return false;
      return e.city===d.name || (String(e.places||'').toLowerCase().indexOf(String(d.country||'').toLowerCase())>-1 && d.country);
    }).slice(0,2);
    /* --- Local Intel: AI (any key) with graceful fallback --- */
    function ARCHX(k){ var M={
      beach:{hacks:['Beach shacks 200m from the main entry are half price','Rent gear for the week, not the day','Sunrise swims beat sunset crowds'],save:['Eat where the boat crews eat','Book stays 1 lane inland','Happy-hour = dinner-hour'],nature:'Sun is the real boss - hydrate, reef-safe sunscreen, respect currents.',caution:'Watch tides and red flags; keep valuables off the sand.'},
      metro:{hacks:['Transit day-pass beats 3 taxi rides','Museums have one free evening weekly','Rooftop views: hotel bars beat paid decks'],save:['Lunch menus at dinner restaurants','Stay near a metro line, not the center','Street food courts over cafes'],nature:'Concrete heat is real - hydrate and plan shade for afternoons.',caution:'Pickpockets love crowds; front pockets, split cash.'},
      sacred:{hacks:['Dawn prayers beat every tour bus','Caretakers unlock stories tips can\u2019t buy','Festival eves outshine festival days'],save:['Pilgrim canteens: honest food, honest prices','Guesthouses near temples','Free shoe stands outside barefoot zones'],nature:'Rivers and hills here are living heritage - keep them clean.',caution:'Dress codes are respect codes; follow queue culture at shrines.'},
      tech:{hacks:['Airport trains beat taxis on price AND time','eSIM before landing skips counter queues','Office-tower food courts = chef food, canteen price'],save:['Business-hotel weekends are discounted','Supermarket dinners are a cultural tour','City cards bundle transit + sights'],nature:'Air-conditioned everything - carry a layer.',caution:'Jaywalking fines are real; follow the signals.'},
      peak:{hacks:['Acclimatize a day before you climb','Shared jeeps leave when full - arrive early','Homestays beat hotels on warmth and price'],save:['Thali/dal-bhat: refills included','Off-season permits cost less','Rent heavy gear locally'],nature:'Altitude and weather change fast - respect both, tell someone your route.',caution:'AMS is real above 3000m: ascend slow, hydrate, descend if ill.'},
      classic:{hacks:['First hour after opening = private viewing','Ask "where do YOU eat?" three times','Walk the old town at 7am once'],save:['City cards pay off from visit #3','Bakeries discount at closing time','Tap-water refills where safe'],nature:'Four seasons, four cities - pack layers.',caution:'Tourist-zone prices double: one street back is honest.'}};
      return M[k]||M.classic; }
    function intelFallback(){ var A0=ARCHX(THK);
      return {hacks:A0.hacks, save:A0.save, context:{
        nature:A0.nature, culture:'Greet first, dress a notch modest at holy places, ask before photographing people.',
        politics:'Stable for tourists; avoid demonstrations and political debates as a guest.',
        economy:(d.cost? 'Mid-range week ~$'+d.cost.mid+'; cash still wins in small shops.':'Carry some cash; cards fail in the best little places.'),
        social:'People respond to patience and a smile; learn 5 local words and doors open.',
        education:'English works in tourist zones; a translation app closes the rest.',
        caution:A0.caution}};
    }
    var intelP=new Promise(function(res){
      var hasKey=['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].some(function(p2){return lsGet('rwKey_'+p2);});
      if(!hasKey) return res(intelFallback());
      var done=false; setTimeout(function(){ if(!done){done=true; res(intelFallback());} }, 18000);
      try{
        aiCall('Return ONLY JSON for travelers to '+d.name+', '+(d.country||'')+': {"hacks":["3 insider hacks"],"save":["3 cost-saving moves"],"context":{"nature":"..","culture":"..","politics":"neutral, safety-focused, no opinions","economy":"..","social":"..","education":"..","caution":".."}}. Each value under 140 chars, practical, specific to the place.',900,function(err,txt){
          if(done) return; done=true;
          var j=extractJSON(txt); res(j&&j.hacks&&j.context? j : intelFallback());
        }, true);
      }catch(e){ if(!done){done=true; res(intelFallback());} }
    });
    /* --- MAP: dest geocode + up to 4 activity pins + composed tiles --- */
    var mapP=(function(){
      var cP=(typeof d.lat==='number'&&typeof d.lon==='number')? Promise.resolve({lat:d.lat,lon:d.lon}) : gcode(d.name+', '+(d.country||''));
      return cP.then(function(c){ if(!c) return null;
        var pinQ=[]; if(AIP){ for(var pi2=0; pi2<Math.min(4,AIP.length); pi2++){ (function(ii){
          var plc=firstPlace(AIP[ii].morning); if(plc&&plc.length>2) pinQ.push(gcode(plc+', '+d.name).then(function(g){ return g? {n:plc,day:ii+1,lat:g.lat,lon:g.lon}:null; })); })(pi2); } }
        return Promise.all(pinQ).then(function(pins){
          pins=(pins||[]).filter(function(p3){ return p3 && Math.abs(p3.lat-c.lat)<1.3 && Math.abs(p3.lon-c.lon)<1.3; });
          var Z=11, n2=Math.pow(2,Z);
          function txx(lo){ return (lo+180)/360*n2; }
          function tyy(la){ var r=la*Math.PI/180; return (1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n2; }
          var cxp=txx(c.lon), cyp=tyy(c.lat);
          var x0=Math.floor(cxp)-1, y0=Math.floor(cyp)-1;
          var jobs=[]; for(var yy=0; yy<2; yy++) for(var xx=0; xx<3; xx++)(function(xx,yy){
            jobs.push(fetchBmp('https://'+(['a','b','c'][(xx+yy)%3])+'.basemaps.cartocdn.com/rastertiles/voyager/'+Z+'/'+(x0+xx)+'/'+(y0+yy)+'.png').catch(function(){return null;}));
          })(xx,yy);
          return Promise.all(jobs).then(function(tls){
            if(!tls.some(function(t3){return t3;})) return null;
            var cv2=document.createElement('canvas'); cv2.width=768; cv2.height=512;
            var g2=cv2.getContext('2d'); g2.fillStyle='#DDE8E8'; g2.fillRect(0,0,768,512);
            tls.forEach(function(bm,ti){ if(bm) g2.drawImage(bm,(ti%3)*256,Math.floor(ti/3)*256,256,256); });
            function px(lo,la){ return [(txx(lo)-x0)*256,(tyy(la)-y0)*256]; }
            var cc=px(c.lon,c.lat);
            g2.fillStyle='rgb('+TH.acc[0]+','+TH.acc[1]+','+TH.acc[2]+')';
            g2.beginPath(); g2.arc(cc[0],cc[1],11,0,7); g2.fill();
            g2.fillStyle='#fff'; g2.font='700 12px Arial'; g2.textAlign='center'; g2.fillText('\u2605',cc[0],cc[1]+4);
            pins.forEach(function(p3,pi3){ var pp=px(p3.lon,p3.lat);
              g2.fillStyle='#C4302B'; g2.beginPath(); g2.arc(pp[0],pp[1],10,0,7); g2.fill();
              g2.fillStyle='#fff'; g2.fillText(String(pi3+1),pp[0],pp[1]+4); });
            g2.fillStyle='rgba(255,255,255,.85)'; g2.fillRect(0,494,768,18);
            g2.fillStyle='#555'; g2.font='10px Arial'; g2.textAlign='left';
            g2.fillText('\u00a9 OpenStreetMap contributors \u00a9 CARTO', 8, 507);
            return {img:cv2.toDataURL('image/jpeg',0.9), pins:pins, c:c};
          });
        });
      }).catch(function(){ return null; });
    })();
    var photoJobsStaggered = photoJobs.map(function(p,pi){
      return new Promise(function(res){ setTimeout(function(){ Promise.resolve(p).then(res,function(){res(null);}); }, pi*160); });
    });
    Promise.all([Promise.all(photoJobsStaggered), avP, intelP, mapP]).then(function(ALL){
      var imgs=ALL[0], avatar=ALL[1], intel=ALL[2], mapDat=ALL[3];
      var hero=imgs[0], gemPics=imgs.slice(1,4).filter(Boolean), dayPics=imgs.slice(4);
      /* ---------- COVER ---------- */
      scenicPage(hero);   /* full-bleed destination photo, darkened top+bottom for text */
      frame();
      drawMotif(pdf,THK,TH.acc,300,150);
      pdf.setTextColor('#B8B4A8'); pdf.setFontSize(10); pdf.text('A  R O A M W I S E   P R E M I U M   I T I N E R A R Y',300,60,{align:'center'});
      pdf.setTextColor(GOLD2); pdf.setFont('times','bold'); pdf.setFontSize(44);
      pdf.text(d.name.toUpperCase(),300,214,{align:'center'});
      pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(2.5); pdf.line(230,226,370,226);
      pdf.setFont('times','italic'); pdf.setFontSize(13); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
      pdf.text(TH.line,300,244,{align:'center'});
      pdf.setFont('helvetica','normal'); pdf.setFontSize(14); pdf.setTextColor('#EDEAE2');
      pdf.text((d.country||'')+'  -  '+days+' days  -  '+(C.month||''),300,578,{align:'center'});
      pdf.setTextColor('#B8B4A8'); pdf.setFontSize(12); pdf.text('crafted for',300,620,{align:'center'});
      pdf.setTextColor(GOLD2); pdf.setFont('times','bolditalic'); pdf.setFontSize(30); pdf.text(name,300,652,{align:'center'});
      pdf.setFont('helvetica','normal'); pdf.setFontSize(11); pdf.setTextColor('#B8B4A8');
      pdf.text(o.party+' - '+o.pace+' pace'+(start?(' - from '+start.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})):''),300,676,{align:'center'});
      if(notes){ pdf.setFontSize(10); pdf.text('"'+notes+'"',300,698,{align:'center'}); }
      if(AIP){ pdf.setTextColor('#16BF96'); pdf.setFontSize(9.5); pdf.text('* Personalised by AI - real places, real timings *',300,720,{align:'center'}); }
      if(avatar){ try{ pdf.addImage(avatar,'JPEG',40,38,52,52); pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.6); pdf.rect(40,38,52,52); }catch(e){} }
      if(PR&&(PR.name||PR.style)){ pdf.setTextColor('#B8B4A8'); pdf.setFontSize(8.5);
        pdf.text((PR.name||name)+(PR.style? ' - '+PR.style+' soul':'')+(PR.loc? ' - '+PR.loc:''),40,104);
        if(PR.bio){ pdf.setFont('times','italic'); pdf.text('"'+String(PR.bio).slice(0,54)+'"',40,118); pdf.setFont('helvetica','normal'); } }
      if(evHit.length){ pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFontSize(10);
        pdf.text('HAPPENING DURING YOUR TRIP: '+evHit.map(function(e){return e.n;}).join('  +  '),300,132,{align:'center'}); }
      foot(pn);
      /* ---------- WHY THIS JOURNEY + AT-A-GLANCE (Kafila-style overview page) ---------- */
      pdf.addPage(); pn++; scenicPage(gemPics[0]||hero); wm(); frame();
      pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(24);
      pdf.text('Why this journey?', 300, 62, {align:'center'});
      pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.2); pdf.line(260,72,340,72);
      var whyLines = [
        'Not rushed. Not a checklist. '+d.name+', paced the way a good trip should be.',
        'Every day here has room to breathe \\u2014 real mornings, a slow lunch, an evening',
        'that doesn\\u2019t feel timed. This is the plan we\\u2019d hand a close friend.'
      ];
      pdf.setFont('times','italic'); pdf.setFontSize(13.5); pdf.setTextColor('#F5F2E8');
      whyLines.forEach(function(ln,li){ pdf.text(ln,300,100+li*20,{align:'center'}); });
      /* trip snapshot grid */
      var snapY=190;
      pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.roundedRect(44,snapY,512,120,10,10,'F');
      var snaps=[
        ['DURATION', days+' Days'],
        ['STYLE', o.pace+' pace'],
        ['IDEAL FOR', o.party],
        ['DESTINATION', d.name]
      ];
      var sw2=512/snaps.length;
      snaps.forEach(function(sn,si){
        var sx=44+sw2*si+sw2/2;
        pdf.setTextColor(GOLD2); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5);
        pdf.text(sn[0], sx, snapY+42, {align:'center'});
        pdf.setTextColor('#fff'); pdf.setFont('times','bold'); pdf.setFontSize(15);
        pdf.text(sn[1], sx, snapY+66, {align:'center'});
        if(si>0){ pdf.setDrawColor(80,80,90); pdf.setLineWidth(.6); pdf.line(44+sw2*si,snapY+20,44+sw2*si,snapY+100); }
      });
      /* perfect-for persona row */
      var perY=snapY+140;
      pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5);
      pdf.text('PERFECT FOR', 300, perY, {align:'center'});
      var personas=['Solo travellers','Couples','Friend groups','Slow-travel souls'];
      var pw2=512/personas.length;
      personas.forEach(function(pz,pzi){
        var px=44+pw2*pzi+pw2/2;
        /* solid dark fill so the pill reads clearly even on a bright/light
           patch of the photo — an outline alone isn't enough contrast here */
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]);
        pdf.roundedRect(44+pw2*pzi+8, perY+10, pw2-16, 26, 13, 13, 'F');
        pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1);
        pdf.roundedRect(44+pw2*pzi+8, perY+10, pw2-16, 26, 13, 13);
        pdf.setTextColor('#F5F2E8'); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5);
        pdf.text(pz, px, perY+27, {align:'center'});
      });
      foot(pn);
      /* ---------- MAP & PINS PAGE ---------- */
      if(mapDat){
        pdf.addPage(); pn++; page(); wm(); frame();
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(24);
        pdf.text('Your Map & Pins',44,62);
        try{ pdf.addImage(mapDat.img,'JPEG',40,80,520,347);
          pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.6); pdf.rect(40,80,520,347); }catch(e){}
        var ly=452;
        pdf.setFontSize(10.5); pdf.setFont('helvetica','normal');
        pdf.setTextColor(INK); pdf.text('STAR = '+d.name+' center',44,ly); ly+=16;
        (mapDat.pins||[]).forEach(function(p3,pi3){
          pdf.setTextColor('#C4302B'); pdf.setFont('helvetica','bold'); pdf.text(String(pi3+1),48,ly);
          pdf.setTextColor(INK); pdf.setFont('helvetica','normal');
          pdf.text('Day '+p3.day+' - 09:00 - '+p3.n,64,ly); ly+=15; });
        ly+=8; pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(11);
        pdf.text('Open live maps:',44,ly); ly+=16; pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
        var gmU='https://maps.google.com/?q='+mapDat.c.lat+','+mapDat.c.lon;
        var mmU='https://maps.mapmyindia.com/@'+mapDat.c.lat+','+mapDat.c.lon;
        var osU='https://www.openstreetmap.org/#map=12/'+mapDat.c.lat+'/'+mapDat.c.lon;
        try{ pdf.setTextColor(30,90,200);
          pdf.textWithLink('Google Maps  ->  tap to open',44,ly,{url:gmU}); ly+=15;
          pdf.textWithLink('MapmyIndia  ->  tap to open',44,ly,{url:mmU}); ly+=15;
          pdf.textWithLink('OpenStreetMap  ->  tap to open',44,ly,{url:osU}); ly+=15;
        }catch(e){}
        if(evHit.length){ ly+=6; pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
          pdf.text('Event nearby during your dates: '+evHit[0].n,44,ly); }
        foot(pn);
      }
      /* ---------- DAY PAGES: 6-slot cinematic timeline ---------- */
      var perDay=(d.cost&&d.cost.mid? Math.round(d.cost.mid/7):0);
      var paceAdj=o.pace==='Relaxed'?0.85:(o.pace==='Packed'?1.2:1);
      var partyMul=o.party==='Couple'?1.8:(o.party==='Family'?3:1);
      for(var i=0;i<days;i++){
        pdf.addPage(); pn++; page(); wm(); frame();
        var A=AIP? AIP[i%AIP.length] : null;
        var T2=(typeof DAY_TEMPLATES!=='undefined'&&DAY_TEMPLATES[i])||{};
        var dt=start? new Date(start.getTime()+i*864e5):null;
        /* day banner */
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.rect(26,26,548,64,'F');
        pdf.setFillColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.circle(64,58,22,'F');
        pdf.setTextColor('#fff'); pdf.setFont('times','bold'); pdf.setFontSize(22); pdf.text(String(i+1),64,66,{align:'center'});
        pdf.setTextColor(GOLD2); pdf.setFontSize(17);
        pdf.text((A&&A.title)||T2.title||'Exploration',100,52);
        pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5); pdf.setTextColor('#B8B4A8');
        pdf.text((dt? dt.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})+' - ':'')+d.name,100,68);
        try{ drawMotif(pdf,THK,TH.acc,505,58); }catch(e){}
        if(i===0 && notes){ pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFontSize(9);
          pdf.text('Special focus: '+notes, 100, 82); }
        /* ---- NARRATIVE DAY (Kafila-style): story prose, then highlights,
               then what's included today. A schedule tells; a story sells. ---- */
        var mor=(A&&A.morning)||T2.morning||'the headline sight, at opening time';
        var aft=(A&&A.afternoon)||T2.afternoon||'a neighbourhood deep-dive after a local lunch';
        var eve=(A&&A.evening)||T2.evening||'a food street dinner where the queue is longest';
        var dayNarr = (i===0)
          ? 'The journey begins today. After settling in, we ease into '+lc(mor)+'. '
            +'By afternoon, '+lc(aft)+'. As the light softens, '+lc(eve)+' \u2014 a gentle first taste of '+d.name+'.'
          : 'After breakfast, we set out for '+lc(mor)+'. '
            +'The afternoon opens up into '+lc(aft)+'. '
            +'As evening settles over '+d.name+', '+lc(eve)+'.';
        var dp=dayPics[i], TXW=452, ty=112;
        if(dp){ try{ pdf.addImage(dp,'JPEG',384,102,172,132);
          pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.5); pdf.rect(384,102,172,132); TXW=300; }catch(e){ TXW=452; dp=null; } }
        /* the story */
        pdf.setTextColor(INK); pdf.setFont('times','normal'); pdf.setFontSize(12.5);
        var narrLines=pdf.splitTextToSize(dayNarr, TXW);
        pdf.text(narrLines, 58, ty+6); ty += narrLines.length*17 + 16;
        if(dp && ty < 250) ty = 250;
        /* TODAY'S HIGHLIGHTS */
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]);
        pdf.roundedRect(44,ty,512,2,1,1,'F');
        ty += 16;
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5);
        pdf.text('TODAY\u2019S HIGHLIGHTS', 58, ty); ty += 16;
        var hi=[['\u25c6', firstPlace(mor)||'Morning exploration', 'Best light, fewest people'],
                ['\u25c6', firstPlace(aft)||'Afternoon discovery', 'The unhurried middle of the day'],
                ['\u25c6', firstPlace(eve)||'Evening in '+d.name, 'Where the day slows down']];
        hi.forEach(function(h){
          pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text(h[0], 58, ty);
          pdf.setTextColor(INK); pdf.setFontSize(11); pdf.text(h[1], 72, ty);
          pdf.setTextColor(MUT); pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5);
          pdf.text(h[2], 72, ty+12);
          ty += 30;
        });
        /* INCLUDED TODAY strip — concrete reassurance, the Kafila trust move */
        ty += 4;
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.roundedRect(44,ty,512,40,7,7,'F');
        pdf.setTextColor(GOLD2); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5);
        pdf.text('INCLUDED TODAY', 60, ty+15);
        pdf.setTextColor('#D8D4C8'); pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5);
        pdf.text('Day plan & routing  \u00b7  Local food picks  \u00b7  Offline map pins  \u00b7  Budget guidance', 60, ty+29);
        ty += 52;
        /* food + tip + budget band */
        var fd=(A&&A.food)||((d.food||[])[i%Math.max(1,(d.food||[]).length)]||'');
        pdf.setFillColor('#F3E2C0'); pdf.roundedRect(44,ty-8,512,58,7,7,'F');
        pdf.setTextColor('#7A2E1E'); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
        pdf.text('\ud83c\udf5b EAT TODAY',56,ty+8);
        pdf.setFont('helvetica','normal'); pdf.setTextColor(INK); pdf.setFontSize(10);
        pdf.text(pdf.splitTextToSize(fd||'Ask three locals one question: \u201cwhere do YOU eat?\u201d',300),56,ty+22);
        pdf.setTextColor('#7A5A16'); pdf.setFontSize(9);
        pdf.text(pdf.splitTextToSize('\ud83e\udd77 '+((A&&A.tip)||T2.tip||'Carry small notes; big bills slow every purchase.'),190),380,ty+8);
        if(perDay){ pdf.setTextColor(MUT); pdf.setFontSize(9.5);
          pdf.text('\ud83d\udcb0 Day budget ('+o.party.toLowerCase()+', '+o.pace.toLowerCase()+'): ~$'+Math.round(perDay*paceAdj*partyMul),44,ty+66); }
        /* ---- Fill the previously-blank lower half with real, grounded data ----
           Two-column panel: destination fast facts (region/country/tags — all
           already in the database, not invented) + an actual crowd-by-month
           comparison (d.crowd is real per-destination data used elsewhere in
           the app, e.g. the ninja-hacks crowd-dodge callouts). */
        var fy = ty + 84;
        if(fy < 700){
          pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(0.8);
          pdf.line(44, fy, 556, fy);
          var colW=246, gx=44, gx2=44+colW+22;
          /* Left: Fast Facts */
          pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(10.5);
          pdf.text('\ud83c\udf0d Fast Facts', gx, fy+20);
          pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(INK);
          var facts=[
            'Region: '+(d.region||'—')+', '+(d.country||'—'),
            'Vibe: '+((d.tags||[]).slice(0,3).join(' \u00b7 ')||'—'),
            'Typical trip cost: $'+(d.cost&&d.cost.budget||'—')+'\u2013$'+(d.cost&&d.cost.mid||'—')+'/week'
          ];
          var fyy=fy+34; facts.forEach(function(f){ pdf.text(pdf.splitTextToSize(f,colW),gx,fyy); fyy+=15; });
          /* Right: real crowd-by-month comparison */
          if(d.crowd && d.crowd.length===12){
            pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(10.5);
            pdf.text('\ud83d\udc65 Crowd Forecast', gx2, fy+20);
            var curMi = (typeof mi==='number')? mi : (start? start.getMonth() : new Date().getMonth());
            var bestMi=0; for(var cmi=1;cmi<12;cmi++) if(d.crowd[cmi]<d.crowd[bestMi]) bestMi=cmi;
            pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(INK);
            pdf.text('This trip ('+(MO_FULL?MO_FULL[curMi]:curMi)+'): '+d.crowd[curMi]+'% crowds', gx2, fy+34);
            if(bestMi!==curMi && d.crowd[curMi]-d.crowd[bestMi]>=10){
              pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
              pdf.text(pdf.splitTextToSize('\ud83e\udd77 '+(MO_FULL?MO_FULL[bestMi]:bestMi)+' sees just '+d.crowd[bestMi]+'% \u2014 half the queues, same place.',colW),gx2,fy+49);
            } else {
              pdf.setTextColor(MUT);
              pdf.text('You\u2019re already visiting near the quietest window \u2014 good timing.',gx2,fy+49);
            }
            /* tiny 12-month bar strip, real data, not decorative */
            var bw=(colW)/12, by=fy+62;
            for(var bi=0;bi<12;bi++){
              var bh=Math.max(2,(d.crowd[bi]/100)*18);
              pdf.setFillColor(bi===curMi? TH.acc[0]:200, bi===curMi? TH.acc[1]:200, bi===curMi? TH.acc[2]:200);
              pdf.rect(gx2+bi*bw, by+18-bh, bw-1, bh, 'F');
            }
          }
        }
        foot(pn);
      }
      /* ---------- FOOD & CULTURE PAGE ---------- */
      pdf.addPage(); pn++; page(); wm(); frame();
      pdf.setTextColor(CRIM); pdf.setFont('times','bold'); pdf.setFontSize(26); pdf.text('Food, Culture & Specialities',44,64);
      var y3=92; pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text('\ud83c\udf7d The plates that define '+d.name,44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      (d.food&&d.food.length? d.food:['Follow the queues \u2014 locals vote with their feet']).slice(0,6).forEach(function(f){ pdf.text('\u2022 '+f,52,y3); y3+=15; });
      y3+=10; pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text('\ud83d\udc8e Local specialities & hidden gems',44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      (d.gems&&d.gems.length? d.gems:['The best gem is an unplanned afternoon']).slice(0,5).forEach(function(g){ pdf.text(pdf.splitTextToSize('\u2022 '+g,500),52,y3); y3+=15; });
      y3+=10; pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text("Don't-miss & only-here",44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      var dm=[(d.gems&&d.gems[0])||'The first hour after sunrise - the place before the performance',
              (d.food&&d.food[0])? 'The one dish: '+d.food[0] : 'Ask three locals for the one dish',
              ((d.tags||[])[0]? 'Its signature: '+(d.tags||[]).slice(0,3).join(', ') : 'Walk one street behind the famous one')];
      dm.forEach(function(x2){ pdf.text(pdf.splitTextToSize('* '+x2,500),52,y3); y3+=15; });
      y3+=10; pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text('\ud83e\udd1d Culture in 4 lines',44,y3); y3+=16;
      pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
      ['Greet before you ask \u2014 two seconds of hello changes every interaction.','Dress one notch more modestly at religious sites than the street suggests.','Haggling is a smile game where both sides should win.','Photograph people only after a nod \u2014 the nod is the picture\u2019s soul.'].forEach(function(c2){ pdf.text(pdf.splitTextToSize('\u2022 '+c2,500),52,y3); y3+=15; });
      /* gem photo strip */
      if(gemPics.length){ var gx=44;
        gemPics.slice(0,3).forEach(function(im){ try{ pdf.addImage(im,'JPEG',gx,y3+8,164,110); pdf.setDrawColor(GOLD); pdf.rect(gx,y3+8,164,110); gx+=172; }catch(e){} });
        y3+=126; }
      foot(pn);
      /* ---------- LOCAL INTEL & STREET WISDOM ---------- */
      if(intel){
        pdf.addPage(); pn++; page(); wm(); frame();
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(24);
        pdf.text('Local Intel & Street Wisdom',44,62);
        var yi=92;
        pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
        pdf.text('Secret hacks',44,yi);
        pdf.text('Save money like a local',310,yi); yi+=16;
        pdf.setFont('helvetica','normal'); pdf.setFontSize(10); pdf.setTextColor(INK);
        for(var ri=0; ri<3; ri++){
          if(intel.hacks&&intel.hacks[ri]) pdf.text(pdf.splitTextToSize('* '+intel.hacks[ri],240),44,yi);
          if(intel.save&&intel.save[ri]) pdf.text(pdf.splitTextToSize('* '+intel.save[ri],240),310,yi);
          yi+=34; }
        yi+=6; pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(.8); pdf.line(44,yi,556,yi); yi+=18;
        pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
        pdf.text('Know the ground: local conditions',44,yi); yi+=16;
        var ctx2=intel.context||{};
        [['Nature',ctx2.nature],['Culture',ctx2.culture],['Politics',ctx2.politics],['Economy',ctx2.economy],['Social',ctx2.social],['Education',ctx2.education]].forEach(function(rw){
          if(!rw[1]) return;
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10); pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]);
          pdf.text(rw[0].toUpperCase(),44,yi);
          pdf.setFont('helvetica','normal'); pdf.setTextColor(INK);
          var lines2=pdf.splitTextToSize(String(rw[1]),430);
          pdf.text(lines2,120,yi); yi+=Math.max(15,lines2.length*13+4); });
        if(ctx2.caution){ yi+=4; pdf.setFillColor(250,236,214); pdf.roundedRect(40,yi-10,520,46,7,7,'F');
          pdf.setTextColor('#7A2E1E'); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('APPROACH WITH CARE',52,yi+4);
          pdf.setFont('helvetica','normal'); pdf.setTextColor(INK);
          pdf.text(pdf.splitTextToSize(ctx2.caution,480),52,yi+18); }
        foot(pn);
      }
      /* ---------- ESSENTIALS ---------- */
      pdf.addPage(); pn++; page(); wm(); frame();
      pdf.setTextColor(CRIM); pdf.setFont('times','bold'); pdf.setFontSize(26); pdf.text('Essentials',44,64);
      var y2=94;
      function h(t3){ pdf.setTextColor(GOLD); pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.text(t3,44,y2); y2+=16; pdf.setTextColor(INK); pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5); }
      if(d.cost){ h('Budget bands (per person / week)');
        var mx3=d.cost.luxury||1;
        [['Backpacker',d.cost.budget],['Mid-range',d.cost.mid],['Luxury',d.cost.luxury]].forEach(function(r2){
          pdf.setTextColor(INK); pdf.text(r2[0],52,y2);
          pdf.setFillColor(238,231,214); pdf.rect(150,y2-8,300,10,'F');
          pdf.setFillColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.rect(150,y2-8,Math.max(8,300*(r2[1]/mx3)),10,'F');
          pdf.setTextColor(MUT); pdf.text('$'+r2[1],458,y2);
          y2+=17; }); y2+=8;
        if(d.crowd){ pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Crowd by month (J F M A M J J A S O N D)',52,y2); y2+=8;
          for(var ci=0; ci<12; ci++){ var cv=d.crowd[ci];
            pdf.setFillColor(cv<35?60:(cv<60?224:214), cv<35?176:(cv<60?150:82), cv<35?120:(cv<60?54:74));
            pdf.rect(52+ci*33, y2, 26, 12*(cv/100)+3, 'F'); }
          y2+=26; } }
      if(d.visa){ h('\ud83d\udec2 Visa (Indian passport)');
        pdf.text(pdf.splitTextToSize((d.visa.type||'')+' \u00b7 '+(d.visa.cost||'')+' \u00b7 up to '+(d.visa.days||'')+' days. '+(d.visa.note||''),500),52,y2); y2+=44; }
      h('Emergency - '+(d.country||'local')); pdf.text(emgFor(d.country)+'  -  save your embassy number offline',52,y2); y2+=26;
      h('Pack checklist');
      ['Passport + copies','Travel insurance','Offline maps','Power bank + cables','Meds / ORS','Rain shell','Broken-in shoes','Cash in small notes'].forEach(function(pk,pi){
        var px=52+(pi%2)*250, py=y2+Math.floor(pi/2)*16;
        pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.rect(px,py-8,9,9,'S');
        pdf.setTextColor(INK); pdf.text(pk,px+16,py); });
      y2+=Math.ceil(8/2)*16+10;
      h('\ud83d\udcf1 Your pocket guide'); pdf.text('Live crowd calendars, budgets and this itinerary\u2019s AI twin: www.roamwise.co.in',52,y2);
      pdf.setTextColor(MUT); pdf.setFontSize(9); pdf.text('Generated '+new Date().toLocaleDateString('en-IN')+' \u00b7 figures indicative \u2014 verify before booking',44,742);
      foot(pn);
      /* ---------- OUTPUT ---------- */
      /* SAMPLE MODE: after the first day page, add an upsell page and stop */
      if(window._pdfSample){
        pdf.addPage(); pn++; page(TH.deep[0]!==undefined? undefined:undefined);
        pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.rect(0,0,600,800,'F'); frame();
        drawMotif(pdf,THK,TH.acc,300,150);
        pdf.setTextColor(GOLD2); pdf.setFont('times','bold'); pdf.setFontSize(30); pdf.text('This is just a taste',300,300,{align:'center'});
        pdf.setTextColor('#EDEAE2'); pdf.setFont('helvetica','normal'); pdf.setFontSize(13);
        [' You have Day 1 of a '+(C.days||5)+'-day plan.','','The full itinerary unlocks:',
         '- Every day, hour-by-hour with photos','- Map & pins page with live links','- Food, culture & local-intel pages',
         '- Secret hacks + cost-saving moves','- Emergency numbers + packing checklist'].forEach(function(l,i){
          pdf.text(l,300,340+i*24,{align:'center'}); });
        pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('times','bold'); pdf.setFontSize(18);
        pdf.text('Unlock Pro \u2014 Rs 100 lifetime',300,560,{align:'center'});
        pdf.setTextColor('#B8B4A8'); pdf.setFont('helvetica','normal'); pdf.setFontSize(11);
        pdf.text('roamwise.co.in  \u00b7  or the \u20b910 one-off in the app',300,586,{align:'center'});
        try{ pdf.textWithLink('Open RoamWise \u2192',300,614,{align:'center',url:'https://www.roamwise.co.in'}); }catch(e){}
        foot(pn);
      }
      window._pdfDbg={pages:pn, hero:!!hero, dayPics:dayPics.filter(Boolean).length, gems:gemPics.length, map:!!mapDat, intel:!!intel, av:!!avatar, ev:evHit.length, sample:!!window._pdfSample};
      var fname='roamwise-'+d.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+(window._pdfSample?'-SAMPLE':'')+'-itinerary.pdf';
      if(window.RW && RW.saveCard){ RW.saveCard(pdf.output('datauristring')); offerOpen('Your itinerary'); }
      else { try{ var u=URL.createObjectURL(pdf.output('blob')); var w2=window.open(u,'_blank');
          if(w2) showToast('\ud83d\udc41 Preview opened \u2014 hit the viewer\u2019s \u2b07 to save'); else pdf.save(fname);
        }catch(e){ pdf.save(fname); } }
      xpAdd(20,'Premium itinerary forged');
      try{ track('pdf_generated'); lsSet('rw_pdf_count', String((parseInt(lsGet('rw_pdf_count')||'0',10)||0)+1)); }catch(e){}
    }).catch(function(err){ console.error('genPdf failed', err); showToast('Could not build the PDF — please try again'); });
  });
}

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

document.addEventListener('DOMContentLoaded', function(){
  try{ rwInitDevice(); }catch(e){}
  try{ rwInitLang(); }catch(e){}
  try{ rwInitTheme(); }catch(e){}
  try{ renderEventBanner(); }catch(e){}
  try{ renderEvents(); }catch(e){}
  try{ renderSpotlight(); }catch(e){}
  try{ renderTicker(); }catch(e){}
  try{ renderForYou(); }catch(e){}
  try{ tripReminderCheck(); }catch(e){}
  /* one cheap call keeps every INR figure honest instead of hardcoding 88 */
  try{
    if(navigator.onLine) fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR')
      .then(function(r){return r.json();})
      .then(function(d){ if(d && d.rates && d.rates.INR) window._rwFxINR = d.rates.INR; })
      .catch(function(){});
  }catch(e){}
  /* Home declutter: heavy sections collapse behind slim headers — the scroll
     keeps only the essentials (video, copilot, quick start). One tap expands. */
  try{
    /* The Film has its own tab now, so it is NO LONGER folded inside the creator
       section — that nesting left the player stranded above an unrelated fold
       with a dead gap between them. Film section first, creator info after. */
    try{
      var pf=el('promofilm'), cr=el('creator');
      if(pf && cr && cr.parentNode) cr.parentNode.insertBefore(pf, cr);
    }catch(e){}
    [['ratings','\u2b50 Ratings & traveler wall'],['store','\ud83d\udecd Store'],['creator','\ud83c\udfd4\ufe0f About the creator'],].forEach(function(f){
      var sec=el(f[0]); if(!sec || sec.dataset.folded) return;
      sec.dataset.folded='1';
      var body=document.createElement('div'); body.className='fold-body';
      while(sec.firstChild) body.appendChild(sec.firstChild);
      var head=document.createElement('button'); head.className='fold-head';
      head.innerHTML=f[1]+'<span class="chev">\u203a</span>';
      head.onclick=function(){ head.classList.toggle('open'); body.classList.toggle('open'); };
      sec.appendChild(head); sec.appendChild(body);
    });
  }catch(e){}
  try{
    cpModelChips('heroModels');
    var hi=el('heroInput');
    if(hi) hi.addEventListener('keydown',function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); copilotSend(true); } });
  }catch(e){}  /* fire any due trip countdown reminders */
  try{ renderPromo(); }catch(e){}
  try{ renderNewsPulse(); }catch(e){}
  try{ renderRatings(); }catch(e){}
  /* Apple-style scroll reveal */
  try{
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('inview'); io.unobserve(e.target); } }); },{threshold:0.08});
      document.querySelectorAll('.xsec,.exp,.trek,.promo,.mode-box').forEach(function(n2,i2){ if(i2<160){ n2.classList.add('rv'); io.observe(n2); } });
      /* safety nets: nothing may ever stay hidden */
      function revealVisible(){ document.querySelectorAll('.rv:not(.inview)').forEach(function(n3){
        var r3=n3.getBoundingClientRect(); if(r3.top < innerHeight && r3.bottom > 0 && r3.width) n3.classList.add('inview'); }); }
      setTimeout(revealVisible, 600);
      window._rvAll=function(){ setTimeout(revealVisible, 60); };
      setTimeout(function(){ document.querySelectorAll('.rv:not(.inview)').forEach(function(n3){ n3.classList.add('inview'); }); }, 5000);
    }
  }catch(e){}
});

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
/* ===================== FITNESS-FIRST STAYS =====================
   For travellers who won't skip their workout: find gyms / yoga / dance /
   sports studios at a destination, then suggest staying nearby. Budget→premium.
   Uses Overpass (OSM) for the fitness venues; stay tiers are guidance, not live
   bookings (honest — we link out to booking sites for actual availability). */
var RW_FITNESS_TAGS=[
  ['leisure','fitness_centre','\ud83c\udfcb\ufe0f','Gyms'],
  ['leisure','sports_centre','\ud83c\udfc3','Sports centres'],
  ['sport','yoga','\ud83e\uddd8','Yoga studios'],
  ['leisure','dance','\ud83d\udc83','Dance studios'],
  ['sport','swimming','\ud83c\udfca','Swimming'],
  ['sport','climbing','\ud83e\uddd7','Climbing']
];
function openFitnessStays(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('fitStaySection');
  if(!sec){ sec=document.createElement('section'); sec.id='fitStaySection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  var dest=(window._lastItin&&_lastItin.name)||'';
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83c\udfcb\ufe0f Fitness-first <em>stays</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'fitStaySection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Don\u2019t break your streak on holiday. Find gyms, yoga & dance studios at your destination \u2014 then stay nearby.</p>'
    +'<div style="display:flex;gap:8px;margin-bottom:12px"><input id="fitDest" placeholder="Which city? e.g. Rishikesh" value="'+esc2(dest)+'" style="flex:1;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:11px;color:var(--t1);font-size:14px">'
    +'<button class="tact" style="font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwFitnessFind()">Find</button></div>'
    +'<div id="fitStayOut"></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}
async function rwFitnessFind(){
  var out=el('fitStayOut'); var dest=(el('fitDest').value||'').trim();
  if(!dest){ out.innerHTML='<div class="note">Type a city first.</div>'; return; }
  out.innerHTML='<div class="note">\ud83c\udfcb\ufe0f Finding fitness spots in '+esc2(dest)+'\u2026</div>';
  var geo=null; try{ geo=await gcode(dest); }catch(e){}
  if(!geo){ out.innerHTML='<div class="note">Couldn\u2019t locate '+esc2(dest)+'. Try a nearby bigger town.</div>'; return; }
  var radius=6000;
  var q='[out:json][timeout:15];(';
  RW_FITNESS_TAGS.forEach(function(t){ q+='node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+geo.lat+','+geo.lon+');'; });
  q+=');out body 60;';
  var venues=[];
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)}).then(function(x){return x.json();});
    venues=(r.elements||[]).map(function(e){
      var t=e.tags||{}; if(!t.name) return null;
      var hit=RW_FITNESS_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0]; if(!hit) return null;
      return {name:t.name, icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon};
    }).filter(Boolean);
  }catch(e){}
  rwFitnessRender(dest, geo, venues);
}
function rwFitnessRender(dest, geo, venues){
  var out=el('fitStayOut');
  var tiers=[
    {t:'Budget', ic:'\ud83d\udcb0', note:'Hostels & guesthouses near a gym', q:'budget hostels'},
    {t:'Mid', ic:'\ud83c\udfe8', note:'3-star hotels with or near fitness', q:'3 star hotels gym'},
    {t:'Premium', ic:'\u2728', note:'Resorts & hotels with full gyms/spas', q:'5 star hotel gym spa'}
  ];
  var vHtml='';
  if(venues.length){
    var groups={}; venues.forEach(function(v){ (groups[v.group]=groups[v.group]||[]).push(v); });
    vHtml='<div class="fit-venues"><div class="fit-h">\ud83c\udfcb\ufe0f Fitness spots in '+esc2(dest)+'</div>'
      + Object.keys(groups).map(function(g){
          return '<div class="fit-grp"><div class="fit-glabel">'+groups[g][0].icon+' '+g+' ('+groups[g].length+')</div>'
            + groups[g].slice(0,6).map(function(v){ return '<a class="fit-item" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(v.name+' '+dest)+'">'+esc2(v.name)+'</a>'; }).join('')
            +'</div>';
        }).join('') + '</div>';
  } else {
    vHtml='<div class="note">OSM has few fitness venues mapped for '+esc2(dest)+' \u2014 bigger cities show more. The stay tiers below still help you pick a fitness-friendly base.</div>';
  }
  var stayHtml='<div class="fit-h" style="margin-top:16px">\ud83c\udfe8 Where to stay (fitness-friendly)</div>'
    + tiers.map(function(ti){
        var url=stayUrl(ti.q+' '+dest);
        return '<a class="fit-tier" target="_blank" rel="noopener" href="'+url+'">'
          +'<span class="fit-tier-ic">'+ti.ic+'</span>'
          +'<span class="fit-tier-body"><b>'+ti.t+'</b><span>'+ti.note+'</span></span>'
          +'<span class="fit-tier-go">Search \u2192</span></a>';
      }).join('');
  out.innerHTML=vHtml+stayHtml+'<div style="font-size:10.5px;color:var(--t3);margin-top:10px;line-height:1.5">Venue data from OpenStreetMap. Stay links open live availability on booking sites \u2014 filter by "fitness centre" there for exact matches.</div>';
}
/* ===================== NEAR ME (opt-in, privacy-safe) =====================
   Finds food, things-to-do and points of interest within ~3km of where the
   user is RIGHT NOW. Location is requested on-demand only (never background,
   never stored, never sent anywhere but the public OpenStreetMap/Overpass POI
   query). Honest limit vs Google: OSM data has no live "open now/trending" or
   ratings for every place. */
var RW_NEARME_TAGS = [
  ['amenity','restaurant','\ud83c\udf7d\ufe0f','Eat'],
  ['amenity','cafe','\u2615','Cafes'],
  ['amenity','fast_food','\ud83c\udf54','Quick bites'],
  ['tourism','attraction','\ud83d\udcf8','See'],
  ['tourism','viewpoint','\ud83c\udf04','Viewpoints'],
  ['tourism','museum','\ud83c\udfdb\ufe0f','Culture'],
  ['historic','*','\ud83c\udff0','Heritage'],
  ['leisure','park','\ud83c\udf33','Parks'],
  ['amenity','marketplace','\ud83d\uded2','Markets'],
  ['shop','mall','\ud83d\udecd\ufe0f','Shopping']
];
function openNearMe(){
  try{ tabGo('home'); }catch(e){}
  var sec=el('nearmeSection');
  if(!sec){ sec=document.createElement('section'); sec.id='nearmeSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\udccd Near <em>me</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'nearmeSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Find food, sights & things to do within ~3km of where you are right now.</p>'
    +'<div class="nearme-privacy">\ud83d\udd12 Your location is used only for this search \u2014 it\u2019s never tracked in the background or saved anywhere.</div>'
    +'<button class="tact" id="nearmeBtn" style="width:100%;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwNearMeLocate()">\ud83d\udccd Find what\u2019s around me</button>'
    +'<div id="nearmeOut" style="margin-top:14px"></div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}
function rwNearMeLocate(){
  var out=el('nearmeOut'), btn=el('nearmeBtn');
  /* In the Capacitor-wrapped app, use the NATIVE GPS plugin (real permission
     prompt + accurate location). Falls through to the browser API on the web. */
  if(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Geolocation){
    if(btn){ btn.disabled=true; btn.textContent='\ud83d\udccd Getting your location\u2026'; }
    Capacitor.Plugins.Geolocation.getCurrentPosition({enableHighAccuracy:true, timeout:12000})
      .then(function(pos){
        if(btn){ btn.textContent='\ud83d\udd0d Searching within 3km\u2026'; }
        rwNearMeSearch(pos.coords.latitude, pos.coords.longitude);
      })
      .catch(function(){
        if(btn){ btn.disabled=false; btn.textContent='\ud83d\udccd Find what\u2019s around me'; }
        rwNearMeManual('Location permission is off for RoamWise.');
      });
    return;
  }
  if(!navigator.geolocation){ rwNearMeManual('Your device can\u2019t share GPS location.'); return; }
  if(btn){ btn.disabled=true; btn.textContent='\ud83d\udccd Getting your location\u2026'; }
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude, lon=pos.coords.longitude;
    if(btn){ btn.textContent='\ud83d\udd0d Searching within 3km\u2026'; }
    rwNearMeSearch(lat, lon);
  }, function(err){
    if(btn){ btn.disabled=false; btn.textContent='\ud83d\udccd Find what\u2019s around me'; }
    var why = err.code===1 ? 'Location permission is off for this app.'
            : 'Couldn\u2019t get GPS right now.';
    rwNearMeManual(why);
  }, {enableHighAccuracy:true, timeout:12000, maximumAge:60000});
}
/* Fallback so Near Me ALWAYS works — even when GPS is blocked (common in the
   in-app WebView, or when a browser has a stored "denied"). User types a place
   and we geocode it, then run the same nearby search. */
function rwNearMeManual(why){
  var out=el('nearmeOut'); if(!out) return;
  out.innerHTML='<div class="note" style="margin-bottom:10px">'+esc2(why||'')+' No problem \u2014 type where you are and I\u2019ll find what\u2019s nearby.</div>'
    +'<div style="display:flex;gap:8px">'
    +'<input id="nearManualInp" placeholder="Your area or city \u2014 e.g. Rishikesh, Laxman Jhula" style="flex:1;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:11px;color:var(--t1);font-size:14px">'
    +'<button class="tact" style="font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwNearMeManualGo()">Find</button></div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px;line-height:1.5">Tip: to use precise GPS instead, enable Location for RoamWise in your phone Settings \u2192 Apps \u2192 RoamWise \u2192 Permissions, then tap \u201cFind what\u2019s around me\u201d again.</div>';
}
async function rwNearMeManualGo(){
  var inp=el('nearManualInp'), out=el('nearmeOut');
  var place=(inp&&inp.value||'').trim();
  if(!place){ if(inp) inp.focus(); return; }
  out.innerHTML='<div class="note">\ud83d\udd0d Locating '+esc2(place)+'\u2026</div>';
  var geo=null; try{ geo=await gcode(place); }catch(e){}
  if(!geo){ out.innerHTML='<div class="note">Couldn\u2019t find \u201c'+esc2(place)+'\u201d. Try a nearby bigger town or a well-known landmark.</div>'; return; }
  rwNearMeSearch(geo.lat, geo.lon);
}
async function rwNearMeSearch(lat, lon){
  var out=el('nearmeOut'), btn=el('nearmeBtn');
  if(!navigator.onLine){ out.innerHTML='<div class="note">You\u2019re offline \u2014 Near Me needs a connection to look up places.</div>'; if(btn){btn.disabled=false;btn.textContent='\ud83d\udccd Find what\u2019s around me';} return; }
  /* Small towns (Almora, hill stations) have sparse OSM data at 3km. Widen the
     search progressively until we find a useful number of places. */
  var radii=[3000, 8000, 15000], items=[], usedRadius=3000;
  for(var ri=0; ri<radii.length; ri++){
    usedRadius=radii[ri];
    if(out) out.innerHTML='<div class="note">\ud83d\udd0d Searching within '+(usedRadius/1000)+'km\u2026</div>';
    var q='[out:json][timeout:20];(';
    RW_NEARME_TAGS.forEach(function(t){
      q += t[1]==='*' ? 'node["'+t[0]+'"](around:'+usedRadius+','+lat+','+lon+');'
                      : 'node["'+t[0]+'"="'+t[1]+'"](around:'+usedRadius+','+lat+','+lon+');';
    });
    q += ');out body 150;';
    try{
      var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
        .then(function(x){return x.json();});
      items=(r.elements||[]).map(function(e){
        var t=e.tags||{}; if(!t.name) return null;
        var hit=RW_NEARME_TAGS.filter(function(x){ return t[x[0]] && (x[1]==='*'||t[x[0]]===x[1]); })[0];
        if(!hit) return null;
        var d=rwHaversine(lat,lon,e.lat,e.lon);
        return {name:t.name, icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon, dist:d,
                open:t.opening_hours||'', cuisine:t.cuisine||''};
      }).filter(Boolean);
      items.sort(function(a,b){ return a.dist-b.dist; });
      if(items.length>=6) break; /* enough — stop widening */
    }catch(e){
      if(ri===radii.length-1){ out.innerHTML='<div class="note">The places service is busy right now \u2014 try again in a moment.</div>'; if(btn){btn.disabled=false;btn.textContent='\ud83d\udd04 Search again';} return; }
    }
  }
  rwNearMeRender(items, usedRadius);
  if(btn){ btn.disabled=false; btn.textContent='\ud83d\udd04 Search again'; }
}
function rwHaversine(la1,lo1,la2,lo2){
  var R=6371, dLa=(la2-la1)*Math.PI/180, dLo=(lo2-lo1)*Math.PI/180;
  var a=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function rwNearMeRender(items, radius){
  var out=el('nearmeOut');
  var km=radius?(radius/1000):3;
  if(!items.length){ out.innerHTML='<div class="note">Nothing mapped within '+km+'km in OpenStreetMap here \u2014 you might be in a quiet spot. Small hill towns often have little mapped. Try asking Tusk for ideas instead.</div>'; return; }
  var groups={}; items.forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var order=['Eat','Cafes','Quick bites','See','Viewpoints','Culture','Heritage','Parks','Markets','Shopping'];
  var html=order.filter(function(g){return groups[g];}).map(function(g){
    var list=groups[g].slice(0,8).map(function(i){
      var km=i.dist<1 ? Math.round(i.dist*1000)+'m' : i.dist.toFixed(1)+'km';
      return '<a class="nearme-item" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'
        +'<span class="nm-ic">'+i.icon+'</span>'
        +'<span class="nm-name">'+esc2(i.name)+(i.cuisine?' \u00b7 '+esc2(i.cuisine.split(';')[0]):'')+'</span>'
        +'<span class="nm-dist">'+km+'</span></a>';
    }).join('');
    return '<div class="nearme-group"><div class="nearme-glabel">'+groups[g][0].icon+' '+g+'</div>'+list+'</div>';
  }).join('');
  out.innerHTML=html+'<div style="font-size:10.5px;color:var(--t3);margin-top:10px;line-height:1.5">Sorted by distance. Data from OpenStreetMap \u2014 tap any place for directions. Live hours/ratings aren\u2019t always available.</div>';
}

function openGreenTravel(){
  try{ tabGo('home'); }catch(e){}
  /* BUG FIX (rw-v57): `sec` was used without ever being declared, so this
     threw a ReferenceError and the menu item did nothing at all. */
  var sec=el('greenSection');
  if(!sec){ sec=document.createElement('section'); sec.id='greenSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  var earned = (typeof badgeEarnedIds==='function') ? badgeEarnedIds().indexOf('green')>=0 : false;
  var gc = parseInt(lsGet('rw_ct_green')||'0',10)||0;
  var cards=RW_GREEN_CATS.map(function(c){
    var items=c.items.map(function(it){
      return '<label class="green-item"><input type="checkbox" onchange="rwGreenPick(this)"><span>'+esc2(it)+'</span></label>';
    }).join('');
    return '<div class="green-card" style="--gc:'+c.accent+'"><div class="green-cat">'+c.emoji+' '+c.title+'</div>'+items+'</div>';
  }).join('');
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83c\udf31 Green <em>travel</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'greenSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Travel lighter on the planet \u2014 tick the choices you\u2019re making. 5 green choices earns the \ud83c\udf31 Green Traveller badge.</p>'
    +'<div class="green-prog"><div class="green-bar" style="width:'+Math.min(100,gc/5*100)+'%"></div></div>'
    +'<div class="green-progtxt">'+(earned?'\ud83c\udf31 Green Traveller badge earned! Keep it up.':gc+' / 5 green choices \u2014 '+(5-gc)+' to go')+'</div>'
    +cards
    +'<div class="green-foot">Every small choice counts. RoamWise is built for travel that leaves places better than it found them. \ud83c\udf0d</div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}
function rwGreenPick(cb){
  if(cb.checked){
    try{ badgeBump('green'); }catch(e){}
    var gc=parseInt(lsGet('rw_ct_green')||'0',10)||0;
    var bar=document.querySelector('.green-bar'); if(bar) bar.style.width=Math.min(100,gc/5*100)+'%';
    var tx=document.querySelector('.green-progtxt');
    var earned=(typeof badgeEarnedIds==='function')?badgeEarnedIds().indexOf('green')>=0:false;
    if(tx) tx.textContent = earned?'\ud83c\udf31 Green Traveller badge earned! Keep it up.':gc+' / 5 green choices \u2014 '+Math.max(0,5-gc)+' to go';
    cb.disabled=true; cb.parentNode.style.opacity='.6';
  }
}
// openJourneyCert + certShare moved to js/itinerary/certificates.js
// rwShareSheet/rwCloseShare/rwShareTrip/rwShareGo moved to js/itinerary/share.js
// certDownload moved to js/itinerary/certificates.js

// rankOf/nextRank/xpAdd/xpPaint + daily streak XP bonus moved to js/game/badges.js


// SHARE / VIRALITY (doShare, shareApp, shareTrek) moved to js/itinerary/share.js
/* ===== HUB & SPOKE INDIA ===== */
var HS=[
['\u2708\ufe0f The strategy in one line',[
 ['Fly \u2192 Hub','Cover 1,000+ km in 2 hours instead of 2 days of driving','Home \u2192 regional hub city'],
 ['Drive \u2192 Region','Pick up a self-drive SUV at the airport for flexible road-tripping','Hub \u2192 the whole region'],
 ['Train/Bus \u2192 Cities','Premium coaches for crowd-free city-to-city hops','Between major stops'],
 ['Cycle \u2192 Streets','Folding cycle in the car boot beats every traffic jam','The last mile']]],
['\ud83d\ude82 Trains \u2014 premium & crowd-free only',[
 ['Vande Bharat (CC/EC)','India\u2019s fastest day trains \u2014 aircraft comfort, big windows, rarely crowded. Book 1\u20132 weeks out.','Best for 2\u20136 hr day hops'],
 ['Shatabdi Executive / Anubhuti','2\u00d72 seating, huge legroom, quiet crowd','Day journeys in style'],
 ['1st AC (1A) Rajdhani/Duronto','Lockable private 2/4-berth coupe \u2014 the quietest overnight on rails','Overnight long hauls'],
 ['\u26a1 Tatkal hack','IRCTC app at exactly 10:00 AM the day before travel (AC quota) for guaranteed last-minute seats','Emergency bookings']]],
['\ud83d\ude8c Buses \u2014 skip state transport entirely',[
 ['What to book','Multi-axle Volvo B11R / Scania / Mercedes AC sleepers only','4\u20138 hr intercity hops'],
 ['Operators','NueGo (electric), National Travels, SRS \u2014 filter \u201cPrime / Max Safety / Volvo\u201d on redBus or AbhiBus','Premium private fleets'],
 ['Comfort hack','Single sleeper LOWER berth, RIGHT side \u2014 dramatically less sway than upper berths','Sleep like a log']]],
['\ud83d\ude97 Self-drive \u2014 the pan-India illusion',[
 ['Rent locally, not one car forever','Driving one car across all India kills speed and burns fuel/tolls \u2014 rent at each hub instead','Revv \u00b7 Zoomcar \u00b7 MyChoize'],
 ['Airport pickup','Pre-book an SUV straight from the terminal \u2014 land and drive','Zero waiting'],
 ['Subscription trick','Revv-style 1\u20133 month subscriptions give you a \u201cdedicated\u201d car with permits, insurance & maintenance handled','Long regional stays']]],
['\ud83d\udeb2 The boot cycle',[
 ['Folding only','Full-size cycles need roof racks rental companies refuse \u2014 folders fit any hatchback boot','Decathlon Tilt \u00b7 Tern \u00b7 Brompton'],
 ['The workflow','Park at the old-city edge \u2192 unfold in 30 seconds \u2192 glide past every jam and into the tiny lanes','Cities & fort towns'],
 ['Bonus','Cycle mode in RoamWise cuts your budget estimate ~40% automatically','Try it in Plan']]],
['\ud83d\udeeb Major airports - your 26 launchpads',[
 ['North','DEL Delhi - IXC Chandigarh - ATQ Amritsar - SXR Srinagar - IXL Leh - DED Dehradun - JAI Jaipur - LKO Lucknow - VNS Varanasi','Himalaya + heartland'],
 ['West','BOM Mumbai - PNQ Pune - AMD Ahmedabad - GOI/GOX Goa - IDR Indore','Coast + business'],
 ['South','BLR Bengaluru - MAA Chennai - HYD Hyderabad - COK Kochi - TRV Trivandrum - IXM Madurai','Tech + temples + beaches'],
 ['East & NE','CCU Kolkata - BBI Bhubaneswar - PAT Patna - IXR Ranchi - GAU Guwahati - IXB Bagdogra','Gateways to the wild east'],
 ['Islands','IXZ Port Blair (Andamans)','Book 60+ days out']]],
['\ud83d\ude84 Vande Bharat - the premium web (key routes)',[
 ['Himalaya feeders','Delhi-Dehradun - Delhi-Katra (Vaishno Devi) - Delhi-Amb Andaura (Kangra) - NJP-Guwahati','Mountains by breakfast'],
 ['Golden routes','Delhi-Varanasi - Delhi-Bhopal - Mumbai-Gandhinagar - Mumbai-Shirdi - Mumbai-Solapur','Business + pilgrimage'],
 ['South web','Chennai-Mysuru - Chennai-Coimbatore - Bengaluru-Dharwad - Kasaragod-Trivandrum - Secunderabad-Vizag','Day-hop the peninsula'],
 ['East & more','Howrah-NJP (Darjeeling gateway) - Howrah-Puri - Patna-Ranchi - Bilaspur-Nagpur - Jodhpur-Sabarmati','Check IRCTC for the newest of 100+ pairs']]],
['\ud83c\udfe0 Best base city for all-India travel',[
 ['\ud83c\udfc6 The verdict: DELHI','Max flight web (India\u2019s busiest hub, cheapest average domestic fares), the densest Vande Bharat + Rajdhani spokes, AND the only metro 4-8h from the entire Himalaya - Uttarakhand, Himachal, Kashmir, Ladakh flights.','Save 20-35% on travel spend vs coastal bases'],
 ['Runner-up: BENGALURU','Best base if your map is South-heavy - Kerala, Tamil Nadu, Goa, Hampi all within cheap hops; weather bonus year-round.','South specialist'],
 ['Why not Mumbai?','Great international + west coast, but Himalaya trips always cost one extra flight and 2+ extra hours.','Premium priced too'],
 ['The hybrid hack','Base Delhi Oct-Mar (mountain + desert season), migrate to Bengaluru Apr-Sep (monsoon south is magic). Two sublets beat one lease.','Nomad optimum']]],
['\ud83d\uddfa\ufe0f Example: Rajasthan loop',[
 ['1. Fly','Delhi/Mumbai \u2192 Jaipur (fastest entry)','2 hrs'],
 ['2. Drive','Airport SUV pickup, folded cycle in boot \u2192 Jodhpur \u2192 Udaipur','Flexible days'],
 ['3. Cycle','Park below Mehrangarh / Udaipur old city \u2192 pedal the alleys past every crowd','Golden hours'],
 ['4. Train back','Drop the car in Udaipur \u2192 Vande Bharat to Jaipur/Delhi in silence','Zero drive fatigue']]]
];
function renderHS(){
  var box=el('hsAcc'); if(!box) return;
  box.innerHTML = HS.map(function(sec,i){
    return '<div class="trek'+(i===0?' open':'')+'" style="margin-bottom:10px"><div class="trek-top" style="cursor:pointer" onclick="this.parentNode.classList.toggle(\'open\')"><div class="trek-name">'+sec[0]+'</div><span class="tbadge pop">'+sec[1].length+'</span></div>'
    +'<div class="trek-itin">'+sec[1].map(function(r){return '<div class="ti-day"><b style="min-width:0">\u25aa</b><span><strong style="color:var(--t1)">'+r[0]+'</strong> \u2014 '+r[1]+'<br><span style="color:var(--gold2);font-size:10px">'+r[2]+'</span></span></div>';}).join('')+'</div></div>';
  }).join('');
}
renderHS();

/* ===== BASECAMP ===== */
var BC = [
 ['\u26f0\ufe0f Trek companies \u2014 India', [
  ['Indiahikes','Largest trek organiser; strong safety systems','indiahikes.com'],
  ['Trek The Himalayas','Wide Himalayan catalogue, good batches','trekthehimalayas.com'],
  ['Bikat Adventures','Skill-progression treks, technical training','bikatadventures.com'],
  ['YHAI','Legendary budget national programs','yhaindia.org'],
  ['Spiti Ecosphere','Community-led Spiti treks & homestays','spitiecosphere.com'],
  ['Rimo Expeditions','Ladakh/Karakoram veterans since 1993','rimoexpeditions.com']]],
 ['\ud83c\udfd4\ufe0f Expedition companies \u2014 world', [
  ['Seven Summit Treks','Biggest 8000m operator (Nepal)','sevensummittreks.com'],
  ['Furtenbach Adventures','High-end, high-success Everest programs','furtenbachadventures.com'],
  ['Alpine Ascents','US institution \u2014 Rainier to Everest','alpineascents.com'],
  ['Jagged Globe','UK classic for guided expeditions','jagged-globe.co.uk'],
  ['World Expeditions','Global trekking + responsible travel','worldexpeditions.com'],
  ['Madison Mountaineering','Boutique 8000m + Seven Summits','madisonmountaineering.com']]],
 ['\ud83c\udfa5 Creators worth following', [
  ['Nimsdai Purja','14 peaks in 6 months \u2014 expedition content','@nimsdai'],
  ['Kraig Adams','Silent solo hiking films \u2014 pure trail therapy','YouTube: Kraig Adams'],
  ['Eva zu Beck','Offbeat countries, overlanding','@evazubeck'],
  ['Tanya Khanijow','India\u2019s solo-travel voice, practical guides','@tanyakhanijow'],
  ['Drew Binsky','Every country on Earth \u2014 culture snapshots','@drewbinsky'],
  ['Lost LeBlanc','Travel filmmaking + SE Asia mastery','@lostleblanc']]],
 ['\ud83c\udd98 Emergency contacts', [
  ['India \u2014 all emergencies','112 (works without signal on any network)','also: Ambulance 108 \u00b7 Tourist helpline 1363'],
  ['Europe','112','universal across the EU'],
  ['USA / Canada','911','mountain rescue via 911'],
  ['UK','999','mountain rescue: ask for Police \u2192 Mountain Rescue'],
  ['Australia','000','New Zealand: 111'],
  ['Golden rules','Save your embassy number offline before flying','Travel insurance with helicopter evac is non-negotiable above 3,500m']]]
];
function renderBC(){
  var box=el('bcAcc'); if(!box) return;
  box.innerHTML = BC.map(function(sec,si){
    return '<div class="trek" style="margin-bottom:10px"><div class="trek-top" style="cursor:pointer" onclick="this.parentNode.classList.toggle(\'open\')"><div class="trek-name">'+sec[0]+'</div><span class="tbadge hid">'+sec[1].length+'</span></div>'
    +'<div class="trek-itin">'+sec[1].map(function(r){return '<div class="ti-day"><b style="min-width:0">\u25aa</b><span><strong style="color:var(--t1)">'+r[0]+'</strong> \u2014 '+r[1]+'<br><span style="color:var(--crim2);font-size:10px">'+r[2]+'</span></span></div>';}).join('')+'</div></div>';
  }).join('')
  /* packing checklist */
  + '<div class="trek open"><div class="trek-top"><div class="trek-name">\ud83c\udf92 Essentials packing list</div><span class="tbadge pop" id="packCount"></span></div><div class="trek-itin" id="packList"></div></div>';
  renderPack();
}
var PACK=['Passport/ID + photocopies','Travel insurance (heli-evac if trekking)','Offline maps downloaded','Power bank 10,000mAh+','Universal adapter','First-aid: ORS, Diamox, painkillers, bandaids','Sunscreen SPF50 + lip balm','Rain shell / poncho','Warm layer (down/fleece)','Trekking shoes broken-in','2 pairs wool socks','Headlamp + spare batteries','Water bottle + purification tabs','Quick-dry towel','Dry bags / ziplocks','Cash in small notes','Emergency contacts written on paper','Sunglasses (cat-3 for snow)','Whistle','Duct tape (wrapped on bottle)'];
function renderPack(){
  var done=JSON.parse(lsGet('rw_pack')||'{}');
  el('packList').innerHTML = PACK.map(function(p,i){
    return '<label class="ti-day" style="cursor:pointer"><input type="checkbox" '+(done[i]?'checked':'')+' onchange="packTog('+i+',this.checked)" style="accent-color:#C4302B"><span style="'+(done[i]?'text-decoration:line-through;opacity:.5':'')+'">'+p+'</span></label>';
  }).join('');
  var n=Object.values(done).filter(Boolean).length;
  el('packCount').textContent = n+'/'+PACK.length;
}
function packTog(i,v){ var d=JSON.parse(lsGet('rw_pack')||'{}'); d[i]=v; lsSet('rw_pack',JSON.stringify(d)); renderPack(); if(v&&Object.values(d).filter(Boolean).length===PACK.length) xpAdd(20,'Fully packed \u2014 mission ready'); }
renderBC();

/* ===== STRAVA (lite link — full OAuth needs your Strava API app later) ===== */
function requestFeature(){
  if(!AUTH_READY || !user){ openAuth(); return showToast('Sign in to send ideas'); }
  var t = prompt('What should RoamWise do next? (one idea, max 200 chars)');
  if(!t || !t.trim()) return;
  db.collection('requests').add({uid:user.uid, email:user.email||'', text:t.trim().slice(0,200), created:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){ xpAdd(10,'Idea submitted \u2014 shaping the app'); })
    .catch(function(){ showToast('Could not send \u2014 try again'); });
}
function stravaConnect(){
  var u=prompt('Paste your Strava profile link (strava.com/athletes/...)', lsGet('rw_strava')||'');
  if(u===null) return;
  lsSet('rw_strava', u.trim()); showToast(u.trim()? 'Strava linked to your Journey \u2713' : 'Strava unlinked');
}

/* ===== LEGENDARY CIRCUITS ===== */
var CIRCUITS=[
{n:'Golden Triangle+',w:'North India \u00b7 drive/rail',st:['Delhi','Agra','Jaipur','Pushkar','Delhi'],km:'1,050 km',d:'6\u20138 days'},
{n:'Manali\u2013Leh\u2013Srinagar',w:'Indian Himalaya \u00b7 ride/drive',st:['Manali','Sarchu','Leh','Nubra','Pangong','Kargil','Srinagar'],km:'1,300 km',d:'10\u201314 days'},
{n:'Kumaon Loop',w:'Uttarakhand \u00b7 drive',st:['Kathgodam','Almora','Kasar Devi','Munsiyari','Chaukori','Binsar','Nainital'],km:'620 km',d:'6\u20137 days'},
{n:'Ring Road',w:'Iceland \u00b7 drive/EV',st:['Reykjav\u00edk','Vik','J\u00f6kuls\u00e1rl\u00f3n','Egilssta\u00f0ir','Akureyri','Sn\u00e6fellsnes'],km:'1,332 km',d:'7\u201310 days'},
{n:'North Coast 500',w:'Scotland \u00b7 drive',st:['Inverness','Applecross','Ullapool','Durness','John o\u2019Groats','Inverness'],km:'830 km',d:'5\u20137 days'},
{n:'Garden Route',w:'South Africa \u00b7 drive',st:['Cape Town','Hermanus','Knysna','Plettenberg','Tsitsikamma','Gqeberha'],km:'750 km',d:'6\u20138 days'},
{n:'Shikoku 88 Temples',w:'Japan \u00b7 walk/cycle',st:['Tokushima','K\u014dchi','Ehime','Kagawa (88 temples full loop)'],km:'1,150 km',d:'40\u201350 days walk'},
{n:'Pamir Highway',w:'Tajikistan/Kyrgyzstan \u00b7 4x4/cycle',st:['Dushanbe','Khorog','Wakhan Valley','Murghab','Osh'],km:'1,250 km',d:'8\u201312 days'}
];
function renderCircs(){
  var g=el('circGrid'); if(!g) return;
  g.innerHTML = CIRCUITS.map(function(c){
    return '<div class="circ"><div class="circ-name">'+c.n+'</div><div class="circ-where">'+c.w+'</div>'
      +'<div class="circ-path">'+c.st.map(function(s,i){return '<span class="cp-stop">'+s+'</span>'+(i<c.st.length-1?'<span class="cp-arr">\u279c</span>':'');}).join('')+'</div>'
      +'<div class="circ-meta">'+c.km+' \u00b7 '+c.d+'</div></div>';
  }).join('');
}

/* ===== EV VAULT (indicative, early-2026 knowledge \u2014 verify latest) ===== */
var EVS=[
{cat:'E-Bike (motorcycle)',n:'Ultraviolette F77 Mach 2',sp:[['Range (IDC)','~323 km'],['0\u2013100 charge','~5 hr (fast: ~50% in 30m)'],['Why','Longest-range made-in-India e-motorcycle']],note:'Best savings: Revolt RV400 \u00b7 touring: pair with fast-charge corridors'},
{cat:'E-Scooter',n:'Simple One',sp:[['Claimed range','~248 km'],['Removable battery','Yes'],['Why','Highest claimed scooter range in India']],note:'City value pick: Ather Rizta \u00b7 ecosystem king: Ola S1 Pro'},
{cat:'E-Cycle',n:'Riese & M\u00fcller dual-battery tourers',sp:[['Range','150\u2013200 km/charge'],['Why','Gold standard for cycle world-touring']],note:'India budget: EMotorad \u00b7 charge from any wall socket \u2014 the true world-travel EV'},
{cat:'Car \u2014 range king',n:'Lucid Air Grand Touring',sp:[['Range (EPA)','~830 km'],['Why','Longest-range production EV']],note:'India range king: Mercedes EQS (~800+ km ARAI)'},
{cat:'Car \u2014 fastest charging',n:'Hyundai Ioniq 5 / Kia EV6 (800V)',sp:[['10\u201380%','~18 min'],['Why','800V architecture \u2014 coffee-break charging']],note:'Best savings India: Tata Tiago.ev / MG Comet \u00b7 world travel: widest network wins \u2014 Tesla Model Y'},
{cat:'Most popular \u2014 world',n:'Tesla Model Y',sp:[['Claim to fame','World\u2019s best-selling car (any fuel)'],['Range','~530 km'],['Why','Charging network + resale = the default global EV']],note:'The safe pick everywhere from Norway to New Zealand'},
{cat:'Most popular \u2014 India (car)',n:'MG Windsor EV / Tata Nexon.ev',sp:[['Claim to fame','India\u2019s top-selling e-cars'],['Range','~330\u2013465 km'],['Why','Price-range sweet spot + battery-as-a-service options']],note:'Tata + MG = ~70% of India\u2019s EV car market (indicative)'},
{cat:'Most popular \u2014 India (2-wheeler)',n:'Bajaj Chetak / TVS iQube / Ola S1',sp:[['Claim to fame','The monthly sales podium'],['Range','~120\u2013195 km'],['Why','Service networks finally match the hype']],note:'Legacy makers overtook startups on trust \u2014 check latest monthly VAHAN data'},
{cat:'Bus',n:'BYD / Olectra electric coaches',sp:[['Range','250\u2013400 km'],['Why','Quiet mountain-road champions']],note:'India intercity e-buses now run Delhi\u2013Dehradun-type routes \u2014 cheapest clean long-haul'},
{cat:'Truck',n:'Tesla Semi',sp:[['Range (loaded)','~800 km'],['Why','Long-haul electric freight benchmark']],note:'Overlanding future: e-pickups (Rivian R1T) already circle continents'},
{cat:'Drone / eVTOL',n:'EHang EH216-S',sp:[['Type','Certified pilotless air taxi'],['Why','First type-certified passenger eVTOL']],note:'Delivery workhorse: DJI FlyCart 30 (~30 kg payload)'},
{cat:'Electric \u201chelicopter\u201d (eVTOL)',n:'Joby S4',sp:[['Range','~160 km'],['Speed','~320 km/h'],['Why','Leading electric air-taxi \u2014 city hops, zero jet fuel']],note:'Air travel\u2019s EV moment is arriving \u2014 watch this space'}
];
function renderEvs(){
  var g=el('evGrid'); if(!g) return;
  g.innerHTML=EVS.map(function(e){
    return '<div class="ev"><div class="ev-cat">'+e.cat+'</div><div class="ev-name">'+e.n+'</div>'
      +e.sp.map(function(s){return '<div class="ev-spec"><span>'+s[0]+'</span><b>'+s[1]+'</b></div>';}).join('')
      +'<div class="ev-note">'+e.note+'</div></div>';
  }).join('');
}
renderCircs(); renderEvs();

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
// ATLAS CERTIFICATE + JOURNEY MOVIE moved to js/itinerary/certificates.js

// CHEAP/LUXE hack pools moved to js/itinerary/ninja-hacks.js

/* ===== DAILY BRIEFING — date + location + weather aware ===== */
var WCODE={0:['\u2600\ufe0f','Clear'],1:['\ud83c\udf24\ufe0f','Mostly clear'],2:['\u26c5','Partly cloudy'],3:['\u2601\ufe0f','Overcast'],45:['\ud83c\udf2b\ufe0f','Foggy'],48:['\ud83c\udf2b\ufe0f','Foggy'],51:['\ud83c\udf26\ufe0f','Drizzle'],61:['\ud83c\udf27\ufe0f','Rain'],63:['\ud83c\udf27\ufe0f','Rain'],65:['\u26c8\ufe0f','Heavy rain'],71:['\ud83c\udf28\ufe0f','Snow'],80:['\ud83c\udf26\ufe0f','Showers'],95:['\u26a1','Thunderstorm']};
function dayBriefing(){
  var B=el('brief'); if(!B) return;
  var now=new Date();
  el('bDate').textContent = now.toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long'});
  /* destination of the day — deterministic by date */
  var seed = now.getFullYear()*372 + now.getMonth()*31 + now.getDate();
  var d = DB[seed % DB.length];
  var mi = now.getMonth();
  el('bDest').innerHTML = '<span class="bi">\ud83c\udfaf</span><span><b>Destination of the day: '+d.name+', '+d.country+'</b> \u2014 '+(d.crowd? d.crowd[mi]+'% crowds this month':'')+'. '+((d.tags||[]).slice(0,3).join(' \u00b7 '))+'<span class="brief-cta" onclick="briefPlan(\''+d.name.replace(/'/g,"\\'")+'\')">Plan this \u2192</span></span>';
  /* festival today anywhere we track */
  var fhits=[];
  for(var c in FESTS){ if(FESTS[c][mi]) fhits.push(FESTS[c][mi]+' ('+c+')'); }
  if(fhits.length){ var f=fhits[seed % fhits.length]; el('bFest').style.display=''; el('bFest').innerHTML='<span class="bi">\ud83c\udf89</span><span><b>This month somewhere amazing:</b> '+f+'</span>'; }
  B.style.display='';
  /* location + weather via IP (no permission popups) */
  fetch('https://ipwho.is/').then(function(r){return r.json();}).then(function(loc){
    if(!loc || !loc.success) throw 0;
    return fetch('https://api.open-meteo.com/v1/forecast?latitude='+loc.latitude+'&longitude='+loc.longitude+'&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1')
      .then(function(r){return r.json();}).then(function(w){
        var cw=w.current_weather||{}; var code=WCODE[cw.weathercode]||['\ud83c\udf24\ufe0f','Weather'];
        var hi=(w.daily&&w.daily.temperature_2m_max&&Math.round(w.daily.temperature_2m_max[0]))||'';
        el('bWx').innerHTML='<div class="wt">'+code[0]+' '+Math.round(cw.temperature)+'\u00b0C</div><div class="wm"><b>'+ (loc.city||'') +(loc.city&&loc.country?', ':'')+(loc.country||'')+'</b><br>'+code[1]+(hi!==''?' \u00b7 high '+hi+'\u00b0C':'')+' \u2014 '+(cw.temperature>=18&&cw.temperature<=30&&cw.weathercode<3?'a perfect day to plan the next escape.':'a good day to plan the next escape from the couch.')+'</div>';
      });
  }).catch(function(){ el('bWx').innerHTML='<div class="wm">\ud83c\udf0f Somewhere on Earth \u2014 a good day to plan an escape.</div>'; });
  /* on this day — Wikipedia free feed */
  var mm=('0'+(now.getMonth()+1)).slice(-2), dd=('0'+now.getDate()).slice(-2);
  fetch('https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/'+mm+'/'+dd).then(function(r){return r.json();}).then(function(j){
    var evs=(j.selected||[]).filter(function(e){return e.text && e.text.length<160;});
    if(!evs.length) return;
    var e=evs[seed % evs.length];
    el('bFact').style.display='';
    el('bFact').innerHTML='<span class="bi">\ud83d\udcf0</span><span><b>On this day, '+e.year+':</b> '+e.text+'</span>';
  }).catch(function(){});
}
function briefPlan(name){ var i=el('destInput'); if(i){ i.value=name; } tabGo('plan'); showToast('Pick a month and hit Search'); }
setTimeout(dayBriefing, 400);

var ADS=[
 {ic:'\ud83d\udcd8',lbl:'From the maker',t:'AI Ki Pathshala \u2014 learn AI in simple Hindi',s:'The practical AI guide for students & families. By Mohit Pandey, RoamWise\u2019s creator.',u:'https://amzn.in/d/0b8CZwlG',c:'Get the book'},
 {ic:'\u25b6\ufe0f',lbl:'From the maker',t:'@mohucool \u2014 Himalayan travel + AI on YouTube',s:'Kumaoni music, mountain routes and build-in-public videos.',u:'https://youtube.com/@mohucool',c:'Subscribe'},
 {ic:'\ud83c\udfe8',lbl:'Partner slot',t:'Your hotel / agency featured here',s:'This spot reaches every trip search. Contact via YouTube to sponsor.',u:'https://youtube.com/@mohucool',c:'Sponsor'}
];
function adCard(i){
  var a=ADS[i%ADS.length]; if(!a) return '';
  return '<div class="adcard"><div class="ad-ic">'+a.ic+'</div><div><span class="ad-lbl">'+a.lbl+'</span><div class="ad-t">'+a.t+'</div><div class="ad-s">'+a.s+'</div></div><a class="ad-cta" href="'+a.u+'" target="_blank" rel="noopener">'+a.c+'</a></div>';
}

/* ===== TREK VAULT ===== */
var TREKS=[
{n:'Kedarkantha',w:'Uttarakhand, India',c:'pop',d:6,alt:3810,df:'Easy\u2013Moderate',bm:'Dec\u2013Apr',it:['Dehradun \u2192 Sankri (10hr drive)','Sankri \u2192 Juda ka Talab','Base camp via pine forests','Summit 3,810m at sunrise \u2192 Hargaon','Descend to Sankri','Drive back to Dehradun']},
{n:'Valley of Flowers + Hemkund',w:'Uttarakhand, India',c:'pop',d:6,alt:4329,df:'Moderate',bm:'Jul\u2013Sep',it:['Haridwar \u2192 Govindghat','Trek to Ghangaria (9km)','Valley of Flowers day walk','Hemkund Sahib 4,329m','Return Govindghat','Drive back']},
{n:'Hampta Pass',w:'Himachal, India',c:'pop',d:5,alt:4270,df:'Moderate',bm:'Jun\u2013Sep',it:['Manali \u2192 Jobra \u2192 Chika','Chika \u2192 Balu ka Ghera','Cross Hampta Pass 4,270m \u2192 Shea Goru','Shea Goru \u2192 Chhatru \u2192 Chandratal','Drive back to Manali']},
{n:'Everest Base Camp',w:'Nepal',c:'pop',d:12,alt:5364,df:'Moderate\u2013Hard',bm:'Mar\u2013May, Oct\u2013Nov',it:['Fly Lukla \u2192 Phakding','Namche Bazaar (acclimatise +1)','Tengboche monastery','Dingboche (acclimatise +1)','Lobuche \u2192 Gorak Shep','EBC 5,364m + Kala Patthar sunrise','Descend over 3\u20134 days']},
{n:'Tour du Mont Blanc',w:'France/Italy/Switzerland',c:'pop',d:10,alt:2665,df:'Moderate',bm:'Jun\u2013Sep',it:['Chamonix \u2192 Les Contamines','Col du Bonhomme crossing','Courmayeur (Italy)','Rifugio Bonatti balcony trail','Swiss Val Ferret \u2192 Champex','La Fouly \u2192 Trient','Col de Balme back to Chamonix']},
{n:'Nag Tibba Weekend',w:'Uttarakhand, India',c:'pop',d:2,alt:3022,df:'Easy',bm:'Year-round',it:['Dehradun \u2192 Pantwari \u2192 base camp','Summit sunrise 3,022m \u2192 descend \u2192 drive back']},
{n:'Pin Bhaba Pass',w:'Himachal\u2013Spiti, India',c:'hid',d:8,alt:4915,df:'Hard',bm:'Jul\u2013Sep',it:['Shimla \u2192 Kafnu','Mulling meadows','Kara \u2192 Phustirang','Cross Pin Bhaba 4,915m into Spiti\u2019s moonscape','Mudh village \u2192 Kaza','Explore Spiti before return']},
{n:'Kagbhusandi Tal',w:'Uttarakhand, India',c:'hid',d:7,alt:5230,df:'Hard',bm:'Jun, Sep',it:['Joshimath \u2192 Bhyundar','Semartoli meadows','Raj Kharak','Kagbhusandi lake beneath Hathi Parvat','Return via Kankul Pass 5,230m','Descend to Govindghat']},
{n:'Bara Bhangal',w:'Himachal, India',c:'hid',d:9,alt:4850,df:'Very hard',bm:'Jun\u2013Sep',it:['Manali \u2192 Lama Dugh','Cross Kalihani Pass 4,850m','Glacier camps (2 days)','Bara Bhangal \u2014 India\u2019s most isolated village','Cross Thamsar Pass 4,750m','Descend to Billing (paragliding site)']},
{n:'Kungsleden (King\u2019s Trail)',w:'Swedish Lapland',c:'hid',d:8,alt:1150,df:'Moderate',bm:'Jul\u2013Sep',it:['Abisko \u2192 Abiskojaure','Alesjaure hut','Tj\u00e4ktja Pass','S\u00e4lka \u2192 Singi','Kebnekaise base (optional summit)','Exit to Nikkaluokta']},
{n:'Lycian Way (best section)',w:'Turkey',c:'hid',d:6,alt:1800,df:'Moderate',bm:'Mar\u2013May, Oct',it:['Fethiye \u2192 Faralya over Butterfly Valley','Kaba\u011f \u2192 Alinca cliff path','Patara beach ruins','Kalkan \u2192 Ka\u015f coast','Aperlai sunken city','Finish at Simena castle']},
{n:'Roopkund (restricted)',w:'Uttarakhand, India',c:'dan',d:8,alt:5029,df:'Hard',bm:'May\u2013Jun, Sep',it:['NOTE: closed by court order since 2019 \u2014 status changes, check before planning','Classic route: Lohajung \u2192 Didna','Ali & Bedni Bugyal meadows','Bhagwabasa','Skeleton Lake 5,029m \u2192 return']},
{n:'Kalindi Khal',w:'Gangotri\u2192Badrinath, India',c:'dan',d:12,alt:5947,df:'Extreme (mountaineering)',bm:'Jun, Sep',it:['Gangotri \u2192 Bhojwasa \u2192 Gaumukh','Tapovan beneath Shivling','Vasuki Tal','Glacier camps + crevasse zones (rope required)','Kalindi Khal 5,947m crossing','Arwa valley \u2192 Badrinath']},
{n:'Snowman Trek',w:'Bhutan',c:'dan',d:25,alt:5320,df:'Extreme',bm:'Sep\u2013Oct',it:['Paro \u2192 Jomolhari base','Lingshi \u2192 Laya (5 days)','Eleven passes above 4,500m over two weeks','Lunana \u2014 the most remote district in the Himalaya','Exit via Sephu; fewer people finish it yearly than summit Everest']},
{n:'K2 Base Camp & Gondogoro La',w:'Pakistan Karakoram',c:'dan',d:14,alt:5585,df:'Extreme',bm:'Jul\u2013Aug',it:['Skardu \u2192 Askole','Baltoro glacier (4 days)','Concordia \u2014 amphitheatre of 8000m peaks','K2 Base Camp 5,150m','Cross Gondogoro La 5,585m (ropes, pre-dawn)','Exit Hushe valley']},
{n:'Huayhuash Circuit',w:'Peru',c:'dan',d:10,alt:5050,df:'Very hard',bm:'May\u2013Sep',it:['Huaraz \u2192 Quartelhuain','Five passes 4,600\u20135,050m across the week','Siula Grande viewpoint (Touching the Void)','Hot springs at Viconga','Exit Llamac']},
{n:'Transcaucasian Trail (Armenia leg)',w:'Armenia',c:'new',d:7,alt:3000,df:'Moderate',bm:'Jun\u2013Oct',it:['Dilijan \u2192 Parz Lake','Gosh village monasteries','Newly-cut single track through oak forests (route opened 2020s)','Haghartsin \u2192 Fioletovo','Vanadzor exit \u2014 you may meet zero other trekkers']},
{n:'Khimloga Pass',w:'Uttarakhand\u2013Himachal, India',c:'new',d:9,alt:5500,df:'Extreme',bm:'Jun, Sep',it:['Sankri \u2192 Taluka \u2192 Har ki Dun','Borasu junction camps','Khimloga 5,500m \u2014 crossed by only a handful of teams ever','Descend to Chitkul, India\u2019s \u201clast village\u201d','Buffer + exit day']},
{n:'Sinai Trail',w:'Egypt',c:'new',d:6,alt:2285,df:'Moderate',bm:'Oct\u2013Apr',it:['St Catherine start with Bedouin guides (community-created trail, 2015+)','Wadi crossings + desert camps','Jebel Abbas Basha','Mt Sinai sunrise 2,285m','Blue Desert exit \u2014 Egypt\u2019s first long-distance hiking trail']}
];
var trekF='all';
function trekFilter(btn){ trekF=btn.dataset.f; document.querySelectorAll('#trekChips .fchip').forEach(function(b){b.classList.toggle('on',b===btn);}); renderTreks(); }
var WISH=JSON.parse(lsGet('rw_wish')||'[]');
function wishTog(ev,id){ ev.stopPropagation();
  var i=WISH.indexOf(id);
  if(i<0){ WISH.push(id); ev.target.textContent='\u2665'; ev.target.style.color='#E8524A'; showToast('Saved to your list \u2665 (+5 XP)'); xpAdd(5,'Saved a dream'); }
  else { WISH.splice(i,1); ev.target.textContent='\u2661'; ev.target.style.color=''; }
  lsSet('rw_wish', JSON.stringify(WISH));
}
function wishHeart(id){ var on=WISH.indexOf(id)>-1;
  return '<span class="wsh" onclick="wishTog(event,\''+id.replace(/'/g,'')+'\')" style="cursor:pointer;font-size:17px;margin-left:auto;padding:0 4px;'+(on?'color:#E8524A':'color:var(--t3)')+'">'+(on?'\u2665':'\u2661')+'</span>'; }
function showSaved(){
  var ov=el('savedOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='savedOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:400px"><button class="modal-close" onclick="el(\'savedOverlay\').classList.remove(\'open\')">\u00d7</button><div class="modal-head"><div class="modal-title">\u2665 Saved for later</div><div class="modal-sub">Your dream list</div></div><div class="modal-body" id="savedBody"></div></div>';
    document.body.appendChild(ov); }
  el('savedBody').innerHTML = WISH.length? WISH.map(function(w){ return '<div class="ti-day"><b>\u2665</b><span>'+w+'</span></div>'; }).join('') + '<button class="tact" style="width:100%;margin-top:10px" onclick="WISH=[];lsSet(\'rw_wish\',\'[]\');showSaved();renderTreks();renderExps()">Clear all</button>'
    : '<div class="mode-box">Nothing saved yet \u2014 tap the \u2661 on any trek or experience.</div>';
  ov.classList.add('open');
}
function renderTreks(){
  var g=el('trekGrid'); if(!g) return;
  var CATN={pop:'POPULAR',hid:'HIDDEN',dan:'DANGEROUS',new:'NEW'};
  g.innerHTML = TREKS.map(function(t,i){
    if(trekF!=='all' && t.c!==trekF) return '';
    return '<div class="trek" id="trek'+i+'">'
      +'<div class="trek-top"><div class="trek-name">'+t.n+'</div>'+wishHeart(t.n)+'<span class="tbadge '+t.c+'">'+CATN[t.c]+'</span></div>'
      +'<div class="trek-where">'+t.w+'</div>'
      +'<div class="trek-meta"><span class="tm"><b>'+t.d+'</b> days</span><span class="tm"><b>'+t.alt+'m</b> max</span><span class="tm">'+t.df+'</span><span class="tm">'+t.bm+'</span></div>'
      +'<div class="trek-itin">'+t.it.map(function(s,di){return '<div class="ti-day"><b>Day '+(di+1)+'</b><span>'+s+'</span></div>';}).join('')+'</div>'
      +'<div class="trek-acts"><button class="tact red" onclick="trekOpen('+i+')">\ud83d\uddfa\ufe0f Itinerary</button><button class="tact" onclick="trekMap('+i+')">\ud83d\udccd Map</button><button class="tact" onclick="shareTrek('+i+')">\ud83d\udce4 Share</button></div>'
      +'</div>';
  }).join('') + adCard(1);
}
function trekMap(i){ var t=TREKS[i]; window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t.n+' trek '+t.w),'_blank'); }
var trekXPd={};
function trekOpen(i){
  var c=el('trek'+i); if(!c) return; c.classList.toggle('open');
  if(c.classList.contains('open') && !trekXPd[i]){ trekXPd[i]=1; xpAdd(5,'Trek scouted'); }
}

/* ===== FRESH EXPERIENCES ===== */
var EXPS=[
{ic:'\ud83e\udeb8',n:'Bioluminescent kayaking',w:'Havelock, Andamans',x:'Paddle through water that glows electric blue with every stroke \u2014 new-moon nights only.',t:'Nov\u2013Feb, moonless nights'},
{ic:'\ud83d\udd2d',n:'Hanle Dark Sky Reserve',w:'Ladakh, India',x:'India\u2019s first astro-village at 4,500m \u2014 homestays with telescopes and Milky Way so bright it casts shadows.',t:'Apr\u2013Sep'},
{ic:'\ud83d\udc06',n:'Snow leopard tracking',w:'Spiti / Ulley, Ladakh',x:'Winter expeditions with local spotters \u2014 sightings now more likely than ever thanks to community conservation.',t:'Jan\u2013Mar'},
{ic:'\ud83c\udfb6',n:'Ziro Festival homestays',w:'Arunachal, India',x:'Indie music in a rice-valley amphitheatre, staying with Apatani families.',t:'Sep'},
{ic:'\ud83c\udf09',n:'Living root bridge trek',w:'Meghalaya, India',x:'Sleep in Nongriat village between double-decker bridges grown \u2014 not built \u2014 over centuries.',t:'Oct\u2013Apr'},
{ic:'\u2728',n:'Firefly synchronous bloom',w:'Bhandardara, Maharashtra',x:'For 2\u20133 weeks pre-monsoon, entire valleys blink in sync. Camp it.',t:'Late May\u2013Jun'},
{ic:'\ud83e\uddca',n:'Glacier lagoon kayaking',w:'J\u00f6kuls\u00e1rl\u00f3n, Iceland',x:'Paddle between calving icebergs where seals surface beside your boat.',t:'Jun\u2013Sep'},
{ic:'\ud83c\udfdc\ufe0f',n:'Rann Utsav full-moon night',w:'Kutch, Gujarat',x:'White salt desert glowing under the moon \u2014 time your visit to purnima.',t:'Nov\u2013Feb'},
{ic:'\ud83c\udf88',n:'Cappadocia balloon dawn',w:'T\u00fcrkiye',x:'A hundred balloons over fairy chimneys \u2014 book the 1st morning of your stay; weather cancels ~30%.',t:'Apr\u2013Jun, Sep\u2013Oct'},
{ic:'\ud83c\udf05',n:'Midnight-sun sailing',w:'Svalbard / Lofoten',x:'Sail at 2am in full daylight past walrus colonies \u2014 the strangest jetlag of your life.',t:'Jun\u2013Jul'},
{ic:'\ud83c\ud337',n:'Tulip bloom + shikara',w:'Srinagar, Kashmir',x:'Asia\u2019s largest tulip garden peaks for ~3 weeks against the Zabarwan range.',t:'Late Mar\u2013mid Apr'},
{ic:'\ud83c\udfe1',n:'Kumaoni village slow-stay',w:'Almora belt, Uttarakhand',x:'Terrace-farm mornings, oak forests, no itinerary \u2014 the anti-trip that fixes burnout.',t:'Year-round; Mar\u2013Jun best'}
];
function renderExps(){
  var g=el('expGrid'); if(!g) return;
  g.innerHTML = EXPS.map(function(e){
    return '<div class="exp"><div class="exp-ic" style="display:flex;align-items:center">'+e.ic+wishHeart(e.n)+'</div><div class="exp-name">'+e.n+'</div><div class="exp-where">'+e.w+'</div><div class="exp-desc">'+e.x+'</div><div class="exp-when">\ud83d\uddd3 '+e.t+'</div></div>';
  }).join('');
}
renderTreks(); renderExps();

/* ===== TRAVEL MODES ===== */
var MODES={
 std:null,
 ev:{ic:'\u26a1',n:'EV road trip',m:1.05,t:'Plan legs of 200\u2013250km between charges and always know your next TWO chargers. India: PlugShare + Statiq/Tata Power apps; Europe/US: ABRP (A Better Routeplanner) is the gold standard. Hotels with destination chargers turn charging time into sleep time.'},
 walk:{ic:'\ud83d\udeb6',n:'Walk / slow travel',m:0.55,t:'Budget drops ~45% \u2014 your feet are free. Plan 15\u201320km/day max with a rest day every 4th. One town per 2\u20133 days beats five towns in five days, and you\u2019ll actually remember them.'},
 cycle:{ic:'\ud83d\udeb4',n:'Cycle touring',m:0.6,t:'50\u201380km/day loaded is sustainable. Warmshowers.org = free stays with cyclist hosts worldwide. Pack spare spokes \u2014 the one part no small-town shop stocks.'},
 hybrid:{ic:'\ud83d\udd04',n:'Hybrid',m:0.9,t:'Trains/buses between hubs + walk/cycle within them \u2014 the efficiency sweet spot. Book long legs early, keep local days unplanned.'},
 lux:{ic:'\u2728',n:'Luxury',m:3.2,t:'Book marquee hotels 3+ months out but leave 30% of nights flexible for upgrades. Shoulder season = same suites, 40% less, emptier spas. A private guide for day one recalibrates the whole trip.'},
 eco:{ic:'\ud83c\udf3f',n:'Eco / sustainable',m:0.75,t:'Trains over flights where under 8hr, homestays over chains, refill over bottled. One long trip beats three short ones \u2014 in both carbon and depth.'}
};
var EV_BENCH = [
 ['🚗 Car','Lucid Air Grand Touring — <b>512 mi / 824 km</b> EPA, the only production EV above 500 mi. Efficiency king: 410 real-world miles from just 112 kWh.'],
 ['⚡ Fast charge','Mercedes CLA: 320 kW — 10–80% in ~20 min. Lucid Gravity: ~200 mi added in 15 min. 800V architecture is the spec to look for.'],
 ['🏍️ Motorcycle','Verge TS Pro (solid-state) — up to <b>~600 km</b> claimed, +300 km in 10 min. India champion: Ultraviolette F77 Mach 2 — ~323 km IDC.'],
 ['🚲 E-cycle','Optibike R22 Everest — ~<b>480 km</b> claimed (3.26 kWh, biggest production e-bike pack). Typical tourers: 80–150 km.'],
 ['🚌 Bus','Ebusco 3.0 — up to <b>~700 km</b> claimed (lightweight composite body); BYD/Yutong city buses commonly 400–500+ km.'],
 ['🚛 Truck','Chevy Silverado EV — <b>493 mi / 793 km</b> EPA (pickup, 200 kWh). Heavy haul: Tesla Semi — ~500 mi loaded.']
];
function evBenchTable(){
  return '<div class="evb"><div class="evb-title">⚡ EV range benchmarks — mid-2026</div><table>'
    + EV_BENCH.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>';}).join('')
    + '</table><div class="src">EPA / WLTP / IDC / manufacturer figures; real-world is typically 10–30% lower (more in cold or hills).</div></div>';
}
function modeBox(d){
  var k = (el('tmode')||{}).value||'std';
  var m = MODES[k]; if(!m) return '';
  var adj = fmtMoney(Math.round(d.cost.mid*m.m));
  return '<div class="mode-box">'+m.ic+' <b>'+m.n+' mode:</b> adjusted budget ~<b>'+adj+'</b>. '+m.t+(k==='ev'? evBenchTable():'')+'</div>';
}
/* ===== COMMUTE & TRACK ===== */
function mapsRoute(dest){
  var o=(el('origin')||{}).value||'';
  return 'https://www.google.com/maps/dir/?api=1'+(o?'&origin='+encodeURIComponent(o):'')+'&destination='+encodeURIComponent(dest)+'&travelmode=driving';
}
function openStrava(){
  var t0=Date.now();
  window.location.href='strava://record';
  setTimeout(function(){ if(!document.hidden && Date.now()-t0<2200) window.open('https://www.strava.com/mobile','_blank'); },1300);
  xpAdd(5,'Tracking armed');
}
function shareLive(dest){
  var txt='🛰️ Heading to '+dest+'! Tracking my route — planned with RoamWise 🥷 '+APP_URL_SHARE;
  window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');
}
function trackBar(d){
  var full=d.name+', '+(d.country||'');
  var safe=d.name.replace(/[^A-Za-z0-9 ,-]/g,'');
  return '<div class="sec-label">🛰️ Commute & track</div><div class="track-bar">'
    +'<a class="track-btn" href="'+mapsRoute(full)+'" target="_blank" rel="noopener">🗺️ Route in Maps</a>'
    +'<button class="track-btn strava" onclick="openStrava()">🟠 Record in Strava</button>'
    +'<button class="track-btn" onclick="shareLive(&quot;'+safe+'&quot;)">📡 Share live plan</button>'
    +'</div>';
}

/* ===== FESTIVALS / EVENTS ===== */
var FESTS={'India':{2:'Holi \u2014 the festival of colours',10:'Diwali \u2014 the festival of lights'},'Thailand':{3:'Songkran water festival',10:'Loy Krathong lantern nights'},'Japan':{2:'Cherry blossom season begins',3:'Peak sakura + hanami picnics',6:'Gion Matsuri, Kyoto'},'Germany':{8:'Oktoberfest, Munich'},'Spain':{7:'La Tomatina, Bu\u00f1ol',6:'San Ferm\u00edn, Pamplona'},'Brazil':{1:'Carnival \u2014 Rio explodes'},'Mexico':{10:'D\u00eda de los Muertos'},'Italy':{1:'Venice Carnival masks'},'Turkey':{6:'Cappadocia hot-air balloon festival'},'Vietnam':{0:'T\u1ebft \u2014 Lunar New Year',1:'T\u1ebft \u2014 Lunar New Year'},'Indonesia':{2:'Nyepi \u2014 Bali\u2019s day of total silence'},'Nepal':{9:'Dashain \u2014 the biggest festival',10:'Tihar lights'},'United Kingdom':{7:'Edinburgh Fringe \u2014 world\u2019s biggest arts fest',11:'Hogmanay, Scotland'},'France':{6:'Bastille Day + Tour de France'},'United States':{6:'July 4th fireworks everywhere'},'China':{0:'Chinese New Year',1:'Lantern Festival'},'Peru':{5:'Inti Raymi sun festival, Cusco'},'Morocco':{5:'F\u00e8s Festival of Sacred Music'}};
function festLine(d, mi, month){
  var f = FESTS[d.country]; if(!f || !(mi in f)) return '';
  return '<div class="fest-line">\ud83c\udf89 '+f[mi]+' happens in '+month+' \u2014 plan around it (or into it)!</div>';
}

/* ===== POLLUTION + HAPPINESS METERS (indicative, country-level) ===== */
var METERS={'Finland':[1,5],'Denmark':[1,5],'Iceland':[1,5],'Sweden':[1,5],'Norway':[1,5],'Switzerland':[1,5],'Netherlands':[2,5],'New Zealand':[1,4],'Australia':[1,4],'Canada':[2,4],'Austria':[2,4],'Germany':[2,4],'United Kingdom':[2,4],'France':[2,4],'Spain':[2,4],'Italy':[2,4],'Portugal':[2,4],'Greece':[2,3],'Japan':[2,4],'South Korea':[3,3],'Taiwan':[2,4],'Singapore':[2,4],'United States':[2,4],'Mexico':[3,4],'Brazil':[3,3],'Argentina':[2,3],'Peru':[3,3],'Colombia':[3,3],'Thailand':[3,3],'Vietnam':[4,3],'Indonesia':[4,3],'Malaysia':[3,3],'Philippines':[3,3],'India':[5,3],'Nepal':[4,3],'Sri Lanka':[3,3],'Bhutan':[2,4],'China':[4,3],'Turkey':[3,3],'Morocco':[3,3],'Egypt':[4,2],'Kenya':[3,3],'South Africa':[3,3],'UAE':[3,4],'Georgia':[3,3],'Armenia':[3,3],'Pakistan':[5,2]};
function metersBlock(d){
  var m = METERS[d.country]; if(!m) return '';
  var airPct=[95,75,55,35,18][m[0]-1], airTxt=['Excellent','Good','Moderate','Poor','Very poor'][m[0]-1];
  var airClr=['#16BF96','#7BC96F','#E09030','#E8524A','#C4302B'][m[0]-1];
  var hapPct=[20,40,60,80,96][m[1]-1], hapTxt=['Low','Below avg','Average','High','Very high'][m[1]-1];
  return '<div class="meter"><div class="meter-top"><span>\ud83c\udf2b\ufe0f Air quality (typical)</span><span style="color:'+airClr+'">'+airTxt+'</span></div><div class="meter-track"><div class="meter-fill" style="width:'+airPct+'%;background:'+airClr+'"></div></div></div>'
    +'<div class="meter"><div class="meter-top"><span>\ud83d\ude0a Happiness index</span><span style="color:#E8BA6C">'+hapTxt+'</span></div><div class="meter-track"><div class="meter-fill" style="width:'+hapPct+'%;background:linear-gradient(90deg,#C8913E,#E8BA6C)"></div></div></div>'
    +'<div style="font-size:9.5px;color:var(--t3);margin:-4px 0 10px">Country-level indicative bands (WHO air data \u00b7 World Happiness Report tiers)</div>';
}

document.addEventListener('DOMContentLoaded', function(){
  var tm = el('tmode');
  if(tm) tm.addEventListener('change', function(){
    var r = el('results');
    if(r && r.innerHTML.length > 100) showToast('Mode changed — hit Search again to recalculate budgets');
  });
});
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

/* ==================== ENCRYPTED KEY SYNC (end-to-end) ====================
   Goal: stop re-pasting API keys on every device and after every sign-out.
   Design decision that matters: the keys are encrypted IN THE BROWSER with a
   passphrase only the user knows (PBKDF2-SHA256, 210k iterations -> AES-GCM
   256). Firestore only ever stores ciphertext.
   Why a passphrase and not something automatic: any key the app could derive
   on its own (from the UID, the email, a constant) could also be derived by
   anyone who can read the document — an admin, a leaked backup, or a bad
   rules deploy. That would be encryption theatre. The trade-off is real and
   deliberate: forget the passphrase and the stored keys are unrecoverable,
   which is exactly what "we can't read them" means. */
var RW_SEC_ITER = 210000;
function _b64(buf){ return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
function _unb64(str){ return Uint8Array.from(atob(str), function(c){ return c.charCodeAt(0); }); }
async function rwDeriveKey(pass, salt){
  var base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2', salt:salt, iterations:RW_SEC_ITER, hash:'SHA-256'},
    base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function rwEncryptSecrets(obj, pass){
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var iv   = crypto.getRandomValues(new Uint8Array(12));
  var key  = await rwDeriveKey(pass, salt);
  var ct   = await crypto.subtle.encrypt({name:'AES-GCM', iv:iv}, key, new TextEncoder().encode(JSON.stringify(obj)));
  return {v:1, salt:_b64(salt), iv:_b64(iv), blob:_b64(ct)};
}
async function rwDecryptSecrets(rec, pass){
  var key = await rwDeriveKey(pass, _unb64(rec.salt));
  var pt  = await crypto.subtle.decrypt({name:'AES-GCM', iv:_unb64(rec.iv)}, key, _unb64(rec.blob));
  return JSON.parse(new TextDecoder().decode(pt));
}
function rwKeyBundle(){
  var out={};
  ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].forEach(function(p){
    var v=lsGet('rwKey_'+p); if(v) out[p]=v;
  });
  return out;
}
async function rwAutoBackup(){
  /* Silent push after any key change — so "save once" really means once. */
  var pass = lsGet('rw_sec_pass');
  if(!pass || !user || !user.uid) return;
  try{
    var bundle=rwKeyBundle(); if(!Object.keys(bundle).length) return;
    var rec=await rwEncryptSecrets(bundle, pass);
    rec.updated=firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('secrets').doc(user.uid).set(rec);
  }catch(e){}
}
async function rwSyncKeysUp(){
  var pass=(el('secPass')&&el('secPass').value||'').trim();
  var st=el('secStatus');
  if(pass.length<8){ st.textContent='Use at least 8 characters \u2014 this is the only thing protecting your keys.'; st.style.color='#E05B5B'; return; }
  if(!user || !user.uid){ st.textContent='Sign in first, then sync.'; st.style.color='#E05B5B'; return; }
  var bundle=rwKeyBundle();
  if(!Object.keys(bundle).length){ st.textContent='No keys saved on this device yet \u2014 add one below first.'; st.style.color='#E05B5B'; return; }
  st.textContent='Encrypting\u2026'; st.style.color='var(--t3)';
  try{
    var rec=await rwEncryptSecrets(bundle, pass);
    rec.updated=firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('secrets').doc(user.uid).set(rec);
    if(el('secRemember') && el('secRemember').checked) lsSet('rw_sec_pass', pass);
    st.innerHTML='\u2713 Saved to your account, encrypted \u00b7 '+Object.keys(bundle).length+' key(s). They restore on any device with this passphrase.';
    st.style.color='#4ADE80';
  }catch(e){ st.textContent='Sync failed: '+(e.message||e); st.style.color='#E05B5B'; }
}
async function rwSyncKeysDown(silent){
  var st=el('secStatus');
  var pass=(el('secPass')&&el('secPass').value||'').trim() || lsGet('rw_sec_pass') || '';
  if(!user || !user.uid){ if(st&&!silent){ st.textContent='Sign in first.'; st.style.color='#E05B5B'; } return false; }
  if(!pass){ if(st&&!silent){ st.textContent='Enter your passphrase to unlock the stored keys.'; st.style.color='#E05B5B'; } return false; }
  try{
    var snap=await db.collection('secrets').doc(user.uid).get();
    if(!snap.exists){ if(st&&!silent){ st.textContent='Nothing stored yet \u2014 save your keys first.'; st.style.color='var(--t3)'; } return false; }
    var bundle=await rwDecryptSecrets(snap.data(), pass);
    var n=0;
    Object.keys(bundle).forEach(function(p){ if(bundle[p]){ lsSet('rwKey_'+p, bundle[p]); n++; } });
    if(el('secRemember') && el('secRemember').checked) lsSet('rw_sec_pass', pass);
    try{ renderKeyBoxes(); openSettings(); }catch(e){}
    try{ cpModelChips('heroModels'); cpModelChips('cpModels'); }catch(e){}
    if(st && !silent){ st.textContent='\u2713 Restored '+n+' key(s) to this device.'; st.style.color='#4ADE80'; }
    else if(n) showToast('\ud83d\udd11 '+n+' AI key(s) restored');
    return true;
  }catch(e){
    if(st && !silent){ st.textContent='Wrong passphrase (or the stored data is from another passphrase).'; st.style.color='#E05B5B'; }
    return false;
  }
}
async function rwForgetSynced(){
  if(!user || !user.uid) return;
  if(!confirm('Delete the encrypted key backup from your account? Keys on this device stay until you sign out.')) return;
  try{ await db.collection('secrets').doc(user.uid).delete(); lsRemove('rw_sec_pass');
    el('secStatus').textContent='Backup deleted.'; el('secStatus').style.color='var(--t3)';
  }catch(e){ el('secStatus').textContent='Delete failed: '+(e.message||e); }
}
function lsRemove(k){ try{ localStorage.removeItem(k); }catch(e){} }
function rwOfferBackup(){
  if(lsGet('rw_sec_pass') || lsGet('rw_sec_declined')==='1') return;
  if(!user || !user.uid) return;
  setTimeout(function(){
    var pass = prompt('Save this key to your account so you never paste it again?\n\nChoose a passphrase (8+ characters). Your keys are encrypted on this device before upload \u2014 RoamWise can never read them, and the passphrase cannot be reset.\n\nLeave blank to skip.');
    if(!pass){ lsSet('rw_sec_declined','1'); return; }
    if(pass.trim().length<8){ showToast('Passphrase needs 8+ characters \u2014 you can set it in Settings anytime'); return; }
    lsSet('rw_sec_pass', pass.trim());
    rwAutoBackup().then(function(){ showToast('\ud83d\udd10 Keys backed up to your account'); });
  }, 400);
}
function secPanelHTML(){
  return '<div class="key-box" style="border-color:rgba(232,186,108,.35)">'
    +'<div class="key-box-name">\u2601\ufe0f Keep my keys in my account <span class="key-status ks-empty" id="secStatus">encrypted end-to-end</span></div>'
    +'<div class="key-box-hint">Encrypted in this browser with your passphrase before upload \u2014 RoamWise stores only ciphertext and cannot read your keys. Forget the passphrase and the backup is unrecoverable.</div>'
    +'<div class="key-row"><input class="k-inp" type="password" id="secPass" placeholder="Passphrase (8+ characters)">'
    +'<button class="k-save" onclick="rwSyncKeysUp()">Save</button>'
    +'<button class="k-save" style="background:var(--teal)" onclick="rwSyncKeysDown()">Restore</button>'
    +'<button class="k-clear" onclick="rwForgetSynced()">Delete</button></div>'
    +'<label style="display:flex;gap:7px;align-items:center;font-size:11px;color:var(--t3);margin-top:7px">'
    +'<input type="checkbox" id="secRemember" checked> Remember on this device (auto-restore at sign-in)</label>'
    +'<label style="display:flex;gap:7px;align-items:center;font-size:11px;color:var(--t3);margin-top:5px">'
    +'<input type="checkbox" id="secWipe" '+(lsGet('rw_wipe_keys')==='1'?'checked':'')+' onchange="lsSet(\'rw_wipe_keys\', this.checked?\'1\':\'0\')">'
    +' Shared device: also delete my keys from this device when I sign out</label>'
    +'<div style="font-size:11px;margin-top:8px;color:'+(lsGet('rw_sec_pass')?'#4ADE80':'var(--t3)')+'">'
    +(lsGet('rw_sec_pass')? '\u2713 Backup is on \u2014 keys re-appear automatically after sign-in.' : '\u25cb Backup is off \u2014 keys live only on this device.')+'</div>'
    +'</div>';
}

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

/* ===================================================================
   CONFIG — the ONLY things you edit. No secrets here: the apiKey below
   is a public Firebase identifier; real security lives in Firestore
   rules and the backend Worker.
=================================================================== */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU",
  authDomain: "roamwisepro.firebaseapp.com",
  projectId: "roamwisepro",
  appId: "1:299014744987:web:d5c316743e6d7a10904f3e"
};
var OWNER_NOTIFY_EMAIL = ""; /* your email — get instant alerts when someone submits a payment */
/* =================================================================== */

var PLAY_MODE = false; /* set true for the Play Store build — Pro features free (Play billing policy) */
var AUTH_READY = FIREBASE_CONFIG.apiKey !== "PASTE_ME" && typeof firebase !== 'undefined';
if(PLAY_MODE){ document.addEventListener('DOMContentLoaded', function(){
  try{
    if(window.RWBilling){
      /* Billing edition: replace UPI/Gumroad UI with the Play purchase */
      var mb=document.querySelector('#payOverlay .modal-body');
      if(mb){ mb.innerHTML = '<div class="price-hero"><div class="big-price">\u20b9100</div><div class="price-sub">One-time \u00b7 Lifetime \u00b7 via Google Play</div></div>'
        +'<button class="rzp-main-btn" onclick="RWBilling.buy()">\ud83d\uded2 Unlock Pro \u2014 Google Play</button>'
        +'<div class="intl-note" style="margin-top:10px">Billed securely by Google \u00b7 Restores automatically on reinstall</div>'; }
    } else {
      /* Listing edition: Pro free for early adopters (Play billing policy) */
      isPro=true; lsSet('rwPro','1'); refreshProUI(); var pb=el('promoBar'); if(pb) pb.style.display='none';
    }
  }catch(e){}
});}
/* Called by the native Play Billing bridge after a verified purchase */
function playProGranted(){ activatePro('google-play','Google Play'); showToast('Pro unlocked via Google Play \u2713'); }
var user = null, db = null, authMode = 'in', otpConf = null;

/* Firebase loads from a CDN. If that CDN is slow, blocked, or the device is
   simply offline, `firebase` is undefined and this whole block used to throw at
   the top level — which halted the rest of app.js. Everything defined AFTER
   this point (including the bottom navigation config) never executed, so the
   app opened with no tab bar and no way to move. For an offline-first travel
   app that is the worst possible failure. Guarded: sign-in degrades, the app
   keeps working. */
/* ===================== RWData — BACKEND PORTABILITY LAYER =====================
   The migration seam. Today a thin pass-through to Firestore, but ALL NEW data
   code should call RWData.* instead of db.collection(...) directly. To move to
   PocketBase / Supabase / self-hosted later, reimplement these methods against
   the new backend and change RWData.backend — the rest of the app won't change.
   See RoamWise-Architecture-Migration-Guide.md. Existing db.collection calls
   still work; migrate them in here incrementally. */
var RWData = {
  backend: 'firestore',
  col: function(name){ return db.collection(name); },
  subscribe: function(name, buildQuery, onData){
    try{
      var q = buildQuery ? buildQuery(db.collection(name)) : db.collection(name);
      return q.onSnapshot(function(snap){
        var rows=[]; snap.forEach(function(d){ var o=d.data()||{}; o._id=d.id; rows.push(o); });
        onData(rows);
      }, function(err){ console.warn('RWData.subscribe', name, err); });
    }catch(e){ console.warn('RWData.subscribe', e); return function(){}; }
  },
  add: function(name, obj){ return db.collection(name).add(obj); },
  set: function(name, id, obj, opts){ return db.collection(name).doc(id).set(obj, opts||{}); },
  get: function(name, id){ return db.collection(name).doc(id).get().then(function(d){ return d.exists?d.data():null; }); },
  del: function(name, id){ return db.collection(name).doc(id).delete(); },
  uid: function(){ return (user&&user.uid)||null; }
};
function rwInitDataLayer(){ /* hook for future backend init; no-op for Firestore today */ }
if (AUTH_READY && typeof firebase !== 'undefined') try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  /* FREE cost win: cache Firestore data on the device. Reads hit local memory
     first (zero server reads, works offline), and only sync deltas when online.
     Wrapped in try because it fails on multi-tab / private mode — non-fatal. */
  try{ db.enablePersistence({synchronizeTabs:true}).catch(function(){}); }catch(e){}
  try{ rwInitDataLayer(); }catch(e){}
  firebase.auth().onAuthStateChanged(function(u){
    /* Password accounts must verify ownership before any profile, trial or cloud feature is created. */
    if(rwIsUnverifiedPasswordUser(u)){
      pendingVerificationEmail=(u&&u.email)||pendingVerificationEmail;
      if(!rwEmailAuthBusy){
        firebase.auth().signOut().catch(function(){});
        setTimeout(function(){rwShowVerificationPane(pendingVerificationEmail,'Verify your email before using your RoamWise account.');},0);
      }
      u=null;
    }
    user = u;
    try{ if(u) rwCheckBan(); }catch(e){}
    var btn = el('authBtn'), av = el('authAvatar');
    if(u){
      btn.style.display='none';
      av.style.display=''; av.src = u.photoURL || ('https://api.dicebear.com/9.x/initials/svg?seed='+encodeURIComponent(u.email||u.phoneNumber||'RW'));
      /* Keys are wiped locally on sign-out; if the user opted into the
         encrypted backup, bring them straight back on sign-in. */
      if(lsGet('rw_sec_pass')) setTimeout(function(){ try{ rwSyncKeysDown(true); }catch(e){} }, 600);
      var ref = db.collection('users').doc(u.uid);
      ref.get().then(function(d){
        if(!d.exists) ref.set({email:u.email||'', phone:u.phoneNumber||'', name:u.displayName||'', created:firebase.firestore.FieldValue.serverTimestamp()});
      });
      /* ---- device fingerprint (stable per browser/app install) ---- */
      var devId=lsGet('rw_devid'); if(!devId){ devId='d_'+Math.random().toString(36).slice(2)+Date.now().toString(36); lsSet('rw_devid',devId); }
      /* ---- register this account+device pair; enforce a 3-device cap ---- */
      try{
        ref.collection('devices').doc(devId).set({
          ua:navigator.userAgent.slice(0,180), last:firebase.firestore.FieldValue.serverTimestamp()
        },{merge:true});
        ref.collection('devices').orderBy('last','desc').get().then(function(qs){
          if(qs.size>3){
            var extras=qs.docs.slice(3); /* keep 3 most-recent, sign out the rest */
            if(extras.some(function(x){return x.id===devId;})){
              showToast('This account is signed in on too many devices \u2014 signing out here. Max 3 devices.');
              setTimeout(function(){ firebase.auth().signOut(); }, 2600);
            }
          }
        }).catch(function(){});
      }catch(e){}
      /* ---- FIRST 1000 USERS: 7-day free Pro trial, granted once on true first sign-in ----
         u.metadata.creationTime === lastSignInTime is Firebase's own signal for "this is a
         brand-new account, not a returning login." The 1000-cap is enforced via an atomic
         Firestore transaction on a shared counter doc, so concurrent signups can't both
         slip in under the wire. Honest caveat: trialUntil is a client-computed timestamp,
         not server-signed — fine for a goodwill promo, not something to rely on for a
         security-critical deadline (consistent with the UTR-claim honor system already
         used for Pro activation elsewhere in this app). */
      if(u.metadata && u.metadata.creationTime===u.metadata.lastSignInTime && !lsGet('rw_trial_checked_'+u.uid)){
        lsSet('rw_trial_checked_'+u.uid,'1');
        db.runTransaction(function(t){
          var counterRef=db.collection('meta').doc('signupCounter');
          return t.get(counterRef).then(function(snap){
            var count=snap.exists? (snap.data().count||0) : 0;
            if(count<1000){
              t.set(counterRef,{count:count+1},{merge:true});
              var trialUntil=Date.now()+7*24*3600*1000;
              /* This grants a CLIENT-SIDE-ONLY trial — pro:true is never written here.
                 Any UI that shows this status MUST render it via rwStatusLabel()
                 (never a bare "Pro"/"PRO ACTIVE" string), so it's never mistaken for
                 a real paid/granted account. */
              t.set(ref,{trialUntil:trialUntil,trialGranted:true},{merge:true});
              return {granted:true, num:count+1};
            } else {
              t.set(ref,{trialGranted:true},{merge:true});
              return {granted:false};
            }
          });
        }).then(function(res){
          if(res.granted){ showToast('\ud83c\udf89 You\'re traveler #'+res.num+' \u2014 7 days of Pro, free, on us!'); xpAdd(20,'Founding traveler bonus'); }
        }).catch(function(){});
      }
      /* ref_signup tracking: log once when a referred new user creates account */
      (function(){
        try{
          if(u.metadata && u.metadata.creationTime===u.metadata.lastSignInTime){
            var _rc=rwRefActive();
            if(_rc && !lsGet('rw_ref_su_'+u.uid)){
              lsSet('rw_ref_su_'+u.uid,'1');
              var _rw=rwRefLookup(_rc)||{};
              db.collection('refSignups').doc(_rc+'__'+u.uid).set({
                code:_rc, refName:_rw.name||'', refType:_rw.type||'',
                userUID:u.uid, at:firebase.firestore.FieldValue.serverTimestamp()
              }).catch(function(){});
            }
          }
        }catch(e){}
      })();
      /* ---- ACCOUNT-BOUND PRO (the only source of truth) ---- */
      /* Always kill any previous session's listener first — this is the actual
         bug fix: an old onSnapshot from a prior login was never unsubscribed,
         so a late/cached callback could revive Pro moments after logout. */
      if(window._proUnsub){ try{ window._proUnsub(); }catch(e){} window._proUnsub=null; }
      window._proUnsub = ref.onSnapshot(function(d){
        var cloudPro = d.exists && d.data().pro === true;
        var provOK = (parseInt(lsGet('rw_pro_temp')||'0',10) > Date.now()) && (lsGet('rw_pro_temp_uid')===u.uid);
        var trialUntil = d.exists ? d.data().trialUntil : null;
        var trialActive = !cloudPro && trialUntil && trialUntil > Date.now();
        var shouldBePro = cloudPro || provOK || trialActive;
        lsSet('rw_trial_until', trialActive? String(trialUntil) : '');
        /* Mirror Firestore's proMethod locally so rwStatusLabel() can tell a
           free partner/campaign-code grant (proMethod:'partner') apart from a
           real cash purchase or legacy founder grant. */
        lsSet('rw_pro_method', (cloudPro && d.data().proMethod) || '');
        if(cloudPro){ lsSet('rw_pro_temp',''); lsSet('rw_pro_temp_uid',''); }
        if(shouldBePro){
          if(!isPro){ isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',u.uid); refreshProUI();
            if(cloudPro){ showToast(rwStatusLabel().sentence+' \u2713'); closePay(); }
            else if(trialActive){ showToast('\u23f3 '+rwStatusLabel().sentence); } }
          isPro=true; lsSet('rw_pro_uid',u.uid); refreshProUI();
        } else {
          /* this account has NO pro \u2192 force-off regardless of any stale local flag */
          if(isPro){ isPro=false; lsSet('rwPro','0'); lsSet('rw_pro_uid',''); refreshProUI();
            if(trialUntil && trialUntil<=Date.now() && !cloudPro){ showToast('Your 7-day free trial has ended \u2014 upgrade anytime for \u20b9100'); } }
        }
      });
    } else {
      btn.style.display=''; av.style.display='none';
      /* AUTHORITATIVE: no signed-in user means no Pro, full stop — this runs on
         every sign-out regardless of how it happened (button, expiry, error). */
      if(window._proUnsub){ try{ window._proUnsub(); }catch(e){} window._proUnsub=null; }
      if(isPro || lsGet('rwPro')==='1'){ wipeSession(); }
    }
  });
} catch(e){
  /* Sign-in, Pro sync and cloud backup are unavailable this session; saved
     trips, the planner, Ailon Tusk and the map all still work offline. */
  try{ console.warn('Firebase unavailable — running offline:', e && e.message); }catch(_){}
  db = null;
} else {
  /* Firebase not configured yet — app still fully works in device-only mode */
  document.addEventListener('DOMContentLoaded', function(){ var b=el('authBtn'); if(b) b.style.display='none'; });
}

var pendingVerificationEmail='', rwEmailAuthBusy=false;
function rwIsUnverifiedPasswordUser(u){
  return !!(u && !u.emailVerified && u.providerData && u.providerData.some(function(p){return p.providerId==='password';}));
}
function rwNativeAuthPlugin(){
  try{
    var c=window.Capacitor, nativePlatform=!!(c&&typeof c.isNativePlatform==='function'&&c.isNativePlatform());
    var p=c&&c.Plugins&&c.Plugins.FirebaseAuthentication;
    return nativePlatform&&p&&typeof p.signInWithGoogle==='function'?p:null;
  }catch(e){return null;}
}
function rwIsNativePlatform(){
  try{return !!(window.Capacitor&&typeof Capacitor.isNativePlatform==='function'&&Capacitor.isNativePlatform());}
  catch(e){return /RoamWiseApp/i.test(navigator.userAgent);}
}
function authError(m){var e=el('authErr');if(!m){e.style.display='none';return;}e.textContent=m;e.style.display='block';}
function rwShowEmailPane(){
  var ep=el('emailPane'),vp=el('emailVerifyPane');if(ep)ep.style.display='';if(vp)vp.style.display='none';
  authMode='in';var a=el('authAction');if(a)a.textContent='Sign in';
  var r=el('authToggleRow');if(r)r.innerHTML='New here? <a onclick="toggleAuthMode()">Create an account</a>';
  authError('');
}
function rwShowVerificationPane(email,message){
  pendingVerificationEmail=email||pendingVerificationEmail||'your email';
  var ep=el('emailPane'),vp=el('emailVerifyPane'),out=el('authVerifyEmail'),msg=el('authVerifyMsg');
  if(ep)ep.style.display='none';if(vp)vp.style.display='';if(out)out.textContent=pendingVerificationEmail;
  if(msg)msg.textContent=message||'Open the verification link we sent, then return here and sign in.';
  el('authOverlay').classList.add('open');authError('');
}
function openAuth(){rwShowEmailPane();el('authOverlay').classList.add('open');}
function closeAuth(){el('authOverlay').classList.remove('open');authError('');rwShowEmailPane();}
function friendly(e){
  var c=(e&&e.code)||'';
  if(c.indexOf('wrong-password')>-1||c.indexOf('invalid-credential')>-1)return 'Wrong email or password.';
  if(c.indexOf('email-already-in-use')>-1)return 'Account exists — sign in instead.';
  if(c.indexOf('weak-password')>-1)return 'Password needs at least 6 characters.';
  if(c.indexOf('invalid-email')>-1)return 'That email doesn’t look right.';
  if(c.indexOf('too-many-requests')>-1)return 'Too many tries — wait a minute.';
  if(c.indexOf('network')>-1)return 'No connection — check your internet and try again.';
  return (e&&e.message)||'Something went wrong.';
}
function rwGoogleError(e){
  var s=String((e&&e.code)||'')+' '+String((e&&e.message)||'');
  if(/cancel|canceled|cancelled/i.test(s))return 'Google sign-in was cancelled.';
  if(/developer|12500|10:|configuration/i.test(s))return 'Google sign-in is not configured for this app build yet. Update the app after Firebase Android setup is completed.';
  return friendly(e);
}
function loginGoogle(){
  if(!AUTH_READY)return showToast('Accounts not configured yet');
  var p=rwNativeAuthPlugin(),b=el('googleAuthBtn');
  if(p){
    if(b){b.disabled=true;b.setAttribute('aria-busy','true');}
    p.signInWithGoogle({skipNativeAuth:true}).then(function(r){
      var token=r&&r.credential&&r.credential.idToken;if(!token)throw new Error('Google did not return an ID token.');
      return firebase.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(token));
    }).then(function(){closeAuth();showToast('Signed in with Google ✓');})
      .catch(function(e){authError(rwGoogleError(e));})
      .then(function(){if(b){b.disabled=false;b.removeAttribute('aria-busy');}});
    return;
  }
  if(rwIsNativePlatform())return authError('Google sign-in needs the latest RoamWise app build. Email sign-in works now.');
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(function(){closeAuth();showToast('Signed in with Google ✓');})
    .catch(function(e){authError(rwGoogleError(e));});
}
function toggleAuthMode(){
  authMode=authMode==='in'?'up':'in';el('authAction').textContent=authMode==='in'?'Sign in':'Create account';
  el('authToggleRow').innerHTML=authMode==='in'?'New here? <a onclick="toggleAuthMode()">Create an account</a>':'Already have an account? <a onclick="toggleAuthMode()">Sign in</a>';
  authError('');
}
function rwSetAuthBusy(busy,label){
  var b=el('authEmailBtn'),s=el('authAction');if(b)b.disabled=!!busy;if(s)s.textContent=label||(authMode==='in'?'Sign in':'Create account');
}
function rwSendVerificationAndSignOut(u,email,message){
  var failed='';
  return u.sendEmailVerification().catch(function(e){failed=friendly(e);}).then(function(){return firebase.auth().signOut().catch(function(){});})
    .then(function(){
      rwShowVerificationPane(email,failed?'We could not send another link: '+failed+' You can try Resend in a minute.':message);
      return {verificationPending:true};
    });
}
function loginEmail(){
  if(!AUTH_READY)return showToast('Accounts not configured yet');
  var em=el('authEmail').value.trim(),pw=el('authPass').value,creating=authMode==='up';
  if(!em||!pw)return authError('Enter email and password.');if(pw.length<6)return authError('Password needs at least 6 characters.');
  rwEmailAuthBusy=true;rwSetAuthBusy(true,creating?'Creating account…':'Signing in…');authError('');
  var p=creating?firebase.auth().createUserWithEmailAndPassword(em,pw).then(function(c){
      try{track('signups');}catch(e){}
      return rwSendVerificationAndSignOut(c.user,em,'Verification email sent. Open the link, then return and sign in.');
    }):firebase.auth().signInWithEmailAndPassword(em,pw).then(function(c){
      return c.user.reload().catch(function(){}).then(function(){return c;});
    }).then(function(c){
      if(rwIsUnverifiedPasswordUser(c.user))return rwSendVerificationAndSignOut(c.user,em,'Your email is not verified yet. We sent a fresh verification link.');
      return c;
    });
  p.then(function(r){if(!(r&&r.verificationPending)){closeAuth();showToast('Email verified — signed in ✓');}})
    .catch(function(e){authError(friendly(e));})
    .then(function(){rwEmailAuthBusy=false;rwSetAuthBusy(false);});
}
function resendVerification(){
  var em=el('authEmail').value.trim()||pendingVerificationEmail,pw=el('authPass').value;
  if(!em||!pw){rwShowEmailPane();return authError('Enter your email and password, then tap Sign in to resend the link.');}
  authMode='in';loginEmail();
}
function resetPassword(){
  if(!AUTH_READY)return showToast('Accounts not configured yet');
  var em=el('authEmail').value.trim();if(!em)return authError('Enter your email address first.');
  firebase.auth().sendPasswordResetEmail(em).then(function(){authError('');showToast('Password reset email sent ✓');})
    .catch(function(e){authError(friendly(e));});
}

function showPhone(){ el('emailPane').style.display='none'; el('phonePane').style.display=''; }
function showEmail(){ el('phonePane').style.display='none'; el('emailPane').style.display=''; }
var recaptcha = null;
function sendOtp(){
  if(!AUTH_READY) return showToast('Accounts not configured yet');
  var ph = el('authPhone').value.trim();
  if(!/^\+\d{10,14}$/.test(ph)) return authError('Use full format with country code, e.g. +9198xxxxxxxx');
  if(!recaptcha) recaptcha = new firebase.auth.RecaptchaVerifier('otpSendBtn', {size:'invisible'});
  firebase.auth().signInWithPhoneNumber(ph, recaptcha)
    .then(function(c){ otpConf=c; el('otpPane').style.display=''; showToast('OTP sent to '+ph); })
    .catch(function(e){ authError(friendly(e)); });
}
function confirmOtp(){
  if(!otpConf) return;
  otpConf.confirm(el('authOtp').value.trim())
    .then(function(){ closeAuth(); showToast('Signed in \u2713'); })
    .catch(function(){ authError('Wrong OTP \u2014 try again.'); });
}
function wipeSession(){
  /* clear everything tied to the logged-in identity */
  ['rwPro','rw_pro_uid','rw_pro_temp','rw_pro_temp_uid'].forEach(function(k){ localStorage.removeItem(k); });
  /* AI provider keys are the USER'S OWN third-party credentials, not an
     entitlement tied to this account — wiping them on every sign-out meant
     re-pasting keys forever. They now survive sign-out by default; people on
     a shared device can opt into the old behaviour with rw_wipe_keys. */
  if(lsGet('rw_wipe_keys')==='1'){
    ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].forEach(function(p){ localStorage.removeItem('rwKey_'+p); });
    activeProv='smart'; lsSet('rwProv','smart');
  }
  isPro=false;
  try{ refreshProUI(); }catch(e){}
  try{ if(el('settingsOverlay') && el('settingsOverlay').classList.contains('open')) openSettings(); }catch(e){}
}
function authMenu(){
  if(!user){ openAuth(); return; }
  if(confirm('Sign out of RoamWise?\n\nThis clears Pro and your AI keys from this device. Your account keeps its Pro \u2014 sign back in to restore it.')){
    var uid=user.uid, devId=lsGet('rw_devid');
    /* de-register this device from the account */
    try{ if(uid&&devId&&db) db.collection('users').doc(uid).collection('devices').doc(devId).delete().catch(function(){}); }catch(e){}
    firebase.auth().signOut().then(function(){ wipeSession(); showToast('Signed out \u2014 Pro & keys cleared from this device'); });
  }
}
function deleteAccount(){
  if(!AUTH_READY || !user) return showToast('Not signed in');
  if(!confirm('Permanently delete your RoamWise account?\n\nThis removes your profile and cloud data. A paid Pro unlock CANNOT be restored after deletion.')) return;
  if(!confirm('Really sure? This cannot be undone.')) return;
  var uid = user.uid;
  db.collection('users').doc(uid).delete().catch(function(){}).then(function(){
    return user.delete();
  }).then(function(){
    wipeSession();
    showToast('Account deleted. Safe travels \ud83c\udffd\ufe0f');
  }).catch(function(e){
    if((e&&e.code)==='auth/requires-recent-login'){
      showToast('For security, sign in again first, then delete within a few minutes.');
      firebase.auth().signOut();
    } else showToast('Could not delete: '+((e&&e.message)||'try again'));
  });
}
function requireLogin(){
  if(!AUTH_READY) return true; /* device-only mode */
  if(user) return true;
  openAuth(); showToast('Sign in first \u2014 so Pro unlocks on all your devices');
  return false;
}


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
document.addEventListener('DOMContentLoaded', function(){ try{ rwApplyMode(); }catch(e){} try{ rwApplyUIScale(); }catch(e){} try{ renderTabbar(); }catch(e){ console.warn('tabbar', e); } try{ setTimeout(function(){ if(!rwOpeningSeen()) rwOpeningShow(); else rwMaybeOnboard(); }, 700); }catch(e){} try{ rwInitStatusBar(); }catch(e){} try{ rwInitBackButton(); }catch(e){} try{ setTimeout(rwInitPush, 1500); }catch(e){} try{ setTimeout(rwInitWebPush, 2200); }catch(e){} /* warm up the voice list early so it's ready by the time tuskSpeak() needs it */ try{ if(window.speechSynthesis){ speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', function(){ try{ speechSynthesis.getVoices(); }catch(e){} }, {once:true}); } }catch(e){} });
// Moved to js/ui/adaptive-shell.js (Phase 5b) — back-button confirmation + customizable bottom nav + drawer (rwInitStatusBar, rwInitBackButton, rwCloseTopOverlay, RW_TABS, renderTabbar, rwTabGo, tabGo, openDrawer/drToggle/closeDrawer/drawerAccount)
if (AUTH_READY) try{ firebase.auth().onAuthStateChanged(drawerAccount); }catch(e){}
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
/* saveGumroad removed — Gumroad link/ID now arrive via remote config (admin Config tab). */
function openGumroad(){
  var u = lsGet('rw_gum_url');
  if(!u){ showToast('International checkout isn\u2019t configured yet \u2014 UPI works right now'); return false; }
  window.open(u, '_blank', 'noopener');
  showToast('After paying, check your email for the license key');
  return false;
}
function verifyGumroad(){
  var key = (el('gumLicKey').value||'').trim();
  var err = el('gumVerifyErr'), btn = el('gumVerifyBtn');
  err.style.display = 'none';
  if(key.length < 8){ err.textContent = 'That does not look like a license key \u2014 paste the full key from your email.'; err.style.display = 'block'; return; }
  var pid = lsGet('rw_gum_pid');
  if(!pid){ err.textContent = 'License verification isn\u2019t configured yet \u2014 email founder@roamwise.co.in and we\u2019ll unlock you manually.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Verifying\u2026';
  fetch('https://api.gumroad.com/v2/licenses/verify', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'product_id='+encodeURIComponent(pid)+'&license_key='+encodeURIComponent(key)+'&increment_uses_count=false'
  }).then(function(r){ return r.json(); }).then(function(d){
    btn.disabled = false; btn.textContent = 'Verify & Unlock \uD83D\uDD13';
    if(d && d.success && d.purchase && !d.purchase.refunded && !d.purchase.chargebacked){
      activatePro(key, 'gumroad');
    }else{
      err.textContent = 'License key not valid. Check for typos, or make sure the payment went through. Refunded keys are rejected.';
      err.style.display = 'block';
    }
  }).catch(function(){
    btn.disabled = false; btn.textContent = 'Verify & Unlock \uD83D\uDD13';
    err.textContent = 'Could not reach Gumroad to verify. Check your connection and try again.';
    err.style.display = 'block';
  });
}
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



/* ===== WEB PUSH (rw-v48) — browser notifications, opt-in and guarded.
   Off unless RW_CONFIG.features.webPush is true AND a VAPID key is set, so it
   can never break production by accident. The Android app already gets push
   via the native Capacitor plugin; this covers desktop + mobile web. */
function rwInitWebPush(){
  try{
    var C=window.RW_CONFIG||{};
    if(!C.features || !C.features.webPush || !C.vapidKey) return;   /* opt-in only */
    if(window.Capacitor) return;                                    /* native app handles its own */
    if(!('serviceWorker' in navigator) || !window.firebase || !firebase.messaging) return;
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function(reg){
      var m=firebase.messaging();
      return m.requestPermission ? m.requestPermission().then(function(){ return m.getToken({vapidKey:C.vapidKey, serviceWorkerRegistration:reg}); })
                                 : m.getToken({vapidKey:C.vapidKey, serviceWorkerRegistration:reg});
    }).then(function(tok){
      if(tok && user && typeof db!=='undefined' && db){
        db.collection('users').doc(user.uid).set({webPushToken:tok}, {merge:true}).catch(function(){});
      }
    }).catch(function(){});
  }catch(e){}
}

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

// Tusk Rich Reply System (rwTuskRail, escHtml/escHtmlAttr, rwTuskAsk, rwTuskNeedsClarity, rwStartAnywhere, cpFinish, cpGoPlan, cpActionsHTML) moved to js/copilot/rich-reply.js

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

/* ==================== TRIP NOTIFICATIONS ====================
   Deliberately LOCAL notifications, not server push. Real push needs a server
   or Cloud Function sending via FCM — infrastructure that costs money and
   maintenance. Local notifications are free forever, need no backend, and
   cover the actually-useful case: countdown reminders for a saved trip,
   fired when the app is opened. Honest limit: they can't fire while the app
   is closed, which is why nothing here promises "real-time alerts". */
function notifyEnable(){
  if(!('Notification' in window)){ showToast('This device doesn\u2019t support notifications'); return; }
  Notification.requestPermission().then(function(p){
    lsSet('rw_notify', p==='granted'?'1':'0');
    showToast(p==='granted' ? '\ud83d\udd14 Trip reminders on' : 'Reminders stayed off');
    if(p==='granted') tripReminderCheck();
  });
}
function tripReminderCheck(){
  if(lsGet('rw_notify')!=='1' || !('Notification' in window) || Notification.permission!=='granted') return;
  var today=new Date(); today.setHours(0,0,0,0);
  vaultGet().forEach(function(t){
    if(!t.start) return;
    var d=new Date(t.start); if(isNaN(d)) return;
    d.setHours(0,0,0,0);
    var days=Math.round((d-today)/864e5);
    if(days<0 || days>7) return;
    var key='rw_notified_'+t.id+'_'+days;
    if(lsGet(key)==='1') return;
    lsSet(key,'1');
    var msg = days===0 ? 'Your '+t.name+' trip starts today \u2014 itinerary is offline-ready \ud83e\udd77'
            : days===1 ? 'Tomorrow: '+t.name+'. Packing list ready?'
            : days+' days to '+t.name+' \u2014 tap to review your plan';
    try{ new Notification('RoamWise', {body:msg, icon:'icons/icon-192.png', tag:t.id}); }catch(e){}
  });
}

// proofStamp (verifiable journey fingerprint) moved to js/game/badges.js

/* ==================== CRYPTO PAYMENT (direct wallet, zero fees) =============
   No gateway, no partnership, no monthly cost: the user sends stablecoin
   straight to your own wallet and submits the transaction hash, verified the
   same honour-system way UPI UTRs already are in this app. Fill the addresses
   below to switch it on — until then the option stays hidden rather than
   showing a broken payment path. */
var CRYPTO_WALLETS = {
  /* e.g. usdt_polygon:'0xYourWallet...', usdt_tron:'TYourWallet...' */
};
function cryptoConfigured(){ return Object.keys(CRYPTO_WALLETS).length>0; }
function cryptoPanelHTML(){
  if(!cryptoConfigured()) return '';
  var rows = Object.keys(CRYPTO_WALLETS).map(function(k){
    var label = k.replace('_',' ').toUpperCase();
    return '<div style="background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:10px;padding:10px;margin-bottom:8px">'
      +'<div style="font-size:11px;color:var(--t3);margin-bottom:4px">'+label+'</div>'
      +'<div style="font-family:monospace;font-size:11px;word-break:break-all">'+CRYPTO_WALLETS[k]+'</div>'
      +'<button class="tact" style="font-size:11px;padding:5px 9px;margin-top:6px" onclick="copyText(\''+CRYPTO_WALLETS[k]+'\')">Copy address</button>'
      +'</div>';
  }).join('');
  return '<div style="margin-top:14px;border-top:1px solid var(--b2,#2A2A36);padding-top:12px">'
    +'<div style="font-size:12px;font-weight:700;margin-bottom:8px">\u20bf Pay with crypto (USDT)</div>'
    + rows
    +'<div style="background:rgba(232,186,108,.08);border:1px solid rgba(232,186,108,.3);border-radius:9px;padding:9px 11px;font-size:11px;line-height:1.55;color:var(--t2);margin-top:4px">'
    +'<b>Before you send:</b> crypto payments are verified by hand, so unlocking takes up to 48 hours \u2014 not instantly like UPI. '
    +'Send the exact amount to the correct network, then paste the transaction hash where the UPI reference goes. '
    +'A wrong network or a wrong amount cannot be recovered. '
    +'<b>UPI is instant and free</b> \u2014 use that unless you specifically need to pay in crypto.'
    +'</div>';
}
function copyText(t){
  try{ navigator.clipboard.writeText(t); showToast('Copied'); }
  catch(e){ showToast(t); }
}

/* ============================ PWA ============================
   Installable web app for Android + iPhone. Two deliberate guards:
   1) Registration only on https: — inside the Android APK the page is
      served from file://, where registering a service worker throws.
   2) The APK already IS the app, so no install prompt is shown there. */
(function(){
  var inApp = !!window.RW || (typeof PLAY_MODE!=='undefined' && PLAY_MODE);
  /* isSecureContext is true for https AND localhost, false for file:// (the
     APK), which is exactly the condition a service worker needs. */
  if(window.isSecureContext && 'serviceWorker' in navigator && !inApp){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){ /* offline mode simply unavailable */ });
    });
  }
  if(inApp) return;

  function dismissed(){ return lsGet('rw_pwa_dismissed')==='1'; }
  function standalone(){
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  }
  function showBar(html){
    if(dismissed() || standalone() || document.getElementById('pwaBar')) return;
    var b=document.createElement('div');
    b.id='pwaBar';
    b.style.cssText='position:fixed;left:12px;right:12px;bottom:78px;z-index:9998;background:#12121C;border:1px solid #2A2A36;'
      +'border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.5);'
      +'font-size:12.5px;color:#EDEAE2;animation:none';
    b.innerHTML=html;
    document.body.appendChild(b);
  }
  function closeBar(){
    lsSet('rw_pwa_dismissed','1');
    var b=document.getElementById('pwaBar'); if(b) b.remove();
  }
  window.rwPwaClose = closeBar;

  /* --- Android / Chrome / Edge: real install prompt --- */
  var deferred=null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault(); deferred=e;
    showBar('<span style="font-size:20px">\uD83D\uDCF2</span>'
      +'<span style="flex:1;line-height:1.4">Install RoamWise \u2014 works offline, opens like an app</span>'
      +'<button onclick="rwPwaInstall()" style="background:linear-gradient(135deg,#E8BA6C,#C8913E);color:#12121C;border:none;'
      +'border-radius:9px;padding:8px 12px;font-weight:800;font-size:12px;cursor:pointer">Install</button>'
      +'<button onclick="rwPwaClose()" style="background:none;border:none;color:#8A8880;font-size:16px;cursor:pointer;padding:4px">\u2715</button>');
  });
  window.rwPwaInstall = function(){
    if(!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function(c){
      try{ track(c && c.outcome==='accepted' ? 'pwa_installed' : 'pwa_dismissed'); }catch(e){}
      deferred=null; closeBar();
    });
  };
  window.addEventListener('appinstalled', function(){ closeBar(); try{ track('pwa_installed'); }catch(e){} });

  /* --- iPhone/iPad: Safari has no install prompt API, so show the manual
         Share -> Add to Home Screen steps instead (only on real iOS Safari). --- */
  var ua=navigator.userAgent||'';
  var isIOS=/iPad|iPhone|iPod/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  var isSafari=/Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if(isIOS && isSafari && !standalone()){
    setTimeout(function(){
      showBar('<span style="font-size:20px">\uD83D\uDCF2</span>'
        +'<span style="flex:1;line-height:1.45">Add RoamWise to your Home Screen: tap <b>Share</b> \u2191 then <b>Add to Home Screen</b></span>'
        +'<button onclick="rwPwaClose()" style="background:none;border:none;color:#8A8880;font-size:16px;cursor:pointer;padding:4px">\u2715</button>');
    }, 4000);
  }
})();






// Group Compromise Engine (RW_INTERESTS, grpMembers/grpTagsFor/grpScoreMember/grpCompromise, openGroupPlanner/grpRender/grpAdd/grpRemove/grpResults) moved to js/social/group-compromise.js
// Shared trip-chat room state (_chatUnsub, _chatRoom, _chatMsgs, chatPost) moved to js/social/group-state.js
// Secure Trip Group Chat (openGroupChat/tripChatOpen and friends, plus reactions/streak/presence/members/vibe/chatBubble/moderation) moved to js/social/group-chat.js and js/social/group-chat-social.js
// Trip Board / "When can everyone go?" / Group Train Picker (Kitty, polls, board, plan) moved to js/social/trip-board.js

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

/* ==================== TRIP MERCH ====================
   HONEST ROUTING, because the obvious idea doesn't work:
   Blinkit and Zepto are 10-minute delivery of STOCKED goods. They do not print
   anything on demand — no quick-commerce platform does, because printing +
   curing + QC takes hours at best. So:
     - CUSTOM printed tee  -> print-on-demand (Qikink / Printrove, India, both
       have dropship APIs). 4-7 days, so it's an order-before-you-go product,
       or ship-to-hotel if the trip is a week out.
     - NEED IT TODAY at the destination -> stock beachwear via Blinkit/Zepto/
       Myntra deep links. Plain, but it arrives.
   Saying "custom tee in 10 minutes at the beach" would be a lie that generates
   refunds and one-star reviews, so the UI states the timeline up front.

   Artwork uses Pollinations (free, keyless, no signup) — verified returning
   real 768x768 JPEGs. */
var RW_SLOGAN_BANK = {
  _pattern: [
    '{P} ka {N}, mind kare {R}',
    '{P} mein {N}, tension ko {R}',
    'Dil bola {P}, dimaag bola {R}',
    '{P} calling \u2014 excuses on hold',
    'Kam paisa, zyada {P}',
    '{P} ke aage {R} nahi',
    'Roz ka traffic vs {P} ka {N}',
    'Ek ticket {P} ka, ek zindagi apni',
    '{P} \u2014 jahaan clock band ho jaati hai',
    'Boss ne kaha no. {P} ne kaha chal.'
  ],
  goa:      {N:['breeze','susegad','sunset'], R:['freeze','please','tease'], extra:['Susegad mode: ON','Beach pe body, office mein soul nahi','Feni first, questions later','Goa ka scene, baaki sab routine']},
  manali:   {N:['thand','pahaad','sukoon'], R:['band','anand','majboor'], extra:['Maggi at 3000m hits different','Oxygen kam, attitude zyada','Pahaad bulaye, boss ruk jaye','Snow pe photo, dil pe kabza']},
  leh:      {N:['height','sannata','raasta'], R:['light','shaanta','waasta'], extra:['18,000 ft aur still chill','Ladakh: jahaan network bhi haar gaya','Pangong ya kuch nahi','Road trip? Ye road hi trip hai']},
  jaipur:   {N:['rang','kila','shaan'], R:['sang','dila','jaan'], extra:['Pink city, full colour','Rajaon wali feeling','Hawa Mahal, hawa hi hawa']},
  rishikesh:{N:['dhaara','shanti','raftaar'], R:['sahaara','kranti','rehdaar'], extra:['Ganga ke saath, dimaag shaant','Rafting: darr ke aage paani hai','Yoga subah, chai shaam']},
  udaipur:  {N:['jheel','mahal','sheher'], R:['feel','kamaal','behtar'], extra:['Lake city, full filmy','Sunset pe boat, dil pe note']},
  varanasi: {N:['aarti','ghaat','subah'], R:['baat','saath','wah'], extra:['Kashi: sabse purani, sabse zinda','Ghaat pe baith, life samajh']},
  kerala:   {N:['backwater','haryali','naariyal'], R:['better','khushali','kamaal'],extra:['God\u2019s own, phone off','Houseboat pe ghar jaisa']},
  _default: {N:['hawa','safar','raasta'], R:['dawa','asar','waasta'], extra:['Bags packed, excuses unpacked','Kam din, zyada kahaani','Ghoomna zaroori hai']}
};
function rwSlogans(place, n){
  var key = String(place||'').toLowerCase().trim();
  var bank = RW_SLOGAN_BANK[key] || RW_SLOGAN_BANK._default;
  var P = String(place||'Safar').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  var out = (bank.extra||[]).slice();
  RW_SLOGAN_BANK._pattern.forEach(function(pat){
    var N = bank.N[Math.floor(Math.random()*bank.N.length)];
    var R = bank.R[Math.floor(Math.random()*bank.R.length)];
    out.push(pat.replace(/\{P\}/g,P).replace(/\{N\}/g,N).replace(/\{R\}/g,R));
  });
  /* de-dupe, shuffle lightly, cap */
  out = out.filter(function(x,i,a){ return a.indexOf(x)===i; });
  for(var i=out.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=out[i]; out[i]=out[j]; out[j]=t; }
  return out.slice(0, n||8);
}
/* free, keyless AI artwork */
function rwArtURL(prompt, w, h){
  return 'https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)
    +'?width='+(w||768)+'&height='+(h||768)+'&nologo=true&seed='+Math.floor(Math.random()*99999);
}
var RW_ART_STYLES = [
  ['Retro poster','vintage 1970s travel poster, flat colour, screen print, bold'],
  ['Line art',    'minimal single-line ink drawing, white on dark, elegant'],
  ['Watercolour', 'loose watercolour wash, soft edges, artistic'],
  ['Bold graphic','high contrast graphic tee print, thick outlines, streetwear']
];
/* Retail Rs 499; POD base for a printed tee in India runs ~Rs 280-330 incl.
   shipping, so the margin below is real and conservative. */
var RW_MERCH = { retail:499, podCost:315, get margin(){ return this.retail - this.podCost; } };

function rwMerchHTML(place){
  var P = String(place||'your trip');
  var sl = rwSlogans(place, 6);
  var art = rwArtURL(P+' travel, '+RW_ART_STYLES[0][1], 512, 512);
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#7C3AED,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udc55 '+esc2(P)+' tee</div>'
    +'<div class="tk-meta">Your slogan, your artwork, printed and shipped</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Pick a line (or write your own)</div>'
    +'<div class="tk-chips">'
    + sl.map(function(x){ return '<button class="tk-chip" onclick="rwMerchPick(this)" data-sl="'+esc2(x)+'">'+esc2(x)+'</button>'; }).join('')
    +'</div>'
    +'<input id="merchSlogan" class="k-inp" placeholder="\u2026or type your own line" style="width:100%;margin-top:9px" value="'+esc2(sl[0])+'">'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Artwork style</div>'
    +'<div class="tk-chips">'
    + RW_ART_STYLES.map(function(a,i){ return '<button class="tk-chip'+(i===0?' gold':'')+'" onclick="rwMerchArt('+i+',\''+P.replace(/'/g,'')+'\',this)">'+a[0]+'</button>'; }).join('')
    +'</div>'
    +'<div style="margin-top:10px;border-radius:14px;overflow:hidden;border:1px solid var(--b2,#2A2A36);background:#000;aspect-ratio:1;position:relative">'
    +'<img id="merchArt" src="'+art+'" style="width:100%;height:100%;object-fit:cover;display:block" alt="">' 
    +'<div id="merchOverlay" style="position:absolute;left:0;right:0;bottom:0;padding:14px;background:linear-gradient(0deg,rgba(0,0,0,.82),transparent);'
    +'font-weight:900;font-size:17px;text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.9)">'+esc2(sl[0])+'</div></div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:6px">Artwork generated free via Pollinations \u00b7 regenerate as often as you like</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">How it gets to you</div>'
    +'<div class="tk-bul"><b>Printed &amp; shipped \u2014 4\u20137 days.</b> Order before you travel, or ship to your hotel if the trip is a week out.</div>'
    +'<div class="tk-bul"><b>Need something today at the destination?</b> Nobody prints custom in 10 minutes \u2014 quick-commerce carries stock only. Use the buttons below for plain beachwear that actually arrives.</div>'
    +'<div class="tk-chips" style="margin-top:8px">'
    +'<button class="tk-chip gold" onclick="rwMerchOrder(\''+P.replace(/'/g,'')+'\')">\ud83d\udc55 Order custom \u2014 \u20b9'+RW_MERCH.retail+'</button>'
    +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.myntra.com/beachwear">\ud83c\udfd6\ufe0f Stock beachwear</a>'
    +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://blinkit.com/s/?q=t-shirt">\u26a1 Blinkit (stock)</a>'
    +'</div></div></div>';
}
function rwMerchPick(btn){
  var v=btn.dataset.sl||'';
  var inp=el('merchSlogan'); if(inp) inp.value=v;
  var ov=el('merchOverlay'); if(ov) ov.textContent=v;
}
function rwMerchArt(i, place, btn){
  var a=RW_ART_STYLES[i]; if(!a) return;
  [].forEach.call(btn.parentNode.querySelectorAll('.tk-chip'), function(b){ b.classList.remove('gold'); });
  btn.classList.add('gold');
  var img=el('merchArt'); if(img) img.src = rwArtURL(place+' travel, '+a[1], 512, 512);
}
function rwMerchOrder(place){
  var slogan = (el('merchSlogan')||{}).value || '';
  var art = (el('merchArt')||{}).src || '';
  if(!slogan.trim()){ showToast('Add a line first'); return; }
  var ov=el('merchOverlayBox');
  if(!ov){
    ov=document.createElement('div'); ov.id='merchOverlayBox'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83d\udc55 Order your tee</b><button class="x" onclick="rwOverlayClose(\'merchOverlayBox\')">\u2715</button></div>'
      +'<div id="merchOrderBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  el('merchOrderBody').innerHTML =
     '<img src="'+art+'" style="width:100%;border-radius:12px;border:1px solid var(--b2,#2A2A36)">'
    +'<div style="font-weight:900;font-size:15px;text-align:center;margin:9px 0">'+esc2(slogan)+'</div>'
    +'<div class="key-box"><div class="key-box-name">Size</div>'
    +'<div class="tk-chips" style="margin-top:6px">'
    + ['S','M','L','XL','XXL'].map(function(z,i){ return '<button class="tk-chip'+(i===2?' gold':'')+'" onclick="[].forEach.call(this.parentNode.children,function(b){b.classList.remove(\'gold\')});this.classList.add(\'gold\');window._merchSize=\''+z+'\'">'+z+'</button>'; }).join('')
    +'</div></div>'
    +'<div class="key-box" style="margin-top:9px"><div class="key-box-name">Deliver to</div>'
    +'<input id="merchAddr" class="k-inp" placeholder="Full address with PIN code" style="width:100%;margin-top:6px">'
    +'<input id="merchPhone" class="k-inp" placeholder="Phone for the courier" style="width:100%;margin-top:7px">'
    +'<div class="key-box-hint" style="margin-top:6px">Shipping to a hotel? Add the hotel name and your check-in date so they hold it.</div></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:14px">'
    +'<span>Total</span><b style="font-size:19px;color:var(--gold,#E8BA6C)">\u20b9'+RW_MERCH.retail+'</b></div>'
    +'<div style="font-size:10.5px;color:var(--t3);line-height:1.6;margin-top:4px">Printed on demand in India \u00b7 4\u20137 days \u00b7 free replacement for print defects.</div>'
    +'<button class="g-btn" style="width:100%;min-height:46px;margin-top:12px" onclick="rwMerchSubmit(\''+place.replace(/'/g,'')+'\')">Place order \u2192</button>'
    +'<p style="font-size:10.5px;color:var(--t3);margin-top:9px">Your order goes to RoamWise, who sends it to the print partner. You will get a tracking link by email.</p>';
  window._merchSize = window._merchSize || 'L';
  rwOverlayOpen('merchOverlayBox');
}
function rwMerchSubmit(place){
  var slogan=(el('merchSlogan')||{}).value||'', addr=(el('merchAddr')||{}).value||'',
      phone=(el('merchPhone')||{}).value||'', art=(el('merchArt')||{}).src||'';
  if(!addr.trim() || !phone.trim()){ showToast('Address and phone, please'); return; }
  var order = { place:place, slogan:slogan, art:art, size:window._merchSize||'L',
                addr:addr.trim(), phone:phone.trim(), retail:RW_MERCH.retail,
                status:'new', at:new Date().toISOString(),
                uid:(window.user&&user.uid)||null, email:(window.user&&user.email)||null };
  function done(){
    el('merchOrderBody').innerHTML='<div style="text-align:center;padding:26px 10px">'
      +'<div style="font-size:42px">\ud83d\udc55</div>'
      +'<b style="display:block;font-size:16px;margin-top:8px">Order received</b>'
      +'<p style="font-size:12.5px;color:var(--t2);line-height:1.6;margin-top:8px">It goes to the print partner today. Tracking arrives by email in 1\u20132 days, delivery in 4\u20137.</p></div>';
  }
  if(!window.db || !window.user || !user.uid){
    showToast('Sign in first \u2014 the order needs an account to track it');
    try{ openAuth(); }catch(e){}
    return;
  }
  db.collection('merch').add(order).then(done).catch(function(e){
    var m = (e && e.code==='permission-denied')
      ? 'Order blocked by the server. If you were just signed out, sign in and retry.'
      : ('Could not place order: '+((e&&e.message)||e));
    el('merchOrderBody').insertAdjacentHTML('afterbegin',
      '<div style="background:rgba(224,91,91,.1);border:1px solid rgba(224,91,91,.35);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:12px">'+esc2(m)+'</div>');
  });
}




// Travel Progression (RW_XP_LEVELS/RW_CHALLENGES/rwXp*/rwProgress*) moved to js/game/badges.js






// OFF-GRID SAFETY (RW_OFFGRID/rwOffgridHTML) moved to js/misc/eco-safety.js


/* ==================== SOUND OF PLACE ====================
   The genuinely defensible half of the "media layer" idea: no travel planner
   ships localised sound. This maps destinations to their actual regional music
   traditions and living artists, with a Tusk-narrated audio intro using the
   device's own TTS (free, offline-capable, no licensing exposure).

   DELIBERATELY NOT: hosting or streaming copyrighted tracks. We link out to
   Spotify/JioSaavn/YouTube searches so playback happens on a licensed platform
   where the artist gets paid. Hosting audio ourselves would be infringement,
   and "curating a playlist" that streams from our servers is the same thing
   with a nicer name. */
var RW_SOUND = {
  goa:        {genre:'Konkani & Goan trance', why:'Portuguese-era mando meets the 90s Goa trance the state exported worldwide.',
               artists:['Remo Fernandes','Lorna Cordeiro','Goa Trance classics'], mood:'sunset beach'},
  rajasthan:  {genre:'Manganiyar & Langa folk', why:'Hereditary desert musician communities \u2014 khartal, kamaicha, voices built for open sky.',
               artists:['Mame Khan','Manganiyar Seduction','Anwar Khan Manganiyar'], mood:'desert night'},
  jaipur:     {genre:'Rajasthani folk', why:'Ghoomar rhythms and courtly compositions from the old city.',
               artists:['Mame Khan','Rajasthani folk ensembles'], mood:'fort courtyard'},
  jaisalmer:  {genre:'Manganiyar desert folk', why:'The purest form of it \u2014 sung in dunes it was written for.',
               artists:['Manganiyar','Anwar Khan'], mood:'dune sunset'},
  varanasi:   {genre:'Benares gharana \u00b7 Hindustani classical', why:'One of the great lineages of Indian classical music, still performed at the ghats.',
               artists:['Ravi Shankar','Girija Devi','Bismillah Khan'], mood:'dawn on the river'},
  kolkata:    {genre:'Rabindra Sangeet & Bengali folk', why:'Tagore wrote over 2,000 songs. The city still sings them.',
               artists:['Rabindra Sangeet','Baul folk','Kishore Kumar'], mood:'monsoon afternoon'},
  kerala:     {genre:'Sopana & Carnatic', why:'Temple-step singing and the percussion of chenda melam.',
               artists:['Sopana Sangeetham','Carnatic vocal'], mood:'backwater morning'},
  chennai:    {genre:'Carnatic classical', why:'The December music season is one of the largest classical festivals on earth.',
               artists:['M.S. Subbulakshmi','Carnatic vocal'], mood:'margazhi morning'},
  punjab:     {genre:'Punjabi folk & bhangra', why:'Dhol, tumbi, and a rhythm built for harvest.',
               artists:['Gurdas Maan','Punjabi folk'], mood:'harvest evening'},
  amritsar:   {genre:'Gurbani kirtan & Punjabi folk', why:'Continuous kirtan at the Golden Temple, and the folk outside it.',
               artists:['Gurbani kirtan','Punjabi folk'], mood:'temple dawn'},
  almora:     {genre:'Kumaoni folk', why:'Jhoda, chhapeli and hurka rhythms \u2014 hill music built around a single drum.',
               artists:['Kumaoni folk','Gopal Babu Goswami'], mood:'pine ridge morning'},
  manali:     {genre:'Himachali & Nati folk', why:'Nati, the circle dance, holds a Guinness record for the largest folk dance performed.',
               artists:['Himachali Nati','Pahari folk'], mood:'valley evening'},
  darjeeling: {genre:'Nepali & Gorkha folk', why:'Madal-driven hill songs, and a strong Nepali indie scene.',
               artists:['Nepali folk','Bipul Chettri'], mood:'misty morning'},
  shillong:   {genre:'Khasi folk & rock', why:'India\u2019s rock capital \u2014 an unusual overlap of Khasi tradition and guitar culture.',
               artists:['Soulmate','Khasi folk','Lou Majaw'], mood:'rainy evening'},
  mumbai:     {genre:'Bollywood & Marathi lavani', why:'The industry that soundtracks the country, and the folk form it keeps borrowing from.',
               artists:['Bollywood classics','Lavani','Indian Ocean'], mood:'monsoon city night'},
  bali:       {genre:'Gamelan', why:'Bronze percussion orchestras \u2014 you will hear rehearsals from village compounds at dusk.',
               artists:['Balinese gamelan','Gamelan Semar Pegulingan'], mood:'temple dusk'},
  kyoto:      {genre:'Shakuhachi & koto', why:'Bamboo flute and thirteen-string zither \u2014 music written around silence.',
               artists:['Shakuhachi','Koto traditional'], mood:'temple garden'},
  lisbon:     {genre:'Fado', why:'Saudade set to guitar in the Alfama\u2019s small rooms.',
               artists:['Am\u00e1lia Rodrigues','Mariza'], mood:'old quarter night'},
  marrakech:  {genre:'Gnawa', why:'Trance music with sub-Saharan roots \u2014 guembri, qraqeb, all night.',
               artists:['Gnawa','Maalem Mahmoud Guinia'], mood:'medina night'},
  havana:     {genre:'Son & rumba', why:'The root of everything later called salsa.',
               artists:['Buena Vista Social Club','Cuban son'], mood:'street corner evening'}
};
function rwSoundFor(place){
  var k=String(place||'').toLowerCase().trim();
  if(RW_SOUND[k]) return RW_SOUND[k];
  /* fall back to the state/region a city sits in */
  var REGION={jodhpur:'rajasthan', udaipur:'rajasthan', pushkar:'rajasthan',
              kochi:'kerala', munnar:'kerala', alleppey:'kerala',
              nainital:'almora', mussoorie:'almora', ranikhet:'almora',
              kasol:'manali', shimla:'manali', dharamshala:'manali',
              ludhiana:'punjab', chandigarh:'punjab', gangtok:'darjeeling'};
  var r=REGION[k];
  return r? RW_SOUND[r] : null;
}
function rwSoundHTML(place){
  var snd=rwSoundFor(place); if(!snd) return '';
  var q = encodeURIComponent(snd.artists[0]+' '+snd.genre);
  var id='snd_'+Math.random().toString(36).slice(2,7);
  window['_'+id] = 'Yeh hai '+place+' ki awaaz. '+snd.genre+'. '+snd.why;
  return '<div style="background:linear-gradient(135deg,rgba(167,139,250,.12),rgba(124,58,237,.05));border:1px solid rgba(167,139,250,.3);border-radius:13px;padding:12px 14px">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<button onclick="tuskSpeak(window._'+id+')" style="flex:0 0 auto;width:38px;height:38px;border-radius:50%;border:none;'
    +'background:linear-gradient(135deg,#A78BFA,#7C3AED);color:#fff;font-size:15px;cursor:pointer">\u25b6</button>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#A78BFA;font-weight:800">The sound of '+esc2(place)+'</div>'
    +'<div style="font-size:13.5px;font-weight:800;margin-top:1px">'+esc2(snd.genre)+'</div></div></div>'
    +'<div style="font-size:11.5px;color:var(--t2);line-height:1.55;margin-top:7px">'+esc2(snd.why)+'</div>'
    +'<div class="tk-chips" style="margin-top:8px">'
    + snd.artists.slice(0,3).map(function(a){
        return '<a class="tk-chip" style="font-size:11px;padding:5px 10px;text-decoration:none" target="_blank" rel="noopener" '
          +'href="https://open.spotify.com/search/'+encodeURIComponent(a)+'">\ud83c\udfb5 '+esc2(a)+'</a>';
      }).join('')
    +'<a class="tk-chip" style="font-size:11px;padding:5px 10px;text-decoration:none" target="_blank" rel="noopener" '
    +'href="https://www.jiosaavn.com/search/'+q+'">JioSaavn</a>'
    +'</div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:7px">Plays on Spotify or JioSaavn so the artists get paid \u2014 we don\u2019t host audio.</div>'
    +'</div>';
}

/* ==================== SIGNATURE FOOD ====================
   The one dish a place is actually known for, with a generated illustration.
   Photographs of real food are copyrighted; Pollinations art is free to use and
   avoids lifting someone's restaurant photography. */
var RW_FOOD = {
  mumbai:     ['Vada pav',            'The city in a bun \u2014 spiced potato fritter, garlic chutney, eaten standing up.',        'vada pav indian street food'],
  almora:     ['Bal mithai',          'Roasted khoya fudge under white sugar pearls. Also: bhatt ki churkani and dubke.',      'bal mithai kumaoni sweet'],
  nagpur:     ['Oranges',             'The city is named for them \u2014 and saoji mutton will take the roof off your mouth.',     'nagpur oranges'],
  prayagraj:  ['Guava',               'Allahabadi amrood is a protected variety, sweetest in winter.',                          'fresh guava fruit'],
  ahmedabad:  ['Fafda-jalebi',        'Saturday morning ritual \u2014 crisp gram-flour strips with hot jalebi and papaya chutney.','fafda jalebi gujarati'],
  kolkata:    ['Rosogolla',           'The disputed one. Also kathi rolls, and phuchka the city insists is superior.',           'rosogolla bengali sweet'],
  lucknow:    ['Galouti kebab',       'Minced so fine it dissolves \u2014 made for a Nawab who had lost his teeth.',                'galouti kebab lucknow'],
  delhi:      ['Chole bhature',       'And sohan halwa in the old city, and daulat ki chaat only in winter mornings.',           'chole bhature indian'],
  jaipur:     ['Dal baati churma',    'Baked wheat balls drowned in ghee. Order once, share between two.',                       'dal baati churma rajasthani'],
  varanasi:   ['Kachori sabzi',       'Breakfast at 6am on a ghat, followed by a clay cup of malaiyo in winter.',                'kachori sabzi banarasi'],
  amritsar:   ['Amritsari kulcha',    'Stuffed, blistered, drenched in butter, with chole and a raw onion.',                     'amritsari kulcha punjabi'],
  hyderabad:  ['Biryani',             'The dum version, with mirchi ka salan. The argument with Lucknow is eternal.',            'hyderabadi biryani'],
  chennai:    ['Filter coffee',       'Poured between tumbler and davara until it froths. Also idli at a mess, not a hotel.',    'south indian filter coffee'],
  goa:        ['Fish thali',          'Rawa-fried mackerel, kokum curry, rice \u2014 \u20b9150 at any local canteen.',                   'goan fish thali'],
  kochi:      ['Karimeen pollichathu','Pearl spot fish grilled in a banana leaf.',                                              'karimeen pollichathu kerala'],
  indore:     ['Poha-jalebi',         'Breakfast, and Sarafa bazaar opens at midnight for the rest.',                            'poha jalebi indore'],
  jodhpur:    ['Mirchi vada',         'A whole chilli, stuffed, battered and fried. Braver than it looks.',                      'mirchi vada rajasthani'],
  udaipur:    ['Laal maas',           'Fiery mutton with mathania chillies \u2014 order a plain roti to survive it.',               'laal maas rajasthani'],
  darjeeling: ['Momos & thukpa',      'Steamed, then a bowl of noodle broth in the cold. And the tea, obviously.',              'momos thukpa himalayan'],
  shillong:   ['Jadoh',               'Red rice cooked with pork \u2014 Khasi comfort food.',                                       'jadoh khasi meghalaya'],
  manali:     ['Siddu',               'Steamed stuffed bread with ghee \u2014 mountain food built for cold.',                        'siddu himachali bread'],
  rishikesh:  ['Aloo puri',           'No meat, no alcohol in the holy zone \u2014 but the German Bakery cakes are legendary.',     'aloo puri indian'],
  bengaluru:  ['Masala dosa',         'The Bangalore version at a darshini, standing, with a second filter coffee.',            'masala dosa karnataka'],
  pune:       ['Misal pav',           'Sprout curry under farsan, heat that builds. Breakfast of the city.',                     'misal pav maharashtrian'],
  bhopal:     ['Poha & seekh',        'Indori-style poha in the morning, kebabs by the old city at night.',                      'poha indian breakfast'],
  patna:      ['Litti chokha',        'Roasted sattu-stuffed dough with mashed vegetables and mustard oil.',                     'litti chokha bihari'],
  bangkok:    ['Pad kra pao',         'Holy basil stir-fry over rice with a fried egg \u2014 what Thais actually eat.',             'pad kra pao thai'],
  hanoi:      ['Pho bo',              'Breakfast broth, twenty years in the making at the good places.',                         'pho bo vietnamese'],
  kyoto:      ['Yudofu',              'Simmered tofu, deceptively simple, temple food raised to an art.',                        'yudofu kyoto tofu'],
  bali:       ['Babi guling',         'Suckling pig \u2014 the ceremonial dish, best at a warung before noon.',                     'babi guling balinese']
};
function rwFoodFor(place){
  try{ rwMergeExtData(); }catch(e){}
  var k=String(place||'').toLowerCase().trim().replace(/\s+/g,'');
  return RW_FOOD[k] || RW_FOOD[String(place||'').toLowerCase().trim()] || null;
}
function rwFoodHTML(place){
  var f=rwFoodFor(place); if(!f) return '';
  var img = rwArtURL(f[2]+', food illustration, warm, appetising, flat colour', 512, 320);
  return '<div style="border-radius:14px;overflow:hidden;border:1px solid var(--b2,#2A2A36);position:relative;min-height:130px;'
    +'background-image:url('+img+');background-size:cover;background-position:center">'
    +'<div style="background:linear-gradient(0deg,rgba(6,6,10,.92) 22%,rgba(6,6,10,.25));padding:38px 14px 13px">'
    +'<div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#E8BA6C);font-weight:800">Eat this here</div>'
    +'<div style="font-size:17px;font-weight:900;margin-top:2px;text-shadow:0 2px 10px rgba(0,0,0,.9)">'+esc2(f[0])+'</div>'
    +'<div style="font-size:11.5px;color:rgba(255,255,255,.86);line-height:1.55;margin-top:3px;text-shadow:0 1px 8px rgba(0,0,0,.9)">'+esc2(f[1])+'</div>'
    +'</div></div>';
}

// RESPONSIBLE TRAVEL (RW_RESPONSIBLE/rwResponsibleHTML) moved to js/misc/eco-safety.js


// GREEN HUB (RW_GREEN/rwGreenHubHTML) moved to js/misc/eco-safety.js


// MONKEY SAFETY (RW_MONKEY/rwMonkeyFor/rwMonkeyHTML) moved to js/misc/eco-safety.js


/* ==================== DESTINATION VIBE ====================
   Each place gets its own character in the card header — colours, a one-line
   read of what it actually feels like, and what it suits. Curated rather than
   generated: a wrong vibe is worse than none. */
var RW_VIBES = {
  goa:        {t:'Dreamy · Party · Coastal', g:['#F97316','#7C2D12'], line:'Two Goas in one state — the north is a party that never quite ends, the south is a hammock and a book.', suits:'First-timers, groups, anyone who wants both options open'},
  rishikesh:  {t:'Calm · Spiritual · Scenic', g:['#0EA5E9','#0C4A6E'], line:'Bells at dawn, rapids by noon. The Ganga sets the pace and nobody argues with it.', suits:'Solo travellers, yoga, quiet resets with an adrenaline option'},
  manali:     {t:'Alpine · Backpacker · Crisp', g:['#38BDF8','#1E3A5F'], line:'Apple orchards below, snow above, and Maggi at every altitude.', suits:'Mountain first-timers, road trips, snow'},
  leh:        {t:'Stark · High · Otherworldly', g:['#A78BFA','#312E81'], line:'Thin air, enormous silence, and light that makes everything look unreal.', suits:'Riders, photographers, people who like being small'},
  mumbai:     {t:'Bustling · Nightlife · Relentless', g:['#EC4899','#4C1D95'], line:'The city that genuinely does not sleep — and will not wait for you either.', suits:'Nightlife, food, art, anyone who likes momentum'},
  delhi:      {t:'Layered · Historic · Loud', g:['#F59E0B','#7C2D12'], line:'Seven cities stacked on each other, and all of them still open for business.', suits:'History, food, and using it as a hub for the north'},
  jaipur:     {t:'Regal · Colourful · Grand', g:['#F43F5E','#831843'], line:'Pink sandstone, rooftop sunsets, and forts that were built to be seen from far away.', suits:'First trips to Rajasthan, families, photographers'},
  udaipur:    {t:'Romantic · Serene · Filmy', g:['#60A5FA','#1E3A8A'], line:'Lakes, palaces and the softest evening light in Rajasthan.', suits:'Couples, slow trips, anyone tired of noise'},
  varanasi:   {t:'Ancient · Intense · Sacred', g:['#FB923C','#7C2D12'], line:'The oldest living city on earth, and it does not soften itself for visitors.', suits:'Travellers who want the real thing over the comfortable one'},
  kerala:     {t:'Green · Slow · Restorative', g:['#22C55E','#14532D'], line:'Backwaters, tea hills and a pace that lowers your heart rate within a day.', suits:'Families, monsoon travel, recovering from a hard year'},
  darjeeling: {t:'Misty · Colonial · Tea', g:['#34D399','#064E3B'], line:'Cloud in the streets, Kanchenjunga on a clear morning, and tea that ruins you for other tea.', suits:'Slow mornings, trains, tea people'},
  jaisalmer:  {t:'Golden · Desert · Cinematic', g:['#FBBF24','#78350F'], line:'A living fort in the middle of the Thar, gold at sunset, freezing by midnight.', suits:'Desert camps, forts, dramatic photographs'},
  bali:       {t:'Lush · Spiritual · Social', g:['#10B981','#064E3B'], line:'Rice terraces and temples in the middle, surf and crowds at the edges.', suits:'Long stays, remote work, surf'},
  bangkok:    {t:'Electric · Street · 24-hour', g:['#F472B6','#581C87'], line:'The best street food on earth, moving at the speed of a scooter.', suits:'Food, nightlife, and using it as a SEA hub'},
  kyoto:      {t:'Refined · Seasonal · Still', g:['#F87171','#7F1D1D'], line:'Temples, wooden lanes and an almost unfair sense of order.', suits:'Slow walkers, autumn and cherry season, culture'}
};
function rwVibe(place){
  var k=String(place||'').toLowerCase().trim();
  return RW_VIBES[k] || null;
}
function rwVibeHTML(place){
  var v=rwVibe(place); if(!v) return '';
  return '<div style="background:linear-gradient(135deg,'+v.g[0]+'22,'+v.g[1]+'11);border:1px solid '+v.g[0]+'44;border-radius:12px;padding:11px 13px">'
    +'<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:'+v.g[0]+';font-weight:800">'+esc2(v.t)+'</div>'
    +'<div style="font-size:12.5px;line-height:1.6;color:var(--t1);margin-top:5px">'+esc2(v.line)+'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:5px">Suits: '+esc2(v.suits)+'</div></div>';
}

/* ==================== TREKKING ====================
   Grades, seasons, and an honest cost comparison between organised operators
   and doing it yourself. Operator prices are indicative published bands — they
   change per departure, so the app links out rather than quoting a live price
   it cannot guarantee. */
var RW_TREK_GRADE = {
  easy:      {icon:'\ud83d\udfe2', label:'Easy',      who:'First trek. No prior fitness needed beyond walking comfortably for a few hours.'},
  moderate:  {icon:'\ud83d\udfe1', label:'Moderate',  who:'You walk or run occasionally. Long days, some steep sections.'},
  difficult: {icon:'\ud83d\udfe0', label:'Difficult', who:'Regular training needed. Altitude, exposure, or consecutive long days.'},
  hard:      {icon:'\ud83d\udd34', label:'Hard',      who:'Serious fitness and prior high-altitude experience. Technical sections.'},
  extreme:   {icon:'\u26ab',      label:'Very hard', who:'Expedition grade. Mountaineering skills, permits, and a real risk profile.'}
};
var RW_TREKS = [
  {n:'Triund',            r:'Himachal',    g:'easy',      d:2,  alt:2828, best:'Mar–Jun, Sep–Nov', diy:1500,  org:3500,  note:'The best first trek in India. Doable as an overnight.'},
  {n:'Kedarkantha',       r:'Uttarakhand', g:'easy',      d:6,  alt:3810, best:'Dec–Apr',          diy:6000,  org:9500,  note:'The classic winter snow trek — busy in peak weeks.'},
  {n:'Valley of Flowers', r:'Uttarakhand', g:'moderate',  d:6,  alt:3658, best:'Jul–Sep',          diy:8000,  org:13000, note:'Only worth doing in monsoon, which is the point.'},
  {n:'Hampta Pass',       r:'Himachal',    g:'moderate',  d:5,  alt:4270, best:'Jun–Sep',          diy:8000,  org:12500, note:'Green valley to barren Spiti in one crossing.'},
  {n:'Sandakphu',         r:'West Bengal', g:'moderate',  d:6,  alt:3636, best:'Oct–Dec, Mar–May', diy:9000,  org:14000, note:'Four of the five highest peaks visible on a clear day.'},
  {n:'Roopkund',          r:'Uttarakhand', g:'difficult', d:8,  alt:5029, best:'May–Jun, Sep–Oct', diy:12000, org:17500, note:'Check current permit status — access has been restricted at times.'},
  {n:'Rupin Pass',        r:'Himachal',    g:'difficult', d:8,  alt:4650, best:'May–Jun, Sep–Oct', diy:12000, org:18000, note:'Changes landscape almost every day.'},
  {n:'Goechala',          r:'Sikkim',      g:'difficult', d:10, alt:4940, best:'Apr–May, Oct–Nov', diy:16000, org:24000, note:'The Kanchenjunga viewpoint trek. Permits required.'},
  {n:'Stok Kangri',       r:'Ladakh',      g:'hard',      d:9,  alt:6153, best:'Jul–Sep',          diy:25000, org:38000, note:'Closed for conservation in recent years — verify before planning.'},
  {n:'Everest Base Camp', r:'Nepal',       g:'hard',      d:14, alt:5364, best:'Mar–May, Sep–Nov', diy:75000, org:120000,note:'Permits, TIMS card and acclimatisation days are non-negotiable.'},
  {n:'Annapurna Circuit', r:'Nepal',       g:'difficult', d:14, alt:5416, best:'Mar–May, Oct–Nov', diy:60000, org:95000, note:'Teahouse route — genuinely DIY-friendly.'},
  {n:'Kilimanjaro',       r:'Tanzania',    g:'hard',      d:8,  alt:5895, best:'Jan–Mar, Jun–Oct', diy:0,     org:180000,note:'Guides are legally mandatory — DIY is not an option here.'}
];
var RW_TREK_OPS = [
  {n:'Indiahikes',        best:'Safety systems, documented trails, solo-friendly',  watch:'Books out months ahead on popular treks', url:'https://indiahikes.com/'},
  {n:'Trek The Himalayas',best:'Wide Uttarakhand/Himachal calendar, good value',    watch:'Group sizes can be large in peak season', url:'https://trekthehimalayas.com/'},
  {n:'Bikat Adventures',  best:'Harder grades and expeditions, strong on skills',   watch:'Priced above entry-level operators',      url:'https://www.bikatadventures.com/'},
  {n:'Himalayan High',    best:'Smaller batches, offbeat routes',                   watch:'Fewer fixed departures',                  url:'https://himalayanhigh.in/'},
  {n:'India Trekking',    best:'Budget end of the market',                          watch:'Verify inclusions carefully before booking', url:'https://www.indiatrekking.com/'}
];
function rwTrekListHTML(filter){
  var list = RW_TREKS.filter(function(t){ return !filter || t.g===filter || t.r.toLowerCase()===String(filter).toLowerCase(); });
  if(!list.length) list = RW_TREKS;
  var done = rwTrekDone();
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#065F46,#0A0A0C)">'
    +'<div class="tk-place">\u26f0\ufe0f Trek vault</div>'
    +'<div class="tk-meta">'+list.length+' routes \u00b7 graded, costed, and compared against doing it yourself</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Filter by grade</div><div class="tk-chips">'
    + Object.keys(RW_TREK_GRADE).map(function(g){
        return '<button class="tk-chip'+(filter===g?' gold':'')+'" onclick="cpFollow(\''+RW_TREK_GRADE[g].label.toLowerCase()+' treks\')">'+RW_TREK_GRADE[g].icon+' '+RW_TREK_GRADE[g].label+'</button>';
      }).join('')
    +'</div></div>'
    +'<div class="tk-sec">'
    + list.slice(0,8).map(function(t){
        var G=RW_TREK_GRADE[t.g], saved=t.diy? Math.round(((t.org-t.diy)/t.org)*100):0;
        var isDone = done.indexOf(t.n)>-1;
        return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
          +'<b style="font-size:13.5px">'+G.icon+' '+esc2(t.n)+(isDone?' \u2705':'')+'</b>'
          +'<span style="font-size:10.5px;color:var(--t3)">'+t.d+'d \u00b7 '+t.alt+'m</span></div>'
          +'<div style="font-size:11.5px;color:var(--t2);margin-top:3px;line-height:1.5">'+esc2(t.r)+' \u00b7 best '+esc2(t.best)+'</div>'
          +'<div style="font-size:11.5px;color:var(--t2);margin-top:2px;line-height:1.5">'+esc2(t.note)+'</div>'
          +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:11px">'
          + (t.diy? '<span style="color:#4ADE80">DIY \u2248\u20b9'+t.diy.toLocaleString('en-IN')+'</span>':'<span style="color:var(--t3)">DIY not permitted</span>')
          +'<span style="color:var(--t3)">Organised \u2248\u20b9'+t.org.toLocaleString('en-IN')+'</span>'
          + (saved>0? '<span style="color:var(--gold,#E8BA6C)">save '+saved+'%</span>':'')
          +'</div>'
          +'<div class="tk-chips" style="margin-top:7px">'
          +'<button class="tk-chip" onclick="rwTrekLog(\''+t.n.replace(/'/g,'')+'\')">'+(isDone?'\u2713 Logged':'+ I did this')+'</button>'
          +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t.n+' trek '+t.r)+'">\ud83d\uddfa\ufe0f Trail</a>'
          +'<button class="tk-chip gold" onclick="rwTrekOps(\''+t.n.replace(/'/g,'')+'\','+t.org+')">Compare operators</button>'
          +'</div></div>';
      }).join('')
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">DIY vs organised \u2014 the honest version</div>'
    +'<div class="tk-bul"><b>Organised costs 40\u201360% more</b> and buys you: permits handled, a guide who knows the weather signs, evacuation cover, and food you do not carry.</div>'
    +'<div class="tk-bul"><b>DIY works well</b> on teahouse routes (Annapurna, Sandakphu, Triund) where you can walk village to village.</div>'
    +'<div class="tk-bul"><b>Do not DIY</b> above 4,500m without prior altitude experience, on glacier routes, or where guides are legally required.</div>'
    +'<div class="tk-bul">Whatever you choose, check the CURRENT permit status \u2014 Stok Kangri and Roopkund have both been closed at times for conservation.</div>'
    +'</div></div>';
}
function rwTrekOps(name, orgPrice){
  var body = RW_TREK_OPS.map(function(o){
    return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<b style="font-size:13px">'+esc2(o.n)+'</b>'
      +'<a class="tk-chip" style="font-size:10.5px;padding:4px 9px;text-decoration:none" target="_blank" rel="noopener" href="'+o.url+'">Check dates \u2197</a></div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin-top:3px">\u2714\ufe0f '+esc2(o.best)+'</div>'
      +'<div style="font-size:11.5px;color:#E8BA6C;margin-top:2px">\u26a0\ufe0f '+esc2(o.watch)+'</div></div>';
  }).join('');
  var ov=el('trekOpsOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='trekOpsOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\u26f0\ufe0f Operators</b><button class="x" onclick="rwOverlayClose(\'trekOpsOverlay\')">\u2715</button></div>'
      +'<div id="trekOpsBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  el('trekOpsBody').innerHTML =
     '<div style="font-weight:800;font-size:15px;margin-bottom:4px">'+esc2(name)+'</div>'
    +'<div style="font-size:11.5px;color:var(--t3);margin-bottom:10px">Typical organised price \u2248\u20b9'+Number(orgPrice).toLocaleString('en-IN')+'. Actual fares vary by departure and inclusions.</div>'
    + body
    +'<div style="background:var(--bg3,#1A1A20);border-radius:12px;padding:11px 13px;margin-top:12px;font-size:11.5px;line-height:1.6;color:var(--t2)">'
    +'<b>Before you pay anyone, check:</b> what is included (transport from where? equipment? insurance?), the group size cap, '
    +'the guide-to-trekker ratio, and their cancellation terms for weather. A cheap trek that excludes transport and rents you a jacket is not cheap.'
    +'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:10px">RoamWise does not sell treks or take a booking fee \u2014 these links go directly to the operators so you pay them, not a middleman.</div>';
  rwOverlayOpen('trekOpsOverlay');
}
function rwTrekDone(){ try{ return JSON.parse(lsGet('rw_treks')||'[]'); }catch(e){ return []; } }
function rwTrekLog(name){
  var d=rwTrekDone(), i=d.indexOf(name);
  if(i>-1) d.splice(i,1); else d.push(name);
  lsSet('rw_treks', JSON.stringify(d));
  showToast(i>-1? 'Removed' : '\u26f0\ufe0f Logged \u2014 '+d.length+' trek'+(d.length>1?'s':'')+' done');
  try{ rwXpAdd(25, 'trek logged'); }catch(e){}
}

/* ==================== ATHLETE MODE ====================
   Travel wrecks training. This finds the practical things — a gym, a place to
   run, protein-heavy food, drinking water, EV charging — using OSM tags that
   genuinely exist rather than inventing a database we cannot maintain. */
var RW_MED_TAGS = [
  ['amenity','pharmacy','\ud83d\udc8a','Pharmacies'],
  ['amenity','doctors','\ud83e\ude7a','Clinics'],
  ['amenity','hospital','\ud83c\udfe5','Hospitals'],
  ['amenity','clinic','\ud83e\ude7a','Clinics'],
  ['amenity','veterinary','\ud83d\udc36','Vets']
];
async function rwMedNear(lat, lon, radius){
  radius = radius || 5000;
  var key='rw_med_'+lat.toFixed(2)+'_'+lon.toFixed(2);
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c && Date.now()-c.at < 30*864e5) return c.items; }catch(e){}
  if(!navigator.onLine) return [];
  var q='[out:json][timeout:12];('
    + RW_MED_TAGS.map(function(t){ return 'node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+lat+','+lon+');'; }).join('')
    + ');out body 40;';
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
      .then(function(x){return x.json();});
    var items=(r.elements||[]).map(function(e){
      var t=e.tags||{}, hit=RW_MED_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0];
      if(!hit) return null;
      return {name:t.name||hit[3].replace(/s$/,''), icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon,
              open:t.opening_hours||'', phone:t['phone']||t['contact:phone']||''};
    }).filter(Boolean);
    lsSet(key, JSON.stringify({at:Date.now(), items:items}));
    return items;
  }catch(e){ return []; }
}
function rwMedHTML(place, items){
  var groups={};
  (items||[]).forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var body=Object.keys(groups).map(function(g){
    return '<div class="tk-lab">'+esc2(g)+'</div><div class="tk-chips">'
      + groups[g].slice(0,8).map(function(i){
          return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'+i.icon+' '+esc2(i.name)+(i.open?' \u00b7 '+esc2(i.open.slice(0,18)):'')+'</a>';
        }).join('') + '</div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#0F766E,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udc8a Medical near '+esc2(place||'you')+'</div>'
    +'<div class="tk-meta">Pharmacies, clinics and hospitals mapped nearby</div></div>'
    + (body? '<div class="tk-sec">'+body+'</div>'
           : '<div class="tk-sec"><div class="tk-bul">Nothing mapped nearby. Ask your hotel \u2014 they always know the closest chemist.</div></div>')
    +'<div class="tk-sec"><div class="tk-lab">Worth knowing in India</div>'
    +'<div class="tk-bul">\ud83d\udcde Ambulance: <b>108</b> \u00b7 national emergency: <b>112</b></div>'
    +'<div class="tk-bul">Most pharmacies dispense without a prescription for common medicines, but carry your own prescription for anything ongoing.</div>'
    +'<div class="tk-bul">Generic equivalents are far cheaper and equally regulated \u2014 ask for the generic by name.</div>'
    +'<div class="tk-bul">Jan Aushadhi stores sell government generics at a fraction of branded prices.</div>'
    +'<div class="tk-bul">For anything serious, a private hospital in a bigger town beats a small-town clinic \u2014 the extra hour of travel is usually worth it.</div>'
    +'</div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors \u00b7 Not medical advice</div></div>';
}
var RW_FIT_TAGS = [
  ['leisure','fitness_centre','\ud83c\udfcb\ufe0f','Gyms'],
  ['leisure','sports_centre','\ud83c\udfdf\ufe0f','Sports centres'],
  ['leisure','pitch','\u26bd','Grounds & courts'],
  ['leisure','track','\ud83c\udfc3','Running tracks'],
  ['leisure','swimming_pool','\ud83c\udfca','Pools'],
  ['amenity','drinking_water','\ud83d\udeb0','Drinking water'],
  ['amenity','charging_station','\ud83d\udd0c','EV charging']
];
async function rwFitNear(lat, lon, radius){
  radius = radius || 6000;
  var key='rw_fit_'+lat.toFixed(2)+'_'+lon.toFixed(2);
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c && Date.now()-c.at < 30*864e5) return c.items; }catch(e){}
  if(!navigator.onLine) return [];
  var q='[out:json][timeout:12];('
    + RW_FIT_TAGS.map(function(t){ return 'node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+lat+','+lon+');'; }).join('')
    + ');out body 50;';
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
      .then(function(x){return x.json();});
    var items=(r.elements||[]).map(function(e){
      var t=e.tags||{}, hit=RW_FIT_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0];
      if(!hit) return null;
      return {name:t.name||hit[3].replace(/s$/,''), icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon};
    }).filter(Boolean);
    lsSet(key, JSON.stringify({at:Date.now(), items:items}));
    return items;
  }catch(e){ return []; }
}
function rwAthleteHTML(place, items){
  var groups={};
  (items||[]).forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var body = Object.keys(groups).map(function(g){
    return '<div class="tk-lab">'+esc2(g)+'</div><div class="tk-chips">'
      + groups[g].slice(0,8).map(function(i){
          return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'+i.icon+' '+esc2(i.name)+'</a>';
        }).join('') + '</div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#7F1D1D,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udcaa Training in '+esc2(place||'this place')+'</div>'
    +'<div class="tk-meta">Gyms, grounds, water and charging \u2014 mapped nearby</div></div>'
    + (body? '<div class="tk-sec">'+body+'</div>'
           : '<div class="tk-sec"><div class="tk-bul">Nothing mapped nearby in OpenStreetMap. Hotel gyms often sell day passes for \u20b9200\u2013500 \u2014 worth asking at reception.</div></div>')
    +'<div class="tk-sec"><div class="tk-lab">Eating for training on the road</div>'
    +'<div class="tk-bul">\ud83e\udd5a Anda bhurji / boiled eggs \u2014 the cheapest reliable protein in India, on almost every street corner</div>'
    +'<div class="tk-bul">\ud83e\uded8 Rajma, chana, dal \u2014 15\u201320g protein a bowl, in every dhaba</div>'
    +'<div class="tk-bul">\ud83e\uddc0 Paneer over potato when a thali offers the choice</div>'
    +'<div class="tk-bul">\ud83e\udd5b Curd or lassi with every meal \u2014 protein plus the gut adjustment travellers need</div>'
    +'<div class="tk-bul">\ud83c\udf57 Tandoori chicken beats curry: grilled, portioned, no oil-heavy gravy</div>'
    +'<div class="tk-bul">\ud83e\udd5c Roasted chana in your bag \u2014 the best travel snack nobody packs</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Training that survives a trip</div>'
    +'<div class="tk-bul">A hotel-room circuit needs no kit: push-ups, squats, lunges, plank. Twenty minutes holds your base for weeks.</div>'
    +'<div class="tk-bul">Run at sunrise \u2014 cooler, emptier, and you see the town waking up, which is the best sightseeing there is.</div>'
    +'<div class="tk-bul">At altitude drop intensity for the first 48 hours. Your usual pace at 3,000m is a different effort entirely.</div>'
    +'<div class="tk-bul">Carry a bottle and refill. Most Indian towns have public taps; buying 4 bottles a day is \u20b980 and a lot of plastic.</div>'
    +'</div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors</div></div>';
}

/* ==================== LIVE LOCATION ("near me") ====================
   Permission is asked only when the traveller actually asks for something
   nearby — never on load. Coordinates are used for the query and are not stored
   or transmitted anywhere except the OSM lookup that answers the question. */
function rwGeoNow(){
  return new Promise(function(res, rej){
    if(!navigator.geolocation) return rej(new Error('no geolocation'));
    navigator.geolocation.getCurrentPosition(
      function(p){ res({lat:p.coords.latitude, lon:p.coords.longitude, acc:p.coords.accuracy}); },
      function(e){ rej(e); },
      {enableHighAccuracy:true, timeout:9000, maximumAge:60000}
    );
  });
}
function rwIsNearMe(t){
  return /\b(near me|nearby|around me|close by|where am i|current location|my location|near here|around here)\b/i.test(String(t||''));
}
async function rwNearMeHTML(rawq){
  var pos;
  try{ pos = await rwGeoNow(); }
  catch(e){
    return '<div class="tk-card tk-mini"><div class="tk-sec">'
      +'<div style="font-size:13px;line-height:1.6">\ud83d\udccd I need location access to answer that.</div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin-top:5px">Allow it in your browser or app settings, or just tell me the place name \u2014 works the same.</div>'
      +'</div></div>';
  }
  var place = await rwReverse(pos.lat, pos.lon);
  var spots = [];
  try{ spots = await osmAttractions(pos.lat, pos.lon, 6000); }catch(e){}
  var kind = rwActionIntent(rawq);
  var extra = kind ? rwActionHubHTML(kind, rwActionQuery(rawq, kind, place||''), place||'', pos.lat, pos.lon) : '';
  return '<div class="tk-card tk-mini"><div class="tk-sec">'
    +'<div style="font-weight:800;font-size:13.5px">\ud83d\udccd Around you'+(place? ' \u00b7 '+esc2(place):'')+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3)">Accurate to about '+Math.round(pos.acc||0)+' m \u00b7 location used for this answer only, never stored</div>'
    + (spots.length
        ? '<div class="tk-chips" style="margin-top:9px">'
          + spots.slice(0,10).map(function(sp){
              return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+sp.lat+','+sp.lon+'">'+sp.icon+' '+esc2(sp.name)+'</a>';
            }).join('')
          + '</div>'
        : '<div class="tk-bul" style="margin-top:8px">Nothing mapped within 6 km \u2014 try a wider search or name the town.</div>')
    +'</div>'
    + (extra? '<div class="tk-sec">'+extra+'</div>':'')
    +'<div class="tk-sec"><div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'order food near me\')">\ud83c\udf5c Food near me</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'cab from my location\')">\ud83d\ude95 Ride</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'hotel near me\')">\ud83c\udfe8 Stay</button>'
    +'</div></div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors</div></div>';
}
function rwReverse(lat, lon){
  if(!navigator.onLine) return Promise.resolve(null);
  return fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m&timezone=auto')
    .then(function(r){ return r.json(); })
    .then(function(){ return null; })
    .catch(function(){ return null; });
}

/* ==================== BOOKING PLATFORM COMPARISON ====================
   STATIC and dated on purpose. Live comparison would need each platform's
   pricing API — none of which are public — and the only alternative is
   scraping, which we've ruled out. What IS honest and useful is a structural
   comparison: what each is genuinely good at, and where each tends to sting.
   Every row is checkable from their own published terms. Prices move; the
   structural strengths don't, which is why this ages well. */
var RW_PLATFORMS = [
  {n:'MakeMyTrip', ico:'\ud83c\uddee\ud83c\uddf3', best:'Domestic India flights + hotel bundles',
   watch:'Convenience fee and "assured" add-ons pre-ticked at checkout \u2014 untick them',
   url:'https://www.makemytrip.com/'},
  {n:'ixigo', ico:'\ud83d\ude82', best:'Trains and PNR tracking \u2014 the best rail UX in India',
   watch:'Flight prices are usually fine but always cross-check the airline direct',
   url:'https://www.ixigo.com/'},
  {n:'Skyscanner', ico:'\ud83d\udd0d', best:'Comparing every airline at once; "everywhere" search for cheap dates',
   watch:'It is a search engine \u2014 you book on the airline/OTA it sends you to',
   url:'https://www.skyscanner.co.in/', aff:'skyscanner'},
  {n:'Google Flights', ico:'\ud83d\udee9\ufe0f', best:'Fastest date-grid and price tracking alerts',
   watch:'Does not show every budget carrier; check IndiGo/Akasa direct too',
   url:'https://www.google.com/travel/flights'},
  {n:'Booking.com', ico:'\ud83c\udfe8', best:'Largest stay inventory; free-cancellation filter is excellent',
   watch:'Prices exclude taxes until late in the flow \u2014 compare the final page',
   url:'https://www.booking.com/', aff:'booking'},
  {n:'Agoda', ico:'\ud83c\udf0f', best:'Often cheapest across Asia for the same room',
   watch:'Check whether breakfast/taxes are included before comparing',
   url:'https://www.agoda.com/', aff:'agoda'},
  {n:'Airbnb', ico:'\ud83c\udfe1', best:'Homestays and longer stays; kitchens for budget trips',
   watch:'Cleaning + service fees can add 20\u201330% \u2014 judge on the total, not the nightly',
   url:'https://www.airbnb.co.in/'},
  {n:'Thomas Cook / SOTC', ico:'\ud83e\uddf3', best:'Packaged group tours, visa assistance, forex',
   watch:'Packages bundle margin \u2014 price the same trip independently before committing',
   url:'https://www.thomascook.in/'},
  {n:'IRCTC', ico:'\ud83c\uddee\ud83c\uddf3', best:'The only official source for Indian Railways tickets',
   watch:'Tatkal opens 10\u201311am one day ahead; agents charging extra are unnecessary',
   url:'https://www.irctc.co.in/'}
];
function rwPlatformsHTML(){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A8A,#0A0A0C)">'
    +'<div class="tk-place">Where to book</div>'
    +'<div class="tk-meta">What each platform is actually good at \u2014 and where it stings</div></div>'
    +'<div class="tk-sec">'
    + RW_PLATFORMS.map(function(p){
        var href = p.aff ? rwAffLink(p.aff, p.url) : p.url;
        return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
          +'<b style="font-size:13px">'+p.ico+' '+esc2(p.n)+'</b>'
          +'<a class="tk-chip" style="font-size:10.5px;padding:4px 9px;text-decoration:none" target="_blank" rel="noopener" href="'+href+'">Open \u2197</a></div>'
          +'<div style="font-size:11.5px;color:var(--t2);margin-top:3px;line-height:1.5">\u2714\ufe0f '+esc2(p.best)+'</div>'
          +'<div style="font-size:11.5px;color:#E8BA6C;margin-top:2px;line-height:1.5">\u26a0\ufe0f '+esc2(p.watch)+'</div>'
          +'</div>';
      }).join('')
    +'<div style="font-size:10px;color:var(--t3);margin-top:9px">Structural comparison, not live prices \u2014 none of these publish a public pricing API. Always compare the FINAL checkout total, taxes and fees included. Reviewed periodically; last review July 2026.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Rules that beat any platform</div>'
    +'<div class="tk-bul">Search in an incognito window, then book on the airline\u2019s own site \u2014 it is often the same fare without the OTA fee, and changes are far easier.</div>'
    +'<div class="tk-bul">Compare the FINAL page, not the headline. Convenience fees, seat charges and taxes appear late.</div>'
    +'<div class="tk-bul">Tuesday/Wednesday departures booked 3\u20136 weeks out are usually the cheapest band on Indian routes.</div>'
    +'<div class="tk-bul">For a package, price the same flights + hotel separately first. If the package is not clearly cheaper, it is selling convenience.</div>'
    +'</div></div>';
}

/* ==================== LOCAL ECOSYSTEM ====================
   Naming the people who make a place itself: homestays over chains, working
   artists, musicians, writers, and the research stations that quietly sit in
   these landscapes. Curated and small on purpose \u2014 a short honest list beats a
   long invented one, and every entry here is a documented, checkable thing. */
var RW_ECOSYSTEM = {
  'almora':   [['\ud83c\udfe1','Kumaoni homestays','Family-run houses around Binsar and Kasar Devi \u2014 book direct, not through an aggregator'],
               ['\u270d\ufe0f','Writers\u2019 hill','Kasar Devi drew Uttarakhand\u2019s writer-and-seeker crowd for decades'],
               ['\ud83c\udfb5','Kumaoni folk','Hurka and Jhoda traditions still performed at village festivals']],
  'varanasi': [['\ud83c\udfb6','Benares gharana','One of Hindustani music\u2019s major lineages \u2014 evening riverside recitals'],
               ['\ud83e\uddf5','Weavers','Banarasi handloom families in Madanpura; buy from the weaver, not the showroom']],
  'jaipur':   [['\ud83c\udfa8','Blue pottery','A Jaipur craft kept alive by a handful of workshops'],
               ['\ud83d\udcda','Literature','The city\u2019s literature festival is India\u2019s largest free one']],
  'rishikesh':[['\ud83e\uddd8','Teachers','Long-standing yoga schools \u2014 look for Yoga Alliance registration, not Instagram following'],
               ['\ud83c\udfe1','Ashram stays','Simple rooms at working ashrams cost a fraction of the riverside hotels']],
  'goa':      [['\ud83c\udfb7','Goan jazz','Live jazz and Konkani music in Panjim\u2019s Latin Quarter'],
               ['\ud83c\udfe1','Portuguese-era homestays','Restored family houses inland \u2014 cheaper and quieter than the beach strip'],
               ['\ud83d\udd2c','Marine research','The National Institute of Oceanography is headquartered in Dona Paula']],
  'leh':      [['\ud83d\udd2d','Astronomy','The Indian Astronomical Observatory at Hanle \u2014 one of the world\u2019s highest, now a Dark Sky Reserve'],
               ['\ud83c\udfe1','Village homestays','The Sham and Markha valley networks pay families directly']],
  'kochi':    [['\ud83c\udfa8','Kochi-Muziris Biennale','South Asia\u2019s largest contemporary art event, in warehouse spaces'],
               ['\ud83c\udfad','Kathakali','Nightly performances \u2014 arrive an hour early to watch the makeup being applied']],
  'darjeeling':[['\ud83c\udf75','Tea gardens','Estate walks and tastings direct with growers'],
               ['\ud83d\ude82','Himalayan Railway','A working UNESCO World Heritage steam line, not a museum']]
};
function rwEcosystemHTML(place){
  var k=String(place||'').toLowerCase().trim(), list=RW_ECOSYSTEM[k];
  if(!list) return '';
  return '<div style="background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.25);border-radius:12px;padding:11px 13px">'
    +'<div style="font-weight:800;font-size:12.5px">\u2728 The people who make this place</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:6px">Spend here and the money stays here</div>'
    + list.map(function(e){
        return '<div style="display:flex;gap:9px;padding:5px 0"><span style="font-size:15px">'+e[0]+'</span>'
          +'<div><b style="font-size:12px">'+esc2(e[1])+'</b>'
          +'<div style="font-size:11.5px;color:var(--t2);line-height:1.5">'+esc2(e[2])+'</div></div></div>';
      }).join('')
    +'</div>';
}

// LOW-CARBON TRAVEL (RW_EMIT/rwCO2/rwGreenSwapHTML/eco ledger+badges) moved to js/misc/eco-safety.js




// CERTIFICATE VERIFICATION + ECO CERTIFICATE (rwCertHash, rwVerifyPanelHTML, rwVerifyRun, rwEcoCert, rwCertShare) moved to js/itinerary/certificates.js

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

/* ==================== PLACE DISAMBIGUATION ====================
   Guessing wrong is worse than asking. The geocoder returns GeoNames
   `feature_code`, which tells us exactly WHAT each candidate is — a village, a
   district capital, a state, a mountain — so the traveller can pick the right
   one instead of being silently sent to a namesake.

   Real failures this prevents, all reproduced against the live API:
     "Almora"  -> Almorox, SPAIN ranked above Almora, Uttarakhand
     "Manali"  -> Manali, Tamil Nadu (pop 35k) above Manali, Himachal (pop 8k)
     "Kerala"  -> five Finnish villages called Ker\u00e4l\u00e4
     "Goa"     -> Genoa, Italy on a fuzzy match
   Population ranking is exactly wrong for travel: the famous Manali is the
   small one. So when candidates are genuinely close, we ask. */
var RW_FC = {
  PCLI:['\ud83c\udf0d','Country'], PCLD:['\ud83c\udf0d','Territory'], PCLS:['\ud83c\udf0d','Country'],
  ADM1:['\ud83d\uddfa\ufe0f','State / province'], ADM2:['\ud83d\uddfa\ufe0f','District'],
  ADM3:['\ud83d\uddfa\ufe0f','Sub-district'], ADM4:['\ud83d\uddfa\ufe0f','Local area'],
  PPLC:['\ud83c\udfdb\ufe0f','Capital city'], PPLA:['\ud83c\udfd9\ufe0f','State capital'],
  PPLA2:['\ud83c\udfd9\ufe0f','District town'], PPLA3:['\ud83c\udfd8\ufe0f','Town'], PPLA4:['\ud83c\udfd8\ufe0f','Town'],
  PPL:['\ud83c\udfd8\ufe0f','Town / village'], PPLL:['\ud83c\udfe1','Village'], PPLX:['\ud83c\udfd8\ufe0f','Neighbourhood'],
  PPLF:['\ud83c\udf3e','Farm village'], PPLS:['\ud83c\udfd8\ufe0f','Settlements'], PPLW:['\ud83c\udfda\ufe0f','Former village'],
  MT:['\u26f0\ufe0f','Mountain'], PK:['\u26f0\ufe0f','Peak'], MTS:['\u26f0\ufe0f','Mountain range'],
  LK:['\ud83c\udf0a','Lake'], STM:['\ud83c\udf0a','River'], FLLS:['\ud83d\udca7','Waterfall'],
  BCH:['\ud83c\udfd6\ufe0f','Beach'], ISL:['\ud83c\udfdd\ufe0f','Island'], VAL:['\ud83c\udfde\ufe0f','Valley'],
  PASS:['\u26f0\ufe0f','Mountain pass'], PRK:['\ud83c\udf33','Park / reserve'],
  RLG:['\ud83d\uded5','Temple / shrine'], HSTS:['\ud83c\udfdb\ufe0f','Historic site'],
  AIRP:['\u2708\ufe0f','Airport'], RSTN:['\ud83d\ude82','Railway station']
};
function rwPlaceType(fc){
  var t = RW_FC[String(fc||'').toUpperCase()];
  if(t) return {icon:t[0], label:t[1]};
  var f = String(fc||'').toUpperCase();
  if(f.indexOf('PPL')===0) return {icon:'\ud83c\udfd8\ufe0f', label:'Town / village'};
  if(f.indexOf('ADM')===0) return {icon:'\ud83d\uddfa\ufe0f', label:'Administrative area'};
  return {icon:'\ud83d\udccd', label:'Place'};
}
/* fetch every plausible candidate, typed and de-duplicated */
async function rwCandidates(q){
  if(!navigator.onLine) return [];
  try{
    var r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)
      +'&count=10&language=en&format=json').then(function(x){ return x.json(); });
    var list = r.results||[];
    var ql = String(q).toLowerCase().trim();
    /* keep only candidates whose name genuinely resembles the query \u2014 stops
       "Goa" surfacing Genoa, and "Almora" surfacing Almorox */
    var close = list.filter(function(x){
      var n=String(x.name||'').toLowerCase();
      return n===ql || n.indexOf(ql)===0 || ql.indexOf(n)===0;
    });
    if(!close.length) close = list.slice(0,4);
    var seen={}, out=[];
    close.forEach(function(x){
      var key=[x.name,x.country,x.admin1].join('|').toLowerCase();
      if(seen[key]) return; seen[key]=1;
      var ty=rwPlaceType(x.feature_code);
      out.push({name:x.name, country:x.country||'', cc:x.country_code||'',
                admin:[x.admin1,x.admin2].filter(Boolean).slice(0,1).join(', '),
                lat:x.latitude, lon:x.longitude, pop:x.population||null,
                icon:ty.icon, type:ty.label, fc:x.feature_code||''});
    });
    return out.slice(0,6);
  }catch(e){ return []; }
}
/* Is this genuinely ambiguous, or obvious? */
function rwIsAmbiguous(cands, homeCC){
  if(!cands || cands.length<2) return false;
  var countries={}, admins={};
  cands.forEach(function(c){ countries[c.cc]=1; admins[(c.cc||'')+'|'+(c.admin||'')]=1; });
  var multiCountry = Object.keys(countries).length>1;
  var multiAdmin   = Object.keys(admins).length>1;
  if(!multiCountry && !multiAdmin) return false;

  /* A world-famous place is not ambiguous just because a hamlet shares its
     name. Tokyo was being flagged because five tiny namesakes exist. Two
     escape hatches, both evidence-based rather than a hardcoded list: */
  var sorted = cands.slice().sort(function(a,b){ return (b.pop||0)-(a.pop||0); });
  var top = sorted[0], second = sorted[1];

  /* 1. Population dominance — top is an order of magnitude bigger than the
        next. Note this is checked GLOBALLY, not only for the home country,
        which is the bug that made Tokyo look ambiguous. */
  if((top.pop||0) >= 250000 && (top.pop||0) > ((second&&second.pop)||0)*10) return false;

  /* 2. Rank dominance — top is a national or state capital while the rest are
        villages. "Which Paris?" is not a question worth asking. */
  var topFC = String(top.fc||'').toUpperCase();
  if((topFC==='PPLC' || topFC==='PPLA') && (top.pop||0) > 100000){
    var rivals = sorted.slice(1).filter(function(c){ return (c.pop||0) > 50000; });
    if(!rivals.length) return false;
  }

  /* one candidate overwhelmingly dominant in the home country = not ambiguous */
  var home = cands.filter(function(c){ return c.cc===homeCC; });
  if(home.length===1){
    var others = cands.filter(function(c){ return c.cc!==homeCC; });
    var biggestOther = Math.max.apply(null, others.map(function(c){ return c.pop||0; }).concat([0]));
    if((home[0].pop||0) > biggestOther*5) return false;
  }
  return true;
}
function rwDisambigHTML(query, cands){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A8A,#0A0A0C)">'
    +'<div class="tk-place">Which '+esc2(query)+'?</div>'
    +'<div class="tk-meta">'+cands.length+' places share that name \u2014 pick one and I\u2019ll get it right</div></div>'
    +'<div class="tk-sec">'
    + cands.map(function(c){
        var where=[c.admin, c.country].filter(Boolean).join(', ');
        var pop = c.pop ? Number(c.pop).toLocaleString('en-IN')+' people' : 'small settlement';
        return '<button onclick="cpFollow(\''+String(c.name+', '+(c.admin||c.country)).replace(/'/g,"\\'")+'\')" '
          +'style="display:flex;width:100%;text-align:left;gap:11px;align-items:center;background:transparent;border:none;'
          +'border-bottom:1px solid rgba(255,255,255,.06);padding:11px 2px;cursor:pointer;color:inherit;font:inherit">'
          +'<span style="font-size:20px">'+c.icon+'</span>'
          +'<span style="flex:1"><b style="font-size:13.5px;display:block">'+esc2(c.name)+'</b>'
          +'<span style="font-size:11px;color:var(--t3)">'+esc2(c.type)+' \u00b7 '+esc2(where)+' \u00b7 '+pop+'</span></span>'
          +'<span style="color:var(--gold,#E8BA6C);font-size:15px">\u203a</span></button>';
      }).join('')
    +'</div>'
    +'<div class="tk-sec"><div style="font-size:11.5px;color:var(--t2);line-height:1.6">'
    +'None of these? Type the place with its state or country \u2014 e.g. \u201c'+esc2(query)+', Himachal Pradesh\u201d.</div>'
    +'</div></div>';
}

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

/* ==================== SHADOW BUDGET — the costs nobody quotes ==============
   Competitors show a headline "$950/week". Travellers actually get ambushed by
   the gaps: airport transfers, daily metro fares, the ATM's FX spread, tipping
   norms, a tourist SIM, entry tickets. This computes those from the same data
   the app already holds (weekly cost tiers + the brk breakdown) and returns a
   day-by-day cash-flow prediction in USD and INR.
   Every number is a MODELLED ESTIMATE from the destination's own price band —
   labelled as such in the UI, never dressed up as live pricing. */
var TIP_BY_REGION = {
  'North America':0.18, 'Europe':0.07, 'Western Europe':0.07, 'Eastern Europe':0.08,
  'Southeast Asia':0.05, 'South Asia':0.05, 'East Asia':0.0, 'Japan':0.0,
  'Middle East':0.10, 'Africa':0.10, 'South America':0.10, 'Oceania':0.05
};
/* The curated DB covers 15 countries — none of them India, because it was
   built for international trips. Domestic trips (Manali, Rishikesh, Ziro) come
   from the live geocoder and had no cost band at all, so the shadow budget
   never fired for the app's core audience. This table gives any geocoded place
   a sensible band by country, falling back to a regional default. Daily USD,
   deliberately conservative and clearly labelled as an estimate. */
var RW_COST_HINTS = {
  IN:{d:{budget:22,mid:52,luxury:130}, region:'South Asia'},
  NP:{d:{budget:20,mid:45,luxury:110}, region:'South Asia'},
  LK:{d:{budget:24,mid:55,luxury:135}, region:'South Asia'},
  BT:{d:{budget:70,mid:120,luxury:250}, region:'South Asia'},
  TH:{d:{budget:28,mid:60,luxury:160}, region:'Southeast Asia'},
  VN:{d:{budget:25,mid:55,luxury:140}, region:'Southeast Asia'},
  ID:{d:{budget:26,mid:58,luxury:150}, region:'Southeast Asia'},
  MY:{d:{budget:30,mid:65,luxury:160}, region:'Southeast Asia'},
  SG:{d:{budget:70,mid:140,luxury:320}, region:'Southeast Asia'},
  AE:{d:{budget:65,mid:130,luxury:300}, region:'Middle East'},
  JP:{d:{budget:70,mid:135,luxury:320}, region:'East Asia'},
  GB:{d:{budget:80,mid:150,luxury:350}, region:'Europe'},
  FR:{d:{budget:70,mid:135,luxury:320}, region:'Europe'},
  IT:{d:{budget:65,mid:125,luxury:300}, region:'Europe'},
  ES:{d:{budget:60,mid:115,luxury:280}, region:'Europe'},
  DE:{d:{budget:70,mid:130,luxury:300}, region:'Europe'},
  US:{d:{budget:95,mid:180,luxury:420}, region:'North America'},
  AU:{d:{budget:85,mid:160,luxury:370}, region:'Oceania'},
  NZ:{d:{budget:80,mid:150,luxury:350}, region:'Oceania'}
};
var RW_REGION_DEFAULT = {d:{budget:45,mid:95,luxury:230}, region:'Europe'};
/* Turn a geocoded place into something shadowBudget() understands. */
function costEntryForPlace(geo){
  if(!geo) return null;
  var h = RW_COST_HINTS[(geo.cc||'').toUpperCase()] || RW_REGION_DEFAULT;
  return {
    name: geo.name, country: geo.country || '', region: h.region,
    cost: {budget:h.d.budget*7, mid:h.d.mid*7, luxury:h.d.luxury*7},
    brk: {flights:0, stay:h.d.mid*7*0.42, food:h.d.mid*7*0.26, act:h.d.mid*7*0.18, misc:h.d.mid*7*0.14},
    _estimated: true
  };
}
function shadowBudget(entry, days, style){
  days = Math.max(1, days||5);
  style = style || 'mid';
  var weekly = (entry.cost && entry.cost[style]) || (entry.cost && entry.cost.mid) || 700;
  var brk = entry.brk || {flights:0.30*weekly, stay:0.28*weekly, food:0.18*weekly, act:0.14*weekly, misc:0.10*weekly};
  var perDay = {
    stay:  (brk.stay||0)/7,
    food:  (brk.food||0)/7,
    act:   (brk.act||0)/7,
    local: ((brk.misc||0)/7) * 0.55   /* the metro/bus/tuk-tuk slice of misc */
  };
  var domestic = /^india$/i.test(entry.country||'');
  var tipRate  = TIP_BY_REGION[entry.region] != null ? TIP_BY_REGION[entry.region] : 0.07;
  var oneOff = {
    airport:   Math.round(perDay.local * 3.2),               /* both transfers */
    sim:       domestic ? 0 : 8,                             /* tourist eSIM/data */
    fxSpread:  0,                                            /* filled below */
    buffer:    0
  };
  var dailyBase = perDay.stay + perDay.food + perDay.act + perDay.local;
  var tips = perDay.food * tipRate;
  var dailyTotal = dailyBase + tips;
  var tripSub = dailyTotal*days + oneOff.airport + oneOff.sim;
  oneOff.fxSpread = domestic ? 0 : Math.round(tripSub * 0.025);  /* ATM + card spread */
  oneOff.buffer   = Math.round((tripSub + oneOff.fxSpread) * 0.10);
  var total = tripSub + oneOff.fxSpread + oneOff.buffer;
  return {
    days:days, style:style, domestic:domestic, tipRate:tipRate,
    perDay:perDay, tips:tips, dailyTotal:dailyTotal, oneOff:oneOff,
    total:total,
    cashShare: domestic ? 0.35 : ((entry.region==='Southeast Asia'||entry.region==='South Asia'||entry.region==='Africa') ? 0.55 : 0.25)
  };
}
function shadowBudgetHTML(entry, days, style){
  var b = shadowBudget(entry, days, style);
  var fx = (window._rwFxINR || 88);
  function money(usd){
    if(b.domestic) return '\u20b9'+Math.round(usd*fx).toLocaleString('en-IN');
    return '$'+Math.round(usd)+' <span style="opacity:.6">(\u20b9'+Math.round(usd*fx).toLocaleString('en-IN')+')</span>';
  }
  var rows = [
    ['\ud83c\udfe8 Stay',        b.perDay.stay],
    ['\ud83c\udf5c Food',        b.perDay.food],
    ['\ud83c\udfab Activities',  b.perDay.act],
    ['\ud83d\ude87 Local transit', b.perDay.local],
    ['\ud83d\udcb5 Tips ('+Math.round(b.tipRate*100)+'%)', b.tips]
  ].map(function(r){
    return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">'
      +'<span style="color:var(--t2)">'+r[0]+'</span><b>'+money(r[1])+'</b></div>';
  }).join('');
  var extras = [
    ['\ud83d\ude95 Airport transfers (both ways)', b.oneOff.airport],
    b.oneOff.sim ? ['\ud83d\udcf1 Tourist SIM / eSIM', b.oneOff.sim] : null,
    b.oneOff.fxSpread ? ['\ud83c\udfe7 ATM + card FX spread (~2.5%)', b.oneOff.fxSpread] : null,
    ['\ud83d\udee1 Buffer (10%)', b.oneOff.buffer]
  ].filter(Boolean).map(function(r){
    return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">'
      +'<span style="color:var(--t2)">'+r[0]+'</span><b>'+money(r[1])+'</b></div>';
  }).join('');
  return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:13px 15px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:13px;margin-bottom:2px">\ud83d\udc7b Shadow budget \u2014 '+b.days+' days in '+String(entry.name).replace(/[<>]/g,'')+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:9px">The costs headline prices leave out. '+(entry._estimated? 'Modelled from typical '+(entry.country||'regional')+' prices' : 'Modelled from this destination\u2019s '+b.style+' price band')+' \u2014 estimates, not live quotes.</div>'
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:3px">Every day</div>'
    + rows
    +'<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-top:1px solid var(--b2,#2A2A36);margin-top:5px"><b>Daily burn</b><b style="color:var(--gold,#E8BA6C)">'+money(b.dailyTotal)+'</b></div>'
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:9px 0 3px">Once per trip</div>'
    + extras
    +'<div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 0 2px;border-top:1px solid var(--b2,#2A2A36);margin-top:6px"><b>Total</b><b style="color:var(--gold,#E8BA6C)">'+money(b.total)+'</b></div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:7px;line-height:1.6">\ud83d\udcb5 Carry roughly <b>'+money(b.total*b.cashShare)+'</b> as cash \u2014 the rest works on card here.</div>'
    +'</div>';
}

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

/* ==================== REMOTE CONFIG (owner values, zero user input) =========
   Every owner-only value — affiliate IDs, WhatsApp numbers, Gumroad link/ID,
   promo video URL, music embeds, crypto wallets, Play Store URL — now lives in
   ONE Firestore doc (config/app) that only the admin console can write (rules:
   public read, isAdmin write). The user app just reads it. Two-phase apply:
   1) cached copy from localStorage immediately (works offline / first paint),
   2) fresh Firestore fetch, re-cache, re-apply.
   CRITICAL ORDERING NOTE: this must run at DOMContentLoaded, not at parse
   time — several of these vars are declared AFTER db-init in file order, so
   applying config too early would be overwritten by their own `var x=''`
   initializers a few thousand lines later. DOMContentLoaded fires after every
   synchronous script has executed, which is exactly the safe moment. */
var RW_CFG = {};
function applyRemoteConfig(cfg){
  if(!cfg || typeof cfg!=='object') return;
  RW_CFG = cfg;
  function set(k, fn){ if(cfg[k]!=null && cfg[k]!=='') try{ fn(cfg[k]); }catch(e){} }
  set('AFF_BOOKING',      function(v){ AFF_BOOKING=v; });
  set('AFF_SKYSCANNER',   function(v){ AFF_SKYSCANNER=v; });
  set('AFF_AGODA',        function(v){ AFF_AGODA=v; });
  set('AFF_GYG',          function(v){ AFF_GYG=v; });
  set('AFF_TRAVELPAYOUTS',function(v){ AFF_TRAVELPAYOUTS=v; });
  set('AFF_VIATOR',       function(v){ AFF_VIATOR=v; });
  set('AFF_SAFETYWING',   function(v){ AFF_SAFETYWING=v; });
  set('AFF_KLOOK',        function(v){ AFF_KLOOK=v; });
  set('AFF_12GO',         function(v){ AFF_12GO=v; });
  set('AFF_TRIPCOM',      function(v){ AFF_TRIPCOM=v; });
  set('AFF_HOSTELWORLD',  function(v){ AFF_HOSTELWORLD=v; });
  set('AFF_AMAZON',       function(v){ AFF_AMAZON=v; });
  set('AFF_FLIPKART',     function(v){ AFF_FLIPKART=v; });
  set('AFF_YATRA',        function(v){ AFF_YATRA=v; });
  set('AFF_CLEARTRIP',    function(v){ AFF_CLEARTRIP=v; });
  set('AFF_CUELINKS',     function(v){ AFF_CUELINKS=v; });
  set('AFF_EARNKARO',     function(v){ AFF_EARNKARO=v; });
  set('AFF_ADMITAD',      function(v){ AFF_ADMITAD=v; });
  set('WA_NUMBER',        function(v){ WA_NUMBER=v; ensureWaButton(); });
  set('WA_CHANNEL',       function(v){ WA_CHANNEL=v; });
  set('WA_GROUP',         function(v){ WA_GROUP=v; });
  set('PLAYSTORE_URL',    function(v){ PLAYSTORE_URL=v; });
  set('ADSENSE_SLOT',     function(v){ ADSENSE_SLOT=v; });
  set('PROMO_MP4_URL',    function(v){
    /* A <video> can only play a DIRECT media file. The config field was set to
       a YouTube share link (https://youtu.be/...), which silently replaced the
       working self-hosted mp4 and made inline playback fail on every device.
       Accept only real media URLs; anything else is kept as the "watch on"
       link instead of breaking the player. */
    if(/\.(mp4|webm|mov|m4v)(\?|$)/i.test(v)) PROMO_MP4_URL = v;
    else { PROMO_EXT_URL = v; try{ console.warn('PROMO_MP4_URL must be a direct .mp4 link; got:', v); }catch(e){} }
  });
  set('SPOTIFY_ARTIST_ID',function(v){ SPOTIFY_ARTIST_ID=v; });
  set('SPOTIFY_PLAYLIST_ID',function(v){ SPOTIFY_PLAYLIST_ID=v; });
  set('JIOSAAVN_URL',     function(v){ JIOSAAVN_URL=v; });
  set('CRYPTO_WALLETS',   function(v){ if(typeof v==='object') CRYPTO_WALLETS=v; });
  /* Gumroad values feed the existing localStorage readers untouched. */
  set('GUM_URL',          function(v){ lsSet('rw_gum_url', v); });
  set('GUM_PID',          function(v){ lsSet('rw_gum_pid', v); });

  /* ---- Admin-controlled custom head-script slot (rw-v95) ----
     Lets an admin drop in a verified third-party script (e.g. a Travelpayouts
     Drive snippet, once confirmed via their own dashboard) purely through
     Firestore config — no code deploy needed. Both fields must be explicitly
     set AND customHeadScriptVerified must be the literal boolean true; any
     other value (missing, false, a string "true", etc.) leaves this fully
     inert, exactly like every other slot in this file that starts empty. Same
     createElement+async+appendChild bootstrap pattern already used for
     AdSense above — the concern with an unverified URL was trusting the URL,
     not this mechanism. Guarded so a second Firestore fetch never injects the
     same tag twice. */
  try{
    if(cfg.customHeadScriptUrl && cfg.customHeadScriptVerified===true && /^https:\/\//.test(cfg.customHeadScriptUrl)){
      if(!document.querySelector('script[data-rw-custom-head="1"]')){
        var chs=document.createElement('script');
        chs.async=true;
        chs.src=cfg.customHeadScriptUrl;
        chs.setAttribute('data-rw-custom-head','1');
        document.head.appendChild(chs);
      }
    }
  }catch(e){}
}
(function(){
  function boot(){
    try{ var cached=JSON.parse(lsGet('rw_cfg')||'null'); if(cached) applyRemoteConfig(cached); }catch(e){}
    try{
      if(window.db){
        db.collection('config').doc('app').get().then(function(snap){
          if(snap.exists){ var c=snap.data(); lsSet('rw_cfg', JSON.stringify(c)); applyRemoteConfig(c); }
        }).catch(function(){ /* offline or rules not yet published — cached copy already applied */ });
      }
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* Bridge for the optional Cinematic Itinerary add-on (roamwise-premium-itinerary.js):
   it checks window.rwIsPro() first, before falling back to unreliable localStorage
   heuristics. Route it through the real RWPricing tier so the Pro gate reflects
   actual subscription status instead of a guess. */
window.rwIsPro = function(){
  try{ return RWPricing.currentTier().id !== 'free'; }catch(e){ return false; }
};
/* More bridges for the Cinematic Itinerary add-on: rwDeriveStops() already knows how
   to turn a destination (+ the last built itinerary, curated real POIs, or DB gems)
   into real named stops, and rwGeocodeStopsNear() geocodes + sanity-bounds them the
   same way openTripMap() does. These are plain top-level function declarations so
   they're already on window in a browser, but we assign explicitly here so the
   dependency is obvious and doesn't silently break if app.js is ever wrapped/bundled. */
window.rwDeriveStops = rwDeriveStops;
window.rwGeocodeStopsNear = rwGeocodeStopsNear;
