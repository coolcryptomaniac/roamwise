
var DB = [
  {id:"chiang_mai",name:"Chiang Mai",country:"Thailand",region:"Southeast Asia",lat:18.79,lon:98.99,
   crowd:[45,50,55,40,28,22,25,28,22,32,55,68],
   cost:{budget:550,mid:950,luxury:2200},brk:{flights:280,stay:160,food:90,act:70,misc:50},
   visa:{type:"Free e-Visa",cost:"Free for Indians",days:30,note:"Apply at thaievisa.go.th before travel"},
   bestM:[9,10,11],interests:["culture","temples","food","nature","trekking","wellness","photography"],
   food:["Khao Soi","Pad Thai","Mango Sticky Rice","Som Tam","Larb"],
   gems:["Doi Inthanon National Park","Elephant Nature Park","Sunday Walking Street Wualai","Wat Umong"],
   tags:["budget","nature","culture","food","solo","couple","digital_nomad"],
   cur:"THB",sym:"฿",rate:35,local:{meal:"80-150 ฿",restaurant:"300-600 ฿",hotel:"500-1200 ฿",tuk_tuk:"60-100 ฿",sim:"200 ฿"},
   photos:["chiang mai doi suthep temple golden","chiang mai old city moat night","thailand hill tribe trekking","khao soi noodle bowl chiang mai","night bazaar lanterns thailand"],
   yt:"Chiang Mai Thailand travel guide",wiki:"Chiang_Mai",flag:"TH"},

  {id:"bali_ubud",name:"Ubud",country:"Indonesia",region:"Southeast Asia",lat:-8.51,lon:115.26,
   crowd:[55,60,58,50,35,30,75,78,40,45,55,62],
   cost:{budget:600,mid:1100,luxury:2500},brk:{flights:320,stay:200,food:100,act:80,misc:50},
   visa:{type:"Free Visa on Arrival",cost:"Free 30 days",days:30,note:"Extended to 60 days for free — check Imigrasi Indonesia"},
   bestM:[4,5,8,9],interests:["culture","wellness","photography","nature","food","art","temples"],
   food:["Nasi Goreng","Babi Guling","Bebek Betutu","Gado Gado","Ayam Betutu"],
   gems:["Tegallalang Rice Terraces","Campuhan Ridge Walk","Tirta Empul Temple","Pura Taman Saraswati"],
   tags:["wellness","culture","photography","couple","luxury"],
   cur:"IDR",sym:"Rp",rate:16300,local:{meal:"25000-80000 Rp",restaurant:"100000-300000 Rp",hotel:"300000-800000 Rp",scooter:"80000 Rp/day",sim:"50000 Rp"},
   photos:["bali ubud rice terraces sunrise","bali temple tirta empul ritual","bali jungle swing tegallalang","bali ubud monkey forest","indonesia bali volcano agung"],
   yt:"Ubud Bali travel guide",wiki:"Ubud",flag:"ID"},

  {id:"hoi_an",name:"Hoi An",country:"Vietnam",region:"Southeast Asia",lat:15.88,lon:108.33,
   crowd:[60,65,58,50,35,28,32,38,30,45,58,65],
   cost:{budget:450,mid:800,luxury:1800},brk:{flights:260,stay:130,food:70,act:60,misc:40},
   visa:{type:"E-Visa",cost:"$25 USD",days:90,note:"Apply at evisa.xuatnhapcanh.gov.vn — single entry 90 days"},
   bestM:[1,2,3,9,10,11],interests:["history","culture","food","photography","beaches","cycling","tailoring"],
   food:["Cao Lau","White Rose Dumplings","Banh Mi","Mi Quang","Com Ga"],
   gems:["An Bang Beach","My Son Sanctuary","Tra Que Herb Village","Marble Mountains Da Nang","Cham Island snorkeling"],
   tags:["budget","history","food","solo","couple","photography"],
   cur:"VND",sym:"₫",rate:24500,local:{meal:"30000-80000 ₫",restaurant:"150000-350000 ₫",hotel:"400000-900000 ₫",xe_om:"20000 ₫",sim:"100000 ₫"},
   photos:["hoi an ancient town lanterns night","hoi an yellow walls old town","vietnam hoi an river boat","cao lau noodles vietnam","an bang beach hoi an vietnam"],
   yt:"Hoi An Vietnam travel guide",wiki:"H%E1%BB%99i_An",flag:"VN"},

  {id:"kyoto",name:"Kyoto",country:"Japan",region:"East Asia",lat:35.01,lon:135.77,
   crowd:[50,55,88,85,65,55,65,68,55,90,82,70],
   cost:{budget:1200,mid:2000,luxury:4000},brk:{flights:550,stay:400,food:280,act:200,misc:120},
   visa:{type:"E-Visa Required",cost:"Free (processing fee varies)",days:90,note:"Apply at Indian Consulate — takes 5-7 business days"},
   bestM:[0,1,5,6,8],interests:["culture","temples","history","photography","food","nature","art"],
   food:["Kaiseki","Yudofu","Matcha sweets","Kyoto-style ramen","Tofu dishes"],
   gems:["Fushimi Inari at 5am","Arashiyama bamboo grove at dawn","Philosopher's Path in autumn","Nishiki Market","Kurama Onsen"],
   tags:["culture","history","photography","couple","luxury"],
   cur:"JPY",sym:"¥",rate:149,local:{meal:"800-1500 ¥",restaurant:"2500-6000 ¥",hotel:"8000-20000 ¥",subway:"230 ¥",ic_card:"recommended"},
   photos:["kyoto fushimi inari red gates sunrise","kyoto geisha gion district","arashiyama bamboo grove fog","kyoto cherry blossom maruyama park","kinkakuji golden pavilion kyoto autumn"],
   yt:"Kyoto Japan travel guide 4K",wiki:"Kyoto",flag:"JP"},

  {id:"marrakech",name:"Marrakech",country:"Morocco",region:"North Africa",lat:31.63,lon:-7.99,
   crowd:[40,45,55,65,50,38,35,40,50,55,42,45],
   cost:{budget:700,mid:1200,luxury:2800},brk:{flights:380,stay:200,food:100,act:120,misc:80},
   visa:{type:"Visa Free",cost:"Free",days:90,note:"Indian passport holders get 90 days visa-free — NO visa needed!"},
   bestM:[2,3,9,10,0,1],interests:["culture","history","food","souks","photography","architecture","desert"],
   food:["Tagine","Couscous","Pastilla","Harira soup","Msemen","Mint tea"],
   gems:["Erg Chebbi Desert at sunset","Chefchaouen Blue City","Ourika Valley","Madrasa Ben Youssef","El Badi Palace ruins"],
   tags:["culture","food","photography","couple","solo","adventure"],
   cur:"MAD",sym:"MAD",rate:9.8,local:{meal:"40-80 MAD",restaurant:"150-350 MAD",riad:"400-900 MAD",taxi:"20-40 MAD",sim:"30 MAD"},
   photos:["marrakech djemaa el fna square sunset","morocco marrakech souk spices colors","blue city chefchaouen morocco","sahara desert camel sunset morocco","marrakech riad courtyard tiles"],
   yt:"Marrakech Morocco travel guide",wiki:"Marrakesh",flag:"MA"},

  {id:"tbilisi",name:"Tbilisi",country:"Georgia",region:"Caucasus",lat:41.69,lon:44.83,
   crowd:[20,22,30,45,55,60,65,65,55,45,28,22],
   cost:{budget:600,mid:1000,luxury:2200},brk:{flights:350,stay:160,food:80,act:60,misc:40},
   visa:{type:"Visa Free",cost:"Free",days:365,note:"Indians get 365 days visa-free in Georgia — one year stay allowed!"},
   bestM:[3,4,5,8,9],interests:["culture","wine","history","trekking","food","architecture","nightlife"],
   food:["Khinkali","Khachapuri","Mtsvadi","Lobiani","Georgian wine and chacha"],
   gems:["Kazbegi National Park Gergeti Trinity Church","Vardzia Cave Monastery","Sighnaghi Wine Town","Svaneti region","Mtskheta ancient capital"],
   tags:["budget","culture","wine","solo","couple","digital_nomad"],
   cur:"GEL",sym:"₾",rate:2.7,local:{meal:"10-20 ₾",restaurant:"35-80 ₾",hotel:"80-200 ₾",metro:"1 ₾",sim:"15 ₾"},
   photos:["tbilisi old town sulfur baths","georgia kazbegi trinity church mountains","tbilisi narikala fortress night","georgian khinkali dumplings food","caucasus mountain village georgia"],
   yt:"Tbilisi Georgia travel guide",wiki:"Tbilisi",flag:"GE"},

  {id:"cappadocia",name:"Cappadocia",country:"Turkey",region:"Western Asia",lat:38.67,lon:34.85,
   crowd:[35,38,55,70,60,55,65,68,62,55,40,35],
   cost:{budget:850,mid:1500,luxury:3200},brk:{flights:400,stay:280,food:120,act:180,misc:80},
   visa:{type:"E-Visa",cost:"$51 USD",days:90,note:"Apply at evisa.gov.tr — instant approval, valid 180 days"},
   bestM:[3,4,8,9],interests:["photography","ballooning","history","caves","hiking","culture","wine"],
   food:["Testi Kebab","Manti Turkish dumplings","Baklava","Turkish breakfast","Gözleme"],
   gems:["Hot air balloon at sunrise","Ihlara Valley gorge hike","Underground city Derinkuyu","Rose Valley sunset hike","Local wine tasting Urgup"],
   tags:["photography","couple","luxury","culture","adventure"],
   cur:"TRY",sym:"₺",rate:32,local:{meal:"100-250 ₺",restaurant:"350-800 ₺",cave_hotel:"2000-5000 ₺",balloon:"4000-6000 ₺",sim:"200 ₺"},
   photos:["cappadocia hot air balloon sunrise fairy chimneys","turkey cappadocia rose valley hike","cappadocia cave hotel fairy chimney","goreme panorama rock formations turkey","underground city derinkuyu cappadocia"],
   yt:"Cappadocia Turkey travel guide balloon",wiki:"Cappadocia",flag:"TR"},

  {id:"porto",name:"Porto",country:"Portugal",region:"Southern Europe",lat:41.15,lon:-8.61,
   crowd:[28,30,40,55,65,75,88,85,65,50,32,28],
   cost:{budget:1100,mid:1800,luxury:3500},brk:{flights:580,stay:280,food:140,act:120,misc:80},
   visa:{type:"Schengen Visa",cost:"~€80",days:90,note:"Apply at Portuguese Embassy or VFS Global India — 90 days in 180"},
   bestM:[3,4,8,9,0,1],interests:["food","wine","history","architecture","culture","photography","beaches"],
   food:["Francesinha","Bacalhau","Pastel de nata","Porto wine","Tripas à moda do Porto"],
   gems:["Douro Valley wine country day trip","Livraria Lello bookshop","Fado music in Alfama","Sintra day trip from Lisbon","Costa Nova striped houses"],
   tags:["culture","food","wine","couple","history","photography"],
   cur:"EUR",sym:"€",rate:92,local:{meal:"10-20 €",restaurant:"30-60 €",hotel:"80-180 €",metro:"2 €",port_wine:"3-8 €"},
   photos:["porto ribeira colorful houses douro river","porto dom luis bridge sunset","porto livraria lello bookstore","douro valley vineyard portugal","porto francesinha food"],
   yt:"Porto Portugal travel guide 2024",wiki:"Porto",flag:"PT"},

  {id:"prague",name:"Prague",country:"Czech Republic",region:"Central Europe",lat:50.08,lon:14.44,
   crowd:[30,32,45,62,70,78,88,85,68,55,35,30],
   cost:{budget:1000,mid:1700,luxury:3500},brk:{flights:550,stay:260,food:130,act:110,misc:70},
   visa:{type:"Schengen Visa",cost:"~€80",days:90,note:"Czech Republic is in Schengen — apply at Embassy in India"},
   bestM:[3,4,9,10,0,1],interests:["history","architecture","food","beer","culture","photography","Christmas markets"],
   food:["Svíčková beef","Trdelník","Czech goulash","Pilsner beer","Smažený sýr"],
   gems:["Prague Castle at dawn","Charles Bridge before 7am","Český Krumlov day trip","Josefov Jewish Quarter","Vinohrady local neighborhood"],
   tags:["culture","history","beer","couple","budget","photography"],
   cur:"CZK",sym:"Kč",rate:24,local:{meal:"150-300 Kč",restaurant:"400-900 Kč",hotel:"1500-4000 Kč",metro:"30 Kč",beer:"50-80 Kč"},
   photos:["prague charles bridge sunrise fog","prague old town astronomical clock","czech krumlov castle town","prague castle view city","prague christmas market winter lights"],
   yt:"Prague Czech Republic travel guide",wiki:"Prague",flag:"CZ"},

  {id:"cusco",name:"Cusco",country:"Peru",region:"South America",lat:-13.52,lon:-71.97,
   crowd:[45,40,35,38,55,50,65,62,45,48,50,52],
   cost:{budget:800,mid:1400,luxury:2800},brk:{flights:650,stay:180,food:80,act:200,misc:90},
   visa:{type:"Visa Free",cost:"Free",days:183,note:"Indian passport holders get 183 days visa-free in Peru!"},
   bestM:[5,6,7,8],interests:["history","trekking","adventure","culture","photography","ruins","nature"],
   food:["Ceviche","Lomo Saltado","Cuy roasted guinea pig","Chicha morada","Quinoa soup"],
   gems:["Machu Picchu at sunrise","Rainbow Mountain","Huacachina desert oasis","Lake Titicaca","Sacred Valley Pisac market"],
   tags:["adventure","history","trekking","solo","photography"],
   cur:"PEN",sym:"S/",rate:3.8,local:{meal:"10-25 S/",restaurant:"35-80 S/",hotel:"80-250 S/",taxi:"8-15 S/",sim:"25 S/"},
   photos:["machu picchu sunrise peru inca ruins","rainbow mountain peru vinicunca","cusco plaza de armas peru","inca trail hiking machu picchu","lake titicaca reed islands peru"],
   yt:"Peru Machu Picchu Cusco travel guide",wiki:"Cusco",flag:"PE"},

  {id:"medellin",name:"Medellín",country:"Colombia",region:"South America",lat:6.25,lon:-75.56,
   crowd:[38,40,45,52,42,38,40,38,42,48,40,38],
   cost:{budget:700,mid:1200,luxury:2400},brk:{flights:600,stay:150,food:70,act:80,misc:50},
   visa:{type:"Visa Free",cost:"Free",days:90,note:"Colombian tourist card issued on arrival — 90 days free"},
   bestM:[0,1,2,7,8,9],interests:["culture","food","nightlife","nature","coffee","paragliding","art"],
   food:["Bandeja Paisa","Arepas","Sancocho","Colombian coffee","Empanadas","Horchata"],
   gems:["Pablo Escobar tours (controversial)","Guatapé rock El Peñol","Coffee region Salento","Parque Arví cable car","El Poblado neighborhood"],
   tags:["culture","food","nightlife","solo","digital_nomad","couple"],
   cur:"COP",sym:"$",rate:4000,local:{meal:"8000-20000 COP",restaurant:"30000-80000 COP",hotel:"120000-350000 COP",metro:"3000 COP",sim:"25000 COP"},
   photos:["medellin colombia cable car hill","guatape rock el penol colombia","medellin nightlife poblado street","colombia coffee region salento","medellin city skyline mountain"],
   yt:"Medellin Colombia travel guide 2024",wiki:"Medell%C3%ADn",flag:"CO"},

  {id:"petra",name:"Petra",country:"Jordan",region:"Middle East",lat:30.33,lon:35.44,
   crowd:[30,35,50,55,48,38,35,38,45,52,35,28],
   cost:{budget:1100,mid:1800,luxury:3500},brk:{flights:500,stay:250,food:130,act:180,misc:80},
   visa:{type:"Jordan Pass",cost:"$70 JOD (includes entry to Petra)",days:14,note:"Jordan Pass covers visa + Petra entry — buy at jordanpass.jo"},
   bestM:[2,3,9,10,0,1],interests:["history","archaeology","desert","hiking","photography","culture","adventure"],
   food:["Mansaf","Maqluba","Falafel and hummus","Knafeh","Bedouin tea"],
   gems:["Petra by Night candles ceremony","Little Petra","Wadi Rum desert camping","Dead Sea float","Jerash Roman ruins"],
   tags:["history","photography","couple","culture","adventure"],
   cur:"JOD",sym:"JOD",rate:0.71,local:{meal:"5-12 JOD",restaurant:"15-35 JOD",hotel:"40-120 JOD",taxi:"5-15 JOD",petra_entry:"included in Jordan Pass"},
   photos:["petra jordan treasury al khazneh sunrise","petra jordan siq canyon entrance","wadi rum desert sunset jordan","petra by night candles ceremony","jordan dead sea floating salt"],
   yt:"Petra Jordan travel guide",wiki:"Petra,_Jordan",flag:"JO"},

  {id:"kandy",name:"Kandy",country:"Sri Lanka",region:"South Asia",lat:7.29,lon:80.63,
   crowd:[35,38,55,45,30,25,30,28,30,45,52,40],
   cost:{budget:500,mid:900,luxury:2000},brk:{flights:220,stay:150,food:80,act:60,misc:40},
   visa:{type:"ETA Online",cost:"$20-50 USD",days:30,note:"Apply at eta.gov.lk — instant approval"},
   bestM:[0,1,6,7,8,9],interests:["culture","tea","temples","wildlife","beaches","nature","trekking"],
   food:["Rice and curry","Kottu roti","Hoppers","String hoppers","Pol sambol","Ceylon tea"],
   gems:["Temple of the Tooth Relic ceremony","Sinharaja rainforest","Ella nine arch bridge","Yala wildlife safari","Mirissa whale watching"],
   tags:["budget","culture","nature","food","solo","couple"],
   cur:"LKR",sym:"Rs",rate:310,local:{meal:"300-800 Rs",restaurant:"1000-3000 Rs",hotel:"3000-8000 Rs",tuk_tuk:"200-500 Rs",sim:"500 Rs"},
   photos:["kandy sri lanka temple tooth buddhist","ella sri lanka nine arch bridge train","sri lanka tea plantation hills","yala national park leopard safari","sigiriya lion rock sri lanka sunset"],
   yt:"Sri Lanka travel guide Kandy Ella",wiki:"Kandy",flag:"LK"},

  {id:"queenstown",name:"Queenstown",country:"New Zealand",region:"Oceania",lat:-45.03,lon:168.66,
   crowd:[62,58,50,40,35,30,32,38,45,52,55,62],
   cost:{budget:2200,mid:3500,luxury:6000},brk:{flights:1100,stay:600,food:280,act:400,misc:150},
   visa:{type:"NZeTA",cost:"NZD 17 online",days:90,note:"Apply at immigration.govt.nz — New Zealand ETA for Indians"},
   bestM:[5,6,7,8],interests:["adventure","skiing","bungee","nature","photography","wine","hiking"],
   food:["Hāngi Maori feast","Whitebait fritters","Green-lipped mussels","Hokey pokey ice cream","Pinot Noir Central Otago"],
   gems:["Milford Sound cruise","Routeburn Track hike","Fiordland National Park","Glenorchy Lord of the Rings","Cardrona ski resort"],
   tags:["adventure","nature","luxury","couple","skiing","photography"],
   cur:"NZD",sym:"NZ$",rate:1.62,local:{meal:"15-28 NZ$",restaurant:"40-80 NZ$",hotel:"150-400 NZ$",gondola:"49 NZ$",bungee:"195 NZ$"},
   photos:["queenstown new zealand lake wakatipu mountains","milford sound new zealand fiord","queenstown bungee jumping nevis","routeburn track hiking new zealand","new zealand south island snow mountains"],
   yt:"Queenstown New Zealand adventure travel",wiki:"Queenstown,_New_Zealand",flag:"NZ"},

  {id:"oaxaca",name:"Oaxaca",country:"Mexico",region:"North America",lat:17.07,lon:-96.72,
   crowd:[40,38,45,55,50,42,60,55,42,45,35,42],
   cost:{budget:700,mid:1200,luxury:2500},brk:{flights:680,stay:150,food:80,act:80,misc:50},
   visa:{type:"Tourist Card FMM",cost:"Free",days:180,note:"Free tourist card on arrival — no pre-visa needed for Indians!"},
   bestM:[9,10,0,1,2],interests:["food","culture","art","mezcal","history","archaeology","textiles"],
   food:["Mole negro sauce","Tlayuda","Chapulines grasshoppers","Memelas","Mezcal","Tasajo"],
   gems:["Day of the Dead Dia de Muertos festival","Monte Albán Zapotec ruins","Hierve el Agua petrified waterfalls","Tule Tree","Etla Valley markets"],
   tags:["food","culture","solo","photography","art"],
   cur:"MXN",sym:"$",rate:17,local:{meal:"60-150 MXN",restaurant:"200-500 MXN",hotel:"600-1800 MXN",colectivo:"15 MXN",mezcal:"80-150 MXN"},
   photos:["oaxaca mexico monte alban ruins sunset","day of dead oaxaca mexico calavera","oaxaca colorful streets buildings","hierve agua petrified waterfalls oaxaca","oaxaca mole negro food market"],
   yt:"Oaxaca Mexico travel guide food culture",wiki:"Oaxaca_City",flag:"MX"}
];
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

var LS = localStorage;
function lsGet(k){ return LS.getItem(k)||''; }
function lsSet(k,v){ LS.setItem(k,v); }
function el(id){ return document.getElementById(id); }

var AC = 'INR';
var AUTH_ENABLED = (typeof FIREBASE_CONFIG!=='undefined') && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey!=='PASTE_ME';
/* Pro is account-bound. With accounts ON, never trust the local flag at boot —
   the auth snapshot re-grants it for the right account. Without accounts
   (pure device mode) the local flag is all we have. */
/* ============================================================================
   RW PRICING ENGINE — single source of truth for every price, tier, and offer.
   Isolated deliberately: nothing else in the app should hardcode a price or a
   feature-gate decision. Everything reads through RWPricing.* so the entire
   business model can change by editing ONE config object below. This is the
   literal implementation of "pricing can change anytime" — there's exactly
   one place it lives.
   ========================================================================= */
var RWPricing = (function(){
  var CONFIG = {
    /* The app's public launch date — the founder offer expires at whichever
       comes first: 1000 signups, or 365 days after this date. */
    LAUNCH_DATE: '2026-06-01',
    FOUNDER_OFFER: { priceINR:100, maxUsers:1000, maxDays:365, label:'Founder Pro \u2014 \u20b9100 lifetime' },

    /* Ongoing freemium tiers, once the founder offer window closes.
       Feature keys are free-form strings — hasFeature() just checks
       inclusion, so adding a new gated feature anywhere is a one-line
       addition to a tier's `features` array, never a new isPro-style flag. */
    TIERS: [
      { id:'free',  label:'Free',  priceMonthly:0,   priceYearly:0,
        features:['smartAI'] },
      { id:'plus',  label:'Plus',  priceMonthly:99,  priceYearly:999,
        features:['smartAI','proAI','pdfExport','cardStylesBasic'] },
      { id:'pro',   label:'Pro',   priceMonthly:299, priceYearly:2999,
        features:['smartAI','proAI','pdfExport','cardStylesBasic','cardStylesAll','adFree','squadsPost','unlimitedPdf'] },
      { id:'elite', label:'Elite', priceMonthly:499, priceYearly:4999,
        features:['smartAI','proAI','pdfExport','cardStylesBasic','cardStylesAll','adFree','squadsPost','unlimitedPdf','movieFree','earlyAccess','prioritySupport'] }
    ],
    /* Long-term one-time passes — now tier-specific (not one universal price):
       each is priced as a discount off THAT tier's yearly rate, discount
       growing with commitment length (3yr ≈2.5x yearly, 5yr ≈3.5x, 10yr ≈5x
       instead of 3x/5x/10x) — the whole point of a long-term pass is a
       genuine bulk discount versus paying yearly repeatedly. */
    LONG_TERM: [
      { tier:'plus',  tierLabel:'Plus',  options:[
        { id:'plus_y3',  years:3,  priceINR:2499 },
        { id:'plus_y5',  years:5,  priceINR:3499 },
        { id:'plus_y10', years:10, priceINR:4999 } ] },
      { tier:'pro',   tierLabel:'Pro',   options:[
        { id:'pro_y3',   years:3,  priceINR:7499 },
        { id:'pro_y5',   years:5,  priceINR:9999 },
        { id:'pro_y10',  years:10, priceINR:14999 } ] },
      { tier:'elite', tierLabel:'Elite', options:[
        { id:'elite_y3', years:3,  priceINR:12499 },
        { id:'elite_y5', years:5,  priceINR:17499 },
        { id:'elite_y10',years:10, priceINR:24999 } ] }
    ],
    /* Short-term micro-passes for a single trip or a quick trial. */
    SHORT_TERM: [
      { id:'day',  days:1, priceINR:15, label:'Day Pass' },
      { id:'week', days:7, priceINR:29, label:'Week Pass' }
    ]
  };

  function daysSinceLaunch(){ return (Date.now()-new Date(CONFIG.LAUNCH_DATE).getTime())/864e5; }

  /* Founder offer is open only while BOTH conditions hold: under the user
     cap AND within the first year — closes the instant either is exceeded. */
  function founderOfferOpen(signupCountSoFar){
    return (typeof signupCountSoFar!=='number' || signupCountSoFar<CONFIG.FOUNDER_OFFER.maxUsers)
      && daysSinceLaunch() < CONFIG.FOUNDER_OFFER.maxDays;
  }

  function tierById(id){ return CONFIG.TIERS.find(function(t){return t.id===id;}) || CONFIG.TIERS[0]; }

  /* The user's active tier, derived from what's actually stored — legacy
     one-time ₹100 Pro buyers are grandfathered at 'elite' forever, exactly
     as promised when they bought it. New purchases store an explicit
     tier id; nothing here assumes only one possible paid state. */
  function currentTier(){
    if(lsGet('rw_tier')) return tierById(lsGet('rw_tier'));
    if(isPro) return tierById('elite'); /* legacy ₹100 lifetime / founder offer buyers */
    return tierById('free');
  }

  function hasFeature(name){ return currentTier().features.indexOf(name) > -1; }

  function yearlySavingsPct(tier){
    if(!tier.priceMonthly) return 0;
    var fullYear = tier.priceMonthly*12;
    return Math.round((1 - tier.priceYearly/fullYear)*100);
  }

  return {
    CONFIG: CONFIG,
    founderOfferOpen: founderOfferOpen,
    daysSinceLaunch: daysSinceLaunch,
    tierById: tierById,
    currentTier: currentTier,
    hasFeature: hasFeature,
    yearlySavingsPct: yearlySavingsPct
  };
})();

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
slider.addEventListener('input', updateBudget);
function updateBudget(){
  var v = parseInt(slider.value);
  el('budgetDisplay').innerHTML = v>=10000 ? fmtMoney(10000)+'+' : fmtMoney(v);
  slider.style.setProperty('--pct', ((v-200)/9800*100).toFixed(1)+'%');
}
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

