/* Bounded editorial directory; official references checked 10 October 2026. No live telemetry. */
(function (root) {
  'use strict';
  function place(en, hi, mantra) { return { en: en, hi: hi, mantra: mantra }; }
  root.RWPilgrimage = {
    checked: '2026-10-10',
    sites: [
      {
        id: 'char-dham', name: { en: 'Char Dham Yatra', hi: 'चार धाम यात्रा' }, symbol: 'ॐ', terrain: 'mountain',
        intro: { en: 'Four Himalayan shrines, one carefully prepared journey. This page covers Uttarakhand’s Yamunotri, Gangotri, Kedarnath and Badrinath circuit.', hi: 'चार हिमालयी धाम, तैयारी के साथ एक यात्रा। यहाँ उत्तराखंड के यमुनोत्री, गंगोत्री, केदारनाथ और बदरीनाथ की यात्रा है।' },
        places: [place('Yamunotri, Uttarakhand', 'यमुनोत्री', 'yamuna'), place('Gangotri, Uttarakhand', 'गंगोत्री', 'ganga'), place('Kedarnath, Uttarakhand', 'केदारनाथ', 'shiva'), place('Badrinath, Uttarakhand', 'बदरीनाथ', 'narayan')],
        preparation: { en: 'Complete the official Tourist Care registration and check the current temple notices before arranging travel. Plan each shrine separately; seasonal access, mountain roads and walking sections need their own checks.', hi: 'यात्रा की व्यवस्था से पहले आधिकारिक Tourist Care पंजीकरण और मंदिर की ताज़ा सूचना देखें। हर धाम की अलग तैयारी करें; मौसमी प्रवेश, पहाड़ी सड़क और पैदल मार्ग की अलग जानकारी लें।' },
        dates: { en: 'Opening and closing dates are announced for each season. Check BKTC and Tourist Care for your travel date; this planner does not confirm a shrine is open.', hi: 'कपाट खुलने और बंद होने की तिथियाँ हर वर्ष घोषित होती हैं। अपनी तिथि के लिए BKTC और Tourist Care देखें; यह प्लानर मंदिर खुला होने की पुष्टि नहीं करता।' },
        sources: [['Uttarakhand Tourism · Char Dham', 'https://uttarakhandtourism.gov.in/experiences/char-dham'], ['Tourist Care · registration', 'https://registrationandtouristcare.uk.gov.in/'], ['BKTC · temple notices', 'https://badrinath-kedarnath.gov.in/'], ['Uttarakhand Traffic Police', 'https://uttarakhandtraffic.com/']]
      },
      {
        id: 'panch-kedar', name: { en: 'Panch Kedar', hi: 'पंच केदार' }, symbol: 'ॐ', terrain: 'mountain',
        intro: { en: 'Five Shiva shrines across the Garhwal Himalaya: Kedarnath, Madhmaheshwar, Tungnath, Rudranath and Kalpeshwar. Prepare for each trail as its own journey.', hi: 'गढ़वाल हिमालय के पाँच शिव धाम: केदारनाथ, मध्यमहेश्वर, तुंगनाथ, रुद्रनाथ और कल्पेश्वर। हर मार्ग की अलग यात्रा की तरह तैयारी करें।' },
        places: [place('Kedarnath, Uttarakhand', 'केदारनाथ', 'shiva'), place('Madhmaheshwar, Uttarakhand', 'मध्यमहेश्वर', 'shiva'), place('Tungnath, Uttarakhand', 'तुंगनाथ', 'shiva'), place('Rudranath, Uttarakhand', 'रुद्रनाथ', 'shiva'), place('Kalpeshwar, Uttarakhand', 'कल्पेश्वर', 'shiva')],
        preparation: { en: 'Check trail access, weather and accommodation with the local administration before departure. Do not treat the five routes as a single road trip. Choose daylight travel and a plan suited to your group.', hi: 'निकलने से पहले स्थानीय प्रशासन से मार्ग, मौसम और ठहरने की जानकारी लें। पाँचों मार्ग को एक सड़क यात्रा न समझें। दिन के उजाले और समूह के अनुसार योजना बनाएँ।' },
        dates: { en: 'Temple seasons and trail availability differ. Verify each shrine’s notice rather than applying one opening date to all five.', hi: 'मंदिरों के मौसम और मार्ग की उपलब्धता अलग होती है। पाँचों के लिए एक तिथि मानने के बजाय हर धाम की सूचना देखें।' },
        sources: [['Uttarakhand Tourism · Panch Kedar', 'https://uttarakhandtourism.gov.in/experiences/panch-kedar'], ['BKTC · temple notices', 'https://badrinath-kedarnath.gov.in/'], ['Tourist Care · Kedarnath registration', 'https://registrationandtouristcare.uk.gov.in/'], ['Uttarakhand Traffic Police', 'https://uttarakhandtraffic.com/']]
      },
      {
        id: 'kumbh', name: { en: 'Kumbh · four sacred river cities', hi: 'कुंभ · चार पवित्र नदी नगर' }, symbol: '◌', terrain: 'river',
        intro: { en: 'Explore Prayagraj, Haridwar, Nashik–Trimbakeshwar and Ujjain. Kumbh is a rotating event, not a permanent festival at every city.', hi: 'प्रयागराज, हरिद्वार, नासिक–त्र्यंबकेश्वर और उज्जैन की तैयारी करें। कुंभ अलग समय पर अलग नगरों में होता है; हर नगर में हमेशा मेला नहीं चलता।' },
        places: [place('Prayagraj, Uttar Pradesh', 'प्रयागराज', 'shanti'), place('Haridwar, Uttarakhand', 'हरिद्वार', 'ganga'), place('Nashik, Maharashtra', 'नासिक', 'shanti'), place('Trimbakeshwar, Maharashtra', 'त्र्यंबकेश्वर', 'shiva'), place('Ujjain, Madhya Pradesh', 'उज्जैन', 'shiva')],
        preparation: { en: 'Agree on a meeting point and carry a written group contact. Follow the organiser’s bathing, ghat and pedestrian instructions. Confirm assigned parking or shuttle locations from the current event notice.', hi: 'मिलने का स्थान तय करें और समूह का संपर्क कागज़ पर रखें। स्नान, घाट और पैदल मार्ग पर आयोजक के निर्देश मानें। पार्किंग या शटल स्थान की पुष्टि वर्तमान मेले की सूचना से करें।' },
        dates: { en: 'Bathing dates, sectors and access plans belong to the relevant event authority. No upcoming snan date has been imported into this page; open the city’s official notices before booking.', hi: 'स्नान तिथियाँ, सेक्टर और प्रवेश योजना संबंधित मेला प्राधिकरण घोषित करता है। इस पेज पर आगामी स्नान तिथि नहीं जोड़ी गई; बुकिंग से पहले नगर की आधिकारिक सूचना देखें।' },
        sources: [['Nashik district · Kumbh history', 'https://nashik.gov.in/en/tourism/culture-heritage/'], ['Nashik district · notices', 'https://nashik.gov.in/'], ['Prayagraj district', 'https://prayagraj.nic.in/'], ['Haridwar district', 'https://haridwar.nic.in/'], ['Ujjain district', 'https://ujjain.nic.in/']]
      },
      {
        id: 'vaishno-devi', name: { en: 'Mata Vaishno Devi', hi: 'माता वैष्णो देवी' }, symbol: '✦', terrain: 'mountain',
        intro: { en: 'Plan your Katra journey with the Shrine Board’s registration and service notices close at hand.', hi: 'कटरा यात्रा की तैयारी में श्राइन बोर्ड के पंजीकरण और सेवा सूचनाएँ साथ रखें।' },
        places: [place('Katra, Jammu and Kashmir', 'कटरा', 'devi'), place('Shri Mata Vaishno Devi Bhawan', 'माता वैष्णो देवी भवन', 'devi')],
        preparation: { en: 'The Shrine Board requires yatra registration and collection of an RFID access card. Use its own service links for accommodation and transport, and recheck weather-related restrictions before starting.', hi: 'श्राइन बोर्ड यात्रा पंजीकरण और RFID प्रवेश कार्ड लेने को कहता है। ठहरने और परिवहन के लिए बोर्ड के सेवा लिंक इस्तेमाल करें तथा चलने से पहले मौसम संबंधी रोक देखें।' },
        dates: { en: 'Navratri and service quotas need current Shrine Board notices. This page does not reserve a place in any queue or service.', hi: 'नवरात्रि और सेवा कोटे के लिए श्राइन बोर्ड की ताज़ा सूचना देखें। यह पेज किसी कतार या सेवा में स्थान आरक्षित नहीं करता।' },
        sources: [['Shri Mata Vaishno Devi Shrine Board', 'https://www.maavaishnodevi.org/'], ['Official online registration & services', 'https://online.maavaishnodevi.org/']]
      },
      {
        id: 'kashi', name: { en: 'Kashi Vishwanath', hi: 'काशी विश्वनाथ' }, symbol: 'ॐ', terrain: 'river',
        intro: { en: 'A Varanasi visit centred on Shiva, the ghats and a considerate plan for busy pedestrian spaces.', hi: 'शिव, घाट और व्यस्त पैदल मार्गों के प्रति संवेदनशील योजना के साथ वाराणसी यात्रा करें।' },
        places: [place('Shri Kashi Vishwanath Temple, Varanasi', 'श्री काशी विश्वनाथ मंदिर', 'shiva'), place('Dashashwamedh Ghat, Varanasi', 'दशाश्वमेध घाट', 'ganga')],
        preparation: { en: 'The Trust website provides booking and live-darshan links. Check entry and belongings guidance there, then confirm the walking approach and any riverfront restrictions locally.', hi: 'ट्रस्ट की वेबसाइट पर बुकिंग और लाइव दर्शन लिंक हैं। प्रवेश और सामान के निर्देश वहाँ देखें; पैदल पहुँच और घाट की किसी रोक की स्थानीय पुष्टि करें।' },
        dates: { en: 'For aarti availability and festival arrangements, use the Trust’s current notices. A map route is not permission to drive into pedestrian areas.', hi: 'आरती उपलब्धता और पर्व व्यवस्था के लिए ट्रस्ट की वर्तमान सूचना देखें। मानचित्र का रास्ता पैदल क्षेत्र में वाहन ले जाने की अनुमति नहीं है।' },
        sources: [['Shri Kashi Vishwanath Trust', 'https://shrikashivishwanath.org/'], ['Varanasi district', 'https://varanasi.nic.in/']]
      },
      {
        id: 'tirupati', name: { en: 'Tirumala · Tirupati', hi: 'तिरुमला · तिरुपति' }, symbol: '✦', terrain: 'mountain',
        intro: { en: 'Prepare for a Tirumala visit using TTD’s official darshan, accommodation and news links.', hi: 'TTD के आधिकारिक दर्शन, ठहरने और समाचार लिंक से तिरुमला यात्रा की तैयारी करें।' },
        places: [place('Tirumala, Andhra Pradesh', 'तिरुमला', 'narayan'), place('Tirupati, Andhra Pradesh', 'तिरुपति', 'narayan')],
        preparation: { en: 'Use the online-services link published by TTD itself. Confirm your darshan instructions, reporting point and accommodation before travel; RoamWise does not issue TTD tickets.', hi: 'TTD द्वारा प्रकाशित ऑनलाइन सेवा लिंक इस्तेमाल करें। यात्रा से पहले दर्शन निर्देश, रिपोर्टिंग स्थान और ठहरने की पुष्टि करें; रोमवाइज़ TTD टिकट जारी नहीं करता।' },
        dates: { en: 'Quota releases and festival arrangements change. Check TTD news and your booking instructions for the date you choose.', hi: 'कोटा खुलने और पर्व व्यवस्था में बदलाव होते हैं। चुनी तिथि के लिए TTD समाचार और बुकिंग निर्देश देखें।' },
        sources: [['Tirumala Tirupati Devasthanams', 'https://www.tirumala.org/'], ['TTD · official online services', 'https://ttdevasthanams.ap.gov.in/'], ['TTD News', 'https://news.tirumala.org/']]
      },
      {
        id: 'ayodhya', name: { en: "Ayodhya · Ram Janmabhoomi", hi: "अयोध्या · राम जन्मभूमि" }, symbol: '✦', terrain: 'river',
        intro: { en: "A Sarayu-side city of Shri Ram devotion. Plan your Ram Mandir darshan around the Trust’s own notices and a careful walking plan.", hi: "सरयू तट पर श्री राम भक्ति की नगरी। राम मंदिर दर्शन की योजना ट्रस्ट की अपनी सूचनाओं और सावधान पैदल मार्ग के साथ बनाएँ।" },
        places: [place("Shri Ram Janmabhoomi Mandir, Ayodhya", "श्री राम जन्मभूमि मंदिर", 'narayan'), place("Saryu Ghat, Ayodhya", "सरयू घाट", 'ganga')],
        preparation: { en: "Use the Trust’s official website for darshan and aarti information. Confirm entry rules, belongings guidance and the walking approach for your date before leaving.", hi: "दर्शन और आरती की जानकारी के लिए ट्रस्ट की आधिकारिक वेबसाइट देखें। निकलने से पहले अपनी तिथि के लिए प्रवेश नियम, सामान संबंधी निर्देश और पैदल मार्ग जाँच लें।" },
        dates: { en: "Aarti timings, passes and festival arrangements are set by the Trust and local authorities. This page does not confirm any slot or live crowd level.", hi: "आरती समय, पास और पर्व व्यवस्था ट्रस्ट और स्थानीय प्रशासन तय करते हैं। यह पेज किसी स्लॉट या भीड़ की स्थिति की पुष्टि नहीं करता।" },
        sources: [["Shri Ram Janmabhoomi Teerth Kshetra", 'https://srjbtkshetra.org/']]
      },
      {
        id: 'dwarka-somnath', name: { en: "Dwarka · Somnath", hi: "द्वारका · सोमनाथ" }, symbol: 'ॐ', terrain: 'coast',
        intro: { en: "Two sacred coastal shrines of Gujarat: Dwarkadhish, the Krishna temple at Dwarka, and Somnath, the first of the twelve Jyotirlingas.", hi: "गुजरात के दो पवित्र तटीय धाम: द्वारका का श्रीकृष्ण मंदिर द्वारकाधीश और बारह ज्योतिर्लिंगों में पहला सोमनाथ।" },
        places: [place("Dwarkadhish Temple, Dwarka, Gujarat", "द्वारकाधीश मंदिर, द्वारका", 'narayan'), place("Somnath Temple, Gujarat", "सोमनाथ मंदिर", 'shiva')],
        preparation: { en: "Treat the two shrines as separate stops and check each temple’s own notices for darshan and aarti timings. Allow travel time between them and keep to marked beach and ghat areas.", hi: "दोनों धामों को अलग पड़ाव मानें और दर्शन व आरती के समय के लिए हर मंदिर की अपनी सूचना देखें। दोनों के बीच यात्रा का समय रखें और चिह्नित तट व घाट क्षेत्र में ही रहें।" },
        dates: { en: "Darshan timings and festival arrangements are announced by each temple. Check them for your date; this planner does not reserve a place or confirm a schedule.", hi: "दर्शन समय और पर्व व्यवस्था हर मंदिर घोषित करता है। अपनी तिथि के लिए उन्हें देखें; यह प्लानर स्थान आरक्षित नहीं करता और कार्यक्रम की पुष्टि नहीं करता।" },
        sources: [["Dwarkadhish Temple", 'https://www.dwarkadhish.org/'], ["Shree Somnath Trust", 'https://www.somnath.org/'], ["Gujarat Tourism", 'https://www.gujarattourism.com/']]
      },
      {
        id: 'puri-konark', name: { en: "Puri · Konark", hi: "पुरी · कोणार्क" }, symbol: '✦', terrain: 'coast',
        intro: { en: "Odisha’s Jagannath Dham at Puri, with the Sun Temple at Konark nearby. Prepare for each place as its own visit.", hi: "ओडिशा का पुरी स्थित जगन्नाथ धाम और पास का कोणार्क सूर्य मंदिर। हर स्थान को अलग यात्रा मानकर तैयारी करें।" },
        places: [place("Jagannath Temple, Puri, Odisha", "जगन्नाथ मंदिर, पुरी", 'narayan'), place("Konark Sun Temple, Odisha", "कोणार्क सूर्य मंदिर", 'shanti')],
        preparation: { en: "Check temple entry and darshan guidance with the local administration for Puri. Konark is a protected monument, so confirm visiting hours and rules with the official monument and tourism sources.", hi: "पुरी के लिए स्थानीय प्रशासन से मंदिर प्रवेश और दर्शन संबंधी निर्देश देखें। कोणार्क एक संरक्षित स्मारक है, इसलिए आधिकारिक स्मारक और पर्यटन स्रोतों से समय और नियम जाँच लें।" },
        dates: { en: "Festival dates and special arrangements, including the Rath Yatra, are announced by the authorities. No date has been imported into this page.", hi: "रथ यात्रा सहित पर्व तिथियाँ और विशेष व्यवस्था प्रशासन घोषित करता है। इस पेज में कोई तिथि आयात नहीं की गई है।" },
        sources: [["Puri district", 'https://puri.nic.in/'], ["Odisha Tourism", 'https://odishatourism.gov.in/'], ["Archaeological Survey of India", 'https://asi.nic.in/']]
      },
      {
        id: 'amarnath', name: { en: "Amarnath Yatra", hi: "अमरनाथ यात्रा" }, symbol: 'ॐ', terrain: 'mountain',
        intro: { en: "A high-altitude Himalayan cave shrine of Shiva in Jammu and Kashmir. The yatra is a regulated seasonal journey with its own rules.", hi: "जम्मू-कश्मीर में शिव का हिमालयी गुफा तीर्थ। यह नियमों वाली मौसमी यात्रा है।" },
        places: [place("Amarnath Cave, Jammu and Kashmir", "अमरनाथ गुफा", 'shiva'), place("Pahalgam, Jammu and Kashmir", "पहलगाम", 'shiva'), place("Baltal, Jammu and Kashmir", "बालटाल", 'shiva')],
        preparation: { en: "Read the Shrine Board’s registration and health requirements before planning anything else. High altitude, cold and weather change quickly, so follow the Board’s and administration’s instructions on the day.", hi: "कुछ और तय करने से पहले श्राइन बोर्ड की पंजीकरण और स्वास्थ्य संबंधी शर्तें पढ़ें। ऊँचाई, ठंड और मौसम जल्दी बदलते हैं, इसलिए उसी दिन बोर्ड और प्रशासन के निर्देश मानें।" },
        dates: { en: "Yatra dates, routes and registration windows are announced by the Shrine Board each season. This page does not confirm any date or route.", hi: "यात्रा की तिथियाँ, मार्ग और पंजीकरण अवधि श्राइन बोर्ड हर मौसम घोषित करता है। यह पेज किसी तिथि या मार्ग की पुष्टि नहीं करता।" },
        sources: [["Shri Amarnathji Shrine Board", 'https://www.shriamarnathjishrine.com/']]
      },
      {
        id: 'shirdi', name: { en: "Shirdi Sai Baba", hi: "शिरडी साईं बाबा" }, symbol: '✦', terrain: 'plain',
        intro: { en: "Prepare a Shirdi visit to the Samadhi Mandir using the Sansthan’s own darshan, accommodation and notice links.", hi: "संस्थान के अपने दर्शन, ठहरने और सूचना लिंक से समाधि मंदिर, शिरडी की यात्रा की तैयारी करें।" },
        places: [place("Shri Saibaba Samadhi Mandir, Shirdi, Maharashtra", "श्री साईबाबा समाधि मंदिर, शिरडी", 'shanti')],
        preparation: { en: "Use the Sansthan’s official website for darshan, aarti and accommodation information. Confirm entry and belongings guidance before you travel.", hi: "दर्शन, आरती और ठहरने की जानकारी के लिए संस्थान की आधिकारिक वेबसाइट देखें। यात्रा से पहले प्रवेश और सामान संबंधी निर्देश जाँच लें।" },
        dates: { en: "Aarti timings, festival days and any booking arrangement are set by the Sansthan. Check its current notices for your date.", hi: "आरती समय, पर्व दिवस और बुकिंग व्यवस्था संस्थान तय करता है। अपनी तिथि के लिए उसकी ताज़ा सूचनाएँ देखें।" },
        sources: [["Shri Saibaba Sansthan Trust, Shirdi", 'https://sai.org.in/']]
      },
      {
        id: 'bodh-gaya', name: { en: "Bodh Gaya", hi: "बोधगया" }, symbol: '☸', terrain: 'plain',
        intro: { en: "The Mahabodhi Temple complex in Bihar, a UNESCO World Heritage Site and a place of quiet for pilgrims of many traditions.", hi: "बिहार का महाबोधि मंदिर परिसर, यूनेस्को विश्व धरोहर स्थल और कई परंपराओं के तीर्थयात्रियों के लिए शांति का स्थान।" },
        places: [place("Mahabodhi Temple, Bodh Gaya, Bihar", "महाबोधि मंदिर, बोधगया", 'shanti')],
        preparation: { en: "Check visiting hours, entry rules and photography guidance with the Temple Management Committee. Dress modestly and keep the grounds quiet.", hi: "समय, प्रवेश नियम और फ़ोटोग्राफ़ी संबंधी निर्देश के लिए मंदिर प्रबंधन समिति से जाँच करें। शालीन वस्त्र पहनें और परिसर में शांति रखें।" },
        dates: { en: "Special observances and any temporary access changes are announced by the Committee. Check them before travel.", hi: "विशेष आयोजन और अस्थायी प्रवेश बदलाव समिति घोषित करती है। यात्रा से पहले देख लें।" },
        sources: [["Bodhgaya Temple Management Committee", 'https://www.bodhgayatemple.com/']]
      },
      {
        id: 'rameswaram-madurai', name: { en: "Rameswaram · Madurai", hi: "रामेश्वरम · मदुरै" }, symbol: 'ॐ', terrain: 'coast',
        intro: { en: "Two great temple towns of Tamil Nadu: Rameswaram, one of the twelve Jyotirlingas, and Madurai, home of the Meenakshi temple.", hi: "तमिलनाडु के दो बड़े मंदिर नगर: बारह ज्योतिर्लिंगों में से रामेश्वरम और मीनाक्षी मंदिर वाला मदुरै।" },
        places: [place("Ramanathaswamy Temple, Rameswaram, Tamil Nadu", "रामनाथस्वामी मंदिर, रामेश्वरम", 'shiva'), place("Meenakshi Temple, Madurai, Tamil Nadu", "मीनाक्षी मंदिर, मदुरै", 'devi')],
        preparation: { en: "Check darshan timings and any dress guidance with each temple and the district administration. Plan the two towns as separate days and carry water in the heat.", hi: "दर्शन समय और वस्त्र संबंधी निर्देश हर मंदिर और जिला प्रशासन से जाँच लें। दोनों नगरों को अलग दिनों की योजना मानें और गर्मी में पानी साथ रखें।" },
        dates: { en: "Festival dates and special arrangements are announced by the temples and district authorities. No date is imported into this page.", hi: "पर्व तिथियाँ और विशेष व्यवस्था मंदिर और जिला प्रशासन घोषित करते हैं। इस पेज में कोई तिथि आयात नहीं की गई है।" },
        sources: [["Ramanathapuram district", 'https://ramanathapuram.nic.in/'], ["Madurai district", 'https://madurai.nic.in/']]
      },
      {
        id: 'kasar-devi-almora', name: { en: "Kasar Devi · Almora hills", hi: "कसार देवी · अल्मोड़ा की पहाड़ियाँ" }, symbol: '✦', terrain: 'mountain',
        intro: { en: "A quiet circuit of hill shrines around Almora in Kumaon: Kasar Devi, Chitai Golu Devta and the ancient Katarmal Sun Temple. Best taken slowly, early in the day.", hi: "कुमाऊँ में अल्मोड़ा के आसपास पहाड़ी मंदिरों की शांत यात्रा: कसार देवी, चितई गोलू देवता और प्राचीन कटारमल सूर्य मंदिर। सुबह जल्दी और धीरे-धीरे घूमना सबसे अच्छा है।" },
        places: [place("Kasar Devi Temple, Almora, Uttarakhand", "कसार देवी मंदिर, अल्मोड़ा", 'devi'), place("Chitai Golu Devta Temple, Almora, Uttarakhand", "चितई गोलू देवता मंदिर, अल्मोड़ा", 'shanti'), place("Katarmal Sun Temple, Almora, Uttarakhand", "कटारमल सूर्य मंदिर, अल्मोड़ा", 'shanti')],
        preparation: { en: "Treat each shrine as a short stop on narrow hill roads and allow daylight for the drive. Keep the temple premises quiet, follow local guidance on footwear and photography, and check weather and road conditions with the district administration before leaving.", hi: "हर मंदिर को संकरी पहाड़ी सड़कों पर एक छोटा पड़ाव मानें और गाड़ी चलाने के लिए दिन का उजाला रखें। परिसर में शांति रखें, जूते और फ़ोटोग्राफ़ी पर स्थानीय निर्देश मानें और निकलने से पहले मौसम व सड़क की स्थिति जिला प्रशासन से जाँच लें।" },
        dates: { en: "Temple timings, festival days and any local arrangements are set by each temple committee and the district administration. No date or crowd level is imported into this page.", hi: "मंदिर के समय, पर्व दिवस और स्थानीय व्यवस्था हर मंदिर समिति और जिला प्रशासन तय करता है। इस पेज में कोई तिथि या भीड़ की स्थिति आयात नहीं की गई है।" },
        sources: [["Almora district", 'https://almora.nic.in/'], ["Uttarakhand Tourism", 'https://uttarakhandtourism.gov.in/']]
      },
      {
        id: 'jageshwar', name: { en: "Jageshwar Dham", hi: "जागेश्वर धाम" }, symbol: 'ॐ', terrain: 'mountain',
        intro: { en: "A cluster of ancient Shiva temples set in a deodar forest valley near Almora. A place for an unhurried morning rather than a checklist.", hi: "अल्मोड़ा के पास देवदार वन की घाटी में प्राचीन शिव मंदिरों का समूह। जल्दबाज़ी के बजाय एक शांत सुबह के लिए उपयुक्त स्थान।" },
        places: [place("Jageshwar Dham, Almora, Uttarakhand", "जागेश्वर धाम, अल्मोड़ा", 'shiva')],
        preparation: { en: "Check the temple committee’s notices and the district administration for access and timings. Plan for a mountain road drive in daylight, dress for cool weather and keep to marked paths in the forest.", hi: "प्रवेश और समय के लिए मंदिर समिति की सूचनाएँ और जिला प्रशासन देखें। पहाड़ी सड़क की यात्रा दिन में रखें, ठंडे मौसम के कपड़े पहनें और वन में चिह्नित रास्तों पर ही चलें।" },
        dates: { en: "Special observances and any seasonal arrangements are announced locally. This page does not confirm a date, schedule or crowd level.", hi: "विशेष आयोजन और मौसमी व्यवस्था स्थानीय स्तर पर घोषित होती है। यह पेज किसी तिथि, कार्यक्रम या भीड़ की स्थिति की पुष्टि नहीं करता।" },
        sources: [["Almora district", 'https://almora.nic.in/'], ["Uttarakhand Tourism", 'https://uttarakhandtourism.gov.in/']]
      },
      {
        id: 'adi-kailash', name: { en: "Adi Kailash · Om Parvat", hi: "आदि कैलाश · ओम पर्वत" }, symbol: 'ॐ', terrain: 'mountain',
        intro: { en: "A remote high-Himalayan journey in Pithoragarh district towards Adi (Chhota) Kailash and Om Parvat, close to the Tibet border. Quiet, demanding and permit-based.", hi: "पिथौरागढ़ जिले में तिब्बत सीमा के पास आदि (छोटा) कैलाश और ओम पर्वत की दूरस्थ ऊँचे हिमालय की यात्रा। शांत, कठिन और अनुमति आधारित।" },
        places: [place("Adi Kailash, Pithoragarh, Uttarakhand", "आदि कैलाश, पिथौरागढ़", 'shiva'), place("Om Parvat, Pithoragarh, Uttarakhand", "ओम पर्वत, पिथौरागढ़", 'shiva')],
        preparation: { en: "This is a border-area route at high altitude. Confirm permit requirements, road status and health advice with the Pithoragarh administration and Uttarakhand Tourism before booking anything, and plan acclimatisation days.", hi: "यह ऊँचाई पर सीमा क्षेत्र का मार्ग है। कुछ भी बुक करने से पहले अनुमति, सड़क की स्थिति और स्वास्थ्य संबंधी सलाह पिथौरागढ़ प्रशासन और उत्तराखंड पर्यटन से पक्की करें और ऊँचाई के अनुकूल ढलने के दिन रखें।" },
        dates: { en: "Route opening, permits and weather closures are decided by the authorities and change often. This planner confirms none of them.", hi: "मार्ग खुलना, अनुमतियाँ और मौसम के कारण बंदी प्रशासन तय करता है और अक्सर बदलती है। यह प्लानर इनमें से किसी की पुष्टि नहीं करता।" },
        sources: [["Pithoragarh district", 'https://pithoragarh.nic.in/'], ["Uttarakhand Tourism", 'https://uttarakhandtourism.gov.in/'], ["Kumaon Mandal Vikas Nigam", 'https://kmvn.gov.in/']]
      },
      {
        id: 'kailash-mansarovar', name: { en: "Kailash Mansarovar Yatra", hi: "कैलाश मानसरोवर यात्रा" }, symbol: 'ॐ', terrain: 'mountain',
        intro: { en: "Mount Kailash and Lake Mansarovar in Tibet, sacred to Hindus, Buddhists, Jains and Bon followers. Indian pilgrims travel through the government-organised yatra, not by independent booking.", hi: "तिब्बत में कैलाश पर्वत और मानसरोवर झील, हिंदू, बौद्ध, जैन और बोन परंपरा के अनुयायियों के लिए पवित्र। भारतीय तीर्थयात्री सरकार द्वारा आयोजित यात्रा से जाते हैं, स्वतंत्र बुकिंग से नहीं।" },
        places: [place("Mount Kailash, Tibet", "कैलाश पर्वत, तिब्बत", 'shiva'), place("Lake Mansarovar, Tibet", "मानसरोवर झील, तिब्बत", 'shiva')],
        preparation: { en: "Start only from the Ministry of External Affairs yatra website for eligibility, application and medical requirements. The yatra uses official routes through Uttarakhand and Sikkim; do not pay anyone who promises a private seat.", hi: "पात्रता, आवेदन और चिकित्सा शर्तों के लिए केवल विदेश मंत्रालय की यात्रा वेबसाइट से शुरुआत करें। यात्रा उत्तराखंड और सिक्किम के आधिकारिक मार्गों से होती है; निजी सीट का वादा करने वाले किसी को भुगतान न करें।" },
        dates: { en: "Whether the yatra runs in a given year, its batches and its application window are announced by the Ministry. This page confirms no season or date.", hi: "किसी वर्ष यात्रा होगी या नहीं, उसके दल और आवेदन अवधि विदेश मंत्रालय घोषित करता है। यह पेज किसी मौसम या तिथि की पुष्टि नहीं करता।" },
        sources: [["Kailash Mansarovar Yatra (MEA)", 'https://kmy.gov.in/'], ["Ministry of External Affairs", 'https://www.mea.gov.in/'], ["Kumaon Mandal Vikas Nigam", 'https://kmvn.gov.in/']]
      }
    ]
  };
})(window);
