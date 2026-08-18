#!/usr/bin/env node
/**
 * Capture live DOM from the site under test with Playwright, so page-object
 * locators are written against the real markup instead of guesswork.
 *
 * The app is a client-rendered SPA: `curl` only returns pre-hydration HTML,
 * and tab/filter interactions rewrite the DOM. This script can click through
 * those interactions before capturing.
 *
 * Examples:
 *   node scripts/capture-dom.js --path / --contains "Truck in India"
 *   node scripts/capture-dom.js --path / --contains "Truck in India" \
 *        --click "button.tab-btn:nth-child(2)" --wait-after 1500
 *
 * Flags:
 *   --path <p>          Route to visit, resolved against the base URL   (default "/")
 *   --url <u>           Absolute URL (overrides --path)
 *   --contains <text>   Capture the element containing this text (with --scope)
 *   --scope <sel>       Ancestor selector used with --contains  (default "div.differentTabs")
 *   --selector <sel>    Capture outerHTML of this selector instead
 *   --click <sel>       Click before capturing; repeatable, applied in order
 *   --wait-until <s>    load | domcontentloaded | networkidle        (default "load")
 *   --wait-before <ms>  Delay after load, before the first click        (default 0)
 *   --wait-after <ms>   Delay after each click                       (default 1000)
 *   --out <file>        Output path                     (default artifacts/dom-<ts>.html)
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../cypress/.env') });

const { chromium } = require('playwright');

const parseArgs = (argv) => {
  const args = { click: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : true;
    if (name === 'click') {
      args.click.push(value);
    } else {
      args[name] = value;
    }
  }
  return args;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = process.env.CYPRESS_BASE_URL || 'https://trucks.tractorjunction.com';
  const url = args.url || `${baseUrl}${args.path || '/'}`;
  const waitUntil = args['wait-until'] || 'load';
  const waitBefore = Number(args['wait-before'] || 0);
  const waitAfter = Number(args['wait-after'] || 1000);
  const scope = args.scope || 'div.differentTabs';
  const outFile = args.out || path.join('artifacts', `dom-${Date.now()}.html`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  console.log(`visiting ${url} (waitUntil=${waitUntil})`);
  await page.goto(url, { waitUntil, timeout: 60000 });
  if (waitBefore) await page.waitForTimeout(waitBefore);

  // Resolve the capture target: explicit selector, or text-anchored container.
  let target = null;
  if (args.selector) {
    target = page.locator(args.selector).first();
  } else if (args.contains) {
    target = page
      .locator(scope)
      .filter({ hasText: args.contains })
      .first();
  }

  for (const clickSelector of args.click) {
    const clickable = target ? target.locator(clickSelector).first() : page.locator(clickSelector).first();
    console.log(`clicking ${clickSelector}`);
    await clickable.click({ force: true });
    await page.waitForTimeout(waitAfter);
  }

  if (target) {
    await target.waitFor({ state: 'visible', timeout: 30000 });
  }

  const html = target ? await target.evaluate((el) => el.outerHTML) : await page.content();

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`captured ${html.length} chars -> ${outFile}`);

  if (target) {
    const summary = await target.evaluate((el) => {
      const heading = el.querySelector('h2');
      const tabs = [...el.querySelectorAll('button.tab-btn')].map((btn) => ({
        title: btn.getAttribute('title'),
        active: btn.classList.contains('tabsBorder'),
        type: btn.getAttribute('type'),
        classes: btn.className,
      }));
      const viewAll = el.querySelector('a.viewLinkWrapper');
      const visiblePanel = el.querySelector('div.visible');
      const cardTitles = visiblePanel
        ? [...visiblePanel.querySelectorAll('a[title][href*="-truck/"]')]
            .filter((a) => !a.querySelector('img') && !a.closest('.slick-cloned'))
            .map((a) => ({ title: a.getAttribute('title'), href: a.getAttribute('href') }))
        : [];
      const uniqueHrefs = [...new Set(cardTitles.map((c) => c.href))];
      return {
        heading: heading ? heading.textContent.trim() : null,
        tabs,
        viewAll: viewAll
          ? {
              href: viewAll.getAttribute('href'),
              title: viewAll.getAttribute('title'),
              text: viewAll.textContent.replace(/\s+/g, ' ').trim(),
              hasArrow: Boolean(viewAll.querySelector('svg')),
            }
          : null,
        visibleCardCount: uniqueHrefs.length,
        visibleCards: uniqueHrefs.map((href) => cardTitles.find((c) => c.href === href)),
      };
    });
    console.log(JSON.stringify(summary, null, 2));
  }

  await browser.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
