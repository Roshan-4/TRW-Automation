const allure = require('allure-js-commons');
const { parseSitemapLocs, httpsSitemapLocs } = require('./parseSitemapLocs');

const sitemapAbsoluteUrl = (sitemapPath) => {
  const baseUrl = Cypress.config('baseUrl');
  return new URL(sitemapPath, baseUrl).href;
};

const rewriteLocToBaseUrl = (loc) => {
  const baseUrl = Cypress.config('baseUrl');
  const from = new URL(loc);
  const to = new URL(baseUrl);
  return `${to.origin}${from.pathname}${from.search}${from.hash}`;
};

const statusLabel = (result) => {
  if (!result.ok) {
    return `ERROR: ${result.error}`;
  }
  return String(result.status);
};

const countByStatus = (results) => {
  const counts = { 200: 0, 301: 0, 404: 0, 500: 0, other: 0, error: 0 };
  results.forEach((result) => {
    if (!result.ok) {
      counts.error += 1;
      return;
    }
    if (Object.prototype.hasOwnProperty.call(counts, String(result.status))) {
      counts[result.status] += 1;
      return;
    }
    counts.other += 1;
  });
  return counts;
};

const logSitemapResponses = (label, results) => {
  const counts = countByStatus(results);
  const summary = `[Sitemap] ${label}: ${results.length} page address(es) checked — 200:${counts[200]} 301:${counts[301]} 404:${counts[404]} 500:${counts[500]} other:${counts.other} error:${counts.error} (logged only — does not fail the test)`;
  cy.task('log', summary, { log: false });

  const lines = results.map((item) => `  - ${item.url} -> ${statusLabel(item)}`);
  const report = [summary, ...lines].join('\n');
  cy.task('log', report, { log: false });
  allure.attachment(`${label} page URL responses (200/301/404/500)`, report, 'text/plain');
};

/**
 * Take the next listed page URL, cy.request it, then take the next, until
 * the list is empty. No fixed wait. 404/500 are recorded, not failed.
 */
const requestHttpsStatuses = (urls) => {
  const queue = urls.slice();
  const results = [];

  const processUntilEmpty = () => {
    if (queue.length === 0) {
      return cy.wrap(results, { log: false });
    }

    const url = queue.shift();
    return cy
      .request({
        url,
        method: 'GET',
        failOnStatusCode: false,
        followRedirect: false,
        timeout: 15000,
      })
      .then((response) => {
        results.push({ url, status: response.status, ok: true });
        return processUntilEmpty();
      });
  };

  return processUntilEmpty();
};

const fetchSitemapXml = (sitemapPath) => {
  const sitemapUrl = sitemapAbsoluteUrl(sitemapPath);
  return cy
    .request({
      url: sitemapUrl,
      method: 'GET',
      failOnStatusCode: false,
      followRedirect: true,
      timeout: 30000,
    })
    .then((response) => {
      const xml = typeof response.body === 'string' ? response.body : String(response.body || '');
      const allLocs = parseSitemapLocs(xml);
      return {
        sitemapUrl,
        allLocs,
        httpsLocs: httpsSitemapLocs(allLocs).map(rewriteLocToBaseUrl),
      };
    });
};

const logSitemapUrlCounts = (sitemaps) => {
  const queue = sitemaps.slice();
  const rows = [];

  const processUntilEmpty = () => {
    if (queue.length === 0) {
      const total = rows.reduce((sum, row) => sum + row.total, 0);
      const report = [
        '[Sitemap] How many page addresses each XML lists (not the XML file status):',
        ...rows.map(
          (row) => `  - ${row.label} (${row.path}): ${row.total} page address(es), ${row.https} https`
        ),
        `  Total: ${total} page address(es)`,
        '(logged only — does not fail the test)',
      ].join('\n');
      cy.task('log', report, { log: false });
      allure.attachment('Sitemap URL counts', report, 'text/plain');
      return cy.wrap(rows, { log: false });
    }

    const sitemap = queue.shift();
    return fetchSitemapXml(sitemap.path).then((parsed) => {
      rows.push({
        label: sitemap.label,
        path: sitemap.path,
        total: parsed.allLocs.length,
        https: parsed.httpsLocs.length,
      });
      cy.task(
        'log',
        `[Sitemap] ${sitemap.label} (${sitemap.path}) lists ${parsed.allLocs.length} page address(es) (${parsed.httpsLocs.length} https)`,
        { log: false }
      );
      return processUntilEmpty();
    });
  };

  return processUntilEmpty();
};

const logSitemapPageUrls = (sitemapPath, label) => {
  fetchSitemapXml(sitemapPath).then((parsed) => {
    cy.task(
      'log',
      `[Sitemap] ${label}: ${parsed.allLocs.length} page address(es) in the XML (${parsed.httpsLocs.length} https)`,
      { log: false }
    );

    if (!parsed.httpsLocs.length) {
      cy.task(
        'log',
        `[Sitemap] ${label}: no https page addresses to check (logged only — does not fail the test)`,
        { log: false }
      );
      return;
    }

    requestHttpsStatuses(parsed.httpsLocs).then((results) => {
      logSitemapResponses(label, results);
    });
  });
};

module.exports = {
  logSitemapUrlCounts,
  logSitemapPageUrls,
};
