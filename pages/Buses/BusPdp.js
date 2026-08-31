const busPdpData = require('../../testData/Buses/BusPdpData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');

/**
 * Bus product detail pages (not the bus listing pages in BusListing.js).
 *
 * Live headed run: the first "Check Offers" on these PDPs opens the same
 * per-model bus enquiry popup as BusListing (not the shared CheckOffersLead
 * modal). Name/mobile only register after a genuine click, confirmation is
 * "Thank You for your interest.", and a non-10-digit mobile reverts to empty.
 *
 * Real production lead — submitted name is always `testqa`.
 */
class BusPdp {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = busPdpData.BusPdp[lang]?.pages || [];
    this.page = pages.find((item) => item.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown Bus PDP page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;

    this.checkOffersLeadCopy = {
      ...(truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en),
      thankYouHeading: 'Thank You for your interest.',
    };
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
      focusFieldsBeforeType: true,
      assertMobileValueAfterType: false,
    });
  }

  static get supportedLanguages() {
    return Object.keys(busPdpData.BusPdp);
  }

  static get pageKeys() {
    return busPdpData.BusPdp.en.pages.map((page) => page.key);
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

  openCheckOffersLead() {
    const ctaLabel = this.page.leadTriggerCta;
    cy.document().then((doc) => {
      const clickCta = makeThrottledCtaClicker(doc, ctaLabel);
      clickCta();
      cy.get('input#name[name="name"]').should(($input) => {
        if (!$input.is(':visible')) {
          clickCta();
        }
        expect($input.is(':visible'), `${ctaLabel} lead form is visible`).to.eq(true);
      });
    });
  }

  verifyCheckOffersLeadSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  submitCheckOffersLead(overrides = {}) {
    this.openCheckOffersLead();
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }

  verifyPageHeading() {
    cy.contains('h1', exactText(this.page.heading), { timeout: 20000 }).should('be.visible');
  }

  verifyFaqAndExpand() {
    cy.contains('h2', exactText(this.page.faqHeading), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible');
    cy.get('.accordion', { timeout: 20000 })
      .filter(':visible')
      .eq(0)
      .should('be.visible')
      .then(($acc) => {
        const heading = $acc.find('h3').get(0);
        expect(heading, `FAQ question is present on ${this.pageLabel}`).to.exist;
        heading.click();
      });
  }
}

module.exports = BusPdp;
