// @ts-nocheck
/* PLUGGABLE PAYMENT GATEWAY ADAPTER — js/payments/gateway-adapter.js
   ============================================================================
   Central plug point for RoamWise's checkout, modeled on the same pattern
   js/booking/affiliate-links.js already uses for affiliate routing (one
   function/registry every caller goes through, so a new provider is a new
   registration, not a rewrite of the callers). See
   PAYMENT-GATEWAY-ARCHITECTURE.md for the full write-up and the "how to add
   provider #2" guide.

   IMPORTANT CORRECTION vs. an earlier assumption: RoamWise's client-side
   checkout has never called Razorpay's SDK/API. Confirmed by a repo-wide
   grep (zero hits for "razorpay"/"Razorpay" in app.js, index.html or js/)
   and by REVENUE-INTEGRATIONS.md / BUSINESS-FINANCE-SETUP.md, both of which
   list Razorpay as a *future* option ("Payment gateway — when, not whether")
   once manual verification stops scaling — not the current provider. The
   real, currently-live default is a plain UPI deep-link/QR flow with a
   manual, honor-system claim (js/payments/providers/manual-upi-adapter.js).
   This file's interface is derived from THAT real flow, per the "derive the
   interface from what's actually used today" instruction for this task.

   There is also an already-built, separate, server-side multi-provider
   payment router (see payments/ at the repo root — a Cloudflare Worker
   supporting Razorpay/Cashfree/Stripe/PayPal via payments/provider-registry.mjs)
   that is NOT wired to this client checkout flow today. It's the natural
   home for a *real* future Razorpay/Cashfree/Stripe/PayPal integration — see
   PAYMENT-GATEWAY-ARCHITECTURE.md for how a client-side adapter here would
   call it, rather than embedding a gateway's checkout.js on this page.

   ==================== PROVIDER ADAPTER INTERFACE ====================
   Every provider adapter is a plain object with an `id` matching the value
   it's registered under, plus whichever of these methods it actually needs
   (all optional at the registry level — callers no-op gracefully if a
   provider hasn't implemented one, since not every future gateway needs
   every method: a hosted-checkout gateway's own SDK typically fires a
   success/error callback from inside openCheckout() and would never need a
   separate verifyPayment() step at all):

     createOrder(amount, meta) -> order
         amount: numeric price in the plan's own display currency (this app
           has only ever dealt in plain rupees, e.g. UPI's `am=` intent
           param — never Razorpay-style paise; a future provider that needs
           paise converts internally, in its own adapter, not here).
         meta:   {planId, tierId, label} — exactly what pickPlan() already
           knows about the purchase.
         returns a plain, adapter-defined "order" object. For manual UPI
           there is no server-side order-creation call — the "order" is
           just the UPI intent fields — but the shape stays opaque to
           callers so a provider that DOES need a network round trip
           (create a real order id server-side) can return one without
           changing this interface.

     openCheckout(order, method) -> void
         Presents the actual payment action to the user for the given
         order — a UPI deep link / QR for manual UPI, a hosted checkout
         modal for a provider like Razorpay/Stripe. `method` is whichever
         payment method/app key the user tapped (e.g. 'gpay', 'phonepe',
         'whatsapp', 'any') — providers that don't need a method-specific
         path may ignore it.

     buildQR(order) -> void
         Renders a scannable code for the order, if the provider has one.
         Optional — omit entirely for a provider with no QR step.

     verifyPayment() -> void
         Submits proof of payment for verification/activation. For manual
         UPI this drives the existing #utrInput/#utrMsg/#utrBtn UI exactly
         as before. Optional — a hosted-checkout provider may resolve
         success entirely inside its own openCheckout() SDK callback and
         never need this.

   ==================== PROVIDER SELECTION ====================
   RW_PAYMENT_PROVIDER is the single, small selection point every other
   payments file goes through RWPaymentGateway.current() rather than
   naming a provider directly. It's set from config/app.PAYMENT_PROVIDER —
   the same Firestore remote-config doc + apply pattern every other
   owner-controlled flag in this app already uses (see js/boot/init.js's
   applyRemoteConfig) — and defaults to 'manual_upi', today's real behavior,
   so an unset flag changes nothing. */

var RW_PAYMENT_PROVIDER = 'manual_upi';
var RW_PAYMENT_ADAPTERS = {};

var RWPaymentGateway = {
  /* Providers call this once, at file-load time, to make themselves
     selectable — see the bottom of manual-upi-adapter.js. */
  register: function(id, adapter){
    if(id) RW_PAYMENT_ADAPTERS[id] = adapter;
  },

  /* Resolves the configured provider, falling back to manual_upi (today's
     real default) if RW_PAYMENT_PROVIDER names a provider that never
     registered (e.g. a config flag pointing at a not-yet-deployed gateway)
     — never a hard failure that would block checkout. */
  current: function(){
    return RW_PAYMENT_ADAPTERS[RW_PAYMENT_PROVIDER] || RW_PAYMENT_ADAPTERS.manual_upi || null;
  },

  createOrder: function(amount, meta){
    var a = this.current();
    return a && a.createOrder ? a.createOrder(amount, meta) : null;
  },
  openCheckout: function(order, method){
    var a = this.current();
    if(a && a.openCheckout) a.openCheckout(order, method);
  },
  buildQR: function(order){
    var a = this.current();
    if(a && a.buildQR) a.buildQR(order);
  },
  verifyPayment: function(){
    var a = this.current();
    if(a && a.verifyPayment) a.verifyPayment();
  }
};
