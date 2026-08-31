const internalPagesData = require('../../testData/PDP/NewTruckInternalPagesData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');

/**
 * New Truck / Electric PDP internal URLs (specifications, mileage, images,
 * brochure, videos, reviews, price-in-city).
 *
 * Live-audited: the shared CheckOffersLead modal (`input#name` / `input#phone`,
 * city autocomplete, "Thank You!!!") opens from Check Offers, Get On Road
 * Price, and Download Brochure. Live recapture after a price-page failure
 * showed Download Brochure still submits as "Check Offers" (the page CTA
 * is not the modal submit). Call Now on these pages was not confirmed as a
 * distinct GetOffersLead assistance form, so it is not automated here.
 *
 * Real production lead — submitted name is always `testqa`.
 */
class NewTruckInternalPages {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = internalPagesData.NewTruckInternalPages[lang]?.pages || [];
    this.page = pages.find((item) => item.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown New Truck internal page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.leadForm = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.page.submitText || this.checkOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(internalPagesData.NewTruckInternalPages);
  }

  static get pageKeys() {
    return internalPagesData.NewTruckInternalPages.en.pages.map((page) => page.key);
  }

  get pageLabel() {
    return this.page.name;
  }

  get hasSecondaryLead() {
    return Boolean(this.page.secondaryLeadCta);
  }

  get hasFaq() {
    return Boolean(this.page.hasFaq && this.page.faqHeading);
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

  openLeadViaCta(ctaLabel) {
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

  openPrimaryLead() {
    this.openLeadViaCta(this.page.leadTriggerCta);
  }

  openSecondaryLead() {
    this.openLeadViaCta(this.page.secondaryLeadCta);
  }

  verifyLeadSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  submitPrimaryLead(overrides = {}) {
    this.openPrimaryLead();
    this.leadForm.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyLeadSubmitted();
  }

  submitSecondaryLead(overrides = {}) {
    const secondaryForm = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.page.secondarySubmitText || this.checkOffersLeadCopy.submitCta,
    });
    this.openSecondaryLead();
    secondaryForm.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyLeadSubmitted();
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

module.exports = NewTruckInternalPages;
