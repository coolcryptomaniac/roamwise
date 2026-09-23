# RoamWise tax workbench — phase 1 (read-only)

Open `/admin/tax.html` after signing into the existing `/admin/` console. The page verifies the existing Firebase user against `admins/{uid}` and reads all `ledger` and `cashfreeOrders` documents in 250-document pages, capped at 10,000 documents per source. It has no Firestore write path and cannot initiate payments, transfers or tax filings.

`tax-engine.js` is a browser/CommonJS-compatible, pure deterministic summary over the **existing** Firestore ledger schema (`kind`, `amount` in INR, `at`). It does **not** construct a competing accounting book. Manual entries without a verified order reference are flagged; live paid Cashfree orders missing a ledger revenue entry are highlighted but never silently added to revenue. Partner gross funds are not treated as RoamWise revenue. Refund/reversal records must reference a complete corresponding existing record in the same financial year. Expenses without receipts are flagged. Invalid dates, non-INR entries and duplicated payment refs fail closed. Multiple sources (Cashfree, bank, UPI, property settlement) are **not** yet independently reconciled.

Tax metadata is **optional and absent by default**. An accountant must validate and set `taxMeta.gstRateBps` (integer, e.g. 1800), `taxMeta.gstIncluded` (boolean), and `taxMeta.itcEligible` (boolean for an expense, with `invoiceRef` or `receiptRef`) before provisional GST values can be displayed. `taxMeta.tdsWithheldINR` is a recorded amount, **not a calculated TDS liability**. The engine's optional `incomeTaxReserveBps` is an owner-supplied reserve percentage, **not a legal tax rate**; it is not exposed as a default in the UI. This intentionally avoids assuming RoamWise's registration, legal form, principal/agent booking role, GST classification, tax treatment of crypto, or merchant collection limit.

## Go-live gates for a production tax estimate

1. Validate the legal entity, GST registration and place-of-supply treatment with an India-qualified CA, including special e-commerce operator rules for travel bookings, section 194-O, section 52 TCS and accommodation rules where applicable.
2. Add an append-only, server-originated journal entry for every verified payment, refund, gateway fee and settlement, with stable source IDs and supporting invoices. Deduplicate provider callbacks and never edit an old entry to reverse it.
3. Validate the live `firestore.rules` against staff/admin code. The staff console currently allows `finMarkPaid` to update a bill and previews only 300 rows; the tax page does not assume that a truncated preview is a complete ledger.
4. Reconcile Cashfree gross orders, fees, refunds and bank deposits; flag discrepancies. Do not release partner funds without contracts, authorized payout rails and the proper merchant arrangement.
5. Put tax rules in a versioned jurisdiction/FY configuration verified by the CA. Generate GST/TDS schedules and return-ready data only after full reconciliations and signed-off rules. Actual filing and tax remittance require explicit owner authorization.
6. Keep stablecoin or self-custody transactions in separate records for valuation, source, wallet and transfer tracking, and obtain legal/regulatory review before routing customer or partner money through crypto.

Run `node --test tests/finance-tax.test.js`. This workbench is provisional software, not certification of statutory compliance.

## AI CA / compliance sentinel

Open `/admin/finance-desk/` after signing into the founder/admin account.

This is deliberately **deterministic first, AI second**:

1. `compliance-engine.js` evaluates founder/CA-confirmed facts such as GST registration, own taxable turnover, booking GMV, whether RoamWise collects guest money, whether unregistered accommodation suppliers are bookable, current-account status, reconciliation status and signed partner terms.
2. It produces conservative operating modes and hard stops. The default India threshold field is ₹20 lakh only as a starting value for the ordinary registration test; compulsory e-commerce rules are evaluated separately. A CA can change the configured threshold if the actual facts require it.
3. Saving an evaluation writes the mutable current state to `complianceState/current` and an immutable historical summary to `complianceAssessments/{id}`.
4. The evidence tool computes SHA-256 **in the browser** and saves only file metadata + fingerprint to `complianceEvidence/{id}`. The original document is not uploaded by this tool. Keep originals in a controlled accounting/Drive archive.
5. The optional AI CA sends only the redacted deterministic summary and founder question to the admin-only Worker. It never sends the selected evidence file, bank CSV rows, PAN/Aadhaar, account numbers, API keys or signatures.

### Optional AI providers

The Worker endpoint is `POST /admin/ai-ca/review`. It verifies a Firebase ID token and `admins/{uid}` before any provider call. Configure provider credentials only as encrypted Worker secrets; never paste them into the admin page or repository.

Supported provider order is OpenAI → Anthropic → existing Groq, unless `AI_CA_PROVIDER` selects another preference.

Examples:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_MODEL
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ANTHROPIC_MODEL
# Existing fallback:
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GROQ_MODEL
```

Set non-secret `AI_CA_PROVIDER="auto"` (or `openai`, `anthropic`, `groq`) in Worker vars if you want to choose the first provider.

AI output is advisory. Registration, returns, tax payments, audit/certification, legal opinions and any filing that requires an authorised person remain explicitly human-approved.

### Recommended human operating cadence

- **Weekly / automated:** reconcile payment exceptions, keep invoice/evidence fingerprints, track turnover and booking GMV separately.
- **Monthly:** founder/finance review of bank, gateway, direct UPI, refunds and partner statements.
- **Quarterly or before a mode change:** part-time India-qualified CA reviews GST/ECO/194-O/TCS/TDS treatment and signs off the configuration used by the sentinel.
- **Immediately:** human CA/legal review before switching from listing/lead-generation into accommodation booking-money collection or enabling an unregistered accommodation supplier for live marketplace booking.

The sentinel is designed to preserve evidence and stop risky mode changes early; it does not claim that software can make RoamWise immune from tax, bank, consumer or regulatory obligations.
