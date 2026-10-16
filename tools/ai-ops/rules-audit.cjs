#!/usr/bin/env node
'use strict';
/* Firestore rules autopilot (offline, no emulator, no network).
   Finds drift between what the code does and what firestore.rules allows:
     1. client collections with no `match` in the rules (the request is denied by default)
     2. track('event') names missing from statsKeys() (the counter write is denied)
     3. statsKeys() entries with no matching statsBump() (that counter could be tampered with)
     4. open writes (`allow write|create|update ...: if true`)
     5. basic hygiene (brace balance, file size vs the 256 KB limit)
   Known, accepted findings live in tools/ai-ops/rules-audit.baseline.json, so only NEW drift
   fails. Usage: node tools/ai-ops/rules-audit.cjs [--md] [--update-baseline]
   Exit 1 on any new error. Warnings never fail. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const SKIP = new Set(['node_modules', '.git', 'worker', 'tests', 'tools', 'dist', 'lite', 'android', 'ios', 'itinerary-library']);

function walk(dir, out){
  for(const e of fs.readdirSync(dir, { withFileTypes: true })){
    if(SKIP.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if(e.isDirectory()) walk(p, out);
    else if(/\.(js|html|mjs)$/.test(e.name) && !/\.min\.js$/.test(e.name)) out.push(p);
  }
  return out;
}

function audit(rulesText, files){
  const findings = [];
  const add = (level, id, msg) => findings.push({ level, id, msg });

  /* hygiene */
  const opens = (rulesText.match(/\{/g) || []).length, closes = (rulesText.match(/\}/g) || []).length;
  if(opens !== closes) add('error', 'braces', 'Unbalanced braces in firestore.rules: ' + opens + ' { vs ' + closes + ' }');
  const kb = Buffer.byteLength(rulesText) / 1024;
  if(kb > 200) add('warn', 'size', 'firestore.rules is ' + kb.toFixed(0) + ' KB; the hard limit is 256 KB.');

  /* 4. open writes */
  const code = rulesText.replace(/\/\/.*$/gm, '');
  const re = /allow\s+([a-z, ]*?(?:write|create|update|delete)[a-z, ]*?)\s*:\s*if\s+true\s*;/g;
  let m;
  while((m = re.exec(code)) !== null){
    const before = code.slice(0, m.index), mm = [...before.matchAll(/match\s+(\/[^\s{/]+(?:\/\{[^}]+\})?)\s*\{/g)].pop();
    add('error', 'open-write:' + (mm ? mm[1] : '?') + ':' + m[1].replace(/\s+/g, ''), 'Anyone can ' + m[1].trim() + ' at ' + (mm ? mm[1] : 'an unknown path') + ' (allow ... if true).');
  }

  /* 1. collections used by clients vs matched in rules */
  const matched = new Set([...code.matchAll(/match\s+\/([A-Za-z0-9_]+)\b/g)].map(x => x[1]));
  const used = new Map();
  for(const f of files){
    const txt = fs.readFileSync(f, 'utf8');
    for(const x of txt.matchAll(/(?:\b(?:db|DB|database)|firestore\(\))\s*\.collection\(\s*['"]([A-Za-z0-9_]+)['"]\s*\)/g)){
      if(!used.has(x[1])) used.set(x[1], path.relative(root, f));
    }
  }
  for(const [c, f] of [...used].sort()){
    if(!matched.has(c)) add('error', 'no-rule:' + c, 'Collection "' + c + '" is used by client code (' + f + ') but firestore.rules has no match for it, so every read/write is denied.');
  }

  /* 2 + 3. stats counters */
  const keysM = rulesText.match(/function\s+statsKeys\(\)\s*\{\s*return\s*\[([\s\S]*?)\]\s*;/);
  const keys = keysM ? [...keysM[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
  const bumps = new Set([...code.matchAll(/statsBump\(\s*'([^']+)'\s*\)/g)].map(x => x[1]));
  if(!keys.length) add('warn', 'stats-keys', 'Could not read statsKeys() from the rules; stats checks skipped.');
  for(const k of keys) if(!bumps.has(k)) add('error', 'stats-nobump:' + k, 'Counter "' + k + '" is in statsKeys() but has no statsBump() line, so a client could set it to any value.');
  const tracked = new Map();
  for(const f of files){
    const txt = fs.readFileSync(f, 'utf8');
    for(const x of txt.matchAll(/\btrack\(\s*['"]([A-Za-z0-9_]+)['"]\s*[,)]/g)){
      if(!tracked.has(x[1])) tracked.set(x[1], path.relative(root, f));
    }
  }
  if(keys.length) for(const [ev, f] of [...tracked].sort()){
    if(!keys.includes(ev)) add('warn', 'stats-unknown:' + ev, 'track("' + ev + '") in ' + f + ' is not in statsKeys(), so that counter write is denied.');
  }
  return findings;
}

function main(){
  const args = process.argv.slice(2);
  const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  const findings = audit(rules, walk(root, []));
  const basePath = path.join(__dirname, 'rules-audit.baseline.json');
  if(args.includes('--update-baseline')){
    fs.writeFileSync(basePath, JSON.stringify({ accepted: findings.map(f => f.id).sort() }, null, 2) + '\n');
    console.log('Baseline updated with ' + findings.length + ' accepted finding(s).'); return;
  }
  let accepted = new Set();
  try{ accepted = new Set(JSON.parse(fs.readFileSync(basePath, 'utf8')).accepted || []); }catch(e){ /* no baseline yet */ }
  const fresh = findings.filter(f => !accepted.has(f.id));
  const errors = fresh.filter(f => f.level === 'error'), warns = fresh.filter(f => f.level === 'warn');
  if(args.includes('--md')){
    const lines = ['# Firestore rules audit', '', errors.length || warns.length ? '**New drift found.**' : 'No new drift. (' + findings.length + ' known item(s) in the baseline.)', ''];
    for(const f of errors) lines.push('- ❌ ' + f.msg);
    for(const f of warns) lines.push('- ⚠️ ' + f.msg);
    lines.push('', 'Fix the rule or the code, or if it is intentional run `node tools/ai-ops/rules-audit.cjs --update-baseline` and commit.');
    console.log(lines.join('\n'));
  }else{
    for(const f of errors) console.log('ERROR  ' + f.msg);
    for(const f of warns) console.log('WARN   ' + f.msg);
    console.log('rules-audit: ' + errors.length + ' new error(s), ' + warns.length + ' new warning(s), ' + (findings.length - fresh.length) + ' accepted in baseline.');
  }
  process.exit(errors.length ? 1 : 0);
}
if(require.main === module) main();
module.exports = { audit };
