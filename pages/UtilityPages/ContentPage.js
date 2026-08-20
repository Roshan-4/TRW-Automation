const contentPageData = require('../../testData/UtilityPages/ContentPageData.json');

/**
 * Dealers, Service Center, Spare Parts, EMI Calculator, Brand And Tonnage,
 * News, Videos, Web Story.
 *
 * Live-audited: none of these 8 pages has any lead-capture element at all
 * (no "Check Offers"/similar button, no name/mobile/city fields anywhere in
 * the page) — only the site-wide search box and generic footer contact
 * links (tel:/mailto:, identical on every page across this whole project).
 * They're pure content, tool, or directory pages (a calculator, a dealer
 * locator, article/video listings), a structurally different type from
 * every other page automated so far. Scope: redirection/load health only,
 * matching the baseline coverage every other page object gets.
 */
class ContentPage {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = contentPageData.ContentPage[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown ContentPage page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;
  }

  static get supportedLanguages() {
    return Object.keys(contentPageData.ContentPage);
  }

  static get pageKeys() {
    return contentPageData.ContentPage.en.pages.map((p) => p.key);
  }

  get pageLabel() {
    return this.page.name;
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
}

module.exports = ContentPage;
