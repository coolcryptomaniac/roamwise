from pathlib import Path
import json, math, re, textwrap, html, zipfile, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase.pdfmetrics import stringWidth

OUT = Path('/mnt/data/roamwise-itinerary-library')
if OUT.exists(): shutil.rmtree(OUT)
(OUT/'assets').mkdir(parents=True)
(OUT/'data').mkdir()
(OUT/'scripts').mkdir()
(OUT/'presets').mkdir()

# Four trip-depth presets. Visual theme is destination-aware and can also be changed in HTML.
VARIANTS = {
    'essential': {'label':'Essential', 'desc':'Fast first-timer route with the non-negotiable highlights.'},
    'signature': {'label':'Signature', 'desc':'Balanced RoamWise default with breathing room and strong variety.'},
    'deep-dive': {'label':'Deep Dive', 'desc':'Slower route with secondary places, culture and recovery time.'},
    'expedition': {'label':'Expedition', 'desc':'Longest ready-made route with remote legs, buffers and deeper exploration.'},
}

# Helpers to keep the catalog readable.
def D(slug,name,country,region,category,theme,days,aliases,gateway,season,stops,notes):
    return dict(slug=slug,name=name,country=country,region=region,category=category,theme=theme,
                days=days,aliases=aliases,gateway=gateway,season=season,stops=stops,notes=notes)

def S(name, focus): return {'name':name,'focus':focus}

