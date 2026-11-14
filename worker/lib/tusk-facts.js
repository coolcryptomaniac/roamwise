/* ============================================================================
   worker/lib/tusk-facts.js — ground Ailon Tusk in the verified facts pack
   ============================================================================
   matchFacts(prompt)   -> up to 2 verified items whose keywords appear
   factsBlock(items)    -> a short "verified facts" preamble for the model
   directFactAnswer()   -> deterministic answer (no model, no allowance) for
                           emergency/helpline questions
   guardAnswer(text)    -> mask phone numbers and links that are NOT in the
                           facts pack, so a model can never invent one
   Pure functions; no network, no storage. Named exports only. */
import { TUSK_FACTS } from '../data/tusk-facts.js';

const MAX_ITEMS = 2;
const day = (d) => (d instanceof Date ? d : new Date(d || Date.now())).toISOString().slice(0, 10);
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function liveItems(pack = TUSK_FACTS, now = new Date()){
  const today = day(now);
  return (pack.items || []).filter(it => !it.validUntil || it.validUntil >= today);
}

export function matchFacts(prompt, { pack = TUSK_FACTS, now = new Date() } = {}){
  const q = ' ' + String(prompt || '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, ' ') + ' ';
  const scored = [];
  for(const it of liveItems(pack, now)){
    let score = 0;
    for(const k of it.keys || []){
      const re = new RegExp('(^|\\s)' + esc(k.toLowerCase()) + '(\\s|$)');
      if(re.test(q)) score += k.includes(' ') ? 2 : 1;
    }
    if(score) scored.push({ it, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_ITEMS).map(s => s.it);
}

export function factsBlock(items, now = new Date()){
  if(!items || !items.length) return '';
  const lines = [`Today is ${day(now)}. RoamWise VERIFIED facts (use these over anything you remember; if the answer is not here, say you are not sure and name the official site):`];
  for(const it of items){
    lines.push(`# ${it.title} (checked ${it.checkedAt})`);
    for(const f of it.facts) lines.push('- ' + f);
  }
  return lines.join('\n').slice(0, 1800);
}

/* Short emergency questions get the verified list straight away: it is
   faster, costs nothing and cannot be wrong in the model's words. */
export function directFactAnswer(prompt, items){
  const it = (items || []).find(x => x.direct);
  if(!it || String(prompt || '').length > 160) return null;
  return { text: `${it.title}:\n` + it.facts.map(f => '• ' + f).join('\n'), factId: it.id, checkedAt: it.checkedAt };
}

/* ---- guard ------------------------------------------------------------- */
function digitsOf(s){ return String(s).replace(/\D/g, ''); }

export function allowedNumbers(pack = TUSK_FACTS){
  const set = new Set();
  for(const it of pack.items || []){
    for(const f of it.facts){
      for(const m of f.match(/\+?\d[\d\s-]{1,14}\d/g) || []){ const d = digitsOf(m); if(d.length >= 3) set.add(d); }
    }
  }
  return set;
}

export function allowedHosts(pack = TUSK_FACTS){
  const set = new Set(['roamwise.co.in']);
  for(const it of pack.items || []){
    for(const u of it.sources || []){ try{ set.add(new URL(u).hostname.replace(/^www\./, '')); }catch(e){} }
    for(const f of it.facts) for(const m of f.match(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:gov\.in|nic\.in|co\.in|org|in)\b/gi) || []) set.add(m.toLowerCase().replace(/^www\./, ''));
  }
  return set;
}

const NUM_NOTE = '(number not verified, check the official site)';
const LINK_NOTE = '(link not verified)';

export function guardAnswer(text, { pack = TUSK_FACTS } = {}){
  let out = String(text || '');
  const nums = allowedNumbers(pack), hosts = allowedHosts(pack);
  const hostOk = (h) => { h = h.toLowerCase().replace(/^www\./, ''); for(const a of hosts){ if(h === a || h.endsWith('.' + a)) return true; } return false; };
  // Links: full URLs and bare domains.
  out = out.replace(/\bhttps?:\/\/[^\s)<>\]]+/gi, (u) => { try{ return hostOk(new URL(u).hostname) ? u : LINK_NOTE; }catch(e){ return LINK_NOTE; } });
  out = out.replace(/\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|org|net|co|io|travel)\b(?:\/[^\s)]*)?/gi, (m) => {
    if(m.includes('(')) return m;
    const host = m.split('/')[0];
    return hostOk(host) ? m : LINK_NOTE;
  });
  // Phone numbers: 7+ digits, or 10-digit mobiles with +91 / spaces / dashes. Prices (₹, Rs) are left alone.
  out = out.replace(/(₹|rs\.?\s?|inr\s?)?(\+?\d[\d\s-]{5,16}\d)/gi, (m, cur, num) => {
    if(cur) return m;
    const d = digitsOf(num);
    if(d.length < 7) return m;
    if(/^\d{4}-\d{2}-\d{2}$/.test(num.trim()) || /^\d{4}\s?-\s?\d{2,4}$/.test(num.trim())) return m; // dates, year ranges
    if(nums.has(d) || nums.has(d.replace(/^91/, ''))) return m;
    return NUM_NOTE;
  });
  return out;
}
