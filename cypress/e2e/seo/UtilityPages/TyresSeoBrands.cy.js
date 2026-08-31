const { runTyresSeoSuite } = require('../../../support/tyresSeoSuite');

/**
 * Tyres SEO — brand listing pages (Apollo, CEAT, Continental, Dunlop,
 * Goodyear, JK, MRF). Own spec file so the hub/PDP runs stay short
 * (golden rule 22).
 *
 * Run:
 * - npm run test:tyresSeoContent:brands
 */
runTyresSeoSuite([
  'apolloTyres',
  'ceatTyres',
  'continentalTyres',
  'dunlopTyres',
  'goodyearTyres',
  'jkTyres',
  'mrfTyres',
]);
