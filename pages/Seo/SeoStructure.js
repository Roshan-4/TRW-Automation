const allure = require('allure-js-commons');
const {
  collectSeoStructure,
  formatHeadingReport,
  formatFaqReport,
  comparisonTableHtml,
  headingLine,
} = require('../../helpers/seoStructureCollector');

/**
 * Daily SEO heading / FAQ snapshot check for one page + language.
 * Snapshot JSON is written by `npm run scrape:seo-structure`.
 */
class SeoStructure {
  constructor(snapshot, lang = 'en', context = {}) {
    this.lang = lang;
    this.page = snapshot;
    this.pageKey = context.pageKey || snapshot.key;
    this.dataFile = context.dataFile || '';
    if (!this.page || !this.page.path) {
      throw new Error('SeoStructure requires a snapshot with path, headings and faq');
    }
  }

  get pageLabel() {
    return this.page.name;
  }

  get pageUrl() {
    return this.page.path;
  }

  navigate() {
    cy.visit(this.pageUrl, {
      timeout: 90000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
    });
    cy.document().its('readyState').should('eq', 'complete');
    cy.get('h1, h2', { timeout: 20000 }).should('exist');
  }

  waitForStoredHeadings() {
    const expectedCount = (this.page.headings || []).length;
    cy.document({ timeout: 20000 }).should((doc) => {
      const live = collectSeoStructure(doc);
      expect(
        live.headings.length,
        `Waiting for ${this.pageLabel} [${this.lang}] SEO headings to finish rendering (stored ${expectedCount}, live ${live.headings.length})`
      ).to.be.at.least(expectedCount);
    });
  }

  collectLive() {
    return cy.document().then((doc) => collectSeoStructure(doc));
  }

  attachAndRecord(kind, live, headingReport, faqReport) {
    if (kind === 'headings') {
      allure.attachment(
        `${this.pageLabel} [${this.lang}] headings — expected vs actual`,
        comparisonTableHtml(`${this.pageLabel} (${this.lang}) headings`, headingReport.rows),
        'text/html'
      );
      allure.attachment(
        'Expected headings (test data)',
        headingReport.expectedKeys.join('\n') || '(none)',
        'text/plain'
      );
      allure.attachment(
        'Actual headings (live page)',
        headingReport.actualKeys.join('\n') || '(none)',
        'text/plain'
      );
    }

    if (kind === 'faq') {
      allure.attachment(
        `${this.pageLabel} [${this.lang}] FAQ — expected vs actual`,
        comparisonTableHtml(`${this.pageLabel} (${this.lang}) FAQ`, faqReport.rows),
        'text/html'
      );
    }

    if (!headingReport.matched) {
      allure.attachment(
        'Live headings JSON (paste into test data after confirming the change is intended)',
        JSON.stringify(
          {
            path: this.page.path,
            headings: live.headings,
            faq: live.faq,
          },
          null,
          2
        ),
        'application/json'
      );
    }

    return cy.task(
      'recordSeoStructureComparison',
      {
        pageKey: this.pageKey,
        lang: this.lang,
        pageLabel: this.pageLabel,
        path: this.page.path,
        dataFile: this.dataFile,
        headingsMatched: headingReport.matched,
        faqMatched: faqReport.matched,
        missingHeadings: headingReport.missing.map(headingLine),
        extraHeadings: headingReport.extra.map(headingLine),
        headingRows: headingReport.rows,
        faqRows: faqReport.rows,
        expectedFaqHeading: faqReport.expectedHeading,
        actualFaqHeading: faqReport.actualHeading,
        liveSnapshot: {
          path: this.page.path,
          headings: live.headings,
          faq: live.faq,
        },
      },
      { log: false }
    );
  }

  verifyHeadingsMatchSnapshot() {
    const expected = this.page.headings || [];
    const expectedFaq = this.page.faq || { heading: '', questions: [] };
    this.waitForStoredHeadings();
    return this.collectLive().then((live) => {
      const headingReport = formatHeadingReport(expected, live.headings);
      const faqReport = formatFaqReport(expectedFaq, live.faq);
      return this.attachAndRecord('headings', live, headingReport, faqReport).then(() => {
        const message = [
          `Heading structure on “${this.pageLabel}” [${this.lang}] changed.`,
          headingReport.missing.length
            ? `Missing (${headingReport.missing.length}): ${headingReport.missing
                .map(headingLine)
                .join(' | ')}`
            : null,
          headingReport.extra.length
            ? `Newly added (${headingReport.extra.length}): ${headingReport.extra
                .map(headingLine)
                .join(' | ')}`
            : null,
          'Open the Allure attachment “expected vs actual” or artifacts/seo-structure-report.xlsx.',
        ]
          .filter(Boolean)
          .join('\n');
        expect(headingReport.matched, message).to.eq(true);
      });
    });
  }

  verifyNoStoredHeadingsMissing() {
    const expected = this.page.headings || [];
    this.waitForStoredHeadings();
    return this.collectLive().then((live) => {
      const headingReport = formatHeadingReport(expected, live.headings);
      expect(
        headingReport.missing,
        headingReport.missing.length
          ? `These stored headings are gone from “${this.pageLabel}” [${this.lang}]: ${headingReport.missing
              .map(headingLine)
              .join(' | ')}`
          : `No stored headings are missing on “${this.pageLabel}”`
      ).to.deep.equal([]);
    });
  }

  verifyHeadingCountMatches() {
    const expected = this.page.headings || [];
    this.waitForStoredHeadings();
    return this.collectLive().then((live) => {
      expect(
        live.headings.length,
        `“${this.pageLabel}” [${this.lang}] should still have ${expected.length} SEO headings (found ${live.headings.length})`
      ).to.eq(expected.length);
    });
  }

  verifyFaqMatchesSnapshot() {
    const expectedHeadings = this.page.headings || [];
    const expectedFaq = this.page.faq || { heading: '', questions: [] };
    this.waitForStoredHeadings();
    return this.collectLive().then((live) => {
      const headingReport = formatHeadingReport(expectedHeadings, live.headings);
      const faqReport = formatFaqReport(expectedFaq, live.faq);
      return this.attachAndRecord('faq', live, headingReport, faqReport).then(() => {
        expect(
          live.faq.heading,
          `FAQ heading on “${this.pageLabel}” [${this.lang}] changed from “${
            faqReport.expectedHeading || '(none)'
          }” to “${faqReport.actualHeading || '(none)'}”`
        ).to.eq(expectedFaq.heading);
        const message = [
          `FAQ questions on “${this.pageLabel}” [${this.lang}] changed.`,
          faqReport.missing.length ? `Missing: ${faqReport.missing.join(' | ')}` : null,
          faqReport.extra.length ? `Newly added: ${faqReport.extra.join(' | ')}` : null,
        ]
          .filter(Boolean)
          .join(' ');
        expect(live.faq.questions, message).to.deep.equal(expectedFaq.questions || []);
      });
    });
  }
}

module.exports = SeoStructure;
