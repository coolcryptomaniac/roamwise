/* Explicit visitor-initiated map/official links. No location requests or embeds. */
(function (root) {
  'use strict';
  root.RWKainchiUI.visit = function (ctx) {
    var links = {
      trust: 'https://shreekainchimandirtrust.org/contact',
      district: 'https://nainital.nic.in/tourist-place/kaichi-dham/',
      bus: 'https://utconline.uk.gov.in/',
      police: 'https://x.com/nainitalpolice_',
      hospitals: 'https://nainital.nic.in/public-utility-category/hospitals/',
      disaster: 'https://nainital.nic.in/disaster-management/',
      dm: 'https://nainital.nic.in/',
      policeDirectory: 'https://nainital.nic.in/divisions/police/',
      grievance: 'https://cmhelpline.uk.gov.in/',
      baba: 'https://shreekainchimandirtrust.org/maharaj_ji',
      history: 'https://shreekainchimandirtrust.org/about',
      gallery: 'https://shreekainchimandirtrust.org/gallery',
      photo: 'https://commons.wikimedia.org/wiki/File:Neemkaroli_14.jpg',
      parking: 'https://www.google.com/maps/search/?api=1&query=parking%20near%20Kainchi%20Dham%20Uttarakhand'
    };
    document.querySelectorAll('[data-visit-link]').forEach(function (a) {
      a.href = links[a.getAttribute('data-visit-link')]; a.target = '_blank'; a.rel = 'noopener noreferrer';
    });
    var origins = {
      kathgodam: 'Kathgodam Railway Station, Uttarakhand', haldwani: 'Haldwani, Uttarakhand',
      nainital: 'Nainital, Uttarakhand', almora: 'Almora, Uttarakhand', delhi: 'Delhi, India',
      pantnagar: 'Pantnagar Airport, Uttarakhand'
    };
    function route() {
      var origin = origins[ctx.$('route-origin').value];
      var url = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent('Kainchi Dham, Uttarakhand, India') + '&travelmode=driving';
      if (origin) url += '&origin=' + encodeURIComponent(origin);
      ctx.$('route-open').href = url;
    }
    ctx.$('route-origin').addEventListener('change', route);
    ctx.onLang(function () {
      ctx.$('baba-photo').alt = ctx.t('baba_alt');
      ctx.$('guide-freshness').textContent = ctx.t(ctx.today > '2026-11-08' ? 'guide_old' : 'guide_checked');
      route();
    });
  };
})(window);
