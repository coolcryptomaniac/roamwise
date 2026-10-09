#!/usr/bin/env python3
"""Regenerate /local-help-listings.js from Kumaon Bazaar's public directory data.

Run:  python3 -I tools/import-kumaon-bazaar.py [out.js]      (needs: pip install playwright; playwright install chromium)

Only the owner of Kumaon Bazaar (or someone with their permission) should run this.
It reads the same public listing data the site shows, then KEEPS a row only if:
  - is_verified is true on Kumaon Bazaar
  - updated within MAX_AGE_DAYS (default 365)
  - it is in one of the six Kumaon districts and maps to a Local Help category
  - it has a valid Indian mobile number and a real name; duplicates by phone are dropped
Never copied: ID-proof paths/URLs, agent codes, user ids, photos, ratings.
Emergency ambulances are deliberately excluded (use the SOS page / 108).
"""
import json, re, sys, datetime, collections
from playwright.sync_api import sync_playwright

MAX_AGE_DAYS = 365
SITE = 'https://www.kumaonbazaar.com/transportation-directory'
API = 'https://ngarmacnpjbzbybxkujc.supabase.co/rest/v1/'
KUMAON = {'nainital', 'almora', 'bageshwar', 'pithoragarh', 'champawat', 'udhamsingh'}
TOWNS = {'pithoragarh-city': 'Pithoragarh', 'haldwani': 'Haldwani', 'almora-city': 'Almora', 'bageshwar-city': 'Bageshwar',
         'champawat-city': 'Champawat', 'nainital-city': 'Nainital', 'didihat': 'Didihat', 'munsiyari': 'Munsiyari',
         'lohaghat': 'Lohaghat', 'dharchula': 'Dharchula', 'thal': 'Thal', 'khatima': 'Khatima', 'mukteshwar': 'Mukteshwar',
         'kausani': 'Kausani', 'ranikhet': 'Ranikhet', 'rudrapur': 'Rudrapur', 'kashipur': 'Kashipur', 'tanakpur': 'Tanakpur'}
# (table, raw service/business type) -> (category, friendly label)
MAP = {
  'transportation_professionals': {
    'Cab/Taxi Service': ('taxi', 'Cab / taxi'), 'cab_service': ('taxi', 'Cab / taxi'), 'Bike Taxi Service': ('taxi', 'Bike taxi'),
    'Driver for Tourist & Full Day Hire': ('taxi', 'Driver for full-day hire'), 'Tourist Vehicle Service': ('taxi', 'Tourist vehicle'),
    'rental_bike': ('rental', 'Bike rental'), 'Bike Rental Service': ('rental', 'Bike rental'), 'Car Rental Service': ('rental', 'Car rental'),
    'Vehicle Breakdown Services': ('repair', 'Breakdown help'), 'Bike Mechanic Services': ('repair', 'Bike mechanic'),
    'Car Mechanic Services': ('repair', 'Car mechanic'), 'Two-Wheeler Mechanic (On-site)': ('repair', 'Two-wheeler mechanic'),
    'Puncture Repair Shop': ('repair', 'Puncture repair'), 'Car/Bike Battery Recharging': ('repair', 'Battery recharge')},
  'health_wellness_professionals': {
    'pharmacy': ('health', 'Pharmacy'), 'Pharmacist/Medical Shop': ('health', 'Pharmacy'), 'lab_test': ('health', 'Lab tests'),
    'doctor': ('health', 'Doctor'), 'homeopathy': ('health', 'Homeopathy'), 'ayurveda': ('health', 'Ayurveda'),
    'physiotherapist': ('health', 'Physiotherapy'), 'dentist': ('health', 'Dentist'), 'dental  care': ('health', 'Dentist'),
    'gynecologist': ('health', 'Gynaecologist'), 'dietitian': ('health', 'Dietitian'), 'nurse': ('health', 'Nurse')},
  'daily_needs_essentials': {
    'grocery': ('daily', 'Grocery'), 'vegetable': ('daily', 'Vegetables'), 'bakery': ('daily', 'Bakery'), 'Bakery': ('daily', 'Bakery'),
    'dairy': ('daily', 'Dairy'), 'water': ('daily', 'Drinking water'), 'tiffin service': ('daily', 'Tiffin service'),
    'tiffin': ('daily', 'Tiffin service'), 'restaurant': ('daily', 'Restaurant')}}
TYPE_FIELD = {'transportation_professionals': 'service_type', 'health_wellness_professionals': 'service_type', 'daily_needs_essentials': 'business_type'}
BAD_NAME = re.compile(r'\b(test|demo|dummy|asdf|xxx|sample)\b', re.I)

