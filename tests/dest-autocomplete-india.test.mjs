// Issue tracker #8 (26 Nov 2026): popular Indian places were missing from destination suggestions
// while typing ("Bang" -> no Bangalore, "Kain" -> no Kainchi Dham). The local list now includes
// RW_PLACE_OVERRIDES plus big names, ranked by prefix.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function boot() {
  const nodes = {};
  const mk = (id) => ({ id, value: '', children: [], innerHTML: '', classList: { add() {}, remove() {} },
    listeners: {}, addEventListener(t, f) { this.listeners[t] = f; }, appendChild(c) { this.children.push(c); },
    querySelectorAll() { return this.children; } });
  nodes.destInput = mk('destInput'); nodes.destDD = mk('destDD');
  Object.defineProperty(nodes.destDD, 'innerHTML', { set() { nodes.destDD.children = []; }, get() { return ''; } });
  const ctx = { console, setTimeout: () => 0, clearTimeout() {}, fetch: () => new Promise(() => {}),
    document: { createElement: () => ({ className: '', innerHTML: '', get textContent() { return this.innerHTML.replace(/<[^>]+>/g, ''); } }) } };
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of ['js/data/destinations.js', 'js/data/country-info.js', 'js/data/place-overrides.js', 'js/ui/dest-autocomplete.js'])
    vm.runInContext(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'), ctx);
  ctx.el = (id) => nodes[id];
  vm.runInContext('rwInitDestAutocomplete()', ctx);
  return (q) => { nodes.destInput.value = q; nodes.destInput.listeners.input(); return nodes.destDD.children.map((c) => c.textContent); };
}

test('partial names suggest popular Indian places', () => {
  const type = boot();
  for (const [q, want] of [['Bang', 'Bengaluru'], ['Hyde', 'Hyderabad'], ['Muss', 'Mussoorie'], ['Kain', 'Kainchi Dham'],
    ['Keda', 'Kedarnath'], ['Lona', 'Lonavala'], ['Gulm', 'Gulmarg'], ['Nain', 'Nainital'], ['Alm', 'Almora'], ['Ooty', 'Ooty']]) {
    const got = type(q);
    assert.ok(got.some((t) => t.includes(want)), `${q} -> ${JSON.stringify(got)}`);
  }
});
test('prefix matches rank first and the list stays short', () => {
  const type = boot();
  const got = type('Shim');
  assert.match(got[0], /Shimla/);
  assert.ok(got.length <= 10);
});
