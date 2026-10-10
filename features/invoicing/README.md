# Invoicing and books

Every verified payment gets exactly one numbered invoice, chained to the one before it, with exports for the CA, income-tax work and the bank.

## How it works
- **Source of truth:** `payments/{id}` (written by the Cashfree handler after Cashfree confirms PAID) plus manual `ledger` revenue entries. A ledger entry whose reference matches a payment is skipped, so nothing is invoiced twice. Nothing in the payment path was changed.
- **Issuer:** `worker/lib/invoice-sweep.js`. Runs in the daily Worker cron and from the admin page (`POST /admin/invoices/sweep`). Idempotent: `invoices/{sourceKey}` is created only if absent, and each number is claimed by creating `invoiceNumbers/{FY_seq}` (create-if-absent), so overlapping runs cannot reuse a number.
- **Numbering:** `RW/2627/000123`, a gap-free series per financial year (1 April to 31 March, IST), 14 characters (GST allows 16).
- **Trail:** each invoice stores `prevHash` and `hash` (SHA-256 of its canonical fields). `RWInvoice.verifyChain` reports number gaps, broken links and edited content. Invoices are server-written only; `firestore.rules` denies every client write.
- **GST:** charged only when `invoiceConfig/seller` has `gstRegistered: true` and a valid GSTIN. Otherwise the document is a plain "Invoice" that says no GST was charged. The amount paid is treated as GST-inclusive. If no rate is saved the dated `RWGst platform_fee` rule is used and the invoice is flagged `gst_rate_not_confirmed_by_ca`. An unknown customer state assumes the seller state and is flagged.
- **Customers:** My payments shows "View invoice" on paid orders (`/my-payments/invoice.html`); owners can read only their own invoice.

## Admin page: `/admin/invoices.html`
Seller details (stored privately in `invoiceConfig/seller`), issue and verify, invoice list with print view, and exports: sales register CSV, GST summary CSV, monthly P&L CSV, a CA handoff note and bank-statement matching (read in the browser, never uploaded).

## What it does not do
- It does not file GST, TDS or income tax, and it is not a CA. Revenue in the P&L is taxable value (GST collected is shown separately as a liability); expenses are only what the team entered in the ledger.
- No bank feed. Gateway payouts are batched and net of fees, so they are set aside for the Finance desk settlement check.
- Refunds, credit notes and non-INR payments are not issued yet. A refund needs a credit note against the original invoice once the refund record format exists.
- Manual UPI revenue entries are invoiced but flagged when they have no payment reference.

## Owner setup (once)
1. Deploy Firestore rules (auto-deployed from `main`) and the Worker (`wrangler deploy`).
2. Open `/admin/invoices.html`, save the seller details, then press "Issue invoices for new payments".
3. Ask the CA to confirm the GST rate and SAC before setting them; run "Verify numbering & hash chain" before sending anything to the CA.
