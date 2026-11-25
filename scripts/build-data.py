#!/usr/bin/env python3
"""Build Shopeiz location data from the India Post all-India PIN code directory.

Source: https://github.com/saravanakumargn/All-India-Pincode-Directory (all-india-pincode-html-csv.csv)

Usage: python3 scripts/build-data.py path/to/all-india-pincode-html-csv.csv [path/to/cities.json]

Optional cities list: https://github.com/nshntarora/Indian-Cities-JSON (cities.json), used to add
well-known cities whose post offices are listed under another name, and the spellings people search for.

Writes:
  data/index.json             states, districts, and a slug -> state lookup for every town
  data/states/<state>.json    towns (with PIN codes, taluk and villages served) for one state
"""
import csv, json, os, re, sys, collections

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'data')

STATE_FIX = {
    'CHATTISGARH': 'Chhattisgarh', 'PONDICHERRY': 'Puducherry', 'JAMMU & KASHMIR': 'Jammu and Kashmir',
    'DADRA & NAGAR HAVELI': 'Dadra and Nagar Haveli', 'DAMAN & DIU': 'Daman and Diu',
    'ANDAMAN & NICOBAR ISLANDS': 'Andaman and Nicobar Islands', 'DELHI': 'Delhi',
}
# State facts used to give each region's pages its own details.
STATE_INFO = {
    'Andhra Pradesh': ('Telugu', 'Amaravati', ['Sankranti', 'Ugadi', 'Diwali']),
    'Arunachal Pradesh': ('English and local languages', 'Itanagar', ['Losar', 'Solung', 'Christmas']),
    'Assam': ('Assamese', 'Dispur', ['Bihu', 'Durga Puja', 'Diwali']),
    'Bihar': ('Hindi', 'Patna', ['Chhath', 'Holi', 'Diwali']),
    'Chhattisgarh': ('Hindi', 'Raipur', ['Hareli', 'Diwali', 'Holi']),
    'Goa': ('Konkani', 'Panaji', ['Christmas', 'Ganesh Chaturthi', 'Carnival']),
    'Gujarat': ('Gujarati', 'Gandhinagar', ['Navratri', 'Uttarayan', 'Diwali']),
    'Haryana': ('Hindi', 'Chandigarh', ['Teej', 'Diwali', 'Holi']),
    'Himachal Pradesh': ('Hindi', 'Shimla', ['Dussehra', 'Lohri', 'Diwali']),
    'Jammu and Kashmir': ('Kashmiri, Dogri and Urdu', 'Srinagar and Jammu', ['Eid', 'Navratri', 'Lohri']),
    'Jharkhand': ('Hindi', 'Ranchi', ['Sarhul', 'Karma', 'Diwali']),
    'Karnataka': ('Kannada', 'Bengaluru', ['Ugadi', 'Dasara', 'Deepavali']),
    'Kerala': ('Malayalam', 'Thiruvananthapuram', ['Onam', 'Vishu', 'Christmas']),
    'Madhya Pradesh': ('Hindi', 'Bhopal', ['Diwali', 'Holi', 'Navratri']),
    'Maharashtra': ('Marathi', 'Mumbai', ['Ganesh Chaturthi', 'Gudi Padwa', 'Diwali']),
    'Manipur': ('Meitei', 'Imphal', ['Yaoshang', 'Ningol Chakouba', 'Christmas']),
    'Meghalaya': ('Khasi, Garo and English', 'Shillong', ['Christmas', 'Wangala', 'Shad Suk Mynsiem']),
    'Mizoram': ('Mizo', 'Aizawl', ['Christmas', 'Chapchar Kut', 'New Year']),
    'Nagaland': ('English and Naga languages', 'Kohima', ['Hornbill Festival', 'Christmas', 'Moatsu']),
    'Odisha': ('Odia', 'Bhubaneswar', ['Rath Yatra', 'Durga Puja', 'Raja Parba']),
    'Punjab': ('Punjabi', 'Chandigarh', ['Baisakhi', 'Lohri', 'Diwali']),
    'Rajasthan': ('Hindi and Rajasthani', 'Jaipur', ['Teej', 'Gangaur', 'Diwali']),
    'Sikkim': ('Nepali', 'Gangtok', ['Losar', 'Dashain', 'Losoong']),
    'Tamil Nadu': ('Tamil', 'Chennai', ['Pongal', 'Deepavali', 'Tamil New Year']),
    'Telangana': ('Telugu', 'Hyderabad', ['Bathukamma', 'Sankranti', 'Ugadi']),
    'Tripura': ('Bengali and Kokborok', 'Agartala', ['Durga Puja', 'Kharchi Puja', 'Diwali']),
    'Uttar Pradesh': ('Hindi', 'Lucknow', ['Diwali', 'Holi', 'Eid']),
    'Uttarakhand': ('Hindi', 'Dehradun', ['Diwali', 'Harela', 'Holi']),
    'West Bengal': ('Bengali', 'Kolkata', ['Durga Puja', 'Poila Boishakh', 'Diwali']),
    'Delhi': ('Hindi', 'New Delhi', ['Diwali', 'Holi', 'Eid']),
    'Chandigarh': ('Punjabi and Hindi', 'Chandigarh', ['Baisakhi', 'Lohri', 'Diwali']),
    'Puducherry': ('Tamil and French', 'Puducherry', ['Pongal', 'Deepavali', 'Christmas']),
    'Lakshadweep': ('Malayalam', 'Kavaratti', ['Eid', 'Onam', 'Milad-un-Nabi']),
    'Andaman and Nicobar Islands': ('Hindi and Bengali', 'Sri Vijaya Puram', ['Diwali', 'Island Tourism Festival', 'Christmas']),
    'Dadra and Nagar Haveli': ('Gujarati', 'Silvassa', ['Diwali', 'Navratri', 'Tarpa Festival']),
    'Daman and Diu': ('Gujarati', 'Daman', ['Navratri', 'Diwali', 'Christmas']),
}
# Local names people actually search for. (name, district) -> (display name, alternative name)
ALIAS = {
    ('Vittal', 'Dakshina Kannada'): ('Vitla', 'Vittal'),
    ('Bantval', 'Dakshina Kannada'): ('Bantwal', 'Bantval'),
    ('Mangalore', 'Dakshina Kannada'): ('Mangalore', 'Mangaluru'),
    ('Moodbidri', 'Dakshina Kannada'): ('Moodbidri', 'Moodabidri'),
    ('Kundapura', 'Udupi'): ('Kundapura', 'Kundapur'),
    ('Mysore', 'Mysuru'): ('Mysore', 'Mysuru'),
    ('Belgaum', 'Belgaum'): ('Belgaum', 'Belagavi'),
    ('Gulbarga', 'Gulbarga'): ('Gulbarga', 'Kalaburagi'),
    ('Bellary', 'Bellary'): ('Bellary', 'Ballari'),
    ('Shimoga', 'Shimoga'): ('Shimoga', 'Shivamogga'),
    ('Tumkur', 'Tumkur'): ('Tumkur', 'Tumakuru'),
    ('Calicut', 'Kozhikode'): ('Kozhikode', 'Calicut'),
    ('Trivandrum', 'Thiruvananthapuram'): ('Thiruvananthapuram', 'Trivandrum'),
    ('Cochin', 'Ernakulam'): ('Kochi', 'Cochin'),
    ('Gurgaon', 'Gurgaon'): ('Gurugram', 'Gurgaon'),
    ('Bangalore', 'Bangalore'): ('Bengaluru', 'Bangalore'),
    ('Mysore', 'Mysore'): ('Mysuru', 'Mysore'),
    ('Belgaum', 'Belgaum'): ('Belagavi', 'Belgaum'),
    ('Gulbarga', 'Gulbarga'): ('Kalaburagi', 'Gulbarga'),
    ('Bellary', 'Bellary'): ('Ballari', 'Bellary'),
    ('Shimoga', 'Shimoga'): ('Shivamogga', 'Shimoga'),
    ('Tumkur', 'Tumkur'): ('Tumakuru', 'Tumkur'),
    ('Hubli', 'Dharwad'): ('Hubballi', 'Hubli'),
    ('Chikmagalur', 'Chikkamagaluru'): ('Chikkamagaluru', 'Chikmagalur'),
    ('Bombay', 'Mumbai'): ('Mumbai', 'Bombay'),
    ('Madras', 'Chennai'): ('Chennai', 'Madras'),
    ('Poona', 'Pune'): ('Pune', 'Poona'),
}
# Search spellings of well-known cities -> the name used in the post office directory
CITY_RENAME = {'Bengaluru': 'Bangalore', 'Mangaluru': 'Mangalore', 'Belagavi': 'Belgaum', 'Ballari': 'Bellary',
               'Shivamogga': 'Shimoga', 'Raayachuru': 'Raichur', 'Chikkamagaluru': 'Chikmagalur', 'Hardwar': 'Haridwar',
               'Hubli-Dharwad': 'Hubli', 'Gurgaon': 'Gurgaon', 'Udhagamandalam': 'Ooty', 'Darjiling': 'Darjeeling',
               'Kendujhar': 'Keonjhar', 'Sibsagar': 'Sivasagar', 'Baleshwar Town': 'Balasore', 'Baripada Town': 'Baripada',
               'Morvi': 'Morbi', 'Kancheepuram': 'Kanchipuram', 'Viluppuram': 'Villupuram', 'Marmagao': 'Vasco Da Gama'}
