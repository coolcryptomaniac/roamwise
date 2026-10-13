/* Bounded, curated programmes. Commentary is authored, never generated as scripture. */
(function (root) {
  'use strict';
  var api = root.RWBhakti, core = root.RWKainchiCore, base = core.ritualScript;
  var mantras = { hanuman: 'ॐ हनुमते नमः।', rama: 'श्री राम जय राम जय जय राम।', shiva: 'ॐ नमः शिवाय।' };
  // Traditional public-domain Om Jai Shiv Omkara; no modern recording/translation used.
  var shivaAarti = [
    'ॐ जय शिव ओंकारा, स्वामी जय शिव ओंकारा। ब्रह्मा, विष्णु, सदाशिव, अर्द्धांगी धारा॥',
    'एकानन चतुरानन पञ्चानन राजे। हंसासन गरुड़ासन वृषवाहन साजे॥',
    'दो भुज चार चतुर्भुज दस भुज अति सोहे। त्रिगुण रूप निरखते त्रिभुवन जन मोहे॥',
    'अक्षमाला वनमाला मुण्डमाला धारी। त्रिपुरारी कंसारी कर माला धारी॥',
    'श्वेताम्बर पीताम्बर बाघम्बर अंगे। सनकादिक गरुणादिक भूतादिक संगे॥',
    'कर के मध्य कमण्डलु चक्र त्रिशूलधारी। सुखकारी दुखहारी जगपालन कारी॥',
    'ब्रह्मा विष्णु सदाशिव जानत अविवेका। प्रणवाक्षर मध्ये ये तीनों एका॥',
    'लक्ष्मी व सावित्री पार्वती संगा। पार्वती अर्द्धांगी, शिवलहरी गंगा॥',
    'पर्वत सोहैं पार्वती, शंकर कैलासा। भांग धतूर का भोजन, भस्मी में वासा॥',
    'जटा में गंगा बहत है, गल मुण्डन माला। शेष नाग लिपटावत, ओढ़त मृगछाला॥',
    'काशी में विराजे विश्वनाथ, नन्दी ब्रह्मचारी। नित उठ दर्शन पावत, महिमा अति भारी॥',
    'त्रिगुणस्वामी जी की आरती जो कोई नर गावे। कहत शिवानन्द स्वामी, मनवान्छित फल पावे॥'
  ];
  var chapters = [
    ['Strength in service', 'सेवा में शक्ति', 'Hanuman is remembered for strength placed in the service of Rama. The Chalisa begins with knowledge and virtue. For us, strength can mean listening patiently, helping without praise and keeping a promise.', 'हनुमान जी का स्मरण राम की सेवा में लगी शक्ति के लिए होता है। चालीसा ज्ञान और गुणों से आरंभ होती है। हमारे लिए शक्ति का अर्थ धैर्य से सुनना, प्रशंसा की चाह बिना सहायता करना और वचन निभाना भी हो सकता है।'],
    ['Courage with humility', 'विनम्रता के साथ साहस', 'The traditional story of the journey to Lanka joins courage with devotion. This reflection invites us to act carefully when another person needs help, rather than treating bravery as a display.', 'लंका की यात्रा की पारंपरिक कथा साहस को भक्ति से जोड़ती है। यह चिंतन किसी को सहायता चाहिए तब सावधानी से आगे बढ़ने की प्रेरणा है, साहस का प्रदर्शन करने की नहीं।'],
    ['Remembrance at Kainchi', 'कैंची का स्मरण', 'The Trust history records Maharaj Ji returning to Kainchi in 1962 and the development of its temples. Across the river was a place associated with earlier saints. Remember this as source-linked history, alongside the personal faith visitors bring.', 'ट्रस्ट का इतिहास 1962 में महाराज जी के कैंची लौटने और मंदिरों के विकास का उल्लेख करता है। नदी पार का स्थान पहले के संतों से जुड़ा था। इसे स्रोत-सहित इतिहास के रूप में और यात्रियों की व्यक्तिगत श्रद्धा के साथ याद करें।'],
    ['Care that continues', 'जारी रहने वाली देखभाल', 'The Trust describes Siddhi Maa guiding the ashram after Maharaj Ji. Devotion also lives in the work of caring for a place, welcoming visitors and preserving a quiet space for prayer.', 'ट्रस्ट महाराज जी के बाद सिद्धि माँ द्वारा आश्रम के मार्गदर्शन का वर्णन करता है। किसी स्थान की देखभाल, यात्रियों का स्वागत और प्रार्थना का शांत वातावरण बचाना भी भक्ति का भाव हो सकता है।'],
    ['Food and gratitude', 'भोजन और कृतज्ञता', 'A digital prasad moment is a reminder of gratitude. If you wish to express it beyond the screen, share food responsibly or assist someone in need. There is no purchase required to practise kindness.', 'डिजिटल प्रसाद का क्षण कृतज्ञता का स्मरण है। इसे स्क्रीन के बाहर व्यक्त करना चाहें तो जिम्मेदारी से भोजन साझा करें या किसी जरूरतमंद की सहायता करें। करुणा के लिए कोई खरीद आवश्यक नहीं।'],
    ['A pilgrim and a neighbour', 'यात्री और पड़ोसी', 'A sacred journey passes through other people’s homes and daily lives. A quieter phone, a patient queue, clear emergency access and taking our litter away can be small acts of seva.', 'पवित्र यात्रा अन्य लोगों के घरों और दैनिक जीवन से होकर गुजरती है। धीमे फोन, धैर्य की कतार, आपात रास्ता साफ रखने और अपना कचरा ले जाने में भी सेवा का भाव हो सकता है।'],
    ['One breath of attention', 'ध्यान की एक साँस', 'Pause without forcing your breath. Remember the people you named. Let the prayer be an invitation to compassion, not a bargain for a promised result.', 'बिना जोर दिए सहज साँस का विराम लें। जिनके नाम याद किए, उनका स्मरण करें। प्रार्थना करुणा की प्रेरणा बने, किसी परिणाम का सौदा नहीं।'],
    ['Take the light with you', 'प्रकाश साथ ले जाएँ', 'Choose one helpful action for the day: call someone with care, offer practical help or leave a place cleaner. Let a small action give shape to your intention.', 'आज के लिए सहायता का एक काम चुनें: किसी का हाल पूछें, उपयोगी मदद दें या किसी जगह को स्वच्छ छोड़ें। एक छोटा कार्य आपके संकल्प को रूप दे सकता है।']
  ];
  api.script = function (lang, options) {
    var o = options || {}, product = api.product(o.productId) || api.products[1], standard = base(lang, o), steps = standard.slice(0, 6);
    var t = function (key, vars) { return core.t(lang, key, vars); };
    function add(id, text, title, spokenLang) { steps.push({ id: id, title: title || t('ritual_' + id), text: text, lang: spokenLang || (lang === 'hi' ? 'hi-IN' : 'en-IN') }); }
    function japa(id, count, text) { for (var i = 1; i <= count; i += 1) add(id, text, t('studio_japa', { n: i, total: count }), 'hi-IN'); }
    var count = [27, 54, 108].indexOf(Number(o.count)) >= 0 ? Number(o.count) : 27, mantra = mantras[o.mantra] || mantras.hanuman;
    if (product.programme === 'parthiv') {
      add('parthiv', t('studio_parthiv')); add('water', t('studio_water')); add('bilva', t('studio_bilva'));
      japa('mantra', 108, mantras.shiva);
      shivaAarti.forEach(function (verse) { add('aarti', verse + ' ॐ जय शिव ओंकारा॥', 'Shiva aarti · शिव आरती', 'hi-IN'); });
      add('aarti', 'कर्पूरगौरं करुणावतारं संसारसारं भुजगेन्द्रहारम्। सदा वसन्तं हृदयारविन्दे भवं भवानीसहितं नमामि॥', null, 'hi-IN');
      add('farewell', t('studio_farewell'));
    } else if (product.programme === 'yajna') {
      japa('yajna', 108, 'ॐ अग्नये स्वाहा। इदं अग्नये इदं न मम।');
      add('purnahuti', t('studio_purnahuti'));
    } else if (product.programme === 'mantra') japa('mantra', count, mantra);
    else add('mantra', mantra, null, 'hi-IN');
    if (product.programme === 'katha') chapters.forEach(function (c, i) {
      add('katha', c[lang === 'hi' ? 3 : 2], t('studio_katha_title', { n: i + 1, title: c[lang === 'hi' ? 1 : 0] }));
    });
    if (product.programme === 'paath' || product.programme === 'katha') api.chalisa.forEach(function (verse) { add('chalisa', verse, null, 'hi-IN'); });
    if (product.programme !== 'mantra' && product.programme !== 'parthiv') core.hanumanAarti.forEach(function (verse) { add('aarti', verse, null, 'hi-IN'); });
    steps.push.apply(steps, standard.slice(-3)); return steps;
  };
})(globalThis);
