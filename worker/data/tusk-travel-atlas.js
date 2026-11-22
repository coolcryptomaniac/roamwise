/* RoamWise Travel Atlas v1 — curated context plus editorial destination leads.
 * No scraped photographs or third-party media are copied into the app.
 * Overview statuses: source-backed or editorial-lead. Schedules/menus are
 * suggestions, not provider-confirmed availability, prices or directions.
 * Dates/permit/closure information never belongs in this catalogue. */
const REGIONS={
  "K": [
    "Kumaon, Uttarakhand",
    "Bhatt ki churkani|Dubke|Bal mithai|Singori",
    "https://uttarakhandtourism.gov.in/search"
  ],
  "G": [
    "Garhwal, Uttarakhand",
    "Kafuli|Chainsoo|Jhangora kheer",
    "https://uttarakhandtourism.gov.in/search"
  ],
  "H": [
    "Himachal Pradesh",
    "Siddu|Himachali dham|Madra",
    "https://www.incredibleindia.gov.in/en"
  ],
  "J": [
    "Jammu and Kashmir",
    "Kahwa|Nadru yakhni|Rogan josh",
    "https://www.incredibleindia.gov.in/en"
  ],
  "L": [
    "Ladakh",
    "Thukpa|Skyu|Butter tea",
    "https://www.incredibleindia.gov.in/en"
  ],
  "R": [
    "Rajasthan",
    "Dal baati churma|Gatte ki sabzi|Ghevar",
    "https://www.incredibleindia.gov.in/en"
  ],
  "D": [
    "Delhi NCR",
    "Chaat|Paratha|Chole bhature",
    "https://www.incredibleindia.gov.in/en"
  ],
  "U": [
    "Uttar Pradesh",
    "Kachori|Chaat|Petha",
    "https://www.incredibleindia.gov.in/en"
  ],
  "P": [
    "Punjab and Chandigarh",
    "Sarson da saag|Makki di roti|Lassi",
    "https://www.incredibleindia.gov.in/en"
  ],
  "A": [
    "Gujarat",
    "Dhokla|Undhiyu|Fafda-jalebi",
    "https://www.incredibleindia.gov.in/en"
  ],
  "M": [
    "Maharashtra",
    "Vada pav|Misal pav|Puran poli",
    "https://www.incredibleindia.gov.in/en"
  ],
  "O": [
    "Goa",
    "Goan fish curry|Bebinca|Xacuti",
    "https://www.incredibleindia.gov.in/en"
  ],
  "B": [
    "Madhya Pradesh",
    "Poha|Bhutte ka kees|Dal bafla",
    "https://www.incredibleindia.gov.in/en"
  ],
  "E": [
    "West Bengal",
    "Kathi roll|Mishti doi|Shorshe dishes",
    "https://www.incredibleindia.gov.in/en"
  ],
  "Q": [
    "Odisha",
    "Pakhala bhata|Dalma|Chhena poda",
    "https://www.incredibleindia.gov.in/en"
  ],
  "S": [
    "Sikkim",
    "Momos|Thukpa|Gundruk",
    "https://www.incredibleindia.gov.in/en"
  ],
  "N": [
    "Assam and Northeast India",
    "Assamese thali|Pitha|Lal saah",
    "https://www.incredibleindia.gov.in/en"
  ],
  "T": [
    "Tamil Nadu",
    "Idli|Dosa|Filter coffee",
    "https://www.incredibleindia.gov.in/en"
  ],
  "V": [
    "Kerala",
    "Appam|Puttu-kadala|Sadya",
    "https://www.incredibleindia.gov.in/en"
  ],
  "W": [
    "Karnataka",
    "Bisi bele bath|Ragi mudde|Mysore pak",
    "https://www.incredibleindia.gov.in/en"
  ],
  "Z": [
    "Andhra Pradesh and Telangana",
    "Hyderabadi biryani|Pesarattu|Gongura",
    "https://www.incredibleindia.gov.in/en"
  ],
  "C": [
    "Bihar and Jharkhand",
    "Litti chokha|Thekua|Dhuska",
    "https://www.incredibleindia.gov.in/en"
  ]
};
const ROWS=[
 [
  "almora",
  "Almora",
  "K",
  "Lala Bazaar;Chitai Golu Devta Temple;Kasar Devi",
  "अल्मोड़ा"
 ],
 [
  "kasar-devi",
  "Kasar Devi",
  "K",
  "Kasar Devi Temple;Crank's Ridge;Almora bazaars",
  "कसार देवी"
 ],
 [
  "binsar",
  "Binsar",
  "K",
  "Binsar Wildlife Sanctuary;Zero Point;Bineshwar Temple",
  ""
 ],
 [
  "jageshwar",
  "Jageshwar",
  "K",
  "Jageshwar temple complex;Dandeshwar Temple;deodar forest",
  "जागेश्वर"
 ],
 [
  "kausani",
  "Kausani",
  "K",
  "Himalayan viewpoints;Anasakti Ashram;Baijnath",
  "कौसानी"
 ],
 [
  "ranikhet",
  "Ranikhet",
  "K",
  "Chaubatia;Jhula Devi Temple;Majkhali",
  ""
 ],
 [
  "nainital",
  "Nainital",
  "K",
  "Naini Lake;Naina Devi Temple;Tiffin Top",
  "नैनीताल"
 ],
 [
  "bhimtal",
  "Bhimtal",
  "K",
  "Bhimtal Lake;Victoria Dam;Bhimeshwar Temple",
  ""
 ],
 [
  "mukteshwar",
  "Mukteshwar",
  "K",
  "Mukteshwar Temple;viewpoints;orchards",
  ""
 ],
 [
  "champawat",
  "Champawat",
  "K",
  "Baleshwar Temple;historic town;nearby villages",
  ""
 ],
 [
  "bhowali",
  "Bhowali",
  "K",
  "fruit market;nearby lake circuit;local orchards",
  ""
 ],
 [
  "pithoragarh",
  "Pithoragarh",
  "K",
  "town viewpoints;Soar Valley;local temples",
  ""
 ],
 [
  "kainchi-dham",
  "Kainchi Dham",
  "K",
  "Kainchi Dham ashram;Bhowali;nearby hill views",
  "कैंची धाम"
 ],
 [
  "ramgarh-kumaon",
  "Ramgarh Kumaon",
  "K",
  "orchards;Tagore Top area;village walks",
  ""
 ],
 [
  "sattal",
  "Sattal",
  "K",
  "Sattal lakes;forest birding;walks",
  ""
 ],
 [
  "naukuchiatal",
  "Naukuchiatal",
  "K",
  "Naukuchiatal Lake;lake walks;viewpoints",
  ""
 ],
 [
  "pangot",
  "Pangot",
  "K",
  "birdwatching trails;village forests;Nainital",
  ""
 ],
 [
  "chaukori",
  "Chaukori",
  "K",
  "Himalayan viewpoints;tea gardens;village walks",
  ""
 ],
 [
  "munsiyari",
  "Munsiyari",
  "K",
  "Panchachuli viewpoints;Darkot village;Birthi Falls",
  ""
 ],
 [
  "bageshwar",
  "Bageshwar",
  "K",
  "Bagnath Temple;Saryu-Gomati confluence;town bazaar",
  ""
 ],
 [
  "baijnath",
  "Baijnath Uttarakhand",
  "K",
  "Baijnath temple complex;Gomti valley;Kausani",
  ""
 ],
 [
  "katarmal",
  "Katarmal",
  "K",
  "Katarmal Sun Temple;village trail;Almora",
  ""
 ],
 [
  "loharghat",
  "Lohaghat",
  "K",
  "Abbott Mount;Mayawati Ashram;local walks",
  ""
 ],
 [
  "naukuchiatal-outer",
  "Naukuchiatal Valley",
  "K",
  "lakeside villages;birding;quiet stays",
  ""
 ],
 [
  "ramnagar",
  "Ramnagar",
  "K",
  "Corbett museum area;Kosi river;Kaladhungi",
  ""
 ],
 [
  "corbett",
  "Jim Corbett National Park",
  "K",
  "Ramnagar;approved safari gates;Kosi river",
  "कॉर्बेट"
 ],
 [
  "rishikesh",
  "Rishikesh",
  "G",
  "Triveni Ghat;Ram Jhula;riverfront walks",
  "ऋषिकेश"
 ],
 [
  "haridwar",
  "Haridwar",
  "G",
  "Har Ki Pauri;Mansa Devi Temple;old bazaar",
  "हरिद्वार"
 ],
 [
  "mussoorie",
  "Mussoorie",
  "G",
  "Camel's Back Road;Landour;Gun Hill",
  ""
 ],
 [
  "landour",
  "Landour",
  "G",
  "Landour Bazaar;walking loops;Mussoorie",
  ""
 ],
 [
  "dehradun",
  "Dehradun",
  "G",
  "Forest Research Institute;Robber's Cave;local markets",
  ""
 ],
 [
  "auli",
  "Auli",
  "G",
  "mountain viewpoints;ski slopes;Joshimath",
  ""
 ],
 [
  "chopta",
  "Chopta",
  "G",
  "meadows;Tungnath trek trail;forest viewpoints",
  ""
 ],
 [
  "tungnath",
  "Tungnath",
  "G",
  "Tungnath Temple;Chandrashila trail;Chopta",
  ""
 ],
 [
  "kedarnath",
  "Kedarnath",
  "G",
  "Kedarnath shrine;Gaurikund approach;valley views",
  ""
 ],
 [
  "badrinath",
  "Badrinath",
  "G",
  "Badrinath shrine;Tapt Kund area;Mana village",
  ""
 ],
 [
  "gangotri",
  "Gangotri",
  "G",
  "Gangotri Temple;Bhagirathi river;riverfront walks",
  ""
 ],
 [
  "yamunotri",
  "Yamunotri",
  "G",
  "Yamunotri Temple;Janki Chatti approach;Yamuna source region",
  ""
 ],
 [
  "lansdowne",
  "Lansdowne",
  "G",
  "Bhulla Tal;Tip-in-Top;quiet forest roads",
  ""
 ],
 [
  "valley-of-flowers",
  "Valley of Flowers",
  "G",
  "Ghangaria;designated park trail;alpine flowers",
  ""
 ],
 [
  "tehri",
  "New Tehri",
  "G",
  "Tehri Lake;viewpoints;local markets",
  ""
 ],
 [
  "devprayag",
  "Devprayag",
  "G",
  "river confluence;old settlement;temples",
  ""
 ],
 [
  "manali",
  "Manali",
  "H",
  "Old Manali;Hadimba Temple;Solang Valley",
  ""
 ],
 [
  "kullu",
  "Kullu",
  "H",
  "river valley;local temples;craft markets",
  ""
 ],
 [
  "kasol",
  "Kasol",
  "H",
  "Parvati Valley;river walks;nearby villages",
  ""
 ],
 [
  "tirthan",
  "Tirthan Valley",
  "H",
  "Gushaini;river walks;Great Himalayan National Park approaches",
  ""
 ],
 [
  "shimla",
  "Shimla",
  "H",
  "The Ridge;Christ Church;Jakhu Hill",
  ""
 ],
 [
  "dharamshala",
  "Dharamshala",
  "H",
  "McLeod Ganj;Tibetan Museum;tea gardens",
  ""
 ],
 [
  "bir-billing",
  "Bir Billing",
  "H",
  "Bir village;monastery visits;paragliding take-off viewpoint",
  ""
 ],
 [
  "spiti",
  "Spiti Valley",
  "H",
  "Kaza;Key Monastery;high-altitude landscapes",
  ""
 ],
 [
  "dalhousie",
  "Dalhousie",
  "H",
  "Gandhi Chowk;Khajjiar;forest walks",
  ""
 ],
 [
  "srinagar-kashmir",
  "Srinagar Kashmir",
  "J",
  "Dal Lake;Mughal gardens;old city",
  ""
 ],
 [
  "gulmarg",
  "Gulmarg",
  "J",
  "meadow viewpoints;gondola area;forest walks",
  ""
 ],
 [
  "pahalgam",
  "Pahalgam",
  "J",
  "Lidder River;valley walks;viewpoints",
  ""
 ],
 [
  "sonamarg",
  "Sonamarg",
  "J",
  "Sind river valley;meadows;mountain views",
  ""
 ],
 [
  "leh",
  "Leh",
  "L",
  "Leh Palace;Shanti Stupa;old bazaar",
  ""
 ],
 [
  "nubra",
  "Nubra Valley",
  "L",
  "Diskit;Hunder;Shyok valley",
  ""
 ],
 [
  "pangong",
  "Pangong Lake",
  "L",
  "lake viewpoints;village stops;high-altitude landscape",
  ""
 ],
 [
  "jaipur",
  "Jaipur",
  "R",
  "Amber Fort;Hawa Mahal;City Palace",
  ""
 ],
 [
  "udaipur",
  "Udaipur",
  "R",
  "City Palace;Lake Pichola;old lanes",
  ""
 ],
 [
  "jodhpur",
  "Jodhpur",
  "R",
  "Mehrangarh Fort;Jaswant Thada;blue lanes",
  ""
 ],
 [
  "jaisalmer",
  "Jaisalmer",
  "R",
  "Jaisalmer Fort;old havelis;Thar landscape",
  ""
 ],
 [
  "pushkar",
  "Pushkar",
  "R",
  "Pushkar Lake;Brahma Temple;old market",
  ""
 ],
 [
  "mount-abu",
  "Mount Abu",
  "R",
  "Nakki Lake;Dilwara Temples;viewpoints",
  ""
 ],
 [
  "bikaner",
  "Bikaner",
  "R",
  "Junagarh Fort;old city;desert landscape",
  ""
 ],
 [
  "delhi",
  "Delhi",
  "D",
  "India Gate;Humayun's Tomb;Old Delhi",
  ""
 ],
 [
  "agra",
  "Agra",
  "U",
  "Taj Mahal;Agra Fort;Mehtab Bagh",
  ""
 ],
 [
  "varanasi",
  "Varanasi",
  "U",
  "river ghats;Sarnath;old lanes",
  "काशी"
 ],
 [
  "lucknow",
  "Lucknow",
  "U",
  "Bara Imambara;Rumi Darwaza;Hazratganj",
  ""
 ],
 [
  "prayagraj",
  "Prayagraj",
  "U",
  "Triveni Sangam;Allahabad Fort area;old city",
  ""
 ],
 [
  "ayodhya",
  "Ayodhya",
  "U",
  "Sarayu ghats;temple district;heritage lanes",
  ""
 ],
 [
  "amritsar",
  "Amritsar",
  "P",
  "Golden Temple;Jallianwala Bagh;heritage streets",
  ""
 ],
 [
  "chandigarh",
  "Chandigarh",
  "P",
  "Rock Garden;Sukhna Lake;Capitol Complex",
  ""
 ],
 [
  "ahmedabad",
  "Ahmedabad",
  "A",
  "Sabarmati Ashram;old city pols;Adalaj Stepwell",
  ""
 ],
 [
  "kutch",
  "Kutch",
  "A",
  "Bhuj;craft villages;Rann landscape",
  ""
 ],
 [
  "gir",
  "Gir National Park",
  "A",
  "Sasan Gir;official safari region;Devalia",
  ""
 ],
 [
  "vadodara",
  "Vadodara",
  "A",
  "Laxmi Vilas Palace;Sayaji Baug;heritage streets",
  ""
 ],
 [
  "mumbai",
  "Mumbai",
  "M",
  "Gateway of India;Elephanta caves;Marine Drive",
  ""
 ],
 [
  "pune",
  "Pune",
  "M",
  "Shaniwar Wada;Aga Khan Palace;old markets",
  ""
 ],
 [
  "nashik",
  "Nashik",
  "M",
  "Panchavati;Godavari ghats;vineyard region",
  ""
 ],
 [
  "aurangabad",
  "Chhatrapati Sambhajinagar",
  "M",
  "Ellora Caves;Ajanta region;Bibi Ka Maqbara",
  "aurangabad"
 ],
 [
  "mahabaleshwar",
  "Mahabaleshwar",
  "M",
  "Arthur's Seat;Venna Lake;strawberry farms",
  ""
 ],
 [
  "panaji",
  "Panaji",
  "O",
  "Fontainhas;Mandovi riverfront;local markets",
  "goa capital"
 ],
 [
  "north-goa",
  "North Goa",
  "O",
  "Fort Aguada;beaches;old markets",
  ""
 ],
 [
  "south-goa",
  "South Goa",
  "O",
  "Colva;Palolem;village churches",
  ""
 ],
 [
  "bhopal",
  "Bhopal",
  "B",
  "Upper Lake;Sanchi region;old city",
  ""
 ],
 [
  "khajuraho",
  "Khajuraho",
  "B",
  "Khajuraho temples;archaeological museum;old town",
  ""
 ],
 [
  "orchha",
  "Orchha",
  "B",
  "Orchha Fort;chhatris;Betwa River",
  ""
 ],
 [
  "gwalior",
  "Gwalior",
  "B",
  "Gwalior Fort;Jai Vilas Palace;old town",
  ""
 ],
 [
  "kolkata",
  "Kolkata",
  "E",
  "Victoria Memorial;Indian Museum;Howrah riverfront",
  ""
 ],
 [
  "darjeeling",
  "Darjeeling",
  "E",
  "tea gardens;Tiger Hill;Himalayan railway",
  ""
 ],
 [
  "sundarbans",
  "Sundarbans",
  "E",
  "designated safari zones;river landscape;mangrove ecosystem",
  ""
 ],
 [
  "puri",
  "Puri",
  "Q",
  "Jagannath Temple;Puri beach;heritage bazaar",
  ""
 ],
 [
  "konark",
  "Konark",
  "Q",
  "Sun Temple;heritage area;coastal road",
  ""
 ],
 [
  "bhubaneswar",
  "Bhubaneswar",
  "Q",
  "Lingaraja Temple;Udayagiri and Khandagiri;local markets",
  ""
 ],
 [
  "gangtok",
  "Gangtok",
  "S",
  "MG Marg;monasteries;hill viewpoints",
  ""
 ],
 [
  "pelling",
  "Pelling",
  "S",
  "Pemayangtse Monastery;Kanchenjunga views;heritage sites",
  ""
 ],
 [
  "guwahati",
  "Guwahati",
  "N",
  "Kamakhya Temple;Brahmaputra riverfront;Umananda Island",
  ""
 ],
 [
  "kaziranga",
  "Kaziranga",
  "N",
  "park entrance zones;tea landscapes;visitor centre",
  ""
 ],
 [
  "shillong",
  "Shillong",
  "N",
  "Ward's Lake;Don Bosco Museum;hill views",
  ""
 ],
 [
  "cherrapunji",
  "Sohra Cherrapunji",
  "N",
  "waterfalls;limestone caves;viewpoints",
  ""
 ],
 [
  "tawang",
  "Tawang",
  "N",
  "Tawang Monastery;war memorial;mountain views",
  ""
 ],
 [
  "kohima",
  "Kohima",
  "N",
  "war cemetery;Naga heritage villages;hill viewpoints",
  ""
 ],
 [
  "chennai",
  "Chennai",
  "T",
  "Marina Beach;Kapaleeshwarar Temple;Fort St George",
  ""
 ],
 [
  "mahabalipuram",
  "Mahabalipuram",
  "T",
  "Shore Temple;Five Rathas;rock carvings",
  ""
 ],
 [
  "madurai",
  "Madurai",
  "T",
  "Meenakshi Temple;Thirumalai Nayakkar Palace;old markets",
  ""
 ],
 [
  "rameswaram",
  "Rameswaram",
  "T",
  "Ramanathaswamy Temple;Pamban Bridge;coastal viewpoints",
  ""
 ],
 [
  "ooty",
  "Ooty",
  "T",
  "Botanical Garden;Ooty Lake;Nilgiri tea estates",
  ""
 ],
 [
  "munnar",
  "Munnar",
  "V",
  "tea plantations;Eravikulam approach;hill viewpoints",
  ""
 ],
 [
  "kochi",
  "Kochi",
  "V",
  "Fort Kochi;Chinese fishing nets;Mattancherry",
  ""
 ],
 [
  "alleppey",
  "Alappuzha",
  "V",
  "backwaters;canals;coastal villages",
  "alleppey"
 ],
 [
  "varkala",
  "Varkala",
  "V",
  "cliff walk;beach;local lanes",
  ""
 ],
 [
  "wayanad",
  "Wayanad",
  "V",
  "Edakkal Caves;forest views;local villages",
  ""
 ],
 [
  "bengaluru",
  "Bengaluru",
  "W",
  "Cubbon Park;Bangalore Palace;Lalbagh",
  "bangalore"
 ],
 [
  "mysuru",
  "Mysuru",
  "W",
  "Mysore Palace;Chamundi Hill;Devaraja Market",
  "mysore"
 ],
 [
  "hampi",
  "Hampi",
  "W",
  "Virupaksha Temple;Vijaya Vittala Temple;heritage landscape",
  ""
 ],
 [
  "coorg",
  "Kodagu Coorg",
  "W",
  "Madikeri;coffee plantations;Raja's Seat",
  "kodagu"
 ],
 [
  "gokarna",
  "Gokarna",
  "W",
  "Mahabaleshwar Temple;beaches;coastal walks",
  ""
 ],
 [
  "hyderabad",
  "Hyderabad",
  "Z",
  "Charminar;Golconda Fort;Chowmahalla Palace",
  ""
 ],
 [
  "visakhapatnam",
  "Visakhapatnam",
  "Z",
  "RK Beach;Kailasagiri;Araku Valley",
  "vizag"
 ],
 [
  "tirupati",
  "Tirupati",
  "Z",
  "Tirumala shrine area;temple town;hills",
  ""
 ],
 [
  "bodh-gaya",
  "Bodh Gaya",
  "C",
  "Mahabodhi Temple;monastic area;heritage sites",
  ""
 ],
 [
  "rajgir",
  "Rajgir",
  "C",
  "Vulture's Peak;Nalanda region;hot springs",
  ""
 ],
 [
  "ranchi",
  "Ranchi",
  "C",
  "Tagore Hill;local waterfalls;urban lakes",
  ""
 ]
];
const FEATURED={
  "almora": {
    "source": "https://uttarakhandtourism.gov.in/destination/almora",
    "overview": "Kumaon cultural town on a mountain ridge, known for traditional markets, crafts and views.",
    "people": [
      [
        "Swami Vivekananda",
        "Visited the Almora region"
      ],
      [
        "Uday Shankar",
        "Built an important dance and arts connection with Almora"
      ],
      [
        "Govind Ballabh Pant",
        "Freedom fighter associated with Almora"
      ]
    ],
    "days": [
      "Arrive and explore Lala Bazaar at a relaxed pace",
      "Visit Chitai and nearby heritage; allow a flexible local-food stop",
      "Explore Kasar Devi and spend a slow final morning"
    ]
  },
  "kasar-devi": {
    "source": "https://www.incredibleindia.gov.in/en/uttarakhand/almora/kasar-devi-temple",
    "overview": "Hilltop temple and retreat area near Almora known for contemplative walks and scenery.",
    "days": [
      "Arrive, settle in, and take an easy walk",
      "Visit Kasar Devi Temple and enjoy slow viewpoints",
      "Explore Almora or leave after breakfast"
    ]
  },
  "jageshwar": {
    "source": "https://uttarakhandtourism.gov.in/destination/jageshwar",
    "overview": "Historic cluster of Shiva temples in a forested valley in the Almora district.",
    "days": [
      "Arrive and visit the primary temple group",
      "Explore the temple complex and deodar forest at an unhurried pace",
      "Leave time for a nearby heritage stop and departure"
    ]
  },
  "binsar": {
    "source": "https://www.uttarakhandtourism.gov.in/destination/binsar",
    "overview": "Forested Himalayan wildlife landscape and viewpoint area near Almora.",
    "days": [
      "Arrive and enjoy a forest-edge stay",
      "Choose a permitted viewpoint trail with local guidance",
      "Visit a nearby village or return after breakfast"
    ]
  },
  "kausani": {
    "source": "https://uttarakhandtourism.gov.in/destination/kausani",
    "overview": "Mountain village appreciated for long Himalayan views and surrounding valley scenery.",
    "people": [
      [
        "Mahatma Gandhi",
        "Associated with Anasakti Ashram in Kausani"
      ],
      [
        "Sumitranandan Pant",
        "Poet born in Kausani"
      ]
    ],
    "days": [
      "Arrive and enjoy Himalayan viewpoints",
      "Visit Anasakti Ashram and the nearby craft heritage",
      "Optional Baijnath cultural excursion before departure"
    ]
  },
  "ranikhet": {
    "source": "https://www.uttarakhandtourism.gov.in/destination/ranikhet",
    "overview": "Cantonment hill town with wooded roads, viewpoints, and a gentler travel pace.",
    "days": [
      "Arrive and explore the town slowly",
      "Visit Chaubatia and nearby viewpoints",
      "Choose a quiet morning walk before departure"
    ]
  },
  "nainital": {
    "source": "https://uttarakhandtourism.gov.in/destination/nainital",
    "overview": "Lake-centred Kumaon hill town, with Naini Lake at the heart of its visitor circuit.",
    "days": [
      "Arrive and walk the lakefront",
      "Visit the temple and one viewpoint; keep boats weather-dependent",
      "Explore quieter neighbouring lakes or depart"
    ]
  },
  "bhimtal": {
    "source": "https://uttarakhandtourism.gov.in/destination/bhimtal",
    "overview": "Lake town near Nainital, suited to gentle sightseeing and forested surroundings.",
    "days": [
      "Lakeside arrival and sunset walk",
      "Visit Bhimeshwar Temple and Victoria Dam",
      "Consider a neighbouring lake before departure"
    ]
  },
  "champawat": {
    "source": "https://uttarakhandtourism.gov.in/public/destination/champawat",
    "overview": "Historic Kumaon town and regional heritage centre, including Baleshwar Temple.",
    "days": [
      "Arrive and walk the town",
      "Visit Baleshwar Temple and nearby heritage streets",
      "Enjoy a slower village morning and depart"
    ]
  },
  "bhowali": {
    "source": "https://www.uttarakhandtourism.gov.in/destination/bhowali",
    "overview": "Fruit-market hill junction connecting several Kumaon lake and orchard routes.",
    "days": [
      "Arrive and explore the fruit-market area",
      "Select one nearby lake or orchard landscape",
      "Slow breakfast and onward travel"
    ]
  },
  "mukteshwar": {
    "source": "https://uttarakhandtourism.gov.in/destination/mukteshwar",
    "overview": "Hill-area destination in Kumaon known for mountain views and rural stays.",
    "days": [
      "Arrive and settle into a hill stay",
      "Visit temple and local viewpoints",
      "Take a relaxed orchard or village walk before departure"
    ]
  },
  "pithoragarh": {
    "source": "https://www.uttarakhandtourism.gov.in/destination/pithoragarh",
    "overview": "Hill town within the Soar valley and gateway to parts of eastern Kumaon.",
    "days": [
      "Arrive and orient within the valley",
      "Explore local viewpoints and heritage",
      "Enjoy a slower village morning and depart"
    ]
  },
  "rishikesh": {
    "source": "https://uttarakhandtourism.gov.in/search",
    "overview": "Riverside pilgrimage and yoga destination in Uttarakhand; activity providers require independent verification.",
    "days": [
      "Arrive and walk a riverfront area",
      "Explore local spiritual heritage and yoga options",
      "Quiet morning and departure"
    ]
  },
  "mussoorie": {
    "source": "https://uttarakhandtourism.gov.in/destination/mussoorie",
    "overview": "Popular Garhwal hill station with walks, heritage areas and neighbouring Landour.",
    "days": [
      "Arrive and explore a central walk",
      "Spend a slow morning around Landour",
      "Choose one viewpoint and depart"
    ]
  },
  "auli": {
    "source": "https://uttarakhandtourism.gov.in/destination/auli",
    "overview": "Mountain resort region noted for high-altitude scenery and skiing in suitable conditions.",
    "days": [
      "Arrive via the appropriate access town",
      "Explore safe viewpoints or verified seasonal activities",
      "Allow weather buffer before departure"
    ]
  }
};
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const entries=ROWS.map(([id,name,regionKey,stops,aliases])=>{
 const group=REGIONS[regionKey],featured=FEATURED[id];
 const highlights=stops.split(';').map(s=>s.trim()).filter(Boolean);
 const suggestions=(featured&&featured.days)||[
   'Arrival and relaxed exploration around '+highlights[0],
   'Select '+(highlights[1]||'a local attraction')+' and '+(highlights[2]||'a slow cultural stop'),
   'Leave a flexible final morning before departure'
 ];
 return Object.freeze({
   id,name,region:group[0],country:'India',
   aliases:(aliases||'').split(';').filter(Boolean),
   highlights,foodSuggestions:group[1].split('|'),
   people:(featured&&featured.people||[]).map(([name,context])=>({name,context})),
   suggestedItinerary:suggestions.map((description,index)=>({day:index+1,description})),
   summary:featured?.overview||('Editorial destination lead in '+group[0]+'. Attractions are suggestions requiring local confirmation.'),
   status:featured?'source-backed-overview':'editorial-lead',
   checkedAt:featured?'2026-11-22':null,
   sourcePage:featured?.source||group[2],
   // This is a PHOTO REFERENCE (not an image URL): no permission to embed.
   photo:{referencePage:featured?.source||group[2],alt:'Travel imagery to be reviewed for '+name,rights:'not-cleared',displayAllowed:false}
 });
});
export const TUSK_ATLAS=Object.freeze(entries);
export const TUSK_ATLAS_STATS=Object.freeze({
 total:entries.length,sourceBacked:entries.filter(x=>x.status==='source-backed-overview').length,
 leads:entries.filter(x=>x.status==='editorial-lead').length,photoCleared:0
});
export function searchTravelAtlas(query){
 const q=' '+normalize(query)+' ';
 const matched=[];
 for(const entry of entries){
   const aliases=[entry.name,...entry.aliases];
   let score=0;
   for(const a of aliases){
     const key=' '+normalize(a)+' ';
     if(key.trim().length>=3&&q.includes(key))score=Math.max(score,normalize(a).length);
   }
   if(score)matched.push({entry,score});
 }
 matched.sort((a,b)=>b.score-a.score || (a.entry.status===b.entry.status?0:a.entry.status==='source-backed-overview'?-1:1));
 return matched.slice(0,3).map(x=>x.entry);
}
