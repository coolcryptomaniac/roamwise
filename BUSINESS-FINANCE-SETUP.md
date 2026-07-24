# Business UPI and bookkeeping — the practical setup

## The short answer

**Do not run business money through your personal UPI.** It is the single most
common mistake solo founders make in India, and unwinding it later is painful.

The setup that works, in order:

1. **Register as a sole proprietorship** (you effectively already are)
2. **Open a current account** in the business name
3. **Get a business UPI ID** linked to that account
4. **Add a payment gateway** once volume justifies it
5. **Put bookkeeping software in front of it** so an intern can manage it

---

## 1. Why not personal UPI

You are currently taking payments on `coolmohit@ybl`. That works at ten
payments a month and breaks at a hundred, for four reasons:

- **Tax.** Personal and business income mixed in one account is very hard to
  separate at filing. Your CA will charge you for the reconstruction.
- **No reconciliation data.** Personal UPI gives you a name and an amount. It
  does not tell you which order it was for.
- **Limits.** Personal UPI caps (typically ₹1 lakh/day) will eventually block a
  legitimate sale.
- **It looks amateur.** "Pay coolmohit@ybl" costs you conversions on a ₹15,000
  trek booking, whatever the product is worth.

---

## 2. Registering the business

For a solo founder in India, **sole proprietorship** is the right starting
point — no incorporation cost, no compliance overhead, and you can convert to a
Private Limited later when you raise.

To open a current account, banks typically want any two of:

- **Udyam registration** (free, online, 10 minutes at udyamregistration.gov.in)
- **GST registration** (only mandatory above ₹20 lakh services turnover, but
  many banks accept it as proof)
- **Shop & Establishment licence** from your local municipal body
- **Professional tax registration**, where your state has one

**Udyam is the easiest and it is free.** Start there.

> **On GST:** you are almost certainly below the ₹20 lakh services threshold
> today, so registration is optional. Register voluntarily only if you want to
> claim input credit on your expenses, or if a business customer demands a GST
> invoice. It adds monthly filings — do not take that on before you need to.

---

## 3. Current account and business UPI

Once you have Udyam, open a **current account**. Compare on:

- Minimum balance requirement (varies hugely — some ask ₹10,000, some ₹50,000)
- Free UPI/NEFT transaction limits
- Quality of the statement export (this matters more than you would think)

Banks that work well for small digital businesses: **ICICI, HDFC, Kotak 811
Business, IDFC First.** Ask specifically about the **UPI business handle** and
**API/webhook access** — some offer it free at your size, some do not.

Your UPI then becomes something like `roamwise@icici` or `roamwise@okicici`,
which is both trackable and more credible on a payment page.

---

## 4. Payment gateway — when, not whether

Stay on plain UPI while volume is low; it costs nothing. Move to a gateway when
manual verification starts costing you more than the fee.

| Option | Cost | When it makes sense |
|---|---|---|
| **Plain business UPI** | 0% | Under ~50 payments/month |
| **Razorpay** | ~2% + GST | Auto-verification, subscriptions, refunds, good dashboard |
| **Cashfree** | ~1.75% | Slightly cheaper, faster settlement |
| **PhonePe for Business** | ~0–2% | Strong UPI-first flows |

**The trigger to switch is time, not money.** The moment you spend an hour a
week matching payments by hand, a 2% fee is cheap.

Both Razorpay and Cashfree let you create a **read-only dashboard user** — which
is exactly what a finance intern should have. They can reconcile without being
able to move money.

---

## 5. Bookkeeping an intern can actually run

| Tool | Cost | Good for |
|---|---|---|
| **Zoho Books** | Free under ₹25L turnover | Proper double-entry, GST-ready, bank feeds, multi-user |
| **Vyapar** | ~₹3,600/yr | Simple, very common with Indian small business |
| **Khatabook** | Free | Cash-book simple. Fine at the very start, you will outgrow it |
| **A shared spreadsheet** | Free | Honestly adequate for the first six months if disciplined |

**Recommendation: Zoho Books.** It is free at your turnover, it does real
double-entry rather than a list of transactions, it supports multiple users with
different permission levels, and it will still work when you are ten times
larger. Give the finance intern a **Staff** role — they can enter and reconcile,
not delete or change settings.

---

## 6. What the intern actually does, daily

The team board at `/staff` already lists this, but the underlying discipline is:

1. **Match every credit to a source.** UPI credit → which order, or which Pro
   unlock. Anything unmatched gets flagged, not guessed at.
2. **Log every expense the day it happens**, with the purpose and a receipt.
   Receipts vanish if you leave them.
3. **Remove refunds from revenue the same day.** Revenue that gets reversed but
   stays counted is how founders fool themselves.
4. **Close the month within five days** — revenue by source, expenses by
   category, net.

The intern never needs access to your bank login. They work from statement
exports and the gateway's read-only dashboard.

---

## 7. Separation that protects you

- **One account for business, one for personal.** Pay yourself a fixed monthly
  draw rather than dipping in.
- **Never let an intern have transfer rights.** Read and enter only. This
  protects them as much as you — if money goes missing, nobody can suspect them.
- **Reconcile monthly yourself**, even with an intern doing the daily work. It
  takes twenty minutes and it is how you catch both errors and problems.
- **Keep everything for six years.** That is the Indian record-retention
  expectation for tax purposes.

---

## Do this in order

1. **Udyam registration** — free, 10 minutes, today
2. **Current account** with a bank offering a good statement export
3. **Business UPI handle** on that account, replace `coolmohit@ybl` everywhere
4. **Zoho Books** free tier, connect the bank feed
5. **Finance intern** gets Zoho Staff access + the `/staff` board
6. **Razorpay** when manual matching costs you more than an hour a week

Steps 1–3 are an afternoon. They will save you a painful week at tax time.

---

*General guidance based on Indian small-business practice as of July 2026, not
professional tax or legal advice. Confirm specifics with a chartered accountant —
one consultation costs a few thousand rupees and is worth it before you open the
account.*
