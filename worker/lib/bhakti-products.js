/* Server-owned digital programme prices. Never grants membership or temple services. */
export const BHAKTI_PRODUCTS = Object.freeze({
  bhakti_mantra: { price: 10, level: 1 }, bhakti_aarti: { price: 30, level: 2 },
  bhakti_paath: { price: 60, level: 3 }, bhakti_katha: { price: 100, level: 4 },
  bhakti_yajna: { price: 200, level: 5 }, bhakti_parthiv: { price: 300, level: 6 }
});
export function bhaktiProduct(id) {
  return Object.prototype.hasOwnProperty.call(BHAKTI_PRODUCTS, String(id || '')) ? BHAKTI_PRODUCTS[id] : null;
}
export function bhaktiGrantPath(uid, productId) {
  return `bhaktiGrants/${uid}/products/${productId}`;
}
