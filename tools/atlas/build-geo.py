#!/usr/bin/env python3
"""Builds the India atlas + world-cities layer from GeoNames dumps (CC-BY 4.0, https://www.geonames.org).
Inputs (download from https://download.geonames.org/export/dump/ into SRC): IN.txt (unzip IN.zip), cities15000.txt,
admin1CodesASCII.txt, admin2Codes.txt.  Usage: python3 tools/atlas/build-geo.py SRC_DIR
Outputs (data/atlas/): india-admin.json, india-places.json, india-namesakes.json, world-cities.json"""
import json, re, sys, os, unicodedata, collections
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'atlas')
def norm(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]+', ' ', s)).strip()
def latin(s): return bool(s) and all(ord(c) < 0x250 for c in s)
def dump(name, obj):
    with open(os.path.join(OUT, name), 'w', encoding='utf8') as f: json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    print(name, os.path.getsize(os.path.join(OUT, name)) // 1024, 'KB')

# ---- admin names
a1 = {}; a2 = {}
for l in open(os.path.join(SRC, 'admin1CodesASCII.txt'), encoding='utf8'):
    p = l.rstrip('\n').split('\t'); a1[p[0]] = p[1]
for l in open(os.path.join(SRC, 'admin2Codes.txt'), encoding='utf8'):
    p = l.rstrip('\n').split('\t')
    if p[0].startswith('IN.'): a2[p[0]] = re.sub(r'(?i)^district\s+|\s+district$|\s+kattabo$', '', (p[2] or p[1]).strip())
STATE_ALIAS = {'Uttarakhand': ['Uttaranchal'], 'Odisha': ['Orissa'], 'Puducherry': ['Pondicherry'], 'Delhi': ['NCT of Delhi', 'New Delhi'],
  'Jammu and Kashmir': ['J&K', 'Kashmir'], 'Andaman and Nicobar': ['Andaman', 'Andamans', 'A&N Islands'], 'Telangana': ['Telengana'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Dadra and Nagar Haveli'], 'Tamil Nadu': ['TN'], 'Kerala': ['God\'s Own Country'], 'Uttar Pradesh': ['UP']}
# curated extra place aliases (traveller spellings / old names); GeoNames alternates add more automatically
PLACE_ALIAS = {'Varanasi': ['Benares', 'Banaras', 'Kashi'], 'Mumbai': ['Bombay'], 'Chennai': ['Madras'], 'Kolkata': ['Calcutta'], 'Bengaluru': ['Bangalore'],
  'Pune': ['Poona'], 'Thiruvananthapuram': ['Trivandrum'], 'Kochi': ['Cochin'], 'Mysuru': ['Mysore'], 'Prayagraj': ['Allahabad'], 'Gurugram': ['Gurgaon'],
  'Nainital': ['Naini Tal'], 'Haridwar': ['Hardwar'], 'Dehradun': ['Dehra Dun'], 'Shimla': ['Simla'], 'Alappuzha': ['Alleppey', 'Alleppy'],
  'Kozhikode': ['Calicut'], 'Vadodara': ['Baroda'], 'Mangaluru': ['Mangalore'], 'Visakhapatnam': ['Vizag', 'Vishakhapatnam'], 'Udhagamandalam': ['Ooty', 'Ootacamund'],
  'Kodaikanal': ['Kodai'], 'Dharamsala': ['Dharamshala', 'McLeod Ganj', 'Mcleodganj'], 'Leh': ['Leh Ladakh'], 'Puducherry': ['Pondicherry', 'Pondy'],
  'Panaji': ['Panjim'], 'Tiruchirappalli': ['Trichy', 'Tiruchirapalli'], 'Kanyakumari': ['Cape Comorin'], 'Rameswaram': ['Rameshwaram'], 'Hampi': ['Vijayanagara'],
  'Kasol': ['Kasol Valley'], 'Rishikesh': ['Hrishikesh'], 'Ayodhya': ['Faizabad'], 'Vrindavan': ['Brindavan', 'Vrindaban'], 'Amritsar': ['Golden Temple City'],
  'Jaisalmer': ['Golden City'], 'Munnar': ['Munar'], 'Thekkady': ['Periyar'], 'Pushkar': ['Pushkar Lake'], 'Darjeeling': ['Darjiling'], 'Gangtok': ['Gangtok Sikkim'],
  'Shillong': ['Scotland of the East'], 'Kohima': ['Kohima Nagaland'], 'Coorg': ['Kodagu', 'Madikeri'], 'Madikeri': ['Mercara'], 'Bodh Gaya': ['Bodhgaya', 'Buddh Gaya'],
  'Agra': ['Taj City'], 'Udaipur': ['City of Lakes'], 'Jodhpur': ['Blue City'], 'Jaipur': ['Pink City'], 'Kanpur': ['Cawnpore'], 'Pimpri-Chinchwad': ['Pimpri Chinchwad'],
  'Thanjavur': ['Tanjore'], 'Kancheepuram': ['Kanchipuram', 'Conjeevaram'], 'Shivamogga': ['Shimoga'], 'Belagavi': ['Belgaum'], 'Kalaburagi': ['Gulbarga'],
  'Bengaluru Urban': ['Bangalore Urban'], 'Ladakh': ['Ladakh UT'], 'Kutch': ['Kachchh', 'Kachchh'], 'Dwarka': ['Dwarkadhish'], 'Somnath': ['Prabhas Patan'],
  'Almora': ['Almorah'], 'Ranikhet': ['Ranikhet Cantt', 'Raniket'], 'Mussoorie': ['Mussorie', 'Masuri'], 'Lansdowne': ['Lansdown'], 'Auli': ['Joshimath Auli']}
STATE_CODE = {}
states = []
for code, name in sorted(((k, v) for k, v in a1.items() if k.startswith('IN.')), key=lambda x: x[1]):
    c = code.split('.')[1]; STATE_CODE[c] = len(states)
    states.append({'code': c, 'name': name, 'aliases': STATE_ALIAS.get(name, []), 'districts': []})
dist_idx = {}  # (state c, admin2 code) -> district index within state
DIST_FIX = {}
rows = []
for l in open(os.path.join(SRC, 'IN.txt'), encoding='utf8'):
    p = l.rstrip('\n').split('\t'); rows.append(p)
# district centroids from populated places
cent = collections.defaultdict(lambda: [0.0, 0.0, 0])
for p in rows:
    if p[7].startswith('PPL') and p[10] in STATE_CODE and p[11]:
        k = (p[10], p[11]); c = cent[k]; c[0] += float(p[4]); c[1] += float(p[5]); c[2] += 1
for (s, d), (la, lo, n) in sorted(cent.items()):
    nm = a2.get('IN.%s.%s' % (s, d))
    if not nm or n < 1: continue
    st = states[STATE_CODE[s]]; dist_idx[(s, d)] = len(st['districts'])
    st['districts'].append({'name': nm, 'lat': round(la / n, 3), 'lng': round(lo / n, 3)})
# state centroid = mean of its district centroids
for st in states:
    if st['districts']:
        st['lat'] = round(sum(d['lat'] for d in st['districts']) / len(st['districts']), 3); st['lng'] = round(sum(d['lng'] for d in st['districts']) / len(st['districts']), 3)
    else: st['lat'] = st['lng'] = 0

# ---- places
TYPE = {'PPLC': 'C', 'PPLA': 'A', 'PPLA2': 'A', 'PPLA3': 'a', 'PPLA4': 'a', 'PPLG': 'a', 'PPL': 'v', 'PPLS': 'v', 'PPLL': 'v',
  'TMPL': 'T', 'HLY': 'T', 'SHRN': 'T', 'MSQE': 'T', 'MSTY': 'T', 'CH': 'T', 'FLLS': 'W', 'LK': 'W', 'LKS': 'W', 'BCH': 'B', 'ISL': 'I', 'BAY': 'B',
  'MT': 'M', 'MTS': 'M', 'PK': 'M', 'PASS': 'M', 'GLCR': 'M', 'VLC': 'M', 'CAVE': 'X', 'FT': 'F', 'CSTL': 'F', 'PAL': 'F', 'RUIN': 'F', 'MNMT': 'F', 'MUS': 'F',
  'PYR': 'F', 'TOWR': 'F', 'PRK': 'N', 'RSRT': 'R', 'ZOO': 'N', 'GDN': 'N', 'SPA': 'R'}
WEIGHT = {'C': 100, 'A': 70, 'a': 40, 'T': 30, 'F': 30, 'W': 25, 'M': 25, 'B': 25, 'I': 25, 'N': 20, 'X': 20, 'R': 20, 'v': 5}
out = []; nm_count = collections.defaultdict(collections.Counter)  # namesakes among ALL populated places
for p in rows:
    fc = p[7]; s = p[10]
    if s not in STATE_CODE: continue
    pop = int(p[14] or 0); di = dist_idx.get((s, p[11]), -1)
    if fc.startswith('PPL'):
        nm_count[norm(p[2])][(STATE_CODE[s], di)] += 1
    t = TYPE.get(fc)
    if not t: continue
    if t == 'v' and pop < 1000: continue
    if t in 'TFWMBINXR' and not (p[2] and latin(p[2])): continue
    name = p[2] or p[1]
    alts = []
    for a in p[3].split(','):
        a = a.strip()
        if a and latin(a) and norm(a) != norm(name) and norm(a) not in [norm(x) for x in alts] and len(a) <= 32: alts.append(a)
        if len(alts) >= 3: break
    for k, v in PLACE_ALIAS.items():
        if norm(name) == norm(k):
            for a in v:
                if norm(a) not in [norm(x) for x in alts] and norm(a) != norm(name): alts.insert(0, a)
            alts = alts[:5]
    out.append([name, round(float(p[4]), 3), round(float(p[5]), 3), t, STATE_CODE[s], di, pop, alts])
# ---- curated famous places: replace GeoNames records within 12 km that share the name or type, then add
import math
def hav(a, b, c, d):
    r = math.radians; x = math.sin(r(c - a) / 2) ** 2 + math.cos(r(a)) * math.cos(r(c)) * math.sin(r(d - b) / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))
