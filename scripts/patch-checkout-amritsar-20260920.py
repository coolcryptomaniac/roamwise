#!/usr/bin/env python3
"""One-time narrow patch; assertions prevent accidental edits after upstream changes."""
from pathlib import Path


def change(filename, old, new):
    p = Path(filename)
    text = p.read_text(encoding='utf-8')
    assert text.count(old) == 1, f'{filename}: expected one exact match, found {text.count(old)}'
    p.write_text(text.replace(old, new), encoding='utf-8')


change('worker/handlers/cashfree.js', '''  try{
    const sa = parseServiceAccount(env);
    const claims = await verifyFirebaseIdToken(match[1], sa.project_id);
    const accessToken = await getServiceAccountAccessToken(env);
    return { claims, accessToken, projectId:sa.project_id };
  }catch(e){
    return { error:json({ error:'unauthorized', message:'Your sign-in expired. Sign in again.' }, 401) };
  }
''', '''  // A failed server-side Google OAuth exchange is NOT an expired user session.
  // Keep diagnostics categorical: never send private keys, access tokens or
  // raw Google responses to clients. Missing/malformed service credentials
  // and transient identity infrastructure failures must not prompt relogin.
  let sa;
  try{ sa = parseServiceAccount(env); }
  catch(_){
    return { error:json({ error:'server_auth_config_invalid', message:'Payment verification is temporarily unavailable. Please contact support; do not pay again.' }, 503) };
  }
  let claims;
  try{ claims = await verifyFirebaseIdToken(match[1], sa.project_id); }
  catch(e){
    if(/failed to fetch Firebase JWKS|unknown signing key/i.test(String(e && e.message || ''))){
      return { error:json({ error:'identity_service_unavailable', message:'Secure sign-in verification is temporarily unavailable. Please retry later.' }, 503) };
    }
    return { error:json({ error:'unauthorized', message:'Your session could not be verified. Please sign in again.' }, 401) };
  }
  try{
    const accessToken = await getServiceAccountAccessToken(env);
    return { claims, accessToken, projectId:sa.project_id };
  }catch(_){
    return { error:json({ error:'server_auth_unavailable', message:'Our payment verification service is unavailable. No payment was started; please contact support.' }, 503) };
  }
''')

# A stale Firebase ID token can be refreshed once, but a 503 is a server issue,
# never fixed by signing out. A 401 is safely before order creation and can
# retry once. Preserve unknown/network-order failures without duplicate POSTs.
change('js/payments/providers/cashfree-adapter.js', '''  return u.getIdToken();
''', '''  return u.getIdToken(true);
''')
change('js/payments/providers/cashfree-adapter.js', '''  _cfOrderPromise = _cfToken().then(function(token){return fetch(endpoint, {
    method: 'POST',headers: {'Content-Type': 'application/json','Authorization':'Bearer '+token},
    body: JSON.stringify({amount: shell.amountINR, customer: customer, meta: {planId: shell.planId, tierId: shell.tierId, label: shell.label}})
  });}).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(d){if(!r.ok) throw new Error((d&&d.message)||'Cashfree order creation failed.');return d;});
  }).then(function(d){
''', '''  function postOrder(token){return fetch(endpoint, {
    method: 'POST',headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
    body: JSON.stringify({amount:shell.amountINR,customer:customer,meta:{planId:shell.planId,tierId:shell.tierId,label:shell.label}})
  }).then(function(r){return r.json().catch(function(){return {};}).then(function(d){
    if(!r.ok){var e=new Error((d&&d.message)||'Cashfree order creation failed.');e.code=d&&d.error||'';e.status=r.status;throw e;}
    return d;
  });});}
  _cfOrderPromise = _cfToken().then(function(token){return postOrder(token);}).catch(function(e){
    // Only definitive 401s are safe to retry: no order was created.
    if(e.status===401){return _cfToken().then(postOrder);}
    throw e;
  }).then(function(d){
''')
change('js/payments/providers/cashfree-adapter.js', '''    _cfOrderPromise.then(function(ready){
      return _cfLoadSdk().then(function(){ return ready; });
''', '''    // An earlier failed attempt must not become a permanent rejected promise.
    // Reuse an already-issued session only for this exact order shell.
    if(_cfOrderPromise && !order.ready && order.needsAuth){_cfOrderPromise=null;}
    _cfOrderPromise.then(function(ready){
      if(ready!==order)throw new Error('Your plan changed. Reopen checkout for the selected plan.');
      return _cfLoadSdk().then(function(){ return ready; });
''')
# Reset after definitive pre-creation errors only; unknown network errors
# are intentionally not retried automatically because an order may exist.
change('js/payments/providers/cashfree-adapter.js', '''    }).catch(function(e){
      showToast('Could not open Cashfree checkout' + ((e && e.message) ? ': ' + e.message : ' — try again.'));
    });
''', '''    }).catch(function(e){
      if(e && (e.status===401 || e.status===503 || e.code==='server_auth_unavailable' || e.code==='server_auth_config_invalid'))_cfOrderPromise=null;
      var text=(e&&e.message)||'Payment cannot start right now.';
      showToast('Could not open Cashfree checkout: '+text+(e&&e.status===401?'':' Check My payments before trying again.'));
    });
''')