/* PRO UI STATE */
function refreshProUI(){
  isPro = lsGet('rwPro')==='1';
  var btn=el('proBtn'), bar=el('freeBar'), promo=el('promoBar');
  if(isPro){
    if(btn){ btn.textContent='Pro Active'; btn.className='btn btn-pro active'; btn.onclick=function(){ showToast('Pro active on this device!'); }; }
    if(bar) bar.classList.add('hide');
    if(promo) promo.classList.add('hide');
  } else {
    if(btn){ btn.textContent='Pro ₹100'; btn.className='btn btn-pro'; btn.onclick=openPay; }
    if(bar) bar.classList.remove('hide');
    if(promo) promo.classList.remove('hide');
    el('freeCount').textContent = freeLeft;
  }
}

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
/* ===== SITE SEARCH ===== */
function ssIndex(){
  var ix=[
   {t:'Plan a trip (crowd calendar + budget)',k:'plan search itinerary budget crowd month',go:function(){tabGo('plan');}},
   {t:'Trek Vault',k:'trek hike hidden dangerous new',go:function(){tabGo('explore');scrollToId('treks');}},
   {t:'Event Radar (FIFA, Olympics...)',k:'event fifa olympics cricket concert f1 iphone',go:function(){tabGo('explore');scrollToId('events');}},
   {t:'Hub & Spoke India + airports + Vande Bharat + best base',k:'airport vande bharat train bus base delhi flights india',go:function(){tabGo('explore');scrollToId('hubspoke');}},
   {t:'EV Vault + breakthroughs',k:'ev electric battery tesla charging breakthrough',go:function(){tabGo('explore');scrollToId('ev');}},
   {t:'AI Pulse (agents, robots, startups)',k:'ai claude anthropic chatgpt gemini robot startup agent',go:function(){tabGo('explore');scrollToId('aipulse');}},
   {t:'Travel Pulse News (daily crunched headlines)',k:'news visa flight advisory pulse today',go:function(){tabGo('explore');scrollToId('newspulse');}},
   {t:'Ratings & Testimonials',k:'rating review stars testimonial feedback',go:function(){tabGo('home');scrollToId('ratings');}},
   {t:'Journey Card (poster) & Movie',k:'journey card map poster movie video souvenir',go:function(){tabGo('explore');scrollToId('jlog');}},
   {t:'Store (books, PDFs, membership)',k:'store shop buy book tshirt membership consult',go:function(){tabGo('home');scrollToId('store');}},
   {t:'My Profile & lifetime destinations',k:'profile avatar bio age style lifetime',go:function(){openProfile();}},
   {t:'AI setup wizard (free keys)',k:'api key gemini groq wizard setup',go:function(){openWizard();}},
   {t:'AI Arena (compare models)',k:'compare arena models benchmark',go:function(){showToast('Build any itinerary, then tap Compare AI engines');tabGo('plan');}},
   {t:'Premium PDF itinerary',k:'pdf premium download print',go:function(){tabGo('plan');showToast('Search a place, open its itinerary, tap Premium PDF');}},
   {t:'Saved for later',k:'saved wishlist heart',go:function(){showSaved();}},
   {t:'Unlock Pro / Supporter',k:'pro pay upgrade supporter price',go:function(){openPay();}},
   {t:'Basecamp (companies, emergency, packing)',k:'basecamp emergency packing operators',go:function(){tabGo('explore');scrollToId('basecamp');}},
   {t:'The Creator & books',k:'creator mohit books author about',go:function(){tabGo('home');scrollToId('creator');}},
   {t:'My Music',k:'music songs phonk spotify saavn',go:function(){openMusic();}},
   {t:'The RoamWise Film (promo video)',k:'promo film video anthem watch',go:function(){tabGo('home');scrollToId('promofilm');}}
  ];
  (typeof TREKS!=='undefined'?TREKS:[]).forEach(function(t){ ix.push({t:'Trek: '+t.n,k:t.n.toLowerCase(),go:function(){tabGo('explore');scrollToId('treks');}}); });
  (typeof EVENTS!=='undefined'?EVENTS:[]).forEach(function(e){ ix.push({t:e.ic+' '+e.n,k:e.n.toLowerCase(),go:function(){eventPlan(e.id);}}); });
  (typeof EXPS!=='undefined'?EXPS:[]).forEach(function(e){ ix.push({t:'Experience: '+e.n,k:e.n.toLowerCase(),go:function(){tabGo('explore');scrollToId('exps');}}); });
  return ix;
}
var _ssIx=null;
function ssOpen(){ el('siteSearch').style.display='block'; el('ssInput').focus(); useBump('search'); }
function ssClose(){ el('siteSearch').style.display='none'; el('ssOut').innerHTML=''; el('ssInput').value=''; }
function ssRun(q){
  q=(q||'').toLowerCase().trim();
  if(!_ssIx) _ssIx=ssIndex();
  var out=el('ssOut');
  if(q.length<2){ out.innerHTML=''; return; }
  var hits=_ssIx.filter(function(x){ return (x.t+' '+x.k).toLowerCase().indexOf(q)>-1; }).slice(0,9);
  out.innerHTML = hits.length? hits.map(function(x,i){ return '<div class="ti-day" style="cursor:pointer;padding:11px 12px;border:1px solid var(--b);border-radius:11px;margin-bottom:7px;background:#0E1018" onclick="_ssGo('+i+')"><b>&#128269;</b><span>'+x.t+'</span></div>'; }).join('')
    : '<div class="mode-box">No match \u2014 try "trek", "pdf", "events", "store"\u2026 or just plan a trip to "'+q+'" \u2192 <button class="tact" onclick="ssClose();el(\'destInput\').value=\''+q.replace(/'/g,'')+'\';tabGo(\'plan\')">Plan it</button></div>';
  window._ssHits=hits;
}
function _ssGo(i){ var x=window._ssHits[i]; ssClose(); x.go(); }

/* ===== ADAPTIVE "FOR YOU" (usage-aware UI) ===== */
function useBump(k){ try{ var u=JSON.parse(lsGet('rw_use')||'{}'); u[k]=(u[k]||0)+1; lsSet('rw_use',JSON.stringify(u)); }catch(e){} }
var FORYOU_DEFS={copilot:['\ud83e\udded Copilot',function(){cpFocusHero();}],map:['\ud83d\uddfa\ufe0f Map',function(){openMapExplorer();}],group:['\ud83e\udd1d Group',function(){openGroupPlanner();}],trips:['\u2708\ufe0f Trips',function(){openVault();}],plan:['\ud83e\udded Plan',function(){tabGo('plan');}],treks:['\u26f0 Treks',function(){tabGo('explore');scrollToId('treks');}],card:['\ud83d\uddfa Card',function(){tabGo('explore');scrollToId('jlog');}],events:['\ud83c\udfdf Events',function(){tabGo('explore');scrollToId('events');}],store:['\ud83d\udecd Store',function(){tabGo('home');scrollToId('store');}],pdf:['\ud83d\udcd5 PDF',function(){tabGo('plan');}],search:['\ud83d\udd0d Search',function(){ssOpen();}],profile:['\ud83d\udc64 Profile',function(){openProfile();}]};
function renderForYou(){
  var host=el('brief'); if(!host) return;
  var u={}; try{u=JSON.parse(lsGet('rw_use')||'{}');}catch(e){}
  var keys=Object.keys(FORYOU_DEFS).sort(function(a,b){return (u[b]||0)-(u[a]||0);});
  var wrap=document.createElement('div');
  var tiles=keys.map(function(k){
    var d2=FORYOU_DEFS[k], parts=d2[0].split(' ');
    return '<div class="ftile" onclick="useBump(\''+k+'\');FORYOU_DEFS[\''+k+'\'][1]()"><span class="fi">'+parts[0]+'</span><span class="fl">'+parts.slice(1).join(' ')+'</span></div>';
  }).join('');
  wrap.innerHTML='<div class="rowhead"><b>Quick start</b><a onclick="ssOpen()">Search \u2192</a></div><div class="ftrow">'+tiles+'</div>';
  host.insertBefore(wrap, host.firstChild);
  /* Popular now — image-first media row from the destination DB */
  try{
    var live=activeEvents(), evCity=live.length? live[0].city:null;
    var curM=new Date().getMonth();
    var seedH=function(str){var x=0;for(var i=0;i<str.length;i++)x=(x*31+str.charCodeAt(i))>>>0;return (x+new Date().getDate())%97;};
    /* Month-aware: in-season (bestM) first, LIVE-event city pinned, daily-shuffled —
       genuinely different by season AND by day, and it scales as DB grows. */
    var pool=(typeof DB!=='undefined'? DB:[]).slice();
    pool.sort(function(a,b){
      var ea=(evCity===a.name)?-200:0, eb=(evCity===b.name)?-200:0;
      var sa=((a.bestM||[]).indexOf(curM+1)>-1)?-100:0, sb=((b.bestM||[]).indexOf(curM+1)>-1)?-100:0;
      return (ea+sa+seedH(a.name))-(eb+sb+seedH(b.name)); });
    var picks=pool.slice(0,6);
    var EMO={beach:'\ud83c\udfd6\ufe0f',metro:'\ud83c\udf06',sacred:'\ud83d\uded5',tech:'\ud83c\udf03',peak:'\ud83c\udfd4\ufe0f',classic:'\ud83e\udded'};
    var row=document.createElement('div');
    row.innerHTML='<div class="rowhead"><b>Popular now</b><a onclick="tabGo(\'explore\')">All \u2192</a></div><div class="prow">'
      + picks.map(function(d2){
          var th=themeFor(d2), a2=th.acc, dp2=th.deep, k2=th.key;
          var badge = (evCity===d2.name)? '<span class="pb">LIVE</span>' : '';
          return '<div class="pcard" style="background:linear-gradient(160deg, rgb('+a2[0]+','+a2[1]+','+a2[2]+') 0%, rgb('+dp2[0]+','+dp2[1]+','+dp2[2]+') 85%)" onclick="el(\'destInput\').value=\''+d2.name.replace(/'/g,'')+'\';tabGo(\'plan\');runSearch()">'
            + badge + '<span class="pe">'+(EMO[k2]||EMO.classic)+'</span><span class="pn">'+d2.name+'</span></div>';
        }).join('') + '</div>';
    row.className='v v-home';
    var bb=el('promoTop');
    if(bb && bb.parentNode) bb.parentNode.insertBefore(row, bb.nextSibling);
    /* --- three more dynamic rows, below the copilot hero --- */
    try{
      var MOx=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      function miniRow(title, list){
        if(!list.length) return null;
        var r=document.createElement('div'); r.className='v v-home';
        r.innerHTML='<div class="rowhead"><b>'+title+'</b></div><div class="prow">'
          + list.map(function(d3){
              var t3=themeFor(d3), a3=t3.acc, dp3=t3.deep;
              return '<div class="pcard" style="background:linear-gradient(160deg, rgb('+a3[0]+','+a3[1]+','+a3[2]+') 0%, rgb('+dp3[0]+','+dp3[1]+','+dp3[2]+') 85%)" onclick="cpGoPlan(\''+d3.name.replace(/'/g,'')+'\')">'
                +'<span class="pe">'+(d3._tag||'')+'</span><span class="pn">'+d3.name+'</span></div>';
            }).join('')+'</div>';
        setTimeout(function(){ rwPaintPhotos(r, list); }, 900); /* stagger behind Popular-now's queue */
        return r;
      }
      var used={}; picks.forEach(function(d){used[d.name]=1;});
      var inSeason=pool.filter(function(d){ return (d.bestM||[]).indexOf(curM+1)>-1 && !used[d.name]; }).slice(0,6)
        .map(function(d){ d._tag='\ud83c\udf1e'; used[d.name]=1; return d; });
      var lowCrowd=pool.filter(function(d){ return d.crowd && !used[d.name]; })
        .sort(function(a,b){ return a.crowd[curM]-b.crowd[curM]; }).slice(0,6)
        .map(function(d){ d._tag=d.crowd[curM]+'%'; used[d.name]=1; return d; });
      var visaEasy=pool.filter(function(d){ return d.visa && /free|arrival/i.test(d.visa.type) && !used[d.name]; }).slice(0,6)
        .map(function(d){ d._tag='\ud83d\udec2'; return d; });
      var hero=el('copilotHero'), after=hero;
      [miniRow('\ud83c\udf1e In season \u2014 '+MOx[curM], inSeason),
       miniRow('\ud83e\udd2b Low-crowd escapes this month', lowCrowd),
       miniRow('\ud83d\udec2 Easy visa for Indians', visaEasy)].forEach(function(r){
        if(r && after && after.parentNode){ after.parentNode.insertBefore(r, after.nextSibling); after=r; }
      });
    }catch(e){}
    /* real photos over the gradients — SEQUENTIAL queue (weserv rate-limit safe) */
    rwPaintPhotos(row, picks);
    var cards=row.querySelectorAll('.pcard');
    function proxOf(u){ return 'https://images.weserv.nl/?w=300&h=500&fit=cover&q=78&output=jpg&url='+encodeURIComponent(String(u).replace(/\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^\/]+)\/\d+px-[^\/]+$/,'/$1').replace(/^https?:\/\//,'')); }
    function paintCard(ci,prox){ if(!cards[ci]) return; cards[ci].style.background='url('+prox+')'; var pe=cards[ci].querySelector('.pe'); if(pe) pe.style.display='none'; }
    function loadOne(u,ci){ return new Promise(function(res){
      var prox=proxOf(u), im=new Image(), tries=0;
      im.onload=function(){ if(im.naturalWidth>10){ paintCard(ci,prox); res(true); } else res(false); };
      im.onerror=function(){ if(tries++<2){ setTimeout(function(){ im.src=prox+'&_='+Date.now(); }, 1100*tries); } else res(false); };
      im.src=prox;
    }); }
    function findURL(d3){
      var key='rw_pimg_'+d3.name.toLowerCase().replace(/[^a-z0-9]/g,'');
      var cached=lsGet(key); if(cached) return Promise.resolve({key:key,u:cached});
      var seen=null;
      function grab(q){ if(seen) return Promise.resolve(); return wikiAny(q,q).then(function(u){ if(u&&/wikimedia|wikipedia/.test(u)&&!seen) seen=u; }); }
      return grab(d3.name).then(function(){ return grab(d3.name+' '+(d3.country||'')); })
        .then(function(){ return grab((d3.photos&&d3.photos[0])||d3.name); })
        .then(function(){ return {key:key,u:seen}; });
    }
    /* photo painting handled by rwPaintPhotos(row, picks) above */
    }catch(e){}
}

/* ===== SHARED CARD PHOTO PAINTER =====
   Same Wikimedia -> weserv pipeline the Popular-now row uses, extracted so every
   carousel (In season / Low-crowd / Easy visa) gets real photos too. Sequential
   with backoff to stay inside weserv's rate limit; caches the resolved URL per
   destination so repeat visits paint instantly. */
function rwPaintPhotos(rowEl, list){
  if(!rowEl || !list || !list.length) return;
  var cards = rowEl.querySelectorAll('.pcard');
  /* The weserv proxy was 404-ing on Wikimedia thumbnail paths (their %-encoded
     filenames don't survive proxying). Wikimedia URLs load DIRECTLY in the
     browser with proper CORS, so we skip the proxy entirely — faster and it
     actually works. Resolved URL is cached per destination. */
  function paint(ci,url){
    if(!cards[ci]) return;
    cards[ci].style.background='linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55)), url('+url+')';
    cards[ci].style.backgroundSize='cover';
    cards[ci].style.backgroundPosition='center';
    var pe=cards[ci].querySelector('.pe'); if(pe) pe.style.textShadow='0 2px 12px rgba(0,0,0,.9)';
    var pn=cards[ci].querySelector('.pn'); if(pn) pn.style.textShadow='0 2px 12px rgba(0,0,0,.95)';
  }
  function proxied(url){
    /* Wikimedia serves these to servers but rejects the browser's hotlink
       request; the weserv image proxy fetches server-side and re-serves with
       open CORS. The critical detail my first attempt got wrong: the ENTIRE
       source URL must be percent-encoded (encodeURIComponent), otherwise the
       %-sequences already in Wikimedia filenames corrupt the proxy request. */
    return 'https://images.weserv.nl/?url='+encodeURIComponent(url)+'&w=340&h=460&fit=cover&output=jpg&q=80';
  }
  function loadInto(url, ci){
    return new Promise(function(res){
      var prox=proxied(url), im=new Image();
      im.onload=function(){ if(im.naturalWidth>10){ paint(ci,prox); res(true); } else res(false); };
      im.onerror=function(){
        /* proxy failed — last resort, try the raw URL directly */
        var im2=new Image();
        im2.onload=function(){ if(im2.naturalWidth>10){ paint(ci,url); res(true); } else res(false); };
        im2.onerror=function(){ res(false); };
        im2.src=url;
      };
      im.src=prox;
    });
  }
  function findURL(d, attempt){
    var key='rw_pimg_'+d.name.toLowerCase().replace(/[^a-z0-9]/g,'');
    var cached=lsGet(key);
    if(cached) return Promise.resolve(cached);
    /* Some destinations have no Wikipedia lead image under their bare name
       (small towns especially). Widen the net before giving up, otherwise those
       cards stay as flat gradients forever. */
    /* NOTE: do NOT treat cached==='' as a hard no here. At page load a burst of
       wikiAny calls gets rate-limited by Wikipedia's REST API and returns null,
       which previously got cached as '' and stuck forever. Retry a couple of
       times with backoff before giving up. */
    attempt = attempt||0;
    var tries = [
      d.name,
      d.name+' '+(d.country||''),
      d.name+' city',
      (d.country||'')+' landmark'
    ].filter(function(x,i,a){ return x && x.trim() && a.indexOf(x)===i; });
    function tryAt(k){
      if(k>=tries.length) return Promise.resolve(null);
      return wikiAny(tries[k], tries[k]).then(function(u){ return u || tryAt(k+1); });
    }
    return tryAt(0).then(function(u){
      if(u) return u;
      if(attempt<2) return new Promise(function(r){ setTimeout(r, 700*(attempt+1)); }).then(function(){ return findURL(d, attempt+1); });
      return null;
    });
  }
  (function next(i){
    if(i>=list.length) return;
    var d=list[i], key='rw_pimg_'+d.name.toLowerCase().replace(/[^a-z0-9]/g,'');
    findURL(d).then(function(url){
      if(url){ loadInto(url,i).then(function(ok){ if(ok) lsSet(key, url); /* only cache successes */ setTimeout(function(){next(i+1);}, 350); }); }
      else {
        /* No image anywhere — give the card a readable label treatment so it
           looks designed, not broken. */
        if(cards[i]){ var pe=cards[i].querySelector('.pe'); if(pe) pe.style.opacity='.9'; }
        setTimeout(function(){ next(i+1); }, 250);
      }
    });
  })(0);
}

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
  if(PROMO_YT_ID && top){
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
function openExternally(url){
  if(window.RW && RW.openExternal){ RW.openExternal(url); }
  else { window.open(url, '_blank', 'noopener'); }
}
var PROMO_MP4_URL = 'https://roamwise.co.in/promo.mp4'; /* self-hosted film — Mohit uploads promo.mp4 to the repo root (see PROJECT-STATE.md) */
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
    var names = {1:'aborted', 2:'network error', 3:'decode error', 4:'format not supported'};
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
var AFF_BOOKING=''; /* Booking.com affiliate aid (optional) */
function stayUrl(place){ var u='https://www.booking.com/searchresults.html?ss='+encodeURIComponent(place);
  if(AFF_BOOKING) u+='&aid='+AFF_BOOKING; return u; }
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
      document.querySelectorAll('.rw-ad').forEach(function(a){ a.style.display='block'; (adsbygoogle=window.adsbygoogle||[]).push({}); });
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', loadAds); else loadAds();
  ensureWaButton();
})();
/* Global + idempotent so remote config can create it after the fact. */
function ensureWaButton(){
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

/* ===== TRIP SQUADS — safe, anchored, zero built-in chat ===== *
 * Modeled on how Zostel/goSTOPS/The Hosteller stay safe: they never run an open
 * DM system between strangers — social anchors to a real place + real dates,
 * and the traveler themself decides what contact info (if any) to publish.
 * RoamWise can't provide the "real staffed hostel" safety net, so it goes
 * further the other direction: NO forced info exchange, NO in-app messaging
 * to build/moderate, a visible report button, a daily post cap, and posts
 * auto-expire. That is the whole safety model — simple by design. */
var SQUAD_CAP_PER_DAY = 3;
function squadKey(name,month){ return (name+'_'+month).toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,60); }
function openSquads(name, month){
  if(!AUTH_READY || !user){ showToast('Sign in first \u2014 Trip Squads is for real accounts'); return; }
  var ov=el('squadOv');
  if(!ov){ ov=document.createElement('div'); ov.id='squadOv'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:440px;max-height:88vh;overflow:auto"><button class="modal-close" onclick="el(\'squadOv\').classList.remove(\'open\')">\u00d7</button>'
     +'<div class="modal-head"><div class="modal-title">\ud83c\udf92 Trip Squads</div><div class="modal-sub" id="squadSub"></div></div>'
     +'<div class="modal-body"><div style="font-size:11px;color:var(--t3);background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px 12px;margin-bottom:12px">\ud83d\udee1\ufe0f No chat here on purpose. Posts show only what the traveler chooses to share. Never send money or OTPs before meeting in person \u2014 verify at a public place first.</div>'
     +'<div id="squadList"></div>'
     +'<div style="border-top:1px solid var(--b2);margin-top:14px;padding-top:14px">'
     +'<div style="font-size:12.5px;font-weight:700;color:var(--t1);margin-bottom:8px">Post your own squad</div>'
     +'<textarea id="squadNote" maxlength="140" placeholder="e.g. 2 of us, budget backpacking, flexible dates \\u00b1 4 days" style="width:100%;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px;color:var(--t1);font-family:Outfit;font-size:13px;min-height:60px"></textarea>'
     +'<input id="squadContact" maxlength="80" placeholder="Optional \u2014 how to reach you (Insta handle, WhatsApp link\u2026) \u2014 leave blank to stay private" style="width:100%;margin-top:8px;background:#12121C;border:1px solid var(--b2);border-radius:11px;padding:10px;color:var(--t1);font-family:Outfit;font-size:13px">'
     +'<button class="rzp-main-btn" style="margin-top:10px" onclick="postSquad()">\ud83d\udce2 Post to this Squad board</button>'
     +'</div></div></div>';
    document.body.appendChild(ov); }
  el('squadSub').textContent=name+' \u00b7 '+month;
  window._squadCtx={name:name, month:month};
  loadSquads(name,month);
  ov.classList.add('open');
}
function loadSquads(name,month){
  var list=el('squadList'); list.innerHTML='<div style="font-size:12px;color:var(--t3)">Loading\u2026</div>';
  var key=squadKey(name,month);
  var cutoff=Date.now()-45*864e5; /* auto-expire: only show posts from the last 45 days */
  db.collection('squads').where('key','==',key).orderBy('created','desc').limit(20).get().then(function(qs){
    var rows=qs.docs.map(function(d){ return {id:d.id, data:d.data()}; })
      .filter(function(r){ var c=r.data.created; return !c || c.toMillis()>cutoff; });
    if(!rows.length){ list.innerHTML='<div class="mode-box">No squads posted yet for '+name+' in '+month+' \u2014 be the first \ud83e\udd1d</div>'; return; }
    list.innerHTML=rows.map(function(r){
      var d2=r.data, mine=(d2.uid===((user||{}).uid));
      return '<div class="ti-day" style="align-items:flex-start;flex-direction:column;gap:4px;padding:12px;border:1px solid var(--b2);border-radius:12px;margin-bottom:8px">'
        +'<div style="font-size:13px;color:var(--t1)">'+String(d2.note||'').replace(/[<>]/g,'')+'</div>'
        +(d2.contact? '<div style="font-size:11.5px;color:var(--gold2)">\ud83d\udcac '+String(d2.contact).replace(/[<>]/g,'')+'</div>' : '<div style="font-size:11px;color:var(--t3)">No contact shared \u2014 poster stays private</div>')
        +'<div style="display:flex;gap:8px;margin-top:2px">'
        +(mine? '<button class="tact" style="font-size:10.5px;padding:5px 10px" onclick="delSquad(\''+r.id+'\')">Remove mine</button>'
              : '<button class="tact" style="font-size:10.5px;padding:5px 10px;color:var(--t3)" onclick="reportSquad(\''+r.id+'\')">\u26a0 Report</button>')
        +'</div></div>';
    }).join('');
  }).catch(function(){ list.innerHTML='<div class="mode-box">Squad board needs the Firestore rules published \u2014 see admin console.</div>'; });
}
function postSquad(){
  var C=window._squadCtx||{}; if(!C.name) return;
  var note=(el('squadNote').value||'').trim().slice(0,140);
  if(note.length<6) return showToast('Add a real one-liner \u2014 destination, dates, party size');
  var contact=(el('squadContact').value||'').trim().slice(0,80);
  var todayKey='rw_squadday_'+new Date().toISOString().slice(0,10);
  var postedToday=parseInt(lsGet(todayKey)||'0',10);
  if(postedToday>=SQUAD_CAP_PER_DAY) return showToast('Daily post limit reached ('+SQUAD_CAP_PER_DAY+') \u2014 try again tomorrow');
  db.collection('squads').add({
    key:squadKey(C.name,C.month), destination:C.name, month:C.month, note:note, contact:contact,
    uid:user.uid, created:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    lsSet(todayKey, String(postedToday+1));
    el('squadNote').value=''; el('squadContact').value='';
    showToast('\ud83c\udf92 Posted to the Squad board'); xpAdd(8,'Posted a Trip Squad'); lsSet('rw_squad_count', String((parseInt(lsGet('rw_squad_count')||'0',10)||0)+1));
    loadSquads(C.name,C.month);
  }).catch(function(){ showToast('Could not post \u2014 check Firestore rules'); });
}
function delSquad(id){ if(!confirm('Remove this squad post?')) return;
  db.collection('squads').doc(id).delete().then(function(){ var C=window._squadCtx||{}; if(C.name) loadSquads(C.name,C.month); }); }
function reportSquad(id){
  db.collection('reports').add({type:'squad', targetId:id, by:(user&&user.uid)||'anon', created:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){ showToast('Reported \u2014 thank you, our team will review'); })
    .catch(function(){ showToast('Report failed \u2014 try again'); });
}

/* ===== 60-SECOND AI KEY WIZARD ===== */
var WIZ=[
 {p:'groq',n:'Groq (Llama 3.3 70B)',url:'https://console.groq.com/keys',why:'\u2705 No card ever \u00b7 fastest replies \u00b7 ~1,000 calls/day',ph:'gsk_\u2026',
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
  var prompt='Create a compact '+Math.min(days,5)+'-day itinerary for '+name+'. For each day give: a title and one line each for morning, afternoon, evening. Be specific with real place names. Max 140 words total.';
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
  box.innerHTML=
   '<div style="background:#0E1018;border:2px solid #C8913E;border-radius:10px;padding:18px;text-align:center;margin-bottom:8px">'
   +'<div style="font-size:9px;letter-spacing:.2em;color:#8A8880">A ROAMWISE PREMIUM ITINERARY</div>'
   +'<div style="font-family:Georgia,serif;font-weight:700;font-size:22px;color:#E8BA6C;margin:6px 0 2px">'+d.name.toUpperCase()+'</div>'
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
  return fetch('https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=640&redirects=1&format=json&origin=*&titles='+encodeURIComponent(q))
    .then(function(r){return r.json();}).then(function(d){
      var pgs=d.query&&d.query.pages; if(!pgs) return null;
      var k=Object.keys(pgs)[0];
      return (pgs[k]&&pgs[k].thumbnail&&pgs[k].thumbnail.source)||null;
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
var PDF_THEMES={
 beach:{deep:[10,42,56],acc:[32,178,170],line:'Sun, salt and slow mornings'},
 metro:{deep:[26,16,42],acc:[171,102,255],line:'Neon nights, skyline days'},
 sacred:{deep:[48,28,14],acc:[224,150,54],line:'Bells, rivers and quiet dawns'},
 tech:{deep:[8,22,38],acc:[64,156,255],line:'Glass towers, future streets'},
 peak:{deep:[16,22,36],acc:[136,116,190],line:'Thin air, tall silence'},
 classic:{deep:[14,16,24],acc:[200,145,62],line:'Old roads, new eyes'}};
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
    var THT=themeFor(d), THK=THT.key, TH={deep:THT.deep, acc:THT.acc, line:THT.line};
    var GOLD='#C8913E', GOLD2='#E8BA6C', CRIM='#C4302B', INK='#1A1A22', PAP='#F7F3EA', MUT='#6B675C', DARK='#0E1018';
    function wm(){
      pdf.setTextColor(229,212,178); pdf.setFont('helvetica','bold'); pdf.setFontSize(23);
      for(var wy=100;wy<790;wy+=128) for(var wx=-50;wx<640;wx+=185) pdf.text('ROAMWISE',wx,wy,{angle:31});
      if(window._pdfSample){ pdf.setTextColor(232,120,90); pdf.setFontSize(60);
        for(var sy=180;sy<760;sy+=200) pdf.text('SAMPLE',300,sy,{align:'center',angle:32}); }
    }
    function page(bg){ pdf.setFillColor(bg||PAP); pdf.rect(0,0,600,800,'F'); }
    function frame(){ pdf.setDrawColor(GOLD); pdf.setLineWidth(2); pdf.rect(18,18,564,764); pdf.setLineWidth(.6); pdf.rect(26,26,548,748); }
    function foot(pn){ pdf.setFillColor(DARK); pdf.rect(18,760,564,22,'F');
      pdf.setTextColor(GOLD2); pdf.setFontSize(8);
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
      pdf.setFillColor(TH.deep[0],TH.deep[1],TH.deep[2]); pdf.rect(0,0,600,800,'F');
      if(hero){ try{ pdf.addImage(hero,'JPEG',40,250,520,300);
        pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(2); pdf.rect(40,250,520,300);
      }catch(e){} }
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
        /* timeline */
        var slots=[
          ['07:30','\u2600\ufe0f Sunrise start', A? 'Beat every crowd \u2014 golden light + empty streets before the day begins.' : 'Sunrise walk \u2014 the city belongs to you for one hour.'],
          ['09:00','\ud83c\udfdb Morning', (A&&A.morning)||T2.morning||'Headline sight at opening time.'],
          ['11:30','\u2615 Pause', 'Coffee/chai stop \u2014 pick the busiest local caf\u00e9 you can find; busy = good.'],
          ['13:30','\ud83c\udf7d Lunch + afternoon', (A&&A.afternoon)||T2.afternoon||'Neighbourhood deep-dive after a local lunch.'],
          ['16:30','\ud83d\udcf8 Golden hour', 'Viewpoint or waterfront for the light; photos now, shopping after dark.'],
          ['19:00','\ud83c\udf19 Evening', (A&&A.evening)||T2.evening||'Food street dinner \u2014 order what the longest queue orders.']
        ];
        var dp=dayPics[i], TXW=452;
        if(dp){ try{ pdf.addImage(dp,'JPEG',384,102,172,116);
          pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.5); pdf.rect(384,102,172,116); TXW=286; }catch(e){ TXW=452; dp=null; } }
        var y=112; pdf.setDrawColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setLineWidth(1.4); pdf.line(58,y-4,58,y+slots.length*58-26);
        slots.forEach(function(sg,si){
          pdf.setFillColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.circle(58,y+6,4,'F');
          pdf.setTextColor(TH.acc[0],TH.acc[1],TH.acc[2]); pdf.setFont('helvetica','bold'); pdf.setFontSize(10.5); pdf.text(sg[0],74,y);
          pdf.setTextColor(INK); pdf.text(sg[1],112,y);
          pdf.setFont('helvetica','normal'); pdf.setFontSize(11);
          pdf.text(pdf.splitTextToSize(sg[2], (si<2&&dp)? TXW:452),74,y+15);
          y+=58;
        });
        /* food + tip + budget band */
        var fd=(A&&A.food)||((d.food||[])[i%Math.max(1,(d.food||[]).length)]||'');
        pdf.setFillColor('#F3E2C0'); pdf.roundedRect(44,y-8,512,58,7,7,'F');
        pdf.setTextColor('#7A2E1E'); pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
        pdf.text('\ud83c\udf5b EAT TODAY',56,y+8);
        pdf.setFont('helvetica','normal'); pdf.setTextColor(INK); pdf.setFontSize(10);
        pdf.text(pdf.splitTextToSize(fd||'Ask three locals one question: \u201cwhere do YOU eat?\u201d',300),56,y+22);
        pdf.setTextColor('#7A5A16'); pdf.setFontSize(9);
        pdf.text(pdf.splitTextToSize('\ud83e\udd77 '+((A&&A.tip)||T2.tip||'Carry small notes; big bills slow every purchase.'),190),380,y+8);
        if(perDay){ pdf.setTextColor(MUT); pdf.setFontSize(9.5);
          pdf.text('\ud83d\udcb0 Day budget ('+o.party.toLowerCase()+', '+o.pace.toLowerCase()+'): ~$'+Math.round(perDay*paceAdj*partyMul),44,y+66); }
        /* ---- Fill the previously-blank lower half with real, grounded data ----
           Two-column panel: destination fast facts (region/country/tags — all
           already in the database, not invented) + an actual crowd-by-month
           comparison (d.crowd is real per-destination data used elsewhere in
           the app, e.g. the ninja-hacks crowd-dodge callouts). */
        var fy = y + 84;
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
    });
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
  fetch('news.json',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){
    if(!d.items || !d.items.length){ g.innerHTML=''; el('newspulse').style.display='none'; return; }
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
    /* graceful no-op: the news.json file may not exist yet on a fresh site — hide, don't error */
    var sec=el('newspulse'); if(sec) sec.style.display='none';
  });
}

document.addEventListener('DOMContentLoaded', function(){
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
    /* The Film + subscribe now live INSIDE the creator section (folded at bottom) */
    try{
      var pf=el('promofilm'), cr=el('creator');
      if(pf && cr){ pf.classList.remove('v','v-home'); pf.style.margin='0'; cr.insertBefore(pf, cr.firstChild.nextSibling); }
    }catch(e){}
    [['ratings','\u2b50 Ratings & traveler wall'],['store','\ud83d\udecd Store'],['creator','\ud83c\udfd4\ufe0f About the creator \u00b7 The Film'],].forEach(function(f){
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

/* ===== PERKS — rewards for constructive use, not just clicking around ===== */
function perksData(){
  var xp=xpGet();
  var streak=parseInt(lsGet('rw_streak')||'0',10)||0;
  var wish=0; try{ wish=JSON.parse(lsGet('rw_wish')||'[]').length; }catch(e){}
  var pdfs=parseInt(lsGet('rw_pdf_count')||'0',10)||0;
  var squads=parseInt(lsGet('rw_squad_count')||'0',10)||0;
  var use={}; try{ use=JSON.parse(lsGet('rw_use')||'{}'); }catch(e){}
  var planUses=use.plan||0;
  return {xp:xp, streak:streak, wish:wish, pdfs:pdfs, squads:squads, planUses:planUses};
}
var PERKS=[
 {id:'scout', name:'Scout Badge', need:'3-day streak', icon:'\ud83e\udded',
  test:function(d){return d.streak>=3;}, prog:function(d){return [Math.min(d.streak,3),3];},
  reward:'Unlocks the trending-aware "For You" row a rank early'},
 {id:'planner', name:'Real Planner', need:'3 destinations searched + planned', icon:'\ud83d\uddfa\ufe0f',
  test:function(d){return d.planUses>=3;}, prog:function(d){return [Math.min(d.planUses,3),3];},
  reward:'+10% bonus XP on every future itinerary build'},
 {id:'curator', name:'Curator', need:'2 places saved to your wishlist', icon:'\u2665',
  test:function(d){return d.wish>=2;}, prog:function(d){return [Math.min(d.wish,2),2];},
  reward:'Your wishlist can now be turned into a Lifetime List reel'},
 {id:'documented', name:'Documented', need:'1 premium PDF generated', icon:'\ud83d\udcd5',
  test:function(d){return d.pdfs>=1;}, prog:function(d){return [Math.min(d.pdfs,1),1];},
  reward:'Unlocked: one free Journey Movie render (normally \u20b950)'},
 {id:'connector', name:'Connector', need:'1 Trip Squad posted', icon:'\ud83c\udf92',
  test:function(d){return d.squads>=1;}, prog:function(d){return [Math.min(d.squads,1),1];},
  reward:'Your squad posts get a small visibility boost'},
 {id:'shadow', name:'\ud83e\udd77 Shadow Clone (secret)', need:'Reach Jonin rank (300 XP) + 3 perks unlocked', icon:'\ud83c\udf11', secret:true,
  test:function(d){ var others=PERKS.slice(0,5).filter(function(p){return p.test(d);}).length; return d.xp>=300 && others>=3; },
  prog:function(d){ var others=PERKS.slice(0,5).filter(function(p){return p.test(d);}).length; return [Math.min(others,3), 3]; },
  reward:'Unlocks the hidden Shadow Clone Journey Card style'}
];
function perksUnlocked(){ var d=perksData(); return PERKS.filter(function(p){ return p.test(d); }).map(function(p){return p.id;}); }
function hasShadowStyle(){ return perksUnlocked().indexOf('shadow')>-1; }
function renderPerks(){
  var d=perksData(), un=perksUnlocked();
  return PERKS.map(function(p){
    var on=un.indexOf(p.id)>-1, pr=p.prog(d), pct=Math.round(pr[0]/pr[1]*100);
    if(p.secret && !on) return '<div class="ti-day" style="opacity:.55;align-items:center"><b>\ud83d\udd12</b><span style="flex:1"><b style="color:var(--t2)">??? Secret Perk</b><br><span style="font-size:10.5px;color:var(--t3)">Keep exploring to reveal it</span></span></div>';
    return '<div class="ti-day" style="align-items:center;'+(on?'':'opacity:.7')+'"><b>'+(on?p.icon:'\ud83d\udd12')+'</b><span style="flex:1"><b style="color:'+(on?'var(--gold2)':'var(--t2)')+'">'+p.name+'</b> \u2014 <span style="font-size:11px;color:var(--t3)">'+p.need+'</span>'
      +(on? '<br><span style="font-size:10.5px;color:#16BF96">\u2713 '+p.reward+'</span>' : '<div class="xp-bar" style="margin-top:5px"><div class="xp-fill" style="width:'+pct+'%"></div></div>')
      +'</span></div>';
  }).join('');
}

/* ===== SHINOBI XP — traveler ranks ===== */
var RANKS=[[0,'Genin'],[100,'Chunin'],[300,'Jonin'],[700,'ANBU'],[1500,'Kage']];
function xpGet(){ return parseInt(lsGet('rw_xp')||'0',10)||0; }
function rankOf(x){ var r=RANKS[0]; for(var i=0;i<RANKS.length;i++) if(x>=RANKS[i][0]) r=RANKS[i]; return r; }
function nextRank(x){ for(var i=0;i<RANKS.length;i++) if(x<RANKS[i][0]) return RANKS[i]; return null; }
function xpAdd(n, why){
  var was=rankOf(xpGet())[1];
  var x=xpGet()+n; lsSet('rw_xp',String(x));
  var now=rankOf(x)[1];
  showToast('+'+n+' XP \u2014 '+why);
  if(now!==was) setTimeout(function(){ showToast('\ud83e\udd77 RANK UP! You are now '+now); },1400);
  xpPaint();
}
function xpPaint(){
  var x=xpGet(), r=rankOf(x), nx=nextRank(x);
  var c=el('xpChipTxt'); if(c) c.textContent=r[1]+' \u00b7 '+x;
  var d=el('drXp'); if(d){
    var pct = nx? Math.min(100,Math.round((x-r[0])/(nx[0]-r[0])*100)) : 100;
    d.innerHTML='<div class="rk">\ud83e\udd77 <span>'+r[1]+'</span> \u00b7 '+x+' XP</div>'
      +'<div class="xp-bar"><div class="xp-fill" style="width:'+pct+'%"></div></div>'
      +'<div class="xh">'+(nx? (nx[0]-x)+' XP to '+nx[1]+' \u2014 search, explore treks & share to earn' : 'Maximum rank \u2014 the village is proud')+'</div>';
  }
}
(function(){ /* daily streak bonus */
  try{
    var today=new Date().toDateString();
    if(lsGet('rw_day')!==today){
      lsSet('rw_day',today);
      var st=parseInt(lsGet('rw_streak')||'0',10)||0;
      var yest=new Date(Date.now()-864e5).toDateString();
      st = (lsGet('rw_prevday')===yest)? st+1 : 1;
      lsSet('rw_streak',String(st)); lsSet('rw_prevday',today);
      setTimeout(function(){ xpAdd(20*Math.min(st,3),'Daily return \u00b7 '+st+'-day streak'); },3200);
    } else xpPaint();
  }catch(e){}
})();

/* ===== SHARE / VIRALITY ===== */
var APP_URL_SHARE='https://www.roamwise.co.in';
function doShare(txt){
  if(navigator.share){ navigator.share({title:'RoamWise Pro',text:txt,url:APP_URL_SHARE}).then(function(){xpAdd(15,'Shared \u2014 spreading the word');}).catch(function(){}); }
  else{ window.open('https://wa.me/?text='+encodeURIComponent(txt+' '+APP_URL_SHARE),'_blank'); xpAdd(15,'Shared \u2014 spreading the word'); }
}
function shareApp(what){
  var m={app:'\ud83e\udd77 Found a travel app that shows the LEAST crowded month for any place on Earth + ninja hacks. \u20b9100 lifetime, no subscription.',
    treks:'\u26f0\ufe0f This app has a Trek Vault \u2014 popular, hidden, dangerous & newly-opened treks with itineraries. Check it:',
    exps:'\u2728 Offbeat experiences list on this travel app is insane \u2014 bioluminescent kayaking, snow-leopard tracking...'};
  doShare(m[what]||m.app);
}
function shareTrek(i){ var t=TREKS[i]; doShare('\u26f0\ufe0f '+t.n+' ('+t.w+') \u2014 '+t.d+' days, '+t.alt+'m. Full itinerary on RoamWise:'); }

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

/* ===== JOURNEY LOG + DIGITAL CARD ===== */
function logGet(){ return JSON.parse(lsGet('rw_log')||'[]'); }
function logPaint(){
  var box=el('logChips'); if(!box) return;
  var L=logGet();
  box.innerHTML = L.length? L.map(function(p,i){return '<span class="log-chip">\ud83d\udccd '+logName(p)+'<button onclick="logDel('+i+')">\u00d7</button></span>';}).join('')
    : '<span style="font-size:11px;color:var(--t3)">No journeys logged yet \u2014 add your first above.</span>';
}
/* Common compound city names people type without a space — the geocoding
   API does exact-ish string matching, so "Newyork" literally matched a
   tiny real village in Scotland instead of New York City. This normalizes
   the handful of most common cases before searching. */
var CITY_NAME_FIXUPS = {
  'newyork':'New York', 'losangeles':'Los Angeles', 'sanfrancisco':'San Francisco',
  'saopaulo':'Sao Paulo', 'hongkong':'Hong Kong', 'newdelhi':'New Delhi',
  'capetown':'Cape Town', 'buenosaires':'Buenos Aires', 'kualalumpur':'Kuala Lumpur',
  'lasvegas':'Las Vegas', 'saltlakecity':'Salt Lake City'
};
function logAdd(){
  var v=(el('logInput').value||'').trim(); if(!v) return;
  if(v.length>40) v=v.slice(0,40);
  v=v.replace(/[<>]/g,'');
  var fixup = CITY_NAME_FIXUPS[v.toLowerCase().replace(/[^a-z]/g,'')];
  if(fixup) v = fixup;
  var L=logGet(); var entry={n:v}; L.push(entry); lsSet('rw_log',JSON.stringify(L));
  el('logInput').value=''; logPaint();
  /* free geocoding — Open-Meteo, no key */
  var q=v.replace(/\b(19|20)\d\d\b/g,'').trim();
  fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(q))
    .then(function(r){return r.json();}).then(function(j){
      var g=(j.results||[])[0]; if(!g) return;
      var L2=logGet();
      for(var i=L2.length-1;i>=0;i--){ var e=L2[i]; if((e.n||e)===v && e.lat===undefined){
        L2[i]={n:v,lat:g.latitude,lon:g.longitude,country:g.country||'',countryCode:g.country_code||''};
        showToast('\ud83d\udccd Logged '+v+' \u2014 '+(g.country||'located')); break; } }
      lsSet('rw_log',JSON.stringify(L2));
    }).catch(function(){});
}
function logName(e){ return typeof e==='string'? e : e.n; }
function logDel(i){ var L=logGet(); L.splice(i,1); lsSet('rw_log',JSON.stringify(L)); logPaint(); }
logPaint();
function askName(cb){
  var n = lsGet('rw_name') || (window.user && user.displayName) || '';
  if(!n){
    n = prompt('Your name for the Journey Card (appears as the title):','') || 'A Wanderer';
    n = n.trim().slice(0,24) || 'A Wanderer';
  }
  lsSet('rw_name', n); cb(n);
}
function makeCard(){
  var L=logGet(); if(!L.length) return showToast('Log at least one place first');
  askName(function(name){
    /* Painting-grade dark world map — CARTO tiles, zoom 3 (8x8 grid) */
    var Z=3, N=8, need=N*N, fail=false, tiles=[]; tiles.N=N;
    showToast('Painting your world\u2026 \ud83c\udfa8 (fetching your cover photo too)');
    for(var ty=0;ty<N;ty++) for(var tx=0;tx<N;tx++) (function(tx,ty){
      var im=new Image(); im.crossOrigin='anonymous';
      im.onload=function(){ tiles[ty*N+tx]=im; if(--need===0) after(); };
      im.onerror=function(){ fail=true; if(--need===0) after(); };
      im.src='https://'+(['a','b','c'][ (tx+ty)%3 ])+'.basemaps.cartocdn.com/rastertiles/voyager/'+Z+'/'+tx+'/'+ty+'.png';
    })(tx,ty);
    /* real destination photo for the cinematic cover backdrop — the flagship/most-recent place.
       Uses fetchImg64 (fetch -> blob -> dataURL), the SAME proven path the PDF pipeline uses —
       this keeps the resulting <img> same-origin so the canvas never gets tainted (toDataURL
       must keep working for save/share). Hard timeout: never let a slow fetch block the card. */
    var heroName = logName(L[L.length-1]) || logName(L[0]);
    var heroImg = null, heroDone = false, heroTimer=setTimeout(function(){ if(!heroDone){ heroDone=true; maybeGo(); } }, 8000);
    imgTry([
      function(){ return wikiThumb(heroName); },
      function(){ return wikiAction(heroName); },
      function(){ return wikiAction(heroName.split(',')[0]); }
    ]).then(function(u){ if(heroDone) return null; if(!u) return null; return fetchImg64(u); })
    .then(function(dataUrl){ if(heroDone) return; if(!dataUrl){ heroDone=true; clearTimeout(heroTimer); maybeGo(); return; }
      var im2=new Image();
      im2.onload=function(){ if(heroDone) return; heroImg=im2; heroDone=true; clearTimeout(heroTimer); maybeGo(); };
      im2.onerror=function(){ if(heroDone) return; heroDone=true; clearTimeout(heroTimer); maybeGo(); };
      im2.src=dataUrl;
    }).catch(function(){ if(heroDone) return; heroDone=true; clearTimeout(heroTimer); maybeGo(); });
    var tilesReady=false;
    function after(){ tilesReady=true; maybeGo(); }
    function maybeGo(){ if(tilesReady && heroDone) drawCard(L,name,fail?null:tiles,heroImg); }
  });
}
function mercY(lat,H){ var r=lat*Math.PI/180; return (1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*H; }
var PRAISE={Genin:'Every legend begins with a single step \u2014 yours already covers the map.',
 Chunin:'The roads are starting to learn this name.',
 Jonin:'A seasoned wanderer \u2014 borders bend around such travelers.',
 ANBU:'Moving through the world the way wind moves through pines.',
 Kage:'Master of the wandering arts. The map keeps this one\u2019s secrets.'};
var CARD_STYLES={
 atlas:{label:'Classic Atlas',bg:['#0B0D18','#10101F','#160D13'],pin:'#C4302B',pinCore:'#E8BA6C',pinTxt:'#0A0A12',trail:null,accent:'#E8BA6C',capFont:'Georgia,serif',tint:null},
 noir:{label:'Minimal Noir',bg:['#0A0A0E','#0E0E13','#0A0A0E'],pin:'#F2EFE8',pinCore:'#0A0A0E',pinTxt:'#F2EFE8',trail:'#B8B4A8',accent:'#EDEAE2',capFont:'Outfit,Arial',tint:['rgba(0,0,0,.28)','rgba(255,255,255,.05)']},
 neon:{label:'Neon Voyage',bg:['#070113','#0E0330','#12042E'],pin:'#FF2E9A',pinCore:'#070113',pinTxt:'#FF2E9A',trail:'#00E5FF',accent:'#00E5FF',capFont:'Outfit,Arial',tint:['rgba(0,229,255,.07)','rgba(255,46,154,.06)']},
 shadow:{label:'\ud83e\udd77 Shadow Clone',bg:['#050505','#0B0808','#050505'],pin:'#E8BA6C',pinCore:'#050505',pinTxt:'#E8BA6C',trail:'#C4302B',accent:'#E8BA6C',capFont:'Georgia,serif',tint:['rgba(196,48,43,.10)','rgba(0,0,0,.35)'],secret:true}};
function cardStyleGet(){ return CARD_STYLES[lsGet('rw_cardstyle')||'neon']||CARD_STYLES.neon; }
function setCardStyle(k){ lsSet('rw_cardstyle',k);
  document.querySelectorAll('.cstyle').forEach(function(b){ b.classList.toggle('red', b.dataset.k===k); });
  showToast(CARD_STYLES[k].label+' style armed'); makeCard(); }
function drawCard(L, name, tiles, heroPhoto){
  var ST=cardStyleGet();
  var W=1200,H=1600,c=document.createElement('canvas');
  c.width=W*2; c.height=H*2;                    /* 2400x3200 \u2014 print-grade */
  var x=c.getContext('2d'); x.scale(2,2);
  window._rwCard=c;
  /* canvas backdrop */
  var bg=x.createLinearGradient(0,0,W,H); bg.addColorStop(0,ST.bg[0]); bg.addColorStop(.55,ST.bg[1]); bg.addColorStop(1,ST.bg[2]);
  x.fillStyle=bg; x.fillRect(0,0,W,H);
  /* watermark weave */
  x.save(); x.globalAlpha=0.04; x.fillStyle='#E8BA6C'; x.font='700 40px Outfit,Arial';
  x.translate(W/2,H/2); x.rotate(-Math.PI/8);
  for(var wy=-H;wy<H;wy+=120) for(var wx=-W;wx<W;wx+=330) x.fillText('ROAMWISE',wx,wy);
  x.restore();
  /* vignette */
  var vg=x.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.5)');
  x.fillStyle=vg; x.fillRect(0,0,W,H);
  /* double gold frame + corner ticks */
  x.strokeStyle='rgba(232,186,108,.85)'; x.lineWidth=3; x.strokeRect(26,26,W-52,H-52);
  x.strokeStyle='rgba(232,186,108,.3)';  x.lineWidth=1; x.strokeRect(40,40,W-80,H-80);
  x.strokeStyle='#E8BA6C'; x.lineWidth=3;
  [[26,26],[W-26,26],[26,H-26],[W-26,H-26]].forEach(function(p){
    x.beginPath(); x.moveTo(p[0]-(p[0]>W/2?26:-26),p[1]); x.lineTo(p[0],p[1]); x.lineTo(p[0],p[1]-(p[1]>H/2?26:-26)); x.stroke();
  });
  /* ===== CINEMATIC PHOTO HERO (poster-style, like a real destination cover) ===== */
  var HY=48, HH=272, HX=48, HW=W-96;
  x.save(); x.beginPath(); x.rect(HX,HY,HW,HH); x.clip();
  if(heroPhoto){
    var ir=heroPhoto.width/heroPhoto.height, tr=HW/HH, sx2,sy2,sw2,sh2;
    if(ir>tr){ sh2=heroPhoto.height; sw2=sh2*tr; sx2=(heroPhoto.width-sw2)/2; sy2=0; }
    else { sw2=heroPhoto.width; sh2=sw2/tr; sx2=0; sy2=(heroPhoto.height-sh2)/2; }
    x.drawImage(heroPhoto, sx2,sy2,sw2,sh2, HX,HY,HW,HH);
    /* film grade: subtle style-accent tint on the photo */
    x.globalCompositeOperation='soft-light'; x.fillStyle=ST.accent+'22'; x.fillRect(HX,HY,HW,HH);
    x.globalCompositeOperation='source-over';
  } else {
    var hg=x.createLinearGradient(HX,HY,HX,HY+HH); hg.addColorStop(0,ST.bg[1]); hg.addColorStop(1,ST.bg[2]);
    x.fillStyle=hg; x.fillRect(HX,HY,HW,HH);
  }
  /* bottom gradient so title text always reads */
  var tg=x.createLinearGradient(HX,HY,HX,HY+HH); tg.addColorStop(0,'rgba(6,7,12,.15)'); tg.addColorStop(0.55,'rgba(6,7,12,.35)'); tg.addColorStop(1,'rgba(6,7,12,.92)');
  x.fillStyle=tg; x.fillRect(HX,HY,HW,HH);
  /* light rays (subtle, cinematic) */
  x.save(); x.globalAlpha=.10; x.fillStyle='#fff';
  for(var lr=0; lr<5; lr++){ x.save(); x.translate(HX+HW*(0.15+lr*0.18), HY); x.rotate(-0.12+lr*0.05);
    x.beginPath(); x.moveTo(0,0); x.lineTo(40,0); x.lineTo(-30,HH); x.lineTo(-70,HH); x.closePath(); x.fill(); x.restore(); }
  x.restore();
  x.restore(); /* end hero clip */
  x.strokeStyle=ST.accent; x.lineWidth=2; x.strokeRect(HX,HY,HW,HH);
  /* title over the photo, poster-style */
  x.textAlign='center';
  x.fillStyle='rgba(255,255,255,.72)'; x.font='600 13px Outfit,Arial';
  x.fillText('T H E   J O U R N E Y   M A P   O F', W/2, HY+HH-84);
  x.fillStyle='#fff'; x.font='700 52px Georgia,serif';
  x.save(); x.shadowColor='rgba(0,0,0,.6)'; x.shadowBlur=14;
  x.fillText(name, W/2, HY+HH-38); x.restore();
  var xp=xpGet(), r=rankOf(xp), streak=parseInt(lsGet('rw_streak')||'0',10)||0;
  var dnaArr=JSON.parse(lsGet('rw_dna')||'null');
  var vibe=dnaArr? ['Adventure','Culture','Chill','Party'][dnaArr[1]]||'' : '';
  x.fillStyle=ST.accent; x.font='italic 400 16px Georgia,serif';
  x.fillText('\u201c'+(PRAISE[r[1]]||PRAISE.Genin)+'\u201d', W/2, HY+HH+30);
  /* ===== MAP PLATE ===== */
  var MX=70, MY=HY+HH+56, MW=W-140, MH=Math.round(MW*0.62);
  x.save();
  x.shadowColor='rgba(0,0,0,.6)'; x.shadowBlur=26; x.shadowOffsetY=8;
  x.fillStyle='#0A0A12'; x.fillRect(MX-6,MY-6,MW+12,MH+12);
  x.restore();
  if(tiles){
    var TN=tiles.N||4, tw=MW/TN, th=MH/TN;
    for(var ty=0;ty<TN;ty++) for(var tx=0;tx<TN;tx++){
      var im=tiles[ty*TN+tx]; if(im) x.drawImage(im, MX+tx*tw, MY+ty*th, tw, th);
    }
    /* deepen the light basemap into a moody premium tone (multiply darkens, soft-light adds mood, style accent tints it) */
    x.save();
    x.globalCompositeOperation='multiply'; x.fillStyle='rgba(150,148,168,1)'; x.fillRect(MX,MY,MW,MH);
    x.globalCompositeOperation='soft-light'; x.fillStyle=ST.bg[0]; x.globalAlpha=.55; x.fillRect(MX,MY,MW,MH); x.globalAlpha=1;
    x.globalCompositeOperation='overlay'; x.fillStyle=ST.accent; x.globalAlpha=.06; x.fillRect(MX,MY,MW,MH); x.globalAlpha=1;
    x.restore();
    x.save(); x.shadowColor='rgba(0,0,0,.5)'; x.shadowBlur=30; x.strokeStyle=ST.accent; x.lineWidth=0; x.restore();
    /* lat/long graticule with labels */
    x.save(); x.beginPath(); x.rect(MX,MY,MW,MH); x.clip();
    x.strokeStyle='rgba(255,255,255,.18)'; x.fillStyle='rgba(255,255,255,.5)'; x.lineWidth=1; x.font='600 11px Outfit,Arial';
    for(var lo=-180; lo<=180; lo+=30){ var gx=MX+(lo+180)/360*MW;
      x.beginPath(); x.moveTo(gx,MY); x.lineTo(gx,MY+MH); x.stroke();
      x.textAlign='center'; x.fillText((lo>0?lo+'\u00b0E':lo<0?(-lo)+'\u00b0W':'0\u00b0'), gx, MY+MH-6); }
    for(var la=-60; la<=75; la+=30){ var gy=MY+mercY(la,MH);
      if(gy<MY||gy>MY+MH) continue;
      x.beginPath(); x.moveTo(MX,gy); x.lineTo(MX+MW,gy); x.stroke();
      x.textAlign='left'; x.fillText((la>0?la+'\u00b0N':la<0?(-la)+'\u00b0S':'0\u00b0'), MX+4, gy-4); }
    x.restore(); x.textAlign='left';
  } else {
    /* offline fallback \u2014 stylized continents */
    x.fillStyle='#141225'; x.fillRect(MX,MY,MW,MH);
    var CONT=['M28 38l30-12 26 6 8 18-16 22-20 26-10-2-6-24-14-14z','M84 96l14 4 6 16-8 26-12 6-8-20z','M150 30l30-10 22 8 6 14-10 10-16 26-14 6-12-18-10-16z','M158 92l16-4 14 10 4 20-14 20-14-6-8-22z','M214 26l52-8 34 10 14 20-16 18-28 12-24 20-18-8-12-26-8-22z','M282 108l22 2 12 14-8 14-22 2-10-16z'];
    x.save(); x.translate(MX,MY); x.scale(MW/360, MH/160);
    x.fillStyle='#2E2745'; CONT.forEach(function(pd){ x.fill(new Path2D(pd)); }); x.restore();
  }
  x.strokeStyle='#E8BA6C'; x.lineWidth=2.5; x.strokeRect(MX,MY,MW,MH);
  /* pins + arcs */
  function proj(e){
    if(typeof e.lat!=='number' || typeof e.lon!=='number' || !isFinite(e.lat) || !isFinite(e.lon)) return null;
    return [MX+(e.lon+180)/360*MW, MY+mercY(Math.max(-84,Math.min(84,e.lat)),MH)]; }
  var pts=[], legend=[];
  L.forEach(function(e,i){ var p=proj(e); legend.push({n:logName(e),p:p}); if(p) pts.push({p:p,num:legend.length}); });
  if(ST.tint){ x.save(); x.globalCompositeOperation='soft-light'; x.fillStyle=ST.tint[0]; x.fillRect(0,0,W,H);
    x.globalCompositeOperation='overlay'; x.fillStyle=ST.tint[1]; x.fillRect(0,0,W,H); x.restore(); }
  window._rwCine={pts:pts.map(function(o){return {x:o.p[0],y:o.p[1],num:o.num};}), names:legend.map(function(g){return g.n;}), name:name, W:W, H:H, style:lsGet('rw_cardstyle')||'neon'};
  /* golden arcs between consecutive located pins */
  x.save(); x.setLineDash([7,6]); x.lineWidth=2.6;
  x.beginPath(); x.rect(MX,MY,MW,MH); x.clip();   /* arcs stay inside the map plate */
  for(var i=0;i<pts.length-1;i++){
    var a=pts[i].p, b=pts[i+1].p;
    if(!a||!b) continue;
    if(ST.trail){ x.strokeStyle=ST.trail; }
    else { var grad=x.createLinearGradient(a[0],a[1],b[0],b[1]);
      grad.addColorStop(0,'rgba(232,186,108,.9)'); grad.addColorStop(1,'rgba(196,48,43,.9)');
      x.strokeStyle=grad; }
    x.beginPath();
    if(Math.abs(a[0]-b[0]) > MW*0.55){ x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); }   /* huge hops: straight, no wild arc */
    else { var my2=Math.max(MY+8, Math.min(a[1],b[1]) - Math.min(70, Math.abs(a[0]-b[0])*0.25) - 12);
      x.moveTo(a[0],a[1]); x.quadraticCurveTo((a[0]+b[0])/2, my2, b[0], b[1]); }
    x.stroke();
  }
  x.restore();
  /* numbered glowing pins */
  x.save(); x.beginPath(); x.rect(MX,MY,MW,MH); x.clip();
  pts.forEach(function(o,idx){
    var p=o.p, nm=(legend[o.num-1]&&legend[o.num-1].n||'').slice(0,18);
    /* label chip */
    x.font='700 15px Outfit,Arial'; var tw2=x.measureText(nm).width;
    var lx=Math.min(MX+MW-tw2-16, Math.max(MX+4, p[0]+16)), lyy=Math.max(MY+16,p[1]-10);
    x.fillStyle='rgba(7,9,15,.72)'; x.fillRect(lx-6, lyy-15, tw2+12, 22);
    x.fillStyle=ST.accent; x.textAlign='left'; x.fillText(nm, lx, lyy);
    /* pin */
    x.save(); x.shadowColor=ST.trail||ST.pin; x.shadowBlur=20;
    x.fillStyle=ST.pin; x.beginPath(); x.arc(p[0],p[1],16,0,7); x.fill(); x.restore();
    x.fillStyle=ST.pinCore; x.beginPath(); x.arc(p[0],p[1],11,0,7); x.fill();
    x.fillStyle=ST.pinTxt; x.font='700 14px Outfit,Arial'; x.textAlign='center';
    x.fillText(String(o.num), p[0], p[1]+5);
  });
  x.restore(); x.textAlign='left';
  x.fillStyle='#54524C'; x.font='400 10px Outfit,Arial'; x.textAlign='right';
  x.fillText('Map \u00a9 OpenStreetMap contributors \u00a9 CARTO', MX+MW-6, MY+MH-8);
  /* ===== LEGEND \u2014 two columns, numbered ===== */
  x.textAlign='left';
  x.fillStyle='#E8BA6C'; x.font='700 16px Outfit,Arial';
  x.fillText('T H E   J O U R N E Y S', MX, MY+MH+56);
  x.strokeStyle='rgba(232,186,108,.3)'; x.lineWidth=1;
  x.beginPath(); x.moveTo(MX+190,MY+MH+51); x.lineTo(MX+MW,MY+MH+51); x.stroke();
  var colW=MW/2, ly0=MY+MH+92, show=legend.slice(0,14);
  show.forEach(function(g,i){
    var cx2=MX+(i%2)*colW, cy2=ly0+Math.floor(i/2)*42;
    x.fillStyle='#C4302B'; x.beginPath(); x.arc(cx2+9,cy2-5,9,0,7); x.fill();
    x.fillStyle='#E8BA6C'; x.font='700 10px Outfit,Arial'; x.textAlign='center'; x.fillText(String(i+1),cx2+9,cy2-1);
    x.textAlign='left'; x.fillStyle='#EDE8DF'; x.font='500 17px Georgia,serif';
    x.fillText(g.n.slice(0,30), cx2+28, cy2);
  });
  if(legend.length>14){ x.fillStyle='#8A8880'; x.font='italic 14px Georgia,serif';
    x.fillText('\u2026 and '+(legend.length-14)+' more roads', MX, ly0+7*42+8); }
  /* ===== DECOR BAND — Himalayan silhouette + compass ===== */
  var artY=H-330;
  x.save(); x.globalAlpha=.5;
  var rg=x.createLinearGradient(0,artY-60,0,artY+40);
  rg.addColorStop(0,'rgba(232,186,108,0)'); rg.addColorStop(1,'rgba(232,186,108,.28)');
  x.fillStyle=rg;
  x.beginPath(); x.moveTo(60,artY+40);
  var ridge=[[60,10],[150,-38],[230,-8],[320,-62],[400,-20],[470,-70],[560,-14],[650,-52],[730,-6],[820,-44],[900,-12],[1000,-58],[1080,-4],[1140,-30]];
  ridge.forEach(function(pt){ x.lineTo(pt[0],artY+pt[1]); });
  x.lineTo(W-60,artY+40); x.closePath(); x.fill();
  x.restore();
  /* snow caps */
  x.fillStyle='rgba(250,240,225,.5)';
  [[320,-62],[470,-70],[1000,-58]].forEach(function(pt){
    x.beginPath(); x.moveTo(pt[0]-14,artY+pt[1]+16); x.lineTo(pt[0],artY+pt[1]); x.lineTo(pt[0]+14,artY+pt[1]+16); x.closePath(); x.fill();
  });
  /* faint compass rose */
  x.save(); x.globalAlpha=.35; x.strokeStyle='#E8BA6C'; x.lineWidth=1.5;
  var ccx=W-150, ccy=artY-70;
  x.beginPath(); x.arc(ccx,ccy,42,0,7); x.stroke();
  x.beginPath(); x.arc(ccx,ccy,30,0,7); x.stroke();
  for(var ca=0;ca<8;ca++){ var rr2=ca%2?34:46, an=ca*Math.PI/4;
    x.beginPath(); x.moveTo(ccx,ccy); x.lineTo(ccx+Math.cos(an)*rr2, ccy+Math.sin(an)*rr2); x.stroke(); }
  x.fillStyle='#E8BA6C'; x.font='700 12px Georgia,serif'; x.textAlign='center'; x.fillText('N', ccx, ccy-50);
  x.restore(); x.textAlign='left';
  /* ===== STATS STRIP ===== */
  var sy=H-262, boxes=[['\ud83e\udd77 '+r[1].toUpperCase(),'traveler rank'],[xp+' XP','experience'],[String(L.length),'journeys'],[streak+' days','streak'+(vibe?'':'')]];
  if(vibe) boxes[3]=[vibe,'soul \u00b7 '+streak+'-day streak'];
  var bw=(W-172)/4;
  boxes.forEach(function(b2,i){
    var bx=86+i*bw;
    x.strokeStyle='rgba(232,186,108,.3)'; x.lineWidth=1; x.strokeRect(bx+6,sy,bw-12,74);
    x.fillStyle='#E8BA6C'; x.font='700 20px Outfit,Arial'; x.textAlign='center';
    x.fillText(b2[0], bx+bw/2, sy+32);
    x.fillStyle='#8A8880'; x.font='400 11px Outfit,Arial';
    x.fillText(b2[1].toUpperCase(), bx+bw/2, sy+54);
  });
  if(isPro){ x.fillStyle='#E8BA6C'; x.font='700 15px Outfit,Arial'; x.textAlign='center';
    x.fillText('\ud83d\udc51 LIFETIME PRO MEMBER', W/2, sy-16); }
  /* ===== CERTIFICATE OF ACHIEVEMENT: seal + signature + date ===== */
  var dateStr=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  var certY=H-152;
  x.textAlign='center';
  x.fillStyle=ST.accent; x.font='700 15px Georgia,serif';
  x.fillText('C E R T I F I C A T E   O F   A C H I E V E M E N T', W/2, certY);
  x.strokeStyle=(ST.trail||ST.accent); x.globalAlpha=.5; x.lineWidth=1;
  x.beginPath(); x.moveTo(W/2-210,certY+10); x.lineTo(W/2+210,certY+10); x.stroke(); x.globalAlpha=1;
  x.fillStyle='#B8B4A8'; x.font='400 12px Georgia,serif';
  x.fillText('This certifies that '+name+' has journeyed '+L.length+' destination'+(L.length===1?'':'s')+' \u00b7 rank of '+r[1], W/2, certY+30);
  /* wax-style circular seal (left) */
  var sx2=150, syl=certY+36;
  x.save(); x.translate(sx2,syl);
  x.fillStyle=(ST.pin); x.globalAlpha=.9;
  x.beginPath(); for(var pa=0;pa<16;pa++){ var an=pa*Math.PI/8, rr=pa%2?30:36; x[pa?'lineTo':'moveTo'](Math.cos(an)*rr,Math.sin(an)*rr); } x.closePath(); x.fill();
  x.globalAlpha=1; x.strokeStyle='rgba(255,255,255,.6)'; x.lineWidth=1.5; x.beginPath(); x.arc(0,0,24,0,7); x.stroke();
  x.fillStyle='#fff'; x.font='700 13px Georgia,serif'; x.textAlign='center'; x.fillText('RW',0,-2);
  x.font='600 7px Outfit,Arial'; x.fillText('VERIFIED',0,10);
  x.restore();
  /* signature (right) */
  x.textAlign='center';
  x.strokeStyle=ST.accent; x.lineWidth=2; x.globalAlpha=.9;
  x.beginPath();
  var gx0=W-260, gy0=certY+40;
  x.moveTo(gx0,gy0);
  x.bezierCurveTo(gx0+30,gy0-22, gx0+50,gy0+20, gx0+80,gy0-6);
  x.bezierCurveTo(gx0+100,gy0-20, gx0+120,gy0+14, gx0+170,gy0-10);
  x.stroke(); x.globalAlpha=1;
  x.fillStyle='#B8B4A8'; x.font='italic 400 12px Georgia,serif';
  x.fillText('Mohit Pandey \u00b7 Founder, RoamWise', W-175, certY+58);
  /* footer brand + date */
  x.fillStyle='#8A8880'; x.font='600 12px Outfit,Arial';
  x.fillText('\ud83e\udd77  R O A M W I S E   \u00b7   www.roamwise.co.in', W/2, H-40);
  x.fillStyle=ST.accent; x.font='700 12px Outfit,Arial';
  x.fillText('Issued '+dateStr, W/2, H-22);
  x.textAlign='left';
  /* output */
  var url=c.toDataURL('image/png');
  el('cardImg').src=url; el('cardImg').style.display='block';
  el('cardBtns').style.display='flex';
  var mb=el('movieBtn'); if(mb) mb.style.display='block';
  var shc=el('shadowChip'); if(shc) shc.style.display = hasShadowStyle()? 'block':'none';
  var un=L.filter(function(e){return e.lat===undefined;}).length;
  if(un) showToast(un+' place(s) still locating \u2014 regenerate in a minute for full pins');
  else showToast('Souvenir-grade \u2014 2400\u00d73200px, ready to print & frame \ud83d\uddbc\ufe0f');
  if(!lsGet('rw_card_xp')){ lsSet('rw_card_xp','1'); xpAdd(25,'Journey Card forged'); }
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
/* ===== ATLAS CERTIFICATE — self-contained downloadable HTML journey certificate =====
 * Design tokens (palette, ornate-double border, filter-based layer tabs, percentage-
 * positioned pins) reverse-engineered honestly from a Tailwind-compiled reference the
 * user shared — NOT copied code, just the same proven recipe, rebuilt from scratch
 * using our own real journey data and existing card canvas as the map image. */
function haversine(a,b){
  var R=6371, toRad=function(d){return d*Math.PI/180;};
  var dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon);
  var s=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return R*2*Math.asin(Math.sqrt(s));
}
async function downloadAtlasCertificate(){
  if(!window._rwCard || !window._rwCine){ showToast('Forge your Journey Card first — then the certificate'); return; }
  showToast('📜 Engraving your Atlas Certificate…');
  var C=_rwCine, L=logGet();
  var PR={}; try{ PR=JSON.parse(lsGet('rw_profile')||'{}'); }catch(e){}
  var name=PR.name||lsGet('rw_name')||'A Traveler';
  var xp=xpGet(), r=rankOf(xp);
  var withCoords=L.filter(function(e){ return typeof e.lat==='number' && typeof e.lon==='number'; });
  var countries={}, dist=0;
  var continents={};
  withCoords.forEach(function(e,i){ if(e.country) countries[e.country]=1; var c=continentFor(e); if(c) continents[c]=1; if(i>0) dist+=haversine(withCoords[i-1],e); });
  var countryCount=Object.keys(countries).length || Math.max(1,Math.round(withCoords.length*0.6));
  var continentCount=Object.keys(continents).length;
  var lats=withCoords.map(function(e){return e.lat;});
  var latRange = lats.length? Math.round(Math.max.apply(0,lats))+'°N to '+Math.abs(Math.round(Math.min.apply(0,lats)))+'°'+(Math.min.apply(0,lats)<0?'S':'N') : '—';
  var mapImg = _rwCard.toDataURL('image/jpeg',0.9);
  var W=C.W, H=C.H;
  var pinsHtml = C.pts.map(function(p,i){
    var lx=(p.x/W*100).toFixed(2), ty=(p.y/H*100).toFixed(2);
    var nm=(C.names[p.num-1]||'Stop '+p.num).replace(/[<>"]/g,'');
    return '<div class="ac-pin" data-x="'+lx+'" data-y="'+ty+'" style="left:'+lx+'%;top:'+ty+'%" onclick="this.classList.toggle(\'ac-open\')">'
      +'<div class="ac-dot">'+p.num+'</div>'
      +'<div class="ac-tip">'+nm+'</div></div>';
  }).join('');
  var flightPath = C.pts.map(function(p){ return (p.x/W*100).toFixed(2)+'% '+(p.y/H*100).toFixed(2)+'%'; });
  var logRows = withCoords.length? withCoords.map(function(e,i){
    return '<div class="ac-row"><span class="ac-num">'+String(i+1).padStart(2,'0')+'</span>'
      +'<span class="ac-place">'+(e.n||'').replace(/[<>]/g,'')+'</span>'
      +'<span class="ac-coord">'+e.lat.toFixed(2)+'°, '+e.lon.toFixed(2)+'°</span></div>';
  }).join('') : C.names.map(function(n,i){ return '<div class="ac-row"><span class="ac-num">'+String(i+1).padStart(2,'0')+'</span><span class="ac-place">'+n.replace(/[<>]/g,'')+'</span></div>'; }).join('');
  var stamp='RW-ATLAS-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
  /* Verifiable fingerprint of the exact journey contents (see proofStamp). */
  var proof = await proofStamp(name+'|'+withCoords.map(function(e){return e.n+','+e.lat+','+e.lon;}).join(';')) || '';
  var now=new Date();

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  +'<title>'+name+' — RoamWise Atlas Certificate</title>'
  +'</head><body><div class="wrap">'
  +'<div class="corner c-tl">✦</div><div class="corner c-tr">✦</div>'
  +'<div class="hd"><h1>ROAMWISE · ATLAS EDITION · JOURNEY CERTIFICATE</h1><div class="sub">Shinobi Edition — Escape the crowds · Discover your world</div></div>'
  +'<div class="bar"><button class="btn on" id="acPlayBtn" onclick="acToggleFlight()">▶ Play Flight</button>'
  +'<button class="tab on" data-f="geo" onclick="acTab(this)">Geographical</button>'
  +'<button class="tab" data-f="pol" onclick="acTab(this)">Political</button>'
  +'<button class="tab" data-f="temp" onclick="acTab(this)">Temperature</button></div>'
  +'<div class="mapbox" id="acMapbox"><img src="'+mapImg+'">'+pinsHtml+'<div class="plane" id="acPlane" style="opacity:0">✈️</div></div>'
  +'<div class="profile"><div class="av">'+(name[0]||'R').toUpperCase()+'</div><div><div class="pname">'+name.replace(/[<>]/g,'')+'</div><div class="prank">'+r[1].toUpperCase()+' · LEVEL '+Math.max(1,Math.floor(xp/50))+'</div></div></div>'
  +'<div class="stats">'
  +'<div class="stat"><label>Countries</label><b>'+countryCount+'</b></div>'
  +'<div class="stat"><label>Continents</label><b>'+continentCount+'/7</b></div>'
  +'<div class="stat"><label>Stops</label><b>'+C.names.length+'</b></div>'
  +'<div class="stat"><label>Total Distance</label><b>'+Math.round(dist).toLocaleString()+' km</b></div>'
  +'<div class="stat"><label>Latitude Range</label><b>'+latRange+'</b></div>'
  +'</div>'
  +'<div class="log"><h3>JOURNEY LOG · '+C.names.length+' STOPS</h3>'+logRows+'</div>'
  +'<div class="cert"><div class="seal">ROAMWISE<br>ATLAS<br>✦<br>VALIDATED</div>'
  +'<div class="certtext"><b>Certified True Journey</b>Date: '+now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})+' · ID: '+stamp+'<br>This certifies that the bearer has logged the above destinations on roamwise.co.in — data stays on device.'+(proof? '<br><span style="font-family:monospace;font-size:10px;word-break:break-all">Proof (SHA-256): '+proof.slice(0,32)+'…</span>':'')+'</div>'
  +'<div class="dotgrid"></div></div>'
  +'<div class="foot">Published by RoamWise.co.in · © '+now.getFullYear()+' RoamWise Atlas Authority</div>'
  +'</div>'
  +'<script>'
  +'function acTab(b){document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("on");});b.classList.add("on");var m=document.getElementById("acMapbox");m.className="mapbox "+({geo:"",pol:"pol",temp:"temp"}[b.dataset.f]);}'
  +'var acPts='+JSON.stringify(C.pts.map(function(p){return [p.x/W*100,p.y/H*100];}))+';'
  +'var acPlaying=true,acT=0,acRAF=null;'
  +'function acStep(){ if(!acPlaying||acPts.length<2){acRAF=requestAnimationFrame(acStep);return;} '
  +'var segT=acT%1, segI=Math.floor(acT)%(acPts.length-1); var a=acPts[segI],b2=acPts[segI+1];'
  +'var x=a[0]+(b2[0]-a[0])*segT, y=a[1]+(b2[1]-a[1])*segT;'
  +'var pl=document.getElementById("acPlane"); pl.style.opacity=1; pl.style.left=x+"%"; pl.style.top=y+"%";'
  +'acT+=0.006; if(acT>=acPts.length-1) acT=0; acRAF=requestAnimationFrame(acStep); }'
  +'function acToggleFlight(){ acPlaying=!acPlaying; var b=document.getElementById("acPlayBtn"); b.textContent=acPlaying?"▶ Play Flight":"⏸ Pause Flight"; b.classList.toggle("on",acPlaying); }'
  +'function acDeclutter(){'
  +'var pins=Array.prototype.slice.call(document.querySelectorAll(".ac-pin"));'
  +'var pos=pins.map(function(p){return {el:p, x:parseFloat(p.dataset.x), y:parseFloat(p.dataset.y)};});'
  +'var THRESH=4.5;'
  +'for(var iter=0;iter<6;iter++){'
  +'for(var i=0;i<pos.length;i++)for(var j=i+1;j<pos.length;j++){'
  +'var dx=pos[j].x-pos[i].x, dy=pos[j].y-pos[i].y, d=Math.sqrt(dx*dx+dy*dy);'
  +'if(d<THRESH){ var push=(THRESH-d)/2; var ang=Math.atan2(dy||0.01,dx||0.01);'
  +'pos[i].x-=Math.cos(ang)*push; pos[i].y-=Math.sin(ang)*push;'
  +'pos[j].x+=Math.cos(ang)*push; pos[j].y+=Math.sin(ang)*push; }'
  +'}}'
  +'pos.forEach(function(p){ p.el.style.left=Math.max(2,Math.min(98,p.x))+"%"; p.el.style.top=Math.max(2,Math.min(98,p.y))+"%"; });'
  +'}'
  +'acDeclutter();'
  +'acStep();'
  +'<'+'/script></body></html>';

  var blob=new Blob([html],{type:'text/html'});
  var fname='roamwise-atlas-certificate-'+(name||'traveler').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.html';
  if(window.RW && RW.saveCard){
    var fr=new FileReader(); fr.onload=function(){ RW.saveCard(fr.result); offerOpen('Your Atlas Certificate'); };
    fr.readAsDataURL(blob);
  } else {
    var u=URL.createObjectURL(blob), a=document.createElement('a'); a.href=u; a.download=fname; a.click();
    showToast('📜 Atlas Certificate downloaded — open it in any browser');
  }
  xpAdd(15,'Atlas Certificate engraved');
  try{ track('atlas_cert_made'); }catch(e){}
}
function cardPNG(){ if(window._rwCard) saveOrDownload(_rwCard.toDataURL('image/png'),'roamwise-journey.png'); }
function cardJPG(){ if(window._rwCard) saveOrDownload(_rwCard.toDataURL('image/jpeg',0.92),'roamwise-journey.jpg'); }
function cardPDF(){
  if(!window._rwCard) return;
  var go=function(){
    var pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'px',format:[1200,1600]});
    pdf.addImage(_rwCard.toDataURL('image/jpeg',0.92),'JPEG',0,0,1200,1600);
    if(window.RW && RW.saveCard){ RW.saveCard(pdf.output('datauristring')); showToast('PDF saved to Downloads/RoamWise \u2713'); }
    else {
      try{ var u=URL.createObjectURL(pdf.output('blob')); var w2=window.open(u,'_blank');
        if(w2) showToast('\ud83d\udc41 Preview opened \u2014 save from the viewer'); else pdf.save('roamwise-journey.pdf');
      }catch(e){ pdf.save('roamwise-journey.pdf'); }
    }
  };
  if(window.jspdf) return go();
  showToast('Preparing PDF engine\u2026');
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload=go; s.onerror=function(){ showToast('PDF needs internet \u2014 try PNG/JPG'); };
  document.head.appendChild(s);
}
function cardShare(){
  if(!window._rwCard) return;
  _rwCard.toBlob(function(blob){
    var f=new File([blob],'roamwise-journey.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[f]})){
      navigator.share({files:[f], title:'My RoamWise Journey', text:'\u{1F977} My travel map \u2014 made on RoamWise. Make yours: https://www.roamwise.co.in'})
        .then(function(){ xpAdd(15,'Card shared \u2014 spreading the legend'); }).catch(function(){});
    } else { cardPNG(); showToast('Saved \u2014 now share it from your gallery to Insta/WhatsApp'); }
  },'image/png');
}

/* ===== JOURNEY MOVIE — cinematic canvas render with music ===== */
function openMovie(){
  if(!window._rwCard || !window._rwCine){ showToast('Forge your Journey Card first \u2014 then the movie'); return; }
  if((_rwCine.pts||[]).length<2){ showToast('Log at least 2 located places for a movie'); return; }
  try{ track('video_opens'); }catch(e){}
  if(isPro || lsGet('rw_movie_ok')) return cineRender();
  if(perksUnlocked().indexOf('documented')>-1 && !lsGet('rw_movie_perk_used')){
    lsSet('rw_movie_perk_used','1');
    showToast('\ud83c\udfc6 Perk redeemed \u2014 free Journey Movie for a Documented traveler!');
    return cineRender();
  }
  var ov=el('movOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='movOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:400px"><button class="modal-close" onclick="el(\'movOverlay\').classList.remove(\'open\')">\u00d7</button>'
    +'<div class="modal-head"><div class="modal-title">\ud83c\udfac Journey Film</div><div class="modal-sub">5-second chapters \u00b7 a plane flies your route \u00b7 music</div></div>'
    +'<div class="modal-body"><div class="mode-box" style="margin-bottom:10px">\ud83d\udcb0 <b>\u20b950 one-off</b> \u2014 or free with Pro. Pay via any UPI app to <b>coolmohit@ybl</b>, then render.</div>'
    +'<button class="tact" style="width:100%;margin-bottom:8px" onclick="payVia(\'generic50\')">\ud83d\udcb3 Pay \u20b950 via UPI</button>'
    +'<button class="rzp-main-btn" onclick="lsSet(\'rw_movie_ok\',\'1\');el(\'movOverlay\').classList.remove(\'open\');cineRender()">\u2705 I\u2019ve paid \u20b950 \u2014 Render my movie</button>'
    +'<div style="font-size:10px;color:var(--t3);text-align:center;margin-top:6px">Honor system \u2014 you\u2019re funding a solo Himalayan builder \ud83c\udfd4\ufe0f</div></div></div>';
    document.body.appendChild(ov); }
  ov.classList.add('open');
}
function cineMusic(ctx, dest, dur){
  /* dark shinobi phonk: 88bpm kick + 808 + hat + minor cowbell motif */
  var bpm=88, beat=60/bpm, t0=ctx.currentTime+0.05;
  function kick(t){ var o=ctx.createOscillator(), g=ctx.createGain();
    o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.11);
    g.gain.setValueAtTime(.9,t); g.gain.exponentialRampToValueAtTime(.001,t+0.24);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t+0.26); }
  function bass(t,f,d){ var o=ctx.createOscillator(), g=ctx.createGain(); o.type='triangle';
    o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(.4,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t+d); }
  function hat(t){ var b=ctx.createBuffer(1,2000,ctx.sampleRate), dd=b.getChannelData(0);
    for(var i=0;i<2000;i++) dd[i]=(Math.random()*2-1)*Math.pow(1-i/2000,2);
    var s=ctx.createBufferSource(), g=ctx.createGain(), f=ctx.createBiquadFilter();
    f.type='highpass'; f.frequency.value=8000; g.gain.value=.16;
    s.buffer=b; s.connect(f); f.connect(g); g.connect(dest); s.start(t); }
  function bell(t,f){ var o=ctx.createOscillator(), g=ctx.createGain(); o.type='square';
    o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(.14,t); g.gain.exponentialRampToValueAtTime(.001,t+beat*0.9);
    var fl=ctx.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f*2;
    o.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o.stop(t+beat); }
  var mel=[220,262,196,220, 175,220,262,330, 220,196,175,196, 220,262,220,175]; /* Am minor motif */
  var bars=Math.ceil(dur/(beat*4));
  for(var b2=0;b2<bars;b2++){
    var bt=t0+b2*beat*4;
    [0,1,2,3].forEach(function(q){ kick(bt+q*beat); hat(bt+q*beat+beat/2); if(q===1||q===3) hat(bt+q*beat+beat*0.75); });
    bass(bt,55,beat*1.8); bass(bt+beat*2,49,beat*1.8);
    [0,1,2,3].forEach(function(q){ bell(bt+q*beat, mel[(b2*4+q)%mel.length]); });
  }
}
function cineRender(opts){
  opts=opts||{};
  var ST=CARD_STYLES[(_rwCine&&_rwCine.style)||'neon']||CARD_STYLES.neon;
  showToast('\ud83c\udfac Rolling\u2026 rendering your journey film');
  try{ track('video_made'); }catch(e){}
  var C=_rwCine, S=2;
  var VW=1080, VH=1920, cv=document.createElement('canvas'); cv.width=VW; cv.height=VH;
  var x=cv.getContext('2d');
  /* clean, de-duplicated leg list */
  var legs=C.pts.filter(function(p){return p && isFinite(p.x) && isFinite(p.y);});
  legs=legs.filter(function(p,i){ return i===0 || Math.abs(p.x-legs[i-1].x)+Math.abs(p.y-legs[i-1].y) > 4; });
  if(legs.length<2){ showToast('Log 2+ located places for a film'); return; }
  var names=C.names||[];
  var test=!!window._cineTest;
  /* fixed 5-second segments: INTRO(5) + one 5s hop per leg-transition + OUTRO(5) */
  var SEG=test?0.5:5.0, hops=legs.length-1;
  var INTRO=SEG, OUTRO=SEG, DUR=INTRO + hops*SEG + OUTRO;

  /* geo bounds of the trip for a framed map view */
  var minX=Math.min.apply(0,legs.map(function(p){return p.x;})), maxX=Math.max.apply(0,legs.map(function(p){return p.x;}));
  var minY=Math.min.apply(0,legs.map(function(p){return p.y;})), maxY=Math.max.apply(0,legs.map(function(p){return p.y;}));

  /* audio */
  var AC=window.AudioContext||window.webkitAudioContext, ctx=null, dest=null;
  if(!opts.mute){ try{ ctx=new AC(); try{ctx.resume();}catch(e2){} dest=ctx.createMediaStreamDestination(); cineMusic(ctx,dest,DUR);}catch(e){} }
  var stream=cv.captureStream(30);
  if(dest && dest.stream.getAudioTracks().length) stream.addTrack(dest.stream.getAudioTracks()[0]);
  var mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(function(m){return window.MediaRecorder && MediaRecorder.isTypeSupported(m);});
  if(!mime){ showToast('Video needs Chrome \u2014 try there'); return; }
  var rec=new MediaRecorder(stream,{mimeType:mime, videoBitsPerSecond:6e6}), chunks=[];
  rec.ondataavailable=function(e){ if(e.data.size) chunks.push(e.data); };
  rec.onstop=function(){
    if(ctx) try{ctx.close();}catch(e){}
    var blob=new Blob(chunks,{type:'video/webm'});
    if(blob.size<2000 && !opts.mute){ showToast('Retrying without music\u2026'); return cineRender({mute:true}); }
    if(blob.size<2000){ showToast('\u26a0 Recording failed \u2014 try Chrome'); return; }
    if(window.RW && RW.saveCard){ var fr=new FileReader(); fr.onload=function(){ RW.saveCard(fr.result); showToast('\ud83c\udfac Film saved to Downloads/RoamWise!'); }; fr.readAsDataURL(blob); }
    else { var u=URL.createObjectURL(blob), a=document.createElement('a'); a.href=u; a.download='roamwise-journey-film.webm'; a.click(); showToast('\ud83c\udfac Film downloaded \u2014 post it as a Reel!'); }
    xpAdd(30,'Journey Film premiered');
  };
  rec.start(200);

  var t0=performance.now();
  function ease(t){ return t<0.5? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  /* map viewport helpers: world logical coords -> screen, with padding */
  function view(cx,cy,span){
    var pad=VW*0.16, availW=VW-2*pad, availH=VH-2*pad;
    var sc=Math.min(availW/span, availH/span);
    return {cx:cx,cy:cy,sc:sc};
  }
  function toS(v,px,py){ return [ VW/2+(px-v.cx)*v.sc, VH/2+(py-v.cy)*v.sc ]; }

  function bg(){ /* deep gradient backdrop in the card's style */
    var g=x.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,ST.bg[0]); g.addColorStop(.5,ST.bg[1]); g.addColorStop(1,ST.bg[2]);
    x.fillStyle=g; x.fillRect(0,0,VW,VH);
    /* faint graticule */
    x.strokeStyle='rgba(255,255,255,.05)'; x.lineWidth=1;
    for(var gy=0;gy<VH;gy+=120){ x.beginPath(); x.moveTo(0,gy); x.lineTo(VW,gy); x.stroke(); }
    for(var gx=0;gx<VW;gx+=120){ x.beginPath(); x.moveTo(gx,0); x.lineTo(gx,VH); x.stroke(); }
  }
  function drawTrail(v, upto, partial){
    /* solid trail through visited pins, dashed remainder */
    x.lineWidth=6; x.lineCap='round';
    for(var i=0;i<legs.length-1;i++){
      var a=toS(v,legs[i].x,legs[i].y), b=toS(v,legs[i+1].x,legs[i+1].y);
      var visible = i<upto;
      x.setLineDash(visible? [] : [10,12]);
      x.strokeStyle = visible? ST.trail||ST.accent : 'rgba(255,255,255,.22)';
      x.shadowColor=ST.trail||ST.accent; x.shadowBlur=visible?14:0;
      x.beginPath();
      if(i===upto && partial!=null){ var mx=lerp(legs[i].x,legs[i+1].x,partial), my=lerp(legs[i].y,legs[i+1].y,partial); var bb=toS(v,mx,my);
        x.moveTo(a[0],a[1]); x.lineTo(bb[0],bb[1]); }
      else { x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); }
      x.stroke();
    }
    x.setLineDash([]); x.shadowBlur=0;
  }
  function drawPins(v, upto){
    legs.forEach(function(p,i){
      var s=toS(v,p.x,p.y), active=i<=upto;
      x.save(); x.shadowColor=ST.trail||ST.pin; x.shadowBlur=active?20:6;
      x.fillStyle=active?ST.pin:'rgba(180,180,190,.5)'; x.beginPath(); x.arc(s[0],s[1],active?15:10,0,7); x.fill(); x.restore();
      x.fillStyle=ST.pinCore; x.beginPath(); x.arc(s[0],s[1],active?10:6,0,7); x.fill();
      x.fillStyle=ST.pinTxt; x.font='700 13px Outfit,Arial'; x.textAlign='center'; x.fillText(String(i+1),s[0],s[1]+5);
    });
  }
  function plane(v, fromP, toP, tt){
    var px=lerp(fromP.x,toP.x,tt), py=lerp(fromP.y,toP.y,tt), s=toS(v,px,py);
    var ang=Math.atan2(toP.y-fromP.y, toP.x-fromP.x);
    x.save(); x.translate(s[0],s[1]); x.rotate(ang);
    x.fillStyle='#fff'; x.shadowColor=ST.accent; x.shadowBlur=18;
    /* simple plane glyph */
    x.beginPath(); x.moveTo(24,0); x.lineTo(-14,-11); x.lineTo(-6,0); x.lineTo(-14,11); x.closePath(); x.fill();
    x.fillRect(-16,-3,10,6);
    x.restore(); x.shadowBlur=0;
  }
  function caption(top,big,small,alpha){
    x.save(); x.globalAlpha=alpha; x.textAlign='center';
    var gy=x.createLinearGradient(0,VH-360,0,VH); gy.addColorStop(0,'rgba(7,9,15,0)'); gy.addColorStop(1,'rgba(7,9,15,.92)');
    x.fillStyle=gy; x.fillRect(0,VH-360,VW,360);
    if(top){ x.fillStyle=ST.accent; x.font='700 32px '+ST.capFont; x.fillText(top,VW/2,VH-250); }
    if(big){ x.fillStyle='#fff'; x.font='700 66px '+ST.capFont;
      var t2=big.length>16? big.slice(0,16):big; x.fillText(t2,VW/2,VH-176); }
    if(small){ x.fillStyle='#C9C5BB'; x.font='italic 27px '+ST.capFont; x.fillText(small,VW/2,VH-128); }
    x.restore(); x.textAlign='left';
  }
  function watermark(){
    x.save(); x.globalAlpha=.5; x.textAlign='center';
    x.fillStyle=ST.accent; x.font='700 26px Outfit,Arial';
    x.fillText('\ud83e\udd77 ROAMWISE', VW/2, 60);
    x.restore(); x.textAlign='left';
  }

  function frame(now){
   try{
    var t=(now-t0)/1000;
    bg(); watermark();

    if(t<INTRO){
      /* SEGMENT 1 — INTRO: whole map framed, gentle zoom-in, title */
      var p=ease(t/INTRO);
      var spanAll=Math.max(60, Math.max(maxX-minX,maxY-minY)*1.5);
      var v=view((minX+maxX)/2,(minY+maxY)/2, spanAll*(1.25-0.25*p));
      drawTrail(v,-1,null); drawPins(v,-1);
      caption('THE JOURNEY OF', (C.name||'A TRAVELER').toUpperCase(), legs.length+' destinations \u00b7 a RoamWise film', Math.min(1,t/0.8));
    } else if(t < INTRO + hops*SEG){
      /* SEGMENTS 2..n — one 5s plane hop per leg, camera follows */
      var k=Math.floor((t-INTRO)/SEG), lt=((t-INTRO)%SEG)/SEG;
      if(k>hops-1){ k=hops-1; lt=1; }
      var A=legs[k], B=legs[k+1], e=ease(lt);
      /* camera frames the current hop, tightening as the plane flies */
      var midX=(A.x+B.x)/2, midY=(A.y+B.y)/2;
      var hopSpan=Math.max(30, (Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y)))*2.2);
      var v=view(midX,midY, hopSpan);
      drawTrail(v,k,e);
      drawPins(v,k + (e>0.98?1:0));
      plane(v,A,B,e);
      var toName=(names[k+1]||'Next stop').slice(0,18), fromName=(names[k]||'').slice(0,18);
      caption('CHAPTER '+(k+1)+' \u2192 '+(k+2), toName, k===0? 'the journey begins \u00b7 from '+fromName : 'flying in from '+fromName, 1);
    } else {
      /* FINAL SEGMENT — OUTRO: zoom back out over the full trail, thanks note */
      var ot=(t-INTRO-hops*SEG)/OUTRO, e3=ease(Math.min(1,ot));
      var spanAll2=Math.max(60, Math.max(maxX-minX,maxY-minY)*1.5);
      var v=view((minX+maxX)/2,(minY+maxY)/2, spanAll2*(0.9+0.35*e3));
      drawTrail(v,legs.length-1,null); drawPins(v,legs.length-1);
      caption('THANK YOU FOR TRAVELING', (C.name||'').toUpperCase(), 'make your own film \u00b7 roamwise.co.in', Math.min(1,ot*1.4));
    }

    if(t<DUR) requestAnimationFrame(frame); else rec.stop();
   }catch(err){ try{rec.stop();}catch(e2){} showToast('Film wrapped early \u2014 saved what rendered'); }
  }
  requestAnimationFrame(frame);
}

