require('allure-cypress');
require('./commands');

// Collects cy.log, real XHR/request calls, and app console.log/warn/error
// output so the installLogsPrinter task in cypress.config.js can print it to
// this terminal — otherwise it's only visible inside the Cypress runner UI.
// Excludes cy:fetch/cy:command: on this Next.js SPA those fire for every
// static chunk/asset and every Cypress command, which drowns out anything
// useful. Extend collectTypes here if asset-level noise is ever needed.
require('cypress-terminal-report/src/installLogsCollector')({
  collectTypes: [
    'cons:log',
    'cons:info',
    'cons:warn',
    'cons:error',
    'cy:log',
    'cy:xhr',
    'cy:request',
  ],
});

const { register: registerCypressGrep } = require('@cypress/grep');
registerCypressGrep();

// PDP pages embed third-party ad iframes. Allure Cypress can throw when serializing
// command-log DOM yields (SecurityError / Invalid string length) even after assertions pass.
//
// CRITICAL: under this Cypress version, attaching a `fail` listener suppresses
// the failure by default unless the handler re-throws — the opposite of older
// Cypress's "return false to suppress" contract. Without the explicit
// `throw err` below, this handler was silently swallowing every test failure
// in the suite (confirmed live: a deliberately-failing `expect(1).to.equal(2)`
// reported as passing with this handler present and no rethrow). Never remove
// the `throw err` fallback — it is what makes real failures fail again.
Cypress.on('fail', (err) => {
  const msg = err && err.message ? err.message : String(err);
  const stack = err && err.stack ? err.stack : '';
  const isAllureSerializeNoise =
    /allure-cypress/.test(stack) &&
    (/Failed to read a named property 'toJSON' from 'Window'/.test(msg) ||
      /Invalid string length/.test(msg));
  if (isAllureSerializeNoise) {
    return false;
  }
  throw err;
});

// Truck Junction is a third-party site — ignore known non-test app errors
// (e.g. Serwist service worker 500) so they don't fail UI specs.
Cypress.on('uncaught:exception', (err) => {
  const message = err && err.message ? err.message : String(err);
  return !(
    /ServiceWorker/i.test(message) ||
    /serwist\/sw\.js/i.test(message) ||
    /ResizeObserver loop/i.test(message) ||
    /Non-Error promise rejection/i.test(message) ||
    /Minified React error #(418|423|425)/i.test(message)
  );
});

// Stop-on-fail is opt-in so tagged suites can report all failures in one run.
if (Cypress.env('stopOnFail')) {
  afterEach(function () {
    if (this.currentTest.state === 'failed') {
      Cypress.runner.stop();
    }
  });
}
