import importlib.util
from pathlib import Path
from datetime import datetime, timezone
import unittest
import tempfile
import json
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

if __name__ == '__main__': unittest.main()