sidx = {norm(s['name']): i for i, s in enumerate(states)}
DIST_ALIAS = {'pauri garhwal': 'garhwal', 'kullu': 'kulu', 'kachchh': 'kutch', 'bellary': 'ballari', 'uttara kannada': 'uttar kannada', 'the nilgiris': 'nilgiris',
  'pondicherry': 'puducherry', 'darjiling': 'darjeeling', 'faizabad': 'ayodhya', 'allahabad': 'prayagraj', 'east sikkim': 'gangtok', 'west sikkim': 'gyalshing',
  'north sikkim': 'mangan', 'baramulla': 'baramula', 'ahmedabad': 'ahmadabad', 'lahul and spiti': 'lahul and spiti', 'kanniyakumari': 'kanniyakumari', 'thiruvananthapuram': 'thiruvananthapuram'}
def find_district(si, dname):
    ds = states[si]['districts']; n = DIST_ALIAS.get(norm(dname), norm(dname))
    for i, d in enumerate(ds):
        if norm(d['name']) == n: return i
    for i, d in enumerate(ds):
        if norm(d['name']).startswith(n) or n.startswith(norm(d['name'])) or n in norm(d['name']): return i
    return -1
cur = []; bad = []
for l in open(os.path.join(os.path.dirname(__file__), 'india-famous.tsv'), encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    nm_, st, dn, la, lo, t, al = (l.rstrip('\n').split('|') + [''])[:7]
    la, lo = float(la), float(lo)
    if norm(st) not in sidx: bad.append(('state', nm_)); continue
    si = sidx[norm(st)]; di = find_district(si, dn)
    if di < 0:
        bad.append(('district', nm_, dn)); states[si]['districts'].append({'name': dn, 'lat': round(la, 3), 'lng': round(lo, 3), 'curated': 1}); di = len(states[si]['districts']) - 1
    alts = [a for a in al.split(';') if a and norm(a) != norm(nm_)]
    cur.append([nm_, round(la, 3), round(lo, 3), t, si, di, 10 ** 7, alts])
keep = []
for r in out:
    dup = False
    for c in cur:
        if hav(r[1], r[2], c[1], c[2]) < 12 and (norm(r[0]) == norm(c[0]) or norm(r[0]) in [norm(a) for a in c[7]] or norm(c[0]) in [norm(a) for a in r[7]]): dup = True; break
    if not dup: keep.append(r)
out = keep + cur
print('curated', len(cur), 'unmatched', bad)
# drop pure duplicates (same name+type+district)
seen = set(); res = []
for r in sorted(out, key=lambda r: -(WEIGHT[r[3]] * 1000 + r[6])):
    k = (norm(r[0]), r[3], r[4], r[5])
    if k in seen: continue
    seen.add(k); res.append(r)
dump('india-admin.json', {'source': 'GeoNames (CC-BY 4.0); curated districts flagged', 'states': states})
dump('india-places.json', {'fields': ['name', 'lat', 'lng', 'type', 'state', 'district', 'pop', 'aliases'],
  'types': {'C': 'capital', 'A': 'district seat', 'a': 'town', 'v': 'village/town', 'T': 'temple/shrine', 'F': 'fort/heritage', 'W': 'lake/waterfall', 'M': 'mountain/pass',
            'B': 'beach/bay', 'I': 'island', 'N': 'park/wildlife', 'X': 'cave', 'R': 'resort'}, 'places': res})
# ---- namesakes: names shared by >=4 populated places in India -> where they are
nm = {}
for n, c in nm_count.items():
    tot = sum(c.values())
    if tot >= 4 and n:
        top = sorted(c.items(), key=lambda kv: -kv[1])[:8]
        nm[n] = [tot, [[s, d, k] for (s, d), k in top]]
dump('india-namesakes.json', {'fields': 'name -> [total, [[state, district, count]...]]', 'names': nm})

# ---- world cities (>=15k people), excluding India (served by the India layer)
wc = []
for l in open(os.path.join(SRC, 'cities15000.txt'), encoding='utf8'):
    p = l.rstrip('\n').split('\t')
    if p[8] == 'IN': continue
    name = p[1] if latin(p[1]) else p[2]
    alts = []
    for a in p[3].split(','):
        a = a.strip()
        if a and latin(a) and norm(a) != norm(name) and norm(a) not in [norm(x) for x in alts] and len(a) <= 30: alts.append(a)
        if len(alts) >= 2: break
    reg = a1.get(p[8] + '.' + p[10], '')
    wc.append([name, round(float(p[4]), 2), round(float(p[5]), 2), p[8], reg, int(p[14] or 0), alts, 1 if p[7] == 'PPLC' else (2 if p[7].startswith('PPLA') else 0)])
TYPE_LABEL = {'F': 'monument or heritage site', 'N': 'national park or nature area', 'W': 'lake or waterfall', 'M': 'mountain', 'B': 'beach', 'I': 'island', 'T': 'temple', 'R': 'region or resort area', 'A': 'attraction'}
for l in open(os.path.join(os.path.dirname(__file__), 'world-famous.tsv'), encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    nm_, cc, reg, la, lo, t, al = (l.rstrip('\n').split('|') + [''])[:7]
    if cc == 'IN': continue
    wc.append([nm_, round(float(la), 3), round(float(lo), 3), cc, reg, 10 ** 7, [a for a in al.split(';') if a], 3, TYPE_LABEL[t]])
wc.sort(key=lambda r: -r[5])
dump('world-cities.json', {'source': 'GeoNames (CC-BY 4.0)', 'fields': ['name', 'lat', 'lng', 'cc', 'region', 'pop', 'aliases', 'rank(0 city,1 capital,2 admin seat,3 curated landmark)', 'label?'], 'cities': wc})
