/* GET /shop/feed.xml: the buyable shop catalogue as an RSS 2.0 product feed (Google Merchant Center free
 * listings and the Meta/Instagram catalogue both read this format). Only products checkout can sell are
 * listed; prices come from the same server catalogue as checkout. No supplier data or SKUs. */
const SITE = 'https://roamwise.co.in';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rupees = (p) => (p / 100).toFixed(2) + ' INR';
const CATEGORY = { hoodie: '5598', tee: '212', tote: '6551', headband: '2477' }; // Google product taxonomy ids

function categoryFor(p) {
  const t = (p.type + ' ' + p.name).toLowerCase();
  if (t.includes('hoodie') || t.includes('sweatshirt')) return CATEGORY.hoodie;
  if (t.includes('tote') || t.includes('bag')) return CATEGORY.tote;
  if (t.includes('headband')) return CATEGORY.headband;
  return CATEGORY.tee;
}

export function buildFeed(catalogue, opts = {}) {
  const items = [];
  for (const p of catalogue.products) {
    if (!p || !/^https:\/\//.test(p.image || '') || !Number.isInteger(p.pricePaise)) continue;
    const many = p.variants.length > 1;
    for (const v of p.variants) {
      const [colour, size] = String(v.label || '').split('·').map((s) => s.trim());
      items.push('<item>'
        + '<g:id>' + esc(many ? p.id + '--' + v.id : p.id) + '</g:id>'
        + (many ? '<g:item_group_id>' + esc(p.id) + '</g:item_group_id>' : '')
        + '<title>' + esc(p.name + (many ? ' (' + v.label + ')' : '')) + '</title>'
        + '<description>' + esc(p.description) + '</description>'
        + '<link>' + esc(SITE + '/shop/?buy=' + encodeURIComponent(p.id)) + '</link>'
        + '<g:image_link>' + esc(p.image) + '</g:image_link>'
        + '<g:availability>' + (opts.checkoutOpen === false ? 'out_of_stock' : 'in_stock') + '</g:availability>'
        + '<g:price>' + rupees(p.pricePaise) + '</g:price>'
        + '<g:brand>RoamWise</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists>'
        + '<g:google_product_category>' + categoryFor(p) + '</g:google_product_category>'
        + '<g:age_group>adult</g:age_group><g:gender>unisex</g:gender>'
        + (colour ? '<g:color>' + esc(colour) + '</g:color>' : '')
        + (size && !/standard/i.test(size) ? '<g:size>' + esc(size.replace(/^size\s+/i, '')) + '</g:size>' : '')
        + '<g:shipping><g:country>IN</g:country><g:price>' + rupees(p.pricePaise >= 100000 ? 0 : 9900) + '</g:price></g:shipping>'
        + '</item>');
    }
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>'
    + '<title>RoamWise Shop</title><link>' + SITE + '/shop/</link><description>Original RoamWise designs, printed on demand in India.</description>'
    + items.join('\n') + '</channel></rss>\n';
}

export function feedResponse(xml) {
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } });
}
