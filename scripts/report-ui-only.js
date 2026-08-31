#!/usr/bin/env node
/**
 * Build, publish, and email an Allure report from UI spec results only.
 * Backs up the full allure-results/ folder first, then removes e2e/seo
 * *-result.json files before calling report:notify.
 *
 * Usage:
 *   node scripts/report-ui-only.js
 *   npm run report:ui-only
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RESULTS = path.join(ROOT, 'allure-results');
const BACKUP = path.join(ROOT, 'allure-results-full-backup');

function fail(message) {
  console.error(`report-ui-only failed: ${message}`);
  process.exit(1);
}

function isSeoResultFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const id = `${data.fullName || ''} ${data.name || ''}`;
  return /e2e[\\/]seo[\\/]/i.test(id);
}

function countUiResults() {
  let ui = 0;
  let seo = 0;
  for (const file of fs.readdirSync(RESULTS)) {
    if (!file.endsWith('-result.json')) continue;
    const fp = path.join(RESULTS, file);
    if (isSeoResultFile(fp)) seo += 1;
    else ui += 1;
  }
  return { ui, seo };
}

function backupResults() {
  if (!fs.existsSync(RESULTS)) {
    fail('allure-results/ is missing. Run UI tests first.');
  }
  if (fs.existsSync(BACKUP)) {
    fs.rmSync(BACKUP, { recursive: true, force: true });
  }
  fs.cpSync(RESULTS, BACKUP, { recursive: true });
  console.log('Backed up allure-results -> allure-results-full-backup/');
}

function filterOutSeo() {
  let removed = 0;
  for (const file of fs.readdirSync(RESULTS)) {
    if (!file.endsWith('-result.json')) continue;
    const fp = path.join(RESULTS, file);
    if (isSeoResultFile(fp)) {
      fs.unlinkSync(fp);
      removed += 1;
    }
  }
  console.log(`Removed ${removed} SEO result file(s) from allure-results/`);
}

function main() {
  const before = countUiResults();
  if (before.ui === 0) {
    fail('No UI results found in allure-results/. Run the UI suite first.');
  }

  console.log(`Found ${before.ui} UI + ${before.seo} SEO result file(s) before filter`);
  backupResults();
  filterOutSeo();

  execSync('npm run report:notify', {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      REPORT_EMAIL_SUITE_NAME: process.env.REPORT_EMAIL_SUITE_NAME || 'UI-Regression',
    },
  });
}

main();
