require('allure-cypress');
require('./commands');

const { register: registerCypressGrep } = require('@cypress/grep');
registerCypressGrep();

// PDP pages embed third-party ad iframes. Allure Cypress can throw when serializing
// command-log DOM yields (SecurityError / Invalid string length) even after assertions pass.
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
