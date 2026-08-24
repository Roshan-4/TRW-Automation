const buyUsedTrucksData = require('../../testData/UsedTruck/BuyUsedTrucksData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');

/**
 * Buy Used Trucks (/en/buy-used-trucks).
 *
 * Scope for now, per request: only the lead form on this page — not the
 * listing/filters, which is out of scope until asked for. No launch popup.
 *
 * Live click-and-inspect audit initially mistook "Contact Seller" here for
 * the standard CheckOffersLead modal — both share `input#name[name="name"]`/
 * `input#phone[name="phone"]` ids, which is a false-positive trap (same
 * lesson as GetOffersLead: id/name attributes alone don't prove it's the
 * same component). A failure screenshot revealed the real, listing-specific
 * form: heading is the truck's own title, an extra optional "Enter Price"
 * field appears (handled automatically by `LeadFormFiller.
 * fillPriceOrBudgetIfPresent`), and the submit button reads "Get Seller
 * Details" — not "Check Offers". Confirm the submit button text for any new
 * "Contact Seller"/"Check Offers"-labeled CTA rather than assuming it matches
 * a previously-seen component just because the input ids match. Its
 * confirmation also differs — "Thank You For Contact" (with seller name/
 * contact number/request ID), not CheckOffersLead's "Thank You!!!".
 *
 * Real production lead (no sandbox) — submitted name is `testqa`, matching
 * this repo's convention for all lead forms.
 */
class BuyUsedTrucks {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = buyUsedTrucksData.BuyUsedTrucks[lang] || buyUsedTrucksData.BuyUsedTrucks.en;
    this.pageUrl = this.page.path;
    this.identifierKey = this.page.identifierKey;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.getSellerDetailsLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: 'Get Seller Details',
    });
  }

  static get supportedLanguages() {
    return Object.keys(buyUsedTrucksData.BuyUsedTrucks);
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

  // Raw DOM click, not `cy.contains(...).filter(':visible').click()` —
  // confirmed live elsewhere in this project
  // (pages/ListingPages/NewListingPages.js, pages/Compare/CompareTrucks.js)
  // that the Cypress-command version of this click is unreliable and can
  // silently skip the click.
  openGetSellerDetailsLead() {
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

  /** Confirmation heading differs from CheckOffersLead's "Thank You!!!" — this flow shows "Thank You For Contact". */
  verifyGetSellerDetailsLeadSubmitted() {
    cy.contains(/thank you for contact/i, { log: false }).should('be.visible');
  }

  submitGetSellerDetailsLead(overrides = {}) {
    this.openGetSellerDetailsLead();
    this.getSellerDetailsLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyGetSellerDetailsLeadSubmitted();
  }
}

module.exports = BuyUsedTrucks;
