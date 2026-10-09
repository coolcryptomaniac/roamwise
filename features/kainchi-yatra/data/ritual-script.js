/* Traditional public-domain prayer text; RoamWise-authored symbolic guidance, not a temple vidhi. */
(function (root) {
  'use strict';
  var core = root.RWKainchiCore;
  core.hanumanAarti = [
    'आरती कीजै हनुमान लला की। दुष्ट दलन रघुनाथ कला की॥',
    'जाके बल से गिरिवर कांपे। रोग दोष जाके निकट न झांके॥',
    'अंजनि पुत्र महा बलदाई। सन्तन के प्रभु सदा सहाई॥',
    'दे बीरा रघुनाथ पठाए। लंका जारि सिया सुधि लाए॥',
    'लंका सो कोट समुद्र-सी खाई। जात पवनसुत बार न लाई॥',
    'लंका जारि असुर संहारे। सियारामजी के काज सवारे॥',
    'लक्ष्मण मूर्छित पड़े सकारे। आनि संजीवन प्राण उबारे॥',
    'पैठि पाताल तोरि जम-कारे। अहिरावण की भुजा उखारे॥',
    'बाएं भुजा असुरदल मारे। दाहिने भुजा संतजन तारे॥',
    'सुर नर मुनि आरती उतारें। जय जय जय हनुमान उचारें॥',
    'कंचन थार कपूर लौ छाई। आरती करत अंजना माई॥',
    'जो हनुमानजी की आरती गावे। बसि बैकुण्ठ परम पद पावे॥'
  ];
  Object.assign(core.strings.en, {
    ritual_h: 'Panditji · digital devotional guide', ritual_badge: 'AI-created artwork · scripted guidance',
    ritual_note: 'A symbolic RoamWise session, not a live priest or the Kainchi Trust’s puja. No physical offering, prasad or guaranteed blessing is provided. The portrait has gentle animation, not video lip-sync.',
    ritual_voice_note: 'Voice is optional and uses only voices marked local by your browser. Pronunciation varies; no voice cloning or uploaded recording. Names stay in page memory; device-voice privacy depends on your browser/OS.',
    ritual_play: 'Begin / restart', ritual_pause: 'Pause', ritual_resume: 'Resume', ritual_stop: 'Stop', ritual_next: 'Next step', ritual_voice: 'Read aloud',
    ritual_no_voice: 'No local voice for this language. Text-only mode is available; add a local Hindi voice in device settings.',
    ritual_voice_failed: 'Speech unavailable. Continue with the text and Next step.', ritual_stopped: 'Session stopped.', ritual_complete: 'Session complete · carry kindness and seva with you.',
    ritual_progress: 'Step {n} / {total} · {title}', ritual_current: 'Current reading', ritual_script: 'Show the complete session script', ritual_source: 'Traditional Hanuman aarti text source ↗',
    ritual_welcome: 'Welcome', ritual_welcome_text: 'Welcome. Sit comfortably. Breathe gently. This is a digital moment of devotion, remembrance and kindness.',
    ritual_sankalp: 'Sankalp · intention', ritual_sankalp_text: 'Hold an intention of peace and compassion for yourself, your family and all visitors.',
    ritual_custom_text: 'Remembering {name}. With love for {people}. {intention}', ritual_everyone: 'all beings',
    ritual_invocation: 'Invocation', ritual_flowers: 'Pushpanjali · digital flowers', ritual_flowers_text: 'Imagine offering flowers with humility. Let this moment become care for others.',
    ritual_dhoop: 'Dhoop & agarbatti', ritual_dhoop_text: 'The digital incense rises gently. Take a quiet breath and bring your attention back to kindness.',
    ritual_diya: 'Deep · digital flame', ritual_diya_text: 'The digital lamp is lit. Let its light remind you of patience, understanding and service.',
    ritual_mantra: 'Chosen mantra', ritual_aarti: 'Hanuman aarti', ritual_prasad: 'Naivedya & symbolic prasad', ritual_prasad_text: 'Receive this symbolic prasad moment with gratitude. No food is delivered. When possible, share real food or help with someone who needs it.',
    ritual_shanti: 'Shanti · peace', ritual_blessing: 'Closing good wishes', ritual_blessing_text: 'May you and those you remember find peace, courage and wisdom. These are good wishes, not a promise of an outcome.',
    ritual_plate: 'Symbolic prasad · gratitude & seva',
    pooja_intro: 'Dedicate a symbolic digital session to yourself and your well-wishers. Follow the complete configured script, including Hanuman aarti, your chosen mantra and closing good wishes. Names stay in page memory; optional local-voice details appear below.',
    pooja_ready: 'Your private session is ready. Use the player below; voice is optional.',
    mantra_sarve: 'सर्वे भवन्तु सुखिनः। सर्वे सन्तु निरामयाः। सर्वे भद्राणि पश्यन्तु। मा कश्चिद्दुःखभाग्भवेत्॥',
    mantra_gayatri: 'ॐ भूर्भुवः स्वः। तत्सवितुर्वरेण्यं। भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥'
  });
  Object.assign(core.strings.hi, {
    ritual_h: 'पंडित जी · डिजिटल भक्ति मार्गदर्शक', ritual_badge: 'AI-निर्मित चित्र · तैयार पाठ',
    ritual_note: 'रोमवाइज़ का प्रतीकात्मक अनुभव, जीवित पुजारी या कैंची ट्रस्ट की पूजा नहीं। भौतिक चढ़ावा, प्रसाद या सुनिश्चित आशीर्वाद नहीं मिलता। चित्र में हल्की गति है, वीडियो लिप-सिंक नहीं।',
    ritual_voice_note: 'आवाज़ वैकल्पिक है; केवल ब्राउज़र द्वारा स्थानीय बताई गई आवाज़ चुनी जाती है। उच्चारण बदल सकता है। किसी की आवाज़ की नकल या रिकॉर्डिंग अपलोड नहीं होती। नाम पेज की मेमोरी में रहते हैं; स्थानीय आवाज़ की गोपनीयता ब्राउज़र/OS पर निर्भर है।',
    ritual_play: 'शुरू / फिर से शुरू', ritual_pause: 'रोककर रखें', ritual_resume: 'आगे चलाएँ', ritual_stop: 'समाप्त करें', ritual_next: 'अगला चरण', ritual_voice: 'पाठ सुनाएँ',
    ritual_no_voice: 'इस भाषा की स्थानीय आवाज़ उपलब्ध नहीं। पाठ पढ़ सकते हैं; डिवाइस सेटिंग में स्थानीय हिंदी आवाज़ जोड़ें।',
    ritual_voice_failed: 'आवाज़ उपलब्ध नहीं। पाठ पढ़ें और अगला चरण चुनें।', ritual_stopped: 'क्रम रोक दिया गया।', ritual_complete: 'क्रम पूरा हुआ · करुणा और सेवा साथ लेकर जाएँ।',
    ritual_progress: 'चरण {n} / {total} · {title}', ritual_current: 'वर्तमान पाठ', ritual_script: 'पूरे क्रम का पाठ देखें', ritual_source: 'पारंपरिक हनुमान आरती का पाठ स्रोत ↗',
    ritual_welcome: 'स्वागत', ritual_welcome_text: 'स्वागत है। सहज बैठें और धीरे साँस लें। यह भक्ति, स्मरण और करुणा का डिजिटल क्षण है।',
    ritual_sankalp: 'संकल्प', ritual_sankalp_text: 'अपने लिए, परिवार के लिए और सभी यात्रियों के लिए शांति और करुणा का भाव रखें।',
    ritual_custom_text: '{name} का स्मरण। {people} के लिए प्रेम सहित। {intention}', ritual_everyone: 'सभी प्राणियों',
    ritual_invocation: 'स्मरण', ritual_flowers: 'पुष्पांजलि · डिजिटल फूल', ritual_flowers_text: 'विनम्रता से फूल अर्पित करने की कल्पना करें। यह भाव दूसरों के प्रति करुणा बने।',
    ritual_dhoop: 'धूप और अगरबत्ती', ritual_dhoop_text: 'डिजिटल धूप धीरे उठ रही है। शांत साँस लें और ध्यान करुणा पर लाएँ।',
    ritual_diya: 'डिजिटल दीप', ritual_diya_text: 'डिजिटल दीप जल गया है। यह प्रकाश धैर्य, समझ और सेवा का स्मरण कराए।',
    ritual_mantra: 'चुना हुआ मंत्र', ritual_aarti: 'हनुमान आरती', ritual_prasad: 'नैवेद्य व प्रतीकात्मक प्रसाद', ritual_prasad_text: 'कृतज्ञता के साथ इस प्रतीकात्मक प्रसाद क्षण को ग्रहण करें। भोजन नहीं भेजा जाता। संभव हो तो ज़रूरतमंद के साथ वास्तविक भोजन या सहायता साझा करें।',
    ritual_shanti: 'शांति', ritual_blessing: 'समापन शुभकामना', ritual_blessing_text: 'आप और जिनका आपने स्मरण किया, वे शांति, साहस और विवेक पाएँ। ये शुभकामनाएँ हैं, परिणाम का वादा नहीं।',
    ritual_plate: 'प्रतीकात्मक प्रसाद · कृतज्ञता और सेवा',
    pooja_intro: 'अपने और शुभचिंतकों के लिए प्रतीकात्मक डिजिटल क्रम बनाएँ। हनुमान आरती, चुने मंत्र और समापन शुभकामनाओं का पूरा तैयार पाठ साथ पढ़ें। नाम पेज की मेमोरी में रहते हैं; वैकल्पिक स्थानीय आवाज़ की जानकारी नीचे है।',
    pooja_ready: 'आपका निजी क्रम तैयार है। नीचे प्लेयर का उपयोग करें; आवाज़ वैकल्पिक है।',
    mantra_sarve: 'सर्वे भवन्तु सुखिनः। सर्वे सन्तु निरामयाः। सर्वे भद्राणि पश्यन्तु। मा कश्चिद्दुःखभाग्भवेत्॥',
    mantra_gayatri: 'ॐ भूर्भुवः स्वः। तत्सवितुर्वरेण्यं। भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥'
  });
  core.ritualScript = function (lang, options) {
    var o = options || {}, t = function (key, vars) { return core.t(lang, key, vars); }, result = [];
    function step(id, text, sanskrit) { result.push({ id: id, title: t('ritual_' + id), text: text || t('ritual_' + id + '_text'), lang: sanskrit ? 'hi-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN' }); }
    step('welcome');
    step('sankalp', o.name ? t('ritual_custom_text', { name: o.name, people: o.wellwishers || t('ritual_everyone'), intention: t('pooja_intention_' + o.intent) }) : null);
    step('invocation', 'ॐ श्री गणेशाय नमः। ॐ हनुमते नमः। श्री राम जय राम जय जय राम।', true);
    step('flowers'); step('dhoop'); step('diya');
    step('mantra', t('mantra_' + (o.mantra || 'hanuman')), true);
    core.hanumanAarti.forEach(function (verse) { step('aarti', verse, true); });
    step('aarti', core.hanumanAarti[0], true);
    step('prasad'); step('shanti', t('mantra_sarve') + ' ॐ शान्तिः शान्तिः शान्तिः।', true); step('blessing');
    return result;
  };
})(globalThis);