def phone(x):
    d = re.sub(r'\D', '', str(x or ''))
    if len(d) == 12 and d.startswith('91'): d = d[2:]
    if len(d) == 11 and d.startswith('0'): d = d[1:]
    return d if re.fullmatch(r'[6-9]\d{9}', d) else ''

def clean(t, cap=120):
    t = re.sub(r'<[^>]+>', ' ', str(t or '')); t = re.sub(r'https?://\S+', '', t); t = re.sub(r'\s+', ' ', t).strip()
    if len(t) <= cap: return t
    cut = t[:cap].rsplit(' ', 1)[0].rstrip(',;:-')
    return cut + '…'

def fetch_all():
    hdr = {}
    def grab(req):
        if 'supabase.co/rest/v1/transportation_professionals?select=*' in req.url and not hdr:
            for k in ('apikey', 'authorization'):
                if k in req.headers: hdr[k] = req.headers[k]
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(); pg = ctx.new_page(); pg.on('request', grab)
        pg.goto(SITE, wait_until='networkidle', timeout=60000); pg.wait_for_timeout(1500)
        for t in MAP:
            r = ctx.request.get(API + t + '?select=*&limit=3000', headers=hdr)
            if r.status != 200: raise SystemExit('fetch failed: %s %s' % (t, r.status))
            out[t] = r.json()
        b.close()
    return out

def build(raw, now):
    cut = now - datetime.timedelta(days=MAX_AGE_DAYS)
    kept, drop, seen = [], collections.Counter(), set()
    for table, rows in raw.items():
        for r in sorted(rows, key=lambda r: r.get('updated_at') or '', reverse=True):
            m = MAP[table].get((r.get(TYPE_FIELD[table]) or '').strip() if r.get(TYPE_FIELD[table]) is not None else '')
            if not m: drop['type not used']+=1; continue
            if not r.get('is_verified'): drop['not verified']+=1; continue
            u = datetime.datetime.fromisoformat((r.get('updated_at') or r.get('created_at')).replace('Z', '+00:00'))
            if u < cut: drop['older than %d days' % MAX_AGE_DAYS]+=1; continue
            if r.get('district_id') not in KUMAON: drop['outside Kumaon']+=1; continue
            town = TOWNS.get(r.get('town_id'))
            if not town: drop['town not mapped']+=1; continue
            ph = phone(r.get('phone')); n = (r.get('name') or '').strip()
            if not ph or len(n) < 2 or BAD_NAME.search(n): drop['no valid mobile / bad name']+=1; continue
            if ph in seen: drop['duplicate phone']+=1; continue
            seen.add(ph)
            price = re.sub(r'\s+', ' ', str(r.get('price_range') or '')).strip()
            price = price if (price and re.search(r'[A-Za-z\u20b9]', price) and len(price) <= 40) else ''   # bare numbers have no unit: skip
            hrs = re.sub(r'^\s*open\s*[:\-]?\s*', '', str(r.get('available_hours') or r.get('business_hours') or ''), flags=re.I).strip()
            hrs = ('Open ' + hrs) if (hrs and len(hrs) <= 30) else ''                                    # long/free-text hours: skip
            extra = [x for x in (price, hrs) if x]
            note = ' · '.join([x for x in [clean(r.get('description'))] + extra if x])
            kept.append({'id': 'kb-' + r['id'][:8], 'cat': m[0], 'svc': m[1], 'town': town, 'name': n, 'phone': ph, 'note': note,
                         'verified': 'kb', 'consentAt': r['created_at'][:10], 'updatedAt': u.date().isoformat(), 'source': 'kumaonbazaar'})
    kept.sort(key=lambda x: (x['town'], x['cat'], x['name'].lower()))
    return kept, drop

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'local-help-listings.js'
    now = datetime.datetime.now(datetime.timezone.utc)
    kept, drop = build(fetch_all(), now)
    head = ('/* local-help-listings.js — GENERATED by tools/import-kumaon-bazaar.py on %s. Do not hand-edit; re-run the tool.\n'
            ' * Verified-on-Kumaon-Bazaar listings updated within %d days only. Loaded on demand by js/misc/local-help.js. */\n'
            % (now.date().isoformat(), MAX_AGE_DAYS))
    body = 'RW_LOCAL_PROVIDERS.push.apply(RW_LOCAL_PROVIDERS, ' + json.dumps(kept, ensure_ascii=True, separators=(',', ':')).replace('},{', '},\n{') + ');\nwindow.RW_LOCAL_LISTINGS_LOADED = true;\n'
    open(out, 'w').write(head + body)
    print('kept %d -> %s' % (len(kept), out)); print('by category:', dict(collections.Counter(k['cat'] for k in kept))); print('dropped:', dict(drop))
