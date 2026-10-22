// packages/safety-core.mjs - the "plan it safely" checklist, the Ailon Tusk question and the first trip-chat message.
// Pure functions. Advice only: it never promises a road is open or the weather is fine.
import { PACKAGES } from './catalog.mjs';
import { windowRisk } from './dates-core.mjs';

export const EMERGENCY = Object.freeze({ national: '112', ambulance: '108' });
const clean = (s, max) => String(s == null ? '' : s).replace(/[<>\r\n]+/g, ' ').trim().slice(0, max);

export function safetyPlan({ pkgId, n, startISO }) {
  const pkg = PACKAGES[pkgId];
  if (!pkg || !startISO) return null;
  const risk = windowRisk(startISO, pkg.days);
  const checks = [
    { when: 'At booking', items: [
      'Everyone shares one emergency contact and any health needs with the trip organiser (not in the public chat).',
      'Create the group trip chat and add all ' + n + ' friends before the first payment is due.',
      'Check that each person has a valid photo ID for hotels and train travel.'] },
    { when: '14 days before', items: [
      'Final payment done. Save the driver card (name, photo, licence badge, vehicle number, permit and insurance copy) and the guide card (photo, name, ID, phone) in the trip chat.',
      'Confirm train tickets arrive before ' + (pkgId === 'almora' ? '09:30 at Kathgodam' : 'the planned pickup at Kotdwar') + '.'] },
    { when: '3 days before', items: [
      'Ask Ailon Tusk to re-check the road, weather and timings. Confirm the driver, the backup driver and the guide.',
      'Pack: warm layer, rain jacket, shoes with grip, medicines, power bank, copies of IDs.'] },
    { when: 'On the trip', items: [
      'Share live location in the trip chat at each stop. Do a headcount at every stop and every vehicle change.',
      'No road travel after dark on hill roads. No swimming in streams or rivers. Seat belts on.',
      'If anything feels unsafe, tell the organiser and RoamWise at once. Emergency numbers: ' + EMERGENCY.national + ' (all emergencies) and ' + EMERGENCY.ambulance + ' (ambulance).'] },
  ];
  const watch = [];
  if (risk.label === 'busy') watch.push('These dates cross busy road days. Leave early, add a buffer, or move to Monday to Thursday.');
  if (risk.fog) watch.push('Winter fog can delay trains and slow the hill road. Keep a buffer day and avoid tight connections.');
  if (risk.monsoon) watch.push('Monsoon: landslides can close hill roads. Ask Ailon Tusk about the road the day before, and keep the plan flexible.');
  if (!watch.length) watch.push('These dates avoid the worst traffic. Still re-check the road and weather 3 days before.');
  const tuskPrompt = clean('Plan the safety side of a ' + pkg.days + '-day student group trip for ' + n + ' friends: ' + pkg.name + ' starting ' + startISO
    + ' from ' + pkg.start + '. Tell me the road and weather risks, what to pack, the safest travel times, and what to do if the group is delayed.', 600);
  const chatMessage = 'Our ' + pkg.name + ' trip: ' + startISO + ' for ' + pkg.days + ' days, ' + n + ' of us.\n'
    + 'Safety plan:\n' + checks.map((c) => '- ' + c.when + ': ' + c.items[0]).join('\n')
    + '\nOn the trip: headcount at every stop, share live location, no hill-road driving after dark, no swimming in streams. Emergency: '
    + EMERGENCY.national + ' / ' + EMERGENCY.ambulance + '.';
  return { risk, checks, watch, tuskPrompt, chatMessage };
}
