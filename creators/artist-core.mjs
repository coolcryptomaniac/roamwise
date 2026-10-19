// Shared rules for artist pages: slug, validation of a submitted profile, plan limits.
// Used by tools/add-artist.js and tests. The browser pages read the same limits from artists-data.json `plans`.
export const PLAN_IDS = ['free', 'founding', 'autopilot', 'premium', 'featured', 'ambassador'];
export function slugify(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48); }
const httpsOnly = (u) => { try { const x = new URL(u); return x.protocol === 'https:'; } catch (e) { return false; } };
export function validateArtist(a, existingIds = []) {
  const errs = [];
  const str = (k, max, req) => { const v = a[k]; if (v == null || v === '') { if (req) errs.push(k + ' is required'); return; } if (typeof v !== 'string' || v.length > max) errs.push(k + ' must be text up to ' + max + ' characters'); };
  str('shipping', 200, false); str('returns', 200, false); str('name', 80, true); str('studio', 80, true); str('state', 60, true); str('bio', 600, false);
  const id = a.id || slugify(a.name); if (!id) errs.push('id could not be made'); if (existingIds.includes(id)) errs.push('id already exists: ' + id);
  if (a.instagram && !httpsOnly(a.instagram)) errs.push('instagram must be an https link');
  if (a.website && !httpsOnly(a.website)) errs.push('website must be an https link');
  if (a.whatsapp && !/^\d{10,15}$/.test(String(a.whatsapp))) errs.push('whatsapp must be digits with country code, e.g. 919876543210');
  if (!Array.isArray(a.themes) || !a.themes.length || a.themes.length > 6) errs.push('themes must be 1 to 6 short words');
  if (a.consent !== true) errs.push('consent must be true (artist owns the work and agrees to display it)');
  (a.artworks || []).forEach((w, i) => {
    if (!w.title) errs.push('artworks[' + i + '].title is required');
    if (w.image && !(String(w.image).startsWith('/assets/') || httpsOnly(w.image))) errs.push('artworks[' + i + '].image must be a /assets path or https link');
    if (w.url && !httpsOnly(w.url)) errs.push('artworks[' + i + '].url must be https');
  });
  return errs;
}
export function toRecord(a, plan = 'founding') {
  const id = a.id || slugify(a.name);
  return { id, name: a.name, studio: a.studio, role: { founding: 'RoamWise Founding Artist', premium: 'RoamWise Premium Artist' }[plan] || 'RoamWise Artist', state: a.state, website: a.website || null, instagram: a.instagram || null,
    themes: a.themes, bio: a.bio || null, shipping: a.shipping || null, returns: a.returns || null, plan, page: '/creators/artist.html?a=' + id, photo: null, whatsapp: a.whatsapp || null, social: {}, artworks: (a.artworks || []).map((w, i) => ({
      id: w.id || slugify(w.title) || 'work-' + (i + 1), title: w.title, status: w.status || 'Available', type: w.type || 'Original', price: w.price || 'Price on request', image: w.image || null, url: w.url || null, medium: w.medium || null, size: w.size || null })),
    consentGivenAt: new Date().toISOString().slice(0, 10) };
}