/* ===== CHEAP TRICKS & LUXURY HACKS ===== */
var CHEAP=[['\ud83c\udf7c','Cheap trick','Book overnight buses/trains for long hops \u2014 transport + one night\u2019s stay for one ticket.'],
['\ud83d\udecf\ufe0f','Cheap trick','Hostels with free breakfast + kitchen cut food costs ~40% \u2014 filter for both.'],
['\ud83d\udcf1','Cheap trick','Buy the local SIM/eSIM at a city shop, not the airport counter \u2014 same plan, half price.'],
['\ud83c\udf9f\ufe0f','Cheap trick','City museums/attractions: student, teacher and press IDs often work internationally \u2014 always ask.'],
['\ud83d\uddd3\ufe0f','Cheap trick','Fly Tue/Wed, book stays Sun\u2013Thu \u2014 the same trip can cost 25% less shifted two days.']];
var LUXE=[['\ud83e\udd42','Luxury hack','Book the cheapest room at a 5-star, then email asking about paid upgrades at check-in \u2014 upgrades sell for a fraction of rack rate.'],
['\ud83d\udecd\ufe0f','Luxury hack','Hotel day-passes: pools, spas and lounges of top hotels without staying \u2014 search \u201cday pass\u201d + hotel name.'],
['\u2708\ufe0f','Luxury hack','Business class via points transfer bonuses costs less than premium economy cash \u2014 start collecting on one alliance only.'],
['\ud83c\udf7e','Luxury hack','Michelin lunch menus run 40\u201360% below dinner \u2014 same kitchen, same stars.'],
['\ud83d\udea2','Luxury hack','Repositioning cruises (one-way seasonal moves) sell luxury ships at hostel prices per night.']];

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

