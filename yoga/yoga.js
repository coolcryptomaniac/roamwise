import { cleanBrief, introductionText } from './match-core.mjs';
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg = window.RW_PARTNER_CONFIG || {};
const email = cfg.supportEmail || 'support@roamwise.co.in';
const wa = String(cfg.chat?.supportWhatsapp || '').replace(/\D/g, '');
function roleChanged() {
  $('ownProperty').hidden = $('role').value !== 'both';
  $('ownProperty').disabled = $('role').value !== 'both';
  $('result').hidden = true;
}
const initialRole = new URLSearchParams(location.search).get('role');
if (['teacher','property','both'].includes(initialRole)) $('role').value = initialRole;
$('role').addEventListener('change', roleChanged);
roleChanged();
$('yogaForm').addEventListener('input', () => { $('result').hidden = true; $('status').textContent = ''; });
function handoffLinks(message) {
  const mail = 'mailto:' + email + '?subject=' + encodeURIComponent('RoamWise Yoga × Stays introduction') + '&body=' + encodeURIComponent(message);
  return '<a class="action" href="' + esc(mail) + '">Open email draft</a>' + (wa.length >= 10 && wa.length <= 15 ? '<a class="action secondary" target="_blank" rel="noopener noreferrer" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(message) + '">Open WhatsApp draft</a>' : '');
}
$('yogaForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!$('yogaForm').reportValidity()) return;
  try {
    const raw = Object.fromEntries(['role','name','place','from','to','group','budget','styles','models','propertyName','propertyUrl','note'].map(id => [id, $(id).value]));
    for (const id of ['quiet','optional','noFilming']) raw[id] = $(id).checked;
    const brief = cleanBrief(raw), message = introductionText(brief);
    const candidates = brief.role === 'property' ? [] : (window.RW_PARTNER_SEED || []).filter(p => p.listingReady === true && p.verified === 'signed' && String(p.zone || '').trim().toLowerCase() === brief.place.toLowerCase());
    $('result').innerHTML = '<h2>Your brief is ready. Nothing sent yet.</h2><p>This is a manual introduction request, not a confirmed match. Press send in your email or WhatsApp app to finish.</p><pre>' + esc(message) + '</pre>' + handoffLinks(message) + '<button id="copyBrief" class="secondary" type="button">Copy brief</button><p id="copyStatus" role="status"></p>' +
      (brief.role === 'property' ? '<p>No reviewed yoga-teacher directory is connected yet. Send your brief for a manual shortlist; no teacher availability is assumed.</p>' : '<h3>Existing stay listings to enquire about</h3><p>Town-name shortlist only, not yoga-ready matches. Practice space, capacity, quiet hours, accessibility, dates, rates and permission to host sessions all need confirmation.</p>' + (candidates.length ? candidates.slice(0, 6).map(p => '<article class="candidate"><h3>' + esc(p.name) + '</h3><p>' + esc(p.area || p.zone) + ' · Yoga suitability unconfirmed</p>' + handoffLinks(introductionText(brief, p.name)) + '</article>').join('') : '<p>No signed stay listings found for this exact town. Send the brief for manual review; no substitutes or available venues are invented.</p>'));
    if (brief.role === 'both') $('result').insertAdjacentHTML('beforeend', '<p>Your request includes finding other venues, finding guest teachers and offering your own property. Your property is not published or approved by sending this brief.</p>');
    $('copyBrief').onclick = async () => {
      try { await navigator.clipboard.writeText(message); $('copyStatus').textContent = 'Copied. Share only when you choose.'; }
      catch { $('copyStatus').textContent = 'Copy was unavailable. You can select the brief above or open the email draft.'; }
    };
    $('result').hidden = false;
    $('status').textContent = 'Brief prepared below. No details have been sent or saved.';
  } catch (error) { $('status').textContent = error.message; }
});
