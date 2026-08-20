/**
 * Redirection / broken-link health check.
 *
 * Scans every `<a href>` on the current page — absolute https/http links,
 * relative internal links, and client-side-routed links (React/Next "Link"
 * components still render a real href, so they are covered too) — and checks
 * each unique target's HTTP status through the `checkLinkStatuses` Node task
 * (native `fetch`, `redirect: 'manual'`, see cypress.config.js) so 30x codes
 * are seen directly instead of being silently followed.
 *
 * - 200 and 30x (301/302/307/308) are healthy: logged only.
 * - 404/500 (or a network error) are logged as broken links to the console
 *   and attached to the Allure report, but this NEVER fails the test — it is
 *   a passive health signal, not an assertion, so a third-party link rot
 *   must not break UI/SEO specs.
 *
 * Usage: call `registerRedirectionCheck(...)` once per `describe`, as the
 * first statement before any other `it`, so it always runs as that section's
 * TC-<PREFIX>-00 (see AGENTS.md — IDs stay append-only; -00 runs first
 * without renumbering the section's existing TC-<PREFIX>-01..n).
 */
const allure = require('allure-js-commons');

const IGNORED_HREF_PATTERN = /^\s*(mailto:|tel:|javascript:|#)/i;
const HEALTHY_STATUSES = [200, 301, 302, 307, 308];

const collectPageLinks = () =>
  cy.document({ log: false }).then((doc) => {
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

    return Array.from(new Set(resolved));
  });

/**
 * Checks every link on the current page and logs a health report. Never
 * throws and never fails the calling test, regardless of what it finds.
 */
const verifyPageRedirections = (label) => {
  collectPageLinks().then((urls) => {
    if (!urls.length) {
      cy.task('log', `[Redirection Check] ${label}: no links found on page`, { log: false });
      return;
    }

    cy.task('checkLinkStatuses', urls, { timeout: 120000 }).then((results) => {
      const broken = results.filter(
        (result) => !result.ok || !HEALTHY_STATUSES.includes(result.status)
      );
      const healthyCount = results.length - broken.length;

      cy.task(
        'log',
        `[Redirection Check] ${label}: ${healthyCount}/${results.length} links OK (200/30x)`,
        { log: false }
      );

      if (broken.length) {
        const lines = broken.map(
          (b) => `  - ${b.url} -> ${b.ok ? b.status : `ERROR: ${b.error}`}`
        );
        const report = [
          `[Redirection Check] ${label}: ${broken.length} broken link(s) found`,
          '(logged only — does not fail the test):',
          ...lines,
        ].join('\n');

        cy.task('log', report, { log: false });
        allure.attachment('Broken links (404/500)', report, 'text/plain');
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
  it(`TC-${prefix}-00: page links resolve 200/30x; broken links are logged, not failed`, { tags }, () => {
    allure.step(`Verify page-link redirections (${label} [${lang}])`, () => {
      verifyPageRedirections(`${label} [${lang}]`);
    });
  });
};

module.exports = {
  verifyPageRedirections,
  registerRedirectionCheck,
};
