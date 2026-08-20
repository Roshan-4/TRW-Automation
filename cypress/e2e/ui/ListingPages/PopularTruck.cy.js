const { runNewListingPagesSuite } = require('../../../support/newListingPagesSuite');

/**
 * New Listing Pages — Popular Truck (/en/popular-trucks). Run as its own
 * spec file — see cypress/support/newListingPagesSuite.js for why
 * (cumulative session-length degradation, golden rule 22).
 *
 * Run:
 * - npm run test:newListingPages:popularTruck
 */
runNewListingPagesSuite(['popularTrucks']);