C=[]
# INDIA - 20
C += [
D('ladakh','Ladakh High-Altitude Circuit','India','Ladakh','road-trip','crimson-moon',[4,6,8,10],['leh','leh ladakh','ladakh road trip','nubra pangong'],'Leh','May-Sep',[
 S('Leh','acclimatize, Old Town, Shanti Stupa and local food'),S('Sham Valley','Indus-side monasteries, Magnetic Hill corridor and village stops'),S('Khardung La - Nubra','high pass crossing, Diskit and Hunder dunes'),S('Nubra Valley','villages, monasteries and a slower valley morning'),S('Shyok - Pangong','remote road, changing geology and Pangong arrival'),S('Pangong Lake','sunrise, shoreline viewpoints and minimal-impact time by the lake'),S('Chang La - Leh','return over the high road with monastery options'),S('Leh Buffer','market, cafe, museum, contingency or rest day'),S('Tso Moriri','Changthang plateau, lake landscapes and nomadic culture'),S('Tso Kar - Leh','salt-lake country and high plateau return')],
 'High altitude: preserve acclimatization, hydration and road buffers. Recheck permits and road status locally.'),
D('kashmir','Kashmir Valley & Alpine Lakes','India','Jammu & Kashmir','scenic','crimson-moon',[4,6,8,10],['srinagar','kashmir','gulmarg pahalgam'],'Srinagar','Apr-Oct',[
 S('Srinagar','Dal Lake, old city, gardens and houseboat atmosphere'),S('Gulmarg','meadows, gondola sector and mountain viewpoints'),S('Pahalgam','Lidder Valley, village walks and pine landscapes'),S('Aru Valley','quiet valley day and trailheads'),S('Sonamarg','Sindh valley, glacier viewpoints and alpine scenery'),S('Gurez Valley','remote mountain valley and village culture'),S('Doodhpathri','meadows and lower-crowd scenic day'),S('Srinagar Buffer','crafts, food walk and weather buffer')],
 'Mountain access and security conditions can change. Keep routes flexible and verify local advisories.'),
D('spiti','Spiti Valley Himalayan Loop','India','Himachal Pradesh','road-trip','crimson-expedition',[5,7,10,12],['spiti valley','kaza','kinnaur spiti'],'Shimla / Manali','May-Oct',[
 S('Shimla - Sarahan','Himalayan transition and temple-town stop'),S('Sangla - Chitkul','Baspa Valley villages and last-road landscapes'),S('Kalpa','Kinnaur Kailash viewpoints and orchard country'),S('Nako - Tabo','high-desert transition, lake and ancient monastery'),S('Dhankar - Pin Valley','clifftop monastery and Pin Valley landscapes'),S('Kaza','market, cafes and acclimatization'),S('Key - Kibber','monastery, high villages and wildlife country'),S('Hikkim - Komic - Langza','fossil country and high settlements'),S('Chandratal','high-altitude lake camp sector'),S('Kunzum - Manali','high pass exit and dramatic road day')],
 'Long road days, altitude and seasonal closures define this circuit. Do not compress acclimatization or night driving.'),
D('manali','Manali, Solang & Kullu Valley','India','Himachal Pradesh','mountain','crimson-expedition',[3,5,7,9],['manali','kullu manali','solang valley'],'Manali','Mar-Jun / Sep-Nov',[
 S('Old Manali','river, cafes, temple lanes and arrival'),S('Solang Valley','mountain activities and viewpoints'),S('Atal Tunnel - Sissu','Lahaul day trip and waterfall landscapes'),S('Naggar','castle, art, old villages and valley views'),S('Kullu','crafts, river valley and local food'),S('Jana - Rumsu','village roads, waterfalls and slower mountain culture'),S('Kasol - Manikaran','Parvati Valley contrast and riverside walks'),S('Manali Buffer','shopping, spa, cafe or weather buffer')],
 'Activities and high-road access are weather dependent. Use licensed operators for adventure sports.'),
D('kumaon','Kumaon: Almora, Binsar, Jageshwar & Munsiyari','India','Uttarakhand','mountain','crimson-moon',[4,6,8,11],['almora','kumaon','binsar','jageshwar','munsiyari'],'Kathgodam / Pantnagar','Mar-Jun / Oct-Dec',[
 S('Almora','ridge town, local market, Kumaoni food and sunset'),S('Binsar','forest sanctuary, Zero Point and quiet mountain stay'),S('Jageshwar','cedar forest and temple cluster'),S('Kausani','Himalayan panorama, tea and village pace'),S('Chaukori','orchards, ridge views and stargazing'),S('Munsiyari','Panchachuli views and frontier-town atmosphere'),S('Khaliya Top','day hike and alpine ridge views'),S('Birthi - Thal','waterfall and mountain-road return'),S('Nainital','lake, old town and easy finale')],
 'Mountain roads are slow and monsoon-sensitive. Keep one flexible buffer on longer loops.'),
D('chardham','Char Dham Scarlet Pilgrim Path','India','Uttarakhand','pilgrimage','scarlet-pilgrim',[8,10,12,14],['char dham','kedarnath badrinath','yamunotri gangotri'],'Haridwar / Dehradun','May-Jun / Sep-Oct',[
 S('Haridwar - Barkot','pilgrimage launch and Yamuna valley approach'),S('Yamunotri','temple trek day with pacing and return'),S('Uttarkashi','river valley transfer and recovery'),S('Gangotri','Bhagirathi valley pilgrimage'),S('Guptkashi','long transfer toward Kedarnath sector'),S('Kedarnath','trek/authorized transport sector and temple visit'),S('Kedarnath Buffer','descent, recovery and weather buffer'),S('Joshimath','Alaknanda valley transfer'),S('Badrinath','temple, Mana village and high valley'),S('Rudraprayag','descent through confluences'),S('Rishikesh','Ganga finale and rest')],
 'Pilgrimage registrations, transport rules, trekking access and weather can change. Verify official Uttarakhand updates.'),
D('rishikesh-mussoorie','Rishikesh & Mussoorie Escape','India','Uttarakhand','wellness','scarlet-pilgrim',[3,4,6,8],['rishikesh','mussoorie','dehradun rishikesh'],'Dehradun','Sep-Jun',[
 S('Rishikesh','ghats, suspension-bridge area, cafes and Ganga evening'),S('Rishikesh Adventure','rafting sector or guided hike when conditions permit'),S('Narendra Nagar','ridge views and wellness pace'),S('Dehradun','forest research heritage, food and city reset'),S('Mussoorie','Mall Road, Landour and mountain views'),S('Landour','walks, bakeries and quieter cantonment lanes'),S('Dhanaulti','cedar forests and hill drive'),S('Rishikesh Buffer','yoga, spa, cafe and flexible departure')],
 'River activities are seasonal and regulated. Use authorized rafting/adventure operators.'),
D('rajasthan','Rajasthan Royal Desert Circuit','India','Rajasthan','culture','scarlet-pilgrim',[5,8,11,14],['rajasthan','jaipur jodhpur udaipur','royal rajasthan'],'Jaipur','Oct-Mar',[
 S('Jaipur','Amber, City Palace quarter, bazaars and food'),S('Pushkar - Ajmer','lake, old town and pilgrimage contrast'),S('Jodhpur','Mehrangarh, blue lanes and rooftop evening'),S('Osian','desert edge, temples and sunset'),S('Jaisalmer','fort city and havelis'),S('Thar Desert','dunes, village culture and starry night'),S('Udaipur','lakes, palace quarter and old city'),S('Kumbhalgarh','fort walls and Aravalli drive'),S('Ranakpur','Jain architecture and forested valleys'),S('Bundi','stepwells, palace murals and quieter heritage'),S('Jaipur Buffer','shopping, crafts and departure')],
 'Desert temperatures swing sharply. Heritage sites can be crowded; start early and preserve water/rest.'),
D('golden-triangle','Delhi - Agra - Jaipur Golden Triangle','India','North India','culture','scarlet-pilgrim',[3,5,7,9],['golden triangle','delhi agra jaipur'],'Delhi','Oct-Mar',[
 S('Old & New Delhi','monuments, markets and food contrasts'),S('Agra','Taj Mahal, fort and riverfront heritage'),S('Fatehpur Sikri','Mughal city stop en route'),S('Jaipur','Amber, city palace quarter and bazaars'),S('Jaipur Craft Day','block print, food and slower neighborhood exploration'),S('Delhi Buffer','museum, Mehrauli or departure buffer')],
 'Book major monuments ahead where useful and avoid unrealistic same-day city hopping.'),
D('varanasi-ayodhya','Varanasi & Ayodhya Sacred Cities','India','Uttar Pradesh','pilgrimage','scarlet-pilgrim',[3,4,6,7],['varanasi','banaras','ayodhya varanasi'],'Varanasi','Oct-Mar',[
 S('Varanasi Ghats','sunrise boat, old lanes and evening aarti'),S('Sarnath','Buddhist heritage and quieter afternoon'),S('Varanasi Food & Craft','silk, music, food and neighborhood walks'),S('Ayodhya','temple city and Sarayu riverfront'),S('Ayodhya Heritage','slower sacred-city exploration'),S('Varanasi Buffer','revisit ghats and flexible departure')],
 'Respect religious queues, local restrictions and photography rules around active worship spaces.'),
D('goa','Goa Coast, Heritage & Hinterland','India','Goa','beach','eastern-frontier',[3,5,7,9],['goa','north goa','south goa'],'Goa','Nov-Feb',[
 S('Panaji - Fontainhas','Latin quarter, riverfront and food'),S('North Goa','beaches, forts and sunset'),S('South Goa','quieter beaches and coastal villages'),S('Old Goa','churches and heritage'),S('Dudhsagar Hinterland','waterfall/forest sector when access is open'),S('Spice Country','plantation, village and local cuisine'),S('Goa Slow Day','wellness, cafe, beach and flexible exploration')],
 'Waterfall and wildlife access is seasonal. Avoid unsafe swimming and unofficial adventure operators.'),
D('kerala','Kerala Backwaters, Hills & Coast','India','Kerala','scenic','eastern-frontier',[5,7,10,13],['kerala','munnar alleppey','god own country'],'Kochi','Sep-Mar',[
 S('Kochi','Fort Kochi, Mattancherry and waterfront'),S('Munnar','tea country, viewpoints and cool hills'),S('Munnar Nature Day','guided nature sector and plantation landscape'),S('Thekkady','forest edge, spice country and lake sector'),S('Kumarakom','backwaters and birdlife'),S('Alappuzha','houseboat/day-cruise backwater experience'),S('Varkala','cliff beach and slow coast'),S('Kovalam - Trivandrum','coast and city heritage'),S('Wayanad','forest-hill extension'),S('Kochi Buffer','food, shopping and departure')],
 'Monsoon changes road and water conditions. Wildlife and boating activities depend on local operations.'),
D('andaman','Andaman Islands Dive & Beach Circuit','India','Andaman & Nicobar Islands','island','eastern-frontier',[4,6,8,10],['andaman','port blair havelock','swaraj dweep'],'Port Blair','Nov-Apr',[
 S('Port Blair','arrival, waterfront and Cellular Jail heritage'),S('Swaraj Dweep','ferry, beach arrival and island sunset'),S('Radhanagar','beach day and forest-edge walks'),S('Reef Day','licensed snorkeling/diving based on sea conditions'),S('Shaheed Dweep','smaller-island pace and beaches'),S('Port Blair Heritage','museum, harbor and local food'),S('Baratang Sector','only if official access/logistics suit the trip'),S('Island Buffer','ferry/weather buffer before flight')],
 'Keep a ferry/weather buffer. Marine activities should use licensed operators and respect reef rules.'),
D('sikkim','Sikkim Monasteries & High Lakes','India','Sikkim','mountain','eastern-frontier',[4,6,8,10],['sikkim','gangtok','north sikkim'],'Gangtok / Bagdogra','Mar-Jun / Oct-Dec',[
 S('Gangtok','ridge city, monastery, market and views'),S('Tsomgo Sector','high lake and permitted mountain corridor'),S('Namchi - Ravangla','monasteries, sculpture and south-Sikkim hills'),S('Pelling','monastery, skywalk sector and Kanchenjunga views'),S('Yuksom','historic village and trekking gateway'),S('Lachen','North Sikkim road staging'),S('Gurudongmar Sector','high-altitude day only when permitted and suitable'),S('Lachung','valley stay and village pace'),S('Yumthang Sector','seasonal alpine valley'),S('Gangtok Buffer','weather/permit buffer and departure')],
 'Protected-area permits, altitude and road conditions govern high-lake and North Sikkim access.'),
D('northeast-grand','North-East Grand Expedition','India','Assam, Meghalaya & Arunachal Pradesh','expedition','eastern-frontier',[8,10,13,16],['north east india','assam meghalaya arunachal','northeast circuit'],'Guwahati','Oct-Apr',[
 S('Guwahati','Brahmaputra gateway and city reset'),S('Kaziranga','wildlife sector when park operations are open'),S('Shillong','hill city, food and music culture'),S('Sohra','waterfalls, caves and Khasi landscapes'),S('Nongriat','living-root-bridge trek and village night'),S('Dawki - Mawlynnong','river corridor and village landscapes'),S('Dirang','Arunachal mountain-road staging'),S('Sela - Tawang','high-pass road to monastery country'),S('Tawang','monastery, culture and memorial sector'),S('High Lakes Sector','permit-dependent Tawang high country'),S('Bomdila','descent and monastery stop'),S('Guwahati Buffer','long-road contingency and departure')],
 'Permits, wildlife seasons and mountain roads vary by state. Preserve at least one contingency day.'),
D('tawang','Tawang & Sela Pass Circuit','India','Arunachal Pradesh','mountain','eastern-frontier',[5,7,9,11],['tawang','sela pass','dirang tawang'],'Guwahati / Tezpur','Oct-Apr',[
 S('Tezpur - Dirang','foothills to mountain staging'),S('Dirang','village, monastery and acclimatization'),S('Sela Pass - Tawang','high-pass road and dramatic arrival'),S('Tawang','monastery, craft and town culture'),S('High Lakes','permit-dependent alpine-lake sector'),S('Bum La Option','only when officially permitted and road-safe'),S('Jang - Dirang','waterfall sector and descent'),S('Bomdila','monastery and mountain-town halt'),S('Guwahati Exit','long return with buffer')],
 'Arunachal permits and frontier-sector permissions are separate considerations. Verify before departure.'),
D('meghalaya','Meghalaya Cloud & Living Roots Circuit','India','Meghalaya','nature','eastern-frontier',[4,6,8,10],['meghalaya','shillong cherrapunji','sohra dawki'],'Shillong / Guwahati','Oct-Apr',[
 S('Shillong','market, cafes, music and hill-city orientation'),S('Sohra','waterfalls, caves and cliff landscapes'),S('Nongriat','living-root-bridge trek'),S('Mawsynram','caves, rain country and villages'),S('Dawki','river corridor and border landscapes'),S('Mawlynnong','village, roots and forest walks'),S('Jaintia Hills','quieter cave/waterfall extension'),S('Shillong Buffer','food, craft and weather buffer')],
 'Heavy rain changes cave, waterfall and road safety. Use local guides for technical caves and remote trails.'),
D('hampi-badami','Hampi, Badami & Deccan Ruins','India','Karnataka','heritage','scarlet-pilgrim',[3,5,7,9],['hampi','badami hampi','vijayanagara'],'Hospet / Hubballi','Oct-Feb',[
 S('Hampi Sacred Center','temples, river and bazaar ruins'),S('Hampi Royal Center','palaces, stepwells and elephant stables'),S('Anegundi','village, river and quieter ruins'),S('Badami','rock-cut caves and sandstone town'),S('Pattadakal','temple architecture and world-heritage landscape'),S('Aihole','early temple experimentation and village setting'),S('Hampi Buffer','sunrise/sunset revisit and slow exploration')],
 'Midday heat is intense outside winter. Use early starts and protect fragile heritage surfaces.'),
D('kutch','Great Rann of Kutch & Craft Villages','India','Gujarat','culture','crimson-expedition',[3,5,7,9],['kutch','rann of kutch','bhuj'],'Bhuj','Nov-Feb',[
 S('Bhuj','palaces, museum and food'),S('White Rann','salt desert and sunset'),S('Dhordo - Hodka','craft villages and desert stays'),S('Nirona','artisan traditions and village workshops'),S('Mandvi','coast, palace and shipbuilding heritage'),S('Dholavira','Harappan archaeology and long desert road'),S('Kalo Dungar','high point and salt-landscape views'),S('Bhuj Buffer','craft shopping and departure')],
 'Salt-desert access and festival logistics are seasonal. Long drives need daylight and fuel planning.'),
D('lakshadweep','Lakshadweep Lagoon Escape','India','Lakshadweep','island','eastern-frontier',[4,5,7,9],['lakshadweep','agatti','bangaram'],'Agatti','Oct-May',[
 S('Agatti','lagoon arrival and acclimatization to island pace'),S('Lagoon Day','licensed snorkeling/kayak sector based on sea state'),S('Bangaram Sector','beach, reef and low-impact island time'),S('Thinnakara Sector','sandbar/lagoon excursion when permitted'),S('Dive Day','licensed diving or glass-bottom alternative'),S('Island Culture','local food and community-respectful exploration'),S('Weather Buffer','boat/flight contingency and slow beach day')],
 'Entry permissions and island access rules apply. Marine transfers are weather dependent.'),
]
# INTERNATIONAL - 18
C += [
D('sri-lanka','Sri Lanka Cultural Triangle to South Coast','Sri Lanka','Island-wide','culture','scarlet-pilgrim',[5,7,10,13],['sri lanka','ceylon','colombo kandy ella'],'Colombo','Dec-Apr south/west; seasonal elsewhere',[
 S('Colombo - Negombo','arrival and coastal reset'),S('Sigiriya','rock fortress and village country'),S('Polonnaruwa','ancient-city heritage and reservoirs'),S('Kandy','Temple of the Tooth area and hill-city culture'),S('Nuwara Eliya','tea country and cool highlands'),S('Ella','rail-country scenery and hikes'),S('Yala Sector','wildlife drive when conditions suit'),S('Mirissa - Weligama','south coast and beach pace'),S('Galle','fort city and coast heritage'),S('Bentota','lagoon/coast relaxation'),S('Colombo Buffer','food and departure')],
 'Rail, wildlife and monsoon patterns vary by region; keep transport reservations and weather in view.'),
D('thailand','Thailand Bangkok, North & Islands','Thailand','Multi-region','culture','eastern-frontier',[5,8,11,14],['thailand','bangkok chiang mai','thai islands'],'Bangkok','Nov-Feb generally',[
 S('Bangkok','river, temples, markets and food'),S('Ayutthaya','historic capital day'),S('Chiang Mai','old city, food and temples'),S('Chiang Mai Hills','ethical nature/culture day with vetted operators'),S('Chiang Rai','temples and northern landscapes'),S('Krabi','limestone coast and beach arrival'),S('Island Day','boat day based on marine conditions'),S('Khao Sok','jungle/lake extension'),S('Bangkok Buffer','shopping, food and departure')],
 'Avoid wildlife attractions that rely on harmful animal handling. Marine trips depend on seasonal sea conditions.'),
D('bali','Bali Temples, Volcanoes & Coast','Indonesia','Bali','island','eastern-frontier',[4,6,8,10],['bali','ubud bali','denpasar'],'Denpasar','Apr-Oct',[
 S('Ubud','arts, food, rice-country orientation'),S('Central Bali','water temples and terraced landscapes'),S('Mount Batur Sector','sunrise hike only with suitable conditions/guide'),S('East Bali','temples, water palaces and coastal views'),S('Nusa Sector','boat transfer and dramatic coast'),S('Uluwatu','cliffs, temple and sunset'),S('Seminyak - Canggu','cafes, beach and nightlife'),S('Bali Buffer','spa, food and flexible departure')],
 'Traffic can consume hours. Volcano hikes and boat trips need weather-aware licensed operators.'),
D('vietnam','Vietnam North-to-South Highlights','Vietnam','Multi-region','culture','eastern-frontier',[6,9,12,15],['vietnam','hanoi hoi an saigon','vietnam circuit'],'Hanoi / Ho Chi Minh City','Regional; spring/autumn often easiest',[
 S('Hanoi','old quarter, food and lakes'),S('Ninh Binh','karst landscapes and river sector'),S('Ha Long / Lan Ha','bay cruise sector'),S('Hue','imperial heritage'),S('Hoi An','old town, food and countryside'),S('Da Nang','coast and modern-city reset'),S('Ho Chi Minh City','history, markets and food'),S('Mekong Delta','waterways and local life'),S('Central Highlands Option','slower inland extension'),S('Departure Buffer','shopping and flexible exit')],
 'Domestic transport is efficient but long; avoid stacking flights, trains and tours too tightly.'),
D('japan','Japan Tokyo - Kyoto - Alps','Japan','Honshu','culture','crimson-moon',[5,8,11,14],['japan','tokyo kyoto','japan golden route'],'Tokyo','Mar-May / Oct-Nov',[
 S('Tokyo','neighborhood contrast, food and skyline'),S('Tokyo Culture Day','museum, shrine and old-town sector'),S('Hakone / Fuji Sector','onsen and mountain views when clear'),S('Kanazawa','gardens, old districts and craft'),S('Takayama','mountain town and traditional streets'),S('Kyoto East','temples, lanes and early-morning walking'),S('Kyoto West','Arashiyama and quieter temple choices'),S('Nara','temples and park'),S('Osaka','street food and night energy'),S('Hiroshima - Miyajima','history and island shrine'),S('Tokyo/Osaka Buffer','shopping and departure')],
 'Peak seasons sell out quickly. Use rail strategically rather than assuming one pass is always best value.'),
D('south-korea','South Korea Seoul, Busan & Jeju','South Korea','Multi-region','culture','crimson-moon',[5,7,10,12],['south korea','korea','seoul busan jeju'],'Seoul','Apr-Jun / Sep-Nov',[
 S('Seoul Old & New','palaces, markets and modern districts'),S('Seoul Neighborhoods','design, cafes and river life'),S('Gyeongju','Silla heritage and tomb landscapes'),S('Busan','coast, market and hillside neighborhoods'),S('Jeju','volcanic island arrival and coast'),S('Jeju Nature Day','oreum/trail/waterfall sector'),S('DMZ Option','official tour when operating'),S('Seoul Buffer','shopping, food and departure')],
 'Some tours require passport details and fixed booking. Weather can affect Jeju flights/ferries.'),
D('uae','Dubai & Abu Dhabi Future-Desert Circuit','United Arab Emirates','Dubai & Abu Dhabi','city','crimson-expedition',[3,5,7,9],['dubai','abu dhabi','uae'],'Dubai','Nov-Mar',[
 S('Old Dubai','creek, souks and heritage districts'),S('Downtown Dubai','skyline, architecture and evening'),S('Desert Sector','licensed desert experience and sunset'),S('Abu Dhabi','Grand Mosque area, museums and Corniche'),S('Saadiyat / Yas','culture or theme-park choice'),S('Hatta','mountain/desert contrast'),S('Dubai Buffer','beach, shopping and departure')],
 'Desert heat is serious outside winter. Use licensed operators and respect dress/behavior rules at religious sites.'),
D('turkey','Türkiye Istanbul, Cappadocia & Aegean','Türkiye','Multi-region','culture','scarlet-pilgrim',[6,9,12,15],['turkey','turkiye','istanbul cappadocia'],'Istanbul','Apr-Jun / Sep-Oct',[
 S('Istanbul Historic Core','mosques, palace quarter and bazaars'),S('Bosphorus Istanbul','waterfront neighborhoods and ferry'),S('Cappadocia','valleys, cave architecture and sunset'),S('Cappadocia Dawn','balloon option subject to weather'),S('Ephesus','classical ruins and Aegean transfer'),S('Pamukkale','travertines and archaeology'),S('Antalya','old town and Mediterranean coast'),S('Fethiye','coastal landscapes and optional boat day'),S('Istanbul Buffer','food, shopping and departure')],
 'Balloon flights and boats are weather dependent. Historic sites reward early starts.'),
D('egypt','Egypt Nile & Desert Civilizations','Egypt','Nile Valley','heritage','scarlet-pilgrim',[5,8,11,14],['egypt','cairo luxor','nile egypt'],'Cairo','Oct-Apr',[
 S('Cairo - Giza','pyramids, museum sector and city context'),S('Saqqara','older pyramid complexes and archaeology'),S('Luxor East Bank','temples and Nile evening'),S('Luxor West Bank','tombs and desert-edge monuments'),S('Nile Cruise Sector','river journey toward Aswan'),S('Edfu - Kom Ombo','temple stops along the Nile'),S('Aswan','islands, Nubian culture and river'),S('Abu Simbel','long day/flight option to monumental temples'),S('Red Sea Option','recovery on the coast'),S('Cairo Buffer','food, museum and departure')],
 'Use licensed guides/transport where helpful and protect against heat. Site access and museum locations can change.'),
D('italy','Italy Rome, Florence & Venice','Italy','Multi-region','culture','scarlet-pilgrim',[6,9,12,15],['italy','rome florence venice','italy classic'],'Rome','Apr-Jun / Sep-Oct',[
 S('Rome Ancient Core','Forum/Colosseum sector and neighborhoods'),S('Vatican & Baroque Rome','museum/church sector and evening walk'),S('Florence','Renaissance core and viewpoints'),S('Tuscany','hill-town/wine-country day'),S('Cinque Terre Option','coastal rail and hikes based on conditions'),S('Venice','lagoon city and quieter backstreets'),S('Bologna','food city and arcades'),S('Dolomites Option','mountain extension'),S('Milan','design/architecture and departure option'),S('Rome/Milan Buffer','flexible final day')],
 'Major museums and attractions can require timed entry. Avoid overpacking too many cities into short trips.'),
D('switzerland','Swiss Alps Grand Rail Circuit','Switzerland','Alps','mountain','crimson-moon',[5,7,10,13],['switzerland','swiss alps','zurich interlaken zermatt'],'Zurich','Jun-Sep / Dec-Mar',[
 S('Lucerne','lake, old town and mountain backdrop'),S('Interlaken','lakes and alpine gateway'),S('Lauterbrunnen','waterfalls and valley villages'),S('Jungfrau Region','high-alpine rail/cable-car day as weather permits'),S('Zermatt','car-free village and Matterhorn views'),S('Gornergrat Sector','mountain railway/hiking day'),S('Glacier Express Sector','scenic rail segment'),S('St Moritz','Engadin landscapes'),S('Zurich','old town, lake and departure')],
 'Mountain visibility and cable-car operations are weather dependent. Check point-to-point fares against passes.'),
D('iceland','Iceland Ring Road & Highlands Edge','Iceland','Island-wide','road-trip','crimson-expedition',[5,8,11,14],['iceland','ring road iceland','reykjavik iceland'],'Reykjavik','Jun-Sep for full loop',[
 S('Reykjavik - Golden Circle','geothermal and waterfall landmarks'),S('South Coast','waterfalls, black-sand coast and glacier views'),S('Skaftafell - Jokulsarlon','glacier-country and lagoon'),S('Eastfjords','remote coast and fishing towns'),S('Myvatn','volcanic landscapes and geothermal areas'),S('Akureyri','north Iceland base and fjord atmosphere'),S('Snaefellsnes','peninsula landscapes'),S('Reykjavik','city and geothermal spa option'),S('Highlands Option','only with suitable vehicle/season'),S('Weather Buffer','road/weather contingency')],
 'Wind, road closures and rapidly changing weather are the main planning constraints. Never ignore road advisories.'),
D('greece','Greece Athens, Islands & Meteora','Greece','Mainland & Islands','culture','eastern-frontier',[5,8,11,14],['greece','athens santorini','greek islands'],'Athens','May-Jun / Sep-Oct',[
 S('Athens','Acropolis sector, neighborhoods and food'),S('Meteora','monasteries and rock landscapes'),S('Delphi Option','archaeology and mountain setting'),S('Santorini','caldera villages and sunset'),S('Santorini Slow Day','walks, archaeology or beach'),S('Naxos / Paros','Cycladic island pace'),S('Crete Option','food, coast and archaeology'),S('Athens Buffer','museum, market and departure')],
 'Ferry schedules and winds shape island plans. Avoid connecting a critical flight directly after a long ferry.'),
D('new-zealand','New Zealand South Island Road Expedition','New Zealand','South Island','road-trip','crimson-expedition',[7,10,14,18],['new zealand','south island new zealand','queenstown road trip'],'Christchurch / Queenstown','Nov-Apr',[
 S('Christchurch - Tekapo','lakes, dark sky and alpine transition'),S('Aoraki / Mount Cook','valley walks and glacier views'),S('Wanaka','lake town and hiking options'),S('Queenstown','adventure base and food'),S('Milford Sound','fiord road/cruise sector'),S('Te Anau','lake and Fiordland buffer'),S('West Coast','glacier-country road'),S('Punakaiki','coastal formations and rainforest'),S('Abel Tasman','coast walk/kayak sector'),S('Kaikoura','marine landscapes'),S('Christchurch Buffer','weather and departure')],
 'Driving distances are deceptive. Preserve daylight, weather buffers and rest between major adventure days.'),
D('kenya-tanzania','Kenya & Tanzania Great Migration Safari','Kenya & Tanzania','East Africa','safari','crimson-expedition',[6,9,12,15],['kenya safari','tanzania safari','serengeti masai mara'],'Nairobi / Kilimanjaro','Season depends on migration goals',[
 S('Nairobi / Arusha','arrival and safari briefing'),S('Amboseli','elephants and Kilimanjaro views'),S('Lake Naivasha / Nakuru','rift landscapes and birdlife'),S('Masai Mara','big-game drives and plains'),S('Mara Deep Day','full safari day and conservancy options'),S('Serengeti','cross-border/flight transition and game drives'),S('Serengeti Deep Day','full plains day'),S('Ngorongoro','caldera wildlife and highlands'),S('Tarangire','baobabs and elephants'),S('Zanzibar Option','coastal recovery'),S('Departure Buffer','flight/road buffer')],
 'Migration location varies by month and year. Use reputable operators and avoid crowding wildlife.'),
D('nepal-heritage','Nepal Kathmandu, Pokhara & Chitwan','Nepal','Central Nepal','culture','scarlet-pilgrim',[5,7,9,12],['nepal','kathmandu pokhara','nepal tour'],'Kathmandu','Oct-Nov / Mar-Apr',[
 S('Kathmandu Valley','heritage squares, stupas and neighborhoods'),S('Bhaktapur - Patan','historic-city architecture and craft'),S('Pokhara','lake, mountain views and relaxed pace'),S('Pokhara Nature Day','viewpoint or day hike'),S('Chitwan','wildlife sector and river plains'),S('Chitwan Nature Day','guided park activities'),S('Bandipur','hill town and slower overland stop'),S('Kathmandu Buffer','food, shopping and departure')],
 'Mountain weather can affect domestic flights. Wildlife experiences should follow park rules and ethical distance.'),
D('bhutan','Bhutan Paro, Thimphu & Punakha','Bhutan','Western Bhutan','culture','scarlet-pilgrim',[5,7,9,11],['bhutan','paro thimphu','tiger nest bhutan'],'Paro','Mar-May / Sep-Nov',[
 S('Paro','valley arrival and dzong architecture'),S('Thimphu','capital culture, craft and museums'),S('Dochula - Punakha','pass views and valley descent'),S('Punakha','dzong, rivers and village landscapes'),S('Phobjikha Option','glacial valley and nature'),S('Paro Valley','monasteries and local pace'),S('Tiger’s Nest','iconic hike with conservative pacing'),S('Paro Buffer','weather/rest and departure')],
 'Entry, guide and sustainable-development rules depend on nationality and current policy; verify official requirements.'),
D('maldives','Maldives Atoll Reset','Maldives','Atolls','island','eastern-frontier',[4,5,7,9],['maldives','male maldives','maldives resort'],'Malé','Nov-Apr',[
 S('Malé / Transfer','arrival and resort/local-island transfer'),S('Lagoon Day','snorkeling, swimming and reef etiquette'),S('Ocean Day','licensed dive or marine excursion'),S('Island Culture','local-island visit where appropriate'),S('Sandbank / Sail','weather-dependent water day'),S('Wellness Day','spa, beach and slow travel'),S('Marine Buffer','weather/transfer contingency')],
 'Seaplane/boat transfers are schedule and weather dependent. Follow local-island dress and marine-conservation rules.'),
]
# EXPEDITIONS - 10 (durations intentionally not compressed below common trek lengths)
C += [
D('everest-base-camp','Everest Base Camp Trek','Nepal','Khumbu','trek','crimson-expedition',[12,14,16,18],['everest base camp','ebc','khumbu trek'],'Kathmandu / Lukla','Mar-May / Oct-Nov',[
 S('Lukla - Phakding','trek launch and river valley'),S('Namche Bazaar','major climb into Sherpa hub'),S('Namche Acclimatization','hike high, sleep low and mountain views'),S('Tengboche','monastery ridge and Everest views'),S('Dingboche','higher valley and slower pacing'),S('Dingboche Acclimatization','controlled altitude day'),S('Lobuche','glacier-side approach'),S('Gorak Shep - EBC','base-camp objective and return'),S('Kala Patthar','sunrise viewpoint if conditions/health allow'),S('Pheriche','descent and recovery'),S('Namche Return','longer descent to familiar altitude'),S('Lukla','trek completion and flight buffer'),S('Kathmandu Buffer','weather buffer for Lukla aviation')],
 'Serious altitude itinerary: never remove acclimatization merely to match a short request. Weather can disrupt Lukla flights.'),
D('annapurna-circuit','Annapurna Circuit & Thorong La','Nepal','Annapurna','trek','crimson-expedition',[11,14,17,20],['annapurna circuit','thorong la','annapurna trek'],'Kathmandu / Pokhara','Mar-Apr / Oct-Nov',[
 S('Besisahar - Dharapani','trail access and valley start'),S('Chame','forest and mountain valley'),S('Upper Pisang','dry-side landscapes and acclimatization'),S('Manang','major acclimatization base'),S('Manang Acclimatization','high hike and recovery'),S('Yak Kharka','higher grazing country'),S('Thorong Phedi','pass staging'),S('Thorong La - Muktinath','high-pass crossing and descent'),S('Marpha','apple country and stone village'),S('Tatopani','lower valley and hot-spring sector'),S('Ghorepani','forest climb and ridge villages'),S('Poon Hill','sunrise ridge and descent'),S('Pokhara Buffer','recovery and transport contingency')],
 'Thorong La is a serious high pass. Weather, altitude and local trail advice override a preset schedule.'),
D('kilimanjaro','Kilimanjaro Summit Expedition','Tanzania','Kilimanjaro','trek','crimson-expedition',[7,8,9,10],['kilimanjaro','kili','machame route'],'Moshi / Arusha','Jan-Mar / Jun-Oct',[
 S('Trailhead - Forest Camp','rainforest start and measured pace'),S('Moorland Camp','vegetation transition and steady gain'),S('Lava Tower Acclimatization','climb-high acclimatization day'),S('Barranco','dramatic valley and recovery'),S('Karanga','technical-looking but non-climbing trail sections'),S('Barafu','summit staging and early rest'),S('Uhuru Summit - Descent','night ascent, summit attempt and major descent'),S('Mweka Exit','forest descent and expedition finish'),S('Moshi Recovery','buffer, gear and departure')],
 'Use a licensed operator and a route length that supports acclimatization. Summit success is never guaranteed.'),
D('inca-trail','Inca Trail to Machu Picchu','Peru','Cusco Region','trek','scarlet-pilgrim',[5,6,8,10],['inca trail','machu picchu trek','classic inca trail'],'Cusco','May-Sep',[
 S('Cusco Acclimatization','altitude adjustment and Inca/colonial context'),S('Sacred Valley','ruins, villages and lower-altitude night'),S('Inca Trail Day 1','trail entry and valley walking'),S('Dead Woman’s Pass Sector','hardest climbing day with pacing'),S('Cloud Forest Ruins','high passes, ruins and changing ecology'),S('Sun Gate - Machu Picchu','iconic arrival and citadel sector'),S('Aguas Calientes / Cusco','recovery and rail return'),S('Cusco Buffer','permit/transport/weather contingency')],
 'Classic trail permits are limited and guide rules apply. Acclimatize in Cusco/Sacred Valley before the trek.'),
D('tour-du-mont-blanc','Tour du Mont Blanc','France / Italy / Switzerland','Alps','trek','crimson-moon',[7,9,11,13],['tour du mont blanc','tmb','mont blanc trek'],'Chamonix','Jun-Sep',[
 S('Chamonix - Les Houches','trail launch and valley transition'),S('Les Contamines','alpine meadows and village night'),S('Les Chapieux','higher pass country'),S('Courmayeur','Italian-side mountain town'),S('Val Ferret','big Mont Blanc massif views'),S('La Fouly','Swiss valley and quieter trail'),S('Champex','lake and mountain village'),S('Trient','pass crossing and compact village'),S('Chamonix Return','final high viewpoints and completion'),S('Chamonix Buffer','weather/recovery day')],
 'Hut bookings are competitive and weather changes quickly. Variants should not encourage unsafe rushing over passes.'),
D('patagonia-w','Torres del Paine W Trek','Chile','Patagonia','trek','crimson-expedition',[5,6,8,10],['patagonia w trek','torres del paine','w circuit'],'Puerto Natales','Nov-Mar',[
 S('Puerto Natales - Park','logistics, transfer and first trail sector'),S('Grey Glacier','lake/glacier landscapes'),S('Paine Grande','central staging and weather flexibility'),S('French Valley','long out-and-back mountain day'),S('Los Cuernos','lakeshore and horned peaks'),S('Central Sector','transfer toward tower trail'),S('Base Torres','iconic viewpoint hike'),S('Puerto Natales Buffer','wind/weather contingency and recovery')],
 'Patagonian wind and weather are serious. Reserve camps/refugios and keep a flexible buffer.'),
D('markha-valley','Markha Valley Trek','India','Ladakh','trek','crimson-expedition',[7,8,9,10],['markha valley','markha trek','ladakh trek'],'Leh','Jun-Sep',[
 S('Leh Acclimatization','essential high-altitude preparation'),S('Trailhead - Skiu','river valley and village entry'),S('Markha','village trekking and monastery landscapes'),S('Hankar','higher valley and mountain views'),S('Nimaling','high camp and Kang Yatse backdrop'),S('Kongmaru La','high-pass crossing and descent'),S('Shang Sumdo','trail exit'),S('Leh Buffer','recovery and road/health contingency')],
 'Arrive acclimatized in Leh before starting. High-pass weather and river conditions dictate safe progress.'),
D('kashmir-great-lakes','Kashmir Great Lakes Trek','India','Kashmir','trek','crimson-moon',[7,8,9,10],['kashmir great lakes','kgl trek','great lakes kashmir'],'Srinagar / Sonamarg','Jul-Sep',[
 S('Sonamarg Trailhead','trek start and alpine ascent'),S('Nichnai','meadow camp and pass approach'),S('Vishansar - Kishansar','twin-lake landscapes'),S('Gadsar Pass','high pass and lake chain'),S('Satsar','multiple alpine lakes and meadow camp'),S('Gangbal','big lake beneath Harmukh massif'),S('Naranag','descent and trail finish'),S('Srinagar Buffer','weather/transport contingency')],
 'Season, permits and local security conditions matter. Use a reputable trekking operator and keep a buffer day.'),
D('hampta-pass','Hampta Pass & Chandratal Trek','India','Himachal Pradesh','trek','crimson-expedition',[5,6,7,8],['hampta pass','hampta trek','chandratal trek'],'Manali','Jun-Sep',[
 S('Manali - Jobra','trail approach and forest start'),S('Jwara / Balu ka Ghera','valley ascent and pass staging'),S('Hampta Pass - Shea Goru','pass crossing into Lahaul landscape'),S('Chatru','descent and road pickup'),S('Chandratal Option','lake extension only if road/weather open'),S('Manali Return','high-road return and recovery'),S('Manali Buffer','weather and departure contingency')],
 'Pass and Chandratal access are seasonal. Do not force the lake extension if roads or weather are unsafe.'),
D('chadar-trek','Chadar Frozen River Trek','India','Ladakh / Zanskar','winter-expedition','crimson-moon',[8,9,10,11],['chadar trek','frozen river trek','zanskar chadar'],'Leh','Jan-Feb only when officially open',[
 S('Leh Winter Acclimatization','cold and altitude adaptation'),S('Leh Acclimatization 2','medical/gear checks and contingency'),S('Chilling - River Entry','expedition launch and ice assessment'),S('Shingra Koma Sector','frozen-river travel and camp'),S('Tibb Cave Sector','ice formations and winter canyon'),S('Nerak Sector','waterfall/canyon objective when conditions permit'),S('Return Chadar','reverse route with dynamic ice'),S('Chilling Exit','road pickup and expedition finish'),S('Leh Buffer','weather/road contingency and recovery')],
 'Extreme cold and unstable ice make this a specialist guided expedition. Official opening and on-ground ice assessment are mandatory.'),
]

