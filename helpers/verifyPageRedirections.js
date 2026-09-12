/**
 * Redirection / broken-link health check.
 *
 * Scans every in-scope `<a href>` on the current page — Truck Junction
 * internal links only (same origin as baseUrl or *.tractorjunction.com).
 * Third-party footer/social/ad/partner URLs are skipped. Relative internal
 * links and client-side-routed React/Next links are included.
 *
 * Each unique in-scope target is checked through the `checkLinkStatuses` Node
 * task (native `fetch`, `redirect: 'manual'`, see cypress.config.js) so 30x
 * codes are seen directly instead of being silently followed.
 *
 * - 200 and 30x (301/302/307/308) are healthy: logged only.
 * - 404/500 (or a network error) are logged as broken links to the console
 *   and attached to the Allure report, but this NEVER fails the test — it is
 *   a passive health signal, not an assertion.
 *
 * Usage: call `registerRedirectionCheck(...)` once per `describe`, as the
 * first statement before any other `it`, so it always runs as that section's
 * TC-<PREFIX>-00 (see AGENTS.md — IDs stay append-only; -00 runs first
 * without renumbering the section's existing TC-<PREFIX>-01..n).
 */
const allure = require('allure-js-commons');
const { isTruckJunctionUrl } = require('./truckJunctionLink');

const IGNORED_HREF_PATTERN = /^\s*(mailto:|tel:|javascript:|#)/i;
const HEALTHY_STATUSES = [200, 301, 302, 307, 308];

const collectPageLinks = () =>
  cy.document({ log: false }).then((doc) => {
    const baseOrigin = new URL(doc.baseURI || Cypress.config('baseUrl')).origin;
    const hrefs = Array.from(doc.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href'))
      .filter((href) => href && !IGNORED_HREF_PATTERN.test(href));

    const resolved = hrefs
      .map((href) => {
        try {
          return new URL(href, doc.baseURI).href;
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);

    const uniqueResolved = Array.from(new Set(resolved));
    const urls = uniqueResolved.filter((href) => isTruckJunctionUrl(href, baseOrigin));
    const skippedThirdParty = uniqueResolved.length - urls.length;

    return { urls, skippedThirdParty };
  });

/**
 * Checks every in-scope Truck Junction link on the current page and logs a
 * health report. Never throws and never fails the calling test.
 */
const verifyPageRedirections = (label) => {
  collectPageLinks().then(({ urls, skippedThirdParty }) => {
    if (!urls.length) {
      cy.task(
        'log',
        `[Redirection Check] ${label}: no Truck Junction links found on page` +
          (skippedThirdParty ? ` (${skippedThirdParty} third-party/external skipped)` : ''),
        { log: false }
      );
      return;
    }

    // checkLinkStatuses is one-at-a-time, max 6/sec (cypress.config.js). A
    // link-heavy page can take longer than a fixed 120s cap, so scale the
    // task timeout with the link count (~2.5s average per URL).
    const taskTimeout = Math.max(180000, urls.length * 2500);

    cy.task('checkLinkStatuses', urls, { timeout: taskTimeout }).then((results) => {
      const broken = results.filter(
        (result) => !result.ok || !HEALTHY_STATUSES.includes(result.status)
      );
      const healthyCount = results.length - broken.length;
      const skipNote = skippedThirdParty
        ? `; skipped ${skippedThirdParty} third-party/external URL(s)`
        : '';

      cy.task(
        'log',
        `[Redirection Check] ${label}: ${healthyCount}/${results.length} Truck Junction links OK (200/30x)${skipNote}`,
        { log: false }
      );

      if (broken.length) {
        const lines = broken.map(
          (b) => `  - ${b.url} -> ${b.ok ? b.status : `ERROR: ${b.error}`}`
        );
        const report = [
          `[Redirection Check] ${label}: ${broken.length} broken Truck Junction link(s) found`,
          '(logged only — does not fail the test):',
          ...lines,
        ].join('\n');

        cy.task('log', report, { log: false });
        allure.attachment('Broken Truck Junction links (404/500)', report, 'text/plain');
      }
    });
  });
};

/**
 * Registers the redirection health check as `TC-<prefix>-00`, the first
 * `it` in a `describe` block. Relies on that block's own `beforeEach`
 * (or `before`, for session-shared specs like NewTruckPdp) to have already
 * navigated to the page under test.
 */
const registerRedirectionCheck = ({ prefix, lang, tags, label }) => {
  it(
    `TC-${prefix}-00: Truck Junction page links resolve 200/30x; broken links are logged, not failed`,
    { tags },
    () => {
      allure.step(`Verify Truck Junction page-link redirections (${label} [${lang}])`, () => {
        verifyPageRedirections(`${label} [${lang}]`);
      });
    }
  );
};

module.exports = {
  verifyPageRedirections,
  registerRedirectionCheck,
};
