/* Official spellings of Indian states / union territories (Qikink requires a correctly spelled province). */
/* Spellings These are the official spellings we send. */
export const INDIA_STATES = Object.freeze([
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
]);

const ALIASES = { orissa: 'Odisha', uttaranchal: 'Uttarakhand', pondicherry: 'Puducherry', 'new delhi': 'Delhi', 'nct of delhi': 'Delhi' };
const key = (s) => String(s == null ? '' : s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const BY_KEY = new Map(INDIA_STATES.map((s) => [key(s), s]));

/* Returns the canonical spelling, or null when the text is not a known state / union territory. */
export function canonicalState(input) {
  const k = key(input);
  return BY_KEY.get(k) || (ALIASES[k] ? ALIASES[k] : null);
}

