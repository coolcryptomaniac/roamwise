/* ============================================================================
   AILON TUSK — extended knowledge base
   ----------------------------------------------------------------------------
   Loaded by index.html BEFORE app.js. Kept in its own file so it can grow
   without bloating app.js, and so a human can review data changes in a diff.

   Two tables here:
     RW_COUNTRY_ROUTES_EXT  — country-wide circuits, same schema as the six
                              built into app.js. Merged in at load.
     RW_FOOD_EXT            — signature-food entries, same schema as RW_FOOD.
                              Merged in at load.

   Aliases (rwCountryAlias) map the many ways people name a country
   ("nz", "new zealand", "kiwiland") onto a single key.
   ========================================================================== */

/* ---- COUNTRY ALIASES: every spelling/nickname -> canonical key ---- */
var RW_COUNTRY_ALIAS = {
  'nz':'newzealand','new zealand':'newzealand','newzealand':'newzealand','kiwiland':'newzealand','aotearoa':'newzealand',
  'oz':'australia','australia':'australia','aussie':'australia','straya':'australia',
  'usa':'usa','us':'usa','america':'usa','united states':'usa','the states':'usa',
  'uk':'uk','britain':'uk','england':'uk','great britain':'uk','united kingdom':'uk','scotland':'uk',
  'uae':'uae','emirates':'uae','dubai emirates':'uae',
  'sri lanka':'srilanka','srilanka':'srilanka','ceylon':'srilanka',
  'south africa':'southafrica','southafrica':'southafrica','rsa':'southafrica',
  'france':'france','francia':'france',
  'spain':'spain','espana':'spain','espaa':'spain',
  'germany':'germany','deutschland':'germany',
  'greece':'greece','hellas':'greece',
  'turkey':'turkey','turkiye':'turkey','trkiye':'turkey',
  'egypt':'egypt','misr':'egypt',
  'indonesia':'indonesia','bali island':'indonesia',
  'malaysia':'malaysia','msia':'malaysia',
  'singapore':'singapore','sgp':'singapore','sg':'singapore',
  'philippines':'philippines','pinas':'philippines','pilipinas':'philippines',
  'cambodia':'cambodia','kampuchea':'cambodia',
  'south korea':'korea','korea':'korea','skorea':'korea','rok':'korea',
  'china':'china','prc':'china',
  'bhutan':'bhutan','druk yul':'bhutan',
  'switzerland':'switzerland','swiss':'switzerland','schweiz':'switzerland',
  'portugal':'portugal',
  'morocco':'morocco','maroc':'morocco',
  'mexico':'mexico','mexico city':'mexico',
  'peru':'peru',
  'brazil':'brazil','brasil':'brazil',
  'iceland':'iceland',
  'ireland':'ireland','eire':'ireland',
  'netherlands':'netherlands','holland':'netherlands',
  'austria':'austria','osterreich':'austria',
  'georgia':'georgia','sakartvelo':'georgia',
  'kenya':'kenya','tanzania':'tanzania',
  'jordan':'jordan','laos':'laos','myanmar':'myanmar','burma':'myanmar',
  'maldives':'maldives'
};

