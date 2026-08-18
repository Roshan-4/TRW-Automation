const electricData = require('../../testData/HomePage/ElectricCommercialVehiclesData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "Electric Commercial Vehicles" section.
 * Locators from live DOM: h2 heading, product name anchors (no image),
 * Check Offers buttons, a.viewLinkWrapper → /{lang}/electric.
 */
class ElectricCommercialVehicles {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = electricData.ElectricCommercialVehicles[lang];
    this.leadFormCopy = truckInIndiaData.CheckOffersForm[lang];
    this.leadForm = new LeadFormFiller({
      cityPlaceholder: this.leadFormCopy.cityPlaceholder,
      submitText: this.leadFormCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(electricData.ElectricCommercialVehicles);
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

  /** Section root: heading → closest mb-5 wrapper (slider + View All). */
  getSection() {
    return this.getHeading().closest('div.mb-5', { log: false });
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  /**
   * Visible product name links only (text heading anchors, not image wrappers).
   * Slick clones excluded.
   */
  getVisibleProductNameLinks() {
    return this.getSection()
      .find('a[title][href*="-truck/"]', { log: false })
      .filter(':visible')
      .filter((_, el) => !el.querySelector('img') && !el.closest('.slick-cloned'));
  }

  getVisibleCheckOfferButtons() {
    return this.getSection()
      .find(`button[title="${this.copy.checkOffersCta}"]`, { log: false })
      .filter(':visible')
      .filter((_, el) => !el.closest('.slick-cloned'));
  }

  getViewAllLink() {
    return this.getSection().find('a.viewLinkWrapper', { log: false });
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    this.getVisibleProductNameLinks().its('length').should('be.gte', 1);
  }

  /**
   * Click the first visible product name and assert PDP navigation.
   */
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

  verifyViewAllLink() {
    const expected = this.copy.viewAll;
    this.getViewAllLink()
      .should('be.visible')
      .and('have.attr', 'href', expected.href)
      .and('have.attr', 'title', expected.label)
      .find('span')
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq(expected.label));
  }

  clickViewAllAndVerifyNavigation() {
    this.scrollToSection();
    this.verifyViewAllLink();
    this.getViewAllLink().click();
    cy.location('pathname').should('eq', this.copy.viewAll.href);
  }

  /**
   * Open Check Offers once from the first visible card; re-click until form hydrates.
   */
  openCheckOffersLeadForm() {
    this.scrollToSection();
    this.getHeading().then(($heading) => {
      const clickCta = () => {
        const button = Cypress.$($heading)
          .closest('div.mb-5')
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

  /** One lead fill + submit from this section (approved scope). */
  submitOneCheckOffersLead(overrides = {}) {
    this.openCheckOffersLeadForm();
    this.leadForm.fillAndSubmit({
      name: this.leadFormCopy.name,
      city: this.leadFormCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }
}

module.exports = ElectricCommercialVehicles;
