#!/usr/bin/env node
/**
 * Scrape live heading structure + FAQ questions into testData/Seo/{Area}.
 *
 * Daily Cypress specs compare the live page against these snapshots.
 * Re-run this script after a confirmed, intentional SEO copy change to
 * refresh the baseline.
 *
 *   npm run scrape:seo-structure
 *   node scripts/scrape-seo-structure.js --group=home --lang=en
 *   node scripts/scrape-seo-structure.js --lang=hi,ta
 *
 * Sequential on purpose — do not parallel-fetch live pages.
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../cypress/.env') });

const { chromium } = require('playwright');
const {
  uniquePages,
  SEO_STRUCTURE_LANGUAGES,
  pathForLang,
} = require('../pages/Seo/seoStructureCatalog');
const { collectSeoStructure } = require('../helpers/seoStructureCollector');

const parseArgs = (argv) => {
  const args = {};
  argv.forEach((item) => {
    if (!item.startsWith('--')) {
      return;
    }
    const [name, value] = item.slice(2).split('=');
    args[name] = value === undefined ? true : value;
  });
  return args;
};

const parseLangs = (value) => {
  if (!value || value === true || value === 'all') {
    return SEO_STRUCTURE_LANGUAGES.slice();
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => SEO_STRUCTURE_LANGUAGES.includes(item));
};

const asByLanguagePage = (existing, key, name) => {
  if (existing && existing.byLanguage) {
    return existing;
  }
  if (existing && existing.headings) {
    return {
      key,
      name: existing.name || name,
      byLanguage: {
        en: {
          path: existing.path,
          headings: existing.headings,
          faq: existing.faq,
        },
      },
    };
  }
  return { key, name, byLanguage: {} };
};

const writeAreaFile = (dataFile, pages) => {
  const abs = path.resolve(__dirname, '..', dataFile);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const payload = {
    scrapedAt: new Date().toISOString().slice(0, 10),
    languages: SEO_STRUCTURE_LANGUAGES.slice(),
    pages: {},
  };
  if (fs.existsSync(abs)) {
    try {
      const existing = JSON.parse(fs.readFileSync(abs, 'utf8'));
      payload.pages = existing.pages || {};
    } catch (error) {
      // Replace a corrupt file rather than abort the whole scrape.
    }
  }
  pages.forEach((page) => {
    const current = asByLanguagePage(payload.pages[page.key], page.key, page.name);
    current.key = page.key;
    current.name = page.name;
    current.byLanguage = current.byLanguage || {};
    current.byLanguage[page.lang] = {
      path: page.path,
      headings: page.headings,
      faq: page.faq,
      ...(page.error ? { error: page.error } : {}),
    };
    payload.pages[page.key] = current;
  });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`wrote ${dataFile} (${pages.length} snapshot(s) this run)`);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const langs = parseLangs(args.lang);
  const baseUrl = (process.env.CYPRESS_BASE_URL || 'https://trucks.tractorjunction.com').replace(
    /\/$/,
    ''
  );
  const pages = args.group
    ? uniquePages().filter((page) => page.group === args.group)
    : uniquePages();

  if (!pages.length || !langs.length) {
    throw new Error(`No pages/languages to scrape (group=${args.group || 'all'} lang=${langs})`);
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const byFile = new Map();

  for (const lang of langs) {
    for (const entry of pages) {
      const localizedPath = pathForLang(entry.path, lang);
      const url = `${baseUrl}${localizedPath === '/' ? '/' : localizedPath}`;
      process.stdout.write(`scraping [${lang}] ${entry.name} (${url}) ... `);
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(2200);
        // Collector clicks Read More; wait so About headings match Cypress retries.
        await page.evaluate(collectSeoStructure);
        await page.waitForTimeout(1000);
        const structure = await page.evaluate(collectSeoStructure);
        console.log(
          `${structure.headings.length} headings, ${structure.faq.questions.length} FAQ`
        );
        const list = byFile.get(entry.dataFile) || [];
        list.push({
          ...entry,
          lang,
          path: localizedPath,
          headings: structure.headings,
          faq: structure.faq,
        });
        byFile.set(entry.dataFile, list);
      } catch (error) {
        console.log(`FAILED: ${error.message}`);
        const list = byFile.get(entry.dataFile) || [];
        list.push({
          ...entry,
          lang,
          path: localizedPath,
          headings: [],
          faq: { heading: '', questions: [] },
          error: error.message,
        });
        byFile.set(entry.dataFile, list);
      }
    }
  }

  await browser.close();
  byFile.forEach((list, dataFile) => writeAreaFile(dataFile, list));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
