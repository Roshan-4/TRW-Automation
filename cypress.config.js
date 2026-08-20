const path = require('path');
const { defineConfig } = require('cypress');

// Load confidential/local values from cypress/.env before resolving config.
require('dotenv').config({ path: path.resolve(__dirname, 'cypress/.env') });

const { allureCypress } = require('allure-cypress/reporter');
const { DEVICES } = require('./constants/constants');

const baseUrl = process.env.CYPRESS_BASE_URL || 'https://trucks.tractorjunction.com';

// Real device emulation, not a viewport-only resize — a viewport change alone
// does not trigger this site's navigator.userAgent / request-header based
// device branching. `DEVICE=mobile npm run <script>` (via cross-env) runs the
// same spec against a real Android Chrome user agent + matching viewport;
// default is desktop. See constants/constants.js DEVICES and
// helpers/deviceTags.js for the @desktop/@mobile grep tag this drives.
const DEVICE_KEY = (process.env.DEVICE || 'desktop').toLowerCase();
const device = DEVICES[DEVICE_KEY] || DEVICES.desktop;

module.exports = defineConfig({
  e2e: {
    baseUrl,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    downloadsFolder: 'cypress/downloads',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 15000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    viewportWidth: device.viewport.width,
    viewportHeight: device.viewport.height,
    ...(device.userAgent ? { userAgent: device.userAgent } : {}),
    retries: {
      runMode: 1,
      openMode: 0,
    },
    // Disable Cypress auto-scroll; specs scroll explicitly via page helpers.
    scrollBehavior: false,
    setupNodeEvents(on, config) {
      // Fresh Allure results on every Cypress run — avoids mixing prior runs.
      on('before:run', () => {
        const fs = require('fs');
        const resultsDir = path.resolve(__dirname, 'allure-results');
        if (fs.existsSync(resultsDir)) {
          fs.rmSync(resultsDir, { recursive: true, force: true });
        }
        fs.mkdirSync(resultsDir, { recursive: true });
      });

      allureCypress(on, config, {
        resultsDir: 'allure-results',
        // PDP pages embed ad iframes; cap command-arg serialization to avoid
        // Allure SecurityError / Invalid string length on deep scroll tests.
        stepsFromCommands: {
          maxArgumentLength: 256,
          maxArgumentDepth: 2,
        },
      });

      // Expose environment + confidential data (from cypress/.env) to tests.
      config.env = {
        ...config.env,
        userMobile: process.env.TJ_USER_MOBILE,
        userEmail: process.env.TJ_USER_EMAIL,
        userOtp: process.env.TJ_USER_OTP,
        authToken: process.env.TJ_AUTH_TOKEN,
        device: DEVICE_KEY,
      };

      const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin');
      cypressGrepPlugin(config);

      // Print cy.log / browser console / cy.request+response output to this
      // terminal as the run happens — Cypress normally only shows Mocha's
      // pass/fail lines here, with everything else trapped inside the
      // Electron/Chrome test runner. Paired with the collector installed in
      // cypress/support/e2e.js.
      require('cypress-terminal-report/src/installLogsPrinter')(on, {
        printLogsToConsole: 'always',
        includeSuccessfulHookLogs: false,
      });

      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },

        // Redirection / broken-link check (helpers/verifyPageRedirections.js).
        // Runs in the Node plugin process (not the browser) so a slow/broken
        // link check can never block on browser same-origin rules, and a
        // network failure resolves to a result object instead of throwing.
        async checkLinkStatuses(urls) {
          const results = await Promise.all(
            urls.map(async (url) => {
              try {
                const response = await fetch(url, {
                  method: 'GET',
                  redirect: 'manual',
                  signal: AbortSignal.timeout(15000),
                });
                return { url, status: response.status, ok: true };
              } catch (error) {
                return { url, status: null, ok: false, error: error.message };
              }
            })
          );
          return results;
        },
      });

      on('before:browser:launch', (browser = {}, launchOptions) => {
        // Default runner is Chrome (see package.json). Tune headless Chromium for
        // local + CI — avoids Electron vs Chrome DOM/behaviour differences.
        if (browser.family === 'chromium' && browser.isHeadless) {
          launchOptions.args.push('--headless=new');
          launchOptions.args.push('--disable-gpu');
          if (process.env.CI) {
            launchOptions.args.push('--no-sandbox');
            launchOptions.args.push('--disable-dev-shm-usage');
          }
        }
        if (browser.name === 'firefox' && process.env.CI) {
          launchOptions.args.push('--headless');
        }
        // Belt-and-suspenders alongside the top-level `userAgent` config:
        // pass the same real Android UA as a launch flag so it's set before
        // Cypress's CDP override attaches, in case that matters for the very
        // first request on some SSR-gated pages.
        if (browser.family === 'chromium' && device.userAgent) {
          launchOptions.args.push(`--user-agent=${device.userAgent}`);
        }
        return launchOptions;
      });

      return config;
    },
  },
});