# Real, named sites beat a misleading generic template. This offline guide is
# intentionally not presented as live crowd/traffic/event data.
needle = '''  function smartFallback(err){
    var list=[]; for(var i=0;i<days && i<DAY_TEMPLATES.length;i++){ var t=DAY_TEMPLATES[i]; list.push({day:i+1,title:t.title,morning:t.morning,afternoon:t.afternoon,evening:t.evening,tip:t.tip}); }
'''
replacement = '''  function localNamedDays(){
    if(!/(^|\\W)amritsar(\\W|$)/i.test(String(name||'')))return null;
    var verified=[
      {title:'Harmandir Sahib and the old city',morning:'Sri Harmandir Sahib (Golden Temple): visit respectfully; cover your head and leave shoes at the designated area.',afternoon:'Walk to Jallianwala Bagh memorial; read the 1919 history at the preserved site.',evening:'Explore Heritage Street and the old-city lanes near the Golden Temple.',food:'Try Amritsari kulcha with chole; Guru Ka Langar is a free community meal.',tip:'No paid shortcut or compulsory donation is needed for the langar. Verify current entry arrangements.'},
      {title:'Partition, markets and shared heritage',morning:'Partition Museum at Town Hall: plan for its published opening days; check closures first.',afternoon:'Walk Hall Bazaar and the historic city gates, comparing crafts without pressure to buy.',evening:'Visit Durgiana Temple if open and appropriate to your interests.',food:'Try a lassi and local Punjabi vegetarian thali; ask prices before ordering.',tip:'The Partition Museum normally closes Mondays; verify its official schedule and admission.'},
      {title:'Fort and Sikh Empire history',morning:'Gobindgarh Fort: explore Maharaja Ranjit Singh-era fortifications and exhibits.',afternoon:'Maharaja Ranjit Singh Museum in Ram Bagh/Company Bagh; confirm opening hours.',evening:'Browse Katra Jaimal Singh for textiles, or enjoy a slower meal nearby.',food:'Amritsari kulcha or seasonal saag; check restaurant hygiene and menu prices.',tip:'Book fort experiences only via official counters; show times and tickets can change.'},
      {title:'Sacred sites beyond the busiest lanes',morning:'Visit Gurdwara Baba Atal Sahib and Guru Ke Mahal, keeping worshippers’ space clear.',afternoon:'Explore the Central Sikh Museum if accessible; read exhibits rather than rushing.',evening:'Return to the Golden Temple precinct for a quieter reflective walk if comfortable.',food:'Eat at the langar or a clearly priced family restaurant.',tip:'Sacred areas have photography and dress rules; follow on-site instructions.'},
      {title:'Ram Tirath and Punjabi neighbourhoods',morning:'Visit the Ram Tirath religious complex west of the city; arrange a return ride.',afternoon:'Explore a local bazaar away from the main tourist circuit with a known driver.',evening:'Walk Ram Bagh park surroundings if accessible; keep spare travel time.',food:'Try fresh-made kulcha or dal; carry drinking water in warm weather.',tip:'Agree the full taxi or auto fare before leaving; verify opening and travel times.'},
      {title:'Tarn Taran and Goindwal Sahib day trip',morning:'Travel to Tarn Taran Sahib; allow time for respectful exploration.',afternoon:'Continue to Goindwal Sahib if transport and site access permit.',evening:'Return to Amritsar before late evening; avoid tight transfer connections.',food:'Take water and food for the journey; use hygienic local eateries.',tip:'Confirm distances, traffic and any religious-site access before departure.'},
      {title:'Pul Kanjari and Attari border',morning:'See Pul Kanjari heritage complex near the border if current access permits.',afternoon:'Travel to the Attari-Wagah ceremony venue with substantial security and queue buffer.',evening:'Attend the border ceremony only if scheduled that day; return after the crowds.',food:'Eat in Amritsar before departing; carry water where permitted.',tip:'Ceremony times, access and photography rules can change. Verify with official authorities the same day.'}
    ];
    var total=Math.max(1,Math.min(Number(days)||1,verified.length));
    return verified.slice(0,total).map(function(day,i){return Object.assign({day:i+1},day);});
  }
  function smartFallback(err){
    var local=localNamedDays();
    if(local){
      window._lastItin={name:name,days:local,ai:false,source:'reviewed-local-offline'};
      renderDays(local,'<div class="itin-src preset">Named Amritsar guide · offline reference, not live availability, prices, events or crowd counts · <a href="https://amritsar.nic.in/tourist-places/" target="_blank" rel="noopener noreferrer">District tourist places</a></div>');
      return;
    }
    var list=[]; for(var i=0;i<days && i<DAY_TEMPLATES.length;i++){ var t=DAY_TEMPLATES[i]; list.push({day:i+1,title:t.title,morning:t.morning,afternoon:t.afternoon,evening:t.evening,tip:t.tip}); }
'''
change('js/itinerary/build.js', needle, replacement)
change('js/itinerary/build.js', '''  if(rwHasPresets()){
    RW_PRESETS.find(rwPresetQuery(false)).then(function(hit){
''', '''  // Fast offline first-paint for Amritsar in Smart/no-key mode: no manifest
  // fetch or failing AI call on the critical path. AI remains available when
  // explicitly configured, with named fallback if it times out.
  if(localNamedDays() && (activeProv==='smart' || (activeProv!=='roamwise' && !lsGet('rwKey_'+activeProv)))){
    smartFallback();return;
  }
  if(rwHasPresets()){
    RW_PRESETS.find(rwPresetQuery(false)).then(function(hit){
''')
print('Patched scoped payment and Amritsar code with exact-match assertions.')
