#!/usr/bin/env node
/**
 * Run every @allLeadForm test in English as separate Cypress invocations so
 * no single browser session accumulates enough length to hang or flake.
 * Retries are disabled (fail once, move on). Failures are logged to
 * artifacts/all-lead-form-failures.log and artifacts/all-lead-form-summary.json.
 *
 * Usage:
 *   node scripts/run-all-lead-form-suite.js
 *   LEAD_FORM_GREP=@allLeadForm+@positive+@en node scripts/run-all-lead-form-suite.js
 *   CYPRESS_BASE_URL=https://preprod-truck.tractorfirst.com node scripts/run-all-lead-form-suite.js
 *   DEVICE=mobile node scripts/run-all-lead-form-suite.js
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPEC = 'cypress/e2e/ui/AllLeadformsuite.cy.js';
const ARTIFACTS = path.join(ROOT, 'artifacts');
const LOG_FILE = path.join(ARTIFACTS, 'all-lead-form-failures.log');
const SUMMARY_FILE = path.join(ARTIFACTS, 'all-lead-form-summary.json');

const BASE_GREP = process.env.LEAD_FORM_GREP || '@allLeadForm+@en';

/** Fresh-session chunks — each grep must match tests in AllLeadformsuite.cy.js only. */
const CHUNKS = [
  { label: 'Homepage', tag: '@alfChunkHome' },
  { label: 'Listing — Best Trucks', tag: '@bestTrucks' },
  { label: 'Listing — Popular Truck', tag: '@popularTruck' },
  { label: 'Listing — Find New Trucks', tag: '@findNewTrucks' },
  { label: 'Listing — Upcoming Trucks', tag: '@upcomingTrucks' },
  { label: 'Listing — Latest Trucks', tag: '@latestTrucks' },
  { label: 'Listing — BS6 Trucks', tag: '@bs6Trucks' },
  { label: 'Compare Trucks', tag: '@compareTrucks' },
  { label: 'Brochure', tag: '@brochure' },
  { label: 'Electric Vehicle', tag: '@electricVehicle' },
  { label: 'Category — Category nav', tag: '@alfChunkCatCategory' },
  { label: 'Category — Wheelers', tag: '@alfChunkCatWheelers' },
  { label: 'Category — Fuel Type', tag: '@alfChunkCatFuel' },
  { label: 'Category — GVW', tag: '@alfChunkCatGvw' },
  { label: 'Category — Brands', tag: '@alfChunkCatBrands' },
  { label: 'Category — Truck Series', tag: '@alfChunkCatSeries' },
  { label: 'Category — Payload', tag: '@alfChunkCatPayload' },
  { label: 'Used Truck — Buy Used Trucks', tag: '@buyUsedTrucks' },
  { label: 'Used Truck — CV Permit', tag: '@cvPermit' },
  { label: 'Used Truck — Vehicle Report', tag: '@vehicleReport' },
  { label: 'Used Truck — E-Challan', tag: '@eChallan' },
  { label: 'Used Truck — Used Truck PDP', tag: '@usedTruckPdp' },
  { label: 'Buses — Bus Listing', tag: '@alfChunkBusListing' },
  { label: 'Buses — Bus PDP (Starbus Staff Contract)', tag: '@starbusStaffContract' },
  { label: 'Buses — Bus PDP (Starbus Ultra City Electric)', tag: '@starbusUltraCityElectric' },
  { label: 'Utility — Select Your Truck (Tabbed Model Offers)', tag: '@selectYourTruck' },
  { label: 'Utility — Offers (Tabbed Model Offers)', tag: '@offers' },
  { label: 'Utility — Tyres', tag: '@alfChunkTyres' },
  { label: 'Utility — Body Makers', tag: '@alfChunkBodyMakers' },
  { label: 'Utility — Contact Us', tag: '@contactUs' },
  { label: 'PDP — New Truck PDP', tag: '@newTruckPdp' },
];

function extractFailedTests(output) {
  return output
    .split('\n')
    .filter((line) => /^\s+\d+\)/.test(line))
    .map((line) => line.trim());
}

