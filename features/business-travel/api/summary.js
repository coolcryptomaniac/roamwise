/* Compact agent output from the same validated reconciliation. No raw report,
 * descriptions, receipts or duplicated expense rows in the model context. */
export function summarize(result) {
  const flagCounts = {};
  for (const flag of result.flags) flagCounts[flag.code] = (flagCounts[flag.code] || 0) + 1;
  return {
    status: result.status, currency: result.currency, total: result.total,
    remaining: result.remaining, expenseCount: result.rows.length,
    flagCount: result.flags.length, flagCounts,
    flags: result.flags.slice(0, 20).map(flag => ({
      code: flag.code, ...(flag.expenseId ? { expenseId: flag.expenseId } : {}),
      ...(flag.date ? { date: flag.date } : {})
    })),
    flagsTruncated: result.flags.length > 20,
    notice: result.notice
  };
}
