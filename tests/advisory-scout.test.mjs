// Daily Uttarakhand news scout: parsing, validation and the AUTO-SCOUT block rewrite.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as S from '../tools/advisory-scout/scout-core.mjs';

const require = createRequire(import.meta.url);
const { rwUkRegionsForText } = require('../features/travel-safety/data/places.js');
const NOW = Date.parse('2026-10-30T03:00:00Z');
const TODAY = '2026-10-30';

const RSS = `<?xml version="1.0"?><rss><channel><title>x</title>
<item><title>Landslide shuts Almora-Bageshwar road near Takula - Amar Ujala</title><link>https://news.google.com/rss/articles/AAA</link><pubDate>Thu, 29 Oct 2026 10:00:00 GMT</pubDate><source url="https://amarujala.com">Amar Ujala</source></item>
<item><title>Landslide shuts Almora-Bageshwar road near Takula - Amar Ujala</title><link>https://news.google.com/rss/articles/AAA2</link><pubDate>Thu, 29 Oct 2026 11:00:00 GMT</pubDate><source url="https://amarujala.com">Amar Ujala</source></item>
<item><title>Old story &amp; more</title><link>https://news.google.com/rss/articles/OLD</link><pubDate>Mon, 12 Oct 2026 10:00:00 GMT</pubDate><source url="https://x">X</source></item>
<item><title>No date</title><link>https://news.google.com/rss/articles/ND</link><source url="https://x">X</source></item>
<item><title><![CDATA[Snow closes Gunji road ahead of Adi Kailash season end]]></title><link>https://news.google.com/rss/articles/BBB</link><pubDate>Fri, 30 Oct 2026 01:00:00 GMT</pubDate><source url="https://tribune">The Tribune</source></item>
</channel></rss>`;

test('rss: parse, drop undated, keep recent unique headlines', () => {
  const all = S.parseRss(RSS);
  assert.equal(all.length, 4);
  assert.equal(all[0].source, 'Amar Ujala');
  assert.equal(all[3].title, 'Snow closes Gunji road ahead of Adi Kailash season end');
  const rec = S.recent(all, NOW, 48);
  assert.deepEqual(rec.map((h) => h.url), ['https://news.google.com/rss/articles/AAA', 'https://news.google.com/rss/articles/BBB']);
});

test('prompt and model reply parsing', () => {
  const h = S.recent(S.parseRss(RSS), NOW, 48);
  const p = S.buildPrompt(h, TODAY, ['almora', 'gunji']);
  assert.match(p, /\[0\] 2026-10-29 · Amar Ujala/);
  assert.match(p, /JSON array only/);
  assert.deepEqual(S.parseModelJson('```json\n[{"headline":0}]\n```'), [{ headline: 0 }]);
  assert.deepEqual(S.parseModelJson('nothing here'), []);
  assert.deepEqual(S.parseModelJson('[broken'), []);
});

test('validate: cites a real headline, known region, bounded dates, never official, no duplicates', () => {
  const h = S.recent(S.parseRss(RSS), NOW, 48);
  const existing = [{ id: 'manual-gunji', kind: 'snow', title: 'Snow closes Gunji road before Adi Kailash season end', match: ['gunji'], until: '2026-11-10', sourceUrl: 'https://x' }];
  const props = [
    { headline: 0, kind: 'road', title: 'Almora–Bageshwar road shut by landslide near Takula', detail: 'Use the Kausani route or wait for the PWD to clear it; check before leaving.', places: ['almora', 'takula'], from: '2026-10-29', until: '2027-03-01' },
    { headline: 1, kind: 'snow', title: 'Snow closes Gunji road ahead of Adi Kailash season end', detail: 'Vehicles are stopped beyond Dharchula; confirm with the SDM office before travelling.', places: ['gunji'] },
    { headline: 9, kind: 'road', title: 'Invented headline that was never fetched', detail: 'This should never be accepted because it cites nothing real.', places: ['almora'] },
    { headline: 0, kind: 'road', title: 'Something in Shimla closed today', detail: 'This is not Uttarakhand and should be rejected for that reason.', places: ['shimla'] },
    { headline: 0, kind: 'riot', title: 'Unknown kind of advisory here', detail: 'Rejected because the kind is not in the allowed list at all.', places: ['almora'] },
  ];
  const { accepted, reasons } = S.validate(props, h, existing, TODAY, rwUkRegionsForText);
  assert.equal(accepted.length, 1);
  const a = accepted[0];
  assert.equal(a.official, false);
  assert.equal(a.auto, true);
  assert.equal(a.sourceUrl, 'https://news.google.com/rss/articles/AAA');
  assert.equal(a.until, '2026-11-20', 'capped at 21 days');
  assert.match(a.id, /^auto-20261029-almora/);
  assert.equal(reasons.length, 4);
  assert.ok(reasons.some((r) => /duplicate of manual-gunji/.test(r)));
});

