import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Guards the real routing regression: the broad stay/ handler previously
// swallowed POST /stay/lead and returned 404, silently losing enquiries.
test('exact stay/lead route must precede stay/ prefix handler', () => {
  const source = readFileSync(new URL('../worker/worker.js', import.meta.url), 'utf8');
  const exact = source.indexOf("if(path === 'stay/lead') return handleStayLead(request, env);");
  const prefix = source.indexOf("if(path.indexOf('stay/') === 0) return handleStay(request, env, path);");
  assert.ok(exact > -1, 'stay/lead route is registered');
  assert.ok(prefix > -1, 'generic stay/ prefix is registered');
  assert.ok(exact < prefix, 'specific stay/lead route MUST be earlier than generic stay/');
  assert.equal(source.split("if(path === 'stay/lead')").length - 1, 1, 'exact route is unique');
});
