import importlib.util
from pathlib import Path
from datetime import datetime, timezone
import unittest
import tempfile
import json
import gzip
import random
import string
spec = importlib.util.spec_from_file_location('daily_feed', Path(__file__).parents[1] / 'tools/daily-feed.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
NOW = datetime(2026, 10, 9, 8, tzinfo=timezone.utc)
SOURCE = dict(id='news-en', name='News', kind='news', url='https://news.google.com/')
RSS = '<rss><channel><item><title>Kainchi Dham traffic report</title><link>https://news.google.com/articles/1</link><pubDate>Fri, 09 Oct 2026 06:00:00 GMT</pubDate><source>Newsroom</source></item></channel></rss>'

class FeedTests(unittest.TestCase):
    def test_dates_and_links(self):
        self.assertEqual(len(m.parse_rss(RSS, SOURCE, NOW)), 1)
        self.assertEqual(m.parse_rss(RSS.replace('2026 06', '2027 06'), SOURCE, NOW), [])
        self.assertEqual(m.parse_rss(RSS.replace('https://news.google.com/articles/1','javascript:alert(1)'), SOURCE, NOW), [])
        self.assertEqual(m.parse_rss(RSS.replace('09 Oct','01 Sep'), SOURCE, NOW), [])
        self.assertIsNone(m.url_safe('https://u:secret@example.com/'))
    def test_wrong_feed_and_entities(self):
        with self.assertRaises(ValueError): m.parse_rss('<html>captcha</html>', SOURCE, NOW)
        with self.assertRaises(ValueError): m.parse_rss('<!DOCTYPE rss>'+RSS, SOURCE, NOW)
    def test_failures_retain_last_success_not_fake_new_timestamps(self):
        previous = {'items':m.parse_rss(RSS,SOURCE,NOW),'sources':[{'id':'news-en','lastSuccessAt':'2026-10-09T06:00:00Z'}]}
        def broken(url): raise TimeoutError('offline')
        result = m.collect(previous, NOW, broken)
        self.assertEqual(len(result['items']),1)
        source = next(s for s in result['sources'] if s['id']=='news-en')
        self.assertEqual(source['status'],'error')
        self.assertEqual(source['lastSuccessAt'],'2026-10-09T06:00:00Z')
        self.assertEqual(result['history'][-1]['sourcesFailed'],4)
    def test_html_requires_dated_notice_never_tourist_listing(self):
        source={'id':'district','url':'https://nainital.nic.in/','name':'District','kind':'official'}
        listing='<title>District</title><a href="/tourist-place/kainchi/">Kainchi Dham</a>'
        self.assertEqual(m.parse_official(listing,source,NOW),[])
        notice='<title>District</title><a href="/notice/kainchi/">Kainchi Dham</a>'
        self.assertEqual(m.parse_official(notice,source,NOW,lambda _: '<title>No date</title>'),[])
        rows=m.parse_official(notice,source,NOW,lambda _:'<meta property="article:published_time" content="2026-10-09T05:00:00+05:30">')
        self.assertEqual(len(rows),1)
    def test_snapshots_are_data_not_executable_markup(self):
        result={'version':1,'items':[{'title':'</script><script>alert(1)</script>\u2028'}],'sources':[]}
        with tempfile.TemporaryDirectory() as tmp:
            m.write(result,Path(tmp))
            script=(Path(tmp)/'daily.js').read_text()
            self.assertNotIn('<script>',script)
            self.assertEqual(json.loads((Path(tmp)/'daily.json').read_text()),result)
    def test_history_one_entry_per_ist_day(self):
        def read(url): return RSS if 'news.google' in url else '<title>District</title>'
        a=m.collect({},NOW,read); b=m.collect(a,NOW,read)
        self.assertEqual(len(b['history']),1)
        self.assertEqual(len(b['items']),1)

    def test_size_omissions_are_explicit_and_preserve_dates_failures_and_old_history(self):
        randomizer = random.Random(12)
        def token(size): return ''.join(randomizer.choices(string.ascii_letters + string.digits, k=size))
        items = [dict(title=token(240), url='https://news.google.com/articles/'+token(900),
                      publishedAt='2026-10-09T06:00:00Z', sourceId='news-en', kind='news') for _ in range(30)]
        older = dict(date='2026-10-08', headlines=25, sourcesOK=1, sourcesFailed=3)
        result = dict(version=1, checkedAt='2026-10-09T08:00:00Z', items=items,
                      sources=[dict(id='police', status='error', lastSuccessAt=None)],
                      history=[dict(older), dict(date='2026-10-09', headlines=30, sourcesOK=3, sourcesFailed=1)])
        with tempfile.TemporaryDirectory() as tmp:
            m.write(result,Path(tmp))
            saved=json.loads((Path(tmp)/'daily.json').read_text()); count=len(saved['items'])
            self.assertLess(count,30)
            self.assertEqual(saved['coverage'],dict(selectedHeadlines=30,retainedHeadlines=count,omittedHeadlines=30-count))
            self.assertEqual(saved['history'][0],older)
            self.assertEqual(saved['history'][-1]['headlines'],30)
            self.assertEqual(saved['history'][-1]['retainedHeadlines'],count)
            self.assertEqual(saved['history'][-1]['omittedHeadlines'],30-count)
            self.assertEqual(saved['sources'],result['sources'])
            self.assertEqual(saved['checkedAt'],'2026-10-09T08:00:00Z')
            self.assertTrue(all(i['publishedAt']=='2026-10-09T06:00:00Z' for i in saved['items']))
            self.assertLessEqual(len(gzip.compress(json.dumps(saved,ensure_ascii=True).encode())),7000)
            self.assertLess(len(gzip.compress((Path(tmp)/'daily.js').read_bytes())),7300)
            before=json.loads(json.dumps(saved))
            m.write(saved,Path(tmp)); self.assertEqual(json.loads((Path(tmp)/'daily.json').read_text()),before)

    def test_small_snapshot_reports_no_omission_and_does_not_rewrite_old_day(self):
        result=dict(version=1,checkedAt='2026-10-09T08:00:00Z',items=m.parse_rss(RSS,SOURCE,NOW),sources=[],
                    history=[dict(date='2026-10-08',headlines=20)])
        with tempfile.TemporaryDirectory() as tmp:
            m.write(result,Path(tmp))
            self.assertEqual(result['coverage'],dict(selectedHeadlines=1,retainedHeadlines=1,omittedHeadlines=0))
            self.assertEqual(result['history'],[dict(date='2026-10-08',headlines=20)])

if __name__ == '__main__': unittest.main()