test('merge prunes expired auto items and caps the total', () => {
  const cur = [{ id: 'auto-old', until: '2026-10-20' }, { id: 'auto-live', until: '2026-11-05' }];
  const { items, pruned } = S.mergeAuto(cur, [{ id: 'auto-new', until: '2026-11-02' }], TODAY);
  assert.deepEqual(items.map((x) => x.id), ['auto-new', 'auto-live']);
  assert.equal(pruned, 1);
  const many = Array.from({ length: 40 }, (_, i) => ({ id: 'a' + i, until: '2026-11-30' }));
  assert.equal(S.mergeAuto(many, [], TODAY).items.length, S.MAX_AUTO);
});

test('block rewrite keeps conditions-data.js valid and loadable everywhere', () => {
  const src = fs.readFileSync('conditions-data.js', 'utf8');
  const item = { id: 'auto-20261029-x', kind: 'road', official: false, auto: true, match: ['almora'], title: 'Road "shut" </script>', detail: 'd', from: '2026-10-29', until: '2026-11-01', source: 'S', sourceUrl: 'https://news.google.com/x', checkedAt: TODAY };
  const next = S.setChecked(S.writeBlock(src, [item]), '2026-10-31');
  assert.match(next, /RW_CONDITIONS_CHECKED = '2026-10-31'/);
  const sb = { window: {} }; vm.createContext(sb);
  vm.runInContext(next, sb);
  const list = vm.runInContext('RW_CONDITIONS', sb);
  assert.equal(list[list.length - 1].id, 'auto-20261029-x');
  assert.equal(list[list.length - 1].title, 'Road "shut" </script>');
  assert.equal(S.writeBlock(S.writeBlock(src, [item]), []), src, 'emptying the block restores the original');
  assert.throws(() => S.writeBlock('var x = [];', []), /markers missing/);
});

test('no-AI fallback: only English headlines with a known place and a clear impact', () => {
  const { RW_UK_REGIONS } = require('../features/travel-safety/data/places.js');
  const words = RW_UK_REGIONS.flatMap((r) => r.words);
  const mk = (title) => ({ title, url: 'https://news.google.com/rss/articles/' + title.length, source: 'ANI', published: '2026-10-30T03:00:00.000Z' });
  const h = [
    mk("Kedarnath Dham receives season's first heavy snowfall; temperatures plummet - ANI News"),
    mk('Landslide blocks Almora-Bageshwar road near Takula - Amar Ujala'),
    mk('Coonoor hill road closed after landslide - The Hindu'),
    mk('SRM Contractors secures contract for Almora road - Megaproject'),
    mk('Uttarakhand shivers amid snowfall - Revoi'),
    mk('लखनपुर में पहाड़ी से गिरीं चट्टानें, आदि कैलाश मार्ग बंद'),
    mk('Nainital hosts a book fair this weekend'),
  ];
  const props = S.ruleProposals(h, words);
  assert.deepEqual(props.map((p) => [p.headline, p.kind]), [[0, 'snow'], [1, 'road']]);
  assert.match(props[1].detail, /Check with local police/);
  assert.equal(props[1].until, '2026-11-01');
  const { accepted } = S.validate(props.concat([{ ...props[0], headline: 0 }]), h, [], TODAY, rwUkRegionsForText);
  assert.equal(accepted.length, 2, 'one auto advisory per kind and region');
});
