import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dir = new URL('../media/destinations/', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', dir), 'utf8'));
const FREE = /^(CC BY(-SA)? [234]\.[05]|CC0|Public domain|PD)$/;

test('every curated destination photo exists, is small and carries a free licence with credit', () => {
  assert.equal(manifest.version, 1);
  const withPhoto = Object.entries(manifest.assets).filter(([, a]) => a.src);
  assert.ok(withPhoto.length >= 100, 'expected 100+ curated photos');
  for (const [slug, a] of withPhoto) {
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(a.src, `/media/destinations/${slug}.webp`);
    const file = new URL(`${slug}.webp`, dir);
    assert.ok(fs.existsSync(file), `missing ${slug}.webp`);
    assert.ok(fs.statSync(file).size < 160 * 1024, `${slug}.webp is too large`);
    assert.match(a.license, FREE, `${slug} licence`);
    assert.ok(a.author && a.credit, `${slug} needs an author credit`);
    assert.match(a.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  }
});

test('the credits page lists every curated photo', () => {
  const html = fs.readFileSync(new URL('credits.html', dir), 'utf8');
  for (const a of Object.values(manifest.assets)) if (a.src) assert.ok(html.includes(a.name), `credits missing ${a.name}`);
});

test('the destination rail merges duplicate names and reads the curated manifest', () => {
  const js = fs.readFileSync(new URL('../js/ui/destination-rows.js', import.meta.url), 'utf8');
  for (const dup of ['coorg (kodagu)', 'coorg (madikeri)', 'alleppey (alappuzha)', 'mcleod ganj', 'new delhi']) assert.ok(js.includes(`'${dup}'`), dup);
  assert.ok(js.includes("/media/destinations/manifest.json"));
});

test('the AI model menu is moved out of the clipped writing box when opened', () => {
  const js = fs.readFileSync(new URL('../js/ui/tusk-composer.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../design/tusk-composer.css', import.meta.url), 'utf8');
  assert.ok(js.includes('document.body.appendChild(e.menu)'));
  assert.match(css, /\.rw-model-menu\{position:fixed;z-index:100003/);
});

test('the voice reply is a short natural summary, not the first 650 characters', () => {
  const js = fs.readFileSync(new URL('../js/voice/tusk-studio.js', import.meta.url), 'utf8');
  assert.ok(js.includes('spokenSummary(div,usable,raw)'));
  assert.ok(!js.includes('usable.slice(0,650)'));
  assert.ok(js.includes('<details class="rw-orb-more"><summary>⚙ Voice options</summary>'));
});
