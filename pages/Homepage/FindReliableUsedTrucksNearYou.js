const fruData = require('../../testData/HomePage/FindReliableUsedTrucksNearYouData.json');
const { exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "Find Reliable Used Trucks Near You" city links.
 * City cards → /{lang}/used-truck-in-{slug}
 */
class FindReliableUsedTrucksNearYou {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = fruData.FindReliableUsedTrucksNearYou[lang];
  }

  static get supportedLanguages() {
    return Object.keys(fruData.FindReliableUsedTrucksNearYou);
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
    return this.getHeading()
      .parents('div.mb-5', { log: false })
      .filter((_, el) => Boolean(el.querySelector('a[href*="used-truck-in-"]')))
      .first();
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  expectedCityPath(slug) {
    return `/${this.lang}/used-truck-in-${slug}`;
  }

  getCityLinks() {
    return this.getSection().find('a[title][href*="used-truck-in-"]', { log: false }).filter(':visible');
  }

  getCityLink(slug) {
    return this.getSection().find(`a[href="${this.expectedCityPath(slug)}"]`, { log: false });
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    this.getCityLinks().its('length').should('be.gte', 1);
  }

  verifyAllCityLinksPresent() {
    this.scrollToSection();
    this.getSection().then(($section) => {
      this.copy.cities.forEach((city) => {
        const expectedHref = this.expectedCityPath(city.slug);
        const $link = Cypress.$($section).find(`a[href="${expectedHref}"]`).first();
        expect($link.length, `City “${city.name}” should be listed`).to.eq(1);
        expect($link.attr('title'), `City “${city.name}” title`).to.eq(city.name);
        expect($link.attr('href'), `City “${city.name}” URL`).to.eq(expectedHref);
      });
      const hrefs = [...Cypress.$($section).find('a[href*="used-truck-in-"]')].map((el) =>
        el.getAttribute('href')
      );
      expect(new Set(hrefs).size, 'Each city listing URL should appear once').to.eq(
        this.copy.cities.length
      );
    });
  }

  clickFirstCityAndVerifyNavigation() {
    this.clickCityAndVerifyNavigation(0);
  }

  clickCityAndVerifyNavigation(cityIndex) {
    this.scrollToSection();
    const city = this.copy.cities[cityIndex];
    this.getCityLink(city.slug)
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .click({ force: true });
    cy.location('pathname').should('eq', this.expectedCityPath(city.slug));
  }

  /** Negative: no two city cards should point at the same listing URL. */
  verifyNoCityLinkSharesAnotherCitysUrl() {
    this.scrollToSection();
    const first = this.copy.cities[0];
    const second = this.copy.cities[1];
    this.getCityLink(first.slug).should('not.have.attr', 'href', this.expectedCityPath(second.slug));
    this.getCityLink(second.slug).should('not.have.attr', 'href', this.expectedCityPath(first.slug));
  }
}

module.exports = FindReliableUsedTrucksNearYou;
