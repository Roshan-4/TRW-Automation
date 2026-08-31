const usedTruckPdpData = require('../../testData/UsedTruck/UsedTruckPdpData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');

/**
 * Individual used-truck detail page.
 *
 * Inventory URLs change as listings sell, so UI tests open Buy Used Trucks
 * and click the first unique listing card (`/en/used-truck/{brand}/{slug}-{id}`).
 * Live audit: Contact Seller opens Get Seller Details (name placeholder
 * "Enter Your Name", optional price, confirmation "Thank You For Contact");
 * Check Offers is also present on the page.
 *
 * Not a multi-step wizard. Real production lead — name is always `testqa`.
 */
class UsedTruckPdp {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = usedTruckPdpData.UsedTruckPdp[lang] || usedTruckPdpData.UsedTruckPdp.en;
    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;

    this.getSellerDetailsLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.page.getSellerDetailsSubmit,
    });
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(usedTruckPdpData.UsedTruckPdp);
  }

  get pageLabel() {
    return this.page.name;
  }

  navigate() {
    cy.visit(this.page.listingPath, { timeout: 90000 });
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
    this.openFirstListingCard();
  }

  navigateSeoSample() {
    cy.visit(this.page.seoSamplePath, { timeout: 90000 });
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

  openFirstListingCard() {
    cy.get('a[href*="/used-truck/"]', { timeout: 20000 }).should('exist');
    cy.document().then((doc) => {
      const link = [...doc.querySelectorAll('a[href*="/used-truck/"]')].find((el) => {
        const href = el.getAttribute('href') || '';
        return /\/used-truck\/[^/]+\/.+-\d+$/.test(href) && el.offsetParent !== null;
      });
      expect(link, 'A used-truck listing card is shown').to.exist;
      const href = link.getAttribute('href');
      cy.visit(href, { timeout: 90000 });
    });
    cy.location('pathname', { timeout: 20000 }).should('match', /\/used-truck\/[^/]+\/.+-\d+$/);
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
    cy.get('h1', { timeout: 20000 }).should('be.visible');
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

  openContactSellerLead() {
    this.openLeadViaCta(this.page.contactSellerCta);
  }

  openCheckOffersLead() {
    this.openLeadViaCta(this.page.checkOffersCta);
  }

  verifyGetSellerDetailsSubmitted() {
    cy.contains(/thank you for contact/i, { log: false }).should('be.visible');
  }

  verifyCheckOffersSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  submitContactSellerLead(overrides = {}) {
    this.openContactSellerLead();
    this.getSellerDetailsLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyGetSellerDetailsSubmitted();
  }

  submitCheckOffersLead(overrides = {}) {
    this.openCheckOffersLead();
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersSubmitted();
  }

  verifyPageHeading() {
    cy.get('h1', { timeout: 20000 })
      .should('be.visible')
      .and(($h1) => {
        expect(
          $h1.text().trim().startsWith(this.page.headingStartsWith),
          'Used truck detail heading starts with “Used ”'
        ).to.eq(true);
      });
  }
}

module.exports = UsedTruckPdp;
