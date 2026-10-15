import { hostMessage, waLink, mailLink } from '../nomad-core.mjs';
const $ = id => document.getElementById(id);
const cfg = window.RW_PARTNER_CONFIG || {};
const EMAIL = cfg.supportEmail || 'support@roamwise.co.in';
const WA = (cfg.chat && cfg.chat.supportWhatsapp) || '';
const PAGE = 'https://roamwise.co.in/nomads/join/';

function space() {
  return {
    name: $('jName').value, place: $('jPlace').value, owner: $('jOwner').value, phone: $('jPhone').value,
    mbps: $('jMbps').value, rooms: $('jRooms').value, rate30: $('jRate').value,
    backup: $('jBackup').checked ? 'full' : 'none', desk: $('jDesk').checked ? 'ergonomic' : 'none',
    kitchen: $('jKitchen').checked, callRoom: false, verified: false
  };
}
function text() { return hostMessage(space()) + (($('jEmail').value || '').trim() ? '\nEmail: ' + $('jEmail').value.trim().replace(/[\u0000-\u001f<>]/g, '') : ''); }
function mail() { return mailLink(EMAIL, 'List my space on Nomad Match', text()); }

$('joinForm').addEventListener('submit', e => {
  e.preventDefault();
  const href = WA ? waLink(WA, text()) : mail();
  window.open(href, '_blank', 'noopener,noreferrer');
  $('joinNote').textContent = WA ? 'WhatsApp opened with your details. Press send there to finish.' : 'Your email app opened with your details. Press send to finish.';
});
if (!WA) { $('joinForm').querySelector('button.nm-btn').firstChild.textContent = 'Send to RoamWise by email '; $('mailAlt').parentElement.hidden = true; }
$('mailAlt').addEventListener('click', e => { e.preventDefault(); if ($('joinForm').reportValidity()) window.location.href = mail(); });

const invite = 'Hi, RoamWise is matching founders and remote professionals with 15-day to 3-month work stays. Guests pay you directly and you set your own rates. List your space in 2 minutes: ' + PAGE;
$('shareWa').href = 'https://wa.me/?text=' + encodeURIComponent(invite);
$('copyLink').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(PAGE); $('copyLink').textContent = 'Copied'; } catch { $('copyLink').textContent = PAGE; }
});

/* Carry the quick-form details into the full partner form (long-stay section and MOU). */
function fullFormHref() {
  const s = space(), p = new URLSearchParams({ source: 'nomad' });
  [['n', s.name], ['place', s.place], ['owner', s.owner], ['tel', s.phone], ['mbps', s.mbps], ['rooms', s.rooms], ['rate30', s.rate30]].forEach(([k, v]) => { v = String(v || '').trim(); if (v) p.set(k, v.slice(0, 100)); });
  if (s.backup === 'full') p.set('backup', 'full');
  if (s.desk === 'ergonomic') p.set('desk', 'ergonomic');
  if (s.kitchen) p.set('kitchen', '1');
  return '/partner/join/?' + p.toString();
}
$('fullForm').addEventListener('click', e => { e.currentTarget.href = fullFormHref(); });