function runChunk(chunk, index, accumulateAllure) {
  const grepTags = `${BASE_GREP}+${chunk.tag}`;
  console.log(`\n=== [${index + 1}/${CHUNKS.length}] ${chunk.label} (${grepTags}) ===\n`);

  const env = {
    ...process.env,
    LEAD_FORM_CITY_TIMEOUT: process.env.LEAD_FORM_CITY_TIMEOUT || '10000',
    LEAD_FORM_NO_RETRIES: '1',
  };
  if (accumulateAllure) {
    env.ALLURE_ACCUMULATE = '1';
  }

  const args = [
    'cypress',
    'run',
    '--browser',
    'chrome',
    '--spec',
    SPEC,
    '--expose',
    `grepTags=${grepTags},grepOmitFiltered=true`,
  ];

  const result = spawnSync('npx', args, {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (combined.trim()) {
    process.stdout.write(combined);
  }

  const noTestsRan = /Tests:\s+0\b/.test(combined) || /0 passing \(0ms\)/.test(combined);
  let exitCode = result.status ?? 1;
  if (noTestsRan && exitCode === 0) {
    exitCode = 1;
  }
  const failedTests = exitCode !== 0 ? extractFailedTests(combined) : [];

  return {
    label: chunk.label,
    grepTags,
    exitCode,
    noTestsRan,
    failedTests,
  };
}

function appendLog(lines) {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  fs.appendFileSync(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  fs.writeFileSync(
    LOG_FILE,
    `# All Lead Form suite run — ${new Date().toISOString()}\n# BASE_GREP=${BASE_GREP}\n# BASE_URL=${process.env.CYPRESS_BASE_URL || '(from cypress/.env or production default)'}\n# DEVICE=${process.env.DEVICE || 'desktop'}\n\n`,
    'utf8'
  );

  console.log('Clearing prior Allure results…');
  spawnSync('npm', ['run', 'clear:result'], { cwd: ROOT, stdio: 'inherit', shell: true });

  const results = [];
  let exitCode = 0;

  CHUNKS.forEach((chunk, index) => {
    const outcome = runChunk(chunk, index, index > 0);
    results.push(outcome);

    if (outcome.exitCode !== 0) {
      exitCode = 1;
      const stamp = new Date().toISOString();
      appendLog([
        `[${stamp}] FAILED CHUNK: ${outcome.label}`,
        `  grep: ${outcome.grepTags}`,
        ...(outcome.noTestsRan
          ? ['  (grep matched zero tests — check chunk tag)']
          : outcome.failedTests.length
            ? outcome.failedTests.map((t) => `  ${t}`)
            : ['  (no individual test lines captured — see terminal output above)']),
        '',
      ]);
      console.error(`\n*** Chunk failed: ${chunk.label} — logged to ${LOG_FILE}\n`);
    } else {
      appendLog([`[${new Date().toISOString()}] PASSED: ${outcome.label}`, '']);
    }
  });

  const summary = {
    finishedAt: new Date().toISOString(),
    baseGrep: BASE_GREP,
    baseUrl: process.env.CYPRESS_BASE_URL || null,
    device: process.env.DEVICE || 'desktop',
    totalChunks: CHUNKS.length,
    passedChunks: results.filter((r) => r.exitCode === 0).length,
    failedChunks: results.filter((r) => r.exitCode !== 0).length,
    chunks: results.map(({ label, grepTags, exitCode: code, failedTests }) => ({
      label,
      grepTags,
      exitCode: code,
      failedTests,
    })),
  };

  fs.writeFileSync(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log('\n=== All Lead Form suite summary ===');
  console.log(`  Passed chunks: ${summary.passedChunks}/${summary.totalChunks}`);
  console.log(`  Failed chunks: ${summary.failedChunks}/${summary.totalChunks}`);
  console.log(`  Failure log:   ${LOG_FILE}`);
  console.log(`  JSON summary:  ${SUMMARY_FILE}`);

  if (summary.failedChunks > 0) {
    console.log('\nFailed chunks:');
    results
      .filter((r) => r.exitCode !== 0)
      .forEach((r) => {
        console.log(`  - ${r.label}`);
        r.failedTests.forEach((t) => console.log(`      ${t}`));
      });
  }

  process.exit(exitCode);
}

main();