/* ===== NINJA HACKS ENGINE — deterministic per destination ===== */
var REGION_FACTS = {
  'Southeast Asia':[ ['Temple trick','Carry a sarong in your daypack — rentals at temple gates cost 5–10x the market price.'], ['Street-food radar','Eat where the queue is local office workers at 1pm — highest turnover means the freshest food.'] ],
  'East Asia':[ ['Convenience-store hack','7-Eleven/FamilyMart meals are restaurant-grade here — a full dinner under half the café price.'], ['Transit fact','Regional rail passes usually must be bought BEFORE arrival — check eligibility from India.'] ],
  'South Asia':[ ['Bargain baseline','Open at 40% of the first quoted price in tourist markets; walk away once — the real price follows you.'], ['Train hack','Book train tickets the minute the reservation window opens; tourist-quota seats exist at major stations.'] ],
  'Europe':[ ['Museum hack','Most big museums have one free evening per week or month — plan around it and save €15–25 each.'], ['Water fact','Tap water is drinkable in most of Europe — a refillable bottle saves €4–6 a day.'] ],
  'Middle East':[ ['Friday rule','Weekend is Fri–Sat in much of the region — souks and sights shift hours; plan mosque visits outside prayer times.'], ['Taxi hack','Insist on the meter or agree the fare BEFORE the door closes — or use local ride apps.'] ],
  'Africa':[ ['SIM first','Buy a local SIM at the airport — mobile data is often cheaper than India and card machines are rare.'], ['Tipping fact','Small-note tips open doors everywhere; keep a stash of small denominations from day one.'] ],
  'North America':[ ['Tax surprise','Displayed prices exclude tax and tipping 15–20% is expected — budget ~25% above sticker prices.'], ['City pass math','City attraction passes pay off only from the 3rd big sight — count before buying.'] ],
  'South America':[ ['Cash is king','Many places give 10% discounts for cash — but withdraw from bank ATMs inside branches only.'], ['Altitude hack','Landing above 2,500m? Schedule nothing on day one — acclimatise, hydrate, skip alcohol.'] ],
  'Oceania':[ ['Camper math','For 2+ people, a campervan often beats hostel + car + restaurants combined.'], ['Sun fact','The UV index here is brutal even when cool — SPF50 is a budget item, not a luxury.'] ],
  'Central Asia':[ ['Homestay hack','Family homestays cost less than hotels and include meals — book via community tourism networks.'], ['Border fact','Land borders can close for local holidays without notice — always have a buffer day.'] ]
};
var MO_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function nameHash(s){ var h=0; for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h; }
function buildHacks(d, mi, month){
  var out = [], h = nameHash(d.name||'x');
  /* 1. Crowd-dodge hack from real crowd data */
  if(d.crowd && d.crowd.length===12){
    var minI=0; for(var i=1;i<12;i++) if(d.crowd[i]<d.crowd[minI]) minI=i;
    if(typeof mi==='number' && mi>=0 && d.crowd[mi]-d.crowd[minI]>=12){
      out.push({ic:'🥷',t:'Crowd-dodge',x:MO_FULL[minI]+' sees just '+d.crowd[minI]+'% crowds vs '+d.crowd[mi]+'% in '+month+' — same place, half the queues.'});
    } else {
      out.push({ic:'🌅',t:'Golden-hour rule',x:'Hit the #1 sight at opening time or after 4pm — tour buses own 10am–3pm everywhere on Earth.'});
    }
  }
  /* 2. Money hack from currency */
  if(d.cur) out.push({ic:'💴',t:'Money hack',x:'Always pay in '+d.cur+', never in INR/USD when a card machine offers the choice — refusing "dynamic currency conversion" quietly saves 3–5% on every swipe.'});
  /* 3. Region-specific rotating hack */
  var rf = REGION_FACTS[d.region];
  if(rf){ var pick = rf[h % rf.length]; out.push({ic:'🗺️',t:pick[0],x:pick[1]}); }
  /* 4. Visa or capital fact */
  if(d.visa && (d.visa.type||'').toLowerCase().indexOf('free')>=0){
    out.push({ic:'🛂',t:'Visa fact',x:'Visa-free for Indians — but immigration can still ask for a return ticket and hotel booking; keep screenshots offline.'});
  } else {
    var ci2 = lookupCountryInfo(d.country);
    if(ci2 && ci2.capital) out.push({ic:'💡',t:'Did you know',x:(d.country||d.name)+'\u2019s capital is '+ci2.capital+(ci2.language?' and locals speak '+ci2.language:'')+' — even two greeting words in it noticeably drops prices in markets.'});
  }
  var tmv=(el('tmode')||{}).value||'std';
  var extra=(tmv==='lux')? LUXE[h%LUXE.length] : CHEAP[h%CHEAP.length];
  out.push({ic:extra[0],t:extra[1],x:extra[2]});
  return out.slice(0,5);
}

