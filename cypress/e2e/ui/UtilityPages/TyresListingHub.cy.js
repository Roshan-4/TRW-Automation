const { runTyresListingSuite } = require('../../../support/tyresListingSuite');

/**
 * Tyres listing Load More — hub (/en/tyres, no Load More) and Latest
 * Truck Tyres (has Load More). Desktop and mobile card counts can differ.
 *
 * Run:
 * - npm run test:tyresListing:hub
 * - npm run test:tyresListing:hub:mobile
 */
runTyresListingSuite(['tyres', 'latestTruckTyres']);
