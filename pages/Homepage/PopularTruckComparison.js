const ptcData = require('../../testData/HomePage/PopularTruckComparisonData.json');
const { exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "Popular Truck Comparison" section.
 * Truck name links → PDP; View All Comparison → /{lang}/compare.
 * No Check Offers lead in this section.
 */
class PopularTruckComparison {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = ptcData.PopularTruckComparison[lang];
  }

  static get supportedLanguages() {
    return Object.keys(ptcData.PopularTruckComparison);
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
    return this.getHeading().closest('div.section-wrapper', { log: false });
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  getVisibleProductNameLinks() {
    return this.getSection()
      .find('a[title][href*="-truck/"]', { log: false })
      .filter(':visible')
      .filter((_, el) => !el.querySelector('img') && Boolean((el.textContent || '').trim()));
  }

  getViewAllLink() {
    return this.getSection().find(`a[title="${this.copy.viewAll.label}"]`, { log: false });
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    this.getVisibleProductNameLinks().its('length').should('be.gte', 1);
  }

  clickFirstProductNameAndVerifyNavigation() {
    this.scrollToSection();
    this.getVisibleProductNameLinks()
      .first()
      .then(($link) => {
        const href = $link.attr('href');
        const title = ($link.attr('title') || $link.text() || '').trim();
        expect(href, `Compared truck “${title}” should have a truck PDP URL`).to.match(
          new RegExp(`^/${this.lang}/[^/]+-truck/`)
        );
        cy.wrap($link).click();
        cy.location('pathname').should('eq', href);
      });
  }

  clickViewAllAndVerifyNavigation() {
    this.scrollToSection();
    this.getViewAllLink()
      .should('be.visible')
      .and('have.attr', 'href', this.copy.viewAll.href);
    this.getViewAllLink().click();
    cy.location('pathname').should('eq', this.copy.viewAll.href);
  }
}

module.exports = PopularTruckComparison;