var RW_COUNTRY_ROUTES_EXT = {
  newzealand:{label:'New Zealand', cc:'NZ', circuits:[
    {name:'South Island highlights', minDays:8, stops:['Christchurch','Lake Tekapo','Queenstown','Milford Sound'],
     why:'The dramatic half \u2014 alps, glacial lakes and fiords. Self-drive; distances are long but empty and gorgeous.'},
    {name:'North Island loop', minDays:7, stops:['Auckland','Rotorua','Taupo','Wellington'],
     why:'Geothermal steam, Maori culture and the capital. Easier driving than the South.'},
    {name:'Both islands', minDays:14, stops:['Auckland','Rotorua','Wellington','Queenstown','Milford Sound'],
     why:'The full country with the Interislander ferry in the middle \u2014 book the ferry ahead in summer.'},
    {name:'Adventure south', minDays:10, stops:['Queenstown','Wanaka','Franz Josef','Christchurch'],
     why:'Bungy, glaciers and hikes. Queenstown is the adrenaline capital of the planet, no exaggeration.'}
  ]},
  australia:{label:'Australia', cc:'AU', circuits:[
    {name:'East coast classic', minDays:12, stops:['Sydney','Byron Bay','Brisbane','Cairns'],
     why:'Beaches all the way up to the Great Barrier Reef. Internal flights save days \u2014 the coast is enormous.'},
    {name:'Sydney + Melbourne', minDays:7, stops:['Sydney','Melbourne','Great Ocean Road'],
     why:'The two big cities plus the coast drive to the Twelve Apostles. Fly between them, don\u2019t drive.'},
    {name:'Red Centre + reef', minDays:10, stops:['Uluru','Alice Springs','Cairns'],
     why:'The desert heart and the reef. Uluru at sunrise earns every early alarm.'}
  ]},
  usa:{label:'USA', cc:'US', circuits:[
    {name:'West Coast', minDays:10, stops:['San Francisco','Yosemite','Las Vegas','Los Angeles'],
     why:'City, national park, desert neon and Hollywood. A road trip built for a rented convertible.'},
    {name:'East Coast cities', minDays:8, stops:['New York','Washington DC','Boston'],
     why:'Museums, monuments and history \u2014 all linked by fast Amtrak trains.'},
    {name:'Southwest parks', minDays:9, stops:['Las Vegas','Grand Canyon','Zion','Bryce Canyon'],
     why:'The greatest run of canyons on earth. Long drives, unreal scenery.'},
    {name:'Florida sun', minDays:7, stops:['Miami','Orlando','Key West'],
     why:'Beaches, theme parks and the drive out to the Keys.'}
  ]},
  uk:{label:'United Kingdom', cc:'GB', circuits:[
    {name:'England core', minDays:6, stops:['London','Oxford','Bath','Stonehenge'],
     why:'The capital plus honey-stone towns and the ancient stones. All close together.'},
    {name:'England + Scotland', minDays:10, stops:['London','York','Edinburgh','Scottish Highlands'],
     why:'South to north by train, ending in castles and lochs. The East Coast rail line is scenic in itself.'}
  ]},
  uae:{label:'UAE', cc:'AE', circuits:[
    {name:'Dubai + Abu Dhabi', minDays:5, stops:['Dubai','Abu Dhabi','Desert safari'],
     why:'Skyline, the Grand Mosque and a night in the dunes. Everything is 90 minutes apart on great roads.'}
  ]},
  srilanka:{label:'Sri Lanka', cc:'LK', circuits:[
    {name:'Cultural + hills', minDays:8, stops:['Kandy','Sigiriya','Ella','Nuwara Eliya'],
     why:'Ancient rock fortress, tea country and the famous train through the hills. Take that train \u2014 hang by the door (carefully).'},
    {name:'South coast', minDays:6, stops:['Colombo','Galle','Mirissa','Yala'],
     why:'Dutch fort, whale watching and a safari for leopards.'}
  ]},
  southafrica:{label:'South Africa', cc:'ZA', circuits:[
    {name:'Cape + Garden Route', minDays:9, stops:['Cape Town','Stellenbosch','Knysna','Addo'],
     why:'Table Mountain, wine lands, coast drive and an elephant park. One of the great self-drives.'},
    {name:'Safari + city', minDays:7, stops:['Johannesburg','Kruger','Cape Town'],
     why:'Big Five in Kruger then fly to Cape Town. Fly the long legs \u2014 the country is huge.'}
  ]},
  france:{label:'France', cc:'FR', circuits:[
    {name:'Paris + south', minDays:8, stops:['Paris','Lyon','Nice','Provence'],
     why:'Capital, food capital, then Riviera and lavender. The TGV makes it effortless.'},
    {name:'Paris + Loire', minDays:6, stops:['Paris','Versailles','Loire Valley'],
     why:'The city plus palaces and chateaux. Short hops, big grandeur.'}
  ]},
  spain:{label:'Spain', cc:'ES', circuits:[
    {name:'Classic Spain', minDays:9, stops:['Madrid','Toledo','Seville','Granada'],
     why:'Prado, Moorish palaces and flamenco heartland. High-speed AVE trains between them.'},
    {name:'Barcelona + coast', minDays:6, stops:['Barcelona','Valencia','Costa Brava'],
     why:'Gaudi, paella\u2019s birthplace and Med beaches.'}
  ]},
  germany:{label:'Germany', cc:'DE', circuits:[
    {name:'Best of Germany', minDays:8, stops:['Berlin','Munich','Neuschwanstein','Black Forest'],
     why:'History, beer halls, the fairytale castle and forest drives.'}
  ]},
  greece:{label:'Greece', cc:'GR', circuits:[
    {name:'Athens + islands', minDays:8, stops:['Athens','Santorini','Naxos','Mykonos'],
     why:'The Acropolis then ferry-hopping the Cyclades. Book ferries ahead in July\u2013August.'}
  ]},
  turkey:{label:'Turkey', cc:'TR', circuits:[
    {name:'Istanbul + Cappadocia', minDays:8, stops:['Istanbul','Cappadocia','Pamukkale','Ephesus'],
     why:'Two continents, balloon-filled skies, white travertines and Roman ruins.'}
  ]},
  egypt:{label:'Egypt', cc:'EG', circuits:[
    {name:'Nile classic', minDays:9, stops:['Cairo','Luxor','Aswan','Abu Simbel'],
     why:'Pyramids, then a Nile cruise past the great temples. The cruise is the smart way to do the south.'}
  ]},
  indonesia:{label:'Indonesia', cc:'ID', circuits:[
    {name:'Bali + islands', minDays:8, stops:['Ubud','Canggu','Nusa Penida','Gili Islands'],
     why:'Rice terraces, surf towns and island-hop snorkelling. Slower than it looks \u2014 traffic in the south is real.'},
    {name:'Java + Bali', minDays:11, stops:['Yogyakarta','Mount Bromo','Ijen','Ubud'],
     why:'Borobudur, volcanoes and blue fire before you even reach Bali.'}
  ]},
  malaysia:{label:'Malaysia', cc:'MY', circuits:[
    {name:'Peninsula highlights', minDays:8, stops:['Kuala Lumpur','Cameron Highlands','Penang','Langkawi'],
     why:'City towers, tea hills, the food capital of Asia (Penang) and an island finish.'}
  ]},
  singapore:{label:'Singapore', cc:'SG', circuits:[
    {name:'City-state in full', minDays:4, stops:['Marina Bay','Sentosa','Gardens by the Bay','Chinatown'],
     why:'A whole country in a few days \u2014 tightly packed, spotless, and a hawker-centre meal every night.'}
  ]},
  philippines:{label:'Philippines', cc:'PH', circuits:[
    {name:'Island beauty', minDays:10, stops:['Manila','Palawan','El Nido','Cebu'],
     why:'Lagoons, limestone and some of the clearest water on earth. Island flights save the whole trip.'}
  ]},
  cambodia:{label:'Cambodia', cc:'KH', circuits:[
    {name:'Temples + capital', minDays:6, stops:['Siem Reap','Angkor Wat','Phnom Penh'],
     why:'Sunrise at Angkor is the whole reason \u2014 give the temples two full days.'}
  ]},
  korea:{label:'South Korea', cc:'KR', circuits:[
    {name:'Seoul + Busan', minDays:8, stops:['Seoul','Gyeongju','Busan','Jeju'],
     why:'Palaces and neon, ancient capital, beach city and a volcanic island. KTX bullet trains link the mainland.'}
  ]},
  china:{label:'China', cc:'CN', circuits:[
    {name:'Golden route', minDays:11, stops:['Beijing','Xi\u2019an','Shanghai','Guilin'],
     why:'Great Wall, Terracotta Army, the skyline and the karst rivers. High-speed rail is superb.'}
  ]},
  bhutan:{label:'Bhutan', cc:'BT', circuits:[
    {name:'Western valleys', minDays:7, stops:['Paro','Thimphu','Punakha','Tiger\u2019s Nest'],
     why:'The daily fee covers guide, hotel and transport \u2014 you can\u2019t freelance this one, and that\u2019s the point.'}
  ]},
  switzerland:{label:'Switzerland', cc:'CH', circuits:[
    {name:'Alpine classic', minDays:7, stops:['Zurich','Lucerne','Interlaken','Zermatt'],
     why:'Lakes and the Matterhorn. A Swiss Travel Pass turns the scenic trains into the attraction.'}
  ]},
  portugal:{label:'Portugal', cc:'PT', circuits:[
    {name:'Lisbon + Porto', minDays:7, stops:['Lisbon','Sintra','Porto','Douro Valley'],
     why:'Trams and tiles, fairytale palaces, port wine and the terraced river valley.'}
  ]},
  morocco:{label:'Morocco', cc:'MA', circuits:[
    {name:'Imperial + desert', minDays:9, stops:['Marrakech','Fes','Sahara','Chefchaouen'],
     why:'Souks, the oldest medina, a night in the dunes and the blue town. A desert night is non-negotiable.'}
  ]},
  mexico:{label:'Mexico', cc:'MX', circuits:[
    {name:'Yucatan + city', minDays:9, stops:['Mexico City','Oaxaca','Cancun','Tulum'],
     why:'World-class food, Mayan ruins and Caribbean cenotes.'}
  ]},
  peru:{label:'Peru', cc:'PE', circuits:[
    {name:'Inca trail region', minDays:9, stops:['Lima','Cusco','Sacred Valley','Machu Picchu'],
     why:'Acclimatise in Cusco before Machu Picchu \u2014 the altitude is not a suggestion. Book Machu Picchu permits early.'}
  ]},
  brazil:{label:'Brazil', cc:'BR', circuits:[
    {name:'Rio + falls', minDays:8, stops:['Rio de Janeiro','Iguazu Falls','Sao Paulo'],
     why:'Beaches and Christ the Redeemer, then the thundering falls. Fly the long legs.'}
  ]},
  iceland:{label:'Iceland', cc:'IS', circuits:[
    {name:'Ring Road highlights', minDays:8, stops:['Reykjavik','Golden Circle','South Coast','Jokulsarlon'],
     why:'Waterfalls, geysers, black beaches and an iceberg lagoon. Rent a 4x4 and chase the aurora in winter.'}
  ]},
  ireland:{label:'Ireland', cc:'IE', circuits:[
    {name:'Ring of the isle', minDays:7, stops:['Dublin','Galway','Cliffs of Moher','Killarney'],
     why:'Pubs, the wild west coast and those cliffs. The Wild Atlantic Way is the drive.'}
  ]},
  netherlands:{label:'Netherlands', cc:'NL', circuits:[
    {name:'Holland highlights', minDays:5, stops:['Amsterdam','Zaanse Schans','Rotterdam','Keukenhof'],
     why:'Canals, windmills, bold architecture and \u2014 in spring \u2014 the tulip fields.'}
  ]},
  austria:{label:'Austria', cc:'AT', circuits:[
    {name:'Music + mountains', minDays:6, stops:['Vienna','Salzburg','Hallstatt','Innsbruck'],
     why:'Imperial Vienna, Mozart\u2019s Salzburg, the postcard lake village and the Alps.'}
  ]},
  georgia:{label:'Georgia', cc:'GE', circuits:[
    {name:'Caucasus run', minDays:7, stops:['Tbilisi','Kazbegi','Kutaisi','Batumi'],
     why:'Old town wine culture, a clifftop church under a giant peak, canyons and the Black Sea. Wildly underrated and cheap.'}
  ]},
  kenya:{label:'Kenya', cc:'KE', circuits:[
    {name:'Safari classic', minDays:7, stops:['Nairobi','Masai Mara','Lake Nakuru','Amboseli'],
     why:'The Great Migration in the Mara and elephants under Kilimanjaro. July\u2013October for the crossings.'}
  ]},
  tanzania:{label:'Tanzania', cc:'TZ', circuits:[
    {name:'Safari + Zanzibar', minDays:9, stops:['Arusha','Serengeti','Ngorongoro','Zanzibar'],
     why:'The endless plains and the crater, then spice-island beaches to recover.'}
  ]},
  jordan:{label:'Jordan', cc:'JO', circuits:[
    {name:'Petra + desert', minDays:6, stops:['Amman','Petra','Wadi Rum','Dead Sea'],
     why:'The rose city, a Martian desert camp and floating in the Dead Sea. Petra needs two days, not one.'}
  ]},
  laos:{label:'Laos', cc:'LA', circuits:[
    {name:'Slow Laos', minDays:7, stops:['Luang Prabang','Vang Vieng','Vientiane'],
     why:'Monks at dawn, karst lagoons and the sleepiest capital in Asia. The slow boat down the Mekong is the vibe.'}
  ]},
  myanmar:{label:'Myanmar', cc:'MM', circuits:[
    {name:'Temple plains', minDays:8, stops:['Yangon','Bagan','Mandalay','Inle Lake'],
     why:'Thousands of temples at sunrise and a lake of stilt villages. Check current travel advisories before booking.'}
  ]},
  maldives:{label:'Maldives', cc:'MV', circuits:[
    {name:'Atoll escape', minDays:5, stops:['Male','Maafushi','a resort island'],
     why:'Local island on a budget or an overwater villa on a splurge \u2014 both sit on the same impossible blue.'}
  ]}
};

