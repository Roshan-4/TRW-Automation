/**
 * Generate a branded Allure HTML report:
 * - Report name: Truck Junction Automation Report
 * - Official Truck Junction logo + favicon from trucks.tractorjunction.com
 *
 * Assets (fetched from production):
 * - assets/allure/truck-logo.svg  (https://static-asset.tractorjunction.com/tr/truck-logo.svg)
 * - assets/allure/favicon.ico
 * - assets/allure/favicon-32.png
 *
 * Usage: npm run generate:report
 */
const allure = require('allure-commandline');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORT_NAME = 'Truck Junction Automation Report';
const RESULTS_DIR = path.join(ROOT, 'allure-results');
const REPORT_DIR = path.join(ROOT, 'allure-report');
const ASSETS_DIR = path.join(ROOT, 'assets', 'allure');
const LOGO_SVG = path.join(ASSETS_DIR, 'truck-logo.svg');
const LOGO_PNG = path.join(ASSETS_DIR, 'truck-logo.png');
const FAVICON_ICO = path.join(ASSETS_DIR, 'favicon.ico');
const FAVICON_PNG = path.join(ASSETS_DIR, 'favicon-32.png');
const ALLURE_HOME = path.join(ROOT, 'node_modules', 'allure-commandline', 'dist');
const CONFIG_FILE = path.join(ROOT, 'config', 'allure', 'allure.yml');
const PLUGIN_STATIC = path.join(ALLURE_HOME, 'plugins', 'custom-logo-plugin', 'static');
const LOCAL_PLUGIN_STATIC = path.join(
  ROOT,
  'config',
  'allure',
  'plugins',
  'custom-logo-plugin',
  'static'
);

function fail(message) {
  console.error(`generate:report failed: ${message}`);
  process.exit(1);
}

// Allure's Environment widget reads allure-results/environment.properties
// (plain Key=Value lines) and the Executor widget reads
// allure-results/executor.json — neither file existed before, so both
// widgets showed empty. Writing them here means every `generate:report`
// call (CI or local) fills them in, without a separate pipeline step.
function writeEnvironmentProperties() {
  const isCI = process.env.CI === 'true';
  const cypressVersion = require('cypress/package.json').version;
  // Allure's .properties parser splits a line's Key on the first `=`, `:`,
  // OR whitespace — so any key containing a space (e.g. "Base URL") gets
  // mis-parsed, with the rest of the intended key swallowed into the
  // value. Keys below stay single-word or dot/underscore-joined.
  const lines = [
    `Base.URL=${process.env.CYPRESS_BASE_URL || 'https://trucks.tractorjunction.com'}`,
    'Browser=Chrome',
    `Node.js=${process.version}`,
    `Cypress=${cypressVersion}`,
    'Suites=UI + SEO',
    'Devices=Desktop + Mobile',
    `Environment=${isCI ? 'CI (GitHub Actions)' : 'Local'}`,
  ];
  if (isCI) {
    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    const repo = process.env.GITHUB_REPOSITORY || '';
    lines.push(`Trigger=${process.env.GITHUB_EVENT_NAME || ''}`);
    lines.push(`Branch=${process.env.GITHUB_REF_NAME || ''}`);
    if (process.env.GITHUB_RUN_ID) {
      lines.push(`Workflow.Run=${serverUrl}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`);
    }
  }
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, 'environment.properties'), `${lines.join('\n')}\n`, 'utf8');
}

