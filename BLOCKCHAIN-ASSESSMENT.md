# Blockchain in RoamWise — what's worth it, what isn't

## The test I applied

Blockchain solves one problem well: **agreement between parties who don't trust
each other, without a trusted intermediary.** Every genuinely successful use of
it — Bitcoin, cross-border settlement, some supply-chain provenance — fits that
shape.

So for each idea the question is: *are there two parties here who don't trust
each other and can't use an intermediary?*

For RoamWise the answer is almost always no. Your users trust UPI. They trust
you enough to install your app. And **you are the intermediary** — that's the
business. Removing yourself from the middle doesn't help anyone.

---

## What you already have, and why it's a liability today

Admin → Config has a **`CRYPTO_WALLETS`** field. If you paste addresses into it,
the payment sheet renders a "Pay with crypto (USDT)" panel with a copy button
and asks the buyer to paste a transaction hash.

It is currently **empty, so nothing renders.** Leave it that way for now, because
switching it on today creates four problems:

1. **Nothing verifies the payment.** You'd be checking a block explorer by hand
   for every transaction, matching an amount that moved while they were paying.
2. **Amount drift.** ₹100 of USDT isn't a fixed number of USDT. You'd need a
   live rate at quote time, and a tolerance band, or you'll be arguing about
   ₹3 differences.
3. **Tax.** India taxes virtual digital assets at **30% flat, plus 1% TDS**, with
   separate reporting. Receiving business income in crypto adds a filing burden
   that ₹100 sales cannot justify.
4. **Stranded funds.** An address on a live payment page that nobody monitors
   will eventually receive money you don't notice. That's a real customer
   problem and a genuinely bad look.

I've added a warning to that admin field and, if you ever do enable it, the
panel now sets honest expectations rather than implying instant unlock.

---

## Ideas assessed individually

### ❌ Crypto payments (as primary or promoted method)
**Verdict: no.** UPI is instant, free, universal in India, and already works.
Crypto is slower, costs a fee, needs a wallet, and taxes you at 30%. You'd be
replacing a better system with a worse one.

*Exception worth nothing:* an international buyer whose card fails. Gumroad
already handles international cards for you, so even this is covered.

### ❌ Loyalty token / travel coin
**Verdict: no, and it carries real risk.** A token you issue that people expect
to appreciate can be treated as a security. India's regulatory position on this
is unsettled and unfriendly. Your XP and badge system already produces the
behaviour you want, costs nothing, and creates no liability.

### ❌ NFT trek/trip certificates
**Verdict: no.** You already generate a real PNG certificate people can save and
post. Minting it would add gas fees, a wallet requirement, and a signup step —
in exchange for verifiability nobody has asked for. **Ask yourself who checks
the blockchain to confirm someone's trek badge is real.** Nobody, ever.

### ❌ NFT ticketing for treks or events
**Verdict: no.** Tried repeatedly across the industry and it hasn't displaced
conventional ticketing anywhere. You also don't sell tickets — you link to
operators, deliberately.

### ❌ Smart-contract royalty splits for creators
**Verdict: not yet, and probably not ever at your scale.** With a handful of
creator partners, a spreadsheet and a UPI transfer does this in five minutes a
month, with no gas, no wallet onboarding and no tax complexity. This becomes
worth discussing at *hundreds* of partners with automated micro-payouts — which
is a different company.

### ⚠️ Verifiable credentials for the eco certificate
**Verdict: interesting, still not worth it.** A tamper-evident certificate is a
genuine use of the technology. But the honest question is who needs to verify
it. An employer? A carbon registry? Nobody currently does. If a real verifier
appears — say a corporate travel programme wanting proof of low-carbon trips —
revisit it then, and use W3C Verifiable Credentials, which need no chain at all.

### ✅ The one thing actually worth borrowing — no blockchain required
**Content-hash your certificates.** Put a SHA-256 of the certificate data in the
image and expose a `/verify` page. Anyone can confirm a certificate wasn't
edited, it costs nothing, needs no wallet, and works offline.

This gets you the *property* people want from blockchain — tamper-evidence —
without the chain, the fees, or the tax exposure. If you want the feature, this
is the version I'd build.

---

## What would have to change for me to say yes

I'm not against this permanently. Revisit if **any** of these become true:

- **India's VDA tax regime softens materially** — the 30% + 1% TDS is the single
  biggest blocker to crypto as business income.
- **A meaningful share of your users ask for it.** Not one person on Twitter —
  a pattern in support requests.
- **You're doing cross-border creator payouts at volume** where wire fees and
  delays genuinely hurt. Stablecoin rails do beat SWIFT for small international
  payments. At ten creators, they don't.
- **A partner requires it** — a booking platform or DAO-run operator that only
  settles on-chain.

None of these is true today.

---

## What to do right now

1. **Leave `CRYPTO_WALLETS` empty.** The field stays for optionality; the warning
   now explains the cost of filling it.
2. **Build the `/verify` content-hash page** if you want the tamper-evidence
   story — I can do that in one session, and it's a genuinely nice detail for
   the eco certificates.
3. **Don't put Web3 in the investor deck.** In 2026 it reads as 2021 thinking to
   Indian VCs and invites questions about focus. Your moat slide is stronger
   without it.
4. **Spend that engineering time on field data instead.** Verified auto fares in
   forty cities is a harder moat than any smart contract, and it's the thing
   competitors can't buy.

---

## The short version

Blockchain is a very good answer to a question RoamWise doesn't have. You're not
solving distrust between strangers — you're solving *"what should this auto
actually cost."* No chain helps with that. Local knowledge does, and you already
have a two-year head start on collecting it.
