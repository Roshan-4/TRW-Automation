const ltuData = require('../../testData/HomePage/LatestTruckUpdatesData.json');
const { exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "Latest Truck Updates" video list.
 * Video title links → /{lang}/videos/...
 */
class LatestTruckUpdates {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = ltuData.LatestTruckUpdates[lang];
  }

  static get supportedLanguages() {
    return Object.keys(ltuData.LatestTruckUpdates);
  }

  navigate() {
    cy.visit(this.pageUrl);
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
    this.scrollToSection();
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

  getHeading() {
    return cy.contains('h2', exactText(this.copy.heading), { log: false });
  }

  getSection() {
    return this.getHeading().closest('div.mb-5', { log: false });
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  getVisibleVideoTitleLinks() {
    return this.getSection()
      .find(`a[title][href*="/${this.lang}/videos/"]`, { log: false })
      .filter(':visible')
      .filter((_, el) => !el.querySelector('img') && Boolean((el.textContent || '').trim()));
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    this.getVisibleVideoTitleLinks().its('length').should('be.gte', 1);
  }

  clickFirstVideoTitleAndVerifyNavigation() {
    this.scrollToSection();
    this.getVisibleVideoTitleLinks()
      .first()
      .then(($link) => {
        const href = $link.attr('href');
        const title = ($link.attr('title') || $link.text() || '').trim();
        expect(href, `Video “${title}” should open a videos page`).to.match(
          new RegExp(`^/${this.lang}/videos/`)
        );
        cy.wrap($link).click();
        cy.location('pathname').should('eq', href);
      });
  }
}

module.exports = LatestTruckUpdates;
