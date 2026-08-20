const { runNewListingPagesSuite } = require('../../../support/newListingPagesSuite');

/**
 * New Listing Pages — Best Trucks (/en/trucks). Run as its own spec file —
 * see cypress/support/newListingPagesSuite.js for why (cumulative
 * session-length degradation, golden rule 22).
 *
 * Run:
 * - npm run test:newListingPages:bestTrucks
 */
runNewListingPagesSuite(['bestTrucks']);
