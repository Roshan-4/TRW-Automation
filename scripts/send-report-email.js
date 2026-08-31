/**
 * Helper for Send_mail.sh: computes the dynamic values for the QA
 * automation report email (execution stats, dated subject, report URL,
 * failed-screenshot URLs) and writes them as a shell-sourceable file at
 * reports/report-email-data.sh, which Send_mail.sh sources before calling
 * curl.
 *
 * Reads:
 * - allure-report/widgets/summary.json  (pass/fail/total counts — built by
 *   `npm run generate:report`)
 * - reports/last-report-publish.json    (report/screenshot URLs — written
 *   by `npm run report:publish`)
 * - cypress/.env                        (REPORT_EMAIL_API_KEY,
 *   REPORT_ENVIRONMENT — gitignored, never commit real values)
 *
 * priority/description have no fixed schema from the receiving API, so
 * they're generated here from the actual pass/fail numbers and are
 * intentionally easy to override via env vars (REPORT_PRIORITY_ON_FAIL /
 * REPORT_PRIORITY_ON_PASS) if the API expects different enum values.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, 'cypress', '.env') });

const SUMMARY_PATH = path.join(ROOT, 'allure-report', 'widgets', 'summary.json');
const MANIFEST_PATH = path.join(ROOT, 'reports', 'last-report-publish.json');
const OUT_PATH = path.join(ROOT, 'reports', 'report-email-data.sh');

function fail(message) {
  console.error(`send-report-email (prepare) failed: ${message}`);
  process.exit(1);
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function toExecutionDateTime(timestamp) {
  // manifest timestamp: YYYY-MM-DD_HH-mm-ss -> "YYYY-MM-DD HH:mm:ss"
  const [date, time] = timestamp.split('_');
  return `${date} ${time.replace(/-/g, ':')}`;
}

function toSubjectDate(timestamp) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [date] = timestamp.split('_');
  const [year, month, day] = date.split('-').map(Number);
  return `${String(day).padStart(2, '0')}-${MONTHS[month - 1]}-${year}`;
}

function main() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    fail(`No summary found at ${SUMMARY_PATH}. Run "npm run generate:report" first.`);
  }
  if (!fs.existsSync(MANIFEST_PATH)) {
    fail(`No publish manifest found at ${MANIFEST_PATH}. Run "npm run report:publish" first.`);
  }

  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const { failed = 0, broken = 0, total = 0 } = summary.statistic || {};
  const failedCount = failed + broken;
  const totalTestCases = total;

  const environment = process.env.REPORT_ENVIRONMENT || 'PROD';
  const executionDateTime = toExecutionDateTime(manifest.timestamp);
  const suiteLabel = process.env.REPORT_EMAIL_SUITE_NAME || 'Truck Junction';
  const subject =
    process.env.REPORT_EMAIL_SUBJECT ||
    `Automation Execution Report - ${suiteLabel} - ${toSubjectDate(manifest.timestamp)}`;

  const passedCount = Math.max(0, totalTestCases - failedCount);

  const priorityOnFail = process.env.REPORT_PRIORITY_ON_FAIL || 'High';
  const priorityOnPass = process.env.REPORT_PRIORITY_ON_PASS || 'Normal';
  const priority = failedCount > 0 ? priorityOnFail : priorityOnPass;

  const description =
    process.env.REPORT_EMAIL_DESCRIPTION ||
    `Automated Cypress regression suite executed against trucks.tractorjunction.com. ` +
      `${passedCount} passed, ${failedCount} failed out of ${totalTestCases} total test cases.`;

  const screenshots = manifest.screenshots || [];
  // Never leave data[screenshotUrl] empty — fall back to the report URL.
  const primaryScreenshotUrl = screenshots.length ? screenshots[0].url : manifest.reportUrl;
  // This API drops delivery when attachments[] is omitted entirely; attach at
  // least one local file (failed screenshot, or branded logo fallback).
  const maxAttachments = Number(process.env.REPORT_MAX_ATTACHMENTS ?? 1);
  let screenshotLocalPaths = screenshots
    .map((s) => s.localPath)
    .filter((p) => p && fs.existsSync(p))
    .slice(0, maxAttachments);

  if (screenshotLocalPaths.length === 0) {
    const logoFallback = path.join(ROOT, 'assets', 'allure', 'truck-logo.png');
    const faviconFallback = path.join(ROOT, 'assets', 'allure', 'favicon-32.png');
    if (fs.existsSync(logoFallback)) {
      screenshotLocalPaths = [logoFallback];
    } else if (fs.existsSync(faviconFallback)) {
      screenshotLocalPaths = [faviconFallback];
    }
  }

  const lines = [
    `TOTAL_TEST_CASES=${shellQuote(totalTestCases)}`,
    `PASSED_COUNT=${shellQuote(passedCount)}`,
    `FAILED_COUNT=${shellQuote(failedCount)}`,
    `EXECUTION_DATETIME=${shellQuote(executionDateTime)}`,
    `REPORT_ENVIRONMENT=${shellQuote(environment)}`,
    `REPORT_URL=${shellQuote(manifest.reportUrl)}`,
    `PRIMARY_SCREENSHOT_URL=${shellQuote(primaryScreenshotUrl)}`,
    `EMAIL_SUBJECT=${shellQuote(subject)}`,
    `EMAIL_PRIORITY=${shellQuote(priority)}`,
    `EMAIL_DESCRIPTION=${shellQuote(description)}`,
    `SCREENSHOT_URLS=(${screenshots.map((s) => shellQuote(s.url)).join(' ')})`,
    `SCREENSHOT_LOCAL_PATHS=(${screenshotLocalPaths.map(shellQuote).join(' ')})`,
  ];

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`  ${totalTestCases} total, ${failedCount} failed, priority=${priority}`);
  console.log(`  report: ${manifest.reportUrl}`);
  console.log(`  screenshots: ${screenshots.length} (${screenshotLocalPaths.length} attachable locally)`);
}

main();
