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
  const r=await fetch('artists-data.json'); if(!r.ok) throw new Error('unavailable'); data=await r.json(); render();
} catch { $('artStatus').textContent='The shortlist could not load. The portfolio and email introduction links still work.'; }
