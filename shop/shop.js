(function() {
  'use strict';
  const catalog = window.RWShopCatalog;
  const grid = document.getElementById('products');
  let selected = null;
  function render(filter) {
    grid.replaceChildren();
    const products = catalog.filter(p => filter === 'all' || p.category === filter);
    products.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product';
      if (p.live) {
        card.classList.add('live');
        const img = document.createElement('img'); img.src = p.image; img.alt = p.alt; img.loading = 'lazy'; img.width = 360; img.style.cssText = 'max-width:100%;height:auto;border-radius:12px';
        const ltype = document.createElement('p'); ltype.className = 'eyebrow'; ltype.textContent = p.type;
        const ltitle = document.createElement('h3'); ltitle.textContent = p.name;
        const ldesc = document.createElement('p'); ldesc.textContent = p.description;
        const lprice = document.createElement('p'); const pb = document.createElement('strong'); pb.textContent = p.price + ' · Available now'; lprice.append(pb);
        const link = document.createElement('a'); link.className = 'button'; link.href = p.href; link.textContent = 'View and order →';
        card.append(img, ltype, ltitle, ldesc, lprice, link); grid.append(card);
        return;
      }
      const art = document.createElement('div');
      art.className = 'concept ' + p.tone;
      if (p.visual) art.classList.add('visual-' + p.visual);
      const motif = document.createElement('strong');
      motif.textContent = p.motif;
      const label = document.createElement('small');
      label.textContent = 'ROAMWISE ORIGINAL · DESIGN PREVIEW';
      if (p.visual) { const shape=document.createElement('span'); shape.className='merch-shape'; shape.setAttribute('aria-hidden','true'); art.append(shape); }
      art.append(motif, label);
      const type = document.createElement('p'); type.className = 'eyebrow'; type.textContent = p.type;
      const title = document.createElement('h3'); title.textContent = p.name;
      const description = document.createElement('p'); description.textContent = p.description;
      const status = document.createElement('p'); status.className = 'muted'; status.textContent = 'In development · Price to be confirmed';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Enquire about this concept →';
      button.addEventListener('click', () => {
        selected = p;
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
    const nLive = products.filter(p => p.live).length;
    document.getElementById('count').textContent = (nLive ? nLive + ' available now · ' : '') + (products.length - nLive) + ' concepts · Enquiries open';
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render(button.dataset.filter);
  }));
  document.getElementById('request-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!selected || !event.target.reportValidity()) return;
    const form = new FormData(event.target);
    const message = ['Hello RoamWise,', 'I am interested in: ' + selected.name + ' (' + selected.id + ').',
      selected.sizes ? 'Preferred size: ' + form.get('size') : 'Size: not applicable',
      'Fulfilment: RoamWise will confirm materials, stock and delivery before payment',
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
