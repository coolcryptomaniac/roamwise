// Small deterministic offline itinerary, only when the live AI cannot answer.
// Never claims verified attractions, fares, availability or reservations.
function rwOfflineTripOutline(intents, esc) {
  var count = Math.max(0, Math.min(14, Math.floor(Number(intents && intents.days) || 0)));
  if (!count || !intents.dest) return '';
  var title = esc(String(intents.dest).slice(0,90));
  var days = [];
  for (var day = 1; day <= count; day++) {
    var activity = day === 1 ? 'Arrival, local orientation and a relaxed evening'
      : day === count ? 'Checkout, buffer time and return journey'
      : day % 3 === 2 ? 'Explore a verified local attraction and nearby food'
      : day % 3 === 0 ? 'Culture, neighbourhood discovery and flexible activities'
      : 'Choose a day excursion after checking realistic journey time';
    days.push('<p><strong>Day '+day+':</strong> '+activity+'.</p>');
  }
  return '<h3>'+count+'-day planning outline for '+title+'</h3>'
    +'<p>Offline planning outline, not a confirmed itinerary. No live transport, weather, availability or prices have been checked.</p>'
    +days.join('')
    +'<p>To personalize: share departure city, travel dates, travellers and total budget. Check current travel advisories and property availability before booking.</p>';
}
