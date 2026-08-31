const { runTyresSeoSuite } = require('../../../support/tyresSeoSuite');

/**
 * Tyres SEO — hub + Latest Truck Tyres. About/FAQ copy and Read More /
 * Read Less (desktop vs mobile use different description-box ids; the
 * page object locates by heading).
 *
 * Run:
 * - npm run test:tyresSeoContent:hub
 * - npm run test:tyresSeoContent:hub:mobile
 */
runTyresSeoSuite(['tyres', 'latestTruckTyres']);
