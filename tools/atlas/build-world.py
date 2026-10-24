#!/usr/bin/env python3
"""Builds data/atlas/world-countries.json from GeoNames (CC-BY 4.0) via the
MIT-licensed geonamescache package. Run: pip install geonamescache; python3 tools/atlas/build-world.py"""
import json, geonamescache as g
gc = g.GeonamesCache()
CONT = {'AF':'Africa','AS':'Asia','EU':'Europe','NA':'North America','SA':'South America','OC':'Oceania','AN':'Antarctica'}
# Common alternative names travellers actually type (curated, hand-reviewed).
ALIAS = {
 'US':['usa','u.s.a','united states of america','america','us'],'GB':['uk','u.k','england','britain','great britain','scotland','wales'],
 'AE':['uae','dubai','abu dhabi','emirates'],'CZ':['czechia','czech republic'],'MM':['burma','myanmar'],'TR':['turkey','turkiye','türkiye'],
 'NL':['holland','the netherlands'],'KR':['south korea','korea'],'KP':['north korea'],'RU':['russian federation'],'VN':['viet nam'],
 'LA':['laos','lao pdr'],'CI':['ivory coast',"cote d'ivoire"],'SZ':['eswatini','swaziland'],'MK':['north macedonia','macedonia'],
 'CV':['cape verde','cabo verde'],'TL':['east timor','timor leste'],'CD':['drc','dr congo','congo kinshasa'],'CG':['congo brazzaville'],
 'LK':['ceylon'],'IR':['persia'],'TH':['siam'],'BT':['druk yul'],'NP':['nepal'],'MV':['maldive islands'],'SG':['singapura'],
 'HK':['hong kong sar'],'PS':['palestine'],'VA':['vatican','holy see'],'FM':['micronesia'],'BA':['bosnia'],'TT':['trinidad','tobago'],
 'AG':['antigua'],'KN':['st kitts','saint kitts'],'VC':['st vincent'],'LC':['st lucia'],'ST':['sao tome'],'BN':['brunei darussalam'],
 'IN':['bharat','hindustan','india'],'CN':['prc','peoples republic of china'],'TW':['formosa'],'DE':['deutschland'],'CH':['switzerland','swiss'],
}
# Famous destinations per country (curated, only where reviewed). Seeds the Tusk/atlas layer.
TOP = {
 'IN':['Goa','Jaipur','Varanasi','Rishikesh','Manali','Kerala Backwaters','Leh Ladakh','Udaipur','Agra'],
 'TH':['Bangkok','Phuket','Chiang Mai','Krabi','Koh Samui','Pattaya'],'ID':['Bali','Ubud','Lombok','Yogyakarta','Komodo'],
 'AE':['Dubai','Abu Dhabi','Sharjah'],'SG':['Singapore'],'MY':['Kuala Lumpur','Langkawi','Penang'],'VN':['Hanoi','Ho Chi Minh City','Da Nang','Ha Long Bay'],
 'LK':['Colombo','Kandy','Galle','Ella'],'NP':['Kathmandu','Pokhara','Everest Base Camp'],'BT':['Paro','Thimphu','Punakha'],'MV':['Male','Maafushi'],
 'JP':['Tokyo','Kyoto','Osaka','Hokkaido'],'KR':['Seoul','Jeju','Busan'],'FR':['Paris','Nice','Lyon'],'IT':['Rome','Venice','Florence','Milan'],
 'ES':['Barcelona','Madrid','Seville'],'CH':['Zurich','Interlaken','Lucerne'],'GB':['London','Edinburgh'],'US':['New York','Los Angeles','Las Vegas'],
 'TR':['Istanbul','Cappadocia','Antalya'],'EG':['Cairo','Luxor','Sharm El Sheikh'],'AU':['Sydney','Melbourne','Gold Coast'],'NZ':['Auckland','Queenstown'],
 'GR':['Athens','Santorini','Mykonos'],'PT':['Lisbon','Porto'],'DE':['Berlin','Munich'],'NL':['Amsterdam'],'MU':['Port Louis','Grand Baie'],
}
out=[]
for iso,c in sorted(gc.get_countries().items(), key=lambda kv: kv[1]['name']):
    langs=[l.split('-')[0] for l in (c['languages'] or '').split(',') if l]
    out.append({'iso':iso,'iso3':c['iso3'],'name':c['name'],'capital':c['capital'],'continent':CONT.get(c['continentcode'],c['continentcode']),
      'currency':c['currencycode'],'currencyName':c['currencyname'],'phone':c['phone'],'languages':langs,'neighbours':[n for n in (c['neighbours'] or '').split(',') if n],
      'aliases':ALIAS.get(iso,[]),'top':TOP.get(iso,[])})
json.dump({'source':'GeoNames (CC-BY 4.0) via geonamescache (MIT); aliases/top curated by RoamWise','count':len(out),'countries':out},
          open('data/atlas/world-countries.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out))
