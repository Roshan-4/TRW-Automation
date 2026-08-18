const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const TAB_KEYS = ['popular', 'latest', 'upcoming'];
const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "Truck in India {year}" section.
 * Locators use semantic text / title / href — not CSS-module hashes.
 * Cypress scrollBehavior is false; scrolling is explicit (sticky header aware).
 * Check Offers lead form actions live here so LeadFormSuite can reuse them.
 */
class TruckInIndia {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = truckInIndiaData.TruckInIndia[lang];
    this.leadFormCopy = truckInIndiaData.CheckOffersForm[lang];
    this.year = new Date().getFullYear();
    this.leadForm = new LeadFormFiller({
      cityPlaceholder: this.leadFormCopy.cityPlaceholder,
      submitText: this.leadFormCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(truckInIndiaData.TruckInIndia);
  }

  get expectedHeading() {
    return `${this.copy.headingPrefix} ${this.year}`;
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
    return cy.contains('h2', exactText(this.expectedHeading), { log: false });
  }

  /**
   * Keep the section clear of the sticky topbar, which otherwise covers the
   * tab strip after a plain centre scroll.
   */
  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  getSection() {
    return this.getHeading().closest('div.differentTabs', { log: false });
  }

  getTab(tabKey) {
    const label = this.copy.tabs[tabKey];
    return this.getSection().find(`button.tab-btn[title="${label}"]`, { log: false });
  }

  openTab(tabKey) {
    const expectedViewAll = this.copy.viewAll[tabKey];
    const label = this.copy.tabs[tabKey];
    this.scrollToSection();

    // Playwright captures show title-based tab clicks work after hydration.
    // Cypress can land before React attaches listeners, so re-click until
    // View All copy/href match the captured per-tab values.
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
          if ($link.attr('title') !== expectedViewAll.label) {
            clickTab();
          }
          expect($link.attr('title'), `${label} View All label`).to.eq(expectedViewAll.label);
        })
        .and('have.attr', 'href', expectedViewAll.href);
    });

    this.getTab(tabKey).should('have.class', 'tabsBorder');
  }

  getActivePanel() {
    return this.getSection().find('div.visible', { log: false }).first();
  }

  /**
   * Visible truck title links only (text heading anchors, not image wrappers).
   * Hidden tab panels and slick clones are excluded.
   */
  getVisibleCardLinks() {
    return this.getActivePanel()
      .find('a[title][href*="-truck/"]', { log: false })
      .filter(':visible')
      .filter((_, el) => !el.querySelector('img') && !el.closest('.slick-cloned'));
  }

  getVisibleCheckOfferButtons() {
    return this.getActivePanel()
      .find(`button[title="${this.copy.checkOffersCta}"]`, { log: false })
      .filter(':visible');
  }

  getViewAllLink() {
    return this.getSection().find('a.viewLinkWrapper', { log: false });
  }

  verifySectionVisibleWithYearHeading() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.expectedHeading);
    this.getSection().should('be.visible');
  }

  verifyTabsVisible() {
    Object.values(this.copy.tabs).forEach((label) => {
      this.getSection()
        .find(`button[title="${label}"]`, { log: false })
        .should('be.visible');
    });
  }

  verifyActiveTab(tabKey) {
    this.getTab(tabKey).should('have.class', 'tabsBorder');
    Object.keys(this.copy.tabs)
      .filter((key) => key !== tabKey)
      .forEach((key) => {
        this.getTab(key).should('not.have.class', 'tabsBorder');
      });
  }

  verifyTruckCardsWithCheckOffers() {
    this.getVisibleCardLinks().its('length').should('be.gte', 1);
    this.getVisibleCheckOfferButtons().its('length').should('be.gte', 1);
    this.getVisibleCheckOfferButtons().each(($btn) => {
      expect($btn.attr('title')).to.eq(this.copy.checkOffersCta);
    });
  }

  verifyViewAllLink(tabKey) {
    const expected = this.copy.viewAll[tabKey];
    this.getViewAllLink()
      .should('be.visible')
      .and('have.attr', 'href', expected.href)
      .and('have.attr', 'title', expected.label)
      .find('span')
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq(expected.label));
    this.getViewAllLink().find('svg').should('exist');
  }

  verifyNoDuplicateVisibleCards() {
    this.getVisibleCardLinks().then(($links) => {
      const hrefs = [...$links].map((el) => el.getAttribute('href')).filter(Boolean);
      const titles = [...$links].map((el) => (el.getAttribute('title') || el.textContent).trim());
      expect(hrefs, 'visible card hrefs should be unique').to.have.length(new Set(hrefs).size);
      expect(titles, 'visible card titles should be unique').to.have.length(new Set(titles).size);
    });
  }

  verifyCardsHaveTitlePriceAndCta() {
    this.getVisibleCardLinks().each(($link) => {
      expect($link.text().trim()).to.not.equal('');
      const $parent = $link.parent();
      expect($parent.find('p').first().text().trim()).to.not.equal('');
      expect($parent.find(`button[title="${this.copy.checkOffersCta}"]`)).to.have.length(1);
    });
  }

  /**
   * Open Check Offers lead form from the first visible card in the active tab.
   * Re-clicks until the form hydrates (same pattern as openTab).
   */
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

  verifyCheckOffersLeadNotSubmitted() {
    cy.contains('h3', exactText(this.leadFormCopy.thankYouHeading)).should('not.exist');
    this.leadForm.getNameInput().should('be.visible');
  }

  /**
   * Positive lead flow for a tab — usable from TruckInIndia specs or a future LeadFormSuite.
   */
  submitCheckOffersLeadFromTab(tabKey, overrides = {}) {
    this.openTab(tabKey);
    this.openCheckOffersLeadForm();
    this.leadForm.fillAndSubmit({
      name: this.leadFormCopy.name,
      city: this.leadFormCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }

  /**
   * Negative lead flow — fill/submit then assert validation spans stay on the form.
   */
  submitCheckOffersLeadExpectingValidation(tabKey, fields, expectedMessages) {
    this.openTab(tabKey);
    this.openCheckOffersLeadForm();
    this.leadForm.fillFields(fields);
    this.leadForm.submit();
    this.leadForm.verifyValidationMessages(expectedMessages);
    this.verifyCheckOffersLeadNotSubmitted();
  }
}

module.exports = TruckInIndia;
