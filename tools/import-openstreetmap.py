#!/usr/bin/env python3
"""Regenerate /local-help-osm.js from OpenStreetMap (Overpass API).

Run:  python3 -I tools/import-openstreetmap.py [out.js] [cache_dir]     (stdlib only; one polite request per town)

Data: (c) OpenStreetMap contributors, ODbL 1.0 -- https://www.openstreetmap.org/copyright
The app MUST show that credit wherever these entries appear (js/misc/local-help.js does).

Keeps an element only if it has a name, is within RADIUS of a Kumaon town, was last edited within
MAX_AGE_DAYS, and is not a duplicate of another place. Entries are labelled community-mapped
(unverified): OpenStreetMap has no verification flag, so the UI says "call ahead".
"""
import json, math, os, re, sys, time, datetime, collections, urllib.request, urllib.parse
CACHE = sys.argv[2] if len(sys.argv) > 2 else None   # optional dir: per-town responses are cached so a re-run resumes

MIRRORS = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
UA = 'RoamWise-LocalHelp-importer/1.0 (support@roamwise.co.in)'
MAX_AGE_DAYS = 3 * 365
PER_TOWN_CAT_CAP = 14
TOWNS = {  # name: (lat, lon, radius_m)
 'Kathgodam': (29.2650, 79.5450, 3500), 'Haldwani': (29.2183, 79.5130, 6000), 'Nainital': (29.3919, 79.4542, 5000),
 'Bhimtal': (29.3430, 79.5560, 3500), 'Mukteshwar': (29.4710, 79.6470, 3500), 'Ramnagar': (29.3950, 79.1270, 4500),
 'Lalkuan': (29.0750, 79.5140, 4000), 'Almora': (29.5971, 79.6591, 5000), 'Ranikhet': (29.6434, 79.4322, 4500),
 'Bageshwar': (29.8380, 79.7710, 4000), 'Kausani': (29.8400, 79.6050, 3500), 'Pithoragarh': (29.5829, 80.2182, 6000),
 'Didihat': (29.8000, 80.2500, 3000), 'Munsiyari': (30.0680, 80.2380, 3500), 'Dharchula': (29.8470, 80.5390, 3000),
 'Champawat': (29.3350, 80.0910, 3500), 'Lohaghat': (29.4090, 80.0950, 3000), 'Tanakpur': (29.0750, 80.1100, 4000),
 'Rudrapur': (28.9750, 79.4000, 6000), 'Kashipur': (29.2100, 78.9600, 5500), 'Khatima': (28.9200, 79.9700, 4500),
 'Sitarganj': (28.9300, 79.7000, 4500), 'Pantnagar': (29.0300, 79.4900, 4000)}
# (osm key, value) -> (category, label)
TAGMAP = {
 ('amenity','pharmacy'):('health','Pharmacy'), ('amenity','clinic'):('health','Clinic'), ('amenity','doctors'):('health','Doctor'),
 ('amenity','dentist'):('health','Dentist'), ('amenity','hospital'):('health','Hospital'),
 ('amenity','taxi'):('taxi','Taxi stand'),
 ('amenity','car_rental'):('rental','Car rental'), ('amenity','motorcycle_rental'):('rental','Bike rental'), ('amenity','bicycle_rental'):('rental','Cycle rental'),
 ('shop','car_repair'):('repair','Car repair'), ('shop','motorcycle_repair'):('repair','Bike repair'), ('shop','tyres'):('repair','Tyre shop'),
 ('amenity','fuel'):('fuel','Petrol pump'), ('amenity','atm'):('fuel','ATM'),
 ('shop','supermarket'):('daily','Supermarket'), ('shop','convenience'):('daily','Convenience store'), ('shop','greengrocer'):('daily','Vegetables'),
 ('shop','bakery'):('daily','Bakery'), ('shop','dairy'):('daily','Dairy'),
 ('tourism','guest_house'):('stay','Guest house / homestay')}
AMEN = 'pharmacy|clinic|doctors|dentist|hospital|taxi|car_rental|motorcycle_rental|bicycle_rental|fuel|atm'
SHOP = 'car_repair|motorcycle_repair|tyres|supermarket|convenience|greengrocer|bakery|dairy'

def hav(a, b, c, d):
    R = 6371000; p = math.pi / 180
    x = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))

def phone(x):
    for part in re.split(r'[;,/]', str(x or '')):
        d = re.sub(r'\D', '', part)
        if len(d) == 12 and d.startswith('91'): d = d[2:]
        if len(d) == 11 and d.startswith('0'): d = d[1:]
        if re.fullmatch(r'[6-9]\d{9}', d): return d
    return ''

REGION = (28.80, 78.85, 30.20, 80.75)   # Kumaon bounding box: south, west, north, east

