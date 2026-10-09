/* Server-side Founder offer cap. The browser shows the same maths in
   js/pricing/founder-seats.js (keep the two in sync); this copy is the one
   that is actually enforced, because browser code can be bypassed.

   pricing/founder.count = paid / non-NMIMS Founder seats. The NMIMS pool of
   500 is reserved up front once partnerships/nmims2026.officialConfirmed is
   true, and is never added to count. */
export const FOUNDER_TOTAL_SEATS = 1000;
export const FOUNDER_NMIMS_RESERVED = 500;

export function founderSeatsLeft(count, nmimsOfficial){
  const claimed = Number.isFinite(Number(count)) && Number(count) > 0 ? Number(count) : 0;
  const reserved = nmimsOfficial === true ? FOUNDER_NMIMS_RESERVED : 0;
  return Math.max(0, FOUNDER_TOTAL_SEATS - claimed - reserved);
}
