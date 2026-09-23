'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const policy = require('./policy.json');

const OPENAI_MODEL = process.env.OPENAI_DECISION_MODEL || 'gpt-5.6-terra';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_DECISION_MODEL || 'claude-sonnet-5';
const REPORT = process.env.AI_TRACKER_REPORT || 'ai-tracker-report.md';

function b64url(value) {
  const b = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function normalizeAction(v) {
  return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function validateRange(range) {
  const r = String(range || '').trim();
  if (!r || r.length > 160) return false;
  const bang = r.lastIndexOf('!');
  const a1 = bang >= 0 ? r.slice(bang + 1) : r;
  const m = a1.match(/^\$?[A-Z]{1,3}\$?(\d+):\$?[A-Z]{1,3}\$?(\d+)$/i);
  if (!m) return false;
  const start = Number(m[1]), end = Number(m[2]);
  return start >= 1 && end >= start && end <= Number(policy.maxEndRow || 500);
}
function parseRanges(raw) {
  const ranges = String(raw || '').split(';').map(s => s.trim()).filter(Boolean);
  if (!ranges.length) throw new Error('ROAMWISE_AI_SHEET_RANGES is required and must contain bounded A1 ranges.');
  if (ranges.length > Number(policy.maxRanges || 8)) throw new Error('Too many Sheet ranges requested.');
  for (const r of ranges) if (!validateRange(r)) throw new Error('Unsafe/unbounded Sheet range: ' + r);
  return ranges;
}
function secretHeader(name) {
  const n = String(name || '').trim().toLowerCase();
  return (policy.dropColumnsMatching || []).some(term => n.includes(String(term).toLowerCase()));
}
function redactScalar(value) {
  let s = String(value == null ? '' : value);
  s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '<email>');
  s = s.replace(/(?:\+?\d[\d ()-]{7,}\d)/g, '<phone>');
  return s.slice(0, 1000);
}
function rowsToObjects(values) {
  const cap = Number(policy.maxRowsSentPerRange || 200);
  const rows = Array.isArray(values) ? values.slice(0, cap + 1) : [];
  if (!rows.length) return [];
  const headers = (rows[0] || []).map((h, i) => String(h || ('Column_' + (i + 1))).trim().slice(0, 120));
  const keep = headers.map(h => !secretHeader(h));
  return rows.slice(1, cap + 1).map((row, rowIndex) => {
    const out = { _row: rowIndex + 2 };
    headers.forEach((h, i) => { if (keep[i]) out[h] = redactScalar((row || [])[i]); });
    return out;
  });
}
function sanitizeRanges(rangeValues) {
  return rangeValues.map(x => ({ range: x.range, rows: rowsToObjects(x.values || []) }));
}
function jwtForServiceAccount(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const input = header + '.' + claims;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(input);
  sign.end();
  return input + '.' + b64url(sign.sign(sa.private_key));
}
async function googleAccessToken(saJson) {
  let sa;
  try { sa = JSON.parse(saJson); } catch (e) { throw new Error('ROAMWISE_SHEETS_SERVICE_ACCOUNT_JSON is not valid JSON.'); }
  if (!sa.client_email || !sa.private_key) throw new Error('Google service-account JSON is missing client_email/private_key.');
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwtForServiceAccount(sa)
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error('Google OAuth failed: ' + (data.error_description || data.error || res.status));
  return data.access_token;
}
async function fetchSheetSnapshot(token, ranges) {
  const base = 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(policy.spreadsheetId);
  const metaRes = await fetch(base + '?fields=properties.title,sheets.properties', { headers: { authorization: 'Bearer ' + token } });
  const meta = await metaRes.json().catch(() => ({}));
  if (!metaRes.ok) throw new Error('Google Sheets metadata failed: ' + (meta.error && meta.error.message || metaRes.status));
  const rangeValues = [];
  for (const range of ranges) {
    const res = await fetch(base + '/values/' + encodeURIComponent(range) + '?majorDimension=ROWS', { headers: { authorization: 'Bearer ' + token } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('Google Sheets read failed for ' + range + ': ' + (data.error && data.error.message || res.status));
    rangeValues.push({ range, values: data.values || [] });
  }
  return {
    title: meta.properties && meta.properties.title || 'RoamWise tracker',
    ranges: sanitizeRanges(rangeValues)
  };
}
const SYSTEM = [
  'You are an operations reviewer for RoamWise. Use only the supplied sanitized tracker snapshot.',
  'Separate observed facts from interpretation. Do not invent missing values.',
  'Return JSON only with keys summary, priorities, followups, risks.',
  'Each priority/followup must contain record_id, action, reason, risk (low|medium|high), confidence (0..1), evidence (array).',
  'Allowed low-risk action names: follow_up, request_missing_information, flag_overdue, flag_duplicate, flag_price_discrepancy, move_to_review, draft_outreach, summarize_progress.',
  'Never recommend executing payments/refunds, changing bank/UPI, changing commission, signing contracts, firing/disciplining/hiring, changing production/credentials, deleting data or bulk-sending messages.',
  'For those consequential actions, use move_to_review instead.'
].join('\n');

function extractJson(text) {
  const raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(raw); } catch (e) {}
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a >= 0 && b > a) return JSON.parse(raw.slice(a, b + 1));
  throw new Error('Model did not return parseable JSON.');
}
function openAIText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  const out = [];
  for (const item of data.output || []) for (const c of item.content || []) if (typeof c.text === 'string') out.push(c.text);
  return out.join('\n');
}
async function callOpenAI(snapshot) {
  if (!process.env.OPENAI_API_KEY) return { provider: 'OpenAI', configured: false, error: 'OPENAI_API_KEY not configured.' };
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: SYSTEM + '\n\nTRACKER SNAPSHOT:\n' + JSON.stringify(snapshot),
      max_output_tokens: 2600
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { provider: 'OpenAI', configured: true, error: data.error && data.error.message || ('HTTP ' + res.status) };
  try { return { provider: 'OpenAI', configured: true, model: OPENAI_MODEL, result: extractJson(openAIText(data)) }; }
  catch (e) { return { provider: 'OpenAI', configured: true, model: OPENAI_MODEL, error: e.message }; }
}
async function callClaude(snapshot) {
  if (!process.env.ANTHROPIC_API_KEY) return { provider: 'Claude', configured: false, error: 'ANTHROPIC_API_KEY not configured.' };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2600,
      system: SYSTEM,
      messages: [{ role: 'user', content: 'TRACKER SNAPSHOT:\n' + JSON.stringify(snapshot) }]
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { provider: 'Claude', configured: true, error: data.error && data.error.message || ('HTTP ' + res.status) };
  const text = (data.content || []).filter(x => x && x.type === 'text').map(x => x.text).join('\n');
  try { return { provider: 'Claude', configured: true, model: ANTHROPIC_MODEL, result: extractJson(text) }; }
  catch (e) { return { provider: 'Claude', configured: true, model: ANTHROPIC_MODEL, error: e.message }; }
}
function recommendations(model) {
  if (!model || !model.result) return [];
  return []
    .concat(Array.isArray(model.result.priorities) ? model.result.priorities : [])
    .concat(Array.isArray(model.result.followups) ? model.result.followups : [])
    .map(x => ({
      record_id: String(x.record_id || '').slice(0, 180),
      action: normalizeAction(x.action),
      reason: String(x.reason || '').slice(0, 800),
      risk: String(x.risk || 'medium').toLowerCase(),
      confidence: Math.max(0, Math.min(1, Number(x.confidence || 0))),
      evidence: Array.isArray(x.evidence) ? x.evidence.slice(0, 5).map(v => String(v).slice(0, 300)) : []
    }))
    .filter(x => x.record_id && x.action);
}
function consensus(openai, claude) {
  const a = recommendations(openai), b = recommendations(claude);
  const allowed = new Set(policy.autoEligibleActions || []);
  const out = [];
  for (const x of a) {
    const y = b.find(v => v.record_id === x.record_id && v.action === x.action);
    if (!y || x.risk !== 'low' || y.risk !== 'low') continue;
    if (x.confidence < policy.consensusConfidence || y.confidence < policy.consensusConfidence) continue;
    if (!allowed.has(x.action)) continue;
    out.push({
      record_id: x.record_id,
      action: x.action,
      confidence: Math.min(x.confidence, y.confidence),
      reason: x.reason,
      evidence: [...new Set(x.evidence.concat(y.evidence))].slice(0, 6)
    });
  }
  return out;
}
function founderReview(openai, claude) {
  const allowed = new Set(policy.autoEligibleActions || []);
  const items = recommendations(openai).concat(recommendations(claude));
  const seen = new Set(), out = [];
  for (const x of items) {
    const key = x.record_id + '|' + x.action;
    if (seen.has(key)) continue;
    seen.add(key);
    if (x.risk !== 'low' || !allowed.has(x.action) || x.confidence < policy.consensusConfidence) out.push(x);
  }
  return out.slice(0, 30);
}
function mdEscape(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
function sectionForModel(m) {
  if (!m || !m.configured) return '_Not configured._';
  if (m.error) return '**Error:** ' + mdEscape(m.error);
  const r = m.result || {};
  let s = '**Summary:** ' + mdEscape(r.summary || 'No summary.') + '\n\n';
  const recs = recommendations(m).slice(0, 20);
  if (!recs.length) return s + '_No actionable recommendations returned._';
  s += '| Record | Action | Risk | Confidence | Reason |\n|---|---|---:|---:|---|\n';
  for (const x of recs) s += '| ' + mdEscape(x.record_id) + ' | ' + mdEscape(x.action) + ' | ' + mdEscape(x.risk) + ' | ' + Math.round(x.confidence * 100) + '% | ' + mdEscape(x.reason) + ' |\n';
  return s;
}
function buildReport(snapshot, openai, claude) {
  const con = consensus(openai, claude), review = founderReview(openai, claude);
  const ranges = snapshot.ranges.map(x => x.range + ' (' + x.rows.length + ' sanitized rows)').join(', ');
  let md = '# RoamWise AI Tracker Review\n\n';
  md += '> Report-only pilot. No Sheet cells, messages, payments, contracts, staff status or production systems were changed.\n\n';
  md += '- **Tracker:** ' + mdEscape(snapshot.title) + '\n';
  md += '- **Ranges:** ' + mdEscape(ranges) + '\n';
  md += '- **Generated:** ' + new Date().toISOString() + '\n\n';
  md += '## OpenAI operator review\n\n' + sectionForModel(openai) + '\n\n';
  md += '## Claude reviewer\n\n' + sectionForModel(claude) + '\n\n';
  md += '## Consensus low-risk / auto-eligible\n\n';
  if (!con.length) md += '_No two-model consensus actions met the policy threshold._\n\n';
  else {
    md += '| Record | Action | Confidence | Reason |\n|---|---|---:|---|\n';
    for (const x of con) md += '| ' + mdEscape(x.record_id) + ' | ' + mdEscape(x.action) + ' | ' + Math.round(x.confidence * 100) + '% | ' + mdEscape(x.reason) + ' |\n';
    md += '\n**Important:** auto-eligible means policy-safe for a future controlled write-back. V1 still does not execute it.\n\n';
  }
  md += '## Founder review queue\n\n';
  if (!review.length) md += '_No additional review items were produced._\n';
  else {
    md += '| Record | Action | Risk | Confidence | Reason |\n|---|---|---:|---:|---|\n';
    for (const x of review) md += '| ' + mdEscape(x.record_id) + ' | ' + mdEscape(x.action) + ' | ' + mdEscape(x.risk) + ' | ' + Math.round(x.confidence * 100) + '% | ' + mdEscape(x.reason) + ' |\n';
  }
  md += '\n## Guardrails\n\nPayments/refunds, bank or UPI changes, commission, contracts/MOUs, legal commitments, employee consequences, production/credentials, deletion and bulk external outreach require founder review by policy.\n';
  return md;
}
async function main() {
  const ranges = parseRanges(process.env.ROAMWISE_AI_SHEET_RANGES);
  if (!process.env.ROAMWISE_SHEETS_SERVICE_ACCOUNT_JSON) throw new Error('ROAMWISE_SHEETS_SERVICE_ACCOUNT_JSON is required.');
  const token = await googleAccessToken(process.env.ROAMWISE_SHEETS_SERVICE_ACCOUNT_JSON);
  const snapshot = await fetchSheetSnapshot(token, ranges);
  const [openai, claude] = await Promise.all([callOpenAI(snapshot), callClaude(snapshot)]);
  fs.writeFileSync(REPORT, buildReport(snapshot, openai, claude), 'utf8');
  process.stdout.write('AI tracker review complete. Ranges read: ' + snapshot.ranges.length + '. Report: ' + REPORT + '\n');
}
if (require.main === module) {
  main().catch(err => { console.error('[ai-tracker] ' + err.message); process.exitCode = 1; });
}
module.exports = {
  validateRange, parseRanges, secretHeader, redactScalar, rowsToObjects, sanitizeRanges,
  normalizeAction, recommendations, consensus, founderReview, buildReport
};
