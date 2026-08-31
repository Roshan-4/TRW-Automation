const { runTyresListingSuite } = require('../../../support/tyresListingSuite');

/**
 * Tyres listing Load More — brand pages. Apollo/Dunlop have no Load More;
 * CEAT, Continental, Goodyear, JK, MRF do.
 *
 * Run:
 * - npm run test:tyresListing:brands
 */
runTyresListingSuite([
  'apolloTyres',
  'ceatTyres',
  'continentalTyres',
  'dunlopTyres',
  'goodyearTyres',
  'jkTyres',
  'mrfTyres',
]);