def query_region():
    bb = '%f,%f,%f,%f' % REGION
    ql = ('[out:json][timeout:180];(nwr(%s)["amenity"~"^(%s)$"];nwr(%s)["shop"~"^(%s)$"];nwr(%s)["tourism"="guest_house"];);out center meta;'
          % (bb, AMEN, bb, SHOP, bb))
    last = None
    for attempt in range(30):          # public mirrors are flaky (frequent 500s): one success is all we need, so retry patiently
        m = MIRRORS[attempt % len(MIRRORS)]
        try:
            req = urllib.request.Request(m, data=urllib.parse.urlencode({'data': ql}).encode(), headers={'User-Agent': UA})
            return json.load(urllib.request.urlopen(req, timeout=240))
        except Exception as e:
            last = e; print('attempt %d on %s failed: %s' % (attempt + 1, m.split('//')[1].split('/')[0], e), file=sys.stderr, flush=True); time.sleep(min(30, 4 * (attempt + 1)))
    raise SystemExit('overpass failed after retries: %s' % last)

def build(now):
    cut = now - datetime.timedelta(days=MAX_AGE_DAYS)
    cf = os.path.join(CACHE, 'region.json') if CACHE else None
    if cf and os.path.exists(cf): REGION_DATA = json.load(open(cf))
    else:
        REGION_DATA = query_region()
        if cf: os.makedirs(CACHE, exist_ok=True); json.dump(REGION_DATA, open(cf, 'w'))
    print('region elements:', len(REGION_DATA.get('elements', [])), file=sys.stderr)
    seen, items, drop = set(), [], collections.Counter()
    for town, (lat, lon, rad) in TOWNS.items():
        data = REGION_DATA
        for e in data.get('elements', []):
            t = e.get('tags', {}); name = (t.get('name:en') or t.get('name') or '').strip()
            clat = e.get('lat') or (e.get('center') or {}).get('lat'); clon = e.get('lon') or (e.get('center') or {}).get('lon')
            m = next((TAGMAP[(k, t[k])] for k in ('amenity', 'shop', 'tourism') if (k, t.get(k)) in TAGMAP), None)
            if not m or clat is None: continue
            near = min(TOWNS, key=lambda n: hav(clat, clon, TOWNS[n][0], TOWNS[n][1]))
            if near != town: continue                      # each element is handled once, by its nearest town
            if hav(clat, clon, lat, lon) > rad: drop['outside every town radius'] += 1; continue
            if m[1] == 'ATM': name = name or (t.get('operator') or t.get('brand') or '').strip()
            if len(name) < 2: drop['no name'] += 1; continue
            if not e.get('timestamp'): drop['no edit date (age unknown)'] += 1; continue
            ts = datetime.datetime.fromisoformat(e['timestamp'].replace('Z', '+00:00'))
            if t.get('check_date'):
                try: ts = max(ts, datetime.datetime.fromisoformat(t['check_date'] + 'T00:00:00+00:00'))
                except Exception: pass
            if ts < cut: drop['last edit older than %d days' % MAX_AGE_DAYS] += 1; continue
            key = (town, m[0], re.sub(r'[^a-z0-9]', '', name.lower()))
            if key in seen: drop['duplicate'] += 1; continue
            seen.add(key)
            ph = phone(t.get('phone') or t.get('contact:phone') or t.get('contact:mobile') or t.get('mobile'))
            hrs = re.sub(r'\s+', ' ', t.get('opening_hours', '')).strip()
            note = ' · '.join(x for x in ['Open ' + hrs if hrs and len(hrs) <= 30 else ''] if x)
            items.append({'id': 'osm-%s%d' % (e['type'][0], e['id']), 'cat': m[0], 'svc': m[1], 'town': town, 'name': name, 'phone': ph, 'note': note,
                          'lat': round(clat, 5), 'lon': round(clon, 5), 'verified': 'osm', 'consentAt': ts.date().isoformat(), 'updatedAt': ts.date().isoformat(),
                          'maxAgeDays': MAX_AGE_DAYS, 'source': 'openstreetmap', '_score': (2 if ph else 0) + (1 if hrs else 0)})
    out, per = [], collections.Counter()
    for it in sorted(items, key=lambda x: (x['town'], x['cat'], -x['_score'], x['name'].lower())):
        k = (it['town'], it['cat'])
        if per[k] >= PER_TOWN_CAT_CAP: drop['over per-town cap'] += 1; continue
        per[k] += 1; it.pop('_score'); out.append(it)
    return out, drop

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'local-help-osm.js'
    now = datetime.datetime.now(datetime.timezone.utc)
    kept, drop = build(now)
    head = ('/* local-help-osm.js — GENERATED by tools/import-openstreetmap.py on %s. Do not hand-edit; re-run the tool.\n'
            ' * Data © OpenStreetMap contributors, ODbL 1.0 (openstreetmap.org/copyright). Community-mapped, NOT verified by RoamWise. */\n' % now.date().isoformat())
    body = 'RW_LOCAL_PROVIDERS.push.apply(RW_LOCAL_PROVIDERS, ' + json.dumps(kept, ensure_ascii=True, separators=(',', ':')).replace('},{', '},\n{') + ');\nwindow.RW_LOCAL_OSM_LOADED = true;\n'
    open(out, 'w').write(head + body)
    print('kept %d -> %s' % (len(kept), out)); print('by category:', dict(collections.Counter(k['cat'] for k in kept)))
    print('with phone:', sum(1 for k in kept if k['phone'])); print('by town:', dict(collections.Counter(k['town'] for k in kept).most_common(30))); print('dropped:', dict(drop))