assert len(C)==48, len(C)

THEME_META={
 'crimson-moon': {'label':'Crimson Moon','accent':'#ff2d36','accent2':'#7bc7ff','tag':'HIGH ALTITUDE // NIGHT SKY // SHINOBI ROAD'},
 'scarlet-pilgrim': {'label':'Scarlet Pilgrim','accent':'#ff3434','accent2':'#ffb45d','tag':'PILGRIMAGE // HERITAGE // SCARLET SCROLL'},
 'eastern-frontier': {'label':'Eastern Frontier','accent':'#ff3545','accent2':'#53dfb5','tag':'FOREST // WATER // FRONTIER DOSSIER'},
 'crimson-expedition': {'label':'Crimson Expedition','accent':'#ff3045','accent2':'#ffc857','tag':'EXPEDITION // ROAD // FIELD INTEL'},
}

# Build days from canonical stops while keeping contiguous route progression.
def build_days(dest, n):
    stops=dest['stops']
    m=len(stops)
    if n <= m:
        groups=[]
        for i in range(n):
            a=round(i*m/n); b=round((i+1)*m/n)
            if b<=a: b=a+1
            groups.append(stops[a:min(b,m)])
    else:
        groups=[[s] for s in stops]
        while len(groups)<n:
            # insert smart buffer/explore days before final segment
            idx=max(1,len(groups)-1)
            base=groups[idx-1][-1]
            groups.insert(idx,[{'name':base['name']+' Slow / Buffer','focus':'slower neighborhood exploration, rest, weather buffer and spontaneous local discoveries'}])
    days=[]
    for i,g in enumerate(groups,1):
        names=' → '.join(x['name'] for x in g)
        focus='; '.join(x['focus'] for x in g)
        first=g[0]['name']; last=g[-1]['name']
        if i==1:
            morning=f"Arrive or begin from {dest['gateway']}. Keep the first movements simple and establish the route rhythm toward {first}."
        else:
            morning=f"Start early enough for a relaxed transition toward {first}. Keep transport flexible and protect daylight for the best landscapes or heritage stops."
        afternoon=f"Focus on {focus}. Prioritize one or two strong experiences rather than racing through a checklist."
        evening=f"Settle around {last}; choose a local meal, short sunset/market walk, then review the next day's weather, transport and opening conditions."
        intel=dest['notes']
        days.append({'num':i,'title':names,'morning':morning,'afternoon':afternoon,'evening':evening,'intel':intel})
    return days

