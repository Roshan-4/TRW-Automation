const { runAllLeadFormSuite } = require('../../support/allLeadFormSuite');

/**
 * Consolidated English-only lead-form suite across all UI areas that capture
 * leads. No redirection checks, no listing/PDP chrome, no Sell Used Trucks
 * wizard. Device mode comes from DEVICE (desktop default, mobile via
 * cross-env) — each run is tagged @desktop or @mobile via deviceTag().
 *
 * Single session (small runs only):
 *   npm run test:allLeadFormSuite
 *
 * Full site lead forms — chunked fresh sessions, retries off, failure log:
 *   npm run test:allLeadFormSuite:full
 *   CYPRESS_BASE_URL=https://preprod-truck.tractorfirst.com npm run test:allLeadFormSuite:full
 *   LEAD_FORM_GREP=@allLeadForm+@positive+@en npm run test:allLeadFormSuite:full
 *
 * Logs: artifacts/all-lead-form-failures.log, artifacts/all-lead-form-summary.json
 */
runAllLeadFormSuite();
