// @ts-nocheck
/* Curated summit knowledge used by the /summit/ demo and the real homepage Ailon.
   Public organiser sources checked 16 Nov 2026. NOT a live attendee roster, fare API
   or general-purpose LLM. Every question retains a route to the full copilot.
   No secrets, user contact data or autonomous network requests. */
(function(root){
'use strict';
var SOURCES={
 event:'https://www.bengalurutechsummit.com/',
 agenda:'https://www.bengalurutechsummit.com/programme_at_a_glance.php',
 speakers:'https://www.bengalurutechsummit.com/speakers.php',
 startups:'https://bengalurutechsummit.com/exhibitor-list.php',
 investors:'https://bengalurutechsummit.com/startup-investor.php',
 apply:'https://bengalurutechsummit.com/bts-2026/public/investor-connect/startup/apply',
 visitors:'https://bengalurutechsummit.in/bts-visitor/public/visitor/registration',
 passes:'https://www.bengalurutechsummit.com/conference.php',
 venue:'https://bengalurutechsummit.com/downloads/BTS2026-Venue-Map.pdf'
};
var entries=[
['dates',/\b(when|dates?|day|timing|start|end|duration)\b|कब|ಯಾವಾಗ/,'BTS 2026 runs 17–19 November, at BIEC, Bengaluru. The programme is published in Indian Standard Time; verify last-minute session changes on the official agenda.'],
['venue',/\b(where|venue|address|biec|location|hall|gate|entrance)\b|कहाँ|ಎಲ್ಲಿ/,'The venue is Bangalore International Exhibition Centre (BIEC), Tumkur Road, Madavara area, northwest Bengaluru. Exact entry gates and hall allocations are shown in the organiser venue map.'],
['theme',/theme|ai & beyond|29th|edition/,'This is the 29th Bengaluru Tech Summit. The announced theme is “AI & Beyond”; AI, deeptech, semiconductors, biotech, startups and global collaboration are major tracks.'],
['exhibitors',/\b(exhibitors?|which companies|companies attending|list of companies)\b/,'The organiser advertises 1,500+ exhibitors as a projection. Use the official exhibitor listing to verify individual companies; it is a changing directory, not a confirmed list I can invent.'],
['startups',/\b(startups?|startup list|startup exhibitors?|startup companies)\b/,'The organiser promotes a 1,000+ startup showcase. I cannot verify the complete roster offline. Open the official exhibitor directory and ask each participating startup whether it is actually onsite before promising an introduction.'],
['roster',/\b(attendees?|participants?|guest list|everyone coming|who is coming)\b/,'Public programmes and exhibitor directories are available, but a complete verified list of individual attendees is not. Published speakers are not guaranteed onsite at a specific time.'],
['speakers',/\b(speakers?|keynotes?|who is speaking)\b/,'The published speaker list includes Kris Gopalakrishnan, Kiran Mazumdar-Shaw, Vivek Raghavan and Prashanth Prakash. The organiser’s speaker directory is authoritative, and changes can occur.'],
['kris',/kris gopalakrishnan|infosys cofounder/,'Kris Gopalakrishnan is listed among BTS 2026 speakers. Follow the official agenda for his stage and timing; a conference listing does not imply a private meeting.'],
['kiran',/kiran mazumdar|biocon/,'Kiran Mazumdar-Shaw is listed on the official summit speaker programme. For the latest session assignment, use the official agenda.'],
['vivek',/vivek raghavan|sarvam/,'Vivek Raghavan, known for work at Sarvam AI, is among announced speakers. For RoamWise, vernacular voice AI is a relevant conversation topic.'],
['prashanth',/prashanth prakash/,'Investor Prashanth Prakash is mentioned on the organiser speaker listing. A confirmed personal meeting requires consent and an actual appointment.'],
['stage',/\b(stages?|track|stage 1|stage 2|startup stage)\b/,'BTS has Main, Trends, Circuit, Life, Startup, World, Think, Innovation and Sustainability stages. Consult the organizer timetable for session room and exact day.'],
['voice-ai',/vernacular|bhasha|voice ai|speech ai|multilingual ai|ಭಾಷೆ|वॉइस एआई/,'The programme includes “Bhasha & Beyond: Voice and Vernacular AI”. RoamWise can learn from teams working on Indian languages; confirm slot and access in the official agenda.'],
['enterprise',/enterprise ai|enterprise adoption|corporate ai/,'Enterprise AI and AI-first transformation feature in the official programme. For RoamWise, focus on lean travel approvals, group offsites and real customer problems rather than promising features not yet shipped.'],
['semiconductors',/semiconductor|chipmaking|electro-semicon|esdm/,'The Circuit Stage covers electro-semiconductor themes. Find its Hall 5 agenda and speakers through the organiser programme.'],
['biotech',/biotech|healthtech|health ai|precision medicine/,'The Life Stage addresses health and biotechnology. Separate this from RoamWise’s travel expertise; do not give medical advice in a travel demo.'],
['defence',/defence|space tech|deep tech|military ai/,'Defence and deeptech discussions are among the summit themes. Consult the official agenda rather than inferring exhibitor or defence-supplier details.'],
['sustainability',/climate|sustainability|esg|green ai|emissions/,'A Sustainability Stage exists. RoamWise can discuss lower-carbon travel options using sourced factors, not claim certified corporate emissions reporting.'],
['mobility',/electric vehicle|mobility|metro|electric bus|electric taxi/,'For mobility, compare metro, verified shuttle information, trains and licensed taxis. Live routes, schedules and bookings must come from the relevant operator; RoamWise should not invent service availability.'],
['startup-stage',/consumertech|future makers|founder talk/,'Startup Stage 2 focuses on ConsumerTech for Billions, and Future Makers features startup programming. Check access included in your pass before entering a paid session.'],
['agenda',/agenda|schedule|timetable|what session|programme|today'?s sessions|what to watch/,'The detailed stage-by-stage timetable is published in IST and subject to change. Open the official agenda to select relevant talks before travelling between halls.'],
['day-one',/17 nov|first day|tuesday|day one|day 1/,'Tuesday 17 November includes exhibition opening and inaugural sessions, then afternoon track talks. A free Business Visitor registration does not cover this first day.'],
['day-two',/18 nov|wednesday|day 2|day two|second day/,'Wednesday 18 November is the best cost-controlled exhibition-networking day: free registered business visitors may enter the exhibition area from 10:00 to 18:00, subject to organiser rules.'],
['day-three',/19 nov|thursday|day 3|day three|third day/,'Thursday 19 November is another exhibition day; the free Business Visitor access window is 10:00 to 17:00, with final entry by 16:00.'],
['visitor',/free visitor|visitor registration|business visitor|free admission|exhibition free/,'Official free Business Visitor registration allows exhibition entry 18 Nov 10:00–18:00 and 19 Nov 10:00–17:00 (entry closes 16:00 on the 19th). It does not include unrestricted conference or investor meeting access.'],
['tickets',/tickets?|passes?|delegate|entry fee|registration cost|silver pass|gold pass/,'For conference access, check the current official tariffs. Silver was marked sold out in the organiser page reviewed on 16 Nov. Paid passes differ from free exhibition entry; none automatically grants an investor meeting.'],
['platinum',/platinum|vip lounge|gala dinner/,'The official entitlement table lists VIP Lounge access for Platinum only, with limits. It is not a substitute for an approved Investor Connect appointment.'],
['gold',/gold delegate|gold ticket/,'Gold delegates have wider conference and networking entitlements than exhibition visitors. Confirm the final price, tax and remaining availability on the official ticket page.'],
['silver',/silver delegate|silver ticket/,'Silver includes certain conference sessions, exhibition and InterlinX access, but the organiser currently marks it sold out. Verify before spending money.'],
['investor',/investor connect|meet investor|venture capital|funding meeting|pitch to investor/,'Investor Connect is application-only for eligible registered startups. Deadline: 16 November 2026. You may request up to two panels but at most one is approved. Twenty-minute multi-investor meetings are subject to organiser approval.'],
['investor-apply',/apply investor|book a pitch|meeting application|request investor/,'Use the official Investor Connect application with the email/TIN used for BTS startup registration. A purchased pass or a QR scan does not confirm a pitch slot.'],
['harish',/harish gadagin|anvesana/,'Harish Gadagin, CEO at Anvesana TBI, is the strongest evident tourism-sector match in the listed panels: the organiser lists Kannada Culture and Tourism among his focus areas. He appears in Hall 4 on 18 Nov 16:30–16:50 in Room 1, subject to approval and schedule change.'],
['manoj',/manoj kumar agarwal|seafund/,'Manoj Kumar Agarwal is listed as Managing Partner at Seafund, in a 18 Nov 15:30–15:50 Room 1 panel. Its disclosed focus is cleantech and electronics, so travel marketplace fit is weaker than tourism-focused investors.'],
['deepanshu',/deepanshu khandelwal|catalyst aic/,'Deepanshu Khandelwal is listed at Catalyst AIC (IFMR) for a cleantech/smart-city panel on 18 Nov 15:30–15:50, Hall 4 Room 1. Evaluate fit before requesting time.'],
['vijay',/vijay kumar bawra|sanchi connect/,'Vijay Kumar Bawra is listed at Sanchi Connect in the 18 Nov 15:30–15:50 Hall 4 Room 1 panel. Verify investment mandate and schedule with the organiser.'],
['vishal',/vishal gandhi|biorx/,'Dr Vishal Gandhi of BIORx Ventures appears alongside Harish Gadagin on the 18 Nov 16:30–16:50 panel, with a health/biotech-heavy focus. RoamWise needs a relevant angle before outreach.'],
['ahmed',/ahmed khan|clay capital/,'Ahmed Khan at Clay Capital is also listed in the 18 Nov 16:30–16:50 Hall 4 Room 1 panel. Verify whether its food and agriculture focus fits a travel or hospitality pitch.'],
['tourism-investor',/tourism investor|invest.*tourism|tourism funding|tourism focused/,'Start with Harish Gadagin of Anvesana TBI: the organiser explicitly includes Kannada Culture and Tourism in his focus. Next, investigate other investors with disclosed tourism, mobility and consumer/IT mandates. No investor is committed to fund RoamWise.'],
['investor-contact',/investor email|investor contact|email harish|how to meet harish|offline meeting/,'Use the official investor meeting request first if eligible; ask the event support contacts to clarify access. A polite email or LinkedIn request can seek an offline meeting, but does not confer access to the Investor Connect zone. Do not buy a pass solely on an assumed introduction.'],
['investor-deadline',/investor deadline|last date|applications close/,'The official Investor Connect last date for meeting requests is 16 November 2026. Applications need eligible startup registration and the organiser may still reject or reschedule them.'],
['pitch',/pitch deck|30 second pitch|investor pitch|elevator pitch/,'Try: “RoamWise builds a lightweight AI travel and group-offsite platform around curated local suppliers. We are validating repeat bookings and B2B demand. Could I show you a 30-second demo and ask which metric matters most?” Never invent traction.'],
['fundraise',/fundraise|valuation|how much invest|seed money/,'A serious investor conversation needs evidence: usage, retention, verified revenues, partner economics, gross margin, burn and credible milestones. Prepare true figures only, including areas with zero sales.'],
['startup-meet',/network with startups|meet founders|find startup|startup contacts/,'Use the exhibitor listing and open startup zones. Filter companies by conversational AI, transport, hospitality, creator tools and workplace software. Ask permission before collecting a contact.'],
['expo-roamwise',/roamwise booth|where is roamwise stand|roamwise stall/,'RoamWise runs an independent community demo; no official RoamWise exhibition stall is confirmed. Promoters must not imply endorsement or booth access.'],
['promoters',/student promoter|intern|ambassador|represent roamwise/,'The simple flow: show the 30-second Ailon demo, ask one relevant travel question, invite free signup, and only then request permission to exchange contact details. Use a unique QR rep code and record outcomes honestly.'],
['leads',/lead form|save contact|lead capture|business card details/,'The summit page offers an explicit, consent-first contact exchange: a visitor can prepare an email or save a vCard. RoamWise does not silently harvest or automatically store their phone number.'],
['creator',/creators?|influencers?|artist join|reels partner/,'Tourism creators can join through the RoamWise creator portal. Show an original Reel idea, ask for opt-in follow-up, and avoid promising payment or free stays without written approval.'],
['reels',/reels|social media|short video|instagram reel/,'Try a 15-second Reel: QR scan (3s), ask Ailon a quirky trip question (5s), show its itinerary (5s), CTA to try it (2s). Record participants only with consent and check venue filming rules.'],
['properties',/homestays?|hotels?|stay partner|property owner|tourism stall/,'A tourism or stay partner can submit an application through the RoamWise partner portal. Rates, GST, booking method, approval and payouts stay pending until verified.'],
['weddings',/wedding venue|destination wedding|wedding planner/,'RoamWise explores destination wedding partners and packages. Collect venue capability, season, guest capacity and quotes before proposing a package; no instant price guarantee.'],
['business',/corporate travel|workation|company trip|business travel/,'RoamWise Business has local-first trip expense workflows and exports. Corporate offsites and shared approvals are an emerging offering, not an enterprise ERP replacement.'],
['teams',/team offsite|retreat for team|hackathon travel/,'Start with team size, preferred dates, origin cities, room sharing, budget and accessibility needs. Compare approved venues and request exact group rates before promising bookings.'],
['nomads',/digital nomad|extended stay|long stay|remote work/,'Long-stay travellers should verify Wi-Fi, desk, backup power, cooking and cancellation terms directly with the host. RoamWise has Nomad Match discovery.'],
['trailmesh',/trailmesh|mesh|offline communication|bluetooth trek/,'TrailMesh explores offline group communication on treks. Reliability, battery and supported hardware require field testing; do not promise emergency coverage.'],
['alo',/what is ailon|who are you|about ailon|tusk agent/,'I am Ailon Tusk, RoamWise’s travel copilot. This summit demo uses verified facts and browser voice; the home app can use broader travel planning and managed AI when available. I cannot guarantee arbitrary answers or bookings.'],
['languages',/languages?|kannada|hindi|tamil|telugu|bengali|marathi|malayalam|dialect|ಕನ್ನಡ|हिंदी/,'Choose a language in the summit voice menu. Browser speech recognition and text-to-speech vary by device; Kannada, Hindi, Tamil, Telugu, Bengali, Marathi and Malayalam are best-effort. Complex curated explanations may remain in English.'],
['voice',/microphone|voice mode|voice recognition|two way|duplex/,'Tap Start voice and allow microphone access. Conversation is turn-taking, not simultaneous full-duplex. If your browser cannot recognize the selected language, type instead. The main Ailon app uses the same summit fact pack.'],
['qr',/qr|scan|scan code|pro code|promoter code/,'The summit QR brings you to this experience. Individual promoter codes identify a link source, not a verified referral payment or Pro entitlement. Create a free account separately.'],
['pro',/founder pro|free pro|lifetime membership|coupon/,'A scan does not grant Founder Pro. Any promotional allocation needs an approved eligibility and verified account entitlement process. The free planner is available without promising lifetime benefits.'],
['signup',/sign up|create account|google login|register roamwise/,'Choose Create free account to open the main RoamWise sign-in. Complete Google or email registration there; the summit demo does not itself register a user.'],
['privacy',/privacy|track me|record my voice|data protection|consent/,'The standalone summit demo does not upload audio itself or save contact form entries to a server. Speech recognition may rely on your browser service; only share contact details through an explicit mailto or vCard action.'],
['book',/book now|hotel book|reserve flight|pay now|checkout/,'This summit demo does not process payment or confirm bookings. Use verified partner or airline/train operators and check full final prices before authorising a charge.'],
['reach',/reach the venue|how to reach|directions|airport transfer|from airport/,'From BLR airport, compare licensed airport taxis with public transport to a Green Line metro connection. BIEC is close to Madavara metro at the northwest end of the Green Line. Allow buffer for city traffic and entry queues.'],
['metro',/madavara|metro station|green line|nagasandra|metro route|metro\b/,'Madavara is the Green Line terminus nearest BIEC. For train-to-metro connections, check Bengaluru Metro/BMRCL’s current service and first/last-train timings. Follow official wayfinding to the venue gate.'],
['rail',/train|railway|yesvantpur|yeshwanthpur|ksr|sbc/,'Travel into Bengaluru via a suitable railway station, then connect by metro or cab to BIEC. Check exact long-distance trains, quotas and final fares at IRCTC, not in a static summit guide.'],
['flights',/flights?|airfare|airport|from delhi|from dehradun|from mumbai|overseas/,'Compare live flights to BLR (Kempegowda International Airport) from your origin, luggage and airport-transfer costs. Airline schedules and fares change continuously and are not held by this page.'],
['international',/international visitor|from abroad|visa|passport|foreign guest/,'International visitors should confirm current Indian entry/visa rules with the Government of India, choose flights to BLR, and account for local transport, accommodation, food, entry category and currency costs.'],
['budget',/total cost|how much cost|calculate|expense|budget|cost break/,'Use the Summit Budget Builder below. Enter your actual transport, room rate, nights, local transfers, food and pass amount for a transparent estimate; it is not a live airfare or hotel quote.'],
['hotel',/hotel near|where stay|accommodation|lodging|dorm|hostel/,'For minimal daily travel choose a verified property near BIEC, Madavara, Nagasandra or Dasarahalli. Check live room rates, cancellation rules, late check-in and safe transport links before paying.'],
['sightseeing',/sightseeing|attractions?|things to see|nearby sights|tourist places/,'For a half-day away from BIEC, consider ISKCON Temple Rajajinagar or Bangalore Creative Circus in Yeshwanthpur. Cubbon Park, Bangalore Palace and Lalbagh are farther into the city; plan extra transit time.'],
['iskcon',/iskcon|rajajinagar temple/,'ISKCON Bengaluru’s Rajajinagar temple is a striking hilltop complex. Verify temple admission and darshan times on its official site before leaving BIEC.'],
['palace',/bangalore palace|bengaluru palace/,'Bangalore Palace is a well-known historic attraction north of the central city, not immediately beside BIEC. Confirm ticketing and travel time for your date.'],
['cubbon',/cubbon park|vidhana soudha/,'Cubbon Park is a large green central-city retreat. Pair it with architecture around Vidhana Soudha when your summit schedule allows and check public access.'],
['lalbagh',/lalbagh|botanical garden/,'Lalbagh Botanical Garden is farther south in Bengaluru and suits a spare half-day, not a quick break between BIEC sessions.'],
['creative',/bangalore creative circus|art space|culture nearby/,'Bangalore Creative Circus in Yeshwanthpur is a creative, sustainability-oriented space suitable for a relaxed stop after a long event day. Verify today’s opening and event calendar.'],
['kannada-culture',/kannada|local culture|karna[t]?aka heritage|local arts|local dialect/,'Bengaluru’s Kannada culture includes theatre, classical and contemporary music, filter coffee, traditional darshinis and markets. Avoid equating a whole culture with one language or restaurant.'],
['food',/what to eat|local food|breakfast|dosa|idli|filter coffee|bisi bele bath/,'Try a local darshini for idli-vada, dosa, filter coffee or bisi bele bath. Ask about ingredients and allergies. Find food near BIEC or your metro interchange rather than taking long detours at rush hour.'],
['quiet',/quiet|calm|avoid crowds|anxiety|rest break|low stress/,'Build in breaks: preselect only two sessions per day, find a quiet seat away from main halls, arrive before a rush and use shorter meetings by appointment. You can leave whenever the crowds become too much.'],
['access',/wheelchair|accessibility|disability|step free/,'Ask the organiser about accessible gate, lift, seating and restroom routes. Verify Madavara metro accessibility and the actual venue entry point; don’t assume every hall is step-free.'],
['weather',/weather in bengaluru|rain in bengaluru|climate in november/,'November in Bengaluru is often relatively mild, but an exact-date forecast needs a live weather service. Carry a light layer and check rain shortly before travel.'],
['safety',/safe travel|emergency|lost bag|ambulance/,'Use official venue security and local emergency services for urgent help. Keep your badge and phone secure, and agree on a meeting point for group members. Never rely on a demo chatbot for emergency dispatch.'],
['itinerary',/itinerary|plan a day|one click plan|three day plan/,'Choose a one-click itinerary below: Exhibitor Sprint, Investor Prep, Student Promoter or Culture After Hours. The template is a planning aid, not a booking or an access guarantee.'],
['meeting',/schedule a meeting|networking|appointment|interlinx/,'InterlinX is the summit’s B2B networking facility for eligible delegate categories. Exhibition visitors can make consensual introductions but should not claim access to formal investor appointments.'],
['followup',/follow up|after event|email after meeting/,'A useful follow-up includes the context you discussed, one concrete proposal, a requested next step and a respectful opt-out. Only contact people who agreed to hear from RoamWise.'],
['student',/student jobs|internship|volunteer|student ambassador/,'Students can share the demonstration and qualify tourism or travel-tech opportunities. Any internship, employment or commission offer must be approved in writing before it is advertised.'],
['whatsapp',/whatsapp|share brochure|share link/,'Use the printable QR field kit for a low-friction introduction. For a lead, ask permission and use the explicit contact-exchange form. Do not automatically add anyone to a WhatsApp broadcast.'],
['souvenirs',/buy something|roamwise shop|merchandise|products to buy/,'RoamWise has a separate shop. Check actual inventory, price and payment readiness on the shop listing before promising an immediate sale.'],
['feedback',/feedback|bug|not working|wrong answer/,'Please report the exact question, device/browser and what went wrong through RoamWise support. The summit mini-demo has curated topics; for broad travel tasks use the full Ailon copilot.'],
['archive',/photos|memories|event gallery|upload photo/,'Event photos belong in RoamWise Memories only after upload permission, caption verification and source attribution. There are no newly verified RoamWise 2026 summit photos in this demo yet.']
];
var sessionUntil=0;
var locales={
 'hi-IN':{hello:'नमस्ते! मैं ऐलन टस्क हूँ। सम्मेलन के कार्यक्रम, निवेशकों और यात्रा के बारे में पूछिए।',dates:'बेंगलुरु टेक समिट 17 से 19 नवंबर 2026 तक बीआईईसी में है। समय की पुष्टि आधिकारिक कार्यक्रम से करें।',investor:'निवेशक बैठक के लिए पात्र स्टार्टअप पंजीकरण और आयोजक की स्वीकृति जरूरी है। केवल टिकट खरीदने से बैठक तय नहीं होती।'},
 'kn-IN':{hello:'ನಮಸ್ಕಾರ! ನಾನು ಐಲನ್ ಟಸ್ಕ್. ಸಮ್ಮೇಳನ, ಹೂಡಿಕೆದಾರರು ಮತ್ತು ಪ್ರವಾಸದ ಬಗ್ಗೆ ಕೇಳಿ.',dates:'ಬೆಂಗಳೂರು ಟೆಕ್ ಸಮ್ಮಿಟ್ ನವೆಂಬರ್ 17 ರಿಂದ 19, 2026 ರವರೆಗೆ ಬಿಐಇಸಿಯಲ್ಲಿ ನಡೆಯುತ್ತದೆ. ಸಮಯಕ್ಕಾಗಿ ಅಧಿಕೃತ ವೇಳಾಪಟ್ಟಿ ನೋಡಿ.',investor:'ಹೂಡಿಕೆದಾರರ ಭೇಟಿಗೆ ಅರ್ಹ ಸ್ಟಾರ್ಟಪ್ ನೋಂದಣಿ ಮತ್ತು ಆಯೋಜಕರ ಅನುಮೋದನೆ ಬೇಕು. ಟಿಕೆಟ್ ಮಾತ್ರ ಸಾಕಾಗುವುದಿಲ್ಲ.'},
 'ta-IN':{hello:'வணக்கம்! நான் ஐலன் டஸ்க். உச்சிமாநாடு மற்றும் பயணம் பற்றி கேளுங்கள்.',dates:'பெங்களூரு தொழில்நுட்ப உச்சிமாநாடு நவம்பர் 17 முதல் 19, 2026 வரை BIEC-யில் நடைபெறும்.',investor:'முதலீட்டாளர் சந்திப்புக்கு தகுதியான ஸ்டார்ட்அப் பதிவும் ஏற்பாட்டாளரின் ஒப்புதலும் தேவை.'},
 'te-IN':{hello:'నమస్కారం! నేను ఐలన్ టస్క్. సదస్సు, ప్రయాణం గురించి అడగండి.',dates:'బెంగళూరు టెక్ సమ్మిట్ నవంబర్ 17 నుండి 19, 2026 వరకు BIECలో జరుగుతుంది.',investor:'ఇన్వెస్టర్ సమావేశానికి అర్హత గల స్టార్టప్ నమోదు, నిర్వాహకుల ఆమోదం అవసరం.'},
 'bn-IN':{hello:'নমস্কার! আমি আইলন টাস্ক। সম্মেলন ও ভ্রমণ সম্পর্কে জিজ্ঞাসা করুন।',dates:'বেঙ্গালুরু টেক সামিট ১৭ থেকে ১৯ নভেম্বর ২০২৬, BIEC-এ অনুষ্ঠিত হবে।',investor:'বিনিয়োগকারীর সঙ্গে সাক্ষাতের জন্য যোগ্য স্টার্টআপ নিবন্ধন এবং আয়োজকের অনুমোদন প্রয়োজন।'},
 'mr-IN':{hello:'नमस्कार! मी आयलन टस्क. परिषद आणि प्रवासाबद्दल विचारा.',dates:'बेंगळुरू टेक समिट १७ ते १९ नोव्हेंबर २०२६ रोजी BIEC येथे आहे.',investor:'गुंतवणूकदार भेटीसाठी पात्र स्टार्टअप नोंदणी आणि आयोजकांची मंजुरी आवश्यक आहे.'},
 'ml-IN':{hello:'നമസ്കാരം! ഞാൻ ഐലൺ ടസ്ക്. ഉച്ചകോടിയെയും യാത്രയെയും കുറിച്ച് ചോദിക്കൂ.',dates:'ബെംഗളൂരു ടെക് സമിറ്റ് 2026 നവംബർ 17 മുതൽ 19 വരെ BIEC-യിൽ നടക്കും.',investor:'നിക്ഷേപക കൂടിക്കാഴ്ചയ്ക്ക് യോഗ്യമായ സ്റ്റാർട്ടപ്പ് രജിസ്ട്രേഷനും സംഘാടകരുടെ അനുമതിയും ആവശ്യമാണ്.'}
};
var summitScope=/\b(bts\b|bengaluru tech summit|bangalore tech summit|biec|investor connect|summit|future makers|interlinx|harish gadagin|seafund|anvesana)\b/i;
function answer(text,opts){
 opts=opts||{}; text=String(text||'').trim().slice(0,1200); if(!text)return null;
 var force=!!opts.force, language=String(opts.language||'en-IN');
 if(!force && !summitScope.test(text) && Date.now()>sessionUntil)return null;
 var topic=null, best=-Infinity;for(var i=0;i<entries.length;i++){
  var found=text.toLowerCase().match(entries[i][1]);if(!found)continue;
  var category=entries[i][0];
  var score=found[0].length+(category==='dates'||category==='venue'||category==='reach'? -4:0);
  if(/^(?:harish|manoj|deepanshu|vijay|vishal|ahmed|tourism-investor|investor-deadline|investor-contact|startup-meet|investor-apply)$/.test(category))score+=15;
  if(category==='metro'&&/metro|madavara|nagasandra/.test(text.toLowerCase()))score+=10;
  if(category==='kannada-culture'&&/kannada.{0,20}culture|culture.{0,20}kannada/.test(text.toLowerCase()))score+=18;
  if(score>best){best=score;topic=entries[i];}
 }
 if(!topic){ if(!force)return null;
  return {id:'fallback', text:'This short summit guide cannot verify that particular answer. For open-ended travel planning open the full Ailon Tusk, or consult the organiser’s current programme and exhibitor directory.',source:SOURCES.event};
 }
 sessionUntil=Date.now()+4*60*1000;
 var translated=locales[language];
 var localized=translated && (topic[0]==='dates'||topic[0]==='investor') ? translated[topic[0]] : null;
 return {id:topic[0],text:localized||topic[2],language:localized?language:'en-IN',source:(/invest|pitch|fundraise/.test(topic[0])?SOURCES.investors:/ticket|pass|visitor/.test(topic[0])?SOURCES.passes:/exhib|startups|roster/.test(topic[0])?SOURCES.startups:SOURCES.agenda)};
}
root.RWSummitAtlas={answer:answer,topics:entries.length,sources:SOURCES,locales:locales,greeting:function(lang){return (locales[lang]&&locales[lang].hello)||'Namaste Bengaluru! Ask about BTS 2026, visitor passes, investors, startups, local culture or the next journey.';}};
})(typeof window!=='undefined'?window:globalThis);