CSS=r'''
:root{--accent:#ff3045;--accent2:#ffc857;--ink:#050507;--panel:rgba(17,17,22,.84);--text:#f7f4f0;--muted:#aaa6a3}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#050507;color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px);background-size:46px 46px;z-index:20;mask-image:linear-gradient(#000,transparent 90%)}
.progress{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,var(--accent),var(--accent2));z-index:90;box-shadow:0 0 18px var(--accent)}
.hero{min-height:92vh;position:relative;display:flex;align-items:flex-end;padding:8vh 7vw;overflow:hidden;background:radial-gradient(circle at 77% 18%,color-mix(in srgb,var(--accent) 28%,transparent) 0 8%,transparent 9%),radial-gradient(circle at 77% 18%,color-mix(in srgb,var(--accent) 12%,transparent) 0 20%,transparent 36%),linear-gradient(180deg,#09090d,#121219 54%,#050507)}
.hero:after{content:"";position:absolute;left:-5%;right:-5%;bottom:-5%;height:45%;background:#0b0b0f;clip-path:polygon(0 100%,0 78%,9% 56%,17% 73%,28% 38%,37% 70%,48% 48%,58% 76%,70% 31%,80% 69%,91% 44%,100% 66%,100% 100%);opacity:.86}
.moon{position:absolute;right:8vw;top:5vh;width:min(34vw,470px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,var(--accent2) 0 3%,var(--accent) 29%,#6c0615 68%,#18040a 73%);box-shadow:0 0 48px color-mix(in srgb,var(--accent) 70%,transparent),0 0 150px color-mix(in srgb,var(--accent) 30%,transparent);opacity:.85;animation:breathe 7s ease-in-out infinite}
@keyframes breathe{50%{transform:scale(1.035)}}.hero-inner{position:relative;z-index:3;max-width:1050px}.kicker{font-size:11px;letter-spacing:.28em;color:var(--accent2);text-transform:uppercase;margin-bottom:18px}.hero h1{font-size:clamp(48px,8vw,112px);line-height:.86;letter-spacing:-.055em;text-transform:uppercase;margin:0;text-shadow:0 10px 50px #000}.hero h1 span{color:var(--accent)}.sub{font-size:clamp(15px,2vw,22px);letter-spacing:.08em;color:#ddd6d2;max-width:920px;line-height:1.5}.hero-line{height:2px;width:min(520px,70vw);background:linear-gradient(90deg,var(--accent),transparent);box-shadow:0 0 16px var(--accent);margin:26px 0}
.toolbar{display:flex;gap:9px;flex-wrap:wrap;margin-top:22px}.toolbar button,.toolbar a{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.055);color:#fff;border-radius:999px;padding:9px 13px;text-decoration:none;font:inherit;font-size:12px;cursor:pointer}.toolbar button:hover,.toolbar a:hover{border-color:var(--accent)}
.section{position:relative;z-index:3;padding:78px 7vw}.section h2{font-size:clamp(34px,5vw,68px);margin:0 0 12px;letter-spacing:-.04em;text-transform:uppercase}.section h2 em{font-style:normal;color:var(--accent)}.lead{max-width:900px;color:var(--muted);line-height:1.72}.glass{background:linear-gradient(145deg,rgba(21,21,27,.94),rgba(8,8,12,.78));border:1px solid rgba(255,255,255,.11);box-shadow:0 25px 80px rgba(0,0,0,.44);backdrop-filter:blur(14px)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stat{padding:20px;border-radius:18px}.stat b{display:block;font-size:10px;letter-spacing:.19em;text-transform:uppercase;color:var(--accent2);margin-bottom:8px}.stat span{font-weight:800;font-size:18px}
.route{padding:24px;border-radius:28px;overflow:hidden}.route svg{width:100%;height:auto;min-height:350px}.route .ghost{fill:none;stroke:#fff;stroke-opacity:.07;stroke-width:38;stroke-linecap:round}.route .line{fill:none;stroke:var(--accent);stroke-width:6;stroke-linecap:round;stroke-dasharray:12 12;animation:dash 14s linear infinite;filter:drop-shadow(0 0 8px var(--accent))}@keyframes dash{to{stroke-dashoffset:-360}}.route circle{fill:#08080b;stroke:var(--accent);stroke-width:4}.route text{fill:#fff;font-size:14px;font-weight:800;paint-order:stroke;stroke:#050507;stroke-width:4px}.shinobi{font-size:26px;filter:drop-shadow(0 0 8px var(--accent))}
.timeline{display:grid;gap:22px}.day{display:grid;grid-template-columns:92px 1fr;border-radius:22px;overflow:hidden;opacity:0;transform:translateY(22px);transition:.65s ease}.day.show{opacity:1;transform:none}.day-no{background:linear-gradient(180deg,var(--accent),#4f050c);display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:950;position:relative}.day-no:before{content:"DAY";position:absolute;top:16px;font-size:9px;letter-spacing:.22em}.day-body{padding:25px 28px}.day h3{font-size:24px;margin:0 0 12px}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}.chip{font-size:11px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);border-radius:999px;padding:7px 9px;color:#d7d2ce}.phases{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.phase{border-left:2px solid color-mix(in srgb,var(--accent) 62%,transparent);padding-left:13px;color:#c5c0bd;font-size:13px;line-height:1.62}.phase b{display:block;color:#fff;font-size:10px;letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px}.intel{margin-top:15px;border-radius:12px;padding:13px 15px;background:color-mix(in srgb,var(--accent) 8%,transparent);border:1px solid color-mix(in srgb,var(--accent) 23%,transparent);font-size:12px;color:#dfd5d2;line-height:1.55}.intel b{color:var(--accent2);letter-spacing:.13em;text-transform:uppercase;font-size:10px}.footer{padding:40px 7vw 70px;color:#7f7b78;font-size:11px;line-height:1.65;border-top:1px solid rgba(255,255,255,.07)}
.theme-crimson-moon{--accent:#ff2d36;--accent2:#78c8ff}.theme-scarlet-pilgrim{--accent:#ff3434;--accent2:#ffb45d}.theme-eastern-frontier{--accent:#ff3545;--accent2:#54deb4}.theme-crimson-expedition{--accent:#ff3045;--accent2:#ffc857}
@media(max-width:820px){.stats{grid-template-columns:1fr 1fr}.phases{grid-template-columns:1fr}.day{grid-template-columns:70px 1fr}.section{padding:60px 5vw}.hero{padding:8vh 5vw}.moon{right:-10vw;width:64vw}.route svg{min-height:300px}}
@media(max-width:520px){.stats{grid-template-columns:1fr}.day{grid-template-columns:1fr}.day-no{height:74px}.day-no:before{top:9px}.hero h1{font-size:48px}.section{padding-top:50px}}
@media print{body{background:#08080a!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.progress,.toolbar{display:none!important}.hero{min-height:260mm;page-break-after:always}.moon{animation:none}.section{padding:15mm 11mm}.route{page-break-after:always}.day{opacity:1;transform:none;page-break-inside:avoid;margin-bottom:6mm}.phases{gap:8px}.phase{font-size:10px}.day-body{padding:16px 18px}.day h3{font-size:18px}.intel{font-size:9px}.footer{padding:10mm 11mm}}
'''
(OUT/'assets'/'preset-library.css').write_text(CSS,encoding='utf-8')

