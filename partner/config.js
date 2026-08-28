/* RoamWise Partner drop-in configuration.
   This file contains only public browser configuration. Never put secret API tokens here. */
window.RW_PARTNER_CONFIG = {
  version: '2026.08.25-dropin-1',
  firebase: {
    apiKey: 'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU',
    authDomain: 'roamwisepro.firebaseapp.com',
    projectId: 'roamwisepro',
    storageBucket: 'roamwisepro.firebasestorage.app',
    messagingSenderId: '299014744987',
    appId: '1:299014744987:web:d5c316743e6d7a10904f3e'
  },
  commercial: {
    stayCommissionPct: 8,
    completedStatuses: ['completed','checked_out'],
    directFirst: true,
    externalGapThreshold: 4
  },
  publicTravel: {
    /* These are safe public destinations/templates. Admin can override them from the portal.
       Supported placeholders: {destination}, {checkin}, {checkout}, {guests}. */
    bookingStay: 'https://www.booking.com/searchresults.html?ss={destination}&checkin={checkin}&checkout={checkout}&group_adults={guests}',
    tripStay: 'https://www.trip.com/hotels/list?city={destination}',
    expediaStay: 'https://www.expedia.com/Hotel-Search?destination={destination}&startDate={checkin}&endDate={checkout}',
    flight: 'https://www.aviasales.com/search?destination={destination}',
    car: 'https://www.discovercars.com/en/search?location={destination}',
    experience: 'https://www.viator.com/searchResults/all?text={destination}'
  }
};
