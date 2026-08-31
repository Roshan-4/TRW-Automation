#!/usr/bin/env node
/**
 * Run the entire Cypress framework (all UI + all SEO specs) in two fresh
 * browser sessions — UI first, SEO second — while accumulating Allure results
 * so the report/email reflects the full run, not just the last spec file.
 *
 * Usage:
 *   node scripts/run-full-suite.js
 *   npm run test:full
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const run = (label, command, env = {}) => {
  console.log(`\n=== ${label} ===\n`);
  execSync(command, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
};

const tryRun = (label, command, env = {}) => {
  try {
    run(label, command, env);
    return 0;
  } catch {
    console.error(`\n${label} finished with failing test(s).\n`);
    return 1;
  }
};

const main = () => {
  run('Clear prior Allure results', 'npm run clear:result');

  let exitCode = 0;

  // First invocation: normal before:run clear + full UI suite.
  exitCode |= tryRun(
    'UI suite (cypress/e2e/ui/**/*.cy.js)',
    'npm run cypress:run -- --spec "cypress/e2e/ui/**/*.cy.js"'
  );

  // Second invocation: keep UI results; append SEO suite.
  exitCode |= tryRun(
    'SEO suite (cypress/e2e/seo/**/*.cy.js)',
    'npm run cypress:run -- --spec "cypress/e2e/seo/**/*.cy.js"',
    { ALLURE_ACCUMULATE: '1' }
  );

  process.exit(exitCode);
};

main();
