/* RoamWise Platform V5 payment-provider registry.
 * Registry != automatic activation. A provider is routable only when its
 * merchant credentials / checkout URL are configured AND its risk gate allows it.
 * Never put provider secrets in browser code.
 */
export const PROVIDERS = {
  razorpay:{kind:'gateway',status:'supported',countries:['IN'],currencies:['INR'],methods:['upi','card','netbanking','wallet'],productTypes:['digital','travel','marketplace'],feeBps:200,fixedMinor:0,reliability:.995,priority:26,docs:'https://razorpay.com/docs/'},
  cashfree:{kind:'gateway',status:'supported',countries:['IN'],currencies:['INR'],methods:['upi','card','netbanking','wallet'],productTypes:['digital','travel','marketplace'],feeBps:195,fixedMinor:0,reliability:.995,priority:25,docs:'https://www.cashfree.com/docs/'},
  instamojo:{kind:'gateway',status:'supported',countries:['IN'],currencies:['INR'],methods:['upi','card','netbanking','wallet'],productTypes:['digital','travel'],feeBps:200,fixedMinor:300,reliability:.985,priority:18,docs:'https://docs.instamojo.com/reference/payments-api'},
  stripe:{kind:'gateway',status:'supported',countries:['*'],currencies:['*'],methods:['card','wallet','bank'],productTypes:['digital','travel'],feeBps:300,fixedMinor:0,reliability:.997,priority:20,docs:'https://docs.stripe.com/payments'},
  paypal:{kind:'gateway',status:'supported',countries:['*'],currencies:['*'],methods:['paypal'],productTypes:['digital','travel'],feeBps:440,fixedMinor:30,reliability:.994,priority:13,docs:'https://developer.paypal.com/docs/checkout/'},

  /* Merchant-of-Record providers are deliberately limited to RoamWise's own
   * eligible digital products/subscriptions. They must NOT be used to collect
   * money for third-party hotel/experience partners or securities/investment. */
  dodo:{kind:'mor',status:'checkout_link',countries:['*'],currencies:['*'],methods:['card','wallet','upi','paypal','bank'],productTypes:['digital'],feeBps:400,fixedMinor:40,reliability:.99,priority:24,checkoutEnv:'PAY_DODO_CHECKOUT_URL',docs:'https://dodopayments.com/'},
  creem:{kind:'mor',status:'checkout_link',countries:['*'],currencies:['*'],methods:['card','wallet'],productTypes:['digital'],feeBps:390,fixedMinor:40,reliability:.99,priority:22,checkoutEnv:'PAY_CREEM_CHECKOUT_URL',docs:'https://www.creem.io/'},
  paddle:{kind:'mor',status:'checkout_link',countries:['*'],currencies:['*'],methods:['card','wallet'],productTypes:['digital'],feeBps:500,fixedMinor:50,reliability:.993,priority:14,checkoutEnv:'PAY_PADDLE_CHECKOUT_URL',docs:'https://developer.paddle.com/'},
  lemonsqueezy:{kind:'mor',status:'checkout_link',countries:['*'],currencies:['*'],methods:['card','wallet'],productTypes:['digital'],feeBps:500,fixedMinor:50,reliability:.99,priority:12,checkoutEnv:'PAY_LEMONSQUEEZY_CHECKOUT_URL',docs:'https://docs.lemonsqueezy.com/'},

  /* Coinbase Commerce was folded into Coinbase Business. Keep this provider
   * disabled by default because Business availability is country-dependent. */
  coinbase_business:{kind:'crypto',status:'checkout_link',countries:['US','SG'],currencies:['USD','USDC'],methods:['crypto'],productTypes:['digital'],feeBps:100,fixedMinor:0,reliability:.99,priority:16,checkoutEnv:'PAY_COINBASE_BUSINESS_CHECKOUT_URL',docs:'https://www.coinbase.com/business'},

  /* Crypto->UPI bridges are experimental. They are third-party settlement rails,
   * not RoamWise custody. They never auto-route unless ALLOW_EXPERIMENTAL_CRYPTO_UPI=true.
   * Provider claims/status must be re-verified before production activation. */
  cryptose:{kind:'crypto_to_upi',status:'experimental',countries:['IN'],currencies:['INR'],methods:['crypto_upi'],productTypes:['digital'],feeBps:100,fixedMinor:0,reliability:.80,priority:-25,experimental:true,checkoutEnv:'PAY_CRYPTOSE_CHECKOUT_URL',docs:'https://cryptose.co.in/crypto-to-upi'},
  rupto:{kind:'crypto_to_upi',status:'experimental',countries:['IN'],currencies:['INR'],methods:['crypto_upi'],productTypes:['digital'],feeBps:80,fixedMinor:0,reliability:.75,priority:-30,experimental:true,checkoutEnv:'PAY_RUPTO_CHECKOUT_URL',docs:'https://rupto.in/crypto-to-upi'},
  swaps:{kind:'crypto_offramp',status:'experimental',countries:['IN'],currencies:['INR'],methods:['crypto_upi'],productTypes:['digital'],feeBps:150,fixedMinor:0,reliability:.75,priority:-35,experimental:true,checkoutEnv:'PAY_SWAPS_CHECKOUT_URL',docs:'https://www.swaps.app/sell/usdc/with-upi/in-india'},

  direct_upi:{kind:'manual',status:'supported',countries:['IN'],currencies:['INR'],methods:['upi'],productTypes:['digital'],feeBps:0,fixedMinor:0,reliability:.92,priority:-20,manual:true}
};

export const NEVER_ROUTE_PRODUCT_TYPES = new Set(['investment','securities','equity','safe','convertible_note']);
export const MOR_KINDS = new Set(['mor']);

export function providerPublicView(){
  return Object.fromEntries(Object.entries(PROVIDERS).map(([key,p])=>[key,{
    kind:p.kind,status:p.status,countries:p.countries,currencies:p.currencies,
    methods:p.methods,productTypes:p.productTypes,experimental:!!p.experimental,docs:p.docs
  }]));
}
