/* The public property collection. Reuses approved inventory and booking routes;
   browsing never needs an AI request, sign-in or a payment. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window), section, track, search, status, rail = null;
  /** @template {keyof HTMLElementTagNameMap} T
   * @param {T} tag @param {string} [cls] @param {string} [text]
   * @returns {HTMLElementTagNameMap[T]} */
  function node(tag, cls, text) {
    var el = document.createElement(tag); el.className = cls || '';
    if (text) el.textContent = text; return el;
  }
  function button(label, fn) {
    var b = node('button', '', label); b.type = 'button'; b.onclick = fn; return b;
  }
  function properties() {
    var seen = new Set();
    return (Array.isArray(W.RW_PARTNERS) ? W.RW_PARTNERS : W.RW_PARTNER_SEED || []).filter(function (p) {
      if (!p || p.cat !== 'stay' || typeof W.rwStayPublicEligible !== 'function' || !W.rwStayPublicEligible(p)) return false;
      if (typeof W.rwBookingOpen !== 'function' || !W.rwBookingOpen(p)) return false;
      var key = String(p.zone || '').toLowerCase() + '|' + String(p.name || '').toLowerCase().replace(/^hotel\s+/, '').replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false; seen.add(key); return true;
    });
  }
  function card(p) {
    var article = node('article', 'rw-property-card rw-design-travel');
    article.dataset.propertyId = p.id;
    var photo = (p.photos || []).map(function (x) {
      return { src: typeof W.rwListingPhotoUrl === 'function' ? W.rwListingPhotoUrl(x.src) : '', alt: x.alt };
    }).find(function (x) { return x.src; });
    if (photo) {
      var img = node('img'); img.src = photo.src; img.alt = photo.alt || p.name; img.loading = 'lazy';
      img.onerror = function () { img.replaceWith(node('div', 'rw-property-photo-pending', 'Property photos on request')); };
      article.append(img);
    } else article.append(node('div', 'rw-property-photo-pending', 'Property photos on request'));
    var copy = node('div', 'rw-property-copy');
    copy.append(node('small', 'rw-property-place', p.zone || 'RoamWise stay'), node('h3', '', p.name), node('p', '', p.area || p.zone));
    var routes = typeof W.rwBookingRoutes === 'function' ? W.rwBookingRoutes(p) : [];
    // Only use an existing first-party checkout returned by the central route registry.
    var pay = routes.find(function (r) { return r.type === 'pay' && /^\/packages\/amor-checkout\.html\?stay=[a-z0-9-]+$/.test(r.href); });
    var direct = routes.find(function (r) { return r.type === 'direct'; });
    var action;
    if (pay) {
      copy.append(node('p', 'rw-property-price', 'Choose dates to see your price'));
      action = node('a', 'rw-property-cta', 'Choose room & dates →'); action.href = pay.href;
      action.setAttribute('aria-label', 'Choose room and dates at ' + p.name);
    } else if (direct && typeof W.openStays === 'function') {
      copy.append(node('p', 'rw-property-price', 'Rooms available to request'));
      action = button('See rooms & dates →', function () { W.openStays(p.zone || '', p.id); }); action.className = 'rw-property-cta';
      action.setAttribute('aria-label', 'See rooms and dates at ' + p.name);
    } else {
      copy.append(node('p', 'rw-property-price', 'Availability & price on request'));
      action = node('a', 'rw-property-cta', 'Request dates & quote →');
      action.href = '/escapes/?' + new URLSearchParams({ stay: p.name, zone: p.zone || '' }).toString() + '#request-quote';
      action.setAttribute('aria-label', 'Request dates and quote for ' + p.name);
    }
    copy.append(action, node('small', 'rw-property-note', pay ? 'Review the total and booking terms before payment. Property confirmation is required.' : 'Send a request; dates and the final total need confirmation.'));
    article.append(copy); return article;
  }
  function render() {
    if (!track) return;
    var query = search.value.trim().toLowerCase(), all = properties();
    var matches = all.filter(function (p) { return query.split(/\s+/).every(function (word) { return [p.name, p.zone, p.area].join(' ').toLowerCase().includes(word); }); });
    /* Endless rail: cards are built a page at a time and the list starts again after the last property (js/ui/rail-engine.js). */
    if (W.RWRail) { if (!rail) rail = W.RWRail.create(track, { render: card, pageSize: 10, items: [] }); rail.setItems(matches); }
    else { track.replaceChildren(); matches.forEach(function (p) { track.append(card(p)); }); track.scrollLeft = 0; }
    status.textContent = matches.length ? matches.length + ' of ' + all.length + ' properties · swipe to explore' : 'No property matches this search. Clear it to browse all ' + all.length + ' properties.';
    if (!all.length) status.textContent = 'The property list is not available yet. Browse the stays directory or contact booking support.';
    section.querySelectorAll('[data-stay-arrow]').forEach(function (b) { b.disabled = matches.length < 2; });
  }
  function slide(direction) {
    var first = track.firstElementChild; if (!first) return;
    var step = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 13);
    var max = track.scrollWidth - track.clientWidth, next = track.scrollLeft + direction * step;
    if (direction > 0 && track.scrollLeft >= max - 2 && !rail) next = 0;
    if (direction < 0 && track.scrollLeft <= 2) next = max;
    var motion = W.RWDesignEngine ? W.RWDesignEngine.motionEnabled() : !(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches);
    track.scrollTo({ left: next, behavior: motion ? 'smooth' : 'auto' });
  }
  function mount() {
    if (section) return true;
    var hero = document.getElementById('copilotHero'); if (!hero) return false;
    section = node('section', 'v v-home rw-stay-browser'); section.id = 'rwStayBrowser'; section.setAttribute('aria-labelledby', 'rwStayBrowserTitle');
    var head = node('div', 'rw-stay-browser-head'), title = node('h2', '', 'Find your next stay'); title.id = 'rwStayBrowserTitle'; title.tabIndex = -1;
    var text = node('div'); text.append(node('small', 'rw-property-place', 'STAY WITH ROAMWISE'), title, node('p', '', 'Every published property, one swipe away. Pick a stay to choose your room and dates.'));
    var arrows = node('div', 'rw-stay-browser-arrows');
    [-1, 1].forEach(function (d) { var b = button(d < 0 ? '‹' : '›', function () { slide(d); }); b.dataset.stayArrow = String(d); b.setAttribute('aria-label', d < 0 ? 'Previous property' : 'Next property'); arrows.append(b); });
    head.append(text, arrows);
    var filter = node('div', 'rw-stay-browser-filter'), label = node('label', '', 'Find a property or destination'); label.htmlFor = 'rwStaySearch';
    search = node('input'); search.id = 'rwStaySearch'; search.type = 'search'; search.placeholder = 'Almora, Manali, Corbett…'; search.maxLength = 120; search.addEventListener('input', render);
    filter.append(label, search, button('Show all properties', function () { search.value = ''; render(); search.focus(); }));
    status = node('p', 'rw-stay-browser-status'); status.setAttribute('role', 'status');
    track = node('div', 'rw-property-track'); track.id = 'rwStayTrack'; track.setAttribute('role', 'region'); track.setAttribute('aria-label', 'All RoamWise properties'); track.tabIndex = 0;
    track.addEventListener('keydown', function (e) { if (e.target === track && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); slide(e.key === 'ArrowLeft' ? -1 : 1); } });
    var directory = node('a', 'rw-stay-directory', 'Open the full stays directory →'); directory.href = '/partner/index.html?role=customer';
    section.append(head, filter, status, track, directory);
    var credit = document.getElementById('rwCreditCard'); (credit || hero).insertAdjacentElement('afterend', section);
    render(); return true;
  }
  W.rwOpenStayBrowser = function (destination) {
    if (!mount()) { W.location.href = '/partner/index.html?role=customer'; return; }
    if (typeof W.rwPageClose === 'function') W.rwPageClose();
    if (typeof W.tabGo === 'function') W.tabGo('home');
    var guided = document.getElementById('rwGuidedPrompt'); if (guided) guided.hidden = true;
    var help = document.getElementById('rwBookingHelp'); if (help) help.hidden = true;
    search.value = typeof destination === 'string' ? destination.slice(0, 120) : ''; render();
    section.scrollIntoView({ block: 'start', behavior: 'auto' });
    section.querySelector('h2').focus({ preventScroll: true });
  };
  W.rwOpenBookingHelp = function () {
    var hero = document.getElementById('copilotHero'); if (!hero) { W.location.href = '/partner/index.html?role=customer'; return; }
    if (typeof W.tabGo === 'function') W.tabGo('home');
    var guided = document.getElementById('rwGuidedPrompt'); if (guided) guided.hidden = true;
    var help = document.getElementById('rwBookingHelp');
    if (!help) {
      help = node('section', 'rw-booking-help'); help.id = 'rwBookingHelp'; help.setAttribute('aria-labelledby', 'rwBookingHelpTitle');
      var title = node('h3', '', 'How can we help with your booking?'); title.id = 'rwBookingHelpTitle'; title.tabIndex = -1;
      var actions = node('div', 'rw-booking-help-actions');
      actions.append(button('Find & book a stay', function () { W.rwOpenStayBrowser(); }), button('View my reservations', function () { if (typeof W.rwOpenTripDesk === 'function') W.rwOpenTripDesk(); else W.location.href = '/partner/index.html?role=customer'; }), button('View my trip requests', function () { if (typeof W.openBooking === 'function') W.openBooking(); else W.location.href = '/partner/index.html?role=customer'; }));
      var support = node('a', '', 'Contact booking support'); support.href = 'mailto:support@roamwise.co.in?subject=Booking%20support'; actions.append(support);
      help.append(title, node('p', '', 'Choose a property to start booking, review your reservations, or get help with an existing request.'), actions, button('Close booking help', function () { help.hidden = true; var trigger = /** @type {HTMLElement|null} */ (document.querySelector('[data-rw-tusk="booking"]')); if (trigger) trigger.focus(); }));
      hero.append(help);
    }
    help.hidden = false; help.scrollIntoView({ block: 'nearest' }); help.querySelector('h3').focus({ preventScroll: true });
  };
  document.addEventListener('rw:partners-refreshed', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
