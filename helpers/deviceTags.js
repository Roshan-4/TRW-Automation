const { TEST_TAGS } = require('../constants/constants');

/**
 * Tag for the device this run is actually executing under — real Android
 * Chrome user agent + matching viewport for `DEVICE=mobile`, real desktop
 * Chrome otherwise (see constants/constants.js DEVICES, cypress.config.js).
 * Spread into every spec's tag list so `grepTags=@mobile` /
 * `grepTags=@desktop` can select by device, and Allure results record which
 * device mode a run used.
 */
const deviceTag = () => (Cypress.env('device') === 'mobile' ? TEST_TAGS.MOBILE : TEST_TAGS.DESKTOP);

module.exports = { deviceTag };
