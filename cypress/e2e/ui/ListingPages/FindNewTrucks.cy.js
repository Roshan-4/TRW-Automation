const { runNewListingPagesSuite } = require('../../../support/newListingPagesSuite');

/**
 * New Listing Pages — Find New Trucks (/en/new-trucks). Run as its own spec
 * file — see cypress/support/newListingPagesSuite.js for why (cumulative
 * session-length degradation, golden rule 22).
 *
 * Run:
 * - npm run test:newListingPages:findNewTrucks
 */
runNewListingPagesSuite(['newTrucks']);
