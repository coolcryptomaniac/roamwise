import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('registry invite links prefill only empty fields, keep a fixed type list and are tagged as nidhi invites', async () => {
  const html = await readFile(new URL('../partner/join/index.html', import.meta.url), 'utf8');
  assert.match(html, /params\.get\('source'\)==='nidhi'/);
  assert.match(html, /if\(v&&\$\(k\)&&!\$\(k\)\.value\)\$\(k\)\.value=v/);
  assert.match(html, /\['Family homestay','Hotel \/ resort','Boutique stay','Hostel','Villa','Other stay'\]\.indexOf\(ty\)>=0/);
  assert.match(html, /'nidhi-invite'/);
  assert.match(html, /please check them/);
});
