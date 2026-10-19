import { rankArtistProperties, buildArtBrief, safeHttps } from './artist-match-core.mjs';
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data, selected;
function updateBrief() {
  if (!selected || !data) return;
  const text = buildArtBrief(data.artists[0], selected, {goal: $('artGoal').value, notes: $('artNotes').value});
  $('artDraft').value = text;
  $('artCopy').disabled = false;
  $('artEmail').href = 'mailto:founder@roamwise.co.in?subject=' + encodeURIComponent('RoamWise art × hospitality: ' + selected.name) + '&body=' + encodeURIComponent(text);
  $('artWhatsApp').href = 'https://wa.me/919987379730?text=' + encodeURIComponent(text);
}
const WA = '919015954049';
const waLink = text => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
function workMessage(w) {
  if (w.status === 'Sold') return `Namaste Bhavitavya Kala Studio \u{1F64F}\n\nI found you through RoamWise. I saw "${w.title}" and would like to discuss a similar customised painting. Please share how this works, price and timeline.`;
  const what = w.type === 'Print' ? 'order the print' : 'enquire about the original painting';
  return `Namaste Bhavitavya Kala Studio \u{1F64F}\n\nI found you through RoamWise and would like to ${what} "${w.title}". Please share price, availability and delivery details.`;
}
function renderWorks() {
  const box = $('artWorks'); const works = (data && data.artists[0].artworks) || [];
  if (!box) return;
  box.innerHTML = works.map(w => {
    const cta = w.status === 'Sold' ? 'Ask for something similar' : (w.type === 'Print' ? 'Order on WhatsApp' : 'Enquire on WhatsApp');
    const meta = [w.medium, w.size].filter(Boolean).map(esc).join(' · ');
    return `<article class="art-work${w.status === 'Sold' ? ' is-sold' : ''}"><img src="${esc(w.image)}" alt="${esc(w.title)}, ${esc(w.type.toLowerCase())} by Natasha Guleria" loading="lazy"><div><span class="art-status">${esc(w.status)} · ${esc(w.type)}</span><h3>${esc(w.title)}</h3>${meta ? `<p class="art-small">${meta}</p>` : ''}<p class="art-price">${esc(w.price)}</p><a class="art-wa" href="${esc(waLink(workMessage(w)))}" target="_blank" rel="noopener">${cta} ↗</a><a class="art-small" href="${esc(safeHttps(w.url))}" target="_blank" rel="noopener">Studio page ↗</a></div></article>`;
  }).join('');
}
let buyerCity = '';
function buyerBrief(b) {
  const a = data.artists[0];
  return `Hello RoamWise team,\n\nPlease introduce ${a.name} (${a.studio}) to ${b.name} in ${b.city}.\n\nWhy it may fit: ${b.reasons.join('; ')}.\nHer work: https://www.roamwise.co.in/creators/artists.html\nPortfolio: ${safeHttps(a.website)}\n\nNo commitment is implied by either side.`;
}
function renderBuyers() {
  const box = $('artBuyers'); if (!box || !data || !data.buyers) return;
  const rows = data.buyers.filter(b => (b.forArtists || ['natasha-guleria']).includes('natasha-guleria') && (!buyerCity || b.city === buyerCity));
  box.innerHTML = rows.map(b => `<article class="art-match"><span class="art-status">Research prospect</span><h3>${esc(b.name)}</h3><span class="art-small">${esc(b.city)} · ${esc(b.kind)}</span><ul>${b.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul><p class="art-small">${esc(b.evidence)}</p><a href="${esc(safeHttps(b.sourceUrl))}" target="_blank" rel="noopener">Source ↗</a> <a href="${esc(safeHttps(b.contactUrl))}" target="_blank" rel="noopener">${esc(b.contactType)} ↗</a><a class="art-button secondary" href="mailto:founder@roamwise.co.in?subject=${encodeURIComponent('Introduce Natasha Guleria to ' + b.name)}&body=${encodeURIComponent(buyerBrief(b))}">Request an introduction</a></article>`).join('');
  const note = $('artBuyersNote'); if (note) note.textContent = `${rows.length} organisations. ${data.buyersNote || ''}`;
}
document.querySelectorAll('.art-city').forEach(btn => btn.addEventListener('click', () => {
  buyerCity = btn.dataset.city; document.querySelectorAll('.art-city').forEach(x => x.classList.toggle('is-on', x === btn)); renderBuyers();
}));
function render() {
  if (!data) return;
  const rows = rankArtistProperties(data.artists[0], data.properties, {goal:$('artGoal').value, region:$('artRegion').value});
  $('artMatches').innerHTML = rows.map(p => `<article class="art-match"><span class="art-status">Research prospect</span><h3>${esc(p.name)}</h3><span class="art-small">${esc(p.city)} · ${esc(p.state)}</span><p class="art-fit">Fit index ${p.score}/100</p><ul>${p.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><p class="art-small">${esc(p.evidence)}</p><a href="${esc(safeHttps(p.sourceUrl))}" target="_blank" rel="noopener">Read the official source ↗</a><p class="art-small">${p.needsRefresh?'Needs source refresh':'Source checked '+esc(new Date(p.checkedAt).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'}))} · Budget and dates unconfirmed</p><button type="button" class="art-button secondary" data-property="${esc(p.id)}">Discuss this match</button></article>`).join('');
  $('artStatus').textContent = `${rows.length} potential matches. No confirmed bookings or hotel partnerships.`;
  if (selected) updateBrief();
}
$('artFilters').addEventListener('submit', e => {e.preventDefault(); render();});
$('artGoal').addEventListener('change', render);
$('artRegion').addEventListener('change', render);
$('artNotes').addEventListener('input', updateBrief);
$('artMatches').addEventListener('click', e => {
  const b = e.target.closest('button[data-property]'); if (!b) return;
  selected = data.properties.find(p=>p.id === b.dataset.property); updateBrief();
  $('artDraft').focus(); $('brief').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
});
$('artCopy').addEventListener('click', async()=>{
  try {await navigator.clipboard.writeText($('artDraft').value); $('artStatus').textContent='Enquiry copied. You can send it to RoamWise.';}
  catch { $('artDraft').focus(); $('artDraft').select(); $('artStatus').textContent='Select and copy the enquiry manually.'; }
});
try {
  const r=await fetch('artists-data.json'); if(!r.ok) throw new Error('unavailable'); data=await r.json(); renderWorks(); renderBuyers(); render();
} catch { $('artStatus').textContent='The shortlist could not load. The portfolio and email introduction links still work.'; }