function writeExecutorJson() {
  const isCI = process.env.CI === 'true' && process.env.GITHUB_RUN_ID;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const repo = process.env.GITHUB_REPOSITORY || '';
  const executor = isCI
    ? {
        name: 'GitHub Actions',
        type: 'github',
        url: `${serverUrl}/${repo}/actions`,
        buildOrder: Number(process.env.GITHUB_RUN_NUMBER) || undefined,
        buildName: `${process.env.GITHUB_WORKFLOW || 'Cypress Tests'} #${process.env.GITHUB_RUN_NUMBER || ''}`,
        buildUrl: `${serverUrl}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        reportName: REPORT_NAME,
      }
    : {
        name: 'Local',
        type: 'local',
        buildName: `Local run — ${new Date().toISOString()}`,
        reportName: REPORT_NAME,
      };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, 'executor.json'), JSON.stringify(executor, null, 2), 'utf8');
}

function buildLogoCss() {
  if (!fs.existsSync(LOGO_SVG)) {
    fail(`Official logo SVG not found at ${LOGO_SVG}`);
  }

  const dataUri = `data:image/svg+xml;base64,${fs.readFileSync(LOGO_SVG).toString('base64')}`;

  return `/* Truck Junction Automation Report — official site logo (embedded SVG) */
.side-nav__brand {
  background: #ffffff !important;
  border-bottom: 1px solid #e5e7eb !important;
  padding: 14px 16px !important;
  margin: 0 !important;
  min-height: 72px !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  display: flex !important;
  align-items: center !important;
  box-sizing: border-box !important;
}

.side-nav__brand-text {
  display: none !important;
}

.side-nav__brand-icon {
  display: block !important;
  width: 160px !important;
  height: 70px !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  background: url('${dataUri}') no-repeat left center !important;
  background-size: contain !important;
  background-color: transparent !important;
}
`;
}

function syncCustomLogoPlugin() {
  const css = buildLogoCss();

  for (const dir of [PLUGIN_STATIC, LOCAL_PLUGIN_STATIC]) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'styles.css'), css, 'utf8');
    fs.copyFileSync(LOGO_SVG, path.join(dir, 'truck-logo.svg'));
    if (fs.existsSync(LOGO_PNG)) {
      fs.copyFileSync(LOGO_PNG, path.join(dir, 'truck-logo.png'));
    }
    if (fs.existsSync(FAVICON_ICO)) {
      fs.copyFileSync(FAVICON_ICO, path.join(dir, 'favicon.ico'));
    }
    if (fs.existsSync(FAVICON_PNG)) {
      fs.copyFileSync(FAVICON_PNG, path.join(dir, 'favicon-32.png'));
    }
  }
}

function runAllureGenerate() {
  if (!fs.existsSync(RESULTS_DIR) || fs.readdirSync(RESULTS_DIR).length === 0) {
    fail(
      'No allure-results found. Run Cypress tests first (e.g. npm run test:homePageSeoContent).'
    );
  }

  // Written here (not earlier) so an empty allure-results/ still fails the
  // check above instead of looking non-empty because of these two files.
  writeEnvironmentProperties();
  writeExecutorJson();

  console.log(`Generating Allure report: "${REPORT_NAME}"`);

  return new Promise((resolve, reject) => {
    const child = allure([
      'generate',
      RESULTS_DIR,
      '--clean',
      '--output',
      REPORT_DIR,
      '--name',
      REPORT_NAME,
      '--config',
      CONFIG_FILE,
    ]);

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`allure generate exited with code ${code}`));
      }
    });
  });
}

function brandGeneratedReport() {
  const indexPath = path.join(REPORT_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    fail(`Report index not found at ${indexPath}`);
  }

  const assetsDir = path.join(REPORT_DIR, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  fs.copyFileSync(LOGO_SVG, path.join(assetsDir, 'truck-logo.svg'));
  if (fs.existsSync(LOGO_PNG)) {
    fs.copyFileSync(LOGO_PNG, path.join(assetsDir, 'truck-logo.png'));
  }
  if (fs.existsSync(FAVICON_ICO)) {
    fs.copyFileSync(FAVICON_ICO, path.join(assetsDir, 'favicon.ico'));
  }
  if (fs.existsSync(FAVICON_PNG)) {
    fs.copyFileSync(FAVICON_PNG, path.join(assetsDir, 'favicon.png'));
  }

  const pluginLogoDir = path.join(REPORT_DIR, 'plugin', 'custom-logo');
  if (fs.existsSync(pluginLogoDir)) {
    fs.writeFileSync(path.join(pluginLogoDir, 'styles.css'), buildLogoCss(), 'utf8');
    fs.copyFileSync(LOGO_SVG, path.join(pluginLogoDir, 'truck-logo.svg'));
  }

  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${REPORT_NAME}</title>`);

  const faviconLinks = fs.existsSync(FAVICON_ICO)
    ? `<link rel="icon" type="image/x-icon" href="assets/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon.png">`
    : `<link rel="icon" type="image/png" href="assets/favicon.png">`;

  html = html.replace(/<link\s+rel="icon"[^>]*>/gi, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, (match) => `${match}\n    ${faviconLinks}`);

  // Ensure embedded-SVG brand CSS wins even if plugin CSS is overridden.
  const brandStyle = `<style id="tj-allure-brand">${buildLogoCss()}</style>`;
  html = html.replace(/<style id="tj-allure-brand">[\s\S]*?<\/style>/i, '');
  html = html.replace(/<\/head>/i, `${brandStyle}\n</head>`);

  fs.writeFileSync(indexPath, html, 'utf8');

  const summaryPath = path.join(REPORT_DIR, 'widgets', 'summary.json');
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    summary.reportName = REPORT_NAME;
    fs.writeFileSync(summaryPath, JSON.stringify(summary), 'utf8');
  }

  console.log(`Branded report ready: ${REPORT_NAME}`);
  console.log('Logo: official trucks.tractorjunction.com SVG');
  console.log('Favicon: official site favicon.ico');
  console.log('Open with: npm run open:report');
}

(async () => {
  try {
    process.env.ALLURE_HOME = ALLURE_HOME;
    syncCustomLogoPlugin();
    await runAllureGenerate();
    brandGeneratedReport();
  } catch (error) {
    fail(error.message || String(error));
  }
})();
