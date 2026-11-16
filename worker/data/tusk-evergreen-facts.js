/* Append-only, source-backed historical/geographic anchors, v1.
   Do NOT put opening hours, fees, season dates, permits, visa rules, phone
   numbers, boundaries or changing infrastructure in this pack.
   To correct a record, create a new version and retain the previous revision.
   This source pack persists in git; answer caches and operational records do not. */
export const TUSK_EVERGREEN_FACTS=Object.freeze({
 v:1,reviewedAt:'2026-11-15',scope:'public_foundational_anchors',
 items:[
  {id:'evergreen-gir-place-v1',title:'Gir National Park geography',
   keys:['gir','sasan gir','where is gir','गिर नेशनल पार्क'],
   facts:['Gir National Park lies in Gujarat, India, in the Sasan Gir region.'],
   sources:['https://girlion.gujarat.gov.in/AboutGir.aspx'],
   checkedAt:'2026-11-14',reviewAgainAfter:'2027-11-14',classification:'geographic_anchor',version:1},
  {id:'evergreen-corbett-place-v1',title:'Jim Corbett Tiger Reserve geography',
   keys:['jim corbett','corbett','ramnagar','कॉर्बेट'],
   facts:['Jim Corbett Tiger Reserve is in Uttarakhand, India, and Ramnagar is a principal gateway.'],
   sources:['https://corbettgov.org'],
   checkedAt:'2026-11-15',reviewAgainAfter:'2027-11-15',classification:'geographic_anchor',version:1},
  {id:'evergreen-ghnp-place-v1',title:'Great Himalayan National Park geography',
   keys:['great himalayan national park','ghnp','tirthan','sainj'],
   facts:['Great Himalayan National Park is in the Kullu region of Himachal Pradesh, India; Tirthan and Sainj are associated access valleys.'],
   sources:['https://greathimalayannationalpark.org/plan-your-trip/fees-rules-and-guidelines/'],
   checkedAt:'2026-11-15',reviewAgainAfter:'2027-11-15',classification:'geographic_anchor',version:1},
  {id:'evergreen-nainital-zoo-v1',title:'Nainital High Altitude Zoo geography',
   keys:['nainital zoo','high altitude zoo','pant zoo'],
   facts:['Pt. G. B. Pant High Altitude Zoo is in Nainital, Uttarakhand, India.'],
   sources:['https://nainital.nic.in/tourist-place/zoo/'],
   checkedAt:'2026-11-15',reviewAgainAfter:'2027-11-15',classification:'geographic_anchor',version:1},
  {id:'evergreen-rohtang-place-v1',title:'Rohtang Pass geography',
   keys:['rohtang','rohtang pass','atal tunnel','रोहतांग'],
   facts:['Rohtang Pass and the Atal Tunnel are in the Manali–Lahaul mountain corridor of Himachal Pradesh, India.'],
   sources:['https://hpkullu.nic.in'],
   checkedAt:'2026-11-14',reviewAgainAfter:'2027-11-14',classification:'geographic_anchor',version:1},
  {id:'evergreen-chardham-v1',title:'Uttarakhand Char Dham pilgrimage',
   keys:['char dham','chardham','kedarnath','badrinath','gangotri','yamunotri','चार धाम'],
   facts:['The Uttarakhand Char Dham pilgrimage comprises Yamunotri, Gangotri, Kedarnath and Badrinath.'],
   sources:['https://badrinath-kedarnath.gov.in'],
   checkedAt:'2026-11-14',reviewAgainAfter:'2027-11-14',classification:'cultural_anchor',version:1},
  {id:'evergreen-devalia-v1',title:'Devalia and the Gir landscape',
   keys:['devalia','gir interpretation zone'],
   facts:['Devalia is an interpretation zone associated with the Gir wildlife landscape in Gujarat.'],
   sources:['https://girlion.gujarat.gov.in/AboutGir.aspx'],
   checkedAt:'2026-11-14',reviewAgainAfter:'2027-11-14',classification:'geographic_anchor',version:1}
 ]
});
