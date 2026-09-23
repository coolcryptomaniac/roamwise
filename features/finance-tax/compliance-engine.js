/* RoamWise compliance sentinel — deterministic first, AI second.
 * This engine does not file returns or decide legal liability. It turns
 * founder/CA-confirmed facts into conservative operational gates.
 * Browser + Node compatible.
 */
(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RWComplianceSentinel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';

var SOURCES={
  gstRegistration:'https://cbic-gst.gov.in/hindi/CGST-bill-e.html',
  gstEcommerce:'https://cbic-gst.gov.in/hindi/sectoral-faq.html',
  gstInterstateServices:'https://cbic-gst.gov.in/hindi/pdf/integrated-tax/10_2017_IT.pdf',
  gstReturnsEco:'https://tutorial.gst.gov.in/userguide/returns/Creation_of_Outward_Supplies_Return_in_GSTR-1.htm',
  incomeTax194O:'https://www.incometaxindia.gov.in/w/section-194-o-5'
};

function num(v,d){v=Number(v);return Number.isFinite(v)&&v>=0?v:(d==null?0:d);}
function bool(v){return v===true||v==='true'||v===1||v==='1';}
function pct(v,total){return total>0?Math.round(v/total*1000)/10:0;}
function add(out,severity,code,title,detail,source){
  out.findings.push({severity:severity,code:code,title:title,detail:detail,source:source||null});
  if(severity==='block')out.hardBlocks.push(code);
}
function evaluate(input){
  input=input||{};
  var s={
    country:String(input.country||'IN').toUpperCase(),
    state:String(input.state||'').trim(),
    legalForm:String(input.legalForm||'proprietorship'),
    gstRegistered:bool(input.gstRegistered),
    gstin:String(input.gstin||'').trim().toUpperCase(),
    registrationThresholdINR:num(input.registrationThresholdINR,2000000),
    ownTaxableTurnoverINR:num(input.ownTaxableTurnoverINR),
    bookingGMVINR:num(input.bookingGMVINR),
    listingOnly:bool(input.listingOnly),
    facilitatesAccommodationBookings:bool(input.facilitatesAccommodationBookings),
    bookingCommissionEnabled:bool(input.bookingCommissionEnabled),
    collectsGuestConsideration:bool(input.collectsGuestConsideration),
    unregisteredAccommodationSuppliers:bool(input.unregisteredAccommodationSuppliers),
    paysIndianSuppliers:bool(input.paysIndianSuppliers),
    directGuestPaymentToSupplier:bool(input.directGuestPaymentToSupplier),
    currentAccountActive:bool(input.currentAccountActive),
    ledgerReconciled:bool(input.ledgerReconciled),
    contractsSigned:bool(input.contractsSigned),
    invoicesArchived:bool(input.invoicesArchived),
    evidenceCount:Math.floor(num(input.evidenceCount))
  };
  var out={
    status:'green',
    mode:'PRE_GST_LISTING_ONLY',
    state:s,
    hardBlocks:[],
    findings:[],
    actions:[],
    officialSources:SOURCES,
    generatedAt:new Date().toISOString()
  };

  if(s.country!=='IN'){
    add(out,'warn','global_tax_profile','Jurisdiction-specific review required','This ruleset is India-first. Do not reuse Indian GST/TDS assumptions for another country.',null);
    out.mode='GLOBAL_REVIEW';
  }

  if(s.gstRegistered){
    out.mode=s.facilitatesAccommodationBookings?'GST_READY_MARKETPLACE':'GST_REGISTERED_SERVICE';
    if(s.gstin && !/^[0-9]{2}[A-Z0-9]{13}$/.test(s.gstin)) add(out,'warn','gstin_format','Check GSTIN format','The saved GSTIN does not match the basic 15-character structural pattern. Verify it on the GST portal.',SOURCES.gstRegistration);
  }else{
    if(s.ownTaxableTurnoverINR>=s.registrationThresholdINR){
      add(out,'block','gst_threshold_crossed','Normal GST registration threshold reached','Founder-entered taxable turnover is at or above the configured registration threshold. Stop treating new taxable supplies as pre-GST until registration timing and invoicing are reviewed.',SOURCES.gstRegistration);
    }else if(s.ownTaxableTurnoverINR>=s.registrationThresholdINR*0.9){
      add(out,'warn','gst_threshold_90','GST threshold is close',pct(s.ownTaxableTurnoverINR,s.registrationThresholdINR)+'% of the configured threshold is used. Prepare registration and invoice cutover now.',SOURCES.gstRegistration);
    }else if(s.ownTaxableTurnoverINR>=s.registrationThresholdINR*0.75){
      add(out,'info','gst_threshold_75','Start GST preparation early',pct(s.ownTaxableTurnoverINR,s.registrationThresholdINR)+'% of the configured threshold is used. Confirm aggregate turnover and compulsory-registration exceptions with the CA.',SOURCES.gstRegistration);
    }

    if(s.facilitatesAccommodationBookings && s.unregisteredAccommodationSuppliers){
      add(out,'block','eco_9_5_accommodation','Do not activate unregistered accommodation bookings yet','CBIC guidance says an e-commerce operator can be liable for GST on notified accommodation supplied through it by a provider below the registration threshold, and the operator does not get the normal threshold exemption for that notified supply.',SOURCES.gstEcommerce);
    }
    if(s.collectsGuestConsideration && s.facilitatesAccommodationBookings){
      add(out,'block','eco_section_52_collection','Booking-money collection needs GST/ECO setup first','Where an e-commerce operator collects consideration for taxable supplies made through it by other suppliers, section 52 TCS/registration obligations can apply. Do not switch on guest-fund collection until the CA confirms the exact model and GST registration.',SOURCES.gstEcommerce);
    }
    if((s.facilitatesAccommodationBookings||s.bookingCommissionEnabled)&&!s.listingOnly){
      out.mode='PRE_GST_MARKETPLACE_REVIEW';
      add(out,'warn','marketplace_before_gstin','Marketplace activity needs specialist review','The normal ₹20 lakh service threshold is not the only GST test for an e-commerce accommodation platform. Keep payment/instant-booking gates conservative until a CA signs off.',SOURCES.gstRegistration);
    }
  }

  var ecom=s.facilitatesAccommodationBookings||s.bookingCommissionEnabled;
  if(ecom && (s.paysIndianSuppliers||s.directGuestPaymentToSupplier)){
    add(out,'warn','income_tax_194o','Review section 194-O TDS before settlements','The Income-tax law can treat an e-commerce operator as responsible for 194-O deduction on sales/services facilitated through the platform; the statute also addresses direct customer payments to the participant. Current published rate is 0.1%, subject to participant-specific exceptions and higher-rate rules. Configure TAN/TDS workflow with a CA before scale.',SOURCES.incomeTax194O);
  }

  if(!s.currentAccountActive) add(out,'warn','bank_trail','Use the business current account for operating flows','Keep listing fees, platform revenue, refunds and operating expenses in a dedicated business account once activated. Avoid mixing personal spending with RoamWise flows.');
  if(!s.ledgerReconciled) add(out,'warn','ledger_reconciliation','Reconciliation evidence is incomplete','Bank, Cashfree, direct UPI, refunds and partner settlements should reconcile to an append-only ledger with stable references.');
  if(!s.contractsSigned && ecom) add(out,'block','partner_contracts','Do not activate live booking without signed commercial terms','Retain the accepted MOU/version, pricing model, cancellation terms, tax status and media licence for every live booking partner.');
  if(!s.invoicesArchived) add(out,'warn','invoice_archive','Invoice/receipt archive is incomplete','Keep sales receipts/invoices, supplier invoices, gateway statements and refund documents by financial year.');
  if(s.evidenceCount<3) add(out,'info','evidence_manifest','Build the evidence manifest','Fingerprint bank activation, Cashfree KYC/settlement proof, signed partner terms and tax/registration decisions so later reviews can verify what existed at the time.');

  if(s.listingOnly&&!s.facilitatesAccommodationBookings&&!s.collectsGuestConsideration&&!s.bookingCommissionEnabled&&!s.gstRegistered&&s.ownTaxableTurnoverINR<s.registrationThresholdINR){
    out.mode='PRE_GST_LISTING_ONLY';
    add(out,'info','listing_only_lane','Conservative pre-GST operating lane','On the facts entered, RoamWise is being treated as selling its own listing/marketing service rather than collecting accommodation money or confirming marketplace bookings. Do not charge GST unless registered; use a normal commercial receipt/invoice that does not claim to be a GST tax invoice.');
  }

  if(out.hardBlocks.length)out.status='red';
  else if(out.findings.some(function(f){return f.severity==='warn';}))out.status='amber';

  out.actions=out.findings.filter(function(f){return f.severity==='block'||f.severity==='warn';}).map(function(f){return f.title;});
  return out;
}

function brief(result,question){
  var r=result||evaluate({});
  return [
    'ROAMWISE AI CA REVIEW — REDACTED OPERATING FACTS',
    'This is decision support, not a tax return, legal opinion, audit certificate or filing instruction.',
    'Mode: '+r.mode,
    'Status: '+r.status,
    'Country/state: '+r.state.country+' / '+(r.state.state||'not supplied'),
    'Legal form: '+r.state.legalForm,
    'GST registered: '+r.state.gstRegistered,
    'Founder-entered own taxable turnover INR: '+r.state.ownTaxableTurnoverINR,
    'Configured GST registration threshold INR: '+r.state.registrationThresholdINR,
    'Booking GMV INR (not automatically RoamWise revenue): '+r.state.bookingGMVINR,
    'Facilitates accommodation bookings: '+r.state.facilitatesAccommodationBookings,
    'Collects guest consideration for suppliers: '+r.state.collectsGuestConsideration,
    'Unregistered accommodation suppliers enabled: '+r.state.unregisteredAccommodationSuppliers,
    'Booking commission enabled: '+r.state.bookingCommissionEnabled,
    'Direct guest payment to supplier: '+r.state.directGuestPaymentToSupplier,
    'Current account active: '+r.state.currentAccountActive,
    'Ledger reconciled: '+r.state.ledgerReconciled,
    'Signed partner contracts: '+r.state.contractsSigned,
    'Invoice archive complete: '+r.state.invoicesArchived,
    'Hard blocks: '+(r.hardBlocks.join(', ')||'none'),
    'Findings: '+r.findings.map(function(f){return '['+f.severity.toUpperCase()+'] '+f.code+': '+f.detail;}).join(' | '),
    'Founder question: '+String(question||'Review what RoamWise should do next, what evidence is missing, and what requires a licensed CA/CS/lawyer.').slice(0,1200),
    'Instructions: distinguish RoamWise revenue from hotel GMV/partner funds; use current official Indian government sources for tax claims; identify uncertainty; never recommend hiding turnover, backdating documents or collecting tax without registration; provide a short checklist for a part-time CA to verify.'
  ].join('\n');
}
return{evaluate:evaluate,brief:brief,SOURCES:SOURCES};
});
