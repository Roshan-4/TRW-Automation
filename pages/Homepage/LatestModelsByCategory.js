const lmcData = require('../../testData/HomePage/LatestModelsByCategoryData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;
const TAB_KEYS = ['threeWheelers', 'autoRickshaw', 'eRickshaw', 'miniTrucks', 'scv'];

/**
 * Homepage "Latest Models by Category" section.
 * Tabs + card slider (same differentTabs pattern as Truck in India).
 * One Check Offers lead per tab; product name → PDP; View All per tab.
 */
class LatestModelsByCategory {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = lmcData.LatestModelsByCategory[lang];
    this.leadFormCopy = truckInIndiaData.CheckOffersForm[lang];
    this.leadForm = new LeadFormFiller({
      cityPlaceholder: this.leadFormCopy.cityPlaceholder,
      submitText: this.leadFormCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(lmcData.LatestModelsByCategory);
  }

  static get tabKeys() {
    return TAB_KEYS;
  }

  navigate() {
    cy.visit(this.pageUrl);
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
    this.scrollToSection();
    this.getSection().find('button.tab-btn').should('have.length', TAB_KEYS.length);
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
    return this.getHeading().closest('div.differentTabs', { log: false });
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  getTab(tabKey) {
    const label = this.copy.tabs[tabKey];
    return this.getSection().find(`button.tab-btn[title="${label}"]`, { log: false });
  }

  getActivePanel() {
    return this.getSection().find('div.visible', { log: false }).first();
  }

  getViewAllLink() {
    return this.getSection().find('a.viewLinkWrapper', { log: false });
  }

  getVisibleProductNameLinks() {
    return this.getActivePanel()
      .find('a[title][href*="-truck/"]', { log: false })
      .filter(':visible')
      .filter((_, el) => !el.querySelector('img') && !el.closest('.slick-cloned'));
  }

  getVisibleCheckOfferButtons() {
    return this.getActivePanel()
      .find(`button[title="${this.copy.checkOffersCta}"]`, { log: false })
      .filter(':visible')
      .filter((_, el) => !el.closest('.slick-cloned'));
  }

  /**
   * Re-click tab until View All href matches expected (React hydration safe).
   */
  openTab(tabKey) {
    const expectedViewAll = this.copy.viewAll[tabKey];
    const label = this.copy.tabs[tabKey];
    this.scrollToSection();

    this.getHeading().then(($heading) => {
      const section = () => Cypress.$($heading).closest('div.differentTabs');
      const clickTab = () => {
        const button = section().find(`button.tab-btn[title="${label}"]`).get(0);
        if (button) {
          button.click();
        }
      };

      clickTab();

      cy.wrap($heading, { log: false })
        .closest('div.differentTabs', { log: false })
        .find('a.viewLinkWrapper', { log: false })
        .should(($link) => {
          if ($link.attr('href') !== expectedViewAll.href) {
            clickTab();
          }
          expect(
            $link.attr('href'),
            `View All for “${label}” should open ${expectedViewAll.href}`
          ).to.eq(expectedViewAll.href);
        });
    });

    this.getTab(tabKey).should('have.class', 'tabsBorder');
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    Object.values(this.copy.tabs).forEach((label) => {
      this.getSection().find(`button.tab-btn[title="${label}"]`).should('be.visible');
    });
  }

  clickFirstProductNameAndVerifyNavigation() {
    this.scrollToSection();
    this.getVisibleProductNameLinks()
      .first()
      .then(($link) => {
        const href = $link.attr('href');
        const title = ($link.attr('title') || $link.text() || '').trim();
        expect(href, `Product “${title}” should have a truck PDP URL`).to.match(
          new RegExp(`^/${this.lang}/[^/]+-truck/`)
        );
        cy.wrap($link).click();
        cy.location('pathname').should('eq', href);
      });
  }

  verifyViewAllForTab(tabKey) {
    const expected = this.copy.viewAll[tabKey];
    this.getViewAllLink()
      .should('be.visible')
      .and('have.attr', 'href', expected.href)
      .and('have.attr', 'title', expected.label);
  }

  clickViewAllAndVerifyNavigation(tabKey) {
    this.openTab(tabKey);
    this.verifyViewAllForTab(tabKey);
    this.getViewAllLink().click();
    cy.location('pathname').should('eq', this.copy.viewAll[tabKey].href);
  }

  openCheckOffersLeadForm() {
    this.scrollToSection();
    this.getHeading().then(($heading) => {
      const clickCta = () => {
        const button = Cypress.$($heading)
          .closest('div.differentTabs')
          .find('div.visible')
          .find(`button[title="${this.copy.checkOffersCta}"]`)
          .filter(':visible')
          .not('.slick-cloned button')
          .get(0);
        if (button) {
          button.click();
        }
      };

      clickCta();
      cy.get('input#name[name="name"]').should(($input) => {
        if (!$input.is(':visible')) {
          clickCta();
        }
        expect($input.is(':visible'), 'Check Offers lead form visible').to.eq(true);
      });
    });
  }

  verifyCheckOffersLeadSubmitted() {
    cy.contains('h3', exactText(this.leadFormCopy.thankYouHeading)).should('be.visible');
    cy.contains('p', /PRICE:/i).should('be.visible');
    cy.contains('p', exactText(this.leadFormCopy.interestedIn)).should('be.visible');
  }

  /**
   * One Check Offers lead from the given tab (name / mobile / city;
   * 5-digit price/budget only if the form asks for it).
   */
  submitOneCheckOffersLeadFromTab(tabKey, overrides = {}) {
    this.openTab(tabKey);
    this.openCheckOffersLeadForm();
    this.leadForm.fillAndSubmit({
      name: this.leadFormCopy.name,
      city: this.leadFormCopy.city,
      priceBudget: this.copy.priceBudget,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }
}

module.exports = LatestModelsByCategory;
