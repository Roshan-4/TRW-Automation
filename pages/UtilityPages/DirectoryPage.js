const directoryPageData = require('../../testData/UtilityPages/DirectoryPageData.json');

/**
 * All Truck Brands, Top Bus Brands, Popular Truck Series — pure link
 * directories (150+/108+/173 "Check Offers" on cards, no page-level truck
 * listing, no name/mobile/city fields on load). Live-audited the same way as
 * ContentPage: scope is redirection/load health plus a visible heading smoke
 * check, not per-card lead forms.
 */
class DirectoryPage {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = directoryPageData.DirectoryPage[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown DirectoryPage page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;
  }

  static get supportedLanguages() {
    return Object.keys(directoryPageData.DirectoryPage);
  }

  static get pageKeys() {
    return directoryPageData.DirectoryPage.en.pages.map((p) => p.key);
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

module.exports = DirectoryPage;
