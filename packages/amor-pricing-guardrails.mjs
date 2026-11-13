// Pricing guardrail for approved, internally costed custom packages.
// Never embed supplier net prices, contact details or confidential terms here.
// A 20% GROSS margin requires customer pre-tax price >= cost / (1 - 0.20).
// "200% margin" is mathematically undefined as a gross margin; interpret
// founder's upper cap as a 200% MARKUP (price <= 3 * eligible cost).
export function quoteBounds(allInCost, {minimumGrossMargin=0.20, maximumMarkup=2}={}) {
  const cost=Number(allInCost);
  if (!Number.isFinite(cost)||cost<=0) throw new Error('Valid positive supplier + operating cost required');
  if (!(minimumGrossMargin>=0&&minimumGrossMargin<1) || !(maximumMarkup>=0))
    throw new Error('Invalid margin/markup guardrails');
  const floor=Math.ceil(cost/(1-minimumGrossMargin));
  const ceiling=Math.floor(cost*(1+maximumMarkup));
  if (floor>ceiling) throw new Error('Margin floor exceeds markup cap');
  return {floor,ceiling,grossMarginAtFloor:(floor-cost)/floor,markupCapPct:maximumMarkup*100};
}
export function checkQuote(allInCost,customerPrice,options={}) {
  const bounds=quoteBounds(allInCost,options);
  const price=Number(customerPrice);
  if (!Number.isFinite(price)||price<bounds.floor||price>bounds.ceiling)
    return {approved:false,reason:'Outside founder pricing guardrails',...bounds};
  return {approved:true,grossMargin:(price-allInCost)/price,markup:(price-allInCost)/allInCost,...bounds};
}
