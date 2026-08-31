/**
 * Publish the locally-generated Allure HTML report (allure-report/, built by
 * `npm run generate:report`) as a new timestamped snapshot in the separate
 * public GitHub Pages repo that hosts historical reports:
 * https://github.com/Roshan-4/truckjunction-automation-reports
 *
 * Every run gets its own `<YYYY-MM-DD_HH-mm-ss>/` folder (IST clock,
 * never overwritten — including multiple runs on the same day), and
 * `latest/` is always replaced with a copy of the newest report. The root
 * index.html is regenerated to link every run, grouped by date.
 *
 * Any failed-test screenshots found under cypress/screenshots(-ui-desktop|
 * -ui-mobile|-seo-desktop|-seo-mobile)/ are published alongside the report, under
 * failed-screenshots/<timestamp>/, renamed to <device>_<TC-id or
 * slug>.png. reports/last-report-publish.json (gitignored) is written with
 * the report/screenshot URLs, for scripts/send-report-email.js to read.
 *
 * Auth:
 * - CI: set REPORTS_DEPLOY_TOKEN (a fine-grained PAT scoped to just the
 *   reports repo, Contents: Read and write) as a secret; this script pushes
 *   over an authenticated HTTPS URL built from it.
 * - Local: no token needed — pushes over plain HTTPS using your existing
 *   git/gh credential helper.
 *
 * Usage: npm run report:publish  [-- --timestamp=YYYY-MM-DD_HH-mm-ss]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'allure-report');
const PAGES_BASE_URL = 'https://roshan-4.github.io/truckjunction-automation-reports';
const TARGET_REPO = process.env.REPORTS_REPO || 'Roshan-4/truckjunction-automation-reports';
const TOKEN = process.env.REPORTS_DEPLOY_TOKEN || '';
const RUN_DIR_PATTERN = /^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})$/;
const SCREENSHOT_DIRS = [
  { dir: path.join(ROOT, 'cypress', 'screenshots-ui-desktop'), device: 'ui-desktop' },
  { dir: path.join(ROOT, 'cypress', 'screenshots-ui-mobile'), device: 'ui-mobile' },
  { dir: path.join(ROOT, 'cypress', 'screenshots-seo-desktop'), device: 'seo-desktop' },
  { dir: path.join(ROOT, 'cypress', 'screenshots-seo-mobile'), device: 'seo-mobile' },
  { dir: path.join(ROOT, 'cypress', 'screenshots'), device: 'run' },
];

function fail(message) {
  console.error(`report:publish failed: ${message}`);
  process.exit(1);
}

function istTimestamp() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}_${get('hour')}-${get('minute')}-${get('second')}`;
}

function parseTimestampArg() {
  const arg = process.argv.find((a) => a.startsWith('--timestamp='));
  return arg ? arg.slice('--timestamp='.length) : process.env.REPORT_TIMESTAMP || istTimestamp();
}

function run(cmd, args, cwd, options = {}) {
  return execFileSync(cmd, args, { cwd, stdio: options.quiet ? 'pipe' : 'inherit' });
}

function copyDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

// Folder names stay ISO (YYYY-MM-DD_HH-mm-ss) so they sort correctly and
// read unambiguously as URLs from anywhere in the world. Only the
// human-facing text on the index page is shown in Indian format
// (DD-MM-YYYY, 12-hour clock) since that's what's actually being read.
function toIndianDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

function toIndianTime(hhMmSs) {
  let [hour, minute, second] = hhMmSs.split('-').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  const pad = (n) => String(n).padStart(2, '0');
  return `${hour}:${pad(minute)}:${pad(second)} ${period}`;
}

function regenerateIndex(repoDir) {
  const runDirs = fs
    .readdirSync(repoDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && RUN_DIR_PATTERN.test(e.name))
    .map((e) => e.name)
    .sort()
    .reverse();

  const byDate = new Map();
  for (const dir of runDirs) {
    const [, date, time] = dir.match(RUN_DIR_PATTERN);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push({ dir, time: toIndianTime(time) });
  }

  const groups = [...byDate.entries()]
    .map(
      ([date, runs]) => `      <li>
        <span class="date">${toIndianDate(date)}</span>
        <ul class="times">
${runs.map((r) => `          <li><a href="./${r.dir}/">${r.time} IST</a></li>`).join('\n')}
        </ul>
      </li>`
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Truck Junction Automation Reports</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 640px; margin: 48px auto; padding: 0 16px; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  a.latest { display: inline-block; margin: 8px 0 24px; font-weight: 600; }
  ul { list-style: none; padding: 0; }
  ul.times { padding-left: 16px; }
  li { padding: 4px 0; }
  span.date { font-weight: 600; }
  p.empty { color: #666; }
</style>
</head>
<body>
<h1>Truck Junction Automation Reports</h1>
<a class="latest" href="./latest/">&#8594; Latest report</a>
${groups ? `<ul>\n${groups}\n    </ul>` : '<p class="empty">No reports yet.</p>'}
</body>
</html>
`;

  fs.writeFileSync(path.join(repoDir, 'index.html'), html, 'utf8');
}

function walkPngFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkPngFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      results.push(full);
    }
  }
  return results;
}

function slugify(text) {
  return text
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// One entry per failing test: <device>_<TC-id (or slugified title)>.png,
// keeping only the highest retry attempt when Cypress wrote more than one
// screenshot for the same failing test.
function collectFailedScreenshots() {
  const byKey = new Map();

  for (const { dir, device } of SCREENSHOT_DIRS) {
    for (const file of walkPngFiles(dir)) {
      const base = path.basename(file, '.png');
      const attemptMatch = base.match(/\(attempt (\d+)\)/);
      const attempt = attemptMatch ? Number(attemptMatch[1]) : 1;
      const tcMatch = base.match(/\bTC-[A-Z0-9]+-\d+\b/);
      const label = tcMatch ? tcMatch[0] : slugify(base);
      const key = `${device}_${label}`;

      const existing = byKey.get(key);
      if (!existing || attempt > existing.attempt) {
        byKey.set(key, { file, attempt, name: `${device}_${label}.png` });
      }
    }
  }

  return [...byKey.values()];
}

function publishFailedScreenshots(workDir, timestamp) {
  const screenshots = collectFailedScreenshots();
  if (!screenshots.length) return [];

  const destDir = path.join(workDir, 'failed-screenshots', timestamp);
  fs.mkdirSync(destDir, { recursive: true });

  // Original Cypress screenshot filenames embed the spec's describe/it
  // title verbatim, which often contains non-ASCII characters (e.g. an em
  // dash) — curl's mingw64 Windows build fails to open (`--form
  // field=@path`) files whose path contains those, even though the file
  // genuinely exists. Persist the ASCII-safe renamed copy locally too
  // (gitignored, outside the temp git clone that gets deleted after
  // publish) so scripts/send-report-email.js always attaches a path curl
  // can actually read.
  const localSafeDir = path.join(ROOT, 'reports', 'failed-screenshots', timestamp);
  fs.mkdirSync(localSafeDir, { recursive: true });

  return screenshots.map(({ file, name }) => {
    const localSafePath = path.join(localSafeDir, name);
    fs.copyFileSync(file, localSafePath);
    fs.copyFileSync(file, path.join(destDir, name));
    return {
      name,
      url: `${PAGES_BASE_URL}/failed-screenshots/${timestamp}/${encodeURIComponent(name)}`,
      // ASCII-safe persistent local copy — see comment above — so
      // scripts/send-report-email.js can attach the real file, matching
      // the original template's attachments[]=@localfile usage.
      localPath: localSafePath,
    };
  });
}

// Consumed by scripts/send-report-email.js so it doesn't have to
// re-discover screenshot files or re-derive URLs.
function writeManifest(manifest) {
  const manifestDir = path.join(ROOT, 'reports');
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    path.join(manifestDir, 'last-report-publish.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
}

function main() {
  if (!fs.existsSync(REPORT_DIR) || !fs.existsSync(path.join(REPORT_DIR, 'index.html'))) {
    fail(`No report found at ${REPORT_DIR}. Run "npm run generate:report" first.`);
  }

  const timestamp = parseTimestampArg();
  if (!RUN_DIR_PATTERN.test(timestamp)) {
    fail(`Invalid timestamp "${timestamp}", expected format YYYY-MM-DD_HH-mm-ss`);
  }

  const remoteUrl = TOKEN
    ? `https://x-access-token:${TOKEN}@github.com/${TARGET_REPO}.git`
    : `https://github.com/${TARGET_REPO}.git`;

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'allure-reports-'));

  try {
    console.log(`Cloning ${TARGET_REPO}...`);
    run('git', ['clone', '--depth=1', remoteUrl, workDir], ROOT, { quiet: true });

    console.log(`Publishing report as ${timestamp}...`);
    copyDir(REPORT_DIR, path.join(workDir, timestamp));
    copyDir(REPORT_DIR, path.join(workDir, 'latest'));

    const screenshots = publishFailedScreenshots(workDir, timestamp);
    if (screenshots.length) {
      console.log(`Publishing ${screenshots.length} failed-test screenshot(s)...`);
    }

    const nojekyllPath = path.join(workDir, '.nojekyll');
    if (!fs.existsSync(nojekyllPath)) {
      fs.writeFileSync(nojekyllPath, '');
    }

    regenerateIndex(workDir);

    const reportUrl = `${PAGES_BASE_URL}/${timestamp}/`;
    const latestUrl = `${PAGES_BASE_URL}/latest/`;
    const manifest = { timestamp, reportUrl, latestUrl, screenshots };

    run('git', ['add', '-A'], workDir);
    const status = run('git', ['status', '--porcelain'], workDir, { quiet: true }).toString();
    if (!status.trim()) {
      console.log('No changes to publish (report identical to latest).');
      writeManifest(manifest);
      return;
    }

    run(
      'git',
      [
        '-c', 'user.name=TRW Automation Bot',
        '-c', 'user.email=actions@users.noreply.github.com',
        'commit', '-m', `Publish report for ${timestamp}`,
      ],
      workDir
    );
    run('git', ['push', 'origin', 'HEAD:main'], workDir, { quiet: true });

    writeManifest(manifest);

    console.log(`\nPublished:`);
    console.log(`  ${reportUrl}`);
    console.log(`  ${latestUrl}`);
    if (screenshots.length) {
      console.log(`  ${screenshots.length} failed-test screenshot(s) under failed-screenshots/${timestamp}/`);
    }
  } catch (error) {
    fail(error.message || String(error));
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main();
