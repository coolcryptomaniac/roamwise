/* RoamWise digital products. Prices are one-time INR, not temple offerings. */
(function (root) {
  'use strict';
  var api = root.RWBhakti = root.RWBhakti || {};
  api.products = [
    { id: 'bhakti_mantra', level: 1, price: 10, programme: 'mantra', symbol: 'ॐ', en: 'Mantra & sankalp', hi: 'मंत्र और संकल्प', bodyEn: '27, 54 or 108 counted repetitions, your intention, digital diya and a quiet closing.', bodyHi: '27, 54 या 108 मंत्र-जप, आपका संकल्प, डिजिटल दीप और शांत समापन।' },
    { id: 'bhakti_aarti', level: 2, price: 30, programme: 'aarti', symbol: '✦', en: 'Complete Hanuman aarti', hi: 'संपूर्ण हनुमान आरती', bodyEn: 'Every configured aarti verse, moving lamp, flowers, incense and symbolic prasad. Mantra programme included.', bodyHi: 'आरती का पूरा तैयार पाठ, घूमता दीप, फूल, धूप और प्रतीकात्मक प्रसाद। मंत्र क्रम भी शामिल।' },
    { id: 'bhakti_paath', level: 3, price: 60, programme: 'paath', symbol: '॥', en: 'Hanuman Chalisa paath', hi: 'हनुमान चालीसा पाठ', bodyEn: 'Opening dohas, all 40 chaupais and closing doha, followed by aarti. All lower programmes included.', bodyHi: 'आरंभ के दोहे, सभी 40 चौपाइयाँ और समापन दोहा, फिर आरती। नीचे के सभी क्रम भी शामिल।' },
    { id: 'bhakti_katha', level: 4, price: 100, programme: 'katha', symbol: '❀', en: 'Katha · devotion & seva', hi: 'कथा · भक्ति और सेवा', bodyEn: 'Eight original narrated chapters on Hanuman, Kainchi remembrance and everyday seva, reflection pauses and paath.', bodyHi: 'हनुमान, कैंची स्मरण और दैनिक सेवा पर आठ मौलिक कथा-खंड, चिंतन के विराम और चालीसा पाठ।' },
    { id: 'bhakti_yajna', level: 5, price: 200, programme: 'yajna', symbol: '♨', en: 'Digital yajna journey', hi: 'डिजिटल यज्ञ यात्रा', bodyEn: 'A full configured digital sequence: sankalp, invocation, 108 symbolic offerings, purnahuti, peace prayer and aarti. All lower programmes included.', bodyHi: 'पूरा तैयार डिजिटल क्रम: संकल्प, स्मरण, 108 प्रतीकात्मक आहुतियाँ, पूर्णाहुति, शांति-पाठ और आरती। नीचे के सभी क्रम शामिल।' },
    { id: 'bhakti_parthiv', level: 6, price: 300, programme: 'parthiv', symbol: 'शिव', en: 'Parthiv Shiva · complete studio', hi: 'पार्थिव शिव · संपूर्ण स्टूडियो', bodyEn: 'Guided digital Shiva remembrance, symbolic clay lingam, water, bilva, flowers, 108 nama-japa, aarti and farewell. Every programme included.', bodyHi: 'डिजिटल शिव-स्मरण, प्रतीकात्मक मिट्टी-लिंग, जल, बिल्व, फूल, 108 नाम-जप, आरती और समापन। सभी क्रम शामिल।' }
  ];
  api.product = function (id) { return api.products.find(function (p) { return p.id === id; }) || null; };
})(globalThis);
