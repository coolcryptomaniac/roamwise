// packages/instalment-core.mjs - "Pay in parts" for student groups. NOT a loan.
// The trip only departs when every part is paid, so RoamWise never carries credit risk and needs no lending licence.
// Real card / cardless EMI is a separate, gateway-approved option (see EMI_OPTIONS) and is not computed here.
import { addDays, daysBetween } from './dates-core.mjs';

export const POLICY = Object.freeze({
  depositPct: 0.25,       // paid at booking to hold the seat
  maxParts: 4,            // monthly parts after the deposit
  finalDueDaysBefore: 14, // the last part is due this many days before departure
  minDaysForPlan: 21,     // closer than this: pay in full now
  roundTo: 10,            // rupees
});

const roundUp = (n, to) => Math.ceil(n / to) * to;

/* totalPerPerson: rupees including GST. Returns the per-person schedule and the group total. */
export function instalmentPlan({ totalPerPerson, departISO, todayISO, groupSize = 1, policy = POLICY }) {
  const total = Math.round(totalPerPerson);
  const daysToGo = daysBetween(todayISO, departISO);
  const full = (reason) => ({
    mode: 'full', reason, perPerson: [{ n: 0, label: 'Pay in full', due: todayISO, amount: total }],
    groupTotal: total * groupSize, partsCount: 1, interestPct: 0, departureRule: 'Departure confirmed once paid.',
  });
  if (daysToGo < policy.minDaysForPlan) return full('Departure is less than ' + policy.minDaysForPlan + ' days away');

  const deposit = roundUp(total * policy.depositPct, policy.roundTo);
  const remaining = total - deposit;
  const usable = daysToGo - policy.finalDueDaysBefore;
  const parts = Math.max(1, Math.min(policy.maxParts, Math.floor(usable / 30)));
  const each = roundUp(remaining / parts, policy.roundTo);
  const rows = [{ n: 0, label: 'Deposit (holds your seat)', due: todayISO, amount: deposit }];
  let paid = deposit;
  for (let i = 1; i <= parts; i++) {
    const due = addDays(todayISO, Math.round(usable * i / parts));
    const amount = i === parts ? total - paid : Math.min(each, total - paid);
    rows.push({ n: i, label: i === parts ? 'Final part' : 'Part ' + i, due, amount });
    paid += amount;
  }
  return {
    mode: 'parts', reason: '', perPerson: rows, groupTotal: total * groupSize, partsCount: rows.length, interestPct: 0,
    departureRule: 'The trip departs only when every part is paid, at least ' + policy.finalDueDaysBefore + ' days before departure.',
  };
}

/* What a gateway EMI would be, so the founder can see the trade-off. Needs provider approval; nothing here moves money. */
export const EMI_OPTIONS = Object.freeze([
  { id: 'parts', name: 'Pay in parts (RoamWise)', interest: 'none', needs: 'nothing: built here', note: 'Best fit for students without credit cards.' },
  { id: 'card', name: 'Card / debit-card EMI via the payment gateway', interest: 'customer pays the bank, or the "no-cost" discount is funded by the seller', needs: 'gateway account with EMI enabled', note: 'Only students with eligible cards.' },
  { id: 'cardless', name: 'Cardless EMI via the payment gateway', interest: 'set by the lender', needs: 'gateway approval for cardless EMI', note: 'Covers students without cards; lender eligibility applies.' },
]);
