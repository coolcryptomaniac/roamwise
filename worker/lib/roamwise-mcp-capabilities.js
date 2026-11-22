/* Public, versioned capabilities manifest. No secrets or account state.
 * This is a CONTRACT for clients, not proof of a payment integration.
 * Each future feature gets a separate adapter and release gate. */
export const CAPABILITIES_VERSION='1.1.0';
export const publicCapabilities=()=>({
 service:'RoamWise AI discovery and commerce previews',
 version:CAPABILITIES_VERSION,
 baseUrl:'https://roamwise-api.founder-f53.workers.dev',
 transport:'streamable_http_stateless',
 protocol:['2026-07-28','2025-11-25','2025-03-26'],
 clientPresentation:{mcpApps:'optional_host_support',fallback:'structured_json',cards:'swipeable_v2'},
 modules:{
  listings:{status:'available',types:['artist','stay','package','assistant','itinerary'],publicOnly:true},
  creators:{status:'awaiting_approved_public_profiles',privateProfilesExposed:false},
  experiences:{status:'future_approved_catalog',bookableNow:false},
  itineraries:{status:'public_editorial_presets',share:'canonical_public_link',pdf:'existing_public_preset',personalTripsExposed:false},
  shop:{status:'server_quote_and_merchant_checkout',inChatPayment:false,liveInventoryVerified:false},
  stays:{status:'server_quote_and_assisted_confirmation',inChatPayment:false,instantBooking:false},
  wallet:{status:'first_party_only',publicMcpAccess:false,oauthRequiredForFuture:true,autoDebit:false},
  payments:{status:'merchant_controlled',provider:'Cashfree',userApprovalRequired:true,chatgptWalletLinked:false}
 },
 privacy:{anonymousPublicDiscovery:true,authenticatedAccountData:false,ownerContacts:false,privateTrips:false,secretTokens:false},
 compatibility:{chats:['ChatGPT (supported connector configurations)','Claude (supported connector configurations)'],installationAutomaticallyEnabled:false}
});