/* ---- EXTENDED FOOD: [dish, one-line why, image-search hint] ---- */
var RW_FOOD_EXT = {
  // more India
  agra:      ['Petha',                'The translucent ash-gourd sweet Agra invented \u2014 buy it near the fort, not at the monument gate.', 'petha agra sweet'],
  mysuru:    ['Mysore masala dosa',   'Crisp, red-chutney-lined, with a mound of potato \u2014 the original is here, plus Mysore pak.', 'mysore masala dosa'],
  madurai:   ['Jigarthanda',          'A cold almond-gum-and-milk cooler built for the Madurai heat, plus kari dosa at night.', 'jigarthanda madurai'],
  kolhapur:  ['Tambda Rassa',        'Fiery red mutton soup \u2014 order it with pandhra rassa (white) to balance the burn.', 'kolhapuri mutton rassa'],
  nashik:    ['Misal',               'Sprouted-bean curry under farsan, with a grape-country wine scene next door.', 'misal pav maharashtra'],
  surat:     ['Locho',               'A soft, steamed savoury eaten with butter and sev \u2014 Surat eats better than it lets on.', 'surat locho snack'],
  guwahati:  ['Assam thali',         'Khar, tenga (sour fish curry) and rice \u2014 subtle, sour and totally its own thing.', 'assamese thali food'],
  imphal:    ['Eromba',              'Fermented-fish mash with boiled veg and chilli \u2014 Manipuri comfort food.', 'eromba manipuri food'],
  gangtok:   ['Sikkimese momo',      'Steamed pork momos with dalle-chilli chutney, plus a bowl of thukpa.', 'sikkim momo thukpa'],
  // world food
  bangkok:   ['Pad kra pao',         'Holy-basil stir-fry over rice with a runny fried egg \u2014 the true Thai street lunch.', 'pad kra pao thai'],
  chiangmai: ['Khao soi',            'Crispy-and-soft curry noodles \u2014 northern Thailand\u2019s finest bowl, full stop.', 'khao soi chiang mai'],
  hanoi:     ['Pho + egg coffee',    'Beef pho for breakfast, egg coffee for the afternoon \u2014 both were basically invented here.', 'pho hanoi vietnam'],
  hoian:     ['Cao lau',             'Thick noodles you can only truly make with Hoi An\u2019s well water \u2014 a dish tied to one town.', 'cao lau hoi an'],
  tokyo:     ['Sushi + ramen',       'Tsukiji-style sushi in the morning, a tonkotsu ramen counter at night.', 'tokyo sushi ramen'],
  kyoto:     ['Kaiseki + yudofu',    'Refined multi-course kaiseki and simple hot-tofu near the temples.', 'kyoto kaiseki food'],
  osaka:     ['Takoyaki + okonomiyaki','Japan\u2019s kitchen \u2014 octopus balls and savoury pancakes, cooked in front of you.', 'osaka takoyaki okonomiyaki'],
  seoul:     ['Korean BBQ',          'Grill your own pork belly, wrap in lettuce, chase with kimchi stew.', 'korean bbq seoul'],
  singapore: ['Hainanese chicken rice','The national dish \u2014 poached chicken, fragrant rice, chilli-ginger on the side.', 'hainanese chicken rice'],
  penang:    ['Char kway teow',      'Smoky wok-fried noodles \u2014 Penang is the reason food pilgrims fly to Malaysia.', 'char kway teow penang'],
  kualalumpur:['Nasi lemak',         'Coconut rice, sambal, anchovies and egg \u2014 breakfast that ruins all other breakfasts.', 'nasi lemak malaysia'],
  bali:      ['Babi guling + nasi campur','Balinese roast pork and a mixed-plate of everything \u2014 eat at a warung, not a resort.', 'babi guling bali'],
  ubud:      ['Nasi campur',         'A little of every Balinese dish on one plate \u2014 the smart way to taste the island.', 'nasi campur ubud'],
  paris:     ['Croissant + steak frites','A bakery croissant at dawn, a bistro steak-frites at night. Skip the tourist cafes.', 'paris croissant bistro'],
  rome:      ['Cacio e pepe',        'Three ingredients, done right \u2014 plus supplì and a proper gelato.', 'cacio e pepe rome'],
  florence:  ['Bistecca fiorentina', 'A vast T-bone, rare, plus lampredotto from a street cart for the brave.', 'bistecca fiorentina florence'],
  naples:    ['Pizza margherita',    'The birthplace \u2014 soft, charred, folded and eaten fast. Accept no imitations.', 'naples pizza margherita'],
  barcelona: ['Tapas + paella',      'Bar-hop pintxos and jamón; find paella at lunch, not the fluorescent tourist plates.', 'barcelona tapas'],
  madrid:    ['Cocido + churros',    'Chickpea stew and, at 1am, churros dipped in thick chocolate.', 'madrid churros chocolate'],
  seville:   ['Tapas crawl',         'Spinach-and-chickpeas, fried fish, sherry \u2014 Andalusia on small plates.', 'seville tapas andalusia'],
  lisbon:    ['Pastel de nata',      'Warm custard tart dusted with cinnamon \u2014 the Belém original is worth the queue.', 'pastel de nata lisbon'],
  porto:     ['Francesinha',         'A meat sandwich drowned in beer-and-tomato sauce and melted cheese. Bring an appetite.', 'francesinha porto'],
  istanbul:  ['Kebab + baklava',     'Charcoal kebabs, mezze, and baklava so good it needs a nap after.', 'istanbul kebab meze'],
  marrakech: ['Tagine + mint tea',   'Slow-cooked lamb-and-apricot tagine and endless sweet mint tea in the souks.', 'moroccan tagine marrakech'],
  cairo:     ['Koshari',             'Rice, pasta, lentils, chickpeas and crispy onions \u2014 Egypt\u2019s glorious carb-on-carb bowl.', 'koshari egypt'],
  athens:    ['Souvlaki + gyros',    'Grilled skewers and stacked gyros wrapped in pita \u2014 cheap, fast, perfect.', 'greek souvlaki gyros'],
  london:    ['Sunday roast + curry','A pub roast on Sunday and a Brick Lane curry any other night \u2014 both count as British now.', 'london sunday roast'],
  dublin:    ['Irish stew + soda bread','Lamb stew and buttered soda bread \u2014 pub food that actually warms you.', 'irish stew dublin'],
  bangkokstreet:['Mango sticky rice','Sweet coconut rice with ripe mango \u2014 the dessert worth a second dinner.', 'mango sticky rice'],
  hongkong:  ['Dim sum',             'Trolley after trolley of dumplings with tea \u2014 yum cha is a morning event, not a snack.', 'hong kong dim sum'],
  saigon:    ['Banh mi + com tam',   'A baguette that colonised beautifully, and broken-rice pork plates.', 'banh mi saigon'],
  colombo:   ['Rice and curry + hoppers','A dozen little curries with rice, and bowl-shaped hoppers with a soft egg.', 'sri lankan rice curry hoppers'],
  kandy:     ['Kottu roti',          'Chopped roti stir-fried on a griddle \u2014 you\u2019ll hear it before you taste it.', 'kottu roti sri lanka'],
  dubai:     ['Shawarma + machboos', 'Late-night shawarma and fragrant Emirati spiced rice with meat.', 'dubai shawarma machboos'],
  capetown:  ['Bunny chow + braai',  'A hollowed loaf full of curry, and a proper South African barbecue.', 'bunny chow south africa'],
  cusco:     ['Lomo saltado',        'Stir-fried beef, chips and rice \u2014 Peruvian-Chinese fusion \u2014 plus ceviche lower down.', 'lomo saltado peru'],
  lima:      ['Ceviche',             'Raw fish cured in lime with chilli and onion \u2014 Lima is a genuine food capital.', 'ceviche lima peru'],
  mexicocity:['Tacos al pastor',     'Spit-roast pork tacos with pineapple \u2014 eat them standing at a street stall at midnight.', 'tacos al pastor mexico'],
  oaxaca:    ['Mole + tlayudas',     'Complex mole sauces and giant crisp tlayudas \u2014 the soul of Mexican cooking.', 'oaxaca mole tlayuda'],
  riodejaneiro:['Feijoada',          'Black-bean-and-pork stew, a Saturday institution, with an icy caipirinha.', 'feijoada brazil'],
  reykjavik: ['Lamb soup + hot dog', 'Hearty lamb soup and, weirdly, a world-famous hot dog stand. Both hit after a glacier.', 'icelandic lamb soup'],
  amsterdam: ['Stroopwafel + herring','Warm syrup waffle from a market stall and, for the bold, raw herring with onion.', 'stroopwafel amsterdam'],
  hanoiegg:  ['Bun cha',             'Grilled pork in a bowl of dipping broth with noodles \u2014 Hanoi\u2019s lunch of choice.', 'bun cha hanoi'],
  tbilisi:   ['Khachapuri + khinkali','A cheese-and-egg bread boat and juicy soup dumplings \u2014 Georgia punches absurdly above its weight.', 'khachapuri georgia']
};