RUNTIME=r'''
(()=>{const p=document.querySelector('.progress');if(p)addEventListener('scroll',()=>{const d=document.documentElement;p.style.width=((d.scrollTop/Math.max(1,d.scrollHeight-d.clientHeight))*100)+'%'});const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('show')),{threshold:.08});document.querySelectorAll('.day').forEach(x=>io.observe(x));const qs=new URLSearchParams(location.search),theme=qs.get('theme');if(theme&&['crimson-moon','scarlet-pilgrim','eastern-frontier','crimson-expedition'].includes(theme)){document.body.className='theme-'+theme}document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{document.body.className='theme-'+b.dataset.theme});})();
'''
(OUT/'assets'/'preset-runtime.js').write_text(RUNTIME,encoding='utf-8')

# SVG route with labels. Coordinates zigzag vertically.
def route_svg(stops):
    n=min(len(stops),10); shown=stops[:n]
    W,H=1000,max(360,110*n)
    pts=[]
    for i,s in enumerate(shown):
        x=140 if i%2==0 else 820
        y=80+i*((H-160)/max(1,n-1))
        pts.append((x,y,s['name']))
    if len(pts)==1: pts.append((820,260,'Explore'))
    d='M '+ ' L '.join(f'{x:.0f},{y:.0f}' for x,y,_ in pts)
    labels=[]
    for i,(x,y,name) in enumerate(pts):
        tx=x+24 if x<500 else x-24; anchor='start' if x<500 else 'end'
        labels.append(f'<circle cx="{x}" cy="{y}" r="8"/><text x="{tx}" y="{y+5}" text-anchor="{anchor}">{html.escape(name[:34])}</text>')
    return f'''<svg viewBox="0 0 {W} {H}" role="img" aria-label="Route overview"><path class="ghost" d="{d}"/><path id="missionPath" class="line" d="{d}"/>{''.join(labels)}<text class="shinobi"><textPath href="#missionPath" startOffset="2%">🥷<animate attributeName="startOffset" from="2%" to="96%" dur="18s" repeatCount="indefinite"/></textPath></text></svg>'''

