/* International editorial discovery, not a reviewed factual or commercial feed.
 * Reference links are starting points for human review; no photos are copied. */
const ROWS=[
['Tokyo','JP','Japan','Asakusa;Ueno Park;Meiji Shrine','Ramen;Soba;Tempura'],
['Kyoto','JP','Japan','Gion;Arashiyama;Nishiki Market','Yudofu;Matcha;Kaiseki'],
['Osaka','JP','Japan','Osaka Castle;Dotonbori;Nakanoshima','Takoyaki;Okonomiyaki'],
['Seoul','KR','South Korea','Gyeongbokgung;Bukchon;Hangang parks','Bibimbap;Kimchi;Tteokbokki'],
['Busan','KR','South Korea','Gamcheon Culture Village;Haeundae;Jagalchi Market','Milmyeon;Fish cakes'],
['Taipei','TW','Taiwan','Daan Forest Park;Beitou;Dihua Street','Beef noodles;Pineapple cake'],
['Singapore','SG','Singapore','Botanic Gardens;Chinatown;Gardens by the Bay','Laksa;Chicken rice'],
['Bangkok','TH','Thailand','Wat Pho;Bangkok Art and Culture Centre;Lumphini Park','Pad Thai;Tom yum'],
['Chiang Mai','TH','Thailand','Old City temples;Wat Umong;local craft workshops','Khao soi;Sai ua'],
['Hanoi','VN','Vietnam','Old Quarter;Temple of Literature;Hoan Kiem Lake','Pho;Bun cha'],
['Hoi An','VN','Vietnam','Ancient Town;riverfront;craft villages','Cao lau;Mi quang'],
['Kuala Lumpur','MY','Malaysia','KLCC Park;Central Market;Islamic Arts Museum','Nasi lemak;Roti canai'],
['George Town','MY','Malaysia','Heritage streets;Clan Jetties;Penang Hill','Char kway teow;Assam laksa'],
['Ubud','ID','Indonesia','Rice terraces;art museums;craft villages','Nasi campur;Gado-gado'],
['Jakarta','ID','Indonesia','Kota Tua;National Monument;public parks','Soto Betawi;Nasi uduk'],
['Kathmandu','NP','Nepal','Swayambhunath;Patan Durbar Square;Boudhanath','Dal bhat;Momo'],
['Pokhara','NP','Nepal','Phewa Lake;International Mountain Museum;viewpoints','Dal bhat;Thukpa'],
['Thimphu','BT','Bhutan','Memorial Chorten;folk heritage;craft markets','Ema datshi;Red rice'],
['Colombo','LK','Sri Lanka','National Museum;Galle Face Green;Pettah','Hoppers;Rice and curry'],
['Kandy','LK','Sri Lanka','Temple of the Tooth;Kandy Lake;botanical gardens','Kottu;Rice and curry'],
['Dubai','AE','United Arab Emirates','Al Fahidi;Dubai Creek;public waterfront','Machboos;Luqaimat'],
['Muscat','OM','Oman','Mutrah Corniche;Mutrah Souq;National Museum','Shuwa;Omani halwa'],
['Istanbul','TR','Türkiye','Sultanahmet;Bosphorus;Balat','Meze;Simit;Kofte'],
['Tbilisi','GE','Georgia','Old Town;Narikala area;Dry Bridge Market','Khachapuri;Khinkali'],
['Yerevan','AM','Armenia','Republic Square;Cascade;Matenadaran','Lavash;Khorovats'],
['Almaty','KZ','Kazakhstan','Panfilov Park;Green Bazaar;mountain foothills','Beshbarmak;Baursak'],
['Samarkand','UZ','Uzbekistan','Registan;Shah-i-Zinda;Siab Bazaar','Plov;Samsa'],
['Helsinki','FI','Finland','Suomenlinna;Design District;central library','Salmon soup;Karelian pies'],
['Tallinn','EE','Estonia','Old Town;Kadriorg;Telliskivi','Black bread;Kama'],
['Stockholm','SE','Sweden','Gamla Stan;Djurgarden;archipelago','Meatballs;Cinnamon buns'],
['Oslo','NO','Norway','Vigeland Park;Bygdoy;harbour','Fish soup;Brunost'],
['Copenhagen','DK','Denmark','Nyhavn;Botanical Garden;design museums','Smorrebrod;Danish pastries'],
['Reykjavik','IS','Iceland','Harpa;old harbour;city museums','Skyr;Fish stew'],
['London','GB','United Kingdom','South Bank;British Museum;Greenwich','Sunday roast;Fish and chips'],
['Edinburgh','GB','United Kingdom','Old Town;Calton Hill;Royal Botanic Garden','Cullen skink;Shortbread'],
['Dublin','IE','Ireland','Phoenix Park;Trinity College area;National Gallery','Irish stew;Soda bread'],
['Paris','FR','France','Seine walks;Musee d Orsay;Luxembourg Gardens','Crepes;Croissants'],
['Amsterdam','NL','Netherlands','Canal district;Museumplein;Vondelpark','Stroopwafel;Poffertjes'],
['Berlin','DE','Germany','Museum Island;Tiergarten;East Side Gallery','Currywurst;Pretzels'],
['Prague','CZ','Czechia','Old Town;Letna Park;Prague Castle area','Svíčková;Kolache'],
['Vienna','AT','Austria','Ringstrasse;Belvedere;Prater','Schnitzel;Apfelstrudel'],
['Zurich','CH','Switzerland','Old Town;lakefront;Kunsthaus','Rosti;Zurcher Geschnetzeltes'],
['Rome','IT','Italy','Roman Forum;Trastevere;Villa Borghese','Cacio e pepe;Suppli'],
['Florence','IT','Italy','Duomo area;Uffizi;Boboli Gardens','Ribollita;Schiacciata'],
['Barcelona','ES','Spain','Gothic Quarter;Montjuic;modernist architecture','Pa amb tomaquet;Tapas'],
['Lisbon','PT','Portugal','Alfama;Belem;Estrela Garden','Pastel de nata;Bacalhau'],
['Funchal','PT','Portugal','Old Town;botanical garden;market','Espetada;Bolo do caco'],
['Athens','GR','Greece','Acropolis area;Plaka;National Garden','Souvlaki;Spanakopita'],
['Cape Town','ZA','South Africa','Kirstenbosch;Waterfront;Bo-Kaap','Bobotie;Cape Malay curry'],
['Nairobi','KE','Kenya','National Museum;Karura Forest;craft markets','Ugali;Nyama choma'],
['Kigali','RW','Rwanda','Kigali Genocide Memorial;art centres;local markets','Isombe;Brochettes'],
['Marrakesh','MA','Morocco','Medina;Bahia Palace;gardens','Tagine;Couscous'],
['Cairo','EG','Egypt','Islamic Cairo;Egyptian Museum area;Nile waterfront','Koshari;Ful medames'],
['New York City','US','United States','Central Park;Metropolitan Museum;Brooklyn waterfront','Bagels;Pizza'],
['San Francisco','US','United States','Golden Gate Park;Ferry Building;Presidio','Sourdough;Mission burrito'],
['Vancouver','CA','Canada','Stanley Park;Granville Island;Seawall','Salmon;Pacific Northwest cuisine'],
['Montreal','CA','Canada','Old Montreal;Mount Royal;Jean-Talon Market','Poutine;Bagels'],
['Mexico City','MX','Mexico','Chapultepec;Historic Centre;Coyoacan','Tacos;Tamales'],
['Oaxaca City','MX','Mexico','Historic Centre;craft markets;Monte Alban area','Mole;Tlayudas'],
['Lima','PE','Peru','Miraflores;Barranco;historic centre','Ceviche;Lomo saltado'],
['Cusco','PE','Peru','Historic centre;San Blas;nearby heritage','Quinoa soup;Andean dishes'],
['Buenos Aires','AR','Argentina','Recoleta;Palermo;San Telmo','Empanadas;Asado'],
['Santiago','CL','Chile','Lastarria;Cerro Santa Lucia;Museo Chileno de Arte Precolombino','Pastel de choclo;Empanadas'],
['Rio de Janeiro','BR','Brazil','Botanical Garden;Santa Teresa;coastal promenades','Feijoada;Pao de queijo'],
['Sydney','AU','Australia','Royal Botanic Garden;harbour;coastal walks','Seafood;Meat pies'],
['Melbourne','AU','Australia','Laneways;National Gallery of Victoria;Botanic Gardens','Cafe food;Multicultural cuisine'],
['Auckland','NZ','New Zealand','Domain;waterfront;local museums','Seafood;Hangi'],
['Queenstown','NZ','New Zealand','Lake Wakatipu;gardens;scenic viewpoints','Local produce;Seafood']
];
const slug=s=>s.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').toLowerCase().replace(/^-|-$/g,'');
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const WORLD_ATLAS=Object.freeze(ROWS.map(([name,countryIso,country,stops,dishes])=>{
 const highlights=stops.split(';'),id=slug(name);
 const ref='https://en.wikivoyage.org/wiki/'+encodeURIComponent(name.replace(/ /g,'_'));
 return {id,name,countryIso,country,region:country,aliases:name==='New York City'?['New York','NYC']:name==='Reykjavik'?['Reykjavík']:[],highlights,foodSuggestions:dishes.split(';'),facts:[],people:[],
 status:'editorial-lead',checkedAt:null,sourcePage:ref,sourceType:'unreviewed-travel-reference',
 summary:'International editorial discovery in '+country+'. Confirm suggested stops and food locally.',
 suggestedItinerary:[{day:1,description:'Arrive and explore '+highlights[0]+' at a relaxed pace.'},{day:2,description:'Consider '+highlights[1]+' and '+highlights[2]+', subject to local conditions.'},{day:3,description:'Choose a flexible morning and allow time for departure.'}],
 photo:{referencePage:ref,rights:'not-cleared',displayAllowed:false}};
}));
export function searchWorldAtlas(question){
 const q=' '+normalize(question)+' ';
 const matches=WORLD_ATLAS.filter(x=>[x.name,...x.aliases].some(n=>q.includes(' '+normalize(n)+' ')));
 // Multi-city requests need disambiguation, not a fabricated single-city plan.
 if(matches.length!==1)return null;
 return matches[0];
}