SKIP = re.compile(r'court|college|collectorate|airport|university|secretariat|hospital|\binstitute\b|engineering|refinery|port trust|'
                  r'\bcamp\b|\bcantt\b|\bdairy\b|\bmills?\b|\bfactory\b|\bcolliery\b|\bproject\b|\bplant\b|\bestate office\b|'
                  r'\bbhawan\b|\bbhavan\b|\bassembly\b|\bhigh court\b|\bsachivalaya\b|\bvidhan\b|\braj bhavan\b|\bpolice\b|\bmilitary\b|'
                  r'\barmy\b|\bair force\b|\bnavy\b|\bnaval\b|\bbsf\b|\bcrpf\b|\bitbp\b|\bdefence\b|\bcampus\b|\bi\.?i\.?t\b|\bnit\b|\biisc\b|'
                  r'\bthermal\b|\bpower house\b|\bmines?\b|\bo\.?n\.?g\.?c\b|\bbhel\b|\bsail\b|\bhal\b|\bgpo extension\b|\bexchange\b|'
                  r'\bmarket yard\b|\bindustrial estate\b|\bphase\b|\bsector\b|\bpocket\b|\bblock\b', re.I)


def title(s):
    s = s.strip()
    if s.isupper() or s.islower():
        s = s.title()
    return s