def html_doc(dest,var_key,n,days):
    t=THEME_META[dest['theme']]
    aliases=', '.join(dest['aliases'][:4])
    chips=f"{dest['country']} // {dest['region']} // {dest['category'].upper()}"
    daycards=[]
    for d in days:
        daycards.append(f'''<article class="day glass"><div class="day-no">{d['num']:02d}</div><div class="day-body"><h3>{html.escape(d['title'])}</h3><div class="chips"><span class="chip">DAY {d['num']}</span><span class="chip">{html.escape(dest['region'])}</span><span class="chip">{html.escape(VARIANTS[var_key]['label'])}</span></div><div class="phases"><div class="phase"><b>Morning</b>{html.escape(d['morning'])}</div><div class="phase"><b>Afternoon</b>{html.escape(d['afternoon'])}</div><div class="phase"><b>Evening</b>{html.escape(d['evening'])}</div></div><div class="intel"><b>Field intel</b> {html.escape(d['intel'])}</div></div></article>''')
    return f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(dest['name'])} - {VARIANTS[var_key]['label']} | RoamWise</title><link rel="stylesheet" href="../../assets/preset-library.css"></head><body class="theme-{dest['theme']}"><div class="progress"></div><header class="hero"><div class="moon"></div><div class="hero-inner"><div class="kicker">ROAMWISE PRESET // {html.escape(t['tag'])}</div><h1>{html.escape(dest['name'])}: <span>{VARIANTS[var_key]['label']}</span></h1><p class="sub">{n} DAYS // {html.escape(chips)}</p><div class="hero-line"></div><p class="sub" style="font-size:15px;letter-spacing:.025em;color:#aaa">{html.escape(VARIANTS[var_key]['desc'])}</p><div class="toolbar"><button data-theme="crimson-moon">Crimson Moon</button><button data-theme="scarlet-pilgrim">Scarlet Pilgrim</button><button data-theme="eastern-frontier">Eastern Frontier</button><button data-theme="crimson-expedition">Crimson Expedition</button><a href="{var_key}.pdf">PDF</a></div></div></header><main id="preset-content"><section class="section"><h2>Mission <em>Profile</em></h2><p class="lead">Pre-generated RoamWise fallback itinerary for instant loading when the traveller has not requested highly specific constraints. It is deliberately route-first and can be replaced by live planning whenever dates, exact budget, mobility, weather, crowd, permit or booking constraints matter.</p><div class="stats"><div class="stat glass"><b>Preset</b><span>{VARIANTS[var_key]['label']}</span></div><div class="stat glass"><b>Duration</b><span>{n} days</span></div><div class="stat glass"><b>Gateway</b><span>{html.escape(dest['gateway'])}</span></div><div class="stat glass"><b>Best window</b><span>{html.escape(dest['season'])}</span></div></div></section><section class="section"><h2>Animated <em>Route</em></h2><p class="lead">The shinobi marker travels through the cached route. Exact transport, weather, road and permit conditions should still be refreshed at runtime.</p><div class="route glass">{route_svg(dest['stops'])}</div></section><section class="section"><h2>Day-by-day <em>Scroll</em></h2><div class="timeline">{''.join(daycards)}</div></section><section class="section"><h2>Preset <em>Rules</em></h2><div class="glass" style="padding:24px;border-radius:20px"><p class="lead" style="margin:0"><b>Aliases:</b> {html.escape(aliases)}<br><b>Operational note:</b> {html.escape(dest['notes'])}<br><br>Use this cached itinerary for broad destination requests. If the user specifies a month, exact budget, accessibility need, crowd constraint, fixed hotel, transport restriction, permit-sensitive activity or unusual duration, RoamWise should fall back to the live planner and treat this preset only as a starting scaffold.</p></div></section></main><footer class="footer">ROAMWISE CINEMATIC PRESET LIBRARY // Generated fallback content, not a guarantee of access, weather, permits, safety, pricing or availability. Verify time-sensitive conditions before travel.</footer><script src="../../assets/preset-runtime.js"></script></body></html>'''