var UPI_VPA = 'coolmohit@ybl', UPI_NAME = 'RoamWise Pro', UPI_AMT = '100';
var _selectedPlan = null; /* set by pickPlan() — drives the amount/label for whatever the user is actually buying */
function pickPlan(planId, priceINR, label){
  _selectedPlan = {id:planId, priceINR:priceINR, label:label};
  UPI_AMT = String(priceINR); UPI_NAME = 'RoamWise '+label;
  qrBuilt = false; /* force QR rebuild for the new amount */
  var qc = el('qrcode'); if(qc) qc.innerHTML='';
  buildQR();
  var ph = el('planHeader'); if(ph) ph.textContent = label+' \u2014 \u20b9'+priceINR;
  var picker = el('planPicker'); if(picker) picker.style.display='none';
  var methods = el('payMethods'); if(methods){
    methods.style.display='block';
    var cp = el('cryptoPanel');
    if(!cp && cryptoConfigured()){ cp=document.createElement('div'); cp.id='cryptoPanel'; methods.appendChild(cp); }
    if(cp) cp.innerHTML = cryptoPanelHTML();
  }
}
function backToPlanPicker(){
  var picker = el('planPicker'); if(picker) picker.style.display='block';
  var methods = el('payMethods'); if(methods) methods.style.display='none';
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
  var scores = [];
  DB.forEach(function(d){
    var budgetGap = Math.max(0, d.cost.budget - budUSD);
    var budgetPenalty = budgetGap / 25; /* soft penalty, never excludes */
    if(ctry && ctry!=='anywhere in the world' && ctry.indexOf('anywhere')<0){
      var hit = d.name.toLowerCase().indexOf(ctry)>=0
             || d.country.toLowerCase().indexOf(ctry)>=0
             || d.region.toLowerCase().indexOf(ctry)>=0
             || ctry.indexOf(d.country.toLowerCase())>=0
             || ctry.indexOf(d.name.toLowerCase())>=0;
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
    if(d.bestM.indexOf(mi)>=0) sc += 28;
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
var AI_MODELS = {
  groq: ['llama-3.3-70b-versatile','llama-3.1-8b-instant'],
  cerebras: ['llama-3.3-70b','llama3.1-8b'],
  github: ['gpt-4o','Meta-Llama-3.1-70B-Instruct'],
  gemini: ['gemini-2.5-flash','gemini-flash-latest'],
  openrouter: ['meta-llama/llama-3.3-70b-instruct:free','mistralai/mistral-small-3.1-24b-instruct:free','google/gemma-3-27b-it:free'],
  mistral: ['mistral-small-latest','open-mistral-nemo'],
  anthropic: ['claude-sonnet-4-20250514']
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
  var models = AI_MODELS[prov]||[]; var i=0;
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

/* Key tester — used by the Test buttons in Settings */
function testKey(prov){
  var key=(el(prov+'Key').value||'').trim() || lsGet('rwKey_'+prov);
  var st=el(prov+'Status');
  if(!key){ st.textContent='no key'; st.className='key-status ks-empty'; return; }
  st.textContent='testing…'; st.className='key-status ks-empty';
  var models=AI_MODELS[prov], i=0;
  (function tryM(lastErr){
    if(i>=models.length){ st.textContent='✗ '+String(lastErr).slice(0,60); st.className='key-status ks-bad'; showToast('Key failed: '+String(lastErr).slice(0,80)); return; }
    var m=models[i++];
    aiRequest(prov,key,m,'Reply with exactly: OK',10)
      .then(function(){ st.textContent='✓ working ('+m+')'; st.className='key-status ks-ok'; showToast(prov+' key verified \u2713'); })
      .catch(function(e){
        if(e.httpStatus===401||e.httpStatus===403){ st.textContent='✗ invalid key'; st.className='key-status ks-bad'; showToast('Key rejected — regenerate it and paste again'); }
        else tryM(e.message||e);
      });
  })(null);
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
    if(freeLeft===0) showToast('Last free search! Upgrade for ₹100 for unlimited.');
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

  if(wantsSpecificPlace && topR.length < 3){
    if(topR.length === 0){
      /* No curated match at all — build a generic card for the typed place */
      var generic = buildGenericDestination(dest, budUSD);
      isGenericResult = true;
      var alts0 = smartSearch(month, budUSD, '', crowd, interests).filter(function(r){
        return r.d.name.toLowerCase() !== generic.name.toLowerCase();
      });
      topR = [{ d:generic, sc:999, cs:generic.crowd[MONTHS.indexOf(month)] }].concat(alts0).slice(0,3);
    } else {
      /* Found some curated matches but fewer than 3 — top up with global best */
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
    var aiPrompt = 'Briefly enhance these travel destinations for a traveler from '+origin+' in '+month+' ($'+budUSD+' budget, interests: '+interests.join(',')+'). Destinations: '+destList+'. Return ONLY valid JSON with this exact shape: {"e":[{"id":"'+topR[0].d.id+'","desc":"2 vivid sentences","tip":"1 practical tip for '+month+'"},{"id":"'+topR[1].d.id+'","desc":"2 vivid sentences","tip":"1 tip"},{"id":"'+topR[2].d.id+'","desc":"2 vivid sentences","tip":"1 tip"}]}';
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
  var mi = MONTHS.indexOf(month);
  var provLabel = activeProv==='smart' ? 'Smart Search' : (lsGet('rwKey_'+activeProv) ? activeProv.charAt(0).toUpperCase()+activeProv.slice(1)+' AI' : 'Smart Search');

  var H = `<div class="live-bar"><div class="live-dot"></div><span>Results for <strong style="color:#16BF96">${month}</strong> &bull; ${provLabel}${aiData ? ' &bull; <strong style="color:#BF8CFF">AI enhanced</strong>' : ''}${isPro ? ' &bull; <strong style="color:#E8BA6C">Pro Active</strong>' : ''}</span>${(activeProv==='smart' && !lsGet('rwKey_gemini') && !lsGet('rwKey_groq')) ? '<span style="font-size:10px;color:#4A4946;margin-left:auto;cursor:pointer" onclick="openSettings()">+ Add free AI key</span>' : ''}</div>`;

  H += `<div class="cmp-wrap"><table class="cmp-table"><thead><tr><th>Destination</th><th>Crowd in ${month}</th><th>Mid budget</th><th>Visa (India)</th><th>Best months</th></tr></thead><tbody>`;
  results.forEach(function(r){
    var d=r.d, cs=r.cs, bl = cs<35?'badge-low':cs<60?'badge-mid':'badge-hi', ct = cs<35?'Low':cs<60?'Moderate':'Busy';
    var bm = d.bestM.length ? d.bestM.slice(0,3).map(function(m){return MO[m];}).join(', ') : 'Year-round';
    H += `<tr><td><strong>${flagEmoji(d.flag)} ${d.name}</strong>${d.country?`<br><span style="font-size:10px;color:#4A4946">${d.country}</span>`:''}</td><td><span class="badge ${bl}" style="font-size:11px">${cs}% ${ct}</span></td><td>${fmtMoney(d.cost.mid)}</td><td style="font-size:11px">${d.visa.type}<br><span style="color:#16BF96">${d.visa.cost}</span></td><td style="font-size:11px">${bm}</td></tr>`;
  });
  H += `</tbody></table></div>`;
  H += adCard(0);

  if(!isPro) H += `<div class="promo" style="margin-bottom:14px" onclick="openPay()"><div class="promo-left">👑</div><div class="promo-text"><strong>Unlock Pro — ₹100 lifetime</strong><span>Full itineraries &bull; Budget tracker &bull; WhatsApp share &amp; more</span></div><div class="promo-price"><span class="promo-amt">₹100</span></div></div>`;

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
    var bestMonthsLabel = d.bestM.length ? d.bestM.slice(0,3).map(function(m){return MO[m];}).join(', ') : 'Year-round';
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
        var best = d.bestM.indexOf(idx)>=0;
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
      H += `<div class="gate" onclick="openPay()"><span class="gate-ico">📅</span><div class="gate-title">Full ${Math.min(days,14)}-day itinerary — Pro only</div><div class="gate-sub">Detailed day-by-day plan with specific places, timings, local tips and restaurant picks. Built from our database, AI-enhanced if a key is added.</div><button class="gate-btn">Unlock for ₹100 →</button></div>`;
    } else {
      H += `<div id="${T}-iph" class="itin-ph"><div class="mini-spin"></div><span>Click below to build your ${idays}-day plan for ${d.name}</span></div><div id="${T}-ict" style="display:none"></div>`;
    }
    H += `</div>`;

    /* PRO TOOLS TAB */
    H += `<div class="tab-pane" id="${T}-pt">`;
    if(!isPro){
      H += `<div class="gate" onclick="openPay()"><span class="gate-ico">👑</span><div class="gate-title">Budget Tracker &bull; Packing List &bull; Compare Table &bull; WhatsApp Share</div><div class="gate-sub">₹100 one-time unlocks all Pro tools forever on this device.</div><button class="gate-btn">Unlock Pro → ₹100</button></div>`;
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
      <div class="book-grid">
        <a class="book-link" href="https://www.skyscanner.com/transport/flights/${encodeURIComponent(origin)}/${enc}/" target="_blank" rel="noopener"><span class="book-ico">✈️</span><span class="book-name">Skyscanner</span><span class="book-sub">Flights</span></a>
        <a class="book-link" href="https://www.booking.com/search.html?ss=${enc}" target="_blank" rel="noopener"><span class="book-ico">🏨</span><span class="book-name">Booking.com</span><span class="book-sub">Hotels</span></a>
        <a class="book-link" href="https://www.getyourguide.com/s/?q=${enc}" target="_blank" rel="noopener"><span class="book-ico">🎫</span><span class="book-name">GetYourGuide</span><span class="book-sub">Tours</span></a>
        <a class="book-link" href="https://www.viator.com/search/${enc}" target="_blank" rel="noopener"><span class="book-ico">🗺️</span><span class="book-name">Viator</span><span class="book-sub">Experiences</span></a>
        <a class="book-link" href="https://www.airbnb.com/s/${enc}/homes" target="_blank" rel="noopener"><span class="book-ico">🏠</span><span class="book-name">Airbnb</span><span class="book-sub">Stays</span></a>
        <a class="book-link" href="https://www.safetywing.com" target="_blank" rel="noopener"><span class="book-ico">🛡️</span><span class="book-name">SafetyWing</span><span class="book-sub">Insurance</span></a>
      </div>
      <p style="font-size:10px;color:#4A4946;text-align:center;margin-top:7px">Affiliate links — commission at no extra cost</p>
    </div></div>`;

    /* ACTION BAR */
    H += `<div class="act-bar">`;
    if(isPro){
      H += `<button class="act-btn act-gold" onclick="buildItin('${T}','${d.name.replace(/'/g,"\\'")}', ${d.cost.mid}, ${idays})">📅 Load ${idays}-day Plan</button>`;
      H += `<button class="act-btn act-wa" onclick="swTab('${T}','pt');swSub('${P2}','ws')">💬 Share</button>`;
      H += `<button class="act-btn act-ghost" onclick="swTab('${T}','pt');swSub('${P2}','bt')">💰 Track</button>`;
    } else {
      H += `<button class="act-btn act-gold" onclick="openPay()">📅 Full Itinerary 🔒</button>`;
      H += `<button class="act-btn act-pm" onclick="openPay()">👑 Unlock Pro — ₹100</button>`;
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

/* ITINERARY */
var DAY_TEMPLATES = [
  {title:'Arrival & first explore', morning:'Check in, walk the historic centre, get oriented', afternoon:'Visit the main iconic landmark (less busy in afternoon)', evening:'Try local signature dish at nearby restaurant', tip:'Get local currency from a bank ATM on arrival'},
  {title:'Culture deep dive', morning:'Main historical site or museum — go at opening time', afternoon:'Local neighbourhood walk, coffee and people-watching', evening:'Street food tour or food market dinner', tip:'Dress modestly at religious sites — cover shoulders and knees'},
  {title:'Nature & day trip', morning:'Early start for natural attraction or national park', afternoon:'Picnic lunch from morning market, explore further', evening:'Sunset viewpoint, local dinner nearby', tip:'Book transport the night before, not morning of'},
  {title:'Food & market day', morning:'Morning food market — try local breakfast dishes', afternoon:'Cooking class or guided food tour', evening:'Signature multi-course local dinner', tip:'Eat where locals eat, not where tourists photograph'},
  {title:'Hidden gems day', morning:'Off-the-beaten-path attraction — start early', afternoon:'Explore a lesser-visited neighbourhood', evening:'Ask your hotel for their personal dinner favourite', tip:'The best experiences are rarely on review-site page 1'},
  {title:'Active adventure', morning:'Outdoor activity — hiking, cycling or water sports', afternoon:'Continue exploring or relax at scenic spot', evening:'Comfort food after active day', tip:'Start outdoor activities at sunrise — cooler and crowd-free'},
  {title:'Art & architecture', morning:'Galleries, cathedrals or ancient ruins at opening', afternoon:'Street art walk, artisan workshops, bookshops', evening:'Rooftop bar or sunset terrace', tip:'Many museums are free on the first Sunday of the month'},
  {title:'Slow travel day', morning:'Sunrise walk or meditation, no agenda', afternoon:'Spa, massage or hammam visit', evening:'Light dinner, reflect and recharge', tip:'Over-scheduling is the enemy of genuine travel experiences'},
  {title:'Local life immersion', morning:'Attend a local market, festival or community event', afternoon:'Visit a residential neighbourhood, chat with locals', evening:'Home-style cooking experience or family restaurant', tip:'Learning even 5 phrases in the local language transforms the trip'},
  {title:'Shopping & souvenirs', morning:'Artisan craft markets — buy direct from makers', afternoon:'Bespoke shopping or pottery workshop', evening:'Revisit your favourite spot from the week', tip:'Start bargaining at 60% of asking price, end around 75%'},
  {title:'Nearby town day trip', morning:'Early train or bus to nearby historic town or village', afternoon:'Explore at leisure — local lunch', evening:'Return to base for sunset, light dinner', tip:'Check return transport schedules before you leave'},
  {title:'Final experiences', morning:'Last items on your list — revisit favourites', afternoon:'Final souvenir shopping, packing', evening:'Best dinner of the trip — celebrate', tip:'Photograph your hotel room number so you remember it'},
  {title:'Departure day', morning:'Light breakfast, check out, store bags at hotel', afternoon:'Final wander through city streets', evening:'Transfer to airport or station', tip:'Keep all travel documents accessible in one pocket'},
  {title:'Bonus exploration', morning:'Revisit a favourite spot or explore a new district', afternoon:'Relax at a park, cafe, or scenic overlook', evening:'Try one more dish you have not had yet', tip:'The smallest unplanned moments often become the best memories'}
];

function buildItin(T, name, costMid, days){
  if(!isPro){ openPay(); return; }
  swTab(T,'it');
  if(itinBuilt[T]) return;
  var ph = el(T+'-iph'), cnt = el(T+'-ict');
  if(!ph || !cnt) return;
  ph.innerHTML = `<div class="mini-spin"></div><span>Building your ${days}-day plan for ${name}...</span>`;

  function renderDays(dayList, srcBadge){
    var H = dayList.map(function(day,i){
      var did = 'day_'+T+'_'+i;
      var segs = '';
      if(day.morning) segs += `<div class="day-seg"><div class="seg-time">Morning</div><div class="seg-desc">${day.morning}</div></div>`;
      if(day.afternoon) segs += `<div class="day-seg"><div class="seg-time">Afternoon</div><div class="seg-desc">${day.afternoon}</div></div>`;
      if(day.evening) segs += `<div class="day-seg"><div class="seg-time">Evening</div><div class="seg-desc">${day.evening}</div></div>`;
      if(day.food) segs += `<div class="day-seg"><div class="seg-time">\ud83c\udf5b Eat</div><div class="seg-desc">${day.food}</div></div>`;
      return `<div class="day-card"><div class="day-head" onclick="togDay('${did}')"><div><div class="day-num">Day ${day.day}</div><div class="day-title">${day.title||'Exploration'}</div></div><span class="day-arr" id="arr_${did}">▶</span></div>
        <div class="day-body" id="${did}"><div>${segs}</div>${day.tip?`<div class="day-tip">💡 ${day.tip}</div>`:''}</div></div>`;
    }).join('');
    cnt.innerHTML = (srcBadge||'') + H
      + '<button class="tact" style="display:block;width:100%;margin-top:12px;font-weight:800" onclick="saveTripOffline()">\u2708\ufe0f Save offline \u2014 works with no signal</button>'
      + travelLinksHTML(name)
      + '<button class="tact" style="width:100%;margin-top:8px;border-color:rgba(22,191,150,.5);color:#16BF96" onclick="syncGo(\''+name.replace(/'/g,"\\'")+'\')">\ud83e\udd1d Sync Circle \u2014 I\u2019m going! See who else is</button>'
      + '<button class="tact" style="width:100%;margin-top:8px" onclick="compareModels(\''+name.replace(/'/g,"\\'")+'\','+days+')">\u2694\ufe0f Compare AI engines on this trip</button>'
      + '<button class="rzp-main-btn" style="margin-top:12px;background:linear-gradient(135deg,#9B59F5,#7A3FE0)" onclick="openPdfFlow(\''+T+'\',\''+name.replace(/'/g,"\\'")+'\','+days+',\''+((el('month')||{}).value||'')+'\')">\ud83d\udcd5 Premium PDF itinerary \u2014 \u20b910 (free for Pro)</button>';
    ph.style.display='none'; cnt.style.display='block'; itinBuilt[T]=true;
  }
  function smartBadge(extra){
    return '<div class="itin-src smart">\u26a1 Smart engine (built-in templates)'+(extra?' \u00b7 '+extra:'')+' \u2014 add a working AI key in Settings for a personalised plan</div>';
  }

  var prov=activeProv, key=lsGet('rwKey_'+prov);
  if(prov!=='smart' && key){
    var p = 'You are an expert local guide. Build a '+days+'-day itinerary for '+name+' in '+((el('month')||{}).value||'any month')+'. Budget ~$'+Math.round(costMid/83.5)+' USD/person. Return ONLY JSON (no prose, no markdown): {"days":[{"day":1,"title":"short theme","morning":"SPECIFIC named place + what to do (with timing like 8:30 AM)","afternoon":"SPECIFIC named place + insider tip","evening":"named restaurant/street + exact dish to order","food":"one local speciality with 4-word description","tip":"practical money/crowd/culture tip"}]}. Exactly '+days+' days, every place REAL and specific to '+name+', each field under 110 chars.';
    aiCall(p, 2200, function(err, txt){
      if(txt){
        var d=extractJSON(txt);
        if(d && d.days && d.days.length){
          d.days.forEach(function(x,i){ x.day=x.day||i+1; });
          window._lastItin={name:name, days:d.days, ai:true, model:(lastAiSource||{}).model};
          var who = lastAiSource? (lastAiSource.prov.charAt(0).toUpperCase()+lastAiSource.prov.slice(1)+' \u00b7 '+lastAiSource.model) : 'AI';
          renderDays(d.days, '<div class="itin-src ai">\ud83e\udd16 AI \u00b7 '+who+' \u00b7 personalised for '+name+'</div>');
          return;
        }
        err='AI replied in a broken format';
      }
      var list=[]; for(var i=0;i<days && i<DAY_TEMPLATES.length;i++){ var t=DAY_TEMPLATES[i]; list.push({day:i+1,title:t.title,morning:t.morning,afternoon:t.afternoon,evening:t.evening,tip:t.tip}); }
      window._lastItin={name:name, days:list, ai:false};
      renderDays(list, err? '<div class="itin-src err">\u26a0 '+String(err).slice(0,90)+' \u2014 showing the built-in Smart plan instead. Test your key in Settings.</div>' : smartBadge());
    }, true);
  } else {
    var list=[]; for(var i=0;i<days && i<DAY_TEMPLATES.length;i++){ var t=DAY_TEMPLATES[i]; list.push({day:i+1,title:t.title,morning:t.morning,afternoon:t.afternoon,evening:t.evening,tip:t.tip}); }
    window._lastItin={name:name, days:list, ai:false};
    renderDays(list, smartBadge());
  }
}

function togDay(id){
  var b=el(id), a=el('arr_'+id);
  if(!b) return;
  var o=b.classList.toggle('open');
  if(a) a.classList.toggle('open', o);
}

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

/* PAYMENT */
function openPay(){
  try{ track('pay_opens'); }catch(e){}
  if(typeof PLAY_MODE!=='undefined' && PLAY_MODE && !window.RWBilling){
    showToast('\ud83c\udf89 Pro is FREE for early adopters on this version \u2014 already active on your account!');
    return;
  }
  if(isPro){ showToast('Pro is already active!'); return; }
  el('payOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  var picker=el('planPicker'); if(picker) picker.innerHTML='<div style="text-align:center;font-size:12px;color:var(--t3);padding:10px">Loading plans\u2026</div>';
  el('payMethods').style.display='none';
  /* Founder-offer eligibility needs the live signup count — read it, but never
     block the picker for more than a moment: fail toward showing tiers if the
     read is slow, since the tiers are always valid regardless. */
  var settled=false;
  var to=setTimeout(function(){ if(!settled){ settled=true; renderPlanGrid(false); } }, 2500);
  (window.db? db.collection('meta').doc('signupCounter').get() : Promise.reject()).then(function(snap){
    if(settled) return; settled=true; clearTimeout(to);
    var count = snap && snap.exists ? (snap.data().count||0) : 0;
    renderPlanGrid(RWPricing.founderOfferOpen(count));
  }).catch(function(){ if(settled) return; settled=true; clearTimeout(to); renderPlanGrid(RWPricing.founderOfferOpen()); });
}
function renderPlanGrid(founderOpen){
  var C = RWPricing.CONFIG;
  var fb = el('founderBanner');
  if(founderOpen){
    fb.style.display='block';
    fb.innerHTML = '\ud83d\udd25 FOUNDER PRICE \u2014 \u20b9'+C.FOUNDER_OFFER.priceINR+' lifetime, founding members only ('+Math.max(0,Math.round(C.FOUNDER_OFFER.maxDays-RWPricing.daysSinceLaunch()))+' days left in this window)';
  } else { fb.style.display='none'; }

  var html='';
  if(founderOpen){
    html += '<button class="pay-tab on" style="width:100%;margin-bottom:14px" onclick="pickPlan(\'founder\','+C.FOUNDER_OFFER.priceINR+',\'Founder Pro \u2014 Lifetime\')">'
      +'\ud83c\udf1f Founder Pro \u2014 \u20b9'+C.FOUNDER_OFFER.priceINR+' <small>One payment, forever \u2014 this exact price never comes back</small></button>';
  }

  /* Monthly / yearly tiers */
  var yearly = lsGet('rw_pay_yearly')==='1';
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:6px 0 12px">'
    +'<span style="font-size:12px;color:'+(!yearly?'var(--gold2)':'var(--t3)')+'">Monthly</span>'
    +'<label style="position:relative;display:inline-block;width:38px;height:20px">'
    +'<input type="checkbox" id="yearlyToggle" '+(yearly?'checked':'')+' onchange="lsSet(\'rw_pay_yearly\',this.checked?\'1\':\'0\');renderPlanGrid('+(founderOpen?'true':'false')+')" style="opacity:0;width:0;height:0">'
    +'<span style="position:absolute;inset:0;background:'+(yearly?'var(--gold2)':'#333')+';border-radius:20px;transition:.2s"></span>'
    +'<span style="position:absolute;left:'+(yearly?'20px':'2px')+';top:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s"></span>'
    +'</label><span style="font-size:12px;color:'+(yearly?'var(--gold2)':'var(--t3)')+'">Yearly <b style="color:#16BF96">(save up to 17%)</b></span></div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">';
  C.TIERS.filter(function(t){return t.id!=='free';}).forEach(function(t){
    var price = yearly? t.priceYearly : t.priceMonthly;
    var per = yearly? '/yr' : '/mo';
    var save = RWPricing.yearlySavingsPct(t);
    html += '<button class="tact" style="text-align:left;padding:12px" onclick="pickPlan(\''+t.id+(yearly?'_y':'_m')+'\','+price+',\''+t.label+' '+(yearly?'Yearly':'Monthly')+'\')">'
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
      html += '<button class="tact" style="flex:1;text-align:center;padding:10px 6px" onclick="pickPlan(\''+p.id+'\','+p.priceINR+',\''+group.tierLabel+' '+p.years+'-Year Pass\')">'
        +'<div style="font-size:12px;font-weight:700">'+p.years+'-Year</div><div style="font-size:14px;font-weight:800;color:var(--gold2)">\u20b9'+p.priceINR+'</div></button>';
    });
    html += '</div>';
  });

  /* Short-term micro-passes */
  html += '<div class="section-label">\u26a1 Just need it for one trip?</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:6px">';
  C.SHORT_TERM.forEach(function(p){
    html += '<button class="tact" style="flex:1;text-align:center;padding:10px 6px" onclick="pickPlan(\''+p.id+'\','+p.priceINR+',\''+p.label+'\')">'
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

var PROV_META = {
  groq:     {label:'Groq \u00b7 Llama 3.3 70B', hint:'console.groq.com/keys \u2014 free, no card. Starts with gsk_', url:'https://console.groq.com/keys', ph:'gsk_...'},
  cerebras: {label:'Cerebras \u00b7 Llama 3.3 70B', hint:'cloud.cerebras.ai \u2014 free, no card, ~1M tokens/day', url:'https://cloud.cerebras.ai', ph:'csk-...'},
  github:   {label:'GitHub Models \u00b7 GPT-4o', hint:'github.com/settings/tokens \u2014 free with a GitHub account', url:'https://github.com/settings/tokens', ph:'ghp_...'},
  gemini:   {label:'Google Gemini 2.5 Flash', hint:'aistudio.google.com \u2014 free tier covers 2.5 Flash (Pro/Flash-Lite are paid)', url:'https://aistudio.google.com/apikey', ph:'AIzaSy...'},
  openrouter:{label:'OpenRouter \u00b7 many models', hint:'openrouter.ai/keys \u2014 free slots ~50/day', url:'https://openrouter.ai/keys', ph:'sk-or-...'},
  mistral:  {label:'Mistral', hint:'console.mistral.ai \u2014 free prototyping tier', url:'https://console.mistral.ai/api-keys', ph:'...'},
  anthropic:{label:'Claude (Anthropic)', hint:'console.anthropic.com \u2014 paid only, no free tier', url:'https://console.anthropic.com/settings/keys', ph:'sk-ant-...'}
};
/* Settings key rows are GENERATED from PROV_META, not hand-written HTML.
   Previously they were hardcoded, so newly added providers silently had no
   input at all and openSettings() looked them up with el(p+'Key') => null. */
function renderKeyBoxes(){
  var host=el('keyBoxes'); if(!host) return;
  host.innerHTML = secPanelHTML() + Object.keys(PROV_META).map(function(p){
    var m=PROV_META[p], free = (p==='groq'||p==='cerebras'||p==='github'||p==='gemini');
    return '<div class="key-box">'
      +'<div class="key-box-name">'+m.label+(free?' <span style="font-size:9px;color:#4ADE80;border:1px solid rgba(74,222,128,.4);border-radius:999px;padding:1px 6px;margin-left:4px">no card</span>':'')
      +' <span class="key-status ks-empty" id="'+p+'Status">not set</span></div>'
      +'<div class="key-box-hint"><a href="'+m.url+'" target="_blank" rel="noopener">'+m.hint+'</a></div>'
      +'<div class="key-row"><input class="k-inp" type="password" id="'+p+'Key" placeholder="'+m.ph+'">'
      +'<button class="k-save" onclick="saveKey(\''+p+'\')">Save</button>'
      +'<button class="k-clear" onclick="clearKey(\''+p+'\')">Clear</button>'
      +'<button class="k-save" style="background:var(--teal)" onclick="testKey(\''+p+'\')">Test</button></div>'
      +'</div>';
  }).join('');
}
function openSettings(){
  renderKeyBoxes();
  try{ var tp=el('tabPickWrap'); if(tp) tp.innerHTML=rwTabPickerHTML(); }catch(e){}
  /* ---- UI simplification ----
     Provider choice and API keys are power-user territory: Smart Search works
     with no key at all, so for most people these sections are noise that makes
     Settings look like a developer console. They're collapsed behind an
     "Advanced" toggle, and auto-expanded for anyone who already has a key set
     so existing power users lose nothing. */
  setTimeout(function(){
    var body = document.querySelector('#settingsOverlay .modal-body');
    if(body && !el('advToggle')){
      var secs = body.querySelectorAll('.key-section');
      var adv = [];
      secs.forEach(function(sec){
        var t = (sec.textContent||'');
        if(/AI Mode|API Keys/i.test(t)) adv.push(sec);
      });
      if(adv.length){
        var hasKey = ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].some(function(x){ return lsGet('rwKey_'+x); });
        var btn = document.createElement('button');
        btn.id='advToggle'; btn.className='tact';
        btn.style.cssText='width:100%;margin:4px 0 10px;font-size:12.5px';
        btn.onclick=function(){
          var open = adv[0].style.display!=='none';
          adv.forEach(function(x){ x.style.display = open?'none':''; });
          btn.textContent = (open?'\u2699 Advanced \u2014 AI provider & API keys':'\u2699 Hide advanced');
        };
        adv.forEach(function(x){ x.style.display = hasKey?'':'none'; });
        btn.textContent = hasKey ? '\u2699 Hide advanced' : '\u2699 Advanced \u2014 AI provider & API keys';
        body.insertBefore(btn, body.firstChild);
      }
    }
  }, 0);
  ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].forEach(function(p){
    var inp=el(p+'Key'), stat=el(p+'Status'), val=lsGet('rwKey_'+p);
    if(inp) inp.value=val;
    if(stat){ stat.textContent = val?'set':'not set'; stat.className = 'key-status '+(val?'ks-set':'ks-empty'); }
  });
  document.querySelectorAll('.prov-btn').forEach(function(b){ b.classList.toggle('on', b.dataset.p===activeProv); });
  el('settingsOverlay').classList.add('open'); document.body.style.overflow='hidden';
}
function closeSettings(){ el('settingsOverlay').classList.remove('open'); document.body.style.overflow=''; }

function setProv(p){
  activeProv = p; lsSet('rwProv', p);
  document.querySelectorAll('.prov-btn').forEach(function(b){ b.classList.toggle('on', b.dataset.p===p); });
  var chip = el('modeChip');
  if(chip){
    var labels = {smart:'Smart Mode (free)', gemini:'Gemini AI (free)', groq:'Groq AI (free)', anthropic:'Claude AI'};
    chip.textContent = labels[p]||p;
    chip.className = 'mode-chip '+(p==='anthropic'?'mode-ai':'mode-free');
  }
  showToast(p==='smart' ? 'Smart Search active (no key needed)' : 'AI mode: '+(p.charAt(0).toUpperCase()+p.slice(1)));
}

function saveKey(prov){
  var inp = el(prov+'Key'); if(!inp) return;
  var k = inp.value.trim(); if(!k){ showToast('Enter a key first'); return; }
  lsSet('rwKey_'+prov, k);
  var stat = el(prov+'Status');
  if(stat){ stat.textContent='set'; stat.className='key-status ks-set'; }
  showToast('Key saved for '+prov+'!');
  setProv(prov);
}

function clearKey(prov){
  lsSet('rwKey_'+prov, '');
  var inp = el(prov+'Key'); if(inp) inp.value='';
  var stat = el(prov+'Status');
  if(stat){ stat.textContent='not set'; stat.className='key-status ks-empty'; }
  showToast(prov+' key cleared');
  if(activeProv===prov) setProv('smart');
}



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
var AUTH_READY = FIREBASE_CONFIG.apiKey !== "PASTE_ME";
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

if (AUTH_READY) {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  firebase.auth().onAuthStateChanged(function(u){
    user = u;
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
        if(cloudPro){ lsSet('rw_pro_temp',''); lsSet('rw_pro_temp_uid',''); }
        if(shouldBePro){
          if(!isPro){ isPro=true; lsSet('rwPro','1'); lsSet('rw_pro_uid',u.uid); refreshProUI();
            if(cloudPro){ showToast('Pro active on your account \u2713'); closePay(); }
            else if(trialActive){ var daysLeft=Math.ceil((trialUntil-Date.now())/864e5); showToast('\u23f3 Free trial active \u2014 '+daysLeft+' day'+(daysLeft===1?'':'s')+' of Pro left'); } }
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
} else {
  /* Firebase not configured yet — app still fully works in device-only mode */
  document.addEventListener('DOMContentLoaded', function(){ var b=el('authBtn'); if(b) b.style.display='none'; });
}

function openAuth(){ el('authOverlay').classList.add('open'); }
function closeAuth(){ el('authOverlay').classList.remove('open'); authError(''); }
function authError(m){ var e=el('authErr'); if(!m){e.style.display='none';return;} e.textContent=m; e.style.display='block'; }
function friendly(e){
  var c=(e&&e.code)||'';
  if(c.indexOf('wrong-password')>-1||c.indexOf('invalid-credential')>-1) return 'Wrong email or password.';
  if(c.indexOf('email-already-in-use')>-1) return 'Account exists \u2014 sign in instead.';
  if(c.indexOf('weak-password')>-1) return 'Password needs at least 6 characters.';
  if(c.indexOf('invalid-email')>-1) return 'That email doesn\u2019t look right.';
  if(c.indexOf('too-many-requests')>-1) return 'Too many tries \u2014 wait a minute.';
  return (e&&e.message)||'Something went wrong.';
}
function loginGoogle(){
  if(!AUTH_READY) return showToast('Accounts not configured yet');
  if(window.RW || /RoamWiseApp/i.test(navigator.userAgent)){
    showToast('Google blocks its login inside apps like this one \u2014 use Email (10 seconds), or Google on roamwise.co.in: same account, same Pro.');
    var em=el('authEmail'); if(em) em.focus();
    return;
  }
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(function(){ closeAuth(); showToast('Signed in \u2713'); })
    .catch(function(e){ authError(friendly(e)); });
}
function loginSocial(which){
  if(!AUTH_READY) return showToast('Accounts not configured yet');
  var prov = which==='facebook' ? new firebase.auth.FacebookAuthProvider()
           : new firebase.auth.OAuthProvider('apple.com');
  firebase.auth().signInWithPopup(prov)
    .then(function(){ closeAuth(); showToast('Signed in \u2713'); })
    .catch(function(e){
      var c=(e&&e.code)||'';
      if(c.indexOf('operation-not-allowed')>-1) authError(which.charAt(0).toUpperCase()+which.slice(1)+' login isn\u2019t switched on yet \u2014 use Google or Email meanwhile.');
      else if(c.indexOf('account-exists-with-different-credential')>-1) authError('This email already has an account \u2014 sign in with the method you used first.');
      else authError(friendly(e));
    });
}
function toggleAuthMode(){
  authMode = authMode==='in' ? 'up' : 'in';
  el('authAction').textContent = authMode==='in' ? 'Sign in' : 'Create account';
  el('authToggleRow').innerHTML = authMode==='in'
    ? 'New here? <a onclick="toggleAuthMode()">Create an account</a>'
    : 'Already have an account? <a onclick="toggleAuthMode()">Sign in</a>';
}
function loginEmail(){
  if(!AUTH_READY) return showToast('Accounts not configured yet');
  var em=el('authEmail').value.trim(), pw=el('authPass').value;
  if(!em||!pw) return authError('Enter email and password.');
  var p = authMode==='in'
    ? firebase.auth().signInWithEmailAndPassword(em,pw)
    : firebase.auth().createUserWithEmailAndPassword(em,pw).then(function(c){
        try{ c.user.sendEmailVerification(); showToast('Verification email sent \u2014 check your inbox'); }catch(e){}
        try{ track('signups'); }catch(e){}
        return c; });
  p.then(function(){ closeAuth(); showToast('Signed in \u2713'); }).catch(function(e){ authError(friendly(e)); });
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
    return db.collection('claims').doc(user.uid+'_'+utr).set({
    uid:user.uid, email:user.email||user.phoneNumber||'', utr:utr, amount:parseInt(UPI_AMT,10)||100,
    tier:(UPI_AMT==='299'?'supporter':'pro'), plan:(_selectedPlan&&_selectedPlan.id)||'legacy100', planLabel:(_selectedPlan&&_selectedPlan.label)||'Legacy ₹100',
    status:'pending', created:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(res){
    if(res===undefined) return; /* gated above */
    b.disabled=false; b.textContent='Submit \u27A4'; el('utrInput').value='';
    try{ track('utr_submits'); }catch(e){}
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

/* ===== ADAPTIVE SHELL =====
   APK sets UA "RoamWiseApp"; mobile browsers & installed PWAs get the same
   app-style shell; desktop keeps the classic top navigation. */
var IS_APP = /RoamWiseApp/i.test(navigator.userAgent);
var IS_STANDALONE = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
var IS_TOUCH_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(max-width:768px)').matches);
function applyShell(){
  /* Desktop used to render every section in one endless scroll — the same
     clutter complaint people had on mobile before the shell. The tabbed view
     system now runs everywhere; desktop just gets more room inside each view. */
  document.body.classList.add('shell');
  if(IS_APP || IS_STANDALONE) document.body.classList.add('in-app');
  if(!document.body.dataset.view) document.body.dataset.view='home';
}
applyShell();
/* Must run AFTER the RW_TABS assignment further down this file — function
   declarations hoist but `var RW_TABS = {...}` does not, so calling
   renderTabbar() inline here silently produced an empty bar. DOMContentLoaded
   fires after all deferred script has executed, which is exactly what we want. */
document.addEventListener('DOMContentLoaded', function(){ try{ renderTabbar(); }catch(e){ console.warn('tabbar', e); } });
if(window.matchMedia){ try{ matchMedia('(max-width:768px)').addEventListener('change', function(){ IS_TOUCH_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || matchMedia('(max-width:768px)').matches; applyShell(); }); }catch(e){} }

/* ==================== CUSTOMISABLE BOTTOM NAV ====================
   The tab bar used to be hardcoded, so reaching Store/Copilot/Settings meant
   digging through the drawer. Now every destination is registered once here and
   the traveller picks which five live on the bar (Settings -> Bottom bar).
   Adding a destination = one RW_TABS entry, nothing else. */
var RW_TABS = {
  home:     {icon:'\ud83c\udfd4\ufe0f', label:'Home',     run:function(){ tabGo('home'); }},
  plan:     {icon:'\u2708\ufe0f',      label:'Plan',     run:function(){ tabGo('plan'); }},
  copilot:  {icon:'\ud83e\udded',      label:'Copilot',  run:function(){ tabGo('copilot'); setTimeout(function(){ var i=el('heroInput'); if(i) i.focus(); },300); }},
  explore:  {icon:'\u26e9\ufe0f',      label:'Explore',  run:function(){ tabGo('explore'); }},
  map:      {icon:'\ud83d\uddfa\ufe0f',label:'Map',      run:function(){ openMapExplorer(); }},
  store:    {icon:'\ud83d\udecd\ufe0f',label:'Store',    run:function(){ tabGo('store'); }},
  film:     {icon:'\ud83c\udfac',      label:'Film',     run:function(){ tabGo('film'); }},
  ratings:  {icon:'\u2b50',            label:'Reviews',  run:function(){ tabGo('extras'); }},
  trips:    {icon:'\ud83e\uddf3',      label:'Trips',    run:function(){ openVault(); }},
  group:    {icon:'\ud83e\udd1d',      label:'Group',   run:function(){ openGroupPlanner(); }},
  pro:      {icon:'\ud83d\udc51',      label:'Pro',      run:function(){ openPay(); }},
  settings: {icon:'\u2699\ufe0f',      label:'Settings', run:function(){ openSettings(); }},
  more:     {icon:'\u2630',            label:'More',     run:function(){ openDrawer(); }}
};
var RW_TABS_DEFAULT = ['home','plan','copilot','store','more'];
function rwTabIds(){
  try{
    var v=JSON.parse(lsGet('rw_tabs')||'null');
    if(v && v.length>=3 && v.every(function(k){ return RW_TABS[k]; })) return v.slice(0,5);
  }catch(e){}
  return RW_TABS_DEFAULT;
}
function renderTabbar(){
  var nav=el('tabbar'); if(!nav) return;
  var ids=rwTabIds();
  nav.style.gridTemplateColumns='repeat('+ids.length+',1fr)';
  nav.innerHTML = ids.map(function(k){
    var t=RW_TABS[k];
    return '<button id="tb-'+k+'" onclick="rwTabGo(\''+k+'\')"><span class="ti">'+t.icon+'</span>'+t.label+'</button>';
  }).join('');
  rwTabMark(lsGet('rw_last_tab')||'home');
}
function rwTabGo(k){
  var t=RW_TABS[k]; if(!t) return;
  rwTabMark(k); lsSet('rw_last_tab', k);
  try{ t.run(); }catch(e){}
}
function rwTabMark(k){
  rwTabIds().forEach(function(id){ var b=el('tb-'+id); if(b) b.classList.toggle('on', id===k); });
}
function rwTabPickerHTML(){
  var cur=rwTabIds();
  return '<div class="key-box"><div class="key-box-name">\ud83d\udcf1 Bottom bar \u2014 pick up to 5</div>'
    +'<div class="key-box-hint">Tap to add or remove. These are the shortcuts you reach with one thumb.</div>'
    +'<div id="tabPick" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:9px">'
    + Object.keys(RW_TABS).map(function(k){
        var on=cur.indexOf(k)>-1;
        return '<button onclick="rwTabToggle(\''+k+'\')" style="font-size:11.5px;padding:6px 11px;border-radius:999px;cursor:pointer;'
          +'border:1px solid '+(on?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';'
          +'background:'+(on?'rgba(232,186,108,.16)':'transparent')+';color:'+(on?'var(--gold,#E8BA6C)':'var(--t3)')+'">'
          +RW_TABS[k].icon+' '+RW_TABS[k].label+'</button>';
      }).join('')
    +'</div></div>';
}
function rwTabToggle(k){
  var cur=rwTabIds().slice();
  var i=cur.indexOf(k);
  if(i>-1){ if(cur.length<=3){ showToast('Keep at least 3'); return; } cur.splice(i,1); }
  else { if(cur.length>=5){ showToast('Five is the max \u2014 remove one first'); return; } cur.push(k); }
  lsSet('rw_tabs', JSON.stringify(cur));
  renderTabbar();
  var host=el('tabPickWrap'); if(host) host.innerHTML=rwTabPickerHTML();
}
function tabGo(t){
  try{useBump('tab_'+t);}catch(e){}
  try{ if(window._rvAll) _rvAll(); }catch(e){}
  try{ rwTabMark(t); }catch(e){}
  if(t==='pro'){ openPay(); return; }
  if(t==='more'){ openDrawer(); return; }
  if(document.body.classList.contains('shell')){
    document.body.dataset.view = t;
    window.scrollTo({top:0,behavior:'auto'});
  } else {
    if(t==='home') window.scrollTo({top:0,behavior:'smooth'});
    if(t==='plan'){ var a=el('app'); if(a) window.scrollTo({top:a.offsetTop-58,behavior:'smooth'}); }
    if(t==='explore') scrollToId('treks');
  }
}
/* keep Home/Plan tab in sync with scroll */
(function(){
  var ticking=false;
  window.addEventListener('scroll', function(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      ticking=false;
      if(document.body.classList.contains('shell')) return; /* tabbed views: no scrollspy */
      var payOpen = el('payOverlay').classList.contains('open');
      var drOpen = el('drawer').classList.contains('open');
      if(payOpen||drOpen) return;
      var a=el('app'), tk=el('treks'); if(!a) return;
      var y=window.scrollY;
      var inTrek = tk && y >= tk.offsetTop-140;
      var inPlan = !inTrek && y >= a.offsetTop-120;
      var h=el('tb-home'), p=el('tb-plan'), tb=el('tb-treks');
      if(h) h.classList.toggle('on', !inPlan && !inTrek);
      if(p) p.classList.toggle('on', inPlan);
      if(tb) tb.classList.toggle('on', inTrek);
      var pr=el('tb-pro'), m=el('tb-more'); if(pr)pr.classList.remove('on'); if(m)m.classList.remove('on');
    });
  }, {passive:true});
})();

function openDrawer(){ el('drawer').classList.add('open'); el('drawerBk').classList.add('open'); }
function drToggle(btn){
  var grp=btn.parentElement;
  document.querySelectorAll('.dr-grp.open').forEach(function(g){ if(g!==grp) g.classList.remove('open'); });
  grp.classList.toggle('open');
}
function closeDrawer(){ el('drawer').classList.remove('open'); el('drawerBk').classList.remove('open'); var m=el('tb-more'); if(m)m.classList.remove('on'); }
function drawerAccount(u){
  var box = el('drAcct'); if(!box) return;
  if(u){
    var pic = u.photoURL || ('https://api.dicebear.com/9.x/initials/svg?seed='+encodeURIComponent(u.email||'RW'));
    box.innerHTML = '<div class="dr-acct"><img src="'+pic+'" alt=""><div><div class="n">'+((u.displayName||'Traveler').replace(/[<>]/g,''))+'</div><div class="e">'+((u.email||'').replace(/[<>]/g,''))+'</div></div></div>'+
      '<a class="dr-link dr-signout" onclick="closeDrawer();authMenu()"><span class="ic">&#8618;</span>Sign out</a>'+
      '<a class="dr-link" style="color:var(--t3);font-size:11px" onclick="deleteAccount()"><span class="ic">&#128465;&#65039;</span>Delete my account</a>';
  } else {
    box.innerHTML = '<button class="dr-signin" onclick="closeDrawer();openAuth()">Sign in / Create account</button>';
  }
}
if (AUTH_READY) firebase.auth().onAuthStateChanged(drawerAccount);
document.addEventListener('keydown', function(ev){ if(ev.key==='Escape') closeDrawer(); });

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
  var dl = el('drProLbl'); if(dl) dl.textContent = isPro ? 'Pro active \u2713' : ('Unlock Pro \u2014 '+p);
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


/* ==================== AI TRAVEL COPILOT ====================
   One box, natural language, no menus: "Reaching Manali tomorrow, rain
   expected, find a cafe to work from, bus back to Delhi Sunday, keep it
   under Rs18,000." Parsing is two-tier and honest about both tiers:
   1) If the user has any AI key (existing aiCall stack), the model extracts
      a strict-JSON intent object.
   2) Otherwise a deterministic regex parser covers the core intents.
   Execution NEVER fakes what a static app can't do: weather is fetched live
   (Open-Meteo), budgets are real arithmetic, transport/cafe actions open the
   right partner or Maps deep-link, sharing uses WhatsApp. The footer says
   exactly that. */
function openCopilot(){
  var ov = el('cpOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='cpOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet" style="display:flex;flex-direction:column;max-height:92dvh">'
      +'<div class="sheet-head"><b>\ud83e\udded Travel Copilot</b><button class="x" onclick="closeCopilot()">\u2715</button></div>'
      +'<div id="cpLog" style="flex:1;overflow-y:auto;padding:4px 2px;min-height:120px"></div>'
      +'<div id="cpModels" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px"></div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 6px" id="cpChips"></div>'
      +'<div style="display:flex;gap:8px;align-items:flex-end">'
      +'<textarea id="cpInput" rows="1" placeholder="Type or speak your plan\u2026" style="flex:1;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:11px 12px;color:inherit;font:inherit;resize:none;outline:none"></textarea>'
      +'<button class="tact" id="cpMic" style="padding:11px 12px" onclick="copilotVoice()">\ud83c\udfa4</button>'
      +'<button class="tact" style="padding:11px 14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="copilotSend()">\u27a4</button>'
      +'</div>'
      +'<div style="font-size:9.5px;color:var(--t3);margin-top:6px;line-height:1.5">Copilot plans, calculates and links \u2014 transport &amp; stays open partner sites; nothing is booked or charged inside the app.</div>'
      +'</div>';
    document.body.appendChild(ov);
    el('cpInput').addEventListener('keydown',function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); copilotSend(); } });
    var chips=[['\u26c5 Weather in Goa this week','Weather in Goa this week'],
               ['\ud83d\ude8c Bus Manali \u2192 Delhi Sunday','I need a bus from Manali to Delhi on Sunday'],
               ['\ud83d\udcb0 5 days in Jaipur under \u20b915,000','Plan 5 days in Jaipur under \u20b915,000']];
    el('cpChips').innerHTML = chips.map(function(c){
      return '<button class="tact" style="font-size:10.5px;padding:6px 10px" onclick="el(\'cpInput\').value=\''+c[1].replace(/'/g,"\\'")+'\';copilotSend()">'+c[0]+'</button>';
    }).join('');
    cpBubble('Tell me your plan in one message \u2014 destination, dates, budget, what you need. I\u2019ll sort the pieces.','bot');
  }
  cpModelChips('cpModels');
  rwOverlayOpen('cpOverlay');
  setTimeout(function(){ var i=el('cpInput'); if(i) i.focus(); },150);
}
function cpFocusHero(){
  try{ tabGo('home'); }catch(e){}
  var h=el('copilotHero'); if(!h) { openCopilot(); return; }
  h.scrollIntoView({behavior:'smooth', block:'center'});
  setTimeout(function(){ var i=el('heroInput'); if(i) i.focus(); }, 420);
}
function closeCopilot(){ rwOverlayClose('cpOverlay'); }
var _cpTargetLog='cpLog';
function cpBubble(html, who){
  var log=el(_cpTargetLog)||el('cpLog'); if(!log) return;
  var b=document.createElement('div');
  b.style.cssText = who==='me'
    ? 'margin:6px 0 6px 40px;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border-radius:14px 14px 4px 14px;padding:10px 12px;font-size:12.5px'
    : 'margin:6px 40px 6px 0;background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px 14px 14px 4px;padding:10px 12px;font-size:12.5px;line-height:1.55';
  b.innerHTML=html;
  /* Hero log sits ABOVE the input, so newest goes at the BOTTOM of that log —
     i.e. directly above the box where the eye and thumb already are. */
  log.appendChild(b);
  if(_cpTargetLog==='heroLog'){ log.scrollTop=log.scrollHeight; } else { log.scrollTop=log.scrollHeight; }
  return b;
}
var _cpRec=null;
function copilotVoiceHero(){ rwVoiceStart('heroInput'); }
var _rwVoiceTarget='heroInput';
function rwVoiceStart(targetId){
  _rwVoiceTarget = targetId || 'heroInput';
  /* Inside the APK, Android WebView has NO Web Speech API — the mic looked
     dead there while working fine in Chrome. Use the native bridge instead. */
  if(window.RW && typeof RW.startVoice==='function'){
    try{ RW.startVoice(); showToast('\ud83c\udfa4 Listening\u2026'); return; }catch(e){}
  }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ showToast('Voice input isn\u2019t supported here \u2014 typing works!'); return; }
  var rec=new SR(); rec.lang='en-IN'; rec.interimResults=false;
  rec.onresult=function(ev){ rwVoiceResult(ev.results[0][0].transcript); };
  rec.onerror=function(){ showToast('Didn\u2019t catch that \u2014 try again or type'); };
  try{ rec.start(); showToast('\ud83c\udfa4 Listening\u2026'); }catch(e){}
}
/* Called by the native bridge (and by the web path above) */
function rwVoiceResult(text){
  var inp = el(_rwVoiceTarget) || el('heroInput'); if(!inp || !text) return;
  inp.value = text;
  copilotSend(_rwVoiceTarget==='heroInput');
}
function rwVoiceState(state, msg){
  if(state==='error' && msg) showToast(msg);
  if(state==='listening') showToast('\ud83c\udfa4 Listening\u2026');
}
/* ---- tier 2: deterministic parser (no key needed) ---- */
var _cpHist = []; /* [{q,a}] capped — gives the AI real conversational memory */
function cpModelChips(targetId){
  var host = el(targetId); if(!host) return;
  var provs = ['groq','cerebras','github','gemini','openrouter','mistral','anthropic'].filter(function(p){ return lsGet('rwKey_'+p); });
  var cur = (typeof activeProv!=='undefined')? activeProv : 'smart';
  var chips = [['smart','\u26a1 Ailon Tusk']].concat(provs.map(function(p){ return [p, p.charAt(0).toUpperCase()+p.slice(1)]; }));
  host.innerHTML = chips.map(function(c){
    var on = cur===c[0];
    return '<button onclick="cpSetModel(\'' + c[0] + '\')" style="font-size:10px;padding:4px 10px;border-radius:999px;border:1px solid '
      +(on?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';background:'+(on?'rgba(232,186,108,.14)':'transparent')
      +';color:'+(on?'var(--gold,#E8BA6C)':'var(--t3)')+';cursor:pointer">'+c[1]+'</button>';
  }).join('') + (provs.length? '' : '<button onclick="openWizard()" style="font-size:10px;padding:4px 10px;border-radius:999px;border:1px dashed var(--b2,#2A2A36);background:none;color:var(--t3);cursor:pointer">+ free AI key</button>');
}
function cpSetModel(p){
  activeProv=p; lsSet('rwProv',p);
  cpModelChips('cpModels'); cpModelChips('heroModels');
  showToast(p==='smart' ? '\u26a1 Ailon Tusk \u2014 RoamWise\u2019s own engine: live travel guides, weather and prices (not a language model)' : 'Using '+p);
}
function cpDbFind(text){
  var lower=' '+String(text).toLowerCase()+' ';
  var hit=null;
  DB.forEach(function(d){ if(!hit && lower.indexOf(' '+d.name.toLowerCase())>-1) hit=d; });
  if(!hit){ /* fuzzy: any 5+char token that starts a DB name — scales as DB grows */
    var toks=String(text).toLowerCase().match(/[a-z]{5,}/g)||[];
    DB.forEach(function(d){ if(hit) return; var n=d.name.toLowerCase();
      toks.forEach(function(tk){ if(!hit && n.indexOf(tk)===0) hit=d; }); });
  }
  return hit;
}
function cpSmartAnswer(t){
  var MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var vs=t.match(/(.+?)\s+(?:vs\.?|versus)\s+(.+)/i);
  if(vs){
    var a=cpDbFind(vs[1]), b=cpDbFind(vs[2]);
    if(a&&b&&a!==b){
      function one(d){ return '<b>'+d.name+'</b> ('+d.country+') \u2014 $'+d.cost.budget+'\u2013'+d.cost.mid+'/wk \u00b7 best: '+(d.bestM||[]).map(function(m){return MO[m-1];}).join(',')+' \u00b7 '+d.visa.type; }
      return one(a)+'<br><br>'+one(b)+'<br><br>\ud83e\udd77 Lower cost: <b>'+(a.cost.mid<=b.cost.mid?a.name:b.name)+'</b>';
    }
  }
  var hit=cpDbFind(t);
  if(hit){
    var best=(hit.bestM||[]).map(function(m){return MO[m-1]||m;}).join(', ');
    var low=hit.crowd? MO[hit.crowd.indexOf(Math.min.apply(null,hit.crowd))] : null;
    var out='<b>'+hit.name+'</b> \u00b7 '+hit.country+' ('+hit.region+')';
    if(hit.cost) out+='<br>\ud83d\udcb0 Weekly: $'+hit.cost.budget+' budget \u00b7 $'+hit.cost.mid+' mid \u00b7 $'+hit.cost.luxury+' luxury';
    var dm=t.match(/(\d+)\s*[- ]?\s*day/i);
    if(dm && hit.cost){ var nd=parseInt(dm[1],10); out+='<br>\ud83d\udcc6 '+nd+' days \u2248 $'+Math.round(hit.cost.budget/7*nd)+'\u2013'+Math.round(hit.cost.mid/7*nd)+' (\u2248\u20b9'+Math.round(hit.cost.budget/7*nd*88).toLocaleString('en-IN')+'\u2013'+Math.round(hit.cost.mid/7*nd*88).toLocaleString('en-IN')+')'; }
    if(hit.visa) out+='<br>\ud83d\udec2 '+hit.visa.type+' \u00b7 '+hit.visa.cost+' \u00b7 '+hit.visa.days+' days'+(hit.visa.note? ' \u2014 '+hit.visa.note:'');
    if(best) out+='<br>\ud83d\udcc5 Best months: '+best;
    if(low) out+=' \u00b7 quietest: <b>'+low+'</b>';
    return out;
  }
  return null;
}
function cpParseRegex(t){
  var out={dest:null,to:null,days:null,budget:null,wants:[]};
  var lower=' '+t.toLowerCase()+' ';
  /* budget: 12000 | 12,000 | Rs12000 | ₹12,000 | 8k | under 15k */
  var m=t.match(/(?:\u20b9|rs\.?\s?|inr\s?)?\s?([\d,]{2,})\s?(k\b|thousand)?/i);
  var mk=t.match(/(?:under|below|within|budget(?: of)?|max)?\s*(?:\u20b9|rs\.?|inr)?\s*(\d{1,3})\s*k\b/i);
  if(mk) out.budget=parseInt(mk[1],10)*1000;
  else { var mb=t.match(/(?:\u20b9|rs\.?\s?|inr\s?)\s?([\d,]{3,})|(?:under|below|within|budget(?: of)?|max)\s*(?:\u20b9|rs\.?|inr)?\s*([\d,]{3,})/i);
         if(mb) out.budget=parseInt((mb[1]||mb[2]).replace(/,/g,''),10); }
  var dm=t.match(/(\d+)\s*[- ]?\s*(?:day|night|din)/i); if(dm) out.days=parseInt(dm[1],10);
  /* destination: DB first (incl. fuzzy), then preposition, then leftover-token */
  var hit=cpDbFind(t); if(hit) out.dest=hit.name;
  if(!out.dest){
    /* Take EVERY preposition match, not just the first: "what to eat in Manali"
       used to capture "eat" from "to eat" and then look up a guide for a verb.
       Skip common verbs/fillers, and prefer a capitalised candidate. */
    var VERBS=/^(eat|go|do|see|visit|stay|sleep|travel|reach|get|buy|shop|find|book|know|start|plan|the|a|an|my|it|be|drink|walk|chill|relax|relaxing|peaceful|adventure|romantic|honeymoon|solo|family|spiritual|nature|scenic|foodie|luxury|cheap|party|nightlife|somewhere|anywhere)$/i;
    var re=/(?:\bin|\bto|reaching|\bat|visit(?:ing)?|\bfor|around|near)\s+([A-Za-z][a-zA-Z\u00C0-\u024F]{2,}(?:\s[A-Z][a-zA-Z]{2,})?)/g, mm, cands=[];
    while((mm=re.exec(t))!==null){ var w=mm[1].trim(); if(!VERBS.test(w.split(' ')[0])) cands.push(w); }
    var capped = cands.filter(function(w){ return /^[A-Z]/.test(w); });
    if(capped.length) out.dest=capped[0];
    else if(cands.length) out.dest=cands[0];
  }
  if(!out.dest){
    /* strip filler + numbers + MOOD words; whatever real word remains is the
       place. Mood words (romantic, solo, chill...) were being mistaken for
       destinations, so they're excluded here. */
    var STOP=/^(plan|planning|trip|tour|days?|nights?|budget|under|below|within|max|itinerary|itineraries|for|the|a|an|and|with|my|me|please|need|want|going|go|visit|visiting|show|find|make|create|give|about|cost|costs|price|rs|inr|rupees|k|thousand|weather|rain|cafe|cafes|bus|train|flight|volvo|hotel|stay|stays|from|to|in|at|on|next|week|weekend|tomorrow|today|is|are|it|what|how|much|good|best|place|places|chill|relax|relaxing|peaceful|adventure|adventurous|romantic|honeymoon|solo|family|spiritual|nature|scenic|foodie|luxury|cheap|party|nightlife|workation|somewhere|anywhere|nice|cool|amazing|beautiful)$/i;
    var toks=(t.match(/[A-Za-z\u00C0-\u024F]{3,}/g)||[]).filter(function(w){ return !STOP.test(w); });
    if(toks.length) out.dest=toks[0];
  }
  var mto=t.match(/(?:back to|return to|bus|volvo|train|flight|cab)[^.]*?\bto\s+([A-Za-z][a-zA-Z]{2,})/i);
  if(mto && mto[1] && mto[1].toLowerCase()!==String(out.dest||'').toLowerCase()) out.to=mto[1];
  if(/rain|weather|forecast|temperature|climate/i.test(t)) out.wants.push('weather');
  if(/caf|coffee|work from|wifi/i.test(t)) out.wants.push('cafes');
  if(/bus|volvo|train|flight|transport|cab|taxi/i.test(t)) out.wants.push('transport');
  if(/plan|itinerar|shift|days?|schedule|trip/i.test(t) || out.days) out.wants.push('plan');
  if(/notify|companion|share|tell (?:my|the)/i.test(t)) out.wants.push('share');
  if(/hotel|stay|hostel|resort|room/i.test(t)) out.wants.push('stay');
  if(out.budget!=null) out.wants.push('budget');
  /* ---- VIBE INFERENCE: read the mood/constraints behind the words ----
     This is what turns "somewhere chill near Delhi, not too pricey, long
     weekend" into structured intent instead of a keyword miss. */
  out.vibe = [];
  var VIBES=[
    [/chill|relax|peace|quiet|slow|unwind|laid.?back|shaant|sukoon/i,'relax'],
    [/adventure|thrill|trek|hike|raft|adrenal|extreme|risky/i,'adventure'],
    [/party|nightlife|club|rave|booze|drink|masti/i,'party'],
    [/romantic|honeymoon|couple|partner|wife|husband|girlfriend|boyfriend|bae/i,'romantic'],
    [/family|kids|parents|children|bachche/i,'family'],
    [/spiritual|temple|meditat|yoga|pilgrim|dham|darshan/i,'spiritual'],
    [/nature|scenic|mountain|forest|waterfall|lake|green/i,'nature'],
    [/foodie|food|eat|cuisine|street.?food|khana/i,'food'],
    [/budget|cheap|afford|sasta|kam.?paisa|tight/i,'budget'],
    [/luxury|premium|5.?star|fancy|lavish|shaandaar/i,'luxury'],
    [/solo|alone|myself|akela/i,'solo'],
    [/work|remote|workation|wifi|digital.?nomad/i,'workation']
  ];
  VIBES.forEach(function(v){ if(v[0].test(t)) out.vibe.push(v[1]); });
  /* proximity: "near Delhi", "close to Mumbai", "around Bangalore" */
  var near=t.match(/(?:near|close to|around|from)\s+([A-Z][a-zA-Z]{2,})/);
  if(near) out.near=near[1];
  /* fuzzy duration words when no number given */
  if(out.days==null){
    if(/long weekend|weekend/i.test(t)) out.days=3;
    else if(/week\b/i.test(t)) out.days=7;
    else if(/fortnight|two weeks/i.test(t)) out.days=14;
  }
  /* season/timing hint */
  var MON=/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.exec(t);
  if(MON) out.month=MON[1];
  if(/summer|garmi/i.test(t)) out.season='summer';
  else if(/winter|sardi|snow/i.test(t)) out.season='winter';
  else if(/monsoon|rain|barish/i.test(t)) out.season='monsoon';
  if(!out.wants.length && out.dest) out.wants.push('plan');
  if(out.vibe.length && out.wants.indexOf('plan')===-1) out.wants.push('plan');
  /* learn what this user tends to ask for — powers personalisation over time */
  try{ rwLearnIntent(out); }catch(e){}
  return out;
}
/* ---- SELF-IMPROVING INTENT MEMORY ----
   Every parse feeds a local profile: which vibes, budgets and trip lengths this
   user gravitates to. Ailon Tusk reads it back to fill gaps ("plan Goa" from a
   budget-conscious beach-lover implies a cheaper beach itinerary) and to rank
   suggestions. Stored on-device; nothing leaves the phone unless the user opts
   into aggregate sharing. This is the honest "learns from user data". */
function rwLearnIntent(parsed){
  var m={}; try{ m=JSON.parse(lsGet('rw_intent_profile')||'{}'); }catch(e){}
  m.vibes=m.vibes||{}; m.budgets=m.budgets||[]; m.days=m.days||[]; m.count=(m.count||0)+1;
  (parsed.vibe||[]).forEach(function(v){ m.vibes[v]=(m.vibes[v]||0)+1; });
  if(parsed.budget) { m.budgets.push(parsed.budget); if(m.budgets.length>20) m.budgets.shift(); }
  if(parsed.days)   { m.days.push(parsed.days);     if(m.days.length>20) m.days.shift(); }
  lsSet('rw_intent_profile', JSON.stringify(m));
}
function rwUserProfile(){
  try{
    var m=JSON.parse(lsGet('rw_intent_profile')||'{}');
    var topVibe=null, max=0;
    Object.keys(m.vibes||{}).forEach(function(v){ if(m.vibes[v]>max){ max=m.vibes[v]; topVibe=v; } });
    var avgBudget = (m.budgets&&m.budgets.length)? Math.round(m.budgets.reduce(function(a,b){return a+b;},0)/m.budgets.length) : null;
    var typicalDays = (m.days&&m.days.length)? Math.round(m.days.reduce(function(a,b){return a+b;},0)/m.days.length) : null;
    return {topVibe:topVibe, avgBudget:avgBudget, typicalDays:typicalDays, count:m.count||0};
  }catch(e){ return {topVibe:null,avgBudget:null,typicalDays:null,count:0}; }
}
/* ---- WORLD PLACE RESOLVER ----
   An embedded gazetteer of every country/city/village would be hundreds of MB —
   impossible in a single-file app. Instead we resolve ANY place live through
   Open-Meteo's geocoder (free, keyless, worldwide, includes villages) and cache
   each hit in localStorage, so the app effectively knows the whole map while
   staying a few hundred KB. Curated DB entries still win for depth. */
/* Famous-destination overrides.
   Open-Meteo ranks by population, so India's tourist towns lose to same-named
   suburbs: "Manali" resolved to a Chennai neighbourhood instead of the Himachal
   hill station, "Bir" to Ukraine. For an India-first travel app those are the
   exact queries that must be right, so the best-known travel meaning wins. */
var RW_PLACE_OVERRIDES = {
  manali:{name:'Manali',admin:'Himachal Pradesh',lat:32.2432,lon:77.1892},
  shimla:{name:'Shimla',admin:'Himachal Pradesh',lat:31.1048,lon:77.1734},
  kasol:{name:'Kasol',admin:'Himachal Pradesh',lat:32.0100,lon:77.3152},
  tosh:{name:'Tosh',admin:'Himachal Pradesh',lat:31.9950,lon:77.3600},
  bir:{name:'Bir',admin:'Himachal Pradesh',lat:32.0419,lon:76.7204},
  kufri:{name:'Kufri',admin:'Himachal Pradesh',lat:31.0980,lon:77.2670},
  dharamshala:{name:'Dharamshala',admin:'Himachal Pradesh',lat:32.2190,lon:76.3234},
  mcleodganj:{name:'McLeod Ganj',admin:'Himachal Pradesh',lat:32.2396,lon:76.3200},
  spiti:{name:'Spiti Valley',admin:'Himachal Pradesh',lat:32.2264,lon:78.0716},
  kaza:{name:'Kaza',admin:'Himachal Pradesh',lat:32.2264,lon:78.0716},
  leh:{name:'Leh',admin:'Ladakh',lat:34.1526,lon:77.5771},
  rishikesh:{name:'Rishikesh',admin:'Uttarakhand',lat:30.0869,lon:78.2676},
  haridwar:{name:'Haridwar',admin:'Uttarakhand',lat:29.9457,lon:78.1642},
  nainital:{name:'Nainital',admin:'Uttarakhand',lat:29.3803,lon:79.4636},
  mussoorie:{name:'Mussoorie',admin:'Uttarakhand',lat:30.4598,lon:78.0644},
  almora:{name:'Almora',admin:'Uttarakhand',lat:29.5971,lon:79.6591},
  munsiyari:{name:'Munsiyari',admin:'Uttarakhand',lat:30.0672,lon:80.2386},
  auli:{name:'Auli',admin:'Uttarakhand',lat:30.5290,lon:79.5660},
  jaisalmer:{name:'Jaisalmer',admin:'Rajasthan',lat:26.9157,lon:70.9083},
  udaipur:{name:'Udaipur',admin:'Rajasthan',lat:24.5854,lon:73.7125},
  pushkar:{name:'Pushkar',admin:'Rajasthan',lat:26.4899,lon:74.5511},
  mountabu:{name:'Mount Abu',admin:'Rajasthan',lat:24.5926,lon:72.7156},
  gokarna:{name:'Gokarna',admin:'Karnataka',lat:14.5479,lon:74.3188},
  hampi:{name:'Hampi',admin:'Karnataka',lat:15.3350,lon:76.4600},
  coorg:{name:'Coorg (Madikeri)',admin:'Karnataka',lat:12.4244,lon:75.7382},
  munnar:{name:'Munnar',admin:'Kerala',lat:10.0889,lon:77.0595},
  alleppey:{name:'Alleppey',admin:'Kerala',lat:9.4981,lon:76.3388},
  wayanad:{name:'Wayanad',admin:'Kerala',lat:11.6854,lon:76.1320},
  ooty:{name:'Ooty',admin:'Tamil Nadu',lat:11.4064,lon:76.6932},
  kodaikanal:{name:'Kodaikanal',admin:'Tamil Nadu',lat:10.2381,lon:77.4892},
  pondicherry:{name:'Pondicherry',admin:'Puducherry',lat:11.9416,lon:79.8083},
  darjeeling:{name:'Darjeeling',admin:'West Bengal',lat:27.0360,lon:88.2627},
  gangtok:{name:'Gangtok',admin:'Sikkim',lat:27.3389,lon:88.6065},
  tawang:{name:'Tawang',admin:'Arunachal Pradesh',lat:27.5860,lon:91.8590},
  ziro:{name:'Ziro',admin:'Arunachal Pradesh',lat:27.5448,lon:93.8340},
  shillong:{name:'Shillong',admin:'Meghalaya',lat:25.5788,lon:91.8933},
  cherrapunji:{name:'Cherrapunji',admin:'Meghalaya',lat:25.3000,lon:91.7000},
  varanasi:{name:'Varanasi',admin:'Uttar Pradesh',lat:25.3176,lon:82.9739},
  khajuraho:{name:'Khajuraho',admin:'Madhya Pradesh',lat:24.8318,lon:79.9199},
  portblair:{name:'Port Blair',admin:'Andaman & Nicobar',lat:11.6234,lon:92.7265}
};
var RW_PLACE_CACHE={};
async function rwResolvePlace(name){
  if(!name) return null;
  var key='rw_geo_'+String(name).toLowerCase().replace(/[^a-z0-9]/g,'');
  if(RW_PLACE_CACHE[key]) return RW_PLACE_CACHE[key];
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c){ RW_PLACE_CACHE[key]=c; return c; } }catch(e){}
  /* curated meaning first — no network needed, and never wrong */
  var ovKey = String(name).toLowerCase().replace(/[^a-z]/g,'');
  if(RW_PLACE_OVERRIDES[ovKey]){
    var o = RW_PLACE_OVERRIDES[ovKey];
    var place = {name:o.name, country:'India', cc:'IN', admin:o.admin, lat:o.lat, lon:o.lon,
                 pop:null, elev:null, tz:'Asia/Kolkata'};
    RW_PLACE_CACHE[key]=place; lsSet(key, JSON.stringify(place));
    return place;
  }
  if(!navigator.onLine) return null;
  try{
    var fix = (typeof CITY_NAME_FIXUPS!=='undefined') ? CITY_NAME_FIXUPS[String(name).toLowerCase().replace(/[^a-z]/g,'')] : null;
    var q = fix || name;
    var g = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&name='+encodeURIComponent(q)).then(function(r){return r.json();});
    var list = g.results||[]; if(!list.length) return null;
    /* Rank properly: the geocoder happily returns fuzzy foreign matches first
       ("Kufri" -> a village in Türkiye). Exact name match wins, then bigger
       population — that keeps real destinations ahead of coincidences. */
    var qn = String(q).toLowerCase().trim();
    /* Ranking, in order: exact name match, then home country, then population.
       The home-country tiebreak matters because the dataset carries namesakes
       with NO population data ("Kufri" exists in Pakistan and in Himachal) —
       and for an India-first travel app the Indian one is the right default. */
    var HOME = (typeof RW_HOME_CC!=='undefined' && RW_HOME_CC) ? RW_HOME_CC : 'IN';
    list.sort(function(a,b){
      var ax = (String(a.name).toLowerCase()===qn)?0:1, bx = (String(b.name).toLowerCase()===qn)?0:1;
      if(ax!==bx) return ax-bx;
      var ah = (a.country_code===HOME)?0:1, bh = (b.country_code===HOME)?0:1;
      if(ah!==bh) return ah-bh;
      return (b.population||0)-(a.population||0);
    });
    var h = list[0];
    var place = {name:h.name, country:h.country||'', cc:h.country_code||'', admin:h.admin1||'',
                 lat:h.latitude, lon:h.longitude, pop:h.population||null, elev:h.elevation||null, tz:h.timezone||''};
    RW_PLACE_CACHE[key]=place; lsSet(key, JSON.stringify(place));
    return place;
  }catch(e){ return null; }
}
function copilotSend(fromHero){
  var inp = el(fromHero? 'heroInput' : 'cpInput');
  var t=(inp && inp.value||'').trim(); if(!t) return;
  inp.value='';
  if(fromHero){
    /* Conversation flows vertically right on the page — no popup. */
    _cpTargetLog='heroLog';
    var hl=el('heroLog'); if(hl) hl.style.display='block';
  } else { _cpTargetLog='cpLog'; }
  cpBubble(t.replace(/[<>]/g,''),'me');
  /* App navigation intents: "open settings", "go to store", "show my trips"… */
  var NAV=[[/settings|api key/i,'Settings',function(){openSettings();}],
    [/store|merch/i,'the Store',function(){tabGo('home');var st=el('store');if(st){var fh=st.querySelector('.fold-head');if(fh&&!fh.classList.contains('open'))fh.click();st.scrollIntoView({behavior:'smooth'});}}],
    [/music/i,'your Music',function(){openMusic();}],
    [/profile|account/i,'your Profile',function(){openProfile();}],
    [/my trips|vault|offline trip/i,'My Trips',function(){openVault();}],
    [/saved/i,'Saved items',function(){showSaved();}],
    [/\bpro\b|upgrade|subscri/i,'Pro plans',function(){openPay();}],
    [/wizard|free (ai )?key/i,'the AI key wizard',function(){openWizard();}],
    [/trek/i,'Trek Vault',function(){tabGo('treks');}],
    [/explore/i,'Explore',function(){tabGo('explore');}]];
  if(/\b(open|go to|goto|take me|show( me)?|launch)\b/i.test(t)){
    for(var ni=0;ni<NAV.length;ni++){
      if(NAV[ni][0].test(t)){
        cpBubble('\ud83d\udc49 Opening '+NAV[ni][1]+'\u2026','bot');
        try{ NAV[ni][2](); }catch(e){}
        try{ track('copilot_uses'); }catch(e){}
        return;
      }
    }
  }
  var thinking=cpBubble('\u2026','bot');
  var intents = cpParseRegex(t);
  var hasKey = (typeof activeProv!=='undefined') && activeProv!=='smart' && lsGet('rwKey_'+activeProv);
  if(hasKey){
    /* Real conversation: persona + history + the new message. Any topic is
       fine — the model answers naturally; travel intents ADDITIONALLY get
       action links appended below the answer. */
    var hist=_cpHist.slice(-6).map(function(h){ return 'User: '+h.q+'\nCopilot: '+h.a; }).join('\n');
    /* Ground the model in the real guide before it answers — this is what stops
       confident-but-wrong replies about small towns. */
    (intents.dest ? wvGuide(intents.dest) : Promise.resolve(null)).then(function(g){
      var facts = g && g.extract ? 'Verified guide text for '+g.title+': '+g.extract.slice(0,600)+'\n' : '';
      var prompt='You are RoamWise Copilot \u2014 a sharp, friendly travel companion built into a travel-planning app. '
        +'Answer helpfully and concisely (under 120 words). Prefer the verified guide text below over your own recollection; if it contradicts you, trust it. Say plainly when you are unsure. No markdown headers.\n'
        +facts+(hist? 'Conversation so far:\n'+hist+'\n':'')+'User: '+t+'\nCopilot:';
      aiCall(prompt, 400, function(err, txt){
        var answer = (txt||'').trim() || 'The AI didn\u2019t answer \u2014 here\u2019s what my own engine has.';
        if(intents.dest) rwLearn(intents.dest);
        cpFinish(thinking, answer.replace(/</g,'&lt;'), intents, t);
      });
    });
  } else {
    /* Ailon Tusk: curated DB first (fastest, richest), then the live travel
       guide for anywhere on Earth, and only then admit it needs a key. This is
       what turned "generic answers" into real ones. */
    var kb = cpSmartAnswer(t);
    var place = intents.dest;
    if(place){
      wvAnswer(place, t).then(function(guide){
        var body = [kb, guide].filter(Boolean).join('<hr style="border:none;border-top:1px dashed var(--b2,#2A2A36);margin:10px 0">');
        if(!body) body = 'I don\u2019t have a guide for \u201c'+String(place).replace(/[<>]/g,'')+'\u201d yet \u2014 try a nearby town, or add a free AI key for open-ended answers: <button class="tact" style="font-size:11px;padding:4px 10px" onclick="openWizard()">Get a free key</button>';
        cpFinish(thinking, body, intents, t);
      }).catch(function(){ cpFinish(thinking, kb||'', intents, t); });
    } else {
      var canned = kb || 'I cover destinations, weather, budgets, transport and sharing. For open-ended conversation, add a free AI key \u2014 takes 2 minutes: <button class="tact" style="font-size:11px;padding:4px 10px" onclick="openWizard()">Get a free key</button>';
      cpFinish(thinking, canned, intents, t);
    }
  }
}
async function cpFinish(bubble, answerHTML, intents, raw){
  var actions = await cpActionsHTML(intents);
  var parts=[]; if(answerHTML) parts.push(answerHTML);
  if(actions.length) parts.push(actions.join('<br><br>'));
  if(!parts.length) parts.push('I can handle destinations, dates, budgets, weather, cafes, buses/trains and sharing \u2014 try: \u201cPlan 4 days in Udaipur under \u20b912,000.\u201d');
  bubble.innerHTML = parts.join('<hr style="border:none;border-top:1px dashed var(--b2,#2A2A36);margin:10px 0">');
  var log=el(_cpTargetLog)||el('cpLog');
  if(log) log.scrollTop=log.scrollHeight;
  _cpHist.push({q:raw, a:bubble.textContent.slice(0,300)}); if(_cpHist.length>8) _cpHist.shift();
  try{ track('copilot_uses'); }catch(e){}
}
function cpGoPlan(dest, days){
  closeCopilot();
  var di=el('destInput'); if(di) di.value=dest;
  if(days){ var ds=el('days'); if(ds){ var opt=[].slice.call(ds.options||[]).filter(function(o){ return parseInt(o.value,10)===parseInt(days,10); })[0]; if(opt) ds.value=opt.value; } }
  tabGo('plan');
  try{ runSearch(); }catch(e){}
}
async function cpActionsHTML(it){
  var H=[];
  var dbHit = it.dest ? cpDbFind(String(it.dest)) : null;
  var lat = dbHit? dbHit.lat : null, lon = dbHit? dbHit.lon : null, geo=null;
  if(it.dest && lat==null){
    geo = await rwResolvePlace(it.dest);
    if(geo){ lat=geo.lat; lon=geo.lon; it.dest=geo.name; }
  }
  if(it.dest){
    var head='<b>\ud83d\udccd '+String(it.dest).replace(/[<>]/g,'')+'</b>';
    if(dbHit) head+=' \u00b7 '+dbHit.country+' \u00b7 <span style="color:var(--gold2,#C8913E)">in your library</span>';
    else if(geo){
      head+=' \u00b7 '+[geo.admin,geo.country].filter(Boolean).join(', ');
      var bits=[];
      if(geo.pop) bits.push(geo.pop.toLocaleString('en-IN')+' people');
      if(geo.elev) bits.push(Math.round(geo.elev)+'m elevation');
      if(geo.tz) bits.push(geo.tz);
      if(bits.length) head+='<br><span style="font-size:11px;color:var(--t3)">'+bits.join(' \u00b7 ')+'</span>';
    }
    H.push(head);
  }
  /* weather */
  if(it.wants.indexOf('weather')>-1){
    if(lat!=null && navigator.onLine){
      try{
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto').then(function(r){return r.json();});
        if(w&&w.daily){
          var rows=w.daily.time.map(function(d,i){
            var rain=w.daily.precipitation_probability_max[i];
            return new Date(d).toLocaleDateString('en-IN',{weekday:'short'})+' '+Math.round(w.daily.temperature_2m_min[i])+'\u2013'+Math.round(w.daily.temperature_2m_max[i])+'\u00b0'+(rain>=40? ' \ud83c\udf27'+rain+'%':'');
          }).join(' \u00b7 ');
          H.push('\u26c5 '+rows+(w.daily.precipitation_probability_max[0]>=40? '<br><span style="color:#5CC8FF">Rain likely \u2014 front-load indoor stops (cafes, museums, markets) early in the day.</span>':''));
        }
      }catch(e){ H.push('\u26c5 Forecast unavailable right now.'); }
    } else H.push('\u26c5 Forecast needs internet'+(it.dest?'':' and a destination'));
  }
  /* cafes */
  if(it.wants.indexOf('cafes')>-1 && it.dest){
    H.push('\u2615 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('cafes with wifi in '+it.dest)+'">Work-friendly cafes in '+it.dest+' \u2192</a>');
  }
  /* transport */
  if(it.wants.indexOf('transport')>-1 && it.dest){
    var dst = it.to || 'Delhi';
    H.push('\ud83d\ude8c <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.rome2rio.com/s/'+encodeURIComponent(it.dest)+'/'+encodeURIComponent(dst)+'">All routes '+it.dest+' \u2192 '+dst+'</a> \u00b7 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.redbus.in/">redBus (Volvo/sleeper) \u2192</a>');
  }
  /* stays */
  if(it.wants.indexOf('stay')>-1 && it.dest){
    H.push('\ud83c\udfe8 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="'+stayUrl(it.dest)+'">Compare stays on Booking</a> \u00b7 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="'+stayUrlAgoda(it.dest)+'">Agoda</a>');
  }
  /* shadow budget — the differentiator: costs no competitor quotes */
  var costEntry = dbHit || costEntryForPlace(geo);
  if(costEntry && (it.days || it.wants.indexOf('budget')>-1)){
    H.push(shadowBudgetHTML(costEntry, it.days||5, 'mid'));
  }
  /* personalise from what we've learned about this user */
  var prof = rwUserProfile();
  if(prof.count>=3 && prof.topVibe && it.dest && (!it.vibe || !it.vibe.length)){
    H.push('<div style="font-size:11px;color:var(--t3)">\ud83d\udca1 You usually lean <b>'+prof.topVibe+'</b>'
      +(prof.typicalDays? ' \u00b7 ~'+prof.typicalDays+'-day trips':'')
      +(prof.avgBudget? ' \u00b7 around \u20b9'+prof.avgBudget.toLocaleString('en-IN'):'')
      +' \u2014 tuning suggestions that way.</div>');
  }
  /* what's actually at this place — real mapped spots, not vibes */
  if(lat!=null && lon!=null){
    try{
      var spots = await osmAttractions(lat, lon);
      if(spots.length) H.push(osmAttractionsHTML(spots, it.dest));
    }catch(e){}
  }
  /* the fun bit: a witty, destination-aware voice note */
  if(it.dest && (dbHit||geo)){
    H.push(tuskVoiceNoteHTML(it.dest, dbHit||costEntry));
  }
  /* budget */
  if(it.budget!=null){
    var line='\ud83d\udcb0 \u20b9'+it.budget.toLocaleString('en-IN');
    if(it.days) line+=' over '+it.days+' days = <b>\u20b9'+Math.round(it.budget/it.days).toLocaleString('en-IN')+'/day</b>';
    if(dbHit&&dbHit.cost) line+=' <span style="color:var(--t3)">(typical mid-range there \u2248 $'+dbHit.cost.mid+'/week)</span>';
    H.push(line);
  }
  /* plan */
  if(it.wants.indexOf('plan')>-1 && it.dest){
    /* Hand off WITH the data: destination goes straight into the Plan tab's
       search — works for DB destinations and unknown ones alike. */
    H.push('\ud83d\uddfa Build the day-by-day plan '+(it.days? '('+it.days+' days) ':'')+'with budget breakdown, packing list and <b>PDF download</b>:'
      +'<br><button class="tact" style="font-size:12px;padding:7px 12px;margin-top:6px;font-weight:800" onclick="cpGoPlan(\''+String(it.dest).replace(/[<>']/g,'')+'\','+(it.days||0)+')">\ud83d\udcc5 Plan '+String(it.dest).replace(/[<>]/g,'')+' \u2192</button>');
  }
  /* share */
  if(it.wants.indexOf('share')>-1){
    var summary='RoamWise plan: '+(it.dest||'trip')+(it.days? ' \u00b7 '+it.days+' days':'')+(it.budget? ' \u00b7 under \u20b9'+it.budget.toLocaleString('en-IN'):'')+' \u2014 roamwise.co.in';
    H.push('\ud83d\udc65 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(summary)+'">Send this plan to companions on WhatsApp \u2192</a>');
  }
  return H;
}

/* ==================== TRIP VAULT — offline itinerary access ====================
   Saved trips live in localStorage (not the SW cache): they're user data, not
   network responses, so they survive offline, airplane mode and dead zones with
   no network dependency at all. The service worker already keeps the app shell
   available offline, so vault + shell = a fully usable trip planner on a plane. */
function vaultGet(){ try{ return JSON.parse(lsGet('rw_trips')||'[]'); }catch(e){ return []; } }
function vaultSave(list){ lsSet('rw_trips', JSON.stringify(list.slice(0,50))); }
function saveTripOffline(){
  var it = window._lastItin;
  if(!it || !it.days || !it.days.length){ showToast('Generate an itinerary first'); return; }
  var list = vaultGet();
  var id = 'trip_'+Date.now();
  var startVal = (el('tripStart')||{}).value || '';
  list.unshift({
    id:id, name:it.name, days:it.days, ai:!!it.ai,
    month:(el('month')||{}).value||'', start:startVal,
    savedAt:Date.now()
  });
  vaultSave(list);
  showToast('\u2708\ufe0f Saved offline \u2014 works with no signal');
  try{ track('trip_saved'); }catch(e){}
  try{ xpAdd(10,'Trip saved for offline'); }catch(e){}
}
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
function openVault(){
  var list = vaultGet();
  var ov = el('vaultOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id='vaultOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\u2708\ufe0f My Trips \u2014 offline</b>'
      +'<button class="x" onclick="closeVault()">\u2715</button></div>'
      +'<div id="vaultBody" style="padding:8px 2px 16px;overflow-y:auto;flex:1 1 auto;min-height:0"></div></div>';
    document.body.appendChild(ov);
  }
  var b = el('vaultBody');
  if(!list.length){
    b.innerHTML='<div style="text-align:center;padding:28px 16px;color:var(--t3);font-size:13px;line-height:1.6">'
      +'<div style="font-size:34px;margin-bottom:8px">\ud83c\udf0f</div>'
      +'No saved trips yet.<br>Generate an itinerary, then tap <b>Save offline</b> \u2014 it\u2019ll work with zero signal.</div>';
  } else {
    b.innerHTML = list.map(function(t){
      var when = new Date(t.savedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
      return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
        +'<div><div style="font-weight:800;font-size:14px">'+String(t.name).replace(/[<>]/g,'')+'</div>'
        +'<div style="font-size:11px;color:var(--t3)">'+t.days.length+' days \u00b7 saved '+when+(t.ai?' \u00b7 \ud83e\udd16 AI':'')+'</div></div>'
        +'<div style="display:flex;gap:6px">'
        +'<button class="tact" style="font-size:11px;padding:6px 10px" onclick="openVaultTrip(\''+t.id+'\')">Open</button>'
        +'<button class="tact" style="font-size:11px;padding:6px 8px" onclick="deleteVaultTrip(\''+t.id+'\')">\ud83d\uddd1</button>'
        +'</div></div></div>';
    }).join('');
  }
  rwOverlayOpen('vaultOverlay');
}
function closeVault(){ rwOverlayClose('vaultOverlay'); }
function deleteVaultTrip(id){
  vaultSave(vaultGet().filter(function(t){ return t.id!==id; }));
  openVault(); showToast('Removed');
}
function openVaultTrip(id){
  var t = vaultGet().filter(function(x){ return x.id===id; })[0];
  if(!t) return;
  if(!el('vaultBody')) openVault(); /* self-sufficient: create the overlay if entered directly */
  var H = t.days.map(function(day){
    var segs='';
    ['morning','afternoon','evening','food'].forEach(function(k){
      if(day[k]) segs += '<div style="margin:6px 0"><div style="font-size:10px;letter-spacing:.08em;color:var(--gold2,#C8913E);text-transform:uppercase">'+(k==='food'?'\ud83c\udf5b Eat':k)+'</div>'
        +'<div style="font-size:12.5px;line-height:1.55">'+String(day[k]).replace(/[<>]/g,'')+'</div></div>';
    });
    return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
      +'<div style="font-weight:800;font-size:13px;color:var(--gold2,#C8913E)">Day '+day.day+' \u00b7 '+String(day.title||'').replace(/[<>]/g,'')+'</div>'
      +segs+(day.tip?'<div style="margin-top:8px;font-size:11.5px;color:var(--t2);border-top:1px dashed var(--b2,#2A2A36);padding-top:7px">\ud83d\udca1 '+String(day.tip).replace(/[<>]/g,'')+'</div>':'')
      +'</div>';
  }).join('');
  el('vaultBody').innerHTML =
    '<button class="tact" style="font-size:11px;padding:6px 10px;margin-bottom:10px" onclick="openVault()">\u2190 All trips</button>'
    +'<div style="font-weight:800;font-size:16px;margin-bottom:2px">'+String(t.name).replace(/[<>]/g,'')+'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-bottom:12px">Available offline \u00b7 '+t.days.length+' days</div>'
    + '<button class="tact" style="width:100%;margin-top:10px;font-weight:800" onclick="tripChatById(\''+t.id+'\')">\ud83d\udcac Open group chat</button>'
    + H + travelLinksHTML(t.name)
    + '<div id="tripExtras"></div>';
  loadTripExtras(t);
}

/* ---- Trip extras: weather, money, safety — all free, no-key APIs ----
   Open-Meteo (already our geocoder) for a 7-day forecast; Frankfurter
   (ECB rates, keyless, current domain api.frankfurter.dev) for currency.
   Coordinates are geocoded once and cached back onto the saved trip, so
   repeat opens cost zero lookups. Fully graceful offline: the trip itself
   always renders; extras simply say they need internet. */
async function loadTripExtras(t){
  var host = el('tripExtras'); if(!host) return;
  var out = [];

  /* Safety essentials — deliberately generic and honest: emergency numbers
     and search links, never invented "areas to avoid". */
  out.push('<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px;margin-bottom:6px">\ud83d\udee1 Safety essentials</div>'
    +'<div style="font-size:11.5px;color:var(--t2);line-height:1.7">'
    +'\ud83c\uddee\ud83c\uddf3 India all-in-one emergency: <b>112</b> \u00b7 Tourist helpline: <b>1363</b><br>'
    +'\ud83c\udfe5 <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('hospitals near '+t.name)+'">Hospitals near '+String(t.name).replace(/[<>]/g,'')+'</a>'
    +' \u00b7 \ud83d\udc6e <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('police station near '+t.name)+'">Police</a><br>'
    +'\ud83d\udca1 Keep digital + paper copies of ID \u00b7 agree taxi fares before boarding \u00b7 \u201cfree\u201d guides and closed-hotel claims are the two classic scams</div></div>');

  host.innerHTML = out.join('') + '<div id="tripLive" style="margin-top:10px;font-size:11px;color:var(--t3)">\u26c5 Loading forecast\u2026</div>';

  if(!navigator.onLine){ el('tripLive').textContent='\u26c5 Forecast & rates need internet \u2014 everything above works offline.'; return; }
  try{
    /* geocode once, cache into the saved trip */
    if(typeof t.lat!=='number'){
      var g = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(t.name)).then(function(r){return r.json();});
      var hit = (g.results||[])[0];
      if(hit){ t.lat=hit.latitude; t.lon=hit.longitude;
        var L=vaultGet(); L.forEach(function(x){ if(x.id===t.id){ x.lat=t.lat; x.lon=t.lon; } }); vaultSave(L); }
    }
    var live=[];
    if(typeof t.lat==='number'){
      var w = await fetch('https://api.open-meteo.com/v1/forecast?latitude='+t.lat+'&longitude='+t.lon
        +'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto')
        .then(function(r){return r.json();});
      if(w && w.daily && w.daily.time){
        var days = w.daily.time.map(function(d,i){
          var dt=new Date(d), rain=w.daily.precipitation_probability_max[i];
          return '<div style="text-align:center;min-width:44px"><div style="font-size:9.5px;color:var(--t3)">'+dt.toLocaleDateString('en-IN',{weekday:'short'})+'</div>'
            +'<div style="font-size:12px;font-weight:700">'+Math.round(w.daily.temperature_2m_max[i])+'\u00b0</div>'
            +'<div style="font-size:9.5px;color:var(--t3)">'+Math.round(w.daily.temperature_2m_min[i])+'\u00b0</div>'
            +'<div style="font-size:9px;color:'+(rain>=50?'#5CC8FF':'var(--t3)')+'">'+(rain!=null? rain+'%\ud83c\udf27':'')+'</div></div>';
        }).join('');
        live.push('<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
          +'<div style="font-weight:800;font-size:12.5px;margin-bottom:8px">\u26c5 Next 7 days in '+String(t.name).replace(/[<>]/g,'')+'</div>'
          +'<div style="display:flex;gap:4px;overflow-x:auto">'+days+'</div></div>');
        /* act on the forecast instead of just displaying it */
        try{ var rs = rainSwapHTML(t, w.daily); if(rs) live.push(rs); }catch(e){}
        /* and the shadow budget for this trip, if we know the destination */
        try{
          var dbe = cpDbFind(t.name) || costEntryForPlace(await rwResolvePlace(t.name));
          if(dbe) live.push(shadowBudgetHTML(dbe, t.days.length, 'mid'));
        }catch(e){}
      }
    }
    /* currency mini-panel: INR vs the majors */
    try{
      var fx = await fetch('https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP,THB,IDR,AED,JPY')
        .then(function(r){return r.json();});
      if(fx && fx.rates){
        var rows = Object.keys(fx.rates).map(function(c){
          return '<div style="display:flex;justify-content:space-between;font-size:11.5px;padding:2px 0"><span style="color:var(--t3)">\u20b91,000 \u2192</span><b>'+(fx.rates[c]*1000).toFixed(2)+' '+c+'</b></div>';
        }).join('');
        live.push('<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:12px 14px;margin-bottom:10px">'
          +'<div style="font-weight:800;font-size:12.5px;margin-bottom:6px">\ud83d\udcb1 Your \u20b91,000 abroad <span style="font-weight:400;font-size:9.5px;color:var(--t3)">ECB rates \u00b7 '+fx.date+'</span></div>'+rows+'</div>');
      }
    }catch(e){}
    el('tripLive').outerHTML = live.join('') || '';
  }catch(e){ var tl=el('tripLive'); if(tl) tl.textContent='\u26c5 Forecast unavailable right now.'; }
}

/* ==================== FREE AFFILIATE / DEEP LINKS ====================
   Every link here is a plain public search URL that works with NO partnership,
   NO approval and NO traffic minimum. Where a programme exists, the affiliate
   ID is an optional constant appended only if set — so revenue can be switched
   on later by filling one string, with zero code changes. */
var AFF_SKYSCANNER='', AFF_AGODA='', AFF_GYG='';
function flightUrl(place){
  return 'https://www.google.com/travel/flights?q=' + encodeURIComponent('flights to '+place);
}
function trainBusUrl(place){
  /* Rome2Rio covers trains, buses and ferries worldwide with no signup. */
  return 'https://www.rome2rio.com/s/' + encodeURIComponent(place);
}
function stayUrlAgoda(place){
  var u='https://www.agoda.com/search?city='+encodeURIComponent(place);
  if(AFF_AGODA) u+='&cid='+AFF_AGODA; return u;
}
function thingsUrl(place){
  var u='https://www.getyourguide.com/s/?q='+encodeURIComponent(place);
  if(AFF_GYG) u+='&partner_id='+AFF_GYG; return u;
}
function travelLinksHTML(place){
  var L=[
    ['\ud83c\udfe8 Stays', stayUrl(place)],
    ['\u2708\ufe0f Flights', flightUrl(place)],
    ['\ud83d\ude86 Trains & buses', trainBusUrl(place)],
    ['\ud83c\udfab Things to do', thingsUrl(place)]
  ];
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">'
    + L.map(function(x){
        return '<a class="tact" style="text-align:center;text-decoration:none;font-size:12px;padding:10px 6px" target="_blank" rel="noopener" href="'+x[1]+'" onclick="try{track(\'aff_click\')}catch(e){}">'+x[0]+'</a>';
      }).join('')
    + '</div>';
}

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

/* ==================== PROOF STAMP (verifiable journey fingerprint) ==========
   An honest cryptographic stamp, not marketing. SHA-256 over the exact journey
   contents produces a fingerprint that changes if even one character of the
   log is altered — so two people can verify a certificate is unmodified by
   recomputing it. This is free, instant, offline and needs no chain.
   NOTE ON "BLOCKCHAIN": writing this hash to a public chain costs gas on every
   chain worth trusting, so it is NOT enabled by default (it would cost money
   per certificate). The hash below is exactly what you'd anchor if you ever
   choose to — the design is anchor-ready, deliberately not anchor-billed. */
async function proofStamp(payloadStr){
  try{
    var buf = new TextEncoder().encode(payloadStr);
    var hash = await crypto.subtle.digest('SHA-256', buf);
    var hex = Array.from(new Uint8Array(hash)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    return hex;
  }catch(e){ return null; }
}

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
    +'<div style="font-size:10.5px;color:var(--t3);line-height:1.5">Send the exact amount, then paste the transaction hash in the box above instead of a UTR. Verified manually within 24h.</div></div>';
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






/* ==================== GROUP COMPROMISE ENGINE ====================
   The problem it kills: five people in a WhatsApp thread arguing over a trip.
   Each member sets what they want (interests, daily budget, pace, wake time,
   dietary need). The engine scores every candidate destination against the
   WHOLE group and finds the itinerary shape that upsets the fewest people.

   It is pure deterministic logic over data the app already has — no server, no
   AI cost, and the maths is explainable (we SHOW each person's satisfaction,
   not a black-box number). That transparency is the point: a compromise people
   can see is fair is one they'll actually accept. */
var RW_INTERESTS = ['beaches','mountains','food','nightlife','culture','adventure','shopping','relaxation','wildlife','history'];
function grpMembers(){ try{ return JSON.parse(lsGet('rw_group')||'[]'); }catch(e){ return []; } }
function grpSave(m){ lsSet('rw_group', JSON.stringify(m.slice(0,12))); }
function grpTagsFor(entry){
  var j=((entry.tags||[]).concat(entry.interests||[]).join(' ')+' '+(entry.name||'')+' '+(entry.region||'')).toLowerCase();
  var t=[];
  if(/beach|island|coast|goa|bali|maldiv/.test(j)) t.push('beaches');
  if(/trek|mountain|himalaya|alpine|leh|spiti|manali|peak/.test(j)) t.push('mountains');
  t.push('food'); /* every destination has food */
  if(/night|party|club|bar|bangkok|vegas/.test(j)) t.push('nightlife');
  if(/temple|museum|heritage|fort|palace|culture|history|varanasi/.test(j)) { t.push('culture'); t.push('history'); }
  if(/trek|raft|dive|surf|safari|adventure|ski/.test(j)) t.push('adventure');
  if(/market|shop|bazaar|mall/.test(j)) t.push('shopping');
  if(/beach|spa|lake|relax|retreat/.test(j)) t.push('relaxation');
  if(/safari|wildlife|park|jungle|national/.test(j)) t.push('wildlife');
  return t;
}
function grpScoreMember(member, entry, tags){
  /* interest overlap */
  var want=member.interests||[], hit=0;
  want.forEach(function(w){ if(tags.indexOf(w)>-1) hit++; });
  var interestScore = want.length ? hit/want.length : 0.5;
  /* budget fit: their daily cap vs the destination's mid daily (weekly/7, INR) */
  var fx=window._rwFxINR||88;
  var dailyMidINR = ((entry.cost&&entry.cost.mid)||700)/7*fx;
  var budgetScore = !member.budget ? 0.6
    : member.budget >= dailyMidINR ? 1
    : Math.max(0, member.budget/dailyMidINR);
  /* dietary comfort — veg/halal easier in some regions */
  var dietScore=1, reg=(entry.region||'').toLowerCase();
  if(member.diet==='veg')  dietScore = /south asia|india/.test(reg)?1 : /southeast asia|east asia/.test(reg)?0.7 : 0.55;
  if(member.diet==='halal')dietScore = /middle east|south asia|southeast asia/.test(reg)?1 : 0.6;
  if(member.diet==='vegan')dietScore = /south asia|southeast asia/.test(reg)?0.8 : 0.6;
  return Math.round((interestScore*0.5 + budgetScore*0.35 + dietScore*0.15)*100);
}
function grpCompromise(members){
  if(!members.length) return [];
  var pool=(typeof DB!=='undefined'? DB:[]).slice();
  var scored=pool.map(function(entry){
    var tags=grpTagsFor(entry);
    var per=members.map(function(m){ return {name:m.name||'Traveller', score:grpScoreMember(m,entry,tags)}; });
    var vals=per.map(function(p){return p.score;});
    var avg=Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length);
    var min=Math.min.apply(null,vals);
    /* fairness = high average BUT penalise leaving anyone miserable; the min
       term is what stops "great for 4, awful for 1" winning. */
    var fairness=Math.round(avg*0.6 + min*0.4);
    return {entry:entry, per:per, avg:avg, min:min, fairness:fairness, tags:tags};
  });
  scored.sort(function(a,b){ return b.fairness-a.fairness; });
  return scored.slice(0,5);
}
function openGroupPlanner(){
  var ov=el('grpOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='grpOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83e\udd1d Group Compromise</b><button class="x" onclick="rwOverlayClose(\'grpOverlay\')">\u2715</button></div>'
      +'<div id="grpBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  grpRender();
  rwOverlayOpen('grpOverlay');
}
function grpRender(){
  var body=el('grpBody'); if(!body) return;
  var m=grpMembers();
  var chips=RW_INTERESTS.map(function(x){return x;});
  var memHTML = m.map(function(mem,i){
    return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:10px 12px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center">'
      +'<b style="font-size:13px">'+(String(mem.name||'Traveller '+(i+1)).replace(/[<>]/g,''))+'</b>'
      +'<button class="tact" style="font-size:11px;padding:4px 8px" onclick="grpRemove('+i+')">\u2715</button></div>'
      +'<div style="font-size:11px;color:var(--t3);margin-top:3px">'
      +(mem.interests&&mem.interests.length? mem.interests.join(', '):'no interests set')
      +(mem.budget? ' \u00b7 \u20b9'+mem.budget+'/day':'')
      +(mem.diet&&mem.diet!=='none'? ' \u00b7 '+mem.diet:'')+'</div></div>';
  }).join('');
  body.innerHTML =
    '<p style="font-size:12px;color:var(--t2);line-height:1.6;margin:2px 2px 12px">Add everyone travelling. The engine finds destinations that keep the <b>whole group</b> happy \u2014 and shows each person\u2019s score so the pick is provably fair.</p>'
    + memHTML
    + '<div style="background:var(--bg3,#1A1A20);border:1px dashed var(--b2,#2A2A36);border-radius:12px;padding:12px;margin-bottom:10px">'
    + '<input id="grpName" class="k-inp" placeholder="Name" style="width:100%;margin-bottom:8px">'
    + '<div style="font-size:11px;color:var(--t3);margin-bottom:5px">Interests (tap):</div>'
    + '<div id="grpInterests" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">'
    + chips.map(function(c){ return '<button class="tact grp-int" data-i="'+c+'" style="font-size:11px;padding:5px 10px" onclick="this.classList.toggle(\'on\');this.style.background=this.classList.contains(\'on\')?\'var(--gold,#E8BA6C)\':\'\';this.style.color=this.classList.contains(\'on\')?\'#0A0A0C\':\'\'">'+c+'</button>'; }).join('')
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:8px">'
    + '<input id="grpBudget" class="k-inp" type="number" placeholder="\u20b9/day" style="flex:1">'
    + '<select id="grpDiet" class="k-inp" style="flex:1"><option value="none">No diet limit</option><option value="veg">Vegetarian</option><option value="vegan">Vegan</option><option value="halal">Halal</option></select>'
    + '</div>'
    + '<button class="g-btn" style="width:100%;min-height:40px" onclick="grpAdd()">+ Add traveller</button></div>'
    + (m.length>=2 ? '<button class="g-btn" style="width:100%;min-height:46px;font-size:15px;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E))" onclick="grpResults()">\ud83c\udfaf Find our compromise</button>'
                   : '<div style="text-align:center;font-size:11px;color:var(--t3);padding:6px">Add at least 2 travellers</div>')
    + '<div id="grpOut" style="margin-top:12px"></div>';
}
function grpAdd(){
  var name=(el('grpName').value||'').trim();
  var interests=[].slice.call(document.querySelectorAll('.grp-int.on')).map(function(b){return b.dataset.i;});
  var budget=parseInt(el('grpBudget').value,10)||0;
  var diet=el('grpDiet').value;
  if(!name && !interests.length){ showToast('Add a name or pick interests'); return; }
  var m=grpMembers(); m.push({name:name, interests:interests, budget:budget, diet:diet});
  grpSave(m); grpRender();
}
function grpRemove(i){ var m=grpMembers(); m.splice(i,1); grpSave(m); grpRender(); }
function grpResults(){
  var m=grpMembers(); var out=el('grpOut');
  var res=grpCompromise(m);
  if(!res.length){ out.innerHTML='<div class="mode-box">No destinations to score yet.</div>'; return; }
  out.innerHTML = '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:8px">Best for everyone</div>'
    + res.map(function(r,idx){
        var bar = r.per.map(function(p){
          var col = p.score>=70?'#4ADE80':p.score>=45?'#E8BA6C':'#E05B5B';
          return '<div style="flex:1;text-align:center"><div style="font-size:9px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+String(p.name).replace(/[<>]/g,'')+'</div>'
            +'<div style="height:5px;background:var(--b2,#2A2A36);border-radius:3px;margin-top:2px;overflow:hidden"><div style="width:'+p.score+'%;height:100%;background:'+col+'"></div></div>'
            +'<div style="font-size:10px;color:'+col+';margin-top:1px">'+p.score+'</div></div>';
        }).join('');
        return '<div style="background:var(--bg2,#12121C);border:1px solid '+(idx===0?'var(--gold,#E8BA6C)':'var(--b2,#2A2A36)')+';border-radius:14px;padding:12px 14px;margin-bottom:10px">'
          +'<div style="display:flex;justify-content:space-between;align-items:center">'
          +'<div><b style="font-size:15px">'+(idx===0?'\ud83c\udfc6 ':'')+r.entry.name+'</b> <span style="font-size:11px;color:var(--t3)">'+r.entry.country+'</span></div>'
          +'<div style="text-align:right"><div style="font-size:20px;font-weight:800;color:var(--gold,#E8BA6C)">'+r.fairness+'</div><div style="font-size:9px;color:var(--t3)">fairness</div></div></div>'
          +'<div style="display:flex;gap:6px;margin-top:10px">'+bar+'</div>'
          +'<div style="font-size:10.5px;color:var(--t3);margin-top:8px">Avg '+r.avg+' \u00b7 nobody below '+r.min+' \u00b7 '+r.tags.slice(0,4).join(', ')+'</div>'
          +'<button class="tact" style="font-size:11.5px;padding:6px 11px;margin-top:8px;font-weight:800" onclick="rwOverlayClose(\'grpOverlay\');cpGoPlan(\''+r.entry.name.replace(/'/g,'')+'\')">Plan '+r.entry.name+' \u2192</button>'
          +'</div>';
      }).join('');
}

/* ==================== SECURE TRIP GROUP CHAT ====================
   A private room per trip so planning lives in the app, not scattered across
   WhatsApp. "Secure" here means specific, not hand-wavy: messages are readable
   and writable ONLY by members listed on the room doc (enforced in Firestore
   rules, not just the UI), every message is signed with its sender's uid, the
   room is reachable only by its unguessable ID, and nothing is world-readable.
   It is NOT end-to-end encrypted — Firestore can see message text — so the UI
   says exactly that rather than overpromising. */
var _chatUnsub=null, _chatRoom=null;
function tripChatOpen(roomId, roomName){
  if(!user || !user.uid){ showToast('Sign in to use group chat'); try{ openAuth(); }catch(e){} return; }
  _chatRoom=roomId;
  var ov=el('chatOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='chatOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet" style="display:flex;flex-direction:column;max-height:90dvh">'
      +'<div class="sheet-head"><b id="chatTitle">\ud83d\udcac Trip chat</b><button class="x" onclick="tripChatClose()">\u2715</button></div>'
      +'<div id="chatLog" style="flex:1 1 auto;min-height:0;overflow-y:auto;padding:6px 2px"></div>'
      +'<div style="font-size:9.5px;color:var(--t3);padding:4px 2px">\ud83d\udd12 Private to members \u00b7 signed by sender \u00b7 not end-to-end encrypted</div>'
      +'<div style="display:flex;gap:8px;align-items:flex-end;padding-top:4px">'
      +'<textarea id="chatInput" rows="1" placeholder="Message the group\u2026" style="flex:1;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:12px;padding:10px 12px;color:inherit;font:inherit;resize:none;outline:none"></textarea>'
      +'<button class="tact" style="padding:10px 14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="tripChatSend()">\u27a4</button></div>'
      +'</div>';
    document.body.appendChild(ov);
    el('chatInput').addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); tripChatSend(); } });
  }
  el('chatTitle').textContent='\ud83d\udcac '+(roomName||'Trip chat');
  rwOverlayOpen('chatOverlay');
  /* ensure the room exists with me as a member, then live-subscribe */
  var ref=db.collection('tripchats').doc(roomId);
  ref.get().then(function(d){
    if(!d.exists) return ref.set({name:roomName||'Trip', members:[user.uid], owner:user.uid, created:firebase.firestore.FieldValue.serverTimestamp()});
    if((d.data().members||[]).indexOf(user.uid)===-1)
      return ref.update({members:firebase.firestore.FieldValue.arrayUnion(user.uid)});
  }).then(function(){
    if(_chatUnsub) _chatUnsub();
    _chatUnsub = ref.collection('msgs').orderBy('at','asc').limitToLast(100).onSnapshot(function(qs){
      var log=el('chatLog'); if(!log) return;
      log.innerHTML = qs.docs.map(function(doc){
        var m=doc.data(), mine=m.uid===user.uid;
        return '<div style="display:flex;justify-content:'+(mine?'flex-end':'flex-start')+';margin:4px 0">'
          +'<div style="max-width:78%;background:'+(mine?'linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C':'var(--bg2,#12121C);color:var(--t1);border:1px solid var(--b2,#2A2A36)')
          +';border-radius:'+(mine?'14px 14px 4px 14px':'14px 14px 14px 4px')+';padding:8px 11px;font-size:12.5px;line-height:1.5">'
          +(mine?'':'<div style="font-size:9.5px;opacity:.7;margin-bottom:2px">'+String(m.name||'Traveller').replace(/[<>]/g,'')+'</div>')
          +String(m.text||'').replace(/[<>]/g,'')+'</div></div>';
      }).join('');
      log.scrollTop=log.scrollHeight;
    }, function(err){ el('chatLog').innerHTML='<div class="mode-box">Chat unavailable: '+esc2(err.message||err)+'</div>'; });
  }).catch(function(e){ showToast('Could not open chat: '+(e.message||e)); });
}
function tripChatSend(){
  var inp=el('chatInput'); var t=(inp.value||'').trim(); if(!t || !_chatRoom || !user) return;
  inp.value='';
  db.collection('tripchats').doc(_chatRoom).collection('msgs').add({
    text:t.slice(0,1000), uid:user.uid,
    name:(user.displayName||user.email||'Traveller').split('@')[0],
    at:firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(e){ showToast('Send failed: '+(e.message||e)); inp.value=t; });
}
function tripChatClose(){ if(_chatUnsub){ _chatUnsub(); _chatUnsub=null; } rwOverlayClose('chatOverlay'); }
/* deterministic room id from a saved trip, so the same trip = the same room */
function tripChatById(id){ var t=vaultGet().filter(function(x){return x.id===id;})[0]; if(t) tripChatForTrip(t); }
function tripChatForTrip(trip){
  var id = 'trip_'+wvSlug(trip.name)+'_'+String(trip.id||'').slice(-6);
  tripChatOpen(id, trip.name+' group');
}



/* ==================== REAL ATTRACTIONS (OpenStreetMap / Overpass) ==========
   Ailon Tusk could describe a place but never list what's actually AT it.
   Overpass queries OpenStreetMap directly: free, keyless, worldwide, and it
   holds the small stuff Google buries — viewpoints, waterfalls, ruins, springs,
   the "hidden" things travellers hunt for. Results cache for 30 days per place,
   so a destination you've opened once works offline afterwards. */
var OSM_KINDS = [
  ['tourism','attraction','\ud83c\udfaf'], ['tourism','viewpoint','\ud83d\udc41\ufe0f'],
  ['tourism','museum','\ud83c\udfdb\ufe0f'], ['tourism','artwork','\ud83c\udfa8'],
  ['historic','ruins','\ud83c\udfda\ufe0f'], ['historic','monument','\ud83d\uddff'],
  ['historic','fort','\ud83c\udff0'], ['historic','temple','\ud83d\uded5'],
  ['natural','waterfall','\ud83d\udca7'], ['natural','peak','\u26f0\ufe0f'],
  ['natural','hot_spring','\u2668\ufe0f'], ['natural','cave_entrance','\ud83d\udd73\ufe0f'],
  ['leisure','park','\ud83c\udf33'], ['amenity','place_of_worship','\ud83d\ude4f']
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
  var q = '[out:json][timeout:20];('+filters+');out body 60;';
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

/* ==================== AILON TUSK — PERSONALITY & VOICE NOTES ================
   People come back to something that makes them smile. This gives Ailon Tusk a
   witty, masala Hinglish voice and lets it drop a short spoken "voice note"
   about a destination.

   IMPORTANT (copyright): these are ORIGINAL lines written in a Bollywood-ish,
   filmy flavour — NOT real film dialogue or song lyrics, which are copyrighted
   and would get the app pulled from Play. Audio is the device's own built-in
   text-to-speech (SpeechSynthesis) — free, offline, no rights issue, no files
   to host. In the Android app the native TTS is used via the same bridge. */
var TUSK_QUIPS = {
  beach:[
    "Beach vibes? Boss, sunscreen laga ke jaana — warna lobster ban ke aaoge. \ud83e\udd9e",
    "Sand, susegad aur sunset. Bas ek chai-tapri aur life set hai. \ud83c\udfd6\ufe0f",
    "Waves bulaa rahi hain, aur tera boss bhi. Dono ko ignore kar, chal nikal. \ud83c\udf0a"
  ],
  mountains:[
    "Pahaad bula rahe hain! Oxygen kam, attitude zyada \u2014 perfect trip. \ud83c\udfd4\ufe0f",
    "Maggi at 3000m hits different, boss. Science bhi maan chuki hai. \ud83c\udf5c",
    "Mountains don\u2019t text back, par sukoon zaroor dete hain. Chalo. \u26f0\ufe0f"
  ],
  spiritual:[
    "Aatma ki battery low? Chalo, thodi spiritual charging ho jaaye. \ud83d\uddff",
    "Ghanti bajao, selfie lo, thoda sukoon lo \u2014 balance hai boss. \ud83d\ude4f",
    "Yahaan network kam milega, par connection upar waale se pakka. \u2728"
  ],
  party:[
    "Party mode ON! Kal ki tension kal ka Tusk sambhaal lega. \ud83c\udf89",
    "Neend to ghar pe bhi aa jayegi \u2014 abhi nikal, DJ waiting hai. \ud83d\udd7a",
    "Budget alert baad mein, pehle beat drop hone de. \ud83c\udfa7"
  ],
  romantic:[
    "Do log, ek sunset, zero network \u2014 perfect date, boss. \u2764\ufe0f",
    "Romance ka budget mat dekh, memories priceless hoti hain (mostly). \ud83c\udf39",
    "Candlelight dinner ya street chaat \u2014 pyaar dono mein hai. \ud83d\udd6f\ufe0f"
  ],
  budget:[
    "Kam paise, zyada maze \u2014 yeh apun ka funda hai, boss. \ud83d\udcb8",
    "Sasta trip, mehnga experience. Tusk guarantee. \ud83e\uddb5",
    "Paisa bachega toh ek aur trip banega. Simple maths. \ud83e\uddee"
  ],
  adventure:[
    "Dil thaam ke baith \u2014 yeh trip roller-coaster hai, EMI nahi. \ud83e\udea2",
    "Comfort zone ko bye bol, adventure zone mein WiFi behtar hai. \ud83e\udd18",
    "Darr ke aage jeep hai, boss. Chal nikal. \ud83d\ude99"
  ],
  _default:[
    "Bags pack kar, excuses unpack kar \u2014 Tusk ready hai. \ud83c\udf92",
    "Zindagi ek safar hai, aur main tera co-pilot. Seatbelt baandh. \u2708\ufe0f",
    "Trip plan karna mujhpe chhod, tu bas haan bol. \ud83d\ude0e"
  ]
};
function tuskQuip(vibeOrPlace, entry){
  var pool=null;
  if(entry){
    var tags=(typeof grpTagsFor==='function')? grpTagsFor(entry):[];
    for(var i=0;i<tags.length;i++){ if(TUSK_QUIPS[tags[i]]){ pool=TUSK_QUIPS[tags[i]]; break; } }
  }
  if(!pool && TUSK_QUIPS[vibeOrPlace]) pool=TUSK_QUIPS[vibeOrPlace];
  if(!pool) pool=TUSK_QUIPS._default;
  return pool[Math.floor(Math.random()*pool.length)];
}
/* speak a line via TTS — native bridge in-app, Web Speech on the web */
function tuskSpeak(text){
  if(window.RW && typeof RW.speak==='function'){ try{ RW.speak(text); return; }catch(e){} }
  try{
    if(!window.speechSynthesis){ showToast('Voice notes need a newer browser \u2014 reading it instead'); return; }
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    u.lang='hi-IN'; u.rate=1.02; u.pitch=1.05;
    /* prefer an Indian-English/Hindi voice if the device has one */
    var vs=speechSynthesis.getVoices();
    var pick=vs.filter(function(v){ return /hi-IN|en-IN/i.test(v.lang); })[0];
    if(pick) u.voice=pick;
    speechSynthesis.speak(u);
  }catch(e){}
}
/* a shareable "voice note" bubble: shows the witty line + a play button */
function tuskVoiceNoteHTML(place, entry){
  var line=tuskQuip(place, entry);
  var id='vn_'+Math.random().toString(36).slice(2,8);
  window['_'+id]=line;
  return '<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(232,186,108,.14),rgba(200,145,62,.06));border:1px solid rgba(232,186,108,.3);border-radius:14px;padding:11px 13px;margin-top:8px">'
    +'<button onclick="tuskSpeak(window._'+id+')" style="flex:0 0 auto;width:40px;height:40px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;font-size:16px;cursor:pointer">\u25b6</button>'
    +'<div style="flex:1;min-width:0"><div style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:2px">\ud83c\udf99\ufe0f Tusk\u2019s voice note</div>'
    +'<div style="font-size:12px;line-height:1.5;color:var(--t2)">'+esc2(line)+'</div></div></div>';
}

/* ==================== AILON TUSK — the built-in engine's knowledge layer ====
   "Crawl Google in the background" cannot be done from a static app: Google
   blocks cross-origin browser calls and its terms forbid scraping, and the
   official Search API bills per query. Wikivoyage is the honest substitute —
   a real, community-written travel guide for tens of thousands of places, with
   open CORS, no API key, no cost, and a licence that permits reuse with
   attribution (CC BY-SA). It answers the exact questions people ask: how to
   get in, what to see, what to eat, where to sleep, what to watch out for.

   The "learning" is real but modest and honestly named: every guide fetched is
   cached on the device, and every place the traveller actually engages with is
   counted, so answers get faster and ordering gets more personal the more the
   app is used. No model weights are trained in a phone browser. */
var WV_CACHE_DAYS = 30;
var WV_SECTION_MAP = [
  [/eat|food|restaurant|cuisine|dish|cafe|drink/i,            ['Eat','Drink']],
  [/reach|get in|getting there|how to go|travel to|flight|train|bus|airport/i, ['Get in']],
  [/get around|around|local transport|taxi|metro|rickshaw/i,  ['Get around']],
  [/see|attraction|sight|monument|temple|museum|viewpoint/i,  ['See']],
  [/do|activity|trek|adventure|experience|hike|raft|ski/i,    ['Do']],
  [/stay|hotel|hostel|sleep|accommodation|homestay|camp/i,    ['Sleep']],
  [/safe|danger|scam|theft|security|health|altitude/i,        ['Stay safe','Stay healthy']],
  [/buy|shop|market|souvenir|bazaar/i,                        ['Buy']],
  [/weather|climate|season|best time|month/i,                 ['Weather','Climate','Understand']],
  [/history|about|understand|culture|language/i,              ['Understand']]
];
function wvSlug(p){ return String(p).toLowerCase().replace(/[^a-z0-9]/g,''); }
async function wvGuide(place){
  var key='rw_wv_'+wvSlug(place);
  try{
    var c=JSON.parse(lsGet(key)||'null');
    if(c && (Date.now()-c.at) < WV_CACHE_DAYS*864e5) return c;
  }catch(e){}
  if(!navigator.onLine) return null;
  try{
    var api='https://en.wikivoyage.org/w/api.php?origin=*&format=json&';
    var q = await fetch(api+'action=query&list=search&srlimit=1&srsearch='+encodeURIComponent(place)).then(function(r){return r.json();});
    var hit=((q.query||{}).search||[])[0]; if(!hit) return null;
    var title=hit.title;
    var ex = await fetch(api+'action=query&prop=extracts&exintro=1&explaintext=1&titles='+encodeURIComponent(title)).then(function(r){return r.json();});
    var pg=Object.values((ex.query||{}).pages||{})[0]||{};
    var se = await fetch(api+'action=parse&prop=sections&page='+encodeURIComponent(title)).then(function(r){return r.json();});
    var sections=((se.parse||{}).sections||[]).map(function(x){ return {line:x.line, index:x.index}; });
    var rec={title:title, extract:(pg.extract||'').trim(), sections:sections, at:Date.now()};
    lsSet(key, JSON.stringify(rec));
    return rec;
  }catch(e){ return null; }
}
async function wvSection(title, index){
  var key='rw_wvs_'+wvSlug(title)+'_'+index;
  var c=lsGet(key); if(c) return c;
  if(!navigator.onLine) return null;
  try{
    var d = await fetch('https://en.wikivoyage.org/w/api.php?origin=*&format=json&action=parse&prop=wikitext&section='
      +index+'&page='+encodeURIComponent(title)).then(function(r){return r.json();});
    var wt=(((d.parse||{}).wikitext||{})['*']||'');
    /* wikitext -> readable: drop templates, listings, markup, refs */
    var txt = wt
      .replace(/={2,}[^=\n]+={2,}/g,' ')   /* section headers like ==Get in== */
      .replace(/\{\{[^{}]*\}\}/g,' ')
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g,' ')
      .replace(/<[^>]+>/g,' ')
      .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g,'$2')
      .replace(/'''?/g,'')
      .replace(/^[=*#:;]+/gm,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
    if(txt.length>20){ lsSet(key, txt.slice(0,1200)); return txt.slice(0,1200); }
    return null;
  }catch(e){ return null; }
}
function wvPickSections(question, sections){
  var want=[];
  WV_SECTION_MAP.forEach(function(m){ if(m[0].test(question)) want=want.concat(m[1]); });
  if(!want.length) want=['Understand','See','Do'];
  var out=[];
  want.forEach(function(name){
    var hit=sections.filter(function(s){ return s.line.toLowerCase()===name.toLowerCase(); })[0];
    if(hit && out.length<2) out.push(hit);
  });
  return out;
}
async function wvAnswer(place, question){
  var g = await wvGuide(place);
  if(!g) return null;
  rwLearn(place);
  var parts=[];
  if(g.extract) parts.push('<div style="font-size:12.5px;line-height:1.6">'+esc2(g.extract.slice(0,340))+(g.extract.length>340?'\u2026':'')+'</div>');
  var picks = wvPickSections(question||'', g.sections||[]);
  for(var i=0;i<picks.length;i++){
    var body = await wvSection(g.title, picks[i].index);
    if(body && body.length>40){
      parts.push('<div style="margin-top:8px"><div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E)">'
        +esc2(picks[i].line)+'</div><div style="font-size:12px;line-height:1.6;color:var(--t2)">'+esc2(body.slice(0,420))+'\u2026</div></div>');
    }
  }
  if(!parts.length) return null;
  parts.push('<div style="font-size:10px;color:var(--t3);margin-top:8px">Source: <a style="color:var(--gold2,#C8913E)" target="_blank" rel="noopener" href="https://en.wikivoyage.org/wiki/'
    +encodeURIComponent(g.title)+'">Wikivoyage \u2014 '+esc2(g.title)+'</a> \u00b7 CC BY-SA \u00b7 cached on your device</div>');
  return parts.join('');
}
function esc2(t){ return String(t==null?'':t).replace(/[<>&]/g,function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }); }

/* ---- the learning layer: local, honest, and actually useful ---- */
function rwLearn(place){
  try{
    var m=JSON.parse(lsGet('rw_learn')||'{}');
    var k=wvSlug(place); m[k]=(m[k]||0)+1;
    lsSet('rw_learn', JSON.stringify(m));
  }catch(e){}
}
function rwTopInterests(n){
  try{
    var m=JSON.parse(lsGet('rw_learn')||'{}');
    return Object.keys(m).sort(function(a,b){ return m[b]-m[a]; }).slice(0, n||5);
  }catch(e){ return []; }
}

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
  var key = lsGet('rwKey_gemini');
  if(!key){
    cpBubble('\ud83d\udcf8 Screenshot scanning needs a vision model. Google Gemini\u2019s free tier can do it \u2014 <button class="tact" style="font-size:11px;padding:4px 10px" onclick="openWizard()">add a free key</button> and this unlocks.', 'bot');
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

/* ==================== LIVE WORLD MAP (tap anywhere) ====================
   Google Maps JS and MapMyIndia both require an API key tied to a billing
   account — a recurring cost with a traffic cliff. Leaflet + OpenStreetMap
   tiles are free, keyless and unlimited for normal app use, so the map ships
   today instead of waiting on funding. Tap any point on Earth and the panel
   fills with place, country, elevation, live weather and one-tap planning. */
var _rwMap=null, _rwMarker=null;
function openMapExplorer(){
  /* Inline, not a popup: the map lives in the page so scrolling, back-button
     and the rest of the app keep working around it. */
  try{ tabGo('home'); }catch(e){}
  var sec=el('mapSection');
  if(!sec){
    sec=document.createElement('section');
    sec.id='mapSection'; sec.className='xsec v v-home';
    sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83d\uddfa\ufe0f Live <em>map</em></h2></div>'
      +'<p class="xsec-sub">Tap anywhere on Earth \u2014 place, elevation, live weather and a plan link.</p>'
      +'<div id="rwMap" style="height:52vh;min-height:280px;border-radius:16px;overflow:hidden;background:#0E1018;border:1px solid var(--b2,#2A2A36)"></div>'
      +'<div id="rwMapInfo" style="padding:12px 2px 4px;font-size:12.5px;color:var(--t2);line-height:1.6">Tap a spot on the map to inspect it.</div>';
    var host=el('copilotHero');
    if(host && host.parentNode) host.parentNode.insertBefore(sec, host.nextSibling);
    else document.body.appendChild(sec);
  }
  sec.scrollIntoView({behavior:'smooth', block:'start'});
  rwEnsureLeaflet(function(ok){
    if(!ok){ el('rwMapInfo').innerHTML='Map needs an internet connection \u2014 your saved trips still work offline.'; return; }
    if(!_rwMap){
      _rwMap = L.map('rwMap', {zoomControl:true, attributionControl:true}).setView([22.9,79.5], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:18, attribution:'\u00a9 OpenStreetMap'}).addTo(_rwMap);
      _rwMap.on('click', function(e){ rwMapPoint(e.latlng.lat, e.latlng.lng); });
    }
    setTimeout(function(){ try{ _rwMap.invalidateSize(); }catch(e){} }, 250);
  });
}
function closeMapExplorer(){ /* inline section — nothing to close */ }
function rwEnsureLeaflet(cb){
  if(window.L && window.L.map) return cb(true);
  if(!navigator.onLine) return cb(false);
  var css=document.createElement('link'); css.rel='stylesheet';
  css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
  var js=document.createElement('script'); js.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  js.onload=function(){ cb(true); }; js.onerror=function(){ cb(false); };
  document.head.appendChild(js);
}
async function rwMapPoint(lat, lon){
  var info=el('rwMapInfo'); if(!info) return;
  info.innerHTML='\u23f3 Reading that spot\u2026';
  try{ if(_rwMarker) _rwMap.removeLayer(_rwMarker); _rwMarker=L.marker([lat,lon]).addTo(_rwMap); }catch(e){}
  var name=null, country='', admin='', elev=null;
  try{
    /* Reverse lookup via Open-Meteo's own geocoder (keyless): find the nearest
       named place by searching around the tapped coordinates. */
    var w = await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon
      +'&current=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto').then(function(r){return r.json();});
    elev = w.elevation;
    var rev = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat='+lat+'&lon='+lon, {headers:{'Accept':'application/json'}}).then(function(r){return r.json();}).catch(function(){return null;});
    if(rev && rev.address){
      name = rev.address.city||rev.address.town||rev.address.village||rev.address.county||rev.address.state||rev.name||null;
      admin = rev.address.state||''; country = rev.address.country||'';
    }
    var H='<div style="font-weight:800;font-size:14px;color:var(--t1)">\ud83d\udccd '+(name? String(name).replace(/[<>]/g,'') : lat.toFixed(3)+', '+lon.toFixed(3))+'</div>';
    if(admin||country) H+='<div style="font-size:11.5px;color:var(--t3)">'+[admin,country].filter(Boolean).join(', ')+'</div>';
    var bits=[];
    if(elev!=null) bits.push(Math.round(elev)+'m elevation');
    if(w.timezone) bits.push(w.timezone);
    if(w.current) bits.push('now '+Math.round(w.current.temperature_2m)+'\u00b0C');
    if(bits.length) H+='<div style="font-size:11.5px;color:var(--t3);margin-top:2px">'+bits.join(' \u00b7 ')+'</div>';
    if(w.daily && w.daily.time){
      H+='<div style="display:flex;gap:10px;margin-top:8px">'+w.daily.time.map(function(d,i){
        var rain=w.daily.precipitation_probability_max[i];
        return '<div style="text-align:center"><div style="font-size:9.5px;color:var(--t3)">'+new Date(d).toLocaleDateString('en-IN',{weekday:'short'})+'</div>'
          +'<div style="font-size:12px;font-weight:700">'+Math.round(w.daily.temperature_2m_max[i])+'\u00b0</div>'
          +'<div style="font-size:9px;color:'+(rain>=40?'#5CC8FF':'var(--t3)')+'">'+(rain!=null?rain+'%':'')+'</div></div>';
      }).join('')+'</div>';
    }
    var q = name || (lat.toFixed(3)+','+lon.toFixed(3));
    try{
      var nearSpots = await osmAttractions(lat, lon, 8000);
      if(nearSpots.length) H += osmAttractionsHTML(nearSpots, q);
    }catch(e){}
    H+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">'
      +'<button class="tact" style="font-size:11.5px;padding:7px 11px;font-weight:800" onclick="cpGoPlan(\''+String(q).replace(/'/g,'')+'\')">\ud83d\udcc5 Plan this place</button>'
      +'<a class="tact" style="font-size:11.5px;padding:7px 11px;text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent('things to do in '+q)+'">\ud83c\udfaf Things to do</a>'
      +'<a class="tact" style="font-size:11.5px;padding:7px 11px;text-decoration:none" target="_blank" rel="noopener" href="'+stayUrl(q)+'">\ud83c\udfe8 Stays</a>'
      +'</div>';
    info.innerHTML=H;
  }catch(e){ info.innerHTML='Couldn\u2019t read that spot \u2014 try tapping again.'; }
}

/* ==================== LIVING THEMES — season, time & festival aware =========
   16 base themes picked from (season x time-of-day) + Indian festival windows,
   each with a background gradient and a live particle effect (rain in monsoon,
   snow on winter nights, petals in spring, diyas at Diwali, tricolor on Aug 15,
   confetti at Holi/New Year...). Canvas is fixed, pointer-transparent, capped
   at ~80 particles, pauses when the tab hides, and fully disables under
   prefers-reduced-motion. Manual override survives in rw_theme_mode. */
var RW_THEMES = {
  winter_day:   {bg:'linear-gradient(180deg,#0A0E16,#0E1420 60%,#101826)', fx:'snow',    tint:'#9CC4E4'},
  winter_night: {bg:'linear-gradient(180deg,#05070D,#0A0F1A)',             fx:'snow',    tint:'#7FA8D0'},
  summer_day:   {bg:'linear-gradient(180deg,#0C0A08,#141008)',             fx:'sunhaze', tint:'#F0C070'},
  summer_night: {bg:'linear-gradient(180deg,#070609,#100C14)',             fx:'fireflies',tint:'#D9F99D'},
  monsoon_day:  {bg:'linear-gradient(180deg,#080B10,#0C1219 60%,#0A1016)', fx:'rain',    tint:'#5CC8FF'},
  monsoon_night:{bg:'linear-gradient(180deg,#05070B,#080D14)',             fx:'rain',    tint:'#3E8BB8'},
  autumn_day:   {bg:'linear-gradient(180deg,#0D0A07,#150F08)',             fx:'leaves',  tint:'#E8A25C'},
  autumn_night: {bg:'linear-gradient(180deg,#080605,#100B07)',             fx:'leaves',  tint:'#C07840'},
  spring_day:   {bg:'linear-gradient(180deg,#0A0C0A,#0F140E)',             fx:'petals',  tint:'#F5A9C4'},
  spring_night: {bg:'linear-gradient(180deg,#060806,#0B100B)',             fx:'petals',  tint:'#C77A9A'},
  dawn:         {bg:'linear-gradient(180deg,#120C10,#1A0F12 50%,#0C0A10)', fx:'clouds',  tint:'#F0A0A0'},
  dusk:         {bg:'linear-gradient(180deg,#100A14,#170D18 50%,#0A0810)', fx:'stars',   tint:'#C8A0F0'},
  holi:         {bg:'linear-gradient(180deg,#0C080E,#120A14)',             fx:'confetti',tint:'#FF6EC7'},
  diwali:       {bg:'linear-gradient(180deg,#0E0906,#160E06)',             fx:'diyas',   tint:'#FFB84D'},
  independence: {bg:'linear-gradient(180deg,#081008,#0A0E14)',             fx:'tricolor',tint:'#FF9933'},
  newyear:      {bg:'linear-gradient(180deg,#080810,#100A18)',             fx:'confetti',tint:'#E8BA6C'}
};
function rwPickTheme(now){
  now = now || new Date();
  var m=now.getMonth()+1, d=now.getDate(), h=now.getHours();
  /* Festival windows (2026 dates; ranges keep them right for +/- a year) */
  if(m===3 && d>=2 && d<=5) return 'holi';
  if(m===11 && d>=6 && d<=13) return 'diwali';
  if(m===8 && d>=14 && d<=16) return 'independence';
  if((m===12 && d>=30) || (m===1 && d<=2)) return 'newyear';
  if((m===12 && d>=23 && d<=26)) return 'winter_night';
  if(h>=5 && h<8) return 'dawn';
  if(h>=17 && h<20) return 'dusk';
  var night = (h>=20 || h<5);
  var season = (m>=12||m<=2)?'winter' : (m>=3&&m<=5)?'spring' : (m>=6&&m<=9)?'monsoon' : (m>=10&&m<=11)?'autumn' : 'summer';
  if(m>=4 && m<=6 && season==='spring') season = (m>=4)?'summer':'spring'; /* Indian summer Apr-Jun */
  return season+'_'+(night?'night':'day');
}
var _fxRAF=null,_fxParts=[],_fxCanvas=null;
function rwApplyTheme(key){
  var th=RW_THEMES[key]; if(!th) return;
  document.documentElement.style.background=th.bg;
  document.body.style.background='transparent';
  document.body.dataset.rwtheme=key;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){ rwStopFx(); return; }
  rwStartFx(th.fx, th.tint);
}
function rwStopFx(){ if(_fxRAF) cancelAnimationFrame(_fxRAF); _fxRAF=null; if(_fxCanvas){ _fxCanvas.remove(); _fxCanvas=null; } _fxParts=[]; }
function rwStartFx(kind, tint){
  rwStopFx();
  var c=document.createElement('canvas'); c.id='rwFx';
  c.style.cssText='position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.55';
  document.body.appendChild(c); _fxCanvas=c;
  var ctx=c.getContext('2d'), W,H;
  function size(){ W=c.width=innerWidth; H=c.height=innerHeight; } size();
  addEventListener('resize', size);
  var N = kind==='rain'? 80 : kind==='snow'? 60 : kind==='confetti'||kind==='tricolor'? 70 : kind==='stars'? 70 : 40;
  var TRI=['#FF9933','#FFFFFF','#138808'];
  for(var i=0;i<N;i++){
    _fxParts.push({x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      v:.4+Math.random()*(kind==='rain'?7:1.4), r:1+Math.random()*(kind==='confetti'||kind==='tricolor'?3.5:2.5),
      w:Math.random()*1.4-.7, a:.25+Math.random()*.6, hue:Math.random()*360, tw:Math.random()*6.28});
  }
  function frame(t){
    ctx.clearRect(0,0,W,H);
    _fxParts.forEach(function(p2){
      if(kind==='rain'){
        ctx.strokeStyle='rgba(120,180,230,'+(p2.a*.7)+')'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(p2.x,p2.y); ctx.lineTo(p2.x+p2.w*2,p2.y+9+p2.v); ctx.stroke();
        p2.y+=p2.v+7; p2.x+=p2.w; if(p2.y>H){p2.y=-12;p2.x=Math.random()*W;}
      } else if(kind==='snow'){
        ctx.fillStyle='rgba(220,235,250,'+p2.a+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r,0,6.29); ctx.fill();
        p2.y+=p2.v; p2.x+=Math.sin((t/900)+p2.tw)*.6; if(p2.y>H){p2.y=-6;p2.x=Math.random()*W;}
      } else if(kind==='leaves'||kind==='petals'){
        ctx.fillStyle=kind==='leaves'?'rgba(216,150,80,'+p2.a+')':'rgba(240,170,200,'+p2.a+')';
        ctx.save(); ctx.translate(p2.x,p2.y); ctx.rotate((t/700)+p2.tw);
        ctx.beginPath(); ctx.ellipse(0,0,p2.r+2,p2.r,0,0,6.29); ctx.fill(); ctx.restore();
        p2.y+=p2.v*.8; p2.x+=Math.sin((t/1100)+p2.tw)*1.1; if(p2.y>H){p2.y=-8;p2.x=Math.random()*W;}
      } else if(kind==='stars'||kind==='fireflies'){
        var tw=.5+.5*Math.sin((t/(kind==='stars'?1400:600))+p2.tw);
        ctx.fillStyle=kind==='stars'?'rgba(230,230,255,'+(p2.a*tw)+')':'rgba(217,249,157,'+(p2.a*tw)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*.9,0,6.29); ctx.fill();
        if(kind==='fireflies'){ p2.x+=Math.sin((t/800)+p2.tw)*.5; p2.y+=Math.cos((t/900)+p2.tw)*.4; }
      } else if(kind==='confetti'||kind==='tricolor'){
        ctx.fillStyle=kind==='tricolor'? TRI[Math.floor(p2.hue)%3] : 'hsla('+p2.hue+',80%,65%,'+p2.a+')';
        ctx.save(); ctx.translate(p2.x,p2.y); ctx.rotate((t/500)+p2.tw); ctx.fillRect(-p2.r,-p2.r/2,p2.r*2,p2.r); ctx.restore();
        p2.y+=p2.v; p2.x+=Math.sin((t/700)+p2.tw); if(p2.y>H){p2.y=-8;p2.x=Math.random()*W;}
      } else if(kind==='diyas'){
        var g=.6+.4*Math.sin((t/500)+p2.tw);
        ctx.fillStyle='rgba(255,184,77,'+(p2.a*g*.8)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*1.6,0,6.29); ctx.fill();
        ctx.fillStyle='rgba(255,220,150,'+(p2.a*g)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*.6,0,6.29); ctx.fill();
        p2.y-=p2.v*.25; if(p2.y<-8){p2.y=H+8;p2.x=Math.random()*W;}
      } else if(kind==='clouds'||kind==='sunhaze'){
        ctx.fillStyle=kind==='sunhaze'?'rgba(240,192,112,'+(p2.a*.12)+')':'rgba(180,180,200,'+(p2.a*.10)+')';
        ctx.beginPath(); ctx.arc(p2.x,p2.y,p2.r*16,0,6.29); ctx.fill();
        p2.x+=p2.v*.15; if(p2.x>W+60){p2.x=-60;}
      }
    });
    _fxRAF=requestAnimationFrame(frame);
  }
  _fxRAF=requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ if(_fxRAF) cancelAnimationFrame(_fxRAF), _fxRAF=null; }
    else if(_fxCanvas && !_fxRAF) _fxRAF=requestAnimationFrame(frame);
  });
}
(function(){
  function boot(){
    try{
      var mode=lsGet('rw_theme_mode');
      rwApplyTheme(mode && RW_THEMES[mode] ? mode : rwPickTheme());
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

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
  set('WA_NUMBER',        function(v){ WA_NUMBER=v; ensureWaButton(); });
  set('WA_CHANNEL',       function(v){ WA_CHANNEL=v; });
  set('WA_GROUP',         function(v){ WA_GROUP=v; });
  set('PLAYSTORE_URL',    function(v){ PLAYSTORE_URL=v; });
  set('PROMO_MP4_URL',    function(v){ PROMO_MP4_URL=v; });
  set('SPOTIFY_ARTIST_ID',function(v){ SPOTIFY_ARTIST_ID=v; });
  set('SPOTIFY_PLAYLIST_ID',function(v){ SPOTIFY_PLAYLIST_ID=v; });
  set('JIOSAAVN_URL',     function(v){ JIOSAAVN_URL=v; });
  set('CRYPTO_WALLETS',   function(v){ if(typeof v==='object') CRYPTO_WALLETS=v; });
  /* Gumroad values feed the existing localStorage readers untouched. */
  set('GUM_URL',          function(v){ lsSet('rw_gum_url', v); });
  set('GUM_PID',          function(v){ lsSet('rw_gum_pid', v); });
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
