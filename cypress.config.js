const path = require('path');
const { defineConfig } = require('cypress');

// Load confidential/local values from cypress/.env before resolving config.
require('dotenv').config({ path: path.resolve(__dirname, 'cypress/.env') });

const { allureCypress } = require('allure-cypress/reporter');

const baseUrl = process.env.CYPRESS_BASE_URL || 'https://trucks.tractorjunction.com';

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
    viewportWidth: 1366,
    viewportHeight: 768,
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
      };

      const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin');
      cypressGrepPlugin(config);

      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
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
        return launchOptions;
      });

      return config;
    },
  },
});