# PDF drawing helpers
PAGE_W,PAGE_H=A4
M=34

def wrap_text(text,font,size,maxw):
    words=text.split(); lines=[]; cur=''
    for w in words:
        cand=(cur+' '+w).strip()
        if stringWidth(cand,font,size)<=maxw: cur=cand
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines

def pdf_text(c,text,x,y,maxw,font='Helvetica',size=10,leading=13,color=HexColor('#d4cfcb'),max_lines=None):
    c.setFont(font,size); c.setFillColor(color)
    lines=wrap_text(text,font,size,maxw)
    if max_lines: lines=lines[:max_lines]
    for ln in lines:
        c.drawString(x,y,ln); y-=leading
    return y

def pdf_bg(c,accent,accent2):
    c.setFillColor(HexColor('#070709')); c.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0)
    c.setFillColor(HexColor('#101016')); c.rect(0,PAGE_H*0.48,PAGE_W,PAGE_H*0.52,fill=1,stroke=0)
    c.setFillColor(Color(*tuple(v/255 for v in (90,5,15)),alpha=1)); c.circle(PAGE_W-105,PAGE_H-110,72,fill=1,stroke=0)
    c.setFillColor(HexColor(accent)); c.circle(PAGE_W-105,PAGE_H-110,61,fill=1,stroke=0)
    c.setFillColor(HexColor(accent2)); c.circle(PAGE_W-105,PAGE_H-110,13,fill=1,stroke=0)

def make_pdf(path,dest,var_key,n,days):
    t=THEME_META[dest['theme']]; accent=t['accent']; accent2=t['accent2']
    c=canvas.Canvas(str(path),pagesize=A4)
    # cover
    pdf_bg(c,accent,accent2)
    c.setFillColor(HexColor(accent2)); c.setFont('Helvetica-Bold',8); c.drawString(M,PAGE_H-70,'ROAMWISE PRESET // '+t['tag'])
    c.setFillColor(HexColor('#ffffff')); c.setFont('Helvetica-Bold',34)
    title_lines=wrap_text(dest['name'].upper(),'Helvetica-Bold',34,PAGE_W-2*M)
    y=PAGE_H-190
    for ln in title_lines[:3]: c.drawString(M,y,ln); y-=39
    c.setFillColor(HexColor(accent)); c.setFont('Helvetica-Bold',26); c.drawString(M,y-8,VARIANTS[var_key]['label'].upper()); y-=55
    c.setStrokeColor(HexColor(accent)); c.setLineWidth(2); c.line(M,y,PAGE_W-170,y)
    c.setFillColor(HexColor('#ddd8d3')); c.setFont('Helvetica-Bold',12); c.drawString(M,y-32,f'{n} DAYS // {dest["country"]} // {dest["region"]}')
    c.setFillColor(HexColor('#aaa5a1')); c.setFont('Helvetica',10); y2=y-60
    y2=pdf_text(c,VARIANTS[var_key]['desc'],M,y2,PAGE_W-2*M,size=10,leading=14,color=HexColor('#aaa5a1'))
    c.setFillColor(HexColor('#88837f')); c.setFont('Helvetica',9); c.drawString(M,54,'Cached cinematic itinerary - time-sensitive details must be refreshed before travel.')
    c.showPage()
    # profile + route
    c.setFillColor(HexColor('#08080b')); c.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0)
    c.setFillColor(HexColor(accent)); c.setFont('Helvetica-Bold',24); c.drawString(M,PAGE_H-55,'MISSION PROFILE')
    c.setFillColor(HexColor('#eeeae6')); c.setFont('Helvetica-Bold',11)
    profile=[('Preset',VARIANTS[var_key]['label']),('Duration',f'{n} days'),('Gateway',dest['gateway']),('Best window',dest['season'])]
    y=PAGE_H-90
    for k,v in profile:
        c.setFillColor(HexColor('#16161c')); c.roundRect(M,y-32,PAGE_W-2*M,30,7,fill=1,stroke=0)
        c.setFillColor(HexColor(accent2)); c.setFont('Helvetica-Bold',8); c.drawString(M+12,y-15,k.upper())
        c.setFillColor(HexColor('#ffffff')); c.setFont('Helvetica-Bold',10); c.drawRightString(PAGE_W-M-12,y-15,str(v)[:55]); y-=39
    y-=10
    c.setFillColor(HexColor(accent)); c.setFont('Helvetica-Bold',18); c.drawString(M,y,'ROUTE SCROLL'); y-=28
    names=[s['name'] for s in dest['stops'][:10]]
    for i,name in enumerate(names):
        if y<70: c.showPage(); c.setFillColor(HexColor('#08080b')); c.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0); y=PAGE_H-55
        c.setStrokeColor(HexColor(accent)); c.setLineWidth(2)
        if i<len(names)-1: c.line(M+12,y-4,M+12,y-30)
        c.setFillColor(HexColor(accent)); c.circle(M+12,y,5,fill=1,stroke=0)
        c.setFillColor(HexColor('#f2eeea')); c.setFont('Helvetica-Bold',10); c.drawString(M+28,y-4,name[:65]); y-=31
    c.setFillColor(HexColor('#8f8a87')); c.setFont('Helvetica',8); c.drawString(M,35,'Route order is a cached scaffold. Live conditions take priority.')
    c.showPage()
    # day pages
    for d in days:
        c.setFillColor(HexColor('#08080b')); c.rect(0,0,PAGE_W,PAGE_H,fill=1,stroke=0)
        c.setFillColor(HexColor(accent)); c.roundRect(M,PAGE_H-110,68,68,10,fill=1,stroke=0)
        c.setFillColor(HexColor('#ffffff')); c.setFont('Helvetica-Bold',8); c.drawCentredString(M+34,PAGE_H-66,'DAY')
        c.setFont('Helvetica-Bold',24); c.drawCentredString(M+34,PAGE_H-91,f'{d["num"]:02d}')
        c.setFillColor(HexColor('#ffffff')); c.setFont('Helvetica-Bold',18)
        title=wrap_text(d['title'],'Helvetica-Bold',18,PAGE_W-M-125)
        ty=PAGE_H-62
        for ln in title[:2]: c.drawString(M+86,ty,ln); ty-=22
        y=PAGE_H-145
        for label,txt in [('MORNING',d['morning']),('AFTERNOON',d['afternoon']),('EVENING',d['evening'])]:
            c.setFillColor(HexColor('#17171d')); c.roundRect(M,y-112,PAGE_W-2*M,103,10,fill=1,stroke=0)
            c.setFillColor(HexColor(accent2)); c.setFont('Helvetica-Bold',8); c.drawString(M+13,y-28,label)
            pdf_text(c,txt,M+13,y-47,PAGE_W-2*M-26,size=10,leading=14,color=HexColor('#d3ceca'),max_lines=4)
            y-=123
        c.setFillColor(HexColor('#171018')); c.roundRect(M,y-110,PAGE_W-2*M,101,10,fill=1,stroke=0)
        c.setFillColor(HexColor(accent)); c.setFont('Helvetica-Bold',8); c.drawString(M+13,y-28,'FIELD INTEL')
        pdf_text(c,d['intel'],M+13,y-47,PAGE_W-2*M-26,size=9.4,leading=13,color=HexColor('#e0d5d2'),max_lines=5)
        c.setFillColor(HexColor('#77726f')); c.setFont('Helvetica',7.5); c.drawRightString(PAGE_W-M,25,f'{dest["name"]} / {VARIANTS[var_key]["label"]} / RoamWise preset')
        c.showPage()
    c.save()

manifest={'version':'1.0.0','generated':'2026-08-29','purpose':'RoamWise cached cinematic itinerary fallbacks','themes':THEME_META,'variants':VARIANTS,'destinations':[]}
for dest in C:
    dd={'slug':dest['slug'],'name':dest['name'],'country':dest['country'],'region':dest['region'],'category':dest['category'],'theme':dest['theme'],'aliases':dest['aliases'],'gateway':dest['gateway'],'season':dest['season'],'notes':dest['notes'],'variants':{}}
    ddir=OUT/'presets'/dest['slug']; ddir.mkdir()
    for idx,(var_key,meta) in enumerate(VARIANTS.items()):
        n=dest['days'][idx]
        days=build_days(dest,n)
        hp=ddir/f'{var_key}.html'; pp=ddir/f'{var_key}.pdf'
        hp.write_text(html_doc(dest,var_key,n,days),encoding='utf-8')
        make_pdf(pp,dest,var_key,n,days)
        dd['variants'][var_key]={'days':n,'html':f'presets/{dest["slug"]}/{var_key}.html','pdf':f'presets/{dest["slug"]}/{var_key}.pdf'}
    manifest['destinations'].append(dd)

