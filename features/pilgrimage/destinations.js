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
      }
    ]
  };
})(window);
