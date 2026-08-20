const { runNewListingPagesSuite } = require('../../../support/newListingPagesSuite');

/**
 * New Listing Pages — BS6 Trucks (/en/bs-vi). Run as its own spec file —
 * see cypress/support/newListingPagesSuite.js for why (cumulative
 * session-length degradation, golden rule 22).
 *
 * Run:
 * - npm run test:newListingPages:bs6Trucks
 */
runNewListingPagesSuite(['bs6Trucks']);
