/* Organiser plans: render plans.json. Prices left null show "Founding price on request".
   No checkout here: choosing a plan opens an email to the founder with the plan name. */
(function () {
  'use strict';
  function node(tag, cls, text) { var el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function priceText(p) {
    if (p.id === 'monthly' && p.priceMonthly != null) return inr(p.priceMonthly) + ' / month';
    if (p.id === 'per-trip' && p.pricePerTrip != null) return inr(p.pricePerTrip) + ' / trip';
    if (p.id === 'commission' && p.commissionPct != null) return 'Free · ' + p.commissionPct + '% on money moved';
    return p.id === 'commission' ? 'Free to start' : 'Founding price on request';
  }
  function render(plans) {
    var host = document.getElementById('ogPlans'); host.textContent = '';
    plans.forEach(function (p) {
      var card = node('article', 'og-plan');
      card.append(node('h3', '', p.name), node('p', 'og-tag', p.tagline || ''), node('p', 'og-price', priceText(p)));
      if (p.id === 'monthly' && p.trialDays) card.appendChild(node('p', 'og-trial', p.trialDays + '-day free trial'));
      var ul = node('ul'); (p.points || []).forEach(function (t) { ul.appendChild(node('li', '', t)); }); card.appendChild(ul);
      var a = node('a', 'og-btn primary', 'Choose ' + p.name);
      a.href = 'mailto:founder@roamwise.co.in?subject=' + encodeURIComponent('Organiser plan: ' + p.name) + '&body=' + encodeURIComponent('Company / organiser name:\nTrips per month:\nUsual group size:\nPhone:\n');
      card.appendChild(a);
      host.appendChild(card);
    });
  }
  fetch('plans.json', { cache: 'no-store' }).then(function (r) { return r.json(); })
    .then(function (d) { render((d && d.plans) || []); })
    .catch(function () { document.getElementById('ogPlans').textContent = 'Plans could not load. Email founder@roamwise.co.in.'; });
})();
