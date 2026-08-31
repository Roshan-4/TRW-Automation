const { runTyresSeoSuite } = require('../../../support/tyresSeoSuite');

/**
 * Tyres SEO — one product page (Continental Hdw2). Description + FAQ;
 * no Load More. Desktop vs mobile use different description-box ids.
 *
 * Run:
 * - npm run test:tyresSeoContent:pdp
 */
runTyresSeoSuite(['continentalHdw2']);