(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
(OUT/'data'/'destinations.json').write_text(json.dumps(C,indent=2,ensure_ascii=False),encoding='utf-8')

LOADER=r'''
/* RoamWise Preset Library Loader v1.0.0
   Cached fallback only: return null when the request contains specific planning constraints.
*/
(()=>{
  const ROOT=(document.currentScript?.src||'').replace(/preset-loader\.js(?:\?.*)?$/,'');
  let manifestPromise;
  const norm=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
  async function manifest(){return manifestPromise||(manifestPromise=fetch(ROOT+'manifest.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('preset manifest '+r.status);return r.json()}));}
  function specific(o={}){
    const style=norm(o.style), crowd=norm(o.crowd), month=norm(o.month), budget=String(o.budgetExact||o.exactBudget||'').trim();
    const tags=Array.isArray(o.tags)?o.tags.filter(Boolean):[];
    const mobility=norm(o.accessibility||o.mobility), hotel=norm(o.hotel||o.fixedHotel), transport=norm(o.transportRestriction);
    return !!(month||budget||mobility||hotel||transport||tags.length|| (crowd&& !['any','normal','default'].includes(crowd)) || (style&& !['','balanced','classic','default'].includes(style)));
  }
  function score(d,q){const n=norm(q); if(!n)return 0; let s=0; if(norm(d.name)===n)s+=100; if(norm(d.slug)===n)s+=100; if(norm(d.name).includes(n)||n.includes(norm(d.name)))s+=55; for(const a of d.aliases||[]){const x=norm(a);if(x===n)s+=90;else if(x.includes(n)||n.includes(x))s+=45;} if(norm(d.region).includes(n))s+=20; return s;}
  function nearestVariant(d,days){const entries=Object.entries(d.variants); if(!days)return d.variants.signature?['signature',d.variants.signature]:entries[0]; let best=entries[0],gap=Infinity; for(const e of entries){const g=Math.abs(Number(e[1].days)-Number(days));if(g<gap){gap=g;best=e}}return best;}
  async function find(o={}){
    if(!o.forcePreset && specific(o))return null;
    const m=await manifest(), ranked=m.destinations.map(d=>[score(d,o.destination||o.query),d]).sort((a,b)=>b[0]-a[0]);
    if(!ranked.length||ranked[0][0]<20)return null;
    const d=ranked[0][1], [variant,v]=nearestVariant(d,o.duration||o.days);
    return {...d,variant,days:v.days,html:ROOT+v.html,pdf:ROOT+v.pdf,matchScore:ranked[0][0]};
  }
  function renderInto(target,hit){const el=typeof target==='string'?document.querySelector(target):target;if(!el||!hit)return false;el.innerHTML='';const f=document.createElement('iframe');f.src=hit.html;f.title=hit.name+' itinerary';f.loading='eager';f.style.cssText='width:100%;min-height:86vh;border:0;border-radius:18px;background:#050507';f.setAttribute('allow','fullscreen');el.appendChild(f);return true;}
  async function tryRender(target,o){const h=await find(o);if(!h)return null;renderInto(target,h);return h;}
  window.RW_PRESETS={manifest,find,specific,renderInto,tryRender,root:ROOT};
})();
'''
(OUT/'preset-loader.js').write_text(LOADER,encoding='utf-8')

# Library browser index
cards=[]
for d in manifest['destinations']:
    links=' '.join(f'<a href="{v[1]["html"]}">{VARIANTS[v[0]]["label"]} {v[1]["days"]}d</a>' for v in d['variants'].items())
    cards.append(f'<article><b>{html.escape(d["name"])}</b><span>{html.escape(d["country"])} · {html.escape(d["region"])} · {html.escape(d["category"])}</span><div>{links}</div></article>')
INDEX=f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RoamWise Preset Itinerary Library</title><style>body{{margin:0;background:#070709;color:#f6f3ef;font-family:system-ui;padding:38px}}h1{{font-size:clamp(40px,7vw,82px);margin:0 0 8px;letter-spacing:-.05em}}p{{color:#aaa;max-width:850px;line-height:1.6}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:30px}}article{{background:#111117;border:1px solid #282832;border-radius:18px;padding:18px}}article b{{display:block;font-size:18px;margin-bottom:8px}}article span{{display:block;color:#8e8b88;font-size:12px;margin-bottom:14px}}a{{display:inline-block;color:#fff;text-decoration:none;border:1px solid #383842;border-radius:999px;padding:7px 9px;margin:3px;font-size:11px}}a:hover{{border-color:#ff3045;color:#ff6c78}}.n{{color:#ff4557}}</style></head><body><div class="n">ROAMWISE // OFFLINE-FIRST CACHE</div><h1>Preset Itinerary Library</h1><p>{len(C)} destinations and expeditions × 4 trip depths = <b>{len(C)*4} HTML itineraries + {len(C)*4} PDFs</b>. Use these for instant broad requests; defer to the live planner whenever the user supplies meaningful constraints.</p><div class="grid">{''.join(cards)}</div></body></html>'''
(OUT/'index.html').write_text(INDEX,encoding='utf-8')

README=f'''# RoamWise Preset Itinerary Library v1.0.0

This folder is a pre-generated fallback cache for the RoamWise cinematic itinerary engine.

## What is included

- **{len(C)} important destinations / expeditions**
- **4 ready-made trip depths per destination**: Essential, Signature, Deep Dive, Expedition
- **{len(C)*4} HTML files + {len(C)*4} PDF files**
- Four cinematic theme families: `crimson-moon`, `scarlet-pilgrim`, `eastern-frontier`, `crimson-expedition`
- `manifest.json` with aliases, durations and file paths
- `preset-loader.js` for zero-API matching and instant loading
- `index.html` to browse every preset
- `data/destinations.json` source catalog

## Intended decision rule

Use a cached preset when a user asks broadly, for example:

- "Plan Ladakh"
- "5 days in Goa"
- "Tawang itinerary"
- "Everest Base Camp itinerary"

Do **not** silently force a preset when the user gives meaningful constraints such as a specific month, exact budget, accessibility need, crowd-avoidance requirement, fixed hotel, unusual transport rule, permit-sensitive requirement, or custom style/tags. In that case, keep the existing live planner and optionally use the preset only as a scaffold.

`preset-loader.js` already implements this conservative rule.

## Integration

Add once near the existing premium itinerary scripts:

```html
<script src="itinerary-library/preset-loader.js" defer></script>
```

Before a broad live-generation call, ask the library for a hit:

```js
const hit = await window.RW_PRESETS?.find({{
  destination: document.querySelector('#destInput')?.value,
  duration: Number(document.querySelector('#dur')?.value || 0),
  month: document.querySelector('#month')?.value,
  style: document.querySelector('#style')?.value,
  crowd: document.querySelector('#crowd')?.value,
  budgetExact: document.querySelector('#budgetExact')?.value,
  tags: window.currentPlannerTags || []
}});

if (hit) {{
  window.RW_PRESETS.renderInto('#results', hit);
  return; // skip expensive generation for this broad request
}}
```

For an explicit user action such as "Load ready-made itinerary", call with `forcePreset:true`.

```js
const hit = await RW_PRESETS.find({{ destination:'Ladakh', duration:6, forcePreset:true }});
RW_PRESETS.renderInto('#results', hit);
```

Each HTML also supports a theme override:

```
presets/ladakh/signature.html?theme=eastern-frontier
```

## Folder placement

Recommended repository path:

```
/itinerary-library/
  manifest.json
  preset-loader.js
  index.html
  assets/
  data/
  presets/
```

No database, Firestore, worker or API is needed to serve the cache. GitHub Pages / static hosting can serve it directly.

## Safety / freshness

These are fallback route designs, not live operational guarantees. Weather, road status, permits, park openings, border/frontier access, transport, pricing and availability must be refreshed when relevant. Expedition presets deliberately keep conservative durations instead of shortening high-altitude routes to an unsafe number of days.
'''
(OUT/'README.md').write_text(README,encoding='utf-8')

# Add a tiny Claude Code handoff prompt.
(OUT/'CLAUDE-CODE-MERGE-NOTES.md').write_text('''# Claude Code merge notes\n\n1. Copy this whole folder to `/itinerary-library/`.\n2. Add `<script src="itinerary-library/preset-loader.js" defer></script>` after the current planner/premium scripts.\n3. In the itinerary generation handler, call `RW_PRESETS.find(...)` before any expensive generation.\n4. If a hit is returned, `RW_PRESETS.renderInto("#results", hit)` and stop. If null, leave the existing planner path unchanged.\n5. Add a small **Ready-made / Live** label in the premium result UI so the user always knows which source produced the itinerary.\n6. Do not replace the existing Classic result renderer or premium cinematic engine; this library is an additive cache.\n7. Run the existing smoke tests plus: broad Ladakh -> preset; Ladakh + exact September/₹40k/Avoid crowds -> live planner; EBC -> no unsafe short preset; unknown destination -> live planner.\n''',encoding='utf-8')

# Copy build script into package for reproducibility.
shutil.copy('/mnt/data/build_roamwise_library.py', OUT/'scripts'/'build_presets.py')

# checks
files=list(OUT.rglob('*'))
htmls=[p for p in files if p.suffix=='.html' and 'presets' in p.parts]
pdfs=[p for p in files if p.suffix=='.pdf']
assert len(htmls)==len(C)*4, (len(htmls),len(C)*4)
assert len(pdfs)==len(C)*4

# zip
zip_path=Path('/mnt/data/roamwise-itinerary-library-v1.0.0.zip')
if zip_path.exists(): zip_path.unlink()
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
    for p in OUT.rglob('*'):
        if p.is_file(): z.write(p,p.relative_to(OUT.parent))

print(json.dumps({'destinations':len(C),'variants_each':4,'preset_html':len(htmls),'pdfs':len(pdfs),'zip':str(zip_path),'zip_mb':round(zip_path.stat().st_size/1024/1024,2)},indent=2))
