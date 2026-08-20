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
  const subject = `Automation Execution Report - Truck Junction - ${toSubjectDate(manifest.timestamp)}`;

  const priorityOnFail = process.env.REPORT_PRIORITY_ON_FAIL || 'High';
  const priorityOnPass = process.env.REPORT_PRIORITY_ON_PASS || 'Normal';
  const priority = failedCount > 0 ? priorityOnFail : priorityOnPass;

  const description =
    `Automated Cypress regression suite (English - Desktop + Mobile) executed against ` +
    `trucks.tractorjunction.com. ${totalTestCases - failedCount} passed, ${failedCount} failed ` +
    `out of ${totalTestCases} total test cases.`;

  const screenshots = manifest.screenshots || [];
  // data[screenshotUrl] is a singular field in the API's template (like
  // data[reportUrl]) — never leave it empty: fall back to the report URL
  // itself when there are no failures to link a screenshot for.
  const primaryScreenshotUrl = screenshots.length ? screenshots[0].url : manifest.reportUrl;
  // Real file attachments (attachments[]=@localfile), restoring the
  // original template's usage — a curl --form field that's dropped
  // entirely (as opposed to sent empty) has been seen to silently break
  // delivery on this API even though it still reports "queued".
  const maxAttachments = Number(process.env.REPORT_MAX_ATTACHMENTS || 5);
  const screenshotLocalPaths = screenshots
    .map((s) => s.localPath)
    .filter(Boolean)
    .slice(0, maxAttachments);

  const lines = [
    `TOTAL_TEST_CASES=${shellQuote(totalTestCases)}`,
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
