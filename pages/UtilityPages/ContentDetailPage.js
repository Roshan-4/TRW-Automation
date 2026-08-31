const contentDetailPageData = require('../../testData/UtilityPages/ContentDetailPageData.json');

/**
 * About/Privacy/Terms/Sitemap, blog and news article detail, authors hub/detail.
 * Live-audited: none of these pages has a truck lead form (Check Offers /
 * Check Truck Price). Scope is redirection/load health plus a visible heading
 * smoke check — same baseline as ContentPage and DirectoryPage.
 *
 * Contact Us is covered separately (ContactUs.js) because it has its own
 * name/mobile/email/message enquiry form.
 */
class ContentDetailPage {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = contentDetailPageData.ContentDetailPage[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown ContentDetailPage page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;
  }

  static get supportedLanguages() {
    return Object.keys(contentDetailPageData.ContentDetailPage);
  }

  static get pageKeys() {
    return contentDetailPageData.ContentDetailPage.en.pages.map((p) => p.key);
  }

  get pageLabel() {
    return this.page.name;
  }

  get expectedHeading() {
    return this.page.heading;
  }

  navigate() {
    cy.visit(this.pageUrl, { timeout: 90000 });
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
  }

  dismissBlockingOverlays() {
    cy.get('body').then(($body) => {
      const dismissTexts = [/accept/i, /agree/i, /got it/i, /allow/i, /close/i, /ठीक/i];
      dismissTexts.forEach((pattern) => {
        const btn = $body.find('button').filter((_, el) => pattern.test(el.textContent || ''));
        if (btn.length) {
          cy.wrap(btn.first()).click({ force: true });
        }
      });
    });
  }

  verifyPageHeadingVisible() {
    cy.contains('h1', this.expectedHeading, { timeout: 20000 }).should('be.visible');
  }
}

module.exports = ContentDetailPage;