def state_name(raw):
    raw = raw.strip()
    return STATE_FIX.get(raw, raw.title().replace('&', 'and'))


def clean_office(name):
    n = re.sub(r'\s+(S\.?\s?O|H\.?\s?O|B\.?\s?O|G\.?P\.?O\.?|GPO|M\.?D\.?G)\b.*$', '', name, flags=re.I)
    n = re.sub(r'\(.*?\)', '', n)          # "Puttur(D.K.)" -> "Puttur"
    n = re.sub(r'\b(G\.?P\.?O\.?|GPO)\b', '', n, flags=re.I)
    n = re.sub(r'[\d]+', '', n)
    n = re.sub(r'\s{2,}', ' ', n).strip(' .,-/')
    return title(n)


def slugify(s):
    s = s.lower().replace('&', ' and ')
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


rows = [r for r in csv.DictReader(open(SRC, encoding='utf-8', errors='replace')) if r['statename'].strip() not in ('', 'NULL')]

# ---- towns: sub offices and head offices, merged by cleaned name within a district ----
towns = collections.OrderedDict()
office_to_town = {}
for r in rows:
    if r['officeType'] not in ('S.O', 'H.O'):
        continue
    raw = r['officename'].strip()
    name = clean_office(raw)
    if len(name) < 3 or SKIP.search(raw):
        continue
    st = state_name(r['statename'])
    dist = title(re.sub(r'\(.*?\)', '', r['Districtname'])).strip()
    key = (name.lower(), dist.lower(), st)
    t = towns.get(key)
    if not t:
        t = towns[key] = {'n': name, 'd': dist, 'st': st, 't': set(), 'p': set(), 'v': set(), 'ho': False, 'offices': 0}
    taluk = r['Taluk'].strip()
    if taluk and taluk.upper() != 'NA':
        t['t'].add(title(taluk))
    t['p'].add(r['pincode'].strip())
    t['ho'] |= r['officeType'] == 'H.O'
    t['offices'] += 1
    office_to_town[raw.lower()] = key

# ---- villages served by each town's office ----
for r in rows:
    if not r['officeType'].startswith('B.O'):
        continue
    parent = (r['RelatedSuboffice'] if r['RelatedSuboffice'].strip() not in ('', 'NA') else r['RelatedHeadoffice']).strip().lower()
    key = office_to_town.get(parent)
    if not key:
        continue
    v = clean_office(r['officename'])
    if len(v) >= 3 and v.lower() != towns[key]['n'].lower():
        towns[key]['v'].add(v)
        towns[key]['p'].add(r['pincode'].strip())

# ---- big towns: list their own localities (other sub offices in the same taluk) ----
by_taluk = collections.defaultdict(list)
for k, t in towns.items():
    for tk in t['t']:
        by_taluk[(tk.lower(), t['d'].lower(), t['st'])].append(t)
for k, t in towns.items():
    if t['ho'] or t['n'].lower() in [x.lower() for x in t['t']]:
        for o in by_taluk.get((t['n'].lower(), t['d'].lower(), t['st']), []):
            if o is not t:
                t['v'].add(o['n']); t['p'] |= o['p']

