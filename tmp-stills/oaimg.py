#!/usr/bin/env python3
"""Generate stills with the OpenAI Images API.
Usage: OPENAI_API_KEY=... python3 oaimg.py prompts.json outdir [quality]
prompts.json: [{"name": "10_bride", "prompt": "..."}]
The key is read from the environment only; it is never written to disk or logged."""
import base64, json, os, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

KEY = os.environ.get('OPENAI_API_KEY', '').strip()
MODELS = [m for m in os.environ.get('OAI_MODELS', 'gpt-image-2,gpt-image-1.5,gpt-image-1').split(',') if m]
spec, out = sys.argv[1], sys.argv[2]
quality = sys.argv[3] if len(sys.argv) > 3 else 'high'
os.makedirs(out, exist_ok=True)
ok_model = {'m': None}

def call(model, prompt):
    body = json.dumps({'model': model, 'prompt': prompt, 'size': '1536x1024', 'quality': quality, 'n': 1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=body,
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)

def one(item):
    path = os.path.join(out, item['name'] + '.png')
    if os.path.exists(path):
        return item['name'], 'exists'
    models = [ok_model['m']] if ok_model['m'] else MODELS
    last = ''
    for m in models:
        try:
            d = call(m, item['prompt'])
            open(path, 'wb').write(base64.b64decode(d['data'][0]['b64_json']))
            ok_model['m'] = m
            return item['name'], 'ok ' + m
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')[:300]
            last = f'{m} {e.code} {msg}'
            if e.code in (401, 429) and 'model' not in msg.lower():
                break
        except Exception as e:  # network
            last = f'{m} {e}'
    return item['name'], 'FAIL ' + last

if not KEY:
    sys.exit('OPENAI_API_KEY not set')
items = json.load(open(spec))
with ThreadPoolExecutor(5) as ex:
    for name, st in ex.map(one, items):
        print(name, st, flush=True)