/* ---- CURATED PLACE FACTS: accurate, specific notes for popular Indian
   destinations. Tusk prefers these over guesswork. Keyed by lowercase place.
   Extend freely — this is how village/town-level accuracy grows over time. ---- */
var RW_PLACE_FACTS = {
  'rishikesh':'Rishikesh (Uttarakhand) — yoga & rafting capital on the Ganga. Key spots: Laxman Jhula & Ram Jhula (iron suspension bridges), Triveni Ghat (evening Ganga aarti ~6pm), Beatles Ashram (Chaurasi Kutia), Neelkanth Mahadev Temple (32km, hill temple). Best: Sep–Nov & Feb–May. Rafting season Sep–Jun. Alcohol & non-veg largely restricted in the holy zone. Nearest airport Dehradun (35km), railhead Haridwar (25km).',
  'haridwar':'Haridwar (Uttarakhand) — one of Hinduism\u2019s seven holiest cities on the Ganga. Har Ki Pauri hosts the famous evening Ganga aarti. Mansa Devi & Chandi Devi temples reached by ropeway. Kumbh Mela site. Vegetarian & alcohol-free city. 25km from Rishikesh.',
  'almora':'Almora (Uttarakhand) — Kumaon hill town on a horseshoe ridge, ~1,600m. Known for Kasar Devi (the \u2018Crank\u2019s Ridge\u2019 with a geomagnetic anomaly, once home to Bob Dylan & Timothy Leary), Nanda Devi Temple, Chitai Golu Devta (temple of bells), and its signature sweet Bal Mithai (brown chocolate-like fudge coated in white sugar balls) and Singori. Views of the Himalayan peaks. Nearest railhead Kathgodam (90km).',
  'manali':'Manali (Himachal) — Kullu-valley hill station on the Beas, ~2,050m. Hadimba Temple (cedar forest), Solang Valley (paragliding/skiing), Old Manali cafes, Vashisht hot springs, Jogini Falls. Gateway to Rohtang Pass & Leh-Manali highway (open ~May–Oct). Nearest airport Bhuntar (50km).',
  'nainital':'Nainital (Uttarakhand) — Kumaon lake town around emerald Naini Lake, ~2,000m. Naina Devi Temple (a Shakti Peetha) on the lake shore, Snow View & Tiffin Top viewpoints, Mall Road, boating on the lake. Nearest railhead Kathgodam (34km).',
  'jaipur':'Jaipur (Rajasthan) — the Pink City. Amber Fort (elephant/jeep ascent), Hawa Mahal (honeycomb facade), City Palace, Jantar Mantar (UNESCO astronomical instruments), Nahargarh & Jaigarh forts. Shop for block-print textiles & jewellery in the bazaars. Best Oct–Mar.',
  'varanasi':'Varanasi/Kashi (UP) — among the world\u2019s oldest living cities, on the Ganga. Dashashwamedh Ghat hosts the grand evening Ganga aarti; Kashi Vishwanath Temple (Jyotirlinga); dawn boat ride past the ghats is the signature experience; Sarnath (10km) is where Buddha gave his first sermon. Manikarnika is the main cremation ghat.',
  'goa':'Goa — beaches + Portuguese heritage. North (Baga, Calangute, Anjuna) is lively; South (Palolem, Agonda) is calmer. Basilica of Bom Jesus (St Francis Xavier\u2019s relics, UNESCO Old Goa), Fort Aguada, Dudhsagar Falls (monsoon-fed, on the railway). Peak Nov–Feb; monsoon Jun–Sep is lush & cheap.',
  'leh':'Leh-Ladakh (UT of Ladakh) — high-altitude desert, ~3,500m; acclimatise 2 days before exertion. Pangong Lake (changing blues, ~4,350m), Nubra Valley (Diskit monastery, dunes, double-hump camels), Magnetic Hill, Thiksey & Hemis monasteries. Roads open ~May–Oct. Carry ID for inner-line permits.',
  'udaipur':'Udaipur (Rajasthan) — City of Lakes. City Palace complex on Lake Pichola, Jag Mandir & the Lake Palace (island palaces), Fateh Sagar Lake, Sajjangarh (Monsoon Palace) for sunset, Jagdish Temple. Romantic, best Oct–Mar.'
};
