(function() {
  'use strict';
  const catalog = window.RWShopCatalog;
  const grid = document.getElementById('products');
  let selected = null;
  const providers = window.RWShopProviders;
  providers.forEach(provider => {
    const option = document.createElement('option'); option.value = provider.id; option.textContent = provider.name;
    document.getElementById('provider').append(option);
    const card = document.createElement('article');
    const title = document.createElement('h3'); title.textContent = provider.name;
    const description = document.createElement('p'); description.textContent = provider.role + ' · Not connected';
    const link = document.createElement('a'); link.href = provider.url; link.textContent = 'Visit provider ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    card.append(title, description, link); document.getElementById('provider-options').append(card);
  });
  function render(filter) {
    grid.replaceChildren();
    const products = catalog.filter(p => filter === 'all' || p.category === filter);
    products.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product';
      const art = document.createElement('div');
      art.className = 'concept ' + p.tone;
      const motif = document.createElement('strong');
      motif.textContent = p.motif;
      const label = document.createElement('small');
      label.textContent = 'DESIGN DIRECTION · NOT A PRODUCT PHOTO';
      art.append(motif, label);
      const type = document.createElement('p'); type.className = 'eyebrow'; type.textContent = p.type;
      const title = document.createElement('h3'); title.textContent = p.name;
      const description = document.createElement('p'); description.textContent = p.description;
      const status = document.createElement('p'); status.className = 'muted'; status.textContent = 'In development · Price to be confirmed';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Enquire about this concept →';
      button.addEventListener('click', () => {
        selected = p;
        document.getElementById('provider-field').hidden = p.fulfilment !== 'pod';
        document.getElementById('provider').disabled = p.fulfilment !== 'pod';
        document.getElementById('request-form').reset();
        document.getElementById('selected-name').textContent = p.name;
        document.getElementById('size').disabled = !p.sizes;
        document.getElementById('size').closest('label').hidden = !p.sizes;
        document.getElementById('message-panel').hidden = true;
        document.getElementById('enquiry').hidden = false;
        document.getElementById('enquiry').scrollIntoView({behavior:'smooth',block:'start'});
        document.querySelector('#request-form ' + (p.sizes ? 'select' : 'input')).focus({preventScroll:true});
      });
      card.append(art, type, title, description, status, button); grid.append(card);
    });
    document.getElementById('count').textContent = products.length + ' concepts · Enquiries open';
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render(button.dataset.filter);
  }));
  document.getElementById('request-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!selected || !event.target.reportValidity()) return;
    const form = new FormData(event.target);
    const provider = selected.fulfilment === 'pod' ? providers.find(p => p.id === form.get('provider')) : null;
    const message = ['Hello RoamWise,', 'I am interested in: ' + selected.name + ' (' + selected.id + ').',
      selected.sizes ? 'Preferred size: ' + form.get('size') : 'Size: not applicable',
      selected.fulfilment === 'pod' ? 'Print provider preference: ' + (provider ? provider.name : 'Let RoamWise recommend') + ' (subject to confirmation)' : 'Fulfilment: travel-goods supplier to be confirmed',
      'Payment preference: ' + (form.get('payment') === 'upi' ? 'UPI to roamwisepay@ybl after order confirmation' : 'Cashfree secure checkout after order confirmation'),
      'Quantity: ' + form.get('quantity'), 'Delivery PIN: ' + (form.get('pincode') || 'Not supplied'),
      'Please share final sample photos, specifications, full price, delivery estimate and return terms when ready.',
      'I understand this is an enquiry only, not an order or reservation.'].join('\n');
    document.getElementById('message').value = message;
    document.getElementById('whatsapp').href = 'https://wa.me/919987379730?text=' + encodeURIComponent(message);
    document.getElementById('email').href = 'mailto:support@roamwise.co.in?subject=' + encodeURIComponent('RoamWise shop enquiry: ' + selected.id) + '&body=' + encodeURIComponent(message);
    document.getElementById('message-status').textContent = 'Message prepared, not sent. Open WhatsApp or email, then send when ready.';
    document.getElementById('message-panel').hidden = false;
  });
  document.getElementById('copy').addEventListener('click', async () => {
    const message = document.getElementById('message');
    try { await navigator.clipboard.writeText(message.value); document.getElementById('message-status').textContent = 'Copied. Paste into WhatsApp to +91 99873 79730 or email support@roamwise.co.in.'; }
    catch (_) { message.focus(); message.select(); document.getElementById('message-status').textContent = 'Select and copy the message, then send via WhatsApp to +91 99873 79730 or email support@roamwise.co.in.'; }
  });
  render('all');
})();
