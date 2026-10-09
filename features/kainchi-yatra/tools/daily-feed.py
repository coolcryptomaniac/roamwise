#!/usr/bin/env python3
"""Bounded public-source collector. Headlines are reading leads, never inferred road orders."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser
import json
import gzip
from pathlib import Path
import re
from urllib.parse import urljoin, urlparse, urlunparse, parse_qsl, urlencode
import urllib.request
import xml.etree.ElementTree as ET

FEATURE = Path(__file__).resolve().parents[1]
SOURCES = json.loads((FEATURE / 'tools/sources.json').read_text())
RELEVANT = re.compile(r'kainchi|kaichi|कैंची|कैची|bhowali|भवाली|bhimtal|भीमताल|nainital.{0,40}traffic|नैनीताल.{0,40}यातायात', re.I)
LIMIT = 1500000


def iso(value):
    return value.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def parsed_date(value, now):
    if not isinstance(value, str):
        return None
    try:
        d = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        try:
            d = parsedate_to_datetime(value)
        except (ValueError, TypeError, OverflowError):
            return None
    if d.tzinfo is None:
        return None
    return d if now - timedelta(days=30) <= d <= now else None


def url_safe(value, base=None):
    try:
        u = urlparse(urljoin(base, value) if base else value)
        if u.scheme != 'https' or not u.hostname or u.username or u.password:
            return None
        params = [(k, v) for k, v in parse_qsl(u.query) if not k.startswith('utm_')]
        return urlunparse(u._replace(fragment='', query=urlencode(params)))
    except (ValueError, TypeError):
        return None


def clean(value):
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', value or ''))).strip()[:240]


class AllowedRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Prevent upstream redirects from expanding collection to arbitrary hosts.
        if urlparse(newurl).hostname != urlparse(req.full_url).hostname or not url_safe(newurl):
            raise ValueError('Cross-host redirect rejected')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'RoamWise-Kainchi/1.0 (+https://roamwise.co.in/kainchi/)', 'Accept': 'text/html,application/rss+xml,application/xml'})
    with urllib.request.build_opener(AllowedRedirects).open(request, timeout=12) as response:
        raw = response.read(LIMIT + 1)
        if len(raw) > LIMIT:
            raise ValueError('Source too large')
        return raw.decode('utf-8', errors='replace')


def parse_rss(text, source, now):
    if '<!DOCTYPE' in text.upper() or '<!ENTITY' in text.upper():
        raise ValueError('XML entities are not accepted')
    tree = ET.fromstring(text)
    if tree.tag not in ('rss', '{http://www.w3.org/2005/Atom}feed'):
        raise ValueError('Not a feed')
    records = []
    for item in tree.findall('.//item')[:150]:
        title = clean(item.findtext('title'))
        url = url_safe(item.findtext('link'))
        date = parsed_date(item.findtext('pubDate'), now)
        if not title or not url or not date or not RELEVANT.search(title):
            continue
        if source['kind'] == 'official' and urlparse(url).hostname != urlparse(source['url']).hostname:
            continue
        records.append({'sourceId': source['id'], 'title': title, 'url': url, 'publishedAt': iso(date),
                        'kind': source['kind'], 'publisher': clean(item.findtext('source') or source['name'])[:80]})
    return records


class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.current = None; self.title = ''; self.in_title = False; self.published = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.current = [attrs['href'], '']
        if tag == 'title':
            self.in_title = True
        if tag == 'meta' and attrs.get('property') == 'article:published_time':
            self.published = attrs.get('content')
        if tag == 'time' and not self.published:
            self.published = attrs.get('datetime')
    def handle_data(self, text):
        if self.current is not None:
            self.current[1] += text
        if self.in_title:
            self.title += text
    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.links.append(self.current); self.current = None
        if tag == 'title':
            self.in_title = False


def parse_official(text, source, now, read=fetch):
    page = Page(); page.feed(text)
    if not page.title or re.search(r'access denied|just a moment|captcha|bad gateway|unavailable', page.title, re.I):
        raise ValueError('Official page unavailable')
    records = []; attempts = 0
    for path, title in page.links:
        url = url_safe(path, source['url'])
        if not url or not RELEVANT.search(clean(title)):
            continue
        if urlparse(url).hostname != urlparse(source['url']).hostname:
            continue
        # Only dated notices, not tourist listings, directories or social profile links.
        if not re.search(r'/(notice|press-release|news|announcement)/', urlparse(url).path):
            continue
        attempts += 1
        detail = Page(); detail.feed(read(url))
        date = parsed_date(detail.published, now)
        if date:
            records.append({'sourceId': source['id'], 'title': clean(title), 'url': url,
                            'publishedAt': iso(date), 'kind': 'official', 'publisher': source['name']})
        if attempts >= 3:
            break
    return records


def collect(previous, now, read=fetch):
    previous = previous if isinstance(previous, dict) else {}
    old_sources = {s.get('id'): s for s in previous.get('sources', []) if isinstance(s, dict)}
    def check(source):
        status = {k: source[k] for k in ('id', 'name', 'url')}
        old = old_sources.get(source['id'], {})
        status['lastSuccessAt'] = old.get('lastSuccessAt')
        if source['format'] == 'manual':
            status.update(status='manual', checkedAt=None)
            return status, []
        status['checkedAt'] = iso(now)
        try:
            raw = read(source['fetchUrl'])
            rows = parse_rss(raw, source, now) if source['format'] == 'rss' else parse_official(raw, source, now, read)
            status.update(status='ok', lastSuccessAt=iso(now))
            return status, rows
        except Exception as exc:
            status.update(status='error', error=type(exc).__name__)
            # A failed request must not erase the last dated headlines or advance their timestamps.
            return status, [i for i in previous.get('items', []) if i.get('sourceId') == source['id']]
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, SOURCES))
    rows = [i for i in previous.get('items', []) if i.get('sourceId') == 'editorial']
    rows += [i for _, records in results for i in records]
    unique = {}
    for item in rows:
        date = parsed_date(item.get('publishedAt'), now); url = url_safe(item.get('url'))
        if date and url:
            item = dict(item, title=clean(item.get('title')), url=url, publishedAt=iso(date))
            unique[url] = item
    items = sorted(unique.values(), key=lambda i: i['publishedAt'], reverse=True)[:30]
    sources = [s for s, _ in results]
    day = now.astimezone(timezone(timedelta(hours=5, minutes=30))).date().isoformat()
    history = [h for h in previous.get('history', []) if h.get('date', '') < day][-29:]
    history.append({'date': day, 'headlines': len(items), 'sourcesOK': sum(s['status'] == 'ok' for s in sources),
                    'sourcesFailed': sum(s['status'] == 'error' for s in sources)})
    return {'version': 1, 'checkedAt': iso(now), 'items': items, 'sources': sources, 'history': history}


def write(snapshot, directory):
    directory.mkdir(parents=True, exist_ok=True)
    # Keep generated snapshots inside both the browser response and feature gzip budgets.
    while len(gzip.compress(json.dumps(snapshot, ensure_ascii=True).encode())) > 7000 and snapshot.get('items'):
        snapshot['items'].pop()
    (directory / 'daily.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    encoded = json.dumps(snapshot, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e')
    (directory / 'daily.js').write_text('/* Generated public-source snapshot. Never edit by hand. */\n(function(root){root.RWKainchiCore.daily=' + encoded + ';})(globalThis);\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--previous', type=Path, default=FEATURE / 'data/daily.json')
    parser.add_argument('--output', type=Path, default=FEATURE / 'data')
    args = parser.parse_args()
    previous = json.loads(args.previous.read_text()) if args.previous.exists() else {}
    result = collect(previous, datetime.now(timezone.utc))
    write(result, args.output)
    print(json.dumps({'checkedAt': result['checkedAt'], 'items': len(result['items']), 'sources': [{k: s[k] for k in ('id', 'status')} for s in result['sources']]}))
