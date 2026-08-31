/**
 * Device-aware layout helpers.
 *
 * This site often renders a shorter catalog on mobile than on desktop
 * (e.g. Popular Truck Brands: 12 cards on desktop, 6 on mobile) by omitting
 * the extra nodes from the DOM — not by CSS-hiding them. Tests that assert
 * against the full desktop list therefore fail under `DEVICE=mobile`.
 *
 * `Cypress.env('device')` is set in cypress.config.js from the `DEVICE`
 * env var (`desktop` by default, `mobile` when run with DEVICE=mobile).
 */

const currentDevice = () => (Cypress.env('device') === 'mobile' ? 'mobile' : 'desktop');

/**
 * Items actually shown for this device.
 *
 * @param {Array} catalog Full desktop-ordered list from test data.
 * @param {{ desktop?: number, mobile?: number }} visibleCountByDevice
 *   Live-captured counts, e.g. `{ desktop: 12, mobile: 6 }`.
 * @returns {Array} Prefix of `catalog` matching this device, or the full
 *   list when the count is missing / not smaller than the catalog.
 */
const itemsShownOnDevice = (catalog, visibleCountByDevice) => {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return catalog || [];
  }
  const n = visibleCountByDevice?.[currentDevice()];
  if (typeof n === 'number' && n >= 0 && n < catalog.length) {
    return catalog.slice(0, n);
  }
  return catalog;
};

module.exports = { currentDevice, itemsShownOnDevice };