# ---- well-known cities listed under another name or only as a district (Kolkata ...) ----
extra_alias = {}
if len(sys.argv) > 2:
    def norm(x): return re.sub(r'[^a-z]', '', x.lower())
    have = {(norm(t['n']), t['st']): t for t in towns.values()}
    for c in json.load(open(sys.argv[2], encoding='utf-8')):
        name = re.sub(r'\(.*?\)', '', c['name']).strip()
        if 'Urban Agglomeration' in c['name'] or not name:
            continue
        st = state_name(c['state'].upper()) if c['state'].upper() in STATE_FIX else c['state']
        look = CITY_RENAME.get(name, name)
        t = have.get((norm(look), st)) or have.get((norm(name), st))
        if t:
            if norm(name) != norm(t['n']):
                extra_alias[slugify(name)] = t
            continue
        match = [r for r in rows if state_name(r['statename']) == st and r['officeType'] in ('S.O', 'H.O') and
                 (norm(r['Taluk']) == norm(look) or norm(re.sub(r'\(.*?\)', '', r['Districtname'])) == norm(look))]
        if not match:
            continue
        dist = collections.Counter(title(re.sub(r'\(.*?\)', '', r['Districtname'])).strip() for r in match).most_common(1)[0][0]
        key = (name.lower(), dist.lower(), st)
        t = towns[key] = {'n': name, 'd': dist, 'st': st, 't': {title(look)}, 'p': set(), 'v': set(), 'ho': True, 'offices': len(match)}
        for r in match:
            t['p'].add(r['pincode'].strip())
            o = clean_office(r['officename'])
            if len(o) >= 3 and not SKIP.search(r['officename']):
                t['v'].add(o)
        have[(norm(name), st)] = t

# ---- aliases (Vitla, Mangaluru ...) ----
for t in towns.values():
    a = ALIAS.get((t['n'], t['d']))
    if a:
        t['alt'] = a[1] if a[1] != a[0] else None
        t['n'] = a[0]

# ---- slugs: bare name for the most important town with a name, others get the district ----
by_name = collections.defaultdict(list)
for k, t in towns.items():
    by_name[slugify(t['n'])].append(t)
for base, lst in by_name.items():
    lst.sort(key=lambda t: (not t['ho'], -t['offices'], -len(t['v'])))
    for i, t in enumerate(lst):
        t['s'] = base if i == 0 else f"{base}-{slugify(t['d'])}"
    seen = collections.Counter(t['s'] for t in lst)
    for t in lst:
        if seen[t['s']] > 1:
            t['s'] = f"{t['s']}-{slugify(t['st'])}"
    for t in lst:
        t['dup'] = len(lst) > 1

# ---- districts and states ----
states = collections.OrderedDict()
dist_count = collections.Counter((t['d'], t['st']) for t in towns.values())
dist_slug_base = collections.Counter(slugify(d) for d, _ in dist_count)
for (d, st), n in sorted(dist_count.items(), key=lambda x: (x[0][1], x[0][0])):
    s = states.setdefault(st, {'name': st, 'slug': slugify(st), 'districts': []})
    ds = slugify(d) + '-district'
    if dist_slug_base[slugify(d)] > 1:
        ds = f"{slugify(d)}-{slugify(st)}-district"
    s['districts'].append({'name': d, 'slug': ds, 'towns': n})

os.makedirs(os.path.join(OUT, 'states'), exist_ok=True)
index = {'states': [], 'towns': {}, 'aliases': {}, 'source': 'India Post all-India PIN code directory'}
for t in towns.values():
    if t.get('alt'):
        a = slugify(t['alt'])
        if a != t['s'] and a not in {x['s'] for x in towns.values()}:
            index['aliases'][a] = t['s']
for a, t in extra_alias.items():
    if a != t['s']:
        index['aliases'][a] = t['s']
for st, s in states.items():
    lang, cap, fest = STATE_INFO.get(st, ('Hindi and English', '', ['Diwali', 'Holi', 'Eid']))
    dslug = {d['name']: d['slug'] for d in s['districts']}
    out = []
    for t in towns.values():
        if t['st'] != st:
            continue
        rec = {'n': t['n'], 's': t['s'], 'd': dslug[t['d']], 'dn': t['d'], 't': sorted(t['t'])[:2], 'p': sorted(t['p']),
               'v': sorted(t['v'])[:60], 'vn': len(t['v']), 'ho': t['ho']}
        if t.get('alt'):
            rec['alt'] = t['alt']
        if t['dup']:
            rec['dup'] = 1
        out.append(rec)
        index['towns'][t['s']] = s['slug']
    out.sort(key=lambda r: r['n'])
    json.dump({'name': st, 'slug': s['slug'], 'lang': lang, 'capital': cap, 'festivals': fest,
               'districts': s['districts'], 'towns': out},
              open(os.path.join(OUT, 'states', s['slug'] + '.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    index['states'].append({'name': st, 'slug': s['slug'], 'districts': [{'name': d['name'], 'slug': d['slug'], 'towns': d['towns']} for d in s['districts']],
                            'towns': len(out)})
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
print('aliases', len(index['aliases']))
print('states', len(index['states']), 'districts', sum(len(s['districts']) for s in index['states']), 'towns', len(index['towns']))
